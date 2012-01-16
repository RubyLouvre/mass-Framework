dom.define("test/data","more/spec,data",function(){
    dom.addTestModule('数据缓存模块-data', {
        "dom.data":function(){
            //使用了data方法的元素或对象都会添加一个叫uniqueNumber的数字属性
            dom.data(document.body,"test1",[1,2,3]);
            expect(typeof document.body.uniqueNumber === "number").ok();
            expect(dom.data(document.body,"test1")).same([1,2,3]);
            var val = dom.data(document.body,"test2",{
                aa:"aa",
                bb:"bb"
            });
            //测试返回值
            expect(val).same({
                aa:"aa",
                bb:"bb"
            });
           
        },
        "dom.mergeData":function(){
            var a = {};
            //写入数揣
            dom.data(a,"name","司徒正美");
            //写入一个复杂的数据
            dom.data(a,"obj",{
                ee:[1,2,3,{
                    aa:"aa",
                    bb:"bb"
                }],
                dd:function(){},
                date:new Date
            });
            var b = {};
            dom.data(b,"sex","man");
            //合并数据
            dom.mergeData(b,a);
            expect(dom.data(a)).log()
            expect(dom.data(b)).log()
            delete dom.data(b).sex;
            expect(dom.data(a)).same(dom.data(b))
        },
        "dom.removeData":function(){
            var val = dom.removeData(document.body,"test1");
            expect(val).same([1,2,3]);
            dom.removeData(document.body);
            expect(dom.data(document.body)).same({});
        }

    });
});
