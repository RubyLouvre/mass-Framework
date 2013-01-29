define("scrollbar", ["css"], function($) {
    function hasScrollBar(target, key) {
        //判定是否存在水平或垂直滚动条
        var val = target.css('overflow-' + key)
        if(val == 'scroll') return true;
        if(val == 'hidden') return false;
        if(val == 'auto') {
            var el = target[0],
                method = key == 'y' ? 'Height' : 'Width';
            return el['client' + method] < el['scroll' + method];
        }
        return false
    }
    $.fn.hasScrollBar = function() {
        //判定当前匹配的第一个元素是否存在滚动条
        return isDisplayScrollBar(this, 'x') || isDisplayScrollBar(this, 'x');
    }
    $.getDefaultScrollBarWidth = function() {
        //取得当前窗口默认的滚动条的宽度
        if($.getDefaultScrollBarWidth.ret) {
            return $.getDefaultScrollBarWidth.ret
        }
        var test = $('<div style="width: 100px;height: 100px;overflow: scroll;position: absolute;top: -9999px;"/>').appendTo("body");
        var ret = test[0].offsetWidth - test[0].clientWidth;
        test.remove();
        return $.getDefaultScrollBarWidth.ret = ret;
    }
    $.getScrollBarWidth = function(node) {
        //获取当前元素的滚动条的消息
        var target = $(node),
            width = $.getDefaultScrollBarWidth();
        return {
            x: hasScrollBar(target, 'x') ? width : 0,
            y: hasScrollBar(target, 'y') ? width : 0
        }
    }
    return $;
});