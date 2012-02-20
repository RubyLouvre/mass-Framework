(function(){
    var fs = require("fs");
    var modules = ["lang_fix",'lang',"support","class","data","query","node","css_fix","css","attr","target",
        "event","fx"];//在这里添加要合并的子模块
    var result = [], index = 0;
    //读取子模块对应的文件，并将它们的内容合并到“模块加载模块”中！
    modules.forEach(function(el,i){
        fs.readFile("../../client/"+el+".js", function(e,bf){
            if(e){
                console.log(e);
            }else{
                result[i] = bf.toString("utf8");
                index++;
                //这是最后的回调
                if(index === modules.length){
                    console.log(result.length)
                    fs.readFile("../../client/mass.js", function(e,bf){
                        if(e){
                            console.log(e);
                        }else{
                            var head = 'var module_value = {\n\
                                    state:2\n\
                                };\n\
                                var list = "@@@@@".match($.rword);\n\
                                for(var i=0, module;module = list[i++];){\n\
                                    mapper["@"+module] = module_value;\n\
                                }'
                            var replaced = head.replace("@@@@@",modules.join(","));
                            replaced = replaced + result.join("\n");
                            //必须在合并的模块之前加入如下内容，即patch函数体的代码，并将里面的@@@@@更换为子模块的名称列表
                            var ret = bf.toString("utf8").replace("/*combine modules*/", replaced );
                            fs.writeFile("js/mass_merge.js",ret,"utf8",function(e){//生成新的js文件！
                                if(e) {
                                    console.log();
                                }else{
                                    console.log("合并成功")
                                }
                            })
                        }
                    })
                }
            }
        });
    });
})();