//=========================================
// 特效模块v4
//==========================================
$.define("fx", "css",function(){
    //setInterval
    //中央定时器，可以添加新节点到中央列队，然后通过setInterval方法不断调用nextTick处理所有节点的动画
    var delays = {};
    $.easing = {
        linear: function( pos ) {
            return pos;
        },
        swing: function( pos ) {
            return (-Math.cos(pos*Math.PI)/2) + 0.5;
        }
    }
    function heartbeat( fn ) {
        if(delays[fn.uuid]){
            delays[fn.uuid].push(fn)
        }else{
            heartbeat.queue.push( fn );
        }
        if (heartbeat.id === null) {
            heartbeat.id = setInterval(nextTick, 13);//开始心跳
        }
        return true;
    }
    heartbeat.queue = []; //中央列队
    heartbeat.id = null;  //原始的setInterval id
    //驱动中央列队的元素节点执行它们的动画，如果执行完毕就把它们从列队中剔除，如果列队为空则中止心跳
    function nextTick() {
        var queue = heartbeat.queue, i = 0, n = queue.length;
        for (; i < n; i++) {
            if ( animate(queue[i]) === false) {//在这里操作元素的样式或属性进行渐变
                queue.splice(i, 1);
                i -= 1;
                n -= 1;
            }
        }
        queue.length || (clearInterval(heartbeat.id), heartbeat.id = null);
    }
    
    $.fn.fx = function( duration, hash ){
        var p
        if(typeof duration === "number" && $.isPlainObject(hash) ){
            for( var name in hash){
                p = $.cssName(name) || name;
                if( name != p ){
                    hash[ p ] = hash[ name ];//收集用于渐变的属性
                    delete hash[ name ];
                }
            }
            if(typeof hash.easing !== "function"){//转换easing属性为缓动公式
                var easing = (hash.easing || "swing").toLowerCase() ;
                hash.easing = $.easing[ easing ] || $.easing.swing;
            }
            hash.method = "noop";
            for(var i = 0, node; node = this[i++];){
                heartbeat( tween(node, duration, hash ) )
            }
            return this;
        }else{
            throw "First argument should be number and second argument should be object "
        }
    }
    $.fn.delay = function(ms){
        return this.each(function(node){
            var uuid = $.data(node, "@uuid");
            setTimeout(function(){
                var array = delays[uuid] || []
                heartbeat.queue.apply(heartbeat.queue, array);
                delete delays[uuid];
            },ms);
        });
    }
    //如果clearQueue为true，是否清空列队
    //如果jumpToEnd为true，是否跳到此动画最后一帧
    $.fn.stop = function( clearQueue, jumpToEnd ){
        var array = heartbeat.queue;
        return this.each(function(node){
            for(var i = 0, fx ; fx = array[i++];){
                if(fx.node === node){
                    if(jumpToEnd){//跑到最后一帧再移除
                        fx.gotoEnd = true;
                    }else{
                        fx.node = null;
                    }
                    if(!clearQueue){//
                        break;
                    }
                }
            }
        });
    }
    var types = {
        color:/color/i,
        scroll:/scroll/i,
        _default:/fontSize|fontWeight|opacity|width|height|top$|bottom$|left$|right$/i
    },
    rfxnum = /^([+\-/\*]=)?([\d+.\-]+)([a-z%]*)$/i;

    $.fx = function ( nodes, duration, hash, effects ){
        nodes = nodes.mass ? nodes : $(nodes);
        var props =  hash ||  duration ;
        props = typeof props === "object" ? props : {}
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
                    props[i] = function(node, fn ){
                        effects[i].call(node, node, fn);
                        if(typeof old === "function"){
                            old.call(node, node, fn);
                        }
                    }
                }else{
                    props[i] = effects[i]
                }
            }
        }
        return nodes.fx(duration, props);
    }
    $.mix($.fx, {
        type: function (attr){//  用于取得适配器的类型
            for(var i in types){
                if(types[i].test(attr)){
                    return i;
                }
            }
            return "_default";
        },
        steps: {
            scroll: function(node, per, end, obj){
                node[obj.name] = (end ? obj.to :  obj.from + obj.easing(per) * obj.change) + obj.unit
            },
            color: function(node, per, end, obj){
                var delta = obj.easing(per),
                rgb = end ? obj.to : obj.from.map(function(from, i){
                    return Math.max(Math.min( parseInt(from + obj.change[i] * delta, 10), 255), 0);
                });
                node.style[obj.name] = "rgb(" + rgb + ")";
            }
        },
        _default: $.css,
        scroll: function(el, prop){
            return el[prop]
        }
    });
    if(!$.support.cssOpacity){
        $.fx.steps.opacity = function(node, per, end, obj){
            $.css(node,"opacity", (end ? obj.to :  obj.from + obj.easing(per) * obj.change) )
        }
        types.opacity = /opacity/i
    }
    var Fx = function(){}
    Fx.prototype.update = function(per, end){
        var node = this.node;
        for(var i = 0, obj; obj = this.props[i++];){
            var fn = $.fx.steps[obj.type]
            if(fn){
                fn(node, per, end, obj)
            }else{
                node.style[obj.name] = (end ? obj.to :  obj.from + obj.easing(per) * obj.change) + obj.unit
            }
        }
    }
    //此函数的存在意义,取得初始值,结束值,变化量与单位,并输出动画实例
    function tween(node, duration, hash){
        var  to, parts, unit, op, props = [], revertProps = [],orig = {};
        for(var name in hash){
            var val = hash[name] //取得结束值
            if(typeof val == "function"){
                continue
            }
            var easing = hash.easing;//公共缓动公式
            var type = $.fx.type(name);
            var from = ($.fx[ type ] || $.fx._default)(node, name);
            //用于分解属性包中的样式或属性,变成可以计算的因子
            if( val === "show" || (val === "toggle" && !visible(node))){
                val = $._data(node,"old"+name) || from;
                hash.method = "show";
                from = 0;
            }else if(val === "hide" || val === "toggle" ){//hide
                orig[name] =  $._data(node,"old"+name,from);
                hash.method = "hide";
                val = 0;
            }else if($.isArray( val )){// array
                parts = val;
                val = parts[0];//取得第一个值
                easing = parts[1] || easing;//取得第二个值或默认值
            }
            if(type != "color" ){//如果不是颜色，则需判定其有没有单位以及起止值单位不一致的情况
                from = from == "auto" ? 0 : parseFloat(from)//确保from为数字
                if( (parts = rfxnum.exec( val )) ){
                    to = parseFloat( parts[2] ),//确保to为数字
                    unit = $.cssNumber[ name ] ? "" : (parts[3] || "px");
                    if(parts[1]){
                        op = parts[1].charAt(0);//操作符
                        if (unit && unit !== "px" && (op == "+" || op == "-")  ) {
                            $.css(node, name, (to || 1) + unit);
                            from = ((to || 1) / parseFloat( $.css(node,name) )) * from;
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
            var prop = {
                name: name,
                to: to,
                type: type,
                from: from ,
                change: change,
                easing: easing,
                unit: unit
            }
            props.push(prop);
            revertProps.push($.mix({},prop,{
                to: from,
                from: to,
                change: type == "color" ? change.map(function(c){
                    return c * -1
                }) : change * -1
            }))
        }
        var fx = new Fx();
        fx.props = props;
        fx.node = node;
        fx.hash = hash
        fx.uuid = $.data(node,"@uuid");
        fx.duration = duration;
        fx.orig = orig;
        "method,before,after,frame".replace($.rword, function(name){
            fx[name] = hash[name];
        });
        if ( hash.record || hash.revert ) {
            fx._props = revertProps;
        }
        return fx;
    }

    function animate( fx ) {
        if( fx.node ){
            var node = fx.node
            var now =  +new Date, mix
            if(!fx.startTime){//第一帧
                fx.startTime = now;
                mix = fx.before
                mix && (mix.call( node, node, fx ), fx.before = 0);
                $[ fx.method ].call(node, node, fx );//供show, hide 方法调用
            }else{
                var per = (now - fx.startTime) / fx.duration
                var end = fx.gotoEnd || per >= 1;
                //node, 是否结束, 进度
                fx.update(per, end ); // 处理渐变
                if( (mix = fx.frame ) && !end ){
                    mix.call(node, node, fx ) ;
                }
                if ( end ) {//最后一帧
                    if(fx.method == "hide"){
                        for(var i in fx.orig){//还原为初始状态
                            $.css( node, i, fx.orig[i] )
                        }
                    }
                    mix = fx.after;
                    mix && mix.call( node, node, fx ) ;
                    if(fx._props){
                        fx.props = fx._props;
                        delete fx._props;
                        delete fx.startTime
                    }else{
                        return false;
                    }
                }
            }
        }else{
            return false
        }
    }
    function visible(node) {
        return  $.css(node, "display") !== 'none';
    }
    //show 开始时计算其width1 height1 保存原来的width height display改为inline-block或block overflow处理 赋值（width1，height1）
    //hide 保存原来的width height 赋值为(0,0) overflow处理 结束时display改为none;
    //toggle 开始时判定其是否隐藏，使用再决定使用何种策略
    $.mix( {

        show: function(node, fx){
            if(node.nodeType == 1 && !visible(node)) {
                var old =  $._data(node, "olddisplay"),
                _default = parseDisplay(node.nodeName),
                display = node.style.display = (old || _default);
                $._data(node, "olddisplay", display);
                if(fx && fx.hash  && ("width" in fx.hash || "height" in fx.hash)){//如果是缩放操作
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
        hide: function(node, fx){
            if(node.nodeType == 1 && visible(node)){
                var props = fx && fx.hash;
                var display = $.css( node, "display" );
                if ( display !== "none" && !$._data( node, "olddisplay" ) ) {
                    $._data( node, "olddisplay", display );
                }
                if( props ){//缩小
                    if("width" in props || "height" in props){//如果是缩放操作
                        //确保内容不会溢出,记录原来的overflow属性，因为IE在改变overflowX与overflowY时，overflow不会发生改变
                        fx.overflow = [ node.style.overflow, node.style.overflowX, node.style.overflowY ];
                        node.style.overflow = "hidden";
                    }
                    var after = fx.after;
                    fx.after = function( node, fx ){
                        node.style.display = "none";
                        if ( fx.overflow != null && !$.support.keepSize  ) {
                            [ "", "X", "Y" ].forEach(function (postfix,index) {
                                node.style[ "overflow" + postfix ] = fx.overflow[index]
                            });
                        }
                        if(typeof after == "function"){
                            after.call( node, node, fx );
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

    var fxAttrs = [ [ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
    [ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ], ["opacity"]]
    function genFx( type, num ) {//生成属性包
        var obj = {};
        fxAttrs.concat.apply([], fxAttrs.slice(0,num)).forEach(function(name) {
            obj[ name ] = type;
            if(~name.indexOf("margin")){
                $.fx.steps[name] = function(node, per, end, obj){
                    var val = (end ? obj.to :  obj.from + obj.easing(per) * obj.change) ;
                    node.style[name] = Math.max(val,0) + obj.unit;
                }
            }
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
    });
    
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
    function beforePuff( node, fx ) {
        var position = $.css(node,"position"),
        width = $.css(node,"width"),
        height = $.css(node,"height"),
        left = $.css(node,"left"),
        top = $.css(node,"top");
        node.style.position = "relative";
        $.mix(fx, {
            width: "*=1.5",
            height: "*=1.5",
            opacity: "hide",
            left: "-=" + parseInt(width) * 0.25,
            top: "-=" + parseInt(height) * 0.25
        });
        var after = fx.after;
        fx.after = function( node, fx ){
            node.style.position = position;
            node.style.width = width;
            node.style.height = height;
            node.style.left = left;
            node.style.top = top;
            if(typeof after === "function"){
                after.call( node, node, fx );
            }
        }
    }
    //扩大1.5倍并淡去
    $.fn.puff = function(duration, hash) {
        return $.fx( this, duration, hash, {
            before:beforePuff
        });
    }

    var colorMap = {
        "black":[0,0,0],
        "gray":[128,128,128],
        "white":[255,255,255],
        "orange":[255, 165, 0],
        "red":[255,0,0],
        "green":[0,128,0],
        "yellow":[255,255,0],
        "blue":[0,0,255]
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
            sandboxDoc.write( ( $.support.boxModel  ? "<!doctype html>" : "" ) + "<html><body>" );
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

})