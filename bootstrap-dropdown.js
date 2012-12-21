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
            //如果没有打开，则打开它
            if (!isActive) {
                $parent.toggleClass('open')
            }
            //让当前菜单项获得焦点
            $this.focus()

            return false
        }

        , 
        keydown: function (e) {
            var $this
            , $items
            , $parent
            , isActive
            , index
            //如果不是上下方向键或回车键,返回
            if (!/(38|40|27)/.test(e.keyCode)) return

            $this = $(this)

            e.preventDefault()
            e.stopPropagation()
            //如果标识为禁止状态
            if ($this.is('.disabled, :disabled')) return
            //取得控件的容器
            $parent = getParent($this)
            //如果处于激活状态
            isActive = $parent.hasClass('open')
            //如果没有激活或激话了+回车,就触发其点击事件
            if (!isActive || (isActive && e.keyCode == 27)) return $this.click()
            //如果是菜单项(不能是作为分隔线的LI)下的A元素
            $items = $('[role=menu] li:not(.divider):visible a', $parent)

            if (!$items.length) return
            //那么我们取得当前获得焦点的元素作为基准,通过它上下移动
            index = $items.index($items.filter(':focus'))

            if (e.keyCode == 38 && index > 0) index--                                        // up
            if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
            if (!~index) index = 0//如果是-1,那么回到第一个
            //然后焦点落在它之上
            $items
            .eq(index)
            .focus()
        }

    }

    function clearMenus() {//请空页面上所有显示出来下拉菜单
        $(toggle).each(function () {
            getParent($(this)).removeClass('open')
        })
    }

    function getParent($this) {
        var selector = $this.attr('data-target')
        , $parent

        if (!selector) {
            selector = $this.attr('href')//只能取ID选择器了
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

    $(document)//绑定事件
    .on('click.dropdown.data-api touchstart.dropdown.data-api', clearMenus)
    .on('click.dropdown touchstart.dropdown.data-api', '.dropdown form', function (e) {
        e.stopPropagation()
    })
    .on('touchstart.dropdown.data-api', '.dropdown-menu', function (e) {
        e.stopPropagation()
    })   //这里是用于绑定到某个链接或按钮上,点击它让某个下拉菜单打开
    .on('click.dropdown.data-api touchstart.dropdown.data-api'  , toggle, Dropdown.prototype.toggle)
    //绑定键盘事件,方便在菜单项中上下移动
    .on('keydown.dropdown.data-api touchstart.dropdown.data-api', toggle + ', [role=menu]' , Dropdown.prototype.keydown)

}(window.jQuery);