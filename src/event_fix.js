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
    function changeNotify( e ){
        if( e.propertyName === ( changeType[ this.type ] || "value") ){
            $._data( this, "_just_changed", true );
            $.event._dispatch( $._data( this, "publisher" ), "change", e );
        }
    }
    function changeFire( e ){
        if( !$._data( this,"_just_changed" ) ){
            $.event._dispatch( $._data( this ,"publisher"), "change", e );
        }else{
            $.removeData( this, "_just_changed", true );
        }
    }
    function delegate( fn ){ 
        return function( src, selector, type ){
            var adapter = $.event.eventAdapter,
            fix = adapter[ type ] && adapter[ type ].check && adapter[ type ].check( src );
            return (fix || selector) ? fn(src, type, fix) : false;
        }
    }

    var facade = $.event = {
        eventAdapter:{
            //input事件的支持情况：IE9+，chrome+, gecko2+, opera10+,safari+
            input: {
                check: function(src){
                    return rform.test(src.tagName) && !/^select/.test(src.type);
                },
                bindType: "change",
                delegateType: "change"
            },

            change: {//change事件的冒泡情况 IE6-9全灭
                check: function(src){
                    return rform.test(src.tagName) && /radio|checkbox/.test(src.type)
                },
                setup: delegate(function( src, type, fix ){
                    var subscriber = $._data( src, "subscriber", {} );//用于保存订阅者的UUID
                    $._data( src, "_beforeactivate", $.bind( src, "beforeactivate", function() {
                        var e = src.document.parentWindow.event, target = e.srcElement, tid = $.getUid( target )
                        //如果发现孩子是表单元素并且没有注册propertychange事件，则为其注册一个，那么它们在变化时就会发过来通知顶层元素
                        if ( rform.test( target.tagName) && !subscriber[ tid ] ) {
                            subscriber[ tid] = target;//表明其已注册
                            var publisher = $._data( target,"publisher") || $._data( target,"publisher",{} );
                            publisher[ $.getUid(src) ] = src;//此孩子可能同时要向N个顶层元素报告变化
                            $.fn.on.call( target,"propertychange._change", changeNotify );
                            //允许change事件可以通过fireEvent("onchange")触发
                            if(type === "change"){
                                $._data(src, "_change_fire", $.bind(target, "change", changeFire.bind(target, e) ));
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
                        facade.unbind.call( els[i], "._change" );
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


