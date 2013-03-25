//=========================================
// 动画模块 v7 IE10+
//==========================================
define("fx", ["css", "event", "attr"], function($) {
    var easingMap = {
        "linear": {p1: 0.250, p2: 0.250, p3: 0.750, p4: 0.750},
        "ease": {p1: 0.250, p2: 0.100, p3: 0.250, p4: 1.000},
        "ease-in": {p1: 0.420, p2: 0.000, p3: 1.000, p4: 1.000},
        "ease-out": {p1: 0.000, p2: 0.000, p3: 0.580, p4: 1.000},
        "ease-in-out": {p1: 0.420, p2: 0.000, p3: 0.580, p4: 1.000},
        "easeInQuad": {p1: 0.550, p2: 0.085, p3: 0.680, p4: 0.530},
        "easeInCubic": {p1: 0.550, p2: 0.055, p3: 0.675, p4: 0.190},
        "easeInQuart": {p1: 0.895, p2: 0.030, p3: 0.685, p4: 0.220},
        "easeInQuint": {p1: 0.755, p2: 0.050, p3: 0.855, p4: 0.060},
        "easeInSine": {p1: 0.470, p2: 0.000, p3: 0.745, p4: 0.715},
        "easeInExpo": {p1: 0.950, p2: 0.050, p3: 0.795, p4: 0.035},
        "easeInCirc": {p1: 0.600, p2: 0.040, p3: 0.980, p4: 0.335},
        "easeInBack": {p1: 0.600, p2: -0.280, p3: 0.735, p4: 0.045},
        "easeOutQuad": {p1: 0.250, p2: 0.460, p3: 0.450, p4: 0.940},
        "easeOutCubic": {p1: 0.215, p2: 0.610, p3: 0.355, p4: 1.000},
        "easeOutQuart": {p1: 0.165, p2: 0.840, p3: 0.440, p4: 1.000},
        "easeOutQuint": {p1: 0.230, p2: 1.000, p3: 0.320, p4: 1.000},
        "easeOutSine": {p1: 0.390, p2: 0.575, p3: 0.565, p4: 1.000},
        "easeOutExpo": {p1: 0.190, p2: 1.000, p3: 0.220, p4: 1.000},
        "easeOutCirc": {p1: 0.075, p2: 0.820, p3: 0.165, p4: 1.000},
        "easeOutBack": {p1: 0.175, p2: 0.885, p3: 0.320, p4: 1.275},
        "easeInOutQuad": {p1: 0.455, p2: 0.030, p3: 0.515, p4: 0.955},
        "easeInOutCubic": {p1: 0.645, p2: 0.045, p3: 0.355, p4: 1.000},
        "easeInOutQuart": {p1: 0.770, p2: 0.000, p3: 0.175, p4: 1.000},
        "easeInOutQuint": {p1: 0.860, p2: 0.000, p3: 0.070, p4: 1.000},
        "easeInOutSine": {p1: 0.445, p2: 0.050, p3: 0.550, p4: 0.950},
        "easeInOutExpo": {p1: 1.000, p2: 0.000, p3: 0.000, p4: 1.000},
        "easeInOutCirc": {p1: 0.785, p2: 0.135, p3: 0.150, p4: 0.860},
        "easeInOutBack": {p1: 0.680, p2: -0.550, p3: 0.265, p4: 1.550},
        "custom": {p1: 0.000, p2: 0.350, p3: 0.500, p4: 1.300},
        "random": {p1: Math.random().toPrecision(3),
            p2: Math.random().toPrecision(3),
            p3: Math.random().toPrecision(3),
            p4: Math.random().toPrecision(3)
        }
    }; //single line array of all set easing values

    //http://css3playground.com/flip-card.php

    var prefixJS = $.cssName("animation").replace(/animation/i, "");
    var prefixCSS = prefixJS === "" ? "" : "-" + prefixJS.toLowerCase() + "-";
    var animationend = prefixJS === "Moz" ? "animationend" : prefixJS + "AnimationEnd";
    var playState = $.cssName("animation-play-state");
    var rfxnum = /^([+\-/*]=)?([\d+.\-]+)([a-z%]*)$/i;

    //=================================参数处理==================================

    function addCallbacks(nodes, method, properties, args) {
        //由于构建更高级的基于元素节点的复合动画
        var options = {
            effect: method
        };
        for (var i = 1; i < args.length; i++) {
            addOption(options, args[i]);
        }
        "before,after".replace($.rword, function(call) {
            options[call] = properties[call];
            delete properties[call];
        });
        return nodes.fx(properties, options);
    }

    function addOption(opts, p) {
        switch (typeof p) {
            case "object":
                delete p.props;
                $.mix(opts, p);
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
        opts.queue = !!(opts.queue == null || opts.queue); //默认使用列队
        opts.easing = easingMap[opts.easing] ? opts.easing : "ease-in";
        if ("specialEasing" in opts) {
            delete opts.specialEasing;
            $.log("不再支持specialEasing参数");
        }
        return opts;
    }

    //.fx( properties [, duration ] [, easing ] [, complete ] )
    //.fx( properties, options )
    //两种传参方式,最后都被整成后面一种
    $.fn.fx = function(props) {
        var delay = arguments.length == 1 && isFinite(props);
        if (!delay) {
            var opts = addOptions.apply(null, $.slice(arguments, 1));
            for (var name in props) {
                var p = $.cssName(name) || name;
                if (name !== p) {
                    props[p] = props[name]; //收集用于渐变的属性
                    delete props[name];
                }
            }
        }

        var id = setTimeout("1");
        return this.each(function(node) {
            if (node.nodeType === 1) {
                var data = $._data(node);
                var queue = data.fxQueue || (data.fxQueue = []);
                if (delay) {
                    queue.push(props);//放入时间
                } else {
                    queue.push([id, props, opts]);
                }
                if (queue.length === 1 || !opts.queue) {
                    nextAnimation(node, queue.shift(), queue)//?
                }
            }
        })
    }
    function nextAnimation(node, args, queue) {
        if (isFinite(args)) {
            setTimeout(function() {
                nextAnimation(node, queue.shift(), queue)
            }, args)
        } else if (Array.isArray(args)) {
            startAnimation(node, args[0], args[1], args[2]);
        }
    }
    var AnimationRegister = {};

    function startAnimation(node, id, props, opts) {
        var effectName = opts.effect;
        var className = "fx_" + effectName + id;
        var frameName = "keyframe_" + effectName + id;
        //这里可能要做某些处理, 比如隐藏元素想进行动画,处理要显示出来
        var hidden = $.css(node, "display") === "none";
        var preproccess = AnimationPreproccess[effectName]
        if (typeof preproccess === "function") {
            var ret = preproccess(node, hidden, props);
            if (ret === false) {
                return
            }
        }
        //各种回调
        var after = opts.after || $.noop;
        var before = opts.before || $.noop;
        var complete = opts.complete || $.noop;
        var from = [],
                to = [];
        var count = AnimationRegister[className];
        if (!count) {
            //如果样式表中不存在这两条样式规则
            count = AnimationRegister[className] = 0;
            $.each(props, function(val, key) {
                var selector = key.replace(/[A-Z]/g, function(a) {
                    return "-" + a.toLowerCase();
                });
                var parts;
                //处理show toggle hide三个特殊值
                if (val === "show" || (val === "toggle" && hidden)) {
                    from.push(selector + ":0" + ($.cssNumber[key] ? "" : "px"));
                } else if (val === "hide" || val === "toggle") { //hide
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
            var classRule = ".#{className}{ #{prefix}animation-duration: #{duration}; #{prefix}animation-name: #{frameName}; #{prefix}animation-fill-mode:#{mode};  }";
            var frameRule = "@#{prefix}keyframes #{frameName}{ 0%{ #{from}; } 100%{  #{to}; }  }";
            var rule1 = $.format(classRule, {
                className: className,
                duration: opts.duration,
                frameName: frameName,
                mode: effectName === "hide" ? "backwards" : "forwards",
                prefix: prefixCSS
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
            $(this).removeClass(className);
            $.unbind(this, animationend, fn);
            after(this);
            stopAnimation(event.animationName, className);
            complete.call(this);
        });
        before(node);
        $(node).addClass(className);
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
                after(node);
                if (overflows) {
                    ["", "X", "Y"].forEach(function(postfix, index) {
                        style["overflow" + postfix] = overflows[index];
                    });
                }
            };
        },
        toggle: function(node, hidden) {
            var fn = AnimationPreproccess[hidden ? "show" : "hide"];
            return fn.apply(null, arguments);
        }
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
                $.log("插入成功" + rule);
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

    function findKeyframeRuleEndText(ruleName) {
        //得到一条@keyframes样式规则的最后一帧的内容
        if (styleElement) {
            var sheet = styleElement.sheet || styleElement.styleSheet;
            var cssRules = sheet.cssRules || sheet.rules;
            for (var i = 0, n = cssRules.length; i < n; i++) {
                var rule = cssRules[i];
                if (rule.name === ruleName) {
                    for (var j = 0, CSSKeyframeRule; CSSKeyframeRule = rule.cssRules[j++]; ) {
                        if (CSSKeyframeRule.keyText === "100%") { //最得最后一帧
                            return CSSKeyframeRule.cssText;
                        }
                    }
                }
            }
        }
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
    ["toggle", "show", "hide"].forEach(function(name, i) {
        var pre = $.fn[name];
        $.fn[name] = function(a) {
            if (!arguments.length || typeof a === "boolean") {
                return pre.apply(this, arguments);
            } else {
                return addCallbacks(this, name, genFx(name, 3), arguments);
            }
        };
    });
    $.each(effects, function(props, method) {
        $.fn[method] = function() {
            return addCallbacks(this, method, props, arguments);
        };
    });

    function gotoEnd(el, cls) {
        //暂停动画,让它立即跑到结束帧
        if (/fx_\w+_\d+/.test(cls)) {
            var keyName = cls.replace("fx", "keyframe");
            var cssText = findKeyframeRuleEndText(keyName);
            if (typeof cssText === "string") {
                var txt = cssText.replace(/100%\s{/, "").replace(/}$/, "");
                //浏览器会智能去掉重复的样式
                el.style.cssText = el.style.cssText + txt;
                deleteCSSRule("." + cls);
                deleteKeyFrame(keyName);
                $(el).removeClass(cls)
            }
        }
    }

    //在当前帧暂停动画

    function pause(el, cls) {
        if (/fx_\w+_\d+/.test(cls)) {
            el.style[playState] = "paused"
        }
    }
    //如果clearQueue为true，是否清空列队
    //如果gotoEnd 为true，是否跳到此动画最后一帧
    $.fn.stop = function(clearQueue, gotoEnd) {
        clearQueue = clearQueue ? "1" : "";
        gotoEnd = gotoEnd ? "1" : "0";
        var stopCode = parseInt(clearQueue + gotoEnd, 2); //返回0 1 2 3
        $.log(stopCode)
        return this.each(function(node) {
            for (var j = 0, cls; cls = node.classList[j++]; ) {
                switch (stopCode) { //如果此时调用了stop方法
                    case 0:
                        pause(node, cls)
                        //中断当前动画，继续下一个动画
                        break;
                    case 1:
                        gotoEnd(node, cls);
                        break;
                }
            }
        });
    };
    $.fn.delay = function(number) {
        return this.fx(number)
    }

    $.fn.resume = function() {
        return this.each(function(el) {
            if (el.style[playState] === "paused") {
                el.style[playState] = "running"
            }
        });
    };

    return $;
});
//window.MozCSSKeyframeRule window.WebKitCSSKeyframeRule alert(window.CSSKeyframeRule )

//时钟动画 http://news.9ria.com/2013/0305/26345.html