define( "$spec,$fx,ready".split(","),function( $ ){

   describe("fx",{
        'hide,show,rotate:': function() {
            var node =  $("<div id=fxaaa></div>").appendTo("body");
            var style = $("<style>#fxaaa{ width:100px;height:100px;background:lightgreen;}</style>").appendTo("body");
            node.hide(2000, function(){
                $(this).show(1500).fx({
                    rotate: 1440
                },3000,{
                    complete: function(){
                        node.remove();
                        style.remove()
                    }
                })
            })


        },
        "puff": function(id){
            var node =  $("<div id=fxbbb></div>").appendTo("body");
            var style = $("<style>#fxbbb{ width:100px;height:100px;background:lightblue;}</style>").appendTo("body");

            node.delay(1000).puff(1000,function(){
                node.remove();
                style.remove()
            })
        },
        "slideUp": function(id){
            var node =  $("<div id=fxccc></div>").appendTo("body");
            var style = $("<style>#fxccc{width:100px;height:100px;background:red;}</style>").appendTo("body");

            node.delay(2000).slideUp(1000,function(){
                node.remove();
                style.remove()
            })
        }

    });
});
//2012.4.29
//将原lang与lang_fix的测试全部合在一起，增加Date, isArray, map, filter等测试
//更新isArray取得iframe中的Array的逻辑，原xArray = window.frames[window.frames.length-1].Array; 是取不到数组的
