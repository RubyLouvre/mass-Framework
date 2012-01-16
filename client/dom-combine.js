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
    function safeEval(fn, args, str){
        for(var i = 0,argv = [], name; name = args[i++];){
            argv.push(rets[name]);
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
    var module_value = {
        state:2
    };
    var list = "ecma,lang,spec,support,flow,class,data,query,node,css_ie,css,dispatcher,event,attr,fx,ajax".match(dom.rword);
    for(var i=0, module;module = list[i++];){
        map["@"+module] = module_value;
    }
    dom.define("ecma", function(){
        //dom.log("已加载ECMA262v5新扩展模块")
        //Object扩展
        //fix ie for..in bug
        var DONT_ENUM = dom.DONT_ENUM = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(","),
        P = "prototype",
        hasOwn = ({}).hasOwnProperty;
        for (var i in {
            toString: 1
        }){
            DONT_ENUM = false;
        }
        //第二个参数仅在浏览器支持Object.defineProperties时可用
        dom.mix(Object,{
            //取得其所有键名以数组形式返回
            keys: function(obj){//ecma262v5 15.2.3.14
                var result = [];
                for(var key in obj ) if(hasOwn.call(obj,key)){
                    result.push(key)
                }
                if(DONT_ENUM && obj){
                    for(var i = 0 ;key =DONT_ENUM[i++]; ){
                        if(hasOwn.call(obj,key)){
                            result.push(key);
                        }
                    }
                }
                return result;
            },
            getPrototypeOf  :  typeof P.__proto__ === "object" ?  function(obj){
                return obj.__proto__;
            }:function(obj){
                return obj.constructor[P];
            }

        },false);

        //用于创建javascript1.6 Array的迭代器
        function iterator(vars, body, ret) {
            var fun = 'for(var '+vars+'i=0,n = this.length;i < n;i++){'+
            body.replace('_', 'fn.call(scope,this[i],i,this)')
            +'}'+ret
            return new Function("fn,scope",fun);
        }
        dom.mix(Array[P],{
            //定位类 返回指定项首次出现的索引。
            indexOf: function (el, index) {
                var n = this.length, i = ~~index;
                if (i < 0) i += n;
                for (; i < n; i++)
                    if ( this[i] === el) return i;
                return -1;
            },
            //定位类 返回指定项最后一次出现的索引。
            lastIndexOf: function (el, index) {
                var n = this.length,
                i = index == null ? n - 1 : index;
                if (i < 0) i = Math.max(0, n + i);
                for (; i >= 0; i--)
                    if (this[i] === el) return i;
                return -1;
            },
            //迭代类 在数组中的每个项上运行一个函数，若所有结果都返回真值，此方法亦返回真值。
            forEach : iterator('', '_', ''),
            //迭代类 在数组中的每个项上运行一个函数，并将函数返回真值的项作为数组返回。
            filter : iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r'),
            //迭代类  在数组中的每个项上运行一个函数，并将全部结果作为数组返回。
            map :  iterator('r=[],', 'r[i]=_', 'return r'),
            //迭代类  在数组中的每个项上运行一个函数，若存在任意的结果返回真，则返回真值。
            some : iterator('', 'if(_)return true', 'return false'),
            //迭代类  在数组中的每个项上运行一个函数，若所有结果都返回真值，此方法亦返回真值。
            every : iterator('', 'if(!_)return false', 'return true'),
            //归化类 javascript1.8  对该数组的每项和前一次调用的结果运行一个函数，收集最后的结果。
            reduce: function (fn, lastResult, scope) {
                if (this.length == 0) return lastResult;
                var i = lastResult !== undefined ? 0 : 1;
                var result = lastResult !== undefined ? lastResult : this[0];
                for (var n = this.length; i < n; i++)
                    result = fn.call(scope, result, this[i], i, this);
                return result;
            },
            //归化类 javascript1.8 同上，但从右向左执行。
            reduceRight: function (fn, lastResult, scope) {
                var array = this.concat().reverse();
                return array.reduce(fn, lastResult, scope);
            }
        },false);
   
        //修正IE67下unshift不返回数组长度的问题
        //http://www.cnblogs.com/rubylouvre/archive/2010/01/14/1647751.html
        if([].unshift(1) !== 1){
            var _unshift = Array[P].unshift;
            Array[P].unshift = function(){
                _unshift.apply(this, arguments);
                return this.length; //返回新数组的长度
            }
        }
        if(!Array.isArray){
            Array.isArray = function(obj){
                return Object.prototype.toString.call(obj) =="[object Array]";
            };
        }
        //String扩展
        dom.mix(String[P],{
            //ecma262v5 15.5.4.20
            //http://www.cnblogs.com/rubylouvre/archive/2009/09/18/1568794.html
            // $$$$eq('      dfsd '.trim(),'dfsd')
            trim: function(){
                return  this.replace(/^[\s\xA0]+/,"").replace(/[\s\xA0]+$/,'')
            }
        },false);

        dom.mix(Function[P],{
            //ecma262v5 15.3.4.5
            bind:function(scope) {
                if (arguments.length < 2 && scope===void 0) return this;
                var fn = this, argv = arguments;
                return function() {
                    var args = [], i;
                    for(i = 1; i < argv.length; i++)
                        args.push(argv[i]);
                    for(i = 0; i < arguments.length; i++)
                        args.push(arguments[i]);
                    return fn.apply(scope, args);
                };
            }
        },false);
        // Fix Date.get/setYear() (IE5-7)
        if ((new Date).getYear() > 1900) {
            Date.now = function(){
                return +new Date;
            }
            //http://stackoverflow.com/questions/5763107/javascript-date-getyear-returns-different-result-between-ie-and-firefox-how-to
            Date[P].getYear = function() {
                return this.getFullYear() - 1900;
            };
            Date[P].setYear = function(year) {
                return this.setFullYear(year + 1900);
            };
        }
    });
    
    dom.define("lang", (Array.isArray && Object.create ? "" : "ecma"), function(){
        //dom.log("已加载lang模块");
        var global = this,
        rascii = /[^\x00-\xff]/g,
        rformat = /\\?\#{([^{}]+)\}/gm,
        rnoclose = /^(area|base|basefont|bgsound|br|col|frame|hr|img|input|isindex|link|meta|param|embed|wbr)$/i,
        // JSON RegExp
        rvalidchars = /^[\],:{}\s]*$/,
        rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
        rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
        rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
        str_eval = global.execScript ? "execScript" : "eval",
        str_body = (global.open + '').replace(/open/g, '');
        dom.mix(dom,{
            //判定是否是一个朴素的javascript对象（Object或JSON），不是DOM对象，不是BOM对象，不是自定义类的实例。
            isPlainObject : function (obj){
                if(!dom.type(obj,"Object") || dom.isNative(obj,"reload") ){
                    return false;
                }     
                try{//不存在hasOwnProperty方法的对象肯定是IE的BOM对象或DOM对象
                    for(var key in obj)//只有一个方法是来自其原型立即返回flase   
                        if(!String2.hasOwnProperty.call(obj,key)){//不能用obj.hasOwnProperty自己查自己
                            return false
                        }
                }catch(e){
                    return false;
                }
                return true;
            },

            //判定method是否为obj的原生方法，如dom.isNative(window,"JSON")
            isNative : function(obj, method) {
                var m = obj ? obj[method] : false, r = new RegExp(method, 'g');
                return !!(m && typeof m != 'string' && str_body === (m + '').replace(r, ''));
            },
            /**
             * 是否为空对象
             * @param {Object} obj
             * @return {Boolean}
             */
            isEmptyObject: function(obj ) {
                for ( var i in obj ){
                    return false;
                }
                return true;
            },
            //包括Array,Arguments,NodeList,HTMLCollection,IXMLDOMNodeList与自定义类数组对象
            //select.options集合（它们两个都有item与length属性）
            isArrayLike :  function (obj) {
                if(!obj || obj.document || obj.nodeType || dom.type(obj,"Function")) return false;
                return isFinite(obj.length) ;
            },

            //将字符串中的占位符替换为对应的键值
            //http://www.cnblogs.com/rubylouvre/archive/2011/05/02/1972176.html
            format : function(str, object){
                var array = dom.slice(arguments,1);
                return str.replace(rformat, function(match, name){
                    if (match.charAt(0) == '\\')
                        return match.slice(1);
                    var index = Number(name)
                    if(index >=0 )
                        return array[index];
                    if(object && object[name] !== void 0)
                        return  object[name];
                    return  '' ;
                });
            },
            /**
             * 用于拼接多行HTML片断,免去写<与>与结束标签之苦
             * @param {String} tag 可带属性的开始标签
             * @param {String} innerHTML 可选
             * @param {Boolean} xml 可选 默认false,使用HTML模式,需要处理空标签
             * @example var html = T("P title=aaa",T("span","111111")("strong","22222"))("div",T("div",T("span","两层")))("H1",T("span","33333"))('',"这是纯文本");
             * console.log(html+"");
             * @return {Function}
             */
            tag:function (start,content,xml){
                xml = !!xml
                var chain = function(start,content,xml){
                    var html = arguments.callee.html;
                    start && html.push("<",start,">");
                    content = ''+(content||'');
                    content && html.push(content);
                    var end = start.split(' ')[0];//取得结束标签
                    if(end && (xml || !rnoclose.test(end))){
                        html.push("</",end,">");
                    }
                    return chain;
                }
                chain.html = [];
                chain.toString = function(){
                    return this.html.join("");
                }
                return chain(start,content,xml);
            },
            // Generate an integer Array containing an arithmetic progression. A port of
            // the native Python `range()` function. See
            // [the Python documentation](http://docs.python.org/library/functions.html#range).
            range : function(start, stop, step) {
                if (arguments.length <= 1) {
                    stop = start || 0;
                    start = 0;
                }
                step = arguments[2] || 1;
                var len = Math.max(Math.ceil((stop - start) / step), 0);
                var idx = 0;
                var range = new Array(len);
                while(idx < len) {
                    range[idx++] = start;
                    start += step;
                }
                return range;
            },
            quote : global.JSON && JSON.stringify || String.quote ||  (function(){
                var meta = {
                    '\t':'t',
                    '\n':'n',
                    '\v':'v',
                    'f':'f',
                    '\r':'\r',
                    '\'':'\'',
                    '\"':'\"',
                    '\\':'\\'
                },
                reg = /[\x00-\x1F\'\"\\\u007F-\uFFFF]/g,
                regFn = function(c){
                    if (c in meta) return '\\' + meta[c];
                    var ord = c.charCodeAt(0);
                    return ord < 0x20   ? '\\x0' + ord.toString(16)
                    :  ord < 0x7F   ? '\\'   + c
                    :  ord < 0x100  ? '\\x'  + ord.toString(16)
                    :  ord < 0x1000 ? '\\u0' + ord.toString(16)
                    : '\\u'  + ord.toString(16)
                };
                return function (str) {
                    return    '"' + str.replace(reg, regFn)+ '"';
                }
            })(),
            //http://www.schillmania.com/content/projects/javascript-animation-1/
            //http://www.cnblogs.com/rubylouvre/archive/2010/04/09/1708419.html
            parseJS: function( code ) {
                //IE中，window.eval()和eval()一样只在当前作用域生效。
                //Firefox，Safari，Opera中，直接调用eval()为当前作用域，window.eval()调用为全局作用域。
                if ( code && /\S/.test(code) ) {
                    try{
                        global[str_eval](code);
                    }catch(e){ }
                }
            },
            parseJSON: function( data ) {
                if ( typeof data !== "string" || !data ) {
                    return null;
                }
                data = data.trim();
                if ( global.JSON && global.JSON.parse ) {
                    //使用原生的JSON.parse转换字符串为对象
                    return global.JSON.parse( data );
                }
                if ( rvalidchars.test( data.replace( rvalidescape, "@" )
                    .replace( rvalidtokens, "]" )
                    .replace( rvalidbraces, "")) ) {
                    //使用new Function生成一个JSON对象
                    return (new Function( "return " + data ))();
                }
                dom.error( "Invalid JSON: " + data );
            },

            // Cross-browser xml parsing
            parseXML: function ( data,xml,tmp ) {
                try {
                    if ( global.DOMParser ) { // Standard
                        tmp = new DOMParser();
                        xml = tmp.parseFromString( data , "text/xml" );
                    } else { // IE
                        xml = new ActiveXObject("Microsoft.XMLDOM" );//"Microsoft.XMLDOM"
                        xml.async = "false";
                        xml.loadXML( data );
                    }
                } catch( e ) {
                    xml = undefined;
                }
                if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
                    dom.log( "Invalid XML: " + data );
                }
                return xml;
            }

        }, false);

        "Array,Function".replace(dom.rword,function(name){
            dom["is"+name] = function(obj){
                return obj && ({}).toString.call(obj) === "[object "+name+"]";
            }
        });

        if(Array.isArray){
            dom.isArray = Array.isArray;
        }

        var String2 = dom.String = {
            //判断一个字符串是否包含另一个字符
            contains: function(string, separator){
                return (separator) ? !!~(separator + this + separator).indexOf(separator + string + separator) : !!~this.indexOf(string);
            },
            //以XXX开头
            startsWith: function(string, ignorecase) {
                var start_str = this.substr(0, string.length);
                return ignorecase ? start_str.toLowerCase() === string.toLowerCase() :
                start_str === string;
            },

            endsWith: function(string, ignorecase) {
                var end_str = this.substring(this.length - string.length);
                return ignorecase ? end_str.toLowerCase() === string.toLowerCase() :
                end_str === string;
            },

            //得到字节长度
            byteLen:function(){
                return this.replace(rascii,"--").length;
            },

            empty: function () {
                return this.valueOf() === '';
            },
            //判定字符串是否只有空白
            blank: function () {
                return /^\s*$/.test(this);
            },
            //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
            truncate :function(length, truncation) {
                length = length || 30;
                truncation = truncation === void(0) ? '...' : truncation;
                return this.length > length ?
                this.slice(0, length - truncation.length) + truncation :String(this);
            },
            camelize:function(){
                return this.replace(/-([a-z])/g, function($1,$2){
                    return $2.toUpperCase();
                });
            },
            //首字母大写
            capitalize: function(){
                return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
            },

            underscored: function() {
                return this.replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/\-/g, '_').toLowerCase();
            },

            toInt: function(radix) {
                return parseInt(this, radix || 10);
            },

            toFloat: function() {
                return parseFloat(this);
            },
            //dom.lang("é").toHex() ==> \xE9
            toHex: function() { 
                var txt = '',str = this;
                for (var i = 0; i < str.length; i++) {
                    if (str.charCodeAt(i).toString(16).toUpperCase().length < 2) {
                        txt += '\\x0' + str.charCodeAt(i).toString(16).toUpperCase() ; 
                    } else {
                        txt += '\\x' + str.charCodeAt(i).toString(16).toUpperCase() ;
                    }
                }
                return txt; 
            },
            //http://stevenlevithan.com/regex/xregexp/
            escapeRegExp: function(){
                return this.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
            },
            //http://www.cnblogs.com/rubylouvre/archive/2010/02/09/1666165.html
            //在左边补上一些字符,默认为0
            padLeft: function(digits, filling, radix){
                var num = this.toString(radix || 10);
                filling = filling || "0";
                while(num.length < digits){
                    num= filling + num;
                }
                return num;
            },

            //在右边补上一些字符,默认为0
            padRight: function(digits, filling, radix){
                var num = this.toString(radix || 10);
                filling = filling || "0";
                while(num.length < digits){
                    num +=  filling;
                }
                return num;
            },
            // http://www.cnblogs.com/rubylouvre/archive/2009/11/08/1598383.html
            times :function(n){
                var str = this,res = "";
                while (n > 0) {
                    if (n & 1)
                        res += str;
                    str += str;
                    n >>= 1;
                }
                return res;
            }
        };

        var Array2 = dom.Array  = {
            //深拷贝当前数组
            clone: function(){
                var i = this.length, result = [];
                while (i--) result[i] = cloneOf(this[i]);
                return result;
            },
            first: function(fn,scope){
                if(dom.type(fn,"Function")){
                    for(var i=0, n = this.length;i < n;i++){
                        if(fn.call(scope,this[i],i,this)){
                            return this[i];
                        }
                    }
                    return null;
                }else{
                    return this[0];
                }
            },
            last: function(fn, scope) {
                if(dom.type(fn,"Function")){
                    for (var i=this.length-1; i > -1; i--) {
                        if (fn.call(scope, this[i], i, this)) {
                            return this[i];
                        }
                    }
                    return null;
                }else{
                    return this[this.length-1];
                }
            },
            //判断数组是否包含此元素
            contains: function (el) {
                return !!~this.indexOf(el) ;
            },
            //http://msdn.microsoft.com/zh-cn/library/bb383786.aspx
            //移除 Array 对象中某个元素的第一个匹配项。
            remove: function (item) {
                var index = this.indexOf(item);
                if (~index ) return Array2.removeAt.call(this,index);
                return null;
            },
            //移除 Array 对象中指定位置的元素。
            removeAt: function (index) {
                return this.splice(index, 1);
            },
            //对数组进行洗牌,但不影响原对象
            // Jonas Raoni Soares Silva http://jsfromhell.com/array/shuffle [v1.0]
            shuffle: function () {
                var shuff = (this || []).concat(), j, x, i = shuff.length;
                for (; i > 0; j = parseInt(Math.random() * i), x = shuff[--i], shuff[i] = shuff[j], shuff[j] = x) {};
                return shuff;
            },
            //从数组中随机抽选一个元素出来
            random: function () {
                return Array2.shuffle.call(this)[0];
            },
            //取得数字数组中值最小的元素
            min: function() {
                return Math.min.apply(0, this);
            },
            //取得数字数组中值最大的元素
            max: function() {
                return Math.max.apply(0, this);
            },
            //只有原数组不存在才添加它
            ensure: function() {
                var args = dom.slice(arguments);
                args.forEach(function(el){
                    if (!~this.indexOf(el) ) this.push(el);
                },this);
                return this;
            },
            //取得对象数组的每个元素的特定属性
            pluck:function(name){
                var result = [],prop;
                this.forEach(function(el){
                    prop = el[name];
                    if(prop != null)
                        result.push(prop);
                });
                return result;
            },
            //根据对象的某个属性进行排序
            sortBy: function(fn, scope) {
                var array =  this.map(function(el, index) {
                    return {
                        el: el,
                        re: fn.call(scope, el, index)
                    };
                }).sort(function(left, right) {
                    var a = left.re, b = right.re;
                    return a < b ? -1 : a > b ? 1 : 0;
                });
                return Array2.pluck.call(array,'el');
            },
            // 以数组形式返回原数组中不为null与undefined的元素
            compact: function () {
                return this.filter(function (el) {
                    return el != null;
                });
            },
            //取差集(补集)
            diff : function(array) {
                var result = this.slice();
                for ( var i = 0; i < result.length; i++ ) {
                    for ( var j = 0; j < array.length; j++ ) {
                        if ( result[i] === array[j] ) {
                            result.splice(i, 1);
                            i--;
                            break;
                        }
                    }
                }
                return result;
            },
            //取并集
            union :function(array){
                var arr = this;
                arr = arr.concat(array);
                return dom.Array.unique.call(arr);
            },
            //取交集
            intersect:function(array){
                return this.filter(function(n) {
                    if(~array.indexOf(n))
                        return true;
                    return false;
                });
            },
            // 返回没有重复值的新数组
            unique: function () {
                var ret = [];
                    o:for(var i = 0, n = this.length; i < n; i++) {
                        for(var x = i + 1 ; x < n; x++) {
                            if(this[x] === this[i])
                                continue o;
                        }
                        ret.push(this[i]);
                    }
                return ret;

            },
            //对数组进行平坦化处理，返回一个一维数组
            flatten: function() {
                var result = [],self = Array2.flatten;
                this.forEach(function(value) {
                    if (dom.isArray(value)) {
                        result = result.concat(self.call(value));
                    } else {
                        result.push(value);
                    }
                });
                return result;
            }
        }
        Array2.without = Array2.diff;
        var Math2 = "abs,acos,asin,atan,atan2,ceil,cos,exp,floor,log,pow,sin,sqrt,tan".match(dom.rword);
        var Number2 = dom.Number ={
            times: function(fn, bind) {
                for (var i=0; i < this; i++)
                    fn.call(bind, i);
                return this;
            },
            padLeft:function(digits, filling, radix){
                return String2.padLeft.apply(this,[digits, filling, radix]);
            },
            padRight:function(digits, filling, radix){
                return String2.padRight.apply(this,[digits, filling, radix]);
            },
            //确保数值在[n1,n2]闭区间之内,如果超出限界,则置换为离它最近的最大值或最小值
            constrain:function(n1,n2){
                var a = [n1,n2].sort(),num = Number(this);
                if(num < a[0]) num = a[0];
                if(num > a[1]) num = a[1];
                return num;
            },
            //求出距离原数最近的那个数
            nearer:function(n1,n2){
                var num = Number(this),
                diff1 = Math.abs(num - n1),
                diff2 = Math.abs(num - n2);
                return diff1 < diff2 ? n1 : n2
            },
            upto: function(number, fn, scope) {
                for (var i=this+0; i <= number; i++)
                    fn.call(scope, i);
                return this;
            },

            downto: function(number, fn, scope) {
                for (var i=this+0; i >= number; i--)
                    fn.call(scope, i);
                return this;
            },
            round: function(base) {
                if (base) {
                    base = Math.pow(10, base);
                    return Math.round(this * base) / base;
                } else {
                    return Math.round(this);
                }
            }
        }

        Math2.forEach(function(name){
            Number2[name] = function(){
                return Math[name](this);
            }
        });

        function cloneOf(item){
            switch(dom.type(item)){
                case "Array":
                    return Array2.clone.call(item);
                case "Object":
                    return Object2.clone.call(item);
                default:
                    return item;
            }
        }
        //使用深拷贝方法将多个对象或数组合并成一个
        function mergeOne(source, key, current){
            if(source[key] && typeof source[key] == "object"){
                Object2.merge.call(source[key], current);
            }else {
                source[key] = cloneOf(current)
            }
            return source;
        };

        var Object2 = dom.Object = {
            //根据传入数组取当前对象相关的键值对组成一个新对象返回
            subset: function(keys){
                var results = {};
                for (var i = 0, l = keys.length; i < l; i++){
                    var k = keys[i];
                    results[k] = this[k];
                }
                return results;
            },
            //遍历对象的键值对
            forEach: function(fn,scope){
                for(var name in this){
                    fn.call(scope,this[name],name,this);
                }
                if(dom.DONT_ENUM && this.hasOwnProperty){
                    for(var i = 0; name = dom.DONT_ENUM[i++]; ){
                        this.hasOwnProperty(name) &&  fn.call(scope,this[name],name,this);
                    }
                }
            },
            //进行深拷贝，返回一个新对象，如果是拷贝请使用dom.mix
            clone: function(){
                var clone = {};
                for (var key in this) {
                    clone[key] = cloneOf(this[key]);
                }
                return clone;
            },
            merge: function(k, v){
                var target = this,obj,key;
                //为目标对象添加一个键值对
                if (typeof k === "string")
                    return mergeOne(target, k, v);
                //合并多个对象
                for (var i = 0, l = arguments.length; i < l; i++){
                    obj = arguments[i];
                    for ( key in obj){
                        if(obj[key] !== void 0)
                            mergeOne(target, key, obj[key]);
                    }
                }
                return target;
            },
            //去掉与传入参数相同的元素
            without: function(arr) {
                var result = {}, key;
                for (key in this) {//相当于构建一个新对象，把不位于传入数组中的元素赋给它
                    if (!~arr.indexOf(key) ) {
                        result[key] = this[key];
                    }
                }
                return result;
            }
        }
        var inner = {
            String : ["charAt", "charCodeAt", "concat", "indexOf", "lastIndexOf", "localeCompare",
            "match", "replace","search", "slice", "split", "substring", "toLowerCase",
            "toLocaleLowerCase", "toUpperCase", "toLocaleUpperCase", "trim", "toJSON"],
            Array : [ "toLocaleString","concat", "join", "pop", "push", "shift", "slice", "sort",  "reverse","splice", "unshift",
            "indexOf", "lastIndexOf",  "every", "some", "forEach", "map","filter", "reduce", "reduceRight"],
            Number : ["toLocaleString", "toFixed", "toExponential", "toPrecision", "toJSON"],
            Object : ["toLocaleString", "hasOwnerProperty", "isPrototypeOf", "propertyIsEnumerable" ]
        }
        var adjustOne = dom.oneObject("String,Array,Number,Object"),
        arrayLike = dom.oneObject("NodeList,Arguments,Object")
        var Lang = dom.lang = function(obj){
            var type = dom.type(obj), chain = this;
            if(arrayLike[type] &&  isFinite(obj.length)){
                obj = dom.slice(obj);
                type = "Array";
            }
            if(adjustOne[type]){
                if(!(chain instanceof Lang)){
                    chain = new Lang;
                }
                chain.target = obj;
                chain.type = type;
                return chain;
            }else{// undefined boolean null
                return obj
            }
        }
        var proto = Lang.prototype = {
            constructor:Lang,
            valueOf:function(){
                return this.target;
            },
            toString:function(){
                return this.target + "";
            }
        };
        function force(type){
            var methods = inner[type].concat(Object.keys(dom[type]));
            methods.forEach(function(name){
                proto[name] = function(){
                    var obj = this.target;
                    var method = obj[name] ? obj[name] : dom[this.type][name];
                    var result = method.apply(obj,arguments);
                    return result;
                }
                proto[name+"X"] = function(){
                    var obj = this.target;
                    var method = obj[name] ? obj[name] : dom[this.type][name];
                    var result = method.apply(obj,arguments);
                    return Lang.call(this,result) ;
                }
            });
            return force;
        };
        force("Array")("String")("Number")("Object");
        return Lang;
    });
    dom.define("flow", function(){
        //像mashup，这里抓一些数据，那里抓一些数据，看似不相关，但这些数据抓完后最后构成一个新页面。
        function OperateFlow(names,callback,reload){
            this.core = {};
            if(typeof callback == "function")
                this.bind(names,callback,reload)
        }
        OperateFlow.prototype = {
            constructor:OperateFlow,
            bind:function(names,callback,reload){
                var  core = this.core, deps = {},args = [];
                names.replace(dom.rword,function(name){
                    name = "####"+name
                    if(!core[name]){
                        core[name] ={
                            unfire : [callback],//正在等待解发的回调
                            fired:[]//已经触发的回调
                        }
                    }else{
                        core[name].unfire.unshift(callback)
                    }
                    if(!deps[name]){//去重
                        args.push(name);
                        deps[name] = 1;
                    }
                });
                callback.deps = deps;
                callback.args = args;
                callback.reload = !!reload;//默认每次重新加载
            },
            unbind : function(array,fn){//dom.multiUnind("aaa,bbb")
                if(/string|number/.test(typeof array) ){
                    var tmp = []
                    (array+"").replace(dom.rword,function(name){
                        tmp.push( "####"+name)
                    });
                    array = tmp;
                }
                var removeAll = typeof fn !== "function";
                for(var i = 0, name ; name = array[i++];){
                    var obj = this.core[name];
                    if(obj && obj.unfire){
                        obj.state = 1;
                        obj.unfire = removeAll ?  [] : obj.unfire.filter(function(el){
                            return fn != el;
                        });
                        obj.fired = removeAll ?  [] : obj.fired.filter(function(el){
                            return fn != el;
                        });
                    }
                }
            },
            _args : function (arr){
                for(var i = 0, result = [], el; el = arr[i++];){
                    result.push( this.core[el].ret);
                }
                return result;
            },
            fire : function(name, args){
                var core = this.core, obj = core["####"+name], deps;
                if(!obj )
                    return ;
                obj.ret = args;
                obj.state = 2;
                var unfire = obj.unfire,fired = obj.fired;
                    loop:
                    for (var i = unfire.length,repeat, fn; fn = unfire[--i]; ) {
                        deps = fn.deps;
                        for(var key in deps){
                            if(deps.hasOwnProperty(key) && core[key].state != 2 ){
                                continue loop;
                            }
                        }
                        unfire.splice(i,1);
                        fired.push(fn);
                        repeat = true;
                    }
                if(repeat){
                    return this.fire(name, args);
                }else{
                    for (i = fired.length; fn = fired[--i]; ) {
                        if(fn.deps["####"+name]){//只处理相关的
                            fn.apply(this,this._args(fn.args));
                            if(fn.reload){//所有数据必须重新加载
                                fired.splice(i,1);
                                unfire.push(fn);
                                for(key in fn.deps){
                                    core[key].state = 1;
                                }
                            }
                        }
                    }
                }
            }
        }
        dom.flow  = function(names,callback,reload){//一个工厂方法
            return new OperateFlow(names,callback,reload)
        }
    });
    dom.define("support", function(){
        // dom.log("已加载support模块");
        var global = this, DOC = global.document, div = DOC.createElement('div'),TAGS = "getElementsByTagName";
        div.setAttribute("className", "t");
        div.innerHTML = ' <link/><a href="/nasami"  style="float:left;opacity:.25;">d</a>'+
        '<object><param/></object><table></table><input type="checkbox"/>';
        var a = div[TAGS]("a")[0], style = a.style,
        select = DOC.createElement("select"),
  
        opt = select.appendChild( DOC.createElement("option") );
        var support = dom.support = {
            //是否支持自动插入tbody
            insertTbody: !!div[TAGS]("tbody").length,
            // checkbox的value默认为on，唯有Chrome 返回空字符串
            checkOn :  div[TAGS]( "input" )[ 0 ].value === "on",
            //safari下可能无法取得这个属性,需要访问一下其父元素后才能取得该值
            attrSelected:!!opt.selected,
            //是否区分href属性与特性
            attrHref: a.getAttribute("href") === "/nasami",
            //IE67是没有style特性（特性的值的类型为文本），只有el.style（CSSStyleDeclaration）(bug)
            attrStyle:a.getAttribute("style") !== style,
            //IE8,FF能直接用getAttribute("class")取得className,而IE67则需要将"class"映射为"className",才能用getAttribute取得
            attrProp:div.className !== "t",
            //http://www.cnblogs.com/rubylouvre/archive/2010/05/16/1736535.html
            //IE8返回".25" ，IE9pp2返回0.25，chrome等返回"0.25"
            cssOpacity: style.opacity == "0.25",
            //某些浏览器不支持w3c的cssFloat属性来获取浮动样式，而是使用独家的styleFloat属性
            cssFloat: !!style.cssFloat,
            //某些浏览器使用document.getElementByTagName("*")不能遍历Object元素下的param元素（bug）
            traverseAll: !!div[TAGS]("param").length,
            //https://prototype.lighthouseapp.com/projects/8886/tickets/264-ie-can-t-create-link-elements-from-html-literals
            //某些浏览器不能通过innerHTML生成link,style,script节点
            createAll: !!div[TAGS]("link").length,
            //IE的cloneNode才是真正意义的复制，能复制动态添加的自定义属性与事件（可惜这不是标准，归为bug）
            cloneAll: false,
            optDisabled: false,
            boxModel: null,
            insertAdjacentHTML:false,
            innerHTML:false,
            fastFragment:false
        };
 
        //当select元素设置为disabled后，其所有option子元素是否也会被设置为disabled
        select.disabled = true;
        support.optDisabled = !opt.disabled;
        if ( !div.addEventListener && div.attachEvent && div.fireEvent ) {
            div.attachEvent("onclick", function click() {
                support.cloneAll = true;//w3c的节点复制是不复制事件的
                div.detachEvent("onclick", click);
            });
            div.cloneNode(true).fireEvent("onclick");
        }
        //测试是否符合w3c的盒子模型
        div.style.width = div.style.paddingLeft = "1px";
        //判定insertAdjacentHTML是否完美，用于append,prepend,before,after等方法
        var table = div[TAGS]("table")[0]
        try{
            table.insertAdjacentHTML("afterBegin","<tr><td>1</td></tr>");
            support.insertAdjacentHTML = true;
        }catch(e){ }
        try{
            var range =  DOC.createRange();
            support.fastFragment = range.createContextualFragment("<a>") && range;
        }catch(e){ };
        //判定innerHTML是否完美，用于html方法
        try{
            table.innerHTML = "<tr><td>1</td></tr>";
            support.innerHTML = true;
        }catch(e){};
 
        //有些特征嗅探必须连接到DOM树上才能进行
        var body = DOC[TAGS]( "body" )[ 0 ],i,
        testElement = DOC.createElement( body ? "div" : "body" ),
        testElementStyle = {
            visibility: "hidden",
            width: 0,
            height: 0,
            border: 0,
            margin: 0,
            background: "none"
        };
        if ( body ) {
            dom.mix( testElementStyle, {
                position: "absolute",
                left: "-1000px",
                top: "-1000px"
            });
        }
        for ( i in testElementStyle ) {
            testElement.style[ i ] = testElementStyle[ i ];
        }
        testElement.appendChild( div );//将DIV加入DOM树
        var testElementParent = body || dom.html;
        testElementParent.insertBefore( testElement, testElementParent.firstChild );
 
        support.boxModel = div.offsetWidth === 2;
        if ( "zoom" in div.style ) {
            //IE7以下版本并不支持display: inline-block;样式，而是使用display: inline;
            //并通过其他样式触发其hasLayout形成一种伪inline-block的状态
            div.style.display = "inline";
            div.style.zoom = 1;
            support.inlineBlockNeedsLayout = div.offsetWidth === 2;
            //http://w3help.org/zh-cn/causes/RD1002
            // 在 IE6 IE7(Q) IE8(Q) 中，如果一个明确设置了尺寸的非替换元素的 'overflow' 为 'visible'，
            // 当该元素无法完全容纳其内容时，该元素的尺寸将被其内容撑大
            // 注:替换元素（replaced element）是指 img，input，textarea，select，object等这类默认就有CSS格式化外表范围的元素
            div.style.display = "";
            div.innerHTML = "<div style='width:4px;'></div>";
            support.shrinkWrapBlocks = div.offsetWidth !== 2;
        }
        div.innerHTML = "";
        testElementParent.removeChild( testElement );
        div = null;
        return support;
    });
    

    dom.define("class", "lang",function(){
        // dom.log("已加载class模块")
        var
        P = "prototype",  C = "constructor", I = "@init",S = "_super",
        unextend = dom.oneObject([S,P, 'extend', 'implement','_class']),
        exclusive = new RegExp([S,I,C].join("|")),ron = /on([A-Z][A-Za-z]+)/,
        classOne = dom.oneObject('Object,Array,Function');
        function expand(klass,props){
            'extend,implement'.replace(dom.rword, function(name){
                var modules = props[name];
                if(classOne[dom.type(modules)]){
                    klass[name].apply(klass,[].concat(modules));
                    delete props[name];
                }
            });
            return klass
        }
        function setOptions(){
            var options = this.options = dom.Object.merge.apply(this.options || {}, arguments),key,match
            if (typeof this.bind == "function") {
                for (key in options) {
                    if ((match = key.match(ron))) {
                        this.bind(match[1].toLowerCase(), options[key]);
                        delete(options[key]);
                    }
                }
            }
            return this;
        }
        function _super(){
            var caller = arguments.callee.caller;  // 取得当前方法
            var name = caller._name;  // 取得当前方法名
            var superclass = caller._class[S];//取得当前实例的父类
            if(superclass && superclass[P][name] ){
                return superclass[P][name].apply(this, arguments.length ? arguments : caller.arguments);
            }else{
                throw name + " no super method!"
            }
        }
        dom["@class"] =  {
            inherit : function(parent,init) {
                var bridge = function() { }
                if(typeof parent == "function"){
                    for(var i in parent){//继承类成员
                        this[i] = parent[i]
                    }
                    bridge[P] = parent[P];
                    this[P] = new bridge ;//继承原型成员
                    this[S]  = parent;//指定父类
                }
                this[I] = (this[I] || []).concat();
                if(init){
                    this[I].push(init);
                }
                this.toString = function(){
                    return (init || bridge) + ""
                }
                var KP = this[P];
                KP.setOptions = setOptions;
                KP[S] = _super;//绑定方法链
                return  KP[C] = this;
            },
            implement:function(){
                var target = this[P], reg = exclusive;
                for(var i = 0, module; module = arguments[i++]; ){
                    module = typeof module === "function" ? new module :module;
                    Object.keys(module).forEach(function(name){
                        if(!reg.test(name)){
                            var prop = target[name] = module[name];
                            if(typeof prop == "function"){
                                prop._name  = name;
                                prop._class = this;
                            }
                        }
                    },this);
                }
                return this;
            },
            extend: function(){//扩展类成员
                var bridge = {}
                for(var i = 0, module; module = arguments[i++]; ){
                    dom.mix(bridge, module);
                }
                for(var key in bridge){
                    if(!unextend[key]){
                        this[key] =  bridge[key]
                    }
                }
                return this;
            }
        };
        dom.factory = function(obj){
            obj = obj || {};
            var parent  = obj.inherit //父类
            var init = obj.init ; //构造器
            delete obj.inherit;
            delete obj.init;
            var klass = function () {
                for(var i = 0 , init ; init =  klass[I][i++];){
                    init.apply(this, arguments);
                }
            };
            dom.mix(klass,dom["@class"]).inherit(parent, init);//添加更多类方法
            return expand(klass,obj).implement(obj);
        }
    });
    
    dom.define("query", function(){
        var global = this, DOC = global.document;
        dom.mix(dom,{
            //http://www.cnblogs.com/rubylouvre/archive/2010/03/14/1685360.
            isXML : function(el){
                var doc = el.ownerDocument || el
                return doc.createElement("p").nodeName !== doc.createElement("P").nodeName;
            },
            // 第一个节点是否包含第二个节点
            contains:function(a, b){
                if(a.compareDocumentPosition){
                    return !!(a.compareDocumentPosition(b) & 16);
                }else if(a.contains){
                    return a !== b && (a.contains ? a.contains(b) : true);
                }
                while ((b = b.parentNode))
                    if (a === b) return true;
                return false;
            },
            //获取某个节点的文本，如果此节点为元素节点，则取其childNodes的所有文本，
            //为了让结果在所有浏览器下一致，忽略所有空白节点，因此它非元素的innerText或textContent
            getText : function() {
                return function getText( nodes ) {
                    for ( var i = 0, ret = "",node; node = nodes[i++];  ) {
                        // 对得文本节点与CDATA的内容
                        if ( node.nodeType === 3 || node.nodeType === 4 ) {
                            ret += node.nodeValue;
                        //取得元素节点的内容
                        } else if ( node.nodeType !== 8 ) {
                            ret += getText( node.childNodes );
                        }
                    }
                    return ret;
                }
            }(),
            unique :function(nodes){
                if(nodes.length < 2){
                    return nodes;
                }
                var result = [], array = [], uniqResult = {}, node = nodes[0],index, ri = 0
                //如果支持sourceIndex我们将使用更为高效的节点排序
                //http://www.cnblogs.com/jkisjk/archive/2011/01/28/array_quickly_sortby.html
                if(node.sourceIndex){//IE opera
                    for(var i = 0 , n = nodes.length; i< n; i++){
                        node = nodes[i];
                        index = node.sourceIndex+1e8;
                        if(!uniqResult[index]){
                            (array[ri++] = new String(index))._ = node;
                            uniqResult[index] = 1
                        }
                    }
                    array.sort();
                    while( ri )
                        result[--ri] = array[ri]._;
                    return result;
                }else {
                    var sortOrder = node.compareDocumentPosition ? sortOrder1 : sortOrder2;
                    nodes.sort( sortOrder );
                    if (sortOrder.hasDuplicate ) {
                        for ( i = 1; i < nodes.length; i++ ) {
                            if ( nodes[i] === nodes[ i - 1 ] ) {
                                nodes.splice( i--, 1 );
                            }
                        }
                    }
                    sortOrder.hasDuplicate = false;
                    return nodes;
                }
            }
        });
        var reg_combinator  = /^\s*([>+~,\s])\s*(\*|(?:[-\w*]|[^\x00-\xa0]|\\.)*)/
        var trimLeft = /^\s+/;
        var trimRight = /\s+$/;
        var reg_quick = /^(^|[#.])((?:[-\w]|[^\x00-\xa0]|\\.)+)$/;
        var reg_comma       = /^\s*,\s*/;
        var reg_sequence = /^([#\.:]|\[\s*)((?:[-\w]|[^\x00-\xa0]|\\.)+)/;
        var reg_pseudo        = /^\(\s*("([^"]*)"|'([^']*)'|[^\(\)]*(\([^\(\)]*\))?)\s*\)/;
        var reg_attrib      = /^\s*(?:(\S?=)\s*(?:(['"])(.*?)\2|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/
        var reg_attrval  = /\\([0-9a-fA-F]{2,2})/g;
        var reg_sensitive       = /^(title|id|name|class|for|href|src)$/
        var reg_backslash = /\\/g;
        var reg_tag  = /^((?:[-\w\*]|[^\x00-\xa0]|\\.)+)/;//能使用getElementsByTagName处理的CSS表达式
        if ( trimLeft.test( "\xA0" ) ) {
            trimLeft = /^[\s\xA0]+/;
            trimRight = /[\s\xA0]+$/;
        }

        var hash_operator   = {
            "=": 1, 
            "!=": 2, 
            "|=": 3,
            "~=": 4, 
            "^=": 5, 
            "$=": 6, 
            "*=": 7
        }

        function sortOrder1( a, b ) {
            if ( a === b ) {
                sortOrder1.hasDuplicate = true;
                return 0;
            }
            if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
                return a.compareDocumentPosition ? -1 : 1;
            }
            return a.compareDocumentPosition(b) & 4 ? -1 : 1;
        };

        function sortOrder2( a, b ) {//处理旧式的标准浏览器与XML
            if ( a === b ) {
                sortOrder2.hasDuplicate = true;
                return 0;
            }
            var al, bl,
            ap = [],
            bp = [],
            aup = a.parentNode,
            bup = b.parentNode,
            cur = aup;
            //如果是属于同一个父节点，那么就比较它们在childNodes中的位置
            if ( aup === bup ) {
                return siblingCheck( a, b );
            // If no parents were found then the nodes are disconnected
            } else if ( !aup ) {
                return -1;

            } else if ( !bup ) {
                return 1;
            }
            // Otherwise they're somewhere else in the tree so we need
            // to build up a full list of the parentNodes for comparison
            while ( cur ) {
                ap.unshift( cur );
                cur = cur.parentNode;
            }

            cur = bup;

            while ( cur ) {
                bp.unshift( cur );
                cur = cur.parentNode;
            }

            al = ap.length;
            bl = bp.length;

            // Start walking down the tree looking for a discrepancy
            for ( var i = 0; i < al && i < bl; i++ ) {
                if ( ap[i] !== bp[i] ) {
                    return siblingCheck( ap[i], bp[i] );
                }
            }
            // We ended someplace up the tree so do a sibling check
            return i === al ?
            siblingCheck( a, bp[i], -1 ) :
            siblingCheck( ap[i], b, 1 );
        };
        function siblingCheck( a, b, ret ) {
            if ( a === b ) {
                return ret;
            }
            var cur = a.nextSibling;

            while ( cur ) {
                if ( cur === b ) {
                    return -1;
                }
                cur = cur.nextSibling;
            }
            return 1;
        };
        var slice = Array.prototype.slice;
        function makeArray( nodes, result, flag_multi ) {  
            nodes = slice.call( nodes, 0 );
            if ( result ) {
                result.push.apply( result, nodes );
            }else{
                result = nodes;
            }
            return  flag_multi ? dom.unique(result) : result;
        };
        //IE56789无法使用数组方法转换节点集合
        try {
            slice.call( dom.html.childNodes, 0 )[0].nodeType;
        } catch( e ) {
            function makeArray( nodes, result ,flag_multi) {
                var ret = result || [], ri = ret.length;
                for(var i = 0,el ; el = nodes[i++];){
                    ret[ri++] = el
                }
                return flag_multi ? dom.unique(ret) : ret;
            }
        }
        function _toHex(x, y) {
            return String.fromCharCode(parseInt(y, 16));
        }
        function parse_nth(expr) {
            var orig = expr
            expr = expr.replace(/^\+|\s*/g, '');//清除无用的空白
            var match = (expr === "even" && "2n" || expr === "odd" && "2n+1" || !/\D/.test(expr) && "0n+" + expr || expr).match(/(-?)(\d*)n([-+]?\d*)/);
            return parse_nth[ orig ] = {
                a: (match[1] + (match[2] || 1)) - 0, 
                b: match[3] - 0
            };
        }
        function getElementsByTagName(tagName, els, flag_xml) {
            var method = "getElementsByTagName", elems = [], uniqResult = {}, prefix
            if(flag_xml && tagName.indexOf(":") > 0 && els.length && els[0].lookupNamespaceURI){
                var arr = tagName.split(":");
                prefix = arr[0];
                tagName = arr[1];
                method = "getElementsByTagNameNS";
                prefix = els[0].lookupNamespaceURI(prefix);
            }
            switch (els.length) {
                case 0:
                    return elems;
                case 1:
                    //在IE67下，如果存在一个name为length的input元素，下面的all.length返回此元素，而不是长度值
                    var all =  prefix ? els[0][method](prefix,tagName) : els[0][method](tagName);
                    for(var i = 0, ri = 0, el; el = all[i++];){
                        if(el.nodeType === 1){//防止混入注释节点
                            elems[ri++] = el
                        }
                    }
                    return elems;
                default:
                    for(i = 0, ri = 0; el = els[i++];){
                        var nodes = prefix ? el[method](prefix,tagName) : el[method](tagName)
                        for (var j = 0, node; node = nodes[j++];) {
                            var uid = dom.getUid(node);
                           
                            if (!uniqResult[uid]) {
                                uniqResult[uid] = elems[ri++] = node;
                            }
                        }
                    }
                    return elems;
            }
        }
        //IE9 以下的XML文档不能直接设置自定义属性
        var attrURL = dom.oneObject('action,cite,codebase,data,href,longdesc,lowsrc,src,usemap', 2);
        var bools = dom["@bools"] = "autofocus,autoplay,async,checked,controls,declare,disabled,defer,defaultChecked,"+
        "contentEditable,ismap,loop,multiple,noshade,open,noresize,readOnly,selected"
        var boolOne = dom.oneObject(bools.toLowerCase() ); 
        
        //检测各种BUG（fixGetAttribute，fixHasAttribute，fixById，fixByTag）
        var fixGetAttribute,fixHasAttribute,fixById,fixByTag;
        var getHTMLText = new Function("els","return els[0]."+ (dom.html.textContent ? "textContent" : "innerText") );

        new function(){
            var select = DOC.createElement("select");
            var option = select.appendChild( DOC.createElement("option") );
            option.setAttribute("selected","selected")
            option.className ="x"
            fixGetAttribute = option.getAttribute("class") != "x";
            select.appendChild( DOC.createComment("") );
            fixByTag = select.getElementsByTagName("*").length == 2
            var all = DOC.getElementsByTagName("*"), node, nodeType, comments = [], i = 0, j = 0;
            while ( (node = all[i++]) ) {  
                nodeType = node.nodeType;
                nodeType === 1 ? dom.getUid(node) : 
                nodeType === 8 ? comments.push(node) : 0;  
            }
            while ( (node = comments[j++]) ) {   
                node.parentNode.removeChild(node);
            }
            fixHasAttribute = select.hasAttribute ? !option.hasAttribute('selected') :true;
        
            var form = DOC.createElement("div"),
            id = "fixId" + (new Date()).getTime(),
            root = dom.html;
            form.innerHTML = "<a name='" + id + "'/>";
            root.insertBefore( form, root.firstChild );
            fixById = !!DOC.getElementById( id ) ;
            root.removeChild(form )
        };

        //http://www.atmarkit.co.jp/fxml/tanpatsu/24bohem/01.html
        //http://msdn.microsoft.com/zh-CN/library/ms256086.aspx
        //https://developer.mozilla.org/cn/DOM/document.evaluate
        //http://d.hatena.ne.jp/javascripter/20080425/1209094795
        function getElementsByXPath(xpath,context,doc) {
            var result = [];
            try{
                if(global.DOMParser){//IE9支持DOMParser，但我们不能使用doc.evaluate!global.DOMParser
                    var nodes = doc.evaluate(xpath, context, null, 7, null);
                    for (var i = 0, n = nodes.snapshotLength; i < n; i++){
                        result[i] =  nodes.snapshotItem(i)
                    } 
                }else{
                    nodes = context.selectNodes(xpath);
                    for (i = 0, n = nodes.length; i < n; i++){
                        result[i] =  nodes[i]
                    } 
                }
            }catch(e){
                return false;
            }
            return result;
        };
        /**
         * 选择器
         * @param {String} expr CSS表达式
         * @param {Node}   context 上下文（可选）
         * @param {Array}  result  结果集(内部使用)
         * @param {Array}  lastResult  上次的结果集(内部使用)
         * @param {Boolean}flag_xml 是否为XML文档(内部使用)
         * @param {Boolean}flag_multi 是否出现并联选择器(内部使用)
         * @param {Boolean}flag_dirty 是否出现通配符选择器(内部使用)
         * @return {Array} result
         */
        //http://webbugtrack.blogspot.com/
        var Icarus = dom.query = function(expr, contexts, result, lastResult, flag_xml,flag_multi,flag_dirty){
            result = result || [];
            contexts = contexts || DOC;
            var pushResult = makeArray;
            if(!contexts.nodeType){//实现对多上下文的支持
                contexts = pushResult(contexts);
                if(!contexts.length)
                    return result
            }else{
                contexts = [contexts];
            }
            var rrelative = reg_combinator,//保存到本地作用域
            rquick = reg_quick,
            rBackslash = reg_backslash, rcomma = reg_comma,//用于切割并联选择器
            context = contexts[0],
            doc = context.ownerDocument || context,
            rtag = reg_tag,
            flag_all, uniqResult, elems, nodes, tagName, last, ri, uid;
            //将这次得到的结果集放到最终结果集中
            //如果要从多个上下文中过滤孩子
            expr = expr.replace(trimLeft, "").replace(trimRight, "");  
            flag_xml = flag_xml !== void 0 ? flag_xml : dom.isXML(doc);
       
            if (!flag_xml && doc.querySelectorAll2) {
                var query = expr;
                if(contexts.length > 2 || doc.documentMode == 8  && context.nodeType == 1  ){
                    if(contexts.length > 2 )
                        context = doc;
                    query = ".fix_icarus_sqa "+query;//IE8也要使用类名确保查找范围
                    for(var i = 0, node; node = contexts[i++];){
                        if(node.nodeType === 1){
                            node.className = "fix_icarus_sqa " + node.className;
                        }
                    }
                }
                if(doc.documentMode !== 8  || context.nodeName.toLowerCase() !== "object"){
                    try{
                        return pushResult( context.querySelectorAll(query), result, flag_multi);
                    }catch(e){
                    }finally{
                        if(query.indexOf(".fix_icarus_sqa") === 0 ){//如果为上下文添加了类名，就要去掉类名
                            for(i = 0; node = contexts[i++];){
                                if(node.nodeType === 1){
                                    node.className =  node.className.replace("fix_icarus_sqa ","");
                                }
                            }
                        }
                    }
                }
            }
            var match = expr.match(rquick);
            if(match ){//对只有单个标签，类名或ID的选择器进行提速
                var value = match[2].replace(rBackslash,""), key = match[1];
                if (  key == "") {//tagName;
                    nodes = getElementsByTagName(value,contexts,flag_xml);
                } else if ( key === "." && contexts.length === 1 ) {//className，并且上下文只有1个
                    if(flag_xml){//如果XPATH查找失败，就会返回字符，那些我们就使用普通方式去查找
                        nodes = getElementsByXPath("//*[@class='"+value+"']", context, doc);
                    }else if(context.getElementsByClassName){
                        nodes = context.getElementsByClassName( value );
                    }
                }else if ( key === "#" && contexts.length === 1){//ID，并且上下文只有1个
                    if( flag_xml){
                        nodes = getElementsByXPath("//*[@id='"+value+"']", context, doc);
                    //基于document的查找是不安全的，因为生成的节点可能还没有加入DOM树，比如dom("<div id=\"A'B~C.D[E]\"><p>foo</p></div>").find("p")
                    }else if(context.nodeType == 9){
                        node = doc.getElementById(value);
                        //IE67 opera混淆表单元素，object以及链接的ID与NAME
                        //http://webbugtrack.blogspot.com/2007/08/bug-152-getelementbyid-returns.html
                        nodes = !node ? [] : !fixById ? [node] : node.getAttributeNode("id").nodeValue === value ? [node] : false;
                    }
                }
                if(nodes ){
                    return pushResult( nodes, result, flag_multi );
                }
            }
            //执行效率应该是内大外小更高一写
            lastResult = contexts;
            if(lastResult.length){
                loop:
                while (expr && last !== expr) {
                    flag_dirty = false;
                    elems = null;
                    uniqResult = {};
                    //处理夹在中间的关系选择器（取得连接符及其后的标签选择器或通配符选择器）
                    if (match = expr.match(rrelative)) {
                        expr = RegExp.rightContext;
                        elems = [];
                        tagName = (flag_xml ? match[2] : match[2].toUpperCase()).replace(rBackslash,"") || "*";
                        i = 0;
                        ri = 0;
                        flag_all = tagName === "*";// 表示无需判定tagName
                        switch (match[1]) {//根据连接符取得种子集的亲戚，组成新的种子集
                            case " "://后代选择器
                                if(expr.length || match[2]){//如果后面还跟着东西或最后的字符是通配符
                                    elems = getElementsByTagName(tagName, lastResult, flag_xml);
                                }else{
                                    elems = lastResult;
                                    break loop
                                }
                                break;
                            case ">"://亲子选择器
                                while((node = lastResult[i++])){
                                    for (node = node.firstChild; node; node = node.nextSibling){
                                        if (node.nodeType === 1 && (flag_all || tagName === node.nodeName)){
                                            elems[ri++] = node;
                                        }
                                    }
                                }
                                break;
                            case "+"://相邻选择器
                                while((node = lastResult[i++])){
                                    while((node = node.nextSibling)){
                                        if (node.nodeType === 1) {
                                            if (flag_all || tagName === node.nodeName)
                                                elems[ri++] = node;
                                            break;
                                        }
                                    }
                                }
                                break;
                            case "~"://兄长选择器
                                while((node = lastResult[i++])){
                                    while((node = node.nextSibling)){
                                        if (node.nodeType === 1 && (flag_all || tagName === node.nodeName)) {
                                            uid = dom.getUid(node);
                                            if (uniqResult[uid]){
                                                break;
                                            }else {
                                                uniqResult[uid] = elems[ri++] = node;
                                            }
                                        }
                                    }
                                }
                                elems = dom.unique(elems);
                                break;
                        }
                    }else if(match = expr.match(rtag)){//处理位于最开始的或并联选择器之后的标签选择器或通配符
                        expr = RegExp.rightContext;
                        elems = getElementsByTagName(match[1].replace(rBackslash,""), lastResult, flag_xml);
                    }
                   
                    if(expr){
                        var arr = Icarus.filter(expr, elems, lastResult, doc, flag_xml);
                        expr = arr[0];
                        elems = arr[1];
                        if (!elems) {
                            flag_dirty = true;
                            elems = getElementsByTagName("*", lastResult, flag_xml);
                        }
                        if (match = expr.match(rcomma)) {
                            expr = RegExp.rightContext;
                            pushResult(elems, result);
                            return Icarus(expr, contexts, result, [], flag_xml, true, flag_dirty);
                        }else{
                            lastResult = elems;
                        }
                    }
                    
                }
            }
            if (flag_multi) {
                if (elems.length){
                    return pushResult(elems, result,flag_multi);
                }
            }else if (DOC !== doc || fixByTag && flag_dirty) {
                for (result = [], ri = 0, i = 0; node = elems[i++]; )
                    if (node.nodeType === 1)
                        result[ri++] = node;
                return result
            }
            return elems;
        }
        var onePosition = dom.oneObject("eq|gt|lt|first|last|even|odd".split("|"));

        dom.mix(Icarus, {
            //getAttribute总会返回字符串
            //http://reference.sitepoint.com/javascript/Element/getAttribute
            getAttribute : !fixGetAttribute ?
            function(elem, name) {
                return elem.getAttribute(name) || '';
            } :
            function(elem, name, flag_xml) {
                if(flag_xml)
                    return elem.getAttribute(name) || '';
                name = name.toLowerCase();
                //http://jsfox.cn/blog/javascript/get-right-href-attribute.html
                if(attrURL[name]){//得到href属性里原始链接，不自动转绝对地址、汉字和符号都不编码
                    return  elem.getAttribute(name, 2) || ''
                }
                if(name === "style"){
                    return elem.style.cssText.toLowerCase();
                }
                if(elem.tagName === "INPUT" && name == "type"){
                    return elem.getAttribute("type") || elem.type;//IE67无法辩识HTML5添加添加的input类型，如input[type=search]，不能使用el.type与el.getAttributeNode去取。
                }
                //布尔属性，如果为true时则返回其属性名，否则返回空字符串，其他一律使用getAttributeNode
                var attr = boolOne[name] ? (elem.getAttribute(name) ? name : '') :
                (elem = elem.getAttributeNode(name)) && elem.value || '';
                return reg_sensitive.test(name)? attr :attr.toLowerCase();
            },
            hasAttribute : !fixHasAttribute ?
            function(elem, name, flag_xml) {
                return flag_xml ?  !!elem.getAttribute(name) :elem.hasAttribute(name);
            } :
            function(elem, name) {
                //http://help.dottoro.com/ljnqsrfe.php
                name = name.toLowerCase();
                //如果这个显式设置的属性是""，即使是outerHTML也寻不见其踪影
                elem = elem.getAttributeNode(name);
                return !!(elem && (elem.specified || elem.nodeValue));
            },
            filter : function(expr, elems, lastResult, doc, flag_xml, flag_get){
                var rsequence = reg_sequence,
                rattrib = reg_attrib ,
                rpseudo = reg_pseudo,
                rBackslash = reg_backslash,
                rattrval  = reg_attrval,
                pushResult = makeArray,
                toHex = _toHex,
                _hash_op  = hash_operator,
                parseNth = parse_nth,
                match ,key, tmp;
                while ( match = expr.match(rsequence)) {//主循环
                    expr = RegExp.rightContext;     
                    key = ( match[2]|| "").replace(rBackslash,"");
                    if (!elems) {//取得用于过滤的元素
                        if (lastResult.length === 1 && lastResult[0] === doc){
                            switch (match[1]) {
                                case "#":
                                    if (!flag_xml) {//FF chrome opera等XML文档中也存在getElementById，但不能用
                                        tmp = doc.getElementById(key);
                                        if (!tmp) {
                                            elems = [];
                                            continue;
                                        }
                                        //处理拥有name值为"id"的控件的form元素
                                        if (fixById ? tmp.id === key : tmp.getAttributeNode("id").nodeValue === key) {
                                            elems = [tmp];
                                            continue;
                                        }
                                    }
                                    break;
                                case ":":
                                    switch (key) {
                                        case "root":
                                            elems = [doc.documentElement];
                                            continue;
                                        case "link":
                                            elems = pushResult(doc.links || []);
                                            continue;
                                    }
                                    break;
                            }
                        }
                        elems = getElementsByTagName("*", lastResult, flag_xml);//取得过滤元
                    }
                    //取得用于过滤的函数，函数参数或数组
                    var filter = 0, flag_not = false, args; 
                    switch (match[1]) {
                        case "#"://ID选择器
                            filter = ["id", "=", key];
                            break;
                        case "."://类选择器
                            filter = ["class", "~=", key];
                            break;
                        case ":"://伪类选择器
                            tmp = Icarus.pseudoAdapter[key];
                            if (match = expr.match(rpseudo)) {
                                expr = RegExp.rightContext;
                                if(!!~key.indexOf("nth")){
                                    args = parseNth[match[1]] || parseNth(match[1]);
                                }else{
                                    args = match[3] || match[2] || match[1]
                                }
                            }
                            if (tmp){
                                filter = tmp;
                            }else if (key === "not") {
                                flag_not = true;
                                if (args === "*"){//处理反选伪类中的通配符选择器
                                    elems = [];
                                }else if(reg_tag.test(args)){//处理反选伪类中的标签选择器
                                    tmp = [];
                                    match = flag_xml ? args : args.toUpperCase();
                                    for (var i = 0, ri = 0, elem; elem = elems[i++];)
                                        if (match !== elem.nodeName)
                                            tmp[ri++] = elem;
                                    elems = tmp;
                                }else{
                                    var obj =  Icarus.filter(args, elems, lastResult, doc, flag_xml, true) ;
                                    filter = obj.filter;
                                    args   = obj.args;
                                }
                            }
                            else{
                                throw 'An invalid or illegal string was specified : "'+ key+'"!'
                            }
                            break
                        default:
                            filter = [key.toLowerCase()];  
                            if (match = expr.match(rattrib)) {
                                expr = RegExp.rightContext;
                                if (match[1]) {
                                    filter[1] = match[1];//op
                                    filter[2] = match[3] || match[4];//对值进行转义
                                    filter[2] = filter[2] ? filter[2].replace(rattrval, toHex).replace(rBackslash,"") : "";
                                }
                            }
                            break;
                    }
                    if(flag_get){
                        return {
                            filter:filter,
                            args:args
                        }
                    }
                    //如果条件都俱备，就开始进行筛选 
                    if (elems.length && filter) {
                        tmp = [];
                        i = 0;
                        ri = 0;
                        if (typeof filter === "function") {//如果是一些简单的伪类
                            if(onePosition[key]){
                                //如果args为void则将集合的最大索引值传进去，否则将exp转换为数字
                                args =  args === void 0 ? elems.length - 1 : ~~args;
                                for (; elem = elems[i];){
                                    if(filter(i++, args) ^ flag_not)
                                        tmp[ri++] = elem;
                                }
                            }else{
                                while((elem = elems[i++])){
                                    if ((!!filter(elem, args)) ^ flag_not)
                                        tmp[ri++] = elem;
                                }
                            }
                        }else if (typeof filter.exec === "function"){//如果是子元素过滤伪类
                            tmp = filter.exec({
                                not: flag_not, 
                                xml: flag_xml
                            }, elems, args, doc);
                        } else {
                            var name = filter[0], op = _hash_op[filter[1]], val = filter[2]||"", flag, attr;
                            if (!flag_xml && name === "class" && op === 4) {//如果是类名
                                val = " " + val + " ";
                                while((elem = elems[i++])){
                                    var className = elem.className;
                                    if (!!(className && (" " + className + " ").indexOf(val) > -1) ^ flag_not){
                                        tmp[ri++] = elem;
                                    }
                                }
                            } else {
                                if(!flag_xml && op && val && !reg_sensitive.test(name)){
                                    val = val.toLowerCase();
                                }
                                if (op === 4){
                                    val = " " + val + " ";
                                }
                                while((elem = elems[i++])){
                                    if(!op){
                                        flag = Icarus.hasAttribute(elem,name,flag_xml);//[title]
                                    }else if(val === "" && op > 3){
                                        flag = false
                                    }else{
                                        attr = Icarus.getAttribute(elem,name,flag_xml);
                                        switch (op) {
                                            case 1:// = 属性值全等于给出值
                                                flag = attr === val;
                                                break;
                                            case 2://!= 非标准，属性值不等于给出值
                                                flag = attr !== val;
                                                break;
                                            case 3://|= 属性值以“-”分割成两部分，给出值等于其中一部分，或全等于属性值
                                                flag = attr === val || attr.substr(0, val.length + 1) === val + "-";
                                                break;
                                            case 4://~= 属性值为多个单词，给出值为其中一个。
                                                flag = attr && (" " + attr + " ").indexOf(val) >= 0;
                                                break;
                                            case 5://^= 属性值以给出值开头
                                                flag = attr  && attr.indexOf(val) === 0 ;
                                                break;
                                            case 6://$= 属性值以给出值结尾
                                                flag = attr  && attr.substr(attr.length - val.length) === val;
                                                break;
                                            case 7://*= 属性值包含给出值
                                                flag = attr  && attr.indexOf(val) >= 0;
                                                break;
                                        }
                                    }
                                    if (flag ^ flag_not)
                                        tmp[ri++] = elem;
                                }
                            }
                        }
                        elems = tmp;
                    }
                }
                return [expr, elems];
            }
        });

        //===================构建处理伪类的适配器=====================
        var filterPseudoHasExp = function(strchild,strsibling, type){
            return {
                exec:function(flags,lastResult,args){
                    var result = [], flag_not = flags.not,child = strchild, sibling = strsibling,
                    ofType = type, cache = {},lock = {},a = args.a, b = args.b, i = 0, ri = 0, el, found ,diff,count;
                    if(!ofType && a === 1 && b === 0 ){
                        return flag_not ? [] : lastResult;
                    }
                    var checkName = ofType ? "nodeName" : "nodeType";
                    for (; el = lastResult[i++];) {
                        var parent = el.parentNode;
                        var pid =  dom.getUid(parent);
                        if (!lock[pid]){
                            count = lock[pid] = 1;
                            var checkValue = ofType ? el.nodeName : 1;
                            for(var node = parent[child];node;node = node[sibling]){
                                if(node[checkName] === checkValue){
                                    pid = dom.getUid(node);
                                    cache[pid] = count++;
                                }
                            }
                        }
                        diff = cache[dom.getUid(el)] - b;
                        found =  a === 0 ? diff === 0 : (diff % a === 0 && diff / a >= 0 );
                        (found ^ flag_not) && (result[ri++] = el);
                    }
                    return  result;
                }
            };
        };
        function filterPseudoNoExp(name, isLast, isOnly) {
            var A = "var result = [], flag_not = flags.not, node, el, tagName, i = 0, ri = 0, found = 0; for (; node = el = lastResult[i++];found = 0) {"
            var B = "{0} while (!found && (node=node.{1})) { (node.{2} === {3})  && ++found;  }";
            var C = " node = el;while (!found && (node = node.previousSibling)) {  node.{2} === {3} && ++found;  }";
            var D =  "!found ^ flag_not && (result[ri++] = el);  }   return result";

            var start = isLast ? "nextSibling" : "previousSibling";
            var fills = {
                type: [" tagName = el.nodeName;", start, "nodeName", "tagName"],
                child: ["", start, "nodeType", "1"]
            }
            [name];
            var body = A+B+(isOnly ? C: "")+D;
            var fn = new Function("flags","lastResult",body.replace(/{(\d)}/g, function ($, $1) {
                return fills[$1];
            }));
            return {
                exec:fn
            }
        }

        function filterProp(str_prop, flag) {
            return {
                exec: function (flags, elems) {
                    var result = [], prop = str_prop, flag_not = flag ? flags.not : !flags.not;
                    for (var i = 0,ri = 0, elem; elem = elems[i++];)
                        if ( elem[prop] ^ flag_not)
                            result[ri++] = elem;//&& ( !flag || elem.type !== "hidden" )
                    return result;
                }
            };
        };
        Icarus.pseudoAdapter = {
            root: function (el) {//标准
                return el === (el.ownerDocument || el.document).documentElement;
            },
            target: {//标准
                exec: function (flags, elems,_,doc) {
                    var result = [], flag_not = flags.not;
                    var win = doc.defaultView || doc.parentWindow;
                    var hash = win.location.hash.slice(1);       
                    for (var i = 0,ri = 0, elem; elem = elems[i++];)
                        if (((elem.id || elem.name) === hash) ^ flag_not)
                            result[ri++] = elem;
                    return result;
                }
            },
            "first-child"    : filterPseudoNoExp("child", false, false),
            "last-child"     : filterPseudoNoExp("child", true,  false),
            "only-child"     : filterPseudoNoExp("child", true,  true),
            "first-of-type"  : filterPseudoNoExp("type",  false, false),
            "last-of-type"   : filterPseudoNoExp("type",  true,  false),
            "only-of-type"   : filterPseudoNoExp("type",  true,  true),//name, isLast, isOnly
            "nth-child"       : filterPseudoHasExp("firstChild", "nextSibling",     false),//标准
            "nth-last-child"  : filterPseudoHasExp("lastChild",  "previousSibling", false),//标准
            "nth-of-type"     : filterPseudoHasExp("firstChild", "nextSibling",     true),//标准
            "nth-last-of-type": filterPseudoHasExp("lastChild",  "previousSibling", true),//标准
            empty: {//标准
                exec: function (flags, elems) {   
                    var result = [], flag_not = flags.not, check
                    for (var i = 0, ri = 0, elem; elem = elems[i++];) {
                        if(elem.nodeType == 1){
                            if (!elem.firstChild ^ flag_not)
                                result[ri++] = elem;
                        }
                    }
                    return result;
                }
            },
            link: {//标准
                exec: function (flags, elems) {
                    var links = (elems[0].ownerDocument || elems[0].document).links;
                    if (!links) return [];
                    var result = [],
                    checked = {},
                    flag_not = flags.not;
                    for (var i = 0, ri = 0,elem; elem = links[i++];)
                        checked[dom.getUid(elem) ] = 1;
                    for (i = 0; elem = elems[i++]; )
                        if (checked[dom.getUid(elem)] ^ flag_not)
                            result[ri++] = elem;
                    return result;
                }
            },
            lang: {//标准 CSS2链接伪类
                exec: function (flags, elems, arg) {
                    var result = [], reg = new RegExp("^" + arg, "i"), flag_not = flags.not;
                    for (var i = 0, ri = 0, elem; elem = elems[i++]; ){
                        var tmp = elem;
                        while (tmp && !tmp.getAttribute("lang"))
                            tmp = tmp.parentNode;
                        tmp = !!(tmp && reg.test(tmp.getAttribute("lang")));
                        if (tmp ^ flag_not)
                            result[ri++] = elem;
                    }
                    return result;
                }
            },
            active: function(el){
                return el === el.ownerDocument.activeElement;
            },
            focus:function(el){
                return (el.type|| el.href) && el === el.ownerDocument.activeElement;
            },
            indeterminate : function(node){//标准
                return node.indeterminate === true && node.type === "checkbox"
            },
            //http://www.w3.org/TR/css3-selectors/#UIstates
            enabled:  filterProp("disabled", false),//标准
            disabled: filterProp("disabled", true),//标准
            checked:  filterProp("checked", true),//标准
            contains: {
                exec: function (flags, elems, arg) {
                    var res = [], elem = elems[0], fn = flags.xml ? dom.getText: getHTMLText,
                    flag_not = flags.not;
                    for (var i = 0, ri = 0, elem; elem = elems[i++]; ){
                        if ((!!~  fn( [elem] ).indexOf(arg)) ^ flag_not)
                            res[ri++] = elem;
                    }
                    return res;
                }
            },
            //自定义伪类
            selected : function(el){
                el.parentNode && el.parentNode.selectedIndex;//处理safari的bug
                return el.selected === true;
            },
            header : function(el){
                return /h\d/i.test( el.nodeName );
            },
            button : function(el){
                return "button" === el.type || el.nodeName === "BUTTON";
            },
            input: function(el){
                return /input|select|textarea|button/i.test(el.nodeName);
            },
            parent : function( el ) {
                return !!el.firstChild;
            },
            has : function(el, expr){//孩子中是否拥有匹配expr的节点
                return !!dom.query(expr,[el]).length;
            },
            //与位置相关的过滤器
            first: function(index){
                return index === 0;
            },
            last: function(index, num){
                return index === num;
            },
            even: function(index){
                return index % 2 === 0;
            },
            odd: function(index){
                return index % 2 === 1;
            },
            lt: function(index, num){
                return index < num;
            },
            gt: function(index, num){
                return index > num;
            },
            eq: function(index, num){
                return index ===  num;
            },
            hidden : function( el ) {
                return el.type === "hidden" || (!el.offsetWidth && !el.offsetHeight) || (el.currentStyle && el.currentStyle.display === "none") ;
            }
        }
        Icarus.pseudoAdapter.visible = function(el){
            return  !Icarus.pseudoAdapter.hidden(el);
        }

        "text,radio,checkbox,file,password,submit,image,reset".replace(dom.rword, function(name){
            Icarus.pseudoAdapter[name] = function(el){
                return (el.getAttribute("type") || el.type) === name;//避开HTML5新增类型导致的BUG，不直接使用el.type === name;
            }
        });
       
    });
    
    dom.define("data", "lang", function(){
        // dom.log("已加载data模块");
        var remitter = /object|function/
        dom.mix(dom,{
            memcache:{},
            // 读写数据
            data : function( target, name, data, pvt ) {
                if(target && remitter.test(typeof target)){//只处理HTML节点与普通对象
                    var id = target.uniqueNumber || (target.uniqueNumber = dom.uuid++);
                    if(name === "@uuid"){
                        return id;
                    }
                    var memcache = target.nodeType === 1 ? dom.memcache: target;
                    var table = memcache[ "@data_"+id ] || (memcache[ "@data_"+id ] = {});
                    if ( !pvt ) {
                        table = table.data || (table.data = {});
                    }
                    var getByName = typeof name === "string";
                    if ( name && typeof name == "object" ) {
                        dom.mix(table, name);
                    }else if(getByName && data !== void 0){
                        table[ name ] = data;
                    }
                    return getByName ? table[ name ] : table;
                }
            },
            _data:function(target,name,data){
                return dom.data(target, name, data, true)
            },
            //移除数据
            removeData : function(target, name, pvt){
                if(target && remitter.test(typeof target)){
                    var id = target.uniqueNumber;
                    if (  !id ) {
                        return;
                    }
                    var memcache = target.nodeType === 1  ? dom.memcache : target;
                    var table = memcache["@data_"+id], clear = 1, ret = typeof name == "string" ;
                    if ( table && ret ) {
                        if(!pvt){
                            table = table.data
                        }
                        if(table){
                            ret = table[ name ];
                            delete table[ name ];
                        }
                        var cache = memcache["@data_"+id];
                            loop:
                            for(var key in cache){
                                if(key == "data"){
                                    for(var i in cache.data){
                                        clear = 0;
                                        break loop;
                                    }
                                }else{
                                    clear = 0;
                                    break loop;
                                }
                            }
                    }
                    if(clear){
                        delete memcache["@data_"+id];
                    }
                    return ret;
                }
            },
            //合并数据
            mergeData:function(neo, src){
                var srcData = dom._data(src), neoData = dom._data(neo), events = srcData.events;
                if(srcData && neoData){
                    dom.Object.merge.call(neoData, srcData);
                    if(events){
                        delete neoData.handle;
                        neoData.events = {};
                        for ( var type in events ) {
                            for (var i = 0, obj ; obj =  events[ type ][i++]; ) {
                                dom.event.bind.call( neo, type + ( obj.namespace ? "." : "" ) + obj.namespace, obj.handler, obj.selector, obj.times );
                            }
                        }
                    }
                }
            }
        });
    });
    dom.define("node", "lang,support,class,query,data,ready",function(lang,support){
        // dom.log("已加载node模块");
        var global = this, DOC = global.document, rtag = /^[a-zA-Z]+$/, TAGS = "getElementsByTagName";
        function getDoc(){
            for(var i  = 0 , el; i < arguments.length; i++){
                if(el = arguments[i]){
                    if(el.nodeType){
                        return el.nodeType === 9 ? el : el.ownerDocument;
                    }else if(el.setTimeout){
                        return el.document;
                    }
                }
            }
            return DOC;
        }
        dom.mix(dom,dom["@class"]).implement({
            init:function(expr,context){
                // 处理空白字符串,null,undefined参数
                if ( !expr ) {
                    return this;
                }
                //让dom实例与元素节点一样拥有ownerDocument属性
                var doc, nodes;//用作节点搜索的起点
                if(/Array|NodeList|String/.test(dom.type(context))|| context && context.version){//typeof context === "string" 

                    return dom(context).find(expr);
                }
                // 处理节点参数
                if ( expr.nodeType ) {
                    this.ownerDocument  = expr.nodeType === 9 ? expr : expr.ownerDocument;
                    return this.merge([expr]);
                }
                this.selector = expr + "";
                if ( expr === "body" && !context && DOC.body ) {//分支3 body
                    this.ownerDocument = DOC;
                    this.merge([DOC.body]);
                    return this.selector = "body";
                }
                if ( typeof expr === "string" ) {
                    doc = this.ownerDocument = !context ? DOC : getDoc(context, context[0]);
                    var scope = context || doc;
                    if ( expr.charAt(0) === "<" && expr.charAt( expr.length - 1 ) === ">" && expr.length >= 3 ) {
                        nodes = dom.parseHTML(expr,doc);//先转化为文档碎片
                        nodes = nodes.childNodes;//再转化为节点数组
                    } else if(rtag.test(expr) ){
                        nodes  = scope[TAGS](expr) ;
                    } else{//分支7：选择器群组
                        nodes  = dom.query(expr, scope);
                    }
                    return this.merge(nodes)
                }else {//分支7：如果是数组，节点集合或者dom对象或window对象
                    this.ownerDocument = getDoc(expr[0]);
                    this.merge( dom.isArrayLike(expr) ? expr : [expr]);
                    delete this.selector;
                }
            },
            version:'1.0',
            length:0,
            valueOf:function(){
                return Array.prototype.slice.call(this);
            },
            toString : function(){
                var i = this.length, ret = [], getType = dom.type;
                while(i--){
                    ret[i] = getType(this[i]);
                }
                return ret.join(", ");
            },
            labor:function(nodes){
                var neo = new dom;
                neo.context = this.context;
                neo.selector = this.selector;
                neo.ownerDocument = this.ownerDocument;
                return neo.merge(nodes||[]);
            },
            slice:function(a,b){
                return this.labor(dom.slice(this,a,b));
            },
            get: function( num ) {
                return num == null ?
                // Return a 'clean' array
                this.valueOf() :
                // Return just the object
                ( num < 0 ? this[ this.length + num ] : this[ num ] );
            },
            eq: function( i ) {
                return i === -1 ? this.slice( i ) :this.slice( i, +i + 1 );
            },

            gt:function(i){
                return this.slice(i+1,this.length);
            },
            lt:function(i){
                return this.slice(0,i);
            },
            first: function() {
                return this.slice( 0,1 );
            },
            even: function(  ) {
                return this.labor(this.valueOf().filter(function(el,i){
                    return i % 2 === 0;
                }));
            },
            odd: function(  ) {
                return this.labor(this.valueOf().filter(function(el,i){
                    return i % 2 === 1;
                }));
            },
            last: function() {
                return this.slice( -1 );
            },
            each : function(callback){
                for(var i = 0, n = this.length; i < n; i++){
                    callback.call(this[i], this[i], i);
                }
                return this;
            },

            map : function( callback ) {
                return this.labor(this.collect(callback));
            },
            
            collect:function(callback){
                var ret = []
                for(var i = 0, ri = 0, n = this.length; i < n; i++){
                    ret[ri++] = callback.call(this[i], this[i], i);
                }
                return ret
            },

            //移除匹配元素
            remove :function(){
                return this.each(function(el){
                    lang(el[TAGS]("*")).concatX(el).forEach(cleanNode);
                    if ( el.parentNode ) {
                        el.parentNode.removeChild( el );
                    }
                });
            },
            //清空匹配元素的内容
            empty:function(){
                return this.each(function(el){
                    lang(el[TAGS]("*")).forEach(cleanNode);
                    while ( el.firstChild ) {
                        el.removeChild( el.firstChild );
                    }
                });
            },

            clone : function( dataAndEvents, deepDataAndEvents ) {
                dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
                deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
                return this.map( function () {
                    return cloneNode( this,  dataAndEvents, deepDataAndEvents );
                });
            },

            merge: function (arr){ //把普通对象变成类数组对象，
                var ri = this.length,node;
                for(var i = 0,n = arr.length;node = arr[i],i < n ;i ++){
                    if(node && (node.nodeType || node.document)){
                        this[ri++] = node;
                    }
                }
                this.length = ri;
                return this;
            },
            //取得或设置节点的innerHTML属性
            html: function(value){
                if(value === void 0){
                    var el = this[0]
                    if(el && (el.nodeType ===1 || /xml/i.test(el.nodeName))){//处理IE的XML数据岛
                        return "innerHTML" in el ? el.innerHTML : innerHTML(el)
                    }
                    return null;
                }else {
                    value = (value || "")+""
                    if(support.innerHTML && (!rcreate.test(value) && !rnest.test(value))){
                        try {
                            for ( var i = 0, node; node = this[i++]; ) {
                                if ( node.nodeType === 1 ) {
                                    lang(node[TAGS]("*")).forEach(cleanNode);
                                    node.innerHTML = value;
                                }
                            }
                            return this;
                        } catch(e) {}
                    }
                    return this.empty().append( value );
                }
            },
            // 取得或设置节点的text或innerText或textContent属性
            text:function(value){
                var node = this[0];
                if(value === void 0){
                    if(!node){
                        return "";
                    }else if(node.tagName == "OPTION" || node.tagName === "SCRIPT"){
                        return node.text;
                    }else{
                        return node.textContent || node.innerText ||  dom.getText([ node ]);
                    }
                }else{
                    return this.empty().append( this.ownerDocument.createTextNode( value ));
                }
            },
            // 取得或设置节点的outerHTML
            outerHTML:function(value){
                if(typeof value === "string"){
                    return this.empty().replace( value );
                }
                var el = this[0]
                if(el && el.nodeType === 1 ){
                    return "outerHTML" in el? el.outerHTML :outerHTML(el)
                }
                return null;
            }
        });
        dom.fn = dom.prototype;
        dom.fn.init.prototype = dom.fn;

        //前导 前置 追加 后放 替换
        "append,prepend,before,after,replace".replace(dom.rword,function(method){
            dom.fn[method] = function(insertion){
                return manipulate(this, method, insertion);
            }
            dom.fn[method+"To"] = function(insertion){
                dom(insertion,this.ownerDocument)[method](this);
                return this;
            }
        });
        var HTML = dom.html;
        var matchesAPI = HTML.matchesSelector || HTML.mozMatchesSelector || HTML.webkitMatchesSelector || HTML.msMatchesSelector;
        dom.extend({
            match : function(node, expr, i){
                if(dom.type(expr, "Function")){
                    return expr.call(node,node,i);
                }
                try{
                    return matchesAPI.call( node, expr );
                } catch(e) {
                    var parent = node.parentNode;
                    if(parent){
                        var array = dom.query(expr,parent);
                        return !!(array.length && array.indexOf(node))
                    }
                    return false;
                }
            },
            access: function( elems,  key, value, set, get ) {
                var length = elems.length;
                //使用一个纯净的对象一下子设置多个属性
                if ( typeof key === "object" ) {
                    for ( var k in key ) {
                        dom.access( elems, k, key[k], set, get );
                    }
                    return elems;
                }
                // 设置一个属性
                if ( value !== void 0 ) {
                    for ( var i = 0; i < length; i++ ) {
                        set( elems[i], key, value);
                    }
                    return elems;
                }
                //获取一个属性
                return length ? get( elems[0], key ) : void 0;
            },

            /**
                 * 将字符串转换为文档碎片，如果没有传入文档碎片，自行创建一个
                 * 有关innerHTML与createElement创建节点的效率可见<a href="http://andrew.hedges.name/experiments/innerhtml/">这里</a><br/>
                 * 注意，它能执行元素的内联事件，如<br/>
                 * <pre><code>dom.parseHTML("<img src=1 onerror=alert(22) />")</code></pre>
                 * @param {String} html 要转换为节点的字符串
                 * @param {Document} doc 可选
                 * @return {FragmentDocument}
                 */
            parseHTML:function( html, doc){
                doc = doc || this.nodeType === 9  && this || DOC;
                html = html.replace(rxhtml, "<$1></$2>").trim();
                //尝试使用createContextualFragment获取更高的效率
                //http://www.cnblogs.com/rubylouvre/archive/2011/04/15/2016800.html
                var range = support.fastFragment
                if(range && doc === DOC && DOC.body && !rcreate.test(html) && !rnest.test(html)){
                    range.selectNodeContents(DOC.body);//fix opera(9.2~11.51) bug,必须对文档进行选取
                    return range.createContextualFragment(html);
                }
                if(!support.createAll){//fix IE
                    html = html.replace(rcreate,"<br class='fix_create_all'/>$1");//在link style script等标签之前添加一个补丁
                }
                var tag = (rtagName.exec( html ) || ["", ""])[1].toLowerCase(),//取得其标签名
                wrap = translations[ tag ] || translations._default,
                fragment = doc.createDocumentFragment(),
                wrapper = doc.createElement("div"), firstChild;
                wrapper.innerHTML = wrap[1] + html + wrap[2];
                var scripts = wrapper[TAGS]("script");
                if(scripts.length){//使用innerHTML生成的script节点不会发出请求与执行text属性
                    var script2 = doc.createElement("script"), script3;
                    for(var i = 0, script; script = scripts[i++];){
                        if(!script.type || types[script.type]){//如果script节点的MIME能让其执行脚本
                            script3 = script2.cloneNode(false);//FF不能省略参数
                            for(var j = 0, attr;attr = script.attributes[j++];){
                                if(attr.specified){//复制其属性
                                    script3[attr.name] = [attr.value];
                                }
                            }
                            script3.text = script.text;//必须指定,因为无法在attributes中遍历出来
                            script.parentNode.replaceChild(script3,script);//替换节点
                        }
                    }
                }
                //移除我们为了符合套嵌关系而添加的标签
                for (i = wrap[0]; i--;wrapper = wrapper.lastChild);
                //在IE6中,当我们在处理colgroup, thead, tfoot, table时会发生成一个tbody标签
                if( support.insertTbody ){
                    var spear = !rtbody.test(html),//矛:html本身就不存在<tbody字样
                    tbodys = wrapper[TAGS]("tbody"),
                    shield = tbodys.length > 0;//盾：实际上生成的NodeList中存在tbody节点
                    if(spear && shield){
                        for(var t=0, tbody; tbody = tbodys[t++];){
                            if(!tbody.childNodes.length )//如果是自动插入的里面肯定没有内容
                                tbody.parentNode.removeChild(tbody );
                        }
                    }
                }
                if(!support.createAll){//移除所有补丁
                    var brs =  wrapper[TAGS]("br");
                    for(var b=0,br;br = brs[b++];){
                        if(br.className && br.className === "fix_create_all"){
                            br.parentNode.removeChild(br);
                        }
                    }
                }
                while((firstChild = wrapper.firstChild)){ // 将wrapper上的节点转移到文档碎片上！
                    fragment.appendChild(firstChild);
                }
                return  fragment
            }
        });
        //parseHTML的辅助变量
        var translations  = {
            option: [ 1, "<select multiple='multiple'>", "</select>" ],
            legend: [ 1, "<fieldset>", "</fieldset>" ],
            thead: [ 1, "<table>", "</table>" ],
            tr: [ 2, "<table><tbody>", "</tbody></table>" ],
            td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
            col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
            area: [ 1, "<map>", "</map>" ],
            _default: [ 0, "", "" ]
        };
        translations.optgroup = translations.option;
        translations.tbody = translations.tfoot = translations.colgroup = translations.caption = translations.thead;
        translations.th = translations.td;
        var
        rtbody = /<tbody[^>]*>/i,
        rtagName = /<([\w:]+)/,//取得其tagName
        rxhtml =  /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
        rcreate = support.createAll ? /<(?:script)/ig : /(<(?:script|link|style))/ig,
        types = dom.oneObject("text/javascript","text/ecmascript","application/ecmascript","application/javascript","text/vbscript"),
        //需要处理套嵌关系的标签
        rnest = /<(?:td|th|tf|tr|col|opt|leg|cap|area)/,adjacent = "insertAdjacentHTML",
        insertApapter = {
            prepend : function(el, node){
                el.insertBefore(node,el.firstChild);
            },
            append  : function(el, node){
                el.appendChild(node);
            },
            before  : function(el, node){
                el.parentNode.insertBefore(node,el);
            },
            after   : function(el, node){
                el.parentNode.insertBefore(node,el.nextSibling);
            },
            replace : function(el, node){
                el.parentNode.replaceChild(node,el);
            },
            prepend2: function(el, html){
                el[adjacent]( "afterBegin", html);
            },
            append2 : function(el, html){
                el[adjacent]( "beforeEnd", html);
            },
            before2 : function(el,html){
                el[adjacent]( "beforeBegin",html);
            },
            after2  : function(el, html){
                el[adjacent]( "afterEnd", html);
            }
        };

        var insertAdjacentNode = function(nodes,callback,stuff){
            for(var i = 0, node; node = nodes[i];i++){
                callback(node, !!i ? stuff : cloneNode(stuff,true,true) );
            }
        }
        var insertAdjacentHTML = function(nodes,slowInsert,fragment,fast,fastInsert,html){
            for(var i = 0, node; node = nodes[i++];){
                if(fast && node[adjacent]){//确保是支持insertAdjacentHTML的HTML元素节点
                    fastInsert(node,html);
                }else{
                    slowInsert(node,fragment.cloneNode(true));
                }
            }
        }
        var insertAdjacentFragment = function(nodes,callback,fakearray){
            var fragment = nodes.ownerDocument.createDocumentFragment();
            for(var i = 0, node; node = nodes[i++];){
                callback(node, makeFragment(fakearray,fragment,i > 1));
            }
        }
        var makeFragment = function(nodes,fragment,bool){
            //只有非NodeList的情况下我们才为i递增;
            var ret = fragment.cloneNode(false), go= !nodes.item
            for(var i = 0,node;node = nodes[i]; go && i++){
                ret.appendChild(bool && cloneNode(node,true,true) || node);
            }
            return ret;
        }
        /**
             * 实现insertAdjacentHTML的增强版
             * @param {dom}  nodes  dom实例
             * @param {String} type 方法名
             * @param {Any}  stuff 插入内容或替换内容,可以为HTML字符串片断，元素节点，文本节点，文档碎片或dom对象
             * @return {dom} 还是刚才的dom实例
             */
        function manipulate(nodes, type, stuff){
            if(stuff.nodeType ){
                //如果是传入元素节点或文本节点或文档碎片
                insertAdjacentNode(nodes,insertApapter[type],stuff) ;
            }else if(typeof stuff === "string"){
                //如果传入的是字符串片断
                var fragment = dom.parseHTML(stuff, nodes.ownerDocument),
                //如果方法名不是replace并且完美支持insertAdjacentHTML并且不存在套嵌关系的标签
                fast = (type !== "replace") && support[adjacent] &&  !rnest.test(stuff);
                insertAdjacentHTML(nodes,insertApapter[type],fragment, fast, insertApapter[type+"2"],stuff ) ;
            }else if( stuff.length) {
                //如果传入的是HTMLCollection nodeList dom实例，将转换为文档碎片
                insertAdjacentFragment(nodes,insertApapter[type],stuff) ;
            }
            return nodes;
        }
        dom.implement({
            data:function(key,value){
                if ( typeof key === "string" ) {
                    if(value === void 0){
                        return dom.data(this[0], key);
                    }else{//读方法，取第一个匹配元素的相关属性
                        return this.each(function(el){
                            dom.data(el, key, value);//写方法，为所有匹配元素缓存相关属性
                        });
                    }
                } else if ( dom.isPlainObject(key) ) {
                    return  this.each(function(el){
                        var d = dom.data(el);
                        d && dom.mix(d, key);//写方法，为所有匹配元素缓存相关属性
                    });
                }
                return this;
            },
            removeData: function( key ) {
                return this.each(function() {
                    dom.removeData( this, key );
                });
            }
        });
        //======================================================================
        //复制与移除节点时的一些辅助函数
        //======================================================================
        function cleanNode(target){
            target.uniqueNumber && dom.removeData(target);
            target.clearAttributes && target.clearAttributes();
        }
        function cloneNode( node, dataAndEvents, deepDataAndEvents ) {
            var neo = node.cloneNode(true), src, neos, i;
            //   处理IE6-8下复制事件时一系列错误
            if(node.nodeType === 1){
                if(dom.support.cloneAll ){
                    fixNode( neo, node );
                    src = node[TAGS]("*");
                    neos = neo[TAGS]("*");
                    for ( i = 0; src[i]; i++ ) {
                        fixNode( neos[i] ,src[i] );
                    }
                }
                // 复制自定义属性，事件也被当作一种特殊的能活动的数据
                if ( dataAndEvents ) {
                    dom.mergeData( neo, node );
                    if ( deepDataAndEvents ) {
                        src =  node[TAGS]("*");
                        neos = neo[TAGS]("*");
                        for ( i = 0; src[i]; i++ ) {
                            dom.mergeData( neos[i] ,src[i] );
                        }
                    }
                }
                src = neos = null;
            }
            return neo;
        }
        //修正IE下对数据克隆时出现的一系列问题
        function fixNode(clone, src) {
            if(src.nodeType == 1){
                // 只处理元素节点
                var nodeName = clone.nodeName.toLowerCase();
                //clearAttributes方法可以清除元素的所有属性值，如style样式，或者class属性，与attachEvent绑定上去的事件
                clone.clearAttributes();
                //复制原对象的属性到克隆体中,但不包含原来的事件
                clone.mergeAttributes(src);
                //IE6-8无法复制其内部的元素
                if ( nodeName === "object" ) {
                    clone.outerHTML = src.outerHTML;
                } else if ( nodeName === "input" && (src.type === "checkbox" || src.type == "radio") ) {
                    //IE6-8无法复制chechbox的值，在IE6-7中也defaultChecked属性也遗漏了
                    if ( src.checked ) {
                        clone.defaultChecked = clone.checked = src.checked;
                    }
                    // 除Chrome外，所有浏览器都会给没有value的checkbox一个默认的value值”on”。
                    if ( clone.value !== src.value ) {
                        clone.value = src.value;
                    }
                // IE6-8 无法保持选中状态
                } else if ( nodeName === "option" ) {
                    clone.selected = src.defaultSelected;
                // IE6-8 无法保持默认值
                } else if ( nodeName === "input" || nodeName === "textarea" ) {
                    clone.defaultValue = src.defaultValue;
                }
            }
        }
        function outerHTML(el){
            switch(el.nodeType+""){
                case "1":
                case "9":
                    return "xml" in el ?  el.xml: new XMLSerializer().serializeToString(el);
                case "3":
                case "4":
                    return el.nodeValue;
                case "8":
                    return "<!--"+el.nodeValue+"-->"
            }
        }
        function innerHTML(el){
            var array = [];
            for(var i=0,c;c=el.childNodes[i++];){
                array.push(outerHTML(c))
            }
            return array.join("");
        }
        
        dom.implement({
            //取得当前匹配节点的所有匹配expr的后代，组成新dom实例返回。
            find: function(expr){
                return this.labor(dom.query(expr,this));
            },
            //取得当前匹配节点的所有匹配expr的节点，组成新dom实例返回。
            filter:function(expr){
                return this.labor(filterhElement(this.valueOf(), expr, this.ownerDocument, false));
            },
            //取得当前匹配节点的所有不匹配expr的节点，组成新dom实例返回
            not: function(expr){
                return this.labor(filterhElement(this.valueOf(), expr,  this.ownerDocument,   true));
            },
            //判定当前匹配节点是否匹配给定选择器，DOM元素，或者dom对象
            is:function(expr){
                var nodes = dom.query(expr,this.ownerDocument), obj = {}, uid
                for(var i =0 , node; node = nodes[i++];){
                    uid = dom.getUid(node);
                    obj[uid] = 1;
                }
                return dom.slice(this).some(function(el){
                    return  obj[dom.getUid(el)];
                });
            },
            //取得匹配节点中那些后代中能匹配给定CSS表达式的节点，组成新dom实例返回。
            has: function( target ) {
                var targets = dom( target,this.ownerDocument );
                return this.filter(function() {
                    for ( var i = 0, l = targets.length; i < l; i++ ) {
                        if ( dom.contains( this, targets[i] ) ) {//a包含b
                            return true;
                        }
                    }
                });
            },
            closest: function( expr, context ) {
                var  nodes = dom( expr, context || this.ownerDocument ).valueOf();
                //遍历原dom对象的节点
                for (var i = 0, ret = [], cur; cur = this[i++];) {
                    while ( cur ) {
                        if ( ~nodes.indexOf(cur)  ) {
                            ret.push( cur );
                            break;
                        } else { // 否则把当前节点变为其父节点
                            cur = cur.parentNode;
                            if ( !cur || !cur.ownerDocument || cur === context || cur.nodeType === 11 ) {
                                break;
                            }
                        }
                    }
                }
                //如果大于1,进行唯一化操作
                ret = ret.length > 1 ? dom.unique( ret ) : ret;
                //将节点集合重新包装成一个新jQuery对象返回
                return this.labor(ret);
            },
            index:function(el){ 
                var first = this[0]
                if ( !el ) {//如果没有参数，返回第一元素位于其兄弟的位置
                    return ( first && first.parentNode ) ? this.prevAll().length : -1;
                }
                // 返回第一个元素在新实例中的位置
                if ( typeof el === "string" ) {
                    return dom(el).index(first)
                }
                // 返回传入元素（如果是dom实例则取其第一个元素）位于原实例的位置
                return   this.valueOf().indexOf(el.version ? el[0] : el)
            }

        });

        function filterhElement( nodes, expr,doc, not ) {
            var ret = [];
            not = !!not;
            if(typeof expr === "string"){
                var fit = dom.query(expr, doc);
                nodes.forEach(function( el ) {
                    if(el.nodeType === 1){
                        if((fit.indexOf(el) !== -1) ^ not){
                            ret.push(el)
                        }
                    }
                });
            }else if(dom.type(expr, "Function")){
                return nodes.filter(function(el, i ){
                    return !!expr.call( el, el, i ) ^ not;
                });
            }else if(expr.nodeType){
                return nodes.filter(function( el, i ) {
                    return (el === expr) ^ not;
                });
            }
            return ret;
        }

        var uniqOne = dom.oneObject("children","contents","next","prev");

        function travel( el, prop, expr ) {
            var result = [],ri = 0;
            while((el = el[prop])){
                if( el && el.nodeType === 1){
                    result[ri++] = el;
                    if(expr === true){
                        break;
                    }else if(typeof expr === "string" && dom( el ).is( expr )){
                        result.pop();
                        break;
                    }
                }
            }
            return result
        };

        lang({
            parent:function(el){
                var parent = el.parentNode;
                return parent && parent.nodeType !== 11 ? parent : [];
            },
            parents:function(el){
                return travel(el, "parentNode").reverse();
            },
            parentsUntil:function(el, expr){
                return travel(el, "parentNode", expr).reverse();
            },
            next :function(el){
                return travel(el, "nextSibling", true)
            },
            nextAll :function(el){
                return travel(el, "nextSibling");
            },
            nextUntil:function(el, expr){
                return travel(el, "nextSibling", expr);
            },
            prev :function(el){
                return travel(el, "previousSibling", true);
            },
            prevAll :function(el){
                return travel(el, "previousSibling" ).reverse();
            },
            prevUntil :function(el, expr){
                return travel(el, "previousSibling", expr).reverse();
            },
            children:function(el){
                return  el.children ? dom.slice(el.children) :
                lang(el.childNodes).filter(function(ee){
                    return ee.nodeType === 1
                });
            },
            siblings:function(el){
                return travel(el,"previousSibling").reverse().concat(travel(el,"nextSibling"));
            },
            contents:function(el){
                return el.tagName === "IFRAME" ?
                el.contentDocument || el.contentWindow.document :
                dom.slice( el.childNodes );
            }
        }).forEach(function(method,name){
            dom.fn[name] = function(selector){
                var nodes = [];
                dom.slice(this).forEach(function(el){
                    nodes = nodes.concat(method(el,selector));
                });
                if(/Until/.test(name)){
                    selector = null
                }
                nodes = this.length > 1 && !uniqOne[ name ] ? dom.unique( nodes ) : nodes;
                var neo = this.labor(nodes);
                return selector ? neo.filter(selector) :neo;
            };
        });
    });
    dom.define("css_ie", function(){
        dom.log("已加载css_ie模块");
        if(!dom.html.currentStyle)
            return
        var adapter = dom.cssAdapter = {};
        //=========================　处理　opacity　=========================
        var  ropacity = /opacity=([^)]*)/i,  ralpha = /alpha\([^)]*\)/i,
        rnumpx = /^-?\d+(?:px)?$/i, rnum = /^-?\d/;
        adapter["opacity:get"] = function(node,op){
            //这是最快的获取IE透明值的方式，不需要动用正则了！
            if(node.filters.alpha){
                op = node.filters.alpha.opacity;
            }else if(node.filters["DXImageTransform.Microsoft.Alpha"]){
                op = node.filters["DXImageTransform.Microsoft.Alpha"].opacity
            }else{
                op = (node.currentStyle.filter ||"opacity=100").match(ropacity)[1];
            }
            return (op  ? op /100 :op)+"";//如果是零就不用除100了
        }
        adapter["opacity:set"] = function(node, name, value){
            var currentStyle = node.currentStyle, style = node.style;
            if(!currentStyle.hasLayout)
                style.zoom = 1;//让元素获得hasLayout
            value = (value > 0.999) ? 1: (value < 0.001) ? 0 : value;
            if(node.filters.alpha){
                //必须已经定义过透明滤镜才能使用以下便捷方式
                node.filters.alpha.opacity = value * 100;
            }else{
                style.filter = "alpha(opacity="+((value * 100) | 0)+")";
            }
            //IE7的透明滤镜当其值为100时会让文本模糊不清
            if(value === 1){
                style.filter = currentStyle.filter.replace(ralpha,'');
            }
        // style.visibility = value ? "visible" : "hidden";
        }
        var ie8 = !!this.XDomainRequest,
        border = {
            thin:   ie8 ? '1px' : '2px',
            medium: ie8 ? '3px' : '4px',
            thick: ie8 ? '5px' : '6px'
        };

        adapter[ "_default:get" ] = function(node, name){
            var ret = node.currentStyle && node.currentStyle[name];
            if ((!rnumpx.test(ret) && rnum.test(ret))) {
                var style = node.style,
                left = style.left,
                rsLeft = node.runtimeStyle && node.runtimeStyle.left ;
                if (rsLeft) {
                    node.runtimeStyle.left = node.currentStyle.left;
                }
                style.left = name === 'fontSize' ? '1em' : (ret || 0);
                ret = style.pixelLeft + "px";
                style.left = left;
                if (rsLeft) {
                    node.runtimeStyle.left = rsLeft;
                }
            }
            if(ret == "medium"){
                name = name.replace("Width","Style");
                //border width 默认值为medium，即使其为0"
                if(arguments.callee(node,name) == "none"){
                    ret = "0px";
                }
            }
            if(/margin|padding|border/.test(name) && ret === "auto"){
                ret = "0px";
            }
            return ret === "" ? "auto" : border[ret] ||  ret;
        }
        dom.transform = function(node,  param){
            var meta = dom._data(node,"transform"), ident  = "DXImageTransform.Microsoft.Matrix",arr = [1,0,0,1,0,0], m
            if(!meta){
                //http://msdn.microsoft.com/en-us/library/ms533014(v=vs.85).aspx
                m = node.filters ? node.filters[ident] : 0;
                arr = m ? [m.M11, m.M12, m.M21, m.M22, m.Dx, m.Dy] : arr;
                meta = dom._toMatrixObject(arr);
                meta.rotate = - meta.rotate;
                //保存到缓存系统，省得每次都计算
                dom._data(node,"transform",meta);
            }
            if(arguments.length === 1){
                return meta;//getter
            }
            //setter
            meta = dom._data(node,"transform",{
                scaleX:     param.scaleX     === void 0 ? meta.scaleX     : param.scaleX,
                scaleY:     param.scaleY     === void 0 ? meta.scaleY     : param.scaleY,
                rotate:     param.rotate     === void 0 ? meta.rotate     : param.rotate,
                translateX: param.translateX === void 0 ? meta.translateX : parseInt(param.translateX)|0,
                translateY: param.translateY === void 0 ? meta.translateY : parseInt(param.translateY)|0
            });

            //注意：IE滤镜和其他浏览器定义的角度方向相反
            var r = -dom.all2rad(meta.rotate),
            cos  = Math.cos(r ), sin = Math.sin(r),
            mtx   = [ 
            cos * meta.scaleX,  sin * meta.scaleX, 0,
            -sin * meta.scaleY, cos * meta.scaleY, 0,
            meta.translateX,    meta.translateY,   1],
            cxcy= dom._data(node,"cxcy");
            if (!cxcy) {
                var rect = node.getBoundingClientRect(),
                cx = (rect.right  - rect.left) / 2, // center x
                cy = (rect.bottom - rect.top)  / 2; // center y
                if(node.currentStyle.hasLayout){
                    node.style.zoom = 1;
                }
                //IE9下请千万别设置  <meta content="IE=8" http-equiv="X-UA-Compatible"/>
                //http://www.cnblogs.com/Libra/archive/2009/03/24/1420731.html
                node.style.filter += " progid:" + ident + "(sizingMethod='auto expand')";
                cxcy =  dom._data(node,"cxcy", {
                    cx: cx, 
                    cy: cy
                });
            }
            m = node.filters[ident];
            m.M11 = mtx[0];
            m.M12 = mtx[1];
            m.M21 = mtx[3];
            m.M22 = mtx[4];
            m.Dx  = mtx[6];
            m.Dy  = mtx[7];
            // recalc center
            rect = node.getBoundingClientRect();
            cx = (rect.right  - rect.left) / 2;
            cy = (rect.bottom - rect.top)  / 2;
            node.style.marginLeft = cxcy.cx - cx + "px";
            node.style.marginTop  = cxcy.cy - cy + "px";
        }
    });
    
    var node$css_ie = this.getComputedStyle ?  "node" : "node,css_ie" ;
    dom.define("css", node$css_ie, function(){
        var global = this, DOC = global.document,
        cssFloat = dom.support.cssFloat ? 'cssFloat': 'styleFloat',
        rmatrix = /\(([^,]*),([^,]*),([^,]*),([^,]*),([^,p]*)(?:px)?,([^)p]*)(?:px)?/,
        rad2deg = 180/Math.PI, deg2rad = Math.PI/180,
        rcap = /-([a-z])/g,capfn = function(_,$1){
            return $1.toUpperCase();
        },prefixes = ['', '-ms-','-moz-', '-webkit-', '-khtml-', '-o-','ms-'],
        adapter = dom.cssAdapter = dom.cssAdapter || {};
        function cssCache(name){
            return cssCache[name] || (cssCache[name] = name == 'float' ? cssFloat : name.replace(rcap, capfn));
        }

        //http://www.w3.org/TR/2009/WD-css3-2d-transforms-20091201/#introduction
        dom.mix(dom, {
            cssCache:cssCache,
            //http://www.cnblogs.com/rubylouvre/archive/2011/03/28/1998223.html
            cssName : function(name, target, test){
                if(cssCache[name])
                    return name;
                target = target || dom.html.style;
                for (var i=0, l=prefixes.length; i < l; i++) {
                    test = (prefixes[i] + name).replace(rcap,capfn);
                    if(test in target){
                        return (cssCache[name] = test);
                    }
                }
                return null;
            },
            scrollbarWidth:function (){
                if(dom.scrollbarWidth.ret){
                    return dom.scrollbarWidth.ret
                }
                var test =  dom('<div style="width: 100px;height: 100px;overflow: scroll;position: absolute;top: -9999px;"/>').appendTo("body")
                var ret = test[0].offsetWidth - test[0].clientWidth;              
                test.remove();
                return dom.scrollbarWidth.ret = ret
            },
            cssNumber : dom.oneObject("fontSizeAdjust,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom,rotate"),
            css: function(nodes, name, value){
                var props = {} , fn;
                nodes = nodes.nodeType == 1 ? [nodes] : nodes;
                if(name && typeof name === "object"){
                    props = name;
                }else if(value === void 0){
                    return (adapter[name+":get"] || adapter["_default:get"])( nodes[0], cssCache(name) );
                }else {
                    props[name] = value;
                }
                for(name in props){
                    value = props[name];
                    name = cssCache(name);
                    fn = adapter[name+":set"] || adapter["_default:set"];
                    if ( isFinite( value ) && !dom.cssNumber[ name ] ) {
                        value += "px";
                    }
                    for(var i = 0, node; node = nodes[i++];){
                        if(node && node.nodeType === 1){
                            fn(node, name, value );
                        }
                    }
                }
                return nodes;
            },
            //CSS3新增的三种角度单位分别为deg(角度)， rad(弧度)， grad(梯度或称百分度 )。 
            all2deg : function (value) {
                value += "";
                return ~value.indexOf("deg") ?  parseInt(value,10): 
                ~value.indexOf("grad") ?  parseInt(value,10) * 2/1.8:
                ~value.indexOf("rad") ?   parseInt(value,10) * rad2deg:
                parseFloat(value);
            },
            all2rad :function (value){
                return dom.all2deg(value) * deg2rad;
            },
            //将 skewx(10deg) translatex(150px)这样的字符串转换成3*2的距阵
            _toMatrixArray: function(/*String*/ transform ) {
                transform = transform.split(")");
                var
                i = transform.length -1
                , split, prop, val
                , A = 1
                , B = 0
                , C = 0
                , D = 1
                , A_, B_, C_, D_
                , tmp1, tmp2
                , X = 0
                , Y = 0 ;
                while ( i-- ) {
                    split = transform[i].split("(");
                    prop = split[0].trim();
                    val = split[1];
                    A_ = B_ = C_ = D_ = 0;
                    switch (prop) {
                        case "translateX":
                            X += parseInt(val, 10);
                            continue;

                        case "translateY":
                            Y += parseInt(val, 10);
                            continue;

                        case "translate":
                            val = val.split(",");
                            X += parseInt(val[0], 10);
                            Y += parseInt(val[1] || 0, 10);
                            continue;

                        case "rotate":
                            val = dom.all2rad(val) ;
                            A_ = Math.cos(val);
                            B_ = Math.sin(val);
                            C_ = -Math.sin(val);
                            D_ = Math.cos(val);
                            break;

                        case "scaleX":
                            A_ = val;
                            D_ = 1;
                            break;

                        case "scaleY":
                            A_ = 1;
                            D_ = val;
                            break;

                        case "scale":
                            val = val.split(",");
                            A_ = val[0];
                            D_ = val.length>1 ? val[1] : val[0];
                            break;

                        case "skewX":
                            A_ = D_ = 1;
                            C_ = Math.tan( dom.all2rad(val));
                            break;

                        case "skewY":
                            A_ = D_ = 1;
                            B_ = Math.tan( dom.all2rad(val));
                            break;

                        case "skew":
                            A_ = D_ = 1;
                            val = val.split(",");
                            C_ = Math.tan( dom.all2rad(val[0]));
                            B_ = Math.tan( dom.all2rad(val[1] || 0));
                            break;

                        case "matrix":
                            val = val.split(",");
                            A_ = +val[0];
                            B_ = +val[1];
                            C_ = +val[2];
                            D_ = +val[3];
                            X += parseInt(val[4], 10);
                            Y += parseInt(val[5], 10);
                    }
                    // Matrix product
                    tmp1 = A * A_ + B * C_;
                    B    = A * B_ + B * D_;
                    tmp2 = C * A_ + D * C_;
                    D    = C * B_ + D * D_;
                    A = tmp1;
                    C = tmp2;
                }
                return [A,B,C,D,X,Y];
            },
            // 将矩阵转换为一个含有 rotate, scale and skew 属性的对象
            // http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp
            _toMatrixObject: function(/*Array*/matrix) {
                var scaleX
                , scaleY
                , XYshear 
                , A = matrix[0]
                , B = matrix[1]
                , C = matrix[2]
                , D = matrix[3] ;
                // matrix is singular and cannot be interpolated
                if ( A * D - B * C ) {
                    // step (3)
                    scaleX = Math.sqrt( A * A + B * B );
                    A /= scaleX;
                    B /= scaleX;
                    // step (4)
                    XYshear  = A * C + B * D;
                    C -= A * XYshear ;
                    D -= B * XYshear ;
                    // step (5)
                    scaleY = Math.sqrt( C * C + D * D );
                    C /= scaleY;
                    D /= scaleY;
                    XYshear /= scaleY;
                    // step (6)
                    // A*D - B*C should now be 1 or -1
                    if ( A * D < B * C ) {
                        A = -A;
                        B = -B;
                        C = -C;
                        B = -B;
                        D = -D;
                        XYshear = -XYshear;
                        scaleX = -scaleX;
                    }

                } else {
                    B = A = scaleX = scaleY = XYshear = 0;
                }
                return {
                    translateX: +matrix[4],
                    translateY: +matrix[5],
                    rotate: Math.atan2(B, A),
                    scaleX: scaleX,
                    scaleY: scaleY,
                    skew: [XYshear, 0]
                }
            }
      
        });
        //支持情况 ff3.5 chrome ie9 pp6 opara10.5 safari3.1
        var cssTransfrom = dom.cssName("transform");
        if(cssTransfrom){
            // gerrer(node) 返回一个包含 scaleX,scaleY, rotate, translateX,translateY, translateZ的对象
            // setter(node, { rotate: 30 })返回自身
            dom.transform = function(node,  param){
                var meta = dom._data(node,"transform"),arr = [1,0,0,1,0,0], m
                if(!meta){
                    //将CSS3 transform属性中的数值分解出来
                    var style = dom.css([node],cssTransfrom);
                    if(~style.indexOf("matrix")){
                        m = rmatrix.exec(style);
                        arr = [m[1], m[2], m[3], m[4], m[5], m[6]];
                    }else if(style.length > 6){
                        arr = dom._toMatrixArray(style)
                    }
                    meta = dom._toMatrixObject(arr);
                    //保存到缓存系统，省得每次都计算
                    dom._data(node,"transform",meta);
                }

                if(arguments.length === 1){
                    return meta;//getter
                }
                //setter
                meta = dom._data(node,"transform",{
                    scaleX:     param.scaleX     === void 0 ? meta.scaleX     : param.scaleX,
                    scaleY:     param.scaleY     === void 0 ? meta.scaleY     : param.scaleY,
                    rotate:     param.rotate     === void 0 ? meta.rotate     : param.rotate,
                    translateX: param.translateX === void 0 ? meta.translateX : parseInt(param.translateX)|0,
                    translateY: param.translateY === void 0 ? meta.translateY : parseInt(param.translateY)|0
                });
                node.style[cssTransfrom]  =
                "scale(" + meta.scaleX + "," + meta.scaleY + ") " +
                "rotate(" + dom.all2deg(meta.rotate)  + "deg) " +
                "translate(" + meta.translateX  + "px," + meta.translateY + "px)";
            }
        }
        //IE9 FF等支持getComputedStyle
        dom.mix(adapter, {
            "_default:get" :function( node, name){
                return node.style[ name ];
            },
            "_default:set" :function( node, name, value){
                node.style[ name ] = value;
            },
            "rotate:get":function( node ){
                return dom.all2deg((dom.transform(node) || {}).rotate) ;
            },
            "rotate:set":function( node, name, value){
                dom.transform(node, {
                    rotate:value
                });
            }
        },false);

        if ( DOC.defaultView && DOC.defaultView.getComputedStyle ) {
            adapter[ "_default:get" ] = function( node, name ) {
                var ret, defaultView, computedStyle;
                if ( !(defaultView = node.ownerDocument.defaultView) ) {
                    return undefined;
                }
                var underscored = name == "cssFloat" ? "float" : name.replace( /([A-Z]|^ms)/g, "-$1" ).toLowerCase();
                if ( (computedStyle = defaultView.getComputedStyle( node, null )) ) {
                    ret = computedStyle.getPropertyValue( underscored );
                    if ( ret === "" && !dom.contains( node.ownerDocument, node ) ) {
                        ret = node.style[name];//如果还没有加入DOM树，则取内联样式
                    }
                }
                return ret === "" ? "auto" : ret;
            };
        }

        //=========================　处理　width height　=========================
        var getter = dom.cssAdapter["_default:get"], RECT = "getBoundingClientRect",
        cssPair = {
            Width:['Left', 'Right'],
            Height:['Top', 'Bottom']
        }
        function getWH( node, name,extra  ) {//注意 name是首字母大写
            var none = 0, getter = dom.cssAdapter["_default:get"], which = cssPair[name];
            if(getter(node,"display") === "none" ){
                none ++;
                node.style.display = "block";
            }
            var rect = node[RECT] && node[RECT]() || node.ownerDocument.getBoxObjectFor(node),
            val = node["offset" + name] ||  rect[which[1].toLowerCase()] - rect[which[0].toLowerCase()];
            extra = extra || 0;
            which.forEach(function(direction){
                if(extra < 1)
                    val -= parseFloat(getter(node, 'padding' + direction)) || 0;
                if(extra < 2)
                    val -= parseFloat(getter(node, 'border' + direction + 'Width')) || 0;
                if(extra === 3){
                    val += parseFloat(getter(node, 'margin' + direction )) || 0;
                }
            });
            none && (node.style.display = "none");
            return val;
        }
        "width,height".replace(dom.rword,function(name){
            dom.cssAdapter[ name+":get" ] = function(node, name){
                return getWH(node, name == "width" ? "Width" : "Height") + "px";
            }
        });
        // clientWidth         = node.style.width + padding
        // https://developer.mozilla.org/en/DOM/element.clientWidth
        // offsetWidth           = node.style.width + padding + border
        // https://developer.mozilla.org/en/DOM/element.offsetWidth
        // getBoundingClientRect = node.style.width + padding + border
        // https://developer.mozilla.org/en/DOM/element.getBoundingClientRect
        //   [CSS2.1 盒子模型] http://www.w3.org/TR/CSS2/box.html
        //       B-------border----------+ -> border
        //       |                       |
        //       |  P----padding----+    | -> padding
        //       |  |               |    |
        //       |  |  C-content-+  |    | -> content
        //       |  |  |         |  |    |
        //       |  |  |         |  |    |
        //       |  |  +---------+  |    |
        //       |  |               |    |
        //       |  +---------------+    |
        //       |                       |
        //       +-----------------------+
        //       B = event.offsetX/Y in WebKit
        //           event.layerX/Y  in Gecko
        //       P = event.offsetX/Y in IE6 ~ IE8
        //       C = event.offsetX/Y in Opera
        "Height,Width".replace(dom.rword, function(  name ) {
            dom.fn[ name.toLowerCase() ] = function(size) {
                var target = this[0];
                if ( !target ) {
                    return size == null ? null : this;
                }
                if ( dom.type(target, "Window")) {//取得浏览器工作区的大小
                    var doc = target.document, prop = doc.documentElement[ "client" + name ], body = doc.body;
                    return doc.compatMode === "CSS1Compat" && prop || body && body[ "client" + name ] || prop;
                } else if ( target.nodeType === 9 ) {//取得页面的大小（包括不可见部分）
                    return Math.max(
                        target.documentElement["client" + name],
                        target.body["scroll" + name], target.documentElement["scroll" + name],
                        target.body["offset" + name], target.documentElement["offset" + name]
                        );
                } else if ( size === void 0 ) {
                    return getWH(target,name, 0) 
                } else {
                    return dom.css(this,name.toLowerCase(),size);
                }
            };
            dom.fn[ "inner" + name ] = function() {
                var node = this[0];
                return node && node.style ? getWH(node,name, 1) : null;
            };
            // outerHeight and outerWidth
            dom.fn[ "outer" + name ] = function( margin ) {
                var node = this[0], extra = margin === "margin" ? 3 : 2;
                return node && node.style ?  getWH(node,name, extra) : null;
            };
        });
        
        //=========================　处理　left top　=========================
        "Left,Top".replace(dom.rword, function(name){
            adapter[ name.toLowerCase() +":get"] =  function(node){
                var val = getter(node, name.toLowerCase()), offset;
                // 1. 当没有设置 style.left 时，getComputedStyle 在不同浏览器下，返回值不同
                //    比如：firefox 返回 0, webkit/ie 返回 auto
                // 2. style.left 设置为百分比时，返回值为百分比
                // 对于第一种情况，如果是 relative 元素，值为 0. 如果是 absolute 元素，值为 offsetLeft - marginLeft
                // 对于第二种情况，大部分类库都未做处理，属于“明之而不 fix”的保留 bug
                if(val === "auto"){
                    val = 0;
                    if(/absolute|fixed/.test(getter(node,"position"))){
                        offset = node["offset"+name ];
                        // old-ie 下，elem.offsetLeft 包含 offsetParent 的 border 宽度，需要减掉
                        if (node.uniqueID && DOC.documentMode < 9 ||global.opera) {
                            // 类似 offset ie 下的边框处理
                            // 如果 offsetParent 为 html ，需要减去默认 2 px == documentElement.clientTop
                            // 否则减去 borderTop 其实也是 clientTop
                            // http://msdn.microsoft.com/en-us/library/aa752288%28v=vs.85%29.aspx
                            // ie<9 注意有时候 elem.offsetParent 为 null ...
                            // 比如 DOM.append(DOM.create("<div class='position:absolute'></div>"),document.body)
                            offset -= node.offsetParent && node.offsetParent['client' + name] || 0;
                        
                        }
                        val = offset - (parseInt(getter(node, 'margin' + name),10) || 0) +"px";
                    }
                }
                return val
            };
        });
    
        //=========================　处理　user-select　=========================
        //https://developer.mozilla.org/en/CSS/-moz-user-select
        //http://www.w3.org/TR/2000/WD-css3-userint-20000216#user-select
        //具体支持情况可见下面网址
        //http://help.dottoro.com/lcrlukea.php
        adapter[ "userSelect:set" ] = function( node, name, value ) {
            name = dom.cssName(name);
            if(typeof name === "string"){
                return node.style[name] = value
            }
            var allow = /none/.test(value||"all");
            node.unselectable  = allow ? "" : "on";
            node.onselectstart = allow ? "" : function(){
                return false;
            };
        };
      
        //=======================================================
        //获取body的offset
        function getBodyOffsetNoMargin(){
            var el = DOC.body, ret = parseFloat(dom.css(el,"margin-top"))!== el.offsetTop;
            function getBodyOffsetNoMargin(){
                return ret;//一次之后的执行结果
            }
            return ret;//第一次执行结果
        }
       
        dom.fn.offset = function(){//取得第一个元素位于页面的坐标
            var node = this[0], owner = node && node.ownerDocument, pos = {
                left:0,
                top:0
            };
            if ( !node || !owner ) {
                return pos;
            }
            if(node.tagName === "BODY"){
                pos.top = node.offsetTop;
                pos.left = body.offsetLeft;
                //http://hkom.blog1.fc2.com/?mode=m&no=750 body的偏移量是不包含margin的
                if(getBodyOffsetNoMargin()){
                    pos.top  += parseFloat( getter(node, "marginTop") ) || 0;
                    pos.left += parseFloat( getter(node, "marginLeft")) || 0;
                }
                return pos;
            }else if (dom.html[RECT]) { //如果支持getBoundingClientRect
                //我们可以通过getBoundingClientRect来获得元素相对于client的rect.
                //http://msdn.microsoft.com/en-us/library/ms536433.aspx
                var box = node[RECT](),win = getWindow(owner),
                root = owner.documentElement,body = owner.body,
                clientTop = root.clientTop || body.clientTop || 0,
                clientLeft = root.clientLeft || body.clientLeft || 0,
                scrollTop  = win.pageYOffset || dom.support.boxModel && root.scrollTop  || body.scrollTop,
                scrollLeft = win.pageXOffset || dom.support.boxModel && root.scrollLeft || body.scrollLeft;
                // 加上document的scroll的部分尺寸到left,top中。
                // IE一些版本中会自动为HTML元素加上2px的border，我们需要去掉它
                // http://msdn.microsoft.com/en-us/library/ms533564(VS.85).aspx
                pos.top  = box.top  + scrollTop  - clientTop,
                pos.left = box.left + scrollLeft - clientLeft;
            }
            return pos;
        }

    
        var rroot = /^(?:body|html)$/i;
        dom.implement({
            position: function() {
                var ret =  this.offset(), node = this[0];
                if ( node && node.nodeType ===1 ) {
                    var offsetParent = this.offsetParent(),
                    parentOffset = rroot.test(offsetParent[0].nodeName) ? {
                        top:0,
                        left:0
                    } : offsetParent.offset();
                    ret.top  -= parseFloat( getter(node, "marginTop") ) || 0;
                    ret.left -= parseFloat( getter(node, "marginLeft") ) || 0;
                    parentOffset.top  += parseFloat( getter(offsetParent[0], "borderTopWidth") ) || 0;
                    parentOffset.left += parseFloat( getter(offsetParent[0], "borderLeftWidth") ) || 0;
                    ret.top  -= parentOffset.top;
                    ret.left -= parentOffset.left
                }
                return ret;
            },
            offsetParent: function() {
                return this.map(function() {
                    var offsetParent = this.offsetParent || DOC.body;
                    while ( offsetParent && (!rroot.test(offsetParent.nodeName) && getter(offsetParent, "position") === "static") ) {
                        offsetParent = offsetParent.offsetParent;
                    }
                    return offsetParent;
                });
            }
        });

        "Left,Top".replace(dom.rword,function(  name ) {
            var method = "scroll" + name;
            dom.fn[ method ] = function( val ) {
                var node, win, i = name == "Top";
                if ( val === void 0 ) {
                    node = this[ 0 ];
                    if ( !node ) {
                        return null;
                    }
                    win = getWindow( node );
                    // Return the scroll offset
                    return win ? ("pageXOffset" in win) ? win[ i ? "pageYOffset" : "pageXOffset" ] :
                    dom.support.boxModel && win.document.documentElement[ method ] ||
                    win.document.body[ method ] :
                    node[ method ];
                }
                // Set the scroll offset
                return this.each(function() {
                    win = getWindow( this );
                    if ( win ) {
                        win.scrollTo(
                            !i ? val : dom( win ).scrollLeft(),
                            i ? val : dom( win ).scrollTop()
                            );
                    } else {
                        this[ method ] = val;
                    }
                });
            };
        });
        function getWindow( node ) {
            return dom.type(node,"Window") ?   node : node.nodeType === 9 ? node.defaultView || node.parentWindow : false;
        } ;
  

        dom.implement({
            css : function(name, value){
                return dom.css(this, name, value);
            },
            rotate : function(value){
                return  dom.css(this, "rotate", value) ;
            }
        });

    });
    
    dom.define("attr","support,node", function(support){
        // dom.log("已加载attr模块")
        var global = this, DOC = global.document, rclass = /(^|\s)(\S+)(?=\s(?:\S+\s)*\2(?:\s|$))/g,rreturn = /\r/g,
        rfocusable = /^(?:button|input|object|select|textarea)$/i,
        rclickable = /^a(?:rea)?$/i,
        rspaces = /\s+/,
        valOne = {
            "SELECT":"select",
            "OPTION":"option",
            "BUTTON":"button"
        },
        getValType = function(node){
            return "form" in node && (valOne[node.tagName] || node.type)
        }
        dom.implement({
            /**
             *  为所有匹配的元素节点添加className，添加多个className要用空白隔开
             *  如dom("body").addClass("aaa");dom("body").addClass("aaa bbb");
             *  <a href="http://www.cnblogs.com/rubylouvre/archive/2011/01/27/1946397.html">相关链接</a>
             */
            addClass:function(value){
                if ( typeof value == "string") {
                    for ( var i = 0, el; el = this[i++]; ) {
                        if ( el.nodeType === 1 ) {
                            if ( !el.className ) {
                                el.className = value;
                            } else {
                                el.className = (el.className +" "+value).replace(rclass,"")
                            }
                        }
                    }
                }
                return this;
            },
            //如果第二个参数为true，则只判定第一个是否存在此类名，否则对所有元素进行操作；
            hasClass: function( value, every ) {
                var method = every === true ? "every" : "some"
                var rclass = new RegExp('(\\s|^)'+value+'(\\s|$)');//判定多个元素，正则比indexOf快点
                return dom.slice(this)[method](function(el){
                    return "classList" in el ? el.classList.contains(value):
                    (el.className || "").match(rclass);
                });
            },
            //如果不传入类名,则去掉所有类名,允许传入多个类名
            removeClass: function( value ) {
                if ( (value && typeof value === "string") || value === undefined ) {
                    var classNames = (value || "").split( rspaces );
                    for ( var i = 0, node; node = this[i++]; ) {
                        if ( node.nodeType === 1 && node.className ) {
                            if ( value ) {
                                var className = (" " + node.className + " ").replace(rspaces, " ");
                                for ( var c = 0, cl = classNames.length; c < cl; c++ ) {
                                    className = className.replace(" " + classNames[c] + " ", " ");
                                }
                                node.className = className.trim();
                            } else {
                                node.className = "";
                            }
                        }
                    }
                }
                return this;
            },
            //如果存在（不存在）就删除（添加）一个类。对所有匹配元素进行操作。
            toggleClass:function(value){
                var classNames = value.split(rspaces ), i, className;
                var type = typeof value
                return this.each(function(el) {
                    i = 0;
                    if(el.nodeType === 1){
                        var self = dom(el);
                        if(type == "string" ){
                            while ( (className = classNames[ i++ ]) ) {
                                self[ self.hasClass( className ) ? "removeClass" : "addClass" ]( className );
                            }
                        } else if ( type === "undefined" || type === "boolean" ) {
                            if ( el.className ) {
                                self._data( "__className__", el.className );
                            }
                            el.className = el.className || value === false ? "" : self.data( "__className__") || "";
                        }
                    }
                });
            },
            //如果匹配元素存在old类名则将其改应neo类名
            replaceClass:function(old, neo){
                for ( var i = 0, node; node = this[i++]; ) {
                    if ( node.nodeType === 1 && node.className ) {
                        var arr = node.className.split(rspaces), arr2 = [];
                        for (var j = 0; j<arr.length; j++) {
                            arr2.push(arr[j] != old ? arr[j] : neo);
                        }
                        node.className = arr2.join(" ");
                    }
                }
                return this;
            },
            val : function( value ) {
                var  node = this[0], adapter = dom.valAdapter, fn =  dom.valAdapter["option:get"];
                if ( !arguments.length ) {//读操作
                    if ( node && node.nodeType == 1 ) {
                        //处理select-multiple, select-one,option,button
                        var ret =  (adapter[ getValType(node)+":get" ] || dom.propAdapter[ "@xml:get" ])(node, "value" ,fn);
                        return  typeof ret === "string" ? ret.replace(rreturn, "") : ret == null ? "" : ret;
                    }
                    return undefined;
                }
                //强制将null/undefined转换为"", number变为字符串
                if(Array.isArray(value)){
                    value = value.map(function (value) {
                        return value == null ? "" : value + "";
                    });
                }else if(isFinite(value)){
                    value += "";
                }else{
                    value = value || "";//强制转换为数组
                }
                return this.each(function(node) {//写操作
                    if ( node.nodeType == 1 ) {
                        (adapter[ getValType(node)+":set" ] || dom.propAdapter[ "@xml:set" ])(node,"value",value , fn);
                    }
                });
            },
            removeAttr: function( name ) {
                name = dom.attrMap[ name ] || name;
                var isBool = boolOne[name];
                return this.each(function(node) {
                    if(node.nodeType === 1){
                        dom["@remove_attr"]( node, name, isBool );
                    }
                });
            },
            removeProp: function( name ) {
                name = dom.propMap[ name ] || name;
                return this.each(function() {
                    // try/catch handles cases where IE balks (such as removing a property on window)
                    try {
                        this[ name ] = undefined;
                        delete this[ name ];
                    } catch( e ) {}
                });
            }
        });
        
        "attr,prop".replace(dom.rword,function(method){
            dom[method] = function( node, name, value ) { 
                if(node  && (dom["@dispatcher"] in node )){
                    var isElement = "setAttribute" in node;
          
                    if ( !isElement ) {
                        method = "prop"
                    }
                    var notxml = !isElement || !dom.isXML(node);
                    //对于HTML元素节点，我们需要对一些属性名进行映射
                    var orig = name.toLowerCase()
                    name = notxml && dom[boolOne[name] ? "propMap" : method+"Map"][ name ] || name;
                  
                    var adapter = dom[method+"Adapter"];
                    if ( value !== void 0 ){
                        if( method === "attr" && value === null){  //为元素节点移除特性
                            return  dom["@remove_"+method]( node, name );
                        }else { //设置HTML元素的属性或特性
                            return (notxml && adapter[name+":set"] || adapter["@"+ (notxml ? "html" : "xml")+":set"])( node, name, value, orig );
                        }
                    } //获取属性 

                    return (adapter[name+":get"] || adapter["@"+ (notxml ? "html" : "xml")+":get"])( node, name, '', orig );
                }
            };
            dom.fn[method] = function( name, value ) {
                
                return dom.access( this, name, value, dom[method], dom[method]);
            }
        });
        
        dom.extend({
            attrMap:{
                tabindex: "tabIndex"
            },

            propMap:{//属性映射
                "accept-charset": "acceptCharset",
                "char": "ch",
                charoff: "chOff",
                "class": "className",
                "for": "htmlFor",
                "http-equiv": "httpEquiv"
            },
            //内部函数，原则上拒绝用户的调用
            "@remove_attr": function( node, name, isBool ) {
                var propName;
                name = dom.attrMap[ name ] || name;
                //如果支持removeAttribute，则使用removeAttribute
                dom.attr( node, name, "" );
                node.removeAttribute( name );
                // 确保bool属性的值为bool
                if ( isBool && (propName = dom.propMap[ name ] || name) in node ) {
                    node[ propName ] = false;
                }
            },
            propAdapter:{
                "@xml:get":function(node,name){
                    return node[ name ]
                },
                "@xml:set":function(node, name, value){
                    node[ name ] = value;
                }
            },
            
            attrAdapter: {
                "@xml:get":function(node,name){
                    return  node.getAttribute( name ) || undefined ;
                },
                "@xml:set":function(node, name, value){
                    node.setAttribute( name, "" + value )
                },
                "tabIndex:get":function( node ) {
                    // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
                    var attributeNode = node.getAttributeNode( "tabIndex" );
                    return attributeNode && attributeNode.specified ?
                    parseInt( attributeNode.value, 10 )  : 
                    rfocusable.test(node.nodeName) || rclickable.test(node.nodeName) && node.href  ? 0 : undefined;
                },
                "value:get": function( node, name,_,orig ) {
                    if(node.nodeName ==="BUTTON"){
                        return attrAdapter["@html:get"](node,name);
                    }
                    return name in node ?  node.value : undefined;
                },
                "value:set": function( node, name, value ) {
                    if(node.nodeName ==="BUTTON"){
                        return attrAdapter["@html:set"](node,name, value);
                    }
                    node.value = value
                }
            },
            valAdapter:  {
                "option:get":  function( node ) {
                    var val = node.attributes.value;
                    return !val || val.specified ? node.value : node.text;
                },
                "select:get": function( node ,value, valOpt) {
                    var i, max, option,  index = node.selectedIndex,values = [], options = node.options,
                    one = node.type === "select-one";
                    // 如果什么也没选中
                    if ( index < 0 ) {
                        return null;
                    }
                    i = one ? index : 0;
                    max = one ? index + 1 : options.length;
                    for ( ; i < max; i++ ) {
                        option = options[ i ];
                        //过滤所有disabled的option元素或其父亲是disabled的optgroup元素的孩子
                        if ( option.selected && (support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null) &&
                            (!option.parentNode.disabled || !dom.type( option.parentNode, "OPTGROUP" )) ) {
                            value = valOpt( option );
                            if ( one ) {
                                return value;
                            }
                            //收集所有selected值组成数组返回
                            values.push( value );
                        }
                    }
                    // Fixes Bug #2551 -- select.val() broken in IE after form.reset()
                    if ( one && !values.length && options.length ) {
                        return  valOpt(  options[ index ] );
                    }
                    return values;
                },
                "select:set": function( node, name, values, fn ) {
                    dom.slice(node.options).forEach(function(el){
                        el.selected = !!~values.indexOf( fn(el) );
                    });
                    if ( !values.length ) {
                        node.selectedIndex = -1;
                    }
                }
            }
        });
        var attrAdapter = dom.attrAdapter,propAdapter = dom.propAdapter, valAdapter = dom.valAdapter;//attr方法只能获得两种值 string undefined
        "get,set".replace(dom.rword,function(method){
            attrAdapter["@html:"+method] = attrAdapter["@xml:"+method];
            propAdapter["@html:"+method] = propAdapter["@xml:"+method];
            propAdapter["tabIndex:"+method] = attrAdapter["tabIndex:"+method];
        });
               
        //========================propAdapter 的相关修正==========================
        var propMap = dom.propMap;
        var prop = "accessKey,allowTransparency,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan,contentEditable,"+
        "dateTime,defaultChecked,defaultSelected,defaultValue,frameBorder,isMap,longDesc,maxLength,marginWidth,marginHeight,"+
        "noHref,noResize,noShade,readOnly,rowSpan,tabIndex,useMap,vSpace,valueType,vAlign";
        prop.replace(dom.rword, function(name){
            propMap[name.toLowerCase()] = name;
        });

        if(!DOC.createElement("form").enctype){//如果不支持enctype， 我们需要用encoding来映射
            propMap.enctype = "encoding";
        }
        propAdapter["tabIndex:get"] = attrAdapter["tabIndex:get"]
        //safari IE9 IE8 我们必须访问上一级元素时,才能获取这个值
        if ( !support.attrSelected ) {
            dom.propAdapter[ "selected:get" ] = function( node ) {
                var parent = node
                for(;!parent.add; parent.selectedIndex, parent = parent.parentNode){};
                return node.selected;
            }
        }    
        
        //========================attrAdapter 的相关修正==========================
        var bools = dom["@bools"]
        var boolOne = dom.oneObject( support.attrProp ? bools.toLowerCase() : bools );
        bools.replace(dom.rword,function(method) {
            //bool属性在attr方法中只会返回与属性同名的值或undefined
            attrAdapter[method+":get"] = function(node, name){
                var attrNode, property =  node[ name ];
                return property === true || typeof property !== "boolean" && ( attrNode = node.getAttributeNode(name) ) && attrNode.nodeValue !== false ?
                name.toLowerCase() :
                undefined;
            }
            attrAdapter[method+":set"] = function(node, name, value){
                if ( value === false ) {//value只有等于false才移除此属性，其他一切值都当作赋为true
                    dom["@remove_attr"]( node, name, true );
                } else {
                    if ( name in node ) {
                        node[ name ] = true;
                    }
                    node.setAttribute( name, name.toLowerCase() );
                }
                return name;
            }
        });
        if ( !support.attrHref ) {
            //IE的getAttribute支持第二个参数，可以为 0,1,2,4
            //0 是默认；1 区分属性的大小写；2取出源代码中的原字符串值(注，IE67对动态创建的节点没效)。
            //IE 在取 href 的时候默认拿出来的是绝对路径，加参数2得到我们所需要的相对路径。
            "href,src,width,height,colSpan,rowSpan".replace(dom.rword,function(method ) {//
                attrAdapter[ method + ":get" ] =  function( node,name ) {
                    var ret = node.getAttribute( name, 2 );
                    return ret === null ? undefined : ret;
                }
            });
        }
        if ( !support.attrStyle ) {
            //IE67是没有style特性（特性的值的类型为文本），只有el.style（CSSStyleDeclaration）(bug)
            attrAdapter[ "style:get" ] = function( node ) {
                return node.style.cssText.toLowerCase() || undefined ;
            }
            attrAdapter[ "style:set" ] = function( node, name, value ) {
                return (node.style.cssText = "" + value);
            }
        }
              
        if(!support.attrProp){
            //如果我们不能通过el.getAttribute("class")取得className,必须使用el.getAttribute("className")
            //又如formElement[name] 相等于formElement.elements[name]，会返回其辖下的表单元素， 这时我们就需要用到特性节点了
            dom.mix( dom.attrMap , dom.propMap);//使用更全面的映射包
            var fixSpecified = dom.oneObject("name,id")
            valAdapter['button:get'] = attrAdapter["@html:get"] =  function( node, name,_,orig ) {//用于IE6/7
                if(orig in dom.propMap){
                    return node[name];
                }
                var ret = node.getAttributeNode( name );//id与name的特性节点没有specified描述符，只能通过nodeValue判定
                return ret && (fixSpecified[ name ] ? ret.nodeValue !== "" : ret.specified) ?  ret.nodeValue : undefined;
            }
            valAdapter['button:set'] = attrAdapter["@html:set"] =  function( node, name,value,orig ) {
                if(orig in dom.propMap){
                    return (node[name] = value);
                }
                var ret = node.getAttributeNode( name );
                if ( !ret ) {
                    ret = node.ownerDocument.createAttribute( name );
                    node.setAttributeNode( ret );
                }
                ret.nodeValue = value + "";
            }  
            attrAdapter["contentEditable:set"] =  function(node, name, value) {
                if ( value === "" ) {
                    value = "false";
                }
                attrAdapter["@html:set"]( node, name, value );
            };
            "width,height".replace(dom.rword,function(attr){
                attrAdapter[attr+":set"] = function(node, name, value){
                    node.setAttribute( attr, value === "" ? "auto" : value+"");
                }
            });
        }
        
        //=========================valAdapter 的相关修正==========================
        //checkbox的value默认为on，唯有Chrome 返回空字符串
        if ( !support.checkOn ) {
            "radio,checkbox".replace(dom.rword,function(name) {
                dom.valAdapter[ name + ":get" ] = function( node ) {
                    return node.getAttribute("value") === null ? "on" : node.value;
                }
            });
        }
        //处理单选框，复选框在设值后checked的值
        "radio,checkbox".replace(dom.rword,function(name) {
            dom.valAdapter[ name + ":set" ] = function( node, name, value) {
                if ( Array.isArray( value ) ) {
                    return node.checked = !!~value.indexOf(node.value ) ;
                }
            }
        });
        
    });
    
    dom.define("dispatcher","data", function(){
        // dom.log("已加载dispatcher模块")
        var global = this, DOC = global.document, fireType = "", blank = "", rhoverHack =  /\bhover(\.\S+)?/,
        rtypenamespace = /^([^\.]*)?(?:\.(.+))?$/, revent = /(^|_|:)([a-z])/g;
        function addHandler(handlers, obj){
            var check = true, fn = obj.handler;
            for(var i = 0, el;el = handlers[i++]; ){
                if(el.handler === fn){
                    check = false;
                    break;
                }
            }
            if(check){
                handlers.push(obj);
            }
        }
        function quickIs( elem, m ) {
            var attrs = elem.attributes || {};
            return (
                (!m[1] || elem.nodeName.toLowerCase() === m[1]) &&
                (!m[2] || (attrs.id || {}).value === m[2]) &&
                (!m[3] || m[3].test( (attrs[ "class" ] || {}).value ))
                );
        };
        var system = dom.event = {
            special:{},//用于处理个别的DOM事件
            bind : function( types, handler, selector, times){
                //它将在原生事件派发器或任何能成为事件派发器的普通JS对象添加一个名叫uniqueNumber的属性,用于关联一个缓存体,
                //把需要的数据储存到里面,而现在我们就把一个叫@events的对象储放都它里面,
                //而这个@event的表将用来放置各种事件类型与对应的回调函数
                var target = this, events = dom._data( target) ,emitter =  dom["@dispatcher"] in target,
                num = times || selector, all, tns ,type, namespace, special, handlerObj, handlers, fn;
                if(target.nodeType === 3 || target.nodeType === 8 || !types ||  !handler  || !events) return ;
                selector = selector && selector.length ? selector : false;
                var uuid =  handler.uuid || (handler.uuid = dom.uuid++);
                all = {
                    handler:handler,
                    uuid: uuid,
                    times:num > 0 ? num : Infinity
                } //确保UUID，bag与callback的UUID一致
                all.handler.uuid = all.uuid;
                if(emitter ){ //处理DOM事件
                    fn = events.handle ||  (events.handle = function( e ) {
                        return ((e || event).type !== fireType) ? system.handle.apply( fn.target, arguments ) :void 0;
                    });
                    fn.target = target;
                    types = types.replace( rhoverHack, "mouseover$1 mouseout$1" )
                }
                events = events.events || (events.events = {});
                //对多个事件进行绑定
                types.replace(dom.rword,function(type){
                    tns = rtypenamespace.exec( type ) || [];
                    type = tns[1];//取得事件类型
                    namespace = (tns[2] || blank).split( "." ).sort();//取得命名空间
                    //事件冒充只用于原生事件发送器
                    special = emitter && system.special[ type ] || {};
                    type = (selector? special.delegateType : special.bindType ) || type;
                    special = emitter && system.special[ type ] || {};
                    handlerObj = dom.mix({
                        type: type,
                        origType: tns[1],
                        selector: selector,
                        namespace: namespace.join(".")
                    }, all);
                    //创建事件队列
                    handlers = events[ type ] = events[ type ] ||  [];
                    //只有原生事件发送器才能进行DOM level2 多投事件绑定
                    if(emitter && !handlers.length  ){
                        if (!special.setup || special.setup( target, selector, fn ) === false ) {
                            // 为此元素这种事件类型绑定一个全局的回调，用户的回调则在此回调中执行
                            dom.bind(target,type,fn,!!selector)
                        }
                    }
                    addHandler(handlers,handlerObj);//同一事件不能绑定重复回调
                });
            },

            unbind: function( types, handler, selector ) {
                var target = this, events = dom._data( target,"events");
                if(!events) return;
                var t, tns, type, namespace, origCount,emitter =  dom["@dispatcher"] in target,
                j, special, handlers, handlerObj;
                types = emitter ? (types || blank).replace( rhoverHack, "mouseover$1 mouseout$1" ) : types;
                types = (types || blank).match(dom.rword) || [];
                for ( t = 0; t < types.length; t++ ) {
                    tns = rtypenamespace.exec( types[t] ) || [];
                    type = tns[1];
                    namespace = tns[2];
                    // 如果types只包含命名空间，则去掉所有拥有此命名空间的事件类型的回调
                    if ( !type  ) {
                        namespace = namespace? "." + namespace : "";
                        for ( j in events ) {
                            system.unbind.call( target, j + namespace, handler, selector );
                        }
                        return;
                    }
                    //如果使用事件冒充则找到其正确事件类型
                    special = system.special[ type ] || {};
                    type = (selector? special.delegateType : special.bindType ) || type;
                    handlers = events[ type ] || [];
                    origCount = handlers.length;
                    namespace = namespace ? new RegExp("(^|\\.)" + namespace.split(".").sort().join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
                    //  namespace =  namespace?  namespace.split( "." ).sort().join(".") : null;
                    //只有指定了命名空间，回调或选择器才能进入此分支
                    if ( handler || namespace || selector ) {
                        for ( j = 0; j < handlers.length; j++ ) {
                            handlerObj = handlers[ j ];
                            if ( !handler || handler.uuid === handlerObj.uuid ) {
                                // && (!event.namespace || ~obj.namespace.indexOf(event.namespace) ) ) {
                                if ( !namespace ||  namespace.test( handlerObj.namespace )  ) {
                                    if ( !selector || selector === handlerObj.selector || selector === "**" && handlerObj.selector ) {
                                        handlers.splice( j--, 1 );
                                    }
                                }
                            }
                        }
                    } else {
                        //移除此类事件的所有回调
                        handlers.length = 0;
                    }
                    if (emitter && (handlers.length === 0 && origCount !== handlers.length) ) {
                        if ( !special.teardown || special.teardown( target, selector, handler ) === false ) {
                            dom.unbind( target, type, dom._data(target,"handle") );
                        }
                        delete events[ type ];
                    }
                }
                if(dom.isEmptyObject(events)){
                    var handle = dom.removeData( target,"handle") ;
                    handle.target = null;
                    dom.removeData( target,"events") ;
                }
            },

            fire:function(event){
                var target = this, namespace = [], type = event.type || event
                if ( ~type.indexOf( "." ) ) {
                    namespace = type.split(".");
                    type = namespace.shift();
                    namespace.sort();
                }
                event = (typeof event == "object" && "namespace" in event)? type : new jEvent(type);
                event.target = target;
                event.namespace = namespace.join( "." );
                event.namespace_re = event.namespace? new RegExp("(^|\\.)" + namespace.join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
                var args = [event].concat(dom.slice(arguments,1));
                if( dom["@dispatcher"] in target){
                    var cur = target,  ontype = "on" + type;
                    do{//模拟事件冒泡与执行内联事件
                        if(dom._data(cur,"events")||{}
                            [type]){
                            system.handle.apply(cur, args);
                        }
                        if (cur[ ontype ] && cur[ ontype ].call(cur) === false) {
                            event.preventDefault();
                        }
                        cur = cur.parentNode ||
                        cur.ownerDocument ||
                        cur === target.ownerDocument && global;
                    } while (cur && !event.isPropagationStopped);
                    if (!event.isDefaultPrevented) {//模拟默认行为 click() submit() reset() focus() blur()
                        var old;//在opera 中节点与window都有document属性
                        if (ontype && target[ type ] && ((type !== "focus" && type !== "blur") || target.offsetWidth !== 0) && !target.eval) {
                            old = target[ ontype ];
                            if (old) {   // 不用再触发内联事件
                                target[ ontype ] = null;
                            }
                            fireType = type;
                            target[ type ]();
                        }
                        fireType = blank;
                        if (old) {
                            target[ ontype ] = old;
                        }
                    }

                }else{//普通对象的自定义事件
                    system.handle.apply(target, args);
                }
            },
            filter:function(cur, parent, expr){
                var matcher = typeof expr === "function"? expr : expr.input ? quickIs : dom.match
                for ( ; cur != parent; cur = cur.parentNode || parent ) {
                    if(matcher(cur, expr))
                        return true
                }
                return false;
            },
            handle: function( e ) {
                var event = system.fix( e || event ),
                handlers = dom._data(this,"events");
                if (  handlers ) {
                    handlers = handlers[event.type]||[]
                    event.currentTarget = this;
                    var src = event.target,args = [event].concat(dom.slice(arguments,1)), result;
                    //复制数组以防影响下一次的操作
                    handlers = handlers.concat();
                    //开始进行拆包操作
                    //  dom.log(event.namespace)
                    for ( var i = 0, obj; obj = handlers[i++]; ) {
                        //如果是事件代理，确保元素处于enabled状态，并且满足过滤条件
                        if ( !src.disabled && !(event.button && event.type === "click")
                            && (!obj.selector  || system.filter(src, this, obj.selector))
                            && (!event.namespace || event.namespace_re.test( obj.namespace ) ) ) {
                            //取得回调函数
                            event.type = obj.origType;
                            result = obj.handler.apply( obj.selector ? src : this, args );
                            obj.times--;
                            if(obj.times === 0){
                                system.unbind.call(this,event.type,obj.handler,obj.selector);
                            }
                            if ( result !== void 0 ) {
                                event.result = result;
                                if ( result === false ) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                }
                            }
                            if ( event.isImmediatePropagationStopped ) {
                                break;
                            }
                        }
                    }
                }

                return event.result;
            },

            fix :function(event){
                if(!("namespace" in event)){
                    var originalEvent = event
                    event = new jEvent(originalEvent);
                    for(var prop in originalEvent){
                        //去掉所有方法与常量
                        if(typeof originalEvent[prop] !== "function" && prop !== "type"){
                            if(/^[A-Z_]+$/.test(prop))
                                continue
                            event[prop] = originalEvent[prop]
                        }
                    }
                    //如果不存在target属性，为它添加一个
                    if ( !event.target ) {
                        event.target = event.srcElement || DOC;
                    }
                    //safari的事件源对象可能为文本节点，应代入其父节点
                    if ( event.target.nodeType === 3 ) {
                        event.target = event.target.parentNode;
                    }
                    // 处理鼠标事件
                    if(/^(?:mouse|contextmenu)|click/.test(event.type)){
                        //如果不存在pageX/Y则结合clientX/Y做一双出来
                        if ( event.pageX == null && event.clientX != null ) {
                            var doc = event.target.ownerDocument || DOC,
                            html = doc.documentElement, body = doc.body;
                            event.pageX = event.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html && html.clientLeft || body && body.clientLeft || 0);
                            event.pageY = event.clientY + (html && html.scrollTop  || body && body.scrollTop  || 0) - (html && html.clientTop  || body && body.clientTop  || 0);
                        }
                        //如果不存在relatedTarget属性，为它添加一个
                        if ( !event.relatedTarget && event.fromElement ) {
                            event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
                        }
                        //标准浏览判定按下鼠标哪个键，左1中2右3
                        var button = event.button
                        //IE event.button的意义
                        //0：没有键被按下 1：按下左键 2：按下右键 3：左键与右键同时被按下 4：按下中键 5：左键与中键同时被按下 6：中键与右键同时被按下 7：三个键同时被按下
                        if ( !event.which && isFinite(button) ) {
                            event.which  = [0,1,3,0,2,0,0,0][button];//0现在代表没有意义
                        }
                    }
                    if ( event.which == null ) {//处理键盘事件
                        event.which = event.charCode != null ? event.charCode : event.keyCode;
                    }
                    //处理滚轮事件
                    if ("wheelDelta" in originalEvent){
                        var delta = originalEvent.wheelDelta/120;
                        //opera 9x系列的滚动方向与IE保持一致，10后修正
                        if(global.opera && global.opera.version() < 10)
                            delta = -delta;
                        event.wheelDelta = Math.round(delta); //修正safari的浮点 bug
                    }else if("detail" in originalEvent){
                        event.wheelDelta = -event.detail/3;
                    }
                    // 处理组合键
                    if ( event.metaKey === void 0 ) {
                        event.metaKey = event.ctrlKey;
                    }
                }
                return event;
            }
        }
    
        var jEvent = dom.Event = function ( event ) {
            this.originalEvent = event.substr ? {} : event;
            this.type = event.type || event;
            this.timeStamp  = Date.now();
            this.namespace = "";//用于判定是否为伪事件对象
        };
        // http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
        jEvent.prototype = {
            constructor:jEvent,
            //http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/events.html#Conformance
            toString:function(){
                return "[object Event]"
            },
            preventDefault: function() {
                this.isDefaultPrevented = true;
                var e = this.originalEvent;
                // 如果存在preventDefault 那么就调用它
                if ( e.preventDefault ) {
                    e.preventDefault();
                }
                // 如果存在returnValue 那么就将它设为false
                e.returnValue = false;
                return this;
            },
            stopPropagation: function() {
                this.isPropagationStopped = true;
                var e = this.originalEvent;
                // 如果存在preventDefault 那么就调用它
                if ( e.stopPropagation ) {
                    e.stopPropagation();
                }
                // 如果存在returnValue 那么就将它设为true
                e.cancelBubble = true;
                return this;
            },
            stopImmediatePropagation: function() {
                this.isImmediatePropagationStopped = true;
                this.stopPropagation();
                return this;
            }
        };
        //事件派发器的接口
        //实现了这些接口的对象将具有注册事件和广播事件的功能
        dom.dispatcher = {};
        "bind,unbind,fire".replace(dom.rword,function(name){
            dom.dispatcher[name] = function(){
                system[name].apply(this, arguments);
                return this;
            }
        });
        dom.dispatcher.uniqueNumber = dom.uuid++;
        dom.dispatcher.defineEvents = function(names){
            var events = [];
            if(typeof names == "string"){
                events = names.match(dom.rword);
            }else if(dom.isArray(names)){
                events = names;
            }
            events.forEach(function(name){
                var method = 'on'+name.replace(revent,function($, $1, $2) {
                    return $2.toUpperCase();
                });
                if (!(method in this)) {
                    this[method] = function() {
                        return this.bind.apply(this, [].concat.apply([name],arguments));
                    };
                }
            },this);
        }
    
    });
    dom.define("event", "node,dispatcher",function(){
        // dom.log("加载event模块成功");
        var global = this, DOC = global.document, types = "contextmenu,click,dblclick,mouseout,mouseover,mouseenter,mouseleave,mousemove,mousedown,mouseup,mousewheel," +
        "abort,error,load,unload,resize,scroll,change,input,select,reset,submit,"+"blur,focus,focusin,focusout,"+"keypress,keydown,keyup";
        dom.eventSupport = function( eventName,el ) {
            el = el || DOC.createElement("div");
            eventName = "on" + eventName;
            var ret = eventName in el;
            if (el.setAttribute && !ret ) {
                el.setAttribute(eventName, "return;");
                ret = typeof el[eventName] === "function";
            }
            el = null;
            return ret;
        };

        var system = dom.event, specials = system.special = {
            focus: {
                delegateType: "focusin"
            },
            blur: {
                delegateType: "focusout"
            },

            beforeunload: {
                setup: function(src, selector, fn ) {
                    // We only want to do this special case on windows
                    if ( dom.type(src, "Window") ) {
                        src.onbeforeunload = fn;
                    }
                },
                teardown: function( src, selector,  fn ) {
                    if ( src.onbeforeunload === fn ) {
                        src.onbeforeunload = null;
                    }
                }
            }
        }, rword = dom.rword;
        function fixAndHandle(src, type, e){
            e = system.fix(e);
            e.type = type;
            system.handle.call(src,e);
        }
        //用于在标准浏览器下模拟mouseenter与mouseleave
        //现在除了IE系列支持mouseenter/mouseleave/focusin/focusout外
        //opera11也支持这四个事件,同时它们也成为w3c DOM3 Event的规范
        //详见http://www.filehippo.com/pl/download_opera/changelog/9476/
        //http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html
        "mouseenter_mouseover,mouseleave_mouseout".replace(/(\w+)_(\w+)/g,function(_,orig, fix){
            specials[ orig ]  = {
                setup:function(src){//使用事件冒充
                    dom._data(src, orig+"_handle",dom.bind(src, fix, function(event){
                        var parent = event.relatedTarget;
                        try {
                            while ( parent && parent !== src ) {
                                parent = parent.parentNode;
                            }
                            if ( parent !== src ) {
                                fixAndHandle(src, orig, event)
                            }
                        } catch(e) { };
                    }));
                },
                teardown :function(){
                    dom.bind(this, fix, dom._data(orig+"_handle")|| dom.noop);
                }
            };
        });
        var delegate = function(fn){
            return function(src,selector){
                if(!selector){
                    return false;
                }
                fn(src);
            }
        }
        //模拟IE678的reset,submit,change的事件代理
        var submitWhich = dom.oneObject("13,108");
        var submitInput = dom.oneObject("submit,image");
        var submitType  = dom.oneObject("text,password,textarea");
        if(!DOC.dispatchEvent){
            var changeEls = /^(?:textarea|input|select)$/i ,checkEls = /radio|checkbox/;
            var changeType = {
                "select-one":"selectedIndex",
                "select-multiple":"selectedIndex",
                "radio":"checked",
                "checkbox":"checked"
            }
            var changeNotify = function(e){
                if(e.propertyName === (changeType[this.type] || "value")){
                    var els = dom._data(this,"publisher");
                    e = system.fix(e);
                    e.type = "change";
                    for(var i in els){
                        system.handle.call(els[i], e);
                    }
                }
            }

            dom.mix(specials,{
                //reset事件的冒泡情况----FF与opera能冒泡到document,其他浏览器只能到form
                reset:{
                    setup: delegate(function(src){
                        system.bind.call( src, "click._reset keypress._reset", function( e ) {
                            if(  e.target.form && (e.which === 27  ||  e.target.type == "reset") ){
                                fixAndHandle(src, "reset", e);
                            }
                        });
                    }),
                    teardown: delegate(function(src){
                        system.unbind.call( src, "._reset" );
                    })
                },
                //submit事件的冒泡情况----IE6-9 :form ;FF: document; chrome: window;safari:window;opera:window
                submit : {
                    setup: delegate(function(src){
                        system.bind.call( src, "click._submit keypress._submit", function( e ) {
                            var el = e.target, type = el.type;
                            if( el.form &&  ( submitInput[type] || submitWhich[ e.which ] && submitType[type]) ){
                                fixAndHandle(src, "submit", e);
                            }
                        });
                    }),
                    teardown: delegate(function(src){
                        system.unbind.call( src, "._submit" );
                    })
                },
                change : {
                    setup: delegate(function(src){
                        var subscriber = dom._data(src,"subscriber",{});//用于保存订阅者的UUID
                        dom._data(src,"valuechange_setup", dom.bind( src, "beforeactivate", function( ) {
                            var target = event.srcElement;
                            //如果发现孩子是表单元素并且没有注册propertychange事件，则为其注册一个，那么它们在变化时就会发过来通知顶层元素
                            if ( changeEls.test(target.nodeName) && !subscriber[target.uniqueNumber] ) {
                                subscriber[target.uniqueNumber] = target;//表明其已注册
                                var publisher = (dom._data(target,"publisher") || dom._data(target,"publisher",{}));
                                publisher[src.uniqueNumber] = src;//此孩子可能同时要向N个上司报告变化
                                system.bind.call(target,"propertychange._change",changeNotify );
                            }
                        }));
                    }),
                    teardown:delegate(function(src){
                        dom.unbind( src, "beforeactive", dom._data(src,"valuechange_setup") || dom.noop);
                        var els = dom.removeData(src,"subscriber",true) || {};
                        for(var i in els){
                            dom.unbind(els[i],"._change");
                            var publisher = dom._data(els[i],"publisher");
                            if(publisher){
                                delete publisher[src.uniqueNumber];
                            }
                        }
                    })
                }
            })
            
        }
        //我们可以通过change的事件代理来模拟YUI的valuechange事件
        //支持情况 FF2+ chrome 1+ IE9+ safari3+ opera9+11 The built-in Android browser,Dolphin HD browser
        if(dom.eventSupport("input", DOC.createElement("input"))){
            //http://blog.danielfriesen.name/2010/02/16/html5-browser-maze-oninput-support/
            specials.change = {
                setup : delegate(function(src){
                    dom._data(src,"valuechange_setup",dom.bind( src, "input", function( e){
                        fixAndHandle(src, "change", e);
                    },true));
                    dom._data(src,"selectchange_setup",dom.bind( src, "change", function( e){
                        var type = e.target.type;
                        if(type && !submitType[type]){
                            system.handle.call(src, e);
                        }  
                    },true))
                }),
                teardown: delegate(function(src){
                    dom.unbind( src, "input", dom._data(src,"valuechange_setup") || dom.noop);
                    dom.unbind( src, "change", dom._data(src,"selectchange_setup") || dom.noop);
                })
            }
        }
       
        //在标准浏览器里面模拟focusin
        if(!dom.eventSupport("focusin")){
            "focusin_focus,focusout_blur".replace(/(\w+)_(\w+)/g,function(_,$1, $2){
                var notice = 0, focusinNotify = function (e) {
                    var src = e.target
                    do{//模拟冒泡
                        var events = dom._data( src,"events");
                        if(events && events[$1]){
                            fixAndHandle(src, $1, e);
                        }
                    } while (src = src.parentNode );
                }
                specials[ $1 ] = {
                    setup: function( ) {
                        if ( notice++ === 0 ) {
                            DOC.addEventListener( $2, focusinNotify, true );
                        }
                    },
                    teardown: function() {
                        if ( --notice === 0 ) {
                            DOC.removeEventListener( $2, focusinNotify, true );
                        }
                    }
                };
            });
        }
        try{
            //FF3使用DOMMouseScroll代替标准的mousewheel事件
            DOC.createEvent("MouseScrollEvents");
            specials.mousewheel = {
                bindType    : "DOMMouseScroll",
                delegateType: "DOMMouseScroll"
            }
            try{
                //可能末来FF会支持标准的mousewheel事件，则需要删除此分支
                DOC.createEvent("WheelEvent");
                delete specials.mousewheel;
            }catch(e){};
        }catch(e){};
        //当一个元素，或者其内部任何一个元素获得焦点的时候会触发这个事件。
        //这跟focus事件区别在于，他可以在父元素上检测子元素获取焦点的情况。
        var  rquickIs = /^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/
        function quickParse( selector ) {
            var quick = rquickIs.exec( selector );
            if ( quick ) {
                //   0  1    2   3
                // [ _, tag, id, class ]
                quick[1] = ( quick[1] || "" ).toLowerCase();
                quick[3] = quick[3] && new RegExp( "(?:^|\\s)" + quick[3] + "(?:\\s|$)" );
            }
            return quick;
        }
        dom.implement({
            toggle:function(/*fn1,fn2,fn3*/){
                var fns = [].slice.call(arguments), i = 0;
                return this.click(function(e){
                    var fn  = fns[i++] || fns[i = 0, i++];
                    fn.call(this,e);
                })
            },
            hover: function( fnIn, fnOut ) {
                return this.mouseenter( fnIn ).mouseleave( fnOut || fnIn );
            },
            on: function( types, fn, selector, times ) {
                if ( typeof types === "object" ) {
                    for (var type in types ) {
                        this.on( type,  types[ type ], selector, times );
                    }
                    return this;
                }
                if(!types || !fn){//必须指定事件类型与回调
                    return this;
                }
                return this.each( function() {//转交dispatch模块去处理
                    system.bind.call( this, types, fn, selector, times );
                });
            },
            off: function( types, fn ) {
                if ( typeof types === "object" ) {
                    for ( var type in types ) {
                        this.off( type,types[ type ], fn  );
                    }
                    return this;
                }
                var args = arguments
                return this.each(function() {
                    system.unbind.apply( this, args );
                });
            },
            one: function( types, fn ) {
                return this.on(  types, fn, null, 1 );
            },
            bind: function( types, fn, times ) {
                return this.on( types, fn, times );
            },
            unbind: function( types, fn ) {
                return this.off( types, fn );
            },

            live: function( types,  fn, times ) {
                dom( this.ownerDocument ).on( types, fn, this.selector,times );
                return this;
            },
            die: function( types, fn ) {
                dom( this.ownerDocument ).off( types, fn, this.selector || "**" );
                return this;
            },
            undelegate: function( selector, types, fn ) {
                return arguments.length == 1? this.off( selector, "**" ) : this.off( types, fn, selector );
            },

            delegate: function( selector, types, fn, times ) {
                if(typeof selector === "string"){
                    selector = quickParse( selector ) || selector;
                }
                return this.on( types, fn, selector, times );
            },
            fire: function( ) {
                var args = arguments;
                return this.each(function() {
                    dom.event.fire.apply(this, args );
                });
            }
        })

        types.replace(rword,function(type){
            dom.fn[type] = function(callback){
                return callback?  this.bind(type, callback) : this.fire(type);
            }
        });
    });
    dom.define("fx", "css",function(){
        //  dom.log("已加载fx模块");
        var global = this, DOC = global.document, types = {
            color:/color/i,
            transform:/rotate|scaleX|scaleY|translateX|translateY/i,
            scroll:/scroll/i,
            _default:/fontSize|fontWeight|opacity|width|height|top$|bottom$|left$|right$/i
        },
        rfxnum = /^([+\-/\*]=)?([\d+.\-]+)([a-z%]*)$/i;
        var adapter = dom.fxAdapter = {
            _default:{
                get:function(el, prop) {
                    return dom.css(el,prop);
                },
                tween :function(form,change,name,per) {
                    var a = (form + change * dom.easing[name](per)).toFixed(3);
                    return isNaN(a) ? 0 : a;
                }
            },
            type:function (attr){
                for(var i in types){
                    if(types[i].test(attr)){
                        return i;
                    }
                }
                return "_default";
            }
        }

        var tween = adapter._default.tween;
        dom.mix(adapter,{
            scroll : {
                get: function(el, prop){
                    return el[prop];
                },
                tween: tween
            },
            transform:{
                get: function(el, prop){
                    return dom.transform(el)[prop]
                },
                set:function(el,t2d,isEnd,per){
                    var obj = {}
   
                    for(var name in t2d){
                        obj[name] = isEnd ? t2d[name][1] : tween(t2d[name][0],t2d[name][2],t2d[name][3],per); 
                    }
                    dom.transform(el,obj);
                }
            },
            color : {
                get:function(el,prop){
                    return  dom.css(el,prop);
                },
                tween:function(f0,f1,f2,c0,c1,c2,name,per,i){
                    var delta = dom.easing[name](per), ret = [];
                    for(i = 0;i < 3;i++){
                        ret[i] = Math.max(Math.min((arguments[i] +arguments[i+3] * delta)|0, 255), 0);
                    }
                    return "rgb("+ret+")";
                }
            }
        } );
        //中央定时器，可以添加新节点到中央列队，然后通过setInterval方法不断调用nextTick处理所有节点的动画
        function heartbeat( node) {
            heartbeat.nodes.push( node);
            if (heartbeat.id === null) {//如果浏览器支持JIT，那么把间隔设小点，让动画更加流畅
                heartbeat.id = setInterval(nextTick, 16);//开始心跳
            }
            return true;
        }
        heartbeat.nodes = []; //中央列队
        heartbeat.id = null;  //原始的setInterval id
        //驱动中央列队的元素节点执行它们的动画，如果执行完毕就把它们从列队中剔除，如果列队为空则中止心跳
        function nextTick() {
            var nodes = heartbeat.nodes, i = 0, n = nodes.length;
            for (; i < n; i++) {
                if (animate(nodes[i]) === false) {//在这里操作元素的样式或属性进行渐变
                    nodes.splice(i, 1);
                    i -= 1;
                    n -= 1;
                }
            }
            nodes.length || (clearInterval(heartbeat.id), heartbeat.id = null);
        }
        
        var shortcuts = {
            c:          "color",
            h:          "height",
            o:          "opacity",
            r:          "rotate",
            w:          "width",
            x:          "left",
            y:          "top",
            fs:         "fontSize",
            st:       "scrollTop",
            sl:       "scrollLeft",
            sx:         "scaleX",      
            sy:         "scaleY",     
            tx:         "translateX",  
            ty:         "translateY",   
            bgc:        "backgroundColor"
        }
        var callbacks = dom.oneObject("before,after");
        var keyworks  = dom.oneObject("easing,reverse,chain,back");
        //处理特效的入口函数,用于将第二个参数，拆分为两个对象props与config，然后再为每个匹配的元素指定一个双向列队对象fxs
        //fxs对象包含两个列队，每个列队装载着不同的特效对象
        dom.fn.fx = function(duration, hash){
            var props = hash ||{}, config = {};
            if(typeof duration === "funciton"){
                props.after = duration
                duration = null;
            }
            for(var name in props){
                if(name in callbacks){
                    config[name] = [].concat(props[name]);
                    delete props[name]
                }else if(name in keyworks){
                    config[name] = props[name];
                    delete props[name];
                }else if(name in shortcuts){
                    props[shortcuts[name]] = props[name];
                    delete props[name];
                }
            }

            var easing = (config.easing || "swing").toLowerCase() ;
            config.easing = dom.easing[easing] ? easing : "swing";
            config.duration = duration || 500;
            config.type = "noop";
           
            return this.each(function(node){
                var fxs = dom._data(node,"fx") || dom._data( node,"fx",{
                    artery:[], //正向列队
                    vein:  [], //负向列队
                    run: false 
                });
                fxs.artery.push({//fx对象
                    startTime:  0,//timestamp
                    isEnd:     false,
                    config:   dom.mix({}, config),//各种配置
                    props:    dom.mix({}, props)//用于渐变的属性
                });
                if(!fxs.run){
                    fxs.run = heartbeat( node);
                }
            });
        }
        function eventInterceptor(mix, node, fx, back) {
            var array = dom.isArray(mix) ? mix : [mix], i = 0, n = array.length;
            for (; i < n; ++i) {
                array[i](node, fx.props, fx, back);
            }
        }
        function animate(node) {//fxs对象类似Deferred，包含两个列队（artery与vein）
            var fxs = dom._data( node,"fx") ,interceptor = eventInterceptor, fx = fxs.artery[0],
            back, now, isEnd, mix;
            if( isFinite(fx)){ 
                setTimeout(function(){
                    fxs.artery.shift();
                    fxs.run = heartbeat( node);
                },fx)
                return (fx.run = false)
            }
            if (!fx) { //这里应该用正向列队的长度做判定
                fxs.run = false;
            } else {
                var config = fx.config;
                back = !!config.back;
                if (fx.startTime) { // 如果已设置开始时间，说明动画已开始
                    now = +new Date;
                    switch(fxs.stopCode){
                        case 0:
                            fx.render = dom.noop;//中断当前动画，继续下一个动画
                            break;
                        case 1:
                            fx.gotoEnd = true;//立即跳到最后一帧，继续下一个动画   
                            break;
                        case 2:
                            fxs.artery  = fxs.vein = [];//中断全部动画
                            break;
                        case 3:
                            for(var ii=0,_fx;_fx=fxs.artery[ii++];){
                                _fx.gotoEnd = true;//立即完成全部动画
                            }   
                            break;
                    }
                    delete fxs.stopCode;

                } else { // 初始化动画
                    mix = config.before;
                    mix && (interceptor(mix, node, fx, back), config.before = 0);
                    fx.render = fxBuilder(node, fxs, fx.props, config); // 创建渲染函数
                    dom[config.type]([node], fx.props, fx)
                    fx.startTime = now = +new Date;
                }
                isEnd = fx.gotoEnd || (now >= fx.startTime + config.duration);
                //node, 是否结束, 进度
                fx.render(node, isEnd, (now - fx.startTime)/config.duration); // 处理渐变
                if(fx.render === dom.noop) {//立即开始下一个动画
                    fxs.artery.shift();
                }
                if (isEnd) {
    
                    if(config.type == "hide"){
                        for(var i in config.orig){//还原为初始状态
                            dom.css(node,i,config.orig[i])
                        }
                    }
                    fxs.artery.shift(); // remove current queue
                    mix = config.after;
                    mix && interceptor(mix, node, fx, back);
                
                    if (!config.back && config.reverse && fxs.vein.length) {
                        fxs.artery = fxs.vein.reverse().concat(fxs.artery); // inject reverse queue
                        fxs.vein = []; // clear reverse qeueue
                    }
                    if (!fxs.artery.length) {
                        fxs.run = false;
                    }
                }
            }
            return fxs.run; // 调用 clearInterval方法，中止定时器
        }
        var rspecialVal = /show|toggle|hide/;
        function fxBuilder(node, fxs, props, config){//用于分解属性包中的样式或属性,变成可以计算的因子
            var ret = "var style = node.style,t2d = {}, adapter = dom.fxAdapter , _defaultTween = adapter._default.tween;",
            reverseConfig = dom.Object.merge.call( {},config),
            transfromChanged = 0,
            reverseProps = {};
            reverseConfig.back =  1;
            var orig = config.orig = {}
            for(var p in props){
                var name = dom.cssCache(p);//将属性名转换为驼峰风格
                var val =  props[name] = props[p];//取得结束值
                if(val == undefined){
                    continue;
                }
                var easing = config.easing;//公共缓动公式
                var type = dom.fxAdapter.type(name);
                var adapter = dom.fxAdapter[type];
                var from = adapter.get(node,name);
                if(rspecialVal.test(val) ){//如果值为show hide toggle
                    if(val == "show" || (val == "toggle" && dom._isHide(node))){
                        val = dom._data(node,"old"+name) || from;
                        config.type = "show"
                        from = 0;
                    }else {//hide
                        orig[name] =  dom._data(node,"old"+name,from);
                        config.type = "hide"
                        val = 0;
                    }
                }else if(Array.isArray(val)){
                    var arr = val;
                    val = arr[0];//取得第一个值
                    easing = arr[1] || easing;//取得第二个值或默认值
                }
                //开始分解结束值to
                if(type != "color" ){//如果不是颜色，则需判定其有没有单位以及起止值单位不一致的情况
                    var parts = rfxnum.exec( val) ,op = (parts[1]||"").charAt(0),
                    to = parseFloat( parts[2]|| 0 ),//确保to为数字
                    unit = parts[3] || (dom.cssNumber[ name ] ?  "" : "px"); 
                    from = from == "auto" ? 0 : parseFloat(from)//确保from为数字
                    if ((op == "+" || op == "-") && unit && unit !== "px" ) {
                        dom.css(node, name, (to || 1) + unit);
                        from = ((to || 1) / parseFloat(dom.css(node,name))) * from;
                        dom.css( node, name, from + unit);
                    }
                    if(op){//处理+=,-= \= *=
                        to = eval(from+op+to);
                    }
                    var change = to - from;
                }else{
                    from = color2array(from);
                    to   = color2array(val);
                    change = to.map(function(end,i){
                        return end - from[i]
                    });
                }
                if(from +"" === to +""){//不处理初止值都一样的样式与属性      
                    continue;
                }
                var hash = {
                    name:name,
                    to:to,
                    type:type,
                    from:from ,
                    change:change,
                    easing:easing,
                    unit:unit
                };
                switch(type){
                    case "_default":
                        if(name == "opacity" && !dom.support.cssOpacity){
                            ret += dom.format('dom.css(node,"opacity", (isEnd ? #{to} : _defaultTween(#{from},#{change},"#{easing}", per )));;',hash);
                        }else{
                            ret += dom.format('style.#{name} = ((isEnd ? #{to} : _defaultTween(#{from}, #{change},"#{easing}",per )))+"#{unit}";',hash);
                        }
                        break;
                    case "scroll":
                        ret += dom.format('node.#{name} = (isEnd ? #{to}: _defaultTween(#{from}, #{change},"#{easing}",per ));',hash);
                        break;
                    case "color":
                        ret += dom.format('style.#{name} = (isEnd ? "rgb(#{to})" : adapter.#{type}.tween(#{from}, #{change},"#{easing}",per));',hash);
                        break;
                    case "transform":
                        transfromChanged++
                        ret +=  dom.format('t2d.#{name} = [#{from},#{to}, #{change},"#{easing}"];',hash);
                        break
                }
                if(type == "color"){
                    from = "rgb("+from.join(",")+")"
                }
                reverseProps[name] = [from , easing];
            }
            if(transfromChanged){
                ret += 'adapter.transform.set(node,t2d,isEnd,per);'
            }
            if (config.chain || config.reverse) {
                fxs.vein.push({
                    startTime: 0,
                    isEnd: false,
                    config: reverseConfig,
                    props: reverseProps
                });
            }
            //生成渲染函数
            return new Function("node,isEnd,per",ret);
        }

        dom.easing =  {
            linear:  function(pos) {
                return pos;
            },
            swing: function(pos) {
                return (-Math.cos(pos*Math.PI)/2) + 0.5;
            }
        }

        var cacheColor = {
            "black":[0,0,0],
            "silver":[192,192,192],
            "gray":[128,128,128],
            "white":[255,255,255],
            "maroon":[128,0,0],
            "red":[255,0,0],
            "purple":[128,0,128],
            "fuchsia":[255,0,255],
            "green":[0,128,0],
            "lime":[0,255,0],
            "olive":[128,128,0],
            "yellow":[255,255,0],
            "navy":[0,0,128],
            "blue":[0,0,255],
            "teal":[0,128,128],
            "aqua":[0,255,255]
        };
        var casual,casualDoc;
        function callCasual(parent,callback){
            if ( !casual ) {
                casual = DOC.createElement( "iframe" );
                casual.frameBorder = casual.width = casual.height = 0;
            }
            parent.appendChild(casual);
            if ( !casualDoc || !casual.createElement ) {
                casualDoc = ( casual.contentWindow || casual.contentDocument ).document;
                casualDoc.write( ( DOC.compatMode === "CSS1Compat" ? "<!doctype html>" : "" ) + "<html><body>" );
                casualDoc.close();
            }
            callback(casualDoc);
            parent.removeChild(casual);
        }
        function parseColor(color) {
            var value;
            callCasual(dom.HTML,function(doc){
                var range = doc.body.createTextRange();
                doc.body.style.color = color;
                value = range.queryCommandValue("ForeColor");
            });
            return [value & 0xff, (value & 0xff00) >> 8,  (value & 0xff0000) >> 16];
        }
        function color2array(val) {//将字符串变成数组
            var color = val.toLowerCase(),ret = [];
            if (cacheColor[color]) {
                return cacheColor[color];
            }
            if (color.indexOf("rgb") == 0) {
                var match = color.match(/(\d+%?)/g),
                factor = match[0].indexOf("%") !== -1 ? 2.55 : 1
                return (cacheColor[color] = [ parseInt(match[0]) * factor , parseInt(match[1]) * factor, parseInt(match[2]) * factor ]);
            } else if (color.charAt(0) == '#') {
                if (color.length == 4)
                    color = color.replace(/([^#])/g, '$1$1');
                color.replace(/\w{2}/g,function(a){
                    ret.push( parseInt(a, 16))
                });
                return (cacheColor[color] = ret);
            }
            if(cacheColor.VBArray){
                return (cacheColor[color] = parseColor(color));
            }
            return cacheColor.white;
        }

        var cacheDisplay = dom.oneObject("a,abbr,b,span,strong,em,font,i,img,kbd","inline");
        var blocks = dom.oneObject("div,h1,h2,h3,h4,h5,h6,section,p","block");
        dom.mix(cacheDisplay ,blocks);
        function parseDisplay( nodeName ) {
            if ( !cacheDisplay[ nodeName ] ) {
                var body = DOC.body, elem = DOC.createElement(nodeName);
                body.appendChild(elem)
                var display = dom.css(elem, "display" );
                body.removeChild(elem);
                // 先尝试连结到当前DOM树去取，但如果此元素的默认样式被污染了，就使用iframe去取
                if ( display === "none" || display === "" ) {
                    callCasual(body,function(doc){
                        elem = doc.createElement( nodeName );
                        doc.body.appendChild( elem );
                        display = dom.css( elem, "display" );
                    });
                }
                cacheDisplay[ nodeName ] = display;
            }
            return cacheDisplay[ nodeName ];
        }
        //show 开始时计算其width1 height1 保存原来的width height display改为inline-block或block overflow处理 赋值（width1，height1）
        //hide 保存原来的width height 赋值为(0,0) overflow处理 结束时display改为none;
        //toggle 开始时判定其是否隐藏，使用再决定使用何种策略
        dom.mix(dom, {
            _isHide : function(node) {
                var width = node.offsetWidth,
                height = node.offsetHeight;
                return (width === 0 && height === 0) ||  dom.css( node, "display" ) === "none" ;
            },
            show:function(nodes,props){//放大
                nodes = nodes.nodeType == 1 && [nodes] || nodes
                for ( var i = 0, node;node = nodes[i++];) {
                    if(node.nodeType == 1 && dom._isHide(node)){
                        var old =  dom._data(node, "olddisplay"),
                        _default = parseDisplay(node.nodeName),
                        display = node.style.display = (old || _default);
                        dom._data(node, "olddisplay", display);
                        node.style.visibility = "visible";
                        if(props && ("width" in props || "height" in props)){//如果是缩放操作
                            //修正内联元素的display为inline-block，以让其可以进行width/height的动画渐变
                            if ( display === "inline" && dom.css( node, "float" ) === "none" ) {
                                if ( !dom.support.inlineBlockNeedsLayout ) {//w3c
                                    node.style.display = "inline-block";
                                } else {//IE
                                    if ( _default === "inline" ) {
                                        node.style.display = "inline-block";
                                    }else {
                                        node.style.display = "inline";
                                        node.style.zoom = 1;
                                    }
                                }
                            }
                        }
                    }
                }
                return nodes;
            },
            hide:function(nodes,props, fx){//缩小
                nodes = nodes.nodeType == 1 && [nodes] || nodes
                var config = fx && fx.config;
                for ( var i = 0, node;node = nodes[i++];) {
                    if(node.nodeType == 1 && !dom._isHide(node)){
                        var display = dom.css( node, "display" );
                        if ( display !== "none" && !dom._data( node, "olddisplay" ) ) {
                            dom._data( node, "olddisplay", display );
                        }
                        if(config){
                            if("width" in props || "height" in props){//如果是缩放操作
                                //确保内容不会溢出,记录原来的overflow属性，因为IE在改变overflowX与overflowY时，overflow不会发生改变
                                config.overflow = [ node.style.overflow, node.style.overflowX, node.style.overflowY ];
                                node.style.overflow = "hidden";
                            }
                            var after = config.after = (config.after || []);
                            after.unshift(function(node,props,config){
                                node.style.display = "none";
                                node.style.visibility = "hidden";
                                if ( config.overflow != null && !dom.support.shrinkWrapBlocks ) {
                                    [ "", "X", "Y" ].forEach(function (postfix,index) {
                                        node.style[ "overflow" + postfix ] = config.overflow[index]
                                    });
                                }
                            });
                        }else{
                            node.style.display = "none";
                        }
                    }
                }
                return nodes
            }
        });
        //如果clearQueue为true，是否清空列队
        //如果jumpToEnd为true，是否跳到此动画最后一帧
        dom.fn.stop =function(clearQueue,jumpToEnd){
            clearQueue = clearQueue ? "1" : ""
            jumpToEnd =  jumpToEnd ? "1" : "0"
            var stopCode = parseInt(clearQueue+jumpToEnd,2);//返回0 1 2 3
            return this.each(function(node){
                var fxs = dom._data( node,"fx");
                if(fxs && fxs.run){
                    fxs.stopCode = stopCode;
                }
            });
        }
        
        // 0 1 
        dom.fn.delay = function(ms){
            return this.each(function(node){
                var fxs = dom._data(node,"fx") || dom._data( node,"fx",{
                    artery:[], //正向列队
                    vein:  [], //负向列队
                    run: false //
                });
                fxs.artery.push(ms);
            });
        }

        var fxAttrs = [
        [ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
        [ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ],
        ["opacity"]
        ]
        function genFx( type, num ) {//生成属性包
            var obj = {};
            fxAttrs.concat.apply([], fxAttrs.slice(0,num)).forEach(function(name) {
                obj[ name ] = type;
            });
            return obj;
        }
        
        var effects = {
            slideDown: genFx("show", 1),
            slideUp: genFx("hide", 1),
            slideToggle: genFx("toggle", 1),
            fadeIn: {
                opacity: "show"
            },
            fadeOut: {
                opacity: "hide"
            },
            fadeToggle: {
                opacity: "toggle"
            }
        }
        Object.keys(effects).forEach(function(key){
            dom.fn[key] = function(duration,hash){
               
                return normalizer(this, duration, hash, effects[key]);
            }
        });
        function normalizer(Instance, duration, hash, effects, before){
            if(typeof duration === "function"){
                hash = duration;
                duration = 500;
            }
            if(typeof hash === "function"){
                var after = hash;
                hash = {};
                hash.after = after;
            }
            if(before){
                var arr = hash.before =  hash.before || [];
                arr.unshift(before)
            }
            return Instance.fx(duration, dom.mix(hash,effects));
        }

        "show,hide".replace(dom.rword,function(name){
            dom.fn[name] = function(duration,hash){
                if(!arguments.length){
                    return dom[name](this);
                }else{
                    return normalizer(this, duration, hash, genFx(name, 3));
                }
            }
        })
        var _toggle = dom.fn.toggle;
        dom.fn.toggle = function(duration,hash){
            if(!arguments.length){
                return this.each(function(node) {
                    if(node.nodeType == 1){
                        dom[ dom._isHide(node) ? "show" : "hide" ](node);
                    }
                });
            }else if(typeof duration === "function" && typeof duration === "function" ){
                _toggle.apply(this,arguments)
            }else{
                return normalizer(this, duration, hash, genFx("toggle", 3));
            }
        }
        function beforePuff(node, props, fx) {
            var position = dom.css(node,"position"),
            width = dom.css(node,"width"),
            height = dom.css(node,"height"),
            left = dom.css(node,"left"),
            top = dom.css(node,"top");
            node.style.position = "relative";
            dom.mix(props, {
                width: "*=1.5",
                height: "*=1.5",
                opacity: "hide",
                left: "-=" + parseInt(width)  * 0.25,
                top: "-=" + parseInt(height) * 0.25
            });
            var arr = fx.config.after =  fx.config.after || [];
            arr.unshift(function(node){
                node.style.position = position;
                node.style.width = width;
                node.style.height = height;
                node.style.left = left;
                node.style.top = top;
            });
        }
        //扩大1.5倍并淡去
        dom.fn.puff = function(duration, hash) {
            return normalizer(this, duration, hash, {}, beforePuff);
        }
    });
    dom.define("ajax","node,dispatcher", function(){
        //dom.log("已加载ajax模块");
        var global = this, DOC = global.document, r20 = /%20/g,
        rCRLF = /\r?\n/g,
        encode = global.encodeURIComponent,
        rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL
        rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,
        rnoContent = /^(?:GET|HEAD)$/,
        rquery = /\?/,
        rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,
        // Document location
        ajaxLocation
        // #8138, IE may throw an exception when accessing
        // a field from window.location if document.domain has been set
        try {
            ajaxLocation = global.location.href;
        } catch( e ) {
            // Use the href attribute of an A element
            // since IE will modify it given document.location
            ajaxLocation = DOC.createElement( "a" );
            ajaxLocation.href = "";
            ajaxLocation = ajaxLocation.href;
        }
 
        // Segment location into parts
        var ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [],
        transports = { },//传送器
        converters ={//转换器
            text: function(dummyXHR,text,xml){
                return text != undefined ? text : ("xml" in xml ?  xml.xml: new XMLSerializer().serializeToString(xml));
            },
            xml : function(dummyXHR,text,xml){
                return xml != undefined ? xml : dom.parseXML(text);
            },
            html : function(dummyXHR,text,xml){
                return  dom.parseHTML(text);
            },
            json : function(dummyXHR,text,xml){
                return  dom.parseJSON(text);
            },
            script: function(dummyXHR,text,xml){
                dom.parseJS(text);
            }
        },
        accepts  = {
            xml: "application/xml, text/xml",
            html: "text/html",
            text: "text/plain",
            json: "application/json, text/javascript",
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript",
            "*": "*/*"
        },
        defaultOptions = {
            type:"GET",
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            async:true,
            dataType:"text",
            jsonp: "callback"
        };
 
        function normalizeOptions(o) {
            // deep mix
            o = dom.Object.merge.call( {},defaultOptions, o);
            //判定是否跨域
            if (o.crossDomain == null) {
                var parts = rurl.exec(o.url.toLowerCase());
                o.crossDomain = !!( parts &&
                    ( parts[ 1 ] != ajaxLocParts[ 1 ] || parts[ 2 ] != ajaxLocParts[ 2 ] ||
                        ( parts[ 3 ] || ( parts[ 1 ] === "http:" ?  80 : 443 ) )
                        !=
                        ( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ?  80 : 443 ) ) )
                    );
            }
            //转换data为一个字符串
            if ( o.data && o.data !== "string") {
                o.data = dom.param( o.data );
            }
            //type必须为大写
            o.type = o.type.toUpperCase();
            o.hasContent = !rnoContent.test(o.type);
 
            if (!o.hasContent) {//如果为GET请求,则参数依附于url上
                if (o.data) {
                    o.url += (rquery.test(o.url) ? "&" : "?" ) + o.data;
                }
                if (o.cache === false) {
                    o.url += (rquery.test(o.url) ? "&" : "?" ) + "_time=" + Date.now();
                }
            }
            return o;
        }
 
        "get post".replace(dom.rword,function(method){
            dom[ method ] = function( url, data, callback, type ) {
                // shift arguments if data argument was omitted
                if ( dom.isFunction( data ) ) {
                    type = type || callback;
                    callback = data;
                    data = undefined;
                }
                return dom.ajax({
                    type: method,
                    url: url,
                    data: data,
                    success: callback,
                    dataType: type
                });
            };
 
        });
 
        dom.mix(dom,{
            getScript: function( url, callback ) {
                return dom.get( url, null, callback, "script" );
            },
 
            getJSON: function( url, data, callback ) {
                return dom.get( url, data, callback, "json" );
            },
            upload: function(url, form, data, callback, dataType) {
                if (dom.isFunction(data)) {
                    dataType = callback;
                    callback = data;
                    data = undefined;
                }
                return dom.ajax({
                    url:url,
                    type:'post',
                    dataType:dataType,
                    form:form,
                    data:data,
                    success:callback
                });
            },
            serialize : function(form) {
                return dom.param(dom.serializeArray(form));
            },
            serializeArray : function(form){
                // 不直接转换form.elements，防止以下情况：   <form > <input name="elements"/><input name="test"/></form>
                var elements = dom.slice(form||[]), ret = []
                elements.forEach(function(elem){
                    if( elem.name && !elem.disabled && ( "checked" in elem ? elem.checked : 1 )){
                        var val = dom( elem ).val();
                        if(Array.isArray(val)){
                            val.forEach(function(value){
                                ret.push({
                                    name: elem.name,
                                    value: value.replace( rCRLF, "\r\n" )
                                });
                            });
                        }else if(typeof val == "string"){
                            ret.push({
                                name: elem.name,
                                value: val.replace( rCRLF, "\r\n" )
                            });
                        }
                    }
                });
                return ret;
            },
            param : function( object ) {//objectToQuery
                var ret = [];
                function add( key, value ){
                    ret[ ret.length ] = encode(key) + '=' + encode(value);
                }
                if ( Array.isArray(object) ) {
                    for ( var i = 0, length = object.length; i < length; i++ ) {
                        add( object[i].name, object[i].value );
                    }
                } else {
                    function buildParams(obj, prefix) {
                        if ( Array.isArray(obj) ) {
                            for ( var i = 0, length = obj.length; i < length; i++ ) {
                                buildParams( obj[i], prefix );
                            }
                        } else if( dom.isPlainObject(obj) ) {
                            for ( var j in obj ) {
                                var postfix = ((j.indexOf("[]") > 0) ? "[]" : ""); // move the brackets to the end (if applicable)
                                buildParams(obj[j], (prefix ? (prefix+"["+j.replace("[]", "")+"]"+postfix) : j) );
                            }
                        } else {
                            add( prefix, dom.isFunction(obj) ? obj() : obj );
                        }
                    }
                    buildParams(obj);
                }
                return ret.join("&").replace(r20, "+");
            }
        });
 
        var ajax = dom.ajax = function(object) {
            if (!object.url) {
                return undefined;
            }
            var options = normalizeOptions(object),//规整化参数对象
            //创建一个伪XMLHttpRequest,能处理complete,success,error等多投事件
            dummyXHR = new dom.jXHR(options),
            dataType = options.dataType;
 
            if(options.form && options.form.nodeType ==1){
                dataType = "iframe";
            }else if(dataType == "jsonp"){
                if(options.crossDomain){
                    ajax.fire("start", dummyXHR, options.url,options.jsonp);//用于jsonp请求
                    dataType = "script"
                }else{
                    dataType = dummyXHR.options.dataType = "json";
                }
            }
            var transportContructor = transports[dataType] || transports._default,
            transport = new transportContructor();
            transport.dummyXHR = dummyXHR;
            dummyXHR.transport = transport;
            if (options.contentType) {
                dummyXHR.setRequestHeader("Content-Type", options.contentType);
            }
 
            //添加dataType所需要的Accept首部
            dummyXHR.setRequestHeader( "Accept", accepts[dataType] ? accepts[ dataType ] +  ", */*; q=0.01"  : accepts[ "*" ] );
            for (var i in options.headers) {
                dummyXHR.setRequestHeader(i, options.headers[ i ]);
            }
 
            "Complete Success Error".replace(dom.rword, function(name){
                var method = name.toLowerCase();
                dummyXHR[method] = dummyXHR["on"+name];
                if(typeof options[method] === "function"){
                    dummyXHR[method](options[method]);
                    delete dummyXHR.options[method];
                    delete options[method];
                }
            });
            dummyXHR.readyState = 1;
            // Timeout
            if (options.async && options.timeout > 0) {
                dummyXHR.timeoutID = setTimeout(function() {
                    dummyXHR.abort("timeout");
                }, options.timeout);
            }
 
            try {
                dummyXHR.state = 1;//已发送
                transport.send();
            } catch (e) {
                if (dummyXHR.status < 2) {
                    dummyXHR.callback(-1, e);
                } else {
                    dom.log(e);
                }
            }
 
            return dummyXHR;
        }
 
        dom.mix(ajax, dom.dispatcher);
        ajax.isLocal = rlocalProtocol.test(ajaxLocParts[1]);
        /**
         * jXHR类,用于模拟原生XMLHttpRequest的所有行为
         */
        dom.jXHR = dom.factory({
            implement:dom.dispatcher,
            init:function(option){
                dom.mix(this, {
                    responseData:null,
                    timeoutID:null,
                    responseText:null,
                    responseXML:null,
                    responseHeadersString:"",
                    responseHeaders:null,
                    requestHeaders:{},
                    readyState:0,
                    //internal state
                    state:0,
                    statusText:null,
                    status:0,
                    transport:null
                });
 
                this.defineEvents("complete success error");
                this.setOptions(option);
            },
 
            fire: function(type){
                var target = this, table = dom._data( target,"events") ,args = dom.slice(arguments,1);
                if(!table) return;
                var queue = table[type];
                if (  queue ) {
                    for ( var i = 0, bag; bag = queue[i++]; ) {
                        bag.callback.apply( target, args );
                    }
                }
            },
 
            setRequestHeader: function(name, value) {
                this.requestHeaders[ name ] = value;
                return this;
            },
 
            getAllResponseHeaders: function() {
                return this.state === 2 ? this.responseHeadersString : null;
            },
            getResponseHeader: function(key,/*internal*/ match) {
                if (this.state === 2) {
                    if (!this.responseHeaders) {
                        this.responseHeaders = {};
                        while (( match = rheaders.exec(this.responseHeadersString) )) {
                            this.responseHeaders[ match[1] ] = match[ 2 ];
                        }
                    }
                    match = this.responseHeaders[ key];
                }
                return match === undefined ? null : match;
            },
            // 重写 content-type 首部
            overrideMimeType: function(type) {
                if (!this.state) {
                    this.mimeType = type;
                }
                return this;
            },
 
            // 中止请求
            abort: function(statusText) {
                statusText = statusText || "abort";
                if (this.transport) {
                    this.transport._callback(0, 1);
                }
                this.callback(0, statusText);
                return this;
            },
            /**
             * 用于触发success,error,complete等回调
             * http://www.cnblogs.com/rubylouvre/archive/2011/05/18/2049989.html
             * @param {Number} status 状态码
             * @param {String} statusText 对应的扼要描述
             */
            callback:function(status, statusText) {
                // 只能执行一次，防止重复执行
                // 例如完成后，调用 abort
                // 到这要么成功，调用success, 要么失败，调用 error, 最终都会调用 complete
                if (this.state == 2) {//2:已执行回调
                    return;
                }
                this.state = 2;
                this.readyState = 4;
                var isSuccess;
                if (status >= 200 && status < 300 || status == 304) {
                    if (status == 304) {
                        statusText = "notmodified";
                        isSuccess = true;
                    } else {
                        var text = this.responseText, xml = this.responseXML,dataType = this.options.dataType;
                        try{
                            dom.log(text)
                            this.responseData = converters[dataType](this, text, xml);
                            statusText = "success";
                            isSuccess = true;
                            dom.log("dummyXHR.callback success");
                        } catch(e) {
                            dom.log("dummyXHR.callback parsererror")
                            statusText = "parsererror : " + e;
                        }
                    }
 
                }
                else {
                    if (status < 0) {
                        status = 0;
                    }
                }
 
                this.status = status;
                this.statusText = statusText;
                if (this.timeoutID) {
                    clearTimeout(this.timeoutID);
                }
                if (isSuccess) {
                    this.fire("success",this.responseData,statusText);
                } else {
                    this.fire("error",this.responseData,statusText);
                }
                this.fire("complete",this.responseData,statusText);
                this.transport = undefined;
            }
        });
 
        //http://www.cnblogs.com/rubylouvre/archive/2010/04/20/1716486.html
        //【XMLHttpRequest】传送器，专门用于上传
        var s = ["XMLHttpRequest",
        "ActiveXObject('Msxml2.XMLHTTP.6.0')",
        "ActiveXObject('Msxml2.XMLHTTP.3.0')",
        "ActiveXObject('Msxml2.XMLHTTP')",
        "ActiveXObject('Microsoft.XMLHTTP')"];
        if( !-[1,] && global.ScriptEngineMinorVersion() === 7 && location.protocol === "file:"){
            s.shift();
        }
        for(var i = 0 ,axo;axo = s[i++];){
            try{
                if(eval("new "+ axo)){
                    dom.xhr = new Function( "return new "+axo);
                    break;
                }
            }catch(e){}
        }
        if (dom.xhr) {
            var nativeXHR = new dom.xhr(), allowCrossDomain = false;
            if ("withCredentials" in nativeXHR) {
                allowCrossDomain = true;
            }
            //添加通用XMLHttpRequest传送器
            transports._default =  dom.factory({
                //发送请求
                send:function() {
                    var self = this,
                    dummyXHR = self.dummyXHR,
                    options = dummyXHR.options;
                    dom.log("XhrTransport.sending.....");
                    if (options.crossDomain && !allowCrossDomain) {
                        dom.error("do not allow crossdomain xhr !");
                        return;
                    }
 
                    var nativeXHR = new dom.xhr(), i;
                    self.xhr = nativeXHR;
                    if (options.username) {
                        nativeXHR.open(options.type, options.url, options.async, options.username, options.password)
                    } else {
                        nativeXHR.open(options.type, options.url, options.async);
                    }
                    // Override mime type if supported
                    if (dummyXHR.mimeType && nativeXHR.overrideMimeType) {
                        nativeXHR.overrideMimeType(dummyXHR.mimeType);
                    }
                    // 用于进入request.xhr?分支
                    if (!options.crossDomain && !dummyXHR.requestHeaders["X-Requested-With"]) {
                        dummyXHR.requestHeaders[ "X-Requested-With" ] = "XMLHttpRequest";
                    }
                    try {
                        for (i in dummyXHR.requestHeaders) {
                            nativeXHR.setRequestHeader(i, dummyXHR.requestHeaders[ i ]);
                        }
                    } catch(e) {
                        dom.log(" nativeXHR setRequestHeader occur error ");
                    }
 
                    nativeXHR.send(options.hasContent && options.data || null);
                    //在同步模式中,IE6,7可能会直接从缓存中读取数据而不会发出请求,因此我们需要手动发出请求
                    if (!options.async || nativeXHR.readyState == 4) {
                        self._callback();
                    } else {
                        nativeXHR.onreadystatechange = function() {
                            self._callback();
                        }
                    }
                },
 
                //用于获取原始的responseXMLresponseText 修正status statusText
                //第二个参数为1时中止清求
                _callback:function(event, isAbort) {
                    // Firefox throws exceptions when accessing properties
                    // of an xhr when a network error occured
                    // http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
                    try {
                        var self = this,nativeXHR = self.xhr, dummyXHR = self.dummyXHR;
                        if (isAbort || nativeXHR.readyState == 4) {
                            nativeXHR.onreadystatechange = dom.noop;
                            if (isAbort) {
                                // 完成以后 abort 不要调用
                                if (nativeXHR.readyState !== 4) {
                                    //IE的XMLHttpRequest.abort实现于 MSXML 3.0+
                                    //http://blogs.msdn.com/b/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx
                                    try{
                                        nativeXHR.abort &&  nativeXHR.abort();
                                    }catch(e){};
                                }
                            } else {
                                var status = nativeXHR.status;
                                dummyXHR.responseHeadersString = nativeXHR.getAllResponseHeaders();
                                var xml = nativeXHR.responseXML;
                                // Construct response list
                                if (xml && xml.documentElement /* #4958 */) {
                                    dummyXHR.responseXML = xml;
                                }
                                dummyXHR.responseText = nativeXHR.responseText;
                                //火狐在跨城请求时访问statusText值会抛出异常
                                try {
                                    var statusText = nativeXHR.statusText;
                                } catch(e) {
                                    statusText = "";
                                }
                                //用于处理特殊情况,如果是一个本地请求,只要我们能获取数据就假当它是成功的
                                if (!status && ajax.isLocal && !dummyXHR.options.crossDomain) {
                                    status = dummyXHR.responseText ? 200 : 404;
                                //IE有时会把204当作为1223
                                //returning a 204 from a PUT request - IE seems to be handling the 204 from a DELETE request okay.
                                } else if (status === 1223) {
                                    status = 204;
                                }
                                dummyXHR.callback(status, statusText);
                            }
                        }
                    } catch (firefoxAccessException) {
                        dom.log(firefoxAccessException)
                        nativeXHR.onreadystatechange = dom.noop;
                        if (!isAbort) {
                            dummyXHR.callback(-1, firefoxAccessException);
                        }
                    }
                }
            });
 
        }
        //【script节点】传送器，只用于跨域的情况
        transports.script = dom.factory({
            send:function() {
                var self = this,
                dummyXHR = self.dummyXHR,
                options = dummyXHR.options,
                head = dom.head,
                script = self.script = DOC.createElement("script");
                script.async = "async";
                dom.log("ScriptTransport.sending.....");
                if (options.charset) {
                    script.charset = options.charset
                }
                //当script的资源非JS文件时,发生的错误不可捕获
                script.onerror = script.onload = script.onreadystatechange = function(e) {
                    e = e || global.event;
                    self._callback((e.type || "error").toLowerCase());
                };
                script.src = options.url
                head.insertBefore(script, head.firstChild);
            },
 
            _callback:function(event, isAbort) {
                var node = this.script,
                dummyXHR = this.dummyXHR;
                if (isAbort || dom.rreadystate.test(node.readyState)  || event == "error"  ) {
                    node.onerror = node.onload = node.onreadystatechange = null;
                    var parent = node.parentNode;
                    if(parent && parent.nodeType === 1){
                        parent.removeChild(node);
                        this.script = undefined;
                    }
                    //如果没有中止请求并没有报错
                    if (!isAbort && event != "error") {
                        dummyXHR.callback(200, "success");
                    }
                    // 非 ie<9 可以判断出来
                    else if (event == "error") {
                        dummyXHR.callback(500, "scripterror");
                    }
                }
            }
        });
 
        //http://www.decimage.com/web/javascript-cross-domain-solution-with-jsonp.html
        //JSONP请求，借用【script节点】传送器
        converters["script json"] = function(dummyXHR){
            return dom["jsonp"+ dummyXHR.uniqueID ]();
        }
        ajax.bind("start", function(e, dummyXHR, url, jsonp) {
            dom.log("jsonp start...");
            var jsonpCallback = "jsonp"+dummyXHR.uniqueID;
            dummyXHR.options.url = url  + (rquery.test(url) ? "&" : "?" ) + jsonp + "=" + DOC.URL.replace(/(#.+|\W)/g,'')+"."+jsonpCallback;
            dummyXHR.options.dataType = "script json";
            //将后台返回的json保存在惰性函数中
            global.dom[jsonpCallback]= function(json) {
                global.dom[jsonpCallback] = function(){
                    return json;
                };
            };
        });
 
        function createIframe(dummyXHR, transport) {
            var id = "iframe-upload-"+dummyXHR.uniqueID;
            var iframe = dom.parseHTML("<iframe " +
                " id='" + id + "'" +
                " name='" + id + "'" +
                " style='display:none'/>").firstChild;
            iframe.transport = transport;
            return   (DOC.body || DOC.documentElement).insertBefore(iframe,null);
        }
 
        function addDataToForm(data, form) {
            var input = DOC.createElement("input"), ret = [];
            input.type = 'hidden';
            dom.serializeArray(data).forEach(function(obj){
                var elem =  input.cloneNode(true);
                elem.name = obj.name;
                elem.value = obj.value;
                form.appendChild(elem);
                ret.push(elem);
            });
            return ret;
        }
        //【iframe】传送器，专门用于上传
        //http://www.profilepicture.co.uk/tutorials/ajax-file-upload-xmlhttprequest-level-2/ 上传
        transports.iframe = dom.factory({
            send:function() {
                var self = this,
                dummyXHR = self.dummyXHR,
                options = dummyXHR.options,
                form = options.form
                //form.enctype的值
                //1:application/x-www-form-urlencoded   在发送前编码所有字符（默认）
                //2:multipart/form-data 不对字符编码。在使用包含文件上传控件的表单时，必须使用该值。
                //3:text/plain  空格转换为 "+" 加号，但不对特殊字符编码。
                this.backups = {
                    target:form.target || "",
                    action:form.action || "",
                    enctype:form.enctype,
                    method:form.method
                };
 
                var iframe = createIframe(dummyXHR, this);
                //必须指定method与enctype，要不在FF报错
                //“表单包含了一个文件输入元素，但是其中缺少 method=POST 以及 enctype=multipart/form-data，所以文件将不会被发送。”
                // 设置target到隐藏iframe，避免整页刷新
                form.target =  "iframe-upload-"+dummyXHR.uniqueID;
                form.action =  options.url;
                form.method =  "POST";
                form.enctype = "multipart/form-data";
                this.fields = options.data ? addDataToForm(options.data, form) : [];
                this.form = form;//一个表单元素
                dom(iframe).bind("load",this._callback).bind("error",this._callback);
                form.submit();
            },
 
            _callback:function(event  ) {
                var iframe = this,
                transport =  iframe.transport;
                // 防止重复调用 , 成功后 abort
                if (!transport) {
                    return;
                }
                dom.log("transports.iframe _callback")
                var form = transport.form,
                eventType = event.type,
                dummyXHR = transport.dummyXHR;
                iframe.transport = undefined;
                if (eventType == "load") {
                    var doc = iframe.contentDocument ? iframe.contentDocument : window.frames[iframe.id].document;
                    var iframeDoc = iframe.contentWindow.document;
                    if (doc.XMLDocument) {
                        dummyXHR.responseXML = doc.XMLDocument;
                    } else if (doc.body){
                        // response is html document or plain text
                        dummyXHR.responseText = doc.body.innerHTML;
                        dummyXHR.responseXML = iframeDoc;
                        //当，MIME为"text/plain",浏览器会把文本放到一个PRE标签中
                        if (doc.body.firstChild && doc.body.firstChild.nodeName.toUpperCase() == 'PRE') {
                            dummyXHR.responseText  = doc.body.firstChild.firstChild.nodeValue;
                        }
                    }else {
                        // response is a xml document
                        dummyXHR.responseXML = doc;
                    }
                    dummyXHR.callback(200, "success");
                } else if (eventType == 'error') {
                    dummyXHR.callback(500, "error");
                }
                for(var i in transport.backups){
                    form[i] = transport.backups[i];
                }
                //还原form的属性
                transport.fields.forEach(function(elem){
                    elem.parentNode.removeChild(elem);
                });
                dom(iframe).unbind("load",transport._callback).unbind("error",transport._callback);
                iframe.clearAttributes &&  iframe.clearAttributes();
                setTimeout(function() {
                    // Fix busy state in FF3
                    iframe.parentNode.removeChild(iframe);
                    dom.log("iframe.parentNode.removeChild(iframe)")
                }, 0);
 
            }
        });
    });
})(this,this.document);