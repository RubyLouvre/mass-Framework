
function contains(target, it) {
    return target.indexOf(it) != -1; //indexOf改成search，lastIndexOf也行得通
};

function contains(target, str, separator){
    return separator ?
    (separator + target + separator).indexOf(separator + str + separator) > -1 :
    target.indexOf(str) > -1;
}

//最后一参数是忽略大小写
function startsWith(target, str, ignorecase) {
    var start_str = target.substr(0, str.length);
    return ignorecase ? start_str.toLowerCase() === str.toLowerCase() :
    start_str === str;
}

//最后一参数是忽略大小写
function endsWith(target, str, ignorecase) {
    var end_str = target.substring(target.length - str.length);
    return ignorecase ? end_str.toLowerCase() === str.toLowerCase() :
    end_str === str;
}

function repeat(target, n) {
    return (new Array(n+1)).join(target);
}

function repeat(target, n) {
    return Array.prototype.join.call({
        length:n+1
    }, target);
}

var repeat = (function() {
    var join = Array.prototype.join, obj = { };
    return function(target, n) {
        obj.length = n + 1;
        return join.call(obj, target);
    }
})();


function repeat(target,n) {
    var s = target, total = [];
    while(n > 0) {
        if (n % 2 == 1) total[total.length] = s;//如果是奇数
        if (n == 1) break;
        s += s;
        n = n>>1;//相当于将n除以2取其商,或说开2二次方
    }
    return total.join('');
}

function repeat(target,n) {
    var s = target,c = s.length * n
    do {
        s += s;
    } while (n = n>>1);
    s = s.substring(0, c);
    return s;
}

function repeat(target,n) {
    var s = target, total = "";
    while(n > 0) {
        if (n % 2 == 1) total += s;
        if (n == 1) break;
        s += s;
        n = n>>1;
    }
    return total;
}

function repeat(target,n) {
    if( n == 1 ) {
        return target;
    }
    var s= repeat(target,Math.floor(n/2));
    s+= s;
    if ( n % 2 ) {
        s+= target;
    }
    return s;
}
function repeat(target,n){
    return (n <= 0)? "": target.concat( repeat(target,--n) );
}

function byteLen (target){
    var byteLength = target.length, i = 0;
    for (; i < target.length; i++){
        if (target.charCodeAt(i) > 255) {
            byteLength++;
        }
    }
    return byteLength;
}

function byteLen(target){
    return target.replace(/[^\x00-\xff]/g,"--").length;
}

function truncate(target, length, truncation) {
    length = length || 30;
    truncation = truncation === void(0) ? '...' : truncation;
    return target.length > length ?
    target.slice(0, length - truncation.length) + truncation : String(target);
}

function camelize(target){
    if (target.indexOf('-') < 0 && target.indexOf('_') < 0) {
        return target;//提前判断，提高getStyle等的效率
    }
    return target.replace(/[-_][^-_]/g, function (match) {
        return match.charAt(1).toUpperCase();
    });
}

function underscored(target) {
    return target.replace(/([a-z\d])([A-Z])/g, '$1_$2').
    replace(/\-/g, '_').toLowerCase();
}

function dasherize(target) {
    return underscored(target).replace(/_/g, '-');
}

function capitalize(target){
    return target.charAt(0).toUpperCase() + target.substring(1).toLowerCase();
}

function stripTags(target) {
    return String(target ||"").replace(/<[^>]+>/g, '');
}

function stripScripts(target){
    return String(target ||"").replace(/<script[^>]*>([\S\s]*?)<\/script>/img,'')
}

function escapeHTML(target) {
    return target.replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function unescapeHTML(target) {
    return  target.replace(/&quot;/g,'"')
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>')
    .replace(/&amp;/g, "&"); //处理转义的中文和实体字符
    return target.replace(/&#([\d]+);/g, function($0, $1){
        return String.fromCharCode(parseInt($1, 10));
    });
}
/**
 为目标字符串添加wbr软换行
1.支持html标签、属性以及字符实体。<br>
2.任意字符中间都会插入wbr标签，对于过长的文本，会造成dom节点元素增多，占用浏览器资源。
3.在opera下，浏览器默认css不会为wbr加上样式，导致没有换行效果，可以在css中加上 wbr:after { content: "\00200B" } 解决此问题*/
function wbr(target) {
    return String(target)
    .replace(/(?:<[^>]+>)|(?:&#?[0-9a-z]{2,6};)|(.{1})/gi, '$&<wbr>')
    .replace(/><wbr>/g, '>');
}

function escapeRegExp( target ){
    return target.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
}

//http://www.cnblogs.com/rubylouvre/archive/2010/02/09/1666165.html
//在左边补上一些字符,默认为0

function pad(target, n){
    var zero = new Array(n).join('0');
    var str = zero + target;
    var result = str.substr(-n);
    return result;
}

function pad(target, n){
    return Array((n+1) - target.toString().split('').length).join('0') + target;
}

function pad(target, n){
    return ( Math.pow(10,n) + "" + target ).slice(-n);
}

function pad(target, n){
    return ((1 << n).toString(2) + target).slice(-n);
}

function pad(target, n){
    return (0..toFixed(n) + target).slice(-n);
}

function pad(target, n){
    return (1e20 + ""+ target).slice(-n);
}

function pad(target, n){
    var len = target.toString().length;
    while(len < n) {
        target = "0" + target;
        len++;
    }
    return target;
}

function ( target, n, filling, right, radix){
    var num = target.toString(radix || 10);
    filling = filling || "0";
    while(num.length < n){
        if(!right){
            num = filling + num;
        }else{
            num += filling;
        }
    }
    return num;
}


function wbr(target) {
    return String(target)
    .replace(/(?:<[^>]+>)|(?:&#?[0-9a-z]{2,6};)|(.{1})/gi, '$&<wbr>')
    .replace(/><wbr>/g, '>');
}

function format(str, object){
    var array = Array.prototype.slice.call(arguments,1);
    return str.replace(/\\?\#{([^{}]+)\}/gm, function(match, name){
        if (match.charAt(0) == '\\')
            return match.slice(1);
        var index = Number(name)
        if(index >=0 )
            return array[index];
        if(object && object[name] !== void 0)
            return  object[name];
        return  '' ;
    });
}

var a = format("Result is #{0},#{1}", 22,33);
alert(a);//"Result is 22,33"
var b = format("#{name} is a #{sex}",{
    name:"Jhon",
    sex:"man"
});
alert(b);//"Jhon is a man"

//http://code.google.com/p/jquery-json/
var escapeable = /["\\\x00-\x1f\x7f-\x9f]/g,
meta = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"' : '\\"',
    '\\': '\\\\'
};
function quote(target) {
    if ( target.match( escapeable ) ) {
        return '"' + target.replace( escapeable, function( a ) {
            var c = meta[a];
            if ( typeof c === 'string' ) {
                return c;
            }
            return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)
        }) + '"';
    }
    return '"' + target + '"';
}

var trim = String.prototype.trim;
if(typeof trim !== "function"){
    trim = function() {
        return  this.replace(/^\s+|\s+$/g, '');
    }
}

// ES5 15.5.4.20
// http://es5.github.com/#x15.5.4.20
// http://blog.stevenlevithan.com/archives/faster-trim-javascript
// http://perfectionkills.com/whitespace-deviations/

function trim (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

function trim (str) {
    return str.replace(/^\s+/, '').replace(/\s+$/, '');
}

function trim (str) {
    return str.substring(Math.max(str.search(/\S/), 0),
        str.search(/\S\s*$/) + 1);
}

function trim (str) {
    return str.replace(/^\s+|\s+$/g, '');
}

function trim (str) {
    str = str.match(/\S+(?:\s+\S+)*/);
    return str ? str[0] : '';
}

function trim (str) {
    return str.replace(/^\s*(\S*(\s+\S+)*)\s*$/, '$1');
}

function trim (str) {
    return str.replace(/^\s*(\S*(?:\s+\S+)*)\s*$/, '$1');
}

function trim (str) {
    return str.replace(/^\s*((?:[\S\s]*\S)?)\s*$/, '$1');
}

function trim (str) {
    return str.replace(/^\s*([\S\s]*?)\s*$/, '$1');
}

function trim (str) {
    var whitespace = ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\n\
  \u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
    for (var i = 0; i < str.length; i++) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(i);
            break;
        }
    }
    for (i = str.length - 1; i >= 0; i--) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(0, i + 1);
            break;
        }
    }
    return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
}
function trim (str) {
    str = str.replace(/^\s+/, '');
    for (var i = str.length - 1; i >= 0; i--) {
        if (/\S/.test(str.charAt(i))) {
            str = str.substring(0, i + 1);
            break;
        }
    }
    return str;
}
function trim (str) {
    var	str = str.replace(/^\s\s*/, ""),
    ws = /\s/,
    i = str.length;
    while (ws.test(str.charAt(--i)));
    return str.slice(0, i + 1);
}
function trim(str) {
    var m = str.length;
    for (var i = -1; str.charCodeAt(++i) <= 32;);
    for (var j = m - 1; j > i && str.charCodeAt(j) <= 32 ; j--);
    return str.slice(i, j + 1);
}


Array.prototype.indexOf = function (item, index) {
    var n = this.length, i = ~~index;
    if (i < 0) i += n;
    for (; i < n; i++)
        if ( this[i] === item) return i;
    return -1;
}

Array.prototype.lastIndexOf = function (item, index) {
    var n = this.length,
    i = index == null ? n - 1 : index;
    if (i < 0) i = Math.max(0, n + i);
    for (; i >= 0; i--)
        if (this[i] === item) return i;
    return -1;
}

function iterator(vars, body, ret) {
    var fun = 'for(var '+vars+'i=0,n = this.length;i < n;i++){'+
    body.replace('_', '((i in this) && fn.call(scope,this[i],i,this))')
    +'}'+ret
    return Function("fn,scope",fun);
}

Array.prototype.forEach = iterator('', '_', '');

Array.prototype.filter = iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r');

Array.prototype.map =  iterator('r=[],', 'r[i]=_', 'return r');

Array.prototype.some = iterator('', 'if(_)return true', 'return false');

Array.prototype.every = iterator('', 'if(!_)return false', 'return true');

[1,2,,4].forEach(function(e){
    console.log(e)
});
//依次打印出1，2，4，忽略第二第三个逗号间的空元素

Array.prototype.reduce = function (fn, lastResult, scope) {
    if (this.length == 0) return lastResult;
    var i = lastResult !== undefined ? 0 : 1;
    var result = lastResult !== undefined ? lastResult : this[0];
    for (var n = this.length; i < n; i++)
        result = fn.call(scope, result, this[i], i, this);
    return result;
}

Array.prototype.reduceRight = function (fn, lastResult, scope) {
    var array = this.concat().reverse();
    return array.reduce(fn, lastResult, scope);
}

function contains( target, item ) {
    return target.indexOf(item) > -1
}

function removeAt( target, index ) {
    return !!target.splice(index, 1).length
}

function remove( target, item ) {
    var index = target.indexOf(item);
    if (~index )
        return removeAt(target, index);
    return false;
}

function shuffle( target ) {
    var j, x, i = target.length;
    for (; i > 0; j = parseInt(Math.random() * i),
        x = target[--i], target[i] = target[j], target[j] = x) {};
    return target;
}

function random( target ) {
    return shuffle( target.concat() )[0];
}

function flatten(target) {
    var result = [];
    target.forEach(function(item) {
        if ( Array.isArray(item)) {
            result = result.concat( flatten(item) );
        } else {
            result.push(item);
        }
    });
    return result;
}

function unique( target ) {
    var result = [];
        loop:
        for(var i = 0, n = target.length; i < n; i++) {
            for(var x = i + 1 ; x < n; x++) {
                if(target[x] === target[i])
                    continue loop;
            }
            result.push(target[i]);
        }
    return result;
}

function compact( target ) {
    return target.filter(function (el) {
        return el != null;
    });
}

function pluck( target, name ){
    var result = [], prop;
    target.forEach(function(item){
        prop = item[name];
        if(prop != null)
            result.push(prop);
    });
    return result;
}

function groupBy(target, val) {
    var result = {};
    var iterator = $.isFunction(val) ? val : function(obj) {
        return obj[val];
    };
    target.forEach( function(value, index) {
        var key = iterator(value, index);
        (result[key] || (result[key] = [])).push(value);
    });
    return result;
}

function sortBy( target, fn, scope ) {
    var array =  target.map(function(item, index) {
        return {
            el: item,
            re: fn.call(scope, item, index)
        };
    }).sort(function(left, right) {
        var a = left.re, b = right.re;
        return a < b ? -1 : a > b ? 1 : 0;
    });
    return pluck(array,'el');
}

function union( target, array ){
    return unique( target.concat(array) );
}

function intersect( target, array ){
    return target.filter(function(n) {
        return ~array.indexOf(n);
    });
}

function diff( target, array ) {
    var result = target.slice();
    for ( var i = 0; i < result.length; i++ ) {
        for ( var j = 0; j < array.length; j++ ) {
            if ( result[i] === array[j] ) {
                result.splice(i, 1);
                i--;
                break;
            }
        }
    }
    return result;
}

function min( target ) {
    return Math.min.apply(0, target);
}

function max( target ) {
    return Math.max.apply(0, target);
}

if([].unshift(1) !== 1){
    var _unshift = Array[P].unshift;
    Array[P].unshift = function(){
        _unshift.apply(this, arguments);
        return this.length; //返回新数组的长度
    }
}

Array.prototype.splice = function (s, d) {
    var max = Math.max,min = Math.min,
    a = [], // The return value array
    e,  // element
    i = max(arguments.length - 2, 0),   // insert count
    k = 0,
    l = this.length,
    n,  // new length
    v,  // delta
    x;  // shift count

    s = s || 0;
    if (s < 0) {
        s += l;
    }
    s = max(min(s, l), 0);  // start point
    d = max(min(isNumber(d) ? d : l, l - s), 0);    // delete count
    v = i - d;
    n = l + v;
    while (k < d) {
        e = this[s + k];
        if (e !== void 0) {
            a[k] = e;
        }
        k += 1;
    }
    x = l - s - d;
    if (v < 0) {
        k = s + i;
        while (x) {
            this[k] = this[k - v];
            k += 1;
            x -= 1;
        }
        this.length = n;
    } else if (v > 0) {
        k = 1;
        while (x) {
            this[n - k] = this[l - k];
            k += 1;
            x -= 1;
        }
    }
    for (k = 0; k < i; ++k) {
        this[s + k] = arguments[k + 2];
    }
    return a;
}

var _slice = Array.prototype.slice;
Array.prototype.pop = function () {
    return this.splice(this.length - 1, 1)[0];
}

Array.prototype.push = function () {
    this.splice.apply(this,
        [this.length, 0].concat(_slice.call(arguments)));
    return this.length;
}

Array.prototype.shift = function () {
    return this.splice(0, 1)[0];
}

Array.prototype.unshift = function () {
    this.splice.apply(this,
        [0, 0].concat(_slice.call(arguments)));
    return this.length;
}
//node chat源码解读（一）
//http://yoyo.play175.com/p/node-cluster.html
//https://github.com/learnboost/cluster