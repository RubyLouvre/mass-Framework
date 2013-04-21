(function() {
//加载用户当前浏览器所有的语言
    var lang = (navigator.language || navigator.browserLanguage || "zh-cn").toLowerCase();
    define.lang = lang === "zh-cn" ? lang : lang.split("-")[0];
})();
define("avalon", ["/locale/" + define.lang, "event", "css", "attr", ], function(locale, $) {
   // window.console = window.console || $;
    var prefix = $.config.bindingPrefix || "ms-";
    var formats = locale.NUMBER_FORMATS;
    var avalon = $.avalon = {
        models: {},
        obsevers: {},
        filters: {
            uppercase: function(str) {
                return str.toUpperCase();
            },
            lowercase: function(str) {
                return str.toLowerCase();
            },
            contains: $.String.contains,
            truncate: $.String.truncate,
            camelize: $.String.camelize,
            escape: $.String.escapeHTML,
            currency: function(number, symbol) {
                symbol = symbol || formats.CURRENCY_SYM;
                return symbol + avalon.filters.number(number);
            },
            number: function(number, decimals, dec_point, thousands_sep) {
//与PHP的number_format完全兼容
//number	必需，要格式化的数字
//decimals	可选，规定多少个小数位。
//dec_point	可选，规定用作小数点的字符串（默认为 . ）。
//thousands_sep	可选，规定用作千位分隔符的字符串（默认为 , ），如果设置了该参数，那么所有其他参数都是必需的。
// http://kevin.vanzonneveld.net
// *     example 1: number_format(1234.56);
// *     returns 1: '1,235'
// *     example 2: number_format(1234.56, 2, ',', ' ');
// *     returns 2: '1 234,56'
// *     example 3: number_format(1234.5678, 2, '.', '');
// *     returns 3: '1234.57'
// *     example 4: number_format(67, 2, ',', '.');
// *     returns 4: '67,00'
// *     example 5: number_format(1000);
// *     returns 5: '1,000'
// *     example 6: number_format(67.311, 2);
// *     returns 6: '67.31'
// *     example 7: number_format(1000.55, 1);
// *     returns 7: '1,000.6'
// *     example 8: number_format(67000, 5, ',', '.');
// *     returns 8: '67.000,00000'
// *     example 9: number_format(0.9, 0);
// *     returns 9: '1'
// *     example 10: number_format('1.20', 2);
// *     returns 10: '1.20'
// *     example 11: number_format('1.20', 4);
// *     returns 11: '1.2000'
// *     example 12: number_format('1.2000', 3);
// *     returns 12: '1.200'
// *     example 13: number_format('1 000,50', 2, '.', ' ');
// *     returns 13: '100 050.00'
// Strip all characters but numerical ones.
                number = (number + "").replace(/[^0-9+\-Ee.]/g, '');
                var n = !isFinite(+number) ? 0 : +number,
                        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                        sep = (typeof thousands_sep === 'undefined') ? formats.GROUP_SEP : thousands_sep,
                        dec = (typeof dec_point === 'undefined') ? formats.DECIMAL_SEP : dec_point,
                        s = '',
                        toFixedFix = function(n, prec) {
                    var k = Math.pow(10, prec);
                    return '' + Math.round(n * k) / k;
                };
                // Fix for IE parseFloat(0.55).toFixed(0) = 0;
                s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
                if (s[0].length > 3) {
                    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
                }
                if ((s[1] || '').length < prec) {
                    s[1] = s[1] || '';
                    s[1] += new Array(prec - s[1].length + 1).join('0');
                }
                return s.join(dec);
            }
        }
    };
 
    var Publish = {}; //将函数放到发布对象上，让依赖它的函数
    var expando = new Date - 0;
    var mid = expando;
    function modleID() {
        return (mid++).toString(36);
    }
    var subscribers = "$" + expando;
    /*********************************************************************
     *                            DateFormat                              *
     **********************************************************************/
    /*
     'yyyy': 4 digit representation of year (e.g. AD 1 => 0001, AD 2010 => 2010)
     'yy': 2 digit representation of year, padded (00-99). (e.g. AD 2001 => 01, AD 2010 => 10)
     'y': 1 digit representation of year, e.g. (AD 1 => 1, AD 199 => 199)
     'MMMM': Month in year (January-December)
     'MMM': Month in year (Jan-Dec)
     'MM': Month in year, padded (01-12)
     'M': Month in year (1-12)
     'dd': Day in month, padded (01-31)
     'd': Day in month (1-31)
     'EEEE': Day in Week,(Sunday-Saturday)
     'EEE': Day in Week, (Sun-Sat)
     'HH': Hour in day, padded (00-23)
     'H': Hour in day (0-23)
     'hh': Hour in am/pm, padded (01-12)
     'h': Hour in am/pm, (1-12)
     'mm': Minute in hour, padded (00-59)
     'm': Minute in hour (0-59)
     'ss': Second in minute, padded (00-59)
     's': Second in minute (0-59)
     'a': am/pm marker
     'Z': 4 digit (+sign) representation of the timezone offset (-1200-+1200)
     format string can also be one of the following predefined localizable formats:
     
     'medium': equivalent to 'MMM d, y h:mm:ss a' for en_US locale (e.g. Sep 3, 2010 12:05:08 pm)
     'short': equivalent to 'M/d/yy h:mm a' for en_US locale (e.g. 9/3/10 12:05 pm)
     'fullDate': equivalent to 'EEEE, MMMM d,y' for en_US locale (e.g. Friday, September 3, 2010)
     'longDate': equivalent to 'MMMM d, y' for en_US locale (e.g. September 3, 2010
     'mediumDate': equivalent to 'MMM d, y' for en_US locale (e.g. Sep 3, 2010)
     'shortDate': equivalent to 'M/d/yy' for en_US locale (e.g. 9/3/10)
     'mediumTime': equivalent to 'h:mm:ss a' for en_US locale (e.g. 12:05:08 pm)
     'shortTime': equivalent to 'h:mm a' for en_US locale (e.g. 12:05 pm)
     */
    avalon.filters.date = (function(formats) {
        function padNumber(num, digits, trim) {
            var neg = '';
            if (num < 0) {
                neg = '-';
                num = -num;
            }
            num = '' + num;
            while (num.length < digits)
                num = '0' + num;
            if (trim)
                num = num.substr(num.length - digits);
            return neg + num;
        }
        function dateGetter(name, size, offset, trim) {
            return function(date) {
                var value = date['get' + name]();
                if (offset > 0 || value > -offset)
                    value += offset;
                if (value === 0 && offset === -12) {
                    value = 12;
                }
                return padNumber(value, size, trim);
            };
        }
        function dateStrGetter(name, shortForm) {
            return function(date, formats) {
                var value = date['get' + name]();
                var get = uppercase(shortForm ? ('SHORT' + name) : name);
                return formats[get][value];
            };
        }

        function timeZoneGetter(date) {
            var zone = -1 * date.getTimezoneOffset();
            var paddedZone = (zone >= 0) ? "+" : "";
            paddedZone += padNumber(Math[zone > 0 ? 'floor' : 'ceil'](zone / 60), 2) +
                    padNumber(Math.abs(zone % 60), 2);
            return paddedZone;
        }
//取得上午下午
        function ampmGetter(date, formats) {
            return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1];
        }
        var DATE_FORMATS = {
            yyyy: dateGetter('FullYear', 4),
            yy: dateGetter('FullYear', 2, 0, true),
            y: dateGetter('FullYear', 1),
            MMMM: dateStrGetter('Month'),
            MMM: dateStrGetter('Month', true),
            MM: dateGetter('Month', 2, 1),
            M: dateGetter('Month', 1, 1),
            dd: dateGetter('Date', 2),
            d: dateGetter('Date', 1),
            HH: dateGetter('Hours', 2),
            H: dateGetter('Hours', 1),
            hh: dateGetter('Hours', 2, -12),
            h: dateGetter('Hours', 1, -12),
            mm: dateGetter('Minutes', 2),
            m: dateGetter('Minutes', 1),
            ss: dateGetter('Seconds', 2),
            s: dateGetter('Seconds', 1),
            // while ISO 8601 requires fractions to be prefixed with `.` or `,` 
            // we can be just safely rely on using `sss` since we currently don't support single or two digit fractions
            sss: dateGetter('Milliseconds', 3),
            EEEE: dateStrGetter('Day'),
            EEE: dateStrGetter('Day', true),
            a: ampmGetter,
            Z: timeZoneGetter
        };
        var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/,
                NUMBER_STRING = /^\d+$/;
        var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
        // 1        2       3         4          5          6          7          8  9     10      11
        function jsonStringToDate(string) {
            var match;
            if (match = string.match(R_ISO8601_STR)) {
                var date = new Date(0),
                        tzHour = 0,
                        tzMin = 0,
                        dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
                        timeSetter = match[8] ? date.setUTCHours : date.setHours;
                if (match[9]) {
                    tzHour = int(match[9] + match[10]);
                    tzMin = int(match[9] + match[11]);
                }
                dateSetter.call(date, int(match[1]), int(match[2]) - 1, int(match[3]));
                timeSetter.call(date, int(match[4] || 0) - tzHour, int(match[5] || 0) - tzMin, int(match[6] || 0), int(match[7] || 0));
                return date;
            }
            return string;
        }
        return function(date, format) {
            var text = '',
                    parts = [],
                    fn, match;
            format = format || 'mediumDate';
            format = formats[format] || format;
            if (typeof (date) === "string") {
                if (NUMBER_STRING.test(date)) {
                    date = int(date);
                } else {
                    date = jsonStringToDate(date);
                }
            }

            if ($.type(date,"Number")) {
                date = new Date(date);
            }

            if ($.type(date) !== "Date") {
                return date;
            }

            while (format) {
                match = DATE_FORMATS_SPLIT.exec(format);
                if (match) {
                    parts = concat(parts, match, 1);
                    format = parts.pop();
                } else {
                    parts.push(format);
                    format = null;
                }
            }

            forEach(parts, function(value) {
                fn = DATE_FORMATS[value];
                text += fn ? fn(date, formats)
                        : value.replace(/(^'|'$)/g, '').replace(/''/g, "'");
            });
            return text;
        };
    })(locale.DATETIME_FORMATS);
    /*********************************************************************
     *                            View                                    *
     **********************************************************************/
    var regOpenTag = /([^{]*)\{\{/;
    var regCloseTag = /([^}]*)\}\}/;
    function hasExpr(value) {
        var index = value.indexOf("{{");
        return index !== -1 && index < value.indexOf("}}");
    }
    function forEach(obj, fn) {
        if (obj) {//不能传个null, undefined进来
            var isArray = isFinite(obj.length), i = 0;
            if (isArray) {
                for (var n = obj.length; i < n; i++) {
                    fn(i, obj[i]);
                }
            } else {
                for (i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        fn(i, obj[i]);
                    }
                }
            }
        }
    }
//eval一个或多个表达式
    function watchView(text, scope, scopes, data, callback, tokens) {
        var updateView, target, filters = data.filters;
        var scopeList = [scope].concat(scopes);
        var trimText = text.trim();
        if (!filters) {
            for (var i = 0, obj; obj = scopeList[i++]; ) {
                if (obj.hasOwnProperty(trimText)) {
                    target = obj; //如果能在作用域上直接找到,我们就不需要eval了
                    break;
                }
            }
        }
        if (target) {
            updateView = function() {
                callback(target[trimText]);
            };
        } else {
            updateView = function() {
                var fn = data.compileFn;
                if (typeof fn === "function") {
                    val = fn.apply(fn, data.compileArgs || []);
                } else {
                    if (tokens) {
                        var val = tokens.map(function(obj) {
                            return obj.expr ? parseExpr(obj.value, scopeList, data) : obj.value;
                        }).join("");
                    } else {
                        val = parseExpr(text, scopeList, data);
                    }
                }
                callback(val);
            };
        }
        Publish[ expando ] = updateView;
        updateView();
        delete  Publish[ expando ];
    }
    var bindingHandlers = avalon.bindingHandlers = {
//将模型中的字段与input, textarea的value值关联在一起
        "model": function(data, scope, scopes) {
            var element = data.element;
            var tagName = element.tagName;
            if (typeof  modelBinding[tagName] === "function") {
                var array = [scope].concat(scopes);
                var name = data.node.value, model;
                array.forEach(function(obj) {
                    if (!model && obj.hasOwnProperty(name)) {
                        model = obj;
                    }
                });
                model = model || {};
                modelBinding[tagName](element, model, name);
            }
        },
        //抽取innerText中插入表达式，置换成真实数据放在它原来的位置
        //<div>{{firstName}} + java</div>，如果model.firstName为ruby， 那么变成
        //<div>ruby + java</div>
        "text": function(data, scope, scopes) {
            var node = data.node;
            watchView(data.value, scope, scopes, data, function(val) {
                node.nodeValue = val;
            });
        },
        //控制元素显示或隐藏
        "toggle": function(data, scope, scopes) {
            var element = $(data.element);
            watchView(data.value, scope, scopes, data, function(val) {
                element.toggle(!!val);
            });
        },
        //这是一个字符串属性绑定的范本, 方便你在title, alt,  src, href添加插值表达式
        //<a href="{{url.hostname}}/{{url.pathname}}.html">
        "href": function(data, scope, scopes) {
//如果没有则说明是使用ng-href的形式
            var text = data.value.trim();
            var node = data.node;
            var simple = node.name.indexOf(prefix) === 0;
            var name = data.type;
            if (!simple && /^\{\{([^}]+)\}\}$/.test(text)) {
                simple = true;
                text = RegExp.$1;
            }
            watchView(text, scope, scopes, data, function(val) {
                data.element[name] = val;
            }, simple ? null : scanExpr(data.value));
        },
        //这是一个布尔属性绑定的范本，布尔属性插值要求整个都是一个插值表达式，用{{}}包起来
        //布尔属性在IE下无法取得原来的字符串值，变成一个布尔，因此需要用ng-disabled
        //text.slice(2, text.lastIndexOf("}}"))
        "disabled": function(data, scope, scopes) {
            var element = data.element, name = data.type,
                    propName = $.propMap[name] || name;
            watchView(data.value, scope, scopes, data, function(val) {
                element[propName] = !!val;
            });
        },
        //切换类名，有三种形式
        //1、ms-class-xxx="flag" 根据flag的值决定是添加或删除类名xxx 
        //2、ms-class=obj obj为一个{xxx:true, yyy:false}的对象，根据其值添加或删除其键名
        //3、ms-class=str str是一个类名或多个类名的集合，全部添加
        //http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
        "class": function(data, scope, scopes) {
            var element = $(data.element);
            watchView(data.value, scope, scopes, data, function(val) {
                if (data.args) {//第一种形式
                    element.toggleClass(data.args.join(""), !!val);
                } else if (typeof val === "string") {
                    element.addClass(val);
                } else if (val && typeof val === "object") {
                    forEach(val, function(cls, flag) {
                        if (flag) {
                            element.addClass(cls);
                        } else {
                            element.removeClass(cls);
                        }
                    });
                }
            });
        },
        //控制流程绑定
        "skip": function() {
            arguments[3].stopBinding = true;
        },
        "if": function(data, scope, scopes) {
            var element = data.element;
            var fragment = element.ownerDocument.createDocumentFragment();
            watchView(data.value, scope, scopes, data, function(val) {
                if (val) {
                    while (fragment.firstChild) {
                        element.appendChild(fragment.firstChild);
                    }
                } else {
                    while (element.firstChild) {
                        fragment.appendChild(element.firstChild);
                    }
                }
            });
        },
        "each": function(data, scope, scopes, flags) {
            var parent = data.element;
            var scopeList = [scope].concat(scopes);
            var list = parseExpr(data.value, scopeList, data);
            var doc = parent.ownerDocument;
            var fragment = doc.createDocumentFragment();
            while (parent.firstChild) {
                fragment.appendChild(parent.firstChild);
            }
            function updateListView(method, args, len) {
                var listName = list.$modelName;
                switch (method) {
                    case "push":
                        $.each(args, function(index, item) {
                            updateView(len + index, item);
                        });
                        break;
                    case "unshift"  :
                        list.insertBefore = parent.firstChild;
                        $.each(args, function(index, item) {
                            updateView(index, item);
                        });
                        resetIndex(parent, listName);
                        delete list.insertBefore;
                        break;
                    case "pop":
                        var node = findIndex(parent, listName, len - 1);
                        if (node) {
                            removeView(parent, listName, node);
                        }
                        break;
                    case "shift":
                        removeView(parent, listName, 0, parent.firstChild);
                        resetIndex(parent, listName);
                        break;
                    case "clear":
                        while (parent.firstChild) {
                            parent.removeChild(parent.firstChild);
                        }
                        break;
                    case "splice":
                        var start = args[0], second = args[1], adds = [].slice.call(args, 2);
                        var deleteCount = second >= 0 ? second : len - start;
                        var node = findIndex(parent, listName, start);
                        if (node) {
                            removeViews(parent, listName, node, deleteCount);
                            resetIndex(parent, listName);
                            if (adds.length) {
                                node = findIndex(parent, listName, start);
                                list.insertBefore = node;
                                $.each(adds, function(index, item) {
                                    updateView(index, item);
                                });
                                resetIndex(parent, listName);
                                delete list.insertBefore;
                            }
                        }
                        break;
                    case "reverse":
                    case "sort":
                        while (parent.firstChild) {
                            parent.removeChild(parent.firstChild);
                        }
                        $.each(list, function(index, item) {
                            updateView(index, item);
                        });
                        break;
                }
            }
            var isList = Array.isArray(list[ subscribers ] || {});
            if (isList) {
                list[ subscribers ].push(updateListView);
            }

            var args = data.args, itemName = args[0] || "$data", indexName = args[1] || "$index";
            function updateView(index, item, clone) {
                var newScope, textNodes = [], source = {};
                source[itemName] = {
                    get: function() {
                        return item;
                    }
                };
                source[indexName] = {
                    get: function() {
                        return list.indexOf(item);
                    }
                };
                newScope = modelFactory(source);
                if (isList) {
                    var comment = doc.createComment(list.$modelName + index);
                    if (list.insertBefore) {
                        parent.insertBefore(comment, list.insertBefore);
                    } else {
                        parent.appendChild(comment);
                    }
                }
                for (var node = fragment.firstChild; node; node = node.nextSibling) {
                    clone = node.cloneNode(true);
                    if (clone.nodeType === 1) {
                        scanTag(clone, newScope, scopeList, doc); //扫描元素节点
                    } else if (clone.nodeType === 3) {
                        textNodes.push(clone);//插值表达式所在的文本节点会被移除,创建循环中断(node.nextSibling===null)
                    }
                    if (list.insertBefore) {
                        parent.insertBefore(clone, list.insertBefore);
                    } else {
                        parent.appendChild(clone);
                    }
                }
                for (var i = 0; node = textNodes[i++]; ) {
                    scanText(node, newScope, scopeList, doc); //扫描文本节点
                }
            }
            try {
                forEach(list, updateView);
            } catch (e) {
                alert(e);
                alert(list)
            }
            flags.stopBinding = true;
        }
    };

    //重置所有路标
    function resetIndex(elem, name) {
        var index = 0;
        for (var node = elem.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === 8) {
                if (node.nodeValue.indexOf(name) === 0) {
                    if (node.nodeValue !== name + index) {
                        node.nodeValue = name + index;
                    }
                    index++;
                }
            }
        }
    }
    function removeView(elem, name, node) {
        var nodes = [], doc = elem.ownerDocument, view = doc.createDocumentFragment();
        for (var check = node; check; check = check.nextSibling) {
            //如果到达下一个路标,则断开,将收集到的节点放到文档碎片与下一个路标返回
            if (check.nodeType === 8 && check.nodeValue.indexOf(name) === 0
                    && check !== node) {
                break
            }
            nodes.push(check);
        }
        for (var i = 0; node = nodes[i++]; ) {
            view.appendChild(node);
        }
        return [view, check];
    }
    function removeViews(elem, name, node, number) {
        var ret = [];
        do {
            var array = removeView(elem, name, node);
            if (array[1]) {
                node = array[1];
                ret.push(array[0]);
            } else {
                break
            }
        } while (ret.length !== number);
        return ret;
    }
    function findIndex(elem, name, target) {
        var index = 0;
        for (var node = elem.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === 8) {
                if (node.nodeValue.indexOf(name) === 0) {
                    if (node.nodeValue == name + target) {
                        return node;
                    }
                    index++;
                }
            }
        }
    }
    //循环绑定其他布尔属性
    var bools = "autofocus,autoplay,async,checked,controls,declare,defer,"
            + "contenteditable,ismap,loop,multiple,noshade,open,noresize,readonly,selected";
    bools.replace($.rword, function(name) {
        bindingHandlers[name] = bindingHandlers.disabled;
    });
    //建议不要直接在src属性上修改，因此这样会发出无效的请求，使用ms-src
    "title, alt, src".replace($.rword, function(name) {
        bindingHandlers[name] = bindingHandlers.href;
    });
    var modelBinding = bindingHandlers.model;
    //如果一个input标签添加了model绑定。那么它对应的字段将与元素的value连结在一起
    //字段变，value就变；value变，字段也跟着变。默认是绑定input事件，
    //我们也可以使用ng-event="change"改成change事件
    modelBinding.INPUT = function(element, model, name) {
        if (element.name === void 0) {
            element.name = name;
        }
        var type = element.type, ok;
        function updateModel() {
            model[name] = element.value;
        }
        function updateView() {
            var val = model[name];
            element.value = val === void 0 ? "" : val;
        }
        if (/^(password|textarea|text)$/.test(type)) {
            ok = true;
            var event = element.attributes[prefix + "event"] || {};
            event = event.value;
            if (event === "change") {
                $.bind(element, event, updateModel);
            } else {
                if (window.addEventListener) { //先执行W3C
                    element.addEventListener("input", updateModel, false);
                } else {
                    element.attachEvent("onpropertychange", updateModel);
                }
                if (window.VBArray && window.addEventListener) { //IE9
                    element.attachEvent("onkeydown", function(e) {
                        var key = e.keyCode;
                        if (key === 8 || key === 46) {
                            updateModel(); //处理回退与删除
                        }
                    });
                    element.attachEvent("oncut", updateModel); //处理粘贴
                }
            }

        } else if (type === "radio") {
            ok = true;
            updateView = function() {
                element.checked = model[name] === element.value;
            };
            $.bind(element, "click", updateModel); //IE6-8
        } else if (type === "checkbox") {
            ok = true;
            updateModel = function() {
                if (element.checked) {
                    $.Array.ensure(model[name], element.value);
                } else {
                    $.Array.remove(model[name], element.value);
                }
            };
            updateView = function() {
                element.checked = !!~model[name].indexOf(element.value);
            };
            $.bind(element, "click", updateModel); //IE6-8
        }
        Publish[ expando ] = updateView;
        updateView();
        delete Publish[ expando ];
    };
    modelBinding.SELECT = function(element, model, name) {
        var select = $(element);
        function updateModel() {
            model[name] = select.val();
        }
        function updateView() {
            select.val(model[name]);
        }
        $.bind(element, "change", updateModel);
        Publish[ expando ] = updateView;
        updateView();
        delete Publish[ expando ];
    };
    modelBinding.TEXTAREA = modelBinding.INPUT;
    /*********************************************************************
     *                    Collection                                    *
     **********************************************************************/

    //注意VBscript对象不会自动调用toString与valueOf方法
    function ObserverArray(list) {
        var collection = list.map(function(val) {
            return val && typeof val === "object" ? modelFactory(val) : val;
        });
        collection.$modelName = modleID();
        collection[subscribers] = [];
        String("push,pop,shift,unshift,splice,sort,reverse").replace($.rword, function(method) {
            var nativeMethod = collection[ method ];
            collection[ method ] = function() {
                var len = this.length;
                var ret = nativeMethod.apply(this, arguments);
                notifySubscribers(this, method, arguments, len);
                return ret;
            };
        });
        collection.clear = function() {
            this.length = 0;
            notifySubscribers(this, "clear", []);
            return this;
        };
        collection.sortBy = function(fn, scope) {
            var ret = $.Array.sortBy(this, fn, scope);
            notifySubscribers(this, "sort", []);
            return ret;
        };
        collection.ensure = function(el) {
            var len = this.length;
            var ret = $.Array.ensure(this, el);
            if (this.length > len) {
                notifySubscribers(this, "push", [el], len);
            }
            return ret;
        };
        collection.update = function() {//强制刷新页面
            notifySubscribers(this, "sort", []);
            return this;
        };
        collection.removeAt = function(index) {//移除指定索引上的元素
            this.splice(index, 1);
        };
        collection.remove = function(item) {//移除第一个等于给定值的元素
            var index = this.indexOf(item);
            if (index !== -1) {
                this.removeAt(index);
            }
        };
        return collection;
    }
    //http://msdn.microsoft.com/en-us/library/windows/apps/hh700774.aspx
    //http://msdn.microsoft.com/zh-cn/magazine/jj651576.aspx
    //http://api.rubyonrails.org/classes/ActiveModel/ObserverArray.html
    //Data bindings 数据／界面绑定
    //Compatibility 兼容其他
    //Extensibility 可扩充性
    //No direct DOM manipulations 不直接对DOM操作
    /*********************************************************************
     *                            Subscription                           *
     **********************************************************************/
    /*
     为简单起见，我们把双向绑定链分成三层， 顶层， 中层， 底层。顶层是updateView, updateListView等需要撷取底层的值来更新自身的局部刷新函数， 中层是监控数组与依赖于其他属性的计算监控属性，底层是监控属性。高层总是依赖于低层，但高层该如何知道它是依赖哪些底层呢？
     
     在emberjs中，作为计算监控属性的fullName通过property方法，得知自己是依赖于firstName, lastName。
     App.Person = Ember.Object.extend({
     firstName: null,
     lastName: null,
     
     fullName: function() {
     return this.get('firstName') +
     " " + this.get('lastName');
     }.property('firstName', 'lastName')
     });
     
     在knockout中，用了一个取巧方法，将所有要监控的属性转换为一个函数。当fullName第一次求值时，它将自己的名字放到一个地方X，值为一个数组。然后函数体内的firstName与lastName在自身求值时，也会访问X，发现上面有数组时，就放进去。当fullName执行完毕，就得知它依赖于哪个了，并从X删掉数组。
     var ViewModel = function(first, last) {
     this.firstName = ko.observable(first);
     this.lastName = ko.observable(last);
     
     this.fullName = ko.computed(function() {
     // Knockout tracks dependencies automatically. It knows that fullName depends on firstName and lastName, because these get called when evaluating fullName.
     return this.firstName() + " " + this.lastName();
     }, this);
     };
     详见 subscribables/observable.js subscribables/dependentObservable.js
     
     */
    //http://www.cnblogs.com/whitewolf/archive/2012/07/07/2580630.html

    function collectSubscribers(accessor) {//收集依赖于这个域的订阅者
        if (Publish[ expando ]) {
            var list = accessor[ subscribers ];
            list && $.Array.ensure(list, Publish[ expando ]); //只有数组不存在此元素才push进去
        }
    }
    function notifySubscribers(accessor) {//通知依赖于这个域的订阅者更新自身
        var list = accessor[ subscribers ];
        if (list && list.length) {
            var args = [].slice.call(arguments, 1);
            var safelist = list.concat();
            for (var i = 0, fn; fn = safelist[i++]; ) {
                if (typeof fn === "function") {
                    fn.apply(0, args); //强制重新计算自身
                }
            }
        }
    }
    // 比如视图刷新函数C依赖于firstName, lastName这两个访问器，当访问器更新时，就会通知C执行。
    // 因此firstName上有个subscribers列表，里面装着C， lastName同理
    // http://www.cnblogs.com/whitewolf/archive/2013/04/16/3024843.html
    /*********************************************************************
     *                            Model                                   *
     **********************************************************************/
    avalon.controller = function(name, obj) {
        if(arguments.length === 1){
            obj = name;
            name = "root";
        }
        if (avalon.models[name]) {
            $.error('已经存在"' + name + '" controller');
        } else {
            var model = modelFactory(obj);
            model.$modelName = name;
            return avalon.models[name] = model;
        }
    };
    /*********************************************************************
     *                           Scan                                     *
     **********************************************************************/
    //扫描整个DOM树,最开始是从某个元素节点扫起
    avalon.scan = function(elem){
        elem = elem || document.documentElement;
        var scopeName = elem.getAttribute(prefix+"app") || "root";
        var scope = avalon.models[scopeName];
        if(!scope){
            $.error("不存在此控制器{"+scopeName+"},请必须指定根控制器");
        }
        scanTag(elem, scope, [],  elem.ownerDocument || document); 
    }
    function scanTag(elem, scope, scopes, doc) {  
        scopes = scopes || [];
        var flags = {};
        scanAttr(elem, scope, scopes, flags); //扫描特点节点
        if (flags.stopBinding) {//是否要停止扫描
            return false;
        }
        if (flags.newScope) {//更换作用域， 复制父作用域堆栈，防止互相影响
            scopes = scopes.slice(0);
            scope = flags.newScope;
        }
        if (elem.canHaveChildren === false || !stopScan[elem.tagName]) {
            var textNodes = [];
            for (var node = elem.firstChild; node; node = node.nextSibling) {
                if (node.nodeType === 1) {
                    scanTag(node, scope, scopes, doc); //扫描元素节点
                } else if (node.nodeType === 3) {
                    textNodes.push(node);
                }
            }
            for (var i = 0; node = textNodes[i++]; ) {//延后执行
                scanText(node, scope, scopes, doc); //扫描文本节点
            }
        }
    }
    var stopScan = $.oneObject("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed,wbr,script,style".toUpperCase());
    //扫描元素节点中直属的文本节点，并进行抽取
    function scanText(textNode, scope, scopes, doc) {
        var bindings = extractTextBindings(textNode, doc);
        if (bindings.length) {
            executeBindings(bindings, scope, scopes);
        }
    }
    function scanExpr(value) {
        var tokens = [];
        if (hasExpr(value)) {
            //抽取{{ }} 里面的语句，并以它们为定界符，拆分原来的文本
            do {
                value = value.replace(regOpenTag, function(a, b) {
                    if (b) {
                        tokens.push({
                            value: b,
                            expr: false
                        });
                    }
                    return "";
                });
                value = value.replace(regCloseTag, function(a, b) {
                    if (b) {
                        var filters = [];
                        if (b.indexOf("|") > 0) {
                            b = b.replace(/\|\s*(\w+)\s*(\([^)]+\))?/g, function(c, d, e) {
                                filters.push(d + e);
                                return "";
                            });
                        }
                        tokens.push({
                            value: b,
                            expr: true,
                            filters: filters.length ? filters : void 0
                        });
                    }
                    return "";
                });
            } while (hasExpr(value));
            if (value) {
                tokens.push({
                    value: value,
                    expr: false
                });
            }
        }
        return tokens;
    }

    function scanAttr(el, scope, scopes, flags) {
        var bindings = [];
        for (var i = 0, attr; attr = el.attributes[i++]; ) {
            if (attr.specified) {
                var isBinding = false, remove = false;
                if (attr.name.indexOf(prefix) !== -1) {//如果是以指定前缀命名的
                    var type = attr.name.replace(prefix, "");
                    if (type.indexOf("-") > 0) {
                        var args = type.split("-");
                        type = args.shift();
                    }
                    remove = true;
                    isBinding = typeof bindingHandlers[type] === "function";
                } else if (bindingHandlers[attr.name] && hasExpr(attr.value)) {
                    type = attr.name; //如果只是普通属性，但其值是个插值表达式
                    isBinding = true;
                }
                if (isBinding) {
                    bindings.push({
                        type: type,
                        args: args,
                        element: el,
                        node: attr,
                        remove: remove,
                        value: attr.nodeValue
                    });
                }
                if (!flags.newScope && type === "controller") {//更换作用域
                    var temp = avalon.models[attr.value];
                    if (typeof temp === "object" && temp !== scope) {
                        scopes.unshift(scope);
                        flags.newScope = scope = temp;
                    }
                }
            }
        }
        executeBindings(bindings, scope, scopes, flags);
    }

    function executeBindings(bindings, scope, scopes, flags) {
        bindings.forEach(function(data) {
            bindingHandlers[data.type]($.mix({}, data), scope, scopes, flags);
            if (data.remove) {//移除数据绑定，防止被二次解析
                data.element.removeAttribute(data.node.name);
            }
        });
    }

    function extractTextBindings(textNode, doc) {
        var bindings = [], tokens = scanExpr(textNode.nodeValue);
        if (tokens.length) {
            var fragment = doc.createDocumentFragment();
            while (tokens.length) {//将文本转换为文本节点，并替换原来的文本节点
                var token = tokens.shift();
                var node = doc.createTextNode(token.value);
                if (token.expr) {
                    bindings.push({
                        type: "text",
                        node: node,
                        element: textNode.parentNode,
                        value: token.value,
                        filters: token.filters
                    }); //收集带有插值表达式的文本
                }
                fragment.appendChild(node);
            }
            textNode.parentNode.replaceChild(fragment, textNode);
        }
        return bindings;
    }
    /*********************************************************************
     *                           parse                                    *
     **********************************************************************/
    var regEscape = /([-.*+?^${}()|[\]\/\\])/g;
    function escapeRegExp(target) {
        //将字符串安全格式化为正则表达式的源码
        return target.replace(regEscape, "\\$1");
    }
    var isStrict = (function() {
        return !this;
    })();
    function insertScopeNameBeforeVariableName(e, text, scopeList, names, args, random) {
        var ok = false;
        if (window.dispatchEvent) {//判定是否IE9-11或者为标准浏览器
            ok = e instanceof ReferenceError;
        } else {
            ok = e instanceof TypeError;
        }
        //opera9.61
        //message: Statement on line 810: Undefined variable: nickName
        //opera12
        //Undefined variable: nickName
        //safari 5
        //Can't find variable: nickName
        //firefox3-20  chrome
        //ReferenceError: nickName is not defined
        //IE10
        //“nickName”未定义 
        //IE6 
        //'eee' 未定义 
        if (ok) {
            if (window.opera) {
                var varName = e.message.split("Undefined variable: ")[1];
            } else {
                varName = e.message.replace("Can't find variable: ", "")
                        .replace("“", "").replace("'", "");
            }
            varName = (varName.match(/^[\w$]+/) || [""])[0]; //取得未定义的变量名
            for (var i = 0, scope; scope = scopeList[i++]; ) {
                if (scope.hasOwnProperty(varName)) {
                    var modelName = scope.$modelName + random;
                    if (names.indexOf(modelName) === -1) {
                        names.push(modelName);
                        args.push(scope);
                    }
                    //这里实际还要做更严格的处理
                    var reg = new RegExp("(^|[^\\w\\u00c0-\\uFFFF_])(" + escapeRegExp(varName) + ")($|[^\\w\\u00c0-\\uFFFF_])", "g");
                    return  text.replace(reg, function(a, b, c, d) {
                        return b + modelName + "." + c + d; //添加作用域
                    });
                }
            }

        }
    }
    var doubleQuotedString = /"([^\\"\n]|\\.)*"/g;
    var singleQuotedString = /'([^\\'\n]|\\.)*'/g;
    function parseExpr(text, scopeList, data) {
        var names = [], args = [], random = new Date - 0, val;
        if (isStrict) {
            //取得模块的名字
            scopeList.forEach(function(scope) {
                var scopeName = scope.$modelName + random;
                if (names.indexOf(scopeName) === -1) {
                    names.push(scopeName);
                    args.push(model);
                }
            });
            text = "var ret" + random + " = " + text + "\r\n";
            for (var i = 0, name; name = names[i++]; ) {
                text = "with(" + name + "){\r\n" + text + "\r\n}\r\n";
            }
        } else {
            var single = random + 1;
            var double = single + 1;
            var singleHolder = [];
            var doubleHolder = [];
            var loop = true;
            //抽取掉所有字符串
            text = text.replace(singleQuotedString, function(a) {
                singleHolder.push(a);
                return single;
            }).replace(doubleQuotedString, function(b) {
                doubleHolder.push(b);
                return double;
            });
            do {//开始循环
                try {
                    var fn = Function.apply(Function, names.concat("return " + text));
                    var val = fn.apply(fn, args);
                    loop = false;
                } catch (e) {
                    text = insertScopeNameBeforeVariableName(e, text, scopeList, names, args, random);
                    loop = typeof text === "string";
                }
            } while (loop);
            if (text) {
                if (singleHolder.length) {
                    text = text.replace(new RegExp(single, "g"), function() {
                        return singleHolder.shift();
                    });
                }
                if (doubleHolder.length) {
                    text = text.replace(new RegExp(double, "g"), function() {
                        return doubleHolder.shift();
                    });
                }
                text = "var ret" + random + " = " + text;
            } else {
                data.compileFn = function() {
                    return "";
                };
                return "";
            }
        }
        if (data.filters) {
            var textBuffer = [], fargs;
            textBuffer.push(text, "\r\n");
            for (var i = 0, f; f = data.filters[i++]; ) {
                var start = f.indexOf("(");
                if (start !== -1) {
                    fargs = f.slice(start + 1, f.lastIndexOf(")")).trim();
                    fargs = "," + fargs;
                    f = f.slice(0, start).trim();
                } else {
                    fargs = "";
                }
                textBuffer.push(" if(filters", random, ".", f, "){\r\n\ttry{ret", random,
                        " = filters", random, ".", f, "(ret", random, fargs, ")}catch(e){};\r\n}\r\n");
            }
            text = textBuffer.join("");
            names.push("filters" + random);
            args.push(avalon.filters);
            delete data.filters; //释放内存
        }
        data.compileArgs = args;
        try {
            text += "\r\nreturn ret" + random;
            var fn = Function.apply(Function, names.concat(text));
            val = fn.apply(fn, args);
            data.compileFn = fn; //缓存,防止二次编译
        } catch (e) {
            data.compileFn = function() {
                return "";
            };
            val = "";
        }
        textBuffer = names = null; //释放内存
        return val;
    }
    //==================================================================
    var defineProperty = Object.defineProperty;
    try {
        defineProperty(avalon, "_", {
            value: "x"
        });
        var defineProperties = Object.defineProperties;
    } catch (e) {
        if ("__defineGetter__" in avalon) {
            defineProperty = function(obj, prop, desc) {
                if ('value' in desc) {
                    obj[prop] = desc.value;
                }
                if ('get' in desc) {
                    obj.__defineGetter__(prop, desc.get);
                }
                if ('set' in desc) {
                    obj.__defineSetter__(prop, desc.set);
                }
                return obj;
            };
            defineProperties = function(obj, descs) {
                for (var prop in descs) {
                    if (descs.hasOwnProperty(prop)) {
                        defineProperty(obj, prop, descs[prop]);
                    }
                }
                return obj;
            };
        }
    }
    if (!defineProperties && window.VBArray) {
        window.execScript([
            "Function parseVB(code)",
            "\tExecuteGlobal(code)",
            "End Function"
        ].join("\n"), "VBScript");
        function mediatorVB(descs, name, value) {
            var fn = descs[name] && descs[name].set;
            if (arguments.length === 3) {
                fn(value);
            } else {
                var ret = fn()
                return ret;
            }
        }
        function definePropertiesVB(object, attrs, delay) {
            var more = (delay || []).concat();
            if (more.indexOf("hasOwnProperty") === -1) {
                more.push("hasOwnProperty");
            }
            if (more.indexOf("$modelName") === -1) {
                more.push("$modelName");
            }
            var className = "VBClass" + setTimeout("1"), owner = {}, buffer = [];
            buffer.push(
                    "Class " + className,
                    "\tPrivate [__data__], [__proxy__]",
                    "\tPublic Default Function [__const__](d, p)",
                    "\t\tSet [__data__] = d: set [__proxy__] = p",
                    "\t\tSet [__const__] = Me", //链式调用
                    "\tEnd Function");
            more.forEach(function(prop) {//添加公共属性,越多越好,因为VBScript对象不能像JS那样添加属性
                owner[prop] = true;
                buffer.push("\tPublic [" + prop + "]");
            });
            attrs.forEach(function(attr) {
                owner[attr] = true;// [__proxy__]([__data__], \"" + attr + "\", val)",
                buffer.push(
                        //由于不知对方会传入什么,因此set, let都用上
                        "\tPublic Property Let [" + attr + "](val)", //setter
                        "\t\tCall [__proxy__]([__data__], \"" + attr + "\", val)",
                        "\tEnd Property",
                        "\tPublic Property Set [" + attr + "](val)", //setter
                        "\t\tCall [__proxy__]([__data__], \"" + attr + "\", val)",
                        "\tEnd Property",
                        "\tPublic Property Get [" + attr + "]", //getter
                        "\tOn Error Resume Next", //必须优先使用set语句,否则它会误将数组当字符串返回
                        "\t\tSet[" + attr + "] = [__proxy__]([__data__],\"" + attr + "\")",
                        "\tIf Err.Number <> 0 Then",
                        "\t\t[" + attr + "] = [__proxy__]([__data__],\"" + attr + "\")",
                        "\tEnd If",
                        "\tOn Error Goto 0",
                        "\tEnd Property");
            });
            buffer.push("End Class");//类定义完毕
            buffer.push(
                    "Function " + className + "Factory(a, b)", //创建实例并传入两个关键的参数
                    "\tDim o",
                    "\tSet o = (New " + className + ")(a, b)",
                    "\tSet " + className + "Factory = o",
                    "End Function");
            // $.log(buffer.join("\r\n"));
            window.parseVB(buffer.join("\r\n"));
            var model = window[className + "Factory"](object, mediatorVB);
            model.hasOwnProperty = function(name) {
                return owner[name] === true;
            };
            return model;
        }
    }

    function modelFactory(scope) {
        var fns = [], descs = {}, props = [], model = {}, skipCall = {};
        $.each(scope, function(name, value) {
            if (typeof value === "function") {
                fns.push(name);
            } else {
                props.push(name);
                var accessor, oldValue, oldArgs;
                if (typeof value === "object" && typeof value.get === "function"
                        && Object.keys(value).length <= 2) {
                    skipCall[name] = true;//这个不用立即赋值
                    accessor = function(neo) {//创建访问器
                        if (arguments.length) {
                            if (typeof value.set === "function") {
                                value.set.call(model, neo);
                            }
                            if (oldArgs !== neo) {
                                oldArgs = neo;
                                notifySubscribers(accessor); //通知顶层改变
                            }
                        } else {
                            var flagDelete = false;
                            if (!accessor[accessor]) {
                                flagDelete = true;
                                Publish[ expando ] = function() {
                                    notifySubscribers(accessor);//通知顶层改变
                                };
                                accessor[accessor] = [];
                            }
                            if (typeof value.get === "function") {
                                oldValue = value.get.call(model);
                            }
                            if (flagDelete) {
                                delete Publish[ expando ];
                            }
                            return oldValue;
                        }
                    };
                } else {
                    accessor = function(neo) {//创建访问器
                        if (arguments.length) {
                            if (oldValue !== neo) {
                                if (typeof neo === "object") {
                                    if (Array.isArray(neo)) {
                                        neo = ObserverArray(neo)
                                    } else {
                                        neo = modelFactory(neo)
                                    }
                                }
                                oldValue = neo;
                                notifySubscribers(accessor); //通知顶层改变
                            }
                        } else {
                            collectSubscribers(accessor);//收集视图函数
                            return oldValue;
                        }
                    };
                    accessor[subscribers] = [];
                }
                descs[name] = {
                    set: accessor,
                    get: accessor,
                    enumerable: true
                };
            }
        });
        if (defineProperties) {
            defineProperties(model, descs);
        } else {
            model = definePropertiesVB(descs, props, fns);
        }
        fns.forEach(function(name) {
            var fn = scope[name];
            model[name] = function() {
                return  fn.apply(model, arguments);
            };
            model[name].toString = function() {
                return fn + "";//还原toString，方便调试
            };
        });
        //现在model只是个空对象，需要给它赋值
        props.forEach(function(prop) {
            if (!skipCall[prop]) {//除了函数与指定了setter, getter的属性都在这里先赋值
                model[prop] = scope[prop];
            }
        });
        return model;
    }
    return $;
//    var model = modelFactory({
//        firstName: "ddddd",
//        lastName: "xxx",
//        namelist: [5, 6, 4, 7, 8, 9],
//        user: {name: "司徒正美", ooo: {xxx: "999"}},
//        getName: function() {
//            return this.firstName;
//        },
//        fullName: {
//            set: function(val) {
//                var array = (val || "").split(" ");
//                this.firstName = array[0] || "";
//                this.lastName = array[1] || "";
//            },
//            get: function() {
//                return this.firstName + " " + this.lastName;
//            }
//        }
//    });

//    scanTag(document.body, model, [], document);
//    setTimeout(function() {
//        model.firstName = "setTimeout";
//        model.user.name = "eee"
//    }, 2000);
//    setTimeout(function() {
//        model.namelist.splice(2, 4, "T", "O", "P")
//        model.user = {name: "uuu",ooo: {xxx: "nnn"}}
//    }, 3000);
//     setTimeout(function() {
//        model.namelist.reverse()
//      
//    }, 5000);
});
//数组与函数及其他延后处理
                 //    var model = $.model("app", {
//        firstName: "姓氏",
//        lastName: "名字",
//        array: "ABCDEFGHIJK".split(""),
////        select: "test1",
////        color: "green",
////        vehicle: ["car"],
////        bool: false,
////        user: {
////            name: "userName"
////        },
//        nickName: function() {
//            return this.firstName + "!!!!!!";
//        },

//    });
//    $.model("son", {
//        firstName: "yyyy"
//    });
//    $.model("aaa", {
//        firstName: "6666"
//    });
//                    