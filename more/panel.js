define('panel',[
    '$node',
    '$event',
    '$css',
    '$flow',
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
                var html =
                '<div class="panel_wrap" bind="display:show">'+
                '    <div class="panel_head" bind="if:showHead">'+
                '        <div class="panel_title" bind="html:content.title"></div>'+
                '        <span class="panel_closer" bind="display:closeAble"></span>'+
                '     </div>'+
                '     <div class="panel_body" bind="html:content.body"></div>'+
                '     <div class="panel_foot" bind="if:showFoot,html:content.foot"></div>'+
                '</div>'
                this.ui = $(html)
                .appendTo( data.parent )
                .css     ( data.css )
console.log(data)
                var model =  $.ViewModel( data)
                $.View(model,this.ui[0])



               // self.show();
            },
            show : function() {

            },
            hide : function() {

            },
            set : function( keyChain, val ) {//每改一个属性就重刷整个视图，因此不能容纳子控件,除非我们多做一些额外工作
        
            }
        });
    })