define("scrollbar", ["css"],function( $){
    $.fn.hasScrollBar = function() {
        var node = this[0],ret = false;
        if ((node.clientHeight < node.scrollHeight) || (node.clientWidth < node.scrollWidth)) {
            ret = true;
        }
        return ret;
    }
    $.scrollbarWidth = function (){
        if( $.scrollbarWidth.ret ){
            return $.scrollbarWidth.ret
        }
        var test =  $('<div style="width: 100px;height: 100px;overflow: scroll;position: absolute;top: -9999px;"/>').appendTo("body");
        var ret = test[0].offsetWidth - test[0].clientWidth;
        test.remove();
        return $.scrollbarWidth.ret = ret;
    }
});
