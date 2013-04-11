define("deferred",["mass","lang"], function($){
      //////////////////////////////////////////////////////////////////////
    //=======================异步列队模块===================================
    var Deferred = $.Deferred = function (fn) {
        return this instanceof Deferred ? this.init(fn) : new Deferred(fn)
    }
   
    $.mix(Deferred, {
        get:function(obj){//确保this为Deferred实例
            return  obj instanceof Deferred ? obj : new Deferred
        },
        ok : function (r) {//传递器
            return r
        },
        ng : function (e) {//传递器
            throw  e
        }
    });
    Deferred.prototype = {
        init:function(fn){//初始化,建立两个列队
            this._firing = [];//正等待触发的
            this._fired = []; //已经触发的
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
        then: function(fn){//_add的包装方法1,用于添加成功回调
            return  Deferred.get(this)._add("ok",fn)
        },
        once: function(fn){//_add的包装方法2,用于添加错误回调
            return  Deferred.get(this)._add("ng",fn)
        },
        wait:function(timeout){//暂停多少ms
            var self = Deferred.get(this);
            self._firing.push(~~timeout);
            return self;
        },
        _fire:function(okng, value ){
            var type = "ok",
            obj = this._firing.shift();
            if(obj){
              //  this._fired.push(obj);//把执行过的回调函数包,从一个列队倒入另一个列队
                var self = this;
                if(typeof obj === "number"){//如果是延时操作
                    var timeoutID = setTimeout(function(){
                        self._fire(okng, value);
                    }, obj);
                    this.onabort = function(){
                        clearTimeout(timeoutID );
                    };
                }else if(obj.arr.length){//如果是并行操作
                    var i = 0, d;
                    while(d = obj.arr[i++]){
                        d.fire( value );
                    }
                }else{//如果是串行操作
                    try{//
                        value = obj[okng].apply(this, value);
                    }catch(e){
                        type = "ng";
                        value = [e];
                    }
                    this._fire(type, value);
                }
            }else{//队列执行完毕,还原
               // (this.after || Deferred.ok)(result);
                this._firing = this._fired;
                this._fired = [];
            }
            return this;
        },
        fire:function(){//执行正向列队
            return this._fire("ok",arguments);
        },
        error:function(){//执行负向列队
            return this._fire("ng",arguments);
        },
 
        abort:function(){//中止列队
            (this.onabort || Deferred.ok)();
            return this;
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
            values = {};
            for(var key in fns){//参数可以是一个对象或数组
                if(fns.hasOwnProperty(key)){
                    (function(key,fn){
                        if (typeof fn === "function")
                            fn = Deferred(fn);
                        fn.then(function(value){
                            values[key] = value;
                            if(--count <= 0){
                                if(fns instanceof Array){//如果是数组强制转换为数组
                                    values.length = fns.length;
                                    values = $.slice(values);
                                }else{
                                    values = [values];
                                }
                                self._fire("ok",values);
                            }
                        }).once(function(e){
                            self._fire("ng",[e]);
                        });
                        obj.arr.push(fn);
                        count++;
                    })(key,fns[key]);
                }
            }
            self.onabort = function(){
                var i = 0, d;
                while(d = obj.arr[i++]){
                    d.abort();
                }
            };
            self._firing.push(obj);
            return self;
        },
        //处理相近的迭代操作
        loop : function (obj, fn, result) {
            obj = {
                begin : obj.begin || 0,
                end   : (typeof obj.end === "number") ? obj.end : obj - 1,
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
                    return result;
                }
            }
            return (obj.begin <= obj.end) ? Deferred.get(this).then(_loop).fire(obj.begin,obj) : null;
        }
    }
    //将原型方法转换为类方法
    "loop wait then once paiallel".replace(/\w+/g, function(method){
        Deferred[method] = Deferred.prototype[method]
    });
    return $
    
})
  