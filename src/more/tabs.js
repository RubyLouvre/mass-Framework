$.define("tabs","more/uibase,event,attr",function(Widget){
    var defaults = {
        section_class:  "section",
        trigger_class:  "trigger",
        panel_class:    "panel",
        active_class:   "active",
        active_event:   "click",
        active_callback: $.noop
    }

    var createTabs = function( data, ui){
        var t = $.tag, html = '<div class="mass_tabs">'
        for(var i =0 ,el; el = data[i++];){
            html += t("div class="+ui.section_class,
                t("div class="+ui.trigger_class, el.trigger) +
                t("div class="+ui.panel_class, el.panel) )
        }
        html += "</div>"
        return $(html).appendTo(ui.parent);
    }

    function init( ui, hash ){
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        if(typeof ui.data_expr === "string" && ui.data_expr.length > 1){
            ui.target = $(ui.data_expr);//选中页面上类似结构的HTML作为ui实体
        }else{
            ui.target = createTabs(ui.data, ui)//创建一个ui实体
            ui.target.find( "div" ).first().addClass(ui.active_class); //默认选中第一个切换卡
        }
        delete ui.data;//考虑有时它的HTML结构会很庞大，没有必要储存它
        ui.sections = ui.target.find("." + ui.section_class );
        var active = ui.active_class;
        ui.target.delegate("."+ ui.trigger_class, ui.active_event+".tabs", function( e ){
            var section =  ui.sections.has(e.target)
            if( !section.hasClass( active) ){
                ui.target.find("."+active).removeClass( active );
                section.addClass( active );
                ui.active_callback.call( this, e, ui );
            }
        })
    }
    var Tabs = $.factory({
        inherit: Widget.Class,
        active: function(index, callback){
            var ui = this, section = ui.sections.eq(~~index), active = ui.active_class;
            if( !section.hasClass( active) ){
                ui.target.find("."+active).removeClass( active );
                section.addClass( active );
                callback && callback.call( ui,index)
            }
        },
        //在第几个之后添加一个新切换卡
        add: function(index, trigger, panel ){
            var ui = this, section = ui.sections.eq(~~index), t = $.tag;
            section.after( t("div class="+ui.section_class,
                t("div class="+ui.trigger_class, trigger) +
                t("div class="+ui.panel_class, panel) ) )

            ui.sections = ui.target.find("." + ui.section_class );
        },
        remove: function(index,callback){
            var ui = this, section = ui.sections.eq(~~index)
            if( section.length ){
                section.remove();
                ui.sections = ui.target.find("." + ui.section_class );
                callback && callback.call( ui,index)
            }
        }
    });

    $.fn.tabs = Widget.create("tabs", Tabs, init )

})


//2012.2.25  v1
//2012.3.3   v2
//2012.3.4   v3