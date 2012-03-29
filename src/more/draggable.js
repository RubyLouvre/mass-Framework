$.define("draggable","more/uibase,event,attr,fx",function(Widget){
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
    //http://madrobby.github.com/scriptaculous/draggable/
    //http://www.cnblogs.com/rubylouvre/archive/2009/09/11/1563955.html
    var defaults = {
        limit:   false,//默认false，与area配合使用。当值为true时，它会以area或浏览器的可视区作拖动范围。
        lockX:  false,//默认false。当值为true时，锁定X轴，只允许上下移动。
        lockY:   false,//默认false。当值为true时，锁定Y轴，只允许左右移动。
        handle: false,//手柄的类，当设置了此参数后，只允许用手柄拖动元素(比如Google的个性化主页，只拖拽标题就能拖动整个方块)。
        ghosting: false,//默认false。当值为true时，会生成一个与拖动元素相仿的影子元素，拖动时只拖动影子元素，以减轻内存消耗。
        rewind: false,//默认false。当值为true时，让拖动元素在拖动后回到原来的位置。
        scroll: false,//默认false。当值为true时，允许滚动条随拖动元素移动。
        coords :false
    //  area: "",
    //  dragstart: function(e, ui){}
    //  dragover: function(e, ui){}
    //  dragend: function(e, ui){}
    }
    var Draggable = $.factory({
        inherit: Widget.Class,
        destroy:function(){
            $.unbind(this.handle || this.target[0], "mousedown", this.dragstart);
            this._super();
        }
    });
    Draggable.z = 999;
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
    function fixAndDispatch(el, type, e){
        if(typeof e.namespace != "string"){
            e = $.event.fix( e );
        }
        e.type = type;
        $.event.fire.call(el, e, Draggable.ui);
    }
    function init( ui, hash ){
        var el = ui.parent;
        hash = hash || {};
        ui.target = ui.parent;
        el.css("position","absolute").addClass("mass_draggable")
        ui.setOptions(defaults , hash);
        ui.target = ui.parent;//所有控件都有target属性，这个也不例外
        "Left Right Top Bottom".replace($.rword, function( word ){
            ui["margin"+ word ] = parseFloat( el.css("margin"+ word) )
        });
        var offset = el.offset();
        ui.lockX = ui.lockX && offset.left;
        ui.lockY = ui.lockY && offset.top;
        ui.handle = getEl( hash.handle );//手柄
        ui._area  = getEl( hash.area );//容器
        ui.area = ui._area || $.html;//可拖的区域，必须为元素节点，是否为定位元素无所谓。
        var aoffset = $( ui.area ).offset();
        //预先求得容器的边界
        ui.aleft = aoffset.left;
        ui.atop = aoffset.top;
        ui.aright =  ui.aleft + ui.area.clientWidth;
        ui.abottom = ui.atop + ui.area.clientHeight;
        if(ui.scroll && ui._area){
            ui._area.style.overflow = "auto";
        }
        "dragstart,dragover,dragend".replace($.rword, function(type){
            if(typeof hash[type] === "function"){
                el.bind(type, hash[type])
            }
        });
        var obj = ui.handle || el[0];
        ui.dragstart = $.bind(obj , "mousedown", function(e){
            Draggable.dragstart.call(obj, window.event || e, ui)
        });
    }
    Draggable.dragstart = function(e, ui){
        var el = this;
        ui.offset_x = e.clientX - el.offsetLeft;
        ui.offset_y = e.clientY - el.offsetTop;
        el.style.cursor = "pointer";
        if( ui.ghosting ){
            var node = ui.target[0],
            _ghost = node.cloneNode(false);
            node.parentNode.appendChild( _ghost );
            $.log(_ghost)
            if( ui.handle ){
                var _handle = ui.handle.cloneNode(false);
                _ghost.appendChild( _handle );
            }
            _ghost.style.top = ui.target.offset().top +"px"
            _ghost.style.left = ui.target.offset().left +"px"
            _ghost.style.position = "absolute"
            if($.support.cssOpacity){
                _ghost.style.opacity = 0.5;
            }else{
                _ghost.style.filter = "alpha(opacity=50)";
            }
            _ghost.className = "mass_ghosting";
            ui._ghost = _ghost;
        }
        onUnselect();
        Draggable.ui = ui;
        var target = _ghost || el
        if(target.style.zIndex < Draggable.z){
            target.style.zIndex = ++Draggable.z;
        }
        $.bind(DOC,"mousemove",Draggable.dragover);
        $.bind(DOC,"mouseup",  Draggable.dragend);
        fixAndDispatch(el, "dragstart", e );
        return false;
    }
    Draggable.dragover = function(eve){
        var ui =  Draggable.ui;
        if( ui ){
            var el = ui.target[0],
            e = eve || window.event,
            _left = e.clientX - ui.offset_x ,
            _top  = e.clientY - ui.offset_y;
            if( ui.scroll ){
                var
                doc =  ui.area || ( $.support.boxModel ? DOC.body : $.html ),
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
            }
            if(ui.limit){
                var
                _right  = _left + el.offsetWidth ,
                _bottom = _top  + el.offsetHeight;
                _left   = Math.max(_left, ui.aleft);
                _top    = Math.max(_top, ui.atop);
                if( _right > ui.aright ){
                    _left = ui.aright - el.offsetWidth - ui.marginLeft - ui.marginRight;
                }
                if( _bottom > ui.abottom ){
                    _top = ui.abottom - el.offsetHeight - ui.marginTop - ui.marginBottom;
                }
            }
            if( typeof ui.lockX === "number" ){
                _left = ui.lockX;//保持原来的数值不变
               
            }
            if( typeof ui.lockY === "number" ){
                _top = ui.lockY;//保持原来的数值不变
            }
            ui.x = _left;
            ui.y = _top;

            (ui._ghost || el).style.left = _left + "px";
            (ui._ghost || el).style.top = _top  + "px";
            ui.coords && (( ui.handle || ui._ghost || el).innerHTML = _left + " x " + _top);
            fixAndDispatch(el, "dragover", e );
        }
    }
    Draggable.dragend = function( e ){
        var ui =  Draggable.ui;
        if( ui ){
            var el = ui.target[0];
            $.unbind( DOC,"mousemove",Draggable.dragover );
            $.unbind( DOC,"mouseup",  Draggable.dragend );
            if( ui._ghost ){
                try{
                    ui._ghost.parentNode.removeChild( ui._ghost );
                }catch(e){
                    console.log(ui._ghost.parentNode);
                    console.log(el.parentNode.removeChild)
                    $.log(e)
                }
             
            }
            if( ui.rewind ){//是否回到原来的位置
                el.style.left = el.lockX   + "px";
                el.style.top = el.lockY  + "px";
             
            }else{
                el.style.left =  (ui._ghost || el).style.left;
                el.style.top = (ui._ghost || el).style.top;
            }
            fixAndDispatch(el, "dragend", e );
            offUnselect();
            delete Draggable.ui;
        }
    }

    $.fn.draggable = Widget.create("draggable", Draggable, init )
})


