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
            '        <li bind="class:cls"><a bind="text:text,attr:{ href:href }"></a></li>'+
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
                //  menu.toggle();??????这里是否要在IE6下处理
                if(ui.hasClass("open")){
                    menu.focus()
                }
                return false;
            })
            ui.mouseleave(function(){
                ui.flag_can_collapse = true;
            }).mouseenter(function(){
                ui.flag_can_collapse = false;
            });
            if(!$.ui.DropDown.flag_bind){
                $.ui.DropDown.flag_bind = true;
                $(document).click(function(){
                    if(ui.flag_close_menu){
                        ui.removeClass("open");
                    // menu.hide();
                    }
                }).keydown(function(e){
                    var keyCode = e.which
                    if (!/(38|40|27)/.test(keyCode))
                        return
                    if (ui.is('.disabled, :disabled'))
                        return
                    var  isActive = ui.hasClass('open')
                    var items = menu.find("li:not(.divider) a");
                    if (!isActive || (isActive && e.keyCode == 27))
                        return ui.click()
                    if (!items.length) return
                    var index = items.index( items.filter(':focus'))

                    if ( keyCode == 38 && index > 0) index--                                        // up
                    if (e.keyCode == 40 && index < items.length - 1) index++                        // down
                    if (!~index) index = 0

                    items.eq(index).focus()
                })
            }
           

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
})

