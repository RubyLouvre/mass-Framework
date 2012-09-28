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
            var parent = this.parent = $(parent)
            var placement = data.placement
            this.tmpl = '<div class="tooltip" bind="class:cls"><div class="tooltip-arrow"></div><div class="tooltip-inner" bind="html:text"></div></div>'
            this.preRender = data.preRender || $.noop;
            data.delay = data.delay || 0;
            delete data.preRender
            var ui = this.ui = $(this.tmpl).appendTo( data.parent );
            if (data.animation) {
                placement += "fade"
            }
            $.log(data)
            this.VM =  $.ViewModel( {
                cls: placement,  //top | bottom | left | right | in top
                text: data.text
            } );
            $.View(this.VM, ui[0]);
            var inside = /in/.test( placement)

            ui.remove().css({
                top: 0,
                text: data.text,
                left: 0,
                display: 'block'
            })
            .appendTo(inside ? parent : document.body)
            $.log(ui)
            $.log(placement)
            var pos = this.getPosition(inside),

            actualWidth = ui[0].offsetWidth,
            actualHeight = ui[0].offsetHeight,
            tp

            switch (inside ? placement.split(' ')[1] : placement) {
                case 'bottom':
                    tp = {
                        top: pos.top + pos.height,
                        left: pos.left + pos.width / 2 - actualWidth / 2
                    }
                    break
                case 'top':
                    tp = {
                        top: pos.top - actualHeight,
                        left: pos.left + pos.width / 2 - actualWidth / 2
                    }
                    break
                case 'left':
                    tp = {
                        top: pos.top + pos.height / 2 - actualHeight / 2,
                        left: pos.left - actualWidth
                    }
                    break
                case 'right':
                    tp = {
                        top: pos.top + pos.height / 2 - actualHeight / 2,
                        left: pos.left + pos.width
                    }
                    break
            }

            ui.css(tp)
        },
        show: function(){
            
        },
        hide: function(){
            this.parent.attr("title", this.data.text );
            var ui = this.ui
            if($.support.transition && this.ui.hasClass('fade')){
                ui.one($.support.transition.end, function () {
                    ui.remove()
                });
                ui.removeClass('in')
            } else{
                ui.remove()
            }
        },
        toggel: function(){},
        getPosition: function (inside) {
            return $.Object.merge({}, (inside ? {
                top: 0,
                left: 0
            } : this.ui.offset()), {
                width: this.ui[0].offsetWidth ,
                height: this.ui[0].offsetHeight
            })
        }
    })
    
    $(document).on("click mouseenter",".tooltip-wrap[title]", function(){
        var el = $(this)
        var tooltip = el.data("tooltip");
        if(!tooltip){
            var title = this.title
            el.removeAttr("title");
            var opts = {
                text: title,
                parent: this,
                placement: el.data("placement") ,
                trigger: el.data("trigger"),
                delay: Number(el.data("delay")) 
            }
            $.log(opts)
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


