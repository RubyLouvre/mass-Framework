$.define("inview", "event", function(){

    function check_inview() {
        var vpH = $(window).height(),
        scrolltop = (document.documentElement.scrollTop ?  document.documentElement.scrollTop : document.body.scrollTop),
        elems = [];
        //取得所有绑定了此事件的元素
        $.Object.forEach($.memcache, function(el){
            if(el.events && el.events.inview){
                elems.push(el.callback.target);
            }
        });

        if (elems.length) {
            elems.forEach(function (elem) {
                var $el = $(elem),
                top = $el.offset().top,
                height = $el.height(),
                inview = $el.data('inview') || false;
                if (scrolltop > (top + height) || scrolltop + vpH < top) {
                    if (inview) {
                        $el.data( 'inview', false );
                        $el.fire( 'inview', false );
                    }
                } else if (scrolltop < (top + height)) {
                    var visPart = ( scrolltop > top ? 'bottom' : (scrolltop + vpH) < (top + height) ? 'top' : 'both' );
                    if (!inview || inview !== visPart) {
                        $el.data('inview', visPart);
                        $el.fire( 'inview', true, visPart);
                    }
                }
            });
        }
    }
//https://github.com/zuk/jquery.inview
    $(window).scroll(check_inview);
    $(window).resize(check_inview);
    $(window).click(check_inview);
    $.require("ready",check_inview);
    
});

