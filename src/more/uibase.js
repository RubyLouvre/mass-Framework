$.define("uibase","class,data", function(){
    //提供所有UI控件的父类与在节点链对象上提供一个操UI实例的方法
    $.log("已加载uibase模块")
    return {
        Class: $.factory({//所有UI控件的父类
            init: function( widget, parent ){
                this["@name"] = widget;
                this.parent = $(parent);
            },
            invoke: function( method, value ){
                if(typeof this[method] === "function"){
                    return this[method].apply( this, [].slice.call(arguments,1) );
                }else{
                    return this[method] = value;
                }
            },
            getUI: function(){
                return this;
            },
            destroy: function(){
                this.target.remove();
                this.parent.off("."+this["@name"]);
                this.parent.removeData("_mass_"+this["@name"]);
            }
        }),
        create: function( widget, UI, init){//ui的名字, ui的类, ui的初始方法
            return function( method ){//创建一个用于操作UI控件的原型方法
                init = typeof init =="function" ? init : $.noop;
                for(var i =0 ; i < this.length; i++){
                    if(this[i] && this[i].nodeType === 1){
                        var ui = $.data(this[i],"_mass_"+widget)
                        if(! ui  ){
                            ui = new UI( widget, this[i] );
                            init(ui, method);//初始化控件
                            $.data( this[i],"_mass_" + widget, ui );
                        }else if(typeof method == "string"){//调用控件的方法
                            var ret = ui.invoke.apply(ui, arguments );
                            if(ret !== void 0){
                                return ret;
                            }
                        }else if(method && typeof method == "object"){
                            ui.setOptions( method );//重置控件的属性
                        }
                    }
                }
                return this;
            }
        }
    }
});

