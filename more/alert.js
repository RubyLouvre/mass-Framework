define('alert',[ '$css',"$flow","./avalon" ], function(){
    //信息通知组件
    $.log("已加载alert组件",7)
    $.ui = $.ui || {};
    var defaults ={
        parent:"body",
        text: "",
        head: "",
        cls:  "",
        block: 0
    }
    $.ui.Alert  = $.factory({
        inherit: $.Flow,
        init: function(msg, cls){
            var opts = {}
            if(typeof msg === "string" ){
                opts.text = msg
                if( typeof cls == "string"){
                    opts.cls = cls;
                }
                if(typeof arguments[2] == "string" ){
                    opts.parent = arguments[2]
                }
            }else if(typeof msg === "object" ){
                opts = msg
            }
            this.setOptions ("data", defaults, opts );
            var data = this.data;
            this.preRender = data.preRender || $.noop;
            var tmpl = data.block ?
            '<div class="alert alert-block fade in" bind="class:cls">'+
            '    <a class="close" data-dismiss="alert">×</a>'+
            '    <h4 class="alert-heading" bind="html:head,display:head.length">Warning!</h4>'+
            '    <div bind="html:text">不要脸者无敌</div>'+
            '</div>' :
            '<div class="alert fade in" bind="class:cls">'+
            '    <a class="close" data-dismiss="alert">×</a>'+
            '    <div bind="html:text">不要拿法律当挡箭牌</div>'+
            '</div>'
            if(data.block){
                data.head = data.head || ""
            }
            this.tmpl = data.tmpl || tmpl;
            delete data.tmpl;
            delete data.block;
            delete data.preRender
            this.preRender();

            //插入DOM并绑定数据
            var ui = this.ui = $(this.tmpl).appendTo( data.parent )
            this.VM =  $.ViewModel( data );
            $.View(this.VM, ui[0]);
            ui.data("alert", this)
        },
        close: function(fn){
            if(typeof fn == "function"){
                this.bind("close", fn);
            }
            this.ui.find('[data-dismiss="alert"]').click();
        }

    })
    $(document).on('click', 'a[data-dismiss="alert"]', function(e){
        var el = $(e.target).parent(".alert");
        if(el.length){
            var ui =  el.data("alert");
            if(ui){
                var parent = ui.ui
                parent.removeClass("in")
                function remove (){
                    ui.fire("closed",ui)
                    el.remove();
                }
                ui.fire("close",ui);
                $.support.transition && parent.hasClass('fade') ?
                parent.on($.support.transition.end, remove) : remove()
            }
        }
    })
});


