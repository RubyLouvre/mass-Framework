//=========================================
// 特效模块v3
//==========================================
$.define("fx", "css",function(){
    //$.log("已加载fx模块");
    var types = {
        color:/color/i,
        transform:/rotate|scaleX|scaleY|translateX|translateY/i,
        scroll:/scroll/i,
        _default:/fontSize|fontWeight|opacity|width|height|top$|bottom$|left$|right$/i
    },
    rfxnum = /^([+\-/\*]=)?([\d+.\-]+)([a-z%]*)$/i;
    var adapter = $.fxAdapter = {
        _default:{
            get:function(el, prop) {
                return $.css(el,prop);
            },
            tween :function(form,change,name,per) {
                var a = (form + change * $.easing[name](per)).toFixed(3);
                return isNaN(a) ? 0 : a;
            }
        },
        type: function (attr){//  用于取得适配器的类型
            for(var i in types){
                if(types[i].test(attr)){
                    return i;
                }
            }
            return "_default";
        }
    }

    var tween = adapter._default.tween;
    $.mix(adapter,{
        scroll : {
            get: function(el, prop){
                return el[prop];
            },
            tween: tween
        },
        transform:{
            get: function(el, prop){
                return $.transform(el)[prop]
            },
            set:function(el,t2d,isEnd,per){
                var obj = {}

                for(var name in t2d){
                    obj[name] = isEnd ? t2d[name][1] : tween(t2d[name][0],t2d[name][2],t2d[name][3],per);
                }
                $.transform(el,obj);
            }
        },
        color : {
            get:function(el,prop){
                return  $.css(el,prop);
            },
            tween:function(f0,f1,f2,c0,c1,c2,name,per,i){
                var delta = $.easing[name](per), ret = [];
                for(i = 0;i < 3;i++){
                    ret[i] = Math.max(Math.min((arguments[i] +arguments[i+3] * delta)|0, 255), 0);
                }
                return "rgb("+ret+")";
            }
        }
    } );
    //中央定时器，可以添加新节点到中央列队，然后通过setInterval方法不断调用nextTick处理所有节点的动画
    function heartbeat( node) {
        heartbeat.nodes.push( node);
        if (heartbeat.id === null) {
            heartbeat.id = setInterval(nextTick, 13);//开始心跳
        }
        return true;
    }
    heartbeat.nodes = []; //中央列队
    heartbeat.id = null;  //原始的setInterval id
    //驱动中央列队的元素节点执行它们的动画，如果执行完毕就把它们从列队中剔除，如果列队为空则中止心跳
    function nextTick() {
        var nodes = heartbeat.nodes, i = 0, n = nodes.length;
        for (; i < n; i++) {
            if (animate(nodes[i]) === false) {//在这里操作元素的样式或属性进行渐变
                nodes.splice(i, 1);
                i -= 1;
                n -= 1;
            }
        }
        nodes.length || (clearInterval(heartbeat.id), heartbeat.id = null);
    }
    var keyworks = $.oneObject("before,frame,after,easing,rewind,record");
    //处理特效的入口函数,用于将第二个参数，拆分为两个对象props与config，然后再为每个匹配的元素指定一个双向列队对象linked
    //linked对象包含两个列队，每个列队装载着不同的特效对象
    $.fn.fx = function( duration, hash ){
        var props = hash ||{}, config = {}, p
        if(typeof duration === "function"){
            props.after = duration;
            duration = null;
        }
        for( var name in props){
            p = $.cssName(name) || name;
            if( name != p ){
                props[ p ] = props[ name ];
                delete props[ name ];
            }else if(  keyworks[name] ){
                config[ name ] =  props[ name ] 
                delete props[ name ];
            }
        }
        var easing = (config.easing || "swing").toLowerCase() ;
        config.easing = $.easing[ easing ] ? easing : "swing";
        config.duration = duration || 500;
        config.method = "noop";
        return this.each(function(node){
            var linked = $._data(node,"fx") || $._data( node,"fx",{
                positive: [], //正向列队
                negative: [], //负向列队
                run: false
            });
            linked.positive.push({//fx对象
                startTime:  0,//timestamp
                config:   $.mix({}, config),//各种配置
                props:    $.mix({}, props)//用于渐变的属性
            });
            if(!linked.run){
                linked.run = heartbeat( node);
            }
        });
    }

    function animate( node ) {//linked对象包含两个列队（positive与negative）
        var linked = $._data( node,"fx") ,  fx = linked.positive[0],  now, isEnd, mix;
        if( isFinite( fx ) ){//如果此时调用了delay方法，fx肯定是整型
            setTimeout(function(){
                linked.positive.shift();
                linked.run = heartbeat( node);
            },fx)
            return (fx.run = false)
        }
        if (!fx) { //这里应该用正向列队的长度做判定
            linked.run = false;
        } else {
            var config = fx.config, props = fx.props;
            if (fx.startTime) { // 如果已设置开始时间，说明动画已开始
                now = +new Date;
                switch(linked.stopCode){//如果此时调用了stop方法
                    case 0:
                        fx.render = $.noop;//中断当前动画，继续下一个动画
                        break;
                    case 1:
                        fx.gotoEnd = true;//立即跳到最后一帧，继续下一个动画
                        break;
                    case 2:
                        linked.positive  = linked.negative = [];//清空该元素的所有动画
                        break;
                    case 3:
                        for(var ii=0, _fx; _fx= linked.positive[ii++]; ){
                            _fx.gotoEnd = true;//立即完成该元素的所有动画
                        }
                        break;
                }
                delete linked.stopCode;
                isEnd = fx.gotoEnd || (now >= fx.startTime + config.duration);
                //node, 是否结束, 进度
                fx.render(node, isEnd, (now - fx.startTime)/config.duration); // 处理渐变
                if(fx.render === $.noop) { //立即开始下一个动画
                    linked.positive.shift();
                }else{
                    if( (mix = config.frame ) && !isEnd ){
                        mix.call(node, node, props, fx ) ;
                    }
                }
                if (isEnd) {//如果动画结束，则做还原，倒带，跳出列队等相关操作
                    if(config.method == "hide"){
                        for(var i in config.orig){//还原为初始状态
                            $.css( node, i, config.orig[i] )
                        }
                    }
                    linked.positive.shift(); //去掉播放完的动画
                    mix = config.after;
                    mix &&  mix.call( node, node, fx.props, fx ) ;
                    if (config.rewind && linked.negative.length) {
                        //开始倒带,将负向列队的动画加入播放列表中
                        [].unshift.apply(linked.positive, linked.negative.reverse())
                        linked.negative = []; // 清空负向列队
                    }
                    if (!linked.positive.length) {
                        linked.run = false;
                    }
                }

            } else { // 初始化动画
                fx.render = fxBuilder(node, linked, props, config); // 生成补间动画函数
                mix = config.before
                mix && (mix.call( node, node, fx.props, fx ), config.before = 0);
                $[ config.method ].call(node, node, props, fx );//供show, hide 方法调用
                fx.startTime = now = +new Date;
            }

        }
        return linked.run; // 调用 clearInterval方法，中止定时器
    }
    function visible(node) {
        return  $.css(node, "display") !== 'none';
    }
    function fxBuilder( node, linked, props, config ){
        var ret = "var style = node.style,t2d = {}, adapter = $.fxAdapter , _defaultTween = adapter._default.tween;",
        rewindConfig = $.Object.merge( {}, config ),
        transfromChanged = 0,
        rewindProps = {};
        var orig = config.orig = {}, parts, to, from, val, unit, easing, op, type
        for(var name in props){
            val = props[name] //取得结束值
            if( val == null){
                continue;
            }
            easing = config.easing;//公共缓动公式
            type = $.fxAdapter.type(name);
            from = $.fxAdapter[ type ].get(node,name);
            //用于分解属性包中的样式或属性,变成可以计算的因子
            if( val === "show" || (val === "toggle" && !visible(node))){
                val = $._data(node,"old"+name) || from;
                config.method = "show";
                from = 0;
            }else if(val === "hide" || val === "toggle" ){//hide
                orig[name] =  $._data(node,"old"+name,from);
                config.method = "hide";
                val = 0;
            }else if(typeof val === "object" && isFinite(val.length)){// array
                parts = val;
                val = parts[0];//取得第一个值
                easing = parts[1] || easing;//取得第二个值或默认值
            }
            //开始分解结束值to
            if(type != "color" ){//如果不是颜色，则需判定其有没有单位以及起止值单位不一致的情况
                from = from == "auto" ? 0 : parseFloat(from)//确保from为数字
                if( (parts = rfxnum.exec( val )) ){
                    to = parseFloat( parts[2] ),//确保to为数字
                    unit = $.cssNumber[ name ] ? "" : (parts[3] || "px");
                    if(parts[1]){
                        op = parts[1].charAt(0);
                        if (unit && unit !== "px" && (op == "+" || op == "-")  ) {
                            $.css(node, name, (to || 1) + unit);
                            from = ((to || 1) / parseFloat($.css(node,name))) * from;
                            $.css( node, name, from + unit);
                        }
                        if(op){//处理+=,-= \= *=
                            to = eval(from+op+to);
                        }
                    }
                    var change = to - from;
                }else{
                    continue;
                }
            }else{
                from = color2array(from);
                to   = color2array(val);
                change = to.map(function(end,i){
                    return end - from[i]
                });
            }
            if(from +"" === to +"" ){//不处理初止值都一样的样式与属性
                continue;
            }
            var hash = {
                name: name,
                to: to,
                from: from ,
                change: change,
                type: type,
                easing: easing,
                unit: unit
            };
            switch( type ){
                case "_default":
                    if(name == "opacity" && !$.support.cssOpacity){
                        ret += $.format('$.css(node,"opacity", (isEnd ? #{to} : _defaultTween(#{from},#{change},"#{easing}", per )));;', hash);
                    }else{
                        ret += $.format('style.#{name} = ((isEnd ? #{to} : _defaultTween(#{from}, #{change},"#{easing}",per )))+"#{unit}";', hash);
                    }
                    break;
                case "scroll":
                    ret += $.format('node.#{name} = (isEnd ? #{to}: _defaultTween(#{from}, #{change},"#{easing}",per ));',hash);
                    break;
                case "color":
                    ret += $.format('style.#{name} = (isEnd ? "rgb(#{to})" : adapter.#{type}.tween(#{from}, #{change},"#{easing}",per));', hash);
                    break;
                case "transform":
                    transfromChanged++
                    ret +=  $.format('t2d.#{name} = [#{from},#{to}, #{change},"#{easing}"];',hash);
                    break
            }
            if(type == "color"){
                from = "rgb("+from.join(",")+")"
            }
            rewindProps[ name ] = [ from , easing ];
        }
       
        if( transfromChanged ){
            ret += 'adapter.transform.set(node, t2d, isEnd, per);'
        }
        if ( config.record || config.rewind ) {
            delete rewindConfig.record;
            delete rewindConfig.rewind;
            linked.negative.push({
                startTime: 0,
                rewinding: 1,//标识正在倒带
                config: rewindConfig,
                props: rewindProps
            });
        }
        //生成补间函数
        return Function( "node,isEnd,per",ret );
    }

    $.easing = {
        linear: function( pos ) {
            return pos;
        },
        swing: function( pos ) {
            return (-Math.cos(pos*Math.PI)/2) + 0.5;
        }
    }

    var colorMap = {
        "black":[0,0,0],
        "silver":[192,192,192],
        "gray":[128,128,128],
        "white":[255,255,255],
        "maroon":[128,0,0],
        "red":[255,0,0],
        "purple":[128,0,128],
        "fuchsia":[255,0,255],
        "green":[0,128,0],
        "lime":[0,255,0],
        "olive":[128,128,0],
        "yellow":[255,255,0],
        "navy":[0,0,128],
        "blue":[0,0,255],
        "teal":[0,128,128],
        "aqua":[0,255,255]
    };
    var sandbox,sandboxDoc;
    function callSandbox(parent,callback){
        if ( !sandbox ) {
            sandbox = document.createElement( "iframe" );
            sandbox.frameBorder = sandbox.width = sandbox.height = 0;
        }
        parent.appendChild(sandbox);
        if ( !sandboxDoc || !sandbox.createElement ) {
            sandboxDoc = ( sandbox.contentWindow || sandbox.contentDocument ).document;
            sandboxDoc.write( ( document.compatMode === "CSS1Compat" ? "<!doctype html>" : "" ) + "<html><body>" );
            sandboxDoc.close();
        }
        callback(sandboxDoc);
        parent.removeChild(sandbox);
    }
    function parseColor(color) {
        var value;
        callSandbox( $.html, function(doc){
            var range = doc.body.createTextRange();
            doc.body.style.color = color;
            value = range.queryCommandValue("ForeColor");
        });
        return [value & 0xff, (value & 0xff00) >> 8,  (value & 0xff0000) >> 16];
    }
    function color2array(val) {//将字符串变成数组
        var color = val.toLowerCase(),ret = [];
        if (colorMap[color]) {
            return colorMap[color];
        }
        if (color.indexOf("rgb") == 0) {
            var match = color.match(/(\d+%?)/g),
            factor = match[0].indexOf("%") !== -1 ? 2.55 : 1
            return (colorMap[color] = [ parseInt(match[0]) * factor , parseInt(match[1]) * factor, parseInt(match[2]) * factor ]);
        } else if (color.charAt(0) == '#') {
            if (color.length == 4)
                color = color.replace(/([^#])/g, '$1$1');
            color.replace(/\w{2}/g,function(a){
                ret.push( parseInt(a, 16))
            });
            return (colorMap[color] = ret);
        }
        if(window.VBArray){
            return (colorMap[color] = parseColor(color));
        }
        return colorMap.white;
    }

    var cacheDisplay = $.oneObject("a,abbr,b,span,strong,em,font,i,img,kbd","inline");
    var blocks = $.oneObject("div,h1,h2,h3,h4,h5,h6,section,p","block");
    $.mix(cacheDisplay ,blocks);
    function parseDisplay( nodeName ) {
        if ( !cacheDisplay[ nodeName ] ) {
            var body = document.body, elem = document.createElement(nodeName);
            body.appendChild(elem)
            var display = $.css( elem, "display" );
            body.removeChild(elem);
            // 先尝试连结到当前DOM树去取，但如果此元素的默认样式被污染了，就使用iframe去取
            if ( display === "none" || display === "" ) {
                callSandbox(body, function(doc){
                    elem = doc.createElement( nodeName );
                    doc.body.appendChild( elem );
                    display = $.css( elem, "display" );
                });
            }
            cacheDisplay[ nodeName ] = display;
        }
        return cacheDisplay[ nodeName ];
    }
    //show 开始时计算其width1 height1 保存原来的width height display改为inline-block或block overflow处理 赋值（width1，height1）
    //hide 保存原来的width height 赋值为(0,0) overflow处理 结束时display改为none;
    //toggle 开始时判定其是否隐藏，使用再决定使用何种策略
    $.mix( $, {
        fx:  function ( nodes, duration, hash, effects ){
            nodes = nodes.mass ? nodes : $(nodes);
            var props =  hash || duration || {}
            if(typeof duration === "function"){// fx(obj fn)
                hash = duration;               // fx(obj, 500, fn)
                duration = 500;
            }
            if(typeof hash === "function"){   //  fx(obj, num, fn)
                props.after = hash;           //  fx(obj, num, {after: fn})
            }
            if(effects){
                for(var i in effects){
                    if(typeof effects[i] === "function"){
                        var old = props[i];
                        props[i] = function(node, props, fx ){
                            effects[i].call(node, node, props, fx);
                            if(typeof old === "function"){
                                old.call(node, node, props, fx);
                            }
                        }
                    }else{
                        props[i] = effects[i]
                    }
                }
            }
            return nodes.fx(duration, props);
        },
        show: function(node, props){
            if(node.nodeType == 1 && !visible(node)) {
                var old =  $._data(node, "olddisplay"),
                _default = parseDisplay(node.nodeName),
                display = node.style.display = (old || _default);
                $._data(node, "olddisplay", display);
                node.style.visibility = "visible";
                if(props && ("width" in props || "height" in props)){//如果是缩放操作
                    //修正内联元素的display为inline-block，以让其可以进行width/height的动画渐变
                    if ( display === "inline" && $.css( node, "float" ) === "none" ) {
                        if ( !$.support.inlineBlockNeedsLayout ) {//w3c
                            node.style.display = "inline-block";
                        } else {//IE
                            if ( _default === "inline" ) {
                                node.style.display = "inline-block";
                            }else {
                                node.style.display = "inline";
                                node.style.zoom = 1;
                            }
                        }
                    }
                }
            }
        },
        hide: function(node, props, fx){
            if(node.nodeType == 1 && visible(node)){
                var config = fx && fx.config;
                var display = $.css( node, "display" );
                if ( display !== "none" && !$._data( node, "olddisplay" ) ) {
                    $._data( node, "olddisplay", display );
                }
                if( config ){//缩小
                    if("width" in props || "height" in props){//如果是缩放操作
                        //确保内容不会溢出,记录原来的overflow属性，因为IE在改变overflowX与overflowY时，overflow不会发生改变
                        config.overflow = [ node.style.overflow, node.style.overflowX, node.style.overflowY ];
                        node.style.overflow = "hidden";
                    }
                    var after = config.after;
                    config.after = function( node, fx, props ){
                        node.style.display = "none";
                        node.style.visibility = "hidden";
                        if ( config.overflow != null && !$.support.keepSize  ) {
                            [ "", "X", "Y" ].forEach(function (postfix,index) {
                                node.style[ "overflow" + postfix ] = config.overflow[index]
                            });
                        }
                        if(typeof after == "function"){
                            after.call( node, node, props, fx );
                        }
                    };
                }else{
                    node.style.display = "none";
                }
            }
        },
        toggle: function( node ){
            $[ visible(node) ? "hide" : "show" ]( node );
        }
    });
    //如果clearQueue为true，是否清空列队
    //如果jumpToEnd为true，是否跳到此动画最后一帧
    $.fn.stop = function( clearQueue, jumpToEnd ){
        clearQueue = clearQueue ? "1" : ""
        jumpToEnd = jumpToEnd ? "1" : "0"
        var stopCode = parseInt( clearQueue+jumpToEnd,2 );//返回0 1 2 3
        return this.each(function(node){
            var linked = $._data( node,"fx");
            if(linked && linked.run){
                linked.stopCode = stopCode;
            }
        });
    }
    // 0 1
    $.fn.delay = function(ms){
        return this.each(function(node){
            var linked = $._data(node,"fx") || $._data( node,"fx",{
                positive:[], //正向列队
                negative:  [], //负向列队
                run: false //
            });
            linked.positive.push(ms);
        });
    }

    var fxAttrs = [
    [ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
    [ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ],
    ["opacity"]
    ]
    function genFx( type, num ) {//生成属性包
        var obj = {};
        fxAttrs.concat.apply([], fxAttrs.slice(0,num)).forEach(function(name) {
            obj[ name ] = type;
        });
        return obj;
    }
    var effects = {
        slideDown: genFx( "show", 1 ),
        slideUp: genFx( "hide", 1 ),
        slideToggle: genFx( "toggle", 1 ),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }

    Object.keys(effects).forEach(function( method ){
        $.fn[ method ] = function( duration, hash ){
            return $.fx( this, duration, hash, effects[method] );
        }
    });
  
    "show,hide".replace( $.rword, function( method ){
        $.fn[ method ] = function(duration, hash){
            if(!arguments.length){
                return this.each(function(){
                    $[ method ]( this );
                })
            }else{
                return $.fx( this, duration, hash, genFx( method , 3) );
            }
        }
    })
    var _toggle = $.fn.toggle;
    $.fn.toggle = function(duration,hash){
        if(!arguments.length){
            return this.each(function(node) {
                $.toggle( node );
            });
        }else if(typeof duration === "function" && typeof duration === "function" ){
            return _toggle.apply(this,arguments)
        }else{
            return $.fx(this, duration, hash, genFx("toggle", 3));
        }
    }
    function beforePuff( node, props, fx ) {
        var position = $.css(node,"position"),
        width = $.css(node,"width"),
        height = $.css(node,"height"),
        left = $.css(node,"left"),
        top = $.css(node,"top");
        node.style.position = "relative";
        $.mix(props, {
            width: "*=1.5",
            height: "*=1.5",
            opacity: "hide",
            left: "-=" + parseInt(width) * 0.25,
            top: "-=" + parseInt(height) * 0.25
        });
        var after = fx.config.after;
        fx.config.after = function( node, props, fx ){
            node.style.position = position;
            node.style.width = width;
            node.style.height = height;
            node.style.left = left;
            node.style.top = top;
            if(typeof after === "function"){
                after.call( node, node, props, fx );
            }
        }
    }
    //扩大1.5倍并淡去
    $.fn.puff = function(duration, hash) {
        return $.fx( this, duration, hash, {
            before:beforePuff
        });
    }
});


//2011.10.10 改进dom.fn.stop
//2011.10.20 改进所有特效函数，让传参更加灵活
//2011.10.21 改进内部的normalizer函数
//2012.2.19 normalizer暴露为$.fx 改进绑定回调的机制
//http://d.hatena.ne.jp/nakamura001/20110823/1314112008
//http://easeljs.com/
//https://github.com/gskinner/TweenJS/tree/
//http://caniuse.com/
//http://gitcp.com/sorenbs/jsgames-articles/resources
//http://www.kesiev.com/akihabara/
//http://www.effectgames.com/effect/
//http://www.effectgames.com/effect/#Article/joe/My_HTML5_CSS3_Browser_Wish_List
//http://www.effectgames.com/games/absorb-hd/
//日本人写的框架,可以参考一下其事件部分http://www.karmagination.com/
//http://shanabrian.com/web/library/cycle.php
//http://slodive.com/freebies/jquery-animate/
//http://wonderfl.net/search?page=2&q=DoTweener
//http://www.phoboslab.org/ztype/
//http://kangax.github.com/fabric.js/kitchensink/

        