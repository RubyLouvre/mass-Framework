//http://davidwalsh.name/snackjs
//http://microjs.com/
//http://westcoastlogic.com/lawnchair/
//https://github.com/madrobby/emile
//http://www.bobbyvandersluis.com/articles/clientside_scripting/
//==========================================
//  事件模块（包括伪事件对象，事件绑定与事件代理）
//==========================================
   
dom.define("event", "node,target",function(){
    // dom.log("加载event模块成功");
    var global = this, DOC = global.document, types = "contextmenu,click,dblclick,mouseout,mouseover,mouseenter,mouseleave,mousemove,mousedown,mouseup,mousewheel," +
    "abort,error,load,unload,resize,scroll,change,input,select,reset,submit,"+"blur,focus,focusin,focusout,"+"keypress,keydown,keyup";
    dom.eventSupport = function( eventName,el ) {
        el = el || DOC.createElement("div");
        eventName = "on" + eventName;
        var ret = eventName in el;
        if (el.setAttribute && !ret ) {
            el.setAttribute(eventName, "return;");
            ret = typeof el[eventName] === "function";
        }
        el = null;
        return ret;
    };

    var system = dom.event, specials = system.special = {
        focus: {
            delegateType: "focusin"
        },
        blur: {
            delegateType: "focusout"
        },

        beforeunload: {
            setup: function(src, selector, fn ) {
                // We only want to do this special case on windows
                if ( dom.type(src, "Window") ) {
                    src.onbeforeunload = fn;
                }
            },
            teardown: function( src, selector,  fn ) {
                if ( src.onbeforeunload === fn ) {
                    src.onbeforeunload = null;
                }
            }
        }
    }, rword = dom.rword;
    function fixAndHandle(src, type, e){
        e = system.fix(e);
        e.type = type;
        system.handle.call(src,e);
    }
    //用于在标准浏览器下模拟mouseenter与mouseleave
    //现在除了IE系列支持mouseenter/mouseleave/focusin/focusout外
    //opera11也支持这四个事件,同时它们也成为w3c DOM3 Event的规范
    //详见http://www.filehippo.com/pl/download_opera/changelog/9476/
    //http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html
    "mouseenter_mouseover,mouseleave_mouseout".replace(/(\w+)_(\w+)/g,function(_,orig, fix){
        specials[ orig ]  = {
            setup:function(src){//使用事件冒充
                dom._data(src, orig+"_handle",dom.bind(src, fix, function(event){
                    var parent = event.relatedTarget;
                    try {
                        while ( parent && parent !== src ) {
                            parent = parent.parentNode;
                        }
                        if ( parent !== src ) {
                            fixAndHandle(src, orig, event)
                        }
                    } catch(e) { };
                }));
            },
            teardown :function(){
                dom.bind(this, fix, dom._data(orig+"_handle")|| dom.noop);
            }
        };
    });
    var delegate = function(fn){
        return function(src,selector){
            if(!selector){
                return false;
            }
            fn(src);
        }
    }
    //模拟IE678的reset,submit,change的事件代理
    var submitWhich = dom.oneObject("13,108");
    var submitInput = dom.oneObject("submit,image");
    var submitType  = dom.oneObject("text,password,textarea");
    if(!DOC.dispatchEvent){
        var changeEls = /^(?:textarea|input|select)$/i ,checkEls = /radio|checkbox/;
        var changeType = {
            "select-one":"selectedIndex",
            "select-multiple":"selectedIndex",
            "radio":"checked",
            "checkbox":"checked"
        }
        var changeNotify = function(e){
            if(e.propertyName === (changeType[this.type] || "value")){
                var els = dom._data(this,"publisher");
                e = system.fix(e);
                e.type = "change";
                for(var i in els){
                    system.handle.call(els[i], e);
                }
            }
        }

        dom.mix(specials,{
            //reset事件的冒泡情况----FF与opera能冒泡到document,其他浏览器只能到form
            reset:{
                setup: delegate(function(src){
                    system.bind.call( src, "click._reset keypress._reset", function( e ) {
                        if(  e.target.form && (e.which === 27  ||  e.target.type == "reset") ){
                            fixAndHandle(src, "reset", e);
                        }
                    });
                }),
                teardown: delegate(function(src){
                    system.unbind.call( src, "._reset" );
                })
            },
            //submit事件的冒泡情况----IE6-9 :form ;FF: document; chrome: window;safari:window;opera:window
            submit : {
                setup: delegate(function(src){
                    system.bind.call( src, "click._submit keypress._submit", function( e ) {
                        var el = e.target, type = el.type;
                        if( el.form &&  ( submitInput[type] || submitWhich[ e.which ] && submitType[type]) ){
                            fixAndHandle(src, "submit", e);
                        }
                    });
                }),
                teardown: delegate(function(src){
                    system.unbind.call( src, "._submit" );
                })
            },
            change : {
                setup: delegate(function(src){
                    var subscriber = dom._data(src,"subscriber",{});//用于保存订阅者的UUID
                    dom._data(src,"valuechange_setup", dom.bind( src, "beforeactivate", function( ) {
                        var target = event.srcElement;
                        //如果发现孩子是表单元素并且没有注册propertychange事件，则为其注册一个，那么它们在变化时就会发过来通知顶层元素
                        if ( changeEls.test(target.nodeName) && !subscriber[target.uniqueNumber] ) {
                            subscriber[target.uniqueNumber] = target;//表明其已注册
                            var publisher = (dom._data(target,"publisher") || dom._data(target,"publisher",{}));
                            publisher[src.uniqueNumber] = src;//此孩子可能同时要向N个上司报告变化
                            system.bind.call(target,"propertychange._change",changeNotify );
                        }
                    }));
                }),
                teardown:delegate(function(src){
                    dom.unbind( src, "beforeactive", dom._data(src,"valuechange_setup") || dom.noop);
                    var els = dom.removeData(src,"subscriber",true) || {};
                    for(var i in els){
                        dom.unbind(els[i],"._change");
                        var publisher = dom._data(els[i],"publisher");
                        if(publisher){
                            delete publisher[src.uniqueNumber];
                        }
                    }
                })
            }
        })
            
    }
    //我们可以通过change的事件代理来模拟YUI的valuechange事件
    //支持情况 FF2+ chrome 1+ IE9+ safari3+ opera9+11 The built-in Android browser,Dolphin HD browser
    if(dom.eventSupport("input", DOC.createElement("input"))){
        //http://blog.danielfriesen.name/2010/02/16/html5-browser-maze-oninput-support/
        specials.change = {
            setup : delegate(function(src){
                dom._data(src,"valuechange_setup",dom.bind( src, "input", function( e){
                    fixAndHandle(src, "change", e);
                },true));
                dom._data(src,"selectchange_setup",dom.bind( src, "change", function( e){
                    var type = e.target.type;
                    if(type && !submitType[type]){
                        system.handle.call(src, e);
                    }  
                },true))
            }),
            teardown: delegate(function(src){
                dom.unbind( src, "input", dom._data(src,"valuechange_setup") || dom.noop);
                dom.unbind( src, "change", dom._data(src,"selectchange_setup") || dom.noop);
            })
        }
    }
       
    //在标准浏览器里面模拟focusin
    if(!dom.eventSupport("focusin")){
        "focusin_focus,focusout_blur".replace(/(\w+)_(\w+)/g,function(_,$1, $2){
            var notice = 0, focusinNotify = function (e) {
                var src = e.target
                do{//模拟冒泡
                    var events = dom._data( src,"events");
                    if(events && events[$1]){
                        fixAndHandle(src, $1, e);
                    }
                } while (src = src.parentNode );
            }
            specials[ $1 ] = {
                setup: function( ) {
                    if ( notice++ === 0 ) {
                        DOC.addEventListener( $2, focusinNotify, true );
                    }
                },
                teardown: function() {
                    if ( --notice === 0 ) {
                        DOC.removeEventListener( $2, focusinNotify, true );
                    }
                }
            };
        });
    }
    try{
        //FF3使用DOMMouseScroll代替标准的mousewheel事件
        DOC.createEvent("MouseScrollEvents");
        specials.mousewheel = {
            bindType    : "DOMMouseScroll",
            delegateType: "DOMMouseScroll"
        }
        try{
            //可能末来FF会支持标准的mousewheel事件，则需要删除此分支
            DOC.createEvent("WheelEvent");
            delete specials.mousewheel;
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
    dom.implement({
        toggle:function(/*fn1,fn2,fn3*/){
            var fns = [].slice.call(arguments), i = 0;
            return this.click(function(e){
                var fn  = fns[i++] || fns[i = 0, i++];
                fn.call(this,e);
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
                system.bind.call( this, types, fn, selector, times );
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
                system.unbind.apply( this, args );
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
            dom( this.ownerDocument ).on( types, fn, this.selector,times );
            return this;
        },
        die: function( types, fn ) {
            dom( this.ownerDocument ).off( types, fn, this.selector || "**" );
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
                dom.event.fire.apply(this, args );
            });
        }
    })

    types.replace(rword,function(type){
        dom.fn[type] = function(callback){
            return callback?  this.bind(type, callback) : this.fire(type);
        }
    });
});
//2011.10.14 强化delegate 让快捷方法等支持fire 修复delegate BUG
//2011.10.21 修复focusin focsuout的事件代理 增加fixAndHandle处理事件冒充
//2011.11.23 简化rquickIs
//1. 各浏览器兼容                  2. this指针指向兼容                  3. event参数传递兼容. 







