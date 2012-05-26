$.define("event","more/spec,event",function(){
    var iframe =  $("<iframe id='test_event' style='display:none;width:0px;height:0px;' src='/test/event.html' frameBorder=0  />" ).appendTo("body");//
    window.eventTestCall = function(){
        var idoc = iframe.contents()[0];
        $.fixture("事件模块-event",{
            "fire complicated event": function(id){
                $(document).keyup(function(e){
                    expect( e.type, id ).eq( "keyup" );
                    $.log("fire complicated event "+ e.type);
                    $(this).unbind(e.type)
                }).fire("keyup");
                $(document).mousedown(function(e){
                    expect( e.type, id ).eq( "mousedown" );
                    $.log("fire complicated event "+ e.type);
                    $(this).unbind(e.type)
                }).fire("mousedown");
                $(document).mouseup(function(e){
                    expect( e.type, id ).eq( "mouseup" );
                    $.log("fire complicated event "+ e.type);
                    $(this).unbind(e.type)
                }).fire("mouseup");
                $(document).contextmenu(function(e){
                    expect( e.type, id ).eq( "contextmenu" );
                    $.log("fire complicated event "+ e.type);
                    $(this).unbind(e.type)
                }).fire("contextmenu");
                $(document).mousemove(function(e){
                    expect( e.type, id ).eq( "mousemove" );
                    $.log("fire complicated event "+ e.type);
                    $(this).unbind(e.type)
                }).fire("mousemove");
                $("body").mousewheel(function(e){
                    expect( e.type, id ).eq( "mousewheel" );
                    $.log("fire complicated event "+ e.type);
                    $(this).unbind(e.type)
                }).fire("mousewheel")
            },

            "fire mouseover, mouseenter": function(id){
                var node = $("#mouseenter",idoc);
                node.mouseover(function(e){
                    expect( e.type, id ).eq( "mouseover" );
                    $.log("mouseover")
                });
                node.mouseenter(function(e){
                    expect( e.type, id ).eq( "mouseenter" );
                    $.log("mouseenter")
                });
                node.fire("mouseover");
                node.fire("mouseenter")
            },
            "fire mouseleave": function(id){
                var node = $("#mouseenter",idoc);
                node.mouseleave(function(e){
                    expect( e.type, id ).eq( "mouseleave" );
                    $.log("mouseleave")
                });
                node.fire("mouseleave")
            },
            "click":function(id){
                var a = $("#domtree,#domtree div",idoc).click(function(e){
                    expect( e.type, id ).eq( "click" );
                });
                var tabindex = []
                a.eq(0).find("div").each(function(el){
                    el.onclick = function(){
                        var a = this.tabIndex || this.tabindex;
                        $.log(a)
                        tabindex.push(a);
                    }
                });
                a.filter(".inner").fire("click");
                expect( tabindex.join(","),id ).eq( "5,4,3,2,1" );
                
            },
            "focusin": function(id){
                $("#focusin",idoc).bind("focusin",function(e){
                    expect( e.target.id,id ).eq( "focus_input" );
                    e.target.style.color = "red";
                });
                $("#focus_input",idoc).fire("focusin");//DOMFocusIn
            },
            "event clone": function(id){
                var source = $("#source",idoc).click(function(e){
                    $.log(e.type+":"+this.innerHTML)
                    expect(e.type+":"+this.innerHTML, id ).eq( "click:clone" );
                }).mousedown(function(e){
                    $.log(e.type+":"+this.innerHTML);
                    expect(e.type+":"+this.innerHTML, id ).eq( "mousedown:clone" );
                });
                var clone = source.clone(true).html("clone").afterTo(source)
                clone.fire("click").fire("mousedown")
            },
            "mass_fire": function( id ){
                var form = $("#form", idoc);
                form.submit(function(e){
                    $.log(e.type+":"+e.currentTarget.nodeName)
                    expect(e.type+":"+e.currentTarget.nodeName, id).eq("submit:FORM")
                });
                //测试冒泡
                $("body", idoc).submit(function(e){
                    $.log(e.type+":"+e.currentTarget.nodeName);
                    expect(e.type+":"+e.currentTarget.nodeName, id).eq("submit:BODY")
                });
                $("html", idoc).submit(function(e){
                    $.log(e.type+":"+e.currentTarget.nodeName);
                    expect(e.type+":"+e.currentTarget.nodeName, id).eq("submit:HTML")
                });
                var input = $("#checkbox", idoc);
                input.change(function(e){
                    $.log(e.type+":"+e.currentTarget.nodeName);
                    expect(e.type+":"+e.currentTarget.nodeName, id).eq("change:INPUT")
                });
                var select = $("#select", idoc);
                select.change(function(e){
                    $.log(e.type+":"+e.currentTarget.nodeName);
                    expect(e.type+":"+e.currentTarget.nodeName, id).eq("change:SELECT")
                });
                form.fire("submit")
                input.fire("change")
                select.fire("change")
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
                a.bind("data",function(e, b, c){
                    expect( typeof(a.uniqueNumber), id ).eq("number")
                    expect( e.target, id ).eq(a)
                    expect(b ,id).eq(3)
                    expect(c, id).eq(5);
                    $.log(e.type+" "+b+" "+c)
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
                    expect( e.target, id).eq(b);
                    expect( this, id).eq(b)
                });
                b.fire("fold");
            }
        });
    }
})