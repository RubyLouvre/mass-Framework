$.define("draggable","event,attr,fx",function(){



    $(document).delegate(".mass_draggable","mousedown", function(){
        
        });
    //http://www.cnblogs.com/rubylouvre/archive/2009/09/11/1563955.html
    var defaults = {
        container:  document.documentElement,//可拖的范围，必须为拖动元素的父级元素，是否为定位元素无所谓。
        limit:   false,//默认false，与container配合使用。当值为true时，它会以container或浏览器的可视区作拖动范围。
        lockX:  false,//默认false。当值为true时，锁定X轴，只允许上下移动。
        lockY:   false,//默认false。当值为true时，锁定Y轴，只允许左右移动。
        handle: "",//手柄的类名，当设置了此参数后，只允许用手柄拖动元素。
        ghosting: false,//默认false。当值为true时，会生成一个与拖动元素相仿的影子元素，拖动时只拖动影子元素，以减轻内存消耗。
        revert: false,//默认false。当值为true时，让拖动元素在拖动后回到原来的位置。
        showCoords: false,//默认false。拖动时在手柄或影子元素上显示元素的坐标。
        scroll: false,//默认false。当值为true时，允许滚动条随拖动元素移动。
        before: $.noop,//在拖动前鼠标按下的那一瞬执行。
        drag:  $.noop,//在拖动时执行。
        after: $.noop//在拖动后鼠标弹起的那一瞬执行。
    }


    function init( ui, hash ){
        var el = ui.parent;
        el.css("position","absolute").addClass("mass_draggable")
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        ui.target = ui.parent;//所有控件都有target属性，这个也不例外
        "Left Right Top Bottom".replace($.rword, function( word ){
            ui["margin"+ word ] = parseFloat( el.css("margin"+ word) )
        });
        var offset = el.offset();
        ui.lockX = offset.left;
        ui.lockY = offset.top;
        ui.handle = ui.handle && el.find("."+ ui.handle)


    }

    $.fn.draggable = Widget.create("draggable", Waterfall, init )
})


