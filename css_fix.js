//=========================================
//  样式补丁模块
//==========================================
define("css_fix", !!top.getComputedStyle, function(){
    $.log("已加载css_fix模块");
    var adapter = $.cssAdapter = {},
    ie8 = !!top.XDomainRequest,
    rfilters = /[\w\:\.]+\([^)]+\)/g,
    salpha = "DXImageTransform.Microsoft.Alpha",
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
    adapter[ "opacity:get" ] = function( node ){
        //这是最快的获取IE透明值的方式，不需要动用正则了！
        var alpha = node.filters.alpha || node.filters[salpha],
        op = alpha ? alpha.opacity: 100;
        return ( op /100 )+"";//确保返回的是字符串
    }
    //http://www.freemathhelp.com/matrix-multiplication.html
    //金丝楠木是皇家专用木材，一般只有皇帝可以使用做梓宫。
    adapter[ "opacity:set" ] = function( node, name, value ){
        var currentStyle = node.currentStyle, style = node.style;
        if(isFinite(value)){//"xxx" * 100 = NaN
            return
        }
        value = (value > 0.999) ? 100: (value < 0.001) ? 0 : value * 100;
        if(!currentStyle.hasLayout)
            style.zoom = 1;//让元素获得hasLayout
        var filter = currentStyle.filter || style.filter || "";
        //http://snook.ca/archives/html_and_css/ie-position-fixed-opacity-filter
        //IE78的透明滤镜当其值为100时会让文本模糊不清
        if(value == 100  ){  //IE78的透明滤镜当其值为100时会让文本模糊不清
            // var str =  "filter: progid:DXImageTransform.Microsoft.Alpha(opacity=100) Chroma(Color='#FFFFFF')"+
            //   "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand',"+
            //   "M11=1.5320888862379554, M12=-1.2855752193730787,  M21=1.2855752193730796, M22=1.5320888862379558)";
            value = style.filter = filter.replace(rfilters, function(a){
                return /alpha/i.test(a) ? "" : a;//可能存在多个滤镜，只清掉透明部分
            });
            //如果只有一个透明滤镜 就直接去掉
            if(value.trim() == "" && style.removeAttribute){
                style.removeAttribute( "filter" );
            }
            return;
        }
        //如果已经设置过透明滤镜可以使用以下便捷方式
        var alpha = node.filters.alpha || node.filters[salpha];

        if( alpha ){
            alpha.opacity = value ;
        }else{
            style.filter  += (filter ? "," : "")+ "alpha(opacity="+ value +")";
        }
    }
    //=========================　处理　user-select　=========================
    //auto——默认值，用户可以选中元素中的内容
    //none——用户不能选择元素中的任何内容
    //text——用户可以选择元素中的文本
    //element——文本可选，但仅限元素的边界内(只有IE和FF支持)
    //all——在编辑器内，如果双击/上下文点击发生在子元素上，改值的最高级祖先元素将被选中。
    //-moz-none——firefox私有，元素和子元素的文本将不可选，但是，子元素可以通过text重设回可选。
    adapter[ "userSelect:set" ] = function( node, name, value ) {
        var allow = /none/.test(value) ? "on" : "",
        e, i = 0, els = node.getElementsByTagName('*');
        node.setAttribute('unselectable', allow);
        while (( e = els[ i++ ] )) {
            switch (e.tagName.toLowerCase()) {
                case 'iframe' :
                case 'textarea' :
                case 'input' :
                case 'select' :
                    break;
                default :
                    e.setAttribute('unselectable', allow);
            }
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
//2012.10.25 重构透明度的读写
