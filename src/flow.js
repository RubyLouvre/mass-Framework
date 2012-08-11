//=========================================
//  操作流模块,用于流程控制
//==========================================
$.define("flow","class",function(){//~表示省略，说明lang模块与flow模块在同一目录
    return $.Flow = $.factory({
        init: function(){
            this.root = {};//数据共享,但策略自定
            this.uuid = $.getUid({})
        },
        /**
        names 可以为数组，用逗号作为分隔符的字符串，callback是回调函数，reload，布尔，可选，决定最后回调的第二次触发的条件
        flow.bind("aaa",fn);那么当我们调用flow.fire("aaa")就会立即执行fn这个回调
        flow.bind("aaa,bbb",fn1);那么只有当我们把flow.fire("aaa"),flow.fire("bbb")都执行了，才会执行fn1这个回调
        flow.fire("aaa")与flow.fire("bbb")的触发顺序是随意的
        flow.bind("aaa,bbb,ccc",fn2)，这时就需要触发了三个操作才执行fn2这个回调
        flow.bind("ddd",fn)，ddd与fn之间类似发布者订阅者这样的机制，一个操作（指ddd）可以绑定多个回调，如
        flow.bind("ddd",fn2);flow.bind("ddd",fn3);那么当flow.fire("ddd")时，它会依次执行fn,fn2,fn3这三个回调
        reload参数的使用，比如flow.bind("aaa,bbb,ccc,ddd",fn)，当我们先后flow.fire("aaa"),flow.fire("bbb"),
        flow.fire("ccc"),flow.fire("ddd")，那么fn就会第一次被触发！
        然后我再调用flow.fire("aaa"),fn就会被第二次触发；反正我们无论是fire上述那个操作，bbb也好，ccc也好，fn都会立即执行,
        不用着等到四个都触发才执行！只有当reload设置为true时，我们才需要每次把这个步骤都执行了一遍才触发fn。*/
        bind: function(names,callback,reload){
            var  root = this.root, deps = {},args = []
            String(names +"").replace($.rword,function(name){
                name = "__"+name;//处理toString与valueOf等属性
                if(!root[name]){
                    root[name] ={
                        unfire : [callback],//正在等待解发的回调
                        fired: [],//已经触发的回调
                        state : 0
                    }
                }else{
                    root[name].unfire.unshift(callback)
                }
                if(!deps[name]){//去重
                    args.push(name);
                    deps[name] = 1;
                }
            });
            callback.deps = deps;
            callback.args = args;
            callback.reload = !!reload;//默认每次重新加载
            return this;
        },
        /**
        移除某个操作的回调(1)或所有回调(2),或同时移除多个操作（3）
        (1)$.unbind("aaa")
        (2)$.unbind("aaa",fn)
        (3)$.unbind("aaa,bbb,ccc")*/
        unbind : function(array,fn){
            var names = [];
            if(/string|number|object/.test(typeof array) ){
                (array+"").replace($.rword,function(name){
                    names.push( "__"+name)
                });
            }
            var removeAll = typeof fn !== "function";
            for(var i = 0, name ; name = names[i++];){
                var obj = this.root[name];
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
            return this;
        },
        _args : function (arr){//对所有结果进行平坦化处理
            for(var i = 0, result = [], el; el = arr[i++];){
                result.push.apply( result,this.root[el].ret);
            }
            return result;
        },
        fire: function(name, args){
            var root = this.root, obj = root["__"+name], deps;
            if(!obj )
                return this;
            obj.ret = $.slice(arguments,1);//这个供_args方法调用
            obj.state = 2;//标识此操作已完成
            var unfire = obj.unfire,fired = obj.fired;
                loop:
                for (var i = unfire.length,repeat, fn; fn = unfire[--i]; ) {
                    deps = fn.deps;
                    for(var key in deps){//如果其依赖的其他操作都已完成
                        if(deps.hasOwnProperty(key) && root[key].state != 2 ){
                            continue loop;
                        }
                    }
                    unfire.splice(i,1)
                    fired.push( fn );//从unfire数组中取出 ,放进fired数组中
                    repeat = true;
                }
            if(repeat){ //为了谨慎起见再检测一遍
                try{
                    this.fire.apply(this, arguments);
                }catch(e){
                    this.fire( "__error__", e);//如果发生异常，抛出500错误
                }
            }else{//执行fired数组中的回调
                for (i = fired.length; fn = fired[--i]; ) {
                    if(fn.deps["__"+name]){//只处理相关的
                        this.name = name;
                        fn.apply(this, this._args( fn.args ));
                        if(fn.reload){//重新加载所有数据
                            fired.splice(i,1);
                            unfire.push(fn);
                            for(key in fn.deps){
                                root[key].state = 1;
                            }
                        }
                    }
                }

            }
            return this;
        }
    });
//像mashup，这里抓一些数据，那里抓一些数据，看似不相关，但这些数据抓完后最后构成一个新页面。
});
/**
 2012.6.8 对fire的传参进行处理
 2012.7.13 使用新式的相对路径依赖模块
 一个简单的例子
 $.require("flow", function(){
                var node = new $.Flow();
                node.bind("aaa", function(){
                    $.log("aaa")
                });
                node.bind("aaa", function(){
                    $.log("bbb")
                });
                node.fire("aaa")
  })
 */