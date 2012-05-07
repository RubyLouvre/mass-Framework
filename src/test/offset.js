$.define("offset","ready,more/spec,node,css",function(){
    var iframe =  $("<iframe style='display:none;width:0px;height:0px;' src='/test/offset.html' frameBorder=0  />").appendTo("body");
    //style='display:none;width:0px;height:0px;'
    window.offsetTestCall = function(){
        var idoc  =  iframe.contents()[0];

        $.fixture("offset_api",{
            set:function(){
                var test_offset = $("#test-offset",idoc);
                var o = test_offset.offset();
                test_offset.offset( o );
                var o2 = test_offset.offset();
                expect(o2.top).eq(o.top);
                expect(o2.left).eq(o.left);
                expect(test_offset[0].style.position).eq("relative");
            },
            "should consider html border": function() {
                // ie 下应该减去窗口的边框吧，毕竟默认 absolute 都是相对窗口定位的
                // 窗口边框标准是设 documentElement ,quirks 时设置 body
                // 最好禁止在 body 和 html 上边框 ，但 ie < 9 html 默认有 2px ，减去
                // 但是非 ie 不可能设置窗口边框，body html 也不是窗口 ,ie 可以通过 html,body 设置
                // 标准 ie 下 docElem.clientTop 就是 border-top
                // ie7 html 即窗口边框改变不了。永远为 2


                //只考虑 ie 标准模式了,ie<9 下设置边框，否则默认 2px
                idoc.documentElement.style.borderTopWidth = "10px";

                $("body",idoc).append("<div id=aa style='background:red;position: absolute;top:0;'/>")
                var a = $("#aa", idoc)

                // ie < 9 相对于 document.documentElement 即窗口
                expect( a.offset().top).eq(0);
                a.offset( {
                    top:0
                });

                expect(parseInt(a.css("top") )).eq(0);
                idoc.documentElement.style.borderTop = "";
                iframe.remove();
            }

        })
    }
})