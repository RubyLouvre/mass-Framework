(function(avalon) {
//http://www.bootcss.com/p/bootstrap-switch/
//判定是否触摸界面
    var isTouch = "ontouchstart" in window || "onmsgesturechange" in window;
    var defaults = {
        animate: false,
        distance: 0,
        max: 100,
        min: 0,
        orientation: "horizontal",
        range: false,
        step: 1,
        value: 0,
        values: null
    }


    avalon.ui["slider"] = function(element, id, opts) {
        var $element = avalon(element);
        var options = avalon.mix({}, defaults);

        options = avalon.mix(options, opts);
        var orientation = $element.data("orientation") || options.orientation;//"vertical" ? "vertical" : "horizontal";
        var isHorizontal = orientation === "horizontal";

        //将整个slider划分为N等分, 比如100, 227
        var valueMin = $element.data("min") || options.min;
        var valueMax = $element.data("max") || options.max;
        var step = $element.data("step") || options.step;
        var oRange = $element.data("range") || options.range;//true min max
        var values = $element.data("values") || options.values;
        //处理
        var value = $element.data("value") || options.value;//第几等份
        var model; //ViewModel;
        if (oRange === "min" && values) {
            var value = values[0];
        } else if (oRange === "max" && values) {
            value = values[1];
        }
        if (oRange === true) {
            if (Array.isArray(values)) {
                values = values.length === 1 ? [values[0], values[0]] : values.concat();
            } else {
                values = [valueMin, valueMax];
            }
        }
        //   avalon.log("values  " + values)
        //   avalon.log("valueMin " + valueMin);
        //   avalon.log(typeof values)
        //   avalon.log("valueMax " + valueMax);
        //   avalon.log("range " + oRange);
        $element.addClass("ui-slider").addClass(" ui-slider-" + orientation)
                .addClass("ui-widget").addClass("ui-widget-content").addClass("ui-corner-all");
        var rangeDIV = document.createElement("div");
        avalon(rangeDIV).addClass("ui-slider-range").addClass("ui-widget-header").addClass("ui-corner-all");
        element.appendChild(rangeDIV);
        if (oRange === "min" || oRange === "max") {
            avalon(rangeDIV).addClass(" ui-slider-range-" + oRange);
        }
        var handlers = [];//拖柄
        //创建拖柄
        rangeDIV.innerHTML = "<a class='ui-slider-handle ui-state-default ui-corner-all' href='###' ></a>";
        handlers.push(rangeDIV.firstChild);
        element.appendChild(handlers[0]);
        if (oRange === true) {
            rangeDIV.innerHTML = "<a class='ui-slider-handle ui-state-default ui-corner-all' href='###'></a>";
            handlers.push(rangeDIV.firstChild);
            element.appendChild(handlers[1]);
        }
        function _trimAlignValue(val) {
            if (val <= valueMin) {
                return valueMin;
            }
            if (val >= valueMax) {
                return valueMax;
            }
            var step = (step > 0) ? step : 1,
                    valModStep = (val - valueMin) % step,
                    alignValue = val - valModStep;
            if (Math.abs(valModStep) * 2 >= step) {
                alignValue += (valModStep > 0) ? step : (-step);
            }
            return parseFloat(alignValue.toFixed(5));
        }

        function _refreshRange() {
            var valPercent, lastValPercent;
            if (oRange === true) {
                handlers.forEach(function(handler, i) {
                    valPercent = (values[i] - valueMin) / (valueMax - valueMin) * 100;
                    handler.style[ isHorizontal ? "left" : "bottom" ] = valPercent + "%";
                    if (oRange === true) {
                        if (isHorizontal) {
                            if (i === 0) {
                                rangeDIV.style.left = valPercent + "%";
                            }
                            if (i === 1) {
                                rangeDIV.style.width = (valPercent - lastValPercent) + "%";
                            }
                        } else {
                            if (i === 0) {
                                rangeDIV.style.bottom = valPercent + "%";
                            }
                            if (i === 1) {
                                rangeDIV.style.height = (valPercent - lastValPercent) + "%";
                            }
                        }
                    }
                    lastValPercent = valPercent;
                });
            } else {
                valPercent = (valueMax !== valueMin) ? (model.value - valueMin) / (valueMax - valueMin) * 100 : 0;

                handlers[0].style[ isHorizontal ? "left" : "bottom" ] = valPercent + "%";
                if (oRange === "min" && isHorizontal) {
                    rangeDIV.style.width = valPercent + "%";
                }
                if (oRange === "max" && isHorizontal) {
                    rangeDIV.style.width = (100 - valPercent) + "%";
                }
                if (oRange === "min" && !isHorizontal) {
                    rangeDIV.style.height = valPercent + "%";
                }
                if (oRange === "max" && !isHorizontal) {
                    rangeDIV.style.height = (100 - valPercent) + "%";
                }
            }
        }

        var disabled = $element.data("disabled") === true;

        //各种绑定
        $element.attr("ms-class-ui-state-disabled", "disabled");
        model = avalon.define(id, function(vm) {
            vm.disabled = disabled;
            vm.value = value || 0;
        });


        avalon.nextTick(function() {
            _refreshRange();
            element.setAttribute("ms-important", id);
            avalon.scan(element.parentNode, model);

            var dragEvent = isTouch ? "touchmove" : "mousemove";
            var dragendEvent = isTouch ? "touchend" : "mouseup";
            var pixelTotal = isHorizontal ? element.offsetWidth : element.offsetHeight;
            var moving = false, Index, lastValue;
            avalon(document).bind(isTouch ? "touchstart" : "mousedown", function(e) {
                if (!model.disabled) {
                    Index = handlers.indexOf(e.target);
                    avalon(handlers[Index]).addClass("ui-state-active")
                    if (Index >= 0) {
                        moving = true;
                    }
                    e.preventDefault();
                }
            });
            function drag(e) {
                var pixelMouse = 0;
                if (isHorizontal) {
                    pixelMouse = (isTouch ? e.targetTouches[0].pageX : e.pageX) - $element.offset().left;
                } else {
                    pixelMouse = (isTouch ? e.targetTouches[0].pageY : e.pageY) - $element.offset().top;
                }

                var percentMouse = (pixelMouse / pixelTotal);//求出当前handler在slider的位置

                if (percentMouse > 1) {
                    percentMouse = 1;
                }
                if (percentMouse < 0) {
                    percentMouse = 0;
                }
                if (!isHorizontal) {
                    percentMouse = 1 - percentMouse;
                }
                var valueTotal = valueMax - valueMin;
                var valueMouse = valueMin + percentMouse * valueTotal;//转换为等份值
                valueMouse = _trimAlignValue(valueMouse);

                if (lastValue !== void 0) {
                    if (Math.abs(valueMouse - lastValue) <= step) {
                        return;
                    }
                }
                if (oRange === true) {
                    lastValue = values[Index] = valueMouse;
                    model.value = values.join(",")
                } else {
                    lastValue = model.value = valueMouse;//转换为百分比
                }

                _refreshRange();
            }
            avalon(element).bind("click", function(e) {
                Index = 0;
                drag(e);
            })
            avalon(document).bind(dragEvent, function(e) {
                if (moving) {
                    drag(e);
                }
            });
            avalon(document).bind(dragendEvent, function(e) {
                if (moving) {
                    avalon(handlers[Index]).removeClass("ui-state-active")
                    moving = false;
                    e.preventDefault();
                }
            });
        });
    };

})(self.avalon);