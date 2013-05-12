(function(avalon) {
    //判定是否触摸界面
    var isTouch = "ontouchend" in document;
    avalon.ui["switch"] = function(element, id, opts) {
        var onLabel = "ON";
        var offLabel = "OFF";
        var classList = element.className,
            sizeClass = "";
        var sizeOne = avalon.oneObject("switch-mini, switch-small, switch-large");

        classList.replace(/[\n\t]/g, " ").replace(avalon.rword, function(a) {
            if (sizeOne[a]) {
                sizeClass = a; //取得负责尺寸的类名
            }
        });
        var $element = avalon(element);
        $element.addClass("switch").addClass("has-switch");

        //data-on="info" data-off="success" 决定这两个按钮的显示样式
        var onColor = $element.data("on") || "";
        if (onColor) {
            onColor = "switch-" + onColor;
        }
        var offColor = $element.data("off") || "";
        if (offColor) {
            offColor = "switch-" + offColor;
        }
        //data-on-label data-on-label决定这两个按钮的文本
        var data = $element.data("onLabel");
        if (data) {
            onLabel = data;
        }
        var data = $element.data("offLabel");
        if (data) {
            offLabel = data;
        }
        //创建switch控件的正身，它有两个span一个label组成。
        var leftSpan = document.createElement("span");
        avalon(leftSpan).addClass("switch-left").addClass(sizeClass).addClass(onColor);
        leftSpan.innerHTML = onLabel;

        var rightSpan = document.createElement("span");
        avalon(rightSpan).addClass("switch-right").addClass(sizeClass).addClass(offColor);
        rightSpan.innerHTML = offLabel;

        var label = document.createElement("label");
        avalon(label).addClass(sizeClass);
        label.innerHTML = "&nbsp;";
        //这个DIV用于把里面的东西左右移动
        var wrapper = document.createElement("div"),
            node, input;
        while (node = element.firstChild) {
            if (node.tagName === "INPUT") {
                input = node;
            }
            wrapper.appendChild(node);
        }
        if (!input) {
            input = document.createElement("input");
            input.type = "checkbox";
            input.checked = true;
            wrapper.appendChild(input);
        }
        wrapper.insertBefore(rightSpan, wrapper.firstChild);
        wrapper.insertBefore(label, wrapper.firstChild);
        wrapper.insertBefore(leftSpan, wrapper.firstChild);
        label.htmlFor = input.id;

        var animated = $element.data("animated") !== false;
        var disabled = input.disabled;

        var checked = !! input.checked;
        //各种绑定
        wrapper.setAttribute("ms-class-switch-animate", "animated");
        wrapper.setAttribute("ms-class-switch-on", "checked");
        wrapper.setAttribute("ms-class-switch-off", "!checked");
        element.setAttribute("ms-class-deactivate", "disabled");
        leftSpan.setAttribute("ms-click", "changeStatus");
        rightSpan.setAttribute("ms-click", "changeStatus");
        input.setAttribute("ms-checked", "checked");
        var model = avalon.define(id, function(vm) {
            vm.disabled = disabled === true;
            vm.checked = checked;
            vm.animated = animated;
            vm.changeStatus = function() {
                if (!vm.disabled) {
                    vm.checked = !vm.checked;
                }
            };
            vm.$watch("checked", function(e) {
                avalon(wrapper).css("left", "");
            });
        });
        avalon.nextTick(function() {
            element.appendChild(wrapper);

            avalon.scan(element.parentNode, model);

            var dragEvent = isTouch ? "touchmove" : "mousemove";
            var dragendEvent = isTouch ? "touchend" : "mouseup";
            var moving = false;
            avalon(label).bind(isTouch ? "touchstart" : "mousedown", function(e) {
                if (!model.disabled) {
                    model.animated = false;
                    moving = true;
                    e.preventDefault();
                }
            });
            avalon(label).bind(dragEvent, function(e) {
                if (moving) {
                    var relativeX = (isTouch ? e.targetTouches[0].pageX : e.pageX) - $element.offset().left;
                    var percent = (relativeX / $element.width()) * 100;
                    var left = 25;
                    var right = 75;
                    if (percent < left) {
                        percent = left;
                    } else if (percent > right) {
                        percent = right;
                    }
                    avalon(wrapper).css('left', (percent - right) + "%");
                }
            });
            avalon(label).bind(dragendEvent, function(e) {
                if (moving) {
                    moving = false;
                    e.preventDefault();
                    model.animated = true;
                    model.checked = (parseInt(avalon(wrapper).css('left')) < -25);
                }
            });
        });
    };

})(self.avalon);