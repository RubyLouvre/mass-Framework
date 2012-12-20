//=========================================
// 样式操作模块 v4 by 司徒正美
//=========================================
define( "css", ["$node"][ top.getComputedStyle ? "valueOf" : "concat"]("$css_fix") , function($){
    var adapter = $.cssHooks || ($.cssHooks = {})
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
    var cssTransform = $.cssName("transform");
    // 总是返回度数
    adapter[ "rotate:get" ] = function(node){
        return $._data( node, 'rotate' ) || 0;
    }
    if(cssTransform){
        adapter[ "rotate:set" ] = function(node, name, value){
            $._data( node, 'rotate',  value );
            node.style[cssTransform] = 'rotate('+ (value * Math.PI / 180 )+'rad)';
        }
    }
    //这里的属性不需要自行添加px
    $.cssNumber = $.oneObject("fontSizeAdjust,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom,rotate");
    $.css = function( node, name, value){
        if(node.style){//注意string经过call之后，变成String伪对象，不能简单用typeof来检测
            var prop = $.String.camelize(name)
            name = $.cssName( name ) ;
            if( value === void 0){ //获取样式
                return (adapter[ prop+":get" ] || adapter[ "_default:get" ])( node, name );
            }else {//设置样式
                var temp;
                if ( typeof value === "string" && (temp = rrelNum.exec( value )) ) {
                    value =  ( temp[1] + 1) * temp[2]  + parseFloat( $.css( node, name) );
                }
                if ( isFinite( value ) && !$.cssNumber[ prop ] ) {
                    value += "px";
                }
                (adapter[prop+":set"] || adapter[ "_default:set" ])( node, name, value );
            }
        }
    }

    $.fn.css =  function( name, value , neo){
        return $.access( this, name, value, $.css );
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
    //http://www.cnblogs.com/rubylouvre/archive/2012/10/27/2742529.html
    function showHidden(node, array){
        if( node && node.nodeType == 1 && node.offsetWidth == 0 ){
            if(getter(node, "display") == "none"){
                var obj = {
                    node: node
                }
                for (var name in cssShow ) {
                    obj[ name ] = node.style[ name ];
                    node.style[ name ] = cssShow[ name ];
                }
                array.push( obj );
            }
            showHidden(node.parentNode, array)
        }
    }

    var supportBoxSizing = $.cssName("box-sizing")
    adapter[ "boxSizing:get" ] = function( node, name ) {
        return  supportBoxSizing ? getter(node, name) : document.compatMode == "BackCompat" ?
        "border-box" : "content-box"
    }

    function setWH(node, name, val, extra){
        var which = cssPair[name]
        which.forEach(function(direction){
            if(extra < 1)
                val -= parseFloat(getter(node, 'padding' + direction)) || 0;
            if(extra < 2)
                val -= parseFloat(getter(node, 'border' + direction + 'Width')) || 0;
            if(extra === 3){
                val += parseFloat(getter(node, 'margin' + direction )) || 0;
            } 
            if(extra === "padding-box"){
                val += parseFloat(getter(node, 'padding' + direction)) || 0;
            }
            if(extra === "border-box"){
                val += parseFloat(getter(node, 'padding' + direction)) || 0;
                val += parseFloat(getter(node, 'border' + direction + 'Width')) || 0;
            }
        });
        return val
    }
    function getWH( node, name, extra  ) {//注意 name是首字母大写
        var hidden = [];
        showHidden( node, hidden );
        var  val = setWH(node, name,  node["offset" + name], extra);
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

    //=========================　处理　width, height, innerWidth, innerHeight, outerWidth, outerHeight　========
    var rmapper = /(\w+)_(\w+)/g
    "Height,Width".replace( $.rword, function(  name ) {
        var lower = name.toLowerCase(),
        clientProp = "client" + name,
        scrollProp = "scroll" + name,
        offsetProp = "offset" + name;
        $.cssHooks[ lower+":get" ] = function( node ){
            return getWH( node, name, 0 ) + "px";//添加相应适配器
        }
        $.cssHooks[ lower+":set" ] = function( node, nick, value ){
            var box = $.css(node, "box-sizing");//nick防止与外面name冲突
            node.style[ nick ] = box == "content-box" ? value:
            setWH(node, name, parseFloat(value), box ) + "px";
        }
        "inner_1,b_0,outer_2".replace(rmapper,function(a, b, num){
            var method = b == "b" ? lower : b + name;
            $.fn[ method ] = function( value ) {
                num = b == "outer" && value === true ? 3 : num;
                return $.access( this, num, value, function( node, num, size ) {
                    if ( $.type( node,"Window" ) ) {//取得窗口尺寸,IE9后可以用node.innerWidth /innerHeight代替
                        return  node["inner"+ name] || node.document.documentElement[ clientProp ] ;
                    }
                    if ( node.nodeType === 9 ) {//取得页面尺寸
                        var doc = node.documentElement;
                        //FF chrome    html.scrollHeight< body.scrollHeight
                        //IE 标准模式 : html.scrollHeight> body.scrollHeight
                        //IE 怪异模式 : html.scrollHeight 最大等于可视窗口多一点？
                        return Math.max(
                            node.body[ scrollProp ], doc[ scrollProp ],
                            node.body[ offsetProp ], doc[ offsetProp ],
                            doc[ clientProp ]
                            );
                    } else if ( size === void 0 ) {
                        return getWH( node, name, num )
                    } else {
                        return num > 0  ? this : $.css( node, lower, size );
                    }
                }, this)
            }
        })

    });
    //=========================　处理　show hide toggle　=========================
    var sandbox,sandboxDoc;
    $.callSandbox = function(parent,callback){
        if ( !sandbox ) {
            sandbox = document.createElement( "iframe" );
            sandbox.frameBorder = sandbox.width = sandbox.height = 0;
        }
        parent.appendChild(sandbox);
        if ( !sandboxDoc || !sandbox.createElement ) {
            sandboxDoc = ( sandbox.contentWindow || sandbox.contentDocument ).document;
            sandboxDoc.write( "<!doctype html><html><body>" );
            sandboxDoc.close();
        }
        callback(sandboxDoc);
        parent.removeChild(sandbox);
    }
    var cacheDisplay = $.oneObject("a,abbr,b,span,strong,em,font,i,img,kbd","inline");
    var blocks = $.oneObject("div,h1,h2,h3,h4,h5,h6,section,p","block");
    $.mix(cacheDisplay ,blocks);
    $.parseDisplay = function ( nodeName ) {
        nodeName = nodeName.toLowerCase();
        if ( !cacheDisplay[ nodeName ] ) {
            $.callSandbox(document.body, function(doc){
                var  elem = doc.createElement( nodeName );
                doc.body.appendChild( elem );
                cacheDisplay[ nodeName ] = getter( elem, "display" );
            });
        }
        return cacheDisplay[ nodeName ];
    }
    
    function isHidden( elem) {
        return elem.sourceIndex === 0 || getter( elem, "display" ) === "none" || !$.contains( elem.ownerDocument, elem );
    }
    $._isHidden = isHidden;
    function toggelDisplay( nodes, show ) {
        var elem,  values = [], status = [], index = 0, length = nodes.length;
        //由于传入的元素们可能存在包含关系，因此分开两个循环来处理，第一个循环用于取得当前值或默认值
        for ( ; index < length; index++ ) {
            elem = nodes[ index ];
            if ( !elem.style ) {
                continue;
            }
            values[ index ] = $._data( elem, "olddisplay" );
            status[ index ] = isHidden(elem) 
            if( !values[ index ] ){
                values[ index ] =  status[index] ? $.parseDisplay(elem.nodeName): 
                getter(elem, "display");
                $._data( elem, "olddisplay", values[ index ])
            }
        }
        //第二个循环用于设置样式，-1为toggle, 1为show, 0为hide
        for ( index = 0; index < length; index++ ) {
            elem = nodes[ index ];
            if ( !elem.style ) {
                continue;
            }
            show = show === -1 ? !status[index] : show
           
            elem.style.display = show ?  values[ index ] : "none";
        }
        return nodes;
    }
    $.fn.show =  function() {
        return toggelDisplay( this, 1 );
    }
    $.fn.hide = function() {
        return toggelDisplay( this, 0 );
    }
    //state为true时，强制全部显示，为false，强制全部隐藏
    $.fn.toggle = function( state ) {
        return toggelDisplay( this, typeof state == "boolean" ? state : -1 );
    }

    //=========================　处理　offset　=========================
    function setOffset(node, options){
        if(node && node.nodeType == 1 ){
            var position = $.css( node, "position" );
            //强逼定位
            if ( position === "static" ) {
                node.style.position = "relative";
            }
            var curElem = $( node ),
            curOffset = curElem.offset(),
            curCSSTop = $.css( node, "top" ),
            curCSSLeft = $.css( node, "left" ),
            calculatePosition = ( position === "absolute" || position === "fixed" ) &&  [curCSSTop, curCSSLeft].indexOf("auto") > -1,
            props = {}, curPosition = {}, curTop, curLeft;
            if ( calculatePosition ) {
                curPosition = curElem.position();
                curTop = curPosition.top;
                curLeft = curPosition.left;
            } else {
                //如果是相对定位只要用当前top,left做基数
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

        var node = this[0], doc = node && node.ownerDocument, pos = {
            left:0,
            top:0
        };
        if ( !doc ) {
            return pos;
        }
        //http://hkom.blog1.fc2.com/?mode=m&no=750 body的偏移量是不包含margin的
        //我们可以通过getBoundingClientRect来获得元素相对于client的rect.
        //http://msdn.microsoft.com/en-us/library/ms536433.aspx
        var box = node.getBoundingClientRect(),win = getWindow(doc),
        root = (navigator.vendor || doc.compatMode == "BackCompat" )  ?  doc.body : doc.documentElement,
        clientTop  = root.clientTop  >> 0,
        clientLeft = root.clientLeft >> 0,
        scrollTop  = win.pageYOffset ||  root.scrollTop  ,
        scrollLeft = win.pageXOffset ||  root.scrollLeft ;
        // 把滚动距离加到left,top中去。
        // IE一些版本中会自动为HTML元素加上2px的border，我们需要去掉它
        // http://msdn.microsoft.com/en-us/library/ms533564(VS.85).aspx
        pos.top  = box.top  + scrollTop  - clientTop,
        pos.left = box.left + scrollLeft - clientLeft;

        return pos;
    }
    //=========================　处理　position　=========================
    $.fn.position = function() {//取得元素相对于其offsetParent的坐标
        var offset, offsetParent , node = this[0],
        parentOffset = {//默认的offsetParent相对于视窗的距离
            top: 0,
            left: 0
        }
        if ( !node ||  node.nodeType !== 1 ) {
            return
        }
        //fixed 元素是相对于window
        if(getter( node, "position" ) === "fixed" ){
            offset  = node.getBoundingClientRect();
        } else {
            offset = this.offset();//得到元素相对于视窗的距离（我们只有它的top与left）
            offsetParent = this.offsetParent();
            if ( offsetParent[ 0 ].tagName !== "HTML"  ) {
                parentOffset = offsetParent.offset();//得到它的offsetParent相对于视窗的距离
            }
            parentOffset.top  += parseFloat( getter( offsetParent[ 0 ], "borderTopWidth" ) ) || 0;
            parentOffset.left += parseFloat( getter( offsetParent[ 0 ], "borderLeftWidth" ) ) || 0;
        }
        return {
            top:  offset.top  - parentOffset.top - ( parseFloat( getter( node, "marginTop" ) ) || 0 ),
            left: offset.left - parentOffset.left - ( parseFloat( getter( node, "marginLeft" ) ) || 0 )
        };
    }
    //https://github.com/beviz/jquery-caret-position-getter/blob/master/jquery.caretposition.js
    //https://developer.mozilla.org/en-US/docs/DOM/element.offsetParent
    //如果元素被移出DOM树，或display为none，或作为HTML或BODY元素，或其position的精确值为fixed时，返回null
    $.fn.offsetParent = function() {
        return this.map(function() {
            var el = this.offsetParent;
            while ( el && (el.parentNode.nodeType !== 9 ) && getter(el, "position") === "static" ) {
                el = el.offsetParent;
            }
            return el || document.documentElement;
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
    //=========================　处理　scrollLeft scrollTop　=========================
    "scrollLeft_pageXOffset,scrollTop_pageYOffset".replace( rmapper, function(_, method, prop ) {
        $.fn[ method ] = function( val ) {
            var node, win, top = method == "scrollTop";
            if ( val === void 0 ) {
                node = this[ 0 ];
                if ( !node ) {
                    return null;
                }
                win = getWindow( node );//获取第一个元素的scrollTop/scrollLeft
                return win ? (prop in win) ? win[ prop ] :
                win.document.documentElement[ method ]  : node[ method ];
            }
            return this.each(function() {//设置匹配元素的scrollTop/scrollLeft
                win = getWindow( this );
                if ( win ) {
                    win.scrollTo(
                        !top ? val : $( win ).scrollLeft(),
                        top ? val : $( win ).scrollTop()
                        );
                } else {
                    this[ method ] = val;
                }
            });
        };
    });
    var pseudoHooks = window.VBArray && $.query && $.query.pseudoHooks
    if(pseudoHooks){
        pseudoHooks.hidden = function( el ) {
            return el.type === "hidden" || $.css( el, "display") === "none" ;
        }
    }
    function getWindow( node ) {
        return $.type(node,"Window") ?   node : node.nodeType === 9 ? node.defaultView || node.parentWindow : false;
    }
    return $;
});
/**
2011.9.5将cssName改为隋性函数,修正msTransform Bug
2011.9.19 添加$.fn.offset width height innerWidth innerHeight outerWidth outerHeight scrollTop scrollLeft offset position
2011.9.20 v2
2011.10.10 重构position offset保持这两者行为一致，
2011.10.15 Fix $.css BUG  添加transform rotate API
2011.10.21 修正width height的BUG
2011.11.10 添加top,left到cssHooks
2011.11.21 _all2deg,_all2rad,_toMatrixArray,_toMatrixObject放到命名空间之下，方便调用，简化transform逻辑
2012.3.2 getWH现在能获取多重隐藏元素的高宽了
2012.4.15 对zIndex进行适配,对$.css进行元素节点检测
2012.4.16 重构showHidden
2012.5.9 $.Matrix2D支持matrix方法，去掉rotate方法 css 升级到v3
2012.5.10 FIX toFloat BUG
2012.5.26 重构$.fn.width, $.fn.height,$.fn.innerWidth, $.fn.innerHeight, $.fn.outerWidth, $.fn.outerHeight
2012.11.25 添加旋转
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

　　http://www.haogongju.net/art/1623802
　　
　　http://www.dwww.cn/News/2010-5/201051722222811058.shtml
　　http://www.cnblogs.com/niuniu/archive/2010/06/07/1753035.html
　　
　　这里的阴影运用得不错
　　http://www.soleilneon.com/blog/2010/10/add-css3-border-radius-and-box-shadow-to-your-design/
 */

