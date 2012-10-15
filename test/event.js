define(["$event","$spec","$css"],function( ){
    $.fixture('事件模块-event', {
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
            })
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
            },10000)
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
            },10000)
        },
        "mouseenter": function(id){
           
        }
    })
})
