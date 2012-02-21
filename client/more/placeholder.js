$.define("placeholder","attr,css,event",function(){
    //读者可以与这个比较一下https://github.com/danielstocks/jQuery-Placeholder/blob/master/jquery.placeholder.js
    //http://www.iliadraznin.com/2011/02/jquery-placeholder-plugin/
    //  $.log("placeholder模块加载成功")
    function fix(input, node, val) {//v3
        var placeholder = $._data(node,"placeholder")
        if(!placeholder){
            placeholder = $("<kbd>").css({
                position: "absolute",
                left:  input.offset().left + 2,
                top:   input.offset().top + 2,
                display: "inline-block",
                w: input.width() - 4 ,
                h: input.height(),
                border: 'none',
                cursor: 'text',
                bgc: input.css("bgc"),//背景
                c: "#808080",
                "font-weight": input.css("font-weight"),
                "font-size": input.css("font-size")      
            }).appendTo("body")
            $._data( node,"placeholder", placeholder )
        }
        return placeholder.text(val);
    }
    function callback( e ){
        var placeholder = $._data( this,"placeholder");
        if( placeholder ){
            placeholder.css({
                left: $(this).offset().left + 2,//每次都重新定位,以防用户resize了窗口
                top:  $(this).offset().top + 2,
                display : this.value ? "none" : "inline-block"
            });
            if(!this.value ){
                this.focus();
            }
        }
    }
    var NATIVE_SUPPORT = !!("placeholder" in document.createElement( "input" ));

    $.fn.placeholder = function(val) {
        return this.each(function() {
            if( NATIVE_SUPPORT ){
                this.setAttribute("placeholder", val)
            }else{
                var input = $(this);
                var placeholder = fix(input, this, val );
                placeholder.css("display" , (input.val() ? "none" : "inline-block"))
                placeholder.click(function(){
                    placeholder.css("display","none" );
                });
                input.bind("mouseout,input",callback);
            }
        });
    }
    $.fn.unplaceholder = function( ){
        return this.each(function() {
            if( NATIVE_SUPPORT ){
                this.setAttribute("placeholder", "");
            }else{
                var placeholder =  $._data( this,"placeholder")
                if( placeholder ){
                    var input = $(this);
                    input.unbind("mouseout,input",callback);
                    input.removeData("placeholder",true);
                    placeholder.unbind("click")
                    placeholder.remove();
                }
            }
        });
    }
});

//2012.2.17 v1 插入到目标元素之后,然后负边距定位
//2012.2.18 v2 插入到目标元素之后,然后相对定位, 增加对坐标,边框, 字体的样式处理
//2012.2.19 v3 插入到body之内,然后绝对定位
/**


placeholder，没仔细看你的实现，我以前有些总结随意参考下：
1. value方式模拟没有语义，破坏真实value值，在form提交或需要value值交互等情况下造成问题，故使用层模拟

2. 优先考虑原生placeholder支持，默认样式与其保持一致

3. API易用，id，数组，dom集合等等都可以混用，链式绑定，可选value值指定（优先级最高），可选className指定（默认"placeholder"）

4. 参考原生placeholder全选不能选中，保留此策略（但在IE全选情况下无解）

5. 处理大量细节（如用户点击在placeholder上input无法获焦，智能垂直居中等）

<h4>更新</h4>

[2011-06-02]
1.增加textarea类型的始终模拟，因默认的样式控制和换行存在问题

[2011-05-30]
1.外框会继承lineheight属性在firefox会表现高度，因此考虑过用绝对定位，但受上层不能相对定位的硬性影响，还是在布局上处理或自定义css接口
2.处理input默认值和刷新还原值的影响


[2011-03-19]
1.chrome下placeholder属性存在bug，表现为无法居中对齐，无法受跟位置有关的样式（如padding, margin, line-height等）控制，单独修正为模拟方式，其他webkit浏览器表现正常
*/