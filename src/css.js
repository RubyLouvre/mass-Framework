//=========================================
// 样式操作模块 by 司徒正美
//=========================================
$.define( "css", !!top.getComputedStyle ? "node" : "node,css_fix" , function(){
    $.log( "已加载css模块" );

    var prefixes = ['', '-ms-','-moz-', '-webkit-', '-khtml-', '-o-','ms-'],
    adapter = $.cssAdapter = $.cssAdapter || {};
    function cssMap(name){
        return cssMap[name] ||  $.String.camelize( name );
    }
    var shortcuts = {
        c:   "color",
        h:   "height",
        o:   "opacity",
        r:   "rotate",
        w:   "width",
        x:   "left",
        y:   "top",
        fs:  "fontSize",
        st:  "scrollTop",
        sl:  "scrollLeft",
        sx:  "scaleX",
        sy:  "scaleY",
        tx:  "translateX",
        ty:  "translateY",
        bgc: "backgroundColor",
        opacity: "opacity",//fix IE
        "float":  $.support.cssFloat ? 'cssFloat': 'styleFloat'
    };
    for(var name in shortcuts){
        cssMap[ name ]  = shortcuts[ name ]
    }
    var rrelNum = /^([\-+])=([\-+.\de]+)/
    $.implement({
        css : function( name, value , neo){
            if(typeof name === "string"){
                neo = $.cssName(name)
                neo = neo != name ? neo : false
            }
            return $.access( this, name, value, $.css, neo  );
        },
        rotate : function( value ){
            return  this.css( "rotate", value ) ;
        }
    });

    //http://www.w3.org/TR/2009/WD-css3-2d-transforms-20091201/#introduction
    $.mix({
        cssMap: cssMap,
        //http://www.cnblogs.com/rubylouvre/archive/2011/03/28/1998223.html
        cssName: function( name, host, test ){
            if( cssMap[ name ] )
                return cssMap[ name ];
            host = host || $.html.style;
            for ( var i = 0, n = prefixes.length; i < n; i++ ) {
                test = $.String.camelize( prefixes[i] + name || "")
                if( test in host ){
                    return ( cssMap[ name ] = test );
                }
            }
            return null;
        },
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
            if(node.style){
                name = typeof this === "string" ? this : cssMap( name );
                if( value === void 0){ //取值
                    return (adapter[ name+":get" ] || adapter[ "_default:get" ])( node, name );
                }else {//设值
                    var temp;
                    if ( typeof value === "string" && (temp = rrelNum.exec( value )) ) {
                        value = ( +( temp[1] + 1) * + temp[2] ) + parseFloat( $.css( node , name, void 0, 1 ) );
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
         
            var underscored = name == "cssFloat" ? "float" :
            name.replace( /([A-Z]|^ms)/g, "-$1" ).toLowerCase(),
            rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i,
            rmargin = /^margin/, style = node.style ;
            if ( (computedStyle = defaultView.getComputedStyle( node, null )) ) {
                ret = computedStyle.getPropertyValue( underscored );
                if ( ret === "" && !$.contains( node.ownerDocument, node ) ) {
                    ret = style[name];//如果还没有加入DOM树，则取内联样式
                }
            }
              
            // A tribute to the "awesome hack by Dean Edwards"
            // WebKit uses "computed value (percentage if specified)" instead of "used value" for margins
            // which is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
            if ( !$.support.cssPercentedMargin && computedStyle && rmargin.test( name ) && rnumnonpx.test( ret ) ) {
                var width = style.width;
                style.width = ret;
                ret = computedStyle.width;
                style.width = width;
            }

            return ret === "" ? "auto" : ret;
        };
    }
    //http://extremelysatisfactorytotalitarianism.com/blog/?p=1002
    //http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php
    //优化HTML5应用的体验细节，例如全屏的处理与支持，横屏的响应，图形缩放的流畅性和不失真，点触的响应与拖曳，Websocket的完善
    //关于JavaScript中计算精度丢失的问题 http://rockyee.iteye.com/blog/891538
    function toFixed(d){
        return  d > -0.0000001 && d < 0.0000001 ? 0 : /e/.test(d+"") ? d.toFixed(7) : d
    }
    function rad(value) {
        if(isFinite(value)) {
            return parseFloat(value);
        }
        if(~value.indexOf("deg")) {//圆角制。
            return parseInt(value,10) * (Math.PI / 180);
        } else if (~value.indexOf("grad")) {//梯度制。一个直角的100等分之一。一个圆圈相当于400grad。
            return parseInt(value,10) * (Math.PI/200);
        }//弧度制，360=2π
        return parseFloat(value,10)
    }
    //http://zh.wikipedia.org/wiki/%E7%9F%A9%E9%98%B5
    //http://help.dottoro.com/lcebdggm.php
    var Matrix2D = $.factory({
        init: function(a,b,c,d,tx,ty){
            this.set(a,b,c, d,tx,ty)
        },
        cross: function(a, b, c, d, tx, ty) {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            this.a  = a*a1+b*c1;
            this.b  = a*b1+b*d1;
            this.c  = c*a1+d*c1;
            this.d  = c*b1+d*d1;
            this.tx = tx*a1+ty*c1+this.tx;
            this.ty = tx*b1+ty*d1+this.ty;
            return this;
        },
        rotate : function(angle, fix) {
            fix = fix === "fix" ? -1 : 1
            angle = rad(angle)
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            return this.cross(cos, fix * sin, fix * -sin, cos, 0, 0)
        },
        skew : function(sx, sy) {
            var xRad = rad(sx);
            var yRad = rad(sy);
            return this.cross(1, Math.tan( yRad ), Math.tan( xRad ), 1, 0, 0, 0, 0);
        },
        skewX: function(sx){
            return this.skew(sx)
        },
        skewY: function(sy){
            return this.skew("0",sy)
        },
        scale : function(x, y) {
            this.a *= x;
            this.d *= y;
            this.tx *= x;
            this.ty *= y;
            return this;
        },
        scaleX: function(x){
            return this.scale(x ,1)
        },
        scaleY: function(y){
            return this.scale(1 ,y)
        },

        translate : function(x, y) {
            this.tx += x;
            this.ty += y;
            return this;
        },
        translateX : function(x) {
            this.tx += x;
            return this;
        },
        translateY : function(y) {
            this.ty += y;
            return this;
        },
        toString: function(){
            return "matrix("+this.get()+")";
        },
        get: function(){
            return [this.a,this.b,this.c,this.d,this.tx,this.ty]
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
        decompose : function() {
            //分解原始数值,得到a,b,c,e,tx,ty属性,以及返回一个包含x,y,scaleX,scaleY,skewX,skewY,rotation的对象
            var ret = {};
            ret.x = this.tx;
            ret.y = this.ty;
            ret.scaleX = Math.sqrt(this.a * this.a + this.b * this.b);
            ret.scaleY = Math.sqrt(this.c * this.c + this.d * this.d);

            var skewX = Math.atan2(-this.c, this.d);
            var skewY = Math.atan2(this.b, this.a);

            if (skewX == skewY) {
                ret.rotation = skewY/Matrix2D.DEG_TO_RAD;
                if (this.a < 0 && this.d >= 0) {
                    ret.rotation += (ret.rotation <= 0) ? 180 : -180;
                }
                ret.skewX = ret.skewY = 0;
            } else {
                ret.skewX = skewX/Matrix2D.DEG_TO_RAD;
                ret.skewY = skewY/Matrix2D.DEG_TO_RAD;
            }
            return ret;
        }
    });

    Matrix2D.DEG_TO_RAD = Math.PI/180;

    $.Matrix2D = Matrix2D
    
    var getter = $.cssAdapter["_default:get"], RECT = "getBoundingClientRect",
    //支持情况 ff3.5 chrome ie9 pp6 opara10.5 safari3.1
    cssTransfrom = $.cssName("transform");
    //缓存结果
    if(cssTransfrom){
        function dataTransfrom(node){
            var matrix = $._data( node, "matrix" ) || new Matrix2D();
            matrix.set.apply(matrix, getter(node, cssTransfrom).match(/[-+.e\d]+/g).map(function(d){
                return toFixed(d*1)
            }));
            return $._data(node, "matrix", matrix );
        }
        adapter[cssTransfrom + ":set"] = function(node, name, value){
            if(value.indexOf("matrix")!=-1 && name === "MozTransform"){
                value = value.replace(/([\d.-]+)\s*,\s*([\d.-]+)\s*\)/,"$1px, $2px)")
            }
            node.style[name] = value;
            dataTransfrom(node);
        }
    }
    adapter["rotate:get"] = function( node ){
        return dataTransfrom(node).decompose().rotation;
    }
    adapter["rotate:set"] = function( node, name, value){      
        adapter[cssTransfrom + ":set"](node, cssTransfrom, "rotate("+value+"deg)")
    }
    //http://granular.cs.umu.se/browserphysics/?cat=7
    //=========================　处理　user-select　=========================
    //https://developer.mozilla.org/en/CSS/-moz-user-select
    //http://www.w3.org/TR/2000/WD-css3-userint-20000216#user-select
    //具体支持情况可见下面网址
    //http://help.dottoro.com/lcrlukea.php
    var userSelect = $.cssName("userSelect");
    if(typeof userSelect === "string"){
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
    var showHidden = function(node, array){
        if( node && node.nodeType ==1 && !node.offsetWidth ){
            var obj = {
                node: node
            }
            for ( name in cssShow ) {
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
        var getter  = $.cssAdapter["_default:get"], which = cssPair[name], hidden = [];
        showHidden( node, hidden );
        var rect = node[ RECT ] && node[ RECT ]() || node.ownerDocument.getBoxObjectFor(node),
        val = node["offset" + name] ||  rect[which[1].toLowerCase()] - rect[which[0].toLowerCase()];
        extra = extra || 0;
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
        var lower = name.toLowerCase();
        $.cssAdapter[ lower+":get" ] = function( node ){
            return getWH( node, name ) + "px";//为适配器添加节点
        }
        $.fn[ "inner" + name ] = function() {
            var node = this[0];
            return node && node.style ? getWH( node, name, 1 ) : null;
        };
        // outerHeight and outerWidth
        $.fn[ "outer" + name ] = function( margin ) {
            var node = this[0], extra = margin === "margin" ? 3 : 2;
            return node && node.style ?  getWH( node,name, extra ) : null;
        };
        $.fn[ lower ] = function( size ) {
            var target = this[0];
            if ( !target ) {
                return size == null ? null : this;
            }
            if ( $.type( target, "Window" ) ) {//取得浏览器工作区的大小
                var doc = target.document, prop = doc.documentElement[ "client" + name ], body = doc.body;
                return doc.compatMode === "CSS1Compat" && prop || body && body[ "client" + name ] || prop;
            } else if ( target.nodeType === 9 ) {//取得页面的大小（包括不可见部分）
                return Math.max(
                    target.documentElement["client" + name],
                    target.body["scroll" + name], target.documentElement["scroll" + name],
                    target.body["offset" + name], target.documentElement["offset" + name]
                    );
            } else if ( size === void 0 ) {
                return getWH( target, name, 0 )
            } else {
                return this.css( lower, size );
            }
        };

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
        var method = "scroll" + name;//scrollTop,scrollLeft只有读方法
        $.fn[ method ] = function( val ) {
            var node, win, t = name == "Top";
            if ( val === void 0 ) {
                node = this[ 0 ];
                if ( !node ) {
                    return null;
                }
                win = getWindow( node );
                // Return the scroll offset
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

    "margin,padding,borderWidth".replace(/([a-z]+)([^,]*)/g,function(s,a,b){
        // console.log([a,b])
        });
});
/**
2011.9.5将cssName改为隋性函数,修正msTransform Bug
2011.9.19 添加$.fn.offset width height innerWidth innerHeight outerWidth outerHeight scrollTop scrollLeft offset position
2011.10.10 重构position offset保持这两者行为一致，
2011.10.15 Fix $.css BUG  添加transform rotate API
2011.10.21 修正width height的BUG
2011.11.10 添加top,left到cssAdapter
2011.11.21 _all2deg,_all2rad,_toMatrixArray,_toMatrixObject放到命名空间之下，方便调用，简化transform逻辑
2012.3.2 getWH现在能获取多重隐藏元素的高宽了
2012.4.15 对zIndex进行适配,对$.css进行元素节点检测
2012.4.16 重构showHidden
2012.5.4 css v2
//本地模拟多个域名http://hi.baidu.com/fmqc/blog/item/07bdeefa75f2e0cbb58f3100.html
http://boobstagram.fr/archive
    //CSS3新增的三种角度单位分别为deg(角度)， rad(弧度)， grad(梯度或称百分度 )。
  
 */


