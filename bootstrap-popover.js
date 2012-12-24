
!function ($) {

    "use strict"; // jshint ;_;


    /* POPOVER PUBLIC CLASS DEFINITION
  * =============================== */

    var Popover = function (element, options) {
        this.init('popover', element, options)
    }


    /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
     ========================================== */

    Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype, {

        constructor: Popover

        , 
        setContent: function () {
            var $tip = this.tip()//取得模板
            , title = this.getTitle()//取得标题
            , content = this.getContent()//取得正文

            $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
            $tip.find('.popover-content')[this.options.html ? 'html' : 'text'](content)
            //移除原先的所有位置与特效的类名
            $tip.removeClass('fade top bottom left right in')
        }

        , 
        hasContent: function () {
            return this.getTitle() || this.getContent()
        }

        , 
        getContent: function () {
            var content
            , $e = this.$element
            , o = this.options

            content = $e.attr('data-content')
            || (typeof o.content == 'function' ? o.content.call($e[0]) :  o.content)

            return content
        }

        , 
        tip: function () {
            if (!this.$tip) {
                this.$tip = $(this.options.template)
            }
            return this.$tip
        }

        , 
        destroy: function () {
            this.hide().$element.off('.' + this.type).removeData(this.type)
        }

    })


    /* POPOVER PLUGIN DEFINITION
  * ======================= */

    var old = $.fn.popover

    $.fn.popover = function (option) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('popover')
            , options = typeof option == 'object' && option
            if (!data) $this.data('popover', (data = new Popover(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.popover.Constructor = Popover

    $.fn.popover.defaults = $.extend({} , $.fn.tooltip.defaults, {
        placement: 'right'
        , 
        trigger: 'hover'
        , 
        content: ''//模板结构比tooltip复杂一点，用于放置更多的内容
        , 
        template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"></div></div></div>'
    })


    /* POPOVER NO CONFLICT
  * =================== */

    $.fn.popover.noConflict = function () {
        $.fn.popover = old
        return this
    }

}(window.jQuery);