!function ($) {

    "use strict"; // jshint ;_;


    /* TOOLTIP PUBLIC CLASS DEFINITION
  * =============================== */

    var Tooltip = function (element, options) {
        this.init('tooltip', element, options)
    }

    Tooltip.prototype = {

        constructor: Tooltip

        , 
        init: function (type, element, options) {
            var eventIn
            , eventOut

            this.type = type
            this.$element = $(element)
            this.options = this.getOptions(options)
            this.enabled = true
            //默认是使用hover
            if (this.options.trigger == 'click') {
                this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
            } else if (this.options.trigger != 'manual') {
                eventIn = this.options.trigger == 'hover' ? 'mouseenter' : 'focus'
                eventOut = this.options.trigger == 'hover' ? 'mouseleave' : 'blur'
                this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
                this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
            }
//如果使用事件代理，会多出个_options
            this.options.selector ?
            (this._options = $.extend({}, this.options, {
                trigger: 'manual', 
                selector: ''
            })) :
            this.fixTitle()
        }

        , 
        getOptions: function (options) {
            //抽取其data-*作配置对象
            options = $.extend({}, $.fn[this.type].defaults, options, this.$element.data())
            //处理参数，如果没有分别指明show与hide的延迟时间，那么它们两者都一样，默认为零
            if (options.delay && typeof options.delay == 'number') {
                options.delay = {
                    show: options.delay, 
                    hide: options.delay
                }
            }

            return options
        }

        , 
        enter: function (e) {
            var self = $(e.currentTarget)[this.type](this._options).data(this.type)

            if (!self.options.delay || !self.options.delay.show) return self.show()

            clearTimeout(this.timeout)
            self.hoverState = 'in'
            this.timeout = setTimeout(function() {//开始动画
                if (self.hoverState == 'in') self.show()
            }, self.options.delay.show)
        }

        , 
        leave: function (e) {
            var self = $(e.currentTarget)[this.type](this._options).data(this.type)

            if (this.timeout) clearTimeout(this.timeout)
            if (!self.options.delay || !self.options.delay.hide) return self.hide()

            self.hoverState = 'out'
            this.timeout = setTimeout(function() {
                if (self.hoverState == 'out') self.hide()
            }, self.options.delay.hide)
        }

        , 
        show: function () {
            var $tip
            , inside
            , pos
            , actualWidth
            , actualHeight
            , placement
            , tp

            if (this.hasContent() && this.enabled) {
                $tip = this.tip()
                this.setContent()

                if (this.options.animation) {
                    $tip.addClass('fade')
                }

                placement = typeof this.options.placement == 'function' ?
                this.options.placement.call(this, $tip[0], this.$element[0]) :
                this.options.placement

                inside = /in/.test(placement)

                $tip
                .detach()
                .css({
                    top: 0, 
                    left: 0, 
                    display: 'block'
                })
                .insertAfter(this.$element)

                pos = this.getPosition(inside)

                actualWidth = $tip[0].offsetWidth
                actualHeight = $tip[0].offsetHeight
//处理位置
                switch (inside ? placement.split(' ')[1] : placement) {
                    case 'bottom':
                        tp = {
                            top: pos.top + pos.height, 
                            left: pos.left + pos.width / 2 - actualWidth / 2
                            }
                        break
                    case 'top':
                        tp = {
                            top: pos.top - actualHeight, 
                            left: pos.left + pos.width / 2 - actualWidth / 2
                            }
                        break
                    case 'left':
                        tp = {
                            top: pos.top + pos.height / 2 - actualHeight / 2, 
                            left: pos.left - actualWidth
                            }
                        break
                    case 'right':
                        tp = {
                            top: pos.top + pos.height / 2 - actualHeight / 2, 
                            left: pos.left + pos.width
                            }
                        break
                }

                $tip
                .offset(tp)
                .addClass(placement)
                .addClass('in')
            }
        }

        , 
        setContent: function () {
            var $tip = this.tip()
            , title = this.getTitle()

            $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
            $tip.removeClass('fade in top bottom left right')
        }

        , 
        hide: function () {
            var that = this
            , $tip = this.tip()

            $tip.removeClass('in')

            function removeWithAnimation() {
                var timeout = setTimeout(function () {
                    $tip.off($.support.transition.end).detach()
                }, 500)

                $tip.one($.support.transition.end, function () {
                    clearTimeout(timeout)
                    $tip.detach()
                })
            }

            $.support.transition && this.$tip.hasClass('fade') ?
            removeWithAnimation() :
            $tip.detach()

            return this
        }

        , 
        fixTitle: function () {
            var $e = this.$element
            //保存原来的title到data-original-title，然后移除title
            if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
                $e.attr('data-original-title', $e.attr('title') || '').removeAttr('title')
            }
        }

        , 
        hasContent: function () {
            return this.getTitle()
        }

        , 
        getPosition: function (inside) {
            return $.extend({}, (inside ? {
                top: 0, 
                left: 0
            } : this.$element.offset()), {
                width: this.$element[0].offsetWidth
                , 
                height: this.$element[0].offsetHeight
            })
        }

        , 
        getTitle: function () {//取得弹出层的内容
            var title
            , $e = this.$element
            , o = this.options

            title = $e.attr('data-original-title')
            || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

            return title
        }

        , 
        tip: function () {//取得模板
            return this.$tip = this.$tip || $(this.options.template)
        }

        , 
        validate: function () {
            if (!this.$element[0].parentNode) {
                this.hide()
                this.$element = null
                this.options = null
            }
        }

        , 
        enable: function () {
            this.enabled = true
        }

        , 
        disable: function () {
            this.enabled = false
        }

        , 
        toggleEnabled: function () {
            this.enabled = !this.enabled
        }

        , 
        toggle: function (e) {
            var self = $(e.currentTarget)[this.type](this._options).data(this.type)
            self[self.tip().hasClass('in') ? 'hide' : 'show']()
        }

        , 
        destroy: function () {
            this.hide().$element.off('.' + this.type).removeData(this.type)
        }

    }


    /* TOOLTIP PLUGIN DEFINITION
  * ========================= */

    var old = $.fn.tooltip

    $.fn.tooltip = function ( option ) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('tooltip')
            , options = typeof option == 'object' && option
            if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.tooltip.Constructor = Tooltip

    $.fn.tooltip.defaults = {
        animation: true
        , 
        placement: 'top'
        , 
        selector: false
        , 
        template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
        , 
        trigger: 'hover'
        , 
        title: ''
        , 
        delay: 0
        , 
        html: false
    }


    /* TOOLTIP NO CONFLICT
  * =================== */

    $.fn.tooltip.noConflict = function () {
        $.fn.tooltip = old
        return this
    }

}(window.jQuery);
