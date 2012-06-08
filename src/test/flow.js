$.define("flow","flow,more/spec",function(){
    $.fixture('操作流模块-flow', {
        flow: function(id){
            var flow = new $.flow;
            var callback = function(a,b,c){
                $.log([].slice.call(arguments))
                expect([].slice.call(arguments),id).same([10,20,30])//测试多路监听时收集的返回值
                expect("此流程触发在aaa,bbb,ccc都被fire的情况下",id).eq("此流程触发在aaa,bbb,ccc都被fire的情况下")
            }
            var callback2 = function(a,b,c){
                $.log([].slice.call(arguments))
                expect("此流程触发在aaa,ddd都被fire的情况下",id).eq("此流程触发在aaa,ddd都被fire的情况下")
            }
            flow.bind("aaa,bbb,ccc",callback,false);
            flow.bind("aaa,ddd",callback2,true);
            // $.log(callback.deps)
            expect(callback.deps).same({
                __aaa:1,
                __bbb:1,
                __ccc:1
            });
            // $.log(callback.args)
            expect(callback.args).same(["__aaa", "__bbb", "__ccc"]);//必须这三个事件都被fire才执行callback
            // $.log(callback.reloadAll)
            expect(callback.reloadAll).eq(true);
            //  $.log(flow.root["__aaa"])
            expect(flow.root["__aaa"].unfire.length).eq(2);//__aaa这个事件未绑定的回调已达两个
            flow.fire("aaa",10)
            flow.fire("bbb",20)
            flow.fire("ccc",30);
             flow.fire("aaa",40);
              flow.fire("bbb",20)
               flow.fire("ccc",20)
        }
    });
})

