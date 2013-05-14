//=========================================
// 语言扩展模块v6 by 司徒正美
//=========================================
define("lang", /native code/.test(Array.isArray) ? ["mass"] : ["lang_fix"], function($) {
    var global = this,
            seval = global.execScript ? "execScript" : "eval",
            rformat = /\\?\#{([^{}]+)\}/gm,
            sopen = (global.open + '').replace(/open/g, ""),
            defineProperty = Object.defineProperty;

    function method(obj, name, val) {
        if (!obj[name]) {
            defineProperty(obj, name, {
                configurable: true,
                enumerable: false,
                writable: true,
                value: val
            });
        }
    }
    //IE8的Object.defineProperty只对DOM有效
    try {
        defineProperty({}, 'a', {
            get: function() {
            }
        });
        $.supportDefineProperty = true;
    } catch (e) {
        method = function(obj, name, method) {
            if (!obj[name]) {
                obj[name] = method;
            }
        };
    }

    function methods(obj, map) {
        for (var name in map) {
            method(obj, name, map[name]);
        }
    }
    var tools = {
        /**
         * 判定是否是一个朴素的javascript对象（Object或JSON），不是DOM对象，不是BOM对象，不是自定义类的实例。
         * @param {Object} obj
         * @return {Boolean}
         */
        isPlainObject: function(obj) {
            if (!$.type(obj, "Object") || $.isNative("reload", obj)) {
                return false;
            }
            try { //不存在hasOwnProperty方法的对象肯定是IE的BOM对象或DOM对象
                for (var key in obj) //只有一个方法是来自其原型立即返回flase
                    if (!Object.prototype.hasOwnProperty.call(obj, key)) { //不能用obj.hasOwnProperty自己查自己
                        return false;
                    }
            } catch (e) {
                return false;
            }
            return true;
        },
        /**
         * 判定method是否为obj的原生方法，如$.isNative("JSON",window)
         * @param {Function} method
         * @param {Any} obj 对象
         * @return {Boolean}
         */
        isNative: function(method, obj) {
            var m = obj ? obj[method] : false,
                    r = new RegExp(method, "g");
            return !!(m && typeof m != "string" && sopen === (m + "").replace(r, ""));
        },
        /**
         * 是否为空对象
         * @param {Object} obj
         * @return {Boolean}
         */
        isEmptyObject: function(obj) {
            for (var i in obj) {
                return false;
            }
            return true;
        },
        /**
         * 是否为类数组（Array, Arguments, NodeList与拥有非负整数的length属性的Object对象）
         * 如果第二个参数为true,则包含有字符串
         * @param {Object} obj
         * @param {Boolean} includeString
         * @return {Boolean}
         */
        isArrayLike: function(obj, includeString) { //是否包含字符串
            var type = $.type(obj);
            if (type === "Array" || type === "Arguments" || type === "NodeList" || includeString && type === "String") {
                return true;
            }
            if (type === "Object") {
                var i = obj.length;
                return (i >= 0) && (i % 1 === 0) && obj.hasOwnProperty("0"); //非负整数
            }
            return false;
        },
        isFunction: function(fn) {//为了性能起见,没有走$.type方法
            return "[object Function]" === tools.toString.call(fn)
        },
        isArray: Array.isArray, //Array.isArray已在lang_fix中被修复
        /**
         * 取得对象的键值对，依次放进回调中执行,并收集其结果，视第四个参数的真伪表现为可中断的forEach操作或map操作
         * @param {Object} obj
         * @param {Function} fn
         * @param {Any} scope ? 默认为当前遍历的元素或属性值
         * @param {Boolean} map ? 是否表现为map操作
         * @return {Object|Array}
         */
        each: function(obj, fn, scope, map) {
            var value, i = 0,
                    isArray = $.isArrayLike(obj),
                    ret = [];
            if (isArray) {
                for (var n = obj.length; i < n; i++) {
                    value = fn.call(scope || obj[i], i, obj[i]);
                    if (map) {
                        if (value != null) {
                            ret[ ret.length ] = value;
                        }
                    } else if (value === false) {
                        break;
                    }
                }
            } else {
                for (i in obj) {
                    value = fn.call(scope || obj[i], i, obj[i]);
                    if (map) {
                        if (value != null) {
                            ret[ ret.length ] = value;
                        }
                    } else if (value === false) {
                        break;
                    }
                }
            }
            return map ? ret : obj;
        },
        /**
         * 取得对象的键值对，依次放进回调中执行,并收集其结果，以数组形式返回。
         * @param {Object} obj
         * @param {Function} fn
         * @param {Any} scope ? 默认为当前遍历的元素或属性值
         * @return {Array}
         */
        map: function(obj, fn, scope) {
            return $.each(obj, fn, scope, true);
        },
        /**
         * 过滤数组中不合要求的元素
         * @param {Object} obj
         * @param {Function} fn 如果返回true则放进结果集中
         * @param {Any} scope ? 默认为当前遍历的元素或属性值
         * @return {Array}
         */
        filter: function(obj, fn, scope) {
            for (var i = 0, n = obj.length, ret = []; i < n; i++) {
                var val = fn.call(scope || obj[i], obj[i], i);
                if (!!val) {
                    ret[ret.length] = obj[i];
                }
            }
            return ret;
        },
        /**
         * 字符串插值，有两种插值方法。
         * 第一种，第二个参数为对象，#{}里面为键名，替换为键值，适用于重叠值够多的情况
         * 第二种，把第一个参数后的参数视为一个数组，#{}里面为索引值，从零开始，替换为数组元素
         * http://www.cnblogs.com/rubylouvre/archive/2011/05/02/1972176.html
         * @param {String}
         * @param {Object|Any} 插值包或某一个要插的值
         * @return {String}
         */
        format: function(str, object) {
            var array = $.slice(arguments, 1);
            return str.replace(rformat, function(match, name) {
                if (match.charAt(0) === "\\")
                    return match.slice(1);
                var index = Number(name);
                if (index >= 0)
                    return array[index];
                if (object && object[name] !== void 0)
                    return object[name];
                return '';
            });
        },
        /**
         * 生成一个整数数组
         * @param {Number} start ? 默认为0
         * @param {Number} end ? 默认为0
         * @param {Number} step ? 默认为1
         * @return {Array}
         */
        range: function(start, end, step) {
            step || (step = 1);
            if (end == null) {
                end = start || 0;
                start = 0;
            }
            var index = -1,
                    length = Math.max(0, Math.ceil((end - start) / step)),
                    result = Array(length);

            while (++index < length) {
                result[index] = start;
                start += step;
            }
            return result;
        },
        /**
         * 为字符串两端添上双引号,并对内部需要转义的地方进行转义
         * @param {String} str
         * @return {String}
         */
        quote: String.quote || JSON.stringify,
        /**
         * 查看对象或数组的内部构造
         * @param {Any} obj
         * @return {String}
         * https://github.com/tdolsen/jquery-dump/blob/master/jquery.dump.js
         * https://github.com/Canop/JSON.prune/blob/master/JSON.prune.js
         * http://freshbrewedcode.com/jimcowart/2013/01/29/what-you-might-not-know-about-json-stringify/
         */
        dump: function(obj) {
            var space = $.isNative("parse", window.JSON) ? 4 : "\r\t", cache = [],
                    text = JSON.stringify(obj, function(key, value) {
                if (typeof value === 'object' && value !== null) {//防止环引用
                    if (cache.indexOf(value) !== -1) {
                        return;
                    }
                    cache.push(value);
                }
                return typeof value === "function" ? value + "" : value;
            }, space);
            cache = [];//GC回收
            return text;
        },
        /**
         * 将字符串当作JS代码执行
         * @param {String} code
         */
        parseJS: function(code) {
            //IE中，global.eval()和eval()一样只在当前作用域生效。
            //Firefox，Safari，Opera中，直接调用eval()为当前作用域，global.eval()调用为全局作用域。
            //window.execScript 在IE下一些限制条件
            //http://www.ascadnetworks.com/Guides-and-Tips/IE-error-%2522Could-not-complete-the-operation-due-to-error-80020101%2522
            if (code && /\S/.test(code)) {
                try {
                    global[seval](code);
                } catch (e) {
                }
            }
        },
        /**
         * 将字符串解析成JSON对象
         * @param {String} data
         * @return {JSON}
         */
        parseJSON: function(data) {
            try {
                return global.JSON.parse(data.trim());
            } catch (e) {
                $.error("Invalid JSON: " + data, TypeError);
            }
        },
        /**
         * 将字符串解析成XML文档对象
         * @param {String} data
         * @return {XML}
         * @example
         <courses>
         <math>
         <time>1:00pm</time>
         </math>
         <math>
         <time>3:00pm</time>
         </math>
         <phisic>
         <time>1:00pm</time>
         </phisic>
         <phisic>
         <time>3:00pm</time>
         </phisic>
         </courses>
         */
        parseXML: function(data, xml, tmp) {
            try {
                var mode = document.documentMode
                if (global.DOMParser && (!mode || mode > 8)) { // Standard
                    tmp = new DOMParser();
                    xml = tmp.parseFromString(data, "text/xml");
                } else { // IE
                    xml = new ActiveXObject("Microsoft.XMLDOM"); //"Microsoft.XMLDOM"
                    xml.async = "false";
                    xml.loadXML(data);
                }
            } catch (e) {
                xml = undefined;
            }
            if (!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) {
                $.error("Invalid XML: " + data, TypeError);
            }
            return xml;
        }

    }
    $.mix(tools, false);

    methods(String.prototype, {
        repeat: function(n) {
            //将字符串重复n遍
            var result = "",
                    target = this;
            while (n > 0) {
                if (n & 1)
                    result += target;
                target += target;
                n >>= 1;
            }
            return result;
        },
        startsWith: function(str) {
            //判定是否以给定字符串开头
            return this.indexOf(str) === 0;
        },
        endsWith: function(str) {
            //判定是否以给定字符串结尾
            return this.lastIndexOf(str) === this.length - str.length;
        },
        contains: function(s, position) {
            //判断一个字符串是否包含另一个字符
            return ''.indexOf.call(this, s, position >> 0) !== -1;
        }
    });
    //构建四个工具方法:$.String, $.Array, $.Number, $.Object
    "String,Array,Number,Object".replace($.rword, function(Type) {
        $[Type] = function(pack) {
            var isNative = typeof pack == "string",
                    //取得方法名
                    methods = isNative ? pack.match($.rword) : Object.keys(pack);
            methods.forEach(function(method) {
                $[Type][method] = isNative ?
                        function(obj) {
                            return obj[method].apply(obj, $.slice(arguments, 1));
                        } : pack[method];
            });
        }
    });
    $.String({
        byteLen: function(target, fix) {
            /**取得一个字符串所有字节的长度。这是一个后端过来的方法，如果将一个英文字符插
             *入数据库 char、varchar、text 类型的字段时占用一个字节，而一个中文字符插入
             *时占用两个字节，为了避免插入溢出，就需要事先判断字符串的字节长度。在前端，
             *如果我们要用户填空的文本，需要字节上的长短限制，比如发短信，也要用到此方法。
             *随着浏览器普及对二进制的操作，这方法也越来越常用。
             */
            fix = fix ? fix: 2;
            var str = new Array(fix+1).join("-")
            return target.replace(/[^\x00-\xff]/g, str).length;
        },
        truncate: function(target, length, truncation) {
            //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
            length = length || 30;
            truncation = truncation === void(0) ? "..." : truncation;
            return target.length > length ? target.slice(0, length - truncation.length) + truncation : String(target);
        },
        camelize: function(target) {
            //转换为驼峰风格
            if (target.indexOf("-") < 0 && target.indexOf("_") < 0) {
                return target; //提前判断，提高getStyle等的效率
            }
            return target.replace(/[-_][^-_]/g, function(match) {
                return match.charAt(1).toUpperCase();
            });
        },
        underscored: function(target) {
            //转换为下划线风格
            return target.replace(/([a-z\d])([A-Z]+)/g, "$1_$2").replace(/\-/g, "_").toLowerCase();
        },
        capitalize: function(target) {
            //首字母大写
            return target.charAt(0).toUpperCase() + target.substring(1).toLowerCase();
        },
        stripTags: function(target) {
            //移除字符串中的html标签，但这方法有缺陷，如里面有script标签，会把这些不该显示出来的脚本也显示出来了
            return target.replace(/<[^>]+>/g, "");
        },
        stripScripts: function(target) {
            //移除字符串中所有的 script 标签。弥补stripTags方法的缺陷。此方法应在stripTags之前调用。
            return target.replace(/<script[^>]*>([\S\s]*?)<\/script>/img, '');
        },
        escapeHTML: function(target) {
            //将字符串经过 html 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt;
            return target.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        },
        unescapeHTML: function(target) {
            //还原为可被文档解析的HTML标签
            return target.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&") //处理转义的中文和实体字符
                    .replace(/&#([\d]+);/g, function($0, $1) {
                return String.fromCharCode(parseInt($1, 10));
            });
        },
        escapeRegExp: function(target) {
            //http://stevenlevithan.com/regex/xregexp/
            //将字符串安全格式化为正则表达式的源码
            return(target + "").replace(/([-.*+?^${}()|[\]\/\\])/g, "\\$1");
        },
        pad: function(target, n, filling, right, radix) {
            //http://www.cnblogs.com/rubylouvre/archive/2010/02/09/1666165.html
            //在左边补上一些字符,默认为0
            var num = target.toString(radix || 10);
            filling = filling || "0";
            while (num.length < n) {
                if (!right) {
                    num = filling + num;
                } else {
                    num += filling;
                }
            }
            return num;
        }
    });
    //字符串的原生原型方法
    $.String("charAt,charCodeAt,concat,indexOf,lastIndexOf,localeCompare,match," + "contains,endsWith,startsWith,repeat," + //es6
            "replace,search,slice,split,substring,toLowerCase,toLocaleLowerCase,toUpperCase,trim,toJSON")
    $.Array({
        contains: function(target, item) {
            //判定数组是否包含指定目标。
            return !!~target.indexOf(item);
        },
        removeAt: function(target, index) {
            //移除数组中指定位置的元素，返回布尔表示成功与否。
            return !!target.splice(index, 1).length
        },
        remove: function(target, item) {
            //移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否。
            var index = target.indexOf(item);
            if (~index)
                return $.Array.removeAt(target, index);
            return false;
        },
        shuffle: function(target) {
            //对数组进行洗牌。若不想影响原数组，可以先拷贝一份出来操作。
            var ret = [],
                    i = target.length,
                    n;
            target = target.slice(0);
            while (--i >= 0) {
                n = Math.floor(Math.random() * i);
                ret[ret.length] = target[n];
                target[n] = target[i];
            }
            return ret;
        },
        random: function(target) {
            //从数组中随机抽选一个元素出来。
            return target[Math.floor(Math.random() * target.length)];
        },
        flatten: function(target) {
            //对数组进行平坦化处理，返回一个一维的新数组。
            var result = [],
                    self = $.Array.flatten;
            target.forEach(function(item) {
                if (Array.isArray(item)) {
                    result = result.concat(self(item));
                } else {
                    result.push(item);
                }
            });
            return result;
        },
        compact: function(target) {
            // 过滤数组中的null与undefined，但不影响原数组。
            return target.filter(function(el) {
                return el != null;
            });
        },
        sortBy: function(target, fn, scope) {
            //根据指定条件进行排序，通常用于对象数组。
            var array = target.map(function(item, index) {
                return {
                    el: item,
                    re: fn.call(scope, item, index)
                };
            }).sort(function(left, right) {
                var a = left.re,
                        b = right.re;
                return a < b ? -1 : a > b ? 1 : 0;
            });
            return $.Array.pluck(array, 'el');
        },
        pluck: function(target, name) {
            //取得对象数组的每个元素的指定属性，组成数组返回。
            return target.filter(function(item) {
                return item[name] != null;
            });
        },
        unique: function(target) {
            // 对数组进行去重操作，返回一个没有重复元素的新数组。
            var ret = [],
                    n = target.length,
                    i, j; //by abcd
            for (i = 0; i < n; i++) {
                for (j = i + 1; j < n; j++)
                    if (target[i] === target[j])
                        j = ++i;
                ret.push(target[i]);
            }
            return ret;
        },
        merge: function(first, second) {
            //合并参数二到参数一
            var i = ~~first.length,
                    j = 0;
            for (var n = second.length; j < n; j++) {
                first[i++] = second[j];
            }
            first.length = i;
            return first;
        },
        union: function(target, array) {
            //对两个数组取并集。
            return $.Array.unique($.Array.merge(target, array));
        },
        intersect: function(target, array) {
            //对两个数组取交集
            return target.filter(function(n) {
                return ~array.indexOf(n);
            });
        },
        diff: function(target, array) {
            //对两个数组取差集(补集)
            var result = target.slice();
            for (var i = 0; i < result.length; i++) {
                for (var j = 0; j < array.length; j++) {
                    if (result[i] === array[j]) {
                        result.splice(i, 1);
                        i--;
                        break;
                    }
                }
            }
            return result;
        },
        min: function(target) {
            //返回数组中的最小值，用于数字数组。
            return Math.min.apply(0, target);
        },
        max: function(target) {
            //返回数组中的最大值，用于数字数组。
            return Math.max.apply(0, target);
        },
        clone: function(target) {
            //深拷贝当前数组
            var i = target.length,
                    result = [];
            while (i--)
                result[i] = cloneOf(target[i]);
            return result;
        },
        ensure: function(target, el) {
            //只有当前数组不存在此元素时只添加它
            if (!~target.indexOf(el)) {
                target.push(el);
            }
            return target;
        },
        inGroupsOf: function(target, number, fillWith) {
            //将数组划分成N个分组，其中小组有number个数，最后一组可能小于number个数,
            //但如果第三个参数不为undefine时,我们可以拿它来填空最后一组
            var t = target.length,
                    n = Math.ceil(t / number),
                    fill = fillWith !== void 0,
                    groups = [],
                    i, j, cur
            for (i = 0; i < n; i++) {
                groups[i] = [];
                for (j = 0; j < number; j++) {
                    cur = i * number + j;
                    if (cur === t) {
                        if (fill) {
                            groups[i][j] = fillWith;
                        }
                    } else {
                        groups[i][j] = target[cur];
                    }
                }
            }
            return groups;
        }
    });
    $.Array("concat,join,pop,push,shift,slice,sort,reverse,splice,unshift," + "indexOf,lastIndexOf,every,some,filter,reduce,reduceRight")
    var NumberPack = {
        limit: function(target, n1, n2) {
            //确保数值在[n1,n2]闭区间之内,如果超出限界,则置换为离它最近的最大值或最小值
            var a = [n1, n2].sort();
            if (target < a[0])
                target = a[0];
            if (target > a[1])
                target = a[1];
            return target;
        },
        nearer: function(target, n1, n2) {
            //求出距离指定数值最近的那个数
            var diff1 = Math.abs(target - n1),
                    diff2 = Math.abs(target - n2);
            return diff1 < diff2 ? n1 : n2
        },
        round: function(target, base) {
            //http://www.cnblogs.com/xiao-yao/archive/2012/09/11/2680424.html
            if (base) {
                base = Math.pow(10, base);
                return Math.round(target * base) / base;
            } else {
                return Math.round(target);
            }
        }
    }
    "abs,acos,asin,atan,atan2,ceil,cos,exp,floor,log,pow,sin,sqrt,tan".replace($.rword, function(name) {
        NumberPack[name] = Math[name];
    });
    $.Number(NumberPack);
    $.Number("toFixed,toExponential,toPrecision,toJSON")

    function cloneOf(item) {
        var name = $.type(item);
        switch (name) {
            case "Array":
            case "Object":
                return $[name].clone(item);
            default:
                return item;
        }
    }


    function mergeOne(source, key, current) {
        //使用深拷贝方法将多个对象或数组合并成一个
        if ($.isPlainObject(source[key])) { //只处理纯JS对象，不处理window与节点
            $.Object.merge(source[key], current);
        } else {
            source[key] = cloneOf(current)
        }
        return source;
    }
    ;

    $.Object({
        subset: function(target, props) {
            //根据传入数组取当前对象相关的键值对组成一个新对象返回
            var result = {};
            props.forEach(function(prop) {
                result[prop] = target[prop];
            });
            return result;
        },
        //将参数一的键值都放入回调中执行，如果回调返回false中止遍历
        forEach: function(obj, fn) {
            Object.keys(obj).forEach(function(name) {
                fn(obj[name], name)
            })
        },
        //将参数一的键值都放入回调中执行，收集其结果返回
        map: function(obj, fn) {
            return  Object.keys(obj).map(function(name) {
                return fn(obj[name], name)
            })
        },
        clone: function(target) {
            //进行深拷贝，返回一个新对象，如果是浅拷贝请使用$.mix
            var clone = {};
            for (var key in target) {
                clone[key] = cloneOf(target[key]);
            }
            return clone;
        },
        merge: function(target, k, v) {
            //将多个对象合并到第一个参数中或将后两个参数当作键与值加入到第一个参数
            var obj, key;
            //为目标对象添加一个键值对
            if (typeof k === "string")
                return mergeOne(target, k, v);
            //合并多个对象
            for (var i = 1, n = arguments.length; i < n; i++) {
                obj = arguments[i];
                for (key in obj) {
                    if (obj[key] !== void 0) {
                        mergeOne(target, key, obj[key]);
                    }
                }
            }
            return target;
        }
    });
    $.Object("hasOwnerProperty,isPrototypeOf,propertyIsEnumerable");
    return $
});
/**
 changlog:
 2011.7.12 将toArray转移到lang模块下
 2011.7.26 去掉toArray方法,添加globalEval,parseJSON,parseXML方法
 2011.8.6  增加tag方法
 2011.8.14 更新隐藏的命名空间,重构range方法,将node模块的parseHTML方法移到此处并大幅强化
 2011.8.16 $.String2,$.Number2,$.Array2,$.Object2,globalEval 更名为$.String,$.Number,$.Array,$.Object,parseJS
 2011.8.18 $.Object.merge不再设置undefined的值
 2011.8.28 重构Array.unique
 2011.9.11 重构$.isArray $.isFunction
 2011.9.16 修复$.format BUG
 2011.10.2 优化$.lang
 2011.10.3 重写$.isPlainObject与jQuery的保持一致, 优化parseJS，
 2011.10.4 去掉array.without（功能与array.diff相仿），更改object.widthout的参数
 2011.10.6 使用位反操作代替 === -1, 添加array.intersect,array.union
 2011.10.16 添加返回值
 2011.10.21 修复Object.keys BUG
 2011.10.26 优化quote ;将parseJSON parseXML中$.log改为$.error; FIX isPlainObject BUG;
 2011.11.6 对parseXML中的IE部分进行强化
 2011.12.22 修正命名空间
 2012.1.17 添加dump方法
 2012.1.20 重构$.String, $.Array, $.Number, $.Object, 让其变成一个函数v3
 2012.1.27 让$$.String等对象上的方法全部变成静态方法
 2012.3.17 v4 重构语言链对象
 2012.5.21 添加$.Array.each方法,重构$.Object.each与$.each方法;
 2012.6.5 更新camelize，escapeHTML, unescapeHTML,stripTags,stripScripts,wbr方法 v4
 2012.6.29 去掉last first
 2012.7.31 添加$.Array.merge API
 2012.8.15 添加$.Array.ensure, $.Array.inGroupsOf
 2012.12.25 移除语言链对象，添加EventTarget对象 v5
 2013.1.6 移除throttle，debounce,tag等不常用的方法，重构each, map方法
 键盘控制物体移动 http://www.wushen.biz/move/
 https://github.com/tristen/tablesort
 https://gist.github.com/395070
 */