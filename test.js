function addEvent(element, type, handler) {
    //回调添加UUID，方便移除
    if (!handler.$$guid) handler.$$guid = addEvent.guid++;
    //元素添加events，保存所有类型的回调
    if (!element.events) element.events = {};
    var handlers = element.events[type];
    if (!handlers) {
        //创建一个子对象，保存当前类型的回调
        handlers = element.events[type] = {};
        //如果元素之前以onXXX = callback的方式绑定过事件，则成为当前类别第一个被触发的回调
        //问题是这回调是没有UUID，只能通过el.onXXX = null移除
        if (element["on" + type]) {
            handlers[0] = element["on" + type];
        }
    }
    //保存当前的回调
    handlers[handler.$$guid] = handler;
    //所有回调统一交由handleEvent触发
    element["on" + type] = handleEvent;
}

addEvent.guid = 1;//UUID
//移除事件，只要从当前类别的储存对象delete就行
function removeEvent(element, type, handler) {
    if (element.events && element.events[type]) {
        delete element.events[type][handler.$$guid];
    }
}

function handleEvent(event) {
    var returnValue = true;
    //统一事件对象阻止默认行为与事件传统的接口
    event = event || fixEvent(window.event);
    //根据事件类型，取得要处理回调集合，由于UUID是纯数字，因此可以按照绑定时的顺序执行
    var handlers = this.events[event.type];
    for (var i in handlers) {
        this.$$handleEvent = handlers[i];
        //根据返回值判定是否阻止冒泡
        if (this.$$handleEvent(event) === false) {
            returnValue = false;
        }
    }
    return returnValue;
};
//对IE的事件对象做简单的修复
function fixEvent(event) {
    event.preventDefault = fixEvent.preventDefault;
    event.stopPropagation = fixEvent.stopPropagation;
    return event;
};
fixEvent.preventDefault = function() {
    this.returnValue = false;
};
fixEvent.stopPropagation = function() {
    this.cancelBubble = true;
};
//AMD模模块定义，此为匿名模块，所依赖的第一模块存在三元运算符，表示它为可选模块，如果不是浏览器环境就引入AOP模块
define(["./has!dom-addeventlistener?:./aspect", "./_base/kernel", "./has"], function(aspect, dojo, has){
    "use strict";//es5的严格模式
    if(has("dom")){ //如果是浏览器环境
        var major = window.ScriptEngineMajorVersion;
        has.add("jscript", major && (major() + ScriptEngineMinorVersion() / 10));//取得IE的JS引擎版本
        //判定是否手机，手机有orientationchange事件，用于自动旋转画画
        has.add("event-orientationchange", has("touch") && !has("android"));
        //判定是否支持stopImmediatePropagation
        has.add("event-stopimmediatepropagation", window.Event && !!window.Event.prototype && !!window.Event.prototype.stopImmediatePropagation);
    }
    var on = function(target, type, listener, dontFix){
        //用于node.js，它的EventEmitter子类都拥有更简洁on API，用于绑定事件，当然你也可以用addListener
        if(typeof target.on == "function" && typeof type != "function"){
            return target.on(type, listener);
        }
        // delegate to main listener code
        return on.parse(target, type, listener, addListener, dontFix, this);
    };
    on.pausable =  function(target, type, listener, dontFix){
        // on方法的变种，允许中断回调的执行。
        var paused;
        var signal = on(target, type, function(){
            if(!paused){
                return listener.apply(this, arguments);
            }
        }, dontFix);
        signal.pause = function(){
            paused = true;
        };
        signal.resume = function(){
            paused = false;
        };
        return signal;
    };
    on.once = function(target, type, listener, dontFix){
        //用于只执行一次立即就移除的场合，比如AJAX提交表单，防止重复提交
        var signal = on(target, type, function(){
            signal.remove();
            return listener.apply(this, arguments);
        });
        return signal;
    };
    on.parse = function(target, type, listener, addListener, dontFix, matchesTarget){
        if(type.call){
            return type.call(matchesTarget, target, listener);
        }

        if(type.indexOf(",") > -1){//允许同时绑定多种事件，但都共用一个回调，熟悉jQuery的人应该感到亲切
            var events = type.split(/\s*,\s*/);
            var handles = [];//从上面的代码内看，它是收集一种叫signal的对象，则是由内部的addListener统一派发的
            var i = 0;
            var eventName;
            while(eventName = events[i++]){
                handles.push(addListener(target, eventName, listener, dontFix, matchesTarget));
            }
            handles.remove = function(){//这数组添加一个remove方法，用于一下子清空所有绑定
                for(var i = 0; i < handles.length; i++){
                    handles[i].remove();
                }
            };
            return handles;
        }
        return addListener(target, type, listener, dontFix, matchesTarget);
    };
    var touchEvents = /^touch/;
    function addListener(target, type, listener, dontFix, matchesTarget){
        //判定用户是否要求使用事件代理，要求第二个参数是诸如button.myClass:click，tr:mouseover的格式
        var selector = type.match(/(.*):(.*)/);
        if(selector){
            type = selector[2]; selector = selector[1];
            // 见下面的on.selector注释，这是一个curry
            return on.selector(selector, type).call(matchesTarget, target, listener);
        }
        if(has("touch")){//判定是否在触摸设备下
            if(touchEvents.test(type)){
                listener = fixTouchListener(listener);
            }
            //如果是绑定orientationchange但浏览器又不支持此事件，比如 Android 2.1以下的浏览器
            if(!has("event-orientationchange") && (type == "orientationchange")){
                type = "resize";
                target = window;
                listener = fixTouchListener(listener);
            }
        }
        if(addStopImmediate){//如果浏览器不支持stopImmediatePropagation API
            listener = addStopImmediate(listener);
        }
        //换言之，一路下来，原始回调会视各种情况，包裹各种补丁函数
        if(target.addEventListener){
            //captures是一个外围对象，名字起得非常不好，应该叫做eventMap或typeMap，用于事件冒充的
            //比如说FF不支持mousewheel,focusin,focusout，要用DOMMouseScroll,focus, blur冒充
            var capture = type in captures,
            adjustedType = capture ? captures[type] : type;
            target.addEventListener(adjustedType, listener, capture);
            return {//返回一个signal对象
                remove: function(){
                    target.removeEventListener(adjustedType, listener, capture);
                }
            };
        }
        type = "on" + type;
        //如果是IE则使用fixAttach方法来绑定事件
        if(fixAttach && target.attachEvent){
            return fixAttach(target, type, listener);
        }
        throw new Error("Target must be an event emitter");
    }

    on.selector = function(selector, eventType, children){
        return function(target, listener){
            //如果用户的第二个参数是过滤函数
            var matchesTarget = typeof selector == "function" ? {
                matches: selector
            } : this,
            bubble = eventType.bubble;
            function select(eventTarget){
                //如果用户自己指定了过滤函数就用户的，否则使用选择器引擎 dojo.query
                matchesTarget = matchesTarget && matchesTarget.matches ? matchesTarget : dojo.query;
                // 然后我们通过过滤函数，从代理元素的孩子中选择出符合条件的元素出来
                while(!matchesTarget.matches(eventTarget, selector, target)){
                    if(eventTarget == target || children === false ||
                        !(eventTarget = eventTarget.parentNode) || eventTarget.nodeType != 1){
                        return;
                    }
                }
                return eventTarget;
            }
            if(bubble){
                return on(target, bubble(select), listener);
            }
            return on(target, eventType, function(event){
                var eventTarget = select(event.target);//得到真正的事件源
                return eventTarget && listener.call(eventTarget, event);//执行回调
            });
        };
    };

    function syntheticPreventDefault(){
        this.cancelable = false;
    }
    function syntheticStopPropagation(){
        this.bubbles = false;
    }
    var slice = [].slice,
    syntheticDispatch = on.emit = function(target, type, event){
        var args = slice.call(arguments, 2);
        var method = "on" + type;
        if("parentNode" in target){//创建一个伪事件对象
            var newEvent = args[0] = {};
            for(var i in event){
                newEvent[i] = event[i];
            }
            newEvent.preventDefault = syntheticPreventDefault;
            newEvent.stopPropagation = syntheticStopPropagation;
            newEvent.target = target;
            newEvent.type = type;
            event = newEvent;
        }
        do{
            // 以冒泡方式依次触发自己以及祖先节点的同类型事件，直到用户阻止冒泡或冒到document上
            target[method] && target[method].apply(target, args);
        }while(event && event.bubbles && (target = target.parentNode));
        return event && event.cancelable && event;
    };
    var captures = {};
    if(!has("event-stopimmediatepropagation")){
        var stopImmediatePropagation =function(){
            this.immediatelyStopped = true;
            this.modified = true;
        };
        var addStopImmediate = function(listener){
            return function(event){
                if(!event.immediatelyStopped){//用于为事件对象添加stopImmediatePropagation方法
                    event.stopImmediatePropagation = stopImmediatePropagation;
                    return listener.apply(this, arguments);
                }
            };
        }
    }
    if(has("dom-addeventlistener")){
        // 对不支持或存在问题的事件类型进行事件冒弃
        captures = {
            focusin: "focus",
            focusout: "blur"
        };
        if(has("opera")){
            captures.keydown = "keypress";
        }

        // 事件派发
        on.emit = function(target, type, event){
            if(target.dispatchEvent && document.createEvent){
                var nativeEvent = target.ownerDocument.createEvent("HTMLEvents");
                nativeEvent.initEvent(type, !!event.bubbles, !!event.cancelable);
                //在标准浏览器下，当一个事件被初始化后就可以添加自定义属性了
                for(var i in event){
                    if(!(i in nativeEvent)){
                        nativeEvent[i] = event[i];
                    }
                }
                return target.dispatchEvent(nativeEvent) && nativeEvent;
            }//处理自定义事件，target不是DOM对象
            return syntheticDispatch.apply(on, arguments);
        };
    }else{
        // 为IE修正事件对象
        on._fixEvent = function(evt, sender){
            if(!evt){//取得当前事件绑定的window环境
                var w = sender && (sender.ownerDocument || sender.document || sender).parentWindow || window;
                evt = w.event;//取得事件对象
            }
            if(!evt){
                return evt;
            }
            if(lastEvent && evt.type == lastEvent.type){//一个优化
                evt = lastEvent;
            }
            if(!evt.target){ // 添加一些W3C标准事件属性或方法
                evt.target = evt.srcElement;
                evt.currentTarget = (sender || evt.srcElement);
                if(evt.type == "mouseover"){
                    evt.relatedTarget = evt.fromElement;
                }
                if(evt.type == "mouseout"){
                    evt.relatedTarget = evt.toElement;
                }
                if(!evt.stopPropagation){
                    evt.stopPropagation = stopPropagation;
                    evt.preventDefault = preventDefault;
                }
                //修正keypress事件下的charCode与keyCode
                switch(evt.type){
                    case "keypress":
                        var c = ("charCode" in evt ? evt.charCode : evt.keyCode);
                        if (c==10){
                            c=0;
                            evt.keyCode = 13;
                        }else if(c==13||c==27){
                            c=0;
                        }else if(c==3){
                            c=99;
                        }
                        evt.charCode = c;
                        _setKeyChar(evt);
                        break;
                }
            }
            return evt;
        };
        var lastEvent, IESignal = function(handle){
            this.handle = handle;
        };
        IESignal.prototype.remove = function(){
            delete _dojoIEListeners_[this.handle];
        };
        var fixListener = function(listener){
            return function(evt){
                evt = on._fixEvent(evt, this);//修正事件对象
                var result = listener.call(this, evt);
                if(evt.modified){//如果执行了stopImmediatePropagation方法，modified为true
                    if(!lastEvent){//先保存修正过的事件到lastEvent，方便重复利用
                        setTimeout(function(){
                            lastEvent = null;
                        });//setTimeout的零秒延迟
                    }
                    lastEvent = evt;
                }
                return result;
            };
        };
        var fixAttach = function(target, type, listener){
            listener = fixListener(listener);
            if(((target.ownerDocument ? target.ownerDocument.parentWindow : target.parentWindow || target.window || window) != top ||
                has("jscript") < 5.8) &&
                !has("config-_allow_leaks")){
                //这里回调的处理过程非常有意思，有报告说，在IE6-8中，iframe结构绑定事件有问题，因此回调统一放到全局的_dojoIEListeners_
                //然后每个元素的onXXX属性都对应一个动态创建的emiter方法
                //emiter方法上面拥有一个listeners数组，里面是放置用户当前回调在_dojoIEListeners_中的索引值
                //因此执行时，会得到索引值，再得到用户回调（当然这个回调已经包了几层了）
                if(typeof _dojoIEListeners_ == "undefined"){
                    _dojoIEListeners_ = [];
                }
                var emiter = target[type];
                //如果用户已经用onXXX的原始方式绑定过事件，并且不是框架动态生成的emiter
                if(!emiter || !emiter.listeners){
                    var oldListener = emiter;
                    emiter = Function('event', 'var callee = arguments.callee; for(var i = 0; i<callee.listeners.length; i++){var listener = _dojoIEListeners_[callee.listeners[i]]; if(listener){listener.call(this,event);}}');
                    emiter.listeners = [];
                    target[type] = emiter;//type为onXXX格式
                    emiter.global = this;
                    if(oldListener){//储存用户用onXXX方式绑定的回调
                        emiter.listeners.push(_dojoIEListeners_.push(oldListener) - 1);
                    }
                }
                var handle;//储存用户用框架的on API绑定的回调
                emiter.listeners.push(handle = (emiter.global._dojoIEListeners_.push(listener) - 1));
                //返回一个signal对象，可见IE与标准浏览器的signal不是一个东西
                return new IESignal(handle);
            }
            return aspect.after(target, type, listener, true);
        };

        var _setKeyChar = function(evt){//添加两个自定义属性
            evt.keyChar = evt.charCode ? String.fromCharCode(evt.charCode) : '';
            evt.charOrCode = evt.keyChar || evt.keyCode;
        };

        var stopPropagation = function(){//为IE事件对象伪造一个stopPropagation方法
            this.cancelBubble = true;
        };
        var preventDefault = on._preventDefault = function(){
            this.bubbledKeyCode = this.keyCode;
            if(this.ctrlKey){//this为事件对象，IE下修正原生可能抛错
                try{
                    // squelch errors when keyCode is read-only
                    // (e.g. if keyCode is ctrl or shift)
                    this.keyCode = 0;
                }catch(e){ }
            }
            this.defaultPrevented = true;
            this.returnValue = false;
        };
    }
    if(has("touch")){
        var Event = function(){};
        var windowOrientation = window.orientation;
        var fixTouchListener = function(listener){
            return function(originalEvent){
                //修正触摸屏下的事件对象
                //比如在iOS下 e.pageX|pageY 不正确，在安卓下没有 e.rotation，e.scale，onorientationchange
                var event = originalEvent.corrected;
                if(!event){
                    var type = originalEvent.type;
                    try{
                        delete originalEvent.type; // on some JS engines (android), deleting properties make them mutable
                    }catch(e){}
                    if(originalEvent.type){//能使用子类的情况
                        // deleting properties doesn't work (older iOS), have to use delegation
                        Event.prototype = originalEvent;//创建一个原生事件的子类
                        var event = new Event;
                        // have to delegate methods to make them work
                        event.preventDefault = function(){
                            originalEvent.preventDefault();
                        };
                        event.stopPropagation = function(){
                            originalEvent.stopPropagation();
                        };
                    }else{
                        // deletion worked, use property as is
                        event = originalEvent;
                        event.type = type;
                    }
                    originalEvent.corrected = event;//标识已经修正
                    if(type == 'resize'){//用resize模拟orientationchange
                        if(windowOrientation == window.orientation){
                            return null;
                        }
                        windowOrientation = window.orientation;
                        event.type = "orientationchange";
                        return listener.call(this, event);
                    }
                    if(!("rotation" in event)){ // test to see if it has rotation
                        event.rotation = 0;
                        event.scale = 1;
                    }
                    //use event.changedTouches[0].pageX|pageY|screenX|screenY|clientX|clientY|target
                    var firstChangeTouch = event.changedTouches[0];
                    for(var i in firstChangeTouch){
                        delete event[i];
                        event[i] = firstChangeTouch[i];
                    }
                }
                return listener.call(this, event);
            };
        };
    }
    return on;
});

add: function( elem, types, handler, data, selector ) {

    var elemData, eventHandle, events,
    t, tns, type, namespaces, handleObj,
    handleObjIn, handlers, special;
    //如果elem不能添加自定属性，由于IE下访问为文本节点会抛错，因此事件源不能为文本节点，
    //注释节点本来就不应该绑定事件，注释节点之所以混进来，是因为jQuery的html方法所致
    //如果没有指定事件类型或回调也立即返回，不再向下操作
    if ( elem.nodeType === 3 || elem.nodeType === 8 || !types || !handler || !(elemData = jQuery._data( elem )) ) {
        return;
    }
    //取得用户回调与CSS表达式，handleObjIn这种结构我称之为事件描述
    //记叙用户绑定此回调时的各种信息，方便用于“事件拷贝”
    if ( handler.handler ) {
        handleObjIn = handler;
        handler = handleObjIn.handler;
        selector = handleObjIn.selector;
    }
    //确保回调拥有UUID，用于查找与移除
    if ( !handler.guid ) {
        handler.guid = jQuery.guid++;
    }
    //为此元素在数据缓存系统中开辟一个叫“event”的空间来保存其所有回调与事件处理器
    events = elemData.events;
    if ( !events ) {
        elemData.events = events = {};
    }
    eventHandle = elemData.handle;//事件处理器
    if ( !eventHandle ) {
        elemData.handle = eventHandle = function( e ) {
            //用户在事件冒充时，被二次fire或者在页面unload后触发事件
            return typeof jQuery !== "undefined" && (!e || jQuery.event.triggered !== e.type) ?
                jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
                undefined;
        };
        //原注释是说，防止IE下非原生事件内存泄漏，不过我觉得直接的影响是明确了this的指向
        eventHandle.elem = elem;
    }
    //通过空格隔开同时绑定多个事件，比如 jQuery(...).bind("mouseover mouseout", fn);
    types = jQuery.trim( hoverHack(types) ).split( " " );
    for ( t = 0; t < types.length; t++ ) {

        tns = rtypenamespace.exec( types[t] ) || [];  //取得命名空间
        type = tns[1];//取得真正的事件
        namespaces = ( tns[2] || "" ).split( "." ).sort();//修正命名空间
        //并不是所有事件都能直接使用，比如FF下没有mousewheel，需要用DOMMouseScroll冒充
        special = jQuery.event.special[ type ] || {};
        //有时候我们只需要在事件代理时进行冒充，比如FF下的focus，blur
        type = ( selector ? special.delegateType : special.bindType ) || type;

        special = jQuery.event.special[ type ] || {};
        // 构建一个事件描述对象
        handleObj = jQuery.extend({
            type: type,
            origType: tns[1],
            data: data,
            handler: handler,
            guid: handler.guid,
            selector: selector,
            needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
            namespace: namespaces.join(".")
        }, handleObjIn );
        //在events对象上分门别类储存事件描述，每种事件对应一个数组
        //每种事件只绑定一次监听器（即addEventListener，attachEvent）
        handlers = events[ type ];
        if ( !handlers ) {
            handlers = events[ type ] = [];
            handlers.delegateCount = 0;//记录要处理的回调的个数
            //如果存在 special.setup并且 special.setup返回0才直接使用多投事件API
            if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
                if ( elem.addEventListener ) {
                    elem.addEventListener( type, eventHandle, false );

                } else if ( elem.attachEvent ) {
                    elem.attachEvent( "on" + type, eventHandle );
                }
            }
        }

        if ( special.add ) {//处理自定义事件
            special.add.call( elem, handleObj );

            if ( !handleObj.handler.guid ) {
                handleObj.handler.guid = handler.guid;
            }
        }

        // Add to the element's handler list, delegates in front
        if ( selector ) {//如果是使用事件代理，那么把此事件描述放到数组的前面
            handlers.splice( handlers.delegateCount++, 0, handleObj );
        } else {
            handlers.push( handleObj );
        }
        //用于jQuery.event.trigger，如果此事件从来没有绑定过，也没有必要进入trigger的真正处理逻辑
        jQuery.event.global[ type ] = true;
    }
    //防止IE内存泄漏
    elem = null;
},

// Detach an event or set of events from an element
remove: function( elem, types, handler, selector ) {

    var t, tns, type, origType, namespaces, origCount,
    j, events, special, eventType, handleObj,
    elemData = jQuery.hasData( elem ) && jQuery._data( elem );
    //如果不支持添加自定义属性或没有缓存与事件有关的东西，立即返回
    if ( !elemData || !(events = elemData.events) ) {
        return;
    }
    //hover转换为“mouseenter mouseleave”，并且按空格进行切割，方便移除多种事件类型
    types = jQuery.trim( hoverHack( types || "" ) ).split(" ");
    for ( t = 0; t < types.length; t++ ) {
        tns = rtypenamespace.exec( types[t] ) || [];
        type = origType = tns[1];//取得事件类型
        namespaces = tns[2];//取得命名空间
        if ( !type ) {//如果没有指定事件类型，则移除所有事件类型或移除所有与此命名空间有关的事件类型
            for ( type in events ) {
                jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
            }
            continue;
        }
        //利用事件冒充，取得真正用于绑定的事件类型
        special = jQuery.event.special[ type ] || {};
        type = ( selector? special.delegateType : special.bindType ) || type;
        eventType = events[ type ] || [];//得取装载事件描绘对象的数组
        origCount = eventType.length;
        //取得用于过滤命名空间的正则，没有为null
        namespaces = namespaces ? new RegExp("(^|\\.)" + namespaces.split(".").sort().join("\\.(?:.*\\.|)") + "(\\.|$)") : null;

        // 移除符合条件的事件描述对象
        for ( j = 0; j < eventType.length; j++ ) {
            handleObj = eventType[ j ];

            if ( (  origType === handleObj.origType ) &&//比较事件类型是否一致
            ( !handler || handler.guid === handleObj.guid ) &&//如果传进了回调,判定UUID是否相同
            ( !namespaces || namespaces.test( handleObj.namespace ) ) &&//如果types含有命名空间,用正则看是否匹配
            //如果是事件代理必有CSS表达式,比较与事件描述对象中的是否相等
            ( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
                eventType.splice( j--, 1 );//是就移除
                if ( handleObj.selector ) {//同时delegateCount减一
                    eventType.delegateCount--;
                }
                if ( special.remove ) {//处理个别事件的移除
                    special.remove.call( elem, handleObj );
                }
            }
        }
        //如果已经移除所有此类型回调,则卸载框架绑定去的elemData.handle
        //origCount !== eventType.length 是为了防止死循环
        if ( eventType.length === 0 && origCount !== eventType.length ) {
            if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
                jQuery.removeEvent( elem, type, elemData.handle );
            }

            delete events[ type ];
        }
    }

    if ( jQuery.isEmptyObject( events ) ) {
        delete elemData.handle;
        jQuery.removeData( elem, "events", true );
    }
},
dispatch: function( event ) {
    //创建一个伪事件对象(jQuery.Event实例)，从真正的事件对象上抽取得相应的属性附于其上，
    //如果是IE，亦可以将它们转换成对应的W3C属性，抹平两大平台的差异
    event = jQuery.event.fix( event || window.event );
　　
    var i, j, cur, ret, selMatch, matched, matches, handleObj, sel, related,
    //取得所有事件描述对象
    handlers = ( (jQuery._data( this, "events" ) || {} )[ event.type ] || []),
    delegateCount = handlers.delegateCount,
    args = core_slice.call( arguments ),
    run_all = !event.exclusive && !event.namespace,
    special = jQuery.event.special[ event.type ] || {},
    handlerQueue = [];
　　
    //重置第一个参数为jQuery.Event实例
    args[0] = event;
    event.delegateTarget = this;//添加一个人为属性，用于事件代理
    //执行preDispatch回调,它与后面的postDispatch构成一种类似AOP的机制
    if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
        return;
    }
　　
    //如果是事件代理，并且不是来自于非左键的点击事件
    if ( delegateCount && !(event.button && event.type === "click") ) {
        //从事件源开始，遍历其所有祖先一直到绑定事件的元素
        for ( cur = event.target; cur != this; cur = cur.parentNode || this ) {
            //一要触发被disabled的元素的点击事件
            if ( cur.disabled !== true || event.type !== "click" ) {
                selMatch = {};//为了节能起见，每种CSS表达式只判定一次，通过下面的
                //jQuery( sel, this ).index( cur ) >= 0或 jQuery.find( sel, this, null, [ cur ] ).length
                matches = [];//用于收集符合条件的事件描述对象
                //使用事件代理的事件描述对象总是排在前面
                for ( i = 0; i < delegateCount; i++ ) {
                    handleObj = handlers[ i ];
                    sel = handleObj.selector;
　　
                    if ( selMatch[ sel ] === undefined ) {
                        //有多少个元素匹配就收集多少个事件描述对象
                        selMatch[ sel ] = handleObj.needsContext ?
                            jQuery( sel, this ).index( cur ) >= 0 :
                            jQuery.find( sel, this, null, [ cur ] ).length;
                    }
                    if ( selMatch[ sel ] ) {
                        matches.push( handleObj );
                    }
                }
                if ( matches.length ) {
                    handlerQueue.push({ elem: cur, matches: matches });
                }
            }
        }
    }
　　
    //取得其他直接绑定的事件描述对象
    if ( handlers.length > delegateCount ) {
        handlerQueue.push({ elem: this, matches: handlers.slice( delegateCount ) });
    }
　　
    //执行所有回调,除非用户调用了stopPropagation方法,它会导致isPropagationStopped返回true,从而中断循环
    //这个循环是从下到上的
    for ( i = 0; i < handlerQueue.length && !event.isPropagationStopped(); i++ ){
        matched = handlerQueue[ i ];
        event.currentTarget = matched.elem;
        //执行此元素的所有与event.type同类型的回调,除非用户调用了stopImmediatePropagation方法,
        //它会导致isImmediatePropagationStopped返回true,从而中断循环
        for (j = 0; j < matched.matches.length
            &&  !event.isImmediatePropagationStopped(); j++ ) {
            handleObj = matched.matches[ j ];
            //最后的过滤条件为事件命名空间,比如著名的bootstrap的命名空间为data-api
            if ( run_all || (!event.namespace && !handleObj.namespace) || event.namespace_re && event.namespace_re.test( handleObj.namespace ) ) {
                event.data = handleObj.data;
                event.handleObj = handleObj;
                //执行用户回调(有时可能还要外包一层,来自jQuery.event.special[type].handle)
                ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
                .apply( matched.elem, args );
                //根据结果判定是否阻止事件传播与默认行为
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
    //执行postDispatch回调
    if ( special.postDispatch ) {
        special.postDispatch.call( this, event );
    }
　　
    return event.result;
},

trigger: function( event, data, elem, onlyHandlers ) {
    // 必须要指定派发事件的对象，不能是文本节点与元素节点
    if ( elem && (elem.nodeType === 3 || elem.nodeType === 8) ) {
        return;
    }

    // Event object or event type
    var cache, exclusive, i, cur, old, ontype, special, handle, eventPath, bubbleType,
    type = event.type || event,
    namespaces = [];

    // focus/blur morphs to focusin/out; ensure we're not firing them right now
    if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
        return;
    }

    if ( type.indexOf( "!" ) >= 0 ) {
        // Exclusive events trigger only for the exact event (no namespaces)
        type = type.slice(0, -1);
        exclusive = true;
    }
    //如果事件类型带点号就分解出命名空间
    if ( type.indexOf( "." ) >= 0 ) {
        namespaces = type.split(".");
        type = namespaces.shift();
        namespaces.sort();
    }
    //customEvent与global是用于优化，既然从来没有绑定过这种事件，就不用继续往下打酱油了！
    if ( (!elem || jQuery.event.customEvent[ type ]) && !jQuery.event.global[ type ] ) {
        return;
    }
    //将用户传入的第一个参数都转换为jQuery.Event实例
    event = typeof event === "object" ?
        //如果是jQuery.Event实例
    event[ jQuery.expando ] ? event :
        //如果是原生事件对象
    new jQuery.Event( type, event ) :
        //如果是事件类型
    new jQuery.Event( type );

    event.type = type;
    event.isTrigger = true;
    event.exclusive = exclusive;
    event.namespace = namespaces.join( "." );
    event.namespace_re = event.namespace? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
    ontype = type.indexOf( ":" ) < 0 ? "on" + type : "";

    // Handle a global trigger
    //如果没有指明触发者，只有将整个缓存系统翻得底朝天了
    if ( !elem ) {
        // TODO: Stop taunting the data cache; remove global events and always attach to document
        cache = jQuery.cache;
        for ( i in cache ) {
            if ( cache[ i ].events && cache[ i ].events[ type ] ) {
                jQuery.event.trigger( event, data, cache[ i ].handle.elem, true );
            }
        }
        return;
    }
    //清掉result，方便重复使用
    event.result = undefined;
    if ( !event.target ) {
        event.target = elem;//但事件源是保证是一变的
    }
    //data是用于放置派发事件时的额外参数，为了方便apply必须整成数组，并把event放在第一位
    data = data != null ? jQuery.makeArray( data ) : [];
    data.unshift( event );
    //如果此事件类型指定了它的trigger方法就使用它的
    special = jQuery.event.special[ type ] || {};
    if ( special.trigger && special.trigger.apply( elem, data ) === false ) {
        return;
    }

    //预先决定冒泡的路径，一直冒泡到window
    eventPath = [[ elem, special.bindType || type ]];
    if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

        bubbleType = special.delegateType || type;
        cur = rfocusMorph.test( bubbleType + type ) ? elem : elem.parentNode;
        for ( old = elem; cur; cur = cur.parentNode ) {
            eventPath.push([ cur, bubbleType ]);
            old = cur;
        }
        if ( old === (elem.ownerDocument || document) ) {
            eventPath.push([ old.defaultView || old.parentWindow || window, bubbleType ]);
        }
    }

    //沿着规划好的路径把经过的元素节点的指定事件类型的回调逐一触发。
    for ( i = 0; i < eventPath.length && !event.isPropagationStopped(); i++ ) {

        cur = eventPath[i][0];
        event.type = eventPath[i][1];

        handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
        //handle其实就是调用dispatch函数，因此trigger是把整个冒泡过程都人工实现
        if ( handle ) {
            handle.apply( cur, data );
        }
        //处理以onXXX绑定的回调，无论是写在HTML标签内还是以无侵入方式
        handle = ontype && cur[ ontype ];
        if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
            event.preventDefault();//如果返回true就中断循环
        }
    }
    event.type = type;
    //如果用户没有调用preventDefault或return false，就模拟默认行为，
    //具体是指执行submit, blur, focus, select, reset, scroll等方法
    //不过其实它并没有模拟所有默认行为，
    //比如点击链接时会跳转
    //又比如点击复选框单选框，元素的checked会改变
    if ( !onlyHandlers && !event.isDefaultPrevented() ) {
        //如果用户指定了默认行为，则只执行它的默认行为，并跳过链接的点击事件
        if ( (!special._default || special._default.apply( elem.ownerDocument, data ) === false) &&
            !(type === "click" && jQuery.nodeName( elem, "a" )) && jQuery.acceptData( elem ) ) {
            //如果元素同时存在el["on"+type]回调与el[type]方法，则表示它有默认行为
            //对于el[type]属性的检测，jQuery不使用isFunction方法，因为它的typeof在IE6-8返回object
            //jQuery也不打算触发隐藏元素的focus或blur默认行为，IE6-8下会抛
            //“由于该控件目前不可见、未启用或其类型不允许，因此无法将焦点移向它”错误
            //jQuery也不打算触发window的默认行为，防止触发了window.scroll方法，
            //scroll()方法在IE与标准浏览器存在差异，IE会默认scroll()为scroll(0,0)
            if ( ontype && elem[ type ] && ((type !== "focus" && type !== "blur") ||
                event.target.offsetWidth !== 0) && !jQuery.isWindow( elem ) ) {

                // onXXX回调已经在$.event.dispatch方法执行过了，不用再次触发
                old = elem[ ontype ];

                if ( old ) {
                    elem[ ontype ] = null;
                }
                //标识正在触发此事件类型，防止下面elem[type]()重复执行dispatch
                jQuery.event.triggered = type;
                elem[ type ]();//执行默认行为
                jQuery.event.triggered = undefined;//还原
                if ( old ) {//还原
                    elem[ ontype ] = old;
                }
            }
        }
    }
    //与dispatch一样，返回event.result
    return event.result;
},
//https://github.com/fat/bean/blob/master/bean.js


trigger: function( type, target ){
    var doc = target.ownerDocument || target.document || target || document;
    event = doc.createEvent(eventMap[type] || "CustomEvent");
    if(/^(focus|blur|select|submit|reset)$/.test(type)){
        target[type] && target[type]();//触发默认行为
    }
    event.initEvent( type, true,true, doc.defaultView,1);
    target.dispatchEvent(event);
}
if ( event.pageX == null && original.clientX != null ) {
    eventDoc = event.target.ownerDocument || document;
    doc = eventDoc.documentElement;
    body = eventDoc.body;

    event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 )
        - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
    event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 )
        - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
}


var wheel = function(obj,callback){
    var wheelType = "mousewheel"
    try{
        document.createEvent("MouseScrollEvents")
        wheelType = "DOMMouseScroll"
    }catch(e){}
    addEvent(obj, wheelType,function(event){
        if ("wheelDelta" in real){//统一为±120，其中正数表示为向上滚动，负数表示向下滚动
            var delta = real.wheelDelta
            //opera 9x系列的滚动方向与IE保持一致，10后修正
            if( window.opera && opera.version() < 10 )
                delta = -delta;
            event.wheelDelta = Math.round(delta); //修正safari的浮点 bug
        }else if( "detail" in real ){
            event.wheelDelta = -real.detail * 40;//修正FF的detail 为更大众化的wheelDelta
        }
        //由于事件对象的原有属性是只读，我们只能通过添加一个私有属性delta来解决兼容问题
        event.delta =  Math.round(delta); //修正safari的浮点 bug
        callback.call(obj,event);//修正IE的this指向
    });
}

if( !+"\v1" || eventSupport("mouseenter")){//IE678不能实现捕获与safari chrome不支持
    jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
    }, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
            delegateType: fix,//事件冒充用，用于绑定时
            bindType: fix,

            handle: function( event ) {//用于执行时最包一层，这时event已经打补丁了
                var ret,target = this, handleObj = event.handleObj
                //mouseover时相当于IE的formElement，mouseout时相当于IE的toElement
                related = event.relatedTarget
                //判定要进入的节点与绑定的节点不存在包含关系并且不相等才调用函数
                if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
                    event.type = handleObj.origType;
                    ret = handleObj.handler.apply( this, arguments );
                    event.type = fix;
                }
                return ret;
            }
	};
    });
}
if ( !jQuery.support.focusinBubbles ) {
    jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {
        //只绑定一次focusin与focusout，通过document进行监听，
        //然后捕获事件源，进行人工冒泡
        var attaches = 0,
        handler = function( event ) {
            jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
        };
        jQuery.event.special[ fix ] = {
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

var adapter = facade.eventAdapter;
//submit事件的冒泡情况----IE6-9 :form ;FF: document; chrome: window;safari:window;opera:window
//同reset事件的冒泡情况----FF与opera能冒泡到document,其他浏览器只能到form
"submit,reset".replace( $.rword, function( type ){
    adapter[ type ] = {
        setup: delegate(function( node ){
            $(node).bind( "click._"+type+" keypress._"+type, function( event ) {
                var el = event.target;
                if( el.form && (adapter[ type ].keyCode[ event.which ] || adapter[ type ].input[  el.type ] ) ){
                    facade._dispatch( [ node ], event, type );
                }
            });
        }),
        keyCode: $.oneObject(type == "submit" ? "13,108" : "27"),
        input:  $.oneObject(type == "submit" ? "submit,image" : "reset"),
        teardown: delegate(function( node ){
            $( node ).unbind( "._"+type );
        })
    };
});
var cssMap ={}
var $ = {
    css: function(el, name,value){},
    cssName: function(name, el){},
    cssNumber:{},
    cssAdapter:{
        "_default:set":function(){},
        "_default:get":function(){}
    }
}
$.fn = {
    css: function(name,value){},
    width: function(val){},
    height: function(val){},
    innerWidth: function(){},
    innerHeight: function(){},
    outerWidth: function(margin){},
    outerHeight: function(margin){},
    offset: function(obj){},
    position: function(){},
    scrollTop: function(val){},
    scrollLeft: function(val){},
    offsetParent: function(){},
    scrollParent: function(){}
}
adapter[ "zIndex:get" ] = function( node, name, value, position ) {
    while ( node.nodeType !== 9 ) {
        //即使元素定位了，但如果zindex设置为"aaa"这样的无效值，浏览器都会返回auto;
        //如果没有指定zindex值，IE会返回数字0，其他返回auto
        position = getter(node, "position" );//getter = adapter[ "_default:get" ]
        if ( position === "absolute" || position === "relative" || position === "fixed" ) {
            // <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
            value = parseInt( getter(node,"zIndex"), 10 );
            if ( !isNaN( value ) && value !== 0 ) {
                return value;
            }
        }
        node = node.parentNode;
    }
    return 0;
}

