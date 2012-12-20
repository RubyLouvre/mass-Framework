!function ($) {

    "use strict"; // jshint ;_;

    /* BUTTON PUBLIC CLASS DEFINITION
  * ============================== */
    var Button = function (element, options) {
        this.$element = $(element)
        this.options = $.extend({}, $.fn.button.defaults, options)
    }

    Button.prototype.setState = function (state) {
        var d = 'disabled'
        , $el = this.$element
        , data = $el.data()
        , val = $el.is('input') ? 'val' : 'html'//如果是button标签，使用html方法

        state = state + 'Text'
        //如果是reset，则变成resetText保留起来，换言之reset对框架而言是个保留字
        data.resetText || $el.data('resetText', $el[val]())
        //切换文本
        $el[val](data[state] || this.options[state])
        //如果是loading，那么它就添加一个disabled类名与disabled属性，换言之reset对框架而言是个保留字
        setTimeout(function () {
            state == 'loadingText' ?
            $el.addClass(d).attr(d, d) :
            $el.removeClass(d).removeAttr(d)
        }, 0)
    }
    //这个用于按钮组，通过$().button('toggle')调用
    Button.prototype.toggle = function () {
        var $parent = this.$element.closest('[data-toggle="buttons-radio"]')
        //radio具有排他性，只有一个按钮组只有一个按钮存在激活状态
        $parent && $parent
        .find('.active')
        .removeClass('active')
      
        this.$element.toggleClass('active')
    }


    var old = $.fn.button

    /* BUTTON PLUGIN DEFINITION
  * ======================== */
    $.fn.button = function (option) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('button')
            , options = typeof option == 'object' && option
            //重复利用之前的实例
            if (!data) $this.data('button', (data = new Button(this, options)))
            if (option == 'toggle') data.toggle()
            else if (option) data.setState(option)
        })
    }

    $.fn.button.defaults = {
        loadingText: 'loading...'
    }

    $.fn.button.Constructor = Button

    /* BUTTON NO CONFLICT
  * ================== */
    $.fn.button.noConflict = function () {
        $.fn.button = old
        return this
    }

    /* BUTTON DATA-API
  * =============== */
 //为存在data-toggle属性，并且其值以button开头的按钮绑定点击事件
    $(document).on('click.button.data-api', '[data-toggle^=button]', function (e) {
        var $btn = $(e.target)
        if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
        $btn.button('toggle')
    })

}(window.jQuery);