$.define("switchable","more/uibase,event,attr,fx",function(Widget){
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

    var createHTML = function( data, ui){
        var t = $.tag, html = '<div class="mass_accordion">'
        for(var i =0 ,el; el = data[i++];){
            html += t("div class="+ui.trigger_class, el.trigger) +
            t("div class="+ui.panel_class, el.panel)
        }
        html += "</div>"
        return $(html).appendTo(ui.parent);
    }
    function reset(ui){
        ui.triggers = ui.target.find("." + ui.trigger_class );
        ui.panels = ui.target.find("." + ui.panel_class );
    }
    function init( ui, hash ){
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        ui.target = createHTML(ui.data, ui)//创建一个ui实体
        delete ui.data;//考虑有时它的HTML结构会很庞大，没有必要储存它
        reset(ui);
        ui.panels.hide();
        ui.active(0);
        //http://www.welefen.com/user-define-rich-content-filter-class.html
        ui.target.delegate("."+ ui.trigger_class, ui.active_event, function( e ){
            var index = ui.triggers.index(e.target);
            ui.active(index,ui.active_callback, e);
        });

        // autoplay_callback
        if(ui.pause_over_panel){
            ui.target.bind( "mouseenter", function( e ){
                ui.autoplay = false;

            }).bind("mouseleave", function( e ){
                if(!ui.autoplay){
                    ui.autoplay = true
                   setTimeout(function(){
                         ui.active(++ui.current_index);
                    
                   },100)
                  
                }

            });
        }

    }
    var Accordion = $.factory({
        inherit: Widget.Class,
        active: function(index, callback, e){
            var i = index, ui = this, reference = ui.triggers.eq(i) , active = ui.active_class;
            if( !reference[0]){
                reference = ui.triggers.eq(i = 0)
            }
            ui.current_index = i;
            if( !reference.hasClass( active) ){
                var el = ui.target.find("."+active).removeClass( active )
                var p = ui.triggers.index( el )

               ui.panels.eq(p).removeClass( active ).slideUp(500);

                reference.addClass( active );
                ui.panels.eq(i).addClass(active).slideDown(500, function(){
                    setTimeout(function(){
                        ui.autoplay &&  ui.active(++ui.current_index);
                    }, ui.delay);
                });
                callback && callback.call( e ? e.target : ui.target[0], e || ui);
            }
        },
        //在第几个之后添加一个新切换卡
        add: function(index, trigger, panel ){
            var ui = this, reference = ui.triggers.eq(~~index), t = $.tag;
            reference.after(
                t("div class="+ui.trigger_class, trigger) +
                t("div class="+ui.panel_class, panel ) );
            reset(ui);
        },
        remove: function(index,callback){
            var ui = this, reference = ui.triggers.eq(~~index)
            if( reference.length ){
                reference.remove();
                reset(ui);
                callback && callback.call( ui.target[0], ui)
            }
        }
    });

    $.fn.accordion = Widget.create("accordion", Accordion, init )

})
