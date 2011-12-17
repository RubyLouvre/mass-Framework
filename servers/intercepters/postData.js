mass.define("postData","querystring",function(qs){
    console.log("本模块用于取得POST请求过来的数据,并作为request.body而存在");
    return mass.intercepter(function(req,res){
        console.log("进入postData回调");
        req.body = req.body || {};
        if ( req._body ||  /GET|HEAD/.test(req.method) || 'application/x-www-form-urlencoded' !== req.mime ){
            return true;
        }
        var buf = '';
        req.setEncoding('utf8');
        function buildBuffer(chunk){
            buf += chunk
        }
        req.on('data', buildBuffer);
        req.once('end',function(){
            try {
                if(buf != ""){
                    req.body = qs.parse(buf);
                    req._body = true;
                }
                req.emit("next_intercepter",req,res)
            } catch (err){
                req.emit("next_intercepter",req,res,err)
            }finally{
                req.removeListener("data",buildBuffer)
            }
        })
    });
});