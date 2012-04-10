$.define("draggable","event,css,attr",function(){
    //拖动组件 by 司徒正美 https://github.com/RubyLouvre
    $.fn.draggable = function( hash ){
        hash = hash || {};
        var selector = this.selector;
        if( hash.live == true){
            if(typeof selector === "string" && selector.length > 0 ){
                $(this.ownerDocument).on("mousedown.mass_ui",selector,(function(hash){
                    return function(e){
                        draginit(e.target, hash);
                    }
                })(hash));
            }
            return this;
        } else{
            return this.each(function( ){
                draginit(this, hash);
            })
        }
    }
    //用于触发用户绑定的dragstart drag dragend回调, 第一个参数为事件对象, 第二个为dd对象
    function dispatch( event, dragger, dd , type ){
        event.type = type;
        event.namespace = "mass_ui";
        event.namespace_re = new RegExp("(^|\\.)" + "mass_ui" + "(\\.|$)");
        dragger.fire( event, dd );
    }
    //用于实现多点拖动
    function patch( event, dragger, dd, callback){
        if( dd.multi && $.isArrayLike(dd.multi) && dd.multi.length > 0){
            for(var j = 0, node; node = dd.multi[j]; j++){
                if( node != dragger[0] ){//防止环引用，导致死循环
                    $dragger = $(node)
                    callback( event, node );
                }
            }
            $dragger = dragger;
        }
    }

    var $doc = $(document), $dragger//一些全局的东西

    function preventDefault ( event ) {
        event.preventDefault();
    }
    function draginit( node, hash ){
        if(node.nodeType != 1){
            return
        }
        var target = $(node), dd = target.data("_mass_draggable");
        if( dd && dd.target ){
            return
        }
        var position = target.position();
        target.css({
            'top': position.top,
            'left': position.left,
            'position': 'absolute'
        }).attr('draggable', 'true');
        //DD拖动数据对象,用于储存经过修整的用户设置
        dd = {
            target: target,
            multi:  $.isArrayLike(hash.multi)? hash.multi : null,
            handle : typeof hash.handle == "string" ? hash.handle : null,
            scroll : typeof hash.scroll == "boolean" ? hash.scroll : true,
            strict : typeof hash.strict == "boolean" ? hash.strict  : true
        };
        "lockX lockY rewind ghosting click".replace( $.rword, function( key ){
            dd[ key] = !!hash[ key ];
        })
        if( dd.scroll ){
            dd.scrollSensitivity = hash.scrollSensitivity >= 0 ?  hash.scrollSensitivity : 20;
            dd.scrollSpeed = hash.scrollSensitivity >= 0 ?  hash.scrollSpeed : 20;
            dd.scrollParent = target.scrollParent()[0]
            dd.overflowOffset = target.scrollParent().offset();
        }
        if (!hash.noCursor) {
            if (dd.handle) {//添加表示能拖放的样式
                target.find(dd.handle).css('cursor', 'move');
            } else {
                target.css('cursor', 'move');
            }
        }
        "dragstart drag dragend".replace($.rword, function(event){
            var fn = hash[ event ];
            if(typeof fn == "function"){
                target.on(event + ".mass_ui", fn)
            }
        });
        var limit = hash.containment;
        if( limit ){  //修正其可活动的范围，如果传入的坐标
            if($.type(limit, "Array") && limit.length ==4){//[x1,y1,x2,y2] left,top,right,bottom
                this.limit = limit;
            }else{
                if(limit == 'parent')
                    limit = node.parentNode;
                if(limit == 'document' || limit == 'window') {
                    this.limit = [  limit == 'document' ? 0 : $(window).scrollLeft() , limit == 'document' ? 0 : $(window).scrollTop()]
                    this.limit[2]  = this.limit[0] + $(limit == 'document'? document : window).width()
                    this.limit[3]  = this.limit[1] + $(limit == 'document'? document : window).height()
                }
                if(!(/^(document|window|parent)$/).test(limit) && !this.limit) {
                    var c = $(limit);
                    if( c[0] ){
                        var offset = c.offset();
                        this.limit = [ offset.left + parseFloat(c.css("borderLeftWidth")),offset.top + parseFloat(c.css("borderTopWidth")) ]
                        this.limit[2]  = this.limit[0] + c.innerWidth()
                        this.limit[3]  = this.limit[1] + c.innerHeight()
                    }
                }
            }
            if(this.limit){//减少拖动块的面积
                this.limit[2]  = this.limit[2] - target.outerWidth();
                this.limit[3]  = this.limit[3] - target.outerHeight();
            }
        }
        target.on( 'dragstart', preventDefault );//处理原生的dragstart事件
        target.on( 'mousedown', dd.handle, dragstart );//绑定拖动事件
        target.data( "_mass_draggable", dd );
    }

    function dragstart(event, multi ){
        var el = multi || event.currentTarget;//如果是多点拖动，存在第二个参数
        var dragger = $(el);
        var dd = dragger.data( "_mass_draggable" );
        if(dd.ghosting){//创建幽灵元素
            var ghosting = el.cloneNode(false);
            el.parentNode.insertBefore( ghosting,el.nextSibling );
            if( dd.handle ){
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
        if(dragger[0].setCapture){ //设置鼠标捕获
            dragger[0].setCapture();
        }else{ //阻止默认动作
            event.preventDefault();
        };
        $dragger = dragger;//暴露到外围作用域，供drag与dragend与dragstop调用
        dispatch(  event, dragger, dd,  "dragstart" );
        //开始批处理dragstart
        if( ! multi ){
            patch( event, dragger, dd, dragstart );
            //防止隔空拖动，为了性能起见，150ms才检测一下
            if(dd.strict){
                dd.checkID = setInterval( dragstop, 150);
            }
        }
    }

    function drag(event, multi ){
        if( $dragger ){
            var dd = $dragger.data("_mass_draggable");
            dd.event  = event;//这个供dragstop API调用
            //当前元素移动了多少距离
            dd.deltaX = event.pageX - dd.startX;
            dd.deltaY = event.pageY - dd.startY;
            //现在的坐标
            dd.offsetX = dd.deltaX + dd.originalX  ;
            dd.offsetY = dd.deltaY + dd.originalY  ;
            dd.dragging = true;//这个用于dragend API
            if(!dd.lockX){//如果没有锁定X轴left,top,right,bottom
                var left = dd.limit ?  Math.min( dd.limit[2], Math.max( dd.limit[0], dd.offsetX )) : dd.offsetX
                $dragger[0].style.left = left+"px"
            }
            if(!dd.lockY){//如果没有锁定Y轴
                var top =  dd.limit ?   Math.min( dd.limit[3], Math.max( dd.limit[1], dd.offsetY ) ) : dd.offsetY;
                $dragger[0].style.top = top+"px"
            }

            if( dd.scroll ){
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
                    var docTop = $doc.scrollTop(), docLeft = $doc.scrollTop();
                    if(!dd.lockX) {
                        if(event.pageY - docTop < dd.scrollSensitivity)
                            $doc.scrollTop( docTop - dd.scrollSpeed);
                        else if( $(window).height() -  event.pageY + docTop  < dd.scrollSensitivity)
                            $doc.scrollTop( docTop + dd.scrollSpeed);
                    }

                    if(!dd.lockY) {
                        if(event.pageX - docLeft < dd.scrollSensitivity)
                            $doc.scrollLeft( docLeft - dd.scrollSpeed);
                        else if($(window).width() -  event.pageX + docLeft  < dd.scrollSensitivity)
                            $doc.scrollLeft( docLeft + dd.scrollSpeed);
                    }

                }
            }

            dispatch( event, $dragger, dd, "drag");
            //开始批处理drag
            if( !multi ){
                patch( event, $dragger, dd, drag );
            }
        }
    }

    function dragend( event, multi ){
        if($dragger){
            var dragger = $dragger
            var dd = $dragger.data("_mass_draggable");
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
            dispatch( event, dragger, dd,  "dragend" );
            if(dd.rewind || dd.ghosting){
                dd.target.fx( 500,{
                    left:  dd.rewind ? dd.originalX: dd.offsetX,
                    top:   dd.rewind ? dd.originalY: dd.offsetY
                });
            }
            if(dd.dragging && dd.click === false){//阻止"非刻意"的点击事件,因为我们每点击页面,都是依次触发mousedown mouseup click事件
                $.event.fireType = "click";
                setTimeout(function(){
                    delete $.event.fireType
                }, 30)
                dd.dragging = false;
            }
            if( !multi ){
                patch( event, $dragger, dd,  dragend );
                $dragger = null;
            }

        }
    }

    function dragstop(){
        if( $dragger ){
            var dd = $dragger.data("_mass_draggable");
            if(dd.event){
                var offset = $dragger.offset(),
                left = offset.left,
                top = offset.top,
                event = dd.event,
                pageX = event.pageX,
                pageY = event.pageY
                if( pageX <  left || pageY < top || pageX > left+$dragger[0].offsetWidth ||  pageY > top+$dragger[0].offsetHeight ){
                    dragend( event )
                }
            }
        }
    }

    $doc.on({
        "mouseup.mass_ui blur.mass_ui": dragend,
        "mousemove.mass_ui":  drag,
        "selectstart.mass_ui": function(e){
            if( $dragger ){
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