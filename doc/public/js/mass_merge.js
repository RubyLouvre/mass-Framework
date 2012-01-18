//=========================================
// 模块加载模块（核心模块）2011.11.11 by 司徒正美
//=========================================
(function(global , DOC){
    var
    _$ = global.$, //保存已有同名变量
    _mass = global.mass, //保存已有同名变量
    namespace = DOC.URL.replace( /(#.+|\W)/g,'');
    /**
     * @class mass
     * mass Framework拥有两个命名空间,
     * 第一个是DOC.URL.replace(/(\W|(#.+))/g,'')，根据页面的地址动态生成
     * 第二个是$，我们可以使用别名机制重写它
     * @namespace $
     */
    function mass(expr,context){//新版本的基石
        if(mass.type(expr,"Function")){ //注意在safari下,typeof nodeList的类型为function,因此必须使用$.type
            mass.require("ready,lang,attr,event,fx",expr);
        }else{
            if(!mass.fn)
                throw "must load the 'node' module!"
            return new mass.fn.init(expr,context);
        }
    }
    //多版本共存
    var commonNs = global[namespace], version = 1.0, postfix = "";
    if( typeof commonNs !== "function"){
        commonNs = mass;//公用命名空间对象
    }
    if(commonNs.v !== version ){
        commonNs[version] = mass;//保存当前版本的命名空间对象到公用命名空间对象上
        if(commonNs.v) {
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
    mix(mass,{//为此版本的命名空间对象添加成员
        html : DOC.documentElement,
        head : HEAD,
        rword : /[^, ]+/g,
        v : version,
        "@name" : "$",
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
            _$ && (global.$ = _$);//多库共存
            name = name || mass["@name"];//取得当前简短的命名空间
            mass["@name"] = name 
            global[namespace] = commonNs;
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
                mass.require("ready",function(){
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
            return node.uniqueNumber || (node.uniqueNumber = mass.uuid++);
        }: function(node){
            var uid = node.getAttribute("uniqueNumber");
            if (!uid){
                uid = mass.uuid++;
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
                array = array.match(mass.rword) || [];
            }
            var result = {},value = val !== void 0 ? val :1;
            for(var i=0,n=array.length;i < n;i++){
                result[array[i]] = value;
            }
            return result;
        }
    });
    mass.noop = mass.error = function(){};

    "Boolean,Number,String,Function,Array,Date,RegExp,Window,Document,Arguments,NodeList".replace(mass.rword,function(name){
        class2type[ "[object " + name + "]" ] = name;
    });
    var
    rmodule =  /([^(\s]+)\(?([^)]*)\)?/,
    names = [],//需要处理的模块名列表
    rets = {},//用于收集模块的返回值
    cbi = 1e4 ;//用于生成回调函数的名字
    var map = mass["@modules"] = {
        "@ready" : { }
    };
    /**
     * 加载模块。它会临时生成一个iframe，并在里面创建相应的script节点进笨请求，并附加各种判定是否加载成功的机制
     * @param {String} name 模块名
     * @param {String} url  模块的路径
     * @param {String} ver  当前dom框架的版本
     */
    function loadModule(name, url, ver){
        url = url  || mass["@path"] +"/"+ name.slice(1) + ".js" + (mass["@debug"] ? "?timestamp="+(new Date-0) : "");
        var iframe = DOC.createElement("iframe"),//IE9的onload经常抽疯,IE10 untest
        codes = ["<script> var mass = parent[document.URL.replace(/(#.+|\\W)/g,'')][", ver,'] ;<\/script><script src="',url,'" ',
        (DOC.uniqueID ? "onreadystatechange" : "onload"),'="', "if(/loaded|complete|undefined/i.test(this.readyState)){  mass._resolveCallbacks();",
        (global.opera ? "this.ownerDocument.x = 1;" : " mass._checkFail('"+name+"');"),
        '} " ' , (w3c ? 'onerror="mass._checkFail(\''+name+'\',true);" ' : ""),' ><\/script>' ];
        iframe.style.display = "none";
        //http://www.tech126.com/https-iframe/ http://www.ajaxbbs.net/post/webFront/https-iframe-warning.html
        if(!"1"[0]){//IE6 iframe在https协议下没有的指定src会弹安全警告框
            iframe.src = "javascript:false"
        }
        HEAD.insertBefore(iframe,HEAD.firstChild);
        var d = iframe.contentDocument || iframe.contentWindow.document;
        d.write(codes.join(''));
        d.close();
        mass.bind(iframe,"load",function(){
            if(global.opera && d.x == void 0){
                mass._checkFail(name, true);//模拟opera的script onerror
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
        return  Function("b","var mass = $;return " +(str || fn) +".apply(window,b)" )(argv);
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
        self.complete = mass.noop;
        return self;
    }

    var errorstack = mass.stack = deferred();
    errorstack.method = "pop";
    mix(mass, {
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
            (deps +"").replace(mass.rword,function(url,name,match){
                dn++;
                match = url.match(rmodule);
                name  = "@"+ match[1];//取得模块名
                if(!map[name]){ //防止重复生成节点与请求
                    map[name] = { };//state: undefined, 未加载; 1 已加载; 2 : 已执行
                    loadModule(name,match[2],mass.v);//加载JS文件
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
                mass.stack(errback);//压入错误堆栈
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
            mass._resolveCallbacks();//FIX opera BUG。opera在内部解析时修改执行顺序，导致没有执行最后的回调
        },
        //定义模块
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
        repeat && mass._resolveCallbacks();
        },
        //用于检测这模块有没有加载成功
        _checkFail : function(name, error){
            if(error || !map[name].state ){
                this.stack(new Function('$.log("fail to load module [ '+name+' ]")'));
                this.stack.fire();//打印错误堆栈
            }
        }
    });
    //mass.log("已加载模块加载模块")
    //domReady机制
    var readylist = deferred();
    function fireReady(){
        map["@ready"].state = 2;
        mass._resolveCallbacks();
        readylist.complete = function(fn){
            mass.type(fn, "Function") &&  fn()
        }
        readylist.fire();
        fireReady = mass.noop;
    };
    function doScrollCheck() {
        try {
            mass.html.doScroll("left");
            fireReady();
        } catch(e) {
            setTimeout( doScrollCheck, 1);
        }
    };
    //开始判定页面的加载情况
    if ( DOC.readyState === "complete" ) {
        fireReady();
    }else {
        mass.bind(DOC, (w3c ? "DOMContentLoaded" : "readystatechange"), function(){
            if (w3c || DOC.readyState === "complete") {
                fireReady();
            }
        });
        if ( mass.html.doScroll && self.eval === top.eval ) {
            doScrollCheck();
        }
    }
    //https://developer.mozilla.org/en/DOM/window.onpopstate
    mass.bind(global,"popstate",function(){
        namespace = DOC.URL.replace(/(#.+|\W)/g,'');
        mass.exports();
    });
    mass.exports("$"+ postfix);//防止不同版本的命名空间冲突
var module_value = {
                state:2
            };
            var list = "ecma,lang".match($.rword);
            for(var i=0, module;module = list[i++];){
                map["@"+module] = module_value;
            }
//=========================================
//  ECMA262v5新扩展模块
//==========================================
$.define("ecma", function(){
    //$.log("已加载ECMA262v5新扩展模块")
    //Object扩展
    //fix ie for..in bug
    var DONT_ENUM = $.DONT_ENUM = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(","),
    P = "prototype",
    hasOwn = ({}).hasOwnProperty;
    for (var i in {
        toString: 1
    }){
        DONT_ENUM = false;
    }
    //第二个参数仅在浏览器支持Object.defineProperties时可用
    $.mix(Object,{
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
        body.replace('_', '((i in this) && fn.call(scope,this[i],i,this))')
        +'}'+ret
        return new Function("fn,scope",fun);
    }
    $.mix(Array[P],{
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
        //迭代类 在数组中的每个项上运行一个函数。
        forEach : iterator('', '_', ''),
        //迭代类 在数组中的每个项上运行一个函数，如果此函数的值为真，则此元素作为新数组的元素收集起来，并返回新数组
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
    $.mix(String[P],{
        //ecma262v5 15.5.4.20
        //http://www.cnblogs.com/rubylouvre/archive/2009/09/18/1568794.html
        //'      dfsd '.trim() === 'dfsd''
        trim: function(){
            return  this.replace(/^[\s\xA0]+/,"").replace(/[\s\xA0]+$/,'')
        }
    },false);

    $.mix(Function[P],{
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
    
//2011.7.26
//移除Object.create方法,添加Object.getPrototypeOf方法
//2011.11.16
//重构Array.prototype.unshift (thx @abcd)
//2011.12.22
//修正命名空间

//=========================================
// 类型扩展模块 by 司徒正美
//=========================================

$.define("lang", Array.isArray ? "" : "ecma", function(){
    $.log("已加载lang模块");
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
    $.mix($,{
        //判定是否是一个朴素的javascript对象（Object或JSON），不是DOM对象，不是BOM对象，不是自定义类的实例。
        isPlainObject : function (obj){
            if(!$.type(obj,"Object") || $.isNative(obj,"reload") ){
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

        //判定method是否为obj的原生方法，如$.isNative(window,"JSON")
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
            if(!obj || obj.document || obj.nodeType || $.type(obj,"Function")) return false;
            return isFinite(obj.length) ;
        },

        //将字符串中的占位符替换为对应的键值
        //http://www.cnblogs.com/rubylouvre/archive/2011/05/02/1972176.html
        format : function(str, object){
            var array = $.slice(arguments,1);
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
            $.error( "Invalid JSON: " + data );
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
                $.log( "Invalid XML: " + data );
            }
            return xml;
        }

    }, false);

    "Array,Function".replace($.rword,function(name){
        $["is"+name] = function(obj){
            return obj && ({}).toString.call(obj) === "[object "+name+"]";
        }
    });

    if(Array.isArray){
        $.isArray = Array.isArray;
    }

    var String2 = $.String = {
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
        //$.lang("é").toHex() ==> \xE9
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

    var Array2 = $.Array  = {
        //深拷贝当前数组
        clone: function(){
            var i = this.length, result = [];
            while (i--) result[i] = cloneOf(this[i]);
            return result;
        },
        first: function(fn,scope){
            if($.type(fn,"Function")){
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
            if($.type(fn,"Function")){
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
            var args = $.slice(arguments);
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
            return $.Array.unique.call(arr);
        },
        //取交集
        intersect:function(array){
            return this.filter(function(n) {
                return ~array.indexOf(n)
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
                if ($.isArray(value)) {
                    result = result.concat(self.call(value));
                } else {
                    result.push(value);
                }
            });
            return result;
        }
    }
    Array2.without = Array2.diff;
    var Math2 = "abs,acos,asin,atan,atan2,ceil,cos,exp,floor,log,pow,sin,sqrt,tan".match($.rword);
    var Number2 = $.Number ={
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
        switch($.type(item)){
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

    var Object2 = $.Object = {
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
            if($.DONT_ENUM && this.hasOwnProperty){
                for(var i = 0; name = $.DONT_ENUM[i++]; ){
                    this.hasOwnProperty(name) &&  fn.call(scope,this[name],name,this);
                }
            }
        },
        //进行深拷贝，返回一个新对象，如果是拷贝请使用$.mix
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
    var adjustOne = $.oneObject("String,Array,Number,Object"),
    arrayLike = $.oneObject("NodeList,Arguments,Object")
    var Lang = $.lang = function(obj){
        var type = $.type(obj), chain = this;
        if(arrayLike[type] &&  isFinite(obj.length)){
            obj = $.slice(obj);
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
        var methods = inner[type].concat(Object.keys(mass[type]));
        methods.forEach(function(name){
            proto[name] = function(){
                var obj = this.target;
                var method = obj[name] ? obj[name] : mass[this.type][name];
                var result = method.apply(obj,arguments);
                return result;
            }
            proto[name+"X"] = function(){
                var obj = this.target;
                var method = obj[name] ? obj[name] : mass[this.type][name];
                var result = method.apply(obj,arguments);
                return Lang.call(this,result) ;
            }
        });
        return force;
    };
    Lang.force = force("Array")("String")("Number")("Object");
    return Lang;
});


//2011.7.12 将toArray转移到lang模块下
//2011.7.26 去掉toArray方法,添加globalEval,parseJSON,parseXML方法
//2011.8.6  增加tag方法
//2011.8.14 更新隐藏的命名空间,重构range方法,将node模块的parseHTML方法移到此处并大幅强化
//2011.8.16 $.String2,$.Number2,$.Array2,$.Object2,globalEval 更名为$.String,$.Number,$.Array,$.Object,parseJS
//2011.8.18 $.Object.merge不再设置undefined的值
//2011.8.28 重构Array.unique
//2011.9.11 重构$.isArray $.isFunction
//2011.9.16 修复$.format BUG
//2011.10.2 优化$.lang
//2011.10.3 重写$.isPlainObject与jQuery的保持一致, 优化parseJS，
//2011.10.4 去掉array.without（功能与array.diff相仿），更改object.widthout的参数
//2011.10.6 使用位反操作代替 === -1, 添加array.intersect,array.union
//2011.10.16 添加返回值
//2011.10.21 修复Object.keys BUG
//2011.10.26 优化quote ;将parseJSON parseXML中$.log改为$.error; FIX isPlainObject BUG;
//2011.11.6 对parseXML中的IE部分进行强化
//2011.12.22 修正命名空间
//2012.1.15 修正命名空间
//键盘控制物体移动 http://www.wushen.biz/move/


})(this,this.document);
/**
 2011.7.11
@开头的为私有的系统变量，防止人们直接调用,
$.check改为dom["@emitter"]
$.namespace改为dom["@name"]
去掉无用的$.modules
优化exports方法
2011.8.4
强化$.log，让IE6也能打印日志
重构fixOperaError与resolveCallbacks
将provide方法合并到require中去
2011.8.7
重构define,require,resolve
添加"@modules"属性到dom命名空间上
增强domReady传参的判定
2011.8.18 应对HTML5 History API带来的“改变URL不刷新页面”技术，让URL改变时让namespace也跟着改变！
2011.8.20 去掉$.K,添加更简单$.noop，用一个简单的异步列队重写$.ready与错误堆栈$.stack
2011.9.5  强化$.type
2011.9.19 强化$.mix
2011.9.24 简化$.bind 添加$.unbind
2011.9.28 $.bind 添加返回值
2011.9.30 更改是否在顶层窗口的判定  global.frameElement == null --> self.eval === top.eval
2011.10.1
更改$.uuid为dom["@uuid"],$.basePath为dom["@path"]，以示它们是系统变量
修复$.require BUG 如果所有依赖模块之前都加载执行过，则直接执行回调函数
移除$.ready 只提供dom(function(){})这种简捷形式
2011.10.4 强化对IE window的判定, 修复$.require BUG dn === cn --> dn === cn && !callback._name
2011.10.9
简化fixOperaError中伪dom命名空间对象
优化截取隐藏命名空间的正则， /(\W|(#.+))/g --〉  /(#.+|\\W)/g
2011.10.13 dom["@emitter"] -> dom["@dispatcher"]
2011.10.16 移除XMLHttpRequest的判定，回调函数将根据依赖列表生成参数，实现更彻底的模块机制
2011.10.20 添加error方法，重构log方法
2011.11.6  重构uuid的相关设施
2011.11.11 多版本共存
2011.12.19 增加define方法
2011.12.22 加载用iframe内增加mass变量,用作过渡.
2012.1.15  更换$为命名空间

不知道什么时候开始，"不要重新发明轮子"这个谚语被传成了"不要重新造轮子"，于是一些人，连造轮子都不肯了。

 */

