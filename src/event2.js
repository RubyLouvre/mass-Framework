$.define("event", "node" ,function(){
    $.log("已加载event2模块")
    try{
        var event = new CustomEvent4("mass");
        event.initCustomEvent("mass",true,true,{});
        $.support.customEvent = true;
    }catch(e){
        $.support.customEvent = false;
    }
    var LEVEL2 = $.support.customEvent;


    var rhoverHack = /(?:^|\s)hover(\.\S+)?\b/,  rmapper = /(\w+)_(\w+)/g,
    revent = /(^|_|:)([a-z])/g
    //如果不存在添加一个
    var facade = $.event = $.event || {};
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

    //添加或增强二级属性eventAdapter
    $.Object.merge(facade,{
        eventAdapter:{
            focus: {
                delegateType: "focusin"
            },
            blur: {
                delegateType: "focusout"
            }
        }
    });
    var eventAdapter  = $.event.eventAdapter;
    var firing = {}
    var wrapper = function(hash){
        var fn = function(event){
            var detail = firing["@"+hash.origType] || {}, scope = hash.scope//thisObject
            var queue = [ hash ]
            if( !LEVEL2 ){
                queue = ($._data( scope, "events") || []).concat();
                var win = ( scope.ownerDocument || scope.document || scope ).parentWindow || window
                event = facade.fix( event || win.event )
                event.type = hash.origType;
                event.currentTarget = scope;
            }
            var src = event.target;
            for ( var i = 0, item; item = queue[i++]; ) {
                if ( !src.disabled && !(event.button && event.type === "click")//fire
                    && (!item.selector  || facade.match(src, scope, item.selector))//selector
                    && (!detail.rns || detail.rns.test( item.ns ) ) ) {//fire
                    var result = item.callback.apply( item.selector ? src : scope, [event].concat(detail.args || []))
                    if ( result !== void 0 ) {
                        event.result = result;
                        if ( result === false ) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }
                    if ( event.isImmediatePropagationStopped ) {
                        $.log("event.isImmediatePropagationStopped")
                        break;
                    }
                }
            }
            return result;
        }
        fn.uuid = hash.uuid;
        return fn;
    }
    function parseType(event, selector) {//"focusin.aaa.bbb"
        var parts = ('' + event).split('.');
        var ns = parts.slice(1).sort().join(' ');//aaa bbb
        var origType = parts[0];
        var adapter =  eventAdapter[ origType] || {}//focusin -> focus
        return {
            type : (selector ? adapter.delegateType : adapter.bindType ) || origType,//focus
            origType: origType,
            selector: selector,
            ns: ns,
            rns: ns ? new RegExp("(^|\\.)" + ns.replace(' ', ' .* ?') + "(\\.|$)") : null
        }
    }
    //收集要移除的回调
    function findHandlers(hash, selector, fn, events) {
        return events.filter(function(item) {
            return item && (!hash.rns  || hash.rns.test(item.ns))  //通过事件类型进行过滤
            && (!hash.type || hash.type === item.type) //通过命名空间进行进行过滤
            && (!fn        || fn.uniqueNumber === item.uuid)//通过uuid进行过滤
            && (!selector  || selector === item.selector || selector === "**" && item.selector )//通过选择器进行过滤
        })
    }
    function quickIs( elem, m ) {
        var attrs = elem.attributes || {};
        return (
            (!m[1] || elem.nodeName.toLowerCase() === m[1]) &&
            (!m[2] || (attrs.id || {}).value === m[2]) &&
            (!m[3] || m[3].test( (attrs[ "class" ] || {}).value ))
            );
    }
    var jEvent = $.Event = function ( event ) {
        this.originalEvent = event.type ? event: {};
        this.type = (event.type || event).replace(/\..*/g,"");
        this.timeStamp  = Date.now();
    };
    // http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
    jEvent.prototype = {
        toString: function(){
            return "[object Event]"
        },
        preventDefault: function() {
            this.isDefaultPrevented = true;
            var e = this.originalEvent;
            // 如果存在preventDefault 那么就调用它
            if ( e.preventDefault ) {
                e.preventDefault();
            }// 如果存在returnValue 那么就将它设为false
            e.returnValue = false;
            return this;
        },
        stopPropagation: function() {
            var e = this.originalEvent;
            // 如果存在preventDefault 那么就调用它
            if ( e.stopPropagation ) {
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
    };

    $.mix(facade,{
        match: function( cur, parent, expr ){
            var matcher = expr.input ? quickIs : $.match
            for ( ; cur != parent; cur = cur.parentNode || parent ) {
                if(matcher(cur, expr))
                    return true
            }
            return false;
        },
        fix: function(event){
            if( !event.originalEvent ){
                var originalEvent = event
                event = new jEvent(originalEvent);
                for( var p in originalEvent ){
                    if( (p in event) ||  /^[A-Z_]+$/.test(p) || typeof originalEvent[p] == "function"){
                        continue;//去掉所有方法与常量
                    } 
                    event[p] = originalEvent[p]
                }
                //如果不存在target属性，为它添加一个
                if ( !event.target ) {
                    event.target = event.srcElement || document;
                }
                //safari的事件源对象可能为文本节点，应代入其父节点
                if ( event.target.nodeType === 3 ) {
                    event.target = event.target.parentNode;
                }
                if ( event.metaKey === undefined ) {
                    event.metaKey = event.ctrlKey; //  处理组合键
                }
                if( /^(?:mouse|contextmenu)|click/.test(event.type) ){
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
                    //IE event.button的意义
                    //0：没有键被按下 1：按下左键 2：按下右键 3：左键与右键同时被按下 4：按下中键 5：左键与中键同时被按下 6：中键与右键同时被按下 7：三个键同时被按下
                    if ( !event.which && isFinite(button) ) {
                        event.which  = [0,1,3,0,2,0,0,0][button];//0现在代表没有意义
                    }
                }
                if ( event.which == null ) {//处理键盘事件
                    event.which = event.charCode != null ? event.charCode : event.keyCode;
                }
                if( window.Touch && event.touches && event.touches[0] ){
                    event.pageX = event.touches[0].pageX//处理触摸事件
                    event.pageY = event.touches[0].pageY
                }
                if( event.type === "mousewheel" ){ //处理滚轮事件
                    if ("wheelDelta" in originalEvent){
                        var delta = originalEvent.wheelDelta/120;
                        //opera 9x系列的滚动方向与IE保持一致，10后修正
                        if(window.opera && opera.version() < 10)
                            delta = -delta;
                        event.wheelDelta = Math.round(delta); //修正safari的浮点 bug
                    }else if("detail" in originalEvent){
                        event.wheelDelta = -event.detail/3;
                    }
                }
            }
            return event;
        },
        bind: function( hash ){//hash 包含type callback times selector
            if( arguments.length > 1 ){
                throw "$.event bind method only need one argument, and it's a hash!"
            }
            var target = this, DOM =  $[ "@target" ] in target, events = $._data( target),
            types = hash.type, selector = hash.selector
            if( !events ){
                return
            }
            if( DOM ){ //处理DOM的hover事件
                types = types.replace( rhoverHack, "mouseover$1 mouseout$1" );
            }
            events = events.events || (events.events = []);
            hash.uuid = $.getUid( hash.callback ); //确保hash.uuid与callback.uuid一致
            types.replace( $.rword, function( old ){
                var item = parseType(old, selector);//"focusin.aaa.bbb"
                var type = item.type;
                $.mix(item, {
                    scope: target,//this,用于绑定数据的
                    target: !DOM ? window : target,//如果是自定义事件,使用window来代理
                    index: events.length
                }, hash, false);
                events.push( item );//用于事件拷贝
                events["@"+type] = ( events["@"+type] | 0 )+ 1;
                item.proxy = wrapper( item );
                if( LEVEL2 ){//一个回调绑定一个代理
                    item.target.addEventListener(type, item.proxy, !!selector )
                }else if(DOM && events["@"+type] == 1 ){//所有回调绑定一个代理
                    $.bind(item.target,type, item.proxy, !!selector )
                }
                
            });
        },
        //外部的API已经确保typesr至少为空字符串
        unbind: function( hash  ) {
            var target = this, events = $._data( target, "events");
            if(!events ) return;
          
            var types = hash.type || "", expr = hash.selector,
            DOM = $["@target"] in target;
            if( DOM ){ //处理DOM的hover事件
                types = types.replace( rhoverHack, "mouseover$1 mouseout$1" );
            }
            types.replace( $.rword, function( old ){
                findHandlers( parseType(old, expr), expr, hash.callback, events).forEach( function(item){
                    var type = item.type;
                    item.target.removeEventListener( type, item.proxy, !!expr);
                    events[item.index] = null;
                    if( --events["@"+type] == 0){
                        delete events[ "@"+type ];
                    }
                })
            });
            for (var i = events.length; i >=0;i--) {
                if (events[i] == null){
                    events.splice(i, 1);
                }
            }
            if( !events.length ){
                $.removeData( target, "events") ;
            }
            return this;
        },
        fire: function(type){
            var detail = parseType(type, false);
            type = detail.type;
            detail.args = $.slice(arguments,1)
            var DOM = $["@target"] in this;
            var support = DOM && $.eventSupport(type, this),event
            if(!DOM || !support){
                event = new CustomEvent(type);
                event.initCustomEvent(type,true,true,detail);
            }else{
                var doc = this.ownerDocument || this.document || this;
                event = doc.createEvent("Events");
                event.initEvent(type, true, true, null, null, null, null, null, null, null, null, null, null, null, null)
            }
            firing["@"+type] = detail;
            var target =  DOM ? this : window;
            target.dispatchEvent(event);
            delete firing["@"+type]
            return this;
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
        undelegate: function(selector, types, fn ) {/*顺序不能乱*/
            return arguments.length == 1? this.off( selector, "**" ) : this.off( types, fn, selector );
        },
        die: function( types, fn ) {
            $( this.ownerDocument ).off( types, fn, this.selector || "**", fn );
            return this;
        },
        fire: function(  ) {
            var args = arguments;
            if(this.mass && this.each){
                return this.each(function() {
                    $.event.fire.apply(this, args );
                });
            }else{
                return $.event.fire.apply(this, args );
            }
        }
    });
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
                    hash.times = el;
                }else if(typeof el == "function"){
                    hash.callback = el
                }if(typeof el === "string"){
                    if(hash.type != null){
                        hash.selector = el.trim()
                    }else{
                        hash.type = el.trim();
                        if(!/^[a-z0-9\.\s]+$/i.test(hash.type)){
                            throw "hash.type should be a combination of this event type and the namespace"
                        }
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
            if(this.mass && this.each){
                return this.each(function() {
                    facade[ mapper ].call( this, hash );
                });
            }else{
                return facade[ mapper ].call( this, hash );
            }
        }
        $.fn[ mapper ] = function(){// $.fn.bind $.fn.unbind
            return $.fn[ method ].apply(this, arguments );
        }
    });
    var rquickIs = /^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/
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
    $.fn.delegate = function( selector, types, fn, times ) {
        return this.on( types, selector, fn, times);
    }

});