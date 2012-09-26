define('dropdown',[ '$css',"./avalon" ], function(){
    $.ui = $.ui||{}
    var defaults = {
        btn_text: "action",
        btn_cls: "",
        menu: [],
        parent: "body"
    }

    $.ui.DropDown  = $.factory({
        inherit: $.Flow,
        init: function(opts) {
            opts =  opts || [];
            this.setOptions ("data", defaults, opts );
            var data = this.data;
            var list = data.menu;
            list.forEach(function(el){
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
            '<div class="btn-group">'+
            '    <a class="btn dropdown-toggle" bind="class:btn_cls" data-toggle="dropdown" href="#">'+
            '        <span bind="text:btn_text">Action</span><span class="caret"></span>'+
            '    </a>'+
            '    <ul class="dropdown-menu" bind="foreach:menu">'+
            '        <li bind="class:cls"><a bind="text:text,attr:{ href:href }" ></a></li>'+
            '     </ul>'+
            '</div>'
            if(opts.split){
                this.tmpl  = //不要使用换行符,这在压缩时很容易出现问题
                '<div class="btn-group">'+
            '    <a class="btn" bind="class:btn_cls"  href="#">'+
            '        <span bind="text:btn_text">Action</span>'+
            '    </a>'+
            '    <a class="btn dropdown-toggle" bind="class:btn_cls" data-toggle="dropdown" href="#">'+
            '        <span class="caret"></span>'+
            '    </a>'+
            '    <ul class="dropdown-menu" bind="foreach:menu">'+
            '        <li bind="class:cls"><a bind="text:text,attr:{ href:href }"></a></li>'+
            '     </ul>'+
            '</div>'
            }
            var ui = this.ui = $(this.tmpl).appendTo( data.parent )
            
            this.VM =  $.ViewModel( data );
            $.View(this.VM, ui[0]);
            var menu = ui.find(".dropdown-menu")
            ui.on("click",function(){
                if (ui.is('.disabled, :disabled'))
                    return
                //要求open加在与btn-group类的同一元素上
                ui.toggleClass("open");
                if(ui.hasClass("open")){
                    menu.focus()
                }
                return false;
            });
            //当在其他地方点击时会收起下拉框
            ui.mouseleave(function(){
                ui.flag_can_collapse = true;
            }).mouseenter(function(){
                ui.flag_can_collapse = false;
            });
            $(document).click(function(){
                if(ui.flag_close_menu){
                    ui.removeClass("open");
                }
            })
        },
        size: function(name){
            this.VM.btn_cls({
                "btn-mini":false,
                "btn-small":false,
                "btn-large":false
            })
            this.VM.btn_cls(name)
        //只能是这几个:.btn-mini, .btn-small, or .btn-large
        }
    //   如果想下拉框向上方显示,在.btn-group加个类名dropup
    //   如果想并排显示多个.btn-group 那么在它们外面最套个DIV,类名为btn-toolbar
    });
    function getDropDown($this) {
        var selector = $this.attr('data-target'), el
        if (!selector) {
            selector = $this.attr('href')
            selector = selector && /#/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
        }
        el = $(selector);
        if(!el.length){
            el = $(".dropdown-toggle").eq(0)
        }
        if(el.length){
            el = el.parent()
        }
        return el
    }

    $(document).keyup(function(e){
        var keyCode = e.which;
        if (!/(38|40|27)/.test(keyCode))
            return
        e.preventDefault();
        e.stopPropagation();
        //决定要操作哪一个
        var el = $(this)
        if (el.is('.disabled, :disabled'))
            return
        var ui = getDropDown( el );
        console.log(ui)
        var isActive = ui.hasClass('open')
        var items = ui.find("li:not(.divider) a");
        if (!isActive || (isActive && keyCode == 27))
            return ui.click()
        if (!items.length)
            return
        //IE7不支持:focus添加样式,使用:active代替
        var cur = items.filter(':focus');
        var index = items.index( cur )
        if ( keyCode == 38){
            index--
        }
        if ( keyCode == 40){
            index++
        }
        if( index == items.length){
            index = 0;
        }
        items.eq(index).focus();
    })
})
    /*
     *
     * 作为一种十天搞出来的语言，能获取如此地位，javascript已经算是非常了不起，但BUG依旧是免不了。而且微软与当时的网景斗气，
javascript还没有成长起来时，就岔出一个分支JScript，在这个分支在IE6的强势地位后，竟然哗宾夺主肆虐了十多年，这景况真是语言界的奇葩啊，也正因为如此，
语言自身的发展一直滞后，这任务竟然成为了框架类库的绝活了。
     *
     */

