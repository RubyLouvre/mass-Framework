$.define("draggable","event,css,attr",function(){
    var  $doc = $(document), sington, ui
    function preventDefault (e) {
        e.preventDefault();
    }
    function fixAndDispatch(el, e, type){
        e.type = type;
        e.namespace = "mass_ui";
        e.namespace_re = new RegExp("(^|\\.)" + "mass_ui" + "(\\.|$)");
        el.fire(e, ui);
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
        var limit
        if($.type(opts.limit, "Array")){
            limit = opts.limit
        }else{
            var parent = $el.offsetParent(),
            offset = parent.offset(),
            mleft = offset.left,
            mtop  = offset.top,
            mright = mleft + parent.width(),
            mbottom = mtop + parent.height()
            limit = [mtop, mright, mbottom, mleft]
        }



        "dragstart dragover dragend".replace($.rword, function(event){
            var fn = opts[event];
            if(typeof fn == "function"){
                $el.on(event + ".mass_ui", fn)
            }
        });
        function dragstart(e){
            sington = $(this);//每次只允许运行一个实例
            ui = sington.data("_mass_draggable")
            var position = sington.position();
            $el.addClass("mass_dragging");
            $.mix(ui,{
                left: position.left,
                top: position.top,
                grabPointX: position.left - e.pageX,
                grabPointY: position.top - e.pageY
            });
            fixAndDispatch($el, e, "dragstart");
        }
        if (opts.handle) {
            $el.on('mousedown', opts.handle, dragstart);
        } else {
            $el.on('mousedown', dragstart);
        }
    }

    $.fn.draggable = function( opts ){
        opts = opts || {};
        for(var i =0 ; i < this.length; i++){
            if(this[i] && this[i].nodeType === 1){
                var $el = $(this[i])
                var ui = $el.data("_mass_draggable")
                if(! ui  ){
                    ui = new Draggable( $el, opts );
                    $el.data( "_mass_draggable" , ui );
                }
            }
        }
        return this;
    }
    $doc.on({
        "mouseup.mass_ui blur.mass_ui": function(){
            if(sington){
                $(sington).removeClass("mass_dragging");
                sington = null;
            }
        },
        "mousemove.mass_ui": function(e){
            if(sington){
                //新的坐标
                var newCoords = {};
                if (!ui.lockY) {
                    newCoords.top = e.pageY + ui.grabPointY;
                    if (newCoords.top < minDistanceTop
                        || offset.top < containerTop) {
                        newCoords.top = minDistanceTop;
                    }

                    if (newCoords.top + height > minDistanceBottom
                        || offset.top > containerBottom) {
                        newCoords.top = minDistanceBottom - height;
                    }
                }
                if (!ui.lockX) {
                    newCoords.left = e.pageX + ui.grabPointX;
                }
            }
        },
        "selectstart.mass_ui": function(e){
            if(sington){
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


