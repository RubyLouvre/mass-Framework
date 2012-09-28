define('tooltip',[ '$css',"./avalon" ], function(){
    $.log("已加载dropdown模块",7)
    $.ui = $.ui || {};
    //有两个方式创建tooltip，一种直接定义在标签里，当点击或滑过该元素时，发现有tooltip就创建它
    //另一种手动创建，parent
    var defaults = {
        parent: "body",
        text: '',
        placement:"top",
        trigger: "hover",
        delay: 0
    }
    $.ui.Tooltip = $.factory({
        init: function(opts){
            opts =  opts || [];
            this.setOptions ("data", defaults, opts );
            var data = this.data;
        }
    })
    
    $(document).on("click mouseenter",".tooltip", function(){
        var el = $(this)
        var tooltip = el.data("tooltip");
        if(!tooltip){
            var title = this.title
            el.removeAttr("title");
            var opts = {
                text: title,
                placement: el.data("placement") || "top",
                trigger: el.data("trigger") || "hover",
                delay: Number(el.data("delay")) || 0
            }
            tooltip = new $.ui.Tooltip(opts)
            el.data("tooltip", tooltip)
        }
        tooltip.show();
    })
    
    
})



/* 
http://www.cnblogs.com/pansly/archive/2011/12/18/2292743.html
http://www.cnblogs.com/zr824946511/archive/2010/02/25/1673520.html
 */


