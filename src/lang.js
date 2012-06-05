//=========================================
// 类型扩展模块v3 by 司徒正美
//=========================================
$.define("lang", Array.isArray ? "" : "lang_fix",function(){
    // $.log("已加载语言扩展模块");
    var global = this, rascii = /[^\x00-\xff]/g,
    rformat = /\\?\#{([^{}]+)\}/gm,
    rnoclose = /^(area|base|basefont|bgsound|br|col|frame|hr|img|input|isindex|link|meta|param|embed|wbr)$/i,
    // JSON RegExp
    rvalidchars = /^[\],:{}\s]*$/,
    rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
    rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    str_eval = global.execScript ? "execScript" : "eval",
    str_body = (global.open + '').replace(/open/g, '');
    $.mix({
        //判定是否是一个朴素的javascript对象（Object或JSON），不是DOM对象，不是BOM对象，不是自定义类的实例。
        isPlainObject: function (obj){
            if(!$.type(obj,"Object") || $.isNative(obj, "reload") ){
                return false;
            }
            try{//不存在hasOwnProperty方法的对象肯定是IE的BOM对象或DOM对象
                for(var key in obj)//只有一个方法是来自其原型立即返回flase
                    if(!({}).hasOwnProperty.call(obj, key)){//不能用obj.hasOwnProperty自己查自己
                        return false
                    }
            }catch(e){
                return false;
            }
            return true;
        },
        //判定method是否为obj的原生方法，如$.isNative(global,"JSON")
        isNative: function(obj, method) {
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
        //限定为Array, Arguments, NodeList与拥有非负整数的length属性的Object对象，视情况添加字符串
        isArrayLike:  function (obj, str) {//是否包含字符串
            var type = $.type(obj);
            if(type === "Array" || type === "NodeList" || type === "Arguments" || str && type === "String"){
                return true;
            }
            if( type === "Object" ){
                var i = obj.length;
                return i >= 0 &&  parseInt( i ) === i;//非负整数
            }
            return false;
        },
        makeArray: function(obj){
            if (obj == null) {
                return [];
            }
            if($.isArrayLike(obj)){
                return $.slice( obj )
            }
            return [ obj ]
        },
        //将字符串中的占位符替换为对应的键值
        //http://www.cnblogs.com/rubylouvre/archive/2011/05/02/1972176.html
        format: function(str, object){
            var array = $.slice(arguments,1);
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
        tag: function (start, content, xml){
            xml = !!xml
            var chain = function(start, content, xml){
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
        range: function(start, stop, step) {
            step || (step = 1);
            if (arguments.length < 2) {
                stop = start || 0;
                start = 0;
            }
            var index = -1,
            length = Math.max(Math.ceil((stop - start) / step), 0),
            result = Array(length);
            while (++index < length) {
                result[index] = start;
                start += step;
            }
            return result;
        },
        // 为字符串两端添上双引号,并对内部需要转义的地方进行转义
        quote: global.JSON && JSON.stringify || String.quote ||  (function(){
            var meta = {
                '\t':'t',
                '\n':'n',
                '\v':'v',
                '\f':'f',
                '\r':'r',
                '\'':'\'',
                '\"':'\"',
                '\\':'\\'
            },
            reg = /[\x00-\x1F\'\"\\\u007F-\uFFFF]/g,
            regFn = function(c){
                if (c in meta) {
                    return '\\' + meta[c];
                }
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
        dump: function(obj, indent) {
            indent = indent || "";
            if (obj == null)//处理null,undefined
                return indent + "obj";
            if (obj.nodeType === 9)
                return indent + "[object Document]";
            if (obj.nodeType)
                return indent + "[object " + (obj.tagName || "Node") +"]";
            var arr = [], type = $.type(obj),self = $.dump ,next = indent +  "\t";
            switch (type) {
                case "Boolean":
                case "Number":
                case "NaN":
                case "RegExp":
                    return indent + obj;
                case "String":
                    return indent + $.quote(obj);
                case "Function":
                    return (indent + obj).replace(/\n/g, "\n" + indent);
                case "Date":
                    return indent + '(new Date(' + obj.valueOf() + '))';
                case "Window" :
                    return indent + "[object "+type +"]";
                default:
                    if($.isArrayLike(obj)){
                        for (var i = 0, n = obj.length; i < n; ++i)
                            arr.push(self(obj[i], next).replace(/^\s* /g, next));
                        return indent + "[\n" + arr.join(",\n") + "\n" + indent + "]";
                    }
                    if($.isPlainObject(obj)){
                        for ( i in obj) {
                            arr.push(next + self(i) + ": " + self(obj[i], next).replace(/^\s+/g, ""));
                        }
                        return indent + "{\n" + arr.join(",\n") + "\n" + indent + "}";
                    }
                    return indent + "[object "+type +"]";
            }
        },
        //http://www.schillmania.com/content/projects/javascript-animation-1/
        //http://www.cnblogs.com/rubylouvre/archive/2010/04/09/1708419.html
        parseJS: function( code ) {
            //IE中，global.eval()和eval()一样只在当前作用域生效。
            //Firefox，Safari，Opera中，直接调用eval()为当前作用域，global.eval()调用为全局作用域。
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
            throw "Invalid JSON: " + data ;
        },

        // Cross-browser xml parsing
        parseXML: function ( data,xml,tmp ) {
            try {
                if ( global.DOMParser ) { // Standard
                    tmp = new DOMParser();
                    xml = tmp.parseFromString(data , "text/xml" );
                } else { // IE
                    xml = new ActiveXObject("Microsoft.XMLDOM" );//"Microsoft.XMLDOM"
                    xml.async = "false";
                    xml.loadXML( data );
                }
            } catch( e ) {
                xml = undefined;
            }
            if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
                throw "Invalid XML: " + data ;
            }
            return xml;
        },
        //http://oldenburgs.org/playground/autocomplete/
        //http://benalman.com/projects/jquery-throttle-debounce-plugin/
        //http://www.cnblogs.com/ambar/archive/2011/10/08/throttle-and-debounce.html
        throttle: function( delay, no_trailing, callback, debounce_mode ) {
            var timeout_id, last_exec = 0;//ms 时间内只执行 fn 一次, 即使这段时间内 fn 被调用多次
            if ( typeof no_trailing !== 'boolean' ) {
                debounce_mode = callback;
                callback = no_trailing;
                no_trailing = undefined;
            }
            function wrapper() {
                var that = this,
                elapsed = +new Date() - last_exec,
                args = arguments;
                function exec() {
                    last_exec = +new Date();
                    callback.apply( that, args );
                };
                function clear() {
                    timeout_id = undefined;
                };
                if ( debounce_mode && !timeout_id ) {
                    exec();
                }
                timeout_id && clearTimeout( timeout_id );
                if ( debounce_mode === undefined && elapsed > delay ) {
                    exec();
                } else if ( no_trailing !== true ) {
                    timeout_id = setTimeout( debounce_mode ? clear : exec, debounce_mode === undefined ? delay - elapsed : delay );
                }
            };
            wrapper.uniqueNumber = $.getUid(callback)
            return wrapper;
        },
        debounce : function( delay, at_begin, callback ) {
            return callback === undefined
            ? $.throttle( delay, at_begin, false )
            : $.throttle( delay, callback, at_begin !== false );
        }

    }, false);
   
    "Array,Function".replace($.rword, function( method ){
        $[ "is"+method ] = function(obj){
            return obj && ({}).toString.call(obj) === "[object "+method+"]";
        }
    });
    "each,map".replace($.rword, function( method ){
        $[ method ] = function(obj, fn, scope){
            return $[ $.isArrayLike(obj,true) ? "Array" : "Object" ][ method ](obj, fn, scope);
        }
    });
    if(Array.isArray){
        $.isArray = Array.isArray;
    }
    //这只是一个入口
    $.lang = function(obj, type){
        return adjust(new Chain, obj, type)
    }
    //调整Chain实例的重要属性
    function adjust(chain, obj, type){
        type = type || $.type(obj);
        if( type != "Array" && $.isArrayLike(type) ){
            obj = $.slice(obj);
            type = "Array";
        }
        chain.target = obj;
        chain.type = type;
        return chain
    }
    //语言链对象
    var Chain = function(){ }
    Chain.prototype = {
        constructor: Chain,
        toString: function(){
            return this.target + "";
        },
        value: function(){
            return this.target;
        }
    };

    var retouch = function(method){//函数变换，静态转原型
        return function(){
            [].unshift.call(arguments,this)
            return method.apply(null,arguments)
        }
    }
    var proto = Chain.prototype;
    //构建语言链对象的四个重要工具:$.String, $.Array, $.Number, $.Object
    "String,Array,Number,Object".replace($.rword, function(Type){
        $[ Type ] = function(ext){
            var isNative = typeof ext == "string",
            methods = isNative ? ext.match($.rword) : Object.keys(ext);
            methods.forEach(function(name){
                $[ Type ][name] = isNative ? function(obj){
                    return obj[name].apply(obj,$.slice(arguments,1) );
                } :  ext[name];
                proto[name] = function(){
                    var target = this.target;
                    if( target == null){
                        return this;
                    }else{
                        if( !(target[name] || $[ this.type ][name]) ){
                            throw "$."+ this.type + "."+name+" does not exist!"
                        }
                        var method = isNative ? target[name] : retouch( $[ this.type ][name] ),
                        next = this.target = method.apply( target, arguments ),
                        type = $.type( next );
                        if( type === this.type){
                            return this;
                        }else{
                            return adjust(this, next, type)
                        }
                    }
                }
            });
        }
    });
    
    $.String({
        //判断一个字符串是否包含另一个字符
        contains: function(target, str, separator){
            return (separator) ? !!~(separator + target + separator).indexOf(separator + str + separator) : !!~target.indexOf(str);
        },
        //判定是否以给定字符串开头
        startsWith: function(target, str, ignorecase) {
            var start_str = target.substr(0, str.length);
            return ignorecase ? start_str.toLowerCase() === str.toLowerCase() :
            start_str === str;
        },
        //判定是否以给定字符串结尾
        endsWith: function(target, str, ignorecase) {
            var end_str = target.substring(target.length - str.length);
            return ignorecase ? end_str.toLowerCase() === str.toLowerCase() :
            end_str === str;
        },
        //得到字节长度
        byteLen:function(target){
            return target.replace(rascii,"--").length;
        },

        //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
        truncate :function(target, length, truncation) {
            length = length || 30;
            truncation = truncation === void(0) ? '...' : truncation;
            return target.length > length ?
            target.slice(0, length - truncation.length) + truncation : String(target);
        },
        //转换为驼峰风格
        camelize: function(target){
            if (target.indexOf('-') < 0 && target.indexOf('_') < 0) {
                return target;//提前判断，提高getStyle等的效率
            }
            return target.replace(/[-_][^-_]/g, function (match) {
                return match.charAt(1).toUpperCase();
            });
        },
        //转换为连字符风格
        underscored: function(target) {
            return target.replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/\-/g, '_').toLowerCase();
        },
        //首字母大写
        capitalize: function(target){
            return target.charAt(0).toUpperCase() + target.substring(1).toLowerCase();
        },
        //去掉字符串中的html标签，但这方法有缺陷，如里面有script标签，会把这些不该显示出来的脚本也显示出来了
        stripTags:function (str) {
            return String(str ||"").replace(/<[^>]+>/g, '');
        },
        //移除字符串中所有的 HTML script 块。弥补stripTags方法对script标签的缺陷
        stripScripts : function(str){
            return String(str ||"").replace(/<script[^>]*>([\S\s]*?)<\/script>/img,'')
        },
        //将字符串中的html代码转换为可以直接显示的格式,
        escapeHTML:  function (str) {
            return str.replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        },
        //还原为可被文档解析的HTML标签
        unescapeHTML: function (str) {
            return  str.replace(/&quot;/g,'"')
            .replace(/&lt;/g,'<')
            .replace(/&gt;/g,'>')
            .replace(/&amp;/g, "&");
            //处理转义的中文和实体字符
            return str.replace(/&#([\d]+);/g, function(_0, _1){
                return String.fromCharCode(parseInt(_1, 10));
            });
        },
        //http://stevenlevithan.com/regex/xregexp/
        //将字符串安全格式化为正则表达式的源码
        escapeRegExp: function( target ){
            return target.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
        },
        /**
 为目标字符串添加wbr软换行
1.支持html标签、属性以及字符实体。<br>
2.任意字符中间都会插入wbr标签，对于过长的文本，会造成dom节点元素增多，占用浏览器资源。
3.在opera下，浏览器默认css不会为wbr加上样式，导致没有换行效果，可以在css中加上 wbr:after { content: "\00200B" } 解决此问题*/
        wbr: function (source) {
            return String(source)
            .replace(/(?:<[^>]+>)|(?:&#?[0-9a-z]{2,6};)|(.{1})/gi, '$&<wbr>')
            .replace(/><wbr>/g, '>');
        },
        //http://www.cnblogs.com/rubylouvre/archive/2010/02/09/1666165.html
        //在左边补上一些字符,默认为0
        padLeft: function( target, digits, filling, radix ){
            var num = target.toString(radix || 10);
            filling = filling || "0";
            while(num.length < digits){
                num= filling + num;
            }
            return num;
        },

        //在右边补上一些字符,默认为0
        padRight: function(target, digits, filling, radix){
            var num = target.toString(radix || 10);
            filling = filling || "0";
            while(num.length < digits){
                num +=  filling;
            }
            return num;
        }

    });
    $.String("charAt,charCodeAt,concat,indexOf,lastIndexOf,localeCompare,match,"+
        "replace,search,slice,split,substring,toLowerCase,toLocaleLowerCase,toUpperCase,trim,toJSON")
    $.Array({
        //深拷贝当前数组
        clone: function( target ){
            var i = target.length, result = [];
            while (i--) result[i] = cloneOf(target[i]);
            return result;
        },
        each: function( target, fn, scope  ){
            for(var i = 0, n = target.length; i < n; i++){
                if (fn.call(scope || target[i], target[i], i, target) === false)
                    break;
            }
            return target;
        },
        //取得第一个元素或对它进行操作
        first: function( target, fn, scope ){
            if($.type(fn,"Function")){
                for(var i=0, n = target.length; i < n; i++){
                    if(fn.call( scope,target[i], i, target )){
                        return target[i];
                    }
                }
                return null;
            }else{
                return target[0];
            }
        },
        //取得最后一个元素或对它进行操作
        last: function( target, fn, scope ) {
            if($.type(fn,"Function")){
                for (var i=target.length-1; i > -1; i--) {
                    if (fn.call(scope, target[i], i, target)) {
                        return target[i];
                    }
                }
                return null;
            }else{
                return target[target.length-1];
            }
        },
        //判断数组是否包含此元素
        contains: function ( target, item ) {
            return !!~target.indexOf(item) ;
        },
        //http://msdn.microsoft.com/zh-cn/library/bb383786.aspx
        //移除 Array 对象中某个元素的第一个匹配项。
        remove: function ( target, item ) {
            var index = target.indexOf(item);
            if (~index ) return $.Array.removeAt(target, index);
            return null;
        },
        //移除 Array 对象中指定位置的元素。
        removeAt: function ( target, index ) {
            return target.splice(index, 1);
        },
        //对数组进行洗牌,但不影响原对象
        // Jonas Raoni Soares Silva http://jsfromhell.com/array/shuffle [v1.0]
        shuffle: function ( target ) {
            var shuff = target.concat(), j, x, i = shuff.length;
            for (; i > 0; j = parseInt(Math.random() * i), x = shuff[--i], shuff[i] = shuff[j], shuff[j] = x) {};
            return shuff;
        },
        //从数组中随机抽选一个元素出来
        random: function ( target ) {
            return $.Array.shuffle( target )[0];
        },
        //取得数字数组中值最小的元素
        min: function( target ) {
            return Math.min.apply(0, target);
        },
        //取得数字数组中值最大的元素
        max: function( target ) {
            return Math.max.apply(0, target);
        },
        //取得对象数组的每个元素的特定属性
        pluck:function( target, name ){
            var result = [], prop;
            target.forEach(function(item){
                prop = item[name];
                if(prop != null)
                    result.push(prop);
            });
            return result;
        },
        //根据对象的某个属性进行排序
        sortBy: function( target, fn, scope ) {
            var array =  target.map(function(item, index) {
                return {
                    el: item,
                    re: fn.call(scope, item, index)
                };
            }).sort(function(left, right) {
                var a = left.re, b = right.re;
                return a < b ? -1 : a > b ? 1 : 0;
            });
            return $.Array.pluck(array,'el');
        },
        // 以数组形式返回原数组中不为null与undefined的元素
        compact: function ( target ) {
            return target.filter(function (el) {
                return el != null;
            });
        },
        //取差集(补集)
        diff : function( target, array ) {
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
        },
        merge: function( target, array ){
            var i = target.length, j = 0;
            for ( var n = array.length; j < n; j++ ) {
                target[ i++ ] = array[ j ];
            }
            target.length = i;
            return target;
        },
        //取并集
        union :function( target, array ){
            $.Array.merge(target, array)
            return $.Array.unique( target );
        },
        //取交集
        intersect:function( target, array ){
            return target.filter(function(n) {
                return ~array.indexOf(n);
            });
        },
        // 返回没有重复值的新数组
        unique: function ( target ) {
            var result = [];
                o:for(var i = 0, n = target.length; i < n; i++) {
                    for(var x = i + 1 ; x < n; x++) {
                        if(target[x] === target[i])
                            continue o;
                    }
                    result.push(target[i]);
                }
            return result;
        },
        //对数组进行平坦化处理，返回一个一维数组
        flatten: function(target) {
            var result = [],self = $.Array.flatten;
            target.forEach(function(item) {
                if ($.isArray(item)) {
                    result = result.concat(self(item));
                } else {
                    result.push(item);
                }
            });
            return result;
        }
    });
    $.Array("concat,join,pop,push,shift,slice,sort,reverse,splice,unshift"+
        "indexOf,lastIndexOf,every,some,forEach,map,filter,reduce,reduceRight")
    var NumberExt = {
        times: function(target, fn, bind) {
            for (var i=0; i < target; i++)
                fn.call(bind, i);
            return target;
        },
        //确保数值在[n1,n2]闭区间之内,如果超出限界,则置换为离它最近的最大值或最小值
        constrain: function(target, n1, n2){
            var a = [n1, n2].sort();
            if(target < a[0]) target = a[0];
            if(target > a[1]) target = a[1];
            return target;
        },
        //求出距离原数最近的那个数
        nearer: function(target, n1, n2){
            var diff1 = Math.abs(target - n1),
            diff2 = Math.abs(target - n2);
            return diff1 < diff2 ? n1 : n2
        },
        upto: function(target, number, fn, scope) {
            for (var i=target+0; i <= number; i++)
                fn.call(scope, i);
            return target;
        },
        downto: function(target, number, fn, scope) {
            for (var i=target+0; i >= number; i--)
                fn.call(scope, i);
            return target;
        },
        round: function(target, base) {
            if (base) {
                base = Math.pow(10, base);
                return Math.round(target * base) / base;
            } else {
                return Math.round(target);
            }
        }
    }
    "padLeft,padRight".replace($.rword, function(name){
        NumberExt[name] = $.String[name];
    });
    "abs,acos,asin,atan,atan2,ceil,cos,exp,floor,log,pow,sin,sqrt,tan".replace($.rword,function(name){
        NumberExt[name] = Math[name];
    });
    $.Number(NumberExt);
    $.Number("toFixed,toExponential,toPrecision,toJSON")
    function cloneOf(item){
       
        var name = $.type(item);
        switch(name){
            case "Array":
            case "Object":
                return $[name].clone(item);
            default:
                return item;
        }
       
    }
    //使用深拷贝方法将多个对象或数组合并成一个
    function mergeOne(source, key, current){
        if( $.isPlainObject(source[key]) ){//只处理纯JS对象，不处理window与节点
            $.Object.merge(source[key], current);
        }else {
            source[key] = cloneOf(current)
        }
        return source;
    };

    $.Object({
        //根据传入数组取当前对象相关的键值对组成一个新对象返回
        subset: function(target, props){
            var result = {};
            props.forEach(function(prop){
                result[prop] = target[prop];
            });
            return result;
        },
        //遍历对象的键值对
        each: function(target, fn, scope){
            var keys = Object.keys(target);
            for(var i = 0, n = keys.length; i < n; i++){
                var key = keys[i], value = target[key];
                if (fn.call(scope || value, value, key, target) === false)
                    break;
            }
            return target;
        },
        map: function(target, fn, scope){
            return Object.keys(target).map(function(name){
                return fn.call(scope, target[name], name, target);
            }, target);
        },
        //进行深拷贝，返回一个新对象，如果是拷贝请使用$.mix
        clone: function(target){
            var clone = {};
            for (var key in target) {
                clone[key] = cloneOf(target[key]);
            }
            return clone;
        },
        merge: function(target, k, v){
            var obj, key;
            //为目标对象添加一个键值对
            if (typeof k === "string")
                return mergeOne(target, k, v);
            //合并多个对象
            for (var i = 1, n = arguments.length; i < n; i++){
                obj = arguments[i];
                for ( key in obj){
                    if(obj[key] !== void 0){
                        mergeOne(target, key, obj[key]);
                    }
                }
            }
            return target;
        },
        //去掉与传入参数相同的元素
        without: function(target, array) {
            var result = {}, key;
            for (key in target) {//相当于构建一个新对象，把不位于传入数组中的元素赋给它
                if (!~array.indexOf(key) ) {
                    result[key] = target[key];
                }
            }
            return result;
        }
    });
    $.Object("hasOwnerProperty,isPrototypeOf,propertyIsEnumerable");
    return $.lang;
});
/**
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
2012.1.31 去掉$.Array.ensure，添加$.Array.merge
2012.3.17 v4 重构语言链对象
2012.5.21 添加$.Array.each方法,重构$.Object.each与$.each方法;
2012.6.5 更新camelize，escapeHTML, unescapeHTML,stripTags,stripScripts,wbr方法
键盘控制物体移动 http://www.wushen.biz/move/
https://github.com/tristen/tablesort
 */