//==================================================
// 事件发送器模块
//==================================================
  
dom.define("dispatcher","data", function(){
    // dom.log("已加载dispatcher模块")
    var global = this, DOC = global.document, fireType = "", blank = "", rhoverHack = /(?:^|\s)hover(\.\S+)?\b/,
    rtypenamespace = /^([^\.]*)?(?:\.(.+))?$/, revent = /(^|_|:)([a-z])/g;
    function addHandler(handlers, obj){
        var check = true, fn = obj.handler;
        for(var i = 0, el;el = handlers[i++]; ){
            if(el.handler === fn){
                check = false;
                break;
            }
        }
        if(check){
            handlers.push(obj);
        }
    }
    function quickIs( elem, m ) {
        var attrs = elem.attributes || {};
        return (
            (!m[1] || elem.nodeName.toLowerCase() === m[1]) &&
            (!m[2] || (attrs.id || {}).value === m[2]) &&
            (!m[3] || m[3].test( (attrs[ "class" ] || {}).value ))
            );
    };
    var system = dom.event = {
        special:{},//用于处理个别的DOM事件
        bind : function( types, handler, selector, times){
            //它将在原生事件派发器或任何能成为事件派发器的普通JS对象添加一个名叫uniqueNumber的属性,用于关联一个缓存体,
            //把需要的数据储存到里面,而现在我们就把一个叫@events的对象储放都它里面,
            //而这个@event的表将用来放置各种事件类型与对应的回调函数
            var target = this, events = dom._data( target) ,emitter =  dom["@target"] in target,
            num = times || selector, all, tns ,type, namespace, special, handlerObj, handlers, fn;
            if(target.nodeType === 3 || target.nodeType === 8 || !types ||  !handler  || !events) return ;
            selector = selector && selector.length ? selector : false;
            var uuid =  handler.uuid || (handler.uuid = dom.uuid++);
            all = {
                handler:handler,
                uuid: uuid,
                times:num > 0 ? num : Infinity
            } //确保UUID，bag与callback的UUID一致
            all.handler.uuid = all.uuid;
            if(emitter ){ //处理DOM事件
                fn = events.handle ||  (events.handle = function( e ) {
                    return ((e || event).type !== fireType) ? system.handle.apply( fn.target, arguments ) :void 0;
                });
                fn.target = target;
                types = types.replace( rhoverHack, "mouseover$1 mouseout$1" )
            }
            events = events.events || (events.events = {});
            //对多个事件进行绑定
            types.replace(dom.rword,function(type){
                tns = rtypenamespace.exec( type ) || [];
                type = tns[1];//取得事件类型
                namespace = (tns[2] || blank).split( "." ).sort();//取得命名空间
                //事件冒充只用于原生事件发送器
                special = emitter && system.special[ type ] || {};
                type = (selector? special.delegateType : special.bindType ) || type;
                special = emitter && system.special[ type ] || {};
                handlerObj = dom.mix({
                    type: type,
                    origType: tns[1],
                    selector: selector,
                    namespace: namespace.join(".")
                }, all);
                //创建事件队列
                handlers = events[ type ] = events[ type ] ||  [];
                //只有原生事件发送器才能进行DOM level2 多投事件绑定
                if(emitter && !handlers.length  ){
                    if (!special.setup || special.setup( target, selector, fn ) === false ) {
                        // 为此元素这种事件类型绑定一个全局的回调，用户的回调则在此回调中执行
                        dom.bind(target,type,fn,!!selector)
                    }
                }
                addHandler(handlers,handlerObj);//同一事件不能绑定重复回调
            });
        },

        unbind: function( types, handler, selector ) {
            var target = this, events = dom._data( target,"events");
            if(!events) return;
            var t, tns, type, namespace, origCount,emitter =  dom["@target"] in target,
            j, special, handlers, handlerObj;
            types = emitter ? (types || blank).replace( rhoverHack, "mouseover$1 mouseout$1" ) : types;
            types = (types || blank).match(dom.rword) || [];
            for ( t = 0; t < types.length; t++ ) {
                tns = rtypenamespace.exec( types[t] ) || [];
                type = tns[1];
                namespace = tns[2];
                // 如果types只包含命名空间，则去掉所有拥有此命名空间的事件类型的回调
                if ( !type  ) {
                    namespace = namespace? "." + namespace : "";
                    for ( j in events ) {
                        system.unbind.call( target, j + namespace, handler, selector );
                    }
                    return;
                }
                //如果使用事件冒充则找到其正确事件类型
                special = system.special[ type ] || {};
                type = (selector? special.delegateType : special.bindType ) || type;
                handlers = events[ type ] || [];
                origCount = handlers.length;
                namespace = namespace ? new RegExp("(^|\\.)" + namespace.split(".").sort().join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
                //  namespace =  namespace?  namespace.split( "." ).sort().join(".") : null;
                //只有指定了命名空间，回调或选择器才能进入此分支
                if ( handler || namespace || selector ) {
                    for ( j = 0; j < handlers.length; j++ ) {
                        handlerObj = handlers[ j ];
                        if ( !handler || handler.uuid === handlerObj.uuid ) {
                            // && (!event.namespace || ~obj.namespace.indexOf(event.namespace) ) ) {
                            if ( !namespace ||  namespace.test( handlerObj.namespace )  ) {
                                if ( !selector || selector === handlerObj.selector || selector === "**" && handlerObj.selector ) {
                                    handlers.splice( j--, 1 );
                                }
                            }
                        }
                    }
                } else {
                    //移除此类事件的所有回调
                    handlers.length = 0;
                }
                if (emitter && (handlers.length === 0 && origCount !== handlers.length) ) {
                    if ( !special.teardown || special.teardown( target, selector, handler ) === false ) {
                        dom.unbind( target, type, dom._data(target,"handle") );
                    }
                    delete events[ type ];
                }
            }
            if(dom.isEmptyObject(events)){
                var handle = dom.removeData( target,"handle") ;
                handle.target = null;
                dom.removeData( target,"events") ;
            }
        },

        fire:function(event){
            var target = this, namespace = [], type = event.type || event
            if ( ~type.indexOf( "." ) ) {
                namespace = type.split(".");
                type = namespace.shift();
                namespace.sort();
            }
            event = (typeof event == "object" && "namespace" in event)? type : new jEvent(type);
            event.target = target;
            event.namespace = namespace.join( "." );
            event.namespace_re = event.namespace? new RegExp("(^|\\.)" + namespace.join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
            var args = [event].concat(dom.slice(arguments,1));
            if( dom["@target"] in target){
                var cur = target,  ontype = "on" + type;
                do{//模拟事件冒泡与执行内联事件
                    if(dom._data(cur,"events")||{}
                        [type]){
                        system.handle.apply(cur, args);
                    }
                    if (cur[ ontype ] && cur[ ontype ].call(cur) === false) {
                        event.preventDefault();
                    }
                    cur = cur.parentNode ||
                    cur.ownerDocument ||
                    cur === target.ownerDocument && global;
                } while (cur && !event.isPropagationStopped);
                if (!event.isDefaultPrevented) {//模拟默认行为 click() submit() reset() focus() blur()
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
                    if (old) {
                        target[ ontype ] = old;
                    }
                }

            }else{//普通对象的自定义事件
                system.handle.apply(target, args);
            }
        },
        filter:function(cur, parent, expr){
            var matcher = typeof expr === "function"? expr : expr.input ? quickIs : dom.match
            for ( ; cur != parent; cur = cur.parentNode || parent ) {
                if(matcher(cur, expr))
                    return true
            }
            return false;
        },
        handle: function( e ) {
            var win = (this.ownerDocument || this.document || this).parentWindow || window,
            event = system.fix( e || win.event ),
            handlers = dom._data(this,"events");
            if (  handlers ) {
                handlers = handlers[event.type]||[]
                event.currentTarget = this;
                var src = event.target,args = [event].concat(dom.slice(arguments,1)), result;
                //复制数组以防影响下一次的操作
                handlers = handlers.concat();
                //开始进行拆包操作
                //  dom.log(event.namespace)
                for ( var i = 0, obj; obj = handlers[i++]; ) {
                    //如果是事件代理，确保元素处于enabled状态，并且满足过滤条件
                    if ( !src.disabled && !(event.button && event.type === "click")
                        && (!obj.selector  || system.filter(src, this, obj.selector))
                        && (!event.namespace || event.namespace_re.test( obj.namespace ) ) ) {
                        //取得回调函数
                        event.type = obj.origType;
                        result = obj.handler.apply( obj.selector ? src : this, args );
                        obj.times--;
                        if(obj.times === 0){
                            system.unbind.call(this,event.type,obj.handler,obj.selector);
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

        fix :function(event){
            if(!("namespace" in event)){
                var originalEvent = event
                event = new jEvent(originalEvent);
                for(var prop in originalEvent){
                    //去掉所有方法与常量
                    if(typeof originalEvent[prop] !== "function" && prop !== "type"){
                        if(/^[A-Z_]+$/.test(prop))
                            continue
                        event[prop] = originalEvent[prop]
                    }
                }
                //如果不存在target属性，为它添加一个
                if ( !event.target ) {
                    event.target = event.srcElement || DOC;
                }
                //safari的事件源对象可能为文本节点，应代入其父节点
                if ( event.target.nodeType === 3 ) {
                    event.target = event.target.parentNode;
                }
                // 处理鼠标事件
                if(/^(?:mouse|contextmenu)|click/.test(event.type)){
                    //如果不存在pageX/Y则结合clientX/Y做一双出来
                    if ( event.pageX == null && event.clientX != null ) {
                        var doc = event.target.ownerDocument || DOC,
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
                if ("wheelDelta" in originalEvent){
                    var delta = originalEvent.wheelDelta/120;
                    //opera 9x系列的滚动方向与IE保持一致，10后修正
                    if(global.opera && global.opera.version() < 10)
                        delta = -delta;
                    event.wheelDelta = Math.round(delta); //修正safari的浮点 bug
                }else if("detail" in originalEvent){
                    event.wheelDelta = -event.detail/3;
                }
                // 处理组合键
                if ( event.metaKey === void 0 ) {
                    event.metaKey = event.ctrlKey;
                }
            }
            return event;
        }
    }
    
    var jEvent = dom.Event = function ( event ) {
        this.originalEvent = event.substr ? {} : event;
        this.type = event.type || event;
        this.timeStamp  = Date.now();
        this.namespace = "";//用于判定是否为伪事件对象
    };
    // http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
    jEvent.prototype = {
        constructor:jEvent,
        //http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/events.html#Conformance
        toString:function(){
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
    //事件派发器的接口
    //实现了这些接口的对象将具有注册事件和广播事件的功能
    dom.dispatcher = {};
    "bind,unbind,fire".replace(dom.rword,function(name){
        dom.dispatcher[name] = function(){
            system[name].apply(this, arguments);
            return this;
        }
    });
    dom.dispatcher.uniqueNumber = dom.uuid++;
    dom.dispatcher.defineEvents = function(names){
        var events = [];
        if(typeof names == "string"){
            events = names.match(dom.rword);
        }else if(dom.isArray(names)){
            events = names;
        }
        events.forEach(function(name){
            var method = 'on'+name.replace(revent,function($, $1, $2) {
                return $2.toUpperCase();
            });
            if (!(method in this)) {
                this[method] = function() {
                    return this.bind.apply(this, [].concat.apply([name],arguments));
                };
            }
        },this);
    }
    
});

    //2011.8.14 更改隐藏namespace,让自定义对象的回调函数也有事件对象
    //2011.9.17 事件发送器增加一个uniqueID属性
    //2011.9.21 重构bind与unbind方法 支持命名空间与多事件处理
    //2011.9.27 uniqueID改为uniqueNumber 使用dom._data存取数据
    //2011.9.29 简化bind与unbind
    //2011.10.13 模块名改为dispatcher
    //2011.10.23 简化system.handle与fire
    //2011.10.26 更改命名空间的检测方法
    //2011.11.23 重构system.fix与quickIs
    //2011.12.20 修正在当前窗口为子窗口元素绑定错误时，在IE678下，事件对象错误的问题
    //2011.12.20 修正rhoverHack正则，现在hover可以作为命名空间了



