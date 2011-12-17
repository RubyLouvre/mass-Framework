mass.define("query","querystring,url",function(qs,URL){
    console.log("本模块用于取得URL的参数并转为一个对象,作为request.query而存在");
    return mass.intercepter(function(req, res){
           console.log("进入query回调");
        req.query = ~req.url.indexOf('?')
        ? qs.parse(URL.parse(req.url).query)
        : {};
        return true;
    })
})


