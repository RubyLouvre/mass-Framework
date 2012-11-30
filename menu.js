define("menu", ["node","attr","css","event","fx"], function($){

    $.fn.superfish = function(op){

        var sf = $.fn.superfish,  c = sf.c,
        $arrow = '<span class="'+c.arrowClass+'"> &#187;</span>'
   
        var o = $.Object.merge({}, sf.defaults,op || {});
        this.addClass(c.menuClass).find('li:has(ul)').each(function() {
            if (o.autoArrows) {
                $('>a:first-child',this).addClass(c.anchorClass).append($arrow);
            }
        })
        var id 
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

    var sf = $.fn.superfish;
    sf.o = [];
    sf.IE7fix = function(){
        var o = sf.op;
        if (window.VBArray && window.XMLHttpRequest && o.dropShadows && o.animation.opacity!=undefined)
            this.toggleClass(sf.c.shadowClass+'-off');
    };
    sf.c = {
        bcClass     : 'sf-breadcrumb',
        menuClass   : 'sf-js-enabled',
        anchorClass : 'sf-with-ul',
        arrowClass  : 'sf-sub-indicator',
        shadowClass : 'sf-shadow'
    };
    sf.defaults = {
        hoverClass	: 'sfHover',
        delay		: 500,
        autoArrows	: true,
        dropShadows     : true,
        disableHI	: false,		// true disables hoverIntent detection
        onShow		: function(){},
        onHide		: function(){}
    };

    return $;
})
