//=========================================
// 样式操作模块 by 司徒正美
//=========================================
define( "css", !!top.getComputedStyle ? ["$node"] : ["$node","$css_fix"] , function(){
    try{
    //$.log( "已加载css模块" );
    var adapter = $.cssAdapter = $.cssAdapter || {}
    var rrelNum = /^([\-+])=([\-+.\de]+)/
    var  rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i
    $.implement({
        css : function( name, value , neo){
            if(typeof name === "string"){
                neo = $.cssName(name) || name;
            }
            return $.access( this, name, value, $.css,  neo || this );
        }
    });

    $.mix({
        scrollbarWidth: function (){
            if( $.scrollbarWidth.ret ){
                return $.scrollbarWidth.ret
            }
            var test =  $('<div style="width: 100px;height: 100px;overflow: scroll;position: absolute;top: -9999px;"/>').appendTo("body");
            var ret = test[0].offsetWidth - test[0].clientWidth;
            test.remove();
            return $.scrollbarWidth.ret = ret;
        },
        //这里的属性不需要自行添加px
        cssNumber: $.oneObject("fontSizeAdjust,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom,rotate"),
        css: function( node, name, value){
            if(node.style){//注意string经过call之后，变成String伪对象，不能简单用typeof来检测
                name = $.type(this, "String") ? this : $.cssName( name ) || name;
                if( value === void 0){ //取值
                    return (adapter[ name+":get" ] || adapter[ "_default:get" ])( node, name );
                }else {//设值
                    var temp;
                    if ( typeof value === "string" && (temp = rrelNum.exec( value )) ) {
                        value =  ( temp[1] + 1) * temp[2]  + parseFloat( $.css( node, name, void 0) );
                    }
                    if ( isFinite( value ) && !$.cssNumber[ name ] ) {
                        value += "px";
                    }
                    (adapter[name+":set"] || adapter[ "_default:set" ])( node, name, value );
                }
            }
        }

    });

    //IE9 FF等支持getComputedStyle
    $.mix(adapter, {
        "_default:set" :function( node, name, value){
            node.style[ name ] = value;
        }
    },false);
    //有关单位转换的 http://heygrady.com/blog/2011/12/21/length-and-angle-unit-conversion-in-javascript/
    if ( document.defaultView && document.defaultView.getComputedStyle ) {
        adapter[ "_default:get" ] = function( node, name ) {
            var ret, defaultView, computedStyle;
            if ( !(defaultView = node.ownerDocument.defaultView) ) {
                return undefined;
            }
            var style = node.style ;
            if ( (computedStyle = defaultView.getComputedStyle( node, null )) ) {
                ret = computedStyle[name] 
                if ( ret === "" && !$.contains( node.ownerDocument, node ) ) {
                    ret = style[name];//如果还没有加入DOM树，则取内联样式
                }
            }
            // A tribute to the "awesome hack by Dean Edwards"
            // WebKit uses "computed value (percentage if specified)" instead of "used value" for margins
            // which is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
            if (  /^margin/.test( name ) && rnumnonpx.test( ret ) ) {
                var width = style.width;
                var minWidth = style.minWidth;
                var maxWidth = style.maxWidth;

                style.minWidth = style.maxWidth = style.width = ret;
                ret = computedStyle.width;

                style.width = width;
                style.minWidth = minWidth;
                style.maxWidth = maxWidth;
            }

            return ret === "" ? "auto" : ret;
        };
    }
    //http://extremelysatisfactorytotalitarianism.com/blog/?p=1002
    //http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php
    //优化HTML5应用的体验细节，例如全屏的处理与支持，横屏的响应，图形缩放的流畅性和不失真，点触的响应与拖曳，Websocket的完善
    //关于JavaScript中计算精度丢失的问题 http://rockyee.iteye.com/blog/891538
    function toFixed(d){
        return  d > -0.0000001 && d < 0.0000001 ? 0 : /e/.test(d+"") ? d.toFixed(7) :  d;
    }
    function toFloat(d, x){
        return isFinite(d) ? d: parseFloat(d) || x
    }
    //http://zh.wikipedia.org/wiki/%E7%9F%A9%E9%98%B5
    //http://help.dottoro.com/lcebdggm.php
    var Matrix2D = $.factory({
        init: function(){
            this.set.apply(this, arguments);
        },
        cross: function(a, b, c, d, tx, ty) {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            this.a  = toFixed(a*a1+b*c1);
            this.b  = toFixed(a*b1+b*d1);
            this.c  = toFixed(c*a1+d*c1);
            this.d  = toFixed(c*b1+d*d1);
            this.tx = toFixed(tx*a1+ty*c1+this.tx);
            this.ty = toFixed(tx*b1+ty*d1+this.ty);
            return this;
        },
        rotate: function( radian ) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.cross(cos,  sin,  -sin, cos, 0, 0)
        },
        skew: function(sx, sy) {
            return this.cross(1, Math.tan( sy ), Math.tan( sx ), 1, 0, 0);
        },
        skewX: function(radian){
            return this.skew(radian, 0);
        },
        skewY: function(radian){
            return this.skew(0, radian);
        },
        scale: function(x, y) {
            return this.cross( toFloat(x, 1) ,0, 0, toFloat(y, 1), 0, 0)
        },
        scaleX: function(x){
            return this.scale(x ,1);
        },
        scaleY: function(y){
            return this.scale(1 ,y);
        },
        translate : function(x, y) {
            return this.cross(1, 0, 0, 1, toFloat(x, 0), toFloat(y, 0))
        },
        translateX: function(x) {
            return this.translate(x, 0);
        },
        translateY: function(y) {
            return this.translate(0, y);
        },
        toString: function(){
            return "matrix("+this.get()+")";
        },
        get: function(){
            return [this.a,this.b,this.c,this.d,this.tx,this.ty];
        },
        set: function(a, b, c, d, tx, ty){
            this.a = a * 1;
            this.b = b * 1 || 0;
            this.c = c * 1 || 0;
            this.d = d * 1;
            this.tx = tx * 1 || 0;
            this.ty = ty * 1 || 0;
            return this;
        },
        matrix:function(a, b, c, d, tx, ty){
            return this.cross(a, b, c, d, toFloat(tx, 0), toFloat(ty, 0))
        },
        decompose: function() {
            //分解原始数值,返回一个包含translateX,translateY,scale,skewX,rotate的对象
            //https://github.com/louisremi/jquery.transform.js/blob/master/jquery.transform2d.js
            //http://http://mxr.mozilla.org/mozilla-central/source/layout/style/nsStyleAnimation.cpp
            var scaleX, scaleY, skew, A = this.a, B = this.b,C = this.c,D = this.d ;
            if ( A * D - B * C ) {
                // step (3)
                scaleX = Math.sqrt( A * A + B * B );
                A /= scaleX;
                B /= scaleX;
                // step (4)
                skew = A * C + B * D;
                C -= A * skew;
                D -= B * skew;
                // step (5)
                scaleY = Math.sqrt( C * C + D * D );
                C /= scaleY;
                D /= scaleY;
                skew /= scaleY;
                // step (6)
                if ( A * D < B * C ) {
                    A = -A;
                    B = -B;
                    skew = -skew;
                    scaleX = -scaleX;
                }
            } else {
                scaleX = scaleY = skew = 0;
            }
            return [
            ["translate", [+this.tx, +this.ty]],
            ["rotate", Math.atan2(B, A)],
            ["skewX", Math.atan(skew)],
            ["scale", [scaleX, scaleY]]]
        }
    });

    $.Matrix2D = Matrix2D
    var getter = $.cssAdapter["_default:get"], RECT = "getBoundingClientRect",
    //支持情况 ff3.5 chrome ie9 pp6 opara10.5 safari3.1
    cssTransfrom = $.support.transform = $.cssName("transform");
    if( cssTransfrom ){
        adapter[cssTransfrom + ":set"] = function(node, name, value){
            if(value.indexOf("matrix")!== -1 && cssTransfrom === "MozTransform"){
                value = value.replace(/([\d.-]+)\s*,\s*([\d.-]+)\s*\)/,"$1px, $2px)")
            }
            node.style[name] = value;
            var matrix = $._data( node, "matrix" ) || new Matrix2D();
            matrix.set.apply(matrix, getter(node, cssTransfrom).match(/[-+.e\d]+/g).map(function(d){
                return toFixed(d*1)
            }));
            $._data(node, "matrix", matrix );
        }
    }
    //http://granular.cs.umu.se/browserphysics/?cat=7
    //=========================　处理　user-select　=========================
    //https://developer.mozilla.org/en/CSS/-moz-user-select
    //http://www.w3.org/TR/2000/WD-css3-userint-20000216#user-select
    //具体支持情况可见下面网址
    //http://help.dottoro.com/lcrlukea.php
    var userSelect = $.cssName("userSelect");
    if( userSelect ){
        adapter[ userSelect+":set" ] = function( node, name, value ) {
            return node.style[ name ] = value;
        };
    }
    adapter[ "zIndex:get" ] = function( node, name, value, position ) {
        while ( node.nodeType !== 9 ) {
            //即使元素定位了，但如果zindex设置为"aaa"这样的无效值，浏览器都会返回auto，如果没有指定zindex值，IE会返回数字0，其他返回auto
            position = $.css(node, "position" );
            if ( position === "absolute" || position === "relative" || position === "fixed" ) {
                // <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
                value = parseInt( adapter[ "_default:get" ](node,"zIndex"), 10 );
                if ( !isNaN( value ) && value !== 0 ) {
                    return value;
                }
            }
            node = node.parentNode;
        }
        return 0;
    }
    //http://extremelysatisfactorytotalitarianism.com/blog/?p=922
    //http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php#matrix-anim-class
    //=========================　处理　width height　=========================
    /**框架一般处在低层应用平台和高层业务逻辑之间的中间层。
    // http://www.quirksmode.org/dom/w3c_cssom.html#t40
    // clientWidth         = node.style.width + padding
    // https://developer.mozilla.org/en/DOM/element.clientWidth
    // offsetWidth           = node.style.width + padding + border
    // https://developer.mozilla.org/en/DOM/element.offsetWidth
    // getBoundingClientRect = node.style.width + padding + border
    // https://developer.mozilla.org/en/DOM/element.getBoundingClientRect
    //   [CSS2.1 盒子模型] http://www.w3.org/TR/CSS2/box.html
    //       B-------border----------+ -> border
    //       |                       |
    //       |  P----padding----+    | -> padding
    //       |  |               |    |
    //       |  |  C-content-+  |    | -> content
    //       |  |  |         |  |    |
    //       |  |  |         |  |    |
    //       |  |  +---------+  |    |
    //       |  |               |    |
    //       |  +---------------+    |
    //       |                       |
    //       +-----------------------+
    //       B = event.offsetX/Y in WebKit
    //           event.layerX/Y  in Gecko
    //       P = event.offsetX/Y in IE6 ~ IE8
    //       C = event.offsetX/Y in Opera
     */

    var cssPair = {
        Width:['Left', 'Right'],
        Height:['Top', 'Bottom']
    }
    var cssShow = {
        position: "absolute",
        visibility: "hidden",
        display: "block"
    }
    var rdisplayswap = /^(none|table(?!-c[ea]).+)/
    var showHidden = function(node, array){
        if( node && node.nodeType == 1 && !node.offsetWidth
            //如果是none table-column table-column-group table-footer-group table-header-group table-row table-row-group
            && rdisplayswap.test(getter(node, "display")) ){
            var obj = {
                node: node
            }
            for (var name in cssShow ) {
                obj[ name ] = node.style[ name ];
                node.style[ name ] = cssShow[ name ];
            }
            array.push( obj );
            if(!node.offsetWidth){//如果设置了offsetWidth还是为零，说明父节点也是隐藏元素，继续往上递归
                showHidden(node.parentNode, array)
            }
        }
    }
    $.support.boxSizing = $.cssName( "boxSizing")
    function getWH( node, name, extra  ) {//注意 name是首字母大写
        var which = cssPair[name], hidden = [];
        showHidden( node, hidden );
        var val = node["offset" + name]
        which.forEach(function(direction){
            if(extra < 1)
                val -= parseFloat(getter(node, 'padding' + direction)) || 0;
            if(extra < 2)
                val -= parseFloat(getter(node, 'border' + direction + 'Width')) || 0;
            if(extra === 3){
                val += parseFloat(getter(node, 'margin' + direction )) || 0;
            }
        });
        for(var i = 0, obj; obj = hidden[i++];){
            node = obj.node;
            for ( name in obj ) {
                if(typeof obj[ name ] == "string"){
                    node.style[ name ] = obj[ name ];
                }
            }
        }
        return val;
    };
    //生成width, height, innerWidth, innerHeight, outerWidth, outerHeight这六种原型方法
    "Height,Width".replace( $.rword, function(  name ) {
        var lower = name.toLowerCase(),
        clientProp = "client" + name,
        scrollProp = "scroll" + name,
        offsetProp = "offset" + name;
        $.cssAdapter[ lower+":get" ] = function( node ){
            return getWH( node, name, 0 ) + "px";//添加相应适配器
        }
        "inner_1,b_0,outer_2".replace(/(\w+)_(\d)/g,function(a, b, num){
            var method = b == "b" ? lower : b + name;
            $.fn[ method ] = function( value ) {
                num = b == "outer" && value === true ? 3 : num;
                return $.access( this, num, value, function( target, num, size ) {
                    if ( $.type( target,"Window" ) ) {//取得窗口尺寸
                        return target.document.documentElement[ clientProp ];
                    }
                    if ( target.nodeType === 9 ) {//取得页面尺寸
                        var doc = target.documentElement;
                        //IE6/IE7下，<html>的box-sizing默认值本就是border-box
                        if ( doc[ clientProp ] >= doc[ scrollProp ] ) {
                            return doc[ clientProp ];
                        }
                        return Math.max(
                            target.body[ scrollProp ], doc[ scrollProp ],
                            target.body[ offsetProp ], doc[ offsetProp ],
                            doc[ clientProp ]
                            );
                    }  else if ( size === void 0 ) {
                        return getWH( target, name, num )
                    } else {
                        return num > 0  ? this : $.css( target, lower, size );
                    }
                }, this)
            }
        })

    });

    //=======================================================
    //获取body的offset
    function getBodyOffsetNoMargin(){
        var el = document.body, ret = parseFloat($.css(el,"marginTop"))!== el.offsetTop;
        function getBodyOffsetNoMargin(){
            return ret;//一次之后的执行结果
        }
        return ret;//第一次执行结果
    }
    function setOffset(elem, options){
        if(elem && elem.nodeType == 1 ){
            var position = $.css( elem, "position" );
            // set position first, in-case top/left are set even on static elem
            if ( position === "static" ) {
                elem.style.position = "relative";
            }
            var curElem = $( elem ),
            curOffset = curElem.offset(),
            curCSSTop = $.css( elem, "top" ),
            curCSSLeft = $.css( elem, "left" ),
            calculatePosition = ( position === "absolute" || position === "fixed" ) &&  [curCSSTop, curCSSLeft].indexOf("auto") > -1,
            props = {}, curPosition = {}, curTop, curLeft;
            // need to be able to calculate position if either top or left is auto and position is either absolute or fixed
            if ( calculatePosition ) {
                curPosition = curElem.position();
                curTop = curPosition.top;
                curLeft = curPosition.left;
            } else {
                curTop = parseFloat( curCSSTop ) || 0;
                curLeft = parseFloat( curCSSLeft ) || 0;
            }

            if ( options.top != null ) {
                props.top = ( options.top - curOffset.top ) + curTop;
            }
            if ( options.left != null ) {
                props.left = ( options.left - curOffset.left ) + curLeft;
            }
            curElem.css( props );
        }
    }
    $.fn.offset = function(options){//取得第一个元素位于页面的坐标
        if ( arguments.length ) {
            return (!options || ( !isFinite(options.top) && !isFinite(options.left) ) ) ?  this :
            this.each(function() {
                setOffset( this, options );
            });
        }

        var node = this[0], owner = node && node.ownerDocument, pos = {
            left:0,
            top:0
        };
        if ( !node || !owner ) {
            return pos;
        }
        if( node.tagName === "BODY" ){
            pos.top = node.offsetTop;
            pos.left = body.offsetLeft;
            //http://hkom.blog1.fc2.com/?mode=m&no=750 body的偏移量是不包含margin的
            if(getBodyOffsetNoMargin()){
                pos.top  += parseFloat( getter(node, "marginTop") ) || 0;
                pos.left += parseFloat( getter(node, "marginLeft") ) || 0;
            }
            return pos;
        }else if ( $.html[ RECT ]) { //如果支持getBoundingClientRect
            //我们可以通过getBoundingClientRect来获得元素相对于client的rect.
            //http://msdn.microsoft.com/en-us/library/ms536433.aspx
            var box = node[ RECT ](),win = getWindow(owner),
            root = owner.documentElement,body = owner.body,
            clientTop = root.clientTop || body.clientTop || 0,
            clientLeft = root.clientLeft || body.clientLeft || 0,
            scrollTop  = win.pageYOffset || $.support.boxModel && root.scrollTop  || body.scrollTop,
            scrollLeft = win.pageXOffset || $.support.boxModel && root.scrollLeft || body.scrollLeft;
            // 加上document的scroll的部分尺寸到left,top中。
            // IE一些版本中会自动为HTML元素加上2px的border，我们需要去掉它
            // http://msdn.microsoft.com/en-us/library/ms533564(VS.85).aspx
            pos.top  = box.top  + scrollTop  - clientTop,
            pos.left = box.left + scrollLeft - clientLeft;
        }
        return pos;
    }
    "show,hide".replace($.rword, function(method){
        $.fn[ method ] = function(){
            return this.each(function(){
                if(this.style){
                    this.style.display = method == "show" ? "" : "none"
                }
            })
        }
    })
    var rroot = /^(?:body|html)$/i;
    $.implement({
        position: function() {//取得元素相对于其offsetParent的坐标
            var ret =  this.offset(), node = this[0];
            if ( node && node.nodeType ===1 ) {
                var offsetParent = this.offsetParent(),
                parentOffset = rroot.test(offsetParent[0].nodeName) ? {
                    top:0,
                    left:0
                } : offsetParent.offset();
                ret.top  -= parseFloat( getter(node, "marginTop") ) || 0;
                ret.left -= parseFloat( getter(node, "marginLeft") ) || 0;
                parentOffset.top  += parseFloat( getter(offsetParent[0], "borderTopWidth") ) || 0;
                parentOffset.left += parseFloat( getter(offsetParent[0], "borderLeftWidth") ) || 0;
                ret.top  -= parentOffset.top;
                ret.left -= parentOffset.left
            }
            return ret;
        },
        offsetParent: function() {
            return this.map(function() {
                var offsetParent = this.offsetParent || document.body;
                while ( offsetParent && (!rroot.test(offsetParent.nodeName) && getter(offsetParent, "position") === "static") ) {
                    offsetParent = offsetParent.offsetParent;
                }
                return offsetParent;
            });
        },
        scrollParent: function() {
            var scrollParent;
            if ((window.VBArray && (/(static|relative)/).test(this.css('position'))) || (/absolute/).test(this.css('position'))) {
                scrollParent = this.parents().filter(function() {
                    return (/(relative|absolute|fixed)/).test($.css(this,'position')) && (/(auto|scroll)/).test($.css(this,'overflow')+$.css(this,'overflow-y')+$.css(this,'overflow-x'));
                }).eq(0);
            } else {
                scrollParent = this.parents().filter(function() {
                    return (/(auto|scroll)/).test($.css(this,'overflow')+$.css(this,'overflow-y')+$.css(this,'overflow-x'));
                }).eq(0);
            }

            return (/fixed/).test(this.css('position')) || !scrollParent.length ? $(document) : scrollParent;
        }
    });

    "Left,Top".replace( $.rword, function( name ) {
        adapter[ name.toLowerCase() +":get"] =  function(node){//添加top, left到cssAdapter
            var val = getter(node, name.toLowerCase()), offset;
            // 1. 当没有设置 style.left 时，getComputedStyle 在不同浏览器下，返回值不同
            //    比如：firefox 返回 0, webkit/ie 返回 auto
            // 2. style.left 设置为百分比时，返回值为百分比
            // 对于第一种情况，如果是 relative 元素，值为 0. 如果是 absolute 元素，值为 offsetLeft - marginLeft
            // 对于第二种情况，大部分类库都未做处理，属于“明之而不 fix”的保留 bug
            if(val === "auto"){
                val = 0;
                if(/absolute|fixed/.test(getter(node,"position"))){
                    offset = node["offset"+name ];
                    // old-ie 下，elem.offsetLeft 包含 offsetParent 的 border 宽度，需要减掉
                    if (node.uniqueID && document.documentMode < 9 || window.opera) {
                        // 类似 offset ie 下的边框处理
                        // 如果 offsetParent 为 html ，需要减去默认 2 px == documentElement.clientTop
                        // 否则减去 borderTop 其实也是 clientTop
                        // http://msdn.microsoft.com/en-us/library/aa752288%28v=vs.85%29.aspx
                        // ie<9 注意有时候 elem.offsetParent 为 null ...
                        // 比如 DOM.append(DOM.create("<div class='position:absolute'></div>"),document.body)
                        offset -= node.offsetParent && node.offsetParent['client' + name] || 0;
                    }
                    val = offset - (parseInt(getter(node, 'margin' + name),10) || 0) +"px";
                }
            }
            return val
        };
        var method = "scroll" + name;
        $.fn[ method ] = function( val ) {
            var node, win, t = name == "Top";
            if ( val === void 0 ) {
                node = this[ 0 ];
                if ( !node ) {
                    return null;
                }
                win = getWindow( node );
                return win ? ("pageXOffset" in win) ? win[ t ? "pageYOffset" : "pageXOffset" ] :
                $.support.boxModel && win.document.documentElement[ method ] ||
                win.document.body[ method ] :
                node[ method ];
            }
            // Set the scroll offset
            return this.each(function() {
                win = getWindow( this );
                if ( win ) {
                    win.scrollTo(
                        !t ? val : $( win ).scrollLeft(),
                        t ? val : $( win ).scrollTop()
                        );
                } else {
                    this[ method ] = val;
                }
            });
        };
    });
    var pseudoAdapter = window.VBArray && $.query && $.query.pseudoAdapter
    if(pseudoAdapter){
        pseudoAdapter.hidden = function( el ) {
            return el.type === "hidden" || $.css( el, "display") === "none" ;
        }
    }

    function getWindow( node ) {
        return $.type(node,"Window") ?   node : node.nodeType === 9 ? node.defaultView || node.parentWindow : false;
    } ;
    }catch(e){
        throw module.id;
        throw e
    }
});
/**
2011.9.5将cssName改为隋性函数,修正msTransform Bug
2011.9.19 添加$.fn.offset width height innerWidth innerHeight outerWidth outerHeight scrollTop scrollLeft offset position
2011.9.20 v2
2011.10.10 重构position offset保持这两者行为一致，
2011.10.15 Fix $.css BUG  添加transform rotate API
2011.10.21 修正width height的BUG
2011.11.10 添加top,left到cssAdapter
2011.11.21 _all2deg,_all2rad,_toMatrixArray,_toMatrixObject放到命名空间之下，方便调用，简化transform逻辑
2012.3.2 getWH现在能获取多重隐藏元素的高宽了
2012.4.15 对zIndex进行适配,对$.css进行元素节点检测
2012.4.16 重构showHidden
2012.5.9 $.Matrix2D支持matrix方法，去掉rotate方法 css 升级到v3
2012.5.10 FIX toFloat BUG
2012.5.26 重构$.fn.width, $.fn.height,$.fn.innerWidth, $.fn.innerHeight, $.fn.outerWidth, $.fn.outerHeight
//本地模拟多个域名http://hi.baidu.com/fmqc/blog/item/07bdeefa75f2e0cbb58f3100.html
//z-index的最大值（各浏览器）http://hi.baidu.com/flondon/item/a64550ba98a9d3ef4ec7fd77
http://joeist.com/2012/06/what-is-the-highest-possible-z-index-value/ 这里有更全面的测试
http://boobstagram.fr/archive
ccs3 网站 http://hakim.se/experiments
 */


