!function ($) {

    "use strict"; // jshint ;_;
    /* TAB CLASS DEFINITION
  * ==================== */
    var Tab = function (element) {
        this.element = $(element)
    }
    //整个控件分两部分,触发区与面板区
    Tab.prototype = {

        constructor: Tab ,
        //这是用于切换触发区与相关事件,并在里面调用切换面板的activate
        show: function () {
            var $this = this.element
            , $ul = $this.closest('ul:not(.dropdown-menu)')//找到触发区的容器
            , selector = $this.attr('data-target')//取得对应的面板的CSS表达式
            , previous
            , $target
            , e

            if (!selector) {
                selector = $this.attr('href')//没有则从href得到
                selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
            }

            if ( $this.parent('li').hasClass('active') ) return

            previous = $ul.find('.active:last a')[0]//对得之前被激活的链接

            e = $.Event('show', {
                relatedTarget: previous
            })

            $this.trigger(e)

            if (e.isDefaultPrevented()) return

            $target = $(selector)

            this.activate($this.parent('li'), $ul)
            this.activate($target, $target.parent(), function () {
                $this.trigger({
                    type: 'shown'
                    ,
                    relatedTarget: previous
                })
            })
        }  ,
        //这方面不应该放到原型上，应该做成私有方法
        activate: function ( element, container, callback) {
            var $deactivate = container.find('> .active')
            , transition = callback
            && $.support.transition
            && $deactivate.hasClass('fade')

            function next() {
                //让之前的处于激活状态处于激活状态
                $deactivate
                .removeClass('active')
                .find('> .dropdown-menu > .active')
                .removeClass('active')
                //让当前面板处于激活状态
                element.addClass('active')

                if (transition) {
                    element[0].offsetWidth // reflow for transition
                    element.addClass('in')
                } else {
                    element.removeClass('fade')
                }

                if ( element.parent('.dropdown-menu') ) {
                    element.closest('li.dropdown').addClass('active')
                }
                //执行回调，目的是触发shown事件
                callback && callback()
            }

            transition ?
            $deactivate.one($.support.transition.end, next) :
            next()
            //开始触发CSS3 transition回调
            $deactivate.removeClass('in')
        }
    }


    /* TAB PLUGIN DEFINITION
  * ===================== */

    var old = $.fn.tab

    $.fn.tab = function ( option ) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('tab')
            if (!data) $this.data('tab', (data = new Tab(this)))
            if (typeof option == 'string') data[option]()//show
        })
    }

    $.fn.tab.Constructor = Tab


    /* TAB NO CONFLICT
  * =============== */

    $.fn.tab.noConflict = function () {
        $.fn.tab = old
        return this
    }


    /* TAB DATA-API
  * ============ */
    //要求触发区必须存在[data-toggle="tab"]或[data-toggle="pill"]属性
    $(document).on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
        e.preventDefault()
        $(this).tab('show')
    })

}(window.jQuery);