//define("menu", ["node","attr","css","event"], function($){
;(function($){
    $.fn.superfish = function(op){

        var sf = $.fn.superfish,  c = sf.c,
        $arrow = '<span class="'+c.arrowClass+'"> &#187;</span>'
        var o = $.extend({},sf.defaults,op);
        //    var o = $.Object.merge({}, sf.defaults,op || {});
        this.addClass(c.menuClass).find('li:has(ul)').each(function() {
            if (o.autoArrows) {
                $('>a:first-child',this).addClass(c.anchorClass).append($arrow);
            }
        })

        this.find("li").mouseenter(function(){
            var $$ = $(this)
            $$.addClass(o.hoverClass).find("li."+o.hoverClass).removeClass(o.hoverClass)
            $$.siblings().removeClass(o.hoverClass)
        }).mouseleave(function(){
            var $$ = $(this)
            $$.removeClass(o.hoverClass)//.parents( 'li.' +o.hoverClass ).removeClass(o.hoverClass)
        })

       
    };

    var sf = $.fn.superfish;
    sf.o = [];
    sf.IE7fix = function(){
        var o = sf.op;
        if ($.browser.msie && $.browser.version > 6 && o.dropShadows && o.animation.opacity!=undefined)
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
        pathClass	: 'overideThisToUse',
        pathLevels	: 1,
        delay		: 300,
        animation	: {
            opacity:'show'
        },
        speed		: 'normal',
        autoArrows	: true,
        dropShadows : true,
        disableHI	: false,		// true disables hoverIntent detection
        onInit		: function(){}, // callback functions
        onBeforeShow: function(){},
        onShow		: function(){},
        onHide		: function(){}
    };

    return $;
})(jQuery)
