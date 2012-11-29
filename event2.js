
define("event", ["$node"][top.dispatchEvent ? "valueOf": "concat" ]("$event_fix"),function( $ ){
    $.log("已加载event模块v8")
    var facade = $.event || ($.event = {
        special: {}
    });
    var eventHooks = facade.special,
    rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
    rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;
    
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
    })

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
                    needsContext: selector && $.expr.match.needsContext.test( selector ),
                    namespace: namespaces.join(".")
                } );
                //初始化事件列队
                var handlers = events[ type ];
                if ( !handlers ) {
                    handlers = events[ type ] = [];
                    handlers.delegateCount = 0;
                    if ( !hook.setup || hook.setup.call( elem, namespaces, eventHandle ) === false ) {
                        if($["bind"] in elem){
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

        // Detach an event or set of events from an element
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
                        if($["bind"] in elem){
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
            // $.Event object
            event[ $.expando ] ? event :
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
            event.result = undefined;
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
            for ( i = 0; i < eventPath.length && !event.isPropagationStopped(); i++ ) {

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
            if (  !event.isDefaultPrevented() ) {

                if ( (!hook._default || hook._default.apply( elem.ownerDocument, data ) === false) &&
                    !(type === "click" &&  elem.nodeName == "A" )  ) {
                    if ( ontype && elem[ type ] && elem.nodeType ) {

                        old = elem[ ontype ];

                        if ( old ) {
                            elem[ ontype ] = null;
                        }
                        //防止二次trigger，elem.click会再次触发addEventListener中绑定的事件
                        $.event.triggered = type;
                        try {
                            //IE6-8在触发隐藏元素的focus/blur事件时会抛出异常
                            elem[ type ]();
                        } catch ( e ) {   }
                        $.event.triggered = undefined;

                        if ( old ) {
                            elem[ ontype ] = old;
                        }
                    }
                }
            }

            return event.result;
        },

        dispatch: function( event ) {

            // Make a writable $.Event from the native event object
            event = $.event.fix( event );

            var i, j, cur, ret, selMatch, matched, matches, handleObj, sel,
            handlers = ( ($._data( this, "events" ) || {} )[ event.type ] || []),
            delegateCount = handlers.delegateCount,
            args = Array.apply([], arguments ),
            special = eventHooks[ event.type ] || {},
            handlerQueue = [];

            // Use the fix-ed $.Event rather than the (read-only) native event
            args[0] = event;
            event.delegateTarget = this;

            // Call the preDispatch hook for the mapped type, and let it bail if desired
            if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
                return;
            }

            // Determine handlers that should run if there are delegated events
            // Avoid non-left-click bubbling in Firefox (#3861)
            if ( delegateCount && !(event.button && event.type === "click") ) {

                for ( cur = event.target; cur != this; cur = cur.parentNode || this ) {

                    // Don't process clicks (ONLY) on disabled elements (#6911, #8165, #11382, #11764)
                    if ( cur.disabled !== true || event.type !== "click" ) {
                        selMatch = {};
                        matches = [];
                        for ( i = 0; i < delegateCount; i++ ) {
                            handleObj = handlers[ i ];
                            sel = handleObj.selector;

                            if ( selMatch[ sel ] === undefined ) {
                                selMatch[ sel ] = handleObj.needsContext ?
                                $( sel, this ).index( cur ) >= 0 :
                                $.find( sel, this, null, [ cur ] ).length;
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

            // Add the remaining (directly-bound) handlers
            if ( handlers.length > delegateCount ) {
                handlerQueue.push({
                    elem: this,
                    matches: handlers.slice( delegateCount )
                });
            }

            // Run delegates first; they may want to stop propagation beneath us
            for ( i = 0; i < handlerQueue.length && !event.isPropagationStopped(); i++ ) {
                matched = handlerQueue[ i ];
                event.currentTarget = matched.elem;

                for ( j = 0; j < matched.matches.length && !event.isImmediatePropagationStopped(); j++ ) {
                    handleObj = matched.matches[ j ];

                    // Triggered event must either 1) have no namespace, or
                    // 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
                    if ( !event.namespace || event.namespace_re && event.namespace_re.test( handleObj.namespace ) ) {

                        event.data = handleObj.data;
                        event.handleObj = handleObj;

                        ret = ( ($.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
                        .apply( matched.elem, args );

                        if ( ret !== undefined ) {
                            event.result = ret;
                            if ( ret === false ) {
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        }
                    }
                }
            }

            // Call the postDispatch hook for the mapped type
            if ( special.postDispatch ) {
                special.postDispatch.call( this, event );
            }

            return event.result;
        },

        // Includes some event props shared by KeyEvent and MouseEvent
        props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),


        fix: function( event ) {
            if ( event[ $.expando ] ) {
                return event;
            }

            // Create a writable copy of the event object and normalize some properties
            var i, prop,
            originalEvent = event,
            fixHook = $.event.fixHooks[ event.type ] || {},
            copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

            event = $.Event( originalEvent );

            for ( i = copy.length; i; ) {
                prop = copy[ --i ];
                event[ prop ] = originalEvent[ prop ];
            }

            // Fix target property, if necessary (#1925, IE 6/7/8 & Safari2)
            if ( !event.target ) {
                event.target = originalEvent.srcElement || document;
            }

            // Target should not be a text node (#504, Safari)
            if ( event.target.nodeType === 3 ) {
                event.target = event.target.parentNode;
            }

            // For mouse/key events, metaKey==false if it's undefined (#3368, #11328; IE6/7/8)
            event.metaKey = !!event.metaKey;

            return fixHook.filter? fixHook.filter( event, originalEvent ) : event;
        },


        simulate: function( type, elem, event, bubble ) {
            // Piggyback on a donor event to simulate a different one.
            // Fake originalEvent to avoid donor's stopPropagation, but if the
            // simulated event prevents default then we do the same on the donor.
            var e = $.extend(
                new $.Event(),
                event,
                {
                    type: type,
                    isSimulated: true,
                    originalEvent: {}
                }
                );
            if ( bubble ) {
                $.event.trigger( e, null, elem );
            } else {
                $.event.dispatch.call( elem, e );
            }
            if ( e.isDefaultPrevented() ) {
                event.preventDefault();
            }
        }
    });
    
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
                facade.fire.apply(this, args );
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
    return $;
})