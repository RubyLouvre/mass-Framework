//由于目录下有一个叫node.js的文件，因此不能直接使用node命令，请用node.exe combo
console.log("欢迎使用mass  Framework!")
var modules = {
    dest: "mass.js",
    src: [//这里是可选的模块（不包含补丁模块，为了让框架也能在IE678下使用，请不要删掉补丁模块）
        "lang.js", //各种工具方法
        "class.js", //类工厂
        "flow.js", //观察者模式,流程控制
        "data.js", //缓存
        "query.js",//选择器
        "support.js",//特征侦测
        "css.js", //样式操作
        "attr.js",//属性操作
        "node_safe.js",//节点操作,这是一个保守的版本
        "event.js",//事件系统
        "fx.js",//动画引擎
        "ajax.js"//数据传送
    ]
}
var fs = require("fs");
var curdir = process.cwd() + "/";//当前目录
var files = [];//用于放置要合并的文件内容
var rcomments = /\/\*\*([\s\S]+?)\*\//g;//用于去掉多行注释
var rbody = /[^{]*\{([\d\D]*)\}$/;//用于抽出merge函数的toString()中的内容
var length = modules.src.length;
var names = [];
var alias = {//用于别名
    node_safe: "node"
};

for (var i = 0, url; url = modules.src[i++]; ) {
    (function(orig) {
        var name = alias[orig] || orig;
        names.push(name);
        var path = (curdir + orig + ".js").replace(/\\/g, "/");
        fs.readFile(path, "utf8", function(err, data) {
            if (err) {
                console.log("合并模块 " + name + " 失败!")
                throw err;
            }
            //去掉文档注释,并为它添加上模块名
            var module = data.replace(rcomments, "");
            module = replaceName(module, name);
            if (files.push(module) == length) {
                mergeFile();
            }
        });
    })(url.replace(/\.js$/i, "").replace(/\\/g, "/"));

}
var additionalContent = function() {
    var define = function(a) {
        var array = [basepath + a + ".js"];//重写模块名;basepath变量为mass.js的一个变量
        for (var i = 1; i < arguments.length; i++) {
            var el = arguments[i];
            if (typeof el !== "string") {//已经存在模块名了
                array.push(el);
            }
        }
        return $.define.apply($, array);
    }
    all.replace($.rword, function(a) {
        modules[basepath + a + ".js"] = {
            state: 1
        }
    });

}
function replaceName(module, name) {
    var first = module.indexOf("define"), bracketIndex, quoteIndex, quote, moduleName, flag
    for (var index = first + "define".length; index < 333; index++) {
        var word = module[index];
        if (/[a-z!\[]/i.test(word)) {
            flag = "noModuleID";
            if (!quote) {//如果还没有找到引号就遇到变量或布尔,数组,说明原来是不存在模块名
                break;
            }
        }
        if (word == "(" && !bracketIndex) {//如果遇到挨近define的左小括号的索引值
            bracketIndex = index;
        }
        if (word == "'" || word == '"') {//如果遇到模块ID的这个字面量左右两边的双号
            if (quoteIndex && quote == word) {//如果第二次找到它,并且都是单引号或都是双引号
                moduleName = module.slice(quoteIndex, index + 1);
                if (moduleName.slice(1, -1) == name) {
                    flag = "noChangeModuleName";
                } else {
                    flag = "changeModuleName";
                }
                break;
            }
            if (!quoteIndex) {//如果第一次找到它,记住起始位置
                quoteIndex = index;
                quote = word;//保存
            }
        }
    }
    switch (flag) {
        case "noModuleID":
            var str = module.slice(first, bracketIndex + 1);
            console.log("为匿名模块补上名字 "+name)
            return  module.replace(str, 'define("' + name + '", ');
        case "changeModuleName":
            console.log("更改模块名 "+name);
  
            return  module.replace(moduleName, '"' + name + '"');
        case "noChangeModuleName":
            console.log("不需要作出任何改变");
            return module;
    }
    console.log("这里可能出错")
    return module;
}
function mergeFile() {
    fs.readFile(curdir + modules.dest, "utf8", function(err, seed) {
        if (err) {
            console.log("合并模块 " + modules.base + " 失败!")
            throw err;
        }
        var replaced = additionalContent.toString()
                .replace(rbody, '$1')
                .replace(/^\s*|\s*$/g, '')
                .replace("all", '"' + names + '"')

        //中间切为两部分
        var arr = seed.split("/*combine modules*/");
        //第一部分去掉文档注释
        files.unshift(arr[0].replace(rcomments, ""), replaced);
        files.push(arr[1].replace(rcomments, ""));
        var result = files.join("  \r\n   ");

        fs.writeFile(curdir + "mass_merge.js", result, "utf8", function(err) {
            if (!err)
                console.log("合并成功")
        })

    });
}
