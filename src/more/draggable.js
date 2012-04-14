$.define("draggable","more/uibase,event,attr,fx",function(Widget){
    var $doc = $(document), $dragger//一些全局的东西
    //支持触模设备
    var supportTouch = $.support.touch = "createTouch" in document || 'ontouchstart' in window
    || window.DocumentTouch && document instanceof DocumentTouch;
    var onstart = supportTouch ? "touchstart" : "mousedown"
    var ondrag = supportTouch ? "touchmove" : "mousemove"
    var onend = supportTouch ? "touchend" : "mouseup"
    var Draggable = $.factory({
        inherit: Widget.Class,
        //用于触发用户绑定的dragstart drag dragend回调, 第一个参数为事件对象, 第二个为dd对象
        dispatch: function ( event, dragger , type ){
            event.type = type ;
            event.namespace = "mass_dd";
            event.namespace_re = new RegExp("(^|\\.)mass_dd(\\.|$)");
            dragger.fire( event, this );
        },
        //用于实现多点拖动
        patch: function ( event, dragger, callback, l, t){
            if( this.multi && $.isArrayLike(this.multi) && this.multi.length > 0){
                for(var j = 0, node; node = this.multi[j]; j++){
                    if( node != dragger[0] ){//防止环引用，导致死循环
                        $dragger = $(node)
                        callback( event, node, l, t );
                    }
                }
                $dragger = dragger;
            }
        }
    });
    function preventDefault ( event ) {
        event.preventDefault();
    }
    //初始化拖动对象
    function init( dd, hash ){
        hash = hash || {};
        var target = dd.target =  dd.parent ;
        var position = target.position();
        target.css({
            'top': position.top,
            'left': position.left,
            'position': 'absolute'
        }).attr('mass_dd', 'true');
        //DD拖动数据对象,用于储存经过修整的用户设置
        $.mix( dd, {
            multi:  $.isArrayLike( hash.multi ) ? hash.multi : null,
            handle : typeof hash.handle == "string" ? hash.handle : null,
            scroll : typeof hash.scroll == "boolean" ? hash.scroll : true,
            strict : typeof hash.strict == "boolean" ? hash.strict : true,
            returning : typeof hash.returning == "boolean" ? hash.returning : true
        });
        "lockX lockY revert ghosting click".replace( $.rword, function( key ){
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
        "dragstart drag dragend dragenter dragover dragleave drop".replace($.rword, function(event){
            var fn = hash[ event ];
            if(typeof fn == "function"){
                target.on(event + ".mass_dd", fn)
            }
        });
        var limit = hash.containment;
        if( limit ){  //修正其可活动的范围，如果传入的坐标
            if($.type(limit, "Array") && limit.length ==4){//[x1,y1,x2,y2] left,top,right,bottom
                dd.limit = limit;
            }else{
                if(limit == 'parent')
                    limit = target[0].parentNode;
                if(limit == 'document' || limit == 'window') {
                    dd.limit = [  limit == 'document' ? 0 : $(window).scrollLeft() , limit == 'document' ? 0 : $(window).scrollTop()]
                    dd.limit[2]  = dd.limit[0] + $(limit == 'document'? document : window).width()
                    dd.limit[3]  = dd.limit[1] + $(limit == 'document'? document : window).height()
                }
                if(!(/^(document|window|parent)$/).test(limit) && !this.limit) {
                    var c = $(limit);
                    if( c[0] ){
                        var offset = c.offset();
                        dd.limit = [ offset.left + parseFloat(c.css("borderLeftWidth")),offset.top + parseFloat(c.css("borderTopWidth")) ]
                        dd.limit[2]  = dd.limit[0] + c.innerWidth()
                        dd.limit[3]  = dd.limit[1] + c.innerHeight()
                    }
                }
            }
            if(dd.limit){//减少拖动块的面积
                dd.limit[2]  = dd.limit[2] - target.outerWidth();
                dd.limit[3]  = dd.limit[3] - target.outerHeight();
            }
        }
        target.on( 'dragstart.mass_dd', preventDefault );//处理原生的dragstart事件
        target.on( onstart + ".mass_dd", dd.handle, dragstart );//绑定拖动事件
        dd.dropinit && dd.dropinit(hash);
    }

    function dragstart(event, multi ){
        var el = multi || event.currentTarget;//如果是多点拖动，存在第二个参数
        var dragger = $(el), dd = dragger.data( "_mass_dd" );
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
            dragger.data( "_mass_dd", dd );
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
        $dragger = dd.dragger = dragger;//暴露到外围作用域，供drag与dragend与dragstop调用
        dd.dragtype = "dragstart"
        dd.dispatch(  event, dragger,  "dragstart");
        dd.dropstart && dd.dropstart( event );
        if( ! multi ){ //开始批处理dragstart
            dd.patch( event, dragger,  dragstart );
            //防止隔空拖动，为了性能起见，150ms才检测一下
            if(dd.strict){
                dd.checkID = setInterval( dragstop, 150);
            }
        }
    }
    function drag(event, multi,  docLeft, docTop ){
        if( $dragger ){
            var dd = $dragger.data("_mass_dd");
            dd.event  = event;//这个供dragstop API调用
            //当前元素移动了多少距离
            dd.deltaX = event.pageX - dd.startX;
            dd.deltaY = event.pageY - dd.startY;
            //现在的坐标
            dd.offsetX = dd.deltaX + dd.originalX  ;
            dd.offsetY = dd.deltaY + dd.originalY  ;
            dd.dragtype = "drag"
            if(!dd.lockX){//如果没有锁定X轴left,top,right,bottom
                var left = dd.limit ?  Math.min( dd.limit[2], Math.max( dd.limit[0], dd.offsetX )) : dd.offsetX
                $dragger[0].style.left = left+"px"
            }
            if(!dd.lockY){//如果没有锁定Y轴
                var top =  dd.limit ?   Math.min( dd.limit[3], Math.max( dd.limit[1], dd.offsetY ) ) : dd.offsetY;
                $dragger[0].style.top = top+"px"
            }
            if(dd.drop){
                dd.drop()
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

                        if((dd.overflowOffset.left + dd.scrollParent.offsetWidth ) - event.pageX < dd.scrollSensitivity)
                            dd.scrollParent.scrollLeft = dd.scrollParent.scrollLeft + dd.scrollSpeed;
                        else if(event.pageX - dd.overflowOffset.left < dd.scrollSensitivity)
                            dd.scrollParent.scrollLeft =  dd.scrollParent.scrollLeft - dd.scrollSpeed;
                    }

                } else {
                    docLeft = docLeft || $doc.scrollTop();
                    docTop = docTop || $doc.scrollTop();
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
            dd.dispatch( event, $dragger, "drag" );
            dd.drop && dd.drop(  event );
            //开始批处理drag
            if( !multi ){
                dd.patch( event, $dragger, drag, docLeft, docTop  );
            }
        }
    }
    function dragend( event, multi ){
        if($dragger){
            var dragger = $dragger
            var dd = $dragger.data("_mass_dd");
            if(dd.checkID){
                clearInterval(dd.checkID);
                dd.event = dd.checkID = null;
            }
            if(dragger[0].releaseCapture){
                dragger[0].releaseCapture();
            }
            dragger.removeClass("mass_dragging");
           
            if(dd.revert || dd.ghosting && dd.returning){
                dd.target.fx( 500,{//先让拖动块回到幽灵元素的位置
                    left:  dd.revert ? dd.originalX: dd.offsetX,
                    top:   dd.revert ? dd.originalY: dd.offsetY
                });
            }
            dd.ghosting && dragger.remove();//再移除幽灵元素
            dd.dropend &&  dd.dropend( event );//先执行drop回调
            dd.dispatch( event, dragger, "dragend" );//再执行dragend回调
            if(dd.dragtype == "drag" && dd.click === false){//阻止"非刻意"的点击事件,因为我们每点击页面,都是依次触发mousedown mouseup click事件
                $.event.fireType = "click";
                setTimeout(function(){
                    delete $.event.fireType
                }, 30)
                dd.dragtype = "dragend";
            }
            if( !multi ){
                dd.patch( event, $dragger, dragend );
                $dragger = null;
            }
        }
    }
    function dragstop(){
        if( $dragger ){
            var dd = $dragger.data("_mass_dd");
            if(dd.event){
                var offset = $dragger.offset(),
                left = offset.left,
                top = offset.top,
                event = dd.event,
                pageX = event.pageX,
                pageY = event.pageY
                if( pageX <  left || pageY < top || pageX > left + $dragger[0].offsetWidth ||  pageY > top + $dragger[0].offsetHeight ){
                    dragend( event )
                }
            }
        }
    }

    $doc.on( ondrag +".mass_dd", drag)
    $doc.on( onend + ".mass_dd blur.mass_dd", dragend)
    $doc.on("selectstart.mass_dd",function(e){
        if( $dragger ){
            preventDefault(e);
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            } else if (document.selection) {
                document.selection.clear();
            }
        }
    });
    var create = Widget.create("dd", Draggable, init );
    $.fn.draggable = function(hash){
        if( hash && hash.live == true){
            var selector = this.selector;
            if(typeof selector === "string" && selector.length > 0 ){
                $(this.ownerDocument).on( onstart + ".mass_dd",selector,(function(h){
                    return function(e){
                        create.call($(e.target), h || {})
                    }
                })(hash));
            }
            return this;
        }else{
            return create.call(this, hash)
        }
    }
    return Draggable;
});
