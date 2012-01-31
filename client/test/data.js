$.define("data","more/spec,data",function(){
    $.fixture('数据缓存模块-data', {
        "$.data":function(){
            //使用了data方法的元素或对象都会添加一个叫uniqueNumber的数字属性
            $.data(document.body,"test1",[1,2,3]);
            expect(typeof document.body.uniqueNumber === "number").ok();
            expect($.data(document.body,"test1")).same([1,2,3]);
            var val = $.data(document.body,"test2",{
                aa:"aa",
                bb:"bb"
            });
            //测试返回值
            expect(val).same({
                aa:"aa",
                bb:"bb"
            });
           
        },
        "$.mergeData":function(){
            var a = {};
            //写入数揣
            $.data(a,"name","司徒正美");
            //写入一个复杂的数据
            $.data(a,"obj",{
                ee:[1,2,3,{
                    aa:"aa",
                    bb:"bb"
                }],
                dd:function(){},
                date:new Date
            });
            var b = {};
            $.data(b,"sex","man");
            //合并数据
            $.mergeData(b,a);
            expect($.data(a)).log()
            expect($.data(b)).log()
            delete $.data(b).sex;
            expect($.data(a)).same($.data(b))
        },
        "$.removeData":function(){
            var val = $.removeData(document.body,"test1");
            expect(val).same([1,2,3]);
            $.removeData(document.body);
            expect($.data(document.body)).same({});
        }

    });
});
