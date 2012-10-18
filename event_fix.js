//=========================================
//  事件补丁模块
//==========================================
define("event_fix", !!document.dispatchEvent, function(){
    $.log("已加载event_fix模块",7)
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
                throw "fire的第一个参数是必须是事件类或真伪事件对象"
            }
            transfer.target = this;
            transfer.args = [].slice.call(arguments,1) ;
            var type =  transfer.origType || transfer.type
            if( $["@bind"] in this ){
                var cur = this,  ontype = "on" + type;
                do{//模拟事件冒泡与执行内联事件
                    facade.dispatch( cur, transfer, type );
                    if (cur[ ontype ] && cur[ ontype ].call(cur) === false) {
                        transfer.preventDefault();
                    }
                    cur = cur.parentNode ||
                    cur.ownerDocument ||
                    cur === cur.ownerDocument && window;  //在opera 中节点与window都有document属性
                } while ( cur && !transfer.propagationStopped );

                if ( !transfer.defaultPrevented ) {//如果用户没有阻止普通行为，defaultPrevented
                    if( !(type === "click" && this.nodeName === "A") ) { //并且事件源不为window，并且是原生事件
                        if ( ontype && this[ type ] && ((type !== "focus" && type !== "blur") || this.offsetWidth !== 0) &&  !this.eval ) {
                            var inline = this[ ontype ];
                            //当我们直接调用元素的click,submit,reset,focus,blur
                            //会触发其默认行为与内联事件,但IE下会再次触发内联事件与多投事件
                            this[ ontype ] = null;
                            facade.type = type
                            if(type == "click" && /checkbox|radio/.test(this.type)){
                                this.checked = !this.checked
                            }
                            this[ type ]();
                            facade.type = void 0
                            this[ ontype ] = inline;
                        }
                    }

                }

            }else{//普通对象的自定义事件
                facade.dispatch(this, transfer);
            }
        }
    }
    //模拟IE678的reset,submit,change的事件代理
    var rform  = /^(?:textarea|input|select)$/i 
    function changeNotify( event ){
        if( event.type == "change" || event.propertyName == "checked" ){
            $.event.fire.call(this,"change")
        }
    }
    function delegate( fn ){
        return function( item ){//用于判定是否要使用代理
            return item.live  ? fn( item.currentTarget, item ) : false;
        }
    }
    var adapter = $.eventAdapter = {
        focus: {
            delegateType: "focusin"
        },
        blur: {
            delegateType: "focusout"
        },
        change: {//change事件的冒泡情况 IE6-9全灭
            //详见这里https://github.com/RubyLouvre/mass-Framework/issues/13
            setup: delegate(function( node, desc ){
                var subscriber = desc.subscriber || ( desc.subscriber = {}) //用于保存订阅者的UUID
                desc.__beforeactive__ = $.bind( node, "beforeactivate", function(event) {
                    var target = event.srcElement;
                    var tid = $.getUid( target )
                    //如果发现孩子是表单元素并且没有注册propertychange事件，则为其注册一个，那么它们在变化时就会发过来通知顶层元素
                    if ( rform.test( target.tagName) && !subscriber[ tid ] ) {
                        subscriber[ tid ] = target;//将select, checkbox, radio, text, textarea等表单元素注册其上
                        if(/checkbox|radio/.test(target.type)){
                            desc.__change__ = $.bind( target, "propertychange", changeNotify.bind(target, event) );
                        }else{
                            desc.__change__ = $.bind( target, "change", changeNotify.bind(target, event) );
                        }
                    }
                });//如果是事件绑定
            // node.fireEvent("onbeforeactivate")
            }),
            teardown: delegate(function( node, desc ){
                $.unbind( node, "beforeactive", desc.__beforeactive__ );
                var els = desc.subscriber ;
                for(var i in els){
                    $.unbind( els[i], "propertychange",  desc.__change__) ;
                    $.unbind( els[i], "change",  desc.__change__);
                }
            })
        }
    }
    //submit事件的冒泡情况----IE6-9 :form ;FF: document; chrome: window;safari:window;opera:window
    //同reset事件的冒泡情况----FF与opera能冒泡到document,其他浏览器只能到form
    "submit,reset".replace( $.rword, function( type ){
        adapter[ type ] = {
            setup: delegate(function( node ){
                $(node).bind( "click._"+type+" keypress._"+type, function( event ) {
                    var el = event.target;
                    if( el.form && (adapter[ type ].keyCode[ event.which ] || adapter[ type ].input[  el.type ] ) ){
                        $.event.fire.call(el, type)
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
})

/*
 * input事件的支持情况：IE9+，chrome+, gecko2+, opera10+,safari+
 * 2012.5.1 fix delegate BUG将submit与reset这两个适配器合而为一
 * 2012.10.18 重构reset, change, submit的事件代理
<!DOCTYPE HTML>
<html>
    <head>
        <title>change</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <script src="mass.js" ></script>
        <script>

            $.require("ready,event", function(){
                
                $("form").on( "change", function() {  $.log(this.tagName)  })
                $(document).on( "change",'select', function() {  $.log(this.tagName)  })

            })
          
        </script>
    </head>
    <body >
            <form action="javascript:void 0">
                <select>
                    <option>
                        1111111
                    </option>
                    <option>
                        222222
                    </option>
                    <option>
                        33333
                    </option>
                </select>
            </form>

    </body>
</html>
 */

