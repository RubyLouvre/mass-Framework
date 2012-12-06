define("menu", ["node","attr","css","event","fx"], function($){
    
    
    function addMenu(array, parent, doc){
        var ul = doc.createElement("ul");
        parent.appendChild(ul);
        
        array.forEach(function( el ){
            var isObj = typeof el == "object" && el;
            var item = isObj ? el.item : el 
            item = item == null ? "" : item +""
            var li = doc.createElement("li");
            ul.appendChild(li);
            var a = doc.createElement("a");
            a.href = isObj ? el.href : "#"
            li.appendChild(a);
            a.innerHTML = item;
            if( $.isArray( el.sub) && el.sub.length ){
                addMenu( el.sub,li, doc )
            }   
        })
    }

    $.fn.menu = function(op){
        var ui = $.fn.menu,  c = ui.c, id, self = this,
        $arrow = '<span class="'+c.arrowClass+'"> &#187;</span>',
        o = $.Object.merge({}, ui.defaults,op || {});

        if($.isArray(o.data) && o.data.length ){//根据用户内容生成结构
            var doc = this.ownerDocument || document;
            this.each(function(){
                addMenu(o.data, this, doc)
            });
            self = this.find(">ul");
        } 
        self.addClass(c.menuClass).find('li:has(ul)').each(function() {
            if (o.autoArrows) {
                $('>a:first-child',this).addClass(c.anchorClass).append($arrow);
            }
        });
        if(o.vertical){//垂直菜单
            self.addClass(o.verticalClass);
        }
        if(o.flexible){//自适应菜单的宽度
            var cssOpt = {
                'float' : 'none',
                width	: 'auto'
            }
            self.each(function(){
                var $$ = $(this),
                fontsize = $('<li id="menu-fontsize">&#8212;</li>').css({
                    'padding' : 0,
                    'position' : 'absolute',
                    'top' : '-999em',
                    'width' : 'auto'
                }).appendTo( $$ ).width(); 
   
                $('#menu-fontsize').remove();
            
                $$.find('ul').each(function(i) {	
                    var $ul = $(this);
                    //对它的直接LI元素覆写样式
                    var $lis = $ul.children();
                    var liFloat = $lis.css('float');
                    // 强逼内容放到一行内，并保存其浮动样式 
                    $lis.css(cssOpt).css('white-space','nowrap');
                    //对它的直接A元素覆写样式
                    $lis.children('a').css(cssOpt);
                    //取得它的字体宽
                    var emWidth = $ul.css(cssOpt)[0].clientWidth /  fontsize;
                    //允许上下浮动1em
                    emWidth += o.extraWidth;
                    if (emWidth > o.maxWidth){
                        emWidth = o.maxWidth;
                    } else if (emWidth < o.minWidth){
                        emWidth = o.minWidth;
                    }
                    emWidth += 'em';
                    $ul.css('width',emWidth);
                    $lis.css({
                        'float' : liFloat,
                        'width' : '100%',
                        'white-space' : 'normal'
                    })
                    .each(function(){
                        var $childUl = $('>ul',this);
                        var offsetDirection = $childUl.css('left')!==undefined ? 'left' : 'right';
                        $childUl.css(offsetDirection,emWidth);
                    });
                 
                });
            })
        }
        self.find("li").mouseenter(function(){
            var $$ = $(this);
            $$.addClass(o.hoverClass).find("li."+o.hoverClass).removeClass(o.hoverClass)
            $$.siblings().removeClass(o.hoverClass);
            o.onShow(this)     
        }).mouseleave(function(){
            clearTimeout(id);
            var $$ = $(this);
            id = setTimeout(function(){
                $$.removeClass(o.hoverClass)
                o.onHide($$[0])
            },o.delay)
        })
        return self;
    };
    $.mix( $.fn.menu,{
        c: {
            bcClass     : 'ui-breadcrumb',
            menuClass   : 'js-menu',
            anchorClass : 'js-with-ul',
            arrowClass  : 'js-sub-indicator',
            shadowClass : 'js-menu-shadow'
        },
        defaults: {
            hoverClass	: 'js-menu-hover',
            verticalClass : "js-menu-vertical",
            delay	: 500,
            autoArrows	: true,
            dropShadows : true,
            onShow	: function(){},
            onHide	: function(){},
            minWidth	       : 9,		// 单位为em
            maxWidth	       : 25,		// 单位为em
            extraWidth	       : 0		// 额外超出多少宽度
        }
    })

    return $;
})
