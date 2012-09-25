define('panel',[ '$css',"./avalon","./panel.css" ], function(){
    $.ui = $.ui||{}
    var defaults = {
        btn_text: "action",
        menu: []
    }
    $.ui.DropDown = $.factory({
        inherit: $.Flow,
        init: function(opts) {
            opts =  opts || [];
            this.setOptions ("data", defaults, opts );
            var data = this.data;
            var menu = data.menu;
            menu.forEach(function(el){
                if(typeof el == "string"){
                    var text = el
                    el = {
                        text: text
                    };
                }
                el.text = el.text || ""
                el.cls = el.cls || ""
                el.href = el.href || "#"
            })

            this.tmpl  = //不要使用换行符,这在压缩时很容易出现问题
            '<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">'+
            '    <span bind="text:btn_text"></span><span class="caret"></span>'+
            '    <ul class="dropdown-menu" bind="foreach:menu">'+
            '        <li bind="text:text,attr:{class:cls, href:href }"></li>'+
            '     <ul>'+
            '</div>'
            this.ui = $(this.tmpl).appendTo( data.parent ).css( data.css );
            this.VM =  $.ViewModel( data);
            $.View(this.VM, this.ui[0]);
        },
        show : function() {
            $.log("show",7)
           // this.VM.show(true)
        },
        hide : function() {
            $.log("hide",7)
          //  this.VM.show(false)
        }
    });
})

    //    var toggle = '[data-toggle=dropdown]'
//    , Dropdown = function (element) {
//        var $el = $(element).on('click.dropdown.data-api', this.toggle)
//        $('html').on('click.dropdown.data-api', function () {
//            $el.parent().removeClass('open')
//        })
//    }
//
//    Dropdown = function (element) {
//        var $el = $(element).on('click.dropdown.data-api', this.toggle)
//        $('html').on('click.dropdown.data-api', function () {
//            $el.parent().removeClass('open')
//        })
//    }
//    Dropdown.prototype = {
//
//        constructor: Dropdown
//
//        ,
//        toggle: function (e) {
//            var $this = $(this)
//            , $parent
//            , isActive
//
//            if ($this.is('.disabled, :disabled')) return
//
//            $parent = getParent($this)
//
//            isActive = $parent.hasClass('open')
//
//            clearMenus()
//
//            if (!isActive) {
//                $parent.toggleClass('open')
//                $this.focus()
//            }
//
//            return false
//        }
//
//        ,
//        keydown: function (e) {
//            var $this
//            , $items
//            , $active
//            , $parent
//            , isActive
//            , index
//
//            if (!/(38|40|27)/.test(e.keyCode)) return
//
//            $this = $(this)
//
//            e.preventDefault()
//            e.stopPropagation()
//
//            if ($this.is('.disabled, :disabled')) return
//
//            $parent = getParent($this)
//
//            isActive = $parent.hasClass('open')
//
//            if (!isActive || (isActive && e.keyCode == 27)) return $this.click()
//
//            $items = $('[role=menu] li:not(.divider) a', $parent)
//
//            if (!$items.length) return
//
//            index = $items.index($items.filter(':focus'))
//
//            if (e.keyCode == 38 && index > 0) index--                                        // up
//            if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
//            if (!~index) index = 0
//
//            $items
//            .eq(index)
//            .focus()
//        }
//
//    }
//
//    function clearMenus() {
//        getParent($(toggle))
//        .removeClass('open')
//    }
//
//    function getParent($this) {
//        var selector = $this.attr('data-target')
//        , $parent
//
//        if (!selector) {
//            selector = $this.attr('href')
//            selector = selector && /#/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
//        }
//
//        $parent = $(selector)
//        $parent.length || ($parent = $this.parent())
//
//        return $parent
//    }
//
//
//    /* DROPDOWN PLUGIN DEFINITION
//   * ========================== */
//
//    $.fn.dropdown = function (option) {
//        return this.each(function () {
//            var $this = $(this)
//            , data = $this.data('dropdown')
//            if (!data) $this.data('dropdown', (data = new Dropdown(this)))
//            if (typeof option == 'string') data[option].call($this)
//        })
//    }
//
//    $.fn.dropdown.Constructor = Dropdown


/* APPLY TO STANDARD DROPDOWN ELEMENTS
 * =================================== */

//   $(function () {
//        $('html')
//        .on('click.dropdown.data-api touchstart.dropdown.data-api', clearMenus)
//        $('body')
//        .on('click.dropdown touchstart.dropdown.data-api', '.dropdown form', function (e) {
//            e.stopPropagation()
//        })
//        .on('click.dropdown.data-api touchstart.dropdown.data-api'  , toggle, Dropdown.prototype.toggle)
//        .on('keydown.dropdown.data-api touchstart.dropdown.data-api', toggle + ', [role=menu]' , Dropdown.prototype.keydown)
//  })

    
} )




