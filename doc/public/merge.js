(function(){
    var fs = require("fs");
    //构建异步列队
    var forEachSeries = function (arr, iterator, callback) {
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    var doSeries = function (fn) {
        return function () {
            [].unshift.call(arguments,forEachSeries );
            return fn.apply(null, arguments);
        };
    };
    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = arr.map(function (x, i) {
            return {
                index: i,
                value: x
            };
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    var mapSeries = doSeries(_asyncMap);

    fs.readFile("../../client/mass.js", function(e,bf){
        if(e)
            console.log(e)
        var text = bf.toString("utf8");
        var modules = ["ecma","lang"];//在这里添加要合并的子模块
        var full = modules.map(function(el){
            return "../../client/"+el+".js";//在这里修正子模块所在的目录
        });
        //必须在合并的模块之前加入如下内容，即patch函数体的代码，并将里面的@@@@@更换为子模块的名称列表
        var patch = function (){
            var module_value = {
                state:2
            };
            var list = "@@@@@".match($.rword);
            for(var i=0, module;module = list[i++];){
                map["@"+module] = module_value;
            }
        }
        //分解patch里面的内容
        var rbody = /[^{]*\{([\d\D]*)\}$/;
        patch = (patch +"").replace(rbody, '$1').replace(/^\s*|\s*$/g, '').replace("@@@@@",modules.join(","));
        //读取子模块对应的文件，并将它们的内容合并到“模块加载模块”中！
        mapSeries(full, fs.readFile,function(e,bf){
            bf.unshift(patch);
            var ret = text.replace("/*combine modules*/", bf.join("\n") );
            fs.writeFile("mass_merge.js",ret,function(e){//生成新的js文件！
                if(e) {
                    console.log();
                }else{
                    console.log("合并成功")
                }
            })
        })
    })
})();

