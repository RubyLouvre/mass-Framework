mass.define("index","fs",function(fs){
    console.log("index.htmlindex.html");
    return function(req, res){
        console.log("进入index回调")
        res.writeHead(200, {
            "Content-Type": "text/html"
        });
        var html = fs.readFileSync("./index.html")
       // console.log(html)
        res.write(html);
        res.end();
    }
})