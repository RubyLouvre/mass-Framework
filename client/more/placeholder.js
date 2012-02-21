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


