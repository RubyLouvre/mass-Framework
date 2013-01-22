//=========================================
// 语言扩展模块v6 by 司徒正美
//=========================================
define("lang", Array.isArray ? ["mass"] : ["$lang_fix"], function($) {
    var global = this,
    // JSON RegExp
    rvalidchars = /^[\],:{}\s]*$/,
    rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
    rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,
    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    runicode = /[\x00-\x1f"\\\u007f-\uffff]/g,
    seval = global.execScript ? "execScript" : "eval",
    rformat = /\\?\#{([^{}]+)\}/gm,
    sopen = (global.open + '').replace(/open/g, ""),
    defineProperty = Object.defineProperty

    function method(obj, name, method) {
        if(!obj[name]) {
            defineProperty(obj, name, {
                configurable: true,
                enumerable: false,
                writable: true,
                value: method
            });
        }
    }
    //IE8的Object.defineProperty只对DOM有效
    try {
        defineProperty({}, 'a', {
            get: function() {}
        });
    } catch(e) {
        method = function(obj, name, method) {
            if(!obj[name]) {
                obj[name] = method;
            }
        }
    }

    function methods(obj, map) {
        for(var name in map) {
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
            if(!$.type(obj, "Object") || $.isNative(obj, "reload")) {
                return false;
            }
            try { //不存在hasOwnProperty方法的对象肯定是IE的BOM对象或DOM对象
                for(var key in obj) //只有一个方法是来自其原型立即返回flase
                    if(!Object.prototype.hasOwnProperty.call(obj, key)) { //不能用obj.hasOwnProperty自己查自己
                        return false
                    }
            } catch(e) {
                return false;
            }
            return true;
        },
        /**
         * 判定method是否为obj的原生方法，如$.isNative(window,"JSON")
         * @param {Any} obj 对象
         * @param {Function} method
         * @return {Boolean}
         */
        isNative: function(obj, method) {
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
            for(var i in obj) {
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
            if(type === "Array" || type === "Arguments" || type === "NodeList" || includeString && type === "String") {
                return true;
            }
            if(type === "Object") {
                var i = obj.length;
                return i >= 0 && parseInt(i) === i; //非负整数
            }
            return false;
        },
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
            if(isArray) {
                for(var n = obj.length; i < n; i++) {
                    value = fn.call(scope || obj[i], obj[i], i);
                    ret.push(value)
                    if(!map && value === false) {
                        break;
                    }
                }
            } else {
                for(i in obj) {
                    value = fn.call(scope || obj[i], obj[i], i);
                    ret.push(value)
                    if(!map && value === false) {
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
            return $.each(obj, fn, scope, true)
        },
        /**
         * 过滤数组中不合要求的元素
         * @param {Object} obj
         * @param {Function} fn 如果返回true则放进结果集中
         * @param {Any} scope ? 默认为当前遍历的元素或属性值
         * @return {Array}
         */
        filter: function(obj, fn, scope) {
            for(var i = 0, n = obj.length, ret = []; i < n; i++) {
                var val = fn.call(scope||obj[i], obj[i], i);
                if(val === true) {
                    ret[ret.length] = obj[i]
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
                if(match.charAt(0) == "\\") return match.slice(1);
                var index = Number(name)
                if(index >= 0) return array[index];
                if(object && object[name] !== void 0) return object[name];
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
            if(end == null) {
                end = start || 0;
                start = 0;
            }
            var index = -1,
            length = Math.max(0, Math.ceil((end - start) / step)),
            result = Array(length);

            while(++index < length) {
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
        quote: String.quote ||
        function(str) {
            return '"' + str.replace(runicode, function(a) {
                switch(a) {
                    case '"':
                        return '\\"';
                    case '\\':
                        return '\\\\';
                    case '\b':
                        return '\\b';
                    case '\f':
                        return '\\f';
                    case '\n':
                        return '\\n';
                    case '\r':
                        return '\\r';
                    case '\t':
                        return '\\t';
                }
                a = a.charCodeAt(0).toString(16);
                while(a.length < 4) a = "0" + a;
                return "\\u" + a;
            }) + '"';
        },
        /**
         * 查看对象或数组的内部构造
         * @param {Any} obj
         * @return {String}
         */
        dump: function(obj, indent) {
            indent = indent || "";
            if(obj == null) //处理null,undefined
                return indent + "obj";
            if(obj.nodeType === 9) return indent + "[object Document]";
            if(obj.nodeType) return indent + "[object " + (obj.tagName || "Node") + "]";
            var arr = [],
            type = $.type(obj),
            self = $.dump,
            next = indent + "\t";
            switch(type) {
                case "Boolean":
                case "Number":
                case "NaN":
                case "RegExp":
                    return indent + obj;
                case "String":
                    return indent + $.quote(obj);
                case "Function":
                    return(indent + obj).replace(/\n/g, "\n" + indent);
                case "Date":
                    return indent + '(new Date(' + obj.valueOf() + '))';
                case "Window":
                    return indent + "[object " + type + "]";
                default:
                    if($.isArrayLike(obj)) {
                        for(var i = 0, n = obj.length; i < n; ++i)
                            arr.push(self(obj[i], next).replace(/^\s* /g, next));
                        return indent + "[\n" + arr.join(",\n") + "\n" + indent + "]";
                    }
                    if($.isPlainObject(obj)) {
                        for(i in obj) {
                            arr.push(next + self(i) + ": " + self(obj[i], next).replace(/^\s+/g, ""));
                        }
                        return indent + "{\n" + arr.join(",\n") + "\n" + indent + "}";
                    }
                    return indent + "[object " + type + "]";
            }
        },
        /**
         * 将字符串当作JS代码执行
         * @param {String} code
         */
        parseJS: function(code) {
            //IE中，global.eval()和eval()一样只在当前作用域生效。
            //Firefox，Safari，Opera中，直接调用eval()为当前作用域，global.eval()调用为全局作用域。
            if(code && /\S/.test(code)) {
                try {
                    global[seval](code);
                } catch(e) {}
            }
        },
        /**
         * 将字符串解析成JSON对象
         * @param {String} data
         * @return {JSON}
         */
        parseJSON: function(data) {
            if(typeof data === "string") {
                data = data.trim(); //IE不会去掉字符串两边的空白
                if(global.JSON && global.JSON.parse) {
                    //使用原生的JSON.parse转换字符串为对象
                    return global.JSON.parse(data);
                }
                if(rvalidchars.test(data.replace(rvalidescape, "@").replace(rvalidtokens, "]").replace(rvalidbraces, ""))) {
                    //使用new Function生成一个JSON对象
                    return(new Function("return " + data))();
                }
            }
            $.error("Invalid JSON: " + data, TypeError);
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
                if(global.DOMParser && (!mode || mode > 8)) { // Standard
                    tmp = new DOMParser();
                    xml = tmp.parseFromString(data, "text/xml");
                } else { // IE
                    xml = new ActiveXObject("Microsoft.XMLDOM"); //"Microsoft.XMLDOM"
                    xml.async = "false";
                    xml.loadXML(data);
                }
            } catch(e) {
                xml = undefined;
            }
            if(!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) {
                $.error("Invalid XML: " + data, TypeError);
            }
            return xml;
        }

    }
    $.mix(tools, false);


    "Array,Function".replace($.rword, function(method) {
        $["is" + method] = function(obj) {
            return obj && ({}).toString.call(obj) === "[object " + method + "]";
        }
    });


    if(Array.isArray) {
        $.isArray = Array.isArray;
    }
    methods(String.prototype, {
        //将字符串重复n遍
        repeat: function(n) {
            var result = "",
            target = this;
            while(n > 0) {
                if(n & 1) result += target;
                target += target;
                n >>= 1;
            }
            return result;
        },
        //判定是否以给定字符串开头
        startsWith: function(str) {
            return this.indexOf(str) === 0;
        },
        //判定是否以给定字符串结尾
        endsWith: function(str) {
            return this.lastIndexOf(str) === this.length - str.length;
        },
        //判断一个字符串是否包含另一个字符
        contains: function(s, position) {
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
        /**取得一个字符串所有字节的长度。这是一个后端过来的方法，如果将一个英文字符插
         *入数据库 char、varchar、text 类型的字段时占用一个字节，而一个中文字符插入
         *时占用两个字节，为了避免插入溢出，就需要事先判断字符串的字节长度。在前端，
         *如果我们要用户填空的文本，需要字节上的长短限制，比如发短信，也要用到此方法。
         *随着浏览器普及对二进制的操作，这方法也越来越常用。
         */
        byteLen: function(target) {
            return target.replace(/[^\x00-\xff]/g, 'ci').length;
        },
        //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
        truncate: function(target, length, truncation) {
            length = length || 30;
            truncation = truncation === void(0) ? "..." : truncation;
            return target.length > length ? target.slice(0, length - truncation.length) + truncation : String(target);
        },
        //转换为驼峰风格
        camelize: function(target) {
            if(target.indexOf("-") < 0 && target.indexOf("_") < 0) {
                return target; //提前判断，提高getStyle等的效率
            }
            return target.replace(/[-_][^-_]/g, function(match) {
                return match.charAt(1).toUpperCase();
            });
        },
        //转换为下划线风格
        underscored: function(target) {
            return target.replace(/([a-z\d])([A-Z]+)/g, "$1_$2").replace(/\-/g, "_").toLowerCase();
        },
        //首字母大写
        capitalize: function(target) {
            return target.charAt(0).toUpperCase() + target.substring(1).toLowerCase();
        },
        //移除字符串中的html标签，但这方法有缺陷，如里面有script标签，会把这些不该显示出来的脚本也显示出来了
        stripTags: function(target) {
            return target.replace(/<[^>]+>/g, "");
        },
        //移除字符串中所有的 script 标签。弥补stripTags方法的缺陷。此方法应在stripTags之前调用。
        stripScripts: function(target) {
            return target.replace(/<script[^>]*>([\S\s]*?)<\/script>/img, '')
        },
        //将字符串经过 html 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt;
        escapeHTML: function(target) {
            return target.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        },
        //还原为可被文档解析的HTML标签
        unescapeHTML: function(target) {
            return target.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&") //处理转义的中文和实体字符
            .replace(/&#([\d]+);/g, function($0, $1) {
                return String.fromCharCode(parseInt($1, 10));
            });
        },

        //http://stevenlevithan.com/regex/xregexp/
        //将字符串安全格式化为正则表达式的源码
        escapeRegExp: function(target) {
            return(target + "").replace(/([-.*+?^${}()|[\]\/\\])/g, "\\$1");
        },
        //http://www.cnblogs.com/rubylouvre/archive/2010/02/09/1666165.html
        //在左边补上一些字符,默认为0
        pad: function(target, n, filling, right, radix) {
            var num = target.toString(radix || 10);
            filling = filling || "0";
            while(num.length < n) {
                if(!right) {
                    num = filling + num;
                } else {
                    num += filling;
                }
            }
            return num;
        },
        /**
         * 为目标字符串添加wbr软换行
         * 1.支持html标签、属性以及字符实体。<br>
         * 2.任意字符中间都会插入wbr标签，对于过长的文本，会造成dom节点元素增多，占用浏览器资源。
         * 3.在opera下，浏览器默认css不会为wbr加上样式，导致没有换行效果，
         * 可以在css中加上 wbr:after { content: "\00200B" } 解决此问题
         */
        wbr: function(target) {
            return String(target).replace(/(?:<[^>]+>)|(?:&#?[0-9a-z]{2,6};)|(.{1})/gi, "$&<wbr>").replace(/><wbr>/g, ">");
        }
    });

    $.String("charAt,charCodeAt,concat,indexOf,lastIndexOf,localeCompare,match," + "contains,endsWith,startsWith,repeat,", //es6
        "replace,search,slice,split,substring,toLowerCase,toLocaleLowerCase,toUpperCase,trim,toJSON")
    $.Array({
        //判定数组是否包含指定目标。
        contains: function(target, item) {
            return !!~target.indexOf(item);
        },
        //移除数组中指定位置的元素，返回布尔表示成功与否。
        removeAt: function(target, index) {
            return !!target.splice(index, 1).length
        },
        //移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否。
        remove: function(target, item) {
            var index = target.indexOf(item);
            if(~index) return $.Array.removeAt(target, index);
            return false;
        },

        //对数组进行洗牌。若不想影响原数组，可以先拷贝一份出来操作。
        shuffle: function(target) {
            var ret = [],
            i = target.length,
            n;
            target = target.slice(0);
            while(--i >= 0) {
                n = Math.floor(Math.random() * i);
                ret[ret.length] = target[n];
                target[n] = target[i];
            }
            return ret;
        },
        //从数组中随机抽选一个元素出来。
        random: function(target) {
            return $.Array.shuffle(target.concat())[0];
        },
        //对数组进行平坦化处理，返回一个一维的新数组。
        flatten: function(target) {
            var result = [],
            self = $.Array.flatten;
            target.forEach(function(item) {
                if(Array.isArray(item)) {
                    result = result.concat(self(item));
                } else {
                    result.push(item);
                }
            });
            return result;
        },

        // 过滤数组中的null与undefined，但不影响原数组。
        compact: function(target) {
            return target.filter(function(el) {
                return el != null;
            });
        },
        //根据指定条件进行排序，通常用于对象数组。
        sortBy: function(target, fn, scope) {
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
        //根据指定条件（如回调或对象的某个属性）进行分组，构成对象返回。
        groupBy: function(target, val) {
            var result = {};
            var iterator = $.isFunction(val) ? val : function(obj) {
                return obj[val];
            };
            target.forEach(function(value, index) {
                var key = iterator(value, index);
                (result[key] || (result[key] = [])).push(value);
            });
            return result;
        },
        //取得对象数组的每个元素的指定属性，组成数组返回。
        pluck: function(target, name) {
            var result = [],
            prop;
            target.forEach(function(item) {
                prop = item[name];
                if(prop != null) result.push(prop);
            });
            return result;
        },
        // 对数组进行去重操作，返回一个没有重复元素的新数组。
        unique: function(target) {
            var ret = [],
            n = target.length,
            i, j; //by abcd
            for(i = 0; i < n; i++) {
                for(j = i + 1; j < n; j++)
                    if(target[i] === target[j]) j = ++i;
                ret.push(target[i]);
            }
            return ret;
        },
        //合并参数二到参数一
        merge: function(first, second) {
            var i = ~~first.length,
            j = 0;
            for(var n = second.length; j < n; j++) {
                first[i++] = second[j];
            }
            first.length = i;
            return first;
        },
        //对两个数组取并集。
        union: function(target, array) {
            return $.Array.unique($.Array.merge(target, array));
        },
        //对两个数组取交集
        intersect: function(target, array) {
            return target.filter(function(n) {
                return ~array.indexOf(n);
            });
        },
        //对两个数组取差集(补集)
        diff: function(target, array) {
            var result = target.slice();
            for(var i = 0; i < result.length; i++) {
                for(var j = 0; j < array.length; j++) {
                    if(result[i] === array[j]) {
                        result.splice(i, 1);
                        i--;
                        break;
                    }
                }
            }
            return result;
        },
        //返回数组中的最小值，用于数字数组。
        min: function(target) {
            return Math.min.apply(0, target);
        },
        //返回数组中的最大值，用于数字数组。
        max: function(target) {
            return Math.max.apply(0, target);
        },
        //深拷贝当前数组
        clone: function(target) {
            var i = target.length,
            result = [];
            while(i--) result[i] = cloneOf(target[i]);
            return result;
        },
        //只有当前数组不存在此元素时只添加它
        ensure: function(target, el) {
            if(!~target.indexOf(el)) {
                target.push(el);
            }
            return target;
        },
        //将数组划分成N个分组，其中小组有number个数，最后一组可能小于number个数,
        //但如果第三个参数不为undefine时,我们可以拿它来填空最后一组
        inGroupsOf: function(target, number, fillWith) {
            var t = target.length,
            n = Math.ceil(t / number),
            fill = fillWith !== void 0,
            groups = [],
            i, j, cur
            for(i = 0; i < n; i++) {
                groups[i] = [];
                for(j = 0; j < number; j++) {
                    cur = i * number + j;
                    if(cur === t) {
                        if(fill) {
                            groups[i][j] = fillWith;
                        }
                    } else {
                        groups[i][j] = target[cur];
                    }
                }
            }
            return groups;
        },
        //可中断的forEach迭代器
        forEach: $.each,
        map: $.map
    });
    $.Array("concat,join,pop,push,shift,slice,sort,reverse,splice,unshift," + "indexOf,lastIndexOf,every,some,filter,reduce,reduceRight")
    var NumberPack = {
        //确保数值在[n1,n2]闭区间之内,如果超出限界,则置换为离它最近的最大值或最小值
        limit: function(target, n1, n2) {
            var a = [n1, n2].sort();
            if(target < a[0]) target = a[0];
            if(target > a[1]) target = a[1];
            return target;
        },
        //求出距离指定数值最近的那个数
        nearer: function(target, n1, n2) {
            var diff1 = Math.abs(target - n1),
            diff2 = Math.abs(target - n2);
            return diff1 < diff2 ? n1 : n2
        },
        //http://www.cnblogs.com/xiao-yao/archive/2012/09/11/2680424.html
        round: function(target, base) {
            if(base) {
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
        switch(name) {
            case "Array":
            case "Object":
                return $[name].clone(item);
            default:
                return item;
        }
    }
    //使用深拷贝方法将多个对象或数组合并成一个

    function mergeOne(source, key, current) {
        if($.isPlainObject(source[key])) { //只处理纯JS对象，不处理window与节点
            $.Object.merge(source[key], current);
        } else {
            source[key] = cloneOf(current)
        }
        return source;
    };

    $.Object({
        //根据传入数组取当前对象相关的键值对组成一个新对象返回
        subset: function(target, props) {
            var result = {};
            props.forEach(function(prop) {
                result[prop] = target[prop];
            });
            return result;
        },
        //将参数一的键值都放入回调中执行，如果回调返回false中止遍历
        forEach: $.each,
        //将参数一的键值都放入回调中执行，收集其结果返回
        map: $.map,
        //进行深拷贝，返回一个新对象，如果是拷贝请使用$.mix
        clone: function(target) {
            var clone = {};
            for(var key in target) {
                clone[key] = cloneOf(target[key]);
            }
            return clone;
        },
        //将多个对象合并到第一个参数中或将后两个参数当作键与值加入到第一个参数
        merge: function(target, k, v) {
            var obj, key;
            //为目标对象添加一个键值对
            if(typeof k === "string") return mergeOne(target, k, v);
            //合并多个对象
            for(var i = 1, n = arguments.length; i < n; i++) {
                obj = arguments[i];
                for(key in obj) {
                    if(obj[key] !== void 0) {
                        mergeOne(target, key, obj[key]);
                    }
                }
            }
            return target;
        },
        //去掉与传入参数相同的元素
        without: function(target, array) {
            var result = {},
            key;
            for(key in target) { //相当于构建一个新对象，把不位于传入数组中的元素赋给它
                if(!~array.indexOf(key)) {
                    result[key] = target[key];
                }
            }
            return result;
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