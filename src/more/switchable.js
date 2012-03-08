$.define("switchable","more/uibase,event,attr,fx",function(Widget){
    var defaults = {
        trigger_class:  "trigger",
        panel_class:    "panel",
        active_class:   "active",
        active_event:   "click",
        active_callback: $.noop,
        pause_over_panel: false,
        autoplay: false,
        switch_in: "slideDown",
        switch_out: "slideUp",
        delay: 500
    }

    var createHTML = function( data, ui){
        var t = $.tag, html = '<div class="mass_switchable">'
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
        if(typeof ui.data_expr === "string" && ui.data_expr.length > 1){
            ui.target = $(ui.data_expr);//选中页面上类似结构的HTML作为ui实体
        }else{
            ui.target = createHTML(ui.data, ui)//创建一个ui实体
        }
        delete ui.data;//考虑有时它的HTML结构会很庞大，没有必要储存它
        reset(ui);//重新设置triggers与panels集合
        ui.panels.hide();//隐藏所有panels
        ui.active(0);//高亮第一个trigger与展开第一个panel
        //当点击某一个trigger时，展开与之对应的panel
        ui.target.delegate("."+ ui.trigger_class, ui.active_event, function( e ){
            var index = ui.triggers.index(e.target);
            ui.active(index, ui.active_callback, e);
        });


        //如果pause_over_panel为true，则移到控件上方停止切换，移走恢复
        if(ui.pause_over_panel){
            ui.target.bind( "mouseenter", function( e ){
                ui.pause();
                $.log("停止切换");
            }).bind("mouseleave", function( e ){
                if(!ui.autoplay){
                    ui.autoplay = true;
                    ui.play()
                    $.log("恢复切换");
                }
            });
        }
        // autoplay_callback
        if(ui.autoplay){
            ui.play()
        }

    }
    var Accordion = $.factory({
        inherit: Widget.Class,
        //切换到某一面板
        active: function(index, callback, e){
            var i = index, ui = this, reference = ui.triggers.eq(i) , active = ui.active_class;
            if( !reference[0]){//如果越界了就回到第一个面板
                reference = ui.triggers.eq(i = 0)
            }
            ui.current_index = i;
            if( !reference.hasClass( active ) ){
                //    ui.panels.stop(1,1);
                //找到当前处于激活状态的trigger与panel，去掉它们的相应类名
                var el = ui.target.find("."+active).removeClass( active )
                //收起原来展开的面板
                ui.panels.eq( ui.triggers.index( el ) ).removeClass( active )[ui.switch_out]( 500 );
                //将目标trigger与panel变为激活状态，并展开面板
                reference.addClass( active );
                ui.panels.eq(i).addClass(active)[ui.switch_in]( 500 );
                callback && callback.call( e ? e.target : ui.target[0], e || ui);
            }
        },
 
        pause: function(){
            this.autoplay = false;
            clearInterval(this.timeoutID)
        },
        play: function(){
            var ui = this;
            ui.timeoutID = setInterval(function(){//如果开启了自动轮播功能
                ui.autoplay && ui.active(++ui.current_index);
            }, ui.delay)
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
                callback && callback.call( ui.target[0], ui)
            }
        }
    });

    $.fn.accordion = Widget.create("switchable", Accordion, init )

});
 //http://www.welefen.com/user-define-rich-content-filter-class.html
 //http://huaban.com/boards/327692/
 //http://www.cnblogs.com/babyzone2004/archive/2010/08/30/1812682.html
