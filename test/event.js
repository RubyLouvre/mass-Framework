define(["$event","$css"],function( $ ){
    describe('event', {
        "click": function(id){
            var div = $("<div style='width:200px;height:200px;background:red;float:left;'/>")
            .appendTo("body").text("验证click事件");
            div.bind("click", function(e){   
                expect( e.type,id ).eq("click");
            })
            var fn
            $.bind(div[0], "click",fn = function(e){
                expect( !!e.originalEvent, id ).eq(false);
                div.unbind("click")
                $.unbind(div[0], "click",fn)
            });

            div.fire("click");//尝试触发事件系统与非事件系统绑定的回调
            div.fire("click");
            //验证不会再进入回调
            expect( $("#mass-spec-done")[0].title ).eq(2);
            var index = 0
            div.on("click", function(e){
                index++
            },4);
            div.fire("click");
            div.fire("click");
            div.fire("click");
            div.fire("click");
            div.fire("click");
            div.fire("click");
            //验证次数限制
            expect( index ).eq(4);
            setTimeout(function(){
                div.remove();
            },5000)
        },
        "mouseover": function(id){
            var div = $("<div style='width:200px;height:200px;background:blue;float:left;'/>")
            .appendTo("body").text("验证mouseover/mouseout事件");
            div.mouseover(function(e){
                div.css("background","green")
                expect( e.type,id ).eq("mouseover");
                setTimeout( function(){
                    div.fire("mouseout")
                },500 )
            }).mouseout(function(e){
                div.css("background","#8000ff")
                expect( e.type,id ).eq("mouseout");
            })
            div.fire("mouseover")
            setTimeout(function(){
                div.remove();
            },5000)
        },
        "mouseenter": function(id){
            var div = '<div id="outer" style="width:200px;height:200px;background:blue;float:left;">'
            + '<div id="inner" style="margin:20px;width:100px;height:100px;background:red;"></div>'
            + '</div>'
            var nobubble = true
            div = $(div).appendTo("body")
            $("#outer").mouseenter(function(){
                nobubble = false;
            })
            $("#inner").fire("mouseover")
            $.log(nobubble+"!")
            expect( nobubble,id ).eq(true);
            setTimeout(function(){
                $("#inner").fire("mouseenter")
                expect( nobubble,id ).eq(true);
                $("#outer").mouseover(function(){
                    nobubble = 2;
                })
                $("#outer").fire("mouseenter")
                expect( nobubble,id ).eq(false);
                setTimeout(function(){
                    div.remove();
                },3000)
            },1000)

        },
        "submit": function(id){
            var form =  "<form action='javascript:void 0' onsubmit='window.fired=7' style='border:1px solid red;width:200px;height:200px;float:left;'>"
            +'<div id="pink_parent" style="padding:10px;background:pink;">'
            +'<div id="cyan_parent" style="padding:10px;background:cyan;"><input type="submit" id="button" value="submit">'
            +'<div></div></form>'
            form = $(form).appendTo("body")
            var fired = false;
            form.bind("submit",function(){
                fired = true;
            });
            form[0].submit();
            expect( fired,id ).eq(false);
            form.submit()
            expect( fired,id ).eq(true);
            expect( window.fired,id ).eq(7);
            window.fired = void 0
            form[0].onsubmit = null;
            form.unbind("submit")
            var level = 0;
            //http://www.cnblogs.com/rubylouvre/archive/2009/12/27/1628347.html
            $("#button").click(function(){
                level++;
            })
            $("#pink_parent").submit(function(){
                $.log(level)
                level++;
            });
            $("#cyan_parent").submit(function(){
                level++;
            });
            form.delegate("div","submit", function(){
                level++;
                $.log(level)
            })
            $("#cyan_parent").fire("submit")
             
        }
    })
})
//http://ie.microsoft.com/testdrive/HTML5/ComparingEventModels/