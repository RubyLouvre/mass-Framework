$.define("switchable","more/uibase,event,attr,fx",function(Widget){
    var defaults = {
        trigger_class:  "trigger",
        panel_class:    "panel",
        active_class:   "active",
        active_event:   "click",
        active_callback: $.noop,
        pause_over_panel: false,
        autoplay: false,
        switch_out: $.noop,//收起
        switch_out_args: 500,
        switch_in: $.noop,
        switch_in_args: [500],
        interval: 1000
    }

    var createHTML = function( data, ui){
        var t = $.tag, html = '<div class="mass_switchable">'
        for(var i =0 ,el; el = data[i++];){
            html += (el.trigger ? t("div class="+ui.trigger_class, el.trigger) : '') +
            (el.panel ?  t("div class="+ui.panel_class, el.panel) : '')
        }
        html += "</div>"
        return $(html).appendTo(ui.parent);
    }
    function reset(ui){
        ui.triggers = ui.parent.find("." + ui.trigger_class );
        ui.panels = ui.parent.find("." + ui.panel_class );
    }

    function init( ui, hash ){
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        if(typeof ui.data_expr === "string" && ui.data_expr.length > 1){
            ui.target = $(ui.data_expr);//选中页面上类似结构的HTML作为ui实体
        }else{
            ui.target = createHTML(ui.data, ui)//创建一个ui实体
        }
        delete ui.data;//考虑有时它的HTML结构会很庞大，没有必要储存它
        reset(ui);//重新设置triggers与panels集合
        ui.active(0);//高亮第一个trigger与展开第一个panel
        //当点击某一个trigger时，展开与之对应的panel
        ui.parent.delegate("."+ ui.trigger_class, ui.active_event+".switchable", function( e ){
            var index = ui.triggers.index( $(e.target).closest("."+ui.trigger_class));
            ui.active(index, ui.active_callback, e);
        });
        //如果pause_over_panel为true，则移到控件上方停止切换，移走恢复
        if( ui.pause_over_panel ){
            ui.target.bind( "mouseenter", function( e ){
                ui.pause();
            }).bind("mouseleave", function( e ){
                if(!ui.autoplay){
                    ui.autoplay = true;
                    ui.play()
                }
            });
        }
        // autoplay_callback
        if(ui.autoplay){
            ui.play()
        }

    }
    var Swichable = $.factory({
        inherit: Widget.Class,
        //切换到某一面板
        active: function(index, callback, e){
            var ui = this, i = index,
            curr = ui.panels.eq( i ) ,
            active = ui.active_class,
            args =  ui.switch_out_args;
            callback = callback || ui.active_callback;
            if( ui.autoplay && !curr[0]){//如果越界了就回到第一个面板
                curr = ui.panels.eq(i = 0);
            }
            ui.active_index = i;
            if( !curr.hasClass( active ) ){
                var prev = ui.panels.filter("."+active);
                //将原来处于激活状态的trigger与panel去掉对应类名
                ui.parent.find("."+active).removeClass( active );
                //收起原来展开的面板
                ui.switch_out[ $.isArray(args) ? "apply" : "call" ]( prev, args );
                //将目标trigger与panel变为激活状态，并展开面板
                curr.addClass( active );
                ui.triggers.eq( ui.active_index ).addClass(active);
                args =  ui.switch_in_args;
                ui.switch_in[ $.isArray(args) ? "apply" : "call" ]( curr, args );
                //执行回调(如果存在)
                callback && callback.call( ui, e || index);
            }
        },
        pause: function(){
            this.autoplay = false;
            clearInterval( this.timer_id );
        },
        play: function(){
            var ui = this;
            ui.timer_id = setInterval(function(){//如果开启了自动轮播功能
                ui.autoplay && ui.active( ++ui.active_index );
            }, ui.interval);
        },
        //添加一组新的trigger与panel，index为它的插入位置
        add: function(index, trigger, panel ){
            var ui = this, reference = ui.triggers.eq(~~index), t = $.tag;
            reference.after(
                t("div class="+ui.trigger_class, trigger) +
                t("div class="+ui.panel_class, panel ) );
            reset(ui);
        },
        //移除指定的trigger与panel
        remove: function(index,callback){
            var ui = this, reference = ui.triggers.eq(~~index)
            if( reference.length ){
                reference.remove();
                reset(ui);
                callback && callback.call(ui, index)
            }
        }
    });

    $.fn.switchable = Widget.create("switchable", Swichable, init )

});