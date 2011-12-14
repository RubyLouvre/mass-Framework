
var deps = ["mime","postData","query","methodOverride","json","favicon","matcher","handle404"];
mass.define("intercepters", deps.map(function(str){
    return "intercepters/"+str
}).join(","), function(){
    console.log("取得一系列栏截器");
    mass.intercepter = function(fn){//拦截器的外壳
        return function(req, res, err){
            if(err ){
                req.emit("next_intercepter", req, res, err);
            }else if(fn(req,res) === true){
                req.emit("next_intercepter", req, res)
            }
        }
    }
    return [].slice.call(arguments,0)
});
