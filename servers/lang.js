//=========================================
// 类型扩展模块 by 司徒正美
//=========================================

mass.define("lang",  function(){
    //dom.log("已加载lang模块");
    var global = this,
    rascii = /[^\x00-\xff]/g,
    rformat = /\\?\#{([^{}]+)\}/gm,
    rnoclose = /^(area|base|basefont|bgsound|br|col|frame|hr|img|input|isindex|link|meta|param|embed|wbr)$/i,
    // JSON RegExp
    rvalidchars = /^[\],:{}\s]*$/,
    rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
    rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    str_eval = global.execScript ? "execScript" : "eval",
    str_body = (global.open + '').replace(/open/g, '');
    mass.mix(mass,{
        //判定是否是一个朴素的javascript对象（Object或JSON），不是DOM对象，不是BOM对象，不是自定义类的实例。
        isPlainObject : function (obj){
            if(!mass.type(obj,"Object") || mass.isNative(obj,"reload") ){
                return false;
            }
            try{//不存在hasOwnProperty方法的对象肯定是IE的BOM对象或DOM对象
                for(var key in obj)//只有一个方法是来自其原型立即返回flase
                    if(!String2.hasOwnProperty.call(obj,key)){//不能用obj.hasOwnProperty自己查自己
                        return false
                    }
            }catch(e){
                return false;
            }
            return true;
        },

        //判定method是否为obj的原生方法，如dom.isNative(window,"JSON")
        isNative : function(obj, method) {
            var m = obj ? obj[method] : false, r = new RegExp(method, 'g');
            return !!(m && typeof m != 'string' && str_body === (m + '').replace(r, ''));
        },
        /**
             * 是否为空对象
             * @param {Object} obj
             * @return {Boolean}
             */
        isEmptyObject: function(obj ) {
            for ( var i in obj ){
                return false;
            }
            return true;
        },
        //包括Array,Arguments,NodeList,HTMLCollection,IXMLDOMNodeList与自定义类数组对象
        //select.options集合（它们两个都有item与length属性）
        isArrayLike :  function (obj) {
            if(!obj || obj.document || obj.nodeType || mass.type(obj,"Function")) return false;
            return isFinite(obj.length) ;
        },

        //将字符串中的占位符替换为对应的键值
        //http://www.cnblogs.com/rubylouvre/archive/2011/05/02/1972176.html
        format : function(str, object){
            var array = mass.slice(arguments,1);
            return str.replace(rformat, function(match, name){
                if (match.charAt(0) == '\\')
                    return match.slice(1);
                var index = Number(name)
                if(index >=0 )
                    return array[index];
                if(object && object[name] !== void 0)
                    return  object[name];
                return  '' ;
            });
        },
        /**
             * 用于拼接多行HTML片断,免去写<与>与结束标签之苦
             * @param {String} tag 可带属性的开始标签
             * @param {String} innerHTML 可选
             * @param {Boolean} xml 可选 默认false,使用HTML模式,需要处理空标签
             * @example var html = T("P title=aaa",T("span","111111")("strong","22222"))("div",T("div",T("span","两层")))("H1",T("span","33333"))('',"这是纯文本");
             * console.log(html+"");
             * @return {Function}
             */
        tag:function (start,content,xml){
            xml = !!xml
            var chain = function(start,content,xml){
                var html = arguments.callee.html;
                start && html.push("<",start,">");
                content = ''+(content||'');
                content && html.push(content);
                var end = start.split(' ')[0];//取得结束标签
                if(end && (xml || !rnoclose.test(end))){
                    html.push("</",end,">");
                }
                return chain;
            }
            chain.html = [];
            chain.toString = function(){
                return this.html.join("");
            }
            return chain(start,content,xml);
        },
        // Generate an integer Array containing an arithmetic progression. A port of
        // the native Python `range()` function. See
        // [the Python documentation](http://docs.python.org/library/functions.html#range).
        range : function(start, stop, step) {
            if (arguments.length <= 1) {
                stop = start || 0;
                start = 0;
            }
            step = arguments[2] || 1;
            var len = Math.max(Math.ceil((stop - start) / step), 0);
            var idx = 0;
            var range = new Array(len);
            while(idx < len) {
                range[idx++] = start;
                start += step;
            }
            return range;
        },
        quote : global.JSON && JSON.stringify || String.quote ||  (function(){
            var meta = {
                '\t':'t',
                '\n':'n',
                '\v':'v',
                'f':'f',
                '\r':'\r',
                '\'':'\'',
                '\"':'\"',
                '\\':'\\'
            },
            reg = /[\x00-\x1F\'\"\\\u007F-\uFFFF]/g,
            regFn = function(c){
                if (c in meta) return '\\' + meta[c];
                var ord = c.charCodeAt(0);
                return ord < 0x20   ? '\\x0' + ord.toString(16)
                :  ord < 0x7F   ? '\\'   + c
                :  ord < 0x100  ? '\\x'  + ord.toString(16)
                :  ord < 0x1000 ? '\\u0' + ord.toString(16)
                : '\\u'  + ord.toString(16)
            };
            return function (str) {
                return    '"' + str.replace(reg, regFn)+ '"';
            }
        })(),
        //http://www.schillmania.com/content/projects/javascript-animation-1/
        //http://www.cnblogs.com/rubylouvre/archive/2010/04/09/1708419.html
        parseJS: function( code ) {
            //IE中，window.eval()和eval()一样只在当前作用域生效。
            //Firefox，Safari，Opera中，直接调用eval()为当前作用域，window.eval()调用为全局作用域。
            if ( code && /\S/.test(code) ) {
                try{
                    global[str_eval](code);
                }catch(e){ }
            }
        },
        parseJSON: function( data ) {
            if ( typeof data !== "string" || !data ) {
                return null;
            }
            data = data.trim();
            if ( global.JSON && global.JSON.parse ) {
                //使用原生的JSON.parse转换字符串为对象
                return global.JSON.parse( data );
            }
            if ( rvalidchars.test( data.replace( rvalidescape, "@" )
                .replace( rvalidtokens, "]" )
                .replace( rvalidbraces, "")) ) {
                //使用new Function生成一个JSON对象
                return (new Function( "return " + data ))();
            }
            mass.error( "Invalid JSON: " + data );
        },

        // Cross-browser xml parsing
        parseXML: function ( data,xml,tmp ) {
            try {
                if ( global.DOMParser ) { // Standard
                    tmp = new DOMParser();
                    xml = tmp.parseFromString( data , "text/xml" );
                } else { // IE
                    xml = new ActiveXObject("Microsoft.XMLDOM" );//"Microsoft.XMLDOM"
                    xml.async = "false";
                    xml.loadXML( data );
                }
            } catch( e ) {
                xml = undefined;
            }
            if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
                mass.log( "Invalid XML: " + data );
            }
            return xml;
        }

    }, false);

    "Array,Function".replace(mass.rword,function(name){
        mass["is"+name] = function(obj){
            return obj && ({}).toString.call(obj) === "[object "+name+"]";
        }
    });

    if(Array.isArray){
        mass.isArray = Array.isArray;
    }
    var rescape = /([-.*+?^${}()|[\]\/\\])/g
    var String2 = mass.String = {
        //判断一个字符串是否包含另一个字符
        contains: function(string, separator){
            return (separator) ? !!~(separator + this + separator).indexOf(separator + string + separator) : !!~this.indexOf(string);
        },
        //以XXX开头
        startsWith: function(string, ignorecase) {
            var start_str = this.substr(0, string.length);
            return ignorecase ? start_str.toLowerCase() === string.toLowerCase() :
            start_str === string;
        },

        endsWith: function(string, ignorecase) {
            var end_str = this.substring(this.length - string.length);
            return ignorecase ? end_str.toLowerCase() === string.toLowerCase() :
            end_str === string;
        },

        //得到字节长度
        byteLen:function(){
            return this.replace(rascii,"--").length;
        },

        empty: function () {
            return this.valueOf() === '';
        },
        //判定字符串是否只有空白
        blank: function () {
            return /^\s*$/.test(this);
        },
        //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
        truncate :function(length, truncation) {
            length = length || 30;
            truncation = truncation === void(0) ? '...' : truncation;
            return this.length > length ?
            this.slice(0, length - truncation.length) + truncation :String(this);
        },
        camelize:function(){
            return this.replace(/-([a-z])/g, function($1,$2){
                return $2.toUpperCase();
            });
        },
        //首字母大写
        capitalize: function(){
            return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
        },

        underscored: function() {
            return this.replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/\-/g, '_').toLowerCase();
        },

        toInt: function(radix) {
            return parseInt(this, radix || 10);
        },

        toFloat: function() {
            return parseFloat(this);
        },
        //dom.lang("é").toHex() ==> \xE9
        toHex: function() {
            var txt = '',str = this;
            for (var i = 0; i < str.length; i++) {
                if (str.charCodeAt(i).toString(16).toUpperCase().length < 2) {
                    txt += '\\x0' + str.charCodeAt(i).toString(16).toUpperCase() ;
                } else {
                    txt += '\\x' + str.charCodeAt(i).toString(16).toUpperCase() ;
                }
            }
            return txt;
        },
        //http://stevenlevithan.com/regex/xregexp/
        escapeRegExp: function(){
            return this.replace(rescape, '\\$1');
        },
        //http://www.cnblogs.com/rubylouvre/archive/2010/02/09/1666165.html
        //在左边补上一些字符,默认为0
        padLeft: function(digits, filling, radix){
            var num = this.toString(radix || 10);
            filling = filling || "0";
            while(num.length < digits){
                num= filling + num;
            }
            return num;
        },

        //在右边补上一些字符,默认为0
        padRight: function(digits, filling, radix){
            var num = this.toString(radix || 10);
            filling = filling || "0";
            while(num.length < digits){
                num +=  filling;
            }
            return num;
        },
        // http://www.cnblogs.com/rubylouvre/archive/2009/11/08/1598383.html
        times :function(n){
            var str = this,res = "";
            while (n > 0) {
                if (n & 1)
                    res += str;
                str += str;
                n >>= 1;
            }
            return res;
        }
    };

    var Array2 = mass.Array  = {
        //深拷贝当前数组
        clone: function(){
            var i = this.length, result = [];
            while (i--) result[i] = cloneOf(this[i]);
            return result;
        },
        first: function(fn,scope){
            if(mass.type(fn,"Function")){
                for(var i=0, n = this.length;i < n;i++){
                    if(fn.call(scope,this[i],i,this)){
                        return this[i];
                    }
                }
                return null;
            }else{
                return this[0];
            }
        },
        last: function(fn, scope) {
            if(mass.type(fn,"Function")){
                for (var i=this.length-1; i > -1; i--) {
                    if (fn.call(scope, this[i], i, this)) {
                        return this[i];
                    }
                }
                return null;
            }else{
                return this[this.length-1];
            }
        },
        //判断数组是否包含此元素
        contains: function (el) {
            return !!~this.indexOf(el) ;
        },
        //http://msdn.microsoft.com/zh-cn/library/bb383786.aspx
        //移除 Array 对象中某个元素的第一个匹配项。
        remove: function (item) {
            var index = this.indexOf(item);
            if (~index ) return Array2.removeAt.call(this,index);
            return null;
        },
        //移除 Array 对象中指定位置的元素。
        removeAt: function (index) {
            return this.splice(index, 1);
        },
        //对数组进行洗牌,但不影响原对象
        // Jonas Raoni Soares Silva http://jsfromhell.com/array/shuffle [v1.0]
        shuffle: function () {
            var shuff = (this || []).concat(), j, x, i = shuff.length;
            for (; i > 0; j = parseInt(Math.random() * i), x = shuff[--i], shuff[i] = shuff[j], shuff[j] = x) {};
            return shuff;
        },
        //从数组中随机抽选一个元素出来
        random: function () {
            return Array2.shuffle.call(this)[0];
        },
        //取得数字数组中值最小的元素
        min: function() {
            return Math.min.apply(0, this);
        },
        //取得数字数组中值最大的元素
        max: function() {
            return Math.max.apply(0, this);
        },
        //只有原数组不存在才添加它
        ensure: function() {
            var args = mass.slice(arguments);
            args.forEach(function(el){
                if (!~this.indexOf(el) ) this.push(el);
            },this);
            return this;
        },
        //取得对象数组的每个元素的特定属性
        pluck:function(name){
            var result = [],prop;
            this.forEach(function(el){
                prop = el[name];
                if(prop != null)
                    result.push(prop);
            });
            return result;
        },
        //根据对象的某个属性进行排序
        sortBy: function(fn, scope) {
            var array =  this.map(function(el, index) {
                return {
                    el: el,
                    re: fn.call(scope, el, index)
                };
            }).sort(function(left, right) {
                var a = left.re, b = right.re;
                return a < b ? -1 : a > b ? 1 : 0;
            });
            return Array2.pluck.call(array,'el');
        },
        // 以数组形式返回原数组中不为null与undefined的元素
        compact: function () {
            return this.filter(function (el) {
                return el != null;
            });
        },
        //取差集(补集)
        diff : function(array) {
            var result = this.slice();
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
        },
        //取并集
        union :function(array){
            var arr = this;
            arr = arr.concat(array);
            return mass.Array.unique.call(arr);
        },
        //取交集
        intersect:function(array){
            return this.filter(function(n) {
                return ~array.indexOf(n)
            });
        },
        // 返回没有重复值的新数组
        unique: function () {
            var ret = [];
                o:for(var i = 0, n = this.length; i < n; i++) {
                    for(var x = i + 1 ; x < n; x++) {
                        if(this[x] === this[i])
                            continue o;
                    }
                    ret.push(this[i]);
                }
            return ret;

        },
        //对数组进行平坦化处理，返回一个一维数组
        flatten: function() {
            var result = [],self = Array2.flatten;
            this.forEach(function(value) {
                if (mass.isArray(value)) {
                    result = result.concat(self.call(value));
                } else {
                    result.push(value);
                }
            });
            return result;
        }
    }
    Array2.without = Array2.diff;
    var Math2 = "abs,acos,asin,atan,atan2,ceil,cos,exp,floor,log,pow,sin,sqrt,tan".match(mass.rword);
    var Number2 = mass.Number ={
        times: function(fn, bind) {
            for (var i=0; i < this; i++)
                fn.call(bind, i);
            return this;
        },
        padLeft:function(digits, filling, radix){
            return String2.padLeft.apply(this,[digits, filling, radix]);
        },
        padRight:function(digits, filling, radix){
            return String2.padRight.apply(this,[digits, filling, radix]);
        },
        //确保数值在[n1,n2]闭区间之内,如果超出限界,则置换为离它最近的最大值或最小值
        constrain:function(n1,n2){
            var a = [n1,n2].sort(),num = Number(this);
            if(num < a[0]) num = a[0];
            if(num > a[1]) num = a[1];
            return num;
        },
        //求出距离原数最近的那个数
        nearer:function(n1,n2){
            var num = Number(this),
            diff1 = Math.abs(num - n1),
            diff2 = Math.abs(num - n2);
            return diff1 < diff2 ? n1 : n2
        },
        upto: function(number, fn, scope) {
            for (var i=this+0; i <= number; i++)
                fn.call(scope, i);
            return this;
        },

        downto: function(number, fn, scope) {
            for (var i=this+0; i >= number; i--)
                fn.call(scope, i);
            return this;
        },
        round: function(base) {
            if (base) {
                base = Math.pow(10, base);
                return Math.round(this * base) / base;
            } else {
                return Math.round(this);
            }
        }
    }

    Math2.forEach(function(name){
        Number2[name] = function(){
            return Math[name](this);
        }
    });

    function cloneOf(item){
        switch(mass.type(item)){
            case "Array":
                return Array2.clone.call(item);
            case "Object":
                return Object2.clone.call(item);
            default:
                return item;
        }
    }
    //使用深拷贝方法将多个对象或数组合并成一个
    function mergeOne(source, key, current){
        if(source[key] && typeof source[key] == "object"){
            Object2.merge.call(source[key], current);
        }else {
            source[key] = cloneOf(current)
        }
        return source;
    };

    var Object2 = mass.Object = {
        //根据传入数组取当前对象相关的键值对组成一个新对象返回
        subset: function(keys){
            var results = {};
            for (var i = 0, l = keys.length; i < l; i++){
                var k = keys[i];
                results[k] = this[k];
            }
            return results;
        },
        //遍历对象的键值对
        forEach: function(fn,scope){
            for(var name in this){
                fn.call(scope,this[name],name,this);
            }
            if(mass.DONT_ENUM && this.hasOwnProperty){
                for(var i = 0; name = mass.DONT_ENUM[i++]; ){
                    this.hasOwnProperty(name) &&  fn.call(scope,this[name],name,this);
                }
            }
        },
        //进行深拷贝，返回一个新对象，如果是拷贝请使用dom.mix
        clone: function(){
            var clone = {};
            for (var key in this) {
                clone[key] = cloneOf(this[key]);
            }
            return clone;
        },
        merge: function(k, v){
            var target = this,obj,key;
            //为目标对象添加一个键值对
            if (typeof k === "string")
                return mergeOne(target, k, v);
            //合并多个对象
            for (var i = 0, l = arguments.length; i < l; i++){
                obj = arguments[i];
                for ( key in obj){
                    if(obj[key] !== void 0)
                        mergeOne(target, key, obj[key]);
                }
            }
            return target;
        },
        //去掉与传入参数相同的元素
        without: function(arr) {
            var result = {}, key;
            for (key in this) {//相当于构建一个新对象，把不位于传入数组中的元素赋给它
                if (!~arr.indexOf(key) ) {
                    result[key] = this[key];
                }
            }
            return result;
        }
    }
    var inner = {
        String : ["charAt", "charCodeAt", "concat", "indexOf", "lastIndexOf", "localeCompare",
        "match", "replace","search", "slice", "split", "substring", "toLowerCase",
        "toLocaleLowerCase", "toUpperCase", "toLocaleUpperCase", "trim", "toJSON"],
        Array : [ "toLocaleString","concat", "join", "pop", "push", "shift", "slice", "sort",  "reverse","splice", "unshift",
        "indexOf", "lastIndexOf",  "every", "some", "forEach", "map","filter", "reduce", "reduceRight"],
        Number : ["toLocaleString", "toFixed", "toExponential", "toPrecision", "toJSON"],
        Object : ["toLocaleString", "hasOwnerProperty", "isPrototypeOf", "propertyIsEnumerable" ]
    }
    var adjustOne = mass.oneObject("String,Array,Number,Object"),
    arrayLike = mass.oneObject("NodeList,Arguments,Object")
    var Lang = mass.lang = function(obj){
        var type = mass.type(obj), chain = this;
        if(arrayLike[type] &&  isFinite(obj.length)){
            obj = mass.slice(obj);
            type = "Array";
        }
        if(adjustOne[type]){
            if(!(chain instanceof Lang)){
                chain = new Lang;
            }
            chain.target = obj;
            chain.type = type;
            return chain;
        }else{// undefined boolean null
            return obj
        }
    }
    var proto = Lang.prototype = {
        constructor:Lang,
        valueOf:function(){
            return this.target;
        },
        toString:function(){
            return this.target + "";
        }
    };
    function force(type){
        var methods = inner[type].concat(Object.keys(mass[type]));
        methods.forEach(function(name){
            proto[name] = function(){
                var obj = this.target;
                var method = obj[name] ? obj[name] : mass[this.type][name];
                var result = method.apply(obj,arguments);
                return result;
            }
            proto[name+"X"] = function(){
                var obj = this.target;
                var method = obj[name] ? obj[name] : mass[this.type][name];
                var result = method.apply(obj,arguments);
                return Lang.call(this,result) ;
            }
        });
        return force;
    };
    Lang.force = force("Array")("String")("Number")("Object");
    return Lang;
});


//2011.7.12 将toArray转移到lang模块下
//2011.7.26 去掉toArray方法,添加globalEval,parseJSON,parseXML方法
//2011.8.6  增加tag方法
//2011.8.14 更新隐藏的命名空间,重构range方法,将node模块的parseHTML方法移到此处并大幅强化
//2011.8.16 dom.String2,dom.Number2,dom.Array2,dom.Object2,globalEval 更名为dom.String,dom.Number,dom.Array,dom.Object,parseJS
//2011.8.18 dom.Object.merge不再设置undefined的值
//2011.8.28 重构Array.unique
//2011.9.11 重构dom.isArray dom.isFunction
//2011.9.16 修复dom.format BUG
//2011.10.2 优化dom.lang
//2011.10.3 重写dom.isPlainObject与jQuery的保持一致, 优化parseJS，
//2011.10.4 去掉array.without（功能与array.diff相仿），更改object.widthout的参数
//2011.10.6 使用位反操作代替 === -1, 添加array.intersect,array.union
//2011.10.16 添加返回值
//2011.10.21 修复Object.keys BUG
//2011.10.26 优化quote ;将parseJSON parseXML中dom.log改为dom.error; FIX isPlainObject BUG;
//2011.11.6 对parseXML中的IE部分进行强化
//键盘控制物体移动 http://www.wushen.biz/move/
