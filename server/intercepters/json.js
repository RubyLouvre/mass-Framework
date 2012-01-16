mass.define("json",function(){
    console.log("本模块处理前端发过来的JSON数据");
    return mass.intercepter(function(req, res, err){
        req.body = req.body || {};
        if (req._body  || 'GET' == req.method || !~req.mime.indexOf("json")){
            console.log("进入json回调")
            return true;
        }else{
            var buf = '';
            req.setEncoding('utf8');
            function buildBuffer(chunk){
                buf += chunk;
            }
            req.on('data', buildBuffer);
            req.once('end', function(){
                try {
                    req.body = JSON.parse(buf);
                    req._body = true;
                    req.emit("next_intercepter",req,res);
                } catch (err){
                    err.status = 400;
                    req.emit("next_intercepter",req,res,err);
                }finally{
                    req.removeListener("data",buildBuffer);
                }
            });
        }
    })
})