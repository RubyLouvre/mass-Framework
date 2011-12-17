mass.define("methodOverride",function(){
    console.log("本模块用于校正method属性");
    var methods = {
        "PUT":"PUT",
        "DELETE":"DELETE"
    },
    method = mass.settings.http_method || "_method";
    return mass.intercepter(function(req, res){
        console.log("进入methodOverride回调");
        req.originalMethod = req.method;
        var defaultMethod = req.method === "HEAD" ? "GET" : req.method;
        var _method = req.body ? req.body[method] : req.headers['x-http-method-override']
        _method = (_method || "").toUpperCase();
        req.method = methods[_method] || defaultMethod;
        if(req.body){
            delete req.body[method];
        }
        return true;
    });
});