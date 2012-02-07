$.define("html2text",function(){
    return function(sHtml){
        //把 HTML 代码的 TAG 全部去掉，仅保留换行样式（比如 <br> 需转化为 \n）, 原先的 <td> 或 <th> 之间加空格。
        sHtml = sHtml.replace(/\r?\n/g, '').replace(/<\/?(br|div|p|object|marquee|table|tr|ul|ol|li|dd|dl|h[1-9])\b/gi, function($0, tag){
            return '\n' + $0;
        }).replace(/<\/(td|th)\b/gi, function($0, tag){
            return  ' ' + $0;
        });
        var element = document.createElement('div');
        element.innerHTML = sHtml;
        return element.textContent || element.innerText;
    }
})
