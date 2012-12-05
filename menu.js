define("menu", ["node","attr","css","event","fx"], function($){

    $.fn.menu = function(op){
        var ui = $.fn.menu,  c = ui.c, id,
        $arrow = '<span class="'+c.arrowClass+'"> &#187;</span>',
        o = $.Object.merge({}, ui.defaults,op || {});
        this.addClass(c.menuClass).find('li:has(ul)').each(function() {
            if (o.autoArrows) {
                $('>a:first-child',this).addClass(c.anchorClass).append($arrow);
            }
        });
        if(o.vertical){
            this.addClass(o.verticalClass);
        }
        this.find("li").mouseenter(function(){
            var $$ = $(this);
            clearTimeout(id);
            $$.addClass(o.hoverClass).find("li."+o.hoverClass).removeClass(o.hoverClass)
            $$.siblings().removeClass(o.hoverClass)
            o.onShow(this)     
        }).mouseleave(function(){
            clearTimeout(id);
            var $$ = $(this);
            id = setTimeout(function(){
                $$.removeClass(o.hoverClass)
                o.onHide($$[0])
            },o.delay)
        })

    };
    $.mix( $.fn.menu,{
        c: {
            bcClass     : 'ui-breadcrumb',
            menuClass   : 'js-menu',
            anchorClass : 'js-with-ul',
            arrowClass  : 'js-sub-indicator',
            shadowClass : 'js-menu-shadow'
        },
        defaults: {
            hoverClass	: 'js-menu-hover',
            verticalClass   : "js-menu-vertical",
            delay		: 500,
            autoArrows	: true,
            dropShadows     : true,
            disableHI	: false,		// true disables hoverIntent detection
            onShow	       : function(){},
            onHide	       : function(){}
        }
    })

    return $;
})
