$.define("accordion","more/uibase,event,attr,fx",function(Widget){
    var defaults = {
        trigger_class:  "trigger",
        panel_class:    "panel",
        active_class:   "active",
        active_event:   "click",
        active_callback: $.noop
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
        ui.target.delegate("."+ ui.trigger_class, ui.active_event, function( e ){
            var reference =  $(e.target)
            if( !reference.hasClass( active) ){
                ui.target.find("."+active).removeClass( active ).next().toggle(500)
                reference.addClass( active ).next().toggle(500)
                ui.active_callback.call( this, e, ui );
            }
        })
    }
    var Accordion = $.factory({
        inherit: Widget.Class,
        active: function(index, callback){
            var ui = this, reference = ui.triggers.eq(~~index), active = ui.active_class;
            if( !reference.hasClass( active) ){
                ui.target.find("."+active).removeClass( active ).next().toggle(500)
                reference.addClass( active ).next().toggle(500)
                callback && callback.call( ui,index)
            }
        },
        //在第几个之后添加一个新切换卡
        add: function(index, trigger, panel ){
            var ui = this, reference = ui.triggers.eq(~~index), t = $.tag;
            reference.after(
                t("div class="+ui.trigger_class, trigger) +
                t("div class="+ui.panel_class, panel ) )

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