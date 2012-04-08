$.define("draggable","event,css,attr",function(){
    var  $doc = $(document), dragger, dd
    function preventDefault (e) {
        e.preventDefault();
    }
    function fixAndDispatch(el, e, type){
        e.type = type;
        e.namespace = "mass_ui";
        e.namespace_re = new RegExp("(^|\\.)" + "mass_ui" + "(\\.|$)");
        el.fire(e, dd);
    }
    function dragstart(event){
        dragger = $(event.currentTarget);//每次只允许运行一个实例
        dd = dragger.data("_mass_draggable")||{};
        var offset = dragger.offset();
        dragger.addClass("mass_dragging");
        dd.target = event.target;
        dd.pageX = event.pageX;
        dd.pageY = event.pageY;
        dd.startX = offset.left;
        dd.startY = offset.top;
        dd.dragging = false;
        fixAndDispatch(dragger, event, "dragstart");
    }
    function Draggable($el, opts){
        $el.data("drag_opts",opts);
        $el.attr('draggable', 'true');
        $el.on('dragstart', preventDefault);//处理原生的dragstart事件
        if (!opts.noCursor) {
            if (opts.handle) {//添加表示能拖放的样式
                $el.find(opts.handle).css('cursor', 'move');
            } else {
                $el.css('cursor', 'move');
            }
        }
        var position = $el.position();
        $el.css({
            'top': position.top,
            'left': position.left,
            'position': 'absolute'
        });
        if(opts.limit){
            var container = $(opts.limit);
            if(container.length){
                var offset = container.offset();
                var limit = this.limit = {};
                limit.top = offset.top + parseFloat(container.css("borderTopWidth"));
                limit.left = offset.left + parseFloat(container.css("borderLeftWidth"));
                limit.right = limit.left + container.innerWidth() - $el.outerWidth();
                limit.bottom = limit.top + container.innerHeight()- $el.outerWidth() ;
            }
           
        }
        "dragstart dragover dragend".replace($.rword, function(event){
            var fn = opts[event];
            if(typeof fn == "function"){
                $el.on(event + ".mass_ui", fn)
            }
        });
        $el.on('mousedown', typeof opts.handle == "string" ? opts.handle : null , dragstart);

    }

    $.fn.draggable = function( opts ){
        opts = opts || {};
        for(var i =0 ; i < this.length; i++){
            if(this[i] && this[i].nodeType === 1){
                var $el = $(this[i])
                var dd = $el.data("_mass_draggable")
                if(! dd  ){
                    dd = new Draggable( $el, opts );
                    $el.data( "_mass_draggable" , dd );
                }
            }
        }
        return this;
    }
    $doc.on({
        "mouseup.mass_ui blur.mass_ui": function(event){
            if(dragger){
                dd.dragging = false;
                $(dragger).removeClass("mass_dragging");
                fixAndDispatch(dragger, event, "dragover");
                dragger = null;
            }
        },
        "mousemove.mass_ui": function(event){
            if(dragger){
                //当前元素移动了多少距离
                dd.deltaX = event.pageX - dd.pageX;
                dd.deltaY = event.pageY - dd.pageY;
                //现在的坐标
                dd.offsetX = dd.deltaX + dd.startX ;
                dd.offsetY = dd.deltaY + dd.startY ;
                var obj = {}
                if(!dd.lockX){//如果没有锁定X轴
                    var left = obj.left = dd.limit ?  Math.min( dd.limit.right, Math.max( dd.limit.left, dd.offsetX )) : dd.offsetX
                    dragger[0].style.left = left+"px"
                }
                if(!dd.lockY){//如果没有锁定Y轴
                    var top =  obj.top = dd.limit ?   Math.min( dd.limit.bottom, Math.max( dd.limit.top, dd.offsetY ) ) : dd.offsetY;
                    dragger[0].style.top = top+"px"
                }
                //  dragger.offset(obj)
                fixAndDispatch(dragger, event, "dragover");
            }
        },
        "selectstart.mass_ui": function(e){
            if(dragger){
                preventDefault(e);
                if (window.getSelection) {
                    window.getSelection().removeAllRanges();
                } else if (document.selection) {
                    document.selection.clear();
                }
            }
        }
    });

})
