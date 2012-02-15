//=========================================
// 类工厂模块
//==========================================
$.define("class", "lang",function(){
   // $.log("已加载class模块")
    var
    P = "prototype",  C = "constructor", I = "@init",S = "_super",
    unextend = $.oneObject([S,P, 'extend', 'implement','_class']),
    exclusive = new RegExp([S,I,C].join("|")),ron = /on([A-Z][A-Za-z]+)/,
    classOne = $.oneObject('Object,Array,Function');
    function expand(klass,props){
        'extend,implement'.replace($.rword, function(name){
            var modules = props[name];
            if(classOne[$.type(modules)]){
                klass[name].apply(klass,[].concat(modules));
                delete props[name];
            }
        });
        return klass
    }
    function setOptions(){
        [].unshift(arguments,this.options || {})
        var options = this.options = $.Object.merge.apply(null,arguments),key,match
        if (typeof this.bind == "function") {
            for (key in options) {
                if ((match = key.match(ron))) {
                    this.bind(match[1].toLowerCase(), options[key]);
                    delete(options[key]);
                }
            }
        }
        return this;
    }
    function _super(){
        var caller = arguments.callee.caller;  // 取得当前方法
        var name = caller._name;  // 取得当前方法名
        var superclass = caller._class[S];//取得当前实例的父类
        if(superclass && superclass[P][name] ){
            return superclass[P][name].apply(this, arguments.length ? arguments : caller.arguments);
        }else{
            throw name + " no super method!"
        }
    }
    $["@class"] =  {
        inherit : function(parent,init) {
            var bridge = function() { }
            if(typeof parent == "function"){
                for(var i in parent){//继承类成员
                    this[i] = parent[i]
                }
                bridge[P] = parent[P];
                this[P] = new bridge ;//继承原型成员
                this[S]  = parent;//指定父类
            }
            this[I] = (this[I] || []).concat();
            if(init){
                this[I].push(init);
            }
            this.toString = function(){
                return (init || bridge) + ""
            }
            var KP = this[P];
            KP.setOptions = setOptions;
            KP[S] = _super;//绑定方法链
            return  KP[C] = this;
        },
        implement:function(){
            var target = this[P], reg = exclusive;
            for(var i = 0, module; module = arguments[i++]; ){
                module = typeof module === "function" ? new module :module;
                Object.keys(module).forEach(function(name){
                    if(!reg.test(name)){
                        var prop = target[name] = module[name];
                        if(typeof prop == "function"){
                            prop._name  = name;
                            prop._class = this;
                        }
                    }
                },this);
            }
            return this;
        },
        extend: function(){//扩展类成员
            var bridge = {}
            for(var i = 0, module; module = arguments[i++]; ){
                $.mix(bridge, module);
            }
            for(var key in bridge){
                if(!unextend[key]){
                    this[key] =  bridge[key]
                }
            }
            return this;
        }
    };
    $.factory = function(obj){
        obj = obj || {};
        var parent  = obj.inherit //父类
        var init = obj.init ; //构造器
        delete obj.inherit;
        delete obj.init;
        var klass = function () {
            for(var i = 0 , init ; init =  klass[I][i++];){
                init.apply(this, arguments);
            }
        };
        $.mix(klass,$["@class"]).inherit(parent, init);//添加更多类方法
        return expand(klass,obj).implement(obj);
    }
});

//2011.7.11
//dom["class"]改为dom["@class"]
//2011.7.25
//继承链与方法链被重新实现。
//在方法中调用父类的同名实例方法，由$super改为supermethod，保留父类的原型属性parent改为superclass
//2011.8.6
//在方法中调用父类的同名实例方法，由supermethod改为_super，保留父类的原型属性superclass改为_super
//重新实现方法链
//fix 子类实例不是父类的实例的bug
//2011.8.14 更改隐藏namespace,增强setOptions
//2011.10.7 include更名为implement 修复implement的BUG（能让人重写toString valueOf方法）
//2012.1.29  修正setOptions中$.Object.merge方法的调用方式

