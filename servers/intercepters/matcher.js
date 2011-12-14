mass.define("intercepters/matcher","url",function(URL){
    console.log("用于匹配请求过来的回调")
    return  mass.intercepter(function(req,res){
        console.log("进入matcher回调");
        var pathname = URL.parse(req.url).pathname, is404 = true,method = req.method, arr = mapper[method];
        console.log(pathname)
        for(var i =0, obj; obj = arr[i++];){
            if(obj.matcher.test(pathname)){
                is404 = false
                var url = mass.adjustPath("app/controllers/",obj.namespace, obj.controller+"_controller.js")
                mass.require(obj.controller+"_controller("+url +")",function(object){
                    object[obj.action](req,res);//进入控制器的action!!!
                    console.log("5555555555555555555555")
                    console.log(obj.action)
                },function(){
                    var err = new Error;
                    err.statusCode = 404;
                    console.log("11111111111111111111111")
                //    req.emit("next_intercepter",req,res,err);
                })
                break;
            }
        }
        if(is404){
            console.log("222222222222222222222222222")
            var err = new Error;
            err.statusCode = 404
          //  req.emit("next_intercepter",req,res,err);
        }
    })
})