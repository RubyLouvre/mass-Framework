define( "$class".split(","), function( $ ){
    $.log("已加载text/class模块",7);
    describe('class', {
        "$.factory":function(){
            var Ancestor = $.factory({
                init:function(name){
                    this.name = name;
                },
                ancestor_prop:"3333333",
                instance_fn:function(){
                    return "ancestor_instance"
                },
                instance_fn2:function(){
                    return "ancestor_instance2"
                },
                statics:{
                    class_fn:function(){
                        return "ancestor_class";
                    }
                }
            });
            var Parent = $.factory(Ancestor, {
                statics:{
                    class_fn:function(){
                        return "parent_class";
                    }
                }
            });
            var Son = Parent.extend({
                init:function(name,age){
                    this.age = age;
                },
                instance_fn2:function(){
                    return "son instance_fn2";
                },
                instance_fn3:function(){
                    return "instance_fn3"
                },
                statics:{
                    class_fn:function(){
                        return "son_class";
                    }
                }
            });

            var p = new Parent("天空之城");
            expect(p.instance_fn()).eq("ancestor_instance");
            expect(Parent.class_fn()).eq("parent_class");
            var s = new Son("司徒正美", 14);
            expect(s.instance_fn()).eq("ancestor_instance");
            expect(s.instance_fn2()).eq("son instance_fn2");
            expect(Son.class_fn()).eq("son_class");
            expect(s.ancestor_prop).eq("3333333");
            expect(s.age).eq(14);
            expect(s.name).eq("司徒正美");
            var a = new Ancestor("时光之轮",30);
            expect(a.age).eq(undefined);
            expect(a.name).eq("时光之轮");
            expect(s instanceof Parent).ok();

            var VS = $.factory({
                init:function(name){
                    this.name = name;
                },
                valueOf:function(){
                    return this.name+"111"
                },
                toString:function(){
                    return this.name+"222"
                }
            });
            var v = new VS("小明");
            expect(v.valueOf()).eq("小明111");
            expect(v.toString()).eq("小明222");

            v.setOptions("xxx",{
                a: 111,
                b: 222
            });
            expect(v.xxx.a ).eq(111);
            expect(v.xxx.b ).eq(222);
            v.setOptions({
                c: 333,
                d: 444
            });
            expect(v.c ).eq(333);
            expect(v.d ).eq(444);
            v.setOptions({
                e: 555,
                f: 666
            },{
                e: 777,
                f: 888
            },{
                e: 999,
                f: "yyy"
            });
            expect(v.e ).eq(999);
            expect(v.f ).eq("yyy");
        }

    });
});
//2012.4.29 增加setOptions的测试