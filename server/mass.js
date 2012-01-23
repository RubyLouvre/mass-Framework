
(function(){
    //后端部分　2011.12.4 by 司徒正美
    function $(){}
    var
    version = 0.1,
    class2type = {
        "[object global]" : "Global" ,
        "null" : "Null" ,
        "NaN"  : "NaN"  ,
        "undefined" : "Undefined"
    },
    toString = class2type.toString;
    /**
     * 糅杂，为一个对象添加更多成员
     * @param {Object} target 目标对象
     * @param {Object} source 属性包
     * @return {Object} 目标对象
     */
    function mix(target, source){
        var args = [].slice.call(arguments), key,
        ride = typeof args[args.length - 1] == "boolean" ? args.pop() : true;
        target = target || {};
        for(var i = 1; source = args[i++];){
            for (key in source) {
                if (ride || !(key in target)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }
    var rformat = /<code\s+style=(['"])(.*?)\1\s*>([\d\D]+?)<\/code>/ig,
    formats = {
        bold     : [1, 22],
        italic    : [3, 23],
        underline : [4, 24],
        inverse   : [7, 27],
        strike    : [9, 29]
    };
    var colors = {},fs = require("fs"), path = require("path");
    ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'].forEach(function(word,i){
        colors[word] = i
    });
    colors.gray = 99;
    function format (arr, str) {
        return '\x1b[' + arr[0] + 'm' + str + '\x1b[' + arr[1] + 'm';
    };
    mix($,{//为此版本的命名空间对象添加成员
        rword : /[^, ]+/g,
        mass : version,
        "@debug" : true,
        /**
         * 数组化
         * @param {ArrayLike} nodes 要处理的类数组对象
         * @param {Number} start 可选。要抽取的片断的起始下标。如果是负数，从后面取起
         * @param {Number} end 可选。规定从何处结束选取
         * @return {Array}
         */
        slice: function (nodes, start, end) {
            for(var i = 0,n = nodes.length, result = []; i < n; i++){
                result[i] = nodes[i];
            }
            if (arguments.length > 1) {
                return result.slice(start , (end || result.length));
            } else {
                return result;
            }
        },
        //提供三组对文件夹的批处理:创建文件(夹),创建某一目录的东西到新目录,删除文件(夹)
        mkdirSync:function(url,mode,cb){
            var path = require("path"), arr = url.replace(/\\/g,"/").split("/");
            mode = mode || 0755;
            cb = cb || $.noop;
            if(arr[0]==="."){//处理 ./aaa
                arr.shift();
            }
            if(arr[0] == ".."){//处理 ../ddd/d
                arr.splice(0,2,arr[0]+"/"+arr[1])
            }
            function inner(cur){
                if(!path.existsSync(cur)){//不存在就创建一个
                    fs.mkdirSync(cur, mode);
                    $.log("<code style='color:green'>创建目录"+cur+"成功</code>",true);
                }
                if(arr.length){
                    inner(cur + "/"+arr.shift());
                }else{
                    cb();
                }
            }
            arr.length && inner(arr.shift());
        } ,
        cpdirSync:function() {
            return function cpdirSync( old, neo ) {
                var arr = fs.readdirSync(old), folder, stat;
                if(!path.existsSync(neo)){//创建新文件
                    fs.mkdirSync(neo, 0755);
                    $.log("<code style='color:green'>创建目录"+neo + "/" + el+"成功</code>",true);
                }
                for(var i = 0, el ; el = arr[i++];){
                    folder = old + "/" + el
                    stat = fs.statSync(folder);
                    if(stat.isDirectory()){
                        cpdirSync(folder, neo + "/" + el)
                    }else{
                        fs.writeFileSync(neo + "/" + el,fs.readFileSync(folder));
                        $.log("<code style='color:magenta'>创建文件"+neo + "/" + el+"成功</code>",true);
                    }
                }
            }
        }(),
        rmdirSync : (function(){
            function iterator(url,dirs){
                var stat = fs.statSync(url);
                if(stat.isDirectory()){
                    dirs.unshift(url);//收集目录
                    inner(url,dirs);
                }else if(stat.isFile()){
                    fs.unlinkSync(url);//直接删除文件
                }
            }
            function inner(path,dirs){
                var arr = fs.readdirSync(path);
                for(var i = 0, el ; el = arr[i++];){
                    iterator(path+"/"+el,dirs);
                }
            }
            return function(dir,cb){
                cb = cb || $.noop;
                var dirs = []; 
                try{
                    iterator(dir,dirs);
                    for(var i = 0, el ; el = dirs[i++];){
                        fs.rmdirSync(el);//一次性删除所有收集到的目录
                    }
                    cb()
                }catch(e){//如果文件或目录本来就不存在，fs.statSync会报错，不过我们还是当成没有异常发生
                    e.code === "ENOENT" ? cb() : cb(e);
                }
            }
        })(),
        /**
             * 用于取得数据的类型或判定数据的类型
             * @param {Any} obj 要检测的东西
             * @param {String} str 要比较的类型
             * @return {String|Boolean}
             */
        type : function (obj, str){
            var result = class2type[ (obj == null || obj !== obj )? obj : toString.call(obj) ] || "#";
            if( result.charAt(0) === "#"){
                if(Buffer.isBuffer(obj)){
                    result = 'Buffer'; //返回构造器名字
                }else{
                    result = toString.call(obj).slice(8,-1);
                }
            }
            if(str){
                return str === result;
            }
            return result;
        },
        /**
             * 用于调试
             * @param {String} s 要打印的内容
             * @param {Boolean} color 进行各种颜色的高亮，使用<code style="format:blod;color:red;background:green">
             * format的值可以为formats中五个之一或它们的组合（以空格隔开），背景色与字体色只能为colors之一
             */
        log:function (s, color){
            if(color){
                s = s.replace(rformat,function(a,b,style,ret){
                    style.toLowerCase().split(";").forEach(function(arr){
                        arr = arr.split(":");
                        var type = arr[0].trim(),val = (arr[1]||"").trim();
                        switch(type){
                            case "format":
                                val.replace(/\w+/g,function(word){
                                    if(formats[word]){
                                        ret = format(formats[word],ret)
                                    }
                                });
                                break;
                            case "background":
                            case "color":
                                var array = type == "color" ? [30,39] : [40,49]
                                if( colors[val]){
                                    array[0] += colors[val]
                                    ret = format(array,ret)
                                }
                        }
                    });
                    return ret;
                });
            }
            console.log(s);
        },
        /**
             * 生成键值统一的对象，用于高速化判定
             * @param {Array|String} array 如果是字符串，请用","或空格分开
             * @param {Number} val 可选，默认为1
             * @return {Object}
             */
        oneObject : function(array, val){
            if(typeof array == "string"){
                array = array.match($.rword) || [];
            }
            var result = {},value = val !== void 0 ? val :1;
            for(var i=0,n=array.length;i < n;i++){
                result[array[i]] = value;
            }
            return result;
        },
        mix:mix
    });

    $.noop = $.error = function(){};
    "Boolean,Number,String,Function,Array,Date,RegExp,Arguments".replace($.rword,function(name){
        class2type[ "[object " + name + "]" ] = name;
    });

    var
    rmodule = /([^(\s]+)\(?([^)]*)\)?/,
    names = [],//需要处理的模块名列表
    rets = {},//用于收集模块的返回值
    cbi = 1e4 ;//用于生成回调函数的名字
    var map = $["@modules"] = {};
    //执行并移除所有依赖都具备的模块或回调
    function resolveCallbacks(){
        loop:
        for (var i = names.length,repeat, name; name = names[--i]; ) {
            var  obj = map[name], deps = obj.deps;
            for(var key in deps){
                if(deps.hasOwnProperty(key) && map[key].state != 2 ){
                    continue loop;
                }
            }
            //如果deps是空对象或者其依赖的模块的状态都是2
            if( obj.state != 2){
                names.splice(i,1);//必须先移除再执行
                var fn = obj.callback;
                rets[fn._name] = fn.apply(null,incarnate(obj.args));//只收集模块的返回值
                obj.state = 2;
                repeat = true;
            }
        }
    repeat &&  resolveCallbacks();
    }
    function incarnate(args){//传入一组模块名，返回对应模块的返回值
        for(var i = 0,ret = [], name; name = args[i++];){
            ret.push(rets[name]);
        }
        return ret;
    }
    function deferred(){//一个简单的异步列队
        var list = [],self = function(fn){
            fn && fn.call && list.push(fn);
            return self;
        }
        self.method = "pop";
        self.fire = function(fn){
            while(fn = list[self.method]()){
                fn();
            }
            return list.length ? self : self.complete();
        }
        self.complete = $.noop;
        return self;
    }

    var nativeModules = $.oneObject("assert,child_process,cluster,crypto,dgram,dns,"+
        "events,fs,http,https,net,os,path,querystring,readline,repl,tls,tty,url,util,vm,zlib")
    function useNativeRequire(name,url,errback){
        var nick = name.slice(1);
        if(nativeModules[nick]){
            map[name].state = 2;
            rets[name] = require(nick);
            resolveCallbacks();
        }else{
            url = url  || process.cwd()+"/" + nick + ".js";
            try{
                $.log("<code style='color:yellow'>"+url+"</code>",true)
                require(url);
                resolveCallbacks()
            }catch(e){
                $.stack(Function('$.log("\033[31m'+e+'\033[39m")'));
                $.stack.fire();//打印错误堆栈
                errback();
            }
        }
    }

    $.mix($,{
        stack : deferred(),
        define:function(name,deps,callback){//模块名,依赖列表,模块本身
            var str = "/"+name;
            for(var prop in map){
                if(map.hasOwnProperty(prop) ){
                    if(prop.substring(prop.length - str.length) === str && map[prop].state !== 2){
                        name = prop.slice(1);//自动修正模块名(加上必要的目录)
                        break;
                    }
                }
            }
            if(typeof deps == "function"){//处理只有两个参数的情况
                callback = deps;
                deps = "";
            }
            callback._name = "@"+name; //模块名
            this.require(deps,callback);
        },
        require:function(deps,callback,errback){//依赖列表,正向回调,负向回调
            var _deps = {}, args = [], dn = 0, cn = 0;
            (deps +"").replace($.rword,function(url,name,match){
                dn++;
                match = url.match(rmodule);
                name = "@"+ match[1];//取得模块名

                if(!map[name]){ //防止重复生成节点与请求
                    map[name] = { };//state: undefined, 未加载; 1 已加载; 2 : 已执行
                    useNativeRequire(name,match[2],errback);//加载模块
                }else if(map[name].state === 2){
                    cn++;
                }
                if(!_deps[name] ){
                    args.push(name);
                    _deps[name] = "司徒正美";//去重
                }
            });
            var cbname = callback._name
            if(dn === cn ){//在依赖都已执行过或没有依赖的情况下
                if(cbname && !(cbname in rets)){
                    map[cbname].state = 2 //如果是使用合并方式，模块会跑进此分支（只会执行一次）
                    return rets[cbname] =  callback.apply(null,incarnate(args));   
                }else if(!cbname){//普通的回调可执行无数次
                    return callback.apply(null,incarnate(args))
                }
            }
            cbname = cbname || "@cb"+ (cbi++).toString(32);
            if(errback){
                $.stack(errback);//压入错误堆栈
            }
            map[cbname] = {//创建或更新模块的状态
                callback:callback,
                deps:_deps,
                args: args,
                state: 1
            };//在正常情况下模块只能通过resolveCallbacks执行
            names.unshift(cbname);
            resolveCallbacks();
        },
        md5: function(str, encoding){
            return require('crypto').createHash('md5').update(str).digest(encoding || 'hex');
        },
        settings:{}
    });
    
    exports.$ = global.$ = $;
//    $.cache = {};
//
//    //必须先加载settings模块
//    $.require("settings,construct,endError",function(settings,construct,endError ){
//        $.settings = settings;
//        var dir = $.adjustPath("")
//        $.rmdirSync(dir);//用于删掉原来的网站重建
//        $.require("http,fs,path,scaffold,intercepters",function(http,fs,path,scaffold,intercepters){
//            if(path.existsSync(dir)){
//                $.log("<code style='color:red'>此网站已存在</code>",true);
//            }else{
//                fs.mkdir(dir,0755)
//                $.log("<code style='color:green'>开始利用内部模板建立您的网站……</code>",true);
//            }
//            global.mapper = scaffold(dir);//取得路由系统
//            http.createServer(function(req, res) {
//                console.log("req.url  :  "+req.url)
//                var arr = intercepters.concat();
//                //有关HTTP状态的解释 http://www.cnblogs.com/rubylouvre/archive/2011/05/18/2049989.html
//                req.on("next_intercepter",function(){
//                    try{
//                        var next = arr.shift();
//                        next && next.apply(null,arguments)
//                    }catch(err){
//                        err.statusCode = 500;
//                        endError(err, req, res)
//                    }
//                });
//                req.emit("next_intercepter",req, res);
//
//            }).listen(settings.port);
//            $.log("Server running at "+settings.port+" port")
//        });
//    });
//--------开始创建网站---------
})();

    //2011.12.17 $.define再也不用指定模块所在的目录了,
    //如以前我们要对位于intercepters目录下的favicon模块,要命名为$.define("intercepters/favicon",module),
    //才能用$.require("intercepters/favicon",callback)请求得到
    //现在可以直接$.define("favicon",module)了


