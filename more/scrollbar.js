define("scrollbar", ["css"], function($) {
    function hasScrollBar(el, a) {
        //判定是否存在水平或垂直滚动条
//If overflow is hidden, the element might have extra content, but the user wants to hide it
        if ($(el).css("overflow") === "hidden") {
            return false;
        }

        var scroll = (a && a === "left") ? "scrollLeft" : "scrollTop",
                has = false;

        if (el[ scroll ] > 0) {
            return true;
        }

        // TODO: determine which cases actually cause this to happen
        // if the element doesn't have the scroll set, see if it's possible to
        // set the scroll
        el[ scroll ] = 1;
        has = (el[ scroll ] > 0);
        el[ scroll ] = 0;
        return has;
    }
    $.fn.hasScrollBar = function() {
        //判定当前匹配的第一个元素是否存在滚动条
        return isDisplayScrollBar(this, 'x') || isDisplayScrollBar(this, 'x');
    }
    $.getDefaultScrollBarWidth = function() {
        //取得当前窗口默认的滚动条的宽度
        if ($.getDefaultScrollBarWidth.ret) {
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
            x: hasScrollBar(node, 'x') ? width : 0,
            y: hasScrollBar(node, 'y') ? width : 0
        }
    }
    return $;
});