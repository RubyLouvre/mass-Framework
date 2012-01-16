mass.define("construct","endError", function(endError){
    mass.mix(mass,{
        intercepter : function(fn){//拦截器的外壳
            return function(req, res, err){
                if(err ){
                    endError(err,req,res)
                }else if(fn(req,res) === true){
                    req.emit("next_intercepter", req, res)
                }
            }
        },
        //用于修正路径的方法,可以传N个参数
        adjustPath : function(){
            [].unshift.call(arguments,mass.settings.approot, mass.settings.appname);
            return require("path").join.apply(null,arguments)
        }
    })

    
})

