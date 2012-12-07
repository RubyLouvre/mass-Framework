define("events",["$class"], function( $ ){
    //与node.js events模块同名，返回EventTarget类
    return  $.factory({
        init:  function(target) {
            this._listeners = {};
            this._eventTarget = target || this;
        },
        addEventListener: function(type, callback, scope, priority) {
            if(isFinite( scope )){
                priority = scope
                scope = null;
            }
            priority = priority || 0;
            var list = this._listeners[type],  index = 0, listener, i;
            if (list == null) {
                this._listeners[type] = list = [];
            }
            i = list.length;
            while (--i > -1) {
                listener = list[i];
                if (listener.callback === callback) {
                    list.splice(i, 1);
                } else if (index === 0 && listener.priority < priority) {
                    index = i + 1;
                }
            }
            list.splice(index, 0, {
                callback: callback, 
                scope:    scope, 
                priority: priority
            });
        },
        removeEventListener: function(type, callback) {
            var list = this._listeners[type], i;
            if (list) {
                i = list.length;
                while (--i > -1) {
                    if (list[i].callback === callback) {
                        list.splice(i, 1);
                        return;
                    }
                }
            }
        },
        dispatchEvent: function(type) {
            var list = this._listeners[type];
            if (list) {
                var target = this._eventTarget,  args = Array.apply([], arguments),i = list.length,  listener
                while (--i > -1) {
                    listener = list[i];
                    target = listener.scope || target;
                    args[ 0 ] = {
                        type:  type,
                        target: target
                    }
                    listener.callback.apply(target, args);
                }
            }
        }
    })
}) 

