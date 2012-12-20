!function ($) {

    "use strict"; // jshint ;_;


    /* DROPDOWN CLASS DEFINITION
  * ========================= */

    var toggle = '[data-toggle=dropdown]'
    , Dropdown = function (element) {
        var $el = $(element).on('click.dropdown.data-api', this.toggle)
        $('html').on('click.dropdown.data-api', function () {
            $el.parent().removeClass('open')
        })
    }

    Dropdown.prototype = {

        constructor: Dropdown

        , 
        toggle: function (e) {
            var $this = $(this)
            , $parent
            , isActive

            if ($this.is('.disabled, :disabled')) return
            //分别通过以下三个途径：
            //1 data-target自定义属性 
            //2 href的属性中的hash（也是ID选择器）， 
            //3这个按钮的直属父节点
            $parent = getParent($this)

            isActive = $parent.hasClass('open')
            //每次页面只能有一个菜单被打开，这是个失败的设计
            clearMenus()

            if (!isActive) {
                $parent.toggleClass('open')
            }

            $this.focus()

            return false
        }

        , 
        keydown: function (e) {
            var $this
            , $items
            , $active
            , $parent
            , isActive
            , index

            if (!/(38|40|27)/.test(e.keyCode)) return

            $this = $(this)

            e.preventDefault()
            e.stopPropagation()

            if ($this.is('.disabled, :disabled')) return

            $parent = getParent($this)

            isActive = $parent.hasClass('open')

            if (!isActive || (isActive && e.keyCode == 27)) return $this.click()

            $items = $('[role=menu] li:not(.divider):visible a', $parent)

            if (!$items.length) return

            index = $items.index($items.filter(':focus'))

            if (e.keyCode == 38 && index > 0) index--                                        // up
            if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
            if (!~index) index = 0

            $items
            .eq(index)
            .focus()
        }

    }

    function clearMenus() {
        $(toggle).each(function () {
            getParent($(this)).removeClass('open')
        })
    }

    function getParent($this) {
        var selector = $this.attr('data-target')
        , $parent

        if (!selector) {
            selector = $this.attr('href')
            selector = selector && /#/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
        }

        $parent = $(selector)
        $parent.length || ($parent = $this.parent())

        return $parent
    }


    /* DROPDOWN PLUGIN DEFINITION
   * ========================== */

    var old = $.fn.dropdown

    $.fn.dropdown = function (option) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('dropdown')
            if (!data) $this.data('dropdown', (data = new Dropdown(this)))
            //这个option从原型来看，也只能是toggle
            if (typeof option == 'string') data[option].call($this)
        })
    }

    $.fn.dropdown.Constructor = Dropdown


    /* DROPDOWN NO CONFLICT
  * ==================== */

    $.fn.dropdown.noConflict = function () {
        $.fn.dropdown = old
        return this
    }


    /* APPLY TO STANDARD DROPDOWN ELEMENTS
   * =================================== */

    $(document)
    .on('click.dropdown.data-api touchstart.dropdown.data-api', clearMenus)
    .on('click.dropdown touchstart.dropdown.data-api', '.dropdown form', function (e) {
        e.stopPropagation()
    })
    .on('touchstart.dropdown.data-api', '.dropdown-menu', function (e) {
        e.stopPropagation()
    })
    .on('click.dropdown.data-api touchstart.dropdown.data-api'  , toggle, Dropdown.prototype.toggle)
    .on('keydown.dropdown.data-api touchstart.dropdown.data-api', toggle + ', [role=menu]' , Dropdown.prototype.keydown)

}(window.jQuery);