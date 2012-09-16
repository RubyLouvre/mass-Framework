define("panel",["$node","$event","$css"], function(){
    $.ui = $.ui || {};
    $.ui.Panel = $.factory({
        init: function(opts){

            var html = '<div class="panel_wrap"><div class="panel_header"><div class="panel_title"></div><span class="panel_closer"></span></div><div class="panel_body"></div></div>'
            var parent = opts.parent || "body";
            var ui = $(html).appendTo(parent);
            
            ui.find(".panel_title").html( opts.title || "")
            ui.find(".panel_body").html( opts.body || "");

            ui.width( opts.width || 400 );
            ui.height( opts.height || 200 );
            ui.css( opts.css || {} );
            //closer为布尔
            if(opts.closer == false){
                ui.find(".panel_closer").hide()
            }
        }
    })

})
