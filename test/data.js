define(["$data","$spec"],function(){

    var body = document.body
    describe('data', {
        data: function(){
            //使用了data方法的元素或对象都会添加一个叫uniqueNumber的数字属性
            $.data( body,"test1",[1,2,3]);
            expect(typeof  body.uniqueNumber === "number").ok();
            expect($.data( body,"test1")).same([1,2,3]);
            //现在数据缓存系统是不能为文本节点，注释节点储存任何数据
            var textNode = document.createTextNode("文本节点");
            body.appendChild( textNode );
            $.data( textNode,"text","text");
            expect($.data( textNode,"test1")).eq( void 0 );
            body.removeChild( textNode );
            
            var el = $("<div data-aaa=1 data-bbb=2 data-ccc-ddd=3 />").appendTo(body)
            expect(el.data()).same({
                aaa:1,
                bbb:2,
                cccDdd:3
            });
            var val = $.data( body,"test2",{
                aa:"aa",
                bb:"bb"
            });
            //测试返回值
            expect(val).same({
                aa:"aa",
                bb:"bb"
            });
        },
        mergeData: function(){
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
            //   alert($.data(b))
            expect($.data(a)).log()
            expect($.data(b)).log()
            delete $.data(b).sex;
            expect($.data(a)).same($.data(b))
        },
        removeData: function(){
            $.data( body,"test1",[1,2,3]);
            var val = $.removeData( body,"test1");
            expect(val).same([1,2,3]);
            $.removeData( body );
            expect( $.data( body )).same({});
        },
        parseData: function(){
            body.setAttribute("data-object","{a:1,b:2,c:3}")
            var data = $.parseData( body, "object")
            expect(data).same({
                a:1,
                b:2,
                c:3
            });
            body.setAttribute("data-array","[1,2,3]")
            data = $.parseData( body, "array");
            expect(data).same([1,2,3]);
            body.setAttribute("data-null","null");
            data = $.parseData( body, "null");
            expect(data).eq(null);
            body.setAttribute("data-num","20120429");
            data = $.parseData( body, "num");
            expect(data).eq(20120429);
        }

 
    });
//2012.4.29 添加$.parseData测试
})