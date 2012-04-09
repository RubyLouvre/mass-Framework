$.define("draggable","event,css,attr",function(){
    var  $doc = $(document), draggers = [], dds = []//一些全局的东西
    function preventDefault (e) {
        e.preventDefault();
    }
    function fixAndDispatch(el, e, type, dd){
        e.type = type;
        e.namespace = "mass_ui";
        e.namespace_re = new RegExp("(^|\\.)" + "mass_ui" + "(\\.|$)");
        el.fire(e, dd);
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
        //是否锁定它只能往某一个方向活动
        this.lockX = !!opts.lockX
        this.lockY = !!opts.lockY;
        //默认false。当值为true时，让拖动元素在拖动后回到原来的位置
        this.rewind = !!opts.rewind;
        //默认false。当值为true时，会生成一个与拖动元素相仿的影子元素，拖动时只拖动影子元素，以减轻内存消耗。
        this.ghosting = !!opts.ghosting;
        this.target = $el;
        //动画持续时间
        this.duration = isFinite(opts.duration) ? opts.duration : 500;
        //手柄的类名，当设置了此参数后，只允许用手柄拖动元素。
        this.handle = typeof opts.handle == "string" ? opts.handle : null;
        //默认true, 允许滚动条随拖动元素移动。
        this.scroll = typeof opts.scroll == "boolean" ? opts.scroll : true;
        if(this.scroll){
            this.scrollSensitivity = opts.scrollSensitivity >= 0 ?  opts.scrollSensitivity : 20;
            this.scrollSpeed = opts.scrollSensitivity >= 0 ?  opts.scrollSpeed : 20;
            this.scrollParent = $el.scrollParent()[0]
            this.overflowOffset = $el.scrollParent().offset();
        }
        "dragstart dragover dragend draginit".replace($.rword, function(event){
            var fn = opts[event];
            if(typeof fn == "function"){
                $el.on(event + ".mass_ui", fn)
            }
        });
       
        $el.on('mousedown',this.handle , dragstart);

        var limit = opts.containment;
        if(limit){
            //修正其可活动的范围，如果传入的坐标
            if($.type(limit, "Array") && limit.length ==4){//[x1,y1,x2,y2] left,top,right,bottom
                this.limit = limit;
            }else{
                if(limit == 'parent')
                    limit = $el[0].parentNode;
                if(limit == 'document' || limit == 'window') {
                    this.limit = [  limit == 'document' ? 0 : $(window).scrollLeft() , limit == 'document' ? 0 : $(window).scrollTop()]
                    this.limit[2]  = this.limit[0] + $(limit == 'document'? document : window).width()
                    this.limit[3]  = this.limit[1] + $(limit == 'document'? document : window).height()
                }
                if(!(/^(document|window|parent)$/).test(limit) && !this.limit) {
                    var c = $(limit);
                    if(c[0]){
                        var offset = c.offset();
                        this.limit = [ offset.left + parseFloat(c.css("borderLeftWidth")),offset.top + parseFloat(c.css("borderTopWidth")) ]
                        this.limit[2]  = this.limit[0] + c.innerWidth()
                        this.limit[3]  = this.limit[1] + c.innerHeight()
                    }
                }
            }
            if(this.limit){//减少拖动块的面积
                this.limit[2]  = this.limit[2] - $el.outerWidth();
                this.limit[3]  = this.limit[3] - $el.outerHeight();
            }
        }
        
    }

    $.fn.draggable = function( opts ){
        opts = opts || {};
        for(var i = 0 ; i < this.length; i++){
            if(this[i] && this[i].nodeType === 1){
                var $el = $(this[i]);
                var dd = $el.data("_mass_draggable")
                if(! dd  ){
                    dd = new Draggable( $el, opts );
                    $el.data( "_mass_draggable" , dd );
                }
            }
        }
        return this;
    }
    function dragstart(event){
        var el = event.currentTarget ,
        dd = $.data(el, "_mass_draggable"),
        uniq = {}, ghosting, uuid, dragger;
        $(el).fire("draginit", dd);
        var nodes =  dd.multi || [];
        nodes[nodes.length] = el;
        for(var i = 0 ; el = nodes[i++];){
            uuid = $.getUid(el);
            if(!uniq[uuid]){
                uniq[uuid] = 1;
                dd = $.data(el, "_mass_draggable");
                if(dd){
                    dragger = $(el)
                    if(dd.ghosting){
                        ghosting = el.cloneNode(false);
                        el.parentNode.insertBefore(ghosting,el.nextSibling);
                        if( dd.handle){
                            dragger.find(dd.handle).appendTo(ghosting)
                        }
                        if($.support.cssOpacity){
                            ghosting.style.opacity = 0.5;
                        }else{
                            ghosting.style.filter = "alpha(opacity=50)";
                        }
                        dragger = $(ghosting).addClass("mass_ghosting");
                    };
                    var offset = dragger.offset();
                    dragger.addClass("mass_dragging");
                    dd.startX = event.pageX;
                    dd.startY = event.pageY;
                    dd.originalX = offset.left;
                    dd.originalY = offset.top;
                   
                    if(el.setCapture){ //设置鼠标捕获
                        el.setCapture();
                    }else{  //阻止默认动作
                        event.preventDefault();
                    };
                    //防止隔空拖动，为了性能起见，150ms才检测一下
                    fixAndDispatch(dragger, event, "dragstart",dd);
                    draggers.push(dragger);
                    dds.push(dd)
                }
            }
        }

        dds.checkID = setInterval(dragstop, 150);
    }

    function dragstop(){

        for(var i = 0, n = draggers.length; i < n; i++ ){
            var dd = dds[i], dragger = draggers[i];
            if( dragger && dd.event ){
                var offset = dragger.offset(),
                left = offset.left,
                top = offset.top,
                event = dd.event,
                pageX = event.pageX,
                pageY = event.pageY
                if( pageX <  left || pageY < top || pageX > left+dragger[0].offsetWidth ||  pageY > top+dragger[0].offsetHeight ){
                    singtonDragend( event, dragger, dd, i )
                }
            }
        }
    }

    function singtonDragend(event, dragger, dd , i){
        if(dragger[0].releaseCapture){
            dragger[0].releaseCapture();
        }
        dragger.removeClass("mass_dragging");
        if(dd.rewind || dd.ghosting){
            dd.target.fx( dd.duration,{
                left:  dd.rewind ? dd.originalX: dd.offsetX,
                top:   dd.rewind ? dd.originalY: dd.offsetY
            });
        }
        fixAndDispatch(dragger, event, "dragend", dd);
        dd.ghosting && dragger.remove();
        if(dd.dragging){//阻止"非刻意"的点击事件,因为我们每点击页面,都是依次触发mousedown mouseup click事件
            $.event.fireType = "click";
            setTimeout(function(){
                delete $.event.fireType
            }, 30)
            dd.dragging = false;
        }
        draggers[i] = ""
    }

    function dragends(event){
        for(var i = 0, n = draggers.length; i < n; i++ ){
            var dd = dds[i], dragger = draggers[i];
            if( dragger ){
                singtonDragend( event, dragger, dd, i )
            }
        }
        if(draggers.join("") == ""){
            draggers = [];
            clearInterval(dds.checkID);
            dds = [];
        }
    }
    $doc.on({
        "mouseup.mass_ui blur.mass_ui": dragends,
        "mousemove.mass_ui": function(event){
            if(draggers.length){
                //缓存这四个值,以获取最大性能
                var docTop = $doc.scrollTop(), docLeft = $doc.scrollLeft(),
                winHeight = $(window).height(),   winWidth = $(window).width()

                for(var i = 0, n = draggers.length; i < n; i++ ){
                    if(draggers[i]){
                        var dd = dds[i], dragger = draggers[i];
                        dd.event = event;
                        //当前元素移动了多少距离
                        dd.deltaX = event.pageX - dd.startX;
                        dd.deltaY = event.pageY - dd.startY;
                        //现在的坐标
                        dd.offsetX = dd.deltaX + dd.originalX  ;
                        dd.offsetY = dd.deltaY + dd.originalY  ;
                        dd.dragging = true;//这个必须在mousemove中设置
                        if(!dd.lockX){//如果没有锁定X轴 left,top,right,bottom
                            var left =  dd.limit ?  Math.min( dd.limit[2], Math.max( dd.limit[0], dd.offsetX )) : dd.offsetX
                            dragger[0].style.left = left + "px";
                        }
                        if(!dd.lockY){//如果没有锁定Y轴 left,top,right,bottom
                            var top =   dd.limit ?   Math.min( dd.limit[3], Math.max( dd.limit[1], dd.offsetY ) ) : dd.offsetY;
                            dragger[0].style.top = top + "px";
                        }
                        if(dd.scroll){
                            //如果允许拖动块总是出现在页面上,则要修正scrollTop或scrollLeft
                            if(dd.scrollParent != document && dd.scrollParent.tagName != 'HTML') {

                                if(!dd.lockX) {
                                    if((dd.overflowOffset.top + dd.scrollParent.offsetHeight) - event.pageY < dd.scrollSensitivity){
                                        dd.scrollParent.scrollTop = dd.scrollParent.scrollTop + dd.scrollSpeed;
                                    } else if(event.pageY - dd.overflowOffset.top < dd.scrollSensitivity){
                                        dd.scrollParent.scrollTop = dd.scrollParent.scrollTop - dd.scrollSpeed;
                                    }
                                }

                                if(!dd.lockY) {
                                    if((dd.overflowOffset.left + dd.scrollParent.offsetWidth) - event.pageX < dd.scrollSensitivity){
                                        dd.scrollParent.scrollLeft = dd.scrollParent.scrollLeft + dd.scrollSpeed;
                                    } else if(event.pageX - dd.overflowOffset.left < dd.scrollSensitivity){
                                        dd.scrollParent.scrollLeft =  dd.scrollParent.scrollLeft - dd.scrollSpeed;
                                    }
                                }

                            } else {

                                if(!dd.lockX) {
                                    if(event.pageY - docTop < dd.scrollSensitivity){
                                        $doc.scrollTop( docTop - dd.scrollSpeed );
                                    } else if( winHeight - (event.pageY - docTop ) < dd.scrollSensitivity){
                                        $doc.scrollTop( docTop + dd.scrollSpeed);
                                    }

                                }

                                if(!dd.lockY) {
                                    if(event.pageX - docLeft < dd.scrollSensitivity)
                                        $doc.scrollLeft( docLeft - dd.scrollSpeed);
                                    else if( winWidth - ( event.pageX - docLeft ) < dd.scrollSensitivity)
                                        $doc.scrollLeft( docLeft + dd.scrollSpeed );
                                }

                            }

                        }

                        fixAndDispatch(dragger, event, "dragover", dd);
                    }
                }
            }
        },
        "selectstart.mass_ui": function(e){
            if(draggers.length){
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


