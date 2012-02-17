$.define("placeholder","attr,css,event",function(){
    //读者可以与这个比较一下https://github.com/danielstocks/jQuery-Placeholder/blob/master/jquery.placeholder.js
    function fix(input, node, val) {
        var placeholder = $._data(node,"placeholder")
        if(!placeholder){
            placeholder = $("<kbd>").afterTo(input).css({
                marginLeft: -1 * input.width(),
                w: input.width(),
                h: input.height(),
                bgc: input.css("bgc"),//背景
                display: "inline-block",
                c: "#ccc"
            });
            $._data( node,"placeholder", placeholder )
        }
        return  placeholder.text(val);
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
            var input = $(this);
            if( NATIVE_SUPPORT ){
                this.setAttribute("placeholder", val)
            }else{
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
            var input = $(this);
            if( NATIVE_SUPPORT ){
                this.setAttribute("placeholder", "");
            }else{
                var placeholder =  $._data( this,"placeholder")
                if( placeholder ){
                    input.unbind("mouseout,input",callback);
                    input.removeData("placeholder",true);
                    placeholder.unbind("click")
                    placeholder.remove();
                }
            }
        });
    }
});