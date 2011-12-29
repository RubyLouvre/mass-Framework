mass.define("render","fs,path,ejs,helpers",function(fs,path,ejs,helpers){
    var cache = mass.cache["@view_url"] || (mass.cache["@view_url"] = {});
    function fn(type,data){
        var res = this;
        data = data || {}
        switch(type){
            case "tmpl" :
            case "file"://file可以指定文件位置
                var filename = type === "tmpl" ?  res.view_url : mass.adjustPath(data),
                headers = (res.req || {}).headers || {},
                buffer = cache[filename] ||  path.existsSync(filename) && fs.readFileSync(filename);
                data = type === "tmpl" ? data :  (arguments[2] || {});
                if (!buffer) {
                    headers[ 'Content-Type'] = 'text/plain'
                    res.writeHead(404, headers);
                    res.end('系统内部错误');
                }else{
                    headers[ 'Content-Type'] = 'text/html'
                    res.writeHead(200, headers);
                    res.write(ejs(buffer.toString("utf8"),mass.mix({},data, helpers,false)));
                    res.end();
                }
                break
            case "json":
                headers[ 'Content-Type'] = 'application/json'
                res.writeHead(200, headers);
                res.end(data);
                break;
                    
        }
    }
    return mass.intercepter(function(req, res){
        res.render = fn;
        res.req = req
        return true;
    })
})


