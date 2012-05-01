$.define("event","more/spec,event",function(){
    var iframe =  $("<iframe id='test_event' style='display:none;width:0px;height:0px;' src='/test/event.html' frameBorder=0  />" ).appendTo("body");//
    window.eventTestCall = function(){
        var idoc = iframe.contents()[0];
        $.fixture("事件模块-event",{
            "native_fire": function( id ){
                var form = $("#form1",idoc);
                form.submit(function(e){
                    $.log("fire submit successly!")
                    expect( e.type, id ).eq( "submit" );
                });
                var input = $("#input1",idoc);
                input.change(function(e){
                    expect( e.type, id ).eq( "change" );
                });
                var select = $("#select1",idoc);
                select.change(function(e){
                    expect( e.type, id ).eq( "change" );
                });

                function fireEvent(el, type, e){
                    if ( document.dispatchEvent ){
                        e = document.createEvent("HTMLEvents");
                        e.initEvent(type, true, true );
                        el.dispatchEvent( e );
                    }else {
                        el.fireEvent( 'on'+type );
                    }
                }

                fireEvent(form[0], "submit");
                fireEvent(input[0], "change");
                fireEvent(select[0], "change");
            },
            "mass_fire": function( id ){
                var form = $("#form2",idoc);
                form.submit(function(e){
                    expect( e.type, id ).eq( "submit" );
                });
                //测试冒泡
                $("body",idoc).submit(function(e){
                    expect( e.type+"_body", id ).eq( "submit_body" );
                });
                var input = $("#input2",idoc);
                input.change(function(e){
                    expect( e.type, id ).eq( "change" );
                });
                var select = $("#select2",idoc);
                select.change(function(e){
                    expect( e.type, id ).eq( "change" );
                });

                function fireEvent(el, type, e){
                    if ( document.dispatchEvent ){
                        e = document.createEvent("HTMLEvents");
                        e.initEvent(type, true, true );
                        el.dispatchEvent( e );
                    }else {
                        el.fireEvent( 'on'+type );
                    }
                }

                fireEvent(form[0], "submit");
                fireEvent(input[0], "change");
                fireEvent(select[0], "change");
            },
            defineEvents: function(id){
                var a  =  {};
                $.mix(a, $.EventTarget);
                var repeat = function(e){
                    expect(e.type, id ).eq("repeat")
                }
                a.bind("repeat",repeat)
                a.bind("repeat",repeat);
                a.bind("repeat",repeat);
                a.fire("repeat");
                a.bind("data",function(e){
                    expect(e.type, id).eq("data")
                });
                a.bind("data",function(e){
                    expect( typeof(a.uniqueNumber), id ).eq("number")
                    expect( e.target, id ).eq(a)
                });
                a.fire("data",3,5);

                var b = {};
                $.mix(b, $.EventTarget);
                b.defineEvents("fold,unfold");
                b.onFold(function(e){
                    expect( e.type, id ).eq( "fold" );
                });
                b.bind("fold",function(e){
                    expect( e.type+"2", id ).eq( "fold2" );
                });
                b.fire("fold");
            }
        });
    }
})