mass.define("static","fs, mime",function(fs,mime){
    console.log("本模块用于处理放到public目录下的静态文件");
    return function(req, res, err){
        console.log("进入static回调");
        var cache = mass.cache;
        var path  = mass.adjustPath("public",req.location.pathname);

        fs.stat(path, function(err, stat){
            if (err) {
                delete cache[path]
                //如果文件不存在或者路径过长,当作正常
                if('ENOENT' == err.code || 'ENAMETOOLONG' == err.code){
                    req.emit("next_intercepter",req,res);
                }else{
                    req.emit("next_intercepter",req,res,err);
                }
            }else if (stat.isDirectory()) {//如果是文件夹
                delete cache[path]
                req.emit("next_intercepter",req,res);
            }else{
                var cacheObj = cache[path];
                var headers = cacheObj ? cacheObj.headers : {};
                headers['Etag']          = JSON.stringify([stat.ino, stat.size,  (stat.mtime -0)].join('-'));
                headers['Date']          = (new Date).toUTCString();
                headers['Last-Modified'] = stat.mtime.toUTCString();
                if(cacheObj && cacheObj.mtime >= stat.mtime){//如果服务没有调整
                    console.log("进入缓存系统") 
                    //Last-Modified 与If-Modified-Since 都是用于记录页面最后修改时间的 HTTP 头信息，
                    //只是 Last-Modified 是由服务器往客户端发送的 HTTP 头，而 If-Modified-Since 
                    //则是由客户端往服务器发送的头，可 以看到，再次请求本地存在的 cache 页面时，
                    //客户端会通过 If-Modified-Since 头将先前服务器端发过来的 Last-Modified 最后修改时间戳发送回去，
                    //这是为了让服务器端进行验证，通过这个时间戳判断客户端的页面是否是最新的，如果不是最新的，
                    //则返回新的内容，如果是最新的，则 返回 304 告诉客户端其本地 cache 的页面是最新的，
                    //于是客户端就可以直接从本地加载页面了，这样在网络上传输的数据就会大大减少，同时也减轻了服务器的负担。
                    var ifModifiedSince = "If-Modified-Since".toLowerCase();
                    var lastModified = stat.mtime.toUTCString();
                    if ( req.headers[ifModifiedSince] && lastModified == req.headers[ifModifiedSince]) {
                        res.writeHead(304, "Not Modified");
                        res.end();
                    }else{
                        res.writeHead(200, headers);
                        res.end(cacheObj.buffer);
                    }
                }else{
                    headers['Content-Length'] = stat.size;
                    var MIME = mime.lookup(path);
                    var charset = mime.charsets.lookup(MIME);
                    headers['Content-Type'] = MIME + (charset ? '; charset=' + charset : '');
                    fs.readFile(path,function(err,buffer){
                        if (err) {
                            req.emit("next_intercepter",req,res,err);
                        }else{
                            cache[path] = {
                                headers:headers,
                                buffer:buffer,
                                mtime:stat.mtime
                            }
                            res.write(buffer);
                            res.end();
                        }
                    });
                }
            }
        });
    }
});

