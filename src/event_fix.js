$.define("event_fix", !!document.dispatchEvent, function(){
    //模拟IE678的reset,submit,change的事件代理
    var submitWhich = $.oneObject("13,108"),
    submitInput = $.oneObject("submit,image"),
    submitType  = $.oneObject("text,password,textarea"),
    rform  = /^(?:textarea|input|select)$/i ,
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
    function delegate( fn ){ 
        return function(src, selector, type, adapter){
            adapter = $.event.eventAdapter,
            fix = !adapter[type] || !adapter[type].check || adapter[type].check( src );
            if( fix || selector ){
                return fn(src, type, fix);
            }else{
                return false;
            }
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
            change: {//change事件的冒泡情况 IE6-9全灭
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
        }
    }
});



