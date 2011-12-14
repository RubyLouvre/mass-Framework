//=========================================
// 模块加载模块（核心模块）2011.11.11 by 司徒正美
//=========================================
//=========================================
// 模块加载模块（核心模块）2011.11.11 by 司徒正美
//=========================================
(function(global , DOC){
    var
    _dom = global.dom, //保存已有同名变量
    namespace = DOC.URL.replace( /(#.+|\W)/g,'');
    /**
     * @class dom
     * dom Framework拥有两个命名空间,
     * 第一个是DOC.URL.replace(/(\W|(#.+))/g,'')，根据页面的地址动态生成
     * 第二个是dom，我们可以使用别名机制重写它
     * @namespace dom
     */
    function dom(expr,context){//新版本的基石
        if(dom.type(expr,"Function")){ //注意在safari下,typeof nodeList的类型为function,因此必须使用dom.type
            dom.require("ready,lang,attr,event,fx",expr);
        }else{
            if(!dom.fn)
                throw "must load the 'node' module!"
            return new dom.fn.init(expr,context);
        }
    }
    //多版本共存
    var commonDom = global[namespace], version = 1.0, postfix = "";
    if( typeof commonDom !== "function"){
        commonDom = dom;//公用命名空间对象
    }
    if(commonDom.v !== version ){
        commonDom[version] = dom;//保存当前版本的命名空间对象到公用命名空间对象上
        if(commonDom.v) {
            postfix = (version + "").replace(".","_");
        } 
    }else{
        return;
    }  
    var w3c = DOC.dispatchEvent, //w3c事件模型
    HEAD = DOC.head || DOC.getElementsByTagName("head")[0],
    class2type = {
        "[object HTMLDocument]"   : "Document",
        "[object HTMLCollection]" : "NodeList",
        "[object StaticNodeList]" : "NodeList",
        "[object IXMLDOMNodeList]": "NodeList",
        "[object DOMWindow]"      : "Window"  ,
        "[object global]"         : "Window"  ,
        "null"                    : "Null"    ,
        "NaN"                     : "NaN"     ,
        "undefined"               : "Undefined"
    },
    toString = class2type.toString;
    /**
     * 糅杂，为一个对象添加更多成员
     * @param {Object} target 目标对象
     * @param {Object} source 属性包
     * @return  {Object} 目标对象
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
    mix(dom,{//为此版本的命名空间对象添加成员
        html : DOC.documentElement,
        head : HEAD,
        rword : /[^, ]+/g,
        v : version,
        "@name" : "dom",
        "@debug" : true,
        "@dispatcher" : w3c ? "addEventListener" : "attachEvent",
        "@path":(function(url, scripts, node){
            scripts = DOC.getElementsByTagName("script");
            node = scripts[scripts.length - 1];
            url = node.hasAttribute ?  node.src : node.getAttribute('src', 4);
            return url.substr( 0, url.lastIndexOf('/'));
        })(),
        /**
         * 暴露到全局作用域下，此时可重命名，并有jquery的noConflict的效果
         * @param {String} name 新的命名空间
         */
        exports: function (name) {
            _dom && (global.dom = _dom);//多库共存
            name = name || dom["@name"];//取得当前简短的命名空间
            dom["@name"] = name ;
            global[namespace] = commonDom;
            return global[name]  = this;
        },
        /**
         * 数组化
         * @param {ArrayLike} nodes 要处理的类数组对象
         * @param {Number} start 可选。要抽取的片断的起始下标。如果是负数，从后面取起
         * @param {Number} end  可选。规定从何处结束选取
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
        /**
         * 用于取得数据的类型或判定数据的类型
         * @param {Any} obj 要检测的东西
         * @param {String} str 要比较的类型
         * @return {String|Boolean}
         */
        type : function (obj, str){
            var result = class2type[ (obj == null || obj !== obj )? obj :  toString.call(obj)  ] || obj.nodeName || "#";
            if( result.charAt(0) === "#"){//兼容旧式浏览器与处理个别情况,如window.opera
                //利用IE678 window == document为true,document == window竟然为false的神奇特性
                if(obj == obj.document && obj.document != obj){
                    result = 'Window'; //返回构造器名字
                }else if(obj.nodeType === 9) {
                    result = 'Document';//返回构造器名字
                }else if(  obj.callee ){
                    result = 'Arguments';//返回构造器名字
                }else if(isFinite(obj.length) && obj.item ){
                    result = 'NodeList'; //处理节点集合
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
         * @param {Boolean} force 强逼打印到页面上
         */
        log:function (s, force){
            if(force){
                dom.require("ready",function(){
                    var div =  DOC.createElement("div");
                    div.innerHTML = s +"";//确保为字符串
                    DOC.body.appendChild(div)
                });
            }else if(global.console ){
                global.console.log(s);
            }
        },
        uuid : 1,
        getUid:global.getComputedStyle ? function(node){//用于建立一个从元素到数据的引用，以及选择器去重操作
            return node.uniqueNumber || (node.uniqueNumber = dom.uuid++);
        }: function(node){
            var uid = node.getAttribute("uniqueNumber");
            if (!uid){
                uid = dom.uuid++;
                node.setAttribute("uniqueNumber", uid);
            }
            return uid;
        },
        /**
         * 生成键值统一的对象，用于高速化判定
         * @param {Array|String} array 如果是字符串，请用","或空格分开
         * @param {Number} val 可选，默认为1
         * @return {Object}
         */
        oneObject : function(array, val){
            if(typeof array == "string"){
                array = array.match(dom.rword) || [];
            }
            var result = {},value = val !== void 0 ? val :1;
            for(var i=0,n=array.length;i < n;i++){
                result[array[i]] = value;
            }
            return result;
        }
    });
    dom.noop = dom.error = function(){};
 
    "Boolean,Number,String,Function,Array,Date,RegExp,Window,Document,Arguments,NodeList".replace(dom.rword,function(name){
        class2type[ "[object " + name + "]" ] = name;
    });
    var
    rmodule =  /([^(\s]+)\(?([^)]*)\)?/,
    names = [],//需要处理的模块名列表
    rets = {},//用于收集模块的返回值
    cbi = 1e4 ;//用于生成回调函数的名字
    var map = dom["@modules"] = {
        "@ready" : { }
    };
    /**
     * 加载模块。它会临时生成一个iframe，并在里面创建相应的script节点进笨请求，并附加各种判定是否加载成功的机制
     * @param {String} name 模块名
     * @param {String} url  模块的路径
     * @param {String} ver  当前dom框架的版本
     */
    function loadModule(name, url, ver){
        url = url  || dom["@path"] +"/"+ name.slice(1) + ".js" + (dom["@debug"] ? "?timestamp="+(new Date-0) : "");
        var iframe = DOC.createElement("iframe"),//IE9的onload经常抽疯,IE10 untest
        codes = ["<script> document.xxx = 'iframe';var dom = parent[document.URL.replace(/(#.+|\\W)/g,'')][", ver,'] ;<\/script><script src="',url,'" ',
        (DOC.uniqueID ? "onreadystatechange" : "onload"),'="', "if(/loaded|complete|undefined/i.test(this.readyState)){  dom._resolveCallbacks();",
        (global.opera ? "this.ownerDocument.x = 1;" : " dom._checkFail('"+name+"');"),
        '} " ' , (w3c ? 'onerror="dom._checkFail(\''+name+'\',true);" ' : ""),' ><\/script>' ];
        iframe.style.display = "none";
       //http://www.tech126.com/https-iframe/ http://www.ajaxbbs.net/post/webFront/https-iframe-warning.html
        if(!"1"[0]){//IE6 iframe在https协议下没有的指定src会弹安全警告框
            iframe.src = "javascript:false"
        }
        HEAD.insertBefore(iframe,HEAD.firstChild);
        var d = iframe.contentDocument || iframe.contentWindow.document; 
        d.write(codes.join(''));
        d.close();
        dom.bind(iframe,"load",function(){
            if(global.opera && d.x == void 0){
                dom._checkFail(name, true);//模拟opera的script onerror
            }
            d.write("<body/>");//清空内容
            HEAD.removeChild(iframe);//移除iframe
        });
    }
    //凡是通过iframe加载回来的模块函数都要经过它进行转换
    function safeEval(fn, args, str, obj){
        obj = obj || rets;
        for(var i = 0,argv = [], name; name = args[i++];){
            argv.push(obj[name]);
        }//如果是同一执行环境下，就不用再eval了
        if(fn instanceof Function){
            return fn.apply(global,argv);
        }
        return  Function("b","return " +(str || fn) +".apply(window,b)" )(argv);
    }
    function deferred(){//一个简单的异步列队
        var list = [],self = function(fn){
            fn && fn.call && list.push(fn);
            return self;
        }
        self.method = "shift";
        self.fire = function(fn){
            while(fn = list[self.method]()){
                fn();
            }
            return list.length ? self : self.complete();
        }
        self.complete = dom.noop;
        return self;
    }
    
    var errorstack = dom.stack = deferred();
    errorstack.method = "pop";
    mix(dom, {
        mix:mix,
        //绑定事件(简化版)
        bind : w3c ? function(el, type, fn, phase){
            el.addEventListener(type,fn, !!phase);
            return fn;
        } : function(el, type, fn){
            el.attachEvent("on"+type, fn);
            return fn;
        },
        unbind : w3c ? function(el, type, fn, phase){
            el.removeEventListener(type, fn, !!phase);
        } : function(el, type, fn){
            el.detachEvent("on"+type, fn);
        },
        //请求模块
        require:function(deps,callback,errback){//依赖列表,正向回调,负向回调 
            var _deps = {}, args = [], dn = 0, cn = 0;
            (deps +"").replace(dom.rword,function(url,name,match){
                dn++;
                match = url.match(rmodule);
                name  = "@"+ match[1];//取得模块名
                if(!map[name]){ //防止重复生成节点与请求
                    map[name] = { };//state: undefined, 未加载; 1 已加载; 2 : 已执行
                    loadModule(name,match[2],dom.v);//加载JS文件
                }else if(map[name].state === 2){
                    cn++;
                }
                if(!_deps[name] ){
                   args.push(name);
                    _deps[name] = "司徒正美";//去重，去掉@ready
                }
                
            });
            var cbname = callback._name;
            if(dn === cn ){//在依赖都已执行过或没有依赖的情况下
                if(cbname && !(cbname in rets)){
                    map[cbname].state = 2 //如果是使用合并方式，模块会跑进此分支（只会执行一次）
                    return rets[cbname] = safeEval(callback,args);
                }else if(!cbname){//普通的回调可执行无数次
                    return safeEval(callback,args);
                }
            }
            cbname = cbname || "@cb"+ (cbi++).toString(32);
           
            if(errback){
                errback = errback instanceof Function ? errback : 
                Function((errback+"").replace(/[^{]*\{([\d\D]*)\}$/,"$1")) ;
                dom.stack(errback);//压入错误堆栈
            }
            map[cbname] = {//创建或更新模块的状态
                callback:callback,
                name:cbname,
                str: callback.toString(),
                deps:_deps,
                args: args,
                state: 1
            };//在正常情况下模块只能通过resolveCallbacks执行
            names.unshift(cbname);
            dom._resolveCallbacks();//FIX opera BUG。opera在内部解析时修改执行顺序，导致没有执行最后的回调
        },
        //定义模块
        define:function(name,deps,callback){//模块名,依赖列表,模块本身
            if(typeof deps == "function"){//处理只有两个参数的情况
                callback = deps;
                deps = "";
            }
            callback._name =  "@"+name;  //模块名
            this.require(deps,callback);
        },
        //执行并移除所有依赖都具备的模块或回调
        _resolveCallbacks: function (){
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
                    names.splice(i,1);//必须先移除再执行，防止在IE下DOM树建完后手动刷新页面，会多次执行最后的回调函数
                    //在IE下通过iframe得到的回调，如果不立即变成字符串保存起来，会报“不能执行已释放 Script 的代码 ”错误
                    rets[obj.name] = safeEval(obj.callback, obj.args, obj.str); 
                    obj.state = 2;//只收集模块的返回值
                    repeat = true;
                }
            }
        repeat && dom._resolveCallbacks();
        },
        //用于检测这模块有没有加载成功
        _checkFail : function(name, error){
            if(error || !map[name].state ){
                this.stack(new Function('dom.log("fail to load module [ '+name+' ]")'));
                this.stack.fire();//打印错误堆栈
            }
        }
    });
    //dom.log("已加载模块加载模块")
    //domReady机制
    var readylist = deferred();
    function fireReady(){
        map["@ready"].state = 2;
         dom._resolveCallbacks();
        readylist.complete = function(fn){
            dom.type(fn, "Function") &&  fn()
        }
        readylist.fire();
        fireReady = dom.noop;
    };
    function doScrollCheck() {
        try {
            dom.html.doScroll("left");
            fireReady();
        } catch(e) {
            setTimeout( doScrollCheck, 1);
        }
    };
    //开始判定页面的加载情况
    if ( DOC.readyState === "complete" ) {
        fireReady();
    }else {
        dom.bind(DOC, (w3c ? "DOMContentLoaded" : "readystatechange"), function(){
            if (w3c || DOC.readyState === "complete") {
                fireReady();
            }
        });
        if ( dom.html.doScroll && self.eval === top.eval ) {
            doScrollCheck();
        }
    }
    //https://developer.mozilla.org/en/DOM/window.onpopstate
    dom.bind(global,"popstate",function(){
        namespace = DOC.URL.replace(/(#.+|\W)/g,'');
        dom.exports();
    });
    dom.exports("dom"+postfix);//防止不同版本的命名空间冲突
     /*combine modules*/

})(this,this.document);
/**
 2011.7.11
@开头的为私有的系统变量，防止人们直接调用,
dom.check改为dom["@emitter"]
dom.namespace改为dom["@name"]
去掉无用的dom.modules
优化exports方法
2011.8.4
强化dom.log，让IE6也能打印日志
重构fixOperaError与resolveCallbacks
将provide方法合并到require中去
2011.8.7
重构define,require,resolve
添加"@modules"属性到dom命名空间上
增强domReady传参的判定
2011.8.18 应对HTML5 History API带来的“改变URL不刷新页面”技术，让URL改变时让namespace也跟着改变！
2011.8.20 去掉dom.K,添加更简单dom.noop，用一个简单的异步列队重写dom.ready与错误堆栈dom.stack
2011.9.5  强化dom.type
2011.9.19 强化dom.mix
2011.9.24 简化dom.bind 添加dom.unbind
2011.9.28 dom.bind 添加返回值
2011.9.30 更改是否在顶层窗口的判定  global.frameElement == null --> self.eval === top.eval
2011.10.1
更改dom.uuid为dom["@uuid"],dom.basePath为dom["@path"]，以示它们是系统变量
修复dom.require BUG 如果所有依赖模块之前都加载执行过，则直接执行回调函数
移除dom.ready 只提供dom(function(){})这种简捷形式
2011.10.4 强化对IE window的判定, 修复dom.require BUG dn === cn --> dn === cn && !callback._name
2011.10.9
简化fixOperaError中伪dom命名空间对象
优化截取隐藏命名空间的正则， /(\W|(#.+))/g --〉  /(#.+|\\W)/g
2011.10.13 dom["@emitter"] -> dom["@dispatcher"]
2011.10.16 移除XMLHttpRequest的判定，回调函数将根据依赖列表生成参数，实现更彻底的模块机制
2011.10.20 添加error方法，重构log方法
2011.11.6  重构uuid的相关设施
2011.11.11 多版本共存



不知道什么时候开始，"不要重新发明轮子"这个谚语被传成了"不要重新造轮子"，于是一些人，连造轮子都不肯了。

 */

