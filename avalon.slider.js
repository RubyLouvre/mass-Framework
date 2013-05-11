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


    avalon.ui["slider"] = function(element, id) {
        var $element = avalon(element);
        var options = avalon.mix({}, defaults);
        avalon.mix(options, $element.data());
        var isHorizontal = options.orientation === "horizontal";
        //将整个slider划分为N等分, 比如100, 227
        var valueMin = options.min;
        var valueMax = options.max;
        var step = options.step;
        var oRange = options.range; //true min max
        var values = options.values;
        var twohandlebars = oRange === true;
        //处理
        var value = options.value; //第几等份
        var model; //ViewModel;
        if (oRange === "min" && values) {
            var value = values[0];
        } else if (oRange === "max" && values) {
            value = values[1];
        }
        if (twohandlebars) {
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
        //ui-slider ui-slider-horizontal ui-widget ui-widget-content ui-corner-all
        $element.addClass("ui-slider").addClass(" ui-slider-" + options.orientation)
            .addClass("ui-widget").addClass("ui-widget-content").addClass("ui-corner-all");
        var rangeDIV = document.createElement("div");
        avalon(rangeDIV).addClass("ui-slider-range").addClass("ui-widget-header").addClass("ui-corner-all");
        element.appendChild(rangeDIV);
        if (oRange === "min" || oRange === "max") {
            avalon(rangeDIV).addClass(" ui-slider-range-" + oRange);
        }
        var handlers = []; //拖柄
        //创建拖柄
        var handleHTML = "<a class='ui-slider-handle ui-state-default ui-corner-all' ms-hover='ui-state-hover' href='javascript:void(0)' ></a>";
        for (var i = 0, n = twohandlebars ? 2 : 1; i < n; i++) {
            rangeDIV.innerHTML = handleHTML;
            handlers.push(rangeDIV.firstChild);
            element.appendChild(handlers[i]);
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
            if (twohandlebars) {
                handlers.forEach(function(handler, i) {
                    valPercent = (values[i] - valueMin) / (valueMax - valueMin) * 100;
                    handler.style[isHorizontal ? "left" : "bottom"] = valPercent + "%";
                    if (twohandlebars) {
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

                handlers[0].style[isHorizontal ? "left" : "bottom"] = valPercent + "%";
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

        var disabled = $element.data("disabled") === false;

        //各种绑定
        $element.attr("ms-class-ui-state-disabled", "disabled");
        model = avalon.define(id, function(vm) {
            vm.disabled = disabled;
            vm.value = value || 0;
        });


        avalon.nextTick(function() {
            _refreshRange();

            avalon.scan(element.parentNode, model);

            var dragEvent = isTouch ? "touchmove" : "mousemove";
            var dragendEvent = isTouch ? "touchend" : "mouseup";
            var pixelTotal = isHorizontal ? element.offsetWidth : element.offsetHeight;
            var moving = false,
                Index, lastValue;
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
            var uiLeft = $element.offset().left;
            var uiTop = $element.offset().top;
            var pixels;
            if (twohandlebars) {
                if (isHorizontal) {
                    pixels = [avalon(handlers[0]).offset().left - uiLeft, avalon(handlers[1]).offset().left - uiLeft]
                } else {
                    pixels = [avalon(handlers[0]).offset().top - uiTop, avalon(handlers[1]).offset().top - uiTop]
                }
            }

            function drag(e) {
                var pixelMouse = 0;
                if (isHorizontal) { //水平，垂直
                    pixelMouse = (isTouch ? e.targetTouches[0].pageX : e.pageX) - uiLeft;
                } else {
                    pixelMouse = (isTouch ? e.targetTouches[0].pageY : e.pageY) - uiTop;
                }

                if (twohandlebars) { //水平时，小的0在左边，大的1在右边，垂直时，大的0在下边，小的1在上边
                    if (isHorizontal) {
                        if (Index === 0) {
                            if (pixelMouse > pixels[1]) {
                                pixelMouse = pixels[1]
                            }
                            pixels[0] = pixelMouse;
                        } else {
                            if (pixelMouse < pixels[0]) {
                                pixelMouse = pixels[0]
                            }
                            pixels[1] = pixelMouse
                        }
                    } else {
                        if (Index === 0) {
                            if (pixelMouse < pixels[1]) {
                                pixelMouse = pixels[1]
                            }
                            pixels[0] = pixelMouse
                        } else {
                            if (pixelMouse > pixels[0]) {
                                pixelMouse = pixels[0];
                            }
                            pixels[1] = pixelMouse;
                        }
                    }
                }
                var percentMouse = (pixelMouse / pixelTotal); //求出当前handler在slider的位置

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
                var valueMouse = valueMin + percentMouse * valueTotal; //转换为等份值
                valueMouse = _trimAlignValue(valueMouse);

                if (lastValue !== void 0) {
                    if (Math.abs(valueMouse - lastValue) <= step) {
                        return;
                    }
                }
                if (twohandlebars) {
                    lastValue = values[Index] = valueMouse;
                    model.value = values.join(",")
                } else {
                    lastValue = model.value = valueMouse; //转换为百分比
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
//http://xinranliu.me/?p=520
//http://www.w3cplus.com/css3/using-flexbox.html
//http://www.w3cplus.com/css3/css-generated-content-counters.html