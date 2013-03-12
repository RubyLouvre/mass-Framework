define(["node"],function($) {
    function Messenger(config) {
        var win = config.target || parent;
        try{
            if (!$.type(win)) {
                win = $(win).get(0);
                if (win && win.tagName === 'IFRAME') {
                    win = win.contentWindow;
                }
            }
        } catch(e) {
            $.error(e)
        }
        // save the pointer to the window which is interacting with        
        this.win = win;
        this.onmessage = config.onmessage || function() {};
        this.init();
    }

    // postMessage API is supported
    Messenger.prototype.init = function () {
        var self = this;
        this._receiver = function (event) {
            // Some IE-component browsers fails if you compare
            // window objects with '===' or '!=='.
            if (event.source != self.win) return;
            (self.onmessage || function () {}).call(self, event.data);
        };
        
        if (window.addEventListener)
            window.addEventListener('message', this._receiver, false);
        else if (window.attachEvent)
        window.attachEvent('onmessage', this._receiver);
    };

    Messenger.prototype.send = function (data) {
        this.win.postMessage(data, '*');
    };

    // in IE, postMessage API is not supported
    if (!window.postMessage && window.attachEvent) {
        // redefine the init method
        Messenger.prototype.init = function () {
            var isSameOrigin = false;
            // test if the two document is same origin
            try {
                isSameOrigin = !!this.win.location.href;
            } catch (ex) {}
            if (isSameOrigin) {
                this.send = this.sendForSameOrigin;
                this.initForSameOrigin();
                return;
            }

            // different origin case
            // init the message queue, which can guarantee the messages won't be lost
            this.queue = [];
            if (window.parent == this.win) {
                this.initForParent();
            } else {
                this.initForFrame();
            }
        };

        Messenger.prototype.initForSameOrigin = function () {
            var self = this;

            this._dataavailable = function (event) {
                if (!event.eventType ||
                    event.eventType !== 'message' ||
                    event.eventSource != self.win)
                return;
                (self.onmessage || function () {}).call(self, event.eventData);
            };
            document.attachEvent('ondataavailable', this._dataavailable);
        };

        Messenger.prototype.sendForSameOrigin = function (data) {
            var self = this;
            setTimeout(function () {
                var event = self.win.document.createEventObject();
                event.eventType = 'message';
                event.eventSource = window;
                event.eventData = data;
                self.win.document.fireEvent('ondataavailable', event);
            });
        };

        // create two iframe in iframe page
        Messenger.prototype.initForParent = function () {
            var fragment = document.createDocumentFragment();
            var style = 'width: 1px; height: 1px; position: absolute; left: -999px; top: -999px;';
            var senderFrame = document.createElement('iframe');
            senderFrame.src = 'javascript:""';
            senderFrame.style.cssText = style;
            fragment.appendChild(senderFrame);
            var receiverFrame = document.createElement('iframe');
            receiverFrame.src = 'javascript:""';            
            receiverFrame.style.cssText = style;
            fragment.appendChild(receiverFrame);

            document.body.insertBefore(fragment, document.body.firstChild);
            this.senderWin = senderFrame.contentWindow;
            this.receiverWin = receiverFrame.contentWindow;

            this.startReceive();

            // for destroy
            this._fragment = fragment;
        };

        // parent page wait the messenger iframe is ready
        Messenger.prototype.initForFrame = function () {
            this.senderWin = null;
            this.receiverWin = null;

            var self = this;
            this.timerId = setInterval(function () {
                self.waitForFrame();
            }, 50);
        };

        // parent page polling the messenger iframe
        // when all is ready, start trying to receive message
        Messenger.prototype.waitForFrame = function () {
            var senderWin;
            var receiverWin;
            try {
                senderWin = this.win[1];
                receiverWin = this.win[0];
            } catch (ex) {}
            if (!senderWin || !receiverWin) return;
            clearInterval(this.timerId);

            this.senderWin = senderWin;
            this.receiverWin = receiverWin;
            if (this.queue.length)
                this.flush();
            this.startReceive();
        };

        // polling the messenger iframe's window.name
        Messenger.prototype.startReceive = function () {
            var self = this;
            this.timerId = setInterval(function () {
                self.tryReceive();
            }, 50);
        };

        Messenger.prototype.tryReceive = function () {
            try {
                // If we can access name, we have already got the data.
                this.receiverWin.name;
                return;
            } catch (ex) {}

            // if the name property can not be accessed, try to change the messenger iframe's location to 'about blank'
            this.receiverWin.location.replace('javascript:"";');
            // We have to delay receiving to avoid access-denied error.
            var self = this;
            setTimeout(function () {
                self.receive();
            }, 0);
        };

        // recieve and parse the data, call the listener function
        Messenger.prototype.receive = function () {
            var rawData = null;
            try {
                rawData = this.receiverWin.name;
            } catch (ex) {}
            if (!rawData) return;
            this.receiverWin.name = '';

            var self = this;
            var dataList = rawData.substring(1).split('|');
            for (var i = 0; i < dataList.length; i++) (function () {
                var data = decodeURIComponent(dataList[i]);
                setTimeout(function () {
                    (self.onmessage || function () {}).call(self, data);
                }, 0);
            })();
        };

        // send data via push the data into the message queue
        Messenger.prototype.send = function (data) {
            this.queue.push(data);
            if (!this.senderWin) return;
            this.flush();
        };

        Messenger.prototype.flush = function () {
            var dataList = [];
            for (var i = 0; i < this.queue.length; i++)
                dataList[i] = encodeURIComponent(this.queue[i]);
            var encodedData = '|' + dataList.join('|');
            try {
                this.senderWin.name += encodedData;
                this.queue.length = 0;
            } catch (ex) {
                this.senderWin.location.replace('about:blank');
                var self = this;
                setTimeout(function () {
                    self.flush();
                }, 0);
            }
        };

    }

    Messenger.prototype.destroy = function () {
        // 删除定时器
        clearInterval(this.timerId);
        
        // 解除绑定事件
        if (this._receiver) {
            if (window.removeEventListener)
                window.removeEventListener('message', this._receiver, false);
            else if (window.detachEvent)
                window.detachEvent('onmessage', this._receiver);
        }

        // 解除绑定事件 ie
        if (document.detachEvent && this._dataavailable) {
            document.detachEvent('ondataavailable', this._dataavailable);            
        }

        // 删除fragment
        this._fragment && document.body.removeChild(this._fragment);

        // 删除实例属性
        for (var p in this) {
            if (this.hasOwnProperty(p)) {
                delete this[p];
            }
        }
    };

});

