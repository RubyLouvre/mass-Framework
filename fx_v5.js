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


    var ad =  $.fxAdapter = { }
    "scaleX,scaleY,x,y,rotation,skewX,skewY,scale".replace(/\w+/g,function(name){
        ad[name] = function(v){
            //如果已经解析过就不用重新解析
            if (this._transform) {
                return;
            }
            var m1 = this._transform = $._getTransform(this.node, true),
            s = this._style,
            min = 0.000001,
            m2, skewY, p, pt, copy, orig;
            if (typeof(v) === "object") { //for values like scaleX, scaleY, rotation, x, y, skewX, and skewY or transform:{...} (object)
                m2 = {
                    scaleX: _parseVal((v.scaleX != null) ? v.scaleX : v.scale, m1.scaleX),
                    scaleY: _parseVal((v.scaleY != null) ? v.scaleY : v.scale, m1.scaleY),
                    x:_parseVal(v.x, m1.x),
                    y:_parseVal(v.y, m1.y)
                };

                if (v.shortRotation != null) {
                    m2.rotation = (typeof(v.shortRotation) === "number") ? v.shortRotation * _DEG2RAD : _parseAngle(v.shortRotation, m1.rotation);
                    var dif = (m2.rotation - m1.rotation) % (Math.PI * 2);
                    if (dif !== dif % Math.PI) {
                        dif += Math.PI * ((dif < 0) ? 2 : -2);
                    }
                    m2.rotation = m1.rotation + dif;

                } else {
                    m2.rotation = (v.rotation == null) ? m1.rotation : (typeof(v.rotation) === "number") ? v.rotation * _DEG2RAD : _parseAngle(v.rotation, m1.rotation);
                }
                m2.skewX = (v.skewX == null) ? m1.skewX : (typeof(v.skewX) === "number") ? v.skewX * _DEG2RAD : _parseAngle(v.skewX, m1.skewX);

                //note: for performance reasons, we combine all skewing into the skewX and rotation values, ignoring skewY but we must still record it so that we can discern how much of the overall skew is attributed to skewX vs. skewY. Otherwise, if the skewY would always act relative (tween skewY to 10deg, for example, multiple times and if we always combine things into skewX, we can't remember that skewY was 10 from last time). Remember, a skewY of 10 degrees looks the same as a rotation of 10 degrees plus a skewX of -10 degrees.
                m2.skewY = (v.skewY == null) ? m1.skewY : (typeof(v.skewY) === "number") ? v.skewY * _DEG2RAD : _parseAngle(v.skewY, m1.skewY);
                if ((skewY = m2.skewY - m1.skewY)) {
                    m2.skewX += skewY
                    m2.rotation += skewY;
                }
                //don't allow rotation/skew values to be a SUPER small decimal because when they're translated back to strings for setting the css property, the browser reports them in a funky way, like 1-e7. Of course we could use toFixed() to resolve that issue but that hurts performance quite a bit with all those function calls on every frame, plus it is virtually impossible to discern values that small visually (nobody will notice changing a rotation of 0.0000001 to 0, so the performance improvement is well worth it).
                if (m2.skewY < min) if (m2.skewY > -min) {
                    m2.skewY = 0;
                }
                if (m2.skewX < min) if (m2.skewX > -min) {
                    m2.skewX = 0;
                }
                if (m2.rotation < min) if (m2.rotation > -min) {
                    m2.rotation = 0;
                }

                //if a transformOrigin is defined, handle it here...
                if ((orig = v.transformOrigin) != null) {
                    if (_transformProp) {
                        p = _transformProp + "Origin";
                        this._firstPT = pt = {
                            _next:this._firstPT,
                            t:s,
                            p:p,
                            s:0,
                            c:0,
                            n:p,
                            f:false,
                            r:false,
                            b:s[p],
                            e:orig,
                            i:orig,
                            type:-1,
                            sfx:""
                        };
                        if (pt._next) {
                            pt._next._prev = pt;
                        }

                    //for older versions of IE (6-8), we need to manually calculate things inside the setRatio() function. We record origin x and y (ox and oy) and whether or not the values are percentages (oxp and oyp).
                    } else {
                        _parsePosition(orig, m1);
                    }
                }
                var p = name;
                if (m1[p] !== m2[p] )  {
                    this._firstPT = pt = {
                        _next:this._firstPT,
                        t:m1,
                        p:p,
                        s:m1[p],
                        c:m2[p] - m1[p],
                        n:p,
                        f:false,
                        r:false,
                        b:m1[p],
                        e:m2[p],
                        type:0,
                        sfx:0
                    };
                    if (pt._next) {
                        pt._next._prev = pt;
                    }
                }
            }
        }
    })


    function Fx(){}

    Fx.prototype = {
        parseVars: function(vars){
            var t = this.node, s = t.style
            for(var p in vars){

                }
            if (_transformMap[p] || p === "transformOrigin") {
                this._parseTransform(t, vars, cs, map);
         //   continue;

            }
        }
    }
    p._parseVars = function(vars, t, cs, map) {
        var s = this._style,//元素的style对象
        p, v, pt, beg, clr1, clr2, bsfx, esfx, rel, start, copy, isStr;

        for (p in vars) {

            v = vars[p];
            //如果是变形
            if (_transformMap[p] || p === "transformOrigin") {
                this._parseTransform(t, vars, cs, map);
                continue;

            } else if (p === "backgroundPosition" || p === "backgroundSize") {
                pt = _parsePosition(v); //end values
                start = _parsePosition( (beg = _getStyle(t, p, cs)) ); //starting values
                this._firstPT = pt = {
                    _next:this._firstPT,
                    t:s,
                    p:p,
                    b:beg,
                    f:false,
                    n:"css_" + p,
                    type:3,      //拥有两个值的字符串
                    s:start.ox, //x start
                    c:pt.oxr ? pt.ox : pt.ox - start.ox, //change in x
                    ys:start.oy, //y start
                    yc:pt.oyr ? pt.oy : pt.oy - start.oy, //change in y
                    sfx:pt.oxp ? "%" : "px", //x suffix
                    ysfx:pt.oyp ? "%" : "px", //y suffix
                    r:(!pt.oxp && vars.autoRound !== false)
                };
                pt.e = (pt.s + pt.c) + pt.sfx + " " + (pt.ys + pt.yc) + pt.ysfx; //we can't just use v because it could contain relative values, like +=50px which is an illegal final value.
                continue;
            } else if (p === "border") {
                copy = (v + "").split(" ");
                this._parseVars({
                    borderWidth:copy[0],
                    borderStyle:copy[1] || "none",
                    borderColor:copy[2] || "#000000"
                }, t, cs, map);
                continue;
            } else if (p === "bezier") {
                this._parseBezier(v, t, cs, map);
                continue;
            } else if (p === "autoRound") {
                continue;
            }

            beg = _getStyle(t, p, cs);
            beg = (beg != null) ? beg + "" : ""; //make sure beginning value is a string. Don't do beg = _getStyle(...) || "" because if _getStyle() returns 0, it will make it "" since 0 is a "falsey" value.

            //Some of these properties are in place in order to conform with the standard PropTweens in TweenPlugins so that overwriting and roundProps occur properly. For example, f and r may seem unnecessary here, but they enable other functionality.
            //_next:*	next linked list node		[object]
            //t: 	*	target 						[object]
            //p:	*	property (camelCase)		[string]
            //s: 	*	starting value				[number]
            //c:	*	change value				[number]
            //f:	* 	is function					[boolean]
            //n:	*	name (for overwriting)		[string]
            //sfx:		suffix						[string]
            //b:		beginning value				[string]
            //i:		intermediate value			[string]
            //e: 		ending value				[string]
            //r:	*	round						[boolean]
            //type:		0=normal, 1=color, 2=rgba, 3=positional offset (like backgroundPosition or backgroundSize), 4=unsupported opacity (ie), -1=non-tweening prop	[number]
            this._firstPT = pt = {
                _next:this._firstPT,
                t:s,
                p:p,
                b:beg,
                f:false,
                n:"css_" + p,
                sfx:"",
                r:false,
                type:0
            };

            //if it's an autoAlpha, add a new PropTween for "visibility". We must make sure the "visibility" PropTween comes BEFORE the "opacity" one in order to work around a bug in old versions of IE tht would ignore "visibility" changes if made right after an alpha change. Remember, we add PropTweens in reverse order - that's why we do this here, after creating the original PropTween.
            if (p === "opacity") if (vars.autoAlpha != null) {
                if (beg === "1") if (_getStyle(t, "visibility", cs) === "hidden") { //if visibility is initially set to "hidden", we should interpret that as intent to make opacity 0.
                    beg = pt.b = "0";
                }
                this._firstPT = pt._prev = {
                    _next:pt,
                    t:s,
                    p:"visibility",
                    f:false,
                    n:"css_visibility",
                    r:false,
                    type:-1,               //透明度
                    b:(Number(beg) !== 0) ? "visible" : "hidden",
                    i:"visible",
                    e:(Number(v) === 0) ? "hidden" : "visible"
                };
                this._overwriteProps.push("css_visibility");
            }

            isStr = (typeof(v) === "string");

            //color values must be split apart into their R, G, B (and sometimes alpha) values and tweened independently.
            if (p === "color" || p === "fill" || p === "stroke" || p.indexOf("Color") !== -1 || (isStr && !v.indexOf("rgb("))) { //Opera uses background: to define color sometimes in addition to backgroundColor:
                clr1 = _parseColor(beg);
                clr2 = _parseColor(v);
                pt.e = pt.i = ((clr2.length > 3) ? "rgba(" : "rgb(") + clr2.join(",") + ")"; //don't just do pt.e = v because that won't work if the destination color is numeric, like 0xFF0000. We need to parse it.
                pt.b = ((clr1.length > 3) ? "rgba(" : "rgb(") + clr1.join(",") + ")"; //normalize to rgb in case the beginning value was passed in as numeric, like 0xFF0000
                pt.s = Number(clr1[0]);				//red starting value
                pt.c = Number(clr2[0]) - pt.s;		//red change
                pt.gs = Number(clr1[1]);			//green starting value
                pt.gc = Number(clr2[1]) - pt.gs;	//green change
                pt.bs = Number(clr1[2]);			//blue starting value
                pt.bc = Number(clr2[2]) - pt.bs;	//blue change
                pt.type = 1;
                if (clr1.length > 3 || clr2.length > 3) { //detect an rgba() value
                    if (_supportsOpacity) {
                        pt.as = (clr1.length < 4) ? 1 : Number(clr1[3]);
                        pt.ac = ((clr2.length < 4) ? 1 : Number(clr2[3])) - pt.as;
                        pt.type = 2; //使用RGB格式
                    } else { //older versions of IE don't support rgba(), so if the destination alpha is 0, just use "transparent" for the color and make it a non-tweening property
                        if (clr2[3] == 0) {
                            pt.e = pt.i = "transparent";
                            pt.type = -1;
                        }
                        if (clr1[3] == 0) {
                            pt.b = "transparent";
                        }
                    }
                }

            } else {

                bsfx = beg.replace(_suffixExp, ""); //beginning suffix

                if (beg === "" || beg === "auto") {
                    if (p === "width" || p === "height") {
                        start = _getDimension(p, t, cs);
                        bsfx = "px";
                    } else {
                        start = (p !== "opacity") ? 0 : 1;
                        bsfx = "";
                    }
                } else {
                    start = (beg.indexOf(" ") === -1) ? parseFloat(beg.replace(_NaNExp, "")) : NaN;
                }

                if (isStr) {
                    rel = (v.charAt(1) === "=");
                    esfx = v.replace(_suffixExp, "");
                    v = (v.indexOf(" ") === -1) ? parseFloat(v.replace(_NaNExp, "")) : NaN;
                } else {
                    rel = false;
                    esfx = "";
                }

                if (esfx === "") {
                    esfx = map[p] || bsfx; //populate the end suffix, prioritizing the map, then if none is found, use the beginning suffix.
                }

                pt.e = (v || v === 0) ? (rel ? v + start : v) + esfx : vars[p]; //ensures that any += or -= prefixes are taken care of. Record the end value before normalizing the suffix because we always want to end the tween on exactly what they intended even if it doesn't match the beginning value's suffix.

                //if the beginning/ending suffixes don't match, normalize them...
                if (bsfx !== esfx) if (esfx !== "") if (v || v === 0) if (start || start === 0) {
                    start = _convertToPixels(t, p, start, bsfx);
                    if (esfx === "%") {
                        start /= _convertToPixels(t, p, 100, "%") / 100;
                        if (start > 100) { //extremely rare
                            start = 100;
                        }

                    } else if (esfx === "em") {
                        start /= _convertToPixels(t, p, 1, "em");

                    //otherwise convert to pixels.
                    } else {
                        v = _convertToPixels(t, p, v, esfx);
                        esfx = "px"; //we don't use bsfx after this, so we don't need to set it to px too.
                    }
                    if (rel) if (v || v === 0) {
                        pt.e = (v + start) + esfx; //the changes we made affect relative calculations, so adjust the end value here.
                    }
                }

                if ((start || start === 0) && (v || v === 0) && (pt.c = (rel ? v : v - start))) { //faster than isNaN(). Also, we set pt.c (change) here because if it's 0, we'll just treat it like a non-tweening value. can't do (v !== start) because if it's a relative value and the CHANGE is identical to the START, the condition will fail unnecessarily.
                    pt.s = start;
                    pt.sfx = esfx;
                    if (p === "opacity") {
                        if (!_supportsOpacity) {
                            pt.type = 4;//IE透明度
                            pt.p = "filter";
                            pt.b = "alpha(opacity=" + (pt.s * 100) + ")";
                            pt.e = "alpha(opacity=" + ((pt.s + pt.c) * 100) + ")";
                            pt.dup = (vars.autoAlpha != null); //dup = duplicate the setting of the alpha in order to work around a bug in IE7 and IE8 that prevents changes to "visibility" from taking effect if the filter is changed to a different alpha(opacity) at the same time. Setting it to the SAME value first, then the new value works around the IE7/8 bug.
                            this._style.zoom = 1; //helps correct an IE issue.
                        }
                    } else if (_autoRound !== false && (esfx === "px" || p === "zIndex")) { //always round zIndex, and as long as autoRound isn't false, round pixel values (that improves performance in browsers typically)
                        pt.r = true;
                    }
                } else {
                    pt.type = -1;
                    pt.i = (p === "display" && pt.e === "none") ? pt.b : pt.e; //intermediate value is typically the same as the end value except for "display"
                    pt.s = pt.c = 0;
                }

            }

            this._overwriteProps.push("css_" + p);
            if (pt._next) {
                pt._next._prev = pt;
            }
        }

    }
});