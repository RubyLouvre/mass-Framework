define("tab","$node,$event,$attr,$css".split(","),function(){

    var Tab = $.factory({
        init: function(el, opts){
            this.element = $(el)
        },
        show: function(){
            var $this = this.element
            , $ul = $this.closest('ul:not(.dropdown-menu)')
            , selector = $this.attr('data-target')
            , previous
            , $target;

            if (!selector) {
                selector = $this.attr('href')
                selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
            }

            if ( $this.parent('li').hasClass('active') )
                return

            previous = $ul.find('.active a').last()[0]

            $this.fire("show",previous)

   
            $target = $(selector)

            this.activate($this.parent('li'), $ul)
            this.activate($target, $target.parent(), function () {
                $this.fire("shown",previous)
            })
        },
        activate: function ( element, container, callback) {
            var $active = container.find('> .active')
            , transition = callback
                && $.support.transition
                && $active.hasClass('fade')

            function next() {
                $active
                .removeClass('active')
                .find('> .dropdown-menu > .active')
                .removeClass('active')

                element.addClass('active')

                if (transition) {
                    element[0].offsetWidth // reflow for transition
                    element.addClass('in')
                } else {
                    element.removeClass('fade')
                }

                if ( element.parent('.dropdown-menu') ) {
                    element.closest('li.dropdown').addClass('active')
                }

                callback && callback()
            }

            transition ?
                $active.one($.support.transition.end, next) :
                next()

            $active.removeClass('in')
        }

    })


    /* TAB PLUGIN DEFINITION
     * ===================== */

    $.fn.tab = function ( option ) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('tab')
            if (!data) $this.data('tab', (data = new Tab(this)))
            if (typeof option == 'string')
                data[option]()
        })
    }

    $.fn.tab.Constructor = Tab


    /* TAB DATA-API
     * ============ */

    $.require("ready", function(){
        $('body').on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
            e.preventDefault()
            $(this).tab('show')
        })
    })

})