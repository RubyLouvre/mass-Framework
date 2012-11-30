
define("event", ["$node"][top.dispatchEvent ? "valueOf": "concat" ]("$event_fix"),function( $ ){
    $.log("已加载event模块v9");
    var facade = $.event || ($.event = {
        special: {}
    });
    var eventHooks = facade.special,
    rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
    rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;
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
    function Event( src, props ) {
        if ( !(this instanceof $.Event) ) {
            return new Event( src, props );
        }
        // Event object
        this.originalEvent = {}
        if ( src && src.type ) {
            this.originalEvent = src;
            this.type = src.type;
        // Event type
        } else {
            this.type = src;
        }
        this.defaultPrevented = false;
        if ( props ) {
            $.mix( this, props );
        }
        this.timeStamp = new Date - 0;
    };
    Event.prototype = {
        toString: function(){
            return "[object Event]"
        },
        preventDefault: function() {
            this.defaultPrevented = true;
            var e = this.originalEvent
            if (e && e.preventDefault ) {
                e.preventDefault();
            }// 如果存在returnValue 那么就将它设为false
            e.returnValue = false;
            return this;
        },
        stopPropagation: function() {
            var e = this.originalEvent 
            if (e && e.stopPropagation ) {
                e.stopPropagation();
            } 
            //http://opera.im/kb/userjs/
            e.cancelBubble = this.propagationStopped = true;
            return this;
        },
        stopImmediatePropagation: function() {
            this.isImmediatePropagationStopped = true;
            this.stopPropagation();
            return this;
        }
    }
    $.Event = Event;
    $.mix(eventHooks,{
        load: {
            // Prevent triggered image.load events from bubbling to window.load
            noBubble: true
        },
        click: {
            // For checkbox, fire native event so checked state will be right
            trigger: function() {
                if ( this.nodeName ==  "INPUT" && this.type === "checkbox" && this.click ) {
                    this.click();
                    return false;
                }
            }
        },
        focus: {
            // Fire native event if possible so blur/focus sequence is correct
            trigger: function() {
                if ( this !== document.activeElement && this.focus ) {
                    try {
                        this.focus();
                        return false;
                    } catch ( e ) {
                    // IE<9 dies on focus to hidden element (#1486,#12518)
                    // If this happens, let .trigger() run the handlers
                    }
                }
            },
            delegateType: "focusin"
        },
        blur: {
            trigger: function() {
                if ( this === document.activeElement && this.blur ) {
                    this.blur();
                    return false;
                }
            },
            delegateType: "focusout"
        },
        beforeunload: {
            postDispatch: function( event ) {
                if ( event.result !== void 0 ) {
                    event.originalEvent.returnValue = event.result;
                }
            }
        }
    });

    $.mix(facade,{
        //addEventListner API的支持情况:chrome 1+ FF1.6+	IE9+ opera 7+ safari 1+;
        //http://functionsource.com/post/addeventlistener-all-the-way-back-to-ie-6
        bind: function( elem, hash ) {
            var  
            elemData   = $._data( elem ),         //是否能绑定事件
            types      = hash.type,               //原有的事件类型,可能是复数个
            selector   = hash.selector,           //是否使用事件代理
            handler    = hash.handler;            //回调函数
    
            if ( elem.nodeType === 3 || elem.nodeType === 8 || !types || !handler || !elemData  ) {
                return;
            }
            hash.uuid = $.getUid( handler );       //确保hash.uuid与fn.uuid一致
            var events = elemData.events || (elemData.events = []), eventHandle = elemData.handle;
            if ( !eventHandle ) {
                elemData.handle = eventHandle = function( e ) {
                    return typeof $ !== "undefined" && (!e || facade.triggered !== e.type) ?
                    facade.dispatch.apply( eventHandle.elem, arguments ) : void 0;
                };
                eventHandle.elem = elem;//由于IE的attachEvent回调中的this不指向绑定元素，需要强制缓存它
            }

            types.replace( $.rword, function( t ){
                var tns = rtypenamespace.exec( t) || [], type = tns[1];
                var namespaces = ( tns[2] || "" ).split( "." ).sort();
                // 看需不需要特殊处理
                var hook = eventHooks[ type ] || {};
                // 事件代理与事件绑定可以使用不同的冒充事件
                type = ( selector ? hook.delegateType : hook.bindType ) || type;
                hook = eventHooks[ type ] || {};
                var handleObj = $.mix({}, hash, {
                    type: type,
                    origType: tns[1],
                    namespace: namespaces.join(".")
                } );
                //初始化事件列队
                var handlers = events[ type ];
                if ( !handlers ) {
                    handlers = events[ type ] = [];
                    handlers.delegateCount = 0;
                    if ( !hook.setup || hook.setup.call( elem, namespaces, eventHandle ) === false ) {
                        if($["@bind"] in elem){
                            $.bind(elem, type,eventHandle,false )
                        }
                    }
                }
                if ( hook.add ) {
                    hook.add.call( elem, handleObj );
                }
                //将要需要代理的事件放于前面
                if ( selector ) {
                    handlers.splice( handlers.delegateCount++, 0, handleObj );
                } else {
                    handlers.push( handleObj );
                }
                //用于优化fire方法
                facade.global[ type ] = true;
            })
            //防止IE内在泄漏
            elem = null;
        },
       
        global: {},

        //外部的API已经确保types至少为空字符串
        unbind: function( elem, hash ) {

            var  elemData = $._data( elem ), events, j, handleObj, origType
            if( !elemData || !(events = elemData.events )) return;

            var types = hash.type || "", selector = hash.selector, handler = hash.handler;
            types.replace( $.rword, function( t ){
                var tns = rtypenamespace.exec( t ) || [];
                var type = origType = tns[1];
                var namespaces = tns[2];

                // Unbind all events (on this namespace, if provided) for the element
                if ( !type ) {
                    for ( type in events ) {
                        facade.unbind( elem, $.mix({}, hash, {
                            type: type + t
                        }) );
                    }
                    return
                }
                var hook = eventHooks[ type ] || {};
                type = ( selector? hook.delegateType : hook.bindType ) || type;
                var eventType = events[ type ] || [];
                var origCount = eventType.length;
                namespaces = namespaces ? new RegExp("(^|\\.)" + namespaces.split(".").sort().join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
            
                for ( j = 0; j < eventType.length; j++ ) {
                    handleObj = eventType[ j ];

                    if ( (  origType === handleObj.origType ) &&
                        ( !handler || handler.uniqueNumber === handleObj.uuid ) &&
                        ( !namespaces || namespaces.test( handleObj.namespace ) ) &&
                        ( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
                        eventType.splice( j--, 1 );

                        if ( handleObj.selector ) {
                            eventType.delegateCount--;
                        }
                        if ( hook.remove ) {
                            hook.remove.call( elem, handleObj );
                        }
                    }
                }

                // Remove generic event handler if we removed something and no more handlers exist
                // (avoids potential for endless recursion during removal of special event handlers)
                if ( eventType.length === 0 && origCount !== eventType.length ) {
                    if ( !hook.teardown || hook.teardown.call( elem, namespaces, elemData.handle ) === false ) {
                        if($["@bind"] in elem){
                            $.unbind(elem, type, elemData.handle ,false )
                        }
                    }

                    delete events[ type ];
                }
            })

            if ( $.isEmptyObject( events ) ) {
                delete elemData.handle;
                $._removeData( elem, "events" );
            }
        },

        trigger: function( event ) {
            var elem = this;
            //跳过文本节点与注释节点，主要是照顾旧式IE
            if ( elem && (elem.nodeType === 3 || elem.nodeType === 8) ) {
                return;
            }

            var i, cur, old, ontype, handle, eventPath, bubbleType,
            type = event.type || event,
            namespaces = event.namespace ? event.namespace.split(".") : [];

            // focus/blur morphs to focusin/out; ensure we're not firing them right now
            if ( rfocusMorph.test( type + facade.triggered ) ) {
                return;
            }

            if ( type.indexOf( "." ) >= 0 ) {
                //分解出命名空间
                namespaces = type.split(".");
                type = namespaces.shift();
                namespaces.sort();
            }
            //如果从来没有绑定过此种事件，也不用继续执行了
            if ( !elem && !facade.global[ type ] ) {
                return;
            }

            // Caller can pass in an Event, Object, or just an event type string
            event = typeof event === "object" ?
            // 如果是$.Event实例
            event.originalEvent ? event :
            // Object literal
            new $.Event( type, event ) :
            // Just the event type (string)
            new $.Event( type );

            event.type = type;
            event.isTrigger = true;
            event.namespace = namespaces.join( "." );
            event.namespace_re = event.namespace? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
            ontype = type.indexOf( ":" ) < 0 ? "on" + type : "";
            //清除result，方便重用
            event.result = void 0;
            if ( !event.target ) {
                event.target = elem;
            }
            //取得额外的参数
            var data = [].slice.call( arguments, 1 ) ;
            data.unshift( event );
            //判定是否需要用到事件冒充
            var hook = eventHooks[ type ] || {};
            if (  hook.trigger && hook.trigger.apply( elem, data ) === false ) {
                return;
            }

            //铺设往上冒泡的路径，每小段都包括处理对象与事件类型
            eventPath = [[ elem, hook.bindType || type ]];
            if (  !hook.noBubble && !$.type( elem, "Window" ) ) {

                bubbleType = hook.delegateType || type;
                cur = rfocusMorph.test( bubbleType + type ) ? elem : elem.parentNode;
                for ( old = elem; cur; cur = cur.parentNode ) {
                    eventPath.push([ cur, bubbleType ]);
                    old = cur;
                }
                //一直冒泡到window
                if ( old === (elem.ownerDocument || document) ) {
                    eventPath.push([ old.defaultView || old.parentWindow || window, bubbleType ]);
                }
            }

            //沿着之前铺好的路触发事件
            for ( i = 0; i < eventPath.length && !event.propagationStopped; i++ ) {

                cur = eventPath[i][0];
                event.type = eventPath[i][1];

                handle = ( $._data( cur, "events" ) || {} )[ event.type ] && $._data( cur, "handle" );
                if ( handle ) {
                    handle.apply( cur, data );
                }
                //处理直接写在标签中的内联事件或DOM0事件
                handle = ontype && cur[ ontype ];
                if ( handle && handle.apply && handle.apply( cur, data ) === false ) {
                    event.preventDefault();
                }
            }
            event.type = type;
            //如果没有阻止默认行为
            if (  !event.defaultPrevented ) {

                if ( (!hook._default || hook._default.apply( elem.ownerDocument, data ) === false) &&
                    !(type === "click" &&  elem.nodeName == "A" )  ) {
                    if ( ontype && elem[ type ] && elem.nodeType ) {

                        old = elem[ ontype ];

                        if ( old ) {
                            elem[ ontype ] = null;
                        }
                        //防止二次trigger，elem.click会再次触发addEventListener中绑定的事件
                        facade.triggered = type;
                        try {
                            //IE6-8在触发隐藏元素的focus/blur事件时会抛出异常
                            elem[ type ]();
                        } catch ( e ) {   }
                        facade.triggered = undefined;

                        if ( old ) {
                            elem[ ontype ] = old;
                        }
                    }
                }
            }

            return event.result;
        },

        dispatch: function( event ) {
            //包裹事件对象，统一事件接口与覆盖原生成属性
            event = $.event.fix( event );
            var i, j, cur, ret, selMatch, matched, matches, handleObj, sel,
            handlers = ( ($._data( this, "events" ) || {} )[ event.type ] || []),
            delegateCount = handlers.delegateCount,
            args = Array.apply([], arguments ),
            hook = eventHooks[ event.type ] || {},
            handlerQueue = [];
            //重置第一个参数
            args[0] = event;
            event.delegateTarget = this;

            // 经典的AOP模式
            if ( hook.preDispatch && hook.preDispatch.call( this, event ) === false ) {
                return;
            }
            //收集阶段
            //如果使用了事件代理，则先执行事件代理的回调
            if ( delegateCount && !(event.button && event.type === "click") ) {
                for ( cur = event.target; cur != this; cur = cur.parentNode || this ) {
                    //disabled元素不能触发点击事件
                    if ( cur.disabled !== true || event.type !== "click" ) {
                        selMatch = {};                     
                        matches = [];
                        for ( i = 0; i < delegateCount; i++ ) {
                            handleObj = handlers[ i ];
                            sel = handleObj.selector;
                            //判定目标元素(this)的孩子(cur)是否匹配（sel）
                            if ( selMatch[ sel ] === void 0 ) {
                                selMatch[ sel ] =  $( sel, this ).index( cur ) >= 0 
                            }
                            if ( selMatch[ sel ] ) {
                                matches.push( handleObj );
                            }
                        }
                        if ( matches.length ) {
                            handlerQueue.push({
                                elem: cur,
                                matches: matches
                            });
                        }
                    }
                }
            }

            // 这是事件绑定的回调
            if ( handlers.length > delegateCount ) {
                handlerQueue.push({
                    elem: this,
                    matches: handlers.slice( delegateCount )
                });
            }

            // 如果没有阻止事件传播，则执行它们
            for ( i = 0; i < handlerQueue.length && !event.propagationStopped; i++ ) {
                matched = handlerQueue[ i ];
                event.currentTarget = matched.elem;
                for ( j = 0; j < matched.matches.length && !event.isImmediatePropagationStopped; j++ ) {
                    handleObj = matched.matches[ j ];
                    //namespace，.namespace_re属性只出现在trigger方法中
                    if ( !event.namespace || event.namespace_re && event.namespace_re.test( handleObj.namespace ) ) {

                        event.data = handleObj.data;
                        event.handleObj = handleObj;
                        ret = ( (eventHooks[ handleObj.origType ] || {}).handle || handleObj.handler ).apply( matched.elem, args );
                        handleObj.times--;
                        if(handleObj.times === 0){//如果有次数限制并到用光所有次数，则移除它
                            facade.unbind( matched.elem, handleObj)
                        }
                        if ( ret !== void 0 ) {
                            event.result = ret;
                            if ( ret === false ) {
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        }
                    }
                }
            }

            if ( hook.postDispatch ) {
                hook.postDispatch.call( this, event );
            }

            return event.result;
        },


        fix: function( event ) {
            if ( event.originalEvent ) {
                return event;
            }
            var  real = event;
            event = $.Event( real );
            //复制真实事件对象的成员
            for( var p in real ){
                if( !(p in event) ){
                    event[p] = real[p]
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
            event.metaKey = !!event.ctrlKey; // 处理IE678的组合键
            if( /^(?:mouse|contextmenu)|click/.test( event.type ) ){
                if ( event.pageX == null && event.clientX != null ) {  // 处理鼠标事件
                    var doc = event.target.ownerDocument || document;
                    var box = document.compatMode == "BackCompat" ?  doc.body : doc.documentElement
                    event.pageX = event.clientX + (box && box.scrollLeft  || 0) - (box && box.clientLeft || 0);
                    event.pageY = event.clientY + (box && box.scrollTop   || 0) - (box && box.clientTop  || 0);
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
                if( event.type === "mousewheel" ){ //处理滚轮事件
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
            return event;
        },
        simulate: function( type, elem, event, bubble ) {
            var e = $.mix(
                new $.Event(),
                event,
                {
                    type: type,
                    isSimulated: true,
                    originalEvent: {}
                } );

            $.event[bubble ? "trigger" : "dispatch"].call( elem, e );
            if ( e.defaultPrevented ) {
                event.preventDefault();
            }
        }
    });
    facade.add = facade.bind;
    facade.remove = facade.unbind;
    var rmapper = /(\w+)_(\w+)/g;
    //以下是用户使用的API
    $.implement({
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
                facade.trigger.apply(this, args );
            });
        }
    });
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
                    hash.handler = el
                }
                if(typeof el === "string"){
                    if(hash.type != null){
                        hash.selector = el.trim();
                    }else{
                        hash.type = el.trim();//只能为字母数字-_.空格
                        if(!rtypes.test(hash.type)){
                            throw "事件类型格式不正确"
                        }
                    }
                }
            }
            if(!hash.type){
                throw "必须指明事件类型"
            }
            if(method === "on" && !hash.handler ){
                throw "必须指明事件回调"
            }
            hash.times = hash.times > 0  ? hash.times : Infinity;
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
    "abort,error,load,unload,resize,scroll,change,input,select,reset,submit"//input
    types.replace( $.rword, function( type ){//这里产生以事件名命名的快捷方法
        eventMap[type] = eventMap[type] || (/key/.test(type) ? "KeyboardEvent" : "HTMLEvents")
        $.fn[ type ] = function( callback ){
            return callback?  this.bind( type, callback ) : this.fire( type );
        }
    });
    /* mouseenter/mouseleave/focusin/focusout已为标准事件，经测试IE5+，opera11,FF10+都支持它们
详见http://www.filehippo.com/pl/download_opera/changelog/9476/
         */
    if( !+"\v1" || !$.eventSupport("mouseenter")){//IE6789不能实现捕获与safari chrome不支持
        "mouseenter_mouseover,mouseleave_mouseout".replace(rmapper, function(_, type, fix){
            eventHooks[type] = {
                delegateType: fix,
                bindType: fix,
                handle: function( event ) {
                    var ret,
                    target = this,
                    related = event.relatedTarget,
                    handleObj = event.handleObj;
                    // For mousenter/leave call the handler if related is outside the target.
                    // NB: No relatedTarget if the mouse left/entered the browser window
                    if ( !related || (related !== target && !$.contains( target, related )) ) {
                        event.type = handleObj.origType;
                        ret = handleObj.handler.apply( this, arguments );
                        event.type = fix;
                    }
                    return ret;
                }
            }
        });
    }
    //现在只有firefox不支持focusin,focusout事件,并且它也不支持DOMFocusIn,DOMFocusOut,不能像DOMMouseScroll那样简单冒充
    if( !$.support.focusin ){
        "focusin_focus,focusout_blur".replace(rmapper, function(_,orig, fix){
            var attaches = 0,
            handler = function( event ) {
                facade.simulate( fix, event.target, facade.fix( event ), true );
            };
            eventHooks[ fix ] = {
                setup: function() {
                    if ( attaches++ === 0 ) {
                        document.addEventListener( orig, handler, true );
                    }
                },
                teardown: function() {
                    if ( --attaches === 0 ) {
                        document.removeEventListener( orig, handler, true );
                    }
                }
            };
        });
    }
    try{
        //FF需要用DOMMouseScroll事件模拟mousewheel事件
        document.createEvent("MouseScrollEvents");
        eventHooks.mousewheel = {
            bindType    : "DOMMouseScroll",
            delegateType: "DOMMouseScroll"
        }
        if($.eventSupport("mousewheel")){
            delete eventHooks.mousewheel;
        }
    }catch(e){};
    
    return $;
})


