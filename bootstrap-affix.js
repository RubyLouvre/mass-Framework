
!function ($) {

    "use strict"; // jshint ;_;


    /* AFFIX CLASS DEFINITION
  * ====================== */

    var Affix = function (element, options) {
        this.options = $.extend({}, $.fn.affix.defaults, options)
        this.$window = $(window)//只要是绑定事件
        .on('scroll.affix.data-api', $.proxy(this.checkPosition, this))
        .on('click.affix.data-api',  $.proxy(function () {
            setTimeout($.proxy(this.checkPosition, this), 1)
        }, this))//当我们移动或点击时自动进行修正
        this.$element = $(element)
        this.checkPosition()
    }

    Affix.prototype.checkPosition = function () {
        if (!this.$element.is(':visible')) return

        var scrollHeight = $(document).height()
        , scrollTop = this.$window.scrollTop()
        , position = this.$element.offset()
        , offset = this.options.offset
        , offsetBottom = offset.bottom
        , offsetTop = offset.top
        , reset = 'affix affix-top affix-bottom'
        , affix

        if (typeof offset != 'object') offsetBottom = offsetTop = offset
        if (typeof offsetTop == 'function') offsetTop = offset.top()
        if (typeof offsetBottom == 'function') offsetBottom = offset.bottom()
        //比较当前元素到顶部的距离与window.pageYOffset的差
        //通过affix-top affix-bottom这两个类名移除固定效果
        affix = this.unpin != null && (scrollTop + this.unpin <= position.top) ?
        false    : offsetBottom != null && (position.top + this.$element.height() >= scrollHeight - offsetBottom) ?
        'bottom' : offsetTop != null && scrollTop <= offsetTop ?
        'top'    : false

        if (this.affixed === affix) return

        this.affixed = affix
        this.unpin = affix == 'bottom' ? position.top - scrollTop : null

        this.$element.removeClass(reset).addClass('affix' + (affix ? '-' + affix : ''))
    }


    /* AFFIX PLUGIN DEFINITION
  * ======================= */

    var old = $.fn.affix

    $.fn.affix = function (option) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('affix')
            , options = typeof option == 'object' && option
            if (!data) $this.data('affix', (data = new Affix(this, options)))
            if (typeof option == 'string') data[option]()//这里是无效的,因为它只有一个checkPosition方法,而这方法会自动调用
        })
    }

    $.fn.affix.Constructor = Affix

    $.fn.affix.defaults = {
        offset: 0
    }


    /* AFFIX NO CONFLICT
  * ================= */

    $.fn.affix.noConflict = function () {
        $.fn.affix = old
        return this
    }


    /* AFFIX DATA-API
  * ============== */

    $(window).on('load', function () {
        //取得页面上所有带[data-spy="affix"]的元素,它此外还有个像data-offset-top=50 data-offset-bottom=10的属性
        $('[data-spy="affix"]').each(function () {
            var $spy = $(this)
            , data = $spy.data()

            data.offset = data.offset || {}//在其缓存对象上开辟一个空间
            //放入差值
            data.offsetBottom && (data.offset.bottom = data.offsetBottom)
            data.offsetTop && (data.offset.top = data.offsetTop)

            $spy.affix(data)
        })
    })


}(window.jQuery);