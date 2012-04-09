$.define("draggable","event,css,attr",function(){
    var  $doc = $(document), dragger, dd//一些全局的东西
    function preventDefault (e) {
        e.preventDefault();
    }
    function fixAndDispatch(el, e, type){
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
        // $.log(this.limit)
        }
        
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
    function dragstart(event){
        var el = event.currentTarget;
        dragger = $(el);//每次只允许运行一个实例
        dd = dragger.data("_mass_draggable")
        if(dd.ghosting){
            var ghosting = el.cloneNode(false);
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

        dragger.fire("draginit", dd);
        if(dd.multi && dd.multi.lenth > 0){
            $.log(dd.multi)
        }
        var offset = dragger.offset();
        dragger.addClass("mass_dragging");
        dd.startX = event.pageX;
        dd.startY = event.pageY;
        dd.originalX = offset.left;
        dd.originalY = offset.top;
        if(dragger[0].setCapture){
            //设置鼠标捕获
            dragger[0].setCapture();
        }else{
            //阻止默认动作
            event.preventDefault();
        };
        if(dd.multi && dd.multi.length > 1){
            $.log( dd.multi.not(dragger))
        }
        //防止隔空拖动，为了性能起见，150ms才检测一下
        dd.checkID = setInterval(dragstop, 150);
        fixAndDispatch(dragger, event, "dragstart");
    }
    function dragstop(){
        if( dd && dd.event ){
            var offset = dragger.offset(),
            left = offset.left,
            top = offset.top,
            event = dd.event,
            pageX = event.pageX,
            pageY = event.pageY
            if( pageX <  left || pageY < top || pageX > left+dragger[0].offsetWidth ||  pageY > top+dragger[0].offsetHeight ){
                dragend( event )
            }
        }
    }
    function dragend(event){
        if(dragger){
            if(dd.checkID){
                clearInterval(dd.checkID);
                delete dd.event;
                delete dd.checkID;
            }
            if(dragger[0].releaseCapture){
                dragger[0].releaseCapture();
            }
            dragger.removeClass("mass_dragging");
            dd.ghosting && dragger.remove();
            event && fixAndDispatch(dragger, event, "dragend");
            if(dd.rewind || dd.ghosting){
                dd.target.fx( dd.duration,{
                    left:  dd.rewind ? dd.originalX: dd.offsetX,
                    top:   dd.rewind ? dd.originalY: dd.offsetY
                });
            }
            dragger = null;
        }
    }

    $doc.on({
        "mouseup.mass_ui blur.mass_ui": dragend,
        "mousemove.mass_ui": function(event){
            if(dragger){
                dd.event  = event;
                //当前元素移动了多少距离
                dd.deltaX = event.pageX - dd.startX;
                dd.deltaY = event.pageY - dd.startY;
                //现在的坐标
                dd.offsetX = dd.deltaX + dd.originalX  ;
                dd.offsetY = dd.deltaY + dd.originalY  ;
                var obj = {}
                if(!dd.lockX){//如果没有锁定X轴left,top,right,bottom
                    var left = obj.left = dd.limit ?  Math.min( dd.limit[2], Math.max( dd.limit[0], dd.offsetX )) : dd.offsetX
                    dragger[0].style.left = left+"px"
                }
                if(!dd.lockY){//如果没有锁定Y轴
                    var top =  obj.top = dd.limit ?   Math.min( dd.limit[3], Math.max( dd.limit[1], dd.offsetY ) ) : dd.offsetY;
                    dragger[0].style.top = top+"px"
                }

                if(dd.scroll){
                    if(dd.scrollParent != document && dd.scrollParent.tagName != 'HTML') {
                        if(!dd.lockX) {
                            if((dd.overflowOffset.top + dd.scrollParent.offsetHeight) - event.pageY < dd.scrollSensitivity)
                                dd.scrollParent.scrollTop = dd.scrollParent.scrollTop + dd.scrollSpeed;
                            else if(event.pageY - dd.overflowOffset.top < dd.scrollSensitivity)
                                dd.scrollParent.scrollTop = dd.scrollParent.scrollTop - dd.scrollSpeed;
                        }
                
                        if(!dd.lockY) {
                            if((dd.overflowOffset.left + dd.scrollParent.offsetWidth) - event.pageX < dd.scrollSensitivity)
                                dd.scrollParent.scrollLeft = dd.scrollParent.scrollLeft + dd.scrollSpeed;
                            else if(event.pageX - dd.overflowOffset.left < dd.scrollSensitivity)
                                dd.scrollParent.scrollLeft =  dd.scrollParent.scrollLeft - dd.scrollSpeed;
                        }
                
                    } else {
                
                        if(!dd.lockX) {
                            if(event.pageY - $doc.scrollTop() < dd.scrollSensitivity)
                                $doc.scrollTop($doc.scrollTop() - dd.scrollSpeed);
                            else if($(window).height() - (event.pageY - $doc.scrollTop()) < dd.scrollSensitivity)
                                $doc.scrollTop($doc.scrollTop() + dd.scrollSpeed);
                        }
                
                        if(!dd.lockY) {
                            if(event.pageX - $doc.scrollLeft() < dd.scrollSensitivity)
                                $doc.scrollLeft($doc.scrollLeft() - dd.scrollSpeed);
                            else if($(window).width() - (event.pageX - $doc.scrollLeft()) < dd.scrollSensitivity)
                                $doc.scrollLeft($doc.scrollLeft() + dd.scrollSpeed);
                        }
                
                    }
                
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
