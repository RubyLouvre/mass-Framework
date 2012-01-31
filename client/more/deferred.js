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
