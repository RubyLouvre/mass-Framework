define("attr_fix", !! document.dispatchEvent, ["node"], function($) {
    $.fixIEAttr = function(valHooks, attrHooks) {
        var rattrs = /\s+([\w-]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g,
            rquote = /^['"]/,
            support = $.support,
            defaults = {
                checked: "defaultChecked",
                selected: "defaultSelected"
            }
        $.fixDefault = function(node, name, value) {
            var _default = defaults[name];
            if(_default) {
                node[_default] = value;
            }
        }

        attrHooks["@ie:get"] = function(node, name) {
            var str = node.outerHTML.replace(node.innerHTML, ""),
                obj = {},
                k, v;
            while(k = rattrs.exec(str)) { //属性值只有双引号与无引号的情况
                v = k[2];
                obj[k[1].toLowerCase()] = v ? rquote.test(v) ? v.slice(1, -1) : v : "";
            }
            return obj[name];
        }
        attrHooks["@ie:set"] = function(node, name, value) {
            var attr = node.getAttributeNode(name);
            if(!attr) { //不存在就创建一个同名的特性节点
                attr = node.ownerDocument.createAttribute(name);
                node.setAttributeNode(attr);
            }
            attr.value = value + "";
        }


        if(!support.attrInnateValue) {
            // http://gabriel.nagmay.com/2008/11/javascript-href-bug-in-ie/
            //在IE6-8如果一个A标签，它里面包含@字符，并且没任何元素节点，那么它里面的文本会变成链接值
            $.propHooks["href:set"] = attrHooks["href:set"] = function(node, name, value) {
                var b
                if(node.tagName == "A" && node.innerText.indexOf("@") > 0 && !node.children.length) {
                    b = node.ownerDocument.createElement('b');
                    b.style.display = 'none';
                    node.appendChild(b);
                }
                node.setAttribute(name, value + "");
                if(b) {
                    node.removeChild(b);
                }
            }
        }
        //========================attrHooks 的相关修正==========================
        if(!support.attrInnateHref) {
            //http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
            //IE的getAttribute支持第二个参数，可以为 0,1,2,4
            //0 是默认；1 区分属性的大小写；2取出源代码中的原字符串值(注，IE67对动态创建的节点没效),4用于取得完整路径
            //IE 在取 href 的时候默认拿出来的是绝对路径，加参数2得到我们所需要的相对路径。
            "href,src,width,height,colSpan,rowSpan".replace($.rword, function(method) {
                attrHooks[method.toLowerCase() + ":get"] = function(node, name) {
                    var ret = node.getAttribute(name, 2);
                    return ret == null ? void 0 : ret;
                }
            });
            "width,height".replace($.rword, function(attr) {
                attrHooks[attr + ":set"] = function(node, name, value) {
                    node.setAttribute(attr, value === "" ? "auto" : value + "");
                }
            });
            $.propHooks["href:get"] = function(node, name) {
                return node.getAttribute(name, 4);
            };
        }
        if(!document.createElement("form").enctype) { //如果不支持enctype， 我们需要用encoding来映射
            $.propMap.enctype = "encoding";
        }
        if(!support.attrInnateStyle) {
            //IE67是没有style特性（特性的值的类型为文本），只有el.style（CSSStyleDeclaration）(bug)
            attrHooks["style:get"] = function(node) {
                return node.style.cssText || undefined;
            }
            attrHooks["style:set"] = function(node, name, value) {
                node.style.cssText = value + "";
            }
        }
        //========================valHooks 的相关修正==========================
        if(!support.attrInnateName) { //IE6-7 button.value错误指向innerText
            valHooks["button:get"] = attrHooks["@ie:get"]
            valHooks["button:set"] = attrHooks["@ie:set"]
        }
        delete $.fixIEAttr;
    }
    return $;
})