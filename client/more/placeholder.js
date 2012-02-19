$.define("placeholder","attr,css,event",function(){
    //读者可以与这个比较一下https://github.com/danielstocks/jQuery-Placeholder/blob/master/jquery.placeholder.js
    //http://www.iliadraznin.com/2011/02/jquery-placeholder-plugin/
    $.log("placeholder模块加载成功")
    function fix(input, node, val) {
        var placeholder = $._data(node,"placeholder")
        if(!placeholder){
            placeholder = $("<kbd>").afterTo(input).css({
                position: "relative",
                left: -1 * (input.innerWidth() + parseFloat(input.css("marginRight"))) ,
                top:  -1 * parseFloat(input.css("paddingTop")),
                display: "inline-block",
                w: input.width() - 4 ,
                h: input.height(),
                border: 'none',
                cursor: 'text',
                bgc: input.css("bgc"),//背景
                c: "#808080",
                "font-weight": input.css("font-weight"),
                "font-size": input.css("font-size")      
            });
            $._data( node,"placeholder", placeholder )
        }
        return placeholder.text(val);
    }
    function callback( e ){
        var placeholder = $._data( this,"placeholder");
        if( placeholder ){
            placeholder.css("display" , this.value ? "none" : "inline-block");
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

