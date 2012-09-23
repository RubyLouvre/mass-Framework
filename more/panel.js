define('panel',[
    '$css',
    "./panel.css",
    "./avalon"
    ], function(){
        $.ui = $.ui||{}
        var defaults = {
            show        : true,
            showHead    : true,
            showFoot    : true,
            closeAble   : true,
            parent      : 'body',
            content     : {
                title       : 'title',
                body        : 'body',
                foot        : ''
            },
            css         : {
                width       : 400,
                height      : 200
            }
        };
        $.ui.Panel = $.factory({
            inherit: $.Flow,
            init: function(opts) {
                this.setOptions ("data", defaults, opts );
                var data = this.data;
                this.tmpl  = //不要使用换行符,这在压缩时很容易出现问题
                '<div class="panel_wrap" bind="display:show">'+
                '    <div class="panel_head" bind="if:showHead">'+
                '        <div class="panel_title" bind="html:content.title"></div>'+
                '        <div class="panel_tool">'+
                '            <span class="panel_tool_close" bind="display:closeAble"></span>'+
                '        </div>'+
                '     </div>'+
                '     <div class="panel_body" bind="html:content.body"></div>'+
                '     <div class="panel_foot" bind="if:showFoot,html:content.foot"></div>'+
                '</div>'
                this.ui = $(this.tmpl)
                .appendTo( data.parent )
                .css     ( data.css )
                this.VM =  $.ViewModel( data);
                $.View(this.VM, this.ui[0]);
            },
            show : function() {
                $.log("show",7)
                this.VM.show(true)
            },
            hide : function() {
                $.log("hide",7)
                this.VM.show(false)
            },
            set : function( name, val ) {
                if( this.VM[name] ){
                    this.VM[name](val)
                }
                return this;
            },
            get: function(name){
                if( this.VM[name] ){
                    return this.VM[name]()
                }
            }
        });
    })
    /*
     *后继计划是将工具栏做成一个独立的UI,有放大,缩小,关闭等按钮
     <script>
            $.require("ready,./more/panel", function(){
                var model = new $.ui.Panel()
                setTimeout(function(){
                    model.hide()
                },1000)
                setTimeout(function(){
                    model.show()
                },2000)
            })
        </script>
     *
     */