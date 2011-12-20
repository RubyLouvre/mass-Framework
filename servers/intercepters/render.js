mass.define("render","fs,path,ejs,helpers",function(fs,path,ejs,helpers){
    var cache = mass.cache["@view_url"] || (mass.cache["@view_url"] = {});
    function fn(type,data){
        var res = this;
        data = data || {}
        switch(type){
            case "tmpl" :
                var filename = res.view_url,
                headers = (res.req || {}).headers || {},
                buffer = cache[filename] ||  path.existsSync(filename) && fs.readFileSync(filename);
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
        }
    }
    return mass.intercepter(function(req, res){
        res.render = fn;
        res.req = req
        return true;
    })
})


