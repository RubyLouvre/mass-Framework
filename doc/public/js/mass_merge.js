//=========================================
// 模块加载模块（核心模块）2012.1.29 by 司徒正美
//=========================================
(function( global, DOC ){
    var
    _$ = global.$, //保存已有同名变量
    namespace = DOC.URL.replace( /(#.+|\W)/g,''),
    w3c = DOC.dispatchEvent, //w3c事件模型
    HEAD = DOC.head || DOC.getElementsByTagName( "head" )[0],
    commonNs = global[ namespace ], mass = 1.0, postfix = "",
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
     * @class $
     * mass Framework拥有两个命名空间,
     * 第一个是DOC.URL.replace(/(\W|(#.+))/g,'')，根据页面的地址动态生成
     * 第二个是$，我们可以使用别名机制重写它
     */
    function $( expr, context ){//新版本的基石
        if( $.type( expr,"Function" ) ){ //注意在safari下,typeof nodeList的类型为function,因此必须使用$.type
            $.require( "ready,lang,attr,event,fx", expr );
        }else{
            if( !$.fn )
                throw "must load the 'node' module!"
            return new $.fn.init( expr, context );
        }
    }
    //多版本共存
    if( typeof commonNs !== "function"){
        commonNs = $;//公用命名空间对象
    }
    if(commonNs.mass !== mass ){
        commonNs[ mass ] = $;//保存当前版本的命名空间对象到公用命名空间对象上
        if(commonNs.mass) {
            postfix = ( mass + "" ).replace( ".", "_" );
        }
    }else{
        return;
    }

    /**
     * 糅杂，为一个对象添加更多成员
     * @param {Object} target 目标对象
     * @param {Object} source 属性包
     * @return  {Object} 目标对象
     */
    function mix( target, source ){
        var args = [].slice.call( arguments ), key,
        ride = typeof args[args.length - 1] == "boolean" ? args.pop() : true;
        target = target || {};
        for(var i = 1; source = args[i++];){
            for ( key in source ) {
                if (ride || !(key in target)) {
                    target[ key ] = source[ key ];
                }
            }
        }
        return target;
    }
    mix( $, {//为此版本的命名空间对象添加成员
        html: DOC.documentElement,
        head: HEAD,
        rword: /[^, ]+/g,
        mass: mass,//大家都爱用类库的名字储存版本号，我也跟风了
        "@name": "$",
        "@debug": false,
        "@target": w3c ? "addEventListener" : "attachEvent",
        "@path": (function( url, scripts, node ){
            scripts = DOC.getElementsByTagName( "script" );
            node = scripts[ scripts.length - 1 ];
            url = node.hasAttribute ?  node.src : node.getAttribute( 'src', 4 );
            return url.substr( 0, url.lastIndexOf('/') );
        })(),
        /**
         * 将内部对象挂到window下，此时可重命名，实现多库共存
         * @param {String} name 新的命名空间
         */
        exports: function( name ) {
            _$ && ( global.$ = _$ );//多库共存
            name = name || $[ "@name" ];//取得当前简短的命名空间
            $[ "@name" ] = name;
            global[ namespace ] = commonNs;
            return global[ name ]  = this;
        },
        /**
         * 数组化
         * @param {ArrayLike} nodes 要处理的类数组对象
         * @param {Number} start 可选。要抽取的片断的起始下标。如果是负数，从后面取起
         * @param {Number} end  可选。规定从何处结束选取
         * @return {Array}
         */
        slice: function ( nodes, start, end ) {
            for(var i = 0, n = nodes.length, result = []; i < n; i++){
                result[i] = nodes[i];
            }
            if ( arguments.length > 1 ) {
                return result.slice( start , ( end || result.length ) );
            } else {
                return result;
            }
        },
        /**
         * 用于取得数据的类型（一个参数的情况下）或判定数据的类型（两个参数的情况下）
         * @param {Any} obj 要检测的东西
         * @param {String} str 可选，要比较的类型
         * @return {String|Boolean}
         */
        type: function ( obj, str ){
            var result = class2type[ (obj == null || obj !== obj ) ? obj :  toString.call( obj ) ] || obj.nodeName || "#";
            if( result.charAt(0) === "#" ){//兼容旧式浏览器与处理个别情况,如window.opera
                //利用IE678 window == document为true,document == window竟然为false的神奇特性
                if( obj == obj.document && obj.document != obj ){
                    result = 'Window'; //返回构造器名字
                }else if( obj.nodeType === 9 ) {
                    result = 'Document';//返回构造器名字
                }else if( obj.callee ){
                    result = 'Arguments';//返回构造器名字
                }else if( isFinite( obj.length ) && obj.item ){
                    result = 'NodeList'; //处理节点集合
                }else{
                    result = toString.call( obj ).slice( 8, -1 );
                }
            }
            if( str ){
                return str === result;
            }
            return result;
        },
        /**
         * 用于调试
         * @param {String} text 要打印的内容
         * @param {Boolean} force 强逼打印到页面上
         */
        log: function ( text, force ){
            if( force ){
                $.require( "ready", function(){
                    var div =  DOC.createElement("div");
                    div.innerHTML = text +"";//确保为字符串
                    DOC.body.appendChild(div)
                });
            }else if( global.console ){
                global.console.log( text );
            }
        },
        uuid: 1,
        getUid: global.getComputedStyle ? function( node ){//用于建立一个从元素到数据的引用，以及选择器去重操作
            return node.uniqueNumber || ( node.uniqueNumber = $.uuid++ );
        }: function( node ){
            var uid = node.getAttribute("uniqueNumber");
            if ( !uid ){
                uid = $.uuid++;
                node.setAttribute( "uniqueNumber", uid );
            }
            return uid;
        },
        /**
         * 生成键值统一的对象，用于高速化判定
         * @param {Array|String} array 如果是字符串，请用","或空格分开
         * @param {Number} val 可选，默认为1
         * @return {Object}
         */
        oneObject : function( array, val ){
            if( typeof array == "string" ){
                array = array.match( $.rword ) || [];
            }
            var result = {}, value = val !== void 0 ? val :1;
            for(var i = 0, n = array.length; i < n; i++){
                result[ array[i] ] = value;
            }
            return result;
        }
    });
    $.noop = $.error = function(){};
    "Boolean,Number,String,Function,Array,Date,RegExp,Window,Document,Arguments,NodeList".replace( $.rword, function( name ){
        class2type[ "[object " + name + "]" ] = name;
    });
    var
    rmodule =  /([^(\s]+)\(?([^)]*)\)?/,
    tokens = [],//需要处理的模块名列表
    transfer = {},//中转器，用于收集各个模块的返回值并转送到那些指定了依赖列表的模块去
    cbi = 1e5 ;//用于生成回调函数的名字
    var mapper = $[ "@modules" ] = {
        "@ready" : { }
    };
    //用于处理iframe请求中的$.define，将第一个参数修正为正确的模块名后，交由其父级窗口的命名空间对象的define
    var innerDefine = function( _, deps, callback ){
        var args = arguments;
        args[0] = nick.slice(1);
        args[ args.length - 1 ] =  parent.Function( "return "+ args[ args.length - 1 ] )();
        //将iframe中的函数转换为父窗口的函数
        Ns.define.apply(Ns, args)
    }
    /**
     * 加载模块。它会临时构建一个iframe沙箱环境，在里面创建script标签加载指定模块
     * @param {String} name 模块名
     * @param {String} url  模块的路径
     * @param {String} mass  当前框架的版本号
     */
    function load( name, url, mass ){
        url = url  || $[ "@path" ] +"/"+ name.slice(1) + ".js" + ( $[ "@debug" ] ? "?timestamp="+(new Date-0) : "" );
        var iframe = DOC.createElement("iframe"),//IE9的onload经常抽疯,IE10 untest
        codes = ['<script>var nick ="', name, '", $ = {}, Ns = parent[document.URL.replace(/(#.+|\\W)/g,"")][',
        mass, ']; $.define = ', innerDefine, '<\/script><script src="',url,'" ',
        (DOC.uniqueID ? "onreadystatechange" : "onload"),
        '="if(/loaded|complete|undefined/i.test(this.readyState)){ ',
        'Ns._checkDeps();this.ownerDocument.ok = 1;if(!window.opera){ Ns._checkFail(nick); }',
        '} " onerror="Ns._checkFail(nick, true);" ><\/script>' ];
        iframe.style.display = "none";
        //http://www.tech126.com/https-iframe/ http://www.ajaxbbs.net/post/webFront/https-iframe-warning.html
        if( !"1"[0] ){//IE6 iframe在https协议下没有的指定src会弹安全警告框
            iframe.src = "javascript:false"
        }
        HEAD.insertBefore( iframe, HEAD.firstChild );
        var d = iframe.contentDocument || iframe.contentWindow.document;
        d.write( codes.join('') );
        d.close();
        $.bind( iframe, "load", function(){
            if( global.opera && d.ok == void 0 ){
                $._checkFail( name, true );//模拟opera的script onerror
            }
            d.write( "<body/>" );//清空内容
            HEAD.removeChild( iframe );//移除iframe
        });
    }
    //收集依赖列表对应模块的返回值，传入目标模块中执行
    function assemble( fn, args ){
        for ( var i = 0,argv = [], name; name = args[i++]; ) {
            argv.push( transfer[name] );
        }
        return fn.apply( global, argv );
    }
    function deferred(){//一个简单的异步列队
        var list = [],self = function(fn){
            fn && fn.call && list.push( fn );
            return self;
        }
        self.method = "shift";
        self.fire = function( fn ){
            while( fn = list[ self.method ]() ){
                fn();
            }
            return list.length ? self : self.complete();
        }
        self.complete = $.noop;
        return self;
    }

    var errorstack = $.stack = deferred();
    errorstack.method = "pop";
    mix( $, {
        mix: mix,
        //绑定事件(简化版)
        bind: w3c ? function( el, type, fn, phase ){
            el.addEventListener( type, fn, !!phase );
            return fn;
        } : function( el, type, fn ){
            el.attachEvent( "on"+type, fn );
            return fn;
        },
        unbind: w3c ? function( el, type, fn, phase ){
            el.removeEventListener( type, fn || $.noop, !!phase );
        } : function( el, type, fn ){
            el.detachEvent( "on"+type, fn || $.noop );
        },
        //请求模块
        require: function( deps, callback, errback ){//依赖列表,正向回调,负向回调
            var _deps = {}, args = [], dn = 0, cn = 0;
            ( deps +"" ).replace( $.rword, function( url, name, match ){
                dn++;
                match = url.match( rmodule );
                name  = "@"+ match[1];//取得模块名
                if( !mapper[ name ] ){ //防止重复生成节点与请求
                    mapper[ name ] = { };//state: undefined, 未加载; 1 已加载; 2 : 已执行
                    load( name, match[2], $.mass );//加载JS文件
                }else if( mapper[ name ].state === 2 ){
                    cn++;
                }
                if( !_deps[ name ] ){
                    args.push( name );
                    _deps[ name ] = "司徒正美";//去重，去掉@ready
                }
            });
            var token = callback.token;
            if( dn === cn ){//在依赖都已执行过或没有依赖的情况下
                if( token && !( token in transfer ) ){
                    mapper[ token ].state = 2 //如果是使用合并方式，模块会跑进此分支（只会执行一次）
                    return transfer[ token ] = assemble( callback, args );
                }else if( !token ){//普通的回调可执行无数次
                    return assemble( callback, args );
                }
            }
            token = token || "@cb"+ ( cbi++ ).toString(32);
            if( errback ){
                $.stack( errback );//压入错误堆栈
            }
            mapper[ token ] = {//创建或更新模块的状态
                callback:callback,
                name: token,
                deps: _deps,
                args: args,
                state: 1
            };//在正常情况下模块只能通过resolveCallbacks执行
            tokens.unshift( token );
            $._checkDeps();//FIX opera BUG。opera在内部解析时修改执行顺序，导致没有执行最后的回调
        },
        //定义模块
        define: function( name, deps, callback ){//模块名,依赖列表,模块本身
            var args = arguments;
            if( typeof deps === "boolean" ){//用于文件合并, 在标准浏览器中跳过补丁模块
                if( deps ){
                    return;
                }
                [].splice.call( args, 1, 1 );
            }
            if( typeof args[1] === "function" ){//处理只有两个参数的情况
                [].splice.call( args, 1, 0, "" );
            }
            args[2].token = "@"+name; //模块名
            this.require( args[1], args[2] );
        },
        //执行并移除所有依赖都具备的模块或回调
        _checkDeps: function (){
            loop:
            for ( var i = tokens.length, repeat, name; name = tokens[ --i ]; ) {
                var obj = mapper[ name ], deps = obj.deps;
                for( var key in deps ){
                    if( deps.hasOwnProperty( key ) && mapper[ key ].state != 2 ){
                        continue loop;
                    }
                }
                //如果deps是空对象或者其依赖的模块的状态都是2
                if( obj.state != 2){
                    tokens.splice( i, 1 );//必须先移除再执行，防止在IE下DOM树建完后手动刷新页面，会多次执行最后的回调函数
                    transfer[ obj.name ] = assemble( obj.callback, obj.args );
                    obj.state = 2;//只收集模块的返回值
                    repeat = true;
                }
            }
        repeat && $._checkDeps();
        },
        //用于检测这模块有没有加载成功
        _checkFail : function( name, error ){
            if( error || !mapper[ name ].state ){
                this.stack( Function( 'window.'+ $["@name"] +'.log("fail to load module [ '+name+' ]")') );
                this.stack.fire();//打印错误堆栈
            }
        }
    });
    //domReady机制
    var readylist = deferred();
    function fireReady(){
        mapper[ "@ready" ].state = 2;
        $._checkDeps();
        readylist.complete = function( fn ){
            $.type( fn, "Function") &&  fn();
        }
        readylist.fire();
        fireReady = $.noop;
    };
    function doScrollCheck() {
        try {
            $.html.doScroll( "left" );
            fireReady();
        } catch(e) {
            setTimeout( doScrollCheck, 1 );
        }
    };
    //开始判定页面的加载情况
    if ( DOC.readyState === "complete" ) {
        fireReady();
    }else {
        $.bind( DOC, ( w3c ? "DOMContentLoaded" : "readystatechange" ), function(){
            if ( w3c || DOC.readyState === "complete" ){
                fireReady();
            }
        });
        if( $.html.doScroll && self.eval === top.eval ){
            doScrollCheck();
        }
    }
    //https://developer.mozilla.org/en/DOM/window.onpopstate
    $.bind( global, "popstate", function(){
        namespace = DOC.URL.replace(/(#.+|\W)/g,'');
        $.exports();
    });
    $.exports( "$"+ postfix );//防止不同版本的命名空间冲突
   
var module_value = {
                                    state:2
                                };
                                var list = "lang_fix,lang,support,class,data,query,node,css_fix,css,attr,target,event,fx".match($.rword);
                                for(var i=0, module;module = list[i++];){
                                    mapper["@"+module] = module_value;
                                }//=========================================
//  语言补丁模块
//==========================================
$.define( "lang_fix",  function(){
    // $.log("已加载语言补丁模块");
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
        indexOf: function (item, index) {
            var n = this.length, i = ~~index;
            if (i < 0) i += n;
            for (; i < n; i++)
                if ( this[i] === item) return i;
            return -1;
        },
        //定位类 返回指定项最后一次出现的索引。
        lastIndexOf: function (item, index) {
            var n = this.length,
            i = index == null ? n - 1 : index;
            if (i < 0) i = Math.max(0, n + i);
            for (; i >= 0; i--)
                if (this[i] === item) return i;
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
// 类型扩展模块v3 by 司徒正美
//=========================================
$.define("lang", Array.isArray ? "" : "lang_fix",function(){
    // $.log("已加载语言扩展模块");
    var global = this, rascii = /[^\x00-\xff]/g,
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
            if(!$.type(obj,"Object") || $.isNative(obj, "reload") ){
                return false;
            }
            try{//不存在hasOwnProperty方法的对象肯定是IE的BOM对象或DOM对象
                for(var key in obj)//只有一个方法是来自其原型立即返回flase
                    if(!({}).hasOwnProperty.call(obj, key)){//不能用obj.hasOwnProperty自己查自己
                        return false
                    }
            }catch(e){
                return false;
            }
            return true;
        },
        //判定method是否为obj的原生方法，如$.isNative(global,"JSON")
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
        tag:function (start, content, xml){
            xml = !!xml
            var chain = function(start, content, xml){
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
        each : function(obj, fn, args ){
            var go = 1, isArray = Array.isArray(args)
            $.lang(obj).forEach( function (el, i){
                if( go && fn.apply(el, isArray ? args : [el, i, obj]) === false){
                    go = 0;
                }
            });
        },
        dump : function(obj, indent) {
            indent = indent || "";
            if (obj === null)
                return indent + "null";
            if (obj === void 0)
                return indent + "undefined";
            if (obj.nodeType === 9)
                return indent + "[object Document]";
            if (obj.nodeType)
                return indent + "[object " + (obj.tagName || "Node") +"]";
            var arr = [],type = $.type(obj),self = arguments.callee,next = indent +  "\t";
            switch (type) {
                case "Boolean":
                case "Number":
                case "NaN":
                case "RegExp":
                    return indent + obj;
                case "String":
                    return indent + $.quote(obj);
                case "Function":
                    return (indent + obj).replace(/\n/g, "\n" + indent);
                case "Date":
                    return indent + '(new Date(' + obj.valueOf() + '))';
                case "global" :
                    return indent + "[object "+type +"]";
                case "NodeList":
                case "Arguments":
                case "Array":
                    for (var i = 0, n = obj.length; i < n; ++i)
                        arr.push(self(obj[i], next).replace(/^\s* /g, next));
                    return indent + "[\n" + arr.join(",\n") + "\n" + indent + "]";
                default:
                    if($.isPlainObject(obj)){
                        for ( i in obj) {
                            arr.push(next + self(i) + ": " + self(obj[i], next).replace(/^\s+/g, ""));
                        }
                        return indent + "{\n" + arr.join(",\n") + "\n" + indent + "}";
                    }else{
                        return indent + "[object "+type +"]";
                    }
            }
        },
        //http://www.schillmania.com/content/projects/javascript-animation-1/
        //http://www.cnblogs.com/rubylouvre/archive/2010/04/09/1708419.html
        parseJS: function( code ) {
            //IE中，global.eval()和eval()一样只在当前作用域生效。
            //Firefox，Safari，Opera中，直接调用eval()为当前作用域，global.eval()调用为全局作用域。
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
                    xml = tmp.parseFromString(data , "text/xml" );
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

    "Array,Function".replace($.rword, function(name){
        $["is"+name] = function(obj){
            return obj && ({}).toString.call(obj) === "[object "+name+"]";
        }
    });
    if(Array.isArray){
        $.isArray = Array.isArray;
    }
    var adjustOne = $.oneObject("String,Array,Number,Object"),
    arrayLike = $.oneObject("NodeList,Arguments,Object");
    //语言链对象
    $.lang = function(obj){
        var type = $.type(obj), chain = this;
        if(arrayLike[type] &&  isFinite(obj.length)){
            obj = $.slice(obj);
            type = "Array";
        }
        if(adjustOne[type]){
            if(!(chain instanceof $.lang)){
                chain = new $.lang;
            }
            chain.target = obj;
            chain.type = type;
            return chain;
        }else{// undefined boolean null
            return obj
        }
    }

    $.lang.prototype = {
        constructor:$.lang,
        valueOf:function(){
            return this.target;
        },
        toString:function(){
            return this.target + "";
        }
    };

    var transform = function(method){
        return function(){
            [].unshift.call(arguments,this)
            return method.apply(null,arguments)
        }
    }
    var proto = $.lang.prototype;
    //构建语言链对象的四个重要工具:$.String, $.Array, $.Number, $.Object
    "String,Array,Number,Object".replace($.rword, function(type){
        $[type] = function(ext){
            Object.keys(ext).forEach(function(name){
                $[type][name] = ext[name];
                proto[name] = function(){
                    var target = this.target;
                    var method = target[name] || transform($[this.type][name]);
                    return method.apply(target, arguments);
                }
                proto[name+"X"] = function(){
                    var result = this[name].apply(this, arguments);
                    return $.lang(result) ;
                }
            });
        }
    });

    $.String({
        //判断一个字符串是否包含另一个字符
        contains: function(target, str, separator){
            return (separator) ? !!~(separator + target + separator).indexOf(separator + str + separator) : !!~target.indexOf(str);
        },
        //判定是否以给定字符串开头
        startsWith: function(target, str, ignorecase) {
            var start_str = target.substr(0, str.length);
            return ignorecase ? start_str.toLowerCase() === str.toLowerCase() :
            start_str === str;
        },
        //判定是否以给定字符串结尾
        endsWith: function(target, str, ignorecase) {
            var end_str = target.substring(target.length - str.length);
            return ignorecase ? end_str.toLowerCase() === str.toLowerCase() :
            end_str === str;
        },
        //得到字节长度
        byteLen:function(target){
            return target.replace(rascii,"--").length;
        },
        //是否为空白节点
        empty: function (target) {
            return target.valueOf() === '';
        },
        //判定字符串是否只有空白
        blank: function (target) {
            return /^\s*$/.test(target);
        },
        //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
        truncate :function(target, length, truncation) {
            length = length || 30;
            truncation = truncation === void(0) ? '...' : truncation;
            return target.length > length ?
            target.slice(0, length - truncation.length) + truncation : String(target);
        },
        //转换为驼峰风格
        camelize:function(target){
            return target.replace(/-([a-z])/g, function($0, $1){
                return $1.toUpperCase();
            });
        },
        //转换为连字符风格
        underscored: function(target) {
            return target.replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/\-/g, '_').toLowerCase();
        },
        //首字母大写
        capitalize: function(target){
            return target.charAt(0).toUpperCase() + target.substring(1).toLowerCase();
        },
        //转换为整数
        toInt: function(target, radix) {
            return parseInt(target, radix || 10);
        },
        //转换为小数
        toFloat: function(target) {
            return parseFloat(target);
        },
        //转换为十六进制
        toHex: function(target) {
            for (var i = 0, ret = ""; i < target.length; i++) {
                if (target.charCodeAt(i).toString(16).length < 2) {
                    ret += '\\x0' + target.charCodeAt(i).toString(16).toUpperCase() ;
                } else {
                    ret += '\\x' + target.charCodeAt(i).toString(16).toUpperCase() ;
                }
            }
            return ret;
        },
        //http://stevenlevithan.com/regex/xregexp/
        //将字符串安全格式化为正则表达式的源码
        escapeRegExp: function( target ){
            return target.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
        },

        //http://www.cnblogs.com/rubylouvre/archive/2010/02/09/1666165.html
        //在左边补上一些字符,默认为0
        padLeft: function( target, digits, filling, radix ){
            var num = target.toString(radix || 10);
            filling = filling || "0";
            while(num.length < digits){
                num= filling + num;
            }
            return num;
        },

        //在右边补上一些字符,默认为0
        padRight: function(target, digits, filling, radix){
            var num = target.toString(radix || 10);
            filling = filling || "0";
            while(num.length < digits){
                num +=  filling;
            }
            return num;
        },
        // http://www.cnblogs.com/rubylouvre/archive/2009/11/08/1598383.html
        times :function(target, n){
            var result = "";
            while (n > 0) {
                if (n & 1)
                    result += target;
                target += target;
                n >>= 1;
            }
            return result;
        }
    });

    $.Array({
        //深拷贝当前数组
        clone: function(target){
            var i = target.length, result = [];
            while (i--) result[i] = cloneOf(target[i]);
            return result;
        },
        //取得第一个元素或对它进行操作
        first: function(target, fn, scope){
            if($.type(fn,"Function")){
                for(var i=0, n = target.length; i < n; i++){
                    if(fn.call(scope,target[i],i,target)){
                        return target[i];
                    }
                }
                return null;
            }else{
                return target[0];
            }
        },
        //取得最后一个元素或对它进行操作
        last: function(target, fn, scope) {
            if($.type(fn,"Function")){
                for (var i=target.length-1; i > -1; i--) {
                    if (fn.call(scope, target[i], i, target)) {
                        return target[i];
                    }
                }
                return null;
            }else{
                return target[target.length-1];
            }
        },
        //判断数组是否包含此元素
        contains: function (target, item) {
            return !!~target.indexOf(item) ;
        },
        //http://msdn.microsoft.com/zh-cn/library/bb383786.aspx
        //移除 Array 对象中某个元素的第一个匹配项。
        remove: function (target, item) {
            var index = target.indexOf(item);
            if (~index ) return $.Array.removeAt(target, index);
            return null;
        },
        //移除 Array 对象中指定位置的元素。
        removeAt: function (target, index) {
            return target.splice(index, 1);
        },
        //对数组进行洗牌,但不影响原对象
        // Jonas Raoni Soares Silva http://jsfromhell.com/array/shuffle [v1.0]
        shuffle: function (target) {
            var shuff = target.concat(), j, x, i = shuff.length;
            for (; i > 0; j = parseInt(Math.random() * i), x = shuff[--i], shuff[i] = shuff[j], shuff[j] = x) {};
            return shuff;
        },
        //从数组中随机抽选一个元素出来
        random: function (target) {
            return $.Array.shuffle(target)[0];
        },
        //取得数字数组中值最小的元素
        min: function(target) {
            return Math.min.apply(0, target);
        },
        //取得数字数组中值最大的元素
        max: function(target) {
            return Math.max.apply(0, target);
        },
        //取得对象数组的每个元素的特定属性
        pluck:function(target, name){
            var result = [], prop;
            target.forEach(function(item){
                prop = item[name];
                if(prop != null)
                    result.push(prop);
            });
            return result;
        },
        //根据对象的某个属性进行排序
        sortBy: function(target, fn, scope) {
            var array =  target.map(function(item, index) {
                return {
                    el: item,
                    re: fn.call(scope, item, index)
                };
            }).sort(function(left, right) {
                var a = left.re, b = right.re;
                return a < b ? -1 : a > b ? 1 : 0;
            });
            return $.Array.pluck(array,'el');
        },
        // 以数组形式返回原数组中不为null与undefined的元素
        compact: function (target) {
            return target.filter(function (el) {
                return el != null;
            });
        },
        //取差集(补集)
        diff : function(target, array) {
            var result = target.slice();
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
        merge : function(target, array){
            var i = target.length, j = 0;
            for ( var n = array.length; j < n; j++ ) {
                target[ i++ ] = array[ j ];
            }
            target.length = i;
            return target;
        },
        //取并集
        union :function(target, array){
            $.Array.merge(target, array)
            return $.Array.unique(target);
        },
        //取交集
        intersect:function(target, array){
            return target.filter(function(n) {
                return ~array.indexOf(n);
            });
        },
        // 返回没有重复值的新数组
        unique: function (target) {
            var result = [];
                o:for(var i = 0, n = target.length; i < n; i++) {
                    for(var x = i + 1 ; x < n; x++) {
                        if(target[x] === target[i])
                            continue o;
                    }
                    result.push(target[i]);
                }
            return result;
        },
        //对数组进行平坦化处理，返回一个一维数组
        flatten: function(target) {
            var result = [],self = $.Array.flatten;
            target.forEach(function(item) {
                if ($.isArray(item)) {
                    result = result.concat(self(item));
                } else {
                    result.push(item);
                }
            });
            return result;
        }
    });

    var NumberExt = {
        times: function(target, fn, bind) {
            for (var i=0; i < target; i++)
                fn.call(bind, i);
            return target;
        },
        //确保数值在[n1,n2]闭区间之内,如果超出限界,则置换为离它最近的最大值或最小值
        constrain: function(target, n1, n2){
            var a = [n1, n2].sort();
            if(target < a[0]) target = a[0];
            if(target > a[1]) target = a[1];
            return target;
        },
        //求出距离原数最近的那个数
        nearer: function(target, n1, n2){
            var diff1 = Math.abs(target - n1),
            diff2 = Math.abs(target - n2);
            return diff1 < diff2 ? n1 : n2
        },
        upto: function(target, number, fn, scope) {
            for (var i=target+0; i <= number; i++)
                fn.call(scope, i);
            return target;
        },
        downto: function(target, number, fn, scope) {
            for (var i=target+0; i >= number; i--)
                fn.call(scope, i);
            return target;
        },
        round: function(target, base) {
            if (base) {
                base = Math.pow(10, base);
                return Math.round(target * base) / base;
            } else {
                return Math.round(target);
            }
        }
    }
    "padLeft,padRight".replace($.rword, function(name){
        NumberExt[name] = $.String[name];
    });
    "abs,acos,asin,atan,atan2,ceil,cos,exp,floor,log,pow,sin,sqrt,tan".replace($.rword,function(name){
        NumberExt[name] = Math[name];
    });
    $.Number(NumberExt);
    function cloneOf(item){
        var name = $.type(item);
        switch(name){
            case "Array":
            case "Object":
                return $[name].clone(item);
            default:
                return item;
        }
    }
    //使用深拷贝方法将多个对象或数组合并成一个
    function mergeOne(source, key, current){
        if(source[key] && typeof source[key] == "object"){
            $.Object.merge(source[key], current);
        }else {
            source[key] = cloneOf(current)
        }
        return source;
    };

    $.Object({
        //根据传入数组取当前对象相关的键值对组成一个新对象返回
        subset: function(target, props){
            var result = {};
            props.forEach(function(prop){
                result[prop] = target[prop];
            });
            return result;
        },
        //遍历对象的键值对
        forEach: function(target, fn, scope){
            Object.keys(target).forEach(function(name){
                fn.call(scope, target[name], name, target);
            }, target);
        },
        map: function(target, fn, scope){
            return Object.keys(target).map(function(name){
                fn.call(scope, target[name], name, target);
            }, target);
        },
        //进行深拷贝，返回一个新对象，如果是拷贝请使用$.mix
        clone: function(target){
            var clone = {};
            for (var key in target) {
                clone[key] = cloneOf(target[key]);
            }
            return clone;
        },
        merge: function(target, k, v){
            var obj, key;
            //为目标对象添加一个键值对
            if (typeof k === "string")
                return mergeOne(target, k, v);
            //合并多个对象
            for (var i = 1, n = arguments.length; i < n; i++){
                obj = arguments[i];
                for ( key in obj){
                    if(obj[key] !== void 0)
                        mergeOne(target, key, obj[key]);
                }
            }
            return target;
        },
        //去掉与传入参数相同的元素
        without: function(target, array) {
            var result = {}, key;
            for (key in target) {//相当于构建一个新对象，把不位于传入数组中的元素赋给它
                if (!~array.indexOf(key) ) {
                    result[key] = target[key];
                }
            }
            return result;
        }
    });
    return $.lang;
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
//2012.1.17 添加dump方法
//2012.1.20 重构$.String, $.Array, $.Number, $.Object, 让其变成一个函数
//2012.1.27 让$.String等对象上的方法全部变成静态方法
//2012.1.31 去掉$.Array.ensure，添加$.Array.merge
//键盘控制物体移动 http://www.wushen.biz/move/
//==========================================
// 特征嗅探模块 by 司徒正美
//==========================================
$.define("support", function(){
   // $.log("已加载特征嗅探模块");
    var global = this, DOC = global.document, div = DOC.createElement('div'),TAGS = "getElementsByTagName";
    div.setAttribute("className", "t");
    div.innerHTML = ' <link/><a href="/nasami"  style="float:left;opacity:.25;">d</a>'+
    '<object><param/></object><table></table><input type="checkbox"/>';
    var a = div[TAGS]("a")[0], style = a.style,
    select = DOC.createElement("select"),
    input = div[TAGS]( "input" )[ 0 ],
    opt = select.appendChild( DOC.createElement("option") );

    //true为正常，false为不正常
    var support = $.support = {
        //标准浏览器只有在table与tr之间不存在tbody的情况下添加tbody，而IE678则笨多了,即在里面为空也乱加tbody
        insertTbody: !div[TAGS]("tbody").length,
        // 在大多数游览器中checkbox的value默认为on，唯有chrome返回空字符串
        checkOn :  input.value === "on",
        //当为select添加一个新option元素时，此option会被选中，但IE与早期的safari却没有这样做,需要访问一下其父元素后才能让它处于选中状态（bug）
        optSelected: !!opt.selected,
        //IE67无法区分href属性与特性（bug）
        attrHref: a.getAttribute("href") === "/nasami",
        //IE67是没有style特性（特性的值的类型为文本），只有el.style（CSSStyleDeclaration）(bug)
        attrStyle: a.getAttribute("style") !== style,
        //对于一些特殊的特性，如class, for, char，IE67需要通过映射方式才能使用getAttribute才能取到值(bug)
        attrProp:div.className !== "t",
        //http://www.cnblogs.com/rubylouvre/archive/2010/05/16/1736535.html
        //是否能正确返回opacity的样式值，IE8返回".25" ，IE9pp2返回0.25，chrome等返回"0.25"
        cssOpacity: style.opacity == "0.25",
        //某些浏览器不支持w3c的cssFloat属性来获取浮动样式，而是使用独家的styleFloat属性
        cssFloat: !!style.cssFloat,
        //IE678的getElementByTagName("*")无法遍历出Object元素下的param元素（bug）
        traverseAll: !!div[TAGS]("param").length,
        //https://prototype.lighthouseapp.com/projects/8886/tickets/264-ie-can-t-create-link-elements-from-html-literals
        //IE678不能通过innerHTML生成link,style,script节点（bug）
        createAll: !!div[TAGS]("link").length,
        //IE6789由于无法识别HTML5的新标签，因此复制这些新元素时也不正确（bug）
        cloneHTML5: DOC.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>",
        //在标准浏览器下，cloneNode(true)是不复制事件的，以防止循环引用无法释放内存，而IE却没有考虑到这一点，把事件复制了（inconformity）
        cloneNode: true,
        //IE6789的innerHTML对于table,thead,tfoot,tbody,tr,col,colgroup,html,title,style,frameset是只读的（inconformity）
        innerHTML: false,
        //IE的insertAdjacentHTML与innerHTML一样，对于许多元素是只读的，另外FF8之前是不支持此API的
        insertAdjacentHTML: false,
        //是否支持createContextualFragment API，此方法发端于FF3，因此许多浏览器不支持或实现存在BUG，但它是将字符串转换为文档碎片的最高效手段
        fastFragment: false,
        //IE67不支持display:inline-block，需要通过hasLayout方法去模拟（bug）
        inlineBlock: true,
        //http://w3help.org/zh-cn/causes/RD1002
        //在IE678中，非替换元素在设置了大小与hasLayout的情况下，会将其父级元素撑大（inconformity）
        keepSize: true,
        //getComputedStyle API是否能支持将margin的百分比原始值自动转换为像素值
        cssPercentedMargin: true
    };
    //IE6789的checkbox、radio控件在cloneNode(true)后，新元素没有继承原来的checked属性（bug）
    input.checked = true;
    support.cloneChecked = (input.cloneNode( true ).checked === true);
    support.appendChecked = input.checked;
    //添加对optDisabled,cloneAll,insertAdjacentHTML,innerHTML,fastFragment的特征嗅探
    //判定disabled的select元素内部的option元素是否也有diabled属性，没有才是标准
    //这个特性用来获取select元素的value值，特别是当select渲染为多选框时，需要注意从中去除disabled的option元素，
    //但在Safari中，获取被设置为disabled的select的值时，由于所有option元素都被设置为disabled，会导致无法获取值。
    select.disabled = true;
    support.optDisabled = !opt.disabled;
    if ( !div.addEventListener && div.attachEvent && div.fireEvent ) {
        div.attachEvent("onclick", function click() {
            support.cloneNode = false;//w3c的节点复制是不复制事件的
            div.detachEvent("onclick", click);
        });
        div.cloneNode(true).fireEvent("onclick");
    }
    //判定insertAdjacentHTML是否完美，用于append,prepend,before,after等方法
    var table = div[TAGS]("table")[0]
    try{
        table.insertAdjacentHTML("afterBegin","<tr><td>1</td></tr>");
        support.insertAdjacentHTML = true;
    }catch(e){ }
    try{
        var range =  DOC.createRange();
        support.fastFragment = !!range.createContextualFragment("<a>")
    }catch(e){ };
    //判定innerHTML是否完美，用于html方法
    try{
        table.innerHTML = "<tr><td>1</td></tr>";
        support.innerHTML = true;
    }catch(e){};
    a = select = table = opt = style = null;
    $.require("ready",function(){
        //boxModel，inlineBlock，keepSize，cssPercentedMargin这些特征必须等到domReady后才能检测
        var body = DOC.body,
        testElement = div.cloneNode(false);
        testElement.style.cssText = "visibility:hidden;width:0;height:0;border:0;margin:0;background:none;padding:0;"
        testElement.appendChild( div );
        body.insertBefore( testElement, body.firstChild );
        //是否遵循w3c的盒子boxModel去计算元素的大小(IE存在怪异模式,inconformity)
        div.innerHTML = "";
        div.style.width = div.style.paddingLeft = "1px";
        support.boxModel = div.offsetWidth === 2;
        if ( typeof div.style.zoom !== "undefined"  ) {
            //IE7以下版本并不支持display: inline-block;样式，而是使用display: inline;
            //并通过其他样式触发其hasLayout形成一种伪inline-block的状态
            div.style.display = "inline";
            div.style.zoom = 1;
            support.inlineBlock = !(div.offsetWidth === 2);
            div.style.display = "";
            div.innerHTML = "<div style='width:4px;'></div>";
            support.keepSize = div.offsetWidth == 2;
            if( global.getComputedStyle ) {
                div.style.marginTop = "1%";
                support.cssPercentedMargin = ( global.getComputedStyle( div, null ) || {
                    marginTop: 0
                } ).marginTop !== "1%";
            }

        }
        body.removeChild( testElement );
        div = testElement = null;
    });
    return support;
});
/**
2011.9.7 优化attrProp判定
2011.9.16所有延时判定的部分现在可以立即判定了
2011.9.23增加fastFragment判定
2012.1.28有些特征嗅探必须连接到DOM树上才能进行
*/
//=========================================
// 类工厂模块
//==========================================
$.define("class", "lang",function(){
   // $.log("已加载class模块")
    var
    P = "prototype",  C = "constructor", I = "@init",S = "_super",
    unextend = $.oneObject([S,P, 'extend', 'implement','_class']),
    exclusive = new RegExp([S,I,C].join("|")),ron = /on([A-Z][A-Za-z]+)/,
    classOne = $.oneObject('Object,Array,Function');
    function expand(klass,props){
        'extend,implement'.replace($.rword, function(name){
            var modules = props[name];
            if(classOne[$.type(modules)]){
                klass[name].apply(klass,[].concat(modules));
                delete props[name];
            }
        });
        return klass
    }
    function setOptions(){
        [].unshift(arguments,this.options || {})
        var options = this.options = $.Object.merge.apply(null,arguments),key,match
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
    $["@class"] =  {
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
                $.mix(bridge, module);
            }
            for(var key in bridge){
                if(!unextend[key]){
                    this[key] =  bridge[key]
                }
            }
            return this;
        }
    };
    $.factory = function(obj){
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
        $.mix(klass,$["@class"]).inherit(parent, init);//添加更多类方法
        return expand(klass,obj).implement(obj);
    }
});

//2011.7.11
//dom["class"]改为dom["@class"]
//2011.7.25
//继承链与方法链被重新实现。
//在方法中调用父类的同名实例方法，由$super改为supermethod，保留父类的原型属性parent改为superclass
//2011.8.6
//在方法中调用父类的同名实例方法，由supermethod改为_super，保留父类的原型属性superclass改为_super
//重新实现方法链
//fix 子类实例不是父类的实例的bug
//2011.8.14 更改隐藏namespace,增强setOptions
//2011.10.7 include更名为implement 修复implement的BUG（能让人重写toString valueOf方法）
//2012.1.29  修正setOptions中$.Object.merge方法的调用方式


//==================================================
// 数据缓存模块
//==================================================
$.define("data", "lang", function(){
    //$.log("已加载data模块");
    var remitter = /object|function/
    $.mix( $, {
        memcache:{},
        // 读写数据
        data : function( target, name, data, pvt ) {
            if(target && remitter.test(typeof target)){//只处理HTML节点与普通对象
                var id = target.uniqueNumber || (target.uniqueNumber = $.uuid++);
                if(name === "@uuid"){
                    return id;
                }
                var memcache = target.nodeType === 1 ? $.memcache: target;
                var table = memcache[ "@data_"+id ] || (memcache[ "@data_"+id ] = {});
                if ( !pvt ) {
                    table = table.data || (table.data = {});
                }
                var getByName = typeof name === "string";
                if ( name && typeof name == "object" ) {
                    $.mix(table, name);
                }else if(getByName && data !== void 0){
                    table[ name ] = data;
                }
                return getByName ? table[ name ] : table;
            }
        },
        _data:function(target,name,data){
            return $.data(target, name, data, true)
        },
        //移除数据
        removeData : function(target, name, pvt){
            if(target && remitter.test(typeof target)){
                var id = target.uniqueNumber;
                if (  !id ) {
                    return;
                }
                var memcache = target.nodeType === 1  ? $.memcache : target;
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
            var srcData = $._data(src), neoData = $._data(neo), events = srcData.events;
            if(srcData && neoData){
                $.Object.merge(neoData, srcData);
                if(events){
                    delete neoData.handle;
                    neoData.events = {};
                    for ( var type in events ) {
                        for (var i = 0, obj ; obj =  events[ type ][i++]; ) {
                            $.event.bind.call( neo, type + ( obj.namespace ? "." : "" ) + obj.namespace, obj.handler, obj.selector, obj.times );
                        }
                    }
                }
            }
        }
    });
    
});

//2011.9.27 uniqueID改为uniqueNumber 简化data与removeData
//2011.9.28 添加$._data处理内部数据
//2011.10.21 强化mergeData，可以拷贝事件
//2012.1.31 简化$.Object.merge的调用

//$.query v5 开发代号Icarus
$.define("query", function(){
   // $.log("已加载选择器模块")
    var global = this, DOC = global.document;
    $.mix($,{
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
    var slice = Array.prototype.slice,
    makeArray = function ( nodes, result, flag_multi ) {  
        nodes = slice.call( nodes, 0 );
        if ( result ) {
            result.push.apply( result, nodes );
        }else{
            result = nodes;
        }
        return  flag_multi ? $.unique(result) : result;
    };
    //IE56789无法使用数组方法转换节点集合
    try {
        slice.call( $.html.childNodes, 0 )[0].nodeType;
    } catch( e ) {
        makeArray = function ( nodes, result ,flag_multi) {
            var ret = result || [], ri = ret.length;
            for(var i = 0,el ; el = nodes[i++];){
                ret[ri++] = el
            }
            return flag_multi ? $.unique(ret) : ret;
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
                        var uid = $.getUid(node);
                           
                        if (!uniqResult[uid]) {
                            uniqResult[uid] = elems[ri++] = node;
                        }
                    }
                }
                return elems;
        }
    }
    //IE9 以下的XML文档不能直接设置自定义属性
    var attrURL = $.oneObject('action,cite,codebase,data,href,longdesc,lowsrc,src,usemap', 2);
    var bools = $["@bools"] = "autofocus,autoplay,async,checked,controls,declare,disabled,defer,defaultChecked,"+
    "contentEditable,ismap,loop,multiple,noshade,open,noresize,readOnly,selected"
    var boolOne = $.oneObject(bools.toLowerCase() );
        
    //检测各种BUG（fixGetAttribute，fixHasAttribute，fixById，fixByTag）
    var fixGetAttribute,fixHasAttribute,fixById,fixByTag;
    var getHTMLText = new Function("els","return els[0]."+ ($.html.textContent ? "textContent" : "innerText") );

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
            nodeType === 1 ? $.getUid(node) :
            nodeType === 8 ? comments.push(node) : 0;  
        }
        while ( (node = comments[j++]) ) {   
            node.parentNode.removeChild(node);
        }
        fixHasAttribute = select.hasAttribute ? !option.hasAttribute('selected') :true;
        
        var form = DOC.createElement("div"),
        id = "fixId" + (new Date()).getTime(),
        root = $.html;
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
    var Icarus = $.query = function(expr, contexts, result, lastResult, flag_xml,flag_multi,flag_dirty){
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
        flag_xml = flag_xml !== void 0 ? flag_xml : $.isXML(doc);
       
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
                //基于document的查找是不安全的，因为生成的节点可能还没有加入DOM树，比如$("<div id=\"A'B~C.D[E]\"><p>foo</p></div>").find("p")
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
                                        uid = $.getUid(node);
                                        if (uniqResult[uid]){
                                            break;
                                        }else {
                                            uniqResult[uid] = elems[ri++] = node;
                                        }
                                    }
                                }
                            }
                            elems = $.unique(elems);
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
    var onePosition = $.oneObject("eq|gt|lt|first|last|even|odd".split("|"));

    $.mix(Icarus, {
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
                    var pid =  $.getUid(parent);
                    if (!lock[pid]){
                        count = lock[pid] = 1;
                        var checkValue = ofType ? el.nodeName : 1;
                        for(var node = parent[child];node;node = node[sibling]){
                            if(node[checkName] === checkValue){
                                pid = $.getUid(node);
                                cache[pid] = count++;
                            }
                        }
                    }
                    diff = cache[$.getUid(el)] - b;
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
                    checked[$.getUid(elem) ] = 1;
                for (i = 0; elem = elems[i++]; )
                    if (checked[$.getUid(elem)] ^ flag_not)
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
                var res = [], elem = elems[0], fn = flags.xml ? $.getText: getHTMLText,
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
            return !!$.query(expr,[el]).length;
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

    "text,radio,checkbox,file,password,submit,image,reset".replace($.rword, function(name){
        Icarus.pseudoAdapter[name] = function(el){
            return (el.getAttribute("type") || el.type) === name;//避开HTML5新增类型导致的BUG，不直接使用el.type === name;
        }
    });
       
});

//2011.10.25重构$.unique
//2011.10.26支持对拥有name值为id的控件的表单元素的查找，添加labed语句，让元素不存在时更快跳出主循环
//2011.10.30让属性选择器支持拥有多个中括号与转义符的属性表达式，如‘input[name=brackets\\[5\\]\\[\\]]’
//2011.10.31重构属性选择器处理无操作部分，使用hasAttribute来判定用户是否显示使用此属性，并支持checked, selected, disabled等布尔属性
//2011.10.31重构关系选择器部分，让后代选择器也出现在switch分支中
//2011.11.1 重构子元素过滤伪类的两个生成函数filterPseudoHasExp filterPseudoNoExp
//2011.11.2 FIX处理 -of-type家族的BUG
//2011.11.3 添加getAttribute hasAttribute API
//2011.11.4 属性选择器对给出值或属性值为空字符串时进行快速过滤
//2011.11.5 添加getElementsByXpath 增加对XML的支持
//2011.11.6 重构getElementsByTagName 支持带命名空间的tagName
//2011.11.6 处理IE67与opera9在getElementById中的BUG
//2011.11.7 支持多上下文,对IE678的注释节点进行清除,优化querySelectorAll的使用
//2011.11.8 处理分解nth-child参数的BUG，修正IE67下getAttribute对input[type=search]的支持，重构sortOrder标准浏览器的部分
//调整swich...case中属性选择器的分支，因为reg_sequence允许出现"[  "的情况，因此会匹配不到，需要改为default
//修改属性选择器$=的判定，原先attr.indexOf(val) == attr.length - val.length，会导致"PWD".indexOf("bar]")也有true
//2011.11.9 增加getText 重构 getElementById与过滤ID部分
//2011.11.10 exec一律改为match,对parseNth的结果进行缓存



$.define( "node", "lang,support,class,query,data,ready",function( lang, support ){
    // $.log("已加载node模块");
    var rtag = /^[a-zA-Z]+$/, TAGS = "getElementsByTagName", merge = $.Array.merge;
    if( !support.cloneHTML5 ){
        "abbr,article,aside,audio,bdi,canvas,data,datalist,details,figcaption,figure,footer," +
        "header,hgroup,mark,meter,nav,output,progress,section,summary,time,video".replace( $.rword, function( tag ){
            document.createElement( tag );////让IE6789支持HTML5的新标签
        });
    }
    function getDoc(){
        for( var i  = 0 , el; i < arguments.length; i++ ){
            if( el = arguments[ i ] ){
                if( el.nodeType ){
                    return el.nodeType === 9 ? el : el.ownerDocument;
                }else if( el.setTimeout ){
                    return el.document;
                }
            }
        }
        return document;
    }
    $.mix( $, $[ "@class" ] ).implement({
        init:function( expr, context ){
            // 分支1: 处理空白字符串,null,undefined参数
            if ( !expr ) {
                return this;
            }
            //分支2:  让$实例与元素节点一样拥有ownerDocument属性
            var doc, nodes;//用作节点搜索的起点
            if(/Array|NodeList|String/.test( $.type(context) )|| context && context.mass){//typeof context === "string"
                return $( context ).find( expr );
            }
            if ( expr.nodeType ) { //分支3:  处理节点参数
                this.ownerDocument  = expr.nodeType === 9 ? expr : expr.ownerDocument;
                return merge( this, [expr] );
            }
            this.selector = expr + "";
            if ( expr === "body" && !context && document.body ) {//分支4:  body
                this.ownerDocument = document;
                merge( this, [ document.body ] );
                return this.selector = "body";
            }
            if ( typeof expr === "string" ) {
                doc = this.ownerDocument = !context ? document : getDoc( context, context[0] );
                var scope = context || doc;
                if ( expr.charAt(0) === "<" && expr.charAt( expr.length - 1 ) === ">" && expr.length >= 3 ) {
                    nodes = $.parseHTML( expr, doc );//分支5: 动态生成新节点
                    nodes = nodes.childNodes;
                } else if( rtag.test( expr ) ){//分支6: getElementsByTagName
                    nodes  = scope[ TAGS ]( expr ) ;
                } else{//分支7：进入选择器模块
                    nodes  = $.query( expr, scope );
                }
                return merge( this, nodes );
            }else {//分支8：处理数组，节点集合或者mass对象或window对象
                this.ownerDocument = getDoc( expr[0] );
                merge( this, $.isArrayLike(expr) ? expr : [ expr ]);
                delete this.selector;
            }
        },
        mass: '1.0',
        length: 0,
        valueOf: function(){
            return Array.prototype.slice.call( this );
        },
        toString: function(){
            var i = this.length, ret = [], getType = $.type;
            while(i--){
                ret[i] = getType( this[i] );
            }
            return ret.join(", ");
        },
        labor: function( nodes ){
            var neo = new $;
            neo.context = this.context;
            neo.selector = this.selector;
            neo.ownerDocument = this.ownerDocument;
            return merge( neo, nodes || [] );
        },
        slice: function( a, b ){
            return this.labor( $.slice(this, a, b) );
        },
        get: function( num ) {
            return num == null ? this.valueOf() : this[ num < 0 ? this.length + num : num ];
        },
        eq: function( i ) {
            return i === -1 ? this.slice( i ) :this.slice( i, +i + 1 );
        },

        gt:function( i ){
            return this.slice( i+1, this.length );
        },
        lt:function( i ){
            return this.slice( 0, i );
        },
        first: function() {
            return this.slice( 0,1 );
        },
        even: function() {
            return this.labor( this.valueOf().filter(function( _, i ) {
                return i % 2 === 0;
            }));
        },
        odd: function() {
            return this.labor( this.valueOf().filter(function( _, i ) {
                return i % 2 === 1;
            }));
        },
        last: function() {
            return this.slice( -1 );
        },
        each: function( fn ){
            for ( var i = 0, n = this.length; i < n; i++ ) {
                fn.call( this[i], this[i], i );
            }
            return this;
        },
        map: function( fn ) {
            return this.labor( this.collect( fn ) );
        },
        collect: function( fn ){
            for ( var i = 0, ret = [], n = this.length; i < n; i++ ) {
                ret.push( fn.call( this[ i ], this[ i ], i ));
            }
            return ret
        },

        clone: function( dataAndEvents, deepDataAndEvents ) {
            dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
            deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
            return this.map( function () {
                return cloneNode( this,  dataAndEvents, deepDataAndEvents );
            });
        },

        //取得或设置节点的innerHTML属性
        html: function( item ){
            return $.access(this, 0, item, function( el ){//getter
                if ( el && (el.nodeType === 1 || /xml/i.test(el.nodeName)) ) {//处理IE的XML数据岛
                    return "innerHTML" in el ? el.innerHTML : innerHTML(el)
                }
                return null;
            }, function(){//setter
                item = (item || "")+""
                if ( support.innerHTML && (!rcreate.test(item) && !rnest.test(item)) ) {
                    try {
                        for ( var i = 0, node; node = this[ i++ ]; ) {
                            if ( node.nodeType === 1 ) {
                                $.slice( node[TAGS]("*") ).forEach( cleanNode );
                                node.innerHTML = item;
                            }
                        }
                        return;
                    } catch(e) {};
                }
                this.empty().append( item );
            });
        },
        // 取得或设置节点的text或innerText或textContent属性
        text: function( item ){
            return $.access(this, 0, item, function( el ){//getter
                if( !el ){
                    return "";
                }else if(el.tagName == "OPTION" || el.tagName === "SCRIPT"){
                    return el.text;
                }
                return el.textContent || el.innerText || $.getText( [el] );
            }, function(){//setter
                this.empty().append( this.ownerDocument.createTextNode( item ));
            });
        },
        // 取得或设置节点的outerHTML
        outerHTML: function( item ){
            return $.access(this, 0, item, function( el ){
                if( el && el.nodeType === 1 ){
                    return "outerHTML" in el ? el.outerHTML :outerHTML( el );
                }
                return null;
            }, function( ){
                this.empty().replace( item );
            });
        }
    });
    $.fn = $.prototype;
    $.fn.init.prototype = $.fn;
    "remove,empty".replace( $.rword, function( method ){
        $.fn[ method ] = function(){
            var isRemove = method === "remove";
            for ( var i = 0, node; node = this[i++]; ){
                if(node.nodeType === 1){
                    //移除匹配元素
                    $.slice( node[ TAGS ]("*") ).concat( isRemove ? node : [] ).forEach( cleanNode );
                }
                if( isRemove ){
                    if ( node.parentNode ) {
                        node.parentNode.removeChild( node );
                    }
                }else{
                    while ( node.firstChild ) {
                        node.removeChild( node.firstChild );
                    }
                }
            }
            return this;
        }
    });
    //前导 前置 追加 后放 替换
    "append,prepend,before,after,replace".replace( $.rword, function( method ){
        $.fn[ method ] = function( item ){
            return manipulate( this, method, item, this.ownerDocument );
        }
        $.fn[ method+"To" ] = function( item ){
            $( item, this.ownerDocument )[ method ]( this );
            return this;
        }
    });

    var HTML = $.html;
    var commonRange = document.createRange && document.createRange();
    var matchesAPI = HTML.matchesSelector || HTML.mozMatchesSelector || HTML.webkitMatchesSelector || HTML.msMatchesSelector;
    $.extend({
        match: function( node, expr, i ){
            if( $.type( expr, "Function" ) ){
                return expr.call( node, node, i );
            }
            try{
                return matchesAPI.call( node, expr );
            } catch(e) {
                var parent = node.parentNode;
                if( parent ){
                    var array = $.query( expr, parent );
                    return !!( array.length && array.indexOf( node ) )
                }
                return false;
            }
        },
        //用于统一配置多态方法的读写访问，涉及方法有text, html, outerHTML, data, attr, prop, value
        access: function( elems, key, value, getter, setter ) {
            var length = elems.length;
            setter = setter || getter;
            //为所有元素设置N个属性
            if ( typeof key === "object" ) {
                for ( var k in key ) {
                    for ( var i = 0; i < length; i++ ) {
                        setter( elems[i], k, key[ k ] );
                    }
                }
                return elems;
            }
            if ( value !== void 0 ) {
                if( key === 0 ){
                    setter.call( elems, value );
                }else{
                    for ( i = 0; i < length; i++ ) {
                        setter( elems[i], key, value );
                    }
                }
                return elems;
            }
            //取得第一个元素的属性
            return length ? getter( elems[0], key ) : void 0;
        },
        /**
         * 将字符串转换为文档碎片，如果没有传入文档碎片，自行创建一个
         * 有关innerHTML与createElement创建节点的效率可见<a href="http://andrew.hedges.name/experiments/innerhtml/">这里</a><br/>
         * 注意，它能执行元素的内联事件，如<br/>
         * <pre><code>$.parseHTML("<img src=1 onerror=alert(22) />")</code></pre>
         * @param {String} html 要转换为节点的字符串
         * @param {Document} doc 可选
         * @return {FragmentDocument}
         */
        parseHTML: function( html, doc ){
            doc = doc || this.nodeType === 9  && this || document;
            html = html.replace( rxhtml, "<$1></$2>" ).trim();
            //尝试使用createContextualFragment获取更高的效率
            //http://www.cnblogs.com/rubylouvre/archive/2011/04/15/2016800.html
            if( support.fastFragment && doc === document && doc.body && !rcreate.test(html) && !rnest.test(html) ){
                commonRange.selectNodeContents(doc.body);//fix opera(9.2~11.51) bug,必须对文档进行选取
                return commonRange.createContextualFragment( html );
            }
            if( !support.createAll ){//fix IE
                html = html.replace(rcreate,"<br class='fix_create_all'/>$1");//在link style script等标签之前添加一个补丁
            }
            var tag = (rtagName.exec( html ) || ["", ""])[1].toLowerCase(),//取得其标签名
            wrap = translations[ tag ] || translations._default,
            fragment = doc.createDocumentFragment(),
            wrapper = doc.createElement("div"), firstChild;
            wrapper.innerHTML = wrap[1] + html + wrap[2];
            var els = wrapper[ TAGS ]("script");
            if( els.length ){//使用innerHTML生成的script节点不会发出请求与执行text属性
                var script = doc.createElement("script"), neo;
                for ( var i = 0, el; el = els[ i++ ]; ){
                    if ( !el.type || types[ el.type ] ){//如果script节点的MIME能让其执行脚本
                        neo = script.cloneNode(false);//FF不能省略参数
                        for ( var j = 0, attr; attr = el.attributes[ j++ ]; ){
                            if( attr.specified ){//复制其属性
                                neo[ attr.name ] = [ attr.value ];
                            }
                        }
                        neo.text = el.text;//必须指定,因为无法在attributes中遍历出来
                        el.parentNode.replaceChild( neo, el );//替换节点
                    }
                }
            }
            //移除我们为了符合套嵌关系而添加的标签
            for ( i = wrap[0]; i--;wrapper = wrapper.lastChild ){};
            //在IE6中,当我们在处理colgroup, thead, tfoot, table时会发生成一个tbody标签
            if( !support.insertTbody ){
                var noTbody = !rtbody.test( html ); //矛:html本身就不存在<tbody字样
                els = wrapper[ TAGS ]( "tbody" );
                if ( els.length > 0 && noTbody ){//盾：实际上生成的NodeList中存在tbody节点
                    for ( i = 0; el = els[ i++ ]; ) {
                        if(!el.childNodes.length )//如果是自动插入的里面肯定没有内容
                            el.parentNode.removeChild( el );
                    }
                }
            }
            if( !support.createAll ){//移除所有补丁
                for( els = wrapper[ TAGS ]( "br" ), i = 0; el = els[ i++ ]; ) {
                    if( el.className && el.className === "fix_create_all" ) {
                        el.parentNode.removeChild(el);
                    }
                }
            }
            if( !support.appendChecked ){//IE67没有为它们添加defaultChecked
                for( els = wrapper[ TAGS ]( "input" ), i = 0; el = els[ i++ ]; ) {
                    if ( el.type === "checkbox" || el.type === "radio" ) {
                        el.defaultChecked = el.checked;
                    }
                }
            }
            while( firstChild = wrapper.firstChild ){ // 将wrapper上的节点转移到文档碎片上！
                fragment.appendChild( firstChild );
            }
            return fragment;
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
    types = $.oneObject("text/javascript","text/ecmascript","application/ecmascript","application/javascript","text/vbscript"),
    //需要处理套嵌关系的标签
    rnest = /<(?:td|th|tf|tr|col|opt|leg|cap|area)/,adjacent = "insertAdjacentHTML",
    insertApapter = {
        prepend: function( el, node ){
            el.insertBefore( node, el.firstChild );
        },
        append: function( el, node ){
            el.appendChild( node );
        },
        before: function( el, node ){
            el.parentNode.insertBefore( node, el );
        },
        after: function( el, node ){
            el.parentNode.insertBefore( node, el.nextSibling );
        },
        replace: function( el, node ){
            el.parentNode.replaceChild( node, el );
        },
        prepend2: function( el, html ){
            el[adjacent]( "afterBegin", html );
        },
        append2: function( el, html ){
            el[adjacent]( "beforeEnd", html );
        },
        before2: function( el, html ){
            el[adjacent]( "beforeBegin", html );
        },
        after2: function( el, html ){
            el[adjacent]( "afterEnd", html );
        }
    };
    var insertAdjacentNode = function( elems, fn, item ){
        for( var i = 0, el; el = elems[i]; i++ ){//第一个不用复制，其他要
            fn( el, i ? cloneNode( item, true, true) : item );
        }
    }
    var insertAdjacentHTML = function( elems, slowInsert, fragment, fast, fastInsert, html ){
        for(var i = 0, el; el = elems[ i++ ];){
            if( fast ){
                fastInsert( el, html );
            }else{
                slowInsert( el, fragment.cloneNode(true) );
            }
        }
    }
    var insertAdjacentFragment = function( elems, fn, item, doc ){
        var fragment = doc.createDocumentFragment();
        for( var i = 0, el; el = elems[ i++ ]; ){
            fn( el, makeFragment( item, fragment, i > 1 ) );
        }
    }
    var makeFragment = function( nodes, fragment, bool ){
        //只有非NodeList的情况下我们才为i递增;
        var ret = fragment.cloneNode(false), go= !nodes.item;
        for( var i = 0, node; node = nodes[i]; go && i++ ){
            ret.appendChild( bool && cloneNode(node, true, true) || node );
        }
        return ret;
    }
    /**
     * 实现insertAdjacentHTML的增强版
     * @param {mass}  nodes mass实例
     * @param {String} type 方法名
     * @param {Any}  item 插入内容或替换内容,可以为HTML字符串片断，元素节点，文本节点，文档碎片或mass对象
     * @param {Document}  doc 执行环境所在的文档
     * @return {mass} 还是刚才的mass实例
     */
    function manipulate( nodes, type, item, doc ){
        var elems = $.slice( nodes ).filter(function( el ){
            return el.nodeType === 1;//转换为纯净的元素节点数组
        });
        if( item.nodeType ){
            //如果是传入元素节点或文本节点或文档碎片
            insertAdjacentNode( elems, insertApapter[type], item );
        }else if( typeof item === "string" ){
            //如果传入的是字符串片断
            var fragment = $.parseHTML( item, doc ),
            //如果方法名不是replace并且完美支持insertAdjacentHTML并且不存在套嵌关系的标签
            fast = (type !== "replace") && support[ adjacent ] && !rnest.test(item);
            insertAdjacentHTML( elems, insertApapter[ type ], fragment, fast, insertApapter[ type+"2" ], item ) ;
        }else if( item.length ) {
            //如果传入的是HTMLCollection nodeList mass实例，将转换为文档碎片
            insertAdjacentFragment( elems, insertApapter[ type ], item, doc ) ;
        }
        return nodes;
    }
    $.implement({
        data: function( key, item ){
            return $.access( this, key, item, function( el, key ){
                return  $.data( el, key );
            }, function( el, key, item ){
                $.data( el, key, item );
            })
        },
        removeData: function( key, pv ) {
            return this.each(function() {
                $.removeData( this, key, pv );
            });
        }
    });
    //======================================================================
    //复制与移除节点时的一些辅助函数
    //======================================================================
    function cleanNode( node ){
        node.uniqueNumber && $.removeData(node);
        node.clearAttributes && node.clearAttributes();
    }
    function shimCloneNode( outerHTML ) {
        var div = document.createElement( "div" );
        div.innerHTML = outerHTML;
        return div.firstChild;
    }
    var unknownTag = "<?XML:NAMESPACE"
    function cloneNode( node, dataAndEvents, deepDataAndEvents ) {
        var outerHTML = node.outerHTML;
        //这个判定必须这么长：判定是否能克隆新标签，判定是否为元素节点, 判定是否为新标签
        var neo = !support.cloneHTML5 && node.outerHTML && (outerHTML.indexOf( unknownTag ) === 0) ?
        shimCloneNode( outerHTML ): node.cloneNode(true), src, neos, i;
        //   处理IE6-8下复制事件时一系列错误
        if( node.nodeType === 1 ){
            if(!support.cloneNode ){
                fixNode( neo, node );
                src = node[ TAGS ]( "*" );
                neos = neo[ TAGS ]( "*" );
                for ( i = 0; src[i]; i++ ) {
                    fixNode( neos[i] ,src[i] );
                }
            }
            // 复制自定义属性，事件也被当作一种特殊的能活动的数据
            if ( dataAndEvents ) {
                $.mergeData( neo, node );
                if ( deepDataAndEvents ) {
                    src =  node[ TAGS ]( "*" );
                    neos = neo[ TAGS ]( "*" );
                    for ( i = 0; src[i]; i++ ) {
                        $.mergeData( neos[i] ,src[i] );
                    }
                }
            }
            src = neos = null;
        }
        return neo;
    }
    //修正IE下对数据克隆时出现的一系列问题
    function fixNode( clone, src ) {
        if( src.nodeType == 1 ){
            //只处理元素节点
            var nodeName = clone.nodeName.toLowerCase();
            //clearAttributes方法可以清除元素的所有属性值，如style样式，或者class属性，与attachEvent绑定上去的事件
            clone.clearAttributes();
            //复制原对象的属性到克隆体中,但不包含原来的事件
            clone.mergeAttributes( src );
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
    function outerHTML( el ){
        switch( el.nodeType+"" ){
            case "1":
            case "9":
                return "xml" in el ?  el.xml: new XMLSerializer().serializeToString( el );
            case "3":
            case "4":
                return el.nodeValue;
            case "8":
                return "<!--"+el.nodeValue+"-->";
        }
    }
    function innerHTML( el ){
        for( var i = 0, c, ret = []; c = el.childNodes[ i++ ]; ){
            ret.push( outerHTML(c) );
        }
        return ret.join( "" );
    }

    $.implement({
        //取得当前匹配节点的所有匹配expr的后代，组成新mass实例返回。
        find: function( expr ){
            return this.labor( $.query( expr, this ) );
        },
        //取得当前匹配节点的所有匹配expr的节点，组成新mass实例返回。
        filter: function( expr ){
            return this.labor( filterhElement(this.valueOf(), expr, this.ownerDocument, false) );
        },
        //取得当前匹配节点的所有不匹配expr的节点，组成新mass实例返回。
        not: function( expr ){
            return this.labor( filterhElement(this.valueOf(), expr, this.ownerDocument, true) );
        },
        //判定当前匹配节点是否匹配给定选择器，DOM元素，或者mass对象
        is: function( expr ){
            var nodes = $.query( expr, this.ownerDocument ), obj = {}, uid;
            for( var i = 0 , node; node = nodes[ i++ ];){
                uid = $.getUid(node);
                obj[uid] = 1;
            }
            return $.slice(this).some(function( el ){
                return  obj[ $.getUid(el) ];
            });
        },
        //取得匹配节点中那些后代中能匹配给定CSS表达式的节点，组成新mass实例返回。
        has: function( expr ) {
            var nodes = $( expr, this.ownerDocument );
            return this.filter(function() {
                for ( var i = 0, node; node = nodes[ i++ ]; ) {
                    if ( $.contains( this, node ) ) {//a包含b
                        return true;
                    }
                }
            });
        },
        closest: function( expr, context ) {
            var nodes = $( expr, context || this.ownerDocument ).valueOf();
            //遍历原mass对象的节点
            for ( var i = 0, ret = [], cur; cur = this[i++]; ) {
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
            ret = ret.length > 1 ? $.unique( ret ) : ret;
            //将节点集合重新包装成一个新jQuery对象返回
            return this.labor( ret );
        },
        index: function( expr ){
            var first = this[0]
            if ( !expr ) {//如果没有参数，返回第一元素位于其兄弟的位置
                return ( first && first.parentNode ) ? this.prevAll().length : -1;
            }
            // 返回第一个元素在新实例中的位置
            if ( typeof el === "string" ) {
                return $( expr ).index( first );
            }
            // 返回传入元素（如果是mass实例则取其第一个元素）位于原实例的位置
            return this.valueOf().indexOf( expr.mass? expr[0]: expr );
        }
    });

    function filterhElement( nodes, expr, doc, not ) {
        var ret = [];
        not = !!not;
        if( typeof expr === "string" ){
            var fit = $.query( expr, doc );
            nodes.forEach(function( node ) {
                if( node.nodeType === 1 ){
                    if( ( fit.indexOf( node ) !== -1 ) ^ not ){
                        ret.push( node );
                    }
                }
            });
        }else if( $.type(expr, "Function") ){
            return nodes.filter(function( node, i ){
                return !!expr.call( node, node, i ) ^ not;
            });
        }else if( expr.nodeType ){
            return nodes.filter(function( node ){
                return (node === expr) ^ not;
            });
        }
        return ret;
    }
    var uniqOne = $.oneObject("children", "contents" ,"next", "prev");
    function travel( el, prop, expr ) {
        var result = [], ri = 0;
        while(( el = el[ prop ] )){
            if( el && el.nodeType === 1){
                result[ ri++ ] = el;
                if(expr === true){
                    break;
                }else if( typeof expr === "string" && $( el ).is( expr ) ){
                    result.pop();
                    break;
                }
            }
        }
        return result;
    };

    lang({
        parent: function( el ){
            var parent = el.parentNode;
            return parent && parent.nodeType !== 11 ? parent: [];
        },
        parents: function( el ){
            return travel( el, "parentNode" ).reverse();
        },
        parentsUntil: function( el, expr ){
            return travel( el, "parentNode", expr ).reverse();
        },
        next: function( el ){
            return travel( el, "nextSibling", true );
        },
        nextAll: function( el ){
            return travel( el, "nextSibling" );
        },
        nextUntil: function( el, expr ){
            return travel( el, "nextSibling", expr );
        },
        prev: function( el ){
            return travel( el, "previousSibling", true );
        },
        prevAll : function( el ){
            return travel( el, "previousSibling" ).reverse();
        },
        prevUntil: function( el, expr ){
            return travel( el, "previousSibling", expr ).reverse();
        },
        children: function( el ){
            return  el.children ? $.slice( el.children ) :
            lang( el.childNodes ).filter(function( node ){
                return node.nodeType === 1;
            });
        },
        siblings: function( el ){
            return travel( el, "previousSibling" ).reverse().concat(travel(el,"nextSibling"));
        },
        contents: function( el ){
            return el.tagName === "IFRAME" ?
            el.contentDocument || el.contentWindow.document :
            $.slice( el.childNodes );
        }
    }).forEach(function( method, name ){
        $.fn[ name ] = function( expr ){
            var nodes = [];
            $.slice(this).forEach(function( el ){
                nodes = nodes.concat( method( el, expr ) );
            });
            if( /Until/.test( name ) ){
                expr = null
            }
            nodes = this.length > 1 && !uniqOne[ name ] ? $.unique( nodes ) : nodes;
            var neo = this.labor(nodes);
            return expr ? neo.filter( expr ) : neo;
        };
    });
});

/*
2011.7.11 dom["class"]改为dom["@class"]
2011.7.26 对init与parseHTML进行重构
2011.9.22 去掉isInDomTree 重构cloneNode,manipulate,parseHTML
2011.10.7 移除isFormElement
2011.10.9 将遍历模块合并到节点模块
2011.10.12 重构index closest
2011.10.20 修复rid的BUG
2011.10.21 添加even odd这两个切片方法 重构html方法
2011.10.23 增加rcheckEls成员,它是一个成员
2011.10.27 修正init方法中doc的指向错误
由 doc = this.ownerDocument = expr.ownerDocument || expr.nodeType == 9 && expr || document 改为
doc = this.ownerDocument =  scope.ownerDocument || scope ;
2011.10.29 优化$.parseHTML 在IE6789下去掉所有为修正createAll特性而添加的补丁元素
（原来是添加一个文本节点\u200b，而现在是<br class="fix_create_all"/>）
/http://d.hatena.ne.jp/edvakf/20100205/1265338487
2011.11.5 添加get方法 init的context参数可以是类数组对象
2011.11.6 outerHTML支持对文档对象的处理，html可以取得XML数据岛的innerHTML,修正init中scope与ownerDocument的取得
2011.11.7 重构find， 支持不插入文档的节点集合查找
 *
 */
/*
 * 样式操作模块的补丁模块
 */
$.define("css_fix", !!top.getComputedStyle, function(){
   // $.log("已加载css_fix模块");
    var adapter = $.cssAdapter = {};
    //=========================　处理　opacity　=========================
    var  ropacity = /opacity=([^)]*)/i,  ralpha = /alpha\([^)]*\)/i,
    rnumpx = /^-?\d+(?:px)?$/i, rnum = /^-?\d/;
    adapter[ "opacity:get" ] = function( node, op ){
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
    //金丝楠木是皇家专用木材，一般只有皇帝可以使用做梓宫。
    adapter[ "opacity:set" ] = function( node, _, value ){
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
    }
    var runselectable = /^(br|input|link|meta|hr|col|area|base|hr|embed|param|iframe|textarea|input|select|script|noscript)/i
    adapter[ "userSelect:set" ] = function( node, name, value ) {
        if(!runselectable.test(node.nodeName)){//跳过不显示的标签与表单控件
            var allow = /none/.test(value||"all");
            node.unselectable  = allow ? "" : "on";
            node.onselectstart = allow ? "" : function(){
                return false;
            };
        }
    };
    var ie8 = !!top.XDomainRequest,
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
        if( ret == "medium" ){
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
    $.transform = function( node, param ){
        var meta = $._data(node,"transform"), ident  = "DXImageTransform.Microsoft.Matrix",arr = [1,0,0,1,0,0], m
        if(!meta){
            //http://msdn.microsoft.com/en-us/library/ms533014(v=vs.85).aspx
            m = node.filters ? node.filters[ident] : 0;
            arr = m ? [m.M11, m.M12, m.M21, m.M22, m.Dx, m.Dy] : arr;
            meta = $._toMatrixObject(arr);
            meta.rotate = - meta.rotate;
            //保存到缓存系统，省得每次都计算
            $._data(node,"transform",meta);
        }
        if(arguments.length === 1){
            return meta;//getter
        }
        //setter
        meta = $._data(node,"transform",{
            scaleX:     param.scaleX     === void 0 ? meta.scaleX     : param.scaleX,
            scaleY:     param.scaleY     === void 0 ? meta.scaleY     : param.scaleY,
            rotate:     param.rotate     === void 0 ? meta.rotate     : param.rotate,
            translateX: param.translateX === void 0 ? meta.translateX : parseInt(param.translateX)|0,
            translateY: param.translateY === void 0 ? meta.translateY : parseInt(param.translateY)|0
        });

        //注意：IE滤镜和其他浏览器定义的角度方向相反
        var r = -$.all2rad(meta.rotate),
        cos  = Math.cos(r ), sin = Math.sin(r),
        mtx   = [ 
        cos * meta.scaleX,  sin * meta.scaleX, 0,
        -sin * meta.scaleY, cos * meta.scaleY, 0,
        meta.translateX,    meta.translateY,   1],
        cxcy= $._data(node,"cxcy");
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
            cxcy =  $._data(node,"cxcy", {
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
//2011.10.21 去掉opacity:setter 的style.visibility处理
//2011.11.21 将IE的矩阵滤镜的相应代码转移到这里

//=========================================
// 样式操作模块 by 司徒正美
//=========================================
$.define( "css", !!top.getComputedStyle ? "node" : "node,css_fix" , function(){
    //$.log( "已加载css模块" );
    var rmatrix = /\(([^,]*),([^,]*),([^,]*),([^,]*),([^,p]*)(?:px)?,([^)p]*)(?:px)?/,
    rad2deg = 180/Math.PI,
    deg2rad = Math.PI/180,
    supportFloat32Array = "Float32Array" in window,
    prefixes = ['', '-ms-','-moz-', '-webkit-', '-khtml-', '-o-','ms-'],
    adapter = $.cssAdapter = $.cssAdapter || {};
    function cssMap(name){
        return cssMap[name] ||  $.String.camelize( name );
    }
    var shortcuts = {
        c:   "color",
        h:   "height",
        o:   "opacity",
        r:   "rotate",
        w:   "width",
        x:   "left",
        y:   "top",
        fs:  "fontSize",
        st:  "scrollTop",
        sl:  "scrollLeft",
        sx:  "scaleX",
        sy:  "scaleY",
        tx:  "translateX",
        ty:  "translateY",
        bgc: "backgroundColor",
        opacity: "opacity",//fix IE
        "float":  $.support.cssFloat ? 'cssFloat': 'styleFloat'
    };
    for(var name in shortcuts){
        cssMap[ name ]  = shortcuts[ name ]
    }
    var rrelNum = /^([\-+])=([\-+.\de]+)/
    $.implement({
        css : function( name, value ){
            return $.access( this, name, value, $.css );
        },
        rotate : function( value ){
            return  this.css( "rotate", value ) ;
        }
    });

    //http://www.w3.org/TR/2009/WD-css3-2d-transforms-20091201/#introduction
    $.mix($, {
        cssMap: cssMap,
        //http://www.cnblogs.com/rubylouvre/archive/2011/03/28/1998223.html
        cssName: function( name, host, test ){
            if( cssMap[ name ] )
                return cssMap[ name ];
            host = host || $.html.style;
            for ( var i = 0, n = prefixes.length; i < n; i++ ) {
                test = $.String.camelize( prefixes[i] + name || "")
                if( test in host ){
                    return ( cssMap[ name ] = test );
                }
            }
            return null;
        },
        scrollbarWidth: function (){
            if( $.scrollbarWidth.ret ){
                return $.scrollbarWidth.ret
            }
            var test =  $('<div style="width: 100px;height: 100px;overflow: scroll;position: absolute;top: -9999px;"/>').appendTo("body");
            var ret = test[0].offsetWidth - test[0].clientWidth;              
            test.remove();
            return $.scrollbarWidth.ret = ret;
        },
        //这里的属性不需要自行添加px
        cssNumber: $.oneObject("fontSizeAdjust,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom,rotate"),
        css: function( node, name, value, fn){
            if( !fn ){
                name = cssMap( name );
            }
            if( value === void 0){ //取值
                return (adapter[ name+":get" ] || adapter[ "_default:get" ])( node, cssMap(name) );
            }else {//设值
                var temp;
                if ( typeof value === "string" && (temp = rrelNum.exec( value )) ) {
                    value = ( +( temp[1] + 1) * + temp[2] ) + parseFloat( $.css( node , name, void 0, 1 ) );
                }
               
                if ( isFinite( value ) && !$.cssNumber[ name ] ) {
                    value += "px";
                }
                fn = (adapter[name+":set"] || adapter[ "_default:set" ]);
                fn( node, name, value );
            }
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
            return $.all2deg(value) * deg2rad;
        },
        //将 skewx(10deg) translatex(150px)这样的字符串转换成3*2的距阵
        _toMatrixArray: function( transform ) {
            transform = transform.split(")");
            var  i = -1, l = transform.length -1, split, prop, val,
            prev = supportFloat32Array ? new Float32Array(6) : [],
            curr = supportFloat32Array ? new Float32Array(6) : [],
            rslt = supportFloat32Array ? new Float32Array(6) : [1,0,0,1,0,0];
            prev[0] = prev[3] = rslt[0] = rslt[3] = 1;
            prev[1] = prev[2] = prev[4] = prev[5] = 0;
            // Loop through the transform properties, parse and multiply them
            while ( ++i < l ) {
                split = transform[i].split("(");
                prop = split[0].trim();
                val = split[1];
                curr[0] = curr[3] = 1;
                curr[1] = curr[2] = curr[4] = curr[5] = 0;

                switch (prop) {
                    case "translateX":
                        curr[4] = parseInt( val, 10 );
                        break;

                    case "translateY":
                        curr[5] = parseInt( val, 10 );
                        break;

                    case "translate":
                        val = val.split(",");
                        curr[4] = parseInt( val[0], 10 );
                        curr[5] = parseInt( val[1] || 0, 10 );
                        break;

                    case "rotate":
                        val = $.all2rad( val );
                        curr[0] = Math.cos( val );
                        curr[1] = Math.sin( val );
                        curr[2] = -Math.sin( val );
                        curr[3] = Math.cos( val );
                        break;

                    case "scaleX":
                        curr[0] = +val;
                        break;

                    case "scaleY":
                        curr[3] = val;
                        break;

                    case "scale":
                        val = val.split(",");
                        curr[0] = val[0];
                        curr[3] = val.length > 1 ? val[1] : val[0];
                        break;

                    case "skewX":
                        curr[2] = Math.tan( $.all2rad( val ) );
                        break;

                    case "skewY":
                        curr[1] = Math.tan( $.all2rad( val ) );
                        break;

                    case "skew":
                        val = val.split(",");
                        curr[2] = Math.tan( $.all2rad( val[0]) );
                        val[1] && ( curr[1] = Math.tan( $.all2rad( val[1] )) );
                        break;

                    case "matrix":
                        val = val.split(",");
                        curr[0] = val[0];
                        curr[1] = val[1];
                        curr[2] = val[2];
                        curr[3] = val[3];
                        curr[4] = parseInt( val[4], 10 );
                        curr[5] = parseInt( val[5], 10 );
                        break;
                }

                // Matrix product (array in column-major order)
                rslt[0] = prev[0] * curr[0] + prev[2] * curr[1];
                rslt[1] = prev[1] * curr[0] + prev[3] * curr[1];
                rslt[2] = prev[0] * curr[2] + prev[2] * curr[3];
                rslt[3] = prev[1] * curr[2] + prev[3] * curr[3];
                rslt[4] = prev[0] * curr[4] + prev[2] * curr[5] + prev[4];
                rslt[5] = prev[1] * curr[4] + prev[3] * curr[5] + prev[5];

                prev = [ rslt[0],rslt[1],rslt[2],rslt[3],rslt[4],rslt[5] ];
            }
            return rslt;
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
    var cssTransfrom = $.cssName("transform");
    if(cssTransfrom){
        // gerrer(node) 返回一个包含 scaleX,scaleY, rotate, translateX,translateY, translateZ的对象
        // setter(node, { rotate: 30 })返回自身
        $.transform = function( node,  param ){
            var meta = $._data(node,"transform"),arr = [1,0,0,1,0,0], m
            if(!meta){
                //将CSS3 transform属性中的数值分解出来
                var style = $.css( node ,cssTransfrom );
                if(~style.indexOf("matrix")){
                    m = rmatrix.exec(style);
                    arr = [m[1], m[2], m[3], m[4], m[5], m[6]];
                }else if(style.length > 6){
                    arr = $._toMatrixArray(style)
                }
                meta = $._toMatrixObject(arr);
                //保存到缓存系统，省得每次都计算
                $._data( node,"transform",meta);
            }

            if(arguments.length === 1){
                return meta;//getter
            }
            //setter
            meta = $._data(node,"transform",{
                scaleX:     param.scaleX     === void 0 ? meta.scaleX     : param.scaleX,
                scaleY:     param.scaleY     === void 0 ? meta.scaleY     : param.scaleY,
                rotate:     param.rotate     === void 0 ? meta.rotate     : param.rotate,
                translateX: param.translateX === void 0 ? meta.translateX : parseInt(param.translateX)|0,
                translateY: param.translateY === void 0 ? meta.translateY : parseInt(param.translateY)|0
            });
            node.style[cssTransfrom]  =
            "scale(" + meta.scaleX + "," + meta.scaleY + ") " +
            "rotate(" + $.all2deg( meta.rotate )  + "deg) " +
            "translate(" + meta.translateX  + "px," + meta.translateY + "px)";
        }
    }
    //IE9 FF等支持getComputedStyle
    $.mix(adapter, {
        "_default:get" :function( node, name){
            return node.style[ name ];
        },
        "_default:set" :function( node, name, value){
            node.style[ name ] = value;
        },
        "rotate:get":function( node ){
            return $.all2deg(($.transform(node) || {}).rotate) ;
        },
        "rotate:set":function( node, name, value){
            $.transform(node, {
                rotate:value
            });
        }
    },false);

    if ( document.defaultView && document.defaultView.getComputedStyle ) {
        adapter[ "_default:get" ] = function( node, name ) {
            var ret, defaultView, computedStyle;
            if ( !(defaultView = node.ownerDocument.defaultView) ) {
                return undefined;
            }
            var underscored = name == "cssFloat" ? "float" :
            name.replace( /([A-Z]|^ms)/g, "-$1" ).toLowerCase(),
            rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i,
            rmargin = /^margin/, style = node.style ;
            if ( (computedStyle = defaultView.getComputedStyle( node, null )) ) {
                ret = computedStyle.getPropertyValue( underscored );
                if ( ret === "" && !$.contains( node.ownerDocument, node ) ) {
                    ret = style[name];//如果还没有加入DOM树，则取内联样式
                }
            }
            // A tribute to the "awesome hack by Dean Edwards"
            // WebKit uses "computed value (percentage if specified)" instead of "used value" for margins
            // which is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
            if ( !$.support.cssPercentedMargin && computedStyle && rmargin.test( name ) && rnumnonpx.test( ret ) ) {
                var width = style.width;
                style.width = ret;
                ret = computedStyle.width;
                style.width = width;
            }

            return ret === "" ? "auto" : ret;
        };
    }

    //=========================　处理　width height　=========================
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
    var getter = $.cssAdapter["_default:get"], RECT = "getBoundingClientRect",
    cssPair = {
        Width:['Left', 'Right'],
        Height:['Top', 'Bottom']
    }
    function getWH( node, name, extra  ) {//注意 name是首字母大写
        var none = 0, getter = $.cssAdapter["_default:get"], which = cssPair[name];
        if(getter(node,"display") === "none" ){
            none ++;
            node.style.display = "block";
        }
        var rect = node[ RECT ] && node[ RECT ]() || node.ownerDocument.getBoxObjectFor(node),
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
    };
    //生成width, height, innerWidth, innerHeight, outerWidth, outerHeight这六种原型方法
    "Height,Width".replace( $.rword, function(  name ) {
        var lower = name.toLowerCase();
        $.cssAdapter[ lower+":get" ] = function( node ){
            return getWH( node, name ) + "px";//为适配器添加节点
        }
        $.fn[ "inner" + name ] = function() {
            var node = this[0];
            return node && node.style ? getWH( node, name, 1 ) : null;
        };
        // outerHeight and outerWidth
        $.fn[ "outer" + name ] = function( margin ) {
            var node = this[0], extra = margin === "margin" ? 3 : 2;
            return node && node.style ?  getWH( node,name, extra ) : null;
        };
        $.fn[ lower ] = function( size ) {
            var target = this[0];
            if ( !target ) {
                return size == null ? null : this;
            }
            if ( $.type( target, "Window" ) ) {//取得浏览器工作区的大小
                var doc = target.document, prop = doc.documentElement[ "client" + name ], body = doc.body;
                return doc.compatMode === "CSS1Compat" && prop || body && body[ "client" + name ] || prop;
            } else if ( target.nodeType === 9 ) {//取得页面的大小（包括不可见部分）
                return Math.max(
                    target.documentElement["client" + name],
                    target.body["scroll" + name], target.documentElement["scroll" + name],
                    target.body["offset" + name], target.documentElement["offset" + name]
                    );
            } else if ( size === void 0 ) {
                return getWH( target, name, 0 )
            } else {
                return this.css( lower, size );
            }
        };

    });
    
    //=========================　处理　user-select　=========================
    //https://developer.mozilla.org/en/CSS/-moz-user-select
    //http://www.w3.org/TR/2000/WD-css3-userint-20000216#user-select
    //具体支持情况可见下面网址
    //http://help.dottoro.com/lcrlukea.php
    var userSelect =  $.cssName("userSelect");
    if(typeof userSelect === "string"){
        adapter[ "userSelect:set" ] = function( node, _, value ) {
            return node.style[ userSelect ] = value;
        };
    }
    //=======================================================
    //获取body的offset
    function getBodyOffsetNoMargin(){
        var el = document.body, ret = parseFloat($.css(el,"margin-top"))!== el.offsetTop;
        function getBodyOffsetNoMargin(){
            return ret;//一次之后的执行结果
        }
        return ret;//第一次执行结果
    }
       
    $.fn.offset = function(){//取得第一个元素位于页面的坐标
        var node = this[0], owner = node && node.ownerDocument, pos = {
            left:0,
            top:0
        };
        if ( !node || !owner ) {
            return pos;
        }
        if( node.tagName === "BODY" ){
            pos.top = node.offsetTop;
            pos.left = body.offsetLeft;
            //http://hkom.blog1.fc2.com/?mode=m&no=750 body的偏移量是不包含margin的
            if(getBodyOffsetNoMargin()){
                pos.top  += parseFloat( getter(node, "marginTop") ) || 0;
                pos.left += parseFloat( getter(node, "marginLeft") ) || 0;
            }
            return pos;
        }else if ( $.html[ RECT ]) { //如果支持getBoundingClientRect
            //我们可以通过getBoundingClientRect来获得元素相对于client的rect.
            //http://msdn.microsoft.com/en-us/library/ms536433.aspx
            var box = node[ RECT ](),win = getWindow(owner),
            root = owner.documentElement,body = owner.body,
            clientTop = root.clientTop || body.clientTop || 0,
            clientLeft = root.clientLeft || body.clientLeft || 0,
            scrollTop  = win.pageYOffset || $.support.boxModel && root.scrollTop  || body.scrollTop,
            scrollLeft = win.pageXOffset || $.support.boxModel && root.scrollLeft || body.scrollLeft;
            // 加上document的scroll的部分尺寸到left,top中。
            // IE一些版本中会自动为HTML元素加上2px的border，我们需要去掉它
            // http://msdn.microsoft.com/en-us/library/ms533564(VS.85).aspx
            pos.top  = box.top  + scrollTop  - clientTop,
            pos.left = box.left + scrollLeft - clientLeft;
        }
        return pos;
    }

    
    var rroot = /^(?:body|html)$/i;
    $.implement({
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
                var offsetParent = this.offsetParent || document.body;
                while ( offsetParent && (!rroot.test(offsetParent.nodeName) && getter(offsetParent, "position") === "static") ) {
                    offsetParent = offsetParent.offsetParent;
                }
                return offsetParent;
            });
        }
    });

    "Left,Top".replace( $.rword, function( name ) {
        adapter[ name.toLowerCase() +":get"] =  function(node){//添加top, left到cssAdapter
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
                    if (node.uniqueID && document.documentMode < 9 || window.opera) {
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
        var method = "scroll" + name;//scrollTop,scrollLeft只有读方法
        $.fn[ method ] = function( val ) {
            var node, win, t = name == "Top";
            if ( val === void 0 ) {
                node = this[ 0 ];
                if ( !node ) {
                    return null;
                }
                win = getWindow( node );
                // Return the scroll offset
                return win ? ("pageXOffset" in win) ? win[ t ? "pageYOffset" : "pageXOffset" ] :
                $.support.boxModel && win.document.documentElement[ method ] ||
                win.document.body[ method ] :
                node[ method ];
            }
            // Set the scroll offset
            return this.each(function() {
                win = getWindow( this );
                if ( win ) {
                    win.scrollTo(
                        !t ? val : $( win ).scrollLeft(),
                        t ? val : $( win ).scrollTop()
                        );
                } else {
                    this[ method ] = val;
                }
            });
        };
    });
    var pseudoAdapter = window.VBArray && $.query && $.query.pseudoAdapter
    if(pseudoAdapter){
        pseudoAdapter.hidden = function( el ) {
            return el.type === "hidden" || $.css( el, "display") === "none" ;
        }
    }

    function getWindow( node ) {
        return $.type(node,"Window") ?   node : node.nodeType === 9 ? node.defaultView || node.parentWindow : false;
    } ;

    "margin,padding,borderWidth".replace(/([a-z]+)([^,]*)/g,function(s,a,b){
        // console.log([a,b])
        });
});
//2011.9.5
//将cssName改为隋性函数,修正msTransform Bug
//2011.9.19 添加$.fn.offset width height innerWidth innerHeight outerWidth outerHeight scrollTop scrollLeft offset position
//2011.10.10 重构position offset保持这两者行为一致，
//2011.10.14 Fix $.css BUG，如果传入一个对象，它把到getter分支了。
//2011.10.15 Fix $.css BUG  添加transform rotate API
//2011.10.20 getWH不能获取隐藏元素的BUG
//2011.10.21 修正width height的BUG
//2011.11.10 添加top,left到cssAdapter
//2011.11.21 all2deg,all2rad,_toMatrixArray,_toMatrixObject放到命名空间之下，方便调用，简化transform逻辑



$.define("attr","support,node", function( support ){
   // $.log("已加载attr模块")
    var rreturn = /\r/g,
    rfocusable = /^(?:button|input|object|select|textarea)$/i,
    rclickable = /^a(?:rea)?$/i,
    rnospaces = /\S+/g,
    valOne = {
        "SELECT": "select",
        "OPTION": "option",
        "BUTTON": "button"
    },
    getValType = function( node ){
        return "form" in node && (valOne[ node.tagName ] || node.type);
    }
    $.implement({
        /**
             *  为所有匹配的元素节点添加className，添加多个className要用空白隔开
             *  如$("body").addClass("aaa");$("body").addClass("aaa bbb");
             *  <a href="http://www.cnblogs.com/rubylouvre/archive/2011/01/27/1946397.html">相关链接</a>
             */
        addClass: function( item ){
            if ( typeof item == "string") {
                for ( var i = 0, el; el = this[i++]; ) {
                    if ( el.nodeType === 1 ) {
                        if ( !el.className ) {
                            el.className = item;
                        } else {
                            var a = (el.className+" "+item).match( rnospaces );
                            a.sort();
                            for (var j = a.length - 1; j > 0; --j)
                                if (a[j] == a[j - 1])
                                    a.splice(j, 1);
                            el.className = a.join(' ');
                        }
                    }
                }
            }
            return this;
        },
        //如果第二个参数为true，则只判定第一个是否存在此类名，否则对所有元素进行操作；
        hasClass: function( item, every ) {
            var method = every === true ? "every" : "some",
            rclass = new RegExp('(\\s|^)'+item+'(\\s|$)');//判定多个元素，正则比indexOf快点
            return $.slice(this)[ method ](function( el ){
                return "classList" in el ? el.classList.contains( item ):
                (el.className || "").match(rclass);
            });
        },
        //如果不传入类名,则去掉所有类名,允许传入多个类名
        removeClass: function( item ) {
            if ( (item && typeof item === "string") || item === void 0 ) {
                var classNames = ( item || "" ).match( rnospaces );
                for ( var i = 0, node; node = this[ i++ ]; ) {
                    if ( node.nodeType === 1 && node.className ) {
                        if ( item ) {
                            var set = " " + node.className.match( rnospaces ).join(" ") + " ";
                            for ( var c = 0, cl = classNames.length; c < cl; c++ ) {
                                set = set.replace(" " + classNames[c] + " ", " ");
                            }
                            node.className = set.slice( 1, set.length - 1 );
                        } else {
                            node.className = "";
                        }
                    }
                }
            }
            return this;
        },
        //如果存在（不存在）就删除（添加）一个类。对所有匹配元素进行操作。
        toggleClass: function( item ){
            var type = typeof item , classNames = type === "string" && item.match( rnospaces ) || [],  className, i;
            return this.each(function( el ) {
                i = 0;
                if(el.nodeType === 1){
                    var self = $( el );
                    if(type == "string" ){
                        while ( (className = classNames[ i++ ]) ) {
                            self[ self.hasClass( className ) ? "removeClass" : "addClass" ]( className );
                        }
                    } else if ( type === "undefined" || type === "boolean" ) {
                        if ( el.className ) {
                            self._data( "__className__", el.className );
                        }
                        el.className = el.className || item === false ? "" : self.data( "__className__") || "";
                    }
                }
            });
        },
        //如果匹配元素存在old类名则将其改应neo类名
        replaceClass: function( old, neo ){
            for ( var i = 0, node; node = this[ i++ ]; ) {
                if ( node.nodeType === 1 && node.className ) {
                    var arr = node.className.match( rnospaces ), arr2 = [];
                    for ( var j = 0; j < arr.length; j++ ) {
                        arr2.push( arr[j] != old ? arr[j] : neo );
                    }
                    node.className = arr2.join(" ");
                }
            }
            return this;
        },
        val : function( item ) {
            var el = this[0], adapter = $.valAdapter, fn = adapter[ "option:get" ];
            if ( !arguments.length ) {//读操作
                if ( el && el.nodeType == 1 ) {
                    //处理select-multiple, select-one,option,button
                    var ret =  (adapter[ getValType( el )+":get" ] || $.propAdapter[ "@xml:get" ])( el, "value", fn );
                    return  typeof ret === "string" ? ret.replace( rreturn, "" ) : ret == null ? "" : ret;
                }
                return void 0;
            }
            //强制将null/undefined转换为"", number变为字符串
            if( Array.isArray( item ) ){
                item = item.map(function (item) {
                    return item == null ? "" : item + "";
                });
            }else if( isFinite(item) ){
                item += "";
            }else{
                item = item || "";//强制转换为数组
            }
            return this.each(function( el ) {//写操作
                if ( el.nodeType == 1 ) {
                    (adapter[ getValType( el )+":set" ] || $.propAdapter[ "@xml:set" ])( el, "value", item , fn );
                }
            });
        },
        removeAttr: function( name ) {
            name = $.attrMap[ name ] || name;
            var isBool = boolOne[ name ];
            return this.each(function() {
                if( this.nodeType === 1 ){
                    $[ "@remove_attr" ]( this, name, isBool );
                }
            });
        },
        removeProp: function( name ) {
            name = $.propMap[ name ] || name;
            return this.each(function() {
                // try/catch handles cases where IE balks (such as removing a property on window)
                try {
                    this[ name ] = void 0;
                    delete this[ name ];
                } catch( e ) {};
            });
        }
    });
        
    "attr,prop".replace($.rword, function( method ){
        $[ method ] = function( node, name, value ) {
            if(node  && ( $["@target"] in node )){
                var isElement = "setAttribute" in node,
                notxml = !isElement || !$.isXML(node),
                //对于HTML元素节点，我们需要对一些属性名进行映射
                orig = name.toLowerCase();
                if ( !isElement ) {
                    method = "prop"
                }
                var adapter = $[ method+"Adapter" ];
                name = notxml && $[ boolOne[name] ? "propMap" : method+"Map" ][ name ] || name;
                if ( value !== void 0 ){
                    if( method === "attr" && value === null ){  //为元素节点移除特性
                        return  $[ "@remove_"+method ]( node, name );
                    }else { //设置HTML元素的属性或特性
                        return (notxml && adapter[name+":set"] || adapter["@"+ ( notxml ? "html" : "xml")+":set"] )( node, name, value, orig );
                    }
                } //获取属性 
                return (adapter[name+":get"] || adapter["@"+ (notxml ? "html" : "xml")+":get"])( node, name, '', orig );
            }
        };
        $.fn[ method ] = function( name, value ) {
            return $.access( this, name, value, $[method] );
        }
    });
        
    $.extend({
        attrMap:{//特性名映射
            tabindex: "tabIndex"
        },
        propMap:{//属性名映射
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
            name = $.attrMap[ name ] || name;
            //如果支持removeAttribute，则使用removeAttribute
            $.attr( node, name, "" );
            node.removeAttribute( name );
            // 确保bool属性的值为bool
            if ( isBool && (propName = $.propMap[ name ] || name) in node ) {
                node[ propName ] = false;
            }
        },
        propAdapter:{
            "@xml:get": function( node, name ){
                return node[ name ]
            },
            "@xml:set": function(node, name, value){
                node[ name ] = value;
            }
        },
            
        attrAdapter: {
            "@xml:get": function( node, name ){
                return  node.getAttribute( name ) || void 0 ;
            },
            "@xml:set": function( node, name, value ){
                node.setAttribute( name, "" + value )
            },
            "tabIndex:get": function( node ) {
                // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
                var attributeNode = node.getAttributeNode( "tabIndex" );
                return attributeNode && attributeNode.specified ?
                parseInt( attributeNode.value, 10 )  : 
                rfocusable.test(node.nodeName) || rclickable.test(node.nodeName) && node.href  ? 0 : void 0;
            },
            "value:get": function( node, name, _, orig ) {
                if(node.nodeName ==="BUTTON"){
                    return attrAdapter["@html:get"](node,name);
                }
                return name in node ? node.value: void 0;
            },
            "value:set": function( node, name, value ) {
                if(node.nodeName ==="BUTTON"){
                    return attrAdapter["@html:set"]( node, name, value);
                }
                node.value = value;
            }
        },
        valAdapter:  {
            "option:get":  function( node ) {
                var val = node.attributes.value;
                return !val || val.specified ? node.value : node.text;
            },
            "select:get": function( node ,value, valOpt) {
                var i, max, option, index = node.selectedIndex, values = [], options = node.options,
                one = node.type === "select-one";
                // 如果什么也没选中
                if ( index < 0 ) {
                    return null;
                }
                i = one ? index : 0;
                max = one ? index + 1: options.length;
                for ( ; i < max; i++ ) {
                    option = options[ i ];
                    //过滤所有disabled的option元素或其父亲是disabled的optgroup元素的孩子
                    if ( option.selected && (support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null) &&
                        (!option.parentNode.disabled || !$.type( option.parentNode, "OPTGROUP" )) ) {
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
                $.slice(node.options).forEach(function( el ){
                    el.selected = !!~values.indexOf( fn(el) );
                });
                if ( !values.length ) {
                    node.selectedIndex = -1;
                }
            }
        }
    });
    var attrAdapter = $.attrAdapter,propAdapter = $.propAdapter, valAdapter = $.valAdapter;//attr方法只能获得两种值 string undefined
    "get,set".replace($.rword,function(method){
        attrAdapter[ "@html:"+method ] = attrAdapter[ "@xml:"+method ];
        propAdapter[ "@html:"+method ] = propAdapter[ "@xml:"+method ];
        propAdapter[ "tabIndex:"+method ] = attrAdapter[ "tabIndex:"+method ];
    });
               
    //========================propAdapter 的相关修正==========================
    var propMap = $.propMap;
    var prop = "accessKey,allowTransparency,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan,contentEditable,"+
    "dateTime,defaultChecked,defaultSelected,defaultValue,frameBorder,isMap,longDesc,maxLength,marginWidth,marginHeight,"+
    "noHref,noResize,noShade,readOnly,rowSpan,tabIndex,useMap,vSpace,valueType,vAlign";
    prop.replace($.rword, function(name){
        propMap[name.toLowerCase()] = name;
    });
    if(!document.createElement("form").enctype){//如果不支持enctype， 我们需要用encoding来映射
        propMap.enctype = "encoding";
    }
    propAdapter[ "tabIndex:get" ] = attrAdapter[ "tabIndex:get" ];
    //safari IE9 IE8 我们必须访问上一级元素时,才能获取这个值
    if ( !support.optSelected ) {
        $.propAdapter[ "selected:get" ] = function( node ) {
            var parent = node
            for( ;!parent.add; parent.selectedIndex, parent = parent.parentNode){};
            return node.selected;
        }
    }    
        
    //========================attrAdapter 的相关修正==========================
    var bools = $["@bools"];
    var boolOne = $.oneObject( support.attrProp ? bools.toLowerCase() : bools );
    bools.replace( $.rword,function( method ) {
        //bool属性在attr方法中只会返回与属性同名的值或undefined
        attrAdapter[ method+":get" ] = function( node, name ){
            var attrNode, property =  node[ name ];
            return property === true || typeof property !== "boolean" && ( attrNode = node.getAttributeNode(name) ) && attrNode.nodeValue !== false ?
            name.toLowerCase() :
            undefined;
        }
        attrAdapter[ method+":set" ] = function( node, name, value ){
            if ( value === false ) {//value只有等于false才移除此属性，其他一切值都当作赋为true
                $[ "@remove_attr" ]( node, name, true );
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
        "href,src,width,height,colSpan,rowSpan".replace( $.rword, function( method ) {//
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
              
    if( !support.attrProp ){
        //如果我们不能通过el.getAttribute("class")取得className,必须使用el.getAttribute("className")
        //又如formElement[name] 相等于formElement.elements[name]，会返回其辖下的表单元素， 这时我们就需要用到特性节点了
        $.mix( $.attrMap , $.propMap);//使用更全面的映射包
        var fixSpecified = $.oneObject("name,id");
        valAdapter[ "button:get" ] = attrAdapter[ "@html:get" ] =  function( node, name, value, orig ) {//用于IE6/7
            if(orig in $.propMap){
                return node[name];
            }
            var ret = node.getAttributeNode( name );//id与name的特性节点没有specified描述符，只能通过nodeValue判定
            return ret && (fixSpecified[ name ] ? ret.nodeValue !== "" : ret.specified) ?  ret.nodeValue : undefined;
        }
        valAdapter[ "button:set" ] = attrAdapter[ "@html:set" ] =  function( node, name, value, orig ) {
            if(orig in $.propMap){
                return (node[name] = value);
            }
            var ret = node.getAttributeNode( name );
            if ( !ret ) {
                ret = node.ownerDocument.createAttribute( name );
                node.setAttributeNode( ret );
            }
            ret.nodeValue = value + "";
        }  
        attrAdapter[ "contentEditable:set" ] =  function( node, name, value ) {
            if ( value === "" ) {
                value = "false";
            }
            attrAdapter["@html:set"]( node, name, value );
        };
        "width,height".replace( $.rword, function( attr ){
            attrAdapter[attr+":set"] = function(node, name, value){
                node.setAttribute( attr, value === "" ? "auto" : value+"");
            }
        });
    }
        
    //=========================valAdapter 的相关修正==========================
    //checkbox的value默认为on，唯有Chrome 返回空字符串
    if ( !support.checkOn ) {
        "radio,checkbox".replace( $.rword, function( name ) {
            $.valAdapter[ name + ":get" ] = function( node ) {
                return node.getAttribute("value") === null ? "on" : node.value;
            }
        });
    }
    //处理单选框，复选框在设值后checked的值
    "radio,checkbox".replace( $.rword, function( name ) {
        $.valAdapter[ name + ":set" ] = function( node, name, value) {
            if ( Array.isArray( value ) ) {
                return node.checked = !!~value.indexOf(node.value ) ;
            }
        }
    });
});

/*
2011.8.2
将prop从attr分离出来
添加replaceClass方法
2011.8.5  重构val方法
2011.8.12 重构replaceClass方法
2011.10.11 重构attr prop方法
2011.10.21 FIX valAdapter["select:set"] BUG
2011.10.22 FIX boolaAdapter.set方法
2011.10.27 对prop attr val大重构
*/

//==================================================
// 事件发送器模块
//==================================================
$.define("target","data", function(){
    // $.log("已加载target模块")
    var fireType = "", blank = "", rhoverHack = /(?:^|\s)hover(\.\S+)?\b/,
    rtypenamespace = /^([^\.]*)?(?:\.(.+))?$/, revent = /(^|_|:)([a-z])/g;
    function addCallback(queue, obj){//添加回调包到列队中
        var check = true, fn = obj.callback;
        for ( var i = 0, el; el = queue[i++]; ) {
            if( el.callback === fn ){
                check = false;
                break;
            }
        }
        if( check ){
            queue.push(obj);
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
    $.eventAdapter = {};
    var facade = $.event = {
        bind : function( types, fn, selector, times ){
            //它将在原生事件派发器或任何能成为事件派发器的普通JS对象添加一个名叫uniqueNumber的属性,用于关联一个缓存体,
            //把需要的数据储存到里面,而现在我们就把一个叫@events的对象储放都它里面,
            //而这个@event的表将用来放置各种事件类型与对应的回调函数
            var target = this, events = $._data( target) , DOM =  $[ "@target" ] in target,
            num = times || selector, all, tns ,type, namespace, adapter, item, queue, callback
            if(target.nodeType === 3 || target.nodeType === 8 || !types ||  !fn  || !events) return ;

            selector = selector && selector.length ? selector : false;
            var uuid =  fn.uuid || (fn.uuid = $.uuid++ );
            all = {
                callback: fn,
                uuid: uuid,
                times: num > 0 ? num : Infinity
            } //确保UUID，bag与callback的UUID一致
            all.callback.uuid = all.uuid;
            if( DOM ){ //处理DOM事件
                callback = events.callback ||  (events.callback = function( e ) {
                    return ((e || event).type !== fireType) ? facade.dispatch.apply( callback.target, arguments ) : void 0;
                });
                callback.target = target;
                types = types.replace( rhoverHack, "mouseover$1 mouseout$1" )
            }
            events = events.events || (events.events = {});
            //对多个事件进行绑定
            types.replace( $.rword, function(type){
                tns = rtypenamespace.exec( type ) || [];
                type = tns[1];//取得事件类型
                namespace = ( tns[2] || blank ).split( "." ).sort();//取得命名空间
                //事件冒充只用于原生事件发送器
                adapter = DOM && $.eventAdapter[ type ] || {};
                type = (selector? adapter.delegateType : adapter.bindType ) || type;
                adapter = DOM && $.eventAdapter[ type ] || {};
                item = $.mix({
                    type: type,
                    origType: tns[1],
                    selector: selector,
                    namespace: namespace.join(".")
                }, all);
                //创建事件队列
                queue = events[ type ] = events[ type ] ||  [];
                //只有原生事件发送器才能进行DOM level2 多投事件绑定
                if( DOM && !queue.length  ){
                    if (!adapter.setup || adapter.setup( target, selector, item.origType, callback ) === false ) {
                        // 为此元素这种事件类型绑定一个全局的回调，用户的回调则在此回调中执行
                        $.bind(target, type, callback, !!selector)
                    }
                }
                addCallback( queue, item );//同一事件不能绑定重复回调
            });
        },
        unbind: function( types, fn, selector ) {
            var target = this, events = $._data( target, "events");
            if(!events) return;
            var t, tns, type, origType, namespace, origCount, DOM =  $["@target"] in target,
            j, adapter, queue, item;
            types = DOM ? (types || blank).replace( rhoverHack, "mouseover$1 mouseout$1" ) : types;
            types = (types || blank).match( $.rword ) || [];
            for ( t = 0; t < types.length; t++ ) {
                tns = rtypenamespace.exec( types[t] ) || [];
                type = tns[1];
                origType = type;
                namespace = tns[2];
                // 如果types只包含命名空间，则去掉所有拥有此命名空间的事件类型的回调
                if ( !type  ) {
                    namespace = namespace? "." + namespace : "";
                    for ( j in events ) {
                        facade.unbind.call( target, j + namespace, fn, selector );
                    }
                    return;
                }
                //如果使用事件冒充则找到其正确事件类型
                adapter = $.eventAdapter[ type ] || {};
                type = ( selector? adapter.delegateType: adapter.bindType ) || type;
                queue = events[ type ] || [];
                origCount = queue.length;
                namespace = namespace ? new RegExp("(^|\\.)" + namespace.split(".").sort().join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
                //  namespace =  namespace?  namespace.split( "." ).sort().join(".") : null;
                //只有指定了命名空间，回调或选择器才能进入此分支
                if ( fn || namespace || selector ) {
                    for ( j = 0; j < queue.length; j++ ) {
                        item = queue[ j ];
                        if ( !fn || fn.uuid === item.uuid ) {//如果指定了回调，只检测其UUID
                            if ( !namespace ||  namespace.test( item.namespace )  ) {//如果指定了命名空间
                                if ( !selector || selector === item.selector || selector === "**" && item.selector ) {
                                    queue.splice( j--, 1 );
                                }
                            }
                        }
                    }
                } else {
                    //移除此类事件的所有回调
                    queue.length = 0;
                }
                if ( DOM && (queue.length === 0 && origCount !== queue.length) ) {//如果在回调队列的长度发生变化时才进行此分支
                    if ( !adapter.teardown || adapter.teardown( target, selector, origType, fn ) === false ) {
                        $.unbind( target, type, $._data(target,"callback") );
                    }
                    delete events[ type ];
                }
            }
            if( $.isEmptyObject( events ) ){
                fn = $.removeData( target,"callback") ;
                fn.target = null;
                $.removeData( target, "events") ;
            }
        },

        fire: function( event ){
            var target = this, namespace = [], type = event.type || event
            if ( ~type.indexOf( "." ) ) {//处理命名空间
                namespace = type.split(".");
                type = namespace.shift();
                namespace.sort();
            }
            event = (typeof event == "object" && "namespace" in event)? type : new jEvent(type);
            event.target = target;
            event.namespace = namespace.join( "." );
            event.namespace_re = event.namespace? new RegExp("(^|\\.)" + namespace.join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
            var args = [ event ].concat( $.slice(arguments,1) );
            if( $["@target"] in target){
                var cur = target,  ontype = "on" + type;
                do{//模拟事件冒泡与执行内联事件
                    if( ($._data(cur,"events")|| {})[type] ){
                        facade.dispatch.apply( cur, args );
                    }
                    if (cur[ ontype ] && cur[ ontype ].call(cur) === false) {
                        event.preventDefault();
                    }
                    cur = cur.parentNode ||
                    cur.ownerDocument ||
                    cur === target.ownerDocument && window;
                } while ( cur && !event.isPropagationStopped );
                if ( !event.isDefaultPrevented ) {//模拟默认行为 click() submit() reset() focus() blur()
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
                    if ( old ) {
                        target[ ontype ] = old;
                    }
                }

            }else{//普通对象的自定义事件
                facade.dispatch.apply(target, args);
            }
        },
        filter: function( cur, parent, expr ){
            var matcher = typeof expr === "function"? expr : expr.input ? quickIs : $.match
            for ( ; cur != parent; cur = cur.parentNode || parent ) {
                if(matcher(cur, expr))
                    return true
            }
            return false;
        },
        dispatch: function( e ) {
            var win = ( this.ownerDocument || this.document || this ).parentWindow || window,
            event = facade.fix( e || win.event ),
            queue = $._data(this,"events");//这个其实是对象events
            if (  queue ) {
                queue = queue[ event.type] || [];//到此处时才是数组
                event.currentTarget = this;
                var src = event.target,args = [event].concat($.slice(arguments,1)), result;
                //复制数组以防影响下一次的操作
                queue = queue.concat();
                //开始进行拆包操作
                for ( var i = 0, item; item = queue[i++]; ) {
                    //如果是事件代理，确保元素处于enabled状态，并且满足过滤条件
                    if ( !src.disabled && !(event.button && event.type === "click")
                        && (!item.selector  || facade.filter(src, this, item.selector))
                        && (!event.namespace || event.namespace_re.test( item.namespace ) ) ) {
                        //取得回调函数
                        event.type = item.origType;
                        result = item.callback.apply( item.selector ? src : this, args );
                        item.times--;
                        if(item.times === 0){
                            facade.unbind.call( this, event.type, item.callback, item.selector );
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

        fix: function( event ){
            if( !("namespace" in event) ){
                var originalEvent = event
                event = new jEvent(originalEvent);
                for( var prop in originalEvent ){
                    //去掉所有方法与常量
                    if( typeof originalEvent[prop] !== "function" && prop !== "type" ){
                        if(/^[A-Z_]+$/.test(prop))
                            continue
                        event[prop] = originalEvent[prop]
                    }
                }
                //如果不存在target属性，为它添加一个
                if ( !event.target ) {
                    event.target = event.srcElement || document;
                }
                //safari的事件源对象可能为文本节点，应代入其父节点
                if ( event.target.nodeType === 3 ) {
                    event.target = event.target.parentNode;
                }
                // 处理鼠标事件
                if( /^(?:mouse|contextmenu)|click/.test(event.type) ){
                    //如果不存在pageX/Y则结合clientX/Y做一双出来
                    if ( event.pageX == null && event.clientX != null ) {
                        var doc = event.target.ownerDocument || document,
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
                if( event.type === "mousewheel" ){
                    if ("wheelDelta" in originalEvent){
                        var delta = originalEvent.wheelDelta/120;
                        //opera 9x系列的滚动方向与IE保持一致，10后修正
                        if(window.opera && window.opera.version() < 10)
                            delta = -delta;
                        event.wheelDelta = Math.round(delta); //修正safari的浮点 bug
                    }else if("detail" in originalEvent){
                        event.wheelDelta = -event.detail/3;
                    }
                }
                // 处理组合键
                if ( event.metaKey === void 0 ) {
                    event.metaKey = event.ctrlKey;
                }
            }
            return event;
        }
    }
    
    var jEvent = $.Event = function ( event ) {
        this.originalEvent = event.substr ? {} : event;
        this.type = event.type || event;
        this.timeStamp  = Date.now();
        this.namespace = "";//用于判定是否为伪事件对象
    };
    // http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
    jEvent.prototype = {
        constructor: jEvent,
        //http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/events.html#Conformance
        toString: function(){
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
    $.target = {};
    "bind,unbind,fire".replace( $.rword, function( method ){
        $.target[ method ] = function(){
            facade [method ].apply(this, arguments);
            return this;
        }
    });
    $.target.uniqueNumber = $.uuid++;
    $.target.defineEvents = function( names ){
        var events = [];
        if(typeof names == "string"){
            events = names.match( $.rword ) || [];
        }else if($.isArray(names)){
            events = names;
        }
        events.forEach(function(name){
            var method = 'on'+name.replace(revent,function($, $1, $2) {
                return $2.toUpperCase();
            });
            if (!(method in this)) {
                this[method] = function() {
                    return this.bind.apply(this, [].concat.apply([name], arguments));
                };
            }
        },this);
    }
    
});

//2011.8.14 更改隐藏namespace,让自定义对象的回调函数也有事件对象
//2011.9.17 事件发送器增加一个uniqueID属性
//2011.9.21 重构bind与unbind方法 支持命名空间与多事件处理
//2011.9.27 uniqueID改为uniqueNumber 使用$._data存取数据
//2011.9.29 简化bind与unbind
//2011.10.13 模块名改为dispatcher
//2011.10.23 简化facade.handle与fire
//2011.10.26 更改命名空间的检测方法
//2011.11.23 重构facade.fix与quickIs
//2011.12.20 修正在当前窗口为子窗口元素绑定错误时，在IE678下，事件对象错误的问题
//2011.12.20 修正rhoverHack正则，现在hover可以作为命名空间了
//2011.10.13 模块名改为target




//http://davidwalsh.name/snackjs
//http://microjs.com/
//http://westcoastlogic.com/lawnchair/
//https://github.com/madrobby/emile
//http://www.bobbyvandersluis.com/articles/clientside_scripting/
//==========================================
//  事件模块（包括伪事件对象，事件绑定与事件代理）
//==========================================
$.define("event", "node,target",function(){
    // $.log("加载event模块成功");
    var types = "contextmenu,click,dblclick,mouseout,mouseover,mouseenter,mouseleave,mousemove,mousedown,mouseup,mousewheel," +
    "abort,error,load,unload,resize,scroll,change,input,select,reset,submit,input,"+"blur,focus,focusin,focusout,"+"keypress,keydown,keyup";
    $.eventSupport = function( eventName,el ) {
        el = el || document.createElement("div");
        eventName = "on" + eventName;
        var ret = eventName in el;
        if ( el.setAttribute && !ret ) {
            el.setAttribute( eventName, "" );
            ret = typeof el[ eventName ] === "function";
            el.removeAttribute(eventName);
        }
        el = null;
        return ret;
    };

    var facade = $.event,
    rform  = /^(?:textarea|input|select)$/i ,
    adapter = $.eventAdapter = {
        focus: {
            delegateType: "focusin"
        },
        blur: {
            delegateType: "focusout"
        },

        beforeunload: {
            setup: function(src, _, _, fn ) {
                // We only want to do this special case on windows
                if ( $.type(src, "Window") ) {
                    src.onbeforeunload = fn;
                }
            },
            teardown: function( src, _, _, fn ) {
                if ( src.onbeforeunload === fn ) {
                    src.onbeforeunload = null;
                }
            }
        }
    };

    function fixAndDispatch( src, type, e ){
        e = facade.fix( e );
        e.type = type;
        for(var i in src){
            if(src.hasOwnProperty(i)){
                facade.dispatch.call( src[ i ], e );
            }
        }
    }

    if(!$.eventSupport("input", document.createElement("input"))){
           adapter.input = {
            check: function(src){
                return rform.test(src.tagName) && !/^select/.test(src.type);
            },
            bindType: "change",
            delegateType: "change"
        }
    }
    //用于在标准浏览器下模拟mouseenter与mouseleave
    //现在除了IE系列支持mouseenter/mouseleave/focusin/focusout外
    //opera11,FF10也支持这四个事件,同时它们也成为w3c DOM3 Event的规范
    //详见http://www.filehippo.com/pl/download_opera/changelog/9476/
    //http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html
    if( !+"\v1" || !$.eventSupport("mouseenter")){
        "mouseenter_mouseover,mouseleave_mouseout".replace(/(\w+)_(\w+)/g, function(_,orig, fix){
            adapter[ orig ]  = {
                setup: function( src ){//使用事件冒充
                    $._data( src, orig+"_handle", $.bind( src, fix, function( e ){
                        var parent = e.relatedTarget;
                        try {
                            while ( parent && parent !== src ) {
                                parent = parent.parentNode;
                            }
                            if ( parent !== src ) {
                                fixAndDispatch( [ src ], orig, e );
                            }
                        } catch(err) { };
                    }));
                },
                teardown: function(){
                    $.unbind( this, fix, $._data( orig+"_handle" ) );
                }
            };
        });
    }

    var delegate = function( fn ){
        return function(src,selector, type){
            var fix = !adapter[type] || !adapter[type].check || adapter[type].check(src);
            if( fix || selector ){
                fn(src, type, fix);
            }else{
                return false;
            }
        }
    }

    if( !document.dispatchEvent ){
        //模拟IE678的reset,submit,change的事件代理
        var 
        submitWhich = $.oneObject("13,108"),
        submitInput = $.oneObject("submit,image"),
        submitType  = $.oneObject("text,password,textarea"),

        changeType = {
            "select-one": "selectedIndex",
            "select-multiple": "selectedIndex",
            "radio": "checked",
            "checkbox": "checked"
        }
        function changeNotify( e ){
            if( e.propertyName === ( changeType[ this.type ] || "value") ){
                $._data( this, "_just_changed", true );
                fixAndDispatch( $._data( this, "publisher" ), "change", e );
            }
        }
        function changeFire( e ){
            var el = this;
            if( !$._data( el,"_just_changed" ) ){
                fixAndDispatch( $._data( el ,"publisher"), "change", e );
            }else{
                $.removeData( el, "_just_changed", true );
            }
        }
        $.mix( adapter, {
            //reset事件的冒泡情况----FF与opera能冒泡到document,其他浏览器只能到form
            reset: {
                setup: delegate(function( src ){
                    facade.bind.call( src, "click._reset keypress._reset", function( e ) {
                        if(  e.target.form && (e.which === 27  ||  e.target.type == "reset") ){
                            fixAndDispatch( [ src ], "reset", e );
                        }
                    });
                }),
                teardown: delegate(function( src ){
                    facade.unbind.call( src, "._reset" );
                })
            },
            //submit事件的冒泡情况----IE6-9 :form ;FF: document; chrome: window;safari:window;opera:window
            submit: {
                setup: delegate(function( src ){
                    facade.bind.call( src, "click._submit keypress._submit", function( e ) {
                        var el = e.target, type = el.type;
                        if( el.form &&  ( submitInput[type] || submitWhich[ e.which ] && submitType[type]) ){
                            fixAndDispatch( [ src ], "submit", e );
                        }
                    });
                }),
                teardown: delegate(function( src ){
                    facade.unbind.call( src, "._submit" );
                })
            },
            change: {
                check: function(src){
                    return rform.test(src.tagName) && /radio|checkbox/.test(src.type)
                },
                setup: delegate(function( src, type, fix ){
                    var subscriber = $._data( src, "subscriber", {} );//用于保存订阅者的UUID
                    $._data( src, "_beforeactivate", $.bind( src, "beforeactivate", function() {
                        var e = src.document.parentWindow.event, target = e.srcElement;
                        //如果发现孩子是表单元素并且没有注册propertychange事件，则为其注册一个，那么它们在变化时就会发过来通知顶层元素
                        if ( rform.test( target.tagName) && !subscriber[ target.uniqueNumber ] ) {
                            subscriber[ target.uniqueNumber] = target;//表明其已注册
                            var publisher = $._data( target,"publisher") || $._data( target,"publisher",{} );
                            publisher[ src.uniqueNumber] = src;//此孩子可能同时要向N个顶层元素报告变化
                            facade.bind.call( target,"propertychange._change", changeNotify );
                            //允许change事件可以通过fireEvent("onchange")触发
                            if(type === "change"){
                                $._data(src, "_change_fire",$.bind(target, "change", changeFire.bind(target, e) ))
                            }
                        }
                    }));
                    if( fix ){//如果是事件绑定
                        src.fireEvent("onbeforeactivate")
                    }
                }),
                teardown: delegate(function( src, els, i ){
                    $.unbind( src, "beforeactive", $._data( src, "_beforeactivate") );
                    $.unbind( src, "change", $._data(src, "_change_fire")  );
                    els = $.removeData( src, "subscriber", true ) || {};
                    for( i in els){
                        $.unbind( els[i],"._change" );
                        var publisher = $._data( els[i], "publisher");
                        if(publisher){
                            delete publisher[ src.uniqueNumber ];
                        }
                    }
                })
            }
        });
    }



    //在标准浏览器里面模拟focusin
    if( !$.eventSupport("focusin") ){
        "focusin_focus,focusout_blur".replace( /(\w+)_(\w+)/g, function(_,$1, $2){
            var notice = 0, focusinNotify = function (e) {
                var src = e.target
                do{//模拟冒泡
                    var events = $._data( src,"events");
                    if(events && events[$1]){
                        fixAndDispatch( [ src ], $1, e );
                    }
                } while (src = src.parentNode );
            }
            adapter[ $1 ] = {
                setup: function( ) {
                    if ( notice++ === 0 ) {
                        document.addEventListener( $2, focusinNotify, true );
                    }
                },
                teardown: function() {
                    if ( --notice === 0 ) {
                        document.removeEventListener( $2, focusinNotify, true );
                    }
                }
            };
        });
    }
    try{
        //FF3使用DOMMouseScroll代替标准的mousewheel事件
        document.createEvent("MouseScrollEvents");
        adapter.mousewheel = {
            bindType    : "DOMMouseScroll",
            delegateType: "DOMMouseScroll"
        }
        try{
            //可能末来FF会支持标准的mousewheel事件，则需要删除此分支
            document.createEvent("WheelEvent");
            delete adapter.mousewheel;
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
    $.implement({
        toggle: function(/*fn1,fn2,fn3*/){
            var fns = [].slice.call(arguments), i = 0;
            return this.click(function(e){
                var fn  = fns[i++] || fns[i = 0, i++];
                fn.call( this, e );
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
                facade.bind.call( this, types, fn, selector, times );
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
                facade.unbind.apply( this, args );
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
            $( this.ownerDocument ).on( types, fn, this.selector,times );
            return this;
        },
        die: function( types, fn ) {
            $( this.ownerDocument ).off( types, fn, this.selector || "**" );
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
        fire: function(  ) {
            var args = arguments;
            return this.each(function() {
                $.event.fire.apply(this, args );
            });
        }
    })

    types.replace( $.rword, function( type ){
        $.fn[ type ] = function( callback ){
            return callback?  this.bind( type, callback ) : this.fire( type );
        }
    });
});
//2011.10.14 强化delegate 让快捷方法等支持fire 修复delegate BUG
//2011.10.21 修复focusin focsuout的事件代理 增加fixAndDispatch处理事件冒充
//2011.11.23 简化rquickIs
//2012.2.7 重构change，允许change事件可以通过fireEvent("onchange")触发
//2012.2.8 添加mouseenter的分支判定，增强eventSupport
//2012.2.9 完美支持valuechange事件
//1. 各浏览器兼容                  2. this指针指向兼容                  3. event参数传递兼容. 








//=========================================
// 特效模块v3
//==========================================
$.define("fx", "css",function(){
    //$.log("已加载fx模块");
    var types = {
        color:/color/i,
        transform:/rotate|scaleX|scaleY|translateX|translateY/i,
        scroll:/scroll/i,
        _default:/fontSize|fontWeight|opacity|width|height|top$|bottom$|left$|right$/i
    },
    rfxnum = /^([+\-/\*]=)?([\d+.\-]+)([a-z%]*)$/i;
    var adapter = $.fxAdapter = {
        _default:{
            get:function(el, prop) {
                return $.css(el,prop);
            },
            tween :function(form,change,name,per) {
                var a = (form + change * $.easing[name](per)).toFixed(3);
                return isNaN(a) ? 0 : a;
            }
        },
        type: function (attr){//  用于取得适配器的类型
            for(var i in types){
                if(types[i].test(attr)){
                    return i;
                }
            }
            return "_default";
        }
    }

    var tween = adapter._default.tween;
    $.mix(adapter,{
        scroll : {
            get: function(el, prop){
                return el[prop];
            },
            tween: tween
        },
        transform:{
            get: function(el, prop){
                return $.transform(el)[prop]
            },
            set:function(el,t2d,isEnd,per){
                var obj = {}

                for(var name in t2d){
                    obj[name] = isEnd ? t2d[name][1] : tween(t2d[name][0],t2d[name][2],t2d[name][3],per);
                }
                $.transform(el,obj);
            }
        },
        color : {
            get:function(el,prop){
                return  $.css(el,prop);
            },
            tween:function(f0,f1,f2,c0,c1,c2,name,per,i){
                var delta = $.easing[name](per), ret = [];
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
        if (heartbeat.id === null) {
            heartbeat.id = setInterval(nextTick, 13);//开始心跳
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
    var keyworks = $.oneObject("before,frame,after,easing,rewind,record");
    //处理特效的入口函数,用于将第二个参数，拆分为两个对象props与config，然后再为每个匹配的元素指定一个双向列队对象linked
    //linked对象包含两个列队，每个列队装载着不同的特效对象
    $.fn.fx = function( duration, hash ){
        var props = hash ||{}, config = {}, p
        if(typeof duration === "function"){
            props.after = duration;
            duration = null;
        }
        for( var name in props){
            p = $.cssName(name) || name;
            if( name != p ){
                props[ p ] = props[ name ];
                delete props[ name ];
            }else if(  keyworks[name] ){
                config[ name ] =  props[ name ] 
                delete props[ name ];
            }
        }
        var easing = (config.easing || "swing").toLowerCase() ;
        config.easing = $.easing[ easing ] ? easing : "swing";
        config.duration = duration || 500;
        config.method = "noop";
        return this.each(function(node){
            var linked = $._data(node,"fx") || $._data( node,"fx",{
                positive: [], //正向列队
                negative: [], //负向列队
                run: false
            });
            linked.positive.push({//fx对象
                startTime:  0,//timestamp
                config:   $.mix({}, config),//各种配置
                props:    $.mix({}, props)//用于渐变的属性
            });
            if(!linked.run){
                linked.run = heartbeat( node);
            }
        });
    }

    function animate( node ) {//linked对象包含两个列队（positive与negative）
        var linked = $._data( node,"fx") ,  fx = linked.positive[0],  now, isEnd, mix;
        if( isFinite( fx ) ){//如果此时调用了delay方法，fx肯定是整型
            setTimeout(function(){
                linked.positive.shift();
                linked.run = heartbeat( node);
            },fx)
            return (fx.run = false)
        }
        if (!fx) { //这里应该用正向列队的长度做判定
            linked.run = false;
        } else {
            var config = fx.config, props = fx.props;
            if (fx.startTime) { // 如果已设置开始时间，说明动画已开始
                now = +new Date;
                switch(linked.stopCode){//如果此时调用了stop方法
                    case 0:
                        fx.render = $.noop;//中断当前动画，继续下一个动画
                        break;
                    case 1:
                        fx.gotoEnd = true;//立即跳到最后一帧，继续下一个动画
                        break;
                    case 2:
                        linked.positive  = linked.negative = [];//清空该元素的所有动画
                        break;
                    case 3:
                        for(var ii=0, _fx; _fx= linked.positive[ii++]; ){
                            _fx.gotoEnd = true;//立即完成该元素的所有动画
                        }
                        break;
                }
                delete linked.stopCode;
                isEnd = fx.gotoEnd || (now >= fx.startTime + config.duration);
                //node, 是否结束, 进度
                fx.render(node, isEnd, (now - fx.startTime)/config.duration); // 处理渐变
                if(fx.render === $.noop) { //立即开始下一个动画
                    linked.positive.shift();
                }else{
                    if( (mix = config.frame ) && !isEnd ){
                        mix.call(node, node, props, fx ) ;
                    }
                }
                if (isEnd) {//如果动画结束，则做还原，倒带，跳出列队等相关操作
                    if(config.method == "hide"){
                        for(var i in config.orig){//还原为初始状态
                            $.css( node, i, config.orig[i] )
                        }
                    }
                    linked.positive.shift(); //去掉播放完的动画
                    mix = config.after;
                    mix &&  mix.call( node, node, fx.props, fx ) ;
                    if (config.rewind && linked.negative.length) {
                        //开始倒带,将负向列队的动画加入播放列表中
                        [].unshift.apply(linked.positive, linked.negative.reverse())
                        linked.negative = []; // 清空负向列队
                    }
                    if (!linked.positive.length) {
                        linked.run = false;
                    }
                }

            } else { // 初始化动画
                fx.render = fxBuilder(node, linked, props, config); // 生成补间动画函数
                mix = config.before
                mix && (mix.call( node, node, fx.props, fx ), config.before = 0);
                $[ config.method ].call(node, node, props, fx );//供show, hide 方法调用
                fx.startTime = now = +new Date;
            }

        }
        return linked.run; // 调用 clearInterval方法，中止定时器
    }
    function visible(node) {
        return  $.css(node, "display") !== 'none';
    }
    function fxBuilder( node, linked, props, config ){
        var ret = "var style = node.style,t2d = {}, adapter = $.fxAdapter , _defaultTween = adapter._default.tween;",
        rewindConfig = $.Object.merge( {}, config ),
        transfromChanged = 0,
        rewindProps = {};
        var orig = config.orig = {}, parts, to, from, val, unit, easing, op, type
        for(var name in props){
            val = props[name] //取得结束值
            if( val == null){
                continue;
            }
            easing = config.easing;//公共缓动公式
            type = $.fxAdapter.type(name);
            from = $.fxAdapter[ type ].get(node,name);
            //用于分解属性包中的样式或属性,变成可以计算的因子
            if( val === "show" || (val === "toggle" && !visible(node))){
                val = $._data(node,"old"+name) || from;
                config.method = "show";
                from = 0;
            }else if(val === "hide" || val === "toggle" ){//hide
                orig[name] =  $._data(node,"old"+name,from);
                config.method = "hide";
                val = 0;
            }else if(typeof val === "object" && isFinite(val.length)){// array
                parts = val;
                val = parts[0];//取得第一个值
                easing = parts[1] || easing;//取得第二个值或默认值
            }
            //开始分解结束值to
            if(type != "color" ){//如果不是颜色，则需判定其有没有单位以及起止值单位不一致的情况
                from = from == "auto" ? 0 : parseFloat(from)//确保from为数字
                if( (parts = rfxnum.exec( val )) ){
                    to = parseFloat( parts[2] ),//确保to为数字
                    unit = $.cssNumber[ name ] ? "" : (parts[3] || "px");
                    if(parts[1]){
                        op = parts[1].charAt(0);
                        if (unit && unit !== "px" && (op == "+" || op == "-")  ) {
                            $.css(node, name, (to || 1) + unit);
                            from = ((to || 1) / parseFloat($.css(node,name))) * from;
                            $.css( node, name, from + unit);
                        }
                        if(op){//处理+=,-= \= *=
                            to = eval(from+op+to);
                        }
                    }
                    var change = to - from;
                }else{
                    continue;
                }
            }else{
                from = color2array(from);
                to   = color2array(val);
                change = to.map(function(end,i){
                    return end - from[i]
                });
            }
            if(from +"" === to +"" ){//不处理初止值都一样的样式与属性
                continue;
            }
            var hash = {
                name: name,
                to: to,
                from: from ,
                change: change,
                type: type,
                easing: easing,
                unit: unit
            };
            switch( type ){
                case "_default":
                    if(name == "opacity" && !$.support.cssOpacity){
                        ret += $.format('$.css(node,"opacity", (isEnd ? #{to} : _defaultTween(#{from},#{change},"#{easing}", per )));;', hash);
                    }else{
                        ret += $.format('style.#{name} = ((isEnd ? #{to} : _defaultTween(#{from}, #{change},"#{easing}",per )))+"#{unit}";', hash);
                    }
                    break;
                case "scroll":
                    ret += $.format('node.#{name} = (isEnd ? #{to}: _defaultTween(#{from}, #{change},"#{easing}",per ));',hash);
                    break;
                case "color":
                    ret += $.format('style.#{name} = (isEnd ? "rgb(#{to})" : adapter.#{type}.tween(#{from}, #{change},"#{easing}",per));', hash);
                    break;
                case "transform":
                    transfromChanged++
                    ret +=  $.format('t2d.#{name} = [#{from},#{to}, #{change},"#{easing}"];',hash);
                    break
            }
            if(type == "color"){
                from = "rgb("+from.join(",")+")"
            }
            rewindProps[ name ] = [ from , easing ];
        }
       
        if( transfromChanged ){
            ret += 'adapter.transform.set(node, t2d, isEnd, per);'
        }
        if ( config.record || config.rewind ) {
            delete rewindConfig.record;
            delete rewindConfig.rewind;
            linked.negative.push({
                startTime: 0,
                rewinding: 1,//标识正在倒带
                config: rewindConfig,
                props: rewindProps
            });
        }
        //生成补间函数
        return Function( "node,isEnd,per",ret );
    }

    $.easing = {
        linear: function( pos ) {
            return pos;
        },
        swing: function( pos ) {
            return (-Math.cos(pos*Math.PI)/2) + 0.5;
        }
    }

    var colorMap = {
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
    var sandbox,sandboxDoc;
    function callSandbox(parent,callback){
        if ( !sandbox ) {
            sandbox = document.createElement( "iframe" );
            sandbox.frameBorder = sandbox.width = sandbox.height = 0;
        }
        parent.appendChild(sandbox);
        if ( !sandboxDoc || !sandbox.createElement ) {
            sandboxDoc = ( sandbox.contentWindow || sandbox.contentDocument ).document;
            sandboxDoc.write( ( document.compatMode === "CSS1Compat" ? "<!doctype html>" : "" ) + "<html><body>" );
            sandboxDoc.close();
        }
        callback(sandboxDoc);
        parent.removeChild(sandbox);
    }
    function parseColor(color) {
        var value;
        callSandbox( $.html, function(doc){
            var range = doc.body.createTextRange();
            doc.body.style.color = color;
            value = range.queryCommandValue("ForeColor");
        });
        return [value & 0xff, (value & 0xff00) >> 8,  (value & 0xff0000) >> 16];
    }
    function color2array(val) {//将字符串变成数组
        var color = val.toLowerCase(),ret = [];
        if (colorMap[color]) {
            return colorMap[color];
        }
        if (color.indexOf("rgb") == 0) {
            var match = color.match(/(\d+%?)/g),
            factor = match[0].indexOf("%") !== -1 ? 2.55 : 1
            return (colorMap[color] = [ parseInt(match[0]) * factor , parseInt(match[1]) * factor, parseInt(match[2]) * factor ]);
        } else if (color.charAt(0) == '#') {
            if (color.length == 4)
                color = color.replace(/([^#])/g, '$1$1');
            color.replace(/\w{2}/g,function(a){
                ret.push( parseInt(a, 16))
            });
            return (colorMap[color] = ret);
        }
        if(window.VBArray){
            return (colorMap[color] = parseColor(color));
        }
        return colorMap.white;
    }

    var cacheDisplay = $.oneObject("a,abbr,b,span,strong,em,font,i,img,kbd","inline");
    var blocks = $.oneObject("div,h1,h2,h3,h4,h5,h6,section,p","block");
    $.mix(cacheDisplay ,blocks);
    function parseDisplay( nodeName ) {
        if ( !cacheDisplay[ nodeName ] ) {
            var body = document.body, elem = document.createElement(nodeName);
            body.appendChild(elem)
            var display = $.css( elem, "display" );
            body.removeChild(elem);
            // 先尝试连结到当前DOM树去取，但如果此元素的默认样式被污染了，就使用iframe去取
            if ( display === "none" || display === "" ) {
                callSandbox(body, function(doc){
                    elem = doc.createElement( nodeName );
                    doc.body.appendChild( elem );
                    display = $.css( elem, "display" );
                });
            }
            cacheDisplay[ nodeName ] = display;
        }
        return cacheDisplay[ nodeName ];
    }
    //show 开始时计算其width1 height1 保存原来的width height display改为inline-block或block overflow处理 赋值（width1，height1）
    //hide 保存原来的width height 赋值为(0,0) overflow处理 结束时display改为none;
    //toggle 开始时判定其是否隐藏，使用再决定使用何种策略
    $.mix( $, {
        fx:  function ( nodes, duration, hash, effects ){
            nodes = nodes.mass ? nodes : $(nodes);
            var props =  hash || duration || {}
            if(typeof duration === "function"){// fx(obj fn)
                hash = duration;               // fx(obj, 500, fn)
                duration = 500;
            }
            if(typeof hash === "function"){   //  fx(obj, num, fn)
                props.after = hash;           //  fx(obj, num, {after: fn})
            }
            if(effects){
                for(var i in effects){
                    if(typeof effects[i] === "function"){
                        var old = props[i];
                        props[i] = function(node, props, fx ){
                            effects[i].call(node, node, props, fx);
                            if(typeof old === "function"){
                                old.call(node, node, props, fx);
                            }
                        }
                    }else{
                        props[i] = effects[i]
                    }
                }
            }
            return nodes.fx(duration, props);
        },
        show: function(node, props){
            if(node.nodeType == 1 && !visible(node)) {
                var old =  $._data(node, "olddisplay"),
                _default = parseDisplay(node.nodeName),
                display = node.style.display = (old || _default);
                $._data(node, "olddisplay", display);
                node.style.visibility = "visible";
                if(props && ("width" in props || "height" in props)){//如果是缩放操作
                    //修正内联元素的display为inline-block，以让其可以进行width/height的动画渐变
                    if ( display === "inline" && $.css( node, "float" ) === "none" ) {
                        if ( !$.support.inlineBlockNeedsLayout ) {//w3c
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
        },
        hide: function(node, props, fx){
            if(node.nodeType == 1 && visible(node)){
                var config = fx && fx.config;
                var display = $.css( node, "display" );
                if ( display !== "none" && !$._data( node, "olddisplay" ) ) {
                    $._data( node, "olddisplay", display );
                }
                if( config ){//缩小
                    if("width" in props || "height" in props){//如果是缩放操作
                        //确保内容不会溢出,记录原来的overflow属性，因为IE在改变overflowX与overflowY时，overflow不会发生改变
                        config.overflow = [ node.style.overflow, node.style.overflowX, node.style.overflowY ];
                        node.style.overflow = "hidden";
                    }
                    var after = config.after;
                    config.after = function( node, fx, props ){
                        node.style.display = "none";
                        node.style.visibility = "hidden";
                        if ( config.overflow != null && !$.support.keepSize  ) {
                            [ "", "X", "Y" ].forEach(function (postfix,index) {
                                node.style[ "overflow" + postfix ] = config.overflow[index]
                            });
                        }
                        if(typeof after == "function"){
                            after.call( node, node, props, fx );
                        }
                    };
                }else{
                    node.style.display = "none";
                }
            }
        },
        toggle: function( node ){
            $[ visible(node) ? "hide" : "show" ]( node );
        }
    });
    //如果clearQueue为true，是否清空列队
    //如果jumpToEnd为true，是否跳到此动画最后一帧
    $.fn.stop = function( clearQueue, jumpToEnd ){
        clearQueue = clearQueue ? "1" : ""
        jumpToEnd = jumpToEnd ? "1" : "0"
        var stopCode = parseInt( clearQueue+jumpToEnd,2 );//返回0 1 2 3
        return this.each(function(node){
            var linked = $._data( node,"fx");
            if(linked && linked.run){
                linked.stopCode = stopCode;
            }
        });
    }
    // 0 1
    $.fn.delay = function(ms){
        return this.each(function(node){
            var linked = $._data(node,"fx") || $._data( node,"fx",{
                positive:[], //正向列队
                negative:  [], //负向列队
                run: false //
            });
            linked.positive.push(ms);
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
        slideDown: genFx( "show", 1 ),
        slideUp: genFx( "hide", 1 ),
        slideToggle: genFx( "toggle", 1 ),
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

    Object.keys(effects).forEach(function( method ){
        $.fn[ method ] = function( duration, hash ){
            return $.fx( this, duration, hash, effects[method] );
        }
    });
  
    "show,hide".replace( $.rword, function( method ){
        $.fn[ method ] = function(duration, hash){
            if(!arguments.length){
                return this.each(function(){
                    $[ method ]( this );
                })
            }else{
                return $.fx( this, duration, hash, genFx( method , 3) );
            }
        }
    })
    var _toggle = $.fn.toggle;
    $.fn.toggle = function(duration,hash){
        if(!arguments.length){
            return this.each(function(node) {
                $.toggle( node );
            });
        }else if(typeof duration === "function" && typeof duration === "function" ){
            return _toggle.apply(this,arguments)
        }else{
            return $.fx(this, duration, hash, genFx("toggle", 3));
        }
    }
    function beforePuff( node, props, fx ) {
        var position = $.css(node,"position"),
        width = $.css(node,"width"),
        height = $.css(node,"height"),
        left = $.css(node,"left"),
        top = $.css(node,"top");
        node.style.position = "relative";
        $.mix(props, {
            width: "*=1.5",
            height: "*=1.5",
            opacity: "hide",
            left: "-=" + parseInt(width) * 0.25,
            top: "-=" + parseInt(height) * 0.25
        });
        var after = fx.config.after;
        fx.config.after = function( node, props, fx ){
            node.style.position = position;
            node.style.width = width;
            node.style.height = height;
            node.style.left = left;
            node.style.top = top;
            if(typeof after === "function"){
                after.call( node, node, props, fx );
            }
        }
    }
    //扩大1.5倍并淡去
    $.fn.puff = function(duration, hash) {
        return $.fx( this, duration, hash, {
            before:beforePuff
        });
    }
});


//2011.10.10 改进dom.fn.stop
//2011.10.20 改进所有特效函数，让传参更加灵活
//2011.10.21 改进内部的normalizer函数
//2012.2.19 normalizer暴露为$.fx 改进绑定回调的机制
//http://d.hatena.ne.jp/nakamura001/20110823/1314112008
//http://easeljs.com/
//https://github.com/gskinner/TweenJS/tree/
//http://caniuse.com/
//http://gitcp.com/sorenbs/jsgames-articles/resources
//http://www.kesiev.com/akihabara/
//http://www.effectgames.com/effect/
//http://www.effectgames.com/effect/#Article/joe/My_HTML5_CSS3_Browser_Wish_List
//http://www.effectgames.com/games/absorb-hd/
//日本人写的框架,可以参考一下其事件部分http://www.karmagination.com/
//http://shanabrian.com/web/library/cycle.php
//http://slodive.com/freebies/jquery-animate/
//http://wonderfl.net/search?page=2&q=DoTweener
//http://www.phoboslab.org/ztype/
//http://kangax.github.com/fabric.js/kitchensink/

        

})( this, this.document );
/**
 2011.7.11
@开头的为私有的系统变量，防止人们直接调用,
dom.check改为dom["@emitter"]
dom.namespace改为dom["mass"]
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
2011.10.13 dom["@emitter"] -> dom["@target"]
2011.10.16 移除XMLHttpRequest的判定，回调函数将根据依赖列表生成参数，实现更彻底的模块机制
2011.10.20 添加error方法，重构log方法
2011.11.6  重构uuid的相关设施
2011.11.11 多版本共存
2011.12.19 增加define方法
2011.12.22 加载用iframe内增加$变量,用作过渡.
2012.1.15  更换$为命名空间
2012.1.29  升级到v15
2012.1.30 修正_checkFail中的BUG，更名_resolveCallbacks为_checkDeps
2012.2.3 $.define的第二个参数可以为boolean, 允许文件合并后，在标准浏览器跳过补丁模块
不知道什么时候开始，"不要重新发明轮子"这个谚语被传成了"不要重新造轮子"，于是一些人，连造轮子都不肯了。

*/
