mass.define("favicon","fs,path",function(fs){
    console.log("处理favicon.ico请求");
    var icon;
    return mass.intercepter(function(req, res){
         console.log("进入favicon回调");
        if ('/favicon.ico' == req.url) {
            if (icon) {
                res.writeHead(200, icon.headers);
                res.end(icon.body);
            } else {
                fs.readFile(mass.adjustPath("public/favicon.ico"), function(err, buf){
                    if (err) {
                        req.emit("next_intercepter",req, res,err);
                    }else{
                        icon = {
                            headers: {
                                'Content-Type': 'image/x-icon' , 
                                'Content-Length': buf.length , 
                                'ETag': '"' + mass.md5(buf) + '"', 
                                'Cache-Control': 'public, max-age=' + (86400000 / 1000)
                            },
                            body: buf
                        };
                        res.writeHead(200, icon.headers);
                        res.end(icon.body);
                    }
                });
            }
        } else {
            return true;
        }
    });
});