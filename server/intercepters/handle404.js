mass.define("handle404","fs",function(fs){
    console.log("本模块用于处理404错误");
    return function(req, res, err){
        console.log("进入handle404回调");
        var accept = req.headers.accept || '';
        if (~accept.indexOf('html')) {
            res.writeHead(404, {
                "Content-Type": "text/html"
            });
            var html = fs.readFileSync(mass.adjustPath("public/404.html"))
            res.write((html+"").replace("{{url}}",req.url));
            res.end();
        } else if (~accept.indexOf('json')) {//json
            var error = {
                message: err.message, 
                stack: err.stack
            };
            for (var prop in err) error[prop] = err[prop];
            var json = JSON.stringify({
                error: error
            });
            res.setHeader('Content-Type', 'application/json');
            res.end(json);
        // plain text
        } else {
            res.writeHead(res.statusCode, {
                'Content-Type': 'text/plain'
            });
            res.end(err.stack);
        }
    }
});