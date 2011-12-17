mass.define("mime",function(){
    console.log("本模块用于取得MIME,并作为request.mime而存在");
    return mass.intercepter(function(req, res){
        console.log("进入MIME回调");
        var str = req.headers['content-type'] || '';
        req.mime = str.split(';')[0];
        return true;
    });
});
