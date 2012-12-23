!function ($) {

    "use strict"; // jshint ;_;


    /* CAROUSEL CLASS DEFINITION
  * ========================= */

    var Carousel = function (element, options) {
        this.$element = $(element)
        this.options = options
        //绑定事件
        this.options.pause == 'hover' && this.$element
        .on('mouseenter', $.proxy(this.pause, this))
        .on('mouseleave', $.proxy(this.cycle, this))
    }

    Carousel.prototype = {

        cycle: function (e) {
            if (!e) this.paused = false
            this.options.interval
            && !this.paused
            && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))
            return this
        }
        //这个用于指定小格子切换
        ,
        to: function (pos) {
            var $active = this.$element.find('.item.active')
            , children = $active.parent().children()
            , activePos = children.index($active)
            , that = this

            if (pos > (children.length - 1) || pos < 0) return

            if (this.sliding) {
                return this.$element.one('slid', function () {
                    that.to(pos)
                })
            }

            if (activePos == pos) {
                return this.pause().cycle()
            }

            return this.slide(pos > activePos ? 'next' : 'prev', $(children[pos]))
        }

        ,
        pause: function (e) {
            if (!e) this.paused = true
            if (this.$element.find('.next, .prev').length && $.support.transition.end) {
                this.$element.trigger($.support.transition.end)
                this.cycle()
            }
            clearInterval(this.interval)
            this.interval = null
            return this
        }

        ,
        next: function () {
            if (this.sliding) return
            return this.slide('next')
        }

        ,
        prev: function () {
            if (this.sliding) return
            return this.slide('prev')
        }

        ,
        slide: function (type, next) {
            var $active = this.$element.find('.item.active')
            , $next = next || $active[type]()//这里是通过jQuery的next, prev方法得到下一张图，非常巧妙
            , isCycling = this.interval
            , direction = type == 'next' ? 'left' : 'right'
            , fallback  = type == 'next' ? 'first' : 'last'
            , that = this
            , e

            this.sliding = true

            isCycling && this.pause()//立即切换到下一张

            $next = $next.length ? $next : this.$element.find('.item')[fallback]()

            e = $.Event('slide', {
                relatedTarget: $next[0]
            })

            if ($next.hasClass('active')) return

            if ($.support.transition && this.$element.hasClass('slide')) {
                this.$element.trigger(e)
                if (e.isDefaultPrevented()) return
                $next.addClass(type)
                $next[0].offsetWidth // force reflow
                $active.addClass(direction)
                $next.addClass(direction)
                this.$element.one($.support.transition.end, function () {
                    $next.removeClass([type, direction].join(' ')).addClass('active')
                    $active.removeClass(['active', direction].join(' '))
                    that.sliding = false
                    setTimeout(function () {
                        that.$element.trigger('slid')
                    }, 0)
                })
            } else {
                this.$element.trigger(e)
                if (e.isDefaultPrevented()) return
                $active.removeClass('active')
                $next.addClass('active')
                this.sliding = false
                this.$element.trigger('slid')
            }

            isCycling && this.cycle()

            return this
        }

    }


    /* CAROUSEL PLUGIN DEFINITION
  * ========================== */

    var old = $.fn.carousel

    $.fn.carousel = function (option) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('carousel')
            , options = $.extend({}, $.fn.carousel.defaults, typeof option == 'object' && option)
            , action = typeof option == 'string' ? option : options.slide
            if (!data) $this.data('carousel', (data = new Carousel(this, options)))
            if (typeof option == 'number') data.to(option)
            else if (action) data[action]()
            else if (options.interval) data.cycle()
        })
    }
    //.carousel('cycle')
    //Cycles through the carousel items from left to right.
    //.carousel('pause')
    //Stops the carousel from cycling through items.
    //.carousel(number)
    //Cycles the carousel to a particular frame (0 based, similar to an array).
    //.carousel('prev')
    //Cycles to the previous item.
    //.carousel('next')
    //Cycles to the next item.
    $.fn.carousel.defaults = {
        interval: 5000
        ,
        pause: 'hover'
    }

    $.fn.carousel.Constructor = Carousel


    /* CAROUSEL NO CONFLICT
  * ==================== */

    $.fn.carousel.noConflict = function () {
        $.fn.carousel = old
        return this
    }

    /* CAROUSEL DATA-API
  * ================= */

    $(document).on('click.carousel.data-api', '[data-slide]', function (e) {
        var $this = $(this), href
        //$target为旋转木马的容器
        , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
        //其实这里还有个选择，可以一直往上找类名为carousel的祖先
        , options = $.extend({}, $target.data(), $this.data())
        $target.carousel(options)
        e.preventDefault()
    })

//  $(function(){
//      $(".carousel").carousel()
//  })

}(window.jQuery);