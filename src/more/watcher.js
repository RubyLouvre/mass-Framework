$.define("watcher","lang", function(){
    //监听器模块 用于监听普通对象,或元素节点的属性变化
    $.log("已加载watcher模块")
    var watcher = []
    function check(obj){
        if(!(obj && typeof obj == "object")){
            throw "first arguments must be a object!"
        }
    }

    if( Object.prototype.watch){
        watcher.watch = function(obj, prop, handler){
            check( obj );
            obj.watch(prop, function(id, old, neo){
                handler.call(obj,id, old, neo);
                if(old == void 0){
                    obj.unwatch( prop );
                }
                return neo ;//注:一定要返回新设置值(语法要求)
            })
        };
        watcher.unwatch = function(obj, prop){
            check( obj );
            if(typeof prop == "string"){
                obj.unwatch(prop)
            }else{
                for(prop in obj){
                    obj.unwatch( prop );
                }
            }
        };
    }else if( Object.seal ||  watcher.__defineGetter__ ){
        //IE8也有Object.defineProperty，但不能用于普通JS对象。为了防止某些es5-shim库，它们对Object.defineProperty的修复是不完全
        //一定是原生支持才行
        watcher.watch = function(obj, prop, handler){
            check( obj );
            var oldval = obj[prop];
            var getter = function() {
                return oldval;
            };
            var setter = function(newval) {
                if(oldval !== newval){
                    handler.call(this, prop, oldval, newval);
                }
                oldval = newval;
                if(oldval == void 0){
                    watcher.unwatch( obj, prop );
                }
            };
            if (delete obj[prop]) { // can't watch constants
                if (Object.defineProperty) {// ECMAScript 5
                    Object.defineProperty(obj, prop, {
                        get: getter,
                        set: setter,
                        enumerable: true,
                        configurable: true
                    });
                }else if (obj.__defineGetter__ && obj.__defineSetter__) { 
                    obj.__defineGetter__( prop, getter);
                    obj.__defineSetter__( prop, setter);
                }
            }
        };
        watcher.unwatch = function (obj, prop) {
            check( obj );
            var val = obj[prop];
            delete obj[prop]; // remove accessors
            obj[prop] = val;
        };
    }else{
        function loop(){
            for(var i = watcher.length-1; i >= 0; i--){
                var record = watcher[i];
                var obj = record[0];
                if(typeof obj != "object" || obj == null ){
                    watcher.splice(i,1);//如果目标对象被销毁，则移除
                }
                var prop = record[1], val = obj[prop];//新属性
                if(val === void 0){
                    watcher.splice(i,1);//如果为undefined,停止监听
                }
                if( record[3] !== val ){//el[3]为旧属性
                    record[2].call(obj, prop, record[3], val );//id, oldval, newval
                    record[3] = val;
                }
            }
        };
        watcher.time = 100;
        watcher.watch = function(obj, prop ,callback){
            check( obj );
            watcher.unwatch(obj, prop);
            var length = watcher.push( [ obj, prop, callback, obj[prop] ] );
            if( length == 1 ){//启动定时器
                watcher.intervalID = setInterval( loop, watcher.time);
            }else if( length > 100 ){//改变定时器的跳动频率
                clearInterval( watcher.intervalID );
                watcher.intervalID = setInterval( loop, length );
            }
        }
        watcher.unwatch = function(obj, prop ){
            check( obj );
            var one = typeof prop === "string";
            for(var i = watcher.length-1; i >= 0; i--){
                var record = watcher[i];
                if(record[0] == obj){
                    if( one ){
                        if(record[1] == prop){
                            watcher.splice(i,1);
                            break;
                        }
                    }else{//移除所有
                        watcher.splice(i,1);
                    }
                }
            }
            if(!watcher.length){//中止定时器
                clearInterval(watcher.intervalID);
                watcher.intervalID = null;
            }
        }
    }
  
    return watcher;

})
//参考 http://stackoverflow.com/questions/1269633/watch-for-object-properties-changes-in-javascript
//Detect Attribute Changes with jQuery The Problem http://darcyclarke.me/development/detect-attribute-changes-with-jquery/#
/*
  (function(watch, unwatch){
                createWatcher = watch && unwatch ?
                    // Andrea Giammarchi - Mit Style License
                function(Object){
                    var handlers = [];
                    return {
                        destroy:function(){
                            handlers.forEach(function(prop){
                                unwatch.call(this, prop);
                            }, this);
                            delete handlers;
                        },
                        watch:function(prop, handler){
                            if(-1 === handlers.indexOf(prop))
                                handlers.push(prop);
                            watch.call(this, prop, function(prop, prevValue, newValue){
                                return Object[prop] = handler.call(Object, prop, prevValue, newValue);
                            });
                        },
                        unwatch:function(prop){
                            var i = handlers.indexOf(prop);
                            if(-1 !== i){
                                unwatch.call(this, prop);
                                handlers.splice(i, 1);
                            };
                        }
                    }
                }:(Object.prototype.__defineSetter__?
                    function(Object){
                    var handlers = [];
                    return {
                        destroy:function(){
                            handlers.forEach(function(prop){
                                delete this[prop];
                            }, this);
                            delete handlers;
                        },
                        watch:function(prop, handler){
                            if(-1 === handlers.indexOf(prop))
                                handlers.push(prop);
                            if(!this.__lookupGetter__(prop))
                                this.__defineGetter__(prop, function(){return Object[prop]});
                            this.__defineSetter__(prop, function(newValue){
                                Object[prop] = handler.call(Object, prop, Object[prop], newValue);
                            });
                        },
                        unwatch:function(prop){
                            var i = handlers.indexOf(prop);
                            if(-1 !== i){
                                delete this[prop];
                                handlers.splice(i, 1);
                            };
                        }
                    };
                }:
                    function(Object){
                    function onpropertychange(){
                        var prop = event.propertyName,
                        newValue = empty[prop]
                        prevValue = Object[prop],
                        handler = handlers[prop];
                        if(handler)
                            attachEvent(detachEvent()[prop] = Object[prop] = handler.call(Object, prop, prevValue, newValue));
                    };
                    function attachEvent(){empty.attachEvent("onpropertychange", onpropertychange)};
                    function detachEvent(){empty.detachEvent("onpropertychange", onpropertychange);return empty};
                    var empty = document.createElement("empty"), handlers = {};
                    empty.destroy = function(){
                        detachEvent();
                        empty.parentNode.removeChild(empty);
                        empty = handlers = null;
                    };
                    empty.watch = function(prop, handler){handlers[prop] = handler};
                    empty.unwatch = function(prop){delete handlers[prop]};
                    attachEvent();
                    return (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(empty);
                }
            )
                ;
            })(Object.prototype.watch, Object.prototype.unwatch);

            var // original object
            man = {},
            // create its watcher
            manWatcher = createWatcher(man);

            manWatcher.watch("name", function(propertyName, oldValue, newValue){
                return "Mr " + newValue;
            });

            // assign name property
            manWatcher.name = "Andrea";

            // retrieve original object property
            alert(man.name); // Mr Andrea
            var obj = {},
            watcher = createWatcher(obj);

            watcher.watch("test", function(prop, oldValue, newValue){
                return oldValue === undefined ? newValue : oldValue;
            });

            watcher.test = "one assignment";
            watcher.test = "never again";

            alert(obj.test); // one assignment
            */