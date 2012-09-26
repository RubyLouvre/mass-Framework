//=========================================
// 事件系统 v7
//==========================================
define("event", top.dispatchEvent ?  ["$node"] : ["$node","$event_fix"],function(){
    $.log("已加载event模块v7")
    var facade = $.event = $.event || {};
    $.Object.merge(facade,{
        eventAdapter:{ } //添加或增强二级属性eventAdapter
    });
    var adapter = $.event.eventAdapter, rhoverHack = /(?:^|\s)hover(\.\S+|)\b/
    var bindTop = !adapter.input;//如果没有加载event_fix模块,也就没有input分支,也就说明其是支持dispatchEvent API
    $.eventSupport = function( eventName, el ) {
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
     * 从事件类型中分解出有用的信息
     * @param {String} event 事件类型
     * @param {String|Boolean|Undefined} live 用于判定是否使用代理
     */
    var Event = function(event, live){
        var parts = event.split('.');
        var ns = parts.slice(1).sort().join(' ');
        var type = parts[0], hack, tmp;//input -> change -> propertychange
        while( (hack = adapter[ type ]) ){
            tmp = hack[ live ? "delegateType" : "bindType" ];
            if( tmp ){
                type = tmp
            }else{
                break
            }
        }
        this.type = type;          //事件类型
        this.origType = parts[0]  //原事件类型
        this.live = live;          //是否使用了事件代理,可以是正则,字符串,布尔或空值
        this.ns =   ns,            //命名空间
        this.rns =  ns ? new RegExp("(^|\\.)" + ns.replace(' ', ' .* ?') + "(\\.|$)") : null
    }
    //events为要过滤的集合,后面个参数为过滤条件
    function findHandlers( events, hash, fn, live ) {
        return events.filter(function(quark) {
            return quark && (!hash.rns || hash.rns.test(quark.ns))  //通过事件类型进行过滤
            && (!hash.origType || hash.origType === quark.origType) //通过命名空间进行进行过滤
            && (!fn || fn.uniqueNumber === quark.uuid)              //通过uuid进行过滤
            && (!live || live === quark.live || live === "**" && quark.live )//通过选择器进行过滤
        })
    }
    Event.prototype = {
        toString: function(){
            return "[object Event]"
        },
        preventDefault: function() {
            this.isDefaultPrevented = true;
            var e = this.originalEvent || {};
            if (e && e.preventDefault ) {
                e.preventDefault();
            }// 如果存在returnValue 那么就将它设为false
            e.returnValue = false;
            return this;
        },
        stopPropagation: function() {
            var e = this.originalEvent || {};
            if (e && e.stopPropagation ) {
                e.stopPropagation();
            } // 如果存在returnValue 那么就将它设为true
            e.cancelBubble = this.isPropagationStopped = true;
            return this;
        },
        stopImmediatePropagation: function() {
            this.isImmediatePropagationStopped = true;
            this.stopPropagation();
            return this;
        }
    }
    $.Event = Event;
    $.mix(facade,{
        //addEventListner API的支持情况:chrome 1+ FF1.6+	IE9+ opera 7+ safari 1+;
        //http://functionsource.com/post/addeventlistener-all-the-way-back-to-ie-6
        bind: function( target, hash ){//事件系统三大核心方法之一，绑定事件
            var bindTarget =  $[ "@bind" ] in target,//是否能直接绑定到目标对象上
            events = $._data( target ),              //是否能绑定事件
            types  = hash.type,                      //原有的事件类型,可能是复数个
            live   = hash.live;                      //是否使用事件代理
            if( !events ){
                return
            }
            if( bindTarget ){                       //处理DOM的hover事件
                types = types.replace( rhoverHack, "mouseover$1 mouseout$1" );
            }
            events = events.events || (events.events = []);
            hash.uuid = $.getUid( hash.fn );       //确保hash.uuid与fn.uuid一致
            types.replace( $.rword, function( t ){
                var forged = new $.Event( t, live), type = forged.origType;
                $.mix(forged, {
                    currentTarget: target,          //this,用于绑定数据的
                    index:  events.length           //记录其在列表的位置，在卸载事件时用
                }, hash, false);
                events.push( forged );               //用于事件拷贝
                var count = events[ type+"_count" ] = ( events[ type+"_count" ] | 0 )+ 1;
                var hack = adapter[ forged.type ] || {};
                if( count == 1 ){
                    forged.handle = facade.curry( forged );     //  一个curry
                    $._data( target, "first_" + type, forged);  //用于事件派发：$.event.dispatch
                    if( !hack.setup || hack.setup( forged ) === false  ) {
                        if( bindTop && !bindTarget  ){//如果不能绑到当前对象上,尝试绑到window上
                            target = window;
                        }
                        //此元素在此事件类型只绑定一个回调
                        $.bind(target, forged.type, facade.curry( forged ), live);
                    }
                }
            //mass Framework早期的事件系统与jQuery都脱胎于 Dean Edwards' addEvent library
            //对于每个元素的某一种事件只绑定一个代理回调，通过它执行用户的所有回调，
            //藉此解决this指向，event存无与标准化，回调顺序这三大问题
            //jquery的创新在于使用多投事件API取代DOM 0事件绑定，解决对DOMMouseScroll，
            //DOMContentLoaded，DOMAttrModified的绑定，并引入命名空间与实现事件冒充，事件代理，
            //以及让无论是自定义事件与原生事件都能沿着DOM树人为地冒泡
            });
        },
        _dispatch: function( list, event, type ){//level2 API 用于事件冒充
            event.more = event.more ||{}
            event.more.type = type
            for(var i in list){
                if( list.hasOwnProperty(i)){
                    facade.dispatch( list[ i ], event, type );
                }
            }
        },
        dispatch: function( target, event, type ){// level2 API 用于旧式的$.event.fire中
            var quark = $._data(target, "first_" + (type || event.type) );//取得此元素此类型的第一个quark
            quark && quark.handle.call( target, event )
        },
        curry: function( hash ){// 这是元信息,不要污染这个对象
            var fn =  function( event){//真正的事件对象
                var type = hash.origType;
                var ctarget = hash.currentTarget//原来绑定事件的对象
                var more = event.more || {};
                //防止在fire mouseover时,把用于冒充mouseenter用的mouseover也触发了
                if(  more.origType && more.origType !== type ){
                    return
                }
                var queue = ( $._data( ctarget, "events") || [] ).concat();
                //如果是自定义事件, 或者旧式IE678, 或者需要事件冒充
                if( !event.originalEvent || !bindTop || hash.type !== type ){
                    var win = bindTop || ( ctarget.ownerDocument || ctarget.document || ctarget ).parentWindow || window;
                    event = facade.fix( hash, (event || win.event), type );
                }
                var args = [ event ].concat( event.args ||  [] ), result;
                for ( var i = 0, quark; quark = queue[i++]; ) {
                    if ( !event.target.disabled && !(event.button && event.type === "click")//非左键不能冒泡(e.button 左键为0)
                        && (  event.type == quark.origType )//确保事件类型一致
                        && (!event.rns || event.rns.test( quark.ns ) )//如果存在命名空间，则检测是否一致
                        && ( quark.live ? facade.match( event.target, ctarget, quark ) :
                            event.currentTarget == quark.currentTarget )
                        //如果是事件代理，则检测元素是否匹配给定选择器，否则检测此元素是否是绑定事件的元素
                        ) {
                        //谁绑定了事件,谁就是事件回调中的this
                        result = quark.fn.apply( quark._target || ctarget, args);
                        delete quark._target;
                        quark.times--;
                        if(quark.times === 0){//如果有次数限制并到用光所有次数，则移除它
                            facade.unbind( this, quark)
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
            fn.uuid = hash.uuid;
            return fn;
        },
        //将真事件对象的成员赋给伪事件对象，抹平浏览器差异
        fix: function( event, real, type){
            if( !event.originalEvent ){
                var hash = event, toString = hash.toString;//IE无法遍历出toString;
                event = $.Object.merge({}, hash);//这里event只是一个伪事件对象
                for( var p in real ){
                    if( !(p in hash) ){
                        event[p] = real[p]
                    }
                }
                for( var p in real.more ){
                    if( !(p in hash) ){
                        event[p] = real.more[p]
                    }
                }
                event.toString = toString;
                event.originalEvent = real;
                event.timeStamp = Date.now();
                //如果不存在target属性，为它添加一个
                if ( !event.target ) {
                    event.target = event.srcElement || document;
                }
                //safari的事件源对象可能为文本节点，应代入其父节点
                if ( event.target.nodeType === 3 ) {
                    event.target = event.target.parentNode;
                }
                event.metaKey = !!event.ctrlKey; // 处理IE678的组合键

                if( /^(?:mouse|contextmenu)|click/.test( type ) ){
                    if ( event.pageX == null && event.clientX != null ) {  // 处理鼠标事件
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
                    //IE event.button的意义 0：没有键被按下 1：按下左键 2：按下右键 3：左键与右键同时被按下 4：按下中键 5：左键与中键同时被按下 6：中键与右键同时被按下 7：三个键同时被按下
                    if ( !event.which && isFinite(button) ) {
                        event.which  = [0,1,3,0,2,0,0,0][button];//0现在代表没有意义
                    }
                    if( type === "mousewheel" ){ //处理滚轮事件
                        if ("wheelDelta" in real){//统一为±120，其中正数表示为向上滚动，负数表示向下滚动
                            // http://www.w3help.org/zh-cn/causes/SD9015
                            var delta = real.wheelDelta
                            //opera 9x系列的滚动方向与IE保持一致，10后修正
                            if( window.opera && opera.version() < 10 )
                                delta = -delta;
                            event.wheelDelta = Math.round(delta); //修正safari的浮点 bug
                        }else if( "detail" in real ){
                            event.wheelDelta = -real.detail * 40;//修正FF的detail 为更大众化的wheelDelta
                        }
                    }
                }else if ( event.which == null ) {//处理键盘事件
                    event.which = event.charCode != null ? event.charCode : event.keyCode;
                }else if( window.Touch && event.touches && event.touches[0] ){
                    event.pageX = event.touches[0].pageX//处理触摸事件
                    event.pageY = event.touches[0].pageY
                }
            }
            if( type ){
                event.type = type
            }
            return event;
        },
        //外部的API已经确保typesr至少为空字符串
        unbind: function( target, hash ) {//事件系统三大核心方法之一，卸载事件
            var events = $._data( target, "events");
            if( !events ) return;
            var types = hash.type || "", live = hash.live, bindTarget = $["@bind"] in target;
            if( bindTarget ){ //处理DOM的hover事件
                types = types.replace( rhoverHack, "mouseover$1 mouseout$1" );
            }
            types.replace( $.rword, function( t ){
                var quark = new $.Event( t, live ), type = quark.origType, hack = adapter[ type ] || {};
                findHandlers( events, quark , hash.fn, live ).forEach( function(quark){
                    if( --events[type+"_count"] == 0 ){
                        if( !hack.teardown || hack.teardown( quark ) === false  ) {
                            if( bindTarget === false && bindTop ){//如果不能绑到当前对象上,尝试绑到window上
                                target = window;
                            }
                            $.unbind( target, quark.type, quark.handle, live );
                        }
                        $.removeData( target, "first_" + type, true );
                        delete events[ type+"_count"];
                    }
                    events[ quark.index ] = null;
                })
            });
            for ( var i = events.length; i >= 0; i-- ) {
                if (events[i] == null){
                    events.splice(i, 1);
                }
            }
            if( !events.length ){
                $.removeData( target, "events") ;
            }
        },
        match: function( cur, parent, quark ){//用于判定此元素是否为绑定回调的那个元素或其孩子，并且匹配给定表达式
            if(quark._target)
                return true
            var expr  = quark.live;
            var matcher = expr.input ? quickIs : $.match;
            for ( ; cur != parent; cur = cur.parentNode || parent ) {
                if(matcher(cur, expr)){
                    quark._target = cur
                    return true
                }
            }
            return false;
        }
    })
    var rquickIs = /^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/;
    var rmapper = /(\w+)_(\w+)/g;
    function quickParse( selector ) {
        var quick = rquickIs.exec( selector );
        if ( quick ) {
            //   0  1    2   3
            // [ _, tag, id, class ]
            quick[1] = ( quick[1] || "" ).toLowerCase();
            quick[3] = quick[3] && new RegExp( "(?:^|\\s)" + quick[3] + "(?:\\s|$)" );
        }
        return quick || selector;//如果为null ,或许这是个复杂的表达式,交由选择器引擎去处理
    }
    function quickIs( elem, m ) {
        var attrs = elem.attributes || {};
        return (
            (!m[1] || elem.nodeName.toLowerCase() === m[1]) &&
            (!m[2] || (attrs.id || {}).value === m[2]) &&
            (!m[3] || m[3].test( (attrs[ "class" ] || {}).value ))
            );
    }
    //以下是用户使用的API
    $.implement({
        toggle: function(/*fn1,fn2,fn3*/){
            var fns = Array.apply([],arguments), i = 0;
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
        undelegate: function(selector, types, fn ) {/*顺序不能乱*/
            return arguments.length == 1 ? this.off( selector, "**" ) : this.off( types, fn, selector );
        },
        die: function( types, fn ) {
            $( this.ownerDocument ).off( types, fn, this.selector || "**", fn );
            return this;
        },
        fire: function() {
            var args = arguments;
            return this.each(function() {
                $.event.fire.apply(this, args );
            });
        }
    });

    if( bindTop ){//事件系统三大核心方法之一，触发事件
        facade.fire = function( init ){
            var bindTarget = $["@bind"] in this, more = {}
            var target = bindTarget ? this : window;
            var type, transfer;
            if( typeof init == "string"){
                type = init;
                init = false;
            }
            if( init && init.preventDefault ){//如果是一个真事件对象或伪事件对象
                if( init instanceof $.Event ){//如果是伪的
                    type = init.origType;
                    more = init;
                }else{
                    transfer = init;//如果是真的
                }
            }
            if(type){
                type = new Event( type );
                type = type.origType;
                var doc = target.ownerDocument || target.document || target || document;
                transfer = doc.createEvent(eventMap[type] || "CustomEvent");// 
                if(/^(focus|blur|select|submit|reset)$/.test(type)){
                    target[type] && target[type]()
                }
                transfer.initEvent( type, true,true);//, doc.defaultView
            }
            transfer.args = [].slice.call( arguments, 1 ) ;
            transfer.more = more;
            target.dispatchEvent(transfer);
        }
    }
    //这个迭代器产生四个重要的事件绑定API on off bind unbind
    var rtypes = /^[a-z0-9_\-\.\s\,]+$/i
    "on_bind,off_unbind".replace( rmapper, function(_,method, mapper){
        $.fn[ method ] = function(types, selector, fn ){
            if ( typeof types === "object" ) {
                for ( var type in types ) {
                    $.fn[ method ](this, type, selector, types[ type ], fn );
                }
                return this;
            }
            var hash = {};
            for(var i = 0 ; i < arguments.length; i++ ){
                var el = arguments[i];
                if(typeof el == "number"){
                    hash.times = el;
                }else if(typeof el == "function"){
                    hash.fn = el
                }
                if(typeof el === "string"){
                    if(hash.type != null){
                        hash.live = el.trim();
                    }else{
                        hash.type = el.trim();//只能为字母数字-_.空格
                        if(!rtypes.test(hash.type)){
                            throw "hash.type should be a combination of this event type and the namespace!"
                        }
                    }
                }
            }
            if(method === "on"){
                if( !hash.type || !hash.fn ){
                    $.log("$.fn."+ method + " occur error: type and callback must be specified!");
                    return this;
                }
                hash.times = hash.times > 0  ? hash.times : Infinity;
                hash.live =  hash.live ? quickParse( hash.live ) : false
            }
            return this.each(function() {
                facade[ mapper ]( this, hash );
            });
        }
        $.fn[ mapper ] = function(){// $.fn.bind $.fn.unbind
            return $.fn[ method ].apply(this, arguments );
        }
    });
    var mouseEvents =  "contextmenu,click,dblclick,mouseout,mouseover,mouseenter,mouseleave,mousemove,mousedown,mouseup,mousewheel,"
    var eventMap = $.oneObject(mouseEvents, "MouseEvents");
    var types = mouseEvents +",keypress,keydown,keyup," + "blur,focus,focusin,focusout,"+
    "abort,error,load,unload,resize,scroll,change,input,select,reset,submit,input"
    types.replace( $.rword, function( type ){//这里产生以事件名命名的快捷方法
        eventMap[type] = eventMap[type] || (/key/.test(type) ? "UIEvents" : "HTMLEvents")
        $.fn[ type ] = function( callback ){
            return callback?  this.bind( type, callback ) : this.fire( type );
        }
    });
    /**
mouseenter/mouseleave/focusin/focusout已为标准事件，经测试IE5+，opera11,FF10都支持它们
详见http://www.filehippo.com/pl/download_opera/changelog/9476/
     */
    if( !+"\v1" || !$.eventSupport("mouseenter")){//IE6789不能实现捕获与safari chrome不支持
        "mouseenter_mouseover,mouseleave_mouseout".replace(rmapper, function(_, type, mapper){
            adapter[ type ]  = {
                setup: function( quark ){//使用事件冒充
                    quark[type+"_handle"]= $.bind( quark.currentTarget, mapper, function( event ){
                        var target = quark.currentTarget
                        var related = event.relatedTarget;
                        if(quark.live || !related || (related !== target && !$.contains( target, related )) ){
                            facade._dispatch( [ target  ], event, type );
                        }

                    })
                },
                teardown: function( quark ){
                    $.unbind( quark.currentTarget, mapper, quark[ type+"_handle" ] );
                }
            };
        });
    }
    //现在只有firefox不支持focusin,focus事件,并且它也不支持DOMFocusIn,DOMFocusOut,不能像DOMMouseScroll那样简单冒充
    if( !$.support.focusin ){
        "focusin_focus,focusout_blur".replace(rmapper, function(_,type, mapper){
            var notice = 0, handler = function (event) {
                var src = event.target;
                do{//模拟冒泡
                    if( $._data(src, "events") ) {
                        facade._dispatch( [ src ], event, type );
                    }
                } while (src = src.parentNode );
            }
            adapter[ type ] = {
                setup: function( ) {
                    if ( notice++ === 0 ) {
                        document.addEventListener( mapper, handler, true );
                    }
                },
                teardown: function() {
                    if ( --notice === 0 ) {
                        document.removeEventListener( mapper, handler, true );
                    }
                }
            };
        });
    }
    try{
        //FF需要用DOMMouseScroll事件模拟mousewheel事件
        document.createEvent("MouseScrollEvents");
        adapter.mousewheel = {
            bindType    : "DOMMouseScroll",
            delegateType: "DOMMouseScroll"
        }
        try{
            //可能末来FF会支持标准的mousewheel事件，则需要删除此分支
            document.createEvent("WheelEvent");
            delete adapter.mousewheel;
        }catch(e){ };

    }catch(e){};
})
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
2012.4.12 修正触摸屏下的pageX pageY
2012.5.1 让$.fn.fire支持自定义事件
2012.5.24 利用customEvent,initCustomEvent, dispatchEvent大大提高性能,升级到v5
2012.5.26 修正自定义事件target与this的指向
2012.5.28 Fix quickParse BUG
2012.5.29 利用Object.defineProperty打破事件对象的封装
2012.6.6 addEventListenter也能绑定自定义事件, 一些兼容逻辑移到event_fix中去 升级到v6
2012.8.17 $.EventTarget不再自带uniqueNumber，此属性会在用户第一次调用bind,unbind方法时再为原对象添加此属性
2012.8.31 移除$.EventTarget,以后所有自定义事件由操作流代劳,升级到v7

http://jsbin.com/efalu/7 input例子
//http://hacks.mozilla.org/2012/05/dom-mutationobserver-reacting-to-dom-changes-without-killing-browser-performance/
ECMAScript Edition3, 5 execution context and scope chain http://user.qzone.qq.com/153720615/blog/1339563690#!app=2&pos=1323177459
DOM Level3 Event对象新增API 浏览器实现 一览表:

IE9+(全部实现)(但是,IE9,IE10的e.isTrusted有bug .link.click();后出发的也是true...)

chrome5 - chrome17 部分实现.(e.isTrusted未支持),

Safari5 才部分实现.(e.isTrusted未支持).

Opera10 - Opera11部分实现(stopImmediatePropagation以及e.isTrusted未实现，而仅仅实现了defaultPrevented).
Opera12 部分实现 (stopImmediatePropagation,仍然为实现, 但实现了e.isTrusted)

Firefox1.0 - Firefox5 (stopImmediatePropagation和defaultPrevented 未实现,仅仅实现了e.isTrusted,isTrusted,在成为标准前，是MOZ的私有实现啊)
Firefox6 - Firefox10 (仅未实现stopImmediatePropagation)
Firefox11(终于实现了stopImmediatePropagation)
isTrusted 表明当前事件是否是由用户行为触发(比如说真实的鼠标点击触发一个click事件),
还是由一个脚本生成的(使用事件构造方法,比如event.initEvent)
     */