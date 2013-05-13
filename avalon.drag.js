(function(avalon) {
    var root = avalon(document.documentElement),
        //支持触模设备
        supportTouch = "createTouch" in document || 'ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch,
        onstart = supportTouch ? "touchstart" : "mousedown",
        ondrag = supportTouch ? "touchmove" : "mousemove",
        onend = supportTouch ? "touchend" : "mouseup";
    //在元素标签上添加ms-drag="dragcallback" 就能用了，dragcallback为你在VM在定义的函数，它会在拖动时执行它
    //更在制定请在同一元素上设置data-*来制定，其中
    //data-axis="x" //值可以为x, y, xy，"", 没有设置值默认为xy, x为水平移移动，y为垂直移动, xy任意移动，""不给移
    //data-containment="parent" //值可以为window, document, parent，设置拖动的范围，没有设置就没有限制
    //data-movable="true|false"， 没有设置值默认为true，是否让框架帮你移动，否则自己在dragcallback中移动
    //data-dragstart="callback", 开始拖动时执行的回调 callback为VM的某个函数
    //data-dragend="callback", 结束拖动时执行的回调
    //所有回调都有两个参数，event与data，data包含你所有data=*属性，与top, left, range, el, $el等属性
    var draggable = avalon.bindingHandlers.drag = function(meta, scopes) {
        var el = meta.element;
        var $el = avalon(el);
        var data = $el.data();

        var axis = data.axis;
        if (axis !== "" && !/^(x|y|xy)$/.test(axis)) {
            data.axis = "xy";
        }

        function get(name) {
            var ret;
            for (var i = 0, scope; scope = scopes[i++];) {
                if (scope.hasOwnProperty(name)) {
                    ret = scope[name];
                    break;
                }
            }
            return ret;
        }
        data.drag = get(meta.value) || avalon.noop;
        data.dragstart = get(data.dragstart || "") || avalon.noop;
        data.dragend = get(data.dragend || "") || avalon.noop;
        data.movable = data.movable !== false;
        data.el = el;
        data.$el = $el;
        $el.bind(onstart, function(event) {
            setDragRange(data);
            var offset = $el.offset();
            data.startX = event.pageX;
            data.startY = event.pageY;
            data.originalX = offset.left;
            data.originalY = offset.top;
            if (el.setCapture) { //设置鼠标捕获
                el.setCapture();
            } else if (window.captureEvents) {
                window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
            }
            draggable.queue.push(data);
            data.dragstart.call(data.el, event, data);
        });
    };
    draggable.queue = [];
    draggable.underway = [];
    draggable.dropscene = [];

    function drag(event) {
        draggable.queue.forEach(function(data) {
            //当前元素移动了多少距离
            data.deltaX = event.pageX - data.startX;
            data.deltaY = event.pageY - data.startY;
            //现在的坐标
            data.offsetX = data.deltaX + data.originalX;
            data.offsetY = data.deltaY + data.originalY;
            if (data.axis.indexOf("x") !== -1) { //如果没有锁定X轴left,top,right,bottom
                var left = data.range ? Math.min(data.range[2], Math.max(data.range[0], data.offsetX)) : data.offsetX;
                if (data.movable) data.el.style.left = left + "px";
                data.left = left;
            }
            if (data.axis.indexOf("y") !== -1) { //如果没有锁定Y轴
                var top = data.range ? Math.min(data.range[3], Math.max(data.range[1], data.offsetY)) : data.offsetY;
                if (data.movable) {
                    console.log("xxxxxxx")
                    data.el.style.top = top + "px";
                }
                data.top = top;
            }
            data.drag.call(data.el, event, data);
        });
    }

    function dragEnd(event) {
        draggable.queue.forEach(function(data) {
            if (data.el.releaseCapture) {
                data.el.releaseCapture();
            } else if (window.releaseEvents) {
                window.releaseEvents(Event.MOUSEMOVE | Event.MOUSEUP);
            }
            data.dragend.call(data.el, event, data);
        });
        draggable.queue.length = 0;

    }
    draggable.underway.push(drag);
    draggable.dropscene.push(dragEnd);

    function setDragRange(data) {
        var range = data.containment; //处理区域鬼拽,确认可活动的范围
        var node = data.el;
        var isDoc = range === "document";
        if (range) {
            if (Array.isArray(range) && range.length === 4) { //如果传入的是坐标 [x1,y1,x2,y2] left,top,right,bottom
                data.range = range;
            } else {
                if (range === "parent") { //如果是parent参数
                    range = node.parentNode;
                }
                if (isDoc || range === "window") { //如果是document|window参数
                    if (isDoc) {
                        data.range = [0, 0];
                    } else {
                        data.range = "pageXOffset" in window ? [window.pageXOffset, window.pageXOffset] : [root.scrollLeft, root.scrollTop];
                    }
                    data.range[2] = data.range[0] + avalon(isDoc ? document : window).width();
                    data.range[3] = data.range[1] + avalon(isDoc ? document : window).height();
                } else { //如果是元素节点(比如从parent参数转换地来),或者是CSS表达式,或者是mass对象
                    var c = avalon(range);
                    var offset = c.offset();
                    data.range = [offset.left + parseFloat(c.css("borderLeftWidth")), offset.top + parseFloat(c.css("borderTopWidth"))];
                    data.range[2] = data.range[0] + range.offsetWidth;
                    data.range[3] = data.range[1] + range.offsetHeight;
                }
            }
        }
    }
    //使用事件代理提高性能
    root.bind(ondrag, function(e) {
        !+"\v1" ? document.selection.empty() : window.getSelection().removeAllRanges();
        for (var i = 0, fn; fn = draggable.underway[i++];) {
            var ret = fn(e);
        }
        return ret;
    });
    root.bind(onend, function(e) {
        for (var i = 0, fn; fn = draggable.dropscene[i++];) {
            var ret = fn(e);
        }
        return ret;
    });

})(window.avalon);