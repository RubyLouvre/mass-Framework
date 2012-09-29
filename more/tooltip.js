define('tooltip',[ '$css',"./avalon" ], function(){
    $.log("已加载dropdown模块",7)
    $.ui = $.ui || {};
    //https://github.com/jaz303/tipsy/blob/master/src/javascripts/jquery.tipsy.js
    //有两个方式创建tooltip，一种直接定义在标签里，当点击或滑过该元素时，发现有tooltip就创建它
    //另一种手动创建，parent
    var defaults = {
        parent: "body",
        text: '',
        position:"top",
        trigger: "hover",
        delay: 0
    }
    $.ui.Tooltip = $.factory({
        init: function(opts){
            opts =  opts || [];
            this.setOptions ("data", defaults, opts );
            var data = this.data;
            var position = data.position;
            this.tmpl = data.tmpl || '<div class="tooltip" bind="class:cls"><div class="tooltip-arrow"></div><div class="tooltip-inner" bind="html:text"></div></div>'
            this.preRender = data.preRender || $.noop;
            var parent = this.parent = $(data.parent);
            data.delay = data.delay || 0;
            if (data.delay && typeof data.delay == 'number') {
                data.delay = {
                    show: data.delay ,
                    hide: data.delay
                }
            }
            delete data.preRender;
            delete data.tmpl;
            this.preRender();
            var ui = this.ui = $(this.tmpl).appendTo( data.parent );
         
            if (data.animation) {
                position += "fade";
            }
            this.VM = $.ViewModel( {
                cls: position,  //top | bottom | left | right | in top
                text: data.text
            } );
            $.View(this.VM, ui[0]);

            if (data.trigger == 'hover') {
                var self = this;
                parent.bind("mouseleave", function(){
                    self.leave()
                });
            }

            ui.remove();
        },
        enter: function () {
            return
            var self = this
            if (!this.data.delay.show)
                return this.show()
            clearTimeout(this.timeout)
            this.hoverState = 'in'
            this.timeout = setTimeout(function() {
                if (self.hoverState == 'in') self.show()
            }, this.data.delay.show)
        },
        leave: function () {
            var self = this
            if (!this.data.delay.hide)
                return this.hide()
            clearTimeout(this.timeout)
            this.hoverState = 'out'
            this.timeout = setTimeout(function() {
                if (self.hoverState == 'out') self.hide()
            }, this.data.delay.hide)
        },
        show: function(){
            var el = this.ui[0], tp
            var inside = false;// /in/.test(el.className)
            $.log(el.className)
            this.ui.css({
                top: 0,
                left: 0,
                text: this.data.text,
                display: 'block'
            })
            .appendTo( inside ? this.parent : "body");
            //    this.parent[0].removeAttribute("title")
            var pos = this.getPosition(inside)
            var actualWidth = el.offsetWidth
            var actualHeight = el.offsetHeight

            switch (this.data.position) {
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
            $.log(tp.top+"  "+tp.left)
            this.ui.css(tp).addClass("in")
        },
        hide: function(){
            var ui = this.ui
            ui.removeClass("in")
            function callback(){
                ui.remove();  
            }
            if($.support.transition && this.ui.hasClass('fade')){
                ui.one($.support.transition.end, callback);
            } else{
                callback();
            }
        },
        toggel: function(){
            this[ this.ui.hasClass('in')  ? 'hide' : 'show']()
        },
        getPosition: function (inside) {
            return $.Object.merge({},  (inside ? {
                top: 0, 
                left: 0
            } : this.parent.offset()), {
                width: this.parent[0].offsetWidth ,
                height: this.parent[0].offsetHeight
            })
        }
    })
    
    $(document).on("click mouseenter",".tooltip-parent[title]", function(e){
        var el = $(this)
        var tooltip = el.data("tooltip");
        if(!tooltip){
            var text = this.title;
            this.title = "";
            var opts = {
                text: text,
                parent: this,
                animation: el.data("animation") ,
                position: el.data("position") ,
                trigger: el.data("trigger"),
                delay: Number(el.data("delay")) 
            }   
            tooltip = new $.ui.Tooltip(opts)
            el.data("tooltip", tooltip)
        }
        var trigger = tooltip.data.trigger;
        if ( e.type == trigger) { //click
            tooltip.toggle();
        } else if(trigger == "hover" && e.type == "mouseenter" ){
            tooltip.enter()
        }

    })
    
    
})



/*
 * $.fn.removeAttr 有问题
http://www.cnblogs.com/pansly/archive/2011/12/18/2292743.html
http://www.cnblogs.com/zr824946511/archive/2010/02/25/1673520.html
 */


