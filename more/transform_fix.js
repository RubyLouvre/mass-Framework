var ident  = "DXImageTransform.Microsoft.Matrix",
   rtransform = /(\w+)\(([^)]+)\)/g;
//deg:degrees 角度,grad grads,百分度 rad	radians, 弧度
function toRadian(value) {
    return ~value.indexOf("deg") ?
    parseInt(value,10) *  Math.PI/180:
    ~value.indexOf("grad") ?
    parseInt(value,10) * Math.PI/200:
    parseFloat(value);
}

adapter[ "transform:get" ] = function(node, name){
    var m = $._data(node,"matrix")
    if(!m){
        if(!node.currentStyle.hasLayout){
            node.style.zoom = 1;
        }
        //IE9下请千万别设置  <meta content="IE=8" http-equiv="X-UA-Compatible"/>
        //http://www.cnblogs.com/Libra/archive/2009/03/24/1420731.html
        if(!node.filters[ident]){
            var old = node.currentStyle.filter;//防止覆盖已有的滤镜
            node.style.filter =  (old ? old +"," : "") + " progid:" + ident + "(sizingMethod='auto expand')";
        }
        var f = node.filters[ident];
        m = new $.Matrix2D( f.M11, f.M12, f.M21, f.M22, f.Dx, f.Dy);
        $._data(node,"matrix",m ) //保存到缓存系统，省得每次都计算
    }
    return name === true ? m : m.toString();
}

adapter[ "transform:set" ] = function(node, name, value){
    var m = adapter[ "transform:get" ](node, true).set( 1,0,0,1,0,0 );
    var filter = node.filters[ident];
    filter.M11 =  filter.M22 = 1;//重置矩形
    filter.M12 =  filter.M21 = 0;
    var width = node.offsetWidth
    var height = node.offsetHeight
    var el = $(node);//处理元素的定位问题，保存原来元素与offsetParent的距离
    if(node._mass_top == null && el.css("position") != "static"){
        var p = el.position()
        node._mass_top = p.top;
        node._mass_left = p.left;
    }
    value.toLowerCase().replace(rtransform,function(_,method,array){
        array = array.replace(/px/g,"").match($.rword) || [];
        if(/skew|rotate/.test(method)){//角度必须带单位
            array[0] = toRadian(array[0] );//IE矩阵滤镜的方向是相反的
            array[1] = toRadian(array[1] || "0");
        }
        if(method == "scale" && array[1] == void 0){
            array[1] = array[0] //sy如果没有定义等于sx
        }
        if(method !== "matrix"){
            method = method.replace(/(x|y)$/i,function(_,b){
                return  b.toUpperCase();//处理translateX translateY scaleX scaleY skewX skewY等大小写问题
            })
        }
        m[method].apply(m, array);
        filter.M11 = m.a;//0
        filter.M12 = m.c;//2★★★注意这里的顺序, IE滤镜和其他浏览器定义的角度方向相反
        filter.M21 = m.b;//1
        filter.M22 = m.d;//3
        filter.Dx  = m.tx;
        filter.Dy  = m.ty;
    //http://extremelysatisfactorytotalitarianism.com/blog/?p=922
    //http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php
    });
    node.style.position = "relative";
    node.style.left = (node._mass_left | 0) + ( width - node.offsetWidth )/2  + m.tx  + "px";
    node.style.top = (node._mass_top | 0) + ( height - node.offsetHeight) /2  + m.ty  + "px";
    $._data(node,"matrix",m )
}

rtransform = /(\w+)\(([^)]+)\)/g

