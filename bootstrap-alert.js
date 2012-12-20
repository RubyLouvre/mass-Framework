!function ($) {

    "use strict"; // jshint ;_;
    /* ALERT CLASS DEFINITION
  * ====================== */
    //这是程序员风格的命名
    var dismiss = '[data-dismiss="alert"]'
    , Alert = function (el) {
        $(el).on('click', dismiss, this.close)
    }
    //它最要的方法 
    Alert.prototype.close = function (e) {
        //获取这个控件对应的DOM
        //分别通过以下三个途径：
        //1 data-target自定义属性 
        //2 href的属性中的hash（也是ID选择器）， 
        //3这个按钮的直属父节点
        var $this = $(this)
        , selector = $this.attr('data-target')
        , $parent
        if (!selector) {
            selector = $this.attr('href')
            selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
        }
        $parent = $(selector)

        e && e.preventDefault()

        $parent.length || ($parent = $this.hasClass('alert') ? $this : $this.parent())

        $parent.trigger(e = $.Event('close'))
        //在移除前触发close自定义事件

        if (e.isDefaultPrevented()) return
        //触发CSS3的fade效果，它要与fade类名组合使用
        $parent.removeClass('in')

        function removeElement() {
            $parent
            .trigger('closed')
            .remove()
        //在移除后触发closed自定义事件
        }

        $.support.transition && $parent.hasClass('fade') ?
        $parent.on($.support.transition.end, removeElement) :
        removeElement()
    }


    /* ALERT PLUGIN DEFINITION
  * ======================= */

    var old = $.fn.alert

    $.fn.alert = function (option) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('alert')
            //重复利用实例
            if (!data) $this.data('alert', (data = new Alert(this)))
            //从目前Alert实例的原型来看，这个option只能为close
            if (typeof option == 'string') data[option].call($this)
        })
    }

    $.fn.alert.Constructor = Alert


    /* ALERT NO CONFLICT
  * ================= */

    $.fn.alert.noConflict = function () {
        $.fn.alert = old
        return this
    }

    /* ALERT DATA-API
  * ============== */
    //绑定关闭事件
    $(document).on('click.alert.data-api', dismiss, Alert.prototype.close)

}(window.jQuery);