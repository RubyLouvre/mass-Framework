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
    var _getTime = Date.now || function() {
        return new Date().getTime();
    };
    if(a && b){
        var _reqAnimFrame = window[a];
        var _cancelAnimFrame = window[b];
        console.log(a)
        console.log(b)
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
            //a bug in iOS 6 Safari occasionally prevents the requestAnimationFrame from working initially, 
            //so we use a 1-second timeout that automatically falls back to setTimeout() if it senses this condition.
            window.setTimeout(function() {
                if (_useRAF && !timeoutID) {
                    ticker.useRAF(false);
                }
            }, 1000);
        }
    })
    /* 例子*/
    var a = new Ticker()
    a.addEventListener("tick", function(e){
        $.log(e)
    })


//   var a = new Ticker()
//  console.log(a)
})

