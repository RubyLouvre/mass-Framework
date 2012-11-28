define('dropdown',[ '$css',"./avalon" ], function($){
    $.log("已加载dropdown模块",7)
    $.ui = $.ui || {};
    var defaults = {
        parent: "body",
        //按钮内的文字
        text: "action",
        //可供换肤用的类名btn-primary btn-danger btn-warning btn-success btn-info btn-inverse
        //可供调整大小的类名btn-mini btn-small btn-large
        cls: "",
        menucls: "", //使用pull-left pull-right让下拉框相对按钮组对齐
        menu: []
    }

    $.ui.DropDown  = $.factory({
        init: function(opts) {
            opts =  opts || [];
            this.setOptions ("data", defaults, opts );
            var data = this.data;
            var list = data.menu;
            list.forEach(function(el,i){
                if(/^(b|n|s)/.test(typeof el)){
                    var text = el
                    list[i] = el = {
                        text: text
                    };
                }
                el.text = el.text || "";
                el.cls = el.cls || "";
                el.href = el.href || "#";
            });
            this.preRender = data.preRender || $.noop
            delete data.preRender
            this.tmpl  = //不要使用换行符,这在压缩时很容易出现问题
            '<div class="btn-group">'+
            '    <a class="btn dropdown-toggle" bind="class:cls" data-toggle="dropdown" href="#">'+
            '        <span bind="text:text">Action</span><span class="caret"></span>'+
            '    </a>'+
            '    <ul class="dropdown-menu" bind="foreach:menu,display:menu.length,class:menucls">'+
            '        <li bind="class:cls"><a bind="text:text,attr:{ href:href }" ></a></li>'+
            '     </ul>'+
            '</div>'
            if(opts.split){
                this.tmpl  = //不要使用换行符,这在压缩时很容易出现问题
                '<div class="btn-group">'+
            '    <a class="btn" bind="class:cls"  href="#">'+
            '        <span bind="text:text">Action</span>'+
            '    </a>'+
            '    <a class="btn dropdown-toggle" bind="class:cls" data-toggle="dropdown" href="#">'+
            '        <span class="caret"></span>'+
            '    </a>'+
            '    <ul class="dropdown-menu" bind="foreach:menu, display:menu.length,class:menucls">'+
            '        <li bind="class:cls"><a bind="text:text,attr:{ href:href }"></a></li>'+
            '     </ul>'+
            '</div>'
            }
            //在.btn-group 的元素上添加dropup类 ,可以向上展出菜单
            //在.dropdown-menu的元素上添加pull-right类可以向右对齐
            this.preRender();
            var ui = this.ui = $(this.tmpl).appendTo( data.parent )
            //插入DOM并绑定数据
            this.VM =  $.ViewModel( data );
            $.View(this.VM, ui[0]);
            //绑定独立的事件
            var menu = ui.find(".dropdown-menu")
            //点击按钮时显示下拉框
            ui.on("click",function(){
                if (ui.is('.disabled, :disabled'))
                    return
                //要求open加在与btn-group类的同一元素上
                ui.toggleClass("open");
                if(ui.hasClass("open")){
                    menu.focus();
                }
                return false;
            });
            //点击其他地方时会收起下拉框
            ui.flag_can_collapse = true;
            ui.mouseleave(function(){
                ui.flag_can_collapse = true;
            }).mouseenter(function(){
                ui.flag_can_collapse = false;
            });
            $(document).click(function(){
                if(ui.flag_can_collapse){
                    ui.removeClass("open");
                }
            })
        },
        size: function(name){
            this.VM.cls({
                "btn-mini":false,
                "btn-small":false,
                "btn-large":false
            })
            this.VM.cls(name)
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
        //27 enter 38 up 40 down
        if (!/(38|40|27)/.test(keyCode))
            return
        e.preventDefault();
        e.stopPropagation();
        //决定要操作哪一个
        var el = $(this)
        if (el.is('.disabled, :disabled'))
            return
        var ui = getDropDown( el );
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
   