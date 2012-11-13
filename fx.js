//=========================================
// 动画模块v5
//==========================================
define("fx", ["$css"],function(){
    $.log("动画引擎v5")
    var _baseParams = [0, 0, 1, 1], _blankArray = [],  easing = {};
    var Ease = easing.Ease =  function(func, extraParams, type, power) {
        this._func = func;
        this._type = type || 0;
        this._power = power || 0;
        this._params = extraParams ? _baseParams.concat(extraParams) : _baseParams;
    }

    p = Ease.prototype;
    p._calcEnd = false;
    p.getRatio = function(p) {
        if (this._func) {
            this._params[0] = p;
            return this._func.apply(null, this._params);
        } else {
            var t = this._type,
            pw = this._power,
            r = (t === 1) ? 1 - p : (t === 2) ? p : (p < 0.5) ? p * 2 : (1 - p) * 2;
            if (pw === 1) {
                r *= r;
            } else if (pw === 2) {
                r *= r * r;
            } else if (pw === 3) {
                r *= r * r * r;
            } else if (pw === 4) {
                r *= r * r * r * r;
            }
            return (t === 1) ? 1 - r : (t === 2) ? r : (p < 0.5) ? r / 2 : 1 - (r / 2);
        }
    };
    console.log("xxxxxxxxxxxx")
    //create all the standard eases like Linear, Quad, Cubic, Quart, Quint, Strong,
    //Power0, Power1, Power2, Power3, and Power4 (each with easeIn, easeOut, and easeInOut)
    ;(function(){
        var a = ["Linear","Quad","Cubic","Quart","Quint"], i = a.length, e, e2
        while(--i > -1) {
            e = easing[a[i]] =function(){};
            e2 =easing["Power" + i] = function(){};
            e.easeOut = e2.easeOut = new Ease(null, null, 1, i);
            e.easeIn = e2.easeIn = new Ease(null, null, 2, i);
            e.easeInOut = e2.easeInOut = new Ease(null, null, 3, i);
        }
        easing.Strong= easing.Power4
        easing.Linear.easeNone = easing.Linear.easeIn
        $.log(easing)
    })();

    var EventDispatcher = $.factory({
        init:function(target){
            this._listeners = {};
            this._eventTarget = target || this;
        },
        addEventListener: function(type, callback, scope, useParam, priority) {
            priority = priority || 0;
            var list = this._listeners[type],
            index = 0,
            listener, i;
            if (list == null) {
                this._listeners[type] = list = [];
            }
            i = list.length;
            while (--i > -1) {
                listener = list[i];
                if (listener.c === callback) {
                    list.splice(i, 1);
                } else if (index === 0 && listener.pr < priority) {
                    index = i + 1;
                }
            }
            list.splice(index, 0, {
                c:callback, 
                s:scope, 
                up:useParam, 
                pr:priority
            });
        },
        removeEventListener: function(type, callback) {
            var list = this._listeners[type];
            if (list) {
                var i = list.length;
                while (--i > -1) {
                    if (list[i].c === callback) {
                        list.splice(i, 1);
                        return;
                    }
                }
            }
        },
        dispatchEvent: function(type) {
            var list = this._listeners[type];
            if (list) {
                var i = list.length, listener,
                t = this._eventTarget;
                while (--i > -1) {
                    listener = list[i];
                    if (listener.up) {
                        listener.c.call(listener.s || t, {
                            type:type, 
                            target:t
                        });
                    } else {
                        listener.c.call(listener.s || t);
                    }
                }
            }
        }
    })


    var _reqAnimFrame = $.cssName("requestAnimationFrame",window)
    var _cancelAnimFrame  = $.cssName("cancelAnimationFrame",window)
    var _getTime = Date.now
    if(!_reqAnimFrame && !_cancelAnimFrame){
        _cancelAnimFrame = function(id) {
            window.clearTimeout(id);
        }
    }else{
        _reqAnimFrame = window[_reqAnimFrame]
        _cancelAnimFrame = window[_cancelAnimFrame]
    }
    var Ticker = $.factory({
        inherit: EventDispatcher,
        init:  function(fps, useRAF) {
            this.time = 0;
            this.frame = 0;
            var _self = this,
            _startTime = _getTime(),
            _useRAF = (useRAF !== false),
            _fps, _req, _id, _gap, _nextTime;

            this.tick = function() {
                _self.time = (_getTime() - _startTime) / 1000;
                if (!_fps || _self.time >= _nextTime) {
                    _self.frame++;
                    _nextTime = _self.time + _gap - (_self.time - _nextTime) - 0.0005;//以秒做单位
                    if (_nextTime <= _self.time) {
                        _nextTime = _self.time + 0.001;
                    }
                    _self.dispatchEvent("tick");
                }
                _id = _req( _self.tick );
            };

            this.fps = function(value) {//帧数
                if (!arguments.length) {
                    return _fps;
                }
                _fps = value;
                _gap = 1 / (_fps || 60);//间隙 
                _nextTime = this.time + _gap;
                _req = (_fps === 0) ? function(f){} : (!_useRAF || !_reqAnimFrame) ? function(f) {
                    return window.setTimeout( f, (((_nextTime - _self.time) * 1000 + 1) >> 0) || 1);
                } : _reqAnimFrame;
                _cancelAnimFrame(_id);
                _id = _req( _self.tick );
            };

            this.useRAF = function(value) {
                if (!arguments.length) {
                    return _useRAF
                }
                _useRAF = value;
                this.fps(_fps);
            };

            this.fps(fps);
        }
    })
    var _gsInit
    var Animation = $.factory({
        init:function(duration, vars) {
            this.vars = vars || {};
            this._duration = this._totalDuration = duration || 0;
            this._delay = Number(this.vars.delay) || 0;
            this._timeScale = 1;
            this._active = (this.vars.immediateRender == true);
            this.data = this.vars.data;
            this._reversed = (this.vars.reversed == true);

            if (!_rootTimeline) {
                return;
            }
            if (!_gsInit) {
                _ticker.tick(); //the first time an animation (tween or timeline) is created, we should refresh the time in order to avoid a gap. The Ticker's initial time that it records might be very early in the load process and the user may have loaded several other large scripts in the mean time, but we want tweens to act as though they started when the page's onload was fired. Also remember that the requestAnimationFrame likely won't be called until the first screen redraw.
                _gsInit = true;
            }
              //时间线
            var tl = this.vars.useFrames ? _rootFramesTimeline : _rootTimeline;
            tl.insert(this, tl._time);

            if (this.vars.paused) {
                this.paused(true);
            }
        }
    }),
    _ticker = Animation.ticker = new Ticker();

});