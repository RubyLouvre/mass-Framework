mass.define("matcher",function(){
    console.log("用于匹配请求过来的回调")
    return  mass.intercepter(function(req,res){
        console.log("进入matcher回调");
        var pathname = req.location.pathname, is404 = true,method = req.method, arr = mapper[method];
        for(var i =0, obj; obj = arr[i++];){
            if(obj.matcher.test(pathname)){
                is404 = false;
                console.log("已经有匹配")
                var url = mass.adjustPath("app/controllers/",obj.namespace, obj.controller+"_controller.js")
                res.view_url = mass.adjustPath("app/views/",obj.namespace, obj.controller, obj.action+".html")
                
                mass.require(obj.controller+"_controller("+url +")",function(object){
                    object[obj.action](req,res);//进入控制器的action!!!
                    console.log(obj.action)
                },function(){
                    var err = new Error;
                    err.statusCode = 404;
                    console.log("11111111111111111111111")
                    req.emit("next_intercepter",req,res,err);
                })
                break;
            }
        }
        if(is404){
            console.log("222222222222222222222222222")
            var err = new Error;
            err.statusCode = 404
            req.emit("next_intercepter",req,res,err);
        }
    })
});
/**
* 
前后端不一样。

很少有听说后端同学为了使用某个组件，比如rbac权限控制，而刻意改变自己的模型或模型的关系吧？

但是前端同学为了使用现成的某个组件，会经常调整自己的数据对象的格式，，来满足组件的要求。

这是因为前端的复杂度在适应多浏览器的兼容组件的编写上，所以弱化数据，，让数据模型去适应控制器。

后端一般都是控制器（角色）去适应模型（实体），而不是改变自己的模型，去适应自己的控制器吧。
* */
