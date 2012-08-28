define(["$flow","$spec"],function(){
    $.fixture('操作流模块-flow', {
        "reload = false": function(id){
            var flow = new $.flow;
            var callback = function(a,b,c){
                expect([].slice.call(arguments),id).same([10,20,30])//测试多路监听时收集的返回值
                expect("此流程触发在aaa,bbb,ccc都被fire的情况下",id).eq("此流程触发在aaa,bbb,ccc都被fire的情况下")
            }
            var fireCount = 0;//用于统计aaa,bbb这个组合的回调一共执行了多少次
            var callback2 = function(a,b,c){
                fireCount++;
            }
            flow.bind("aaa,bbb,ccc",callback,false);
            flow.bind("aaa,ddd",callback2,false);
            expect(callback.deps).same({
                __aaa:1,
                __bbb:1,
                __ccc:1
            });

            // $.log(callback.args)
            expect(callback.args).same(["__aaa", "__bbb", "__ccc"]);//必须这三个事件都被fire才执行callback
            // $.log(callback.reload)
            expect(callback.reload).eq(false);
            //  $.log(flow.root["__aaa"])
            expect(flow.root["__aaa"].unfire.length).eq(2);//__aaa这个事件未绑定的回调已达两个
            flow.fire("aaa",10);
            flow.fire("bbb",20);
            flow.fire("ccc",30);
            flow.fire("ddd",40);
            flow.fire("ddd",50);
            flow.fire("ddd",60);
            expect(fireCount).eq(3);
        },
        "find": function(){
            var node = new $.Flow();
            node.bind("aaa", function(){
                $.log("aaa")
            });
            node.bind("ccc", function(){
                $.log("bbb")
            });
            node.bind("eeaa", function(){
                $.log("bbb")
            });
            node.bind("aaa,ddd", function(){
                $.log("bbb")
            });
            node.bind("ccc,aaa", function(){
                $.log("bbb")
            });
            expect( node.find().length ).eq( 5 )
            expect( node.find({}).length ).eq( 5 )
            expect( node.find({
                match:/aa$/
            }).length ).eq( 4 )
            expect( node.find("aaa").length ).eq( 3 )
            expect( node.find("ccc").length ).eq( 2 )
            expect( node.find("aaa,ccc").length ).eq( 1 )
        },
        "reload = true": function(){
            var flow = new $.flow;
            var fireCount = 0;//用于统计aa,bb这个组合的回调一共执行了多少次
            var callback = function(){
                fireCount++
            }
            flow.bind("aa,bb,cc",callback,true);
            flow.fire("aa",10);
            flow.fire("bb",20);
            flow.fire("cc",30);
            flow.fire("aa",40);
            flow.fire("bb",50);
            flow.fire("cc",60);
            flow.fire("aa",40);
            flow.fire("bb",50);
            flow.fire("cc",60);
            flow.fire("aa",40);
            flow.fire("bb",50);
            flow.fire("cc",60);
            expect(fireCount).eq(4);
        },
        "fire arguments":function(id){
            var flow = new $.flow;
            var callback = function(){
                var args = [].slice.call(arguments);
                expect(arguments.length ,id).eq( 9 );
                expect(args.join(",") ,id).eq("1,2,3,4,5,6,7,8,9");
            }
            flow.bind("aa,bb,cc",callback,true);
            flow.fire("aa",1,2,3);
            flow.fire("aa",4,5,6)
            flow.fire("aa",7,8,9)
        }

    });
})

