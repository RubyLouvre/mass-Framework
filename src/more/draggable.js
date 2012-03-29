$.define("draggable","node,css,target",function(){
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
        container = getEl(hash.container) || $.html,
        coffset = $(container).offset(),
        cleft = coffset.left,
        ctop  = coffset.top,
        cright = cleft + container.clientWidth,
        cbottom = ctop + container.clientHeight,
        limit = hash.limit,
        lockX = hash.lockX,
        lockY = hash.lockY,
        ghosting = hash.ghosting,
        handle = hash.handle,
        rewind = hash.rewind,
        scroll = hash.scroll,
        coords =  hash.coords,
        dragstart =  hash.dragstart || $.noop,
        dragover =  hash.dragover || $.noop,
        dragend =  hash.dragend || $.noop,
        marginLeft = parseFloat($.css(el,"marginLeft")),
        marginRight = parseFloat($.css(el,"marginRight")),
        marginTop =  parseFloat($.css(el,"marginTop")),
        marginBottom = parseFloat($.css(el,"marginBottom")),
        $el = $(el),
        offset =  $el.offset(),
        _handle,
        _top,
        _left;
        ui.lockX = offset.left;
        ui.lockY = offset.top;
        ui.target = $el
        el.style.position = "absolute";
        if(handle){
            _handle = $el.find("."+handle)[0];
        }
        var dragger = _handle || el, 
        _html = dragger.innerHTML


        function dragoverCallback(e) {
            e = e || window.event;
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
        hash = hash || {}
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


