//=========================================
// 异步列队模块
//==========================================
$.define("deferred", function(){
    $.log("已加载deferred模块")
    var Deferred = $.Deferred = function (fn) {
        return this instanceof Deferred ? this.init(fn) : new Deferred(fn);
    }
    $.mix(Deferred, {
        get:function(obj){//确保this为Deferred实例
            return  obj instanceof Deferred ? obj : new Deferred;
        },
        ok : function (r) {
            return r;
        },
        ng : function (e) {
            throw  e;
        }
    });
    Deferred.prototype = {
        init:function(fn){
            this._firing = [];
            this._fired = [];
            if(typeof fn === "function")
                return this.then(fn)
            return this;
        },
        _add:function(okng,fn){
            var obj = {
                ok:Deferred.ok,
                ng:Deferred.ng,
                arr:[]
            }
            if(typeof fn === "function")
                obj[okng] = fn;
            this._firing.push(obj);
            return this;
        },
        _fire:function(okng,args,result){
            var type = "ok",
            obj = this._firing.shift();
            if(obj){
                this._fired.push(obj);
                var self = this;
                if(typeof obj === "number"){//如果是延时操作
                    var timeoutID = setTimeout(function(){
                        self._fire(okng,self.before(args,result))
                    },obj)
                    this.onabort = function(){
                        clearTimeout(timeoutID );
                    }
                }else if(obj.arr.length){//如果是并行操作
                    var i = 0, async;
                    while(async = obj.arr[i++]){
                        async.fire(args)
                    }
                }else{//如果是串行操作
                    try{
                        result = obj[okng].apply(this,args);
                    }catch(e){
                        type = "ng";
                        result = e;
                    }
                    this._fire(type,this.before(args,result))
                }
            }else{//队列执行完毕,还原
                (this.after || $.noop)(result);
                this._firing = this._fired;
                this._fired = [];
            }
            return this;
        },
        then:function(fn){
            return  Deferred.get(this)._add("ok",fn)
        },
        once:function(fn){
            return  Deferred.get(this)._add("ng",fn)
        },
        fire:function(){
            return this._fire("ok",this.before(arguments));
        },
        error:function(){
            return this._fire("ng",this.before(arguments));
        },
        wait:function(timeout){
            var self = Deferred.get(this);
            self._firing.push(timeout)
            return self
        },
        abort:function(){
            (this.onabort || $.noop)();
            return this;
        },
        //每次执行用户回调函数前都执行此函数,返回一个数组
        before:function(args,result){
            return result ? result instanceof Array ? result : [result] : $.slice(args)
        },
        //并行操作,并把所有的子线程的结果作为主线程的下一个操作的参数
        paiallel : function (fns) {
            var self = Deferred.get(this),
            obj = {
                ok:Deferred.ok,
                ng:Deferred.ng,
                arr:[]
            },
            count = 0,
            values = {}
            for(var key in fns){
                if(fns.hasOwnProperty(key)){
                    (function(key,fn){
                        if (typeof fn == "function"){
                            fn = Deferred(fn);
                        }
                        fn.then(function(value){
                            values[key] = value;
                            if(--count <= 0){
                                if(fns instanceof Array){
                                    values.length = fns.length;
                                    values = $.slice(values);
                                }
                                self._fire("ok",[values])
                            }
                        }).once(function(e){
                            self._fire("ng",[e])
                        });
                        obj.arr.push(fn);
                        count++
                    })(key,fns[key])
                }
            }
            self.onabort = function(){
                var i = 0, d;
                while(d = obj.arr[i++]){
                    d.abort();
                }
            }
            self._firing.push(obj);
            return self
        },
        loop : function (obj, fn, complete,result) {
            obj = {
                begin : obj.begin || 0,
                end   : (typeof obj.end == "number") ? obj.end : obj - 1,
                step  : obj.step  || 1,
                last  : false,
                prev  : null
            }
            var step = obj.step,
            _loop = function(i,obj){
                if (i <= obj.end) {
                    if ((i + step) > obj.end) {
                        obj.last = true;
                        obj.step = obj.end - i + 1;
                    }
                    obj.prev = result;
                    result = fn.call(obj,i);
                    Deferred.get(result).then(_loop).fire(i+step,obj);
                }else{
                    if(typeof complete === "function"){
                        return complete.call(null,result)
                    }
                    return result;
                }
            }
            return (obj.begin <= obj.end) ? Deferred.get(this).then(_loop).fire(obj.begin,obj) : null;
        }
    }
    "loop wait then once paiallel".replace(/\w+/g, function(method){
        Deferred[method] = Deferred.prototype[method];
    });
});
    function qFactory(nextTick, exceptionHandler) {

        /**
   * @ngdoc
   * @name ng.$q#defer
   * @methodOf ng.$q
   * @description
   * Creates a `Deferred` object which represents a task which will finish in the future.
   *
   * @returns {Deferred} Returns a new instance of deferred.
   */
        var defer = function() {
            var pending = [],
            value, deferred;

            deferred = {

                resolve: function(val) {
                    if (pending) {
                        var callbacks = pending;
                        pending = undefined;
                        value = ref(val);

                        if (callbacks.length) {
                            nextTick(function() {
                                var callback;
                                for (var i = 0, ii = callbacks.length; i < ii; i++) {
                                    callback = callbacks[i];
                                    value.then(callback[0], callback[1]);
                                }
                            });
                        }
                    }
                },


                reject: function(reason) {
                    deferred.resolve(reject(reason));
                },


                promise: {
                    then: function(callback, errback) {
                        var result = defer();

                        var wrappedCallback = function(value) {
                            try {
                                result.resolve((callback || defaultCallback)(value));
                            } catch(e) {
                                exceptionHandler(e);
                                result.reject(e);
                            }
                        };

                        var wrappedErrback = function(reason) {
                            try {
                                result.resolve((errback || defaultErrback)(reason));
                            } catch(e) {
                                exceptionHandler(e);
                                result.reject(e);
                            }
                        };

                        if (pending) {
                            pending.push([wrappedCallback, wrappedErrback]);
                        } else {
                            value.then(wrappedCallback, wrappedErrback);
                        }

                        return result.promise;
                    }
                }
            };

            return deferred;
        };


        var ref = function(value) {
            if (value && value.then) return value;
            return {
                then: function(callback) {
                    var result = defer();
                    nextTick(function() {
                        result.resolve(callback(value));
                    });
                    return result.promise;
                }
            };
        };


        /**
   * @ngdoc
   * @name ng.$q#reject
   * @methodOf ng.$q
   * @description
   * Creates a promise that is resolved as rejected with the specified `reason`. This api should be
   * used to forward rejection in a chain of promises. If you are dealing with the last promise in
   * a promise chain, you don't need to worry about it.
   *
   * When comparing deferreds/promises to the familiar behavior of try/catch/throw, think of
   * `reject` as the `throw` keyword in JavaScript. This also means that if you "catch" an error via
   * a promise error callback and you want to forward the error to the promise derived from the
   * current promise, you have to "rethrow" the error by returning a rejection constructed via
   * `reject`.
   *
   * <pre>
   *   promiseB = promiseA.then(function(result) {
   *     // success: do something and resolve promiseB
   *     //          with the old or a new result
   *     return result;
   *   }, function(reason) {
   *     // error: handle the error if possible and
   *     //        resolve promiseB with newPromiseOrValue,
   *     //        otherwise forward the rejection to promiseB
   *     if (canHandle(reason)) {
   *      // handle the error and recover
   *      return newPromiseOrValue;
   *     }
   *     return $q.reject(reason);
   *   });
   * </pre>
   *
   * @param {*} reason Constant, message, exception or an object representing the rejection reason.
   * @returns {Promise} Returns a promise that was already resolved as rejected with the `reason`.
   */
        var reject = function(reason) {
            return {
                then: function(callback, errback) {
                    var result = defer();
                    nextTick(function() {
                        result.resolve((errback || defaultErrback)(reason));
                    });
                    return result.promise;
                }
            };
        };


        /**
   * @ngdoc
   * @name ng.$q#when
   * @methodOf ng.$q
   * @description
   * Wraps an object that might be a value or a (3rd party) then-able promise into a $q promise.
   * This is useful when you are dealing with on object that might or might not be a promise, or if
   * the promise comes from a source that can't be trusted.
   *
   * @param {*} value Value or a promise
   * @returns {Promise} Returns a single promise that will be resolved with an array of values,
   *   each value coresponding to the promise at the same index in the `promises` array. If any of
   *   the promises is resolved with a rejection, this resulting promise will be resolved with the
   *   same rejection.
   */
        var when = function(value, callback, errback) {
            var result = defer(),
            done;

            var wrappedCallback = function(value) {
                try {
                    return (callback || defaultCallback)(value);
                } catch (e) {
                    exceptionHandler(e);
                    return reject(e);
                }
            };

            var wrappedErrback = function(reason) {
                try {
                    return (errback || defaultErrback)(reason);
                } catch (e) {
                    exceptionHandler(e);
                    return reject(e);
                }
            };

            nextTick(function() {
                ref(value).then(function(value) {
                    if (done) return;
                    done = true;
                    result.resolve(ref(value).then(wrappedCallback, wrappedErrback));
                }, function(reason) {
                    if (done) return;
                    done = true;
                    result.resolve(wrappedErrback(reason));
                });
            });

            return result.promise;
        };


        function defaultCallback(value) {
            return value;
        }


        function defaultErrback(reason) {
            return reject(reason);
        }


        /**
   * @ngdoc
   * @name ng.$q#all
   * @methodOf ng.$q
   * @description
   * Combines multiple promises into a single promise that is resolved when all of the input
   * promises are resolved.
   *
   * @param {Array.<Promise>} promises An array of promises.
   * @returns {Promise} Returns a single promise that will be resolved with an array of values,
   *   each value coresponding to the promise at the same index in the `promises` array. If any of
   *   the promises is resolved with a rejection, this resulting promise will be resolved with the
   *   same rejection.
   */
        function all(promises) {
            var deferred = defer(),
            counter = promises.length,
            results = [];

            if (counter) {
                forEach(promises, function(promise, index) {
                    ref(promise).then(function(value) {
                        if (index in results) return;
                        results[index] = value;
                        if (!(--counter)) deferred.resolve(results);
                    }, function(reason) {
                        if (index in results) return;
                        deferred.reject(reason);
                    });
                });
            } else {
                deferred.resolve(results);
            }

            return deferred.promise;
        }

        return {
            defer: defer,
            reject: reject,
            when: when,
            all: all
        };
    }