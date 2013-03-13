define(["node"], function($) {
    function Messenger(config) {
        //win为其他页面的window对象或装载此window对象的iframe元素或其表达式
        var win = config.target
        if (typeof win === "string") {
            win = $(win).get(0);
            if (win && win.tagName === 'IFRAME') {
                win = win.contentWindow;
            }
        } else {
            win = parent;
        }
        this.win = win;
        this._messages = [];
        //onmessage为当前页面处理其他页面发过来的
        if (typeof config.onmessage === "function") {
            this.receive(config.onmessage);
        }
        this.init();
    }
    Messenger.prototype = {
        init: function() {
            var self = this;
            this._callback = function(event) {
                var n = self._messages.length
                console.log("准备进入循环"+n)
             //   if (event.source != self.win)
                   // return;//如果不是来源自win所指向的窗口,返回
                for (var i = 0; i < n; i++ ) {
                  var  fn = self._messages[i]
                    fn.call(self, event.data);
                }
            };
            $.bind(window, "message", this._callback);
        },
        receive: function(fn) {
            fn.win = this.win;
            this._messages.push(fn);
        },
        send: function(data) {
            this.win.postMessage(data, '*');//parent
        }
    };
    if (!"1"[0]) {//IE6-7
        Messenger.prototype.init = function() {
            var isSameOrigin = false;
            //判定是否同源，不同源会无法访问它的属性抛错
            try {
                isSameOrigin = !!this.win.location.href;
            } catch (e) {
            }
            if (isSameOrigin) {
                this.initForSameOrigin();
            } else {
                this.initForCrossDomain();
            }

        };

        Messenger.prototype.initForCrossDomain = function() {
            var fns = navigator.messages = navigator.messages || [];
            var self = this;
            for (var i = 0, fn; fn = this._messages[i++]; ) {
                fns.push(fn);
            }
            this.receive = function(fn) {
                fn.win = this.win;
                fns.push(fn);
            };
            this.send = function(data) {
                setTimeout(function() {
                    for (var i = 0, fn; fn = fns[i++]; ) {
                        if (fn.win != self.win) {
                            fn.call(self, data);
                        }
                    }
                });
            };
        }

        Messenger.prototype.initForSameOrigin = function() {
            var self = this;
            this.send = function(data) {
                setTimeout(function() {
                    var event = self.win.document.createEventObject();
                    event.eventType = 'message';
                    event.eventSource = window;
                    event.eventData = data;
                    self.win.document.fireEvent('ondataavailable', event);
                });
            }
            this._dataavailable = function(event) {
                if (event.eventType !== 'message' || event.eventSource != self.win)
                    return;
                for (var i = 0, fn; fn = self._messages[i++]; ) {
                    fn.call(self, event.eventData);
                }
            };
            document.attachEvent('ondataavailable', this._dataavailable);
        };
    }

    Messenger.prototype.destroy = function() {
        // 解除绑定事件
        if (this._callback) {
            $.unbind(this.win, "message", this._callback)
        }
        // 解除绑定事件 ie
        if (document.detachEvent && this._dataavailable) {
            document.detachEvent('ondataavailable', this._dataavailable);
        }
        // 删除实例属性
        for (var p in this) {
            if (this.hasOwnProperty(p)) {
                delete this[p];
            }
        }
        navigator.messages = void 0;
    };

    return Messenger;
});
//如果想在旧式的标准浏览器支持跨域通信，可以使用window.name;
//https://github.com/biqing/MessengerJS/blob/master/messenger.js
//https://github.com/aralejs/messenger/blob/master/src/messenger.js
