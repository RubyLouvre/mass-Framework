$.define("tabs","event,attr",function(){
    var defaults = {
        section_class:  "section",
        trigger_class:  "trigger",
        panel_class:    "panel",
        active_class:   "active",
        active_event:   "click",
        active_callback: $.noop
    }

    function init( ui, hash ){
        if( ui.target ){
            ui.setOptions(defaults , typeof hash === "object" ? hash : {});
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
    }
    var Tabs = $.factory({
        init: function( parent ){
            this.parent = parent;
        },
        invoke: function(method, value){
            if(typeof this[method] === "function"){
               return this[method].apply( this, [].slice.call(arguments,1) );
            }else{
                this[method] = value;
            }
        },
        active: function(index, callback){
            var ui = this, section = ui.sections.eq(~~index), active = ui.active_class;

            if( !section.hasClass( active) ){
                ui.target.find("."+active).removeClass( active );
                section.addClass( active );
                callback && callback.call( ui,index)
            }
        },
        remove: function(index,callback){
            var ui = this, section = ui.sections.eq(~~index)
            if( section.length ){
                section.remove();
                ui.sections = ui.target.find("." + ui.section_class );
                callback && callback.call( ui,index)
            }
        },
        destroy: function(){
           this.target.undelegate("."+ this.trigger_class, this.active_event+".tabs").removeData("_init_tabs");
        }
    });
    $.fn.tabs = function(method){
        var tabs = this.data("_init_tabs")
        if(! tabs  ){
            tabs = new Tabs(this);
            init(tabs, method);
            this.data("_init_tabs",tabs);
        }else if(typeof method == "string"){
            tabs.invoke.apply(tabs, arguments )
        }else if(method && typeof method == "object"){
            tabs.setOptions( method );
        }
        return this;
    }
});


