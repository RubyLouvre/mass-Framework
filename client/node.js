//=========================================
// 节点操作模块 by 司徒正美
//=========================================
//https://plus.google.com/photos/111819995660768943393/albums/5632848757471385857
  
$.define("node", "lang,support,class,query,data,ready",function(lang,support){
    $.log("已加载node模块");
    var global = this, DOC = global.document, rtag = /^[a-zA-Z]+$/, TAGS = "getElementsByTagName";
    var html5 ="abbr,article,aside,audio,bdi,canvas,data,datalist,details,figcaption,figure,footer," +
    "header,hgroup,mark,meter,nav,output,progress,section,summary,time,video";
    html5.replace($.rword,function(tag){//让IE678支持HTML5的新标签
        DOC.createElement(tag);
    })
    function getDoc(){
        for(var i  = 0 , el; i < arguments.length; i++){
            if(el = arguments[i]){
                if(el.nodeType){
                    return el.nodeType === 9 ? el : el.ownerDocument;
                }else if(el.setTimeout){
                    return el.document;
                }
            }
        }
        return DOC;
    }
    $.mix($,$["@class"]).implement({
        init:function(expr,context){
            // 处理空白字符串,null,undefined参数
            if ( !expr ) {
                return this;
            }
            //让$实例与元素节点一样拥有ownerDocument属性
            var doc, nodes;//用作节点搜索的起点
            if(/Array|NodeList|String/.test($.type(context))|| context && context.version){//typeof context === "string"

                return $(context).find(expr);
            }
            // 处理节点参数
            if ( expr.nodeType ) {
                this.ownerDocument  = expr.nodeType === 9 ? expr : expr.ownerDocument;
                return this.merge([expr]);
            }
            this.selector = expr + "";
            if ( expr === "body" && !context && DOC.body ) {//分支3 body
                this.ownerDocument = DOC;
                this.merge([DOC.body]);
                return this.selector = "body";
            }
            if ( typeof expr === "string" ) {
                doc = this.ownerDocument = !context ? DOC : getDoc(context, context[0]);
                var scope = context || doc;
                if ( expr.charAt(0) === "<" && expr.charAt( expr.length - 1 ) === ">" && expr.length >= 3 ) {
                    nodes = $.parseHTML(expr,doc);//先转化为文档碎片
                    nodes = nodes.childNodes;//再转化为节点数组
                } else if(rtag.test(expr) ){
                    nodes  = scope[TAGS](expr) ;
                } else{//分支7：选择器群组
                    nodes  = $.query(expr, scope);
                }
                return this.merge(nodes)
            }else {//分支7：如果是数组，节点集合或者mass对象或window对象
                this.ownerDocument = getDoc(expr[0]);
                this.merge( $.isArrayLike(expr) ? expr : [expr]);
                delete this.selector;
            }
        },
        version:'1.0',
        length:0,
        valueOf:function(){
            return Array.prototype.slice.call(this);
        },
        toString : function(){
            var i = this.length, ret = [], getType = $.type;
            while(i--){
                ret[i] = getType(this[i]);
            }
            return ret.join(", ");
        },
        labor:function(nodes){
            var neo = new $;
            neo.context = this.context;
            neo.selector = this.selector;
            neo.ownerDocument = this.ownerDocument;
            return neo.merge(nodes||[]);
        },
        slice:function(a,b){
            return this.labor($.slice(this,a,b));
        },
        get: function( num ) {
            return num == null ?
            // Return a 'clean' array
            this.valueOf() :
            // Return just the object
            ( num < 0 ? this[ this.length + num ] : this[ num ] );
        },
        eq: function( i ) {
            return i === -1 ? this.slice( i ) :this.slice( i, +i + 1 );
        },

        gt:function(i){
            return this.slice(i+1,this.length);
        },
        lt:function(i){
            return this.slice(0,i);
        },
        first: function() {
            return this.slice( 0,1 );
        },
        even: function(  ) {
            return this.labor(this.valueOf().filter(function(el,i){
                return i % 2 === 0;
            }));
        },
        odd: function(  ) {
            return this.labor(this.valueOf().filter(function(el,i){
                return i % 2 === 1;
            }));
        },
        last: function() {
            return this.slice( -1 );
        },
        each : function(callback){
            for(var i = 0, n = this.length; i < n; i++){
                callback.call(this[i], this[i], i);
            }
            return this;
        },

        map : function( callback ) {
            return this.labor(this.collect(callback));
        },
            
        collect:function(callback){
            var ret = []
            for(var i = 0, ri = 0, n = this.length; i < n; i++){
                ret[ri++] = callback.call(this[i], this[i], i);
            }
            return ret
        },

        //移除匹配元素
        remove :function(){
            return this.each(function(el){
                lang(el[TAGS]("*")).concatX(el).forEach(cleanNode);
                if ( el.parentNode ) {
                    el.parentNode.removeChild( el );
                }
            });
        },
        //清空匹配元素的内容
        empty:function(){
            return this.each(function(el){
                lang(el[TAGS]("*")).forEach(cleanNode);
                while ( el.firstChild ) {
                    el.removeChild( el.firstChild );
                }
            });
        },

        clone : function( dataAndEvents, deepDataAndEvents ) {
            dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
            deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
            return this.map( function () {
                return cloneNode( this,  dataAndEvents, deepDataAndEvents );
            });
        },

        merge: function (arr){ //把普通对象变成类数组对象，
            var ri = this.length,node;
            for(var i = 0,n = arr.length;node = arr[i],i < n ;i ++){
                if(node && (node.nodeType || node.document)){
                    this[ri++] = node;
                }
            }
            this.length = ri;
            return this;
        },
        //取得或设置节点的innerHTML属性
        html: function(value){
            if(value === void 0){
                var el = this[0]
                if(el && (el.nodeType ===1 || /xml/i.test(el.nodeName))){//处理IE的XML数据岛
                    return "innerHTML" in el ? el.innerHTML : innerHTML(el)
                }
                return null;
            }else {
                value = (value || "")+""
                if(support.innerHTML && (!rcreate.test(value) && !rnest.test(value))){
                    try {
                        for ( var i = 0, node; node = this[i++]; ) {
                            if ( node.nodeType === 1 ) {
                                lang(node[TAGS]("*")).forEach(cleanNode);
                                node.innerHTML = value;
                            }
                        }
                        return this;
                    } catch(e) {}
                }
                return this.empty().append( value );
            }
        },
        // 取得或设置节点的text或innerText或textContent属性
        text:function(value){
            var node = this[0];
            if(value === void 0){
                if(!node){
                    return "";
                }else if(node.tagName == "OPTION" || node.tagName === "SCRIPT"){
                    return node.text;
                }else{
                    return node.textContent || node.innerText ||  $.getText([ node ]);
                }
            }else{
                return this.empty().append( this.ownerDocument.createTextNode( value ));
            }
        },
        // 取得或设置节点的outerHTML
        outerHTML:function(value){
            if(typeof value === "string"){
                return this.empty().replace( value );
            }
            var el = this[0]
            if(el && el.nodeType === 1 ){
                return "outerHTML" in el? el.outerHTML :outerHTML(el)
            }
            return null;
        }
    });
    $.fn = $.prototype;
    $.fn.init.prototype = $.fn;

    //前导 前置 追加 后放 替换
    "append,prepend,before,after,replace".replace($.rword,function(method){
        $.fn[method] = function(insertion){
            return manipulate(this, method, insertion);
        }
        $.fn[method+"To"] = function(insertion){
            $(insertion,this.ownerDocument)[method](this);
            return this;
        }
    });
    var HTML = $.html;
    var matchesAPI = HTML.matchesSelector || HTML.mozMatchesSelector || HTML.webkitMatchesSelector || HTML.msMatchesSelector;
    $.extend({
        match : function(node, expr, i){
            if($.type(expr, "Function")){
                return expr.call(node,node,i);
            }
            try{
                return matchesAPI.call( node, expr );
            } catch(e) {
                var parent = node.parentNode;
                if(parent){
                    var array = $.query(expr,parent);
                    return !!(array.length && array.indexOf(node))
                }
                return false;
            }
        },
        access: function( elems,  key, value, set, get ) {
            var length = elems.length;
            //使用一个纯净的对象一下子设置多个属性
            if ( typeof key === "object" ) {
                for ( var k in key ) {
                    $.access( elems, k, key[k], set, get );
                }
                return elems;
            }
            // 设置一个属性
            if ( value !== void 0 ) {
                for ( var i = 0; i < length; i++ ) {
                    set( elems[i], key, value);
                }
                return elems;
            }
            //获取一个属性
            return length ? get( elems[0], key ) : void 0;
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
        parseHTML:function( html, doc){
            doc = doc || this.nodeType === 9  && this || DOC;
            html = html.replace(rxhtml, "<$1></$2>").trim();
            //尝试使用createContextualFragment获取更高的效率
            //http://www.cnblogs.com/rubylouvre/archive/2011/04/15/2016800.html
            var range = support.fastFragment
            if(range && doc === DOC && DOC.body && !rcreate.test(html) && !rnest.test(html)){
                range.selectNodeContents(DOC.body);//fix opera(9.2~11.51) bug,必须对文档进行选取
                return range.createContextualFragment(html);
            }
            if(!support.createAll){//fix IE
                html = html.replace(rcreate,"<br class='fix_create_all'/>$1");//在link style script等标签之前添加一个补丁
            }
            var tag = (rtagName.exec( html ) || ["", ""])[1].toLowerCase(),//取得其标签名
            wrap = translations[ tag ] || translations._default,
            fragment = doc.createDocumentFragment(),
            wrapper = doc.createElement("div"), firstChild;
            wrapper.innerHTML = wrap[1] + html + wrap[2];
            var scripts = wrapper[TAGS]("script");
            if(scripts.length){//使用innerHTML生成的script节点不会发出请求与执行text属性
                var script2 = doc.createElement("script"), script3;
                for(var i = 0, script; script = scripts[i++];){
                    if(!script.type || types[script.type]){//如果script节点的MIME能让其执行脚本
                        script3 = script2.cloneNode(false);//FF不能省略参数
                        for(var j = 0, attr;attr = script.attributes[j++];){
                            if(attr.specified){//复制其属性
                                script3[attr.name] = [attr.value];
                            }
                        }
                        script3.text = script.text;//必须指定,因为无法在attributes中遍历出来
                        script.parentNode.replaceChild(script3,script);//替换节点
                    }
                }
            }
            //移除我们为了符合套嵌关系而添加的标签
            for (i = wrap[0]; i--;wrapper = wrapper.lastChild){};
            //在IE6中,当我们在处理colgroup, thead, tfoot, table时会发生成一个tbody标签
            if( support.insertTbody ){
                var spear = !rtbody.test(html),//矛:html本身就不存在<tbody字样
                tbodys = wrapper[TAGS]("tbody"),
                shield = tbodys.length > 0;//盾：实际上生成的NodeList中存在tbody节点
                if(spear && shield){
                    for(var t=0, tbody; tbody = tbodys[t++];){
                        if(!tbody.childNodes.length )//如果是自动插入的里面肯定没有内容
                            tbody.parentNode.removeChild(tbody );
                    }
                }
            }
            if(!support.createAll){//移除所有补丁
                var brs =  wrapper[TAGS]("br");
                for(var b=0,br;br = brs[b++];){
                    if(br.className && br.className === "fix_create_all"){
                        br.parentNode.removeChild(br);
                    }
                }
            }
            while((firstChild = wrapper.firstChild)){ // 将wrapper上的节点转移到文档碎片上！
                fragment.appendChild(firstChild);
            }
            return  fragment
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
        prepend : function(el, node){
            el.insertBefore(node,el.firstChild);
        },
        append  : function(el, node){
            el.appendChild(node);
        },
        before  : function(el, node){
            el.parentNode.insertBefore(node,el);
        },
        after   : function(el, node){
            el.parentNode.insertBefore(node,el.nextSibling);
        },
        replace : function(el, node){
            el.parentNode.replaceChild(node,el);
        },
        prepend2: function(el, html){
            el[adjacent]( "afterBegin", html);
        },
        append2 : function(el, html){
            el[adjacent]( "beforeEnd", html);
        },
        before2 : function(el,html){
            el[adjacent]( "beforeBegin",html);
        },
        after2  : function(el, html){
            el[adjacent]( "afterEnd", html);
        }
    };

    var insertAdjacentNode = function(nodes,callback,stuff){
        for(var i = 0, node; node = nodes[i];i++){
            callback(node, !!i ? stuff : cloneNode(stuff,true,true) );
        }
    }
    var insertAdjacentHTML = function(nodes,slowInsert,fragment,fast,fastInsert,html){
        for(var i = 0, node; node = nodes[i++];){
            if(fast && node[adjacent]){//确保是支持insertAdjacentHTML的HTML元素节点
                fastInsert(node,html);
            }else{
                slowInsert(node,fragment.cloneNode(true));
            }
        }
    }
    var insertAdjacentFragment = function(nodes,callback,fakearray){
        var fragment = nodes.ownerDocument.createDocumentFragment();
        for(var i = 0, node; node = nodes[i++];){
            callback(node, makeFragment(fakearray,fragment,i > 1));
        }
    }
    var makeFragment = function(nodes,fragment,bool){
        //只有非NodeList的情况下我们才为i递增;
        var ret = fragment.cloneNode(false), go= !nodes.item
        for(var i = 0,node;node = nodes[i]; go && i++){
            ret.appendChild(bool && cloneNode(node,true,true) || node);
        }
        return ret;
    }
    /**
             * 实现insertAdjacentHTML的增强版
             * @param {mass}  nodes mass实例
             * @param {String} type 方法名
             * @param {Any}  stuff 插入内容或替换内容,可以为HTML字符串片断，元素节点，文本节点，文档碎片或mass对象
             * @return {mass} 还是刚才的mass实例
             */
    function manipulate(nodes, type, stuff){
        if(stuff.nodeType ){
            //如果是传入元素节点或文本节点或文档碎片
            insertAdjacentNode(nodes,insertApapter[type],stuff) ;
        }else if(typeof stuff === "string"){
            //如果传入的是字符串片断
            var fragment = $.parseHTML(stuff, nodes.ownerDocument),
            //如果方法名不是replace并且完美支持insertAdjacentHTML并且不存在套嵌关系的标签
            fast = (type !== "replace") && support[adjacent] &&  !rnest.test(stuff);
            insertAdjacentHTML(nodes,insertApapter[type],fragment, fast, insertApapter[type+"2"],stuff ) ;
        }else if( stuff.length) {
            //如果传入的是HTMLCollection nodeList mass实例，将转换为文档碎片
            insertAdjacentFragment(nodes,insertApapter[type],stuff) ;
        }
        return nodes;
    }
    $.implement({
        data:function(key,value){
            if ( typeof key === "string" ) {
                if(value === void 0){
                    return $.data(this[0], key);
                }else{//读方法，取第一个匹配元素的相关属性
                    return this.each(function(el){
                        $.data(el, key, value);//写方法，为所有匹配元素缓存相关属性
                    });
                }
            } else if ( $.isPlainObject(key) ) {
                return  this.each(function(el){
                    var d = $.data(el);
                    d && $.mix(d, key);//写方法，为所有匹配元素缓存相关属性
                });
            }
            return this;
        },
        removeData: function( key ) {
            return this.each(function() {
                $.removeData( this, key );
            });
        }
    });
    //======================================================================
    //复制与移除节点时的一些辅助函数
    //======================================================================
    function cleanNode(target){
        target.uniqueNumber && $.removeData(target);
        target.clearAttributes && target.clearAttributes();
    }
    function shimCloneNode( elem ) {
	var div = document.createElement( "div" );
	div.innerHTML = elem.outerHTML;
	return div.firstChild;
}
    function cloneNode( node, dataAndEvents, deepDataAndEvents ) {
        var neo = $.support.cloneAll ? shimCloneNode( node ): node.cloneNode(true), src, neos, i;
        //   处理IE6-8下复制事件时一系列错误
        if(node.nodeType === 1){
            if($.support.cloneAll ){
                fixNode( neo, node );
                src = node[TAGS]("*");
                neos = neo[TAGS]("*");
                for ( i = 0; src[i]; i++ ) {
                    fixNode( neos[i] ,src[i] );
                }
            }
            // 复制自定义属性，事件也被当作一种特殊的能活动的数据
            if ( dataAndEvents ) {
                $.mergeData( neo, node );
                if ( deepDataAndEvents ) {
                    src =  node[TAGS]("*");
                    neos = neo[TAGS]("*");
                    for ( i = 0; src[i]; i++ ) {
                        $.mergeData( neos[i] ,src[i] );
                    }
                }
            }
            src = neos = null;
        }
        return neo;
    }
    //修正IE下对数据克隆时出现的一系列问题
    function fixNode(clone, src) {
        if(src.nodeType == 1){
            // 只处理元素节点
            var nodeName = clone.nodeName.toLowerCase();
            //clearAttributes方法可以清除元素的所有属性值，如style样式，或者class属性，与attachEvent绑定上去的事件
            clone.clearAttributes();
            //复制原对象的属性到克隆体中,但不包含原来的事件
            clone.mergeAttributes(src);
            //IE6-8无法复制其内部的元素
            if ( nodeName === "object" ) {
                clone.outerHTML = src.outerHTML;
            } else if ( nodeName === "input" && (src.type === "checkbox" || src.type == "radio") ) {
                //IE6-8无法复制chechbox的值，在IE6-7中也defaultChecked属性也遗漏了
                if ( src.checked ) {
                    clone.defaultChecked = clone.checked = src.checked;
                }
                // 除Chrome外，所有浏览器都会给没有value的checkbox一个默认的value值”on”。
                if ( clone.value !== src.value ) {
                    clone.value = src.value;
                }
            // IE6-8 无法保持选中状态
            } else if ( nodeName === "option" ) {
                clone.selected = src.defaultSelected;
            // IE6-8 无法保持默认值
            } else if ( nodeName === "input" || nodeName === "textarea" ) {
                clone.defaultValue = src.defaultValue;
            }
        }
    }
    function outerHTML(el){
        switch(el.nodeType+""){
            case "1":
            case "9":
                return "xml" in el ?  el.xml: new XMLSerializer().serializeToString(el);
            case "3":
            case "4":
                return el.nodeValue;
            case "8":
                return "<!--"+el.nodeValue+"-->"
        }
    }
    function innerHTML(el){
        var array = [];
        for(var i=0,c;c=el.childNodes[i++];){
            array.push(outerHTML(c))
        }
        return array.join("");
    }
        
    $.implement({
        //取得当前匹配节点的所有匹配expr的后代，组成新mass实例返回。
        find: function(expr){
            return this.labor($.query(expr,this));
        },
        //取得当前匹配节点的所有匹配expr的节点，组成新mass实例返回。
        filter:function(expr){
            return this.labor(filterhElement(this.valueOf(), expr, this.ownerDocument, false));
        },
        //取得当前匹配节点的所有不匹配expr的节点，组成新mass实例返回。
        not: function(expr){
            return this.labor(filterhElement(this.valueOf(), expr,  this.ownerDocument,   true));
        },
        //判定当前匹配节点是否匹配给定选择器，DOM元素，或者mass对象
        is:function(expr){
            var nodes = $.query(expr,this.ownerDocument), obj = {}, uid
            for(var i =0 , node; node = nodes[i++];){
                uid = $.getUid(node);
                obj[uid] = 1;
            }
            return $.slice(this).some(function(el){
                return  obj[$.getUid(el)];
            });
        },
        //取得匹配节点中那些后代中能匹配给定CSS表达式的节点，组成新mass实例返回。
        has: function( target ) {
            var targets = $( target,this.ownerDocument );
            return this.filter(function() {
                for ( var i = 0, l = targets.length; i < l; i++ ) {
                    if ( $.contains( this, targets[i] ) ) {//a包含b
                        return true;
                    }
                }
            });
        },
        closest: function( expr, context ) {
            var  nodes = $( expr, context || this.ownerDocument ).valueOf();
            //遍历原mass对象的节点
            for (var i = 0, ret = [], cur; cur = this[i++];) {
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
            return this.labor(ret);
        },
        index:function(el){ 
            var first = this[0]
            if ( !el ) {//如果没有参数，返回第一元素位于其兄弟的位置
                return ( first && first.parentNode ) ? this.prevAll().length : -1;
            }
            // 返回第一个元素在新实例中的位置
            if ( typeof el === "string" ) {
                return $(el).index(first)
            }
            // 返回传入元素（如果是mass实例则取其第一个元素）位于原实例的位置
            return   this.valueOf().indexOf(el.version ? el[0] : el)
        }

    });

    function filterhElement( nodes, expr,doc, not ) {
        var ret = [];
        not = !!not;
        if(typeof expr === "string"){
            var fit = $.query(expr, doc);
            nodes.forEach(function( el ) {
                if(el.nodeType === 1){
                    if((fit.indexOf(el) !== -1) ^ not){
                        ret.push(el)
                    }
                }
            });
        }else if($.type(expr, "Function")){
            return nodes.filter(function(el, i ){
                return !!expr.call( el, el, i ) ^ not;
            });
        }else if(expr.nodeType){
            return nodes.filter(function( el, i ) {
                return (el === expr) ^ not;
            });
        }
        return ret;
    }

    var uniqOne = $.oneObject("children","contents","next","prev");

    function travel( el, prop, expr ) {
        var result = [],ri = 0;
        while((el = el[prop])){
            if( el && el.nodeType === 1){
                result[ri++] = el;
                if(expr === true){
                    break;
                }else if(typeof expr === "string" && $( el ).is( expr )){
                    result.pop();
                    break;
                }
            }
        }
        return result
    };

    lang({
        parent:function(el){
            var parent = el.parentNode;
            return parent && parent.nodeType !== 11 ? parent : [];
        },
        parents:function(el){
            return travel(el, "parentNode").reverse();
        },
        parentsUntil:function(el, expr){
            return travel(el, "parentNode", expr).reverse();
        },
        next :function(el){
            return travel(el, "nextSibling", true)
        },
        nextAll :function(el){
            return travel(el, "nextSibling");
        },
        nextUntil:function(el, expr){
            return travel(el, "nextSibling", expr);
        },
        prev :function(el){
            return travel(el, "previousSibling", true);
        },
        prevAll :function(el){
            return travel(el, "previousSibling" ).reverse();
        },
        prevUntil :function(el, expr){
            return travel(el, "previousSibling", expr).reverse();
        },
        children:function(el){
            return  el.children ? $.slice(el.children) :
            lang(el.childNodes).filter(function(ee){
                return ee.nodeType === 1
            });
        },
        siblings:function(el){
            return travel(el,"previousSibling").reverse().concat(travel(el,"nextSibling"));
        },
        contents:function(el){
            return el.tagName === "IFRAME" ?
            el.contentDocument || el.contentWindow.document :
            $.slice( el.childNodes );
        }
    }).forEach(function(method,name){
        $.fn[name] = function(selector){
            var nodes = [];
            $.slice(this).forEach(function(el){
                nodes = nodes.concat(method(el,selector));
            });
            if(/Until/.test(name)){
                selector = null
            }
            nodes = this.length > 1 && !uniqOne[ name ] ? $.unique( nodes ) : nodes;
            var neo = this.labor(nodes);
            return selector ? neo.filter(selector) :neo;
        };
    });
});

/*
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
由 doc = this.ownerDocument = expr.ownerDocument || expr.nodeType == 9 && expr || DOC 改为
doc = this.ownerDocument =  scope.ownerDocument || scope ;
2011.10.29 优化$.parseHTML 在IE6789下去掉所有为修正createAll特性而添加的补丁元素
（原来是添加一个文本节点\u200b，而现在是<br class="fix_create_all"/>）
/http://d.hatena.ne.jp/edvakf/20100205/1265338487
2011.11.5 添加get方法 init的context参数可以是类数组对象
2011.11.6 outerHTML支持对文档对象的处理，html可以取得XML数据岛的innerHTML,修正init中scope与ownerDocument的取得
2011.11.7 重构find， 支持不插入文档的节点集合查找
 *
 */