//=========================================
//  样式补丁模块
//==========================================
$.define("css_fix", !!top.getComputedStyle, function(){
    $.log("已加载css_fix模块");
    var adapter = $.cssAdapter = {},
    ropacity = /opacity=([^)]*)/i,
    ralpha = /alpha\([^)]*\)/i,
    rnumpx = /^-?\d+(?:px)?$/i, 
    rtransform = /(\w+)\(([^)]+)\)/g,
    rnum = /^-?\d/;
    //=========================　处理　opacity　=========================
    adapter[ "opacity:get" ] = function( node, op ){
        //这是最快的获取IE透明值的方式，不需要动用正则了！
        if(node.filters.alpha){
            op = node.filters.alpha.opacity;
        }else if(node.filters["DXImageTransform.Microsoft.Alpha"]){
            op = node.filters["DXImageTransform.Microsoft.Alpha"].opacity
        }else{
            op = (node.currentStyle.filter ||"opacity=100").match(ropacity)[1];
        }
        return (op  ? op /100 :op)+"";//如果是零就不用除100了
    }
    //http://www.freemathhelp.com/matrix-multiplication.html
    //金丝楠木是皇家专用木材，一般只有皇帝可以使用做梓宫。
    adapter[ "opacity:set" ] = function( node, _, value ){
        var currentStyle = node.currentStyle, style = node.style;
        if(!currentStyle.hasLayout)
            style.zoom = 1;//让元素获得hasLayout
        value = (value > 0.999) ? 1: (value < 0.001) ? 0 : value;
        if(node.filters.alpha){
            //必须已经定义过透明滤镜才能使用以下便捷方式
            node.filters.alpha.opacity = value * 100;
        }else{
            style.filter = "alpha(opacity="+((value * 100) | 0)+")";
        }
        //IE7的透明滤镜当其值为100时会让文本模糊不清
        if(value === 1){
            style.filter = currentStyle.filter.replace(ralpha,'');
        }
    }
    var runselectable = /^(br|input|link|meta|hr|col|area|base|hr|embed|param|iframe|textarea|input|select|script|noscript)/i
    adapter[ "userSelect:set" ] = function( node, name, value ) {
        if(!runselectable.test(node.nodeName)){//跳过不显示的标签与表单控件
            var allow = /none/.test(value||"all");
            node.unselectable  = allow ? "" : "on";
            node.onselectstart = allow ? "" : function(){
                return false;
            };
        }
    };
    var ie8 = !!top.XDomainRequest,
    border = {
        thin:   ie8 ? '1px' : '2px',
        medium: ie8 ? '3px' : '4px',
        thick:  ie8 ? '5px' : '6px'
    };
    adapter[ "_default:get" ] = function(node, name){
        var ret = node.currentStyle && node.currentStyle[name];
        if ((!rnumpx.test(ret) && rnum.test(ret))) {
            var style = node.style,
            left = style.left,
            rsLeft = node.runtimeStyle && node.runtimeStyle.left ;
            if (rsLeft) {
                node.runtimeStyle.left = node.currentStyle.left;
            }
            style.left = name === 'fontSize' ? '1em' : (ret || 0);
            ret = style.pixelLeft + "px";
            style.left = left;
            if (rsLeft) {
                node.runtimeStyle.left = rsLeft;
            }
        }
        if( ret == "medium" ){
            name = name.replace("Width","Style");
            //border width 默认值为medium，即使其为0"
            if(arguments.callee(node,name) == "none"){
                ret = "0px";
            }
        }
        if(/margin|padding|border/.test(name) && ret === "auto"){
            ret = "0px";
        }
        return ret === "" ? "auto" : border[ret] ||  ret;
    }
    var ident  = "DXImageTransform.Microsoft.Matrix"

    adapter[ "transform:get" ] = function(node, name){
        var matrix = $._data(node,"matrix")
        if(!matrix){
            if(!node.currentStyle.hasLayout){
                node.style.zoom = 1;
            }
            //IE9下请千万别设置  <meta content="IE=8" http-equiv="X-UA-Compatible"/>
            //http://www.cnblogs.com/Libra/archive/2009/03/24/1420731.html
            if(!node.filters[ident]){
                var old = node.currentStyle.filter;//防止覆盖已有的滤镜
                node.style.filter =  (old ? old +"," : "") + " progid:" + ident + "(sizingMethod='auto expand')";
            }
            var args = [], m = node.filters[ident]
            "M11,M12,M21,M22,Dx,Dy".replace($.rword, function(d){
                // console.log(m[d])
                args.push( m[d] )
            });
            matrix = new $.Matrix2D();
            matrix.set.apply(matrix, args);
        //保存到缓存系统，省得每次都计算
        }
        return name === true ? matrix : matrix.get2D()
    }
    //deg	degrees, 角度
    //grad	grads, 百分度
    //rad	radians, 弧度
    function toRadian(value) {
        return ~value.indexOf("deg") ?
        parseInt(value,10) *  Math.PI/180:
        ~value.indexOf("grad") ?
        parseInt(value,10) * Math.PI/200:
        parseFloat(value);
    }
    adapter[ "transform:set" ] = function(node, name, value){
        var m = adapter[ "transform:get" ](node, true)
        //注意：IE滤镜和其他浏览器定义的角度方向相反
        value.toLowerCase().replace(rtransform,function(_,method,array){
            array = array.replace(/px/g,"").match($.rword) || [];
            if(/skew|rotate/.test(method)){
                array[0] = toRadian(array[0] );//IE矩阵滤镜的方向是相反的
                array[1] = toRadian(array[1] || "0");
            }
            method = method.replace(/(x|y)$/i,function(_,b){
                return b.toUpperCase();//处理translateX translateY scaleX scaleY skewX skewY等大小写问题
            });
            m[method].apply(m, array);
            //http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php#transform-origin-ie-style
            var filter = node.filters[ident];
            filter.M11 =  filter.M22 = 1;//取得未变形前的宽高
            filter.M12 =  filter.M21 = 0;
            var width = node.offsetWidth;
            var height = node.offsetHeight;
            filter.M11 = m.a;
            filter.M12 = m.c;//★★★注意这里的顺序
            filter.M21 = m.b;
            filter.M22 = m.d;
            filter.Dx  = m.tx;
            filter.Dy  = m.ty;
            $._data(node,"matrix",m);
            var tw =  node.offsetWidth, th = node.offsetHeight;//取得变形后高宽
            if( tw !== width || th !== height || method.indexOf("translate") == 0 ){
                node.style.position = "relative";
console.log((width - tw)/2)
console.log((height - th)/2)
                node.style.left = (width - tw)/2 +m.tx +(width - tw)/2  + "px";//-8-18
                node.style.top = (height - th)/2 +m.ty -(height - th)/2 + "px";//-8+18
                console.log(method)
                 console.log((width - tw)/2 +m.tx +(width - tw)/2)
                console.log((height - th)/2 +m.ty -(height - th)/2)
            }
        //http://extremelysatisfactorytotalitarianism.com/blog/?p=922
        //http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php
        //http://extremelysatisfactorytotalitarianism.com/blog/?p=1002
        });
    }
});
    //2011.10.21 去掉opacity:setter 的style.visibility处理
    //2011.11.21 将IE的矩阵滤镜的相应代码转移到这里

   