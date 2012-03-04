//http://davidwalsh.name/snackjs
//http://microjs.com/
//http://westcoastlogic.com/lawnchair/
//https://github.com/madrobby/emile
//http://www.bobbyvandersluis.com/articles/clientside_scripting/
//==========================================
//  事件模块（包括伪事件对象，事件绑定与事件代理）
//==========================================
$.define("event", "node,target",function(){
    // $.log("加载event模块成功");
    var types = "contextmenu,click,dblclick,mouseout,mouseover,mouseenter,mouseleave,mousemove,mousedown,mouseup,mousewheel," +
    "abort,error,load,unload,resize,scroll,change,input,select,reset,submit,input,"+"blur,focus,focusin,focusout,"+"keypress,keydown,keyup";
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

    var facade = $.event,
    rform  = /^(?:textarea|input|select)$/i ,
    adapter = $.eventAdapter = {
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
    };

    function fixAndDispatch( src, type, e ){
        e = facade.fix( e );
        e.type = type;
        for(var i in src){
            if(src.hasOwnProperty(i)){
                facade.dispatch.call( src[ i ], e );
            }
        }
    }

    if(!$.eventSupport("input", document.createElement("input"))){
           adapter.input = {
            check: function(src){
                return rform.test(src.tagName) && !/^select/.test(src.type);
            },
            bindType: "change",
            delegateType: "change"
        }
    }
    //用于在标准浏览器下模拟mouseenter与mouseleave
    //现在除了IE系列支持mouseenter/mouseleave/focusin/focusout外
    //opera11,FF10也支持这四个事件,同时它们也成为w3c DOM3 Event的规范
    //详见http://www.filehippo.com/pl/download_opera/changelog/9476/
    //http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html
    if( !+"\v1" || !$.eventSupport("mouseenter")){
        "mouseenter_mouseover,mouseleave_mouseout".replace(/(\w+)_(\w+)/g, function(_,orig, fix){
            adapter[ orig ]  = {
                setup: function( src ){//使用事件冒充
                    $._data( src, orig+"_handle", $.bind( src, fix, function( e ){
                        var parent = e.relatedTarget;
                        try {
                            while ( parent && parent !== src ) {
                                parent = parent.parentNode;
                            }
                            if ( parent !== src ) {
                                fixAndDispatch( [ src ], orig, e );
                            }
                        } catch(err) { };
                    }));
                },
                teardown: function(){
                    $.unbind( this, fix, $._data( orig+"_handle" ) );
                }
            };
        });
    }

    var delegate = function( fn ){
        return function(src,selector, type){
            var fix = !adapter[type] || !adapter[type].check || adapter[type].check(src);
            if( fix || selector ){
                fn(src, type, fix);
            }else{
                return false;
            }
        }
    }

    if( !document.dispatchEvent ){
        //模拟IE678的reset,submit,change的事件代理
        var 
        submitWhich = $.oneObject("13,108"),
        submitInput = $.oneObject("submit,image"),
        submitType  = $.oneObject("text,password,textarea"),

        changeType = {
            "select-one": "selectedIndex",
            "select-multiple": "selectedIndex",
            "radio": "checked",
            "checkbox": "checked"
        }
        function changeNotify( e ){
            if( e.propertyName === ( changeType[ this.type ] || "value") ){
                $._data( this, "_just_changed", true );
                fixAndDispatch( $._data( this, "publisher" ), "change", e );
            }
        }
        function changeFire( e ){
            var el = this;
            if( !$._data( el,"_just_changed" ) ){
                fixAndDispatch( $._data( el ,"publisher"), "change", e );
            }else{
                $.removeData( el, "_just_changed", true );
            }
        }
        $.mix( adapter, {
            //reset事件的冒泡情况----FF与opera能冒泡到document,其他浏览器只能到form
            reset: {
                setup: delegate(function( src ){
                    facade.bind.call( src, "click._reset keypress._reset", function( e ) {
                        if(  e.target.form && (e.which === 27  ||  e.target.type == "reset") ){
                            fixAndDispatch( [ src ], "reset", e );
                        }
                    });
                }),
                teardown: delegate(function( src ){
                    facade.unbind.call( src, "._reset" );
                })
            },
            //submit事件的冒泡情况----IE6-9 :form ;FF: document; chrome: window;safari:window;opera:window
            submit: {
                setup: delegate(function( src ){
                    facade.bind.call( src, "click._submit keypress._submit", function( e ) {
                        var el = e.target, type = el.type;
                        if( el.form &&  ( submitInput[type] || submitWhich[ e.which ] && submitType[type]) ){
                            fixAndDispatch( [ src ], "submit", e );
                        }
                    });
                }),
                teardown: delegate(function( src ){
                    facade.unbind.call( src, "._submit" );
                })
            },
            change: {
                check: function(src){
                    return rform.test(src.tagName) && /radio|checkbox/.test(src.type)
                },
                setup: delegate(function( src, type, fix ){
                    var subscriber = $._data( src, "subscriber", {} );//用于保存订阅者的UUID
                    $._data( src, "_beforeactivate", $.bind( src, "beforeactivate", function() {
                        var e = src.document.parentWindow.event, target = e.srcElement;
                        //如果发现孩子是表单元素并且没有注册propertychange事件，则为其注册一个，那么它们在变化时就会发过来通知顶层元素
                        if ( rform.test( target.tagName) && !subscriber[ target.uniqueNumber ] ) {
                            subscriber[ target.uniqueNumber] = target;//表明其已注册
                            var publisher = $._data( target,"publisher") || $._data( target,"publisher",{} );
                            publisher[ src.uniqueNumber] = src;//此孩子可能同时要向N个顶层元素报告变化
                            facade.bind.call( target,"propertychange._change", changeNotify );
                            //允许change事件可以通过fireEvent("onchange")触发
                            if(type === "change"){
                                $._data(src, "_change_fire",$.bind(target, "change", changeFire.bind(target, e) ))
                            }
                        }
                    }));
                    if( fix ){//如果是事件绑定
                        src.fireEvent("onbeforeactivate")
                    }
                }),
                teardown: delegate(function( src, els, i ){
                    $.unbind( src, "beforeactive", $._data( src, "_beforeactivate") );
                    $.unbind( src, "change", $._data(src, "_change_fire")  );
                    els = $.removeData( src, "subscriber", true ) || {};
                    for( i in els){
                        $.unbind( els[i],"._change" );
                        var publisher = $._data( els[i], "publisher");
                        if(publisher){
                            delete publisher[ src.uniqueNumber ];
                        }
                    }
                })
            }
        });
    }



    //在标准浏览器里面模拟focusin
    if( !$.eventSupport("focusin") ){
        "focusin_focus,focusout_blur".replace( /(\w+)_(\w+)/g, function(_,$1, $2){
            var notice = 0, focusinNotify = function (e) {
                var src = e.target
                do{//模拟冒泡
                    var events = $._data( src,"events");
                    if(events && events[$1]){
                        fixAndDispatch( [ src ], $1, e );
                    }
                } while (src = src.parentNode );
            }
            adapter[ $1 ] = {
                setup: function( ) {
                    if ( notice++ === 0 ) {
                        document.addEventListener( $2, focusinNotify, true );
                    }
                },
                teardown: function() {
                    if ( --notice === 0 ) {
                        document.removeEventListener( $2, focusinNotify, true );
                    }
                }
            };
        });
    }
    try{
        //FF3使用DOMMouseScroll代替标准的mousewheel事件
        document.createEvent("MouseScrollEvents");
        adapter.mousewheel = {
            bindType    : "DOMMouseScroll",
            delegateType: "DOMMouseScroll"
        }
        try{
            //可能末来FF会支持标准的mousewheel事件，则需要删除此分支
            document.createEvent("WheelEvent");
            delete adapter.mousewheel;
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
        on: function( types, fn, selector, times ) {
            if ( typeof types === "object" ) {
                for (var type in types ) {
                    this.on( type,  types[ type ], selector, times );
                }
                return this;
            }
            if(!types || !fn){//必须指定事件类型与回调
                return this;
            }
            return this.each( function() {//转交dispatch模块去处理
                facade.bind.call( this, types, fn, selector, times );
            });
        },
        off: function( types, fn ) {
            if ( typeof types === "object" ) {
                for ( var type in types ) {
                    this.off( type,types[ type ], fn  );
                }
                return this;
            }
            var args = arguments
            return this.each(function() {
                facade.unbind.apply( this, args );
            });
        },
        one: function( types, fn ) {
            return this.on(  types, fn, null, 1 );
        },
        bind: function( types, fn, times ) {
            return this.on( types, fn, times );
        },
        unbind: function( types, fn ) {
            return this.off( types, fn );
        },

        live: function( types,  fn, times ) {
            $( this.ownerDocument ).on( types, fn, this.selector,times );
            return this;
        },
        die: function( types, fn ) {
            $( this.ownerDocument ).off( types, fn, this.selector || "**" );
            return this;
        },
        undelegate: function( selector, types, fn ) {
            return arguments.length == 1? this.off( selector, "**" ) : this.off( types, fn, selector );
        },

        delegate: function( selector, types, fn, times ) {
            if(typeof selector === "string"){
                selector = quickParse( selector ) || selector;
            }
            return this.on( types, fn, selector, times );
        },
        fire: function(  ) {
            var args = arguments;
            return this.each(function() {
                $.event.fire.apply(this, args );
            });
        }
    })

    types.replace( $.rword, function( type ){
        $.fn[ type ] = function( callback ){
            return callback?  this.bind( type, callback ) : this.fire( type );
        }
    });
});
//2011.10.14 强化delegate 让快捷方法等支持fire 修复delegate BUG
//2011.10.21 修复focusin focsuout的事件代理 增加fixAndDispatch处理事件冒充
//2011.11.23 简化rquickIs
//2012.2.7 重构change，允许change事件可以通过fireEvent("onchange")触发
//2012.2.8 添加mouseenter的分支判定，增强eventSupport
//2012.2.9 完美支持valuechange事件
//1. 各浏览器兼容                  2. this指针指向兼容                  3. event参数传递兼容. 







