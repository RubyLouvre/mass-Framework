//=========================================
//  事件补丁模块
//==========================================
$.define("event_fix", !!document.dispatchEvent, function(){
    //模拟IE678的reset,submit,change的事件代理
    var rform  = /^(?:textarea|input|select)$/i ,
    changeType = {
        "select-one": "selectedIndex",
        "select-multiple": "selectedIndex",
        "radio": "checked",
        "checkbox": "checked"
    }
    function changeNotify( event ){
        if( event.propertyName === ( changeType[ this.type ] || "value") ){
            $._data( this, "_just_changed", true );
            $.event._dispatch( $._data( this, "publisher" ), "change", event );
        }
    }
    function changeFire( event ){
        if( !$._data( this,"_just_changed" ) ){
            $.event._dispatch( $._data( this ,"publisher"), "change", event );
        }else{
            $.removeData( this, "_just_changed", true );
        }
    }
    function delegate( fn ){ 
        return function( item ){
            var adapter = $.event.eventAdapter, src = item.target, type = item.type,
            fix = adapter[ type ] && adapter[ type ].check && adapter[ type ].check( src );
            return (fix || item.selector ) ? fn( src, type, item, fix ) : false;
        }
    }

    var facade = $.event = {
        eventAdapter:{
            //input事件的支持情况：IE9+，chrome+, gecko2+, opera10+,safari+
            input: {
                check: function( target ){
                    return rform.test(target.tagName) && !/^select/.test(target.type);
                },
                bindType: "change",
                delegateType: "change"
            },

            change: {//change事件的冒泡情况 IE6-9全灭
                check: function(target){
                    return rform.test(target.tagName) && /radio|checkbox/.test(target.type)
                },
                setup: delegate(function( src, type, item, fix ){
                    var subscriber = item.subscriber || ( item.subscriber = {}) //用于保存订阅者的UUID
                    item.change_beforeactive = $.bind( src, "beforeactivate", function() {
                        var target = event.srcElement, tid = $.getUid( target )
                        //如果发现孩子是表单元素并且没有注册propertychange事件，则为其注册一个，那么它们在变化时就会发过来通知顶层元素
                        if ( rform.test( target.tagName) && !subscriber[ tid ] ) {
                            subscriber[ tid ] = target;//表明其已注册
                            var publisher = $._data( target,"publisher") || $._data( target,"publisher",{} );
                            publisher[ $.getUid(src) ] = src;//此孩子可能同时要向N个顶层元素报告变化
                            item.change_propertychange = $.bind( target, "propertychange", changeNotify.bind(target, event))
                            //允许change事件可以通过fireEvent("onchange")触发
                            if( type === "change"){
                                item.change_fire = $.bind(target, "change", changeFire.bind(target, event) );
                            }
                        }
                    })
                    if( fix ){//如果是事件绑定
                        src.fireEvent("onbeforeactivate")
                    }
                }),
                teardown: delegate(function( src, type, item ){
                    $.unbind( src, "beforeactive", item.change_beforeactive );
                    $.unbind( src, "change",  item.change_fire)  ;
                    var els = item.subscriber || {};
                    for(var i in els){
                        $.unbind( els[i], "propertychange",  item.change_propertychange)  ;
                        var publisher = $._data( els[i], "publisher");
                        if(publisher){
                            delete publisher[ src.uniqueNumber ];
                        }
                    }
                })
            }
        }
    }
    var adapter = facade.eventAdapter;
    //submit事件的冒泡情况----IE6-9 :form ;FF: document; chrome: window;safari:window;opera:window
    //reset事件的冒泡情况----FF与opera能冒泡到document,其他浏览器只能到form
    "submit,reset".replace( $.rword, function( type ){
        adapter[ type ] = {
            setup: delegate(function( src ){
                $.fn.on.call( src, "click._"+type+" keypress._"+type, function( e ) {
                    var el = e.target;
                    if( el.form && (adapter[ type ].keyCode[ e.which] || adapter[ type ].kind[  el.type ] ) ){
                        facade._dispatch( [ src ], type, e );
                    }
                });
            }),
            keyCode: $.oneObject(type == "submit" ? "13,108" : "27"),
            kind:  $.oneObject(type == "submit" ? "submit,image" : "reset"),
            teardown: delegate(function( src ){
                facade.unbind.call( src, "._"+type );
            })
        };
    });
});
//2012.5.1 fix delegate BUG将submit与reset这两个适配器合而为一


