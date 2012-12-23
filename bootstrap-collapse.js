!function ($) {

    "use strict"; // jshint ;_;


    /* COLLAPSE PUBLIC CLASS DEFINITION
  * ================================ */

    var Collapse = function (element, options) {
        this.$element = $(element)//对应 accordion-body
        this.options = $.extend({}, $.fn.collapse.defaults, options)

        if (this.options.parent) {
            this.$parent = $(this.options.parent)
        }

        this.options.toggle && this.toggle()
    }

    Collapse.prototype = {

        constructor: Collapse

        ,
        dimension: function () {
            var hasWidth = this.$element.hasClass('width')
            return hasWidth ? 'width' : 'height'
        }

        ,
        show: function () {
            var dimension
            , scroll
            , actives
            , hasData

            if (this.transitioning) return

            dimension = this.dimension()
            //如果没有指明width类名
            scroll = $.camelCase(['scroll', dimension].join('-'))//求得scrollWidth 或scrollHeight
            //找到这个手风琴组件的所有展开的面板
            actives = this.$parent && this.$parent.find('> .accordion-group > .in')
            //然后合上它们
            if (actives && actives.length) {
                hasData = actives.data('collapse')
                if (hasData && hasData.transitioning) return
                actives.collapse('hide')//合上它们,并削去它们的实例
                hasData || actives.data('collapse', null)
            }
            //让当前面板的高度或宽度为零
            this.$element[dimension](0)
            //开始动画与触发事件
            this.transition('addClass', $.Event('show'), 'shown')

            $.support.transition && this.$element[dimension](this.$element[0][scroll])
        }

        ,
        hide: function () {
            var dimension
            if (this.transitioning) return
            dimension = this.dimension()
            this.reset(this.$element[dimension]())
            this.transition('removeClass', $.Event('hide'), 'hidden')
            this.$element[dimension](0)
        }

        ,
        reset: function (size) {
            var dimension = this.dimension()

            this.$element
            .removeClass('collapse')
            [dimension](size || 'auto')//还原为原来的大小
            [0].offsetWidth

            this.$element[size !== null ? 'addClass' : 'removeClass']('collapse')

            return this
        }

        ,
        transition: function (method, startEvent, completeEvent) {
            var that = this
            , complete = function () {
                if (startEvent.type == 'show') that.reset()
                that.transitioning = 0
                that.$element.trigger(completeEvent)
            }

            this.$element.trigger(startEvent)

            if (startEvent.isDefaultPrevented()) return

            this.transitioning = 1
            //添加或移除类名in
            this.$element[method]('in')

            $.support.transition && this.$element.hasClass('collapse') ?
            this.$element.one($.support.transition.end, complete) :
            complete()
        }

        ,
        toggle: function () {//最重要的方法
            this[this.$element.hasClass('in') ? 'hide' : 'show']()
        }

    }


    /* COLLAPSE PLUGIN DEFINITION
  * ========================== */

    var old = $.fn.collapse

    $.fn.collapse = function (option) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('collapse')
            , options = typeof option == 'object' && option
            if (!data) $this.data('collapse', (data = new Collapse(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.collapse.defaults = {
        toggle: true
    }

    $.fn.collapse.Constructor = Collapse


    /* COLLAPSE NO CONFLICT
  * ==================== */

    $.fn.collapse.noConflict = function () {
        $.fn.collapse = old
        return this
    }


    /* COLLAPSE DATA-API
  * ================= */

    $(document).on('click.collapse.data-api', '[data-toggle=collapse]', function (e) {
        var $this = $(this), href
        , target = $this.attr('data-target') //取得它要展开或折叠的区域,1通过'data-target'
        || e.preventDefault() //2通过href
        || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
        , option = $(target).data('collapse') ? 'toggle' : $this.data()
        $this[$(target).hasClass('in') ? 'addClass' : 'removeClass']('collapsed')//?在CSS中没有看到此类名
        $(target).collapse(option)//初始化手风琴 bootstrap有个特点,都是点击时才开始初始化组件
    })

}(window.jQuery);

//http://www.hongkiat.com/blog/css-content-accordion/
//http://designmodo.com/css3-accordion-menu/
//http://bloomwebdesign.net/myblog/2012/05/create-a-vertical-accordion-menu-using-css3-tutorial/
//http://www.red-team-design.com/css3-accordion