//=========================================
//  lang_fix 语言补丁模块
//==========================================
define("lang_fix", /native code/.test(Array.isArray), ["mass"], function($) {
    //fix ie for..in bug
    var DONT_ENUM = $.DONT_ENUM = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(","),
            P = "prototype",
            hasOwn = ({}).hasOwnProperty;
    for (var i in {
        toString: 1
    }) {
        DONT_ENUM = false;
    }
    //第二个参数仅在浏览器支持Object.defineProperties时可用
    $.mix(Object, {
        create: function(o) {
            if (arguments.length > 1) {
                $.log(" Object.create implementation only accepts the first parameter.");
            }

            function F() {
            }
            F.prototype = o;
            return new F();
        },
        //取得其所有键名以数组形式返回
        keys: function(obj) { //ecma262v5 15.2.3.14
            var result = [];
            for (var key in obj)
                if (hasOwn.call(obj, key)) {
                    result.push(key)
                }
            if (DONT_ENUM && obj) {
                for (var i = 0; key = DONT_ENUM[i++]; ) {
                    if (hasOwn.call(obj, key)) {
                        result.push(key);
                    }
                }
            }
            return result;
        },
        getPrototypeOf: typeof P.__proto__ === "object" ?
                function(obj) {
                    return obj.__proto__;
                } : function(obj) {
            return obj.constructor[P];
        }

    }, false);

    //用于创建javascript1.6 Array的迭代器

    function iterator(vars, body, ret) {
        var fun = 'for(var ' + vars + 'i=0,n = this.length;i < n;i++){' + body.replace('_', '((i in this) && fn.call(scope,this[i],i,this))') + '}' + ret
        return Function("fn,scope", fun);
    }
    $.mix(Array[P], {
        //定位操作，返回数组中第一个等于给定参数的元素的索引值。
        indexOf: function(item, index) {
            var n = this.length,
                    i = ~~index;
            if (i < 0)
                i += n;
            for (; i < n; i++)
                if (this[i] === item)
                    return i;
            return -1;
        },
        //定位引操作，同上，不过是从后遍历。
        lastIndexOf: function(item, index) {
            var n = this.length,
                    i = index == null ? n - 1 : index;
            if (i < 0)
                i = Math.max(0, n + i);
            for (; i >= 0; i--)
                if (this[i] === item)
                    return i;
            return -1;
        },
        //迭代操作，将数组的元素挨个儿传入一个函数中执行。Ptototype.js的对应名字为each。
        forEach: iterator('', '_', ''),
        //迭代类 在数组中的每个项上运行一个函数，如果此函数的值为真，则此元素作为新数组的元素收集起来，并返回新数组
        filter: iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r'),
        //收集操作，将数组的元素挨个儿传入一个函数中执行，然后把它们的返回值组成一个新数组返回。Ptototype.js的对应名字为collect。
        map: iterator('r=[],', 'r[i]=_', 'return r'),
        //只要数组中有一个元素满足条件（放进给定函数返回true），那么它就返回true。Ptototype.js的对应名字为any。
        some: iterator('', 'if(_)return true', 'return false'),
        //只有数组中的元素都满足条件（放进给定函数返回true），它才返回true。Ptototype.js的对应名字为all。
        every: iterator('', 'if(!_)return false', 'return true'),
        //归化类 javascript1.8  将该数组的每个元素和前一次调用的结果运行一个函数，返回最后的结果。
        reduce: function(fn, lastResult, scope) {
            if (this.length == 0)
                return lastResult;
            var i = lastResult !== undefined ? 0 : 1;
            var result = lastResult !== undefined ? lastResult : this[0];
            for (var n = this.length; i < n; i++)
                result = fn.call(scope, result, this[i], i, this);
            return result;
        },
        //归化类 javascript1.8 同上，但从右向左执行。
        reduceRight: function(fn, lastResult, scope) {
            var array = this.concat().reverse();
            return array.reduce(fn, lastResult, scope);
        }
    }, false);

    //修正IE67下unshift不返回数组长度的问题
    //http://www.cnblogs.com/rubylouvre/archive/2010/01/14/1647751.html
    if ([].unshift(1) !== 1) {
        var _unshift = Array[P].unshift;
        Array[P].unshift = function() {
            _unshift.apply(this, arguments);
            return this.length; //返回新数组的长度
        }
    }
    if ([1, 2, 3].splice(1).length === 0) {
        var _splice = Array[P].splice;
        Array[P].splice = function(a) {
            if (arguments.length === 1) {
                return _splice.call(this, a, this.length)
            } else {
                return _splice.apply(this, arguments);
            }
        }
    }
    if (!Array.isArray) {
        Array.isArray = function(obj) {
            return Object.prototype.toString.call(obj) == "[object Array]";
        };
    }
    //String扩展
    $.mix(String[P], {
        //ecma262v5 15.5.4.20
        //http://www.cnblogs.com/rubylouvre/archive/2009/09/18/1568794.html
        //'      dfsd '.trim() === 'dfsd''
        trim: function() {
            return this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, '')
        }
    }, false);

    $.mix(Function[P], {
        //ecma262v5 15.3.4.5
        bind: function(scope) {
            if (arguments.length < 2 && scope === void 0)
                return this;
            var fn = this,
                    argv = arguments;
            return function() {
                var args = [],
                        i;
                for (i = 1; i < argv.length; i++)
                    args.push(argv[i]);
                for (i = 0; i < arguments.length; i++)
                    args.push(arguments[i]);
                return fn.apply(scope, args);
            };
        }
    }, false);
    // Fix Date.get/setYear() (IE5-7)
    if ((new Date).getYear() > 1900) {
        Date.now = function() {
            return +new Date;
        }
        //http://stackoverflow.com/questions/5763107/javascript-date-getyear-returns-different-result-between-ie-and-firefox-how-to
        Date[P].getYear = function() {
            return this.getFullYear() - 1900;
        };
        Date[P].setYear = function(year) {
            return this.setFullYear(year); //+ 1900
        };
    }
    //http://stackoverflow.com/questions/10470810/javascript-tofixed-bug-in-ie6
    if (0.9.toFixed(0) !== '1') {
        Number.prototype.toFixed = function(n) {
            var power = Math.pow(10, n);
            var fixed = (Math.round(this * power) / power).toString();
            if (n == 0)
                return fixed;
            if (fixed.indexOf('.') < 0)
                fixed += '.';
            var padding = n + 1 - (fixed.length - fixed.indexOf('.'));
            for (var i = 0; i < padding; i++)
                fixed += '0';
            return fixed;
        };
    }
    //  string.substr(start, length)参考 start
    //  要抽取的子串的起始下标。如果是一个负数，那么该参数声明从字符串的尾部开始算起的位置。也就是说，-1指定字符串中的最后一个字符，-2指倒数第二个字符，以此类推。
    var substr = String.prototype.substr;
    if ('ab'.substr(-1) != 'b') {
        String.prototype.substr = function(start, length) {
            start = start < 0 ? Math.max(this.length + start, 0) : start;
            return substr.call(this, start, length);
        }
    }
    //    var testString = "0123456789";
    //    alert(testString.substr(2));
    //    // Output: 23456789
    //    alert(testString.substr(2, 5));
    //    // Output: 23456
    //    alert(testString.substr(-3));
    //    // Output: 789 IE:0123456789
    //    alert(testString.substr(-5, 2));
    //// Output: 56  IE:01
   
if("JSON"!==$.type(window.JSON)){JSON={fake:!0};var f=function(a){return 10>a?"0"+a:a},toJSON=function(a,g){return"Date"===g?"(new Date("+a.valueOf()+"))":"String"===g?quote(a):a+""},cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',
"\\":"\\\\"},rep,quote=function(a){escapable.lastIndex=0;return escapable.test(a)?'"'+a.replace(escapable,function(a){var c=meta[a];return"string"===typeof c?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'},str=function(a,g){var c,d,k,l,h=gap,e,b=g[a];if(b&&(c=$.type(b),/date|string|number|boolean/i.test(c)))return toJSON(b,c);"function"===typeof rep&&(b=rep.call(g,a,b));switch(typeof b){case "string":return quote(b);case "number":return isFinite(b)?String(b):"NaN";case "boolean":case "null":return String(b);
case "object":if(!b)return"null";gap+=indent;e=[];if("Array"===$.type(b)){l=b.length;for(c=0;c<l;c+=1)e[c]=str(c,b)||"null";k=0===e.length?"[]":gap?"[\n"+gap+e.join(",\n"+gap)+"\n"+h+"]":"["+e.join(",")+"]";gap=h;return k}if(rep&&"object"===typeof rep){l=rep.length;for(c=0;c<l;c+=1)"string"===typeof rep[c]&&(d=rep[c],(k=str(d,b))&&e.push(quote(d)+(gap?": ":":")+k))}else for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(k=str(d,b))&&e.push(quote(d)+(gap?": ":":")+k);k=0===e.length?"{}":gap?"{\n"+
gap+e.join(",\n"+gap)+"\n"+h+"}":"{"+e.join(",")+"}";gap=h;return k}};JSON.stringify=function(a,g,c){var d;indent=gap="";if("number"===typeof c)for(d=0;d<c;d+=1)indent+=" ";else"string"===typeof c&&(indent=c);if((rep=g)&&"function"!==typeof g&&("object"!==typeof g||"number"!==typeof g.length))throw Error("JSON.stringify");return str("",{"":a})};JSON.parse=function(a,g){function c(a,d){var h,e,b=a[d];if(b&&"object"===typeof b)for(h in b)Object.prototype.hasOwnProperty.call(b,h)&&(e=c(b,h),void 0!==
e?b[h]=e:delete b[h]);return g.call(a,d,b)}var d;a=String(a);cx.lastIndex=0;cx.test(a)&&(a=a.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return d=eval("("+a+")"),"function"===typeof g?c({"":d},""):d;throw new SyntaxError("JSON.parse");}};


    return $;
});
/**
 2011.7.26 添加Object.getPrototypeOf方法
 2011.11.16重构Array.prototype.unshift (thx @abcd)
 2011.12.22 修正命名空间
 2012.3.19 添加对split的修复
 2012.5.31 添加Object.create的不完全修复
 */