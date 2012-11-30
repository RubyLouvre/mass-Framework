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

        this.find("li").mouseenter(function(){
            var $$ = $(this)
            $$.addClass(o.hoverClass).find("li."+o.hoverClass).removeClass(o.hoverClass)
            $$.siblings().removeClass(o.hoverClass)
            if(o.animation){
                var fx = o.animation;
                fx.after = function(){
                    o.onShow($$[0])       
                }
                $$.find(">ul").fx(o.duration,fx)
            }else{            
                o.onShow(this)     
            }
          
        }).mouseleave(function(){
            $(this).removeClass(o.hoverClass)
            o.onHide(this)
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
        delay		: 300,
        animation	: {
            opacity:'show'
        },
        duration	:700,
        autoArrows	: true,
        dropShadows     : true,
        disableHI	: false,		// true disables hoverIntent detection
        onShow		: function(){},
        onHide		: function(){}
    };

    return $;
})
