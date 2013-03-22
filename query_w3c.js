//=========================================
// 选择器模块 v5 手机版
//==========================================
define("query", ["mass"], function($) {
    $.mix({
        isXML: function(el) {
            //http://www.cnblogs.com/rubylouvre/archive/2010/03/14/1685360.
            var doc = el.ownerDocument || el;
            return doc.createElement("p").nodeName === "p";
        },
        contains: function(a, b, itself) {
            // 第一个节点是否包含第二个节点
            //contains 方法支持情况：chrome+ firefox9+ ie5+, opera9.64+(估计从9.0+),safari5.1.7+
            if (a === b) {
                return !!itself;
            }
            if (a.nodeType === 9)
                return true;
            if (a.contains) {
                return a.contains(b);
            }
            while ((b = b.parentNode))
                if (a === b)
                    return true;
            return false;
        },
        getText: function() {
            //获取某个节点的文本，如果此节点为元素节点，则取其childNodes的所有文本
            return function getText(nodes) {
                for (var i = 0, ret = "", node; node = nodes[i++]; ) {
                    // 对得文本节点与CDATA的内容
                    if (node.nodeType === 3 || node.nodeType === 4) {
                        ret += node.nodeValue;
                        //取得元素节点的内容
                    } else if (node.nodeType !== 8) {
                        ret += getText(node.childNodes);
                    }
                }
                return ret;
            };
        }(),
        unique: function(nodes) {
            if (nodes.length < 2) {
                return nodes;
            }
            var result = [],
                    array = [],
                    uniqResult = {},
                    node = nodes[0],
                    index, ri = 0,
                    sourceIndex = typeof node.sourceIndex === "number",
                    compare = typeof node.compareDocumentPosition == "function";
            //如果支持sourceIndex我们将使用更为高效的节点排序
            //http://www.cnblogs.com/jkisjk/archive/2011/01/28/array_quickly_sortby.html
            if (!sourceIndex && !compare) { //用于旧式IE的XML
                var all = (node.ownerDocument || node).geElementsByTagName("*");
                for (var index = 0; node = all[index]; index++) {
                    node.setAttribute("sourceIndex", index);
                }
                sourceIndex = true;
            }
            if (sourceIndex) { //IE opera
                for (var i = 0, n = nodes.length; i < n; i++) {
                    node = nodes[i];
                    index = (node.sourceIndex || node.getAttribute("sourceIndex")) + 1e8;
                    if (!uniqResult[index]) {
                        (array[ri++] = new String(index))._ = node;
                        uniqResult[index] = 1;
                    }
                }
                array.sort();
                while (ri)
                    result[--ri] = array[ri]._;
                return result;
            } else {
                nodes.sort(sortOrder);
                if (sortOrder.hasDuplicate) {
                    for (i = 1; i < nodes.length; i++) {
                        if (nodes[i] === nodes[i - 1]) {
                            nodes.splice(i--, 1);
                        }
                    }
                }
                sortOrder.hasDuplicate = false; //还原
                return nodes;
            }
        }
    });

    function sortOrder(a, b) {
        if (a === b) {
            sortOrder.hasDuplicate = true;
            return 0;
        } //现在标准浏览器的HTML与XML好像都支持compareDocumentPosition
        if (!a.compareDocumentPosition || !b.compareDocumentPosition) {
            return a.compareDocumentPosition ? -1 : 1;
        }
        return a.compareDocumentPosition(b) & 4 ? -1 : 1;
    }
    /**
     * 选择器
     * @param {String} expr CSS表达式
     * @param {Node}   context 上下文（可选）
     */
    var Icarus = $.query = function(expr, context) {
        var contexts = context || document;
        if (!Array.isArray(contexts)) {
            contexts = [contexts];
        }
        var result = [];
        for (var i = 0, node; node = contexts[i++]; ) {
            result = result.concat([].slice.call(node.querySelectorAll(expr)));
        }
        return  contexts.length > 1 ? $.unique(result) : result;
    };
    return Icarus;
});
/**
 最精版
 */