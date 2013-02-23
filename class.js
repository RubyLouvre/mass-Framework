//=========================================
// 类工厂模块 v12 by 司徒正美
//==========================================
define("class", ["lang"], function($) {

    function bridge() {
    }
    var fnTest = /mass/.test(function() {
        mass;
    }) ? /\b_super|_superApply\b/ : /.*/;

    var hash = {
        inherit: function(parent, init) {
            //继承一个父类，并将它放进_init列表中，并添加setOptions原型方法
            if (typeof parent == "function") {
                for (var i in parent) { //继承类成员
                    this[i] = parent[i];
                }
                bridge.prototype = parent.prototype;
                this.prototype = new bridge; //继承原型成员
                this._super = parent; //指定父类
                if (!this.__init__) {
                    this.__init__ = [parent]
                }
            }
            this.__init__ = (this.__init__ || []).concat();
            if (init) {
                this.__init__.push(init);
            }
            this.toString = function() {
                return(init || bridge) + "";
            }
            var proto = this.fn = this.prototype;
            proto.extend = hash.extend;
            proto.setOptions = function() {
                var first = arguments[0];
                if (typeof first === "string") {
                    first = this[first] || (this[first] = {});
                    [].splice.call(arguments, 0, 1, first);
                } else {
                    [].unshift.call(arguments, this);
                }
                $.Object.merge.apply(null, arguments);
                return this;
            }
            return proto.constructor = this;
        },
        extend: function(module) {
            //添加一组原型方法
            var target = this;
            Object.keys(module).forEach(function(name) {
                var fn = target[name], fn2 = module[name]
                if (typeof fn === "funciton" && typeof fn2 === "function" && fnTest.test(fn2)) {
                    var __super = function() { //创建方法链
                        return fn.apply(this, arguments);
                    };
                    var __superApply = function(args) {
                        return fn.apply(this, args);
                    };
                    target[name] = function() {
                        var t1 = this._super;
                        var t2 = this._superApply;
                        this._super = __super;
                        this._superApply = __superApply;
                        var ret = fn2.apply(this, arguments);
                        this._super = t1;
                        this._superApply = t2;
                        return ret;
                    };
                } else {
                    target[name] = fn2;
                }
            });
            return this;
        }
    };
    function getSubClass(obj) {
        return  $.factory(this, obj);
    }
    $.factory = function(parent, obj) {
        if (arguments.length === 1) {
            obj = parent;
            parent = null;
        }
        var statics = obj.statics;//静态成员扩展包
        var init = obj.init; //构造器
        delete obj.init;
        delete obj.statics;
        var klass = function() {
            for (var i = 0, init; init = klass.__init__[i++]; ) {
                init.apply(this, arguments);
            }
        };
        hash.inherit.call(klass, parent, init);//继承了父类原型成员与类成员
        var fn = klass.fn;
        var __init__ = klass.__init__;
        $.mix(klass, statics);//添加类成员
        klass.prototype = klass.fn = fn;
        klass.__init__ = __init__;
        klass.fn.extend(obj);
        klass.mix = $.mix;
        klass.extend = getSubClass;
        return klass;
    };
    $.mix($.factory, hash);
    return $
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
2012.12.25 去掉mutators 对象，它的方法绑到$.factory上，并且它支持继续用户用其他方法定义的“类” v11
2013.2.23 支持方法链，可以添加静态成员，默认绑定fn为prototype, fn.extend用于扩展原型方法，extend为产生子类
https://gist.github.com/2990054
*/