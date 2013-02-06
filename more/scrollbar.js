define("scrollbar", ["css"], function($) {
    function hasScroll(el, a) {
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
    $.fn.hasScroll = function() {
        //判定当前匹配的第一个元素是否存在滚动条
        return hasScroll(this, 'x') || hasScroll(this, 'x');
    };
    // calculate and return the scrollbar width, as an integer
    var scrollbarHeight, scrollbarWidth;
    (function () {
        var test = $('<div style="position: absolute; top: -10000px; left: -10000px; width: 100px; height: 100px; overflow: scroll;"></div>').appendTo("body");
        var node = test[0];
        scrollbarHeight = node.scrollHeight - node.clientHeight;
        scrollbarWidth = node.scrollWidth - node.clientWidth;
        test.remove();
    })();
    $.scrollbarWidth = function() {
        return scrollbarWidth;
    };
    $.scrollbarHeight = function() {
        return scrollbarHeight;
    };
    $.getScrollBar = function(node) {
        //获取当前元素的滚动条的消息
        return {
            x: hasScrollBar(node, 'x') ? scrollbarWidth : 0,
            y: hasScrollBar(node, 'y') ? scrollbarHeight : 0
        };
    };
    return $;
});