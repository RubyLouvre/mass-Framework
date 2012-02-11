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
        }
    })

})