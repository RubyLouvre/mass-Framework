$.define("string", function(){
    $.String({
        //将字符串中的html代码转换为可以直接显示的格式,
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
        //返回search对象或指定参数的值
        getQuery: function(url, key){
            url = url.replace(/^[^?=]*\?/ig, '').split('#')[0];	//去除网址与hash信息
            var json = {};
            //考虑到key中可能有特殊符号如“[].”等，而[]却有是否被编码的可能，所以，牺牲效率以求严谨，就算传了key参数，也是全部解析url。
            url.replace(/(^|&)([^&=]+)=([^&]*)/g, function (a, b, key , value){
                key = decodeURIComponent(key);
                value = decodeURIComponent(value);
                if (!(key in json)) {
                    json[key] = /\[\]$/.test(key) ? [value] : value; //如果参数名以[]结尾，则当作数组
                }
                else if (json[key] instanceof Array) {
                    json[key].push(value);
                }
                else {
                    json[key] = [json[key], value];
                }
            });
            return key ? json[key] : json;
        },
        //返回经过修改location
        setQuery: function(url, hash, value){
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