//=========================================
// 动画模块 v7  Boneless IE10+等现代浏览器专用
//==========================================
define("fx", ["css", "event", "attr"], function($) {
    //提供以下原型方法
    //fx animate, fadeIn fadeToggle fadeOut slideUp, slideDown slideToggle show hide toggle delay resume stop
    var easingMap = {
        "linear": [0.250, 0.250, 0.750, 0.750],
        "ease": [0.250, 0.100, 0.250, 1.000],
        "easeIn": [0.420, 0.000, 1.000, 1.000],
        "easeOut": [0.000, 0.000, 0.580, 1.000],
        "easeInOut": [0.420, 0.000, 0.580, 1.000],
        "easeInQuad": [0.550, 0.085, 0.680, 0.530],
        "easeInCubic": [0.550, 0.055, 0.675, 0.190],
        "easeInQuart": [0.895, 0.030, 0.685, 0.220],
        "easeInQuint": [0.755, 0.050, 0.855, 0.060],
        "easeInSine": [0.470, 0.000, 0.745, 0.715],
        "easeInExpo": [0.950, 0.050, 0.795, 0.035],
        "easeInCirc": [0.600, 0.040, 0.980, 0.335],
        "easeInBack": [0.600, -0.280, 0.735, 0.045],
        "easeOutQuad": [0.250, 0.460, 0.450, 0.940],
        "easeOutCubic": [0.215, 0.610, 0.355, 1.000],
        "easeOutQuart": [0.165, 0.840, 0.440, 1.000],
        "easeOutQuint": [0.230, 1.000, 0.320, 1.000],
        "easeOutSine": [0.390, 0.575, 0.565, 1.000],
        "easeOutExpo": [0.190, 1.000, 0.220, 1.000],
        "easeOutCirc": [0.075, 0.820, 0.165, 1.000],
        "easeOutBack": [0.175, 0.885, 0.320, 1.275],
        "easeInOutQuad": [0.455, 0.030, 0.515, 0.955],
        "easeInOutCubic": [0.645, 0.045, 0.355, 1.000],
        "easeInOutQuart": [0.770, 0.000, 0.175, 1.000],
        "easeInOutQuint": [0.860, 0.000, 0.070, 1.000],
        "easeInOutSine": [0.445, 0.050, 0.550, 0.950],
        "easeInOutExpo": [1.000, 0.000, 0.000, 1.000],
        "easeInOutCirc": [0.785, 0.135, 0.150, 0.860],
        "easeInOutBack": [0.680, -0.550, 0.265, 1.550],
        "custom": [0.000, 0.350, 0.500, 1.300],
        "random": [Math.random().toFixed(3),
        Math.random().toFixed(3),
        Math.random().toFixed(3),
        Math.random().toFixed(3)]
    }

    //http://css3playground.com/flip-card.php
    var animation = $.cssName("animation"),
        animationend;
    var prefixJS = animation.replace(/animation/i, "");
    var prefixCSS = prefixJS === "" ? "" : "-" + prefixJS.toLowerCase() + "-";
    var eventName = {
        AnimationEvent: 'animationend',
        WebKitAnimationEventEvent: 'webkitAnimationEnd'
    };
    for (var name in eventName) {
        try {
            document.createEvent(name);
            animationend = eventName[name];
        } catch (e) {}
    }

    var playState = $.cssName("animation-play-state");
    var rfxnum = /^([+\-/*]=)?([\d+.\-]+)([a-z%]*)$/i;
    //=================================参数处理==================================

    function addOption(opts, p) {
        switch (typeof p) {
            case "object":
                $.mix(opts, p);
                delete p.props;
                break;
            case "number":
                opts.duration = p;
                break;
            case "string":
                opts.easing = p;
                break;
            case "function":
                opts.complete = p;
                break;
        }
    }

    function addOptions(duration) {
        var opts = {};
        //如果第二参数是对象
        for (var i = 1; i < arguments.length; i++) {
            addOption(opts, arguments[i]);
        }
        duration = opts.duration;
        duration = /^\d+(ms|s)?$/.test(duration) ? duration + "" : "1000ms";
        if (duration.indexOf("s") === -1) {
            duration += "ms";
        }

        opts.duration = duration;
        opts.effect = opts.effect || "fx";
        opts.queue = !! (opts.queue == null || opts.queue); //默认使用列队
        opts.easing = easingMap[opts.easing] ? opts.easing : "easeIn";
        if ("specialEasing" in opts) {
            delete opts.specialEasing;
            $.log("不再支持specialEasing参数");
        }
        return opts;
    }

    //.fx( properties [, duration ] [, easing ] [, complete ] )
    //.fx( properties, options )
    //两种传参方式,最后都被整成后面一种
    $.fn.animate = $.fn.fx = function(props) {
        var delay = arguments.length === 1 && isFinite(props);
        var opts = {
            queue: true
        };
        if (!delay) {
            opts = addOptions.apply(null, arguments);
            for (var name in props) {
                var p = $.cssName(name) || name;
                if (name !== p) {
                    props[p] = props[name]; //收集用于渐变的属性
                    delete props[name];
                }
            }
        }
        var id = setTimeout("1");
        return this.each(function(i, node) {
            if (node.nodeType === 1) {
                var data = $._data(node);
                var queue = data.fxQueue || (data.fxQueue = []);
                if (!opts.queue) { //如果不用排队
                    return startAnimation(node, id, props, opts);
                } else {
                    if (delay) {
                        queue.push(props); //放入时间
                    } else {
                        queue.push([id, props, opts]);
                    }
                    nextAnimation(node, queue); //开始动画
                }
            }
        });
    };

    function nextAnimation(node, queue) {
        if (!queue.busy) {
            queue.busy = 1;
            var args = queue.shift();
            if (isFinite(args)) {
                setTimeout(function() {
                    queue.busy = 0;
                    nextAnimation(node, queue);
                }, args);
            } else if (Array.isArray(args)) {
                startAnimation(node, args[0], args[1], args[2]);
            } else {
                queue.busy = 0;
            }
        }
    }
    var AnimationRegister = {};

    function startAnimation(node, id, props, opts) {
        var effectName = opts.effect;
        var className = "fx_" + effectName + "_" + id;
        var frameName = "keyframe_" + effectName + "_" + id;
        //这里可能要做某些处理, 比如隐藏元素想进行动画,处理要显示出来
        var hidden = $.css(node, "display") === "none";
        var preproccess = AnimationPreproccess[effectName];
        if (typeof preproccess === "function") {
            var ret = preproccess(node, hidden, props, opts);
            if (ret === false) {
                return;
            }
        }
        //各种回调
        var after = opts.after || $.noop;
        var before = opts.before || $.noop;
        var complete = opts.complete || $.noop;
        var from = [],
            to = [];
        //让一组元素共用同一个类名
        var count = AnimationRegister[className];
        node[className] = props;
        if (!count) {
            //如果样式表中不存在这两条样式规则
            count = AnimationRegister[className] = 0;

            $.each(props, function(key, val) {
                var selector = key.replace(/[A-Z]/g, function(a) {
                    return "-" + a.toLowerCase();
                });
                var parts;
                //处理show toggle hide三个特殊值
                if (val === "toggle") {
                    val = hidden ? "show" : "hide";
                }
                if (val === "show") {
                    from.push(selector + ":0" + ($.cssNumber[key] ? "" : "px"));
                } else if (val === "hide") { //hide
                    to.push(selector + ":0" + ($.cssNumber[key] ? "" : "px"));
                } else if (parts = rfxnum.exec(val)) {
                    var delta = parseFloat(parts[2]);
                    var unit = $.cssNumber[key] ? "" : (parts[3] || "px");
                    if (parts[1]) { //操作符
                        var operator = parts[1].charAt(0);
                        var init = parseFloat($.css(node, key));
                        try {
                            delta = eval(init + operator + delta);
                        } catch (e) {
                            $.error("使用-=/+=进行递增递减操作时,单位只能为px, deg", TypeError);
                        }
                    }
                    to.push(selector + ":" + delta + unit);
                } else {
                    to.push(selector + ":" + val);
                }
            });
            //linear：线性过渡。等同于贝塞尔曲线(0.0, 0.0, 1.0, 1.0)
            //ease：平滑过渡。等同于贝塞尔曲线(0.25, 0.1, 0.25, 1.0)
            //ease-in： 由慢到快。等同于贝塞尔曲线(0.42, 0, 1.0, 1.0)
            //ease-out：由快到慢。等同于贝塞尔曲线(0, 0, 0.58, 1.0)
            //ease-in-out：由慢到快再到慢。等同于贝塞尔曲线(0.42, 0, 0.58, 1.0)
            //cubic-bezier(<number>, <number>, <number>, <number>)：特定的贝塞尔曲线类型，4个数值需在[0, 1]区间内
            var easing = "cubic-bezier( " + easingMap[opts.easing] + " )";
            var classRule = ".#{className}{ #{prefix}animation: #{frameName} #{duration} #{easing} #{count} #{direction}; #{prefix}animation-fill-mode:#{mode}  }";
            var frameRule = "@#{prefix}keyframes #{frameName}{ 0%{ #{from}; } 100%{  #{to}; }  }";
            var mode = effectName === "hide" ? "backwards" : "forwards";
            var rule1 = $.format(classRule, {
                className: className,
                duration: opts.duration,
                easing: easing,
                frameName: frameName,
                mode: mode,
                prefix: prefixCSS,
                count: opts.revert ? 2 : 1,
                direction: opts.revert ? "alternate" : ""
            });
            var rule2 = $.format(frameRule, {
                frameName: frameName,
                prefix: prefixCSS,
                from: from.join("; "),
                to: to.join(";")
            });
            insertCSSRule(rule1);
            insertCSSRule(rule2);
        }
        AnimationRegister[className] = count + 1;
        $.bind(node, animationend, function fn(event) {
            $.unbind(this, event.type, fn);
            var styles = window.getComputedStyle(node, null);
            // 保存最后的样式
            for (var i in props) {
                if (props.hasOwnProperty(i)) {
                    node.style[i] = styles[i];
                }
            }
            $(node).removeClass(className); //移除类名
            stopAnimation(className); //尝试移除keyframe
            after(node);
            complete(node);
            var queue = $._data(node, "fxQueue");
            if (opts.queue && queue) { //如果在列状,那么开始下一个动画
                queue.busy = 0;
                nextAnimation(node, queue);
            }
        });
        before(node);
        $(node).addClass(className);
    }

    function stopAnimation(className) {
        var count = AnimationRegister[className];
        if (count) {
            AnimationRegister[className] = count - 1;
            if (AnimationRegister[className] <= 0) {
                var frameName = className.replace("fx", "keyframe");
                deleteKeyFrame(frameName);
                deleteCSSRule("." + className);
            }
        }
    }
    var AnimationPreproccess = {
        show: function(node, hidden, props) {
            if (hidden) {
                var display = $.parseDisplay(node.nodeName);
                node.style.display = display;
                if ("width" in props || "height" in props) { //如果是缩放操作
                    if (display === "inline" && $.css(node, "float") === "none") {
                        node.style.display = "inline-block";
                    }
                }
            }
        },
        hide: function(node, hidden, props, opts) {
            if (hidden) {
                return false;
            }
            var style = node.style,
                overflows;
            if ("width" in props || "height" in props) { //如果是缩放操作
                //确保内容不会溢出,记录原来的overflow属性，因为IE在改变overflowX与overflowY时，overflow不会发生改变
                overflows = [style.overflow, style.overflowX, style.overflowY];
                style.overflow = "hidden";
            }
            var after = opts.after || $.noop;
            opts.after = function(node) {
                node.style.display = "none";
                if (overflows) {
                    ["", "X", "Y"].forEach(function(postfix, index) {
                        style["overflow" + postfix] = overflows[index];
                    });
                }
                after(node);
            };
        },
        toggle: function(node, hidden) {
            var fn = AnimationPreproccess[hidden ? "show" : "hide"];
            return fn.apply(null, arguments);
        }
    };
    //========================样式规则相关辅助函数==================================

    var styleElement;

    function insertCSSRule(rule) {
        //动态插入一条样式规则
        if (styleElement) {
            var number = 0;
            try {
                var sheet = styleElement.sheet || styleElement.styleSheet;
                var cssRules = sheet.cssRules || sheet.rules;
                number = cssRules.length;
                sheet.insertRule(rule, number);
            } catch (e) {
                $.log(e.message + rule);
            }
        } else {
            styleElement = document.createElement("style");
            styleElement.innerHTML = rule;
            document.head.appendChild(styleElement);
        }
    }

    function deleteCSSRule(ruleName, keyframes) {
        //删除一条样式规则
        var prop = keyframes ? "name" : "selectorText";
        var name = keyframes ? "@keyframes " : "cssRule ";
        if (styleElement) {
            var sheet = styleElement.sheet || styleElement.styleSheet;
            var cssRules = sheet.cssRules || sheet.rules;
            for (var i = 0, n = cssRules.length; i < n; i++) {
                var rule = cssRules[i];
                if (rule[prop] === ruleName) {
                    sheet.deleteRule(i);
                    $.log("已经成功删除" + name + " " + ruleName);
                    break;
                }
            }
        }
    }

    function deleteKeyFrame(frameName) {
        //删除一条@keyframes样式规则
        deleteCSSRule(frameName, true);
    }
    //=============================各种合成动画==================================
    var fxAttrs = [
        ["height", "marginTop", "marginBottom", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"],
        ["width", "marginLeft", "marginRight", "borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"],
        ["opacity"]
    ];

    function genFx(type, num) { //生成属性包
        var obj = {};
        fxAttrs.concat.apply([], fxAttrs.slice(0, num)).forEach(function(name) {
            obj[name] = type;
        });
        return obj;
    }

    var effects = {
        slideDown: genFx("show", 1),
        slideUp: genFx("hide", 1),
        slideToggle: genFx("toggle", 1),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    };

    $.each(effects, function(method, props) {
        $.fn[method] = function() {
            var args = [].concat.apply([props, {
                effect: method
            }], arguments);
            return $.fn.fx.apply(this, args);
        };
    });
    ["toggle", "show", "hide"].forEach(function(name, i) {
        var pre = $.fn[name];
        $.fn[name] = function(a) {
            if (!arguments.length || typeof a === "boolean") {
                return pre.apply(this, arguments);
            } else {
                var args = [].concat.apply([genFx(name, 3), {
                    effect: name
                }], arguments);
                return $.fn.fx.apply(this, args);
            }
        };
    });
    //=============================stop delay pause resume========================
    var duration = $.cssName("animation-duration");
    //如果clearQueue为true，是否清空列队
    //如果gotoEnd 为true，是否跳到此动画最后一帧
    $.fn.stop = function(clearQueue, gotoEnd) {
        var classNames = {};
        this.each(function(i, node) {
            var queue = $._data(node, "fxQueue");
            for (var j = 0, cls; cls = node.classList[j++];) {
                if (/fx_\w+_\d+/.test(cls)) {
                    classNames[cls] = "mass";
                    node.style[playState] = "paused";
                    if (gotoEnd) {
                        node.style[duration] = "1ms";
                        node.style[playState] = "running";
                    }
                    var names = node[cls];
                    var styles = window.getComputedStyle(node, null);
                    for (var name in names) {
                        node.style[name] = styles[name];
                    }
                    if (clearQueue) {
                        queue.length = 0;
                    }
                    node.style[playState] = "running";
                    node.classList.remove(cls);
                    delete node[cls];
                    queue.busy = 0;
                    nextAnimation(node, queue)
                }
            }
        });
        for (var name in classNames) {
            if (classNames[name] === "mass") {
                stopAnimation(name);
            }
        }
        return this;
    };
    $.fn.delay = function(number) {
        return this.fx(number);
    };
    $.fn.pause = function() {
        return this.each(function() {
            this.style[playState] = "paused";
        });
    };
    $.fn.resume = function() {
        return this.each(function() {
            this.style[playState] = "running";
        });
    };
    return $;
});
//window.MozCSSKeyframeRule window.WebKitCSSKeyframeRule alert(window.CSSKeyframeRule )

//时钟动画 http://news.9ria.com/2013/0305/26345.html