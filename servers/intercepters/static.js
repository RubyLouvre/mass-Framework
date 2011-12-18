mass.define("static","fs,mime",function(fs,mime){
    console.log("本模块用于处理放到public目录下的静态文件");
    return function(req, res, err){
        console.log("进入static回调");
        var maxAge =  0
        var path  = mass.adjustPath("public",req.location.pathname);
        fs.stat(path, function(err, stat){
            if (err) {
                //如果文件不存在或者路径过长,当作正常
                if('ENOENT' == err.code || 'ENAMETOOLONG' == err.code){
                    req.emit("next_intercepter",req,res);
                }else{
                    req.emit("next_intercepter",req,res,err);
                }
            }else if (stat.isDirectory()) {//如果是文件夹
                req.emit("next_intercepter",req,res);
            }else{
                var type = mime.lookup(path);
                if (!res.getHeader('Date')) res.setHeader('Date', new Date().toUTCString());
                if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=' + (maxAge / 1000));
                if (!res.getHeader('Last-Modified')) res.setHeader('Last-Modified', stat.mtime.toUTCString());
                if (!res.getHeader('Content-Type')) {
                    var charset = mime.charsets.lookup(type);
                    res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
                }
                res.setHeader('Accept-Ranges', 'bytes');

                fs.readFile(path,function(err,data){
                    if (err) {
                        req.emit("next_intercepter",req,res,err);
                    }else{
                        res.write(data);
                        res.end();
                    }
                });
            }
        });
    }

});