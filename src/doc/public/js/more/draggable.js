$.define("draggable","event,css",function(){
    var userSelect =  $.cssName("userSelect"), DOC = document;
    function onUnselect(){
        if(typeof userSelect === "string"){
            return $.html.style[userSelect] = "none";
        }
        DOC.unselectable  = "on";
        DOC.selectstart   = function(){
            return false;
        }
    };
    function offUnselect(){
        if(typeof userSelect === "string"){
            return $.html.style[userSelect] = "text";
        }
        DOC.unselectable = "off";
        DOC.selectstart  = null;
    };
    function fixAndDispatch(el, e, type, fn, ui){
        e = $.event.fix( e );
        e.type = type;
        fn.call(el, e, ui);
    }
    function getEl( el ){
        if( el ){
            if(typeof el == "string"){
                return $( el )[0];
            }else if( el.nodeType === 1 ){
                return el;
            }else if( el.mass ){
                return el[0];
            }
        }
        return null;
    }
    Draggable = function(el, hash){
        var ui = this,
        limit = hash.limit,
        container = getEl(limit) || $.html,
        //确定其可活动的范围
        coffset = $(container).offset(),
        cleft = coffset.left,
        ctop  = coffset.top,
        cright = cleft + container.clientWidth,
        cbottom = ctop + container.clientHeight,
        //是否锁定它只能往某一个方向活动
        lockX = hash.lockX,
        lockY = hash.lockY,
        //默认false。当值为true时，会生成一个与拖动元素相仿的影子元素，拖动时只拖动影子元素，以减轻内存消耗。
        ghosting = hash.ghosting,
        //手柄的类名，当设置了此参数后，只允许用手柄拖动元素。
        handle = hash.handle,
        //默认false。当值为true时，让拖动元素在拖动后回到原来的位置
        rewind = hash.rewind,
        //默认false。当值为true时，允许滚动条随拖动元素移动。
        scroll = hash.scroll,
        //默认false。拖动时在手柄或影子元素上显示元素的坐标。
        coords =  hash.coords,
        //三个回调函数，按照HTML5原生拖放的事件名命脉名
        dragstart =  hash.dragstart || $.noop,
        dragover =  hash.dragover || $.noop,
        dragend =  hash.dragend || $.noop,
        //当拖动元素存在margin时，其右边与下边可能会超出容器，因此我们必须取出其相应的margin
        marginLeft = parseFloat($.css(el,"marginLeft")),
        marginRight = parseFloat($.css(el,"marginRight")),
        marginTop =  parseFloat($.css(el,"marginTop")),
        marginBottom = parseFloat($.css(el,"marginBottom")),
        position = $.css(el, "position"),
        $el = $(el),
        offset =  $el.offset(),
        _handle,
        _top,
        _left;
        //保存元素的起始坐标
        ui.lockX = offset.left;
        ui.lockY = offset.top;
        ui.target = $el

        el.style.position = "absolute";
        //修正其可活动的范围，如果传入的坐标
        if($.type(limit, "Array") && limit.length == 4){
            ctop  = limit[0]
            cright = limit[1],
            cbottom = limit[2],
            cleft = limit[3]
        }
        if(handle){
            _handle = $el.find("."+handle)[0];
        }
        var dragger = _handle || el, 
        _html = dragger.innerHTML;


        function dragoverCallback(e) {
            e = e || window.event;
            //            if(DOC.selection){
            //                DOC.selection.empty()
            //            }else{
            //                window.getSelection().removeAllRanges();
            //            }
            _left = e.clientX - ui.offset_x ;
            _top = e.clientY - ui.offset_y;
            if(scroll){
                var doc = hash.container || ($.support.boxModel ?  $.html : DOC.body),
                offset = ui.target.offset(),
                a = offset.left + el.offsetWidth,
                b = doc.clientWidth,
                c = offset.top + el.offsetHeight,
                d = doc.clientHeight;
                if (a > b){
                    doc.scrollLeft = a - b;
                }
                if (c > d){
                    doc.scrollTop = c - d;
                }
                hash.container && (hash.container.style.overflow = "auto");
            }
            if(limit){
                var
                _right = _left + el.offsetWidth ,
                _bottom = _top + el.offsetHeight,
                _left = Math.max(_left, cleft);
                _top = Math.max(_top, ctop);
                if(_right > cright){
                    _left = cright - el.offsetWidth - marginLeft - marginRight;
                }
                if(_bottom > cbottom){
                    _top = cbottom - el.offsetHeight  - marginTop - marginBottom;
                }
            }
            lockX && ( _left = ui.lockX);
            lockY && ( _top = ui.lockY);
            (ghosting || el).style.left = _left + "px";
            (ghosting || el).style.top = _top  + "px";
            ui.top = _top;
            ui.left = _left
            coords && ((_handle || ghosting || el).innerHTML = _left + " x " + _top);
            fixAndDispatch(el, e, "dragover", dragover, ui)
        }
        function dragendCallback(e){
            $.unbind(DOC, "mouseover",dragoverCallback);
            $.unbind(DOC, "mouseup",  dragendCallback);
            ghosting && el.parentNode.removeChild(ghosting);
            dragger.innerHTML = _html;
            el.style.left = ui[rewind ? "lockX" : "left"]  + "px";
            el.style.top =  ui[rewind ? "lockY" : "top"]  + "px";
            if(rewind){
                el.style.position = position;
            }
            offUnselect();//恢复文字被选中功能
            fixAndDispatch(el, e || event, "dragend", dragend, ui);
        }
        ui.dragstart = $.bind(dragger, "mousedown",function(e){
            e = e || event;
            ui.offset_x = e.clientX - el.offsetLeft;
            ui.offset_y = e.clientY - el.offsetTop;
            $.bind(DOC, "mouseover",dragoverCallback);
            $.bind(DOC, "mouseup",  dragendCallback);
            if(ghosting){
                ghosting = el.cloneNode(false);
                el.parentNode.insertBefore(ghosting,el.nextSibling);
                if(_handle){
                    _handle = _handle.cloneNode(false);
                    ghosting.appendChild(_handle);
                }
                if($.support.cssOpacity){
                    ghosting.style.opacity = 0.5;
                }else{
                    ghosting.style.filter = "alpha(opacity=50)";
                }
            };
          
            dragger.style.zIndex = ++Draggable.z;
            dragger.style.cursor = "pointer";
            onUnselect();//防止文字被选中
            fixAndDispatch(el, e, "dragstart", dragstart, ui)
            return false;
        })
    }
    Draggable.z = 99;
    $.fn.draggable = function( hash ){
        hash = hash || {};
        for(var i =0 ; i < this.length; i++){
            if(this[i] && this[i].nodeType === 1){
                var ui = $.data(this[i],"_mass_draggable")
                if(! ui  ){
                    ui = new Draggable( this[i], hash );
                    $.data( this[i],"_mass_draggable" , ui );
                }
            }
        }
        return this;
    }
})


