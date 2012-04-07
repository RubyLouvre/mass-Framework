//==========================================
//  事件模块（包括伪事件对象，事件绑定与事件代理）
//==========================================
$.define("event",document.dispatchEvent ?  "node" : "node,event_fix",function(){
    // $.log("已加载target模块")
    var fireType = "", blank = "", rhoverHack = /(?:^|\s)hover(\.\S+)?\b/,
    rtypenamespace = /^([^\.]*)?(?:\.(.+))?$/, revent = /(^|_|:)([a-z])/g;
    function addCallback(queue, obj){//添加回调包到列队中
        var check = true, fn = obj.callback;
        for ( var i = 0, el; el = queue[i++]; ) {
            if( el.callback === fn ){
                check = false;
                break;
            }
        }
        if( check ){
            queue.push(obj);
        }
    }
    function quickIs( elem, m ) {
        var attrs = elem.attributes || {};
        return (
            (!m[1] || elem.nodeName.toLowerCase() === m[1]) &&
            (!m[2] || (attrs.id || {}).value === m[2]) &&
            (!m[3] || m[3].test( (attrs[ "class" ] || {}).value ))
            );
    }
    //如果不存在添加一个
    var facade = $.event = $.event || {};
    //添加或增强二级属性eventAdapter
    $.Object.merge(facade,{
        eventAdapter:{
            focus: {
                delegateType: "focusin"
            },
            blur: {
                delegateType: "focusout"
            },
            beforeunload: {
                setup: function(src, _, _, fn ) {
                    // We only want to do this special case on windows
                    if ( $.type(src, "Window") ) {
                        src.onbeforeunload = fn;
                    }
                },
                teardown: function( src, _, _, fn ) {
                    if ( src.onbeforeunload === fn ) {
                        src.onbeforeunload = null;
                    }
                }
            }
        }
    });
    var eventAdapter  = $.event.eventAdapter
    $.mix(facade,{
        bind : function( hash ){
            //它将在原生事件派发器或任何能成为事件派发器的普通JS对象添加一个名叫uniqueNumber的属性,用于关联一个缓存体,
            //把需要的数据储存到里面,而现在我们就把一个叫events的对象储放都它里面,
            //而这个event的表将用来放置各种事件类型与对应的回调函数
            var target = this, DOM =  $[ "@target" ] in target, events = $._data( target),
            types = hash.type, fn = hash.callback,selector = hash.selector, callback;
            if(target.nodeType === 3 || target.nodeType === 8 || !events){
                return
            }
            hash.uuid =  $.getUid(fn); //确保UUID，bag与callback的UUID一致
          
            if( DOM ){ //处理DOM事件
                callback = events.callback ||  (events.callback = function( e ) {
                    return ((e || event).type !== fireType) ? facade.dispatch.apply( callback.target, arguments ) : void 0;
                });
                callback.target = target;
                types = types.replace( rhoverHack, "mouseover$1 mouseout$1" )
            }
            events = events.events || (events.events = {});
            //对多个事件进行绑定
            types.replace( $.rword, function( old ){
                var 
                tns = rtypenamespace.exec( old ) || [],//"focusin.aaa.bbb"
                namespace = ( tns[2] || blank ).split( "." ).sort(),//取得命名空间 "aaa.bbb"
                adapter = DOM && eventAdapter[ tns[1] ] || {},// focusin -> focus
                type = (selector ? adapter.delegateType : adapter.bindType ) || tns[1],//focus

                queue = events[ type ] = events[ type ] ||  [],  //创建事件队列
                item = $.mix({
                    type: type,
                    origType: tns[1],
                    namespace: namespace.join(".")
                }, hash, false); 
                //只有原生事件发送器才能进行DOM level2 多投事件绑定
                if( DOM && !queue.length  ){
                    adapter = eventAdapter[ type ] || {};
                    if (!adapter.setup || adapter.setup( target, selector, item.origType, callback ) === false ) {
                        // 为此元素这种事件类型绑定一个全局的回调，用户的回调则在此回调中执行
                        $.bind(target, type, callback, !!selector)
                    }
                }
                addCallback( queue, item );//同一事件不能绑定重复回调
            });
            return this;
        },
        //外部的API已经确保typesr至少为空字符串
        unbind: function( hash, mappedTypes  ) {
            var target = this, events = $._data( target, "events");
            if(!events ) return;
            var types = hash.type || "", selector = hash.selector, fn = hash.callback,
            tns, type, origType, namespace, origCount, DOM =  $["@target"] in target,
            j, adapter, queue, item;
            //将types进行映射并转换为数组
            types = DOM ? types.replace( rhoverHack, "mouseover$1 mouseout$1" ) : types;
            types =  types.match( $.rword ) || [];
            for (var t = 0; t < types.length; t++ ) {
                //"aaa.bbb.ccc" -> ["aaa.bbb.ccc", "aaa", "bbb.ccc"]
                tns = rtypenamespace.exec( types[t] ) || []
                origType = type = tns[1];
                namespace = tns[2];
                // 如果types只包含命名空间，则去掉所有拥有此命名空间的事件类型的回调
                if ( !type  ) {
                    for ( j in events ) {
                        facade.unbind.call( target, {
                            type: j + types[t],//说明这个types[t]为命名空间
                            selector: selector,
                            callback: fn
                        }, true );
                    }
                    continue;
                }
                //如果使用事件冒充则找到其正确事件类型
                adapter = eventAdapter[ type ] || {};
                type = ( selector ? adapter.delegateType: adapter.bindType ) || type;
                queue =  events[ type ] || [];
                origCount = queue.length;
                namespace = namespace ? new RegExp("(^|\\.)" + namespace.split(".").sort().join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
                //  namespace =  namespace?  namespace.split( "." ).sort().join(".") : null;
                //只有指定了命名空间，回调或选择器才能进入此分支
                if ( fn || namespace || selector ) {
                    for ( j = 0; j < queue.length; j++ ) {
                        item = queue[ j ];
                        if ( ( mappedTypes || origType === item.origType ) &&
                            ( !fn || fn.uuid === item.uuid ) &&//如果指定了回调，只检测其UUID
                            ( !namespace || namespace.test( item.namespace ) ) &&//如果指定了命名空间
                            ( !selector || selector === item.selector || selector === "**" && item.selector ) ) {
                            queue.splice( j--, 1 );
                        }
                    }
                } else {
                    //移除此类事件的所有回调
                    queue.length = 0;
                }
                if ( DOM && (queue.length === 0 && origCount !== queue.length) ) {//如果在回调队列的长度发生变化时才进行此分支
                    if ( !adapter.teardown || adapter.teardown( target, selector, origType, fn ) === false ) {
                        $.unbind( target, type, $._data( target, "callback") );
                    }
                    delete events[ type ];
                }
            }
            if( $.isEmptyObject( events ) ){
                fn = $.removeData( target,"callback") ;
                fn.target = null;
                $.removeData( target, "events") ;
            }
            return this;
        },

        fire: function( event ){//event的类型可能是字符串,原生事件对象,伪事件对象
            var target = this, namespace = [], type = event.type || event;
            if(!isFinite(event.mass)){
                event = new jEvent(event);
                if( ~type.indexOf( "." ) ) {//处理命名空间
                    namespace = event.split(".");
                    type = namespace.shift();
                    namespace.sort();
                    event.namespace = namespace.join( "." );
                    event.namespace_re = event.namespace ? new RegExp("(^|\\.)" + namespace.join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
                }
            }
            event.target = target;
            var args = [ event ].concat( $.slice(arguments,1) );
            if( $["@target"] in target){
                var cur = target,  ontype = "on" + type;
                do{//模拟事件冒泡与执行内联事件
                    if( ($._data(cur,"events")|| {})[type] ){
                        facade.dispatch.apply( cur, args );
                    }
                    if (cur[ ontype ] && cur[ ontype ].call(cur) === false) {
                        event.preventDefault();
                    }
                    cur = cur.parentNode ||
                    cur.ownerDocument ||
                    cur === target.ownerDocument && window;
                } while ( cur && !event.isPropagationStopped );
                if ( !event.isDefaultPrevented ) {//模拟默认行为 click() submit() reset() focus() blur()
                    var old;//在opera 中节点与window都有document属性
                    if (ontype && target[ type ] && ((type !== "focus" && type !== "blur") || target.offsetWidth !== 0) && !target.eval) {
                        old = target[ ontype ];
                        if (old) {   // 不用再触发内联事件
                            target[ ontype ] = null;
                        }
                        fireType = type;
                        target[ type ]();
                    }
                    fireType = blank;
                    if ( old ) {
                        target[ ontype ] = old;
                    }
                }

            }else{//普通对象的自定义事件
                facade.dispatch.apply(target, args);
            }
        },
        filter: function( cur, parent, expr ){
            var matcher = typeof expr === "function"? expr : expr.input ? quickIs : $.match
            for ( ; cur != parent; cur = cur.parentNode || parent ) {
                if(matcher(cur, expr))
                    return true
            }
            return false;
        },
        dispatch: function( e ) {
            var win = ( this.ownerDocument || this.document || this ).parentWindow || window,
            event = facade.fix( e || win.event ),
            queue = $._data(this,"events");//这个其实是对象events
            if (  queue ) {
                queue = queue[ event.type] || [];//到此处时才是数组
                event.currentTarget = this;
                var src = event.target,args = [event].concat($.slice(arguments,1)), result;
                //复制数组以防影响下一次的操作
                queue = queue.concat();
                //开始进行拆包操作
                for ( var i = 0, item; item = queue[i++]; ) {
                    //如果是事件代理，确保元素处于enabled状态，并且满足过滤条件
                    if ( !src.disabled && !(event.button && event.type === "click")
                        && (!item.selector  || facade.filter(src, this, item.selector))
                        && (!event.namespace || event.namespace_re.test( item.namespace ) ) ) {
                        //取得回调函数
                        event.type = item.origType;
                        result = item.callback.apply( item.selector ? src : this, args );
                        item.times--;
                        if(item.times === 0){
                            facade.unbind.call( this, item)
                        }
                        if ( result !== void 0 ) {
                            event.result = result;
                            if ( result === false ) {
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        }
                        if ( event.isImmediatePropagationStopped ) {
                            break;
                        }
                    }
                }
            }

            return event.result;
        },
        _dispatch: function( src, type, e ){
            e = facade.fix( e );
            e.type = type;
            for(var i in src){
                if(src.hasOwnProperty(i)){
                    facade.dispatch.call( src[ i ], e );
                }
            }
        },
        fix: function( event ){
            if( !isFinite(event.mass) ){
                var originalEvent = event
                event = new jEvent(originalEvent);
                for( var prop in originalEvent ){
                    //去掉所有方法与常量
                    if( typeof originalEvent[prop] !== "function" && prop !== "type" ){
                        if(/^[A-Z_]+$/.test(prop))
                            continue
                        event[prop] = originalEvent[prop]
                    }
                }
                //如果不存在target属性，为它添加一个
                if ( !event.target ) {
                    event.target = event.srcElement || document;
                }
                //safari的事件源对象可能为文本节点，应代入其父节点
                if ( event.target.nodeType === 3 ) {
                    event.target = event.target.parentNode;
                }
                // 处理鼠标事件
                if( /^(?:mouse|contextmenu)|click/.test(event.type) ){
                    //如果不存在pageX/Y则结合clientX/Y做一双出来
                    if ( event.pageX == null && event.clientX != null ) {
                        var doc = event.target.ownerDocument || document,
                        html = doc.documentElement, body = doc.body;
                        event.pageX = event.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html && html.clientLeft || body && body.clientLeft || 0);
                        event.pageY = event.clientY + (html && html.scrollTop  || body && body.scrollTop  || 0) - (html && html.clientTop  || body && body.clientTop  || 0);
                    }
                    //如果不存在relatedTarget属性，为它添加一个
                    if ( !event.relatedTarget && event.fromElement ) {
                        event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
                    }
                    //标准浏览判定按下鼠标哪个键，左1中2右3
                    var button = event.button
                    //IE event.button的意义
                    //0：没有键被按下 1：按下左键 2：按下右键 3：左键与右键同时被按下 4：按下中键 5：左键与中键同时被按下 6：中键与右键同时被按下 7：三个键同时被按下
                    if ( !event.which && isFinite(button) ) {
                        event.which  = [0,1,3,0,2,0,0,0][button];//0现在代表没有意义
                    }
                }
                if ( event.which == null ) {//处理键盘事件
                    event.which = event.charCode != null ? event.charCode : event.keyCode;
                }
                //处理滚轮事件
                if( event.type === "mousewheel" ){
                    if ("wheelDelta" in originalEvent){
                        var delta = originalEvent.wheelDelta/120;
                        //opera 9x系列的滚动方向与IE保持一致，10后修正
                        if(top.opera && opera.version() < 10)
                            delta = -delta;
                        event.wheelDelta = Math.round(delta); //修正safari的浮点 bug
                    }else if("detail" in originalEvent){
                        event.wheelDelta = -event.detail/3;
                    }
                }
                // 处理组合键
                if ( event.metaKey === void 0 ) {
                    event.metaKey = event.ctrlKey;
                }
            }
            return event;
        }
    });

    var jEvent = $.Event = function ( event ) {
        this.originalEvent = event.type ? event: {};
        this.type = (event.type || event).replace(/\..*/g,"");
        this.timeStamp  = Date.now();
        this.mass = $.mass;//用于判定是否为伪事件对象
    };
    // http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
    jEvent.prototype = {
        constructor: jEvent,
        //http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/events.html#Conformance
        toString: function(){
            return "[object Event]"
        },
        preventDefault: function() {
            this.isDefaultPrevented = true;
            var e = this.originalEvent;
            // 如果存在preventDefault 那么就调用它
            if ( e.preventDefault ) {
                e.preventDefault();
            }
            // 如果存在returnValue 那么就将它设为false
            e.returnValue = false;
            return this;
        },
        stopPropagation: function() {
            this.isPropagationStopped = true;
            var e = this.originalEvent;
            // 如果存在preventDefault 那么就调用它
            if ( e.stopPropagation ) {
                e.stopPropagation();
            }
            // 如果存在returnValue 那么就将它设为true
            e.cancelBubble = true;
            return this;
        },
        stopImmediatePropagation: function() {
            this.isImmediatePropagationStopped = true;
            this.stopPropagation();
            return this;
        }
    };
    var types = "contextmenu,click,dblclick,mouseout,mouseover,mouseenter,mouseleave,mousemove,mousedown,mouseup,mousewheel," +
    "abort,error,load,unload,resize,scroll,change,input,select,reset,submit,input,"+"blur,focus,focusin,focusout,"+"keypress,keydown,keyup",
    rmapper = /(\w+)_(\w+)/g;
    //事件派发器的接口
    //实现了这些接口的对象将具有注册事件和广播事件的功能
    //http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget
    $.EventTarget = {
        uniqueNumber : $.getUid({}),
        defineEvents : function( names ){
            var events = [];
            if(typeof names == "string"){
                events = names.match( $.rword ) || [];
            }else if($.isArray(names)){
                events = names;
            }
            events.forEach(function(name){
                var method = 'on'+name.replace(revent,function($, $1, $2) {
                    return $2.toUpperCase();
                });
                if (!(method in this)) {
                    this[method] = function() {
                        return this.bind.apply(this, [].concat.apply([name], arguments));
                    };
                }
            },this);
        }
    };
    "bind_on,unbind_off,fire_fire".replace( rmapper,function(_, type, mapper){
        $.EventTarget[ type ] = function(){
            $.fn[ mapper ].apply(this, arguments);
            return this;
        }
    });
    $.eventSupport = function( eventName,el ) {
        el = el || document.createElement("div");
        eventName = "on" + eventName;
        var ret = eventName in el;
        if ( el.setAttribute && !ret ) {
            el.setAttribute( eventName, "" );
            ret = typeof el[ eventName ] === "function";
            el.removeAttribute(eventName);
        }
        el = null;
        return ret;
    };
    /**
用于在标准浏览器下模拟mouseenter与mouseleave
现在除了IE系列支持mouseenter/mouseleave/focusin/focusout外
opera11,FF10也支持这四个事件,同时它们也成为w3c DOM3 Event的规范
详见http://www.filehippo.com/pl/download_opera/changelog/9476/
http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html
 */
    if( !+"\v1" || !$.eventSupport("mouseenter")){
        "mouseenter_mouseover,mouseleave_mouseout".replace(rmapper, function(_, type, mapper){
            eventAdapter[ type ]  = {
                setup: function( src ){//使用事件冒充
                    $._data( src, type+"_handle", $.bind( src, mapper, function( e ){
                        var parent = e.relatedTarget;
                        try {
                            while ( parent && parent !== src ) {
                                parent = parent.parentNode;
                            }
                            if ( parent !== src ) {
                                facade._dispatch( [ src ], type, e );
                            }
                        } catch(err) { };
                    }));
                },
                teardown: function(){
                    $.unbind( this, mapper, $._data( type+"_handle" ) );
                }
            };
        });
    }
    //在标准浏览器里面模拟focusin
    if( !$.eventSupport("focusin") ){
        "focusin_focus,focusout_blur".replace(rmapper, function(_,type, mapper){
            var notice = 0, focusinNotify = function (e) {
                var src = e.target
                do{//模拟冒泡
                    var events = $._data( src, "events" );
                    if(events && events[ type ]){
                        facade._dispatch( [ src ], type, e );
                    }
                } while (src = src.parentNode );
            }
            eventAdapter[ type ] = {
                setup: function( ) {
                    if ( notice++ === 0 ) {
                        document.addEventListener( mapper, focusinNotify, true );
                    }
                },
                teardown: function() {
                    if ( --notice === 0 ) {
                        document.removeEventListener( mapper, focusinNotify, true );
                    }
                }
            };
        });
    }
    try{
        //FF需要用DOMMouseScroll事件模拟mousewheel事件
        document.createEvent("MouseScrollEvents");
        eventAdapter.mousewheel = {
            bindType    : "DOMMouseScroll",
            delegateType: "DOMMouseScroll"
        }
        try{
            //可能末来FF会支持标准的mousewheel事件，则需要删除此分支
            document.createEvent("WheelEvent");
            delete eventAdapter.mousewheel;
        }catch(e){};
    }catch(e){};
    //当一个元素，或者其内部任何一个元素获得焦点的时候会触发这个事件。
    //这跟focus事件区别在于，他可以在父元素上检测子元素获取焦点的情况。
    var  rquickIs = /^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/
    function quickParse( selector ) {
        var quick = rquickIs.exec( selector );
        if ( quick ) {
            //   0  1    2   3
            // [ _, tag, id, class ]
            quick[1] = ( quick[1] || "" ).toLowerCase();
            quick[3] = quick[3] && new RegExp( "(?:^|\\s)" + quick[3] + "(?:\\s|$)" );
        }
        return quick;
    }
    "on_bind,off_unbind".replace( rmapper, function(_,method, mapper){
        $.fn[ method ] = function(types, selector, fn ){//$.fn.on $.fn.off
            if ( typeof types === "object" ) {
                for ( var type in types ) {
                    $.fn[ method ].call(this, type, selector, types[ type ], fn );
                }
                return this;
            }
            var hash = {};
            for(var i = 0 ; i < arguments.length; i++ ){
                var el = arguments[i];
                if(typeof el == "number"){
                    hash.times = el
                }else if(typeof el == "function"){
                    hash.callback = el
                }if(typeof el === "string"){
                    if(hash.type != null){
                        hash.selector = el.trim()
                    }else{
                        hash.type = el.trim()
                    }
                }
            }
            if(method === "on"){
                if( !hash.type || !hash.callback ){//必须指定事件类型与回调
                    return this;
                }
                hash.times = hash.times > 0  ? hash.times : Infinity;
                hash.selector =  hash.selector ? quickParse( hash.selector ) : false
            }
            if(typeof this.each === "function"){
                return this.each(function() {
                    facade[ mapper ].call( this, hash );
                });
            }else{
                return facade[ mapper ].call( this, hash );
            }
        }
        $.fn[ mapper ] = function(){// $.fn.bind $.fn.unbind
            return this[ method ].apply(this, arguments );
        }
    });

    $.implement({
        toggle: function(/*fn1,fn2,fn3*/){
            var fns = [].slice.call(arguments), i = 0;
            return this.click(function(e){
                var fn  = fns[i++] || fns[i = 0, i++];
                fn.call( this, e );
            })
        },
        hover: function( fnIn, fnOut ) {
            return this.mouseenter( fnIn ).mouseleave( fnOut || fnIn );
        },
        delegate: function( selector, types, fn, times ) {
            return this.on( types, selector, fn, times);
        },
        live: function( types, fn, times ) {
            $( this.ownerDocument ).on( types, this.selector, fn, times );
            return this;
        },
        one: function( types, fn ) {
            return this.on( types, fn, 1 );
        },
        undelegate: function(selector, types, fn ) {
            return arguments.length == 1? this.off( selector, "**" ) : this.off( types, fn, selector );
        },
        die: function( types, fn ) {
            $( this.ownerDocument ).off( types, fn, this.selector || "**", fn );
            return this;
        },
        fire: function(  ) {
            var args = arguments;
            return this.each(function() {
                $.event.fire.apply(this, args );
            });
        }
    });

    types.replace( $.rword, function( type ){
        $.fn[ type ] = function( callback ){
            return callback?  this.bind( type, callback ) : this.fire( type );
        }
    });
});
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
*/







