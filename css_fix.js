//=========================================
//  样式补丁模块
//==========================================
define("css_fix", !!top.getComputedStyle, function(){
    $.log("已加载css_fix模块");
    var adapter = $.cssAdapter = {},
    ropacity = /opacity=([^)]*)/i,
    ralpha = /alpha\([^)]*\)/i,
    ie8 = !!top.XDomainRequest,
    rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i,
    rposition = /^(top|right|bottom|left)$/,
    border = {
        thin:   ie8 ? '1px' : '2px',
        medium: ie8 ? '3px' : '4px',
        thick:  ie8 ? '5px' : '6px'
    };
    adapter[ "_default:get" ] = function(node, name){
        //取得精确值，不过它有可能是带em,pc,mm,pt,%等单位
        var ret = node.currentStyle[name];
        if (( rnumnonpx.test(ret) && !rposition.test(ret))) {
            //①，保存原有的style.left, runtimeStyle.left,
            var style = node.style, left = style.left,
            rsLeft =  node.runtimeStyle.left ;
            //②由于③处的style.left = xxx会影响到currentStyle.left，
            //因此把它currentStyle.left放到runtimeStyle.left，
            //runtimeStyle.left拥有最高优先级，不会style.left影响
            node.runtimeStyle.left = node.currentStyle.left;
            //③将精确值赋给到style.left，然后通过IE的另一个私有属性 style.pixelLeft
            //得到单位为px的结果；fontSize的分支见http://bugs.jquery.com/ticket/760
            style.left = name === 'fontSize' ? '1em' : (ret || 0);
            ret = style.pixelLeft + "px";
            //④还原 style.left，runtimeStyle.left
            style.left = left;
            node.runtimeStyle.left = rsLeft;
        }
        if( ret == "medium" ){
            name = name.replace("Width","Style");
            //border width 默认值为medium，即使其为0"
            if(arguments.callee(node,name) == "none"){
                ret = "0px";
            }
        }
        //处理auto值
        if(rposition.test(name) && ret === "auto"){
            ret = "0px";
        }
        return ret === "" ? "auto" : border[ret] ||  ret;
    }
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
    //=========================　处理　user-select　=========================

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
    //=========================　处理　background-position　=========================
    adapter[ "backgroundPosition:get" ] = function( node, name, value ) {
        var style = node.currentStyle;
        return style.backgroundPositionX +" "+style.backgroundPositionX
    };

   
});
//2011.10.21 去掉opacity:setter 的style.visibility处理
//2011.11.21 将IE的矩阵滤镜的相应代码转移到这里
//2012.5.9 完美支持CSS3 transform 2D

