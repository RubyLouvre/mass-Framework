$.define("accordion","more/uibase,event,attr,fx",function(Widget){
    var defaults = {
        trigger_class:  "trigger",
        panel_class:    "panel",
        active_class:   "active",
        active_event:   "click",
        active_callback: $.noop,
        pause_over_panel: false,
        autoplay: false,
        delay: 500
    }

    var createAccordion = function( data, ui){
        var t = $.tag, html = '<div class="mass_accordion">'
        for(var i =0 ,el; el = data[i++];){
            html += t("div class="+ui.trigger_class, el.trigger) +
            t("div class="+ui.panel_class, el.panel)
        }
        html += "</div>"
        return $(html).appendTo(ui.parent);
    }

    function init( ui, hash ){
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        ui.target = createAccordion(ui.data, ui)//创建一个ui实体
        ui.target.find( "."+ ui.panel_class ).hide(); //默认选中第一个切换卡
        delete ui.data;//考虑有时它的HTML结构会很庞大，没有必要储存它
        ui.triggers = ui.target.find("." + ui.trigger_class );
        ui.active(0);

        var active = ui.active_class;
        //http://www.welefen.com/user-define-rich-content-filter-class.html
        ui.target.delegate("."+ ui.trigger_class, ui.active_event, function( e ){
            var reference =  $(e.target)
            if( !reference.hasClass( active) ){
                ui.target.find("."+active).removeClass( active ).next().slideUp(500);
                reference.addClass( active ).next().slideDown(500)
                ui.active_callback.call( this, e, ui );
            }
        });

       // autoplay_callback
        if(ui.pause_over_panel){
            var active_panel = "."+ active +"+ ."+ui.panel_class;
            ui.target.delegate(active_panel, "mouseover", function( e ){
                ui.autoplay_callback = $.noop;

            }).delegate(active_panel, "mouseout", function( e ){
                if(ui.autoplay_callback == $.noop){
                    delete ui.autoplay_callback
                    setTimeout(function(){
                        ui.active(++ui.current_index);
                    }, ui.delay);
                }
               
            });
        }

    }
    var Accordion = $.factory({
        inherit: Widget.Class,
        active: function(index, callback){
            var next = index, ui = this, reference = ui.triggers.eq(next) , active = ui.active_class;
            if(ui.autoplay && !reference[0]){
                reference = ui.triggers.eq(next = 0)
            }
            ui.current_index = next;
            if( !reference.hasClass( active) ){
                ui.target.find("."+active).removeClass( active ).next().slideUp(500);
                console.log("00000000000000000")
                console.log(ui.active+"")
                reference.addClass( active ).next().slideDown(500, ui.autoplay_callback);
                callback && callback.call( ui,index)
            }
        },
        autoplay_callback: function(){
            console.log("autoplay_callback")
            var ui = this;
            console.log(this)
            console.log(ui)
            setTimeout(function(){
                ui.active(++ui.current_index);
            }, ui.delay);
        },
        //在第几个之后添加一个新切换卡
        add: function(index, trigger, panel ){
            var ui = this, reference = ui.triggers.eq(~~index), t = $.tag;
            reference.after(
                t("div class="+ui.trigger_class, trigger) +
                t("div class="+ui.panel_class, panel ) );
            ui.triggers = ui.target.find("." + ui.trigger_class );
        },
        remove: function(index,callback){
            var ui = this, reference = ui.triggers.eq(~~index)
            if( reference.length ){
                reference.remove();
                ui.triggers = ui.target.find("." + ui.trigger_class );
                callback && callback.call( ui,index)
            }
        }
    });

    $.fn.accordion = Widget.create("accordion", Accordion, init )

})




//2012.2.25  v1
//2012.3.3   v2
//2012.3.4   v3