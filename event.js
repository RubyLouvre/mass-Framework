//=========================================
// 事件系统 v9
//==========================================
define("event", window.dispatchEvent ? ["node"] : ["event_fix"], function($) {
    function safeActiveElement() {
        try {
            return document.activeElement;
        } catch (err) {
        }
    }
    var facade = $.event = {
        //对某种事件类型进行特殊处理
        special: {
            load: {//此事件不能冒泡
                noBubble: true
            },
            click: {//处理checkbox中的点击事件
                trigger: function() {
                    if (this.nodeName === "INPUT" && this.type === "checkbox" && this.click) {
                        this.click();
                        return false;
                    }
                }
            },
            focus: {//IE9-在不能聚焦到隐藏元素上,强制触发此事件会抛错
                trigger: function() {
                    if (this !== safeActiveElement() && this.focus) {
                        this.focus();
                        return false;
                    }
                },
                delegateType: "focusin"
            },
            blur: {
                trigger: function() { //blur事件的派发使用原生方法实现
                   if ( this === safeActiveElement() && this.blur ) {
                        this.blur();
                        return false;
                    }
                },
                delegateType: "focusout"
            },
            beforeunload: {
                postDispatch: function(event) {
                    if (event.result !== void 0) {
                        event.originalEvent.returnValue = event.result;
                    }
                }
            }
        },
        //对Mouse事件这一大类事件类型的事件对象进行特殊处理
        fixMouse: function(event, real) {
            if (event.type === "mousewheel") { //处理滚轮事件
                if ("wheelDelta" in real) { //统一为±120，其中正数表示为向上滚动，负数表示向下滚动
                    // http://www.w3help.org/zh-cn/causes/SD9015
                    var delta = real.wheelDelta;
                    //opera 9x系列的滚动方向与IE保持一致，10后修正
                    if (window.opera && opera.version() < 10)
                        delta = -delta;
                    event.wheelDelta = Math.round(delta); //修正safari的浮点 bug
                } else if ("detail" in real) {
                    event.wheelDelta = -real.detail * 40; //修正FF的detail 为更大众化的wheelDelta
                }
            }
        }
    },
    eventHooks = facade.special,
            rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
            rtypenamespace = /^([^.]*)(?:\.(.+)|)$/,
            mouseEvents = "contextmenu,click,dblclick,mouseout,mouseover,mouseenter,mouseleave,mousemove,mousedown,mouseup,mousewheel,",
            types = mouseEvents + ",keypress,keydown,keyup," + "blur,focus,focusin,focusout," + "abort,error,load,unload,resize,scroll,change,input,select,reset,submit"; //input
    var eventMap = $.eventMap = $.oneObject(mouseEvents, "Mouse");
    $.eventSupport = function(eventName, el) {
        el = el || $.html; //此方法只能检测元素节点对某种事件的支持，并且只能检测一般性的事件，对于像表单事件，需要传入input元素进行检测
        eventName = "on" + eventName;
        var ret = eventName in el;
        if (el.setAttribute && !ret) {
            el.setAttribute(eventName, "");
            ret = typeof el[eventName] === "function";
            el.removeAttribute(eventName);
        }
        el = null;
        return ret;
    };

    function Event(src, props) {
        if (!(this instanceof $.Event)) {
            return new Event(src, props);
        }
        this.originalEvent = {}; //保存原生事件对象
        if (src && src.type) {
            this.originalEvent = src; //重写
            this.type = src.type;
        } else {
            this.type = src;
        }
        this.defaultPrevented = false;
        if (props) {
            $.mix(this, props);
        }
        this.timeStamp = new Date - 0;
    }
    ;
    Event.prototype = {
        toString: function() {
            return "[object Event]";
        },
        preventDefault: function() { //阻止默认行为
            this.defaultPrevented = true;
            var e = this.originalEvent;
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            e.returnValue = false;
            return this;
        },
        stopPropagation: function() { //阻止事件在DOM树中的传播
            var e = this.originalEvent;
            if (e && e.stopPropagation) {
                e.stopPropagation();
            } //propagationStopped的命名出自 http://opera.im/kb/userjs/
            e.cancelBubble = this.propagationStopped = true;
            return this;
        },
        stopImmediatePropagation: function() { //阻止事件在一个元素的同种事件的回调中传播
            this.isImmediatePropagationStopped = true;
            this.stopPropagation();
            return this;
        }
    };
    $.Event = Event;

    $.mix(facade, {
        add: function(elem, hash) {
            //用于绑定事件(包括自定义事件)
            //addEventListner API的支持情况:chrome 1+ FF1.6+ IE9+ opera 7+ safari 1+;
            //http://functionsource.com/post/addeventlistener-all-the-way-back-to-ie-6
            var elemData = $._data(elem),
                    //取得对应的缓存体
                    types = hash.type,
                    //原有的事件类型,可能是复数个
                    selector = hash.selector,
                    //是否使用事件代理
                    handler = hash.handler; //回调函数
            if (elem.nodeType === 3 || elem.nodeType === 8 || !types || !handler) {
                return;
            }
            hash.uniqueNumber = $.getUid(handler); //确保hash.uuid与fn.uuid一致
            var events = elemData.events || (elemData.events = []),
                    eventHandle = elemData.handle;
            if (!eventHandle) {
                elemData.handle = eventHandle = function(e) {
                    return typeof $ !== "undefined" && (!e || facade.triggered !== e.type) ? facade.dispatch.apply(eventHandle.elem, arguments) : void 0;
                };
                eventHandle.elem = elem; //由于IE的attachEvent回调中的this不指向绑定元素，需要强制缓存它
            }

            types.replace($.rword, function(t) {
                var tns = rtypenamespace.exec(t) || [],
                        type = tns[1];
                var namespaces = (tns[2] || "").split(".").sort();
                // 看需不需要特殊处理
                var hook = eventHooks[type] || {};
                // 事件代理与事件绑定可以使用不同的冒充事件
                type = (selector ? hook.delegateType : hook.bindType) || type;
                hook = eventHooks[type] || {};
                var handleObj = $.mix({}, hash, {
                    type: type,
                    origType: tns[1],
                    namespace: namespaces.join(".")
                });

                var handlers = events[type]; //初始化事件列队
                if (!handlers) {
                    handlers = events[type] = [];
                    handlers.delegateCount = 0;
                    if (!hook.setup || hook.setup.call(elem, namespaces, eventHandle) === false) {
                        if ($["@bind"] in elem) {
                            $.bind(elem, type, eventHandle);
                        }
                    }
                }
                if (hook.add) {
                    hook.add.call(elem, handleObj);
                }
                //先处理用事件代理的回调，再处理用普通方式绑定的回调
                if (selector) {
                    handlers.splice(handlers.delegateCount++, 0, handleObj);
                } else {
                    handlers.push(handleObj);
                }
                //用于优化fire方法
                facade.global[type] = true;
            });
            //防止IE内在泄漏
            elem = null;
        },
        //用于优化事件派发
        global: {},
        remove: function(elem, hash) {
            //移除目标元素绑定的回调
            var elemData = $._data(elem),
                    events, origType
            if (!(events = elemData.events))
                return;
            var types = hash.type || "",
                    selector = hash.selector,
                    handler = hash.handler;
            types.replace($.rword, function(t) {
                var tns = rtypenamespace.exec(t) || [],
                        type = origType = tns[1],
                        namespaces = tns[2];
                //只传入命名空间,不传入事件类型,则尝试遍历所有事件类型
                if (!type) {
                    for (type in events) {
                        facade.unbind(elem, $.mix({}, hash, {
                            type: type + t
                        }));
                    }
                    return
                }
                var hook = eventHooks[type] || {};
                type = (selector ? hook.delegateType : hook.bindType) || type;
                var handlers = events[type] || [];
                var origCount = handlers.length;
                namespaces = namespaces ? new RegExp("(^|\\.)" + namespaces.split(".").sort().join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
                for (var j = 0, handleObj; j < handlers.length; j++) {
                    handleObj = handlers[j];
                    //如果事件类型相同，回调相同，命名空间相同，选择器相同则移除此handleObj
                    if ((origType === handleObj.origType) && (!handler || handler.uniqueNumber === handleObj.uniqueNumber) && (!namespaces || namespaces.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
                        handlers.splice(j--, 1);

                        if (handleObj.selector) {
                            handlers.delegateCount--;
                        }
                        if (hook.remove) {
                            hook.remove.call(elem, handleObj);
                        }
                    }
                }

                if (handlers.length === 0 && origCount !== handlers.length) {
                    if (!hook.teardown || hook.teardown.call(elem, namespaces, elemData.handle) === false) {
                        if ($["@bind"] in elem) {
                            $.unbind(elem, type, elemData.handle);
                        }
                    }
                    delete events[type];
                }
            });

            if ($.isEmptyObject(events)) {
                delete elemData.handle;
                $._removeData(elem, "events"); //这里会尝试移除缓存体
            }
        },
        //通过传入事件类型或事件对象,触发事件回调,在整个DOM树中执行
        trigger: function(event) {
            var elem = this;
            //跳过文本节点与注释节点，主要是照顾旧式IE
            if (elem && (elem.nodeType === 3 || elem.nodeType === 8)) {
                return;
            }
            var type = $.hasOwn(event, "type") ? event.type : event,
                    namespaces = $.hasOwn(event, "namespace") ? event.namespace.split(".") : [],
                    i, cur, old, ontype, handle, eventPath, bubbleType;
            // focus/blur morphs to focusin/out; ensure we're not firing them right now
            if (rfocusMorph.test(type + facade.triggered)) {
                return;
            }
            if (type.indexOf(".") >= 0) {
                //分解出命名空间
                namespaces = type.split(".");
                type = namespaces.shift();
                namespaces.sort();
            }

            //如果从来没有绑定过此种事件，也不用继续执行了
            if (!elem && !facade.global[type]) {
                return;
            }

            event = typeof event === "object" ?
                    // 如果是$.Event实例
                    event.originalEvent ? event :
                    // Object literal
                    new $.Event(type, event) :
                    // Just the event type (string)
                    new $.Event(type);

            event.type = type;
            event.isTrigger = true;
            event.namespace = namespaces.join(".");
            event.namespace_re = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
            ontype = type.indexOf(":") < 0 ? "on" + type : "";
            //清除result，方便重用
            event.result = void 0;
            if (!event.target) {
                event.target = elem;
            }
            //取得额外的参数
            var data = $.slice(arguments);
            data[0] = event;
            //判定是否需要用到事件冒充
            var hook = eventHooks[type] || {};
            if (hook.trigger && hook.trigger.apply(elem, data) === false) {
                return;
            }

            //铺设往上冒泡的路径，每小段都包括处理对象与事件类型
            eventPath = [
                [elem, hook.bindType || type]
            ];
            if (!hook.noBubble && !$.type(elem, "Window")) {

                bubbleType = hook.delegateType || type;
                cur = rfocusMorph.test(bubbleType + type) ? elem : elem.parentNode;
                for (old = elem; cur; cur = cur.parentNode) {
                    eventPath.push([cur, bubbleType]);
                    old = cur;
                }
                //一直冒泡到window
                if (old === (elem.ownerDocument || document)) {
                    eventPath.push([old.defaultView || old.parentWindow || window, bubbleType]);
                }
            }

            //沿着之前铺好的路触发事件
            for (i = 0; i < eventPath.length && !event.propagationStopped; i++) {

                cur = eventPath[i][0];
                event.type = eventPath[i][1];
                handle = ($._data(cur, "events") || {})[event.type] && $._data(cur, "handle");
                if (handle) {
                    handle.apply(cur, data);
                }
                //处理直接写在标签中的内联事件或DOM0事件
                handle = ontype && cur[ontype];
                if (handle && handle.apply && handle.apply(cur, data) === false) {
                    event.preventDefault();
                }
            }
            event.type = type;
            //如果没有阻止默认行为
            if (!event.defaultPrevented) {

                if ((!hook._default || hook._default.apply(elem.ownerDocument, data) === false) && !(type === "click" && elem.nodeName === "A")) {
                    if (ontype && $.isFunction(elem[type]) && elem.nodeType) {
                        old = elem[ontype];
                        if (old) {
                            elem[ontype] = null;
                        }
                        //防止二次trigger，elem.click会再次触发addEventListener中绑定的事件
                        facade.triggered = type;
                        try {
                            //IE6-8在触发隐藏元素的focus/blur事件时会抛出异常
                            elem[type]();
                        } catch (e) {
                        }
                        delete facade.triggered;

                        if (old) {
                            elem[ontype] = old;
                        }
                    }
                }
            }

            return event.result;
        },
        dispatch: function(e) {
            //执行用户回调,只在当前元素中执行
            var eventType = e.type,
                    handlers = (($._data(this, "events") || {})[eventType] || []);
            if (!handlers.length) {
                return; //如果不存在事件回调就没有必要继续进行下去
            }
            //摒蔽事件对象在各浏览器下的差异性
            var event = $.event.fix(e),
                    delegateCount = handlers.delegateCount,
                    args = $.slice(arguments),
                    hook = eventHooks[eventType] || {},
                    handlerQueue = [],
                    ret, selMatch, matched, matches, handleObj, sel;
            //重置第一个参数
            args[0] = event;
            event.delegateTarget = this;

            // 经典的AOP模式
            if (hook.preDispatch && hook.preDispatch.call(this, event) === false) {
                return;
            }
            //收集阶段
            //如果使用了事件代理，则先执行事件代理的回调, FF的右键会触发点击事件，与标准不符
            if (delegateCount && !(event.button && eventType === "click")) {
                for (var cur = event.target; cur != this; cur = cur.parentNode || this) {
                    //disabled元素不能触发点击事件
                    if (cur.disabled !== true || eventType !== "click") {
                        selMatch = {};
                        matches = [];
                        for (var i = 0; i < delegateCount; i++) {
                            handleObj = handlers[i];
                            sel = handleObj.selector + " "; //避免与Ovject.prototype的属性冲突,比如toString, valueOf等
                            //判定目标元素(this)的孩子(cur)是否匹配（sel）
                            if (selMatch[sel] === void 0) {
                                selMatch[sel] = $(sel, this).index(cur) >= 0;
                            }
                            if (selMatch[sel]) {
                                matches.push(handleObj);
                            }
                        }
                        if (matches.length) {
                            handlerQueue.push({
                                elem: cur,
                                matches: matches
                            });
                        }
                    }
                }
            }

            // 这是事件绑定的回调
            if (handlers.length > delegateCount) {
                handlerQueue.push({
                    elem: this,
                    matches: handlers.slice(delegateCount)
                });
            }

            // 如果没有阻止事件传播，则执行它们
            for (i = 0; i < handlerQueue.length && !event.propagationStopped; i++) {
                matched = handlerQueue[i];
                event.currentTarget = matched.elem;
                for (var j = 0; j < matched.matches.length && !event.isImmediatePropagationStopped; j++) {
                    handleObj = matched.matches[j];
                    //namespace，namespace_re属性只出现在trigger方法中
                    if (!event.namespace || event.namespace_re && event.namespace_re.test(handleObj.namespace)) {
                        //event.data = handleObj.data;这不是一个好意义,因为message事件会有一个同名的data的属性
                        event.handleObj = handleObj;
                        ret = ((eventHooks[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);
                        handleObj.times--;
                        if (handleObj.times === 0) { //如果有次数限制并到用光所有次数，则移除它
                            facade.unbind(matched.elem, handleObj);
                        }
                        if (ret !== void 0) {
                            event.result = ret;
                            if (ret === false) {
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        }
                    }
                }
            }

            if (hook.postDispatch) {
                hook.postDispatch.call(this, event);
            }
            return event.result;
        },
        fix: function(event) {
            //修正事件对象,摒蔽差异性
            if (!event.originalEvent) {
                var real = event;
                event = $.Event(real);
                //复制真实事件对象的成员
                for (var p in real) {
                    if (!(p in event)) {
                        event[p] = real[p];
                    }
                }
                //如果不存在target属性，为它添加一个
                if (!event.target) {
                    event.target = event.srcElement || document;
                }
                //safari的事件源对象可能为文本节点，应代入其父节点
                if (event.target.nodeType === 3) {
                    event.target = event.target.parentNode;
                }
                event.metaKey = !!event.ctrlKey; // 处理IE678的组合键
                var callback = facade["fix" + eventMap[event.type]];
                if (typeof callback === "function") {
                    callback(event, real);
                }
            }
            return event;
        }
    });
    facade.bind = facade.add;
    facade.unbind = facade.remove;
    //以下是用户使用的API
    $.fn.extend({
        hover: function(fnIn, fnOut) {
            return this.mouseenter(fnIn).mouseleave(fnOut || fnIn);
        },
        delegate: function(selector, types, fn, times) {
            return this.on(types, selector, fn, times);
        },
        live: function(types, fn, times) {
            $.log("$.fn.live() is deprecated");
            $(this.ownerDocument).on(types, this.selector, fn, times);
            return this;
        },
        one: function(types, fn) {
            return this.on(types, fn, 1);
        },
        undelegate: function(selector, types, fn) { /*顺序不能乱*/
            return arguments.length === 1 ? this.off(selector, "**") : this.off(types, fn, selector);
        },
        die: function(types, fn) {
            $.log("$.fn.die() is deprecated");
            $(this.ownerDocument).off(types, fn, this.selector || "**", fn);
            return this;
        },
        fire: function() {
            var args = arguments;
            return this.each(function() {
                facade.trigger.apply(this, args);
            });
        }
    });
    $.fn.trigger = $.fn.fire;
    //这个迭代器产生四个重要的事件绑定API on off bind unbind
    "on_bind,off_unbind".replace($.rmapper, function(_, on, bind) {
        $.fn[on] = function(types, selector, fn) {
            if (typeof types === "object") {
                for (var type in types) {
                    $.fn[on](this, type, selector, types[type], fn);
                }
                return this;
            }
            var hash = {};
            for (var i = 0; i < arguments.length; i++) {
                var el = arguments[i];
                switch (typeof el) {
                    case "number":
                        hash.times = el;
                        break;
                    case "function":
                        hash.handler = el;
                        break;
                    case "object":
                        $.mix(hash, el, false);
                        break;
                    case "string":
                        if ("type" in hash) {
                            hash.selector = el.trim();
                        } else {
                            hash.type = el.trim(); //只能为字母数字-_.空格
                        }
                        break;
                }
            }
            if (!hash.type) {
                $.error("必须指明事件类型");
            }
            if (on === "on" && !hash.handler) {
                $.error("必须指明事件回调");
            }
            hash.times = hash.times > 0 ? hash.times : Infinity;
            return this.each(function() {
                facade[bind](this, hash);
            });
        };
        $.fn[bind] = function() { // $.fn.bind $.fn.unbind
            return $.fn[on].apply(this, arguments);
        };
    });

    types.replace($.rword, function(type) { //这里产生以事件名命名的快捷方法
        eventMap[type] = eventMap[type] || (/key/.test(type) ? "Keyboard" : "HTML");
        $.fn[type] = function(callback) {
            return callback ? this.bind(type, callback) : this.fire(type);
        };
    });
    /* mouseenter/mouseleave/focusin/focusout已为标准事件，经测试IE5+，opera11,FF10+都支持它们
     详见http://www.filehippo.com/pl/download_opera/changelog/9476/
     */
    if (!+"\v1" || !$.eventSupport("mouseenter")) { //IE6789不能实现捕获与safari chrome不支持
        "mouseenter_mouseover,mouseleave_mouseout".replace($.rmapper, function(_, type, fix) {
            eventHooks[type] = {
                delegateType: fix,
                bindType: fix,
                handle: function(event) {
                    var ret, target = this,
                            related = event.relatedTarget,
                            handleObj = event.handleObj;
                    // For mousenter/leave call the handler if related is outside the target.
                    // NB: No relatedTarget if the mouse left/entered the browser window
                    if (!related || (related !== target && !$.contains(target, related))) {
                        event.type = handleObj.origType;
                        ret = handleObj.handler.apply(this, arguments);
                        event.type = fix;
                    }
                    return ret;
                }
            };
        });
    }
    //现在只有firefox不支持focusin,focusout事件,并且它也不支持DOMFocusIn,DOMFocusOut,不能像DOMMouseScroll那样简单冒充,Firefox 17+
    if (!$.support.focusin) {
        "focusin_focus,focusout_blur".replace($.rmapper, function(_, orig, fix) {
            var attaches = 0,
                    handler = function(event) {
                event = facade.fix(event);
                $.mix(event, {
                    type: orig,
                    isSimulated: true
                });
                facade.trigger.call(event.target, event);
            };
            eventHooks[orig] = {
                setup: function() {
                    if (attaches++ === 0) {
                        document.addEventListener(fix, handler, true);
                    }
                },
                teardown: function() {
                    if (--attaches === 0) {
                        document.removeEventListener(fix, handler, true);
                    }
                }
            };
        });
    }
    try {
        //FF需要用DOMMouseScroll事件模拟mousewheel事件
        document.createEvent("MouseScrollEvents");
        eventHooks.mousewheel = {
            bindType: "DOMMouseScroll",
            delegateType: "DOMMouseScroll"
        };
        if ($.eventSupport("mousewheel")) {
            delete eventHooks.mousewheel;
        }
    } catch (e) {
    }
    if (typeof $.fixEvent === "function") {
        $.fixEvent();
    }

    return $;
})

/**
 2011.8.14 更改隐藏namespace,让自定义对象的回调函数也有事件对象
 2011.9.17 事件发送器增加一个uniqueID属性
 2011.9.21 重构bind与unbind方法 支持命名空间与多事件处理
 2011.9.27 uniqueID改为uniqueNumber 使用$._data存取数据
 2011.9.29 简化bind与unbind
 2011.10.13 emit模块更名dispatcher 模块 升级为v2
 2011.10.23 简化facade.handle与fire
 2011.10.14 强化delegate 让快捷方法等支持fire 修复delegate BUG
 2011.10.21 修复focusin focsuout的事件代理 增加fixAndDispatch处理事件冒充
 2011.11.23 简化rquickIs
 2011.12.20 修正在当前窗口为子窗口元素绑定错误时，在IE678下，事件对象错误的问题
 2011.12.20 修正rhoverHack正则，现在hover可以作为命名空间了
 2012.1.13 dispatcher模块更名target模块 升级为v3
 2012.2.7 重构change，允许change事件可以通过fireEvent("onchange")触发
 2012.2.8 添加mouseenter的分支判定，增强eventSupport
 2012.2.9 完美支持valuechange事件
 2012.4.1 target模块与event模块合并， 并分割出event_fix模块，升级为v4
 2012.4.12 修正触摸屏下的pageX pageY
 2012.5.1 让$.fn.fire支持自定义事件
 2012.5.24 利用customEvent,initCustomEvent, dispatchEvent大大提高性能,升级到v5
 2012.5.26 修正自定义事件target与this的指向
 2012.5.28 Fix quickParse BUG
 2012.5.29 利用Object.defineProperty打破事件对象的封装
 2012.6.6 addEventListenter也能绑定自定义事件, 一些兼容逻辑移到event_fix中去 升级到v6
 2012.8.17 $.EventTarget不再自带uniqueNumber，此属性会在用户第一次调用bind,unbind方法时再为原对象添加此属性
 2012.8.31 移除$.EventTarget,以后所有自定义事件由操作流代劳,升级到v7
 2012.10.18 移除$.fn.toggle,$.event._dispatch,重构focusin,fire,change,submit等实现,升级到v8
 2012.11.2 去掉$.event，隐藏实现细节
 2013.1.9 沿着jQuery的思路重构事件模块
 http://jsbin.com/efalu/7 input例子
 //http://hacks.mozilla.org/2012/05/dom-mutationobserver-reacting-to-dom-changes-without-killing-browser-performance/
 ECMAScript Edition3, 5 execution context and scope chain http://user.qzone.qq.com/153720615/blog/1339563690#!app=2&pos=1323177459
 
 IE6-9   IE6-9  IE6-9    firefox16  firefox16 firefox16
 keydown keyup  keypress keydow     keyup     keypress
 区分大小写    ×  ×   √   ×    ×  √
 监听A类功能键 √     √        √       √        √      √
 监听B类功能键 √     √        ×       √    √      ×
 获取charCode ×     ×    √   ×    ×       ×
 监听tab      √     ×    ×   √    √       √
 
 A类功能键是指enter，del，insert，方向。
 B类功能键是指上下翻页，shift，win，alt，ctrl，caps，退格。
 Chrome23，safari5的情况同IE。Opera12的情况与FF相近，但不能获取charCode值是返回undefined，并且只能通过keydown,keyup监听tab键。
 
 http://heroicyang.com/blog/javascript-timers.html
 http://heroicyang.com/blog/javascript-event-loop.html
 http://jquerymobile.com/blog/2012/08/01/announcing-jquery-mobile-1-2-0-alpha/
 http://hi.baidu.com/flondon/item/59993d95625d19ceb72531a3
 beforeunload 丢失率统计及优化方案
 统计日志打点方案的权衡
 http://www.irideas.com/?p=26
 hammer.js 是一个多点触摸手势库，能够为网页加入Tap、Double Tap、Swipe、Hold、Pinch、Drag等多点触摸事件，
 免去自己监听底层touchstart、touchmove、touchend事件并且写一大堆判断逻辑的痛苦。
 http://eightmedia.github.com/hammer.js/
 // 先要对监听的DOM进行一些初始化
 var hammer = new Hammer(document.getElementById("container"));
 
 // 然后加入相应的回调函数即可
 hammer.ondragstart = function(ev) { };  // 开始拖动
 hammer.ondrag = function(ev) { }; // 拖动中
 hammer.ondragend = function(ev) { }; // 拖动结束
 hammer.onswipe = function(ev) { }; // 滑动
 
 hammer.ontap = function(ev) { }; // 单击
 hammer.ondoubletap = function(ev) { }; //双击
 hammer.onhold = function(ev) { }; // 长按
 
 hammer.ontransformstart = function(ev) { }; // 双指收张开始
 hammer.ontransform = function(ev) { }; // 双指收张中
 hammer.ontransformend = function(ev) { }; // 双指收张结束
 
 hammer.onrelease = function(ev) { }; // 手指离开屏幕
 伸缩布局 — 打开布局天堂之门？
 
 http://dev.oupeng.com/articles/flexbox-basics
 http://www.alloyteam.com/2012/10/common-javascript-design-patterns/
 
 自定义下拉框
 http://odyniec.net/projects/selectlist/
 
 消息作为信封，信封内容是事件，这种异步机制是聚合根与外界交互的最好方式，在松耦合上要好于聚合根直接暴露自己的行为或者Hold其他聚合根，能够更加严密保护自己内部状态不被外界侵入。
 */