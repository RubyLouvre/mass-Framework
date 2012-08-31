//=========================================
//  事件补丁模块
//==========================================
define("event_fix", !!document.dispatchEvent, function(){
    $.log("已加载event_fix模块",7)
    //模拟IE678的reset,submit,change的事件代理
    var rform  = /^(?:textarea|input|select)$/i ,
    changeType = {
        "select-one": "selectedIndex",
        "select-multiple": "selectedIndex",
        "radio": "checked",
        "checkbox": "checked"
    }
    function changeNotify( event, type ){
        if( event.propertyName === ( changeType[ this.type ] || "value") ){
            //$._data( this, "_just_changed", true );
            $.event._dispatch( $._data( this, "publisher" ), event, type );
        }
    }
    function delegate( fn ){
        return function( item ){
            var adapter = $.event.eventAdapter, src = item.currentTarget, type = item.type,
            fix = adapter[ type ] && adapter[ type ].check && adapter[ type ].check( src, item );
            return (fix || item.live ) ? fn( src, item ) : false;
        }
    }

    var facade = $.event = {
        fire: function( init ){
            //这里的代码仅用于IE678
            var transfer;
            if( typeof init == "string"){
                transfer = new $.Event(init);
                init = false;
            }
            if( init && typeof init == "object"){
                if( init instanceof $.Event ){//如果是伪的
                    transfer = init;
                }else if( "cancelBubble" in init){
                    transfer = new $.Event(init.type);
                    transfer.originalEvent = init
                }
            }
            if(!transfer){
                throw "ie $.event.fire arguments error"
            }
            transfer.target = this;
            transfer.args = [].slice.call(arguments,1) ;
            var type = transfer.origType || transfer.type;
            if( $["@bind"] in this ){
                var cur = this,  ontype = "on" + type;
                do{//模拟事件冒泡与执行内联事件
                    facade.dispatch( cur, transfer );
                    if (cur[ ontype ] && cur[ ontype ].call(cur) === false) {
                        transfer.preventDefault();
                    }
                    cur = cur.parentNode ||
                    cur.ownerDocument ||
                    cur === cur.ownerDocument && window;  //在opera 中节点与window都有document属性
                } while ( cur && !transfer.isPropagationStopped );
            
                if ( !transfer.isDefaultPrevented  //如果用户没有阻止普通行为，defaultPrevented
                    && this[ type ] && ontype && !this.eval  //并且事件源不为window，并且是原生事件
                    && (type == "click"|| this.nodeName != "A")//如果是点击事件则元素不能为A因为会跳转
                    && ( (type !== "focus" && type !== "blur") || this.offsetWidth !== 0 ) //focus,blur的目标元素必须可点击到，换言之，拥有“尺寸”
                    ) {
                    var inline = this[ ontype ];
                    var disabled = this.disabled;//当我们直接调用元素的click,submit,reset,focus,blur
                    this.disabled = true;//会触发其默认行为与内联事件,但IE下会再次触发内联事件与多投事件
                    this[ ontype ] = null;
                    if(type == "click" && /checkbox|radio/.test(this.type)){
                        this.checked = !this.checked
                    }
                    this[ type ]();
                    this.disabled = disabled
                    this[ ontype ] = inline;
                }
            }else{//普通对象的自定义事件
                facade.dispatch(this, transfer);
            }
         
        },
        eventAdapter: {//input事件的支持情况：IE9+，chrome+, gecko2+, opera10+,safari+
            input: {
                bindType: "change",
                delegateType: "change"
            },
            focus: {
                delegateType: "focusin"
            },
            blur: {
                delegateType: "focusout"
            },
            change: {//change事件的冒泡情况 IE6-9全灭
                check: function(){//详见这里https://github.com/RubyLouvre/mass-Framework/issues/13
                    return true;
                },
                setup: delegate(function( node, quark ){
                    var subscriber = quark.subscriber || ( quark.subscriber = {}) //用于保存订阅者的UUID
                    quark.change_beforeactive = $.bind( node, "beforeactivate", function() {
                        //防止出现跨文档调用的情况,找错event
                        var doc = node.ownerDocument || node.document || node;
                        var target = doc.parentWindow.event.srcElement, tid = $.getUid( target )
                        //如果发现孩子是表单元素并且没有注册propertychange事件，则为其注册一个，那么它们在变化时就会发过来通知顶层元素
                        if ( rform.test( target.tagName) && !subscriber[ tid ] ) {
                            subscriber[ tid ] = target;//将select, checkbox, radio, text, textarea等表单元素注册其上
                            var publisher = $._data( target,"publisher") || $._data( target,"publisher",{} );
                            publisher[ $.getUid( node ) ] = node;//此孩子可能同时要向N个顶层元素报告变化
                            quark.change_propertychange = $.bind( target, "propertychange", changeNotify.bind(target, event, quark.origType))
                        }
                    });//如果是事件绑定
                    node.fireEvent("onbeforeactivate")
                }),
                teardown: delegate(function( node, quark ){
                    $.unbind( node, "beforeactive", quark.change_beforeactive );
                    var els = quark.subscriber || {};
                    for(var i in els){
                        $.unbind( els[i], "propertychange",  quark.change_propertychange)  ;
                        var publisher = $._data( els[i], "publisher");
                        if( publisher ){
                            delete publisher[ node.uniqueNumber ];
                        }
                    }
                })
            }
        }
    }

    var adapter = facade.eventAdapter;
    // adapter.input = adapter.change;
    //submit事件的冒泡情况----IE6-9 :form ;FF: document; chrome: window;safari:window;opera:window
    //reset事件的冒泡情况----FF与opera能冒泡到document,其他浏览器只能到form
    "submit,reset".replace( $.rword, function( type ){
        adapter[ type ] = {
            setup: delegate(function( node ){
                $(node).bind( "click._"+type+" keypress._"+type, function( event ) {
                    var el = event.target;
                    if( el.form && (adapter[ type ].keyCode[ event.which ] || adapter[ type ].kind[  el.type ] ) ){
                        facade._dispatch( [ node ], event, type );
                    }
                });
            }),
            keyCode: $.oneObject(type == "submit" ? "13,108" : "27"),
            kind:  $.oneObject(type == "submit" ? "submit,image" : "reset"),
            teardown: delegate(function( node ){
                $( node ).unbind( "._"+type );
            })
        };
    });
});
//2012.5.1 fix delegate BUG将submit与reset这两个适配器合而为一


