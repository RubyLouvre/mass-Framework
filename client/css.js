//=========================================
// 样式操作模块 by 司徒正美
//=========================================
var node$css_fix = this.getComputedStyle ? "node" : "node,css_fix" ;
$.define( "css", node$css_fix, function(){
    var cssFloat = $.support.cssFloat ? 'cssFloat': 'styleFloat',
    rmatrix = /\(([^,]*),([^,]*),([^,]*),([^,]*),([^,p]*)(?:px)?,([^)p]*)(?:px)?/,
    rad2deg = 180/Math.PI,
    deg2rad = Math.PI/180,
    prefixes = ['', '-ms-','-moz-', '-webkit-', '-khtml-', '-o-','ms-'],
    adapter = $.cssAdapter = $.cssAdapter || {};
    function cssCache(name){
        return cssCache[name] || (cssCache[name] = name == 'float' ? cssFloat : $.String.camelize( name ));
    }
    var shortcuts = {
        c:          "color",
        h:          "height",
        o:          "opacity",
        r:          "rotate",
        w:          "width",
        x:          "left",
        y:          "top",
        fs:         "fontSize",
        st:         "scrollTop",
        sl:         "scrollLeft",
        sx:         "scaleX",
        sy:         "scaleY",
        tx:         "translateX",
        ty:         "translateY",
        bgc:        "backgroundColor"
    }
    //http://www.w3.org/TR/2009/WD-css3-2d-transforms-20091201/#introduction
    $.mix($, {
        cssCache:cssCache,
        //http://www.cnblogs.com/rubylouvre/archive/2011/03/28/1998223.html
        cssName : function(name, target, test){
            if(cssCache[name])
                return name;
            target = target || $.html.style;
            for (var i = 0, n = prefixes.length; i < n; i++) {
                test = $.String.camelize( prefixes[i] + name )
                if( test in target ){
                    return (cssCache[name] = test);
                }
            }
            return null;
        },
        scrollbarWidth:function (){
            if( $.scrollbarWidth.ret ){
                return $.scrollbarWidth.ret
            }
            var test =  $('<div style="width: 100px;height: 100px;overflow: scroll;position: absolute;top: -9999px;"/>').appendTo("body");
            var ret = test[0].offsetWidth - test[0].clientWidth;              
            test.remove();
            return $.scrollbarWidth.ret = ret;
        },
        cssNumber : $.oneObject("fontSizeAdjust,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom,rotate"),
        css: function(nodes, name, value){
            var props = {} , fn;
            nodes = nodes.nodeType == 1 ? [nodes] : nodes;
            if(name && typeof name === "object"){
                props = name;
            }else if(value === void 0){
                return (adapter[name+":get"] || adapter["_default:get"])( nodes[0], cssCache(name) );
            }else {
                props[name] = value;
            }
            for(name in props){
                value = props[name];
                name = shortcuts[name];
                name = cssCache(name);
                fn = adapter[name+":set"] || adapter["_default:set"];
                if ( isFinite( value ) && !$.cssNumber[ name ] ) {
                    value += "px";
                }
                for(var i = 0, node; node = nodes[i++];){
                    if(node && node.nodeType === 1){
                        fn(node, name, value );
                    }
                }
            }
            return nodes;
        },
        //CSS3新增的三种角度单位分别为deg(角度)， rad(弧度)， grad(梯度或称百分度 )。 
        all2deg : function (value) {
            value += "";
            return ~value.indexOf("deg") ?  parseInt(value,10): 
            ~value.indexOf("grad") ?  parseInt(value,10) * 2/1.8:
            ~value.indexOf("rad") ?   parseInt(value,10) * rad2deg:
            parseFloat(value);
        },
        all2rad :function (value){
            return $.all2deg(value) * deg2rad;
        },
        //将 skewx(10deg) translatex(150px)这样的字符串转换成3*2的距阵
        _toMatrixArray: function(/*String*/ transform ) {
            transform = transform.split(")");
            var
            i = transform.length -1
            , split, prop, val
            , A = 1
            , B = 0
            , C = 0
            , D = 1
            , A_, B_, C_, D_
            , tmp1, tmp2
            , X = 0
            , Y = 0 ;
            while ( i-- ) {
                split = transform[i].split("(");
                prop = split[0].trim();
                val = split[1];
                A_ = B_ = C_ = D_ = 0;
                switch (prop) {
                    case "translateX":
                        X += parseInt(val, 10);
                        continue;

                    case "translateY":
                        Y += parseInt(val, 10);
                        continue;

                    case "translate":
                        val = val.split(",");
                        X += parseInt(val[0], 10);
                        Y += parseInt(val[1] || 0, 10);
                        continue;

                    case "rotate":
                        val = $.all2rad(val) ;
                        A_ = Math.cos(val);
                        B_ = Math.sin(val);
                        C_ = -Math.sin(val);
                        D_ = Math.cos(val);
                        break;

                    case "scaleX":
                        A_ = val;
                        D_ = 1;
                        break;

                    case "scaleY":
                        A_ = 1;
                        D_ = val;
                        break;

                    case "scale":
                        val = val.split(",");
                        A_ = val[0];
                        D_ = val.length>1 ? val[1] : val[0];
                        break;

                    case "skewX":
                        A_ = D_ = 1;
                        C_ = Math.tan( $.all2rad(val));
                        break;

                    case "skewY":
                        A_ = D_ = 1;
                        B_ = Math.tan( $.all2rad(val));
                        break;

                    case "skew":
                        A_ = D_ = 1;
                        val = val.split(",");
                        C_ = Math.tan( $.all2rad(val[0]));
                        B_ = Math.tan( $.all2rad(val[1] || 0));
                        break;

                    case "matrix":
                        val = val.split(",");
                        A_ = +val[0];
                        B_ = +val[1];
                        C_ = +val[2];
                        D_ = +val[3];
                        X += parseInt(val[4], 10);
                        Y += parseInt(val[5], 10);
                }
                // Matrix product
                tmp1 = A * A_ + B * C_;
                B    = A * B_ + B * D_;
                tmp2 = C * A_ + D * C_;
                D    = C * B_ + D * D_;
                A = tmp1;
                C = tmp2;
            }
            return [A,B,C,D,X,Y];
        },
        // 将矩阵转换为一个含有 rotate, scale and skew 属性的对象
        // http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp
        _toMatrixObject: function(/*Array*/matrix) {
            var scaleX
            , scaleY
            , XYshear 
            , A = matrix[0]
            , B = matrix[1]
            , C = matrix[2]
            , D = matrix[3] ;
            // matrix is singular and cannot be interpolated
            if ( A * D - B * C ) {
                // step (3)
                scaleX = Math.sqrt( A * A + B * B );
                A /= scaleX;
                B /= scaleX;
                // step (4)
                XYshear  = A * C + B * D;
                C -= A * XYshear ;
                D -= B * XYshear ;
                // step (5)
                scaleY = Math.sqrt( C * C + D * D );
                C /= scaleY;
                D /= scaleY;
                XYshear /= scaleY;
                // step (6)
                // A*D - B*C should now be 1 or -1
                if ( A * D < B * C ) {
                    A = -A;
                    B = -B;
                    C = -C;
                    B = -B;
                    D = -D;
                    XYshear = -XYshear;
                    scaleX = -scaleX;
                }

            } else {
                B = A = scaleX = scaleY = XYshear = 0;
            }
            return {
                translateX: +matrix[4],
                translateY: +matrix[5],
                rotate: Math.atan2(B, A),
                scaleX: scaleX,
                scaleY: scaleY,
                skew: [XYshear, 0]
            }
        }
      
    });
    //支持情况 ff3.5 chrome ie9 pp6 opara10.5 safari3.1
    var cssTransfrom = $.cssName("transform");
    if(cssTransfrom){
        // gerrer(node) 返回一个包含 scaleX,scaleY, rotate, translateX,translateY, translateZ的对象
        // setter(node, { rotate: 30 })返回自身
        $.transform = function(node,  param){
            var meta = $._data(node,"transform"),arr = [1,0,0,1,0,0], m
            if(!meta){
                //将CSS3 transform属性中的数值分解出来
                var style = $.css([node],cssTransfrom);
                if(~style.indexOf("matrix")){
                    m = rmatrix.exec(style);
                    arr = [m[1], m[2], m[3], m[4], m[5], m[6]];
                }else if(style.length > 6){
                    arr = $._toMatrixArray(style)
                }
                meta = $._toMatrixObject(arr);
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
            node.style[cssTransfrom]  =
            "scale(" + meta.scaleX + "," + meta.scaleY + ") " +
            "rotate(" + $.all2deg(meta.rotate)  + "deg) " +
            "translate(" + meta.translateX  + "px," + meta.translateY + "px)";
        }
    }
    //IE9 FF等支持getComputedStyle
    $.mix(adapter, {
        "_default:get" :function( node, name){
            return node.style[ name ];
        },
        "_default:set" :function( node, name, value){
            node.style[ name ] = value;
        },
        "rotate:get":function( node ){
            return $.all2deg(($.transform(node) || {}).rotate) ;
        },
        "rotate:set":function( node, name, value){
            $.transform(node, {
                rotate:value
            });
        }
    },false);

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

    //=========================　处理　width height　=========================
    var getter = $.cssAdapter["_default:get"], RECT = "getBoundingClientRect",
    cssPair = {
        Width:['Left', 'Right'],
        Height:['Top', 'Bottom']
    }
    function getWH( node, name,extra  ) {//注意 name是首字母大写
        var none = 0, getter = $.cssAdapter["_default:get"], which = cssPair[name];
        if(getter(node,"display") === "none" ){
            none ++;
            node.style.display = "block";
        }
        var rect = node[RECT] && node[RECT]() || node.ownerDocument.getBoxObjectFor(node),
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
        none && (node.style.display = "none");
        return val;
    }
    "width,height".replace($.rword,function(name){
        $.cssAdapter[ name+":get" ] = function(node, name){
            return getWH(node, name == "width" ? "Width" : "Height") + "px";
        }
    });
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
    "Height,Width".replace($.rword, function(  name ) {
        $.fn[ name.toLowerCase() ] = function(size) {
            var target = this[0];
            if ( !target ) {
                return size == null ? null : this;
            }
            if ( $.type(target, "Window")) {//取得浏览器工作区的大小
                var doc = target.document, prop = doc.documentElement[ "client" + name ], body = doc.body;
                return doc.compatMode === "CSS1Compat" && prop || body && body[ "client" + name ] || prop;
            } else if ( target.nodeType === 9 ) {//取得页面的大小（包括不可见部分）
                return Math.max(
                    target.documentElement["client" + name],
                    target.body["scroll" + name], target.documentElement["scroll" + name],
                    target.body["offset" + name], target.documentElement["offset" + name]
                    );
            } else if ( size === void 0 ) {
                return getWH(target,name, 0) 
            } else {
                return $.css(this,name.toLowerCase(),size);
            }
        };
        $.fn[ "inner" + name ] = function() {
            var node = this[0];
            return node && node.style ? getWH(node,name, 1) : null;
        };
        // outerHeight and outerWidth
        $.fn[ "outer" + name ] = function( margin ) {
            var node = this[0], extra = margin === "margin" ? 3 : 2;
            return node && node.style ?  getWH(node,name, extra) : null;
        };
    });
        
    //=========================　处理　left top　=========================
    "Left,Top".replace($.rword, function(name){
        adapter[ name.toLowerCase() +":get"] =  function(node){
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
                    if (node.uniqueID && document.documentMode < 9 ||window.opera) {
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
    });
    
    //=========================　处理　user-select　=========================
    //https://developer.mozilla.org/en/CSS/-moz-user-select
    //http://www.w3.org/TR/2000/WD-css3-userint-20000216#user-select
    //具体支持情况可见下面网址
    //http://help.dottoro.com/lcrlukea.php
    adapter[ "userSelect:set" ] = function( node, name, value ) {
        name = $.cssName(name);
        if(typeof name === "string"){
            return node.style[name] = value
        }
        var allow = /none/.test(value||"all");
        node.unselectable  = allow ? "" : "on";
        node.onselectstart = allow ? "" : function(){
            return false;
        };
    };
      
    //=======================================================
    //获取body的offset
    function getBodyOffsetNoMargin(){
        var el = document.body, ret = parseFloat($.css(el,"margin-top"))!== el.offsetTop;
        function getBodyOffsetNoMargin(){
            return ret;//一次之后的执行结果
        }
        return ret;//第一次执行结果
    }
       
    $.fn.offset = function(){//取得第一个元素位于页面的坐标
        var node = this[0], owner = node && node.ownerDocument, pos = {
            left:0,
            top:0
        };
        if ( !node || !owner ) {
            return pos;
        }
        if(node.tagName === "BODY"){
            pos.top = node.offsetTop;
            pos.left = body.offsetLeft;
            //http://hkom.blog1.fc2.com/?mode=m&no=750 body的偏移量是不包含margin的
            if(getBodyOffsetNoMargin()){
                pos.top  += parseFloat( getter(node, "marginTop") ) || 0;
                pos.left += parseFloat( getter(node, "marginLeft")) || 0;
            }
            return pos;
        }else if ($.html[RECT]) { //如果支持getBoundingClientRect
            //我们可以通过getBoundingClientRect来获得元素相对于client的rect.
            //http://msdn.microsoft.com/en-us/library/ms536433.aspx
            var box = node[RECT](),win = getWindow(owner),
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
        position: function() {
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
        }
    });

    "Left,Top".replace($.rword,function(  name ) {
        var method = "scroll" + name;
        $.fn[ method ] = function( val ) {
            var node, win, i = name == "Top";
            if ( val === void 0 ) {
                node = this[ 0 ];
                if ( !node ) {
                    return null;
                }
                win = getWindow( node );
                // Return the scroll offset
                return win ? ("pageXOffset" in win) ? win[ i ? "pageYOffset" : "pageXOffset" ] :
                $.support.boxModel && win.document.documentElement[ method ] ||
                win.document.body[ method ] :
                node[ method ];
            }
            // Set the scroll offset
            return this.each(function() {
                win = getWindow( this );
                if ( win ) {
                    win.scrollTo(
                        !i ? val : $( win ).scrollLeft(),
                        i ? val : $( win ).scrollTop()
                        );
                } else {
                    this[ method ] = val;
                }
            });
        };
    });
    function getWindow( node ) {
        return $.type(node,"Window") ?   node : node.nodeType === 9 ? node.defaultView || node.parentWindow : false;
    } ;
  

    $.implement({
        css : function(name, value){
            return $.css(this, name, value);
        },
        rotate : function(value){
            return  $.css(this, "rotate", value) ;
        }
    });
    "margin,padding,borderWidth".replace(/([a-z]+)([^,]*)/g,function(s,a,b){
        // console.log([a,b])
        })

});

//2011.9.5
//将cssName改为隋性函数,修正msTransform Bug
//2011.9.19 添加$.fn.offset width height innerWidth innerHeight outerWidth outerHeight scrollTop scrollLeft offset position
//2011.10.10 重构position offset保持这两者行为一致，
//2011.10.14 Fix $.css BUG，如果传入一个对象，它把到getter分支了。
//2011.10.15 Fix $.css BUG  添加transform rotate API
//2011.10.20 getWH不能获取隐藏元素的BUG
//2011.10.21 修正width height的BUG
//2011.11.10 添加top,left到cssAdapter
//2011.11.21 all2deg,all2rad,_toMatrixArray,_toMatrixObject放到命名空间之下，方便调用，简化transform逻辑