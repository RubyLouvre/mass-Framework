define("fx","$event,events,$css,$attr".split(","), function( $, EventTarget ){
    var _baseParams = [0, 0, 1, 1], _blankArray = []
    function Ease(func, extraParams, type, power) {
        this._func = func;
        this._type = type || 0;
        this._power = power || 0;
        this._params = extraParams ? _baseParams.concat(extraParams) : _baseParams;
    }

    Ease.prototype ={
        constructor: Ease,
        _calcEnd: false,
        getRatio: function(p) {
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
        }
    }


    var a = $.cssName("requestAnimationFrame", window), b = $.cssName("cancelAnimationFrame", window)
    var _getTime =  Date.now || function() {
        return new Date().getTime();
    };
    if(a && b){
        //        Firefox 4 beta 4中，它率先实现了mozRequestAnimationFrame，但当时与标准的差距巨大，
        //        需要结合mozAnimationStartTime，MozBeforePaint事件进行动画，具体参实这里
        //        http://robert.ocallahan.org/2010/08/mozrequestanimationframe_14.html
        //        也没有提供对应的mozCancelRequestAnimationFrame。它直到11时才开始有了mozCancelRequestAnimationFrame
        //        ，但老方案直接抛异常。webkit下也有坑：某个诡异的webKit版本下，webkitRequestAnimationFrame没有给回调函数传time参数，
        //        更神奇的是一些webkit居然传递错误格式的time。为此，在webkit下我们通常不用参数里的time，改为自己new Date。
        var _reqAnimFrame = window[a];
        var _cancelAnimFrame = window[b];
    }

    var Ticker = $.factory({
        inherit:  EventTarget,
        init: function(fps, useRAF) {
            var ticker = this,
            startTime = _getTime(),//取得当前时间的毫秒数
            _useRAF = !!(useRAF !== false && _reqAnimFrame),
            _fps, processor, timeoutID, gap, nextTime,
            //执行动画请求 http://msdn.microsoft.com/zh-tw/library/ie/hh920765.aspx
            requestAnimationFrame = _useRAF ?  _reqAnimFrame :  function(fn) {
                return window.setTimeout( fn, ((( nextTime - ticker.time) * 1000 + 1) >> 0) || 1)
            },
            //清除动画请求
            cancelAnimationFrame = _useRAF ?  _cancelAnimFrame : clearTimeout;
            var tick = function(manual) {
                ticker.time = (_getTime() - startTime) / 1000;
                if (!_fps || ticker.time >= nextTime || manual) {
                    ticker.frame++;
                    nextTime = (ticker.time > nextTime) ? ticker.time + gap - (ticker.time - nextTime) : ticker.time + gap - 0.001;
                    if (nextTime < ticker.time + 0.001) {
                        nextTime = ticker.time + 0.001;
                    }
                    ticker.dispatchEvent("tick");
                }
                if (manual !== true) {
                    timeoutID = processor( tick );
                }
            };
            this.time = this.frame = 0;
            //强制执行动画
            this.tick = function() {
                tick(true);
            };
            //取得或重设fps，并执行动画
            this.fps = function(value) {
                if (!arguments.length) {
                    return _fps;
                }
                _fps = value;
                gap = 1 / (_fps || 60);
                nextTime = this.time + gap;
                if(timeoutID){
                    cancelAnimationFrame(timeoutID)
                    timeoutID = null;
                }
                processor = (_fps === 0) ? function( ){} : requestAnimationFrame
                timeoutID = processor( tick );
            };
            //取得或重设_useRAF，并执行动画（内部通过调用fps方法实现）
            this.useRAF = function(value) {
                if (!arguments.length) {
                    return _useRAF;
                }
                if(timeoutID) {
                    cancelAnimationFrame(timeoutID)
                    timeoutID =null;
                }
                _useRAF = value;
                ticker.fps(_fps);
            };
            ticker.fps(fps);
            //iOS safari有时会因为一些BUG不能启动requestAnimationFrame，我们延迟一秒，如果再不执行就倒退
            //使用setTimeout来实现
            window.setTimeout(function() {
                if (_useRAF && !timeoutID) {
                    ticker.useRAF(false);
                }
            }, 1000);
        }
    })
    /* 例子*/
    //    var a = new Ticker()
    //    a.addEventListener("tick", function(e){
    //        $.log(e)
    //    })

    var globalAnimationInit = false,
    globalAnimationTicker = new Ticker,
    _rootFramesTimeline , _rootTimeline;

    var Animation =  $.factory({
        init: function(duration, vars) {
            this.vars = vars || {};
            this._duration = this._totalDuration = duration || 0;
            this._delay = Number(this.vars.delay) || 0;
            this._timeScale = 1;
            this._active = (this.vars.immediateRender === true);
            this.data = this.vars.data;
            this._reversed = (this.vars.reversed === true);

            if (!_rootTimeline) {
                return;
            }
            if (!globalAnimationInit) {
                globalAnimationTicker.tick(); //the first time an animation (tween or timeline) is created, we should refresh the time in order to avoid a gap. The Ticker's initial time that it records might be very early in the load process and the user may have loaded several other large scripts in the mean time, but we want tweens to act as though they started when the page's onload was fired. Also remember that the requestAnimationFrame likely won't be called until the first screen redraw.
                globalAnimationInit = true;
            }

            var tl = this.vars.useFrames ? _rootFramesTimeline : _rootTimeline;
            tl.insert(this, tl._time);

            if (this.vars.paused) {
                this.paused(true);
            }
        },
        play: function(from, suppressEvents) {
            if (arguments.length) {
                this.seek(from, suppressEvents);
            }
            this.reversed(false);
            return this.paused(false);
        },
        pause: function(atTime, suppressEvents) {
            if (arguments.length) {
                this.seek(atTime, suppressEvents);
            }
            return this.paused(true);
        },
        resume: function(from, suppressEvents) {
            if (arguments.length) {
                this.seek(from, suppressEvents);
            }
            return this.paused(false);
        },
        seek: function(time, suppressEvents) {
            return this.totalTime(Number(time), (suppressEvents != false));
        },

        restart: function(includeDelay, suppressEvents) {
            this.reversed(false);
            this.paused(false);
            return this.totalTime((includeDelay) ? -this._delay : 0, (suppressEvents !== false));
        },

        reverse: function(from, suppressEvents) {
            if (arguments.length) {
                this.seek((from || this.totalDuration()), suppressEvents);
            }
            this.reversed(true);
            return this.paused(false);
        },

        render: function() { },

        invalidate: function() {
            return this;
        },

        _enabled: function (enabled, ignoreTimeline) {
            this._gc = !enabled;
            this._active = (enabled && !this._paused && this._totalTime > 0 && this._totalTime < this._totalDuration);
            if (ignoreTimeline !== true) {
                if (enabled && this.timeline == null) {
                    this._timeline.insert(this, this._startTime - this._delay);
                } else if (!enabled && this.timeline != null) {
                    this._timeline._remove(this, true);
                }
            }
            return false;
        },

        kill: function( ) {
            this._enabled(false, false);
            return this;
        },

        _uncache: function(includeSelf) {
            var tween = includeSelf ? this : this.timeline;
            while (tween) {
                tween._dirty = true;
                tween = tween.timeline;
            }
            return this;
        },
        //----Animation getters/setters --------------------------------------------------------
        eventCallback: function(type, callback, params, scope) {
            if (type == null) {
                return null;
            } else if (type.substr(0,2) === "on") {
                if (arguments.length === 1) {
                    return this.vars[type];
                }
                if (callback == null) {
                    delete this.vars[type];
                } else {
                    this.vars[type] = callback;
                    this.vars[type + "Params"] = params;
                    this.vars[type + "Scope"] = scope;
                    if (params) {
                        var i = params.length;
                        while (--i > -1) {
                            if (params[i] === "{self}") {
                                params = this.vars[type + "Params"] = params.concat(); //copying the array avoids situations where the same array is passed to multiple tweens/timelines and {self} doesn't correctly point to each individual instance.
                                params[i] = this;
                            }
                        }
                    }
                }
                if (type === "onUpdate") {
                    this._onUpdate = callback;
                }
            }
            return this;
        },
        delay: function(value) {
            if (!arguments.length) {
                return this._delay;
            }
            if (this._timeline.smoothChildTiming) {
                this.startTime( this._startTime + value - this._delay );
            }
            this._delay = value;
            return this;
        },

        duration: function(value) {
            if (!arguments.length) {
                this._dirty = false;
                return this._duration;
            }
            this._duration = this._totalDuration = value;
            this._uncache(true); //true in case it's a TweenMax or TimelineMax that has a repeat - we'll need to refresh the totalDuration.
            if (this._timeline.smoothChildTiming) if (this._time > 0) if (this._time < this._duration) if (value !== 0) {
                this.totalTime(this._totalTime * (value / this._duration), true);
            }
            return this;
        },
        totalDuration: function(value) {
            this._dirty = false;
            return (!arguments.length) ? this._totalDuration : this.duration(value);
        },

        time: function(value, suppressEvents) {
            if (!arguments.length) {
                return this._time;
            }
            if (this._dirty) {
                this.totalDuration();
            }
            if (value > this._duration) {
                value = this._duration;
            }
            return this.totalTime(value, suppressEvents);
        },

        totalTime: function(time, suppressEvents) {
            if (!arguments.length) {
                return this._totalTime;
            }
            if (this._timeline) {
                if (time < 0) {
                    time += this.totalDuration();
                }
                if (this._timeline.smoothChildTiming) {
                    if (this._dirty) {
                        this.totalDuration();
                    }
                    if (time > this._totalDuration) {
                        time = this._totalDuration;
                    }
                    this._startTime = (this._paused ? this._pauseTime : this._timeline._time) - ((!this._reversed ? time : this._totalDuration - time) / this._timeScale);
                    if (!this._timeline._dirty) { //for performance improvement. If the parent's cache is already dirty, it already took care of marking the anscestors as dirty too, so skip the function call here.
                        this._uncache(false);
                    }
                    if (!this._timeline._active) {
                        //in case any of the anscestors had completed but should now be enabled...
                        var tl = this._timeline;
                        while (tl._timeline) {
                            tl.totalTime(tl._totalTime, true);
                            tl = tl._timeline;
                        }
                    }
                }
                if (this._gc) {
                    this._enabled(true, false);
                }
                if (this._totalTime !== time) {
                    this.render(time, suppressEvents, false);
                }
            }
            return this;
        },

        startTime: function(value) {
            if (!arguments.length) {
                return this._startTime;
            }
            if (value != this._startTime) {
                this._startTime = value;
                if (this.timeline) if (this.timeline._sortChildren) {
                    this.timeline.insert(this, value - this._delay); //ensures that any necessary re-sequencing of Animations in the timeline occurs to make sure the rendering order is correct.
                }
            }
            return this;
        },

        timeScale: function(value) {
            if (!arguments.length) {
                return this._timeScale;
            }
            value = value || 0.000001; //can't allow zero because it'll throw the math off
            if (this._timeline && this._timeline.smoothChildTiming) {
                var t = (this._pauseTime || this._pauseTime === 0) ? this._pauseTime : this._timeline._totalTime;
                this._startTime = t - ((t - this._startTime) * this._timeScale / value);
            }
            this._timeScale = value;
            return this._uncache(false);
        },

        reversed: function(value) {
            if (!arguments.length) {
                return this._reversed;
            }
            if (value !== this._reversed) {
                this._reversed = value;
                this.totalTime(this._totalTime, true);
            }
            return this;
        },

        paused: function(value) {
            if (!arguments.length) {
                return this._paused;
            }
            if (value !== this._paused) if (this._timeline) {
                if (!value && this._timeline.smoothChildTiming) {
                    this._startTime += this._timeline.rawTime() - this._pauseTime;
                    this._uncache(false);
                }
                this._pauseTime = (value) ? this._timeline.rawTime() : null;
                this._paused = value;
                this._active = (!this._paused && this._totalTime > 0 && this._totalTime < this._totalDuration);
            }
            if (this._gc) if (!value) {
                this._enabled(true, false);
            }
            return this;
        }
    });


    var p = Animation.prototype;
    "_dirty,_initted,_paused,_gc,_next,_last,_onUpdate,_timeline,timeline".replace(/\w+/g, function(prop){
        p[prop] = false;
    });
    p._totalTime = p._time = 0;
    p._rawPrevTime = -1;


    /*
 * ----------------------------------------------------------------
 * SimpleTimeline
 * ----------------------------------------------------------------
 */
  

    var SimpleTimeline =  $.factory({
        init: function(vars) {
            this.autoRemoveChildren = this.smoothChildTiming = true;
        },
        insert: function(tween, time) {
            tween._startTime = Number(time || 0) + tween._delay;
            if (tween._paused) if (this !== tween._timeline) { //we only adjust the _pauseTime if it wasn't in this timeline already. Remember, sometimes a tween will be inserted again into the same timeline when its startTime is changed so that the tweens in the TimelineLite/Max are re-ordered properly in the linked list (so everything renders in the proper order).
                tween._pauseTime = tween._startTime + ((this.rawTime() - tween._startTime) / tween._timeScale);
            }
            if (tween.timeline) {
                tween.timeline._remove(tween, true); //removes from existing timeline so that it can be properly added to this one.
            }
            tween.timeline = tween._timeline = this;
            if (tween._gc) {
                tween._enabled(true, true);
            }

            var prevTween = this._last;
            if (this._sortChildren) {
                var st = tween._startTime;
                while (prevTween && prevTween._startTime > st) {
                    prevTween = prevTween._prev;
                }
            }
            if (prevTween) {
                tween._next = prevTween._next;
                prevTween._next = tween;
            } else {
                tween._next = this._first;
                this._first = tween;
            }
            if (tween._next) {
                tween._next._prev = tween;
            } else {
                this._last = tween;
            }
            tween._prev = prevTween;

            if (this._timeline) {
                this._uncache(true);
            }
            return this;
        },
        _remove: function(tween, skipDisable) {
            if (tween.timeline === this) {
                if (!skipDisable) {
                    tween._enabled(false, true);
                }
                tween.timeline = null;

                if (tween._prev) {
                    tween._prev._next = tween._next;
                } else if (this._first === tween) {
                    this._first = tween._next;
                }
                if (tween._next) {
                    tween._next._prev = tween._prev;
                } else if (this._last === tween) {
                    this._last = tween._prev;
                }

                if (this._timeline) {
                    this._uncache(true);
                }
            }
            return this;
        },
        render: function(time, suppressEvents, force) {
            var tween = this._first,
            next;
            this._totalTime = this._time = this._rawPrevTime = time;
            while (tween) {
                next = tween._next; //record it here because the value could change after rendering...
                if (tween._active || (time >= tween._startTime && !tween._paused)) {
                    if (!tween._reversed) {
                        tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, false);
                    } else {
                        tween.render(((!tween._dirty) ? tween._totalDuration : tween.totalDuration()) - ((time - tween._startTime) * tween._timeScale), suppressEvents, false);
                    }
                }
                tween = next;
            }
        },
        rawTime: function() {
            return this._totalTime;
        }
    });
    p = SimpleTimeline.prototype;
    p.kill()._gc = false;
    p._first = p._last = null;
    p._sortChildren = false;


})

