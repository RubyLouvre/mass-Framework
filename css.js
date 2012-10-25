//=========================================
// 样式操作模块 by 司徒正美
//=========================================
define( "css", !!top.getComputedStyle ? ["$node"] : ["$node","$css_fix"] , function(){
    $.log( "已加载css模块" );
    var adapter = $.cssAdapter || ($.cssAdapter = {})
    var rrelNum = /^([\-+])=([\-+.\de]+)/
    var rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i
 
    adapter["_default:set"] = function( node, name, value){
        node.style[ name ] = value;
    }
    //有关单位转换的 http://heygrady.com/blog/2011/12/21/length-and-angle-unit-conversion-in-javascript/
    if ( window.getComputedStyle ) {
        adapter[ "_default:get" ] = function( node, name ) {
            var ret, width, minWidth, maxWidth, computed = window.getComputedStyle( node, null )
            if (computed ) {
                ret = name == "filter" ? computed.getPropertyValue(name) :computed[name]
                var style = node.style ;
                if ( ret === "" && !$.contains( node.ownerDocument, node ) ) {
                    ret = style[name];//如果还没有加入DOM树，则取内联样式
                }
                //  Dean Edwards大神的hack，用于转换margin的百分比值为更有用的像素值
                // webkit不能转换top, bottom, left, right, margin, text-indent的百分比值
                if (  /^margin/.test( name ) && rnumnonpx.test( ret ) ) {
                    width = style.width;
                    minWidth = style.minWidth;
                    maxWidth = style.maxWidth;

                    style.minWidth = style.maxWidth = style.width = ret;
                    ret = computed.width;
                
                    style.width = width;
                    style.minWidth = minWidth;
                    style.maxWidth = maxWidth;
                }
            };
            return ret === "" ? "auto" : ret;
        }
    }
    var getter = adapter[ "_default:get" ]

    adapter[ "zIndex:get" ] = function( node, name, value, position ) {
        while ( node.nodeType !== 9 ) {
            //即使元素定位了，但如果zindex设置为"aaa"这样的无效值，浏览器都会返回auto;
            //如果没有指定zindex值，IE会返回数字0，其他返回auto
            position = getter(node, "position" );//getter = adapter[ "_default:get" ]
            if ( position === "absolute" || position === "relative" || position === "fixed" ) {
                // <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
                value = parseInt( getter(node,"zIndex"), 10 );
                if ( !isNaN( value ) && value !== 0 ) {
                    return value;
                }
            }
            node = node.parentNode;
        }
        return 0;
    }
    //这里的属性不需要自行添加px
    $.cssNumber = $.oneObject("fontSizeAdjust,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom,rotate");
    $.css = function( node, name, value){
        if(node.style){//注意string经过call之后，变成String伪对象，不能简单用typeof来检测
            name = $.cssName( name, node, 1 ) ;
            if( value === void 0){ //获取样式
                return (adapter[ name+":get" ] || adapter[ "_default:get" ])( node, name );
            }else {//设置样式
                var temp;
                if ( typeof value === "string" && (temp = rrelNum.exec( value )) ) {
                    value =  ( temp[1] + 1) * temp[2]  + parseFloat( $.css( node, name) );
                }
                if ( isFinite( value ) && !$.cssNumber[ name ] ) {
                    value += "px";
                }
                (adapter[name+":set"] || adapter[ "_default:set" ])( node, name, value );
            }
        }
    }

    $.fn.css =  function( name, value , neo){
        return $.access( this, name, value, $.css );
    }
    $.scrollbarWidth = function (){
        if( $.scrollbarWidth.ret ){
            return $.scrollbarWidth.ret
        }
        var test =  $('<div style="width: 100px;height: 100px;overflow: scroll;position: absolute;top: -9999px;"/>').appendTo("body");
        var ret = test[0].offsetWidth - test[0].clientWidth;
        test.remove();
        return $.scrollbarWidth.ret = ret;
    }
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
                    this.style.display = method == "show" ? "block" : "none"
                }
            })
        }
    })
    var rroot = /^(?:body|html)$/i;
    $.fn. position = function() {//取得元素相对于其offsetParent的坐标
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
    }
    $.fn.offsetParent = function() {
        return this.map(function() {
            var offsetParent = this.offsetParent || document.body;
            while ( offsetParent && (!rroot.test(offsetParent.nodeName) && getter(offsetParent, "position") === "static") ) {
                offsetParent = offsetParent.offsetParent;
            }
            return offsetParent;
        });
    }
    $.fn.scrollParent = function() {
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

    "left,top".replace( $.rword, function( name ) {
        adapter[ name +":get"] =  function( node ){//添加top, left到cssAdapter
            return  $(node).position()[ name ] + "px";
        };
        var method = "scroll" + name.toUpperCase();
        $.fn[ method ] = function( val ) {
            var node, win, t = name == "top";
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
//生成图形字体的网站http://www.zhangxinxu.com/wordpress/2012/06/free-icon-font-usage-icomoon/
http://www.zhangxinxu.com/wordpress/2011/09/cssom%E8%A7%86%E5%9B%BE%E6%A8%A1%E5%BC%8Fcssom-view-module%E7%9B%B8%E5%85%B3%E6%95%B4%E7%90%86%E4%B8%8E%E4%BB%8B%E7%BB%8D/
//W3C DOM异常对象DOMException介绍 http://www.zhangxinxu.com/wordpress/2012/05/w3c-dom-domexception-object/
//http://www.zhangxinxu.com/wordpress/2012/05/getcomputedstyle-js-getpropertyvalue-currentstyle/
http://www.zhangxinxu.com/wordpress/2011/11/css3-font-face%E5%85%BC%E5%AE%B9%E6%80%A7%E4%B8%89%E8%A7%92%E6%95%88%E6%9E%9C/
     */


