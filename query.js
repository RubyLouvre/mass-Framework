//=========================================
// 选择器模块 v5 开发代号Icarus
//==========================================
define("query", ["mass"], function($) {
    var global = this,
        DOC = global.document;
    $.mix({
        isXML: function(el) {
            //http://www.cnblogs.com/rubylouvre/archive/2010/03/14/1685360.
            var doc = el.ownerDocument || el
            return doc.createElement("p").nodeName !== doc.createElement("P").nodeName;
        },

        contains: function(a, b, itself) {
            // 第一个节点是否包含第二个节点
            //contains 方法支持情况：chrome+ firefox9+ ie5+, opera9.64+(估计从9.0+),safari5.1.7+
            if(a == b) {
                return !!itself;
            }
            if(a.nodeType === 9) return true;
            if(a.contains) {
                return a.contains(b);
            } else if(a.compareDocumentPosition) {
                return !!(a.compareDocumentPosition(b) & 16);
            }
            while((b = b.parentNode))
            if(a === b) return true;
            return false;
        },

        getText: function() {
            //获取某个节点的文本，如果此节点为元素节点，则取其childNodes的所有文本，
            //为了让结果在所有浏览器下一致，忽略所有空白节点，因此它非元素的innerText或textContent
            return function getText(nodes) {
                for(var i = 0, ret = "", node; node = nodes[i++];) {
                    // 对得文本节点与CDATA的内容
                    if(node.nodeType === 3 || node.nodeType === 4) {
                        ret += node.nodeValue;
                        //取得元素节点的内容
                    } else if(node.nodeType !== 8) {
                        ret += getText(node.childNodes);
                    }
                }
                return ret;
            }
        }(),
        unique: function(nodes) {
            if(nodes.length < 2) {
                return nodes;
            }
            var result = [],
                array = [],
                uniqResult = {},
                node = nodes[0],
                index, ri = 0
                //如果支持sourceIndex我们将使用更为高效的节点排序
                //http://www.cnblogs.com/jkisjk/archive/2011/01/28/array_quickly_sortby.html
            if(node.sourceIndex) { //IE opera
                for(var i = 0, n = nodes.length; i < n; i++) {
                    node = nodes[i];
                    index = node.sourceIndex + 1e8;
                    if(!uniqResult[index]) {
                        (array[ri++] = new String(index))._ = node;
                        uniqResult[index] = 1
                    }
                }
                array.sort();
                while(ri)
                result[--ri] = array[ri]._;
                return result;
            } else {
                var sortOrder = node.compareDocumentPosition ? sortOrder1 : sortOrder2;
                nodes.sort(sortOrder);
                if(sortOrder.hasDuplicate) {
                    for(i = 1; i < nodes.length; i++) {
                        if(nodes[i] === nodes[i - 1]) {
                            nodes.splice(i--, 1);
                        }
                    }
                }
                sortOrder.hasDuplicate = false;
                return nodes;
            }
        }
    });
    var reg_combinator = /^\s*([>+~,\s])\s*(\*|(?:[-\w*]|[^\x00-\xa0]|\\.)*)/
    var trimLeft = /^\s+/;
    var trimRight = /\s+$/;
    var reg_quick = /^(^|[#.])((?:[-\w]|[^\x00-\xa0]|\\.)+)$/;
    var reg_comma = /^\s*,\s*/;
    var reg_sequence = /^([#\.:]|\[\s*)((?:[-\w]|[^\x00-\xa0]|\\.)+)/;
    var reg_pseudo = /^\(\s*("([^"]*)"|'([^']*)'|[^\(\)]*(\([^\(\)]*\))?)\s*\)/;
    var reg_attrib = /^\s*(?:(\S?=)\s*(?:(['"])(.*?)\2|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/
    var reg_attrval = /\\([0-9a-fA-F]{2,2})/g;
    var reg_sensitive = /^(title|id|name|class|for|href|src)$/;
    var reg_backslash = /\\/g;
    var reg_tag = /^((?:[-\w\*]|[^\x00-\xa0]|\\.)+)/; //能使用getElementsByTagName处理的CSS表达式
    if(trimLeft.test("\xA0")) {
        trimLeft = /^[\s\xA0]+/;
        trimRight = /[\s\xA0]+$/;
    }

    var hash_operator = {
        "=": 1,
        "!=": 2,
        "|=": 3,
        "~=": 4,
        "^=": 5,
        "$=": 6,
        "*=": 7
    }

    function sortOrder1(a, b) {
        if(a === b) {
            sortOrder1.hasDuplicate = true;
            return 0;
        }
        if(!a.compareDocumentPosition || !b.compareDocumentPosition) {
            return a.compareDocumentPosition ? -1 : 1;
        }
        return a.compareDocumentPosition(b) & 4 ? -1 : 1;
    };

    function sortOrder2(a, b) { //处理旧式的标准浏览器与XML
        if(a === b) {
            sortOrder2.hasDuplicate = true;
            return 0;
        }
        var al, bl, ap = [],
            bp = [],
            aup = a.parentNode,
            bup = b.parentNode,
            cur = aup;
        //如果是属于同一个父节点，那么就比较它们在childNodes中的位置
        if(aup === bup) {
            return siblingCheck(a, b);
            // If no parents were found then the nodes are disconnected
        } else if(!aup) {
            return -1;

        } else if(!bup) {
            return 1;
        }
        // Otherwise they're somewhere else in the tree so we need
        // to build up a full list of the parentNodes for comparison
        while(cur) {
            ap.unshift(cur);
            cur = cur.parentNode;
        }

        cur = bup;

        while(cur) {
            bp.unshift(cur);
            cur = cur.parentNode;
        }

        al = ap.length;
        bl = bp.length;

        for(var i = 0; i < al && i < bl; i++) {
            if(ap[i] !== bp[i]) {
                return siblingCheck(ap[i], bp[i]);
            }
        }
        return i === al ? siblingCheck(a, bp[i], -1) : siblingCheck(ap[i], b, 1);
    };

    function siblingCheck(a, b, ret) {
        if(a === b) {
            return ret;
        }
        var cur = a.nextSibling;

        while(cur) {
            if(cur === b) {
                return -1;
            }
            cur = cur.nextSibling;
        }
        return 1;
    }
    var slice = Array.prototype.slice,
        makeArray = function(nodes, result, flag_multi) {
            nodes = slice.call(nodes, 0);
            if(result) {
                result.push.apply(result, nodes);
            } else {
                result = nodes;
            }
            return flag_multi ? $.unique(result) : result;
        };
    //IE56789无法使用数组方法转换节点集合
    try {
        slice.call($.html.childNodes, 0)[0].nodeType;
    } catch(e) {
        makeArray = function(nodes, result, flag_multi) {
            var ret = result || [],
                ri = ret.length;
            for(var i = 0, el; el = nodes[i++];) {
                ret[ri++] = el
            }
            return flag_multi ? $.unique(ret) : ret;
        }
    }

    function _toHex(x, y) {
        return String.fromCharCode(parseInt(y, 16));
    }

    function parse_nth(expr) {
        var orig = expr
        expr = expr.replace(/^\+|\s*/g, ''); //清除无用的空白
        var match = (expr === "even" && "2n" || expr === "odd" && "2n+1" || !/\D/.test(expr) && "0n+" + expr || expr).match(/(-?)(\d*)n([-+]?\d*)/);
        return parse_nth[orig] = {
            a: (match[1] + (match[2] || 1)) - 0,
            b: match[3] - 0
        };
    }

    function getElementsByTagName(tagName, els, flag_xml) {
        var method = "getElementsByTagName",
            elems = [],
            uniqResult = {},
            prefix
        if(flag_xml && tagName.indexOf(":") > 0 && els.length && els[0].lookupNamespaceURI) {
            var arr = tagName.split(":");
            prefix = arr[0];
            tagName = arr[1];
            method = "getElementsByTagNameNS";
            prefix = els[0].lookupNamespaceURI(prefix);
        }
        switch(els.length) {
        case 0:
            return elems;
        case 1:
            //在IE67下，如果存在一个name为length的input元素，下面的all.length返回此元素，而不是长度值
            var all = prefix ? els[0][method](prefix, tagName) : els[0][method](tagName);
            for(var i = 0, ri = 0, el; el = all[i++];) {
                if(el.nodeType === 1) { //防止混入注释节点
                    elems[ri++] = el
                }
            }
            return elems;
        default:
            for(i = 0, ri = 0; el = els[i++];) {
                var nodes = prefix ? el[method](prefix, tagName) : el[method](tagName)
                for(var j = 0, node; node = nodes[j++];) {
                    var uid = $.getUid(node);

                    if(!uniqResult[uid]) {
                        uniqResult[uid] = elems[ri++] = node;
                    }
                }
            }
            return elems;
        }
    }
    //IE9 以下的XML文档不能直接设置自定义属性
    var attrURL = $.oneObject('action,cite,codebase,data,href,longdesc,lowsrc,src,usemap', 2);
    var bools = $["@bools"] = "autofocus,autoplay,async,checked,controls,declare,disabled,defer,defaultChecked," + "contentEditable,ismap,loop,multiple,noshade,open,noresize,readOnly,selected"
    var boolOne = $.oneObject(bools.toLowerCase());

    //检测各种BUG（fixGetAttribute，fixHasAttribute，fixById，fixByTag）
    var fixGetAttribute, fixHasAttribute, fixById, fixByTag;
    var getHTMLText = new Function("els", "return els[0]." + ($.html.textContent ? "textContent" : "innerText"));

    new function() {
        var select = DOC.createElement("select");
        var option = select.appendChild(DOC.createElement("option"));
        option.setAttribute("selected", "selected")
        option.className = "x"
        fixGetAttribute = option.getAttribute("class") != "x";
        select.appendChild(DOC.createComment(""));
        fixByTag = select.getElementsByTagName("*").length == 2
        var all = DOC.getElementsByTagName("*"),
            node, nodeType, comments = [],
            i = 0,
            j = 0;
        while((node = all[i++])) {
            nodeType = node.nodeType;
            nodeType === 1 ? $.getUid(node) : nodeType === 8 ? comments.push(node) : 0;
        }
        while((node = comments[j++])) {
            node.parentNode.removeChild(node);
        }
        fixHasAttribute = select.hasAttribute ? !option.hasAttribute('selected') : true;

        var form = DOC.createElement("div"),
            id = "fixId" + (new Date()).getTime(),
            root = $.html;
        form.innerHTML = "<a name='" + id + "'/>";
        root.insertBefore(form, root.firstChild);
        fixById = !! DOC.getElementById(id);
        root.removeChild(form)
    };

    //http://www.atmarkit.co.jp/fxml/tanpatsu/24bohem/01.html
    //http://msdn.microsoft.com/zh-CN/library/ms256086.aspx
    //https://developer.mozilla.org/cn/DOM/document.evaluate
    //http://d.hatena.ne.jp/javascripter/20080425/1209094795


    function getElementsByXPath(xpath, context, doc) {
        var result = [];
        try {
            if(global.DOMParser) { //IE9支持DOMParser，但我们不能使用doc.evaluate!global.DOMParser
                var nodes = doc.evaluate(xpath, context, null, 7, null);
                for(var i = 0, n = nodes.snapshotLength; i < n; i++) {
                    result[i] = nodes.snapshotItem(i)
                }
            } else {
                nodes = context.selectNodes(xpath);
                for(i = 0, n = nodes.length; i < n; i++) {
                    result[i] = nodes[i]
                }
            }
        } catch(e) {
            return false;
        }
        return result;
    };
    /**
     * 选择器
     * @param {String} expr CSS表达式
     * @param {Node}   context 上下文（可选）
     * @param {Array}  result  结果集(内部使用)
     * @param {Array}  lastResult  上次的结果集(内部使用)
     * @param {Boolean}flag_xml 是否为XML文档(内部使用)
     * @param {Boolean}flag_multi 是否出现并联选择器(内部使用)
     * @param {Boolean}flag_dirty 是否出现通配符选择器(内部使用)
     * @return {Array} result
     */
    //http://webbugtrack.blogspot.com/
    var Icarus = $.query = function(expr, contexts, result, lastResult, flag_xml, flag_multi, flag_dirty) {
            result = result || [];
            contexts = contexts || DOC;
            var pushResult = makeArray;
            if(!contexts.nodeType) { //实现对多上下文的支持
                contexts = pushResult(contexts);
                if(!contexts.length) return result
            } else {
                contexts = [contexts];
            }
            var rrelative = reg_combinator,
                //保存到本地作用域
                rquick = reg_quick,
                rBackslash = reg_backslash,
                rcomma = reg_comma,
                //用于切割并联选择器
                context = contexts[0],
                doc = context.ownerDocument || context,
                rtag = reg_tag,
                flag_all, uniqResult, elems, nodes, tagName, last, ri, uid;
            //将这次得到的结果集放到最终结果集中
            //如果要从多个上下文中过滤孩子
            expr = expr.replace(trimLeft, "").replace(trimRight, "");
            flag_xml = flag_xml !== void 0 ? flag_xml : $.isXML(doc);
            if(flag_xml && expr === "body" && context.body) return pushResult([context.body], result, flag_multi);
            if(!flag_xml && doc.querySelectorAll) {
                var query = expr;
                if(contexts.length > 2 || doc.documentMode == 8 && context.nodeType == 1) {
                    if(contexts.length > 2) context = doc;
                    query = ".fix_icarus_sqa " + query; //IE8也要使用类名确保查找范围
                    for(var i = 0, node; node = contexts[i++];) {
                        if(node.nodeType === 1) {
                            node.className = "fix_icarus_sqa " + node.className;
                        }
                    }
                }
                if(doc.documentMode !== 8 || context.nodeName.toLowerCase() !== "object") {
                    try {
                        return pushResult(context.querySelectorAll(query), result, flag_multi);
                    } catch(e) {} finally {
                        if(query.indexOf(".fix_icarus_sqa") === 0) { //如果为上下文添加了类名，就要去掉类名
                            for(i = 0; node = contexts[i++];) {
                                if(node.nodeType === 1) {
                                    node.className = node.className.replace("fix_icarus_sqa ", "");
                                }
                            }
                        }
                    }
                }
            }
            var match = expr.match(rquick);
            if(match) { //对只有单个标签，类名或ID的选择器进行提速
                var value = match[2].replace(rBackslash, ""),
                    key = match[1];
                if(key == "") { //tagName;
                    nodes = getElementsByTagName(value, contexts, flag_xml);
                } else if(key === "." && contexts.length === 1) { //className，并且上下文只有1个
                    if(flag_xml) { //如果XPATH查找失败，就会返回字符，那些我们就使用普通方式去查找
                        nodes = getElementsByXPath("//*[@class='" + value + "']", context, doc);
                    } else if(context.getElementsByClassName) {
                        nodes = context.getElementsByClassName(value);
                    }
                } else if(key === "#" && contexts.length === 1) { //ID，并且上下文只有1个
                    if(flag_xml) {
                        nodes = getElementsByXPath("//*[@id='" + value + "']", context, doc);
                        //基于document的查找是不安全的，因为生成的节点可能还没有加入DOM树，比如$("<div id=\"A'B~C.D[E]\"><p>foo</p></div>").find("p")
                    } else if(context.nodeType == 9) {
                        node = doc.getElementById(value);
                        //IE67 opera混淆表单元素，object以及链接的ID与NAME
                        //http://webbugtrack.blogspot.com/2007/08/bug-152-getelementbyid-returns.html
                        nodes = !node ? [] : !fixById ? [node] : node.getAttributeNode("id").nodeValue === value ? [node] : false;
                    }
                }
                if(nodes) {
                    return pushResult(nodes, result, flag_multi);
                }
            }
            //执行效率应该是内大外小更高一写
            lastResult = contexts;
            if(lastResult.length) {
                loop: while(expr && last !== expr) {
                    flag_dirty = false;
                    elems = null;
                    uniqResult = {};
                    //处理夹在中间的关系选择器（取得连接符及其后的标签选择器或通配符选择器）
                    if(match = expr.match(rrelative)) {
                        expr = RegExp.rightContext;
                        elems = [];
                        tagName = (flag_xml ? match[2] : match[2].toUpperCase()).replace(rBackslash, "") || "*";
                        i = 0;
                        ri = 0;
                        flag_all = tagName === "*"; // 表示无需判定tagName
                        switch(match[1]) { //根据连接符取得种子集的亲戚，组成新的种子集
                        case " ":
                            //后代选择器
                            if(expr.length || match[2]) { //如果后面还跟着东西或最后的字符是通配符
                                elems = getElementsByTagName(tagName, lastResult, flag_xml);
                            } else {
                                elems = lastResult;
                                break loop
                            }
                            break;
                        case ">":
                            //亲子选择器
                            while((node = lastResult[i++])) {
                                for(node = node.firstChild; node; node = node.nextSibling) {
                                    if(node.nodeType === 1 && (flag_all || tagName === node.nodeName)) {
                                        elems[ri++] = node;
                                    }
                                }
                            }
                            break;
                        case "+":
                            //相邻选择器
                            while((node = lastResult[i++])) {
                                while((node = node.nextSibling)) {
                                    if(node.nodeType === 1) {
                                        if(flag_all || tagName === node.nodeName) elems[ri++] = node;
                                        break;
                                    }
                                }
                            }
                            break;
                        case "~":
                            //兄长选择器
                            while((node = lastResult[i++])) {
                                while((node = node.nextSibling)) {
                                    if(node.nodeType === 1 && (flag_all || tagName === node.nodeName)) {
                                        uid = $.getUid(node);
                                        if(uniqResult[uid]) {
                                            break;
                                        } else {
                                            uniqResult[uid] = elems[ri++] = node;
                                        }
                                    }
                                }
                            }
                            elems = $.unique(elems);
                            break;
                        }
                    } else if(match = expr.match(rtag)) { //处理位于最开始的或并联选择器之后的标签选择器或通配符
                        expr = RegExp.rightContext;
                        elems = getElementsByTagName(match[1].replace(rBackslash, ""), lastResult, flag_xml);
                    }

                    if(expr) {
                        var arr = Icarus.filter(expr, elems, lastResult, doc, flag_xml);
                        expr = arr[0];
                        elems = arr[1];
                        if(!elems) {
                            flag_dirty = true;
                            elems = getElementsByTagName("*", lastResult, flag_xml);
                        }
                        if(match = expr.match(rcomma)) {
                            expr = RegExp.rightContext;
                            pushResult(elems, result);
                            return Icarus(expr, contexts, result, [], flag_xml, true, flag_dirty);
                        } else {
                            lastResult = elems;
                        }
                    }

                }
            }
            if(flag_multi) {
                if(elems.length) {
                    return pushResult(elems, result, flag_multi);
                }
            } else if(DOC !== doc || fixByTag && flag_dirty) {
                for(result = [], ri = 0, i = 0; node = elems[i++];)
                if(node.nodeType === 1) result[ri++] = node;
                return result
            }
            return elems;
        }
    var onePosition = $.oneObject("eq,gt,lt,first,last,even,odd");

    $.mix(Icarus, {
        //getAttribute总会返回字符串
        //http://reference.sitepoint.com/javascript/Element/getAttribute
        getAttribute: !fixGetAttribute ?
        function(elem, name) {
            return elem.getAttribute(name) || '';
        } : function(elem, name, flag_xml) {
            if(flag_xml) return elem.getAttribute(name) || '';
            name = name.toLowerCase();
            //http://jsfox.cn/blog/javascript/get-right-href-attribute.html
            if(attrURL[name]) { //得到href属性里原始链接，不自动转绝对地址、汉字和符号都不编码
                return elem.getAttribute(name, 2) || ''
            }
            if(name === "style") {
                return elem.style.cssText.toLowerCase();
            }
            if(elem.tagName === "INPUT" && name == "type") {
                return elem.getAttribute("type") || elem.type; //IE67无法辩识HTML5添加添加的input类型，如input[type=search]，不能使用el.type与el.getAttributeNode去取。
            }
            //布尔属性，如果为true时则返回其属性名，否则返回空字符串，其他一律使用getAttributeNode
            var attr = boolOne[name] ? (elem.getAttribute(name) ? name : '') : (elem = elem.getAttributeNode(name)) && elem.value || '';
            return reg_sensitive.test(name) ? attr : attr.toLowerCase();
        },
        hasAttribute: !fixHasAttribute ?
        function(elem, name, flag_xml) {
            return flag_xml ? !! elem.getAttribute(name) : elem.hasAttribute(name);
        } : function(elem, name) {
            //http://help.dottoro.com/ljnqsrfe.php
            name = name.toLowerCase();
            //如果这个显式设置的属性是""，即使是outerHTML也寻不见其踪影
            elem = elem.getAttributeNode(name);
            return !!(elem && (elem.specified || elem.nodeValue));
        },
        filter: function(expr, elems, lastResult, doc, flag_xml, flag_get) {
            var rsequence = reg_sequence,
                rattrib = reg_attrib,
                rpseudo = reg_pseudo,
                rBackslash = reg_backslash,
                rattrval = reg_attrval,
                pushResult = makeArray,
                toHex = _toHex,
                _hash_op = hash_operator,
                parseNth = parse_nth,
                match, key, tmp;
            while(match = expr.match(rsequence)) { //主循环
                expr = RegExp.rightContext;
                key = (match[2] || "").replace(rBackslash, "");
                if(!elems) { //取得用于过滤的元素
                    if(lastResult.length === 1 && lastResult[0] === doc) {
                        switch(match[1]) {
                        case "#":
                            if(!flag_xml) { //FF chrome opera等XML文档中也存在getElementById，但不能用
                                tmp = doc.getElementById(key);
                                if(!tmp) {
                                    elems = [];
                                    continue;
                                }
                                //处理拥有name值为"id"的控件的form元素
                                if(fixById ? tmp.id === key : tmp.getAttributeNode("id").nodeValue === key) {
                                    elems = [tmp];
                                    continue;
                                }
                            }
                            break;
                        case ":":
                            switch(key) {
                            case "root":
                                elems = [doc.documentElement];
                                continue;
                            case "link":
                                elems = pushResult(doc.links || []);
                                continue;
                            }
                            break;
                        }
                    }
                    elems = getElementsByTagName("*", lastResult, flag_xml); //取得过滤元
                }
                //取得用于过滤的函数，函数参数或数组
                var filter = 0,
                    flag_not = false,
                    args;
                switch(match[1]) {
                case "#":
                    //ID选择器
                    filter = ["id", "=", key];
                    break;
                case ".":
                    //类选择器
                    filter = ["class", "~=", key];
                    break;
                case ":":
                    //伪类选择器
                    tmp = Icarus.pseudoHooks[key];
                    if(match = expr.match(rpseudo)) {
                        expr = RegExp.rightContext;
                        if( !! ~key.indexOf("nth")) {
                            args = parseNth[match[1]] || parseNth(match[1]);
                        } else {
                            args = match[3] || match[2] || match[1]
                        }
                    }
                    if(tmp) {
                        filter = tmp;
                    } else if(key === "not") {
                        flag_not = true;
                        if(args === "*") { //处理反选伪类中的通配符选择器
                            elems = [];
                        } else if(reg_tag.test(args)) { //处理反选伪类中的标签选择器
                            tmp = [];
                            match = flag_xml ? args : args.toUpperCase();
                            for(var i = 0, ri = 0, elem; elem = elems[i++];)
                            if(match !== elem.nodeName) tmp[ri++] = elem;
                            elems = tmp;
                        } else {
                            var obj = Icarus.filter(args, elems, lastResult, doc, flag_xml, true);
                            filter = obj.filter;
                            args = obj.args;
                        }
                    } else {
                        $.error('An invalid or illegal string was specified : "' + key + '"!');
                    }
                    break
                default:
                    filter = [key.toLowerCase()];
                    if((match = expr.match(rattrib))) {
                        expr = RegExp.rightContext;
                        if(match[1]) {
                            filter[1] = match[1]; //op
                            filter[2] = match[3] || match[4]; //对值进行转义
                            filter[2] = filter[2] ? filter[2].replace(rattrval, toHex).replace(rBackslash, "") : "";
                        }
                    }
                    break;
                }
                if(flag_get) {
                    return {
                        filter: filter,
                        args: args
                    }
                }
                //如果条件都俱备，就开始进行筛选 
                if(elems.length && filter) {
                    tmp = [];
                    i = 0;
                    ri = 0;
                    if(typeof filter === "function") { //如果是一些简单的伪类
                        if(onePosition[key]) {
                            //如果args为void则将集合的最大索引值传进去，否则将exp转换为数字
                            args = args === void 0 ? elems.length - 1 : ~~args;
                            for(; elem = elems[i];) {
                                if(filter(i++, args) ^ flag_not) tmp[ri++] = elem;
                            }
                        } else {
                            while((elem = elems[i++])) {
                                if(( !! filter(elem, args)) ^ flag_not) tmp[ri++] = elem;
                            }
                        }
                    } else if(typeof filter.exec === "function") { //如果是子元素过滤伪类
                        tmp = filter.exec({
                            not: flag_not,
                            xml: flag_xml
                        }, elems, args, doc);
                    } else {
                        var name = filter[0],
                            op = _hash_op[filter[1]],
                            val = filter[2] || "",
                            flag, attr;
                        if(!flag_xml && name === "class" && op === 4) { //如果是类名
                            val = " " + val + " ";
                            while((elem = elems[i++])) {
                                var className = elem.className;
                                if( !! (className && (" " + className + " ").indexOf(val) > -1) ^ flag_not) {
                                    tmp[ri++] = elem;
                                }
                            }
                        } else {
                            if(!flag_xml && op && val && !reg_sensitive.test(name)) {
                                val = val.toLowerCase();
                            }
                            if(op === 4) {
                                val = " " + val + " ";
                            }
                            while((elem = elems[i++])) {
                                if(!op) {
                                    flag = Icarus.hasAttribute(elem, name, flag_xml); //[title]
                                } else if(val === "" && op > 3) {
                                    flag = false
                                } else {
                                    attr = Icarus.getAttribute(elem, name, flag_xml);
                                    switch(op) {
                                    case 1:
                                        // = 属性值全等于给出值
                                        flag = attr === val;
                                        break;
                                    case 2:
                                        //!= 非标准，属性值不等于给出值
                                        flag = attr !== val;
                                        break;
                                    case 3:
                                        //|= 属性值以“-”分割成两部分，给出值等于其中一部分，或全等于属性值
                                        flag = attr === val || attr.substr(0, val.length + 1) === val + "-";
                                        break;
                                    case 4:
                                        //~= 属性值为多个单词，给出值为其中一个。
                                        flag = attr && (" " + attr + " ").indexOf(val) >= 0;
                                        break;
                                    case 5:
                                        //^= 属性值以给出值开头
                                        flag = attr && attr.indexOf(val) === 0;
                                        break;
                                    case 6:
                                        //$= 属性值以给出值结尾
                                        flag = attr && attr.substr(attr.length - val.length) === val;
                                        break;
                                    case 7:
                                        //*= 属性值包含给出值
                                        flag = attr && attr.indexOf(val) >= 0;
                                        break;
                                    }
                                }
                                if(flag ^ flag_not) tmp[ri++] = elem;
                            }
                        }
                    }
                    elems = tmp;
                }
            }
            return [expr, elems];
        }
    });

    //===================构建处理伪类的适配器=====================
    var filterPseudoHasExp = function(strchild, strsibling, type) {
            return {
                exec: function(flags, lastResult, args) {
                    var result = [],
                        flag_not = flags.not,
                        child = strchild,
                        sibling = strsibling,
                        ofType = type,
                        cache = {},
                        lock = {},
                        a = args.a,
                        b = args.b,
                        i = 0,
                        ri = 0,
                        el, found, diff, count;
                    if(!ofType && a === 1 && b === 0) {
                        return flag_not ? [] : lastResult;
                    }
                    var checkName = ofType ? "nodeName" : "nodeType";
                    for(; el = lastResult[i++];) {
                        var parent = el.parentNode;
                        var pid = $.getUid(parent);
                        if(!lock[pid]) {
                            count = lock[pid] = 1;
                            var checkValue = ofType ? el.nodeName : 1;
                            for(var node = parent[child]; node; node = node[sibling]) {
                                if(node[checkName] === checkValue) {
                                    pid = $.getUid(node);
                                    cache[pid] = count++;
                                }
                            }
                        }
                        diff = cache[$.getUid(el)] - b;
                        found = a === 0 ? diff === 0 : (diff % a === 0 && diff / a >= 0);
                        (found ^ flag_not) && (result[ri++] = el);
                    }
                    return result;
                }
            };
        };

    function filterPseudoNoExp(name, isLast, isOnly) {
        var A = "var result = [], flag_not = flags.not, node, el, tagName, i = 0, ri = 0, found = 0; for (; node = el = lastResult[i++];found = 0) {"
        var B = "{0} while (!found && (node=node.{1})) { (node.{2} === {3})  && ++found;  }";
        var C = " node = el;while (!found && (node = node.previousSibling)) {  node.{2} === {3} && ++found;  }";
        var D = "!found ^ flag_not && (result[ri++] = el);  }   return result";

        var start = isLast ? "nextSibling" : "previousSibling";
        var fills = {
            type: [" tagName = el.nodeName;", start, "nodeName", "tagName"],
            child: ["", start, "nodeType", "1"]
        }
        [name];
        var body = A + B + (isOnly ? C : "") + D;
        var fn = new Function("flags", "lastResult", body.replace(/{(\d)}/g, function($, $1) {
            return fills[$1];
        }));
        return {
            exec: fn
        }
    }

    function filterProp(str_prop, flag) {
        return {
            exec: function(flags, elems) {
                var result = [],
                    prop = str_prop,
                    flag_not = flag ? flags.not : !flags.not;
                for(var i = 0, ri = 0, elem; elem = elems[i++];)
                if(elem[prop] ^ flag_not) result[ri++] = elem; //&& ( !flag || elem.type !== "hidden" )
                return result;
            }
        };
    };
    Icarus.pseudoHooks = {
        root: function(el) { //标准
            return el === (el.ownerDocument || el.document).documentElement;
        },
        target: { //标准
            exec: function(flags, elems, _, doc) {
                var result = [],
                    flag_not = flags.not;
                var win = doc.defaultView || doc.parentWindow;
                var hash = win.location.hash.slice(1);
                for(var i = 0, ri = 0, elem; elem = elems[i++];)
                if(((elem.id || elem.name) === hash) ^ flag_not) result[ri++] = elem;
                return result;
            }
        },
        "first-child": filterPseudoNoExp("child", false, false),
        "last-child": filterPseudoNoExp("child", true, false),
        "only-child": filterPseudoNoExp("child", true, true),
        "first-of-type": filterPseudoNoExp("type", false, false),
        "last-of-type": filterPseudoNoExp("type", true, false),
        "only-of-type": filterPseudoNoExp("type", true, true),
        //name, isLast, isOnly
        "nth-child": filterPseudoHasExp("firstChild", "nextSibling", false),
        //标准
        "nth-last-child": filterPseudoHasExp("lastChild", "previousSibling", false),
        //标准
        "nth-of-type": filterPseudoHasExp("firstChild", "nextSibling", true),
        //标准
        "nth-last-of-type": filterPseudoHasExp("lastChild", "previousSibling", true),
        //标准
        empty: { //标准
            exec: function(flags, elems) {
                var result = [],
                    flag_not = flags.not;
                for(var i = 0, ri = 0, elem; elem = elems[i++];) {
                    if(elem.nodeType == 1) {
                        if(!elem.firstChild ^ flag_not) result[ri++] = elem;
                    }
                }
                return result;
            }
        },
        link: { //标准
            exec: function(flags, elems) {
                var links = (elems[0].ownerDocument || elems[0].document).links;
                if(!links) return [];
                var result = [],
                    checked = {},
                    flag_not = flags.not;
                for(var i = 0, ri = 0, elem; elem = links[i++];)
                checked[$.getUid(elem)] = 1;
                for(i = 0; elem = elems[i++];)
                if(checked[$.getUid(elem)] ^ flag_not) result[ri++] = elem;
                return result;
            }
        },
        lang: { //标准 CSS2链接伪类
            exec: function(flags, elems, arg) {
                var result = [],
                    reg = new RegExp("^" + arg, "i"),
                    flag_not = flags.not;
                for(var i = 0, ri = 0, elem; elem = elems[i++];) {
                    var tmp = elem;
                    while(tmp && !tmp.getAttribute("lang"))
                    tmp = tmp.parentNode;
                    tmp = !! (tmp && reg.test(tmp.getAttribute("lang")));
                    if(tmp ^ flag_not) result[ri++] = elem;
                }
                return result;
            }
        },
        active: function(el) {
            return el === el.ownerDocument.activeElement;
        },
        focus: function(el) {
            return(el.type || el.href) && el === el.ownerDocument.activeElement;
        },
        indeterminate: function(node) { //标准
            return node.indeterminate === true && node.type === "checkbox"
        },
        //http://www.w3.org/TR/css3-selectors/#UIstates
        enabled: filterProp("disabled", false),
        //标准
        disabled: filterProp("disabled", true),
        //标准
        checked: filterProp("checked", true),
        //标准
        contains: {
            exec: function(flags, elems, arg) {
                var res = [],
                    fn = flags.xml ? $.getText : getHTMLText,
                    flag_not = flags.not;
                for(var i = 0, ri = 0, elem; elem = elems[i++];) {
                    if(( !! ~fn([elem]).indexOf(arg)) ^ flag_not) res[ri++] = elem;
                }
                return res;
            }
        },
        //自定义伪类
        selected: function(el) {
            el.parentNode && el.parentNode.selectedIndex; //处理safari的bug
            return el.selected === true;
        },
        header: function(el) {
            return /h\d/i.test(el.nodeName);
        },
        button: function(el) {
            return "button" === el.type || el.nodeName === "BUTTON";
        },
        input: function(el) {
            return /input|select|textarea|button/i.test(el.nodeName);
        },
        parent: function(el) {
            return !!el.firstChild;
        },
        has: function(el, expr) { //孩子中是否拥有匹配expr的节点
            return !!$.query(expr, [el]).length;
        },
        //与位置相关的过滤器
        first: function(index) {
            return index === 0;
        },
        last: function(index, num) {
            return index === num;
        },
        even: function(index) {
            return index % 2 === 0;
        },
        odd: function(index) {
            return index % 2 === 1;
        },
        lt: function(index, num) {
            return index < num;
        },
        gt: function(index, num) {
            return index > num;
        },
        eq: function(index, num) {
            return index === num;
        },
        hidden: function(el) { // Opera <= 12.12 reports offsetWidths and offsetHeights less than zero on some elements
            return el.offsetWidth <= 0 || el.offsetHeight <= 0 || (el.currentStyle || {}).display == "none";
        }
    }
    Icarus.pseudoHooks.visible = function(el) {
        return !Icarus.pseudoHooks.hidden(el);
    }

    "text,radio,checkbox,file,password,submit,image,reset".replace($.rword, function(name) {
        Icarus.pseudoHooks[name] = function(el) {
            return(el.getAttribute("type") || el.type) === name; //避开HTML5新增类型导致的BUG，不直接使用el.type === name;
        }
    });
    return Icarus;
});
/**
2011.10.25重构$.unique
2011.10.26支持对拥有name值为id的控件的表单元素的查找，添加labed语句，让元素不存在时更快跳出主循环
2011.10.30让属性选择器支持拥有多个中括号与转义符的属性表达式，如‘input[name=brackets\\[5\\]\\[\\]]’
2011.10.31重构属性选择器处理无操作部分，使用hasAttribute来判定用户是否显示使用此属性，并支持checked, selected, disabled等布尔属性
2011.10.31重构关系选择器部分，让后代选择器也出现在switch分支中
2011.11.1 重构子元素过滤伪类的两个生成函数filterPseudoHasExp filterPseudoNoExp
2011.11.2 FIX处理 -of-type家族的BUG
2011.11.3 添加getAttribute hasAttribute API
2011.11.4 属性选择器对给出值或属性值为空字符串时进行快速过滤
2011.11.5 添加getElementsByXpath 增加对XML的支持
2011.11.6 重构getElementsByTagName 支持带命名空间的tagName
2011.11.6 处理IE67与opera9在getElementById中的BUG
2011.11.7 支持多上下文,对IE678的注释节点进行清除,优化querySelectorAll的使用
2011.11.8 处理分解nth-child参数的BUG，修正IE67下getAttribute对input[type=search]的支持，重构sortOrder标准浏览器的部分
调整swich...case中属性选择器的分支，因为reg_sequence允许出现"[  "的情况，因此会匹配不到，需要改为default
修改属性选择器$=的判定，原先attr.indexOf(val) == attr.length - val.length，会导致"PWD".indexOf("bar]")也有true
2011.11.9 增加getText 重构 getElementById与过滤ID部分
2011.11.10 exec一律改为match,对parseNth的结果进行缓存
2012.5.21 对body进行优化
https://github.com/CNEYE/JReally
*/