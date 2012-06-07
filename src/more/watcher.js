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
    }else if( Object.defineProperty || watcher.__defineGetter__){
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
            var length = watcher.push( [ obj, prop,callback, obj[prop] ] );
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