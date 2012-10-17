//==================================================
// 节点操作模块
//==================================================
define( "node", ["$lang","$support","$class","$query","$data","ready"],function( lang, support ){
    $.log("已加载node模块",7);
    var rtag = /^[a-zA-Z]+$/, TAGS = "getElementsByTagName"
    function getDoc(){
        for( var i  = 0 , el; i < arguments.length; i++ ){
            if( el = arguments[ i ] ){
                if( el.nodeType ){
                    return el.nodeType === 9 ? el : el.ownerDocument;
                }else if( el.setTimeout ){
                    return el.document;
                }
            }
        }
        return document;
    }
    $.mix( $.mutators ).implement({
        init: function( expr, context ){
            // 分支1: 处理空白字符串,null,undefined参数
            if ( !expr ) {
                return this;
            }
            //分支2:  让$实例与元素节点一样拥有ownerDocument属性
            var doc, nodes;//用作节点搜索的起点
            if($.isArrayLike(context)){//typeof context === "string"
                return $( context ).find( expr );
            }
           
            if ( expr.nodeType ) { //分支3:  处理节点参数
                this.ownerDocument  = expr.nodeType === 9 ? expr : expr.ownerDocument;
                return $.Array.merge( this, [ expr ] );
            }
            this.selector = expr + "";
            if ( typeof expr === "string" ) {
                doc = this.ownerDocument = !context ? document : getDoc( context, context[0] );
                var scope = context || doc;
                if ( expr.charAt(0) === "<" && expr.charAt( expr.length - 1 ) === ">" && expr.length >= 3 ) {
                    nodes = $.parseHTML( expr, doc );//分支5: 动态生成新节点
                    nodes = nodes.childNodes
                } else if( rtag.test( expr ) ){//分支6: getElementsByTagName
                    nodes  = scope[ TAGS ]( expr ) ;
                } else{//分支7：进入选择器模块
                    nodes  = $.query( expr, scope );
                }
                return $.Array.merge( this, $.slice( nodes) );
            }else {//分支8：处理数组，节点集合或者mass对象或window对象
                this.ownerDocument = getDoc( expr[0] );
                $.Array.merge( this, $.isArrayLike(expr) ?  expr : [ expr ]);
                delete this.selector;
            }
        },
        mass: $.mass,
        length: 0,
        valueOf: function(){
            return Array.prototype.slice.call( this );
        },
        toString: function(){
            var i = this.length, ret = [], getType = $.type;
            while(i--){
                ret[i] = getType( this[i] );
            }
            return ret.join(", ");
        },
        labor: function( nodes ){
            var neo = new $;
            neo.context = this.context;
            neo.selector = this.selector;
            neo.ownerDocument = this.ownerDocument;
            return $.Array.merge( neo, nodes || [] );
        },
        slice: function( a, b ){
            return this.labor( $.slice(this, a, b) );
        },
        get: function( num ) {
            return num == null ? this.valueOf() : this[ num < 0 ? this.length + num : num ];
        },
        eq: function( i ) {
            return i === -1 ? this.slice( i ) :this.slice( i, +i + 1 );
        },
        gt:function( i ){
            return this.slice( i+1, this.length );
        },
        lt:function( i ){
            return this.slice( 0, i );
        },
        first: function() {
            return this.slice( 0, 1 );
        },
        even: function() {
            return this.labor( this.valueOf().filter(function( _, i ) {
                return i % 2 === 0;
            }));
        },
        odd: function() {
            return this.labor( this.valueOf().filter(function( _, i ) {
                return i % 2 === 1;
            }));
        },
        last: function() {
            return this.slice( -1 );
        },
        each: function( fn ){
            for ( var i = 0, n = this.length; i < n; i++ ) {
                fn.call( this[i], this[i], i );
            }
            return this;
        },
        map: function( fn ) {
            return this.labor( this.collect( fn ) );
        },
        collect: function( fn ){
            for ( var i = 0, ret = [], n = this.length; i < n; i++ ) {
                ret.push( fn.call( this[ i ], this[ i ], i ));
            }
            return ret
        },
        clone: function( dataAndEvents, deepDataAndEvents ) {
            dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
            deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
            return this.map( function () {
                return cloneNode( this,  dataAndEvents, deepDataAndEvents );
            });
        },
        //取得或设置节点的innerHTML属性
        html: function( item ){
            item = item === void 0 ? item : item == null ?  '' : item+""
            return $.access(this, 0, item, function( el ){//getter
                //如果当前元素不是null, undefined,并确保是元素节点或者nodeName为XML,则进入分支
                //为什么要刻意指出XML标签呢?因为在IE中,这标签并不是一个元素节点,而是内嵌文档
                //的nodeType为9,IE称之为XML数据岛
                if ( el && (el.nodeType === 1 || /xml/i.test(el.nodeName)) ) {
                    return "innerHTML" in el ? el.innerHTML : innerHTML(el)
                }
                return null;
            }, function(el, _, value){//setter
                //接着判断innerHTML属性是否符合标准,不再区分可读与只读
                //用户传参是否包含了script style meta等不能用innerHTML直接进行创建的标签
                //及像col td map legend等需要满足套嵌关系才能创建的标签, 否则会在IE与safari下报错
                if ( support.innerHTML && (!rcreate.test(value) && !rnest.test(value)) ) {
                    try {
                        for ( var i = 0; el = this[ i++ ]; ) {
                            if ( el.nodeType === 1 ) {
                                $.slice( el[TAGS]("*") ).each( cleanNode );
                                el.innerHTML = value;
                            }
                        }
                        return;
                    } catch(e) {};
                }
                this.empty().append( value );
            }, this);
        },
        // 取得或设置节点的text或innerText或textContent属性
        text: function( item ){
            return $.access(this, 0, item, function( el ){
                if( !el ){//getter
                    return "";
                }else if(el.tagName == "OPTION" || el.tagName === "SCRIPT"){
                    return el.text;
                }
                return el.textContent || el.innerText || $.getText( [el] );
            }, function(){//setter
                this.empty().append( this.ownerDocument.createTextNode( item ));
            },this);
        },
        // 取得或设置节点的outerHTML
        outerHTML: function( item ){
            return $.access(this, 0, item, function( el ){
                if( el && el.nodeType === 1 ){
                    return "outerHTML" in el ? el.outerHTML :outerHTML( el );
                }
                return null;
            }, function(){
                this.empty().replace( item );
            }, this);
        }
    });
    $.fn = $.prototype;
    $.fn.init.prototype = $.fn;
    "push,unshift,pop,shift,splice,sort,reverse".replace( $.rword, function( method ){
        $.fn[ method ] = function(){
            Array.prototype[ method ].apply(this, arguments);
            return this;
        }
    });
    "remove,empty".replace( $.rword, function( method ){
        $.fn[ method ] = function(){
            var isRemove = method === "remove";
            for ( var i = 0, node; node = this[i++]; ){
                if(node.nodeType === 1){
                    //移除匹配元素
                    $.slice( node[ TAGS ]("*") ).concat( isRemove ? node : [] ).forEach( cleanNode );
                }
                if( isRemove ){
                    if ( node.parentNode ) {
                        node.parentNode.removeChild( node );
                    }
                }else{
                    while ( node.firstChild ) {
                        node.removeChild( node.firstChild );
                    }
                }
            }
            return this;
        }
    });
    //前导 前置 追加 后放 替换
    "append,prepend,before,after,replace".replace( $.rword, function( method ){
        $.fn[ method ] = function( item ){
            return manipulate( this, method, item, this.ownerDocument );
        }
        $.fn[ method+"To" ] = function( item ){
            $( item, this.ownerDocument )[ method ]( this );
            return this;
        }
    });
   
    //http://dev.opera.com/articles/view/opera-mobile-emulator-experimental-webkit-prefix-support/
    var prefixes = ['','-webkit-','-o-','-moz-', 'moz-', '-ms-', 'WebKit-','ms-', '-khtml-' ]
    var cssMap = {//支持检测 WebKitMutationObserver WebKitCSSMatrix mozMatchesSelector 
        c:   "color",
        h:   "height",
        o:   "opacity",
        w:   "width",
        x:   "left",
        y:   "top",
        fs:  "fontSize",
        st:  "scrollTop",
        sl:  "scrollLeft",
        bgc: "backgroundColor",
        opacity: "opacity",//fix IE
        "float":  $.support.cssFloat ? 'cssFloat': 'styleFloat'
    };
    function cssName( name, host, test ){//name必须小写开头
        if( cssMap[ name ] ){
            return cssMap[ name ];
        }
        host = host || $.html.style;
        for ( var i = 0, n = prefixes.length; i < n; i++ ) {
            test = $.String.camelize( prefixes[i] + name || "")
            if( test in host ){
                return ( cssMap[ name ] = test );
            }
        }
        return null;
    }
    var matchesAPI = cssName( "matchesSelector",$.html );
    $.mix({
        //http://www.cnblogs.com/rubylouvre/archive/2011/03/28/1998223.html
        cssName: cssName,
        match: function ( node, expr, id ){
            try{
                return node[matchesAPI]( expr );
            } catch(e) {
                var parent = node.parentNode, array
                if( parent ){      
                    array = $.query( expr, node.ownerDocument );
                    return  array.indexOf( node ) != -1
                }
                return false;
            }
        },
        //用于统一配置多态方法的读写访问，涉及方法有text, html,outerHTML,data, attr, prop, val
        access: function( elems, key, value, getter, setter, bind ) {
            var length = elems.length;
            setter = typeof setter === "function" ? setter : getter;
            bind = arguments[arguments.length - 1];
            if ( typeof key === "object" ) {
                for(var k in key){            //为所有元素设置N个属性
                    for ( var i = 0; i < length; i++ ) {
                        setter.call( bind, elems[i], k, key[k] );
                    }
                }
                return elems;
            }
            if ( value !== void 0 ) {
                for ( i = 0; i < length; i++ ) {
                    setter.call(bind, elems[i], key, value );
                }
                return elems;
            } //取得第一个元素的属性, getter的参数总是很小的
            return length ? getter.call( bind, elems[0], key ) : void 0;
        },
        /**
         * 将字符串转换为文档碎片，如果没有传入文档碎片，自行创建一个
         * 有关innerHTML与createElement创建节点的效率可见<a href="http://andrew.hedges.name/experiments/innerhtml/">这里</a><br/>
         * 注意，它能执行元素的内联事件，如<br/>
         * <pre><code>$.parseHTML("<img src=1 onerror=alert(22) />")</code></pre>
         * @param {String} html 要转换为节点的字符串
         * @param {Document} doc 可选
         * @return {FragmentDocument}
         */
        parseHTML: function( html, doc ){
            doc = doc || this.nodeType === 9  && this || document;
            html = html.replace( rxhtml, "<$1></$2>" ).trim();
            //尝试使用createContextualFragment获取更高的效率
            //http://www.cnblogs.com/rubylouvre/archive/2011/04/15/2016800.html
            if( $.commonRange && doc === document && !rcreate.test(html) && !rnest.test(html) ){
                return $.commonRange.createContextualFragment( html );
            }
            if( !support.createAll ){//fix IE
                html = html.replace(rcreate,"<br class='fix_create_all'/>$1");//在link style script等标签之前添加一个补丁
            }
            var tag = (rtagName.exec( html ) || ["", ""])[1].toLowerCase(),//取得其标签名
            wrap = translations[ tag ] || translations._default,
            fragment = doc.createDocumentFragment(),
            wrapper = doc.createElement("div"), firstChild;
            html = wrap[3] ? wrap[3](html) : html
            wrapper.innerHTML = wrap[1] + html + wrap[2];
            var els = wrapper[ TAGS ]("script");
            if( els.length ){//使用innerHTML生成的script节点不会发出请求与执行text属性
                var script = doc.createElement("script"), neo;
                for ( var i = 0, el; el = els[ i++ ]; ){
                    if ( !el.type || types[ el.type ] ){//如果script节点的MIME能让其执行脚本
                        neo = script.cloneNode(false);//FF不能省略参数
                        for ( var j = 0, attr; attr = el.attributes[ j++ ]; ){
                            if( attr.specified ){//复制其属性
                                neo[ attr.name ] = [ attr.value ];
                            }
                        }
                        neo.text = el.text;//必须指定,因为无法在attributes中遍历出来
                        el.parentNode.replaceChild( neo, el );//替换节点
                    }
                }
            }
            //移除我们为了符合套嵌关系而添加的标签
            for ( i = wrap[0]; i--;wrapper = wrapper.lastChild ){};
            //在IE6中,当我们在处理colgroup, thead, tfoot, table时会发生成一个tbody标签
            if( !support.insertTbody ){
                var noTbody = !rtbody.test( html ); //矛:html本身就不存在<tbody字样
                els = wrapper[ TAGS ]( "tbody" );
                if ( els.length > 0 && noTbody ){//盾：实际上生成的NodeList中存在tbody节点
                    for ( i = 0; el = els[ i++ ]; ) {
                        if(!el.childNodes.length )//如果是自动插入的里面肯定没有内容
                            el.parentNode.removeChild( el );
                    }
                }
            }
            if( !support.createAll ){//移除所有补丁
                for( els = wrapper[ TAGS ]( "br" ), i = 0; el = els[ i++ ]; ) {
                    if( el.className && el.className === "fix_create_all" ) {
                        el.parentNode.removeChild(el);
                    }
                }
            }
            if( !support.appendChecked ){//IE67没有为它们添加defaultChecked
                for( els = wrapper[ TAGS ]( "input" ), i = 0; el = els[ i++ ]; ) {
                    if ( el.type === "checkbox" || el.type === "radio" ) {
                        el.defaultChecked = el.checked;
                    }
                }
            }
            while( firstChild = wrapper.firstChild ){ // 将wrapper上的节点转移到文档碎片上！
                fragment.appendChild( firstChild );
            }
            return fragment;
        }
    });
    //parseHTML的辅助变量
    var translations  = {
        option: [ 1, "<select multiple='multiple'>", "</select>" ],
        legend: [ 1, "<fieldset>", "</fieldset>" ],
        thead: [ 1, "<table>", "</table>" ],
        tr: [ 2, "<table><tbody>", "</tbody></table>" ],
        td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
        col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
        area: [ 1, "<map>", "</map>" ],
        _default: [ 0, "", "" ]
    };

    if(!support.createAll ){//IE678在用innerHTML生成节点时存在BUG，不能直接创建script,link,meta,style与HTML5的新标签
        translations._default = [ 1, "X<div>", "</div>" ]
        translations.param = [ 1, "X<object>", "</object>" ,function ( elem ) {
            return elem.replace(/<param([^>]*)>/gi, function( m, s1, offset ) {
                var name = s1.match( /name=["']([^"']*)["']/i );
                return name ? ( name[1].length ?
                    // It has a name attr with a value
                    "<param" + s1 + ">" :
                    // It has name attr without a value
                    "<param" + s1.replace( name[0], "name='_" + offset +  "'" ) + ">" ) :
                // No name attr
                "<param name='_" + offset +  "' " + s1 + ">";
            });
        }]
    }
    translations.optgroup = translations.option;
    translations.tbody = translations.tfoot = translations.colgroup = translations.caption = translations.thead;
    translations.th = translations.td;
    var
    rtbody = /<tbody[^>]*>/i,
    rtagName = /<([\w:]+)/,//取得其tagName
    rxhtml =  /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rcreate = support.createAll ? /<(?:script)/ig : /(<(?:script|link|style))/ig,
    types = $.oneObject("text/javascript","text/ecmascript","application/ecmascript","application/javascript","text/vbscript"),
    //需要处理套嵌关系的标签
    rnest = /<(?:td|th|tf|tr|col|opt|leg|cap|area)/,adjacent = "insertAdjacentHTML",
    insertApapter = {
        prepend: function( el, node ){
            el.insertBefore( node, el.firstChild );
        },
        append: function( el, node ){
            el.appendChild( node );
        },
        before: function( el, node ){
            el.parentNode.insertBefore( node, el );
        },
        after: function( el, node ){
            el.parentNode.insertBefore( node, el.nextSibling );
        },
        replace: function( el, node ){
            el.parentNode.replaceChild( node, el );
        },
        prepend2: function( el, html ){
            el[adjacent]( "afterBegin", html );
        },
        append2: function( el, html ){
            el[adjacent]( "beforeEnd", html );
        },
        before2: function( el, html ){
            el[adjacent]( "beforeBegin", html );
        },
        after2: function( el, html ){
            el[adjacent]( "afterEnd", html );
        }
    };
    var insertAdjacentNode = function( elems, fn, item ){
        for( var i = 0, el; el = elems[i]; i++ ){//第一个不用复制，其他要
            fn( el, i ? cloneNode( item, true, true) : item );
        }
    }
    var insertAdjacentHTML = function( elems, slowInsert, fragment, fast, fastInsert, html ){
        for(var i = 0, el; el = elems[ i++ ];){
            if( fast ){
                fastInsert( el, html );
            }else{
                slowInsert( el, fragment.cloneNode(true) );
            }
        }
    }
    var insertAdjacentFragment = function( elems, fn, item, doc ){
        var fragment = doc.createDocumentFragment();
        for( var i = 0, el; el = elems[ i++ ]; ){
            fn( el, makeFragment( item, fragment, i > 1 ) );
        }
    }
    var makeFragment = function( nodes, fragment, bool ){
        //只有非NodeList的情况下我们才为i递增;
        var ret = fragment.cloneNode(false), go= !nodes.item;
        for( var i = 0, node; node = nodes[i]; go && i++ ){
            ret.appendChild( bool && cloneNode(node, true, true) || node );
        }
        return ret;
    }
    /**
     * 实现insertAdjacentHTML的增强版
     * @param {mass}  nodes mass实例
     * @param {String} type 方法名
     * @param {Any}  item 插入内容或替换内容,可以为HTML字符串片断，元素节点，文本节点，文档碎片或mass对象
     * @param {Document}  doc 执行环境所在的文档
     * @return {mass} 还是刚才的mass实例
     */
    function manipulate( nodes, type, item, doc ){
        var elems = $.slice( nodes ).filter(function( el ){
            return el.nodeType === 1;//转换为纯净的元素节点数组
        });
        if( item.nodeType ){
            //如果是传入元素节点或文本节点或文档碎片
            insertAdjacentNode( elems, insertApapter[type], item );
        }else if( typeof item === "string" ){
            //如果传入的是字符串片断
            var fragment = $.parseHTML( item, doc ),
            //如果方法名不是replace并且完美支持insertAdjacentHTML并且不存在套嵌关系的标签
            fast = (type !== "replace") && support[ adjacent ] && !rnest.test(item);
            insertAdjacentHTML( elems, insertApapter[ type ], fragment, fast, insertApapter[ type+"2" ], item ) ;
        }else if( item.length ) {
            //如果传入的是HTMLCollection nodeList mass实例，将转换为文档碎片
            insertAdjacentFragment( elems, insertApapter[ type ], item, doc ) ;
        }
        return nodes;
    }
    $.implement({
        data: function( key, item, pv ){
            return $.access( this, key, item, function(el){
                return  $.data( el, key, item,  pv === true  );
            })
        },
        removeData: function( key, pv ) {
            return this.each(function() {
                $.removeData( this, key, pv );
            });
        }
    });
    //======================================================================
    //复制与移除节点时的一些辅助函数
    //======================================================================
    function cleanNode( node ){
        node.uniqueNumber && $.removeData(node);
        node.clearAttributes && node.clearAttributes();
    }
    var div = document.createElement( "div" );//缓存parser，防止反复创建
    function shimCloneNode( outerHTML, tree ) {
        tree.appendChild(div);
        div.innerHTML = outerHTML;
        tree.removeChild(div);
        return div.firstChild;
    }
    var unknownTag = "<?XML:NAMESPACE"
    function cloneNode( node, dataAndEvents, deepDataAndEvents ) {
        //   处理IE6-8下复制事件时一系列错误
        if( node.nodeType === 1 ){
            var bool //!undefined === true;
            //这个判定必须这么长：判定是否能克隆新标签，判定是否为元素节点, 判定是否为新标签
            if(!support.cloneHTML5 && node.outerHTML){//延迟创建检测元素
                var outerHTML = document.createElement(node.nodeName).outerHTML;
                bool = outerHTML.indexOf( unknownTag ) // !0 === true;
            }
            //各浏览器cloneNode方法的部分实现差异 http://www.cnblogs.com/snandy/archive/2012/05/06/2473936.html
            var neo = !bool? shimCloneNode( node.outerHTML, document.documentElement ): node.cloneNode(true), src, neos, i;
            if(!support.cloneNode ){
                fixNode( neo, node );
                src = node[ TAGS ]( "*" );
                neos = neo[ TAGS ]( "*" );
                for ( i = 0; src[i]; i++ ) {
                    fixNode( neos[i] ,src[i] );
                }
            }
            // 复制自定义属性，事件也被当作一种特殊的能活动的数据
            if ( dataAndEvents ) {
                $.mergeData( neo, node );
                if ( deepDataAndEvents ) {
                    src =  node[ TAGS ]( "*" );
                    neos = neo[ TAGS ]( "*" );
                    for ( i = 0; src[i]; i++ ) {
                        $.mergeData( neos[i] ,src[i] );
                    }
                }
            }
            src = neos = null;
            return neo;
        }else{
            return node.cloneNode(true)
        }
    }
    //修正IE下对数据克隆时出现的一系列问题
    function fixNode( clone, src ) {
        if( src.nodeType == 1 ){
            //只处理元素节点
            var nodeName = clone.nodeName.toLowerCase();
            //clearAttributes方法可以清除元素的所有属性值，如style样式，或者class属性，与attachEvent绑定上去的事件
            clone.clearAttributes();
            //复制原对象的属性到克隆体中,但不包含原来的事件, ID,  NAME, uniqueNumber
            clone.mergeAttributes( src,false );
            //IE6-8无法复制其内部的元素
            if ( nodeName === "object" ) {
                clone.outerHTML = src.outerHTML;
                if ( support.cloneHTML5 && (src.innerHTML && !clone.innerHTML.trim() ) ) {
                    clone.innerHTML = src.innerHTML;
                }
            } else if ( nodeName === "input" && (src.type === "checkbox" || src.type == "radio") ) {
                //IE6-8无法复制chechbox的值，在IE6-7中也defaultChecked属性也遗漏了
                if ( src.checked ) {
                    clone.defaultChecked = clone.checked = src.checked;
                }
                // 除Chrome外，所有浏览器都会给没有value的checkbox一个默认的value值”on”。
                if ( clone.value !== src.value ) {
                    clone.value = src.value;
                }
            } else if ( nodeName === "option" ) {
                clone.selected = src.defaultSelected; // IE6-8 无法保持选中状态
            } else if ( nodeName === "input" || nodeName === "textarea" ) {
                clone.defaultValue = src.defaultValue;            // IE6-8 无法保持默认值
            } else if ( nodeName === "script" && clone.text !== src.text ) {
                clone.text = src.text;//IE6-8不能复制script的text属性
            }

        }
    }
    function outerHTML( el ){
        switch( el.nodeType+"" ){
            case "1":
            case "9":
                return "xml" in el ?  el.xml: new XMLSerializer().serializeToString( el );
            case "3":
            case "4":
                return el.nodeValue;
            case "8":
                return "<!--"+el.nodeValue+"-->";
        }
    }
    function innerHTML( el ){
        for( var i = 0, c, ret = []; c = el.childNodes[ i++ ]; ){
            ret.push( outerHTML(c) );
        }
        return ret.join( "" );
    }

    $.implement({
        //取得当前匹配节点的所有匹配expr的后代，组成新mass实例返回。
        find: function( expr ){
            return this.labor( $.query( expr, this ) );
        },
        //取得当前匹配节点的所有匹配expr的节点，组成新mass实例返回。
        filter: function( expr ){
            return this.labor( filterhElement(this.valueOf(), expr, this.ownerDocument, false) );
        },
        //取得当前匹配节点的所有不匹配expr的节点，组成新mass实例返回。
        not: function( expr ){
            return this.labor( filterhElement(this.valueOf(), expr, this.ownerDocument, true) );
        },

        //在当前的节点中，往下遍历他们的后代，收集匹配给定的CSS表达式的节点，封装成新mass实例返回
        has: function( expr ) {
            var nodes = $( expr, this.ownerDocument );
            return this.filter(function() {
                for ( var i = 0, node; node = nodes[ i++ ]; ) {
                    if ( $.contains( this, node ) ) {//a包含b
                        return true;
                    }
                }
            });
        },
        // 在当前的节点中，往上遍历他们的祖先，收集最先匹配给定的CSS表达式的节点，封装成新mass实例返回
        closest: function( expr, context ) {
            var nodes = $( expr, context || this.ownerDocument ).valueOf();
            //遍历原mass对象的节点
            for ( var i = 0, ret = [], cur; cur = this[i++]; ) {
                while ( cur ) {
                    if ( ~nodes.indexOf(cur)  ) {
                        ret.push( cur );
                        break;
                    } else { // 否则把当前节点变为其父节点
                        cur = cur.parentNode;
                        if ( !cur || !cur.ownerDocument || cur === context || cur.nodeType === 11 ) {
                            break;
                        }
                    }
                }
            }
            //如果大于1,进行唯一化操作
            ret = ret.length > 1 ? $.unique( ret ) : ret;
            //将节点集合重新包装成一个新jQuery对象返回
            return this.labor( ret );
        },
        //判定当前匹配节点是否匹配给定选择器，DOM元素，或者mass对象
        is: function( expr ){
            var nodes = $.query( expr, this.ownerDocument ), obj = {}, uid;
            for( var i = 0 , node; node = nodes[ i++ ];){
                uid = $.getUid(node);
                obj[uid] = 1;
            }
            return $.slice(this).some(function( el ){
                return  obj[ $.getUid(el) ];
            });
        },
        //返回指定节点在其所有兄弟中的位置
        index: function( expr ){
            var first = this[0]
            if ( !expr ) {//如果没有参数，返回第一元素位于其兄弟的位置
                return ( first && first.parentNode ) ? this.first().prevAll().length : -1;
            }
            // 返回第一个元素在新实例中的位置
            if ( typeof expr === "string" ) {
                return $( expr ).index( first );
            }
            // 返回传入元素（如果是mass实例则取其第一个元素）位于原实例的位置
            return this.valueOf().indexOf( expr.mass? expr[0]: expr );
        }
    });

    function filterhElement( nodes, expr, doc, not ) {
        var ret = [];
        not = !!not;
        if( typeof expr === "string" ){
            var fit = $.query( expr, doc );
            nodes.forEach(function( node ) {
                if( node.nodeType === 1 ){
                    if( ( fit.indexOf( node ) !== -1 ) ^ not ){
                        ret.push( node );
                    }
                }
            });
        }else if( $.type(expr, "Function") ){
            return nodes.filter(function( node, i ){
                return !!expr.call( node, node, i ) ^ not;
            });
        }else if( expr.nodeType ){
            return nodes.filter(function( node ){
                return (node === expr) ^ not;
            });
        }
        return ret;
    }
    var uniqOne = $.oneObject("children", "contents" ,"next", "prev");
    function travel( el, prop, expr ) {
        var result = [], ri = 0;
        while(( el = el[ prop ] )){
            if( el && el.nodeType === 1){
                result[ ri++ ] = el;
                if(expr === true){
                    break;
                }else if( typeof expr === "string" && $.match( el, expr ) ){
                    result.pop();
                    break;
                }
            }
        }
        return result;
    };

    lang({
        parent: function( el ){
            var parent = el.parentNode;
            return parent && parent.nodeType !== 11 ? parent: [];
        },
        parents: function( el ){
            return travel( el, "parentNode" ).reverse();
        },
        parentsUntil: function( el ,expr){
            return travel( el, "parentNode",expr ).reverse();
        },
        next: function( el ){//nextSiblingElement支持情况 chrome4+ FF3.5+ IE9+ opera9.8+ safari4+
            return travel( el, "nextSibling", true );
        },
        nextAll: function( el ){
            return travel( el, "nextSibling" );
        },
        nextUntil: function( el, expr){
            return travel( el, "nextSibling",expr );
        },
        prev: function( el ){
            return travel( el, "previousSibling", true );
        },
        prevAll : function( el ){
            return travel( el, "previousSibling" ).reverse();
        },
        prevUntil: function( el, expr ){
            return travel( el, "previousSibling",expr ).reverse();
        },
        children: function( el ){//支持情况chrome1+ FF3.5+,IE5+,opera10+,safari4+
            return  el.children ? $.slice( el.children ) :
            $.slice( el.childNodes ).filter(function( node ){
                return node.nodeType === 1;
            });
        },
        siblings: function( el ){
            return travel( el, "previousSibling" ).reverse().concat(travel(el,"nextSibling"));
        },
        contents: function( el ){
            return el.tagName === "IFRAME" ?
            el.contentDocument || el.contentWindow.document :
            $.slice( el.childNodes );
        }
    }).each(function( method, name ){
        $.fn[ name ] = function( expr ){
            var nodes = [];
            for(var i = 0, el ; el = this[i++];){//expr只用于Until
                nodes = nodes.concat( method( el, expr ) );
            }
            if( /Until/.test( name ) ){
                expr = null
            }
            nodes = this.length > 1 && !uniqOne[ name ] ? $.unique( nodes ) : nodes;
            var neo = this.labor(nodes);
            return expr ? neo.filter( expr ) : neo;
        };
    });
});

/**
2011.7.11 dom["class"]改为dom["@class"]
2011.7.26 对init与parseHTML进行重构
2011.9.22 去掉isInDomTree 重构cloneNode,manipulate,parseHTML
2011.10.7 移除isFormElement
2011.10.9 将遍历模块合并到节点模块
2011.10.12 重构index closest
2011.10.20 修复rid的BUG
2011.10.21 添加even odd这两个切片方法 重构html方法
2011.10.23 增加rcheckEls成员,它是一个成员
2011.10.27 修正init方法中doc的指向错误
由 doc = this.ownerDocument = expr.ownerDocument || expr.nodeType == 9 && expr || document 改为
doc = this.ownerDocument =  scope.ownerDocument || scope ;
2011.10.29 优化$.parseHTML 在IE6789下去掉所有为修正createAll特性而添加的补丁元素
（原来是添加一个文本节点\u200b，而现在是<br class="fix_create_all"/>）
/http://d.hatena.ne.jp/edvakf/20100205/1265338487
2011.11.5 添加get方法 init的context参数可以是类数组对象
2011.11.6 outerHTML支持对文档对象的处理，html可以取得XML数据岛的innerHTML,修正init中scope与ownerDocument的取得
2011.11.7 重构find， 支持不插入文档的节点集合查找
2012.3.1 增强对HTML5新标签的支持 fix index方法的BUG
2012.3.9 添加一些数组方法
2012.4.5 使用isArrayLike精简init方法
2012.4.29 重构$.access与$.fn.data
2012.5.4 $.access添加第六个可选参数，用于绑定作用域，因此顺带重构了html, text, outerHTML,data原型方法
2012.5.21 Remove $("body") case; $(document.body) is 2x faster.
2012.5.28 cssName支持检测mozMatchesSelector, Fix $.match BUG
2012.7.31 使用$.Array.merge代替不可靠的[].push,对cloneNode进行重构,只对元素节点进行修复
 */