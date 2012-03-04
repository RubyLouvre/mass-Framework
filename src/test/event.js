$.define("event","more/spec,event",function(){
    var iframe =  $("<iframe id='test_event' style='display:none;width:0px;height:0px;' src='/test/event.html' frameBorder=0  />" ).appendTo("body");//
    window.eventTestCall = function(){
        var idoc = iframe.contents()[0];
        $.fixture("DOM事件模块-event",{
            "native fire": function(){
                var form = $("#form1",idoc);
                form.submit(function(e){
                    expect( e.type ).eq( "submit" );
                });
                var input = $("#input1",idoc);
                input.change(function(e){
                    expect( e.type ).eq( "change" );
                });
                var select = $("#select1",idoc);
                select.change(function(e){
                    expect( e.type ).eq( "change" );
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
            "mass fire": function(){
                var form = $("#form2",idoc);
                form.submit(function(e){
                    expect( e.type ).eq( "submit" );
                });
                var input = $("#input2",idoc);
                input.change(function(e){
                    expect( e.type ).eq( "change" );
                });
                var select = $("#select2",idoc);
                select.change(function(e){
                    expect( e.type ).eq( "change" );
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
            }
        });
    }
})