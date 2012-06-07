$.define("flow","flow,more/spec",function(){
    $.fixture('操作流模块-flow', {
        flow: function(id){
            var flow = new $.flow;
            var callback = function(){
                expect("此流程触发在aaa,bbb,ccc都被fire的情况下",id).eq("此流程触发在aaa,bbb,ccc都被fire的情况下")
            }
            flow.bind("aaa,bbb,ccc",callback,true);
            expect(callback.deps).same({ __aaa:1, __bbb:1, __ccc:1});
            expect(callback.args).same(["__aaa", "__bbb", "__ccc"]);
            expect(callback.reload).eq(true);
            
        }
    });
})

