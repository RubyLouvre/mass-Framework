$.define("string", function(){
    $.String({

        // http://www.cnblogs.com/rubylouvre/archive/2009/11/08/1598383.html
        times :function(target, n){
            var result = "";
            while (n > 0) {
                if (n & 1)
                    result += target;
                target += target;
                n >>= 1;
            }
            return result;
        },
        //转换为整数
        toInt: function(target, radix) {
            return parseInt(target, radix || 10);
        },
        //转换为小数
        toFloat: function(target) {
            return parseFloat(target);
        },
        //转换为十六进制
        toHex: function(target) {
            for (var i = 0, ret = ""; i < target.length; i++) {
                if (target.charCodeAt(i).toString(16).length < 2) {
                    ret += '\\x0' + target.charCodeAt(i).toString(16).toUpperCase() ;
                } else {
                    ret += '\\x' + target.charCodeAt(i).toString(16).toUpperCase() ;
                }
            }
            return ret;
        },
        escapeHTML: function( target ){
            return target.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;').
            replace(/</g, '&lt;').
            replace(/>/g, '&gt;')
            replace(/"/g, '&quot;').
            replace(/'/g, '&#x27;').
            replace(/\//g,'&#x2F;');
        },
        unescapeHTML: function( target ){
            return target.replace(/&lt;/g,'<').
            replace(/&gt;/g,'>').
            replace(/&quot;/g,'"').
            replace(/&#x27;/g,"'").
            replace(/&#x2F;/g,"//").
            replace(/&amp;/g,'&')
        },
        //把 HTML 代码的 TAG 全部去掉，仅保留换行样式（比如 <br> 需转化为 \n）, 原先的 <td> 或 <th> 之间加空格。
        cleanHTML: function(html){
            return  html.replace(/\r?\n/g, '').replace(/<\/?(br|div|p|object|marquee|table|tr|ul|ol|li|dd|dl|h[1-9])\b/gi, function($0, tag){
                return '\n' + $0;
            }).replace(/<\/(td|th)\b/gi, function($0, tag){
                return  ' ' + $0;
            });
        },
        //是否为空白节点
        empty: function (target) {
            return target.valueOf() === '';
        },
        //判定字符串是否只有空白
        blank: function (target) {
            return /^\s*$/.test(target);
        },
        //返回search对象或指定参数的值
        getQuery: $.unparam,
        //返回经过修改location
        setQuery: function(url, hash, value){//对象变
            var obj = $.String.getQuery(url);
            if(typeof hash === "object"){
                $.Object.merge( obj , hash)
            }else{
                obj.hash = value
            }
            var arr = []
            Object.keys(function(key){
                if( obj[key] ){
                    arr.push(key+"="+obj[key])
                }
            });
            if(arr.length){
                return url.replace(/[#?].*/, '') + "?" +arr.join("&")
            }else{
                return url
            }
        },
        manualLowercase : function(s) {
            return isString(s)
            ? s.replace(/[A-Z]/g, function(ch) {
                return fromCharCode(ch.charCodeAt(0) | 32);
            })
            : s;
        },
        manualUppercase : function(s) {
            return isString(s)
            ? s.replace(/[a-z]/g, function(ch) {
                return fromCharCode(ch.charCodeAt(0) & ~32);
            })
            : s;
        },
        /**
 * We need our custom mehtod because encodeURIComponent is too agressive and doesn't follow
 * http://www.ietf.org/rfc/rfc3986.txt with regards to the character set (pchar) allowed in path
 * segments:
 *    segment       = *pchar
 *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
 *    pct-encoded   = "%" HEXDIG HEXDIG
 *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
 *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
 *                     / "*" / "+" / "," / ";" / "="
 */
        encodeUriSegment:function (val) {
            return encodeUriQuery(val, true).
            replace(/%26/gi, '&').
            replace(/%3D/gi, '=').
            replace(/%2B/gi, '+');
        },
        /**
 * This method is intended for encoding *key* or *value* parts of query component. We need a custom
 * method becuase encodeURIComponent is too agressive and encodes stuff that doesn't have to be
 * encoded per http://tools.ietf.org/html/rfc3986:
 *    query       = *( pchar / "/" / "?" )
 *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
 *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
 *    pct-encoded   = "%" HEXDIG HEXDIG
 *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
 *                     / "*" / "+" / "," / ";" / "="
 */
        encodeUriQuery:function (val, pctEncodeSpaces) {
            return encodeURIComponent(val).
            replace(/%40/gi, '@').
            replace(/%3A/gi, ':').
            replace(/%24/g, '$').
            replace(/%2C/gi, ',').
            replace((pctEncodeSpaces ? null : /%20/g), '+');
        }


    })
    /**
 * Parses an escaped url query string into key-value pairs.
 * @returns Object.<(string|boolean)>
 */
    function parseKeyValue(/**string*/keyValue) {
        var obj = {}, key_value, key;
        forEach((keyValue || "").split('&'), function(keyValue){
            if (keyValue) {
                key_value = keyValue.split('=');
                key = decodeURIComponent(key_value[0]);
                obj[key] = isDefined(key_value[1]) ? decodeURIComponent(key_value[1]) : true;
            }
        });
        return obj;
    }

    function toKeyValue(obj) {
        var parts = [];
        forEach(obj, function(value, key) {
            parts.push(encodeUriQuery(key, true) + (value === true ? '' : '=' + encodeUriQuery(value, true)));
        });
        return parts.length ? parts.join('&') : '';
    }
});