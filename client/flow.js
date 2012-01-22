$.define("flow", function(){
    //像mashup，这里抓一些数据，那里抓一些数据，看似不相关，但这些数据抓完后最后构成一个新页面。
    function OperateFlow(names,callback,reload){
        this.core = {};
        if(typeof callback == "function")
            this.bind(names,callback,reload)
    }
    OperateFlow.prototype = {
        constructor:OperateFlow,
        bind:function(names,callback,reload){
            var  core = this.core, deps = {},args = [];
            names.replace($.rword,function(name){
                name = "####"+name
                if(!core[name]){
                    core[name] ={
                        unfire : [callback],//正在等待解发的回调
                        fired:[]//已经触发的回调
                    }
                }else{
                    core[name].unfire.unshift(callback)
                }
                if(!deps[name]){//去重
                    args.push(name);
                    deps[name] = 1;
                }
            });
            callback.deps = deps;
            callback.args = args;
            callback.reload = !!reload;//默认每次重新加载
        },
        unbind : function(array,fn){//$.multiUnind("aaa,bbb")
            if(/string|number/.test(typeof array) ){
                var tmp = []
                (array+"").replace($.rword,function(name){
                    tmp.push( "####"+name)
                });
                array = tmp;
            }
            var removeAll = typeof fn !== "function";
            for(var i = 0, name ; name = array[i++];){
                var obj = this.core[name];
                if(obj && obj.unfire){
                    obj.state = 1;
                    obj.unfire = removeAll ?  [] : obj.unfire.filter(function(el){
                        return fn != el;
                    });
                    obj.fired = removeAll ?  [] : obj.fired.filter(function(el){
                        return fn != el;
                    });
                }
            }
        },
        _args : function (arr){
            for(var i = 0, result = [], el; el = arr[i++];){
                result.push( this.core[el].ret);
            }
            return result;
        },
        fire : function(name, args){
            var core = this.core, obj = core["####"+name], deps;
            if(!obj )
                return ;
            obj.ret = args;
            obj.state = 2;
            var unfire = obj.unfire,fired = obj.fired;
                loop:
                for (var i = unfire.length,repeat, fn; fn = unfire[--i]; ) {
                    deps = fn.deps;
                    for(var key in deps){
                        if(deps.hasOwnProperty(key) && core[key].state != 2 ){
                            continue loop;
                        }
                    }
                    unfire.splice(i,1);
                    fired.push(fn);
                    repeat = true;
                }
            if(repeat){
                return this.fire(name, args);
            }else{
                for (i = fired.length; fn = fired[--i]; ) {
                    if(fn.deps["####"+name]){//只处理相关的
                        fn.apply(this,this._args(fn.args));
                        if(fn.reload){//所有数据必须重新加载
                            fired.splice(i,1);
                            unfire.push(fn);
                            for(key in fn.deps){
                                core[key].state = 1;
                            }
                        }
                    }
                }
            }
        }
    }
    $.flow  = function(names,callback,reload){//一个工厂方法
        return new OperateFlow(names,callback,reload)
    }
})
