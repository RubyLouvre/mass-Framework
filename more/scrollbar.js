define("scrollbar", ["css"], function($) {
    function hasScroll(el, a) {
        //判定是否存在水平或垂直滚动条
        if ($(el).css("overflow") === "hidden") {
            return false
        }
        var scroll = (a && a === "x") ? "scrollLeft" : "scrollTop"
        if (el[ scroll ] > 0) {
            return true
        }
        if (scroll === "scrollLeft") {
          //  console.log(el.scrollWidth, el.clientWidth)
            return el.scrollWidth > el.clientWidth //+ scrollbarHeight
        } else {
          //  console.log(el.scrollHeight, el.clientHeight)
            return el.scrollHeight > el.clientHeight// + scrollbarHeight
        }
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
        scrollbarHeight = node.offsetHeight - node.clientHeight;
        scrollbarWidth = node.offsetWidth - node.clientWidth;
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
