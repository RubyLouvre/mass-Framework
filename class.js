//=========================================
// 类工厂模块 by 司徒正美
//==========================================
define("class", ["$lang"], function(){
   $.log("已加载类工厂模块",7)
    var
    unextend = $.oneObject(["_super","prototype", 'extend', 'implement' ]),
    rconst = /constructor|_init|_super/,
    classOne = $.oneObject('Object,Array,Function');
    function expand(klass,props){
        'extend,implement'.replace( $.rword, function(name){
            var modules = props[name];
            if( classOne[ $.type( modules) ] ){
                klass[name].apply( klass,[].concat( modules ) );
                delete props[name];
            }
        });
        return klass;
    }

    $.mutators = {
        inherit : function( parent,init ) {
            var bridge = function() { }
            if( typeof parent == "function"){
                for(var i in parent){//继承类成员
                    this[i] = parent[i];
                }
                bridge.prototype = parent.prototype;
                this.prototype = new bridge ;//继承原型成员
                this._super = parent;//指定父类
            }
            this._init = (this._init || []).concat();
            if( init ){
                this._init.push(init);
            }
            this.toString = function(){
                return (init || bridge) + ""
            }
            var proto = this.prototype;
            proto.setOptions = function(){
                var first = arguments[0];
                if( typeof first === "string" ){
                    first =  this[first] || (this[first] = {});
                    [].splice.call( arguments, 0, 1, first );
                }else{
                    [].unshift.call( arguments,this );
                }
                $.Object.merge.apply(null,arguments);
                return this;
            }
            return proto.constructor = this;
        },
        implement:function(){
            var target = this.prototype, reg = rconst;
            for(var i = 0, module; module = arguments[i++]; ){
                module = typeof module === "function" ? new module :module;
                Object.keys(module).forEach(function(name){
                    if( !reg.test(name) ){
                        target[name] = module[name];
                    }
                }, this );
            }
            return this;
        },
        extend: function(){//扩展类成员
            var bridge = {}
            for(var i = 0, module; module = arguments[i++]; ){
                $.mix( bridge, module );
            }
            for( var key in bridge ){
                if( !unextend[key] ){
                    this[key] =  bridge[key]
                }
            }
            return this;
        }
    };
    $.factory = function( obj ){
        obj = obj || {};
        var parent = obj.inherit //父类
        var init = obj.init ;    //构造器
        delete obj.inherit;
        delete obj.init;
        var klass = function () {
            for( var i = 0 , init ; init =  klass._init[i++]; ){
                init.apply(this, arguments);
            }
        };
        $.mix( klass, $.mutators ).inherit( parent, init );//添加更多类方法
        return expand( klass, obj ).implement( obj );
    }
});
/**
 change log:
2011.7.11 将$["class"]改为$["@class"] v4
2011.7.25
继承链与方法链被重新实现。
在方法中调用父类的同名实例方法，由$super改为supermethod，保留父类的原型属性parent改为superclass v5
2011.8.6
在方法中调用父类的同名实例方法，由supermethod改为_super，保留父类的原型属性superclass改为_super v6
重新实现方法链
fix 子类实例不是父类的实例的bug
2011.8.14 更改隐藏namespace,增强setOptions
2011.10.7 include更名为implement 修复implement的BUG（能让人重写toString valueOf方法） v7
2012.1.29 修正setOptions中$.Object.merge方法的调用方式
2012.2.25 改进setOptions，可以指定在this上扩展还是在this.XXX上扩展
2012.2.26 重新实现方法链，抛弃arguments.callee.caller   v8
2012.7.22 v10 大幅简化,去掉defineProperty与方法链
https://gist.github.com/2990054
*/
