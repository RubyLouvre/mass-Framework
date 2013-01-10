//=========================================
// 组件交互模块v1 by 司徒正美
//=========================================
define("interact",["$class"], function($){
    //观察者模式
    $.Observer = $.factory({
        init: function(target){
            $.log("init EventTarget")
            this._events = {};
            this._target = target || this;
        },
        bind: function(type, callback) {
            var listeners = this._events[type]
            if(listeners) {
                listeners.push(callback)
            } else {
                this._events[type] = [callback]
            }
            return this;
        },
        once: function(type, callback){
            var self = this;
            var wrapper = function () {
                callback.apply(self, arguments);
                self.unbind(type, wrapper);
            };
            this.bind(type, wrapper);
            return this;
        },
        unbind: function(type, callback) {
            var n = arguments.length;
            if(n == 0) {
                this._events = {};
            } else if(n == 1) {
                this._events[type] = [];
            } else {
                var listeners = this._events[type] || [];
                var i = listeners.length;
                while(--i > -1) {
                    if(listeners[i] === callback) {
                        return listeners.splice(i, 1);
                    }
                }
            }
            return this;
        },
        fire: function(type) {
            var listeners = (this._events[type] || []).concat(); //防止影响原数组
            if(listeners.length) {
                var target = this._target,
                args = $.slice(arguments);
                args[0] = {
                    type: type,
                    target: target
                }
                for(var i = 0, callback; callback = listeners[i++];) {
                    callback.apply(target, args);
                }
            }
        }
    });
    //用于处理需要通过N个子步骤才能完成的一些操作
    $.Flow = $.factory({
        inherit: $.Observer,
        init: function(){
            this._fired = {};
        },
        fire: function (type, args) {
            var calls = this._events, normal = 2, listeners, ev
            while (normal--) {
                ev = normal ? type : last;
                listeners = calls[ev];
                if (listeners && listeners.length) {
                    args = $.slice(arguments, 1)
                    if(normal){//在正常的情况下,我们需要传入一个事件对象,当然与原生事件对象差很远,只有两个属性
                        args.unshift({
                            type: type,
                            target: this._target
                        })
                    }
                    for(var i = 0, callback; callback = listeners[i++];) {
                        //第一次执行目标事件,第二次执行最后的回调
                        callback.apply(this, args);
                    }
                }else{
                    break;
                }
            }
            return this;
        },
        //待所有子步骤都执行过一遍后,执行最后的回调,之后每次都执行最后的回调以局部刷新数据
        refresh: function () {
            Array.prototype.push.call(arguments, false);
            _assign.apply(this, arguments);
            return this;
        },
        //待所有子步骤都执行过一遍后,执行最后的回调,然后清后所有数据,重新开始这过程
        reload: function () {
            Array.prototype.push.call(arguments, true);
            _assign.apply(this, arguments);
            return this;
        },
        //一个子步骤在重复执行N遍后,执行最后的回调
        repeat: function(type, times, callback){
            var target = this._target, that = this, ret = []
            function wrapper(){
                ret.push.apply(ret, $.slice(arguments, 1));
                if (--times == 0) {
                    that.unbind(last, wrapper);
                    callback.apply(target, ret);
                }
            }
            that.bind(type, wrapper);
            return this;
        },
        done: function (handler) {
            var that = this;
            return function (err, data) {
                if (err) {
                    return that.fire('error', err);
                }
                if (typeof handler === 'string') {
                    return that.fire(handler, data);
                }
                if (arguments.length <= 2) {
                    return handler(data);
                }
                var args = $.slice(arguments, 1);
                handler.apply(null, args);
            }
        },
        fail: function (callback) {
            var that = this;
            that.once('error', function (err) {
                that.unbind();
                callback(err);
            });
            return this;
        }
    })

    $.Flow.create = function (names, callback, errorback) {
        var that = new $.Flow;
        var args = names.match($.rword) || [];
        if(typeof errorback === "function"){
            that.fail(errorback);
        }
        args.push(callback)
        that.refresh.apply(that, args);
        return that;
    };
    var last = "$" + Date.now();
    var _assign = function (name, callback, reload) {
        var flow = this,
        times = 0,
        uniq = {},
        events =  name.match($.rword) ,
        length = events.length
        if(!events.length){
            return this;
        }
        function bind(key) {
            flow.bind(key, function () {
                flow._fired[key] = $.slice(arguments, 1);
                if (!uniq[key]) {
                    uniq[key] = true;
                    times++;
                }
            });
        }
        //绑定所有子事件
        for (var index = 0; index < length; index++) {
            bind(events[index]);
        }

        function lastFn(event) {
            //如果没有达到目标次数, 或事件类型之前没有指定过
            if (times < length ) {
                return;
            }
            var result = [];
            for (index = 0; index < length; index++) {
                result.push.apply(result, flow._fired[events[index]]);
            }
            if (reload) {
                uniq = {};
                times = 0;
            }
            callback.apply(null, result);
        }
        flow.bind(last, lastFn);
    };
})
//2012.1.10
;