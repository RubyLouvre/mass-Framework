define("deferred", ["mass","lang"], function( $ ){
    var Deferred = $.Deferred = function (fn) {
        return this instanceof Deferred ? this.init(fn) : new Deferred(fn)
    }
    function get(obj){//确保this为Deferred实例
        return  obj instanceof Deferred ? obj : new Deferred
    }
    function ok(r) {//正向传递器
        return r
    }
    function ng(e) {//负向传递器
        throw  e
    }
    function append( deferred, type, fn){
        deferred =  get(deferred);
        var obj = {
            ok: ok,
            ng: ng,
            arr: []
        }
        if(typeof fn === "function")
            obj[type] = fn;
        deferred._firing.push(obj);
        return deferred;
    }

    function fire( deferred, okng, args, result){
        var type = "ok",
        obj = deferred._firing.shift();
        if(obj){
            deferred._fired.push(obj);//把执行过的回调函数包,从一个列队倒入另一个列队
            if(typeof obj === "number"){//如果是延时操作
                var timeoutID = setTimeout(function(){
                    fire(deferred, okng, deferred.before(args, result) )
                },obj)
                deferred.onabort = function(){
                    clearTimeout(timeoutID );
                }
            }else if(obj.arr.length){//如果是并行操作
                var i = 0, d;
                while(d = obj.arr[i++]){
                    d.resolve(args)
                }
            }else{//如果是串行操作
                try{
                    result = obj[okng].apply(deferred, args);
                }catch(e){
                    type = "ng";
                    result = e;
                }
                fire(deferred, type, deferred.before(args, result))
            }
        }else{//队列执行完毕,还原
            (deferred.after || ok )(result);
            deferred._firing = deferred._fired;
            deferred._fired = [];
        }
        return this;
    }
    Deferred.prototype = {
        init:function(fn){//初始化,建立两个列队
            this._firing = [];
            this._fired = [];
            if(typeof fn === "function")
                return this.done(fn)
            return this;
        },
        done: function(fn){//添加正向回调
            return append(this, "ok", fn)
        },
        fail: function(fn){//添加负向回调
            return append(this, "ng", fn)
        },
        wait: function(timeout){
            var self = get(this);
            self._firing.push(~~timeout)
            return self
        },
        resolve: function(){//执行正向列队
            return fire(this, "ok", this.before(arguments));
        },
        reject: function(){//执行负向列队
            return fire(this, "ng", this.before(arguments));
        },
        abort:function(){//中止列队
            (this.onabort || ok)();
            return this;
        },
        //每次执行用户回调函数前都执行此函数,返回一个数组
        before:function(args,result){
            return result == void 0 ? args : [result]
        },
        //并行操作,并把所有的子线程的结果作为主线程的下一个操作的参数
        paiallel : function (fns) {
            var self = get(this),
            obj = {
                ok: ok,
                ng: ng,
                arr:[]
            },
            count = 0,
            values = {}
            for(var key in fns){//参数可以是一个对象或数组
                if(fns.hasOwnProperty(key)){
                    (function(key,fn){
                        if (typeof fn == "function")
                            fn = Deferred(fn);
                        fn.done(function(value){
                            values[key] = value;
                            if(--count <= 0){
                                if(Array.isArray( fns )){//如果是数组强制转换为数组
                                    values.length = fns.length;
                                    values = fns.slice.call(values)
                                }
                                fire(self, "ok", values)
                            }
                        }).fail(function(e){
                            fire(self, "ng",[e])
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
        //处理相近的迭代操作
        loop : function (obj, fn, result) {
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
                    get(result).done(_loop).resolve(i+step,obj);
                }else{
                    return result;
                }
            }
            return (obj.begin <= obj.end) ? get(this).done(_loop).resolve(obj.begin,obj) : null;
        }
    }
    //将原型方法转换为类方法
    "loop wait done fail paiallel".replace(/\w+/g, function(method){
        Deferred[method] = Deferred.prototype[method]
    });
})
//http://jplusui.github.com/whyjplusui.html
//看看这个
//都做完了。