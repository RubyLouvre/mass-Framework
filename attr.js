//==================================================
// 属性操作模块 v3
//==================================================
define("attr", !! this.getComputedStyle ? ["node"] : ["attr_fix"], function($) {
    var rreturn = /\r/g,
        rtabindex = /^(a|area|button|input|object|select|textarea)$/i,
        rnospaces = /\S+/g,
        support = $.support,
        cacheProp = {};

    function defaultProp(node, prop) {
        var name = node.tagName + ":" + prop;
        if(name in cacheProp) {
            return cacheProp[name];
        }
        return cacheProp[name] = document.createElement(node.tagName)[prop];
    }

    function getValType(el) {
        var ret = el.tagName.toLowerCase();
        return ret === "input" && /checkbox|radio/.test(el.type) ? "checked" : ret;
    }

    $.fn.extend({
        /**
         *  为所有匹配的元素节点添加className，添加多个className要用空白隔开
         *  如$("body").addClass("aaa");$("body").addClass("aaa bbb");
         *  <a href="http://www.cnblogs.com/rubylouvre/archive/2011/01/27/1946397.html">相关链接</a>
         */
        addClass: function(item) {
            if(typeof item == "string") {
                for(var i = 0, el; el = this[i++];) {
                    if(el.nodeType === 1) {
                        if(!el.className) {
                            el.className = item;
                        } else {
                            var a = (el.className + " " + item).match(rnospaces);
                            a.sort();
                            for(var j = a.length - 1; j > 0; --j)
                            if(a[j] === a[j - 1]) a.splice(j, 1);
                            el.className = a.join(" ");
                        }
                    }
                }
            }
            return this;
        },
        //如果不传入类名,则清空所有类名,允许同时删除多个类名
        removeClass: function(item) {
            if((item && typeof item === "string") || item === void 0) {
                var classNames = (item || "").match(rnospaces),
                    cl = classNames.length;
                for(var i = 0, node; node = this[i++];) {
                    if(node.nodeType === 1 && node.className) {
                        if(item) { //rnospaces = /\S+/
                            var set = " " + node.className.match(rnospaces).join(" ") + " ";
                            for(var c = 0; c < cl; c++) {
                                set = set.replace(" " + classNames[c] + " ", " ");
                            }
                            node.className = set.slice(1, set.length - 1);
                        } else {
                            node.className = "";
                        }
                    }
                }
            }
            return this;
        },
        //如果第二个参数为true，要求所有匹配元素都拥有此类名才返回true
        hasClass: function(item, every) {
            var method = every === true ? "every" : "some",
                rclass = new RegExp('(\\s|^)' + item + '(\\s|$)'); //判定多个元素，正则比indexOf快点
            return $.slice(this)[method](function(el) { //先转换为数组
                return(el.className || "").match(rclass);
            });
        },
        //如果存在（不存在）就删除（添加）指定的类名。对所有匹配元素进行操作。
        toggleClass: function(value, stateVal) {
            var type = typeof value,
                classNames = type === "string" && value.match(rnospaces) || [],
                className, i, isBool = typeof stateVal === "boolean";
            return this.each(function(_, el) {
                i = 0;
                if(el.nodeType === 1) {
                    var self = $(el),
                        state = stateVal;
                    if(type === "string") {
                        while((className = classNames[i++])) {
                            state = isBool ? state : !self.hasClass(className);
                            self[state ? "addClass" : "removeClass"](className);
                        }
                    } else if(type === "undefined" || type === "boolean") {
                        if(el.className) {
                            $._data(el, "__className__", el.className);
                        }
                        el.className = el.className || value === false ? "" : $._data(el, "__className__") || "";
                    }
                }
            });
        },
        //如果匹配元素存在类名old则将其置换为类名neo
        replaceClass: function(old, neo) {
            for(var i = 0, node; node = this[i++];) {
                if(node.nodeType === 1 && node.className) {
                    var arr = node.className.match(rnospaces),
                        cls = [];
                    for(var j = 0; j < arr.length; j++) {
                        cls.push(arr[j] === old ? neo : arr[j]);
                    }
                    node.className = cls.join(" ");
                }
            }
            return this;
        },
        //用于取得表单元素的value值
        val: function(item) {
            var getter = valHooks["option:get"];
            if(arguments.length) {
                if(Array.isArray(item)) {
                    item = item.map(function(item) {
                        return item == null ? "" : item + "";
                    });
                } else if(isFinite(item)) {
                    item += "";
                } else {
                    item = item || ""; //我们确保传参为字符串数组或字符串，null/undefined强制转换为"", number变为字符串
                }
            }
            return $.access(this, function(el) {
                if(this === $) { //getter
                    var ret = (valHooks[getValType(el) + ":get"] || $.propHooks["@default:get"])(el, "value", getter);
                    return typeof ret === "string" ? ret.replace(rreturn, "") : ret == null ? "" : ret;
                } else { //setter 
                    if(el.nodeType === 1) {
                        (valHooks[getValType(el) + ":set"] || $.propHooks["@default:set"])(el, "value", item, getter);
                    }
                }
            }, 0, arguments);
        }
    });
    $.mix({
        fixDefault: $.noop,
        propMap: { //属性名映射
            "accept-charset": "acceptCharset",
            "char": "ch",
            "charoff": "chOff",
            "class": "className",
            "for": "htmlFor",
            "http-equiv": "httpEquiv"
        },
        prop: function(node, name, value) {
            if($["@bind"] in node) {
                if(node.nodeType === 1 && !$.isXML(node)) {
                    name = $.propMap[name.toLowerCase()] || name;
                }
                var access = value === void 0 ? "get" : "set";
                return($.propHooks[name + ":" + access] || $.propHooks["@default:" + access])(node, name, value);
            }
        },
        attr: function(node, name, value) {
            if($["@bind"] in node) {
                if(typeof node.getAttribute === "undefined") {
                    return $.prop(node, name, value);
                }
                //这里只剩下元素节点
                var noxml = !$.isXML(node),
                    type = "@w3c";
                if(noxml) {
                    name = name.toLowerCase();
                    var prop = $.propMap[name] || name;
                    if(!support.attrInnateName) {
                        type = "@ie";
                    }
                    var isBool = typeof node[prop] === "boolean" && typeof defaultProp(node, prop) === "boolean"; //判定是否为布尔属性
                }
                //移除操作
                if(noxml) {
                    if(value === null || value === false && isBool) {
                        return $.removeAttr(node, name);
                    }
                } else if(value === null) {
                    return node.removeAttribute(name);
                }
                //读写操作
                var access = value === void 0 ? "get" : "set";
                if(isBool) {
                    type = "@bool";
                    name = prop;
                };
                return(noxml && $.attrHooks[name + ":" + access] || $.attrHooks[type + ":" + access])(node, name, value);
            }
        },
        //只能用于HTML,元素节点的内建不能删除（chrome真的能删除，会引发灾难性后果），使用默认值覆盖
        removeProp: function(node, name) {
            if(node.nodeType === 1) {
                if(!support.attrInnateName) {
                    name = $.propMap[name.toLowerCase()] || name;
                }
                node[name] = defaultProp(node, name);
            } else {
                node[name] = void 0;
            }
        },
        //只能用于HTML
        removeAttr: function(node, name) {
            if(name && node.nodeType === 1) {
                name = name.toLowerCase();
                if(!support.attrInnateName) {
                    name = $.propMap[name] || name;
                }
                //小心contentEditable,会把用户编辑的内容清空
                if(typeof node[name] !== "boolean") {
                    node.setAttribute(name, "");
                }
                node.removeAttribute(name);
                // 确保bool属性的值为bool
                if(node[name] === true) {
                    node[name] = false;
                    $.fixDefault(node, name, false);
                }
            }
        },
        propHooks: {
            "@default:get": function(node, name) {
                return node[name];
            },
            "@default:set": function(node, name, value) {
                node[name] = value;
            },
            "tabIndex:get": function(node) {
                //http://www.cnblogs.com/rubylouvre/archive/2009/12/07/1618182.html
                var ret = node.tabIndex;
                if(ret === 0) { //在标准浏览器下，不显式设置时，表单元素与链接默认为0，普通元素为-1
                    ret = rtabindex.test(node.nodeName) ? 0 : -1;
                }
                return ret;
            }
        },
        attrHooks: {
            "@w3c:get": function(node, name) {
                var ret = node.getAttribute(name);
                return ret == null ? void 0 : ret;
            },
            "@w3c:set": function(node, name, value) {
                node.setAttribute(name, "" + value);
            },
            "@bool:get": function(node, name) {
                //布尔属性在IE6-8的标签大部字母大写，没有赋值，并且无法通过其他手段获得用户的原始设值
                return node[name] ? name.toLowerCase() : void 0;
            },
            "@bool:set": function(node, name) {
                //布尔属性在IE6-8的标签大部字母大写，没有赋值，并且无法通过其他手段获得用户的原始设值
                node.setAttribute(name, name.toLowerCase());
                node[name] = true;
                $.fixDefault(node, name, true);
            }

        }
    });
    "Attr,Prop".replace($.rword, function(method) {
        $.fn[method.toLowerCase()] = function(name, value) {
            return $.access(this, $[method.toLowerCase()], name, arguments);
        };
        $.fn["remove" + method] = function(name) {
            return this.each(function() {
                $["remove" + method](this, name);
            });
        };
    });
    //========================propHooks 的相关修正==========================
    var prop = "accessKey,allowTransparency,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan,contentEditable," + "dateTime,defaultChecked,defaultSelected,defaultValue,frameBorder,isMap,longDesc,maxLength,marginWidth,marginHeight," + "noHref,noResize,noShade,readOnly,rowSpan,tabIndex,useMap,vSpace,valueType,vAlign";
    prop.replace($.rword, function(name) {
        $.propMap[name.toLowerCase()] = name;
    });
    //safari IE9 IE8 我们必须访问上一级元素时,才能获取这个值
    if(!support.optSelected) {
        $.propHooks["selected:get"] = function(node) {
            for(var p = node; typeof p.selectedIndex !== "number"; p = p.parentNode) {}
            return node.selected;
        };
    }
    //========================valHooks 的相关修正==========================
    var valHooks = {
        "option:get": function(node) {
            var val = node.attributes.value;
            //黑莓手机4.7下val会返回undefined,但我们依然可用node.value取值
            return !val || val.specified ? node.value : node.text;
        },
        "select:get": function(node, value, getter) {
            var option, options = node.options,
                index = node.selectedIndex,
                one = node.type === "select-one" || index < 0,
                values = one ? null : [],
                max = one ? index + 1 : options.length,
                i = index < 0 ? max : one ? index : 0;
            for(; i < max; i++) {
                option = options[i];
                //旧式IE在reset后不会改变selected，需要改用i === index判定
                //我们过滤所有disabled的option元素，但在safari5下，如果设置select为disable，那么其所有孩子都disable
                //因此当一个元素为disable，需要检测其是否显式设置了disable及其父节点的disable情况
                if((option.selected || i === index) && !(support.optDisabled ? option.disabled : / disabled=/.test(option.outerHTML.replace(option.innerHTML, "")))) {
                    value = getter(option);
                    if(one) {
                        return value;
                    }
                    //收集所有selected值组成数组返回
                    values.push(value);
                }
            }
            return values;
        },
        "select:set": function(node, name, values, getter) {
            values = [].concat(values); //强制转换为数组
            for(var i = 0, el; el = node.options[i++];) {
                el.selected = !! ~values.indexOf(getter(el));
            }
            if(!values.length) {
                node.selectedIndex = -1;
            }
        }
    }

    //checkbox的value默认为on，唯有chrome 返回空字符串
    if(!support.checkOn) {
        valHooks["checked:get"] = function(node) {
            return node.getAttribute("value") === null ? "on" : node.value;
        };
    }
    //处理单选框，复选框在设值后checked的值
    valHooks["checked:set"] = function(node, name, value) {
        if(Array.isArray(value)) {
            return node.checked = !! ~value.indexOf(node.value);
        }
    }
    if(typeof $.fixIEAttr === "function") {
        $.fixIEAttr(valHooks, $.attrHooks);
    }
    return $;
});
/**
 2011.8.2
 将prop从attr分离出来
 添加replaceClass方法
 2011.8.5  重构val方法
 2011.8.12 重构replaceClass方法
 2011.10.11 重构attr prop方法
 2011.10.21 FIX valHooks["select:set"] BUG
 2011.10.22 FIX boolaHooks.set方法
 2011.10.27 对prop attr val大重构
 2012.6.23 attr在value为false, null, undefined时进行删除特性操作
 2012.11.6 升级v2
 2012.12.24 升级到v3 添加对defaultSelected defaultChecked的处理

 http://nanto.asablo.jp/blog/2005/10/29/123294

 http://perl.no-tubo.net/2010/07/01/ie-%E3%81%AB%E3%81%8A%E3%81%91%E3%82%8B-setattribute-%E3%82%84-getattribute-%E3%82%84-removeattribute-%E3%81%8C%E3%81%A0%E3%82%81%E3%81%A0%E3%82%81%E3%81%AA%E4%BB%B6/
 */