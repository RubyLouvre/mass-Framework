$.define("event", "node" ,function(){
    $.log("已加载event2模块")
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
            aaa: {
                bindType: "eee"
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
            event.type = hash.origType;
            var detail = firing["@"+event.type] || {},
            selector = hash.selector,
            scope = hash.scope,
            src = event.target;
            if ( !src.disabled && !(event.button && event.type === "click")//fire
                && (!selector  || facade.filter(src, this, selector))//selector
                && (!detail.rns || detail.rns.test( hash.namespace ) ) ) {//fire
                var ret = hash.callback.apply( selector ? src :scope, [event].concat(detail.args || []))
                if (ret === false){
                    event.preventDefault();
                    event.stopPropagation();
                }
                hash.times--;//处理执行次数
                if(hash.times === 0){
                    facade.unbind.call( hash.scope, hash)
                }
                return ret;
            }
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
            namespace: ns,
            rns: ns ? new RegExp("(^|\\.)" + ns.replace(' ', ' .* ?') + "(\\.|$)") : null
        }
    }
    //收集要移除的回调
    function findHandlers(hash, selector, fn, events) {
        return events.filter(function(item) {
            return item && (!hash.type  || hash.type === item.type) //通过事件类型进行过滤
            && (!hash.rns  || hash.rns.test(item.namespace)) //通过命名空间进行进行过滤
            && (!fn        || fn.uuid === item.uuid)//通过uuid进行过滤
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
    $.mix(facade,{
        filter: function( cur, parent, expr ){
            var matcher = expr.input ? quickIs : $.match
            for ( ; cur != parent; cur = cur.parentNode || parent ) {
                if(matcher(cur, expr))
                    return true
            }
            return false;
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
                    scope: target,//如果是自定义事件,使用window来代理
                    target: !DOM ? window : target,
                    index: events.length
                }, hash, false);
                events.push( item );//用于事件拷贝
                events["@"+type] = ( events["@"+type] | 0 )+ 1;
                item.proxy = wrapper( item );
                item.target.addEventListener(type, item.proxy, !!selector )
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
                    $.log(item)
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
    $.fn.fire = function() {
        var args = arguments;
        if(this.mass && this.each){
            return this.each(function() {
                $.event.fire.apply(this, args );
            });
        }else{
            return $.event.fire.apply(this, args );
        }
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
                    hash.times = el;
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
    $.fn.delegate = function( selector, types, fn, times ) {
        return this.on( types, selector, fn, times);
    }

});