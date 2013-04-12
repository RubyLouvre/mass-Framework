//=========================================
//  事件补丁模块
//==========================================
define(!!document.dispatchEvent, ["node"], function($) {
    //模拟IE678的reset,submit,change的事件代理
    $.fixEvent = function() {
       var  facade =  $.event, eventHooks = facade.special
        var rformElems = /^(?:input|select|textarea)$/i;
        facade.fixMouse = function(event) {
            // 重置fixMouse http://www.w3help.org/zh-cn/causes/BX9008
            var doc = event.target.ownerDocument || document; //safari与chrome下，滚动条，视窗相关的东西是放在body上
            var box = document.compatMode == "BackCompat" ? doc.body : doc.documentElement
            event.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0);
            event.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0);
            //如果不存在relatedTarget属性，为它添加一个
            if (!event.relatedTarget && event.fromElement) { //mouseover mouseout
                event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
            }
            //标准浏览判定按下鼠标哪个键，左1中2右3
            var button = event.button;
            //IE event.button的意义 0：没有键被按下 1：按下左键 2：按下右键 3：左键与右键同时被按下 4：按下中键 5：左键与中键同时被按下 6：中键与右键同时被按下 7：三个键同时被按下
            event.which = [0, 1, 3, 0, 2, 0, 0, 0][button]; //0现在代表没有意义
        };
        facade.fixKeyboard = function(event) {//添加fixKeyboard补丁
            event.which = event.charCode != null ? event.charCode : event.keyCode;
        };
        function simulate(type, elem, event) {
            event = new $.Event(event);
            $.mix({
                type: type,
                isSimulated: true
            });
            $.event.trigger.call(elem, event);
            if (event.defaultPrevented) {
                event.preventDefault();
            }
        }
        eventHooks.change = {
            setup: function() {
                if (rformElems.test(this.nodeName)) {
                    // IE doesn't fire change on a check/radio until blur; trigger it on click
                    // after a propertychange. Eat the blur-change in special.change.handle.
                    // This still fires onchange a second time for check/radio after blur.
                    if (this.type === "checkbox" || this.type === "radio") {
                        $(this).bind("propertychange._change", function(event) {
                            if (event.originalEvent.propertyName === "checked") {
                                this._just_changed = true;
                            }
                        });
                        $(this).bind("click._change", function(event) {
                            if (this._just_changed && !event.isTrigger) {
                                this._just_changed = false;
                            }
                            // Allow triggered, simulated change events (#11500)
                            simulate("change", this, event);
                        });
                    }
                    return false;
                }
                // Delegated event; lazy-add a change handler on descendant inputs
                $(this).bind("beforeactivate._change", function(e) {
                    var elem = e.target;
                    if (rformElems.test(elem.nodeName) && !$._data(elem, "_change_attached")) {
                        $(elem).bind("change._change", function(event) {
                            if (this.parentNode && !event.isSimulated && !event.isTrigger) {
                                simulate("change", this.parentNode, event);
                            }
                            $._data(elem, "_change_attached", true);
                        });
                    }
                });
            },
            handle: function(event) {
                var elem = event.target;
                // Swallow native change events from checkbox/radio, we already triggered them above
                if (this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox")) {
                    return event.handleObj.handler.apply(this, arguments);
                }
            },
            teardown: function() {
                facade.remove(this, "._change");
                return !rformElems.test(this.nodeName);
            }
        };
        eventHooks.submit = {
            setup: function() {
                // Only need this for delegated form submit events
                if (this.tagName === "FORM") {
                    return false;
                }
                $(this).bind("click._submit keypress._submit", function(e) {
                    var elem = e.target,
                            form = /input|button/i.test(elem.tagName) ? elem.form : undefined;
                    if (form && !$._data(form, "_submit_attached")) {
                        facade.bind(form, {
                            type: "submit._submit",
                            callback: function(event) {
                                event._submit_bubble = true;
                            }
                        });
                        $._data(form, "_submit_attached", true);
                    }
                });
                // return undefined since we don't need an event listener
            },
            postDispatch: function(event) {
                // If form was submitted by the user, bubble the event up the tree
                if (event._submit_bubble) {
                    delete event._submit_bubble;
                    if (this.parentNode && !event.isTrigger) {
                        simulate("submit", this.parentNode, event);
                    }
                }
            },
            teardown: function() {
                if (this.tagName === "FORM") {
                    return false;
                }
                facade.remove(this, "._submit");
            }
        };
    };
    return $;
})

/**
 * input事件的支持情况：IE9+，chrome+, gecko2+, opera10+,safari+
 * 2012.5.1 fix delegate BUG将submit与reset这两个适配器合而为一
 * 2012.10.18 重构reset, change, submit的事件代理
 * 2013.1.9 将$.event.fix的一些逻辑分离到event_fix模块,形成fixMouse, fixKeyboard方法
 
 */