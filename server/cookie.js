mass.define("helpers",function(){
    
    return {
        //转换一个字符串为对象
        parse : function(str){
            var obj = {}
            , pairs = str.split(/[;,] */);
            for (var i = 0, len = pairs.length; i < len; ++i) {
                var pair = pairs[i]
                , eqlIndex = pair.indexOf('=')
                , key = pair.substr(0, eqlIndex).trim()
                , val = pair.substr(++eqlIndex, pair.length).trim();

                // quoted values
                if ('"' == val[0]) val = val.slice(1, -1);

                // only assign once
                if (undefined == obj[key]) {
                    val = val.replace(/\+/g, ' ');
                    try {
                        obj[key] = decodeURIComponent(val);
                    } catch (err) {
                        if (err instanceof URIError) {
                            obj[key] = val;
                        } else {
                            throw err;
                        }
                    }
                }
            }
            return obj;
        },
        //将一个对象变成字符串
        stringify:function(name, val, opts){

            var pairs = [name + '=' + encodeURIComponent(val)] , obj = opts || {};
            if (obj.domain) pairs.push('domain=' + obj.domain);
            if (obj.path) pairs.push('path=' + obj.path);
            if (obj.expires) pairs.push('expires=' + obj.expires.toUTCString());
            if (obj.httpOnly) pairs.push('httpOnly');
            if (obj.secure) pairs.push('secure');

            return pairs.join('; ');
  
        }
    }
    
})


