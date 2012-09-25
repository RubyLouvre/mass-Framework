define('dropdown',[ '$css',"./avalon" ], function(){
    $.ui = $.ui||{}
    var defaults = {
        btn_text: "action",
        menu: [],
        parent: "body"
    }
    $.ui.DropDown  = $.factory({
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
            '<div class="btn-group">'+
            '    <a class="btn dropdown-toggle" data-toggle="dropdown" href="#">'+
            '        <span bind="text:btn_text"></span><span class="caret"></span>'+
            '    </a>'+
            '    <ul class="dropdown-menu" bind="foreach:menu">'+
            '        <li bind="class:cls"><a bind="text:text,attr:{ href:href }"></a></li>'+
            '     </ul>'+
            '</div>'
            var ui = this.ui = $(this.tmpl).appendTo( data.parent )
            this.VM =  $.ViewModel( data );
            $.View(this.VM, ui[0]);

            ui.on("click",function(){
                if (ui.is('.disabled, :disabled'))
                    return
                //要求open加在与btn-group类的同一元素上
                ui.toggleClass("open");
                ui.find(".dropdown-menu").toggle();
                if(ui.hasClass("open")){
                    ui.find(".dropdown-menu").focus()
                }
                return false;
            })
        }
    //    keydown: function (e) {

   
    });
})

