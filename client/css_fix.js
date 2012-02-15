/*
 * 样式操作模块的补丁模块
 */
$.define("css_fix", !!top.getComputedStyle, function(){
   // $.log("已加载css_fix模块");
    var adapter = $.cssAdapter = {};
    //=========================　处理　opacity　=========================
    var  ropacity = /opacity=([^)]*)/i,  ralpha = /alpha\([^)]*\)/i,
    rnumpx = /^-?\d+(?:px)?$/i, rnum = /^-?\d/;
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
        thick: ie8 ? '5px' : '6px'
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
    $.transform = function( node, param ){
        var meta = $._data(node,"transform"), ident  = "DXImageTransform.Microsoft.Matrix",arr = [1,0,0,1,0,0], m
        if(!meta){
            //http://msdn.microsoft.com/en-us/library/ms533014(v=vs.85).aspx
            m = node.filters ? node.filters[ident] : 0;
            arr = m ? [m.M11, m.M12, m.M21, m.M22, m.Dx, m.Dy] : arr;
            meta = $._toMatrixObject(arr);
            meta.rotate = - meta.rotate;
            //保存到缓存系统，省得每次都计算
            $._data(node,"transform",meta);
        }
        if(arguments.length === 1){
            return meta;//getter
        }
        //setter
        meta = $._data(node,"transform",{
            scaleX:     param.scaleX     === void 0 ? meta.scaleX     : param.scaleX,
            scaleY:     param.scaleY     === void 0 ? meta.scaleY     : param.scaleY,
            rotate:     param.rotate     === void 0 ? meta.rotate     : param.rotate,
            translateX: param.translateX === void 0 ? meta.translateX : parseInt(param.translateX)|0,
            translateY: param.translateY === void 0 ? meta.translateY : parseInt(param.translateY)|0
        });

        //注意：IE滤镜和其他浏览器定义的角度方向相反
        var r = -$.all2rad(meta.rotate),
        cos  = Math.cos(r ), sin = Math.sin(r),
        mtx   = [ 
        cos * meta.scaleX,  sin * meta.scaleX, 0,
        -sin * meta.scaleY, cos * meta.scaleY, 0,
        meta.translateX,    meta.translateY,   1],
        cxcy= $._data(node,"cxcy");
        if (!cxcy) {
            var rect = node.getBoundingClientRect(),
            cx = (rect.right  - rect.left) / 2, // center x
            cy = (rect.bottom - rect.top)  / 2; // center y
            if(node.currentStyle.hasLayout){
                node.style.zoom = 1;
            }
            //IE9下请千万别设置  <meta content="IE=8" http-equiv="X-UA-Compatible"/>
            //http://www.cnblogs.com/Libra/archive/2009/03/24/1420731.html
            node.style.filter += " progid:" + ident + "(sizingMethod='auto expand')";
            cxcy =  $._data(node,"cxcy", {
                cx: cx, 
                cy: cy
            });
        }
        m = node.filters[ident];
        m.M11 = mtx[0];
        m.M12 = mtx[1];
        m.M21 = mtx[3];
        m.M22 = mtx[4];
        m.Dx  = mtx[6];
        m.Dy  = mtx[7];
        // recalc center
        rect = node.getBoundingClientRect();
        cx = (rect.right  - rect.left) / 2;
        cy = (rect.bottom - rect.top)  / 2;
        node.style.marginLeft = cxcy.cx - cx + "px";
        node.style.marginTop  = cxcy.cy - cy + "px";
    }
});
//2011.10.21 去掉opacity:setter 的style.visibility处理
//2011.11.21 将IE的矩阵滤镜的相应代码转移到这里
