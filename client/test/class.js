$.define("class","more/spec,class",function(){
    $.fixture('类工厂模块-class', {
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
                extend:{
                    class_fn:function(){
                        return "ancestor_class";
                    }
                }
            });
            var Parent = $.factory({
                inherit:Ancestor,
                instance_fn:function(){
                    return this._super()+"-->Parent";
                },
                extend:{
                    class_fn:function(){
                        return "parent_class";
                    }
                }
            });
            var Son = $.factory({
                inherit:Parent,
                init:function(name,age){
                    this.age = age;
                },
                instance_fn2:function(){
                    return this._super()+"-->Son";
                },
                instance_fn3:function(){
                    return "instance_fn3"
                },
                extend:{
                    class_fn:function(){
                        return "son_class";
                    }
                }
            });

            var p = new Parent("天空之城");
            expect(p.instance_fn()).eq("ancestor_instance-->Parent");
            expect(Parent.class_fn()).eq("parent_class");
            var s = new Son("司徒正美", 14);
            expect(s.instance_fn()).eq("ancestor_instance-->Parent");
            expect(s.instance_fn2()).eq("ancestor_instance2-->Son");
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
           
        }

    });
});
