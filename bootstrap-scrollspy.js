!function ($) {

    "use strict"; // jshint ;_;

    /* SCROLLSPY CLASS DEFINITION
  * ========================== */

    function ScrollSpy(element, options) {
        //将实例绑到回调的this中
        var process = $.proxy(this.process, this)
        //决定绑定滚动事件的元素
        , $element = $(element).is('body') ? $(window) : $(element)
        , href
        this.options = $.extend({}, $.fn.scrollspy.defaults, options)
        //绑定事件
        this.$scrollElement = $element.on('scroll.scroll-spy.data-api', process)
        //取得要监控的元素的CSS表达式：1 通过data-target指定 2 通过href属性得到 （监控元素必须是一个位于LI元素的链接）
        this.selector = (this.options.target 
            || ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
            || '') + ' .nav li > a' //第2种情况作为导航元素的某个菜单的链接存在

        this.$body = $('body')
        this.refresh()
        //先执行一次，高亮其中某个
        this.process()
    }

    ScrollSpy.prototype = {

        constructor: ScrollSpy

        , 
        refresh: function () {
            var self = this
            this.offsets = $([])
            this.targets = $([])

            this.$body
            .find(this.selector)
            .map(function () {
                var $el = $(this)
                , href = $el.data('target') || $el.attr('href')
                , $href = /^#\w/.test(href) && $(href)
                return ( $href
                    && $href.length //返回一个二维数组，它到页面顶部的距离及href的值
                    && [[ $href.position().top + self.$scrollElement.scrollTop(), href ]] ) || null
            })
            .sort(function (a, b) {
                return a[0] - b[0]
            })
            .each(function () {
                self.offsets.push(this[0])//收集偏离值
                self.targets.push(this[1])//收集href值（ID值）
            })
            //self.targets里都是ID选择器
        }

        , 
        process: function () {
            var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
            , scrollHeight = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight
            //最大可以滚动的高度
            , maxScroll = scrollHeight - this.$scrollElement.height()
            , offsets = this.offsets
            , targets = this.targets
            , activeTarget = this.activeTarget
            , i

            if (scrollTop >= maxScroll) {
                return activeTarget != (i = targets.last()[0])
                && this.activate ( i )
            }

            for (i = offsets.length; i--;) {
                activeTarget != targets[i]
                && scrollTop >= offsets[i]//遍历offset中，寻找一个最接近顶部的元素
                && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
                && this.activate( targets[i] )
            }
        }

        , 
        activate: function (target) {
            var active
            , selector
            this.activeTarget = target//重写activeTarget

            $(this.selector)
            .parent('.active')
            .removeClass('active')
            //取得新的要高亮的元素
            selector = this.selector
            + '[data-target="' + target + '"],'
            + this.selector + '[href="' + target + '"]'
            //#navbarExample .nav li > a[data-target="#doomsday"],#navbarExample .nav li > a[href="#doomsday"]
            active = $(selector)
            .parent('li')
            .addClass('active')

            if (active.parent('.dropdown-menu').length)  {
                active = active.closest('li.dropdown').addClass('active')
            }
            active.trigger('activate')
        }

    }


    /* SCROLLSPY PLUGIN DEFINITION
  * =========================== */

    var old = $.fn.scrollspy

    $.fn.scrollspy = function (option) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('scrollspy')
            , options = typeof option == 'object' && option
            if (!data) $this.data('scrollspy', (data = new ScrollSpy(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.scrollspy.Constructor = ScrollSpy

    $.fn.scrollspy.defaults = {
        offset: 10
    }


    /* SCROLLSPY NO CONFLICT
  * ===================== */

    $.fn.scrollspy.noConflict = function () {
        $.fn.scrollspy = old
        return this
    }


    /* SCROLLSPY DATA-API
  * ================== */

    $(window).on('load', function () {
        //取得元素上带data-spy="scroll"的元素（它是一个带滚动条的容器）
        $('[data-spy="scroll"]').each(function () {
            var $spy = $(this);
            $spy.scrollspy($spy.data());//收集其所有data-*属性，组成配置对象与默认配置合并
        })
    })

}(window.jQuery);