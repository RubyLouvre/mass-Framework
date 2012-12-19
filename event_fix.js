//=========================================
//  事件补丁模块
//==========================================
define("event_fix", !!document.dispatchEvent, ["node"], function( $ ){
    //模拟IE678的reset,submit,change的事件代理
    var rformElems  = /^(?:input|select|textarea)$/i
    $.event = {
        special: {
            change: {
                setup: function() {
                    if ( rformElems.test( this.nodeName ) ) {
                        // IE doesn't fire change on a check/radio until blur; trigger it on click
                        // after a propertychange. Eat the blur-change in special.change.handle.
                        // This still fires onchange a second time for check/radio after blur.
                        if ( this.type === "checkbox" || this.type === "radio" ) {
                            $( this ).bind(  "propertychange._change", function( event ) {
                                if ( event.originalEvent.propertyName === "checked" ) {
                                    this._just_changed = true;
                                }
                            });
                            $( this). bind("click._change", function( event ) {
                                if ( this._just_changed && !event.isTrigger ) {
                                    this._just_changed = false;
                                }
                                // Allow triggered, simulated change events (#11500)
                                $.event.simulate( "change", this, event, true );
                            } );
                        }
                        return false;
                    }
                    // Delegated event; lazy-add a change handler on descendant inputs
                    $ (this).bind(  "beforeactivate._change", function( e ) {
                        var elem = e.target;
                        if ( rformElems.test( elem.nodeName ) && !$._data( elem, "_change_attached" ) ) {
                            $( elem ).bind( "change._change", function( event ) {
                                if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
                                    $.event.simulate( "change", this.parentNode, event, true );
                                }
                                $._data( elem, "_change_attached", true );
                            })
                        }
                    });
                },
                handle: function( event ) {
                    var elem = event.target;
                    // Swallow native change events from checkbox/radio, we already triggered them above
                    if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
                        return event.handleObj.handler.apply( this, arguments );
                    }
                },
                teardown: function() {
                    $.event.remove( this, "._change" );
                    return !rformElems.test( this.nodeName );
                }
            },
            submit: {
                setup: function() {
                    // Only need this for delegated form submit events
                    if ( this.tagName === "FORM"  ) {
                        return false;
                    }
                    // Lazy-add a submit handler when a descendant form may potentially be submitted
                    $( this).bind( "click._submit keypress._submit", function( e ) {
                        // Node name check avoids a VML-related crash in IE (#9807)
                        var elem = e.target,
                        form = /input|button/i.test(elem.tagName) ? elem.form : undefined;
                        if ( form && !$._data( form, "_submit_attached" ) ) {
                            $.event.bind( form,{
                                type:      "submit._submit",
                                callback: function( event ) {
                                    event._submit_bubble = true;
                                }
                            });
                            $._data( form, "_submit_attached", true );
                        }
                    });
                // return undefined since we don't need an event listener
                },

                postDispatch: function( event ) {
                    // If form was submitted by the user, bubble the event up the tree
                    if ( event._submit_bubble ) {
                        delete event._submit_bubble;
                        if ( this.parentNode && !event.isTrigger ) {
                            jQuery.event.simulate( "submit", this.parentNode, event, true );
                        }
                    }
                },

                teardown: function() {
                    // Only need this for delegated form submit events
                    if ( jQuery.nodeName( this, "form" ) ) {
                        return false;
                    }

                    // Remove delegated handlers; cleanData eventually reaps submit handlers attached above
                    jQuery.event.remove( this, "._submit" );
                }
            }
        }
    }
   
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
