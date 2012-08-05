//=========================================
// 模块加载模块（种子模块）2012.1.29 by 司徒正美
//=========================================
void function( global, DOC ){

    var
    _$ = global.$, //保存已有同名变量
    namespace = DOC.URL.replace( /(#.+|\W)/g,''),
    w3c = DOC.dispatchEvent, //w3c事件模型
    HEAD = DOC.head || DOC.getElementsByTagName( "head" )[0],
    commonNs = global[ namespace ], mass = 1, postfix = "",
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

    
    function $( expr, context ){//新版本的基石
        if( $.type( expr,"Function" ) ){ //注意在safari下,typeof nodeList的类型为function,因此必须使用$.type
            $.require( "lang,flow,attr,event,fx,ready", expr );
        }else{
            if( !$.fn )
                throw "@node module is required!"
            return new $.fn.init( expr, context );
        }
    }
    //多版本共存
    if( typeof commonNs !== "function"){
        commonNs = $;//公用命名空间对象
        commonNs.uuid = 1;
    }
    if(commonNs.mass !== mass  ){
        commonNs[ mass ] = $;//保存当前版本的命名空间对象到公用命名空间对象上
        if(commonNs.mass || (_$ && _$.mass == null)) {
            postfix = ( mass + "" ).replace(/\D/g, "" ) ;//是否强制使用多库共存
        }
    }else{
        return;
    }
    
    function mix( receiver, supplier ){
        var args = Array.apply([], arguments ),i = 1, key,//如果最后参数是布尔，判定是否覆写同名属性
        ride = typeof args[args.length - 1] == "boolean" ? args.pop() : true;
        if(args.length === 1){//处理$.mix(hash)的情形
            receiver = !this.window ? this : {} ;
            i = 0;
        }
        while((supplier = args[i++])){
            for ( key in supplier ) {//允许对象糅杂，用户保证都是对象
                if (supplier.hasOwnProperty(key) && (ride || !(key in receiver))) {
                    receiver[ key ] = supplier[ key ];
                }
            }
        }
        return receiver;
    }

    mix( $, {//为此版本的命名空间对象添加成员
        html: DOC.documentElement,
        head: HEAD,
        mix: mix,
        rword: /[^, ]+/g,
        mass: mass,//大家都爱用类库的名字储存版本号，我也跟风了
        "@bind": w3c ? "addEventListener" : "attachEvent",
        "@path": (function( url, scripts, node ){
            scripts = DOC.getElementsByTagName( "script" );
            node = scripts[ scripts.length - 1 ];//FF下可以使用DOC.currentScript
            url = node.hasAttribute ?  node.src : node.getAttribute( 'src', 4 );
            $["@name"] = node.getAttribute("namespace") || "$"
            var str = node.getAttribute("debug")
            $["@debug"] = str == 'true' || str == '1';
            return url.substr( 0, url.lastIndexOf('/') );
        })(),
        
        exports: function( name ) {
            _$ && ( global.$ = _$ );//多库共存
            name = name || $[ "@name" ];//取得当前简短的命名空间
            $[ "@name" ] = name;
            global[ namespace ] = commonNs;
            return global[ name ]  = this;
        },
        
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
        
        log: function ( text, force ){
            if( force === true ){
                $.require( "ready", function(){
                    var div =  DOC.createElement("pre");
                    div.className = "mass_sys_log";
                    div.innerHTML = text +"";//确保为字符串
                    DOC.body.appendChild(div)
                });
            }else if( global.console ){
                global.console.log( text );
            }
        },
        //用于建立一个从元素到数据的引用，用于数据缓存，事件绑定，元素去重
        getUid: global.getComputedStyle ? function( node ){
            return node.uniqueNumber || ( node.uniqueNumber = commonNs.uuid++ );
        }: function( node ){
            if(node.nodeType !== 1){
                return node.uniqueNumber || ( node.uniqueNumber = commonNs.uuid++ );
            }
            var uid = node.getAttribute("uniqueNumber");
            if ( !uid ){
                uid = commonNs.uuid++;
                node.setAttribute( "uniqueNumber", uid );
            }
            return +uid;//确保返回数字
        },
        
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

    $.noop = $.error = $.debug = function(){};
    "Boolean,Number,String,Function,Array,Date,RegExp,Window,Document,Arguments,NodeList".replace( $.rword, function( name ){
        class2type[ "[object " + name + "]" ] = name;
    });
    var
    rmodule =  /([^(\s]+)\(?([^)]*)\)?/,
    loadings = [],//正在加载中的模块列表
    returns = {}, //模块的返回值
    errorStack = [],
    cbi = 1e5 ;//用于生成回调函数的名字
    var modules = $[ "@modules" ] = {
        "@ready" : { }
    };
    //用于处理iframe请求中的$.define，将第一个参数修正为正确的模块名后，交由其父级窗口的命名空间对象的define
    var innerDefine = function( _, deps, callback ){
        var args = arguments, last = args.length - 1
        args[0] = nick.slice(1);
        //锁死$
        args[ last ] =  parent.Function( "$","return "+ args[ last ] )(Ns);
        //将iframe中的函数转换为父窗口的函数
        Ns.define.apply(Ns, args)
    }
    
    function loadJS( name, url ){
        url = url  || $[ "@path" ] +"/"+ name.slice(1) + ".js"
        url += (url.indexOf('?') > 0 ? '&' : '?') + '_time'+ new Date * 1;
        var iframe = DOC.createElement("iframe"),//IE9的onload经常抽疯,IE10 untest
        codes = ['<script>var nick ="', name, '", $ = {}, Ns = parent.', $["@name" ],
        '; $.define = ', innerDefine, '<\/script><script src="',url,'" ',
        (DOC.uniqueID ? "onreadystatechange" : "onload"),
        '="if(/loaded|complete|undefined/i.test(this.readyState) ){ ',
        'Ns._checkDeps();Ns._checkFail(this.ownerDocument,nick); ',
        '} " onerror="Ns._checkFail(this.ownerDocument, nick, true);" ><\/script>' ];
        iframe.style.display = "none";//opera在11.64已经修复了onerror BUG
        //http://www.tech126.com/https-iframe/ http://www.ajaxbbs.net/post/webFront/https-iframe-warning.html
        if( !"1"[0] ){//IE6 iframe在https协议下没有的指定src会弹安全警告框
            iframe.src = "javascript:false"
        }
        HEAD.insertBefore( iframe, HEAD.firstChild );
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.write( codes.join('') );
        doc.close();
        $.bind( iframe, "load", function(){
            if( global.opera && doc.ok == void 0 ){
                $._checkFail(doc, name, true );//模拟opera的script onerror
            }
            doc.write( "<body/>" );//清空内容
            HEAD.removeChild( iframe );//移除iframe
        });
    }

    function install( name, deps, fn ){
        for ( var i = 0,argv = [], d; d = deps[i++]; ) {
            argv.push( returns[ d ] );//从returns对象取得依赖列表中的各模块的返回值
        }
        var ret = fn.apply( global, argv );//执行模块工厂，然后把返回值放到returns对象中
        $.debug( name )
        return ret;
    }
    $.mix({
        //绑定事件(简化版)
        bind: w3c ? function( el, type, fn, phase ){
            el.addEventListener( type, fn, !!phase );
            return fn;
        } : function( el, type, fn ){
            el.attachEvent && el.attachEvent( "on"+type, fn );
            return fn;
        },
        unbind: w3c ? function( el, type, fn, phase ){
            el.removeEventListener( type, fn || $.noop, !!phase );
        } : function( el, type, fn ){
            if ( el.detachEvent ) {
                el.detachEvent( "on" + type, fn || $.noop );
            }
        },
        //请求模块（依赖列表,模块工厂,加载失败时触发的回调）
        require: function( deps, factory, errback ){
            var _deps = {}, // 用于检测它的依赖是否都为2
            args = [],      // 用于依赖列表中的模块的返回值
            dn = 0,         // 需要安装的模块数
            cn = 0;         // 已安装完的模块数
            ( deps +"" ).replace( $.rword, function( url, name, match ){
                dn++;
                match = url.match( rmodule );
                name  = "@"+ match[1];//取得模块名
                if( !modules[ name ] ){ //防止重复生成节点与请求
                    modules[ name ] = { };//state: undefined, 未安装; 1 正在安装; 2 : 已安装
                    loadJS( name, match[2] );//将要安装的模块通过iframe中的script加载下来
                }else if( modules[ name ].state === 2 ){
                    cn++;
                }
                if( !_deps[ name ] ){
                    args.push( name );
                    _deps[ name ] = "司徒正美";//去重，去掉@ready
                }
            });
            var token = factory.token || "@cb"+ ( cbi++ ).toString(32);
            if( dn === cn ){//如果需要安装的等于已安装好的
                (modules[ token ] || {}).state = 2;
                return returns[ token ] = install( token, args, factory );//装配到框架中
            }
            if(typeof errback == "function" ){
                errorStack.push( errback );//压入错误堆栈
            }
            modules[ token ] = {//创建或更新模块的状态
                callback:factory,
                name: token,
                deps: _deps,
                args: args,
                state: 1
            };//在正常情况下模块只能通过_checkDeps执行
            loadings.unshift( token );
            $._checkDeps();//FIX opera BUG。opera在内部解析时修改执行顺序，导致没有执行最后的回调
        },
        //定义模块
        define: function( name, deps, factory ){//模块名,依赖列表,模块本身
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
        //检测此JS文件有没有加载下来
        _checkFail : function(  doc, name, error ){
            doc && (doc.ok = 1);
            if( error || !modules[ name ].state ){
                this.log("Failed to load [[ "+name+" ]]");
                for(var fn; fn = errorStack.shift();)
                    fn();//打印错误堆栈
            }
        },
        //检测此JS模块的依赖是否都已安装完毕,是则安装自身
        _checkDeps: function (){
            loop:
            for ( var i = loadings.length, name; name = loadings[ --i ]; ) {
                var obj = modules[ name ], deps = obj.deps;
                for( var key in deps ){
                    if( deps.hasOwnProperty( key ) && modules[ key ].state != 2 ){
                        continue loop;
                    }
                }
                //如果deps是空对象或者其依赖的模块的状态都是2
                if( obj.state != 2){
                    loadings.splice( i, 1 );//必须先移除再安装，防止在IE下DOM树建完后手动刷新页面，会多次执行它
                    returns[ obj.name ] = install( obj.name, obj.args, obj.callback );
                    obj.state = 2;//只收集模块的返回值
                    $._checkDeps();
                }
            }
        }

    });
    //domReady机制
    var readyFn, ready =  w3c ? "DOMContentLoaded" : "readystatechange" ;
    function fireReady(){
        modules[ "@ready" ].state = 2;
        $._checkDeps();
        if( readyFn ){
            $.unbind( DOC, ready, readyFn );
        }
        fireReady = $.noop;//隋性函数，防止IE9二次调用_checkDeps
    };
    function doScrollCheck() {
        try {
            $.html.doScroll( "left" ) ;
            fireReady();
        } catch(e) {
            setTimeout( doScrollCheck, 31 );
        }
    };

    if ( DOC.readyState === "complete" ) {
        fireReady();//如果在domReady之外加载
    }else {
        $.bind( DOC, ready, readyFn = function(){
            if ( w3c || DOC.readyState === "complete" ){
                fireReady();
            }
        });
        if( $.html.doScroll && self.eval === parent.eval)
            doScrollCheck();
    }
     var rdebug =  /^(init|constructor|lang|query)$|^is|^[A-Z]/;
    function debug(obj, name, module, p){
        var fn = obj[name];
        if( obj.hasOwnProperty(name) && typeof fn == "function" && !fn["@debug"]){
            if( rdebug.test( name )){
                fn["@debug"] = name;
            }else{
                var method = obj[name] = function(){
                    try{
                        return  method["@debug"].apply(this,arguments)
                    }catch(e){
                        $.log( module+"'s "+(p? "$.fn." :"$.")+name+" method error "+e);
                        throw e;
                    }
                }
                for(var i in fn){
                    method[i] = fn[i];
                }
                method["@debug"] = fn;
                method.toString = function(){
                    return fn.toString()
                }
                method.valueOf = function(){
                    return fn.valueOf();
                }
            }
        }
    }
    $.debug = function(name){
        if(!$["@debug"])
            return
        for( var i in $){
            debug($, i, name);
        }
        for( i in $.prototype){
            debug($.prototype, i, name,1);
        }
    }
    global.VBArray && ("abbr,article,aside,audio,bdi,canvas,data,datalist,details,figcaption,figure,footer," +
        "header,hgroup,mark,meter,nav,output,progress,section,summary,time,video").replace( $.rword, function( tag ){
        DOC.createElement(tag);
    });
    for(var i in $){
        if( !$[i].mass && typeof $[i] == "function"){
            $[i]["@debug"] = i;
        }
    }
    //https://developer.mozilla.org/en/DOM/window.onpopstate
    $.bind( global, "popstate", function(){
        namespace = DOC.URL.replace(/(#.+|\W)/g,'');
        $.exports();
    });
    $.exports( $["@name"]+  postfix );//防止不同版本的命名空间冲突
var module_value = {
            state: 2
        };
        var __core__ =  "mass,lang_fix,lang,support,class,node,query,data,node,css_fix,css,event_fix,event,attr,flow,ajax,fx".match(/\w+/g)
        for(var i = 0, n ; n = __core__[i++];){
            if(n !== "mass"){
                modules["@"+n] = module_value;
            }
        }//=========================================
//  语言补丁模块
//==========================================
$.define( "lang_fix", !!Array.isArray, function(){
     $.log("已加载语言补丁模块");
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
        create: function(o){
            if (arguments.length > 1) {
                $.log(" Object.create implementation only accepts the first parameter.")
            }
            function F() {}
            F.prototype = o;
            return new F();
        },
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
        //定位操作，返回数组中第一个等于给定参数的元素的索引值。
        indexOf: function (item, index) {
            var n = this.length, i = ~~index;
            if (i < 0) i += n;
            for (; i < n; i++)
                if ( this[i] === item) return i;
            return -1;
        },
        //定位引操作，同上，不过是从后遍历。
        lastIndexOf: function (item, index) {
            var n = this.length,
            i = index == null ? n - 1 : index;
            if (i < 0) i = Math.max(0, n + i);
            for (; i >= 0; i--)
                if (this[i] === item) return i;
            return -1;
        },
        //迭代操作，将数组的元素挨个儿传入一个函数中执行。Ptototype.js的对应名字为each。
        forEach : iterator('', '_', ''),
        //迭代类 在数组中的每个项上运行一个函数，如果此函数的值为真，则此元素作为新数组的元素收集起来，并返回新数组
        filter : iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r'),
        //收集操作，将数组的元素挨个儿传入一个函数中执行，然后把它们的返回值组成一个新数组返回。Ptototype.js的对应名字为collect。
        map :  iterator('r=[],', 'r[i]=_', 'return r'),
        //只要数组中有一个元素满足条件（放进给定函数返回true），那么它就返回true。Ptototype.js的对应名字为any。
        some : iterator('', 'if(_)return true', 'return false'),
        //只有数组中的元素都满足条件（放进给定函数返回true），它才返回true。Ptototype.js的对应名字为all。
        every : iterator('', 'if(!_)return false', 'return true'),
        //归化类 javascript1.8  将该数组的每个元素和前一次调用的结果运行一个函数，返回最后的结果。
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
    if([1,2,3].splice(1).length === 0){
        var _splice = Array[P].splice;
        Array[P].splice = function(a){
            if(arguments.length === 1){
                return _splice.call(this, a, this.length)
            }else{
                return _splice.apply(this, arguments);
            }
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
            return this.setFullYear(year );//+ 1900
        };
    }

    
    var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === void 0, // NPCG: nonparticipating capturing group
    fix = function (str, separator, limit) {
        // If `separator` is not a regex, use `nativeSplit`
        if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
            return nativeSplit.call(str, separator, limit);
        }
        var output = [],
        flags = (separator.ignoreCase ? "i" : "") +
        (separator.multiline  ? "m" : "") +
        (separator.extended   ? "x" : "") + // Proposed for ES6
        (separator.sticky     ? "y" : ""), // Firefox 3+
        lastLastIndex = 0,
        // Make `global` and avoid `lastIndex` issues by working with a copy
        separator = new RegExp(separator.source, flags + "g"),
        separator2, match, lastIndex, lastLength;
        str += ""; // Type-convert
        if (!compliantExecNpcg) {
            // Doesn't need flags gy, but they don't hurt
            separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
        }
        
        limit = limit === void 0 ?
        -1 >>> 0 : // Math.pow(2, 32) - 1
        limit >>> 0; // ToUint32(limit)
        while (match = separator.exec(str)) {
            // `separator.lastIndex` is not reliable cross-browser
            lastIndex = match.index + match[0].length;
            if (lastIndex > lastLastIndex) {
                output.push(str.slice(lastLastIndex, match.index));
                // Fix browsers whose `exec` methods don't consistently return `undefined` for
                // nonparticipating capturing groups
                if (!compliantExecNpcg && match.length > 1) {
                    match[0].replace(separator2, function () {
                        for (var i = 1; i < arguments.length - 2; i++) {
                            if (arguments[i] === void 0) {
                                match[i] = void 0;
                            }
                        }
                    });
                }
                if (match.length > 1 && match.index < str.length) {
                    Array.prototype.push.apply(output, match.slice(1));
                }
                lastLength = match[0].length;
                lastLastIndex = lastIndex;
                if (output.length >= limit) {
                    break;
                }
            }
            if (separator.lastIndex === match.index) {
                separator.lastIndex++; // Avoid an infinite loop
            }
        }
        if (lastLastIndex === str.length) {
            if (lastLength || !separator.test("")) {
                output.push("");
            }
        } else {
            output.push(str.slice(lastLastIndex));
        }
        return output.length > limit ? output.slice(0, limit) : output;
    };
    // For convenience
    String.prototype.split = function (separator, limit) {
        return fix(this, separator, limit);
    };
});


//=========================================
// 类型扩展模块v7 by 司徒正美
//=========================================
$.define("lang", Array.isArray ? "" : "lang_fix",function(){
    $.log("已加载语言扩展模块");
    var global = this,
    rformat = /\\?\#{([^{}]+)\}/gm,
    rnoclose = /^(area|base|basefont|bgsound|br|col|frame|hr|img|input|isindex|link|meta|param|embed|wbr)$/i,
    // JSON RegExp
    rvalidchars = /^[\],:{}\s]*$/,
    rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
    rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    str_eval = global.execScript ? "execScript" : "eval",
    str_body = (global.open + '').replace(/open/g, '');
    Escapes = {
        "\\": "\\\\",
        '"': '\\"',
        "\b": "\\b",
        "\f": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "\t": "\\t"
    };

    // Internal: Converts `value` into a zero-padded string such that its
    // length is at least equal to `width`. The `width` must be <= 6.
    var toPaddedString = function (width, value) {
        // The `|| 0` expression is necessary to work around a bug in
        // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
        return ("000000" + (value || 0)).slice(-width);
    };
    $.mix({
        //判定是否是一个朴素的javascript对象（Object或JSON），不是DOM对象，不是BOM对象，不是自定义类的实例。
        isPlainObject: function (obj){
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
        isNative: function(obj, method) {
            var m = obj ? obj[method] : false, r = new RegExp(method, 'g');
            return !!(m && typeof m != 'string' && str_body === (m + '').replace(r, ''));
        },
        
        isEmptyObject: function(obj ) {
            for ( var i in obj ){
                return false;
            }
            return true;
        },
        //限定为Array, Arguments, NodeList与拥有非负整数的length属性的Object对象，视情况添加字符串
        isArrayLike:  function (obj, str) {//是否包含字符串
            var type = $.type(obj);
            if(type === "Array" || type === "NodeList" || type === "Arguments" || str && type === "String"){
                return true;
            }
            if( type === "Object" ){
                var i = obj.length;
                return i >= 0 &&  parseInt( i ) === i;//非负整数
            }
            return false;
        },
        makeArray: function(obj){
            if (obj == null) {
                return [];
            }
            if($.isArrayLike(obj)){
                return $.slice( obj )
            }
            return [ obj ]
        },
        //将字符串中的占位符替换为对应的键值
        //http://www.cnblogs.com/rubylouvre/archive/2011/05/02/1972176.html
        format: function(str, object){
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
        
        tag: function (start, content, xml){
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
        range: function(start, end, step) {
            step || (step = 1);
            if (end == null) {
                end = start || 0;
                start = 0;
            }
            // use `Array(length)` so V8 will avoid the slower "dictionary" mode
            // http://www.youtube.com/watch?v=XAqIpGU8ZZk#t=16m27s
            var index = -1,
            length = Math.max(0, Math.ceil((end - start) / step)),
            result = Array(length);

            while (++index < length) {
                result[index] = start;
                start += step;
            }
            return result;
        },
        // 为字符串两端添上双引号,并对内部需要转义的地方进行转义
//        quote:  String.quote ||  (function(){
//            var meta = {
//                '\b': '\\b',
//                '\t': '\\t',
//                '\n': '\\n',
//                '\f': '\\f',
//                '\r': '\\r',
//                '"' : '\\"',
//                '\\': '\\\\'
//            },
//            reg = /[\x00-\x1F\'\"\\\u007F-\uFFFF]/g,
//            regFn = function(c){
//                if (c in meta) {
//                    return '\\' + meta[c];
//                }
//                var ord = c.charCodeAt(0);
//                return ord < 0x20   ? '\\x0' + ord.toString(16)
//                :  ord < 0x7F   ? '\\'   + c
//                :  ord < 0x100  ? '\\x'  + ord.toString(16)
//                :  ord < 0x1000 ? '\\u0' + ord.toString(16)
//                : '\\u'  + ord.toString(16)
//            };
//            return function (str) {
//                return    '"' + (str||"").replace(reg, regFn)+ '"';
//            }
//        })(),
        
        quote : function (value) {
            var result = '"', index = 0, symbol;
            for (; symbol = value.charAt(index); index++) {
                // Escape the reverse solidus, double quote, backspace, form feed, line
                // feed, carriage return, and tab characters.
                result += '\\"\b\f\n\r\t'.indexOf(symbol) > -1 ? Escapes[symbol] :
                // If the character is a control character, append its Unicode escape
                // sequence; otherwise, append the character as-is.
                symbol < " " ? "\\u00" + toPaddedString(2, symbol.charCodeAt(0).toString(16)) : symbol;
            }
            return result + '"';
        },
        dump: function(obj, indent) {
            indent = indent || "";
            if (obj == null)//处理null,undefined
                return indent + "obj";
            if (obj.nodeType === 9)
                return indent + "[object Document]";
            if (obj.nodeType)
                return indent + "[object " + (obj.tagName || "Node") +"]";
            var arr = [], type = $.type(obj),self = $.dump ,next = indent +  "\t";
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
                case "Window" :
                    return indent + "[object "+type +"]";
                default:
                    if($.isArrayLike(obj)){
                        for (var i = 0, n = obj.length; i < n; ++i)
                            arr.push(self(obj[i], next).replace(/^\s* /g, next));
                        return indent + "[\n" + arr.join(",\n") + "\n" + indent + "]";
                    }
                    if($.isPlainObject(obj)){
                        for ( i in obj) {
                            arr.push(next + self(i) + ": " + self(obj[i], next).replace(/^\s+/g, ""));
                        }
                        return indent + "{\n" + arr.join(",\n") + "\n" + indent + "}";
                    }
                    return indent + "[object "+type +"]";
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
            throw "Invalid JSON: " + data ;
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
                throw "Invalid XML: " + data ;
            }
            return xml;
        },
        //http://oldenburgs.org/playground/autocomplete/
        //http://benalman.com/projects/jquery-throttle-debounce-plugin/
        //http://www.cnblogs.com/ambar/archive/2011/10/08/throttle-and-debounce.html
        throttle: function( delay, no_trailing, callback, debounce_mode ) {
            var timeout_id, last_exec = 0;//ms 时间内只执行 fn 一次, 即使这段时间内 fn 被调用多次
            if ( typeof no_trailing !== 'boolean' ) {
                debounce_mode = callback;
                callback = no_trailing;
                no_trailing = undefined;
            }
            function wrapper() {
                var that = this,
                elapsed = +new Date() - last_exec,
                args = arguments;
                function exec() {
                    last_exec = +new Date();
                    callback.apply( that, args );
                };
                function clear() {
                    timeout_id = undefined;
                };
                if ( debounce_mode && !timeout_id ) {
                    exec();
                }
                timeout_id && clearTimeout( timeout_id );
                if ( debounce_mode === undefined && elapsed > delay ) {
                    exec();
                } else if ( no_trailing !== true ) {
                    timeout_id = setTimeout( debounce_mode ? clear : exec, debounce_mode === undefined ? delay - elapsed : delay );
                }
            };
            wrapper.uniqueNumber = $.getUid(callback)
            return wrapper;
        },
        debounce : function( delay, at_begin, callback ) {
            return callback === undefined
            ? $.throttle( delay, at_begin, false )
            : $.throttle( delay, callback, at_begin !== false );
        }

    }, false);
   
    "Array,Function".replace($.rword, function( method ){
        $[ "is"+method ] = function(obj){
            return obj && ({}).toString.call(obj) === "[object "+method+"]";
        }
    });
    "each,map".replace($.rword, function( method ){
        $[ method ] = function(obj, fn, scope){
            return $[ $.isArrayLike(obj,true) ? "Array" : "Object" ][ method ](obj, fn, scope);
        }
    });
    if(Array.isArray){
        $.isArray = Array.isArray;
    }
    //这只是一个入口
    $.lang = function(obj, type){
        return adjust(new Chain, obj, type)
    }
    //调整Chain实例的重要属性
    function adjust(chain, obj, type){
        type = type || $.type(obj);
        if( type != "Array" && $.isArrayLike(type) ){
            obj = $.slice(obj);
            type = "Array";
        }
        chain.target = obj;
        chain.type = type;
        return chain
    }
    //语言链对象
    var Chain = function(){ }
    Chain.prototype = {
        constructor: Chain,
        toString: function(){
            return this.target + "";
        },
        value: function(){
            return this.target;
        }
    };

    var retouch = function(method){//函数变换，静态转原型
        return function(){
            [].unshift.call(arguments,this)
            return method.apply(null,arguments)
        }
    }
    var proto = Chain.prototype;
    //构建语言链对象的四个重要工具:$.String, $.Array, $.Number, $.Object
    "String,Array,Number,Object".replace($.rword, function(Type){
        $[ Type ] = function(ext){
            var isNative = typeof ext == "string",
            methods = isNative ? ext.match($.rword) : Object.keys(ext);
            methods.forEach(function(name){
                $[ Type ][name] = isNative ? function(obj){
                    return obj[name].apply(obj,$.slice(arguments,1) );
                } :  ext[name];
                proto[name] = function(){
                    var target = this.target;
                    if( target == null){
                        return this;
                    }else{
                        if( !(target[name] || $[ this.type ][name]) ){
                            throw "$."+ this.type + "."+name+" does not exist!"
                        }
                        var method = isNative ? target[name] : retouch( $[ this.type ][name] ),
                        next = this.target = method.apply( target, arguments ),
                        type = $.type( next );
                        if( type === this.type){
                            return this;
                        }else{
                            return adjust(this, next, type)
                        }
                    }
                }
            });
        }
    });

    $.String({
        //判断一个字符串是否包含另一个字符
        contains: function(target, str, separator){
            return separator ?
            (separator + target + separator).indexOf(separator + str + separator) > -1 :
            target.indexOf(str) > -1;
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
        repeat: function(target, n){
            var result = "";
            while (n > 0) {
                if (n & 1)
                    result += target;
                target += target;
                n >>= 1;
            }
            return result;
        },
        
        // byteLen: function(target){
        //     return target.replace(/[^\x00-\xff]/g,"--").length;
        // },
        byteLen: function(str){
            for(var i = 0, cnt = 0; i < str.length; i++){
                var value = str.charCodeAt(i);
                if(value < 0x080){
                    cnt += 1
                }else if(value < 0x0800){
                    cnt += 2
                }else{
                    cnt += 3
                }
            }
            return cnt;
        },
        //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
        truncate: function(target, length, truncation) {
            length = length || 30;
            truncation = truncation === void(0) ? '...' : truncation;
            return target.length > length ?
            target.slice(0, length - truncation.length) + truncation : String(target);
        },
        //转换为驼峰风格
        camelize: function(target){
            if (target.indexOf('-') < 0 && target.indexOf('_') < 0) {
                return target;//提前判断，提高getStyle等的效率
            }
            return target.replace(/[-_][^-_]/g, function (match) {
                return match.charAt(1).toUpperCase();
            });
        },
        //转换为下划线风格
        underscored: function(target) {
            return target.replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/\-/g, '_').toLowerCase();
        },
        //首字母大写
        capitalize: function(target){
            return target.charAt(0).toUpperCase() + target.substring(1).toLowerCase();
        },
        //移除字符串中的html标签，但这方法有缺陷，如里面有script标签，会把这些不该显示出来的脚本也显示出来了
        stripTags: function (target) {
            return String(target ||"").replace(/<[^>]+>/g, '');
        },
        //移除字符串中所有的 script 标签。弥补stripTags方法的缺陷。此方法应在stripTags之前调用。
        stripScripts: function(target){
            return String(target ||"").replace(/<script[^>]*>([\S\s]*?)<\/script>/img,'')
        },
        //将字符串经过 html 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt;
        escapeHTML:  function (target) {
            return target.replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        },
        //还原为可被文档解析的HTML标签
        unescapeHTML: function (target) {
            return  target.replace(/&quot;/g,'"')
            .replace(/&lt;/g,'<')
            .replace(/&gt;/g,'>')
            .replace(/&amp;/g, "&"); //处理转义的中文和实体字符
            return target.replace(/&#([\d]+);/g, function($0, $1){
                return String.fromCharCode(parseInt($1, 10));
            });
        },

        //http://stevenlevithan.com/regex/xregexp/
        //将字符串安全格式化为正则表达式的源码
        escapeRegExp: function( target ){
            return (target+"").replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
        },
        //http://www.cnblogs.com/rubylouvre/archive/2010/02/09/1666165.html
        //在左边补上一些字符,默认为0
        pad: function( target, n, filling, right, radix){
            var num = target.toString(radix || 10);
            filling = filling || "0";
            while(num.length < n){
                if(!right){
                    num = filling + num;
                }else{
                    num += filling;
                }
            }
            return num;
        },
        
        wbr: function (target) {
            return String(target)
            .replace(/(?:<[^>]+>)|(?:&#?[0-9a-z]{2,6};)|(.{1})/gi, '/*combine modules*/<wbr>')
            .replace(/><wbr>/g, '>');
        }
    });

    if(global.netscape && global.Blob){//不要使用window前缀
        $.String.byteLen = function(str){
            return new Blob([str],{
                type:"text/css"
            }).size
        }
    }
    if(global.Buffer){//不要使用window前缀
        $.String.byteLen = function(str){
            return new Buffer(str, "utf-8").length
        }
    }
    $.String("charAt,charCodeAt,concat,indexOf,lastIndexOf,localeCompare,match,"+
        "replace,search,slice,split,substring,toLowerCase,toLocaleLowerCase,toUpperCase,trim,toJSON")
    $.Array({
        //判定数组是否包含指定目标。
        contains: function ( target, item ) {
            return !!~target.indexOf(item) ;
        },
        //移除数组中指定位置的元素，返回布尔表示成功与否。
        removeAt: function ( target, index ) {
            return !!target.splice(index, 1).length
        },
        //移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否。
        remove: function ( target, item ) {
            var index = target.indexOf(item);
            if (~index )
                return $.Array.removeAt(target, index);
            return false;
        },
        merge: function( first, second ) {
            var i = ~~first.length, j = 0;
            for ( var n = second.length; j < n; j++ ) {
                first[ i++ ] = second[ j ];
            }
            first.length = i;
            return first;
        },
        //对数组进行洗牌。若不想影响原数组，可以先拷贝一份出来操作。
        // Jonas Raoni Soares Silva http://jsfromhell.com/array/shuffle [v1.0]
        shuffle: function ( target ) {
            var j, x, i = target.length;
            for (; i > 0; j = parseInt(Math.random() * i),
                x = target[--i], target[i] = target[j], target[j] = x) {};
            return target;
        },
        //从数组中随机抽选一个元素出来。
        random: function ( target ) {
            return $.Array.shuffle( target.concat() )[0];
        },
        //对数组进行平坦化处理，返回一个一维的新数组。
        flatten: function(target) {
            var result = [],self = $.Array.flatten;
            target.forEach(function(item) {
                if ( Array.isArray(item)) {
                    result = result.concat(self(item));
                } else {
                    result.push(item);
                }
            });
            return result;
        },
        // 对数组进行去重操作，返回一个没有重复元素的新数组。
        unique: function ( target ) {
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
        // 过滤数组中的null与undefined，但不影响原数组。
        compact: function ( target ) {
            return target.filter(function (el) {
                return el != null;
            });
        },
        //根据指定条件进行排序，通常用于对象数组。
        sortBy: function( target, fn, scope ) {
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
        //根据指定条件（如回调或对象的某个属性）进行分组，构成对象返回。
        groupBy: function (target, val) {
            var result = {};
            var iterator = $.isFunction(val) ? val : function(obj) {
                return obj[val];
            };
            target.forEach( function(value, index) {
                var key = iterator(value, index);
                (result[key] || (result[key] = [])).push(value);
            });
            return result;
        },
        //取得对象数组的每个元素的指定属性，组成数组返回。
        pluck: function( target, name ){
            var result = [], prop;
            target.forEach(function(item){
                prop = item[name];
                if(prop != null)
                    result.push(prop);
            });
            return result;
        },
        //对两个数组取并集。
        union: function( target, array ){
            return $.Array.unique( $.Array.merge( target, array ) );
        },
        //对两个数组取交集
        intersect: function( target, array ){
            return target.filter(function(n) {
                return ~array.indexOf(n);
            });
        },
        //对两个数组取差集(补集)
        diff: function( target, array ) {
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
        //返回数组中的最小值，用于数字数组。
        min: function( target ) {
            return Math.min.apply(0, target);
        },
        //返回数组中的最大值，用于数字数组。
        max: function( target ) {
            return Math.max.apply(0, target);
        },
        //深拷贝当前数组
        clone: function( target ){
            var i = target.length, result = [];
            while (i--) result[i] = cloneOf(target[i]);
            return result;
        },
        //可中断的forEach迭代器
        each: function( target, fn, scope  ){
            for(var i = 0, n = target.length; i < n; i++){
                if (fn.call(scope || target[i], target[i], i, target) === false)
                    break;
            }
            return target;
        }
    });
    $.Array("concat,join,pop,push,shift,slice,sort,reverse,splice,unshift,"+
        "indexOf,lastIndexOf,every,some,forEach,map,filter,reduce,reduceRight")
    var NumberExt = {
        //确保数值在[n1,n2]闭区间之内,如果超出限界,则置换为离它最近的最大值或最小值
        limit: function(target, n1, n2){
            var a = [n1, n2].sort();
            if(target < a[0]) target = a[0];
            if(target > a[1]) target = a[1];
            return target;
        },
        //求出距离指定数值最近的那个数
        nearer: function(target, n1, n2){
            var diff1 = Math.abs(target - n1),
            diff2 = Math.abs(target - n2);
            return diff1 < diff2 ? n1 : n2
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
    "abs,acos,asin,atan,atan2,ceil,cos,exp,floor,log,pow,sin,sqrt,tan".replace($.rword,function(name){
        NumberExt[name] = Math[name];
    });
    $.Number(NumberExt);
    $.Number("toFixed,toExponential,toPrecision,toJSON")
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
        if( $.isPlainObject(source[key]) ){//只处理纯JS对象，不处理window与节点
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
        each: function(target, fn, scope){
            var keys = Object.keys(target);
            for(var i = 0, n = keys.length; i < n; i++){
                var key = keys[i], value = target[key];
                if (fn.call(scope || value, value, key, target) === false)
                    break;
            }
            return target;
        },
        map: function(target, fn, scope){
            return Object.keys(target).map(function(name){
                return fn.call(scope, target[name], name, target);
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
                    if(obj[key] !== void 0){
                        mergeOne(target, key, obj[key]);
                    }
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
    $.Object("hasOwnerProperty,isPrototypeOf,propertyIsEnumerable");
    return $.lang;
});

//==========================================
// 特征嗅探模块 by 司徒正美
//==========================================
$.define("support", function(){
    // $.log("已加载特征嗅探模块");
    var DOC = document, div = DOC.createElement('div'),TAGS = "getElementsByTagName";
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
        //现在只有firefox不支持focusin,focus事件,并且它也不支持DOMFocusIn,DOMFocusOut,并且此事件无法通过eventSupport来检测
        focusin : $["@bind"] === "attachEvent",//IE肯定支持
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
    var clickFn
    if ( !div.addEventListener && div.attachEvent && div.fireEvent ) {
        div.attachEvent("onclick", clickFn = function () {
            support.cloneNode = false;//w3c的节点复制是不复制事件的
        });
        div.cloneNode(true).fireEvent("onclick");
        div.detachEvent( "onclick", clickFn );
    }
    var table = div[TAGS]("table")[0]
    try{//检测innerHTML与insertAdjacentHTML在某些元素中是否存在只读（这时会抛错）
        table.innerHTML = "<tr><td>1</td></tr>";
        support.innerHTML = true;
        table.insertAdjacentHTML("afterBegin","<tr><td>2</td></tr>");
        support.insertAdjacentHTML = true;
    }catch(e){ };
    a = select = table = opt = style =  null;
    $.require("ready",function(){
        var body = DOC.body;
        if(!body)//frameset不存在body标签
            return;
        try{
            var range =  DOC.createRange();
            range.selectNodeContents(body); //fix opera(9.2~11.51) bug,必须对文档进行选取
            support.fastFragment = !!range.createContextualFragment("<a>");
            $.commonRange = range;
        }catch(e){ };
        div.style.cssText = "position:absolute;top:-1000px;left:-1000px;"
        body.insertBefore( div, body.firstChild );
        var ib = '<div style="height:20px;display:inline-block"></div>';
        div.innerHTML = ib + ib;//div默认是block,因此两个DIV会上下排列0,但inline-block会让它们左右排列
        support.inlineBlock = div.offsetHeight < 40;//检测是否支持inlineBlock
        div.style.cssText = "width:20px;"
        div.innerHTML = "<div style='width:40px;'></div>";
        support.keepSize = div.offsetWidth == 20;//检测是否会被子元素撑大
        //http://stackoverflow.com/questions/7337670/how-to-detect-focusin-support
        div.innerHTML = "<a href='#'></a>"
        if(!support.focusin){
            var a = div.firstChild;
            a.addEventListener('focusin', function(){
                support.focusin = true;
            }, false);
            a.focus();
        }
        div.style.width = div.style.paddingLeft = "10px";//检测是否支持盒子模型
        support.boxModel = div.offsetWidth === 20;
        if( window.getComputedStyle ) {
            div.style.marginTop = "1%";//检测是否能转换百分比的margin值
            support.cssPercentedMargin = ( window.getComputedStyle( div, null ) || {
                marginTop: 0
            } ).marginTop !== "1%";
        }
        body.removeChild( div );
        div =  null;
    });
    return support;
});

//=========================================
// 类工厂模块
//==========================================
$.define("class", "lang",function(){
   $.log("已加载类工厂模块")
    var
    unextend = $.oneObject(["_super","prototype", 'extend', 'implement' ]),
    rconst = /constructor|_init|_super/,
    classOne = $.oneObject('Object,Array,Function');
    function expand(klass,props){
        'extend,implement'.replace( $.rword, function(name){
            var modules = props[name];
            if( classOne[ $.type( modules) ] ){
                klass[name].apply( klass,[].concat( modules ) );
                delete props[name];
            }
        });
        return klass;
    }

    $.mutators = {
        inherit : function( parent,init ) {
            var bridge = function() { }
            if( typeof parent == "function"){
                for(var i in parent){//继承类成员
                    this[i] = parent[i];
                }
                bridge.prototype = parent.prototype;
                this.prototype = new bridge ;//继承原型成员
                this._super = parent;//指定父类
            }
            this._init = (this._init || []).concat();
            if( init ){
                this._init.push(init);
            }
            this.toString = function(){
                return (init || bridge) + ""
            }
            var proto = this.prototype;
            proto.setOptions = function(){
                var first = arguments[0];
                if( typeof first === "string" ){
                    first =  this[first] || (this[first] = {});
                    [].splice.call( arguments, 0, 1, first );
                }else{
                    [].unshift.call( arguments,this );
                }
                $.Object.merge.apply(null,arguments);
                return this;
            }
            return proto.constructor = this;
        },
        implement:function(){
            var target = this.prototype, reg = rconst;
            for(var i = 0, module; module = arguments[i++]; ){
                module = typeof module === "function" ? new module :module;
                Object.keys(module).forEach(function(name){
                    if( !reg.test(name) ){
                        target[name] = module[name];
                    }
                }, this );
            }
            return this;
        },
        extend: function(){//扩展类成员
            var bridge = {}
            for(var i = 0, module; module = arguments[i++]; ){
                $.mix( bridge, module );
            }
            for( var key in bridge ){
                if( !unextend[key] ){
                    this[key] =  bridge[key]
                }
            }
            return this;
        }
    };
    $.factory = function( obj ){
        obj = obj || {};
        var parent = obj.inherit //父类
        var init = obj.init ;    //构造器
        delete obj.inherit;
        delete obj.init;
        var klass = function () {
            for( var i = 0 , init ; init =  klass._init[i++]; ){
                init.apply(this, arguments);
            }
        };
        $.mix( klass, $.mutators ).inherit( parent, init );//添加更多类方法
        return expand( klass, obj ).implement( obj );
    }
});


//==================================================
// 节点操作模块
//==================================================
$.define( "node", "lang,support,class,query,data,ready",function( lang, support ){
    $.log("已加载node模块");
    var rtag = /^[a-zA-Z]+$/, rtext =/option|script/i, TAGS = "getElementsByTagName"
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
    $.mix( $.mutators ).implement({
        init: function( expr, context ){
            // 分支1: 处理空白字符串,null,undefined参数
            if ( !expr ) {
                return this;
            }
            //分支2:  让$实例与元素节点一样拥有ownerDocument属性
            var doc, nodes;//用作节点搜索的起点
            if($.isArrayLike(context)){//typeof context === "string"
                return $( context ).find( expr );
            }
           
            if ( expr.nodeType ) { //分支3:  处理节点参数
                this.ownerDocument  = expr.nodeType === 9 ? expr : expr.ownerDocument;
                return $.Array.merge( this, [ expr ] );
            }
            this.selector = expr + "";
            if ( typeof expr === "string" ) {
                doc = this.ownerDocument = !context ? document : getDoc( context, context[0] );
                var scope = context || doc;
                if ( expr.charAt(0) === "<" && expr.charAt( expr.length - 1 ) === ">" && expr.length >= 3 ) {
                    nodes = $.parseHTML( expr, doc );//分支5: 动态生成新节点
                    nodes = nodes.childNodes
                } else if( rtag.test( expr ) ){//分支6: getElementsByTagName
                    nodes  = scope[ TAGS ]( expr ) ;
                } else{//分支7：进入选择器模块
                    nodes  = $.query( expr, scope );
                }
                return $.Array.merge( this, $.slice( nodes) );
            }else {//分支8：处理数组，节点集合或者mass对象或window对象
                this.ownerDocument = getDoc( expr[0] );
                $.Array.merge( this, $.isArrayLike(expr) ?  expr : [ expr ]);
                delete this.selector;
            }
        },
        mass: $.mass,
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
            return $.Array.merge( neo, nodes || [] );
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
            return this.slice( 0, 1 );
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
            item = item === void 0 ? item : item == null ?  '' : item+""
            return $.access(this, 0, item, function( el ){//getter
                //如果当前元素不是null, undefined,并确保是元素节点或者nodeName为XML,则进入分支
                //为什么要刻意指出XML标签呢?因为在IE中,这标签并不是一个元素节点,而是内嵌文档
                //的nodeType为9,IE称之为XML数据岛
                if ( el && (el.nodeType === 1 || /xml/i.test(el.nodeName)) ) {
                    return "innerHTML" in el ? el.innerHTML : innerHTML(el)
                }
                return null;
            }, function(el, _, value){//setter
                //接着判断innerHTML属性是否符合标准,不再区分可读与只读
                //用户传参是否包含了script style meta等不能用innerHTML直接进行创建的标签
                //及像col td map legend等需要满足套嵌关系才能创建的标签, 否则会在IE与safari下报错
                if ( support.innerHTML && (!rcreate.test(value) && !rnest.test(value)) ) {
                    try {
                        for ( var i = 0; el = this[ i++ ]; ) {
                            if ( el.nodeType === 1 ) {
                                $.slice( el[TAGS]("*") ).each( cleanNode );
                                el.innerHTML = value;
                            }
                        }
                        return;
                    } catch(e) {};
                }
                this.empty().append( value );
            }, this);
        },
        // 取得或设置节点的text或innerText或textContent属性
        text: function( item ){
            return $.access(this, 0, item, function( el ){
                if( !el ){//getter
                    return "";
                }else if(el.tagName == "OPTION" || el.tagName === "SCRIPT"){
                    return el.text;
                }
                return el.textContent || el.innerText || $.getText( [el] );
            }, function(){//setter
                this.empty().append( this.ownerDocument.createTextNode( item ));
            },this);
        },
        // 取得或设置节点的outerHTML
        outerHTML: function( item ){
            return $.access(this, 0, item, function( el ){
                if( el && el.nodeType === 1 ){
                    return "outerHTML" in el ? el.outerHTML :outerHTML( el );
                }
                return null;
            }, function(){
                this.empty().replace( item );
            }, this);
        }
    });
    $.fn = $.prototype;
    $.fn.init.prototype = $.fn;
    "push,unshift,pop,shift,splice,sort,reverse".replace( $.rword, function( method ){
        $.fn[ method ] = function(){
            Array.prototype[ method ].apply(this, arguments);
            return this;
        }
    });
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
   
    //http://dev.opera.com/articles/view/opera-mobile-emulator-experimental-webkit-prefix-support/
    var prefixes = ['','-webkit-','-o-','-moz-', 'moz-', '-ms-', 'WebKit-','ms-', '-khtml-' ]
    var cssMap = {//支持检测 WebKitMutationObserver WebKitCSSMatrix mozMatchesSelector 
        c:   "color",
        h:   "height",
        o:   "opacity",
        w:   "width",
        x:   "left",
        y:   "top",
        fs:  "fontSize",
        st:  "scrollTop",
        sl:  "scrollLeft",
        bgc: "backgroundColor",
        opacity: "opacity",//fix IE
        "float":  $.support.cssFloat ? 'cssFloat': 'styleFloat'
    };
    function cssName( name, host, test ){//name必须小写开头
        if( cssMap[ name ] ){
            return cssMap[ name ];
        }
        host = host || $.html.style;
        for ( var i = 0, n = prefixes.length; i < n; i++ ) {
            test = $.String.camelize( prefixes[i] + name || "")
            if( test in host ){
                return ( cssMap[ name ] = test );
            }
        }
        return null;
    }
    var matchesAPI = cssName( "matchesSelector",$.html );
    $.mix({
        //http://www.cnblogs.com/rubylouvre/archive/2011/03/28/1998223.html
        cssName: cssName,
        match: function ( node, expr, id ){
            try{
                return node[matchesAPI]( expr );
            } catch(e) {
                var parent = node.parentNode, array
                if( parent ){      
                    array = $.query( expr, node.ownerDocument );
                    return  array.indexOf( node ) != -1
                }
                return false;
            }
        },
        //用于统一配置多态方法的读写访问，涉及方法有text, html,outerHTML,data, attr, prop, val
        access: function( elems, key, value, getter, setter, bind ) {
            var length = elems.length;
            setter = typeof setter === "function" ? setter : getter;
            bind = arguments[arguments.length - 1];
            if ( typeof key === "object" ) {
                for(var k in key){            //为所有元素设置N个属性
                    for ( var i = 0; i < length; i++ ) {
                        setter.call( bind, elems[i], k, key[k] );
                    }
                }
                return elems;
            }
            if ( value !== void 0 ) {
                for ( i = 0; i < length; i++ ) {
                    setter.call(bind, elems[i], key, value );
                }
                return elems;
            } //取得第一个元素的属性, getter的参数总是很小的
            return length ? getter.call( bind, elems[0], key ) : void 0;
        },
        
        parseHTML: function( html, doc ){
            doc = doc || this.nodeType === 9  && this || document;
            html = html.replace( rxhtml, "<$1></$2>" ).trim();
            //尝试使用createContextualFragment获取更高的效率
            //http://www.cnblogs.com/rubylouvre/archive/2011/04/15/2016800.html
            if( $.commonRange && doc === document && !rcreate.test(html) && !rnest.test(html) ){
                return $.commonRange.createContextualFragment( html );
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
    if(!support.createAll ){//IE678在用innerHTML生成节点时存在BUG，不能直接创建script,link,meta,style与HTML5的新标签
        translations._default = [ 1, "X<div>", "</div>" ]
    }
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
        data: function( key, item, pv ){
            return $.access( this, key, item, function(el){
                return  $.data( el, key, item,  pv === true  );
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
    var div = document.createElement( "div" );//缓存parser，防止反复创建
    function shimCloneNode( outerHTML, tree ) {
        tree.appendChild(div);
        div.innerHTML = outerHTML;
        tree.removeChild(div);
        return div.firstChild;
    }
    var unknownTag = "<?XML:NAMESPACE"
    function cloneNode( node, dataAndEvents, deepDataAndEvents ) {
        //   处理IE6-8下复制事件时一系列错误
        if( node.nodeType === 1 ){
            var bool //!undefined === true;
            //这个判定必须这么长：判定是否能克隆新标签，判定是否为元素节点, 判定是否为新标签
            if(!support.cloneHTML5 && node.outerHTML){//延迟创建检测元素
                var outerHTML = document.createElement(node.nodeName).outerHTML;
                bool = outerHTML.indexOf( unknownTag ) // !0 === true;
            }
            //各浏览器cloneNode方法的部分实现差异 http://www.cnblogs.com/snandy/archive/2012/05/06/2473936.html
            var neo = !bool? shimCloneNode( node.outerHTML, document.documentElement ): node.cloneNode(true), src, neos, i;
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
            return neo;
        }else{
            return node.cloneNode(true)
        }
    }
    //修正IE下对数据克隆时出现的一系列问题
    function fixNode( clone, src ) {
        if( src.nodeType == 1 ){
            //只处理元素节点
            var nodeName = clone.nodeName.toLowerCase();
            //clearAttributes方法可以清除元素的所有属性值，如style样式，或者class属性，与attachEvent绑定上去的事件
            clone.clearAttributes();
            //复制原对象的属性到克隆体中,但不包含原来的事件, ID,  NAME, uniqueNumber
            clone.mergeAttributes( src,false );
            //IE6-8无法复制其内部的元素
            if ( nodeName === "object" ) {
                clone.outerHTML = src.outerHTML;
                if ( support.cloneHTML5 && (src.innerHTML && !clone.innerHTML.trim() ) ) {
                    clone.innerHTML = src.innerHTML;
                }
            } else if ( nodeName === "input" && (src.type === "checkbox" || src.type == "radio") ) {
                //IE6-8无法复制chechbox的值，在IE6-7中也defaultChecked属性也遗漏了
                if ( src.checked ) {
                    clone.defaultChecked = clone.checked = src.checked;
                }
                // 除Chrome外，所有浏览器都会给没有value的checkbox一个默认的value值”on”。
                if ( clone.value !== src.value ) {
                    clone.value = src.value;
                }
            } else if ( nodeName === "option" ) {
                clone.selected = src.defaultSelected; // IE6-8 无法保持选中状态
            } else if ( nodeName === "input" || nodeName === "textarea" ) {
                clone.defaultValue = src.defaultValue;            // IE6-8 无法保持默认值
            } else if ( nodeName === "script" && clone.text !== src.text ) {
                clone.text = src.text;//IE6-8不能复制script的text属性
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
            if ( typeof expr === "string" ) {
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
                }else if( typeof expr === "string" && $.match( el, expr ) ){
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
        parentsUntil: function( el ,expr){
            return travel( el, "parentNode",expr ).reverse();
        },
        next: function( el ){//nextSiblingElement支持情况 chrome4+ FF3.5+ IE9+ opera9.8+ safari4+
            return travel( el, "nextSibling", true );
        },
        nextAll: function( el ){
            return travel( el, "nextSibling" );
        },
        nextUntil: function( el, expr){
            return travel( el, "nextSibling",expr );
        },
        prev: function( el ){
            return travel( el, "previousSibling", true );
        },
        prevAll : function( el ){
            return travel( el, "previousSibling" ).reverse();
        },
        prevUntil: function( el, expr ){
            return travel( el, "previousSibling",expr ).reverse();
        },
        children: function( el ){//支持情况chrome1+ FF3.5+,IE5+,opera10+,safari4+
            return  el.children ? $.slice( el.children ) :
            $.slice( el.childNodes ).filter(function( node ){
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
    }).each(function( method, name ){
        $.fn[ name ] = function( expr ){
            var nodes = [];
            for(var i = 0, el ; el = this[i++];){//expr只用于Until
                nodes = nodes.concat( method( el, expr ) );
            }
            if( /Until/.test( name ) ){
                expr = null
            }
            nodes = this.length > 1 && !uniqOne[ name ] ? $.unique( nodes ) : nodes;
            var neo = this.labor(nodes);
            return expr ? neo.filter( expr ) : neo;
        };
    });
});


//$.query v5 开发代号Icarus
$.define("query", function(){
     $.log("已加载选择器模块")
    var global = this, DOC = global.document;
    $.mix({
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
        if ( flag_xml && expr === "body" && context.body )
            return pushResult( [context.body], result, flag_multi );
        if (!flag_xml && doc.querySelectorAll) {
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



//==================================================
// 数据缓存模块
//==================================================
$.define("data", "lang", function(){
    $.log("已加载data模块");
    var remitter = /object|function/, rtype = /[^3]/
    function validate(target){
        return target && remitter.test(typeof target) && rtype.test(target.nodeType)
    }
    $.mix( {
        "@data": {},
        // 读写数据
        data : function( target, name, data, pvt ) {//IE678不能为文本节点注释节点添加数据
            if( validate(target) ){
                var id = $.getUid(target), isEl = target.nodeType === 1;
                if(name === "@uuid"){
                    return id;
                }
                var getByName = typeof name === "string",
                database = isEl ? $["@data"]: target,
                table = database[ "@data_"+id ] || (database[ "@data_"+id ] = {
                    data:{}
                });
                var inner = table;
                //对于用HTML5 data-*属性保存的数据， 如<input id="test" data-full-name="Planet Earth"/>
                //我们可能通过$("#test").data("full-name")或$("#test").data("fullName")访问到
                if(isEl && !table.parsedAttrs){
                    var attrs = target.attributes;
                    //将HTML5单一的字符串数据转化为mass多元化的数据，并储存起来
                    for ( var i = 0, attr; attr = attrs[i++];) {
                        var key = attr.name;
                        if ( key.indexOf( "data-" ) === 0 && key.length > 5 ) {
                            $.parseData(target, key.slice(5), inner, attr.value);
                        }//camelize
                    }
                    table.parsedAttrs = true;
                }
                //私有数据都是直接放到table中，普通数据放到table.data中
                if ( !pvt ) {
                    table = table.data;
                }
                if ( name && typeof name == "object" ) {
                    $.mix( table, name );//写入一组方法
                }else if(getByName && data !== void 0){
                    table[ name ] = data;//写入单个方法
                }
                if(getByName){
                    if(name in table){
                        return table[name]
                    }else if(isEl && !pvt){
                        return $.parseData( target, name, inner );
                    }
                }else{
                    return table
                }
            }
            return  void 0
        },//仅内部调用
        _data:function(target,name,data){
            return $.data(target, name, data, true)
        },
        parseData: function(target, name, table, value){
            var data, key = $.String.camelize(name);
            if(table && (key in table))
                return table[key];
            if(arguments.length != 4){
                var attr = "data-" + name.replace( /([A-Z])/g, "-$1" ).toLowerCase();
                value = target.getAttribute( attr );
            }
            if ( typeof value === "string") {//转换
                try {
                    data = eval("0,"+ value );
                } catch( e ) {
                    data = value
                }
                if(table){
                    table[ key ] = data
                }
            }
            return data;

        },
        //移除数据
        removeData : function(target, name, pvt){
            if( validate(target) ){
                var id =  $.getUid(target);
                if (  !id ) {
                    return;
                }
                var  clear = 1, ret = typeof name == "string",
                database = target.nodeType === 1  ? $["@data"] : target,
                table = database["@data_"+id] ;
                if ( table && ret ) {
                    if(!pvt){
                        table = table.data
                    }
                    if(table){
                        ret = table[ name ];
                        delete table[ name ];
                    }
                    var cache = database["@data_"+id];
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
                    try{
                        delete database["@data_"+id];
                    }catch(e){
                        database["@data_"+id] = void 0;
                    }
                }
                return ret;
            }
        },
        //合并数据
        mergeData: function( cur, src){
            var oldData  = $._data(src), curData  = $._data(cur), events = oldData .events;
            if(oldData  && curData ){
                $.Object.merge( curData , oldData  );
                if(events){
                    curData .events = [];
                    for (var i = 0, item ; item =  events[i++]; ) {
                        $.event.bind.call( cur, item );
                    }
                }
            }
        }
    });
});



//==================================================
// 节点操作模块
//==================================================
$.define( "node", "lang,support,class,query,data,ready",function( lang, support ){
    $.log("已加载node模块");
    var rtag = /^[a-zA-Z]+$/, rtext =/option|script/i, TAGS = "getElementsByTagName"
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
    $.mix( $.mutators ).implement({
        init: function( expr, context ){
            // 分支1: 处理空白字符串,null,undefined参数
            if ( !expr ) {
                return this;
            }
            //分支2:  让$实例与元素节点一样拥有ownerDocument属性
            var doc, nodes;//用作节点搜索的起点
            if($.isArrayLike(context)){//typeof context === "string"
                return $( context ).find( expr );
            }
           
            if ( expr.nodeType ) { //分支3:  处理节点参数
                this.ownerDocument  = expr.nodeType === 9 ? expr : expr.ownerDocument;
                return $.Array.merge( this, [ expr ] );
            }
            this.selector = expr + "";
            if ( typeof expr === "string" ) {
                doc = this.ownerDocument = !context ? document : getDoc( context, context[0] );
                var scope = context || doc;
                if ( expr.charAt(0) === "<" && expr.charAt( expr.length - 1 ) === ">" && expr.length >= 3 ) {
                    nodes = $.parseHTML( expr, doc );//分支5: 动态生成新节点
                    nodes = nodes.childNodes
                } else if( rtag.test( expr ) ){//分支6: getElementsByTagName
                    nodes  = scope[ TAGS ]( expr ) ;
                } else{//分支7：进入选择器模块
                    nodes  = $.query( expr, scope );
                }
                return $.Array.merge( this, $.slice( nodes) );
            }else {//分支8：处理数组，节点集合或者mass对象或window对象
                this.ownerDocument = getDoc( expr[0] );
                $.Array.merge( this, $.isArrayLike(expr) ?  expr : [ expr ]);
                delete this.selector;
            }
        },
        mass: $.mass,
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
            return $.Array.merge( neo, nodes || [] );
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
            return this.slice( 0, 1 );
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
            item = item === void 0 ? item : item == null ?  '' : item+""
            return $.access(this, 0, item, function( el ){//getter
                //如果当前元素不是null, undefined,并确保是元素节点或者nodeName为XML,则进入分支
                //为什么要刻意指出XML标签呢?因为在IE中,这标签并不是一个元素节点,而是内嵌文档
                //的nodeType为9,IE称之为XML数据岛
                if ( el && (el.nodeType === 1 || /xml/i.test(el.nodeName)) ) {
                    return "innerHTML" in el ? el.innerHTML : innerHTML(el)
                }
                return null;
            }, function(el, _, value){//setter
                //接着判断innerHTML属性是否符合标准,不再区分可读与只读
                //用户传参是否包含了script style meta等不能用innerHTML直接进行创建的标签
                //及像col td map legend等需要满足套嵌关系才能创建的标签, 否则会在IE与safari下报错
                if ( support.innerHTML && (!rcreate.test(value) && !rnest.test(value)) ) {
                    try {
                        for ( var i = 0; el = this[ i++ ]; ) {
                            if ( el.nodeType === 1 ) {
                                $.slice( el[TAGS]("*") ).each( cleanNode );
                                el.innerHTML = value;
                            }
                        }
                        return;
                    } catch(e) {};
                }
                this.empty().append( value );
            }, this);
        },
        // 取得或设置节点的text或innerText或textContent属性
        text: function( item ){
            return $.access(this, 0, item, function( el ){
                if( !el ){//getter
                    return "";
                }else if(el.tagName == "OPTION" || el.tagName === "SCRIPT"){
                    return el.text;
                }
                return el.textContent || el.innerText || $.getText( [el] );
            }, function(){//setter
                this.empty().append( this.ownerDocument.createTextNode( item ));
            },this);
        },
        // 取得或设置节点的outerHTML
        outerHTML: function( item ){
            return $.access(this, 0, item, function( el ){
                if( el && el.nodeType === 1 ){
                    return "outerHTML" in el ? el.outerHTML :outerHTML( el );
                }
                return null;
            }, function(){
                this.empty().replace( item );
            }, this);
        }
    });
    $.fn = $.prototype;
    $.fn.init.prototype = $.fn;
    "push,unshift,pop,shift,splice,sort,reverse".replace( $.rword, function( method ){
        $.fn[ method ] = function(){
            Array.prototype[ method ].apply(this, arguments);
            return this;
        }
    });
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
   
    //http://dev.opera.com/articles/view/opera-mobile-emulator-experimental-webkit-prefix-support/
    var prefixes = ['','-webkit-','-o-','-moz-', 'moz-', '-ms-', 'WebKit-','ms-', '-khtml-' ]
    var cssMap = {//支持检测 WebKitMutationObserver WebKitCSSMatrix mozMatchesSelector 
        c:   "color",
        h:   "height",
        o:   "opacity",
        w:   "width",
        x:   "left",
        y:   "top",
        fs:  "fontSize",
        st:  "scrollTop",
        sl:  "scrollLeft",
        bgc: "backgroundColor",
        opacity: "opacity",//fix IE
        "float":  $.support.cssFloat ? 'cssFloat': 'styleFloat'
    };
    function cssName( name, host, test ){//name必须小写开头
        if( cssMap[ name ] ){
            return cssMap[ name ];
        }
        host = host || $.html.style;
        for ( var i = 0, n = prefixes.length; i < n; i++ ) {
            test = $.String.camelize( prefixes[i] + name || "")
            if( test in host ){
                return ( cssMap[ name ] = test );
            }
        }
        return null;
    }
    var matchesAPI = cssName( "matchesSelector",$.html );
    $.mix({
        //http://www.cnblogs.com/rubylouvre/archive/2011/03/28/1998223.html
        cssName: cssName,
        match: function ( node, expr, id ){
            try{
                return node[matchesAPI]( expr );
            } catch(e) {
                var parent = node.parentNode, array
                if( parent ){      
                    array = $.query( expr, node.ownerDocument );
                    return  array.indexOf( node ) != -1
                }
                return false;
            }
        },
        //用于统一配置多态方法的读写访问，涉及方法有text, html,outerHTML,data, attr, prop, val
        access: function( elems, key, value, getter, setter, bind ) {
            var length = elems.length;
            setter = typeof setter === "function" ? setter : getter;
            bind = arguments[arguments.length - 1];
            if ( typeof key === "object" ) {
                for(var k in key){            //为所有元素设置N个属性
                    for ( var i = 0; i < length; i++ ) {
                        setter.call( bind, elems[i], k, key[k] );
                    }
                }
                return elems;
            }
            if ( value !== void 0 ) {
                for ( i = 0; i < length; i++ ) {
                    setter.call(bind, elems[i], key, value );
                }
                return elems;
            } //取得第一个元素的属性, getter的参数总是很小的
            return length ? getter.call( bind, elems[0], key ) : void 0;
        },
        
        parseHTML: function( html, doc ){
            doc = doc || this.nodeType === 9  && this || document;
            html = html.replace( rxhtml, "<$1></$2>" ).trim();
            //尝试使用createContextualFragment获取更高的效率
            //http://www.cnblogs.com/rubylouvre/archive/2011/04/15/2016800.html
            if( $.commonRange && doc === document && !rcreate.test(html) && !rnest.test(html) ){
                return $.commonRange.createContextualFragment( html );
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
    if(!support.createAll ){//IE678在用innerHTML生成节点时存在BUG，不能直接创建script,link,meta,style与HTML5的新标签
        translations._default = [ 1, "X<div>", "</div>" ]
    }
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
        data: function( key, item, pv ){
            return $.access( this, key, item, function(el){
                return  $.data( el, key, item,  pv === true  );
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
    var div = document.createElement( "div" );//缓存parser，防止反复创建
    function shimCloneNode( outerHTML, tree ) {
        tree.appendChild(div);
        div.innerHTML = outerHTML;
        tree.removeChild(div);
        return div.firstChild;
    }
    var unknownTag = "<?XML:NAMESPACE"
    function cloneNode( node, dataAndEvents, deepDataAndEvents ) {
        //   处理IE6-8下复制事件时一系列错误
        if( node.nodeType === 1 ){
            var bool //!undefined === true;
            //这个判定必须这么长：判定是否能克隆新标签，判定是否为元素节点, 判定是否为新标签
            if(!support.cloneHTML5 && node.outerHTML){//延迟创建检测元素
                var outerHTML = document.createElement(node.nodeName).outerHTML;
                bool = outerHTML.indexOf( unknownTag ) // !0 === true;
            }
            //各浏览器cloneNode方法的部分实现差异 http://www.cnblogs.com/snandy/archive/2012/05/06/2473936.html
            var neo = !bool? shimCloneNode( node.outerHTML, document.documentElement ): node.cloneNode(true), src, neos, i;
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
            return neo;
        }else{
            return node.cloneNode(true)
        }
    }
    //修正IE下对数据克隆时出现的一系列问题
    function fixNode( clone, src ) {
        if( src.nodeType == 1 ){
            //只处理元素节点
            var nodeName = clone.nodeName.toLowerCase();
            //clearAttributes方法可以清除元素的所有属性值，如style样式，或者class属性，与attachEvent绑定上去的事件
            clone.clearAttributes();
            //复制原对象的属性到克隆体中,但不包含原来的事件, ID,  NAME, uniqueNumber
            clone.mergeAttributes( src,false );
            //IE6-8无法复制其内部的元素
            if ( nodeName === "object" ) {
                clone.outerHTML = src.outerHTML;
                if ( support.cloneHTML5 && (src.innerHTML && !clone.innerHTML.trim() ) ) {
                    clone.innerHTML = src.innerHTML;
                }
            } else if ( nodeName === "input" && (src.type === "checkbox" || src.type == "radio") ) {
                //IE6-8无法复制chechbox的值，在IE6-7中也defaultChecked属性也遗漏了
                if ( src.checked ) {
                    clone.defaultChecked = clone.checked = src.checked;
                }
                // 除Chrome外，所有浏览器都会给没有value的checkbox一个默认的value值”on”。
                if ( clone.value !== src.value ) {
                    clone.value = src.value;
                }
            } else if ( nodeName === "option" ) {
                clone.selected = src.defaultSelected; // IE6-8 无法保持选中状态
            } else if ( nodeName === "input" || nodeName === "textarea" ) {
                clone.defaultValue = src.defaultValue;            // IE6-8 无法保持默认值
            } else if ( nodeName === "script" && clone.text !== src.text ) {
                clone.text = src.text;//IE6-8不能复制script的text属性
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
            if ( typeof expr === "string" ) {
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
                }else if( typeof expr === "string" && $.match( el, expr ) ){
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
        parentsUntil: function( el ,expr){
            return travel( el, "parentNode",expr ).reverse();
        },
        next: function( el ){//nextSiblingElement支持情况 chrome4+ FF3.5+ IE9+ opera9.8+ safari4+
            return travel( el, "nextSibling", true );
        },
        nextAll: function( el ){
            return travel( el, "nextSibling" );
        },
        nextUntil: function( el, expr){
            return travel( el, "nextSibling",expr );
        },
        prev: function( el ){
            return travel( el, "previousSibling", true );
        },
        prevAll : function( el ){
            return travel( el, "previousSibling" ).reverse();
        },
        prevUntil: function( el, expr ){
            return travel( el, "previousSibling",expr ).reverse();
        },
        children: function( el ){//支持情况chrome1+ FF3.5+,IE5+,opera10+,safari4+
            return  el.children ? $.slice( el.children ) :
            $.slice( el.childNodes ).filter(function( node ){
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
    }).each(function( method, name ){
        $.fn[ name ] = function( expr ){
            var nodes = [];
            for(var i = 0, el ; el = this[i++];){//expr只用于Until
                nodes = nodes.concat( method( el, expr ) );
            }
            if( /Until/.test( name ) ){
                expr = null
            }
            nodes = this.length > 1 && !uniqOne[ name ] ? $.unique( nodes ) : nodes;
            var neo = this.labor(nodes);
            return expr ? neo.filter( expr ) : neo;
        };
    });
});


//=========================================
//  样式补丁模块
//==========================================
$.define("css_fix", !!top.getComputedStyle, function(){
    $.log("已加载css_fix模块");
    var adapter = $.cssAdapter = {},
    ropacity = /opacity=([^)]*)/i,
    ralpha = /alpha\([^)]*\)/i,
    rnumpx = /^-?\d+(?:px)?$/i, 
    rtransform = /(\w+)\(([^)]+)\)/g,
    rnum = /^-?\d/;
    //=========================　处理　opacity　=========================
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
    //http://www.freemathhelp.com/matrix-multiplication.html
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
        thick:  ie8 ? '5px' : '6px'
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
    var ident  = "DXImageTransform.Microsoft.Matrix"
    //deg:degrees 角度,grad grads,百分度 rad	radians, 弧度
    function toRadian(value) {
        return ~value.indexOf("deg") ?
        parseInt(value,10) *  Math.PI/180:
        ~value.indexOf("grad") ?
        parseInt(value,10) * Math.PI/200:
        parseFloat(value);
    }

    adapter[ "transform:get" ] = function(node, name){
        var m = $._data(node,"matrix")
        if(!m){
            if(!node.currentStyle.hasLayout){
                node.style.zoom = 1;
            }
            //IE9下请千万别设置  <meta content="IE=8" http-equiv="X-UA-Compatible"/>
            //http://www.cnblogs.com/Libra/archive/2009/03/24/1420731.html
            if(!node.filters[ident]){
                var old = node.currentStyle.filter;//防止覆盖已有的滤镜
                node.style.filter =  (old ? old +"," : "") + " progid:" + ident + "(sizingMethod='auto expand')";
            }
            var f = node.filters[ident];
            m = new $.Matrix2D( f.M11, f.M12, f.M21, f.M22, f.Dx, f.Dy);
            $._data(node,"matrix",m ) //保存到缓存系统，省得每次都计算
        }
        return name === true ? m : m.toString();
    }

    adapter[ "transform:set" ] = function(node, name, value){
        var m = adapter[ "transform:get" ](node, true).set( 1,0,0,1,0,0 );
        var filter = node.filters[ident];
        filter.M11 =  filter.M22 = 1;//重置矩形
        filter.M12 =  filter.M21 = 0;
        var width = node.offsetWidth
        var height = node.offsetHeight
        var el = $(node);//处理元素的定位问题，保存原来元素与offsetParent的距离
        if(node._mass_top == null && el.css("position") != "static"){
            var p = el.position()
            node._mass_top = p.top;
            node._mass_left = p.left;
        }
        value.toLowerCase().replace(rtransform,function(_,method,array){
            array = array.replace(/px/g,"").match($.rword) || [];
            if(/skew|rotate/.test(method)){//角度必须带单位
                array[0] = toRadian(array[0] );//IE矩阵滤镜的方向是相反的
                array[1] = toRadian(array[1] || "0");
            }
            if(method == "scale" && array[1] == void 0){
                array[1] = array[0] //sy如果没有定义等于sx
            }
            if(method !== "matrix"){
                method = method.replace(/(x|y)$/i,function(_,b){
                    return  b.toUpperCase();//处理translateX translateY scaleX scaleY skewX skewY等大小写问题
                })
            }
            m[method].apply(m, array);
            filter.M11 = m.a;//0
            filter.M12 = m.c;//2★★★注意这里的顺序, IE滤镜和其他浏览器定义的角度方向相反
            filter.M21 = m.b;//1
            filter.M22 = m.d;//3
            filter.Dx  = m.tx;
            filter.Dy  = m.ty;
        //http://extremelysatisfactorytotalitarianism.com/blog/?p=922
        //http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php
        });
        node.style.position = "relative";
        node.style.left = (node._mass_left | 0) + ( width - node.offsetWidth )/2  + m.tx  + "px";
        node.style.top = (node._mass_top | 0) + ( height - node.offsetHeight) /2  + m.ty  + "px";  
        $._data(node,"matrix",m )
    }
});
//2011.10.21 去掉opacity:setter 的style.visibility处理
//2011.11.21 将IE的矩阵滤镜的相应代码转移到这里
//2012.5.9 完美支持CSS3 transform 2D

   
//=========================================
// 样式操作模块 by 司徒正美
//=========================================
$.define( "css", !!top.getComputedStyle ? "node" : "node,css_fix" , function(){
    //$.log( "已加载css模块" );
    var adapter = $.cssAdapter = $.cssAdapter || {}
    var rrelNum = /^([\-+])=([\-+.\de]+)/
    var  rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i
    $.implement({
        css : function( name, value , neo){
            if(typeof name === "string"){
                neo = $.cssName(name) || name;
            }
            return $.access( this, name, value, $.css,  neo || this );
        }
    });

    $.mix({
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
        css: function( node, name, value){
            if(node.style){//注意string经过call之后，变成String伪对象，不能简单用typeof来检测
                name = $.type(this, "String") ? this : $.cssName( name ) || name;
                if( value === void 0){ //取值
                    return (adapter[ name+":get" ] || adapter[ "_default:get" ])( node, name );
                }else {//设值
                    var temp;
                    if ( typeof value === "string" && (temp = rrelNum.exec( value )) ) {
                        value =  ( temp[1] + 1) * temp[2]  + parseFloat( $.css( node, name, void 0) );
                    }
                    if ( isFinite( value ) && !$.cssNumber[ name ] ) {
                        value += "px";
                    }
                    (adapter[name+":set"] || adapter[ "_default:set" ])( node, name, value );
                }
            }
        }
    
    });

    //IE9 FF等支持getComputedStyle
    $.mix(adapter, {
        "_default:set" :function( node, name, value){
            node.style[ name ] = value;
        }
    },false);
    //有关单位转换的 http://heygrady.com/blog/2011/12/21/length-and-angle-unit-conversion-in-javascript/
    if ( document.defaultView && document.defaultView.getComputedStyle ) {
        adapter[ "_default:get" ] = function( node, name ) {
            var ret, defaultView, computedStyle;
            if ( !(defaultView = node.ownerDocument.defaultView) ) {
                return undefined;
            }
            //   var underscored = name == "cssFloat" ? "float" :
            //    name.replace( /([A-Z]|^ms)/g, "-$1" ).toLowerCase(),
            var   rmargin = /^margin/, style = node.style ;
            if ( (computedStyle = defaultView.getComputedStyle( node, null )) ) {
                ret = computedStyle[name]           //.getPropertyValue( underscored );
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
    //http://extremelysatisfactorytotalitarianism.com/blog/?p=1002
    //http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php
    //优化HTML5应用的体验细节，例如全屏的处理与支持，横屏的响应，图形缩放的流畅性和不失真，点触的响应与拖曳，Websocket的完善
    //关于JavaScript中计算精度丢失的问题 http://rockyee.iteye.com/blog/891538
    function toFixed(d){
        return  d > -0.0000001 && d < 0.0000001 ? 0 : /e/.test(d+"") ? d.toFixed(7) :  d;
    }
    function toFloat(d, x){
        return isFinite(d) ? d: parseFloat(d) || x
    }
    //http://zh.wikipedia.org/wiki/%E7%9F%A9%E9%98%B5
    //http://help.dottoro.com/lcebdggm.php
    var Matrix2D = $.factory({
        init: function(){
            this.set.apply(this, arguments);
        },
        cross: function(a, b, c, d, tx, ty) {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            this.a  = toFixed(a*a1+b*c1);
            this.b  = toFixed(a*b1+b*d1);
            this.c  = toFixed(c*a1+d*c1);
            this.d  = toFixed(c*b1+d*d1);
            this.tx = toFixed(tx*a1+ty*c1+this.tx);
            this.ty = toFixed(tx*b1+ty*d1+this.ty);
            return this;
        },
        rotate: function( radian ) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.cross(cos,  sin,  -sin, cos, 0, 0)
        },
        skew: function(sx, sy) {
            return this.cross(1, Math.tan( sy ), Math.tan( sx ), 1, 0, 0);
        },
        skewX: function(radian){
            return this.skew(radian, 0);
        },
        skewY: function(radian){
            return this.skew(0, radian);
        },
        scale: function(x, y) {
            return this.cross( toFloat(x, 1) ,0, 0, toFloat(y, 1), 0, 0)
        },
        scaleX: function(x){
            return this.scale(x ,1);
        },
        scaleY: function(y){
            return this.scale(1 ,y);
        },
        translate : function(x, y) {
            return this.cross(1, 0, 0, 1, toFloat(x, 0), toFloat(y, 0))
        },
        translateX: function(x) {
            return this.translate(x, 0);
        },
        translateY: function(y) {
            return this.translate(0, y);
        },
        toString: function(){
            return "matrix("+this.get()+")";
        },
        get: function(){
            return [this.a,this.b,this.c,this.d,this.tx,this.ty];
        },
        set: function(a, b, c, d, tx, ty){
            this.a = a * 1;
            this.b = b * 1 || 0;
            this.c = c * 1 || 0;
            this.d = d * 1;
            this.tx = tx * 1 || 0;
            this.ty = ty * 1 || 0;
            return this;
        },
        matrix:function(a, b, c, d, tx, ty){
            return this.cross(a, b, c, d, toFloat(tx, 0), toFloat(ty, 0))
        },
        decompose: function() {
            //分解原始数值,返回一个包含translateX,translateY,scale,skewX,rotate的对象
            //https://github.com/louisremi/jquery.transform.js/blob/master/jquery.transform2d.js
            //http://http://mxr.mozilla.org/mozilla-central/source/layout/style/nsStyleAnimation.cpp
            var scaleX, scaleY, skew, A = this.a, B = this.b,C = this.c,D = this.d ;
            if ( A * D - B * C ) {
                // step (3)
                scaleX = Math.sqrt( A * A + B * B );
                A /= scaleX;
                B /= scaleX;
                // step (4)
                skew = A * C + B * D;
                C -= A * skew;
                D -= B * skew;
                // step (5)
                scaleY = Math.sqrt( C * C + D * D );
                C /= scaleY;
                D /= scaleY;
                skew /= scaleY;
                // step (6)
                if ( A * D < B * C ) {
                    A = -A;
                    B = -B;
                    skew = -skew;
                    scaleX = -scaleX;
                }
            } else {
                scaleX = scaleY = skew = 0;
            }
            return [
            ["translate", [+this.tx, +this.ty]],
            ["rotate", Math.atan2(B, A)],
            ["skewX", Math.atan(skew)],
            ["scale", [scaleX, scaleY]]]
        }
    });

    $.Matrix2D = Matrix2D
    var getter = $.cssAdapter["_default:get"], RECT = "getBoundingClientRect",
    //支持情况 ff3.5 chrome ie9 pp6 opara10.5 safari3.1
    cssTransfrom = $.support.transform = $.cssName("transform");
    if( cssTransfrom ){
        adapter[cssTransfrom + ":set"] = function(node, name, value){
            if(value.indexOf("matrix")!== -1 && cssTransfrom === "MozTransform"){
                value = value.replace(/([\d.-]+)\s*,\s*([\d.-]+)\s*\)/,"$1px, $2px)")
            }
            node.style[name] = value;
            var matrix = $._data( node, "matrix" ) || new Matrix2D();
            matrix.set.apply(matrix, getter(node, cssTransfrom).match(/[-+.e\d]+/g).map(function(d){
                return toFixed(d*1)
            }));
            $._data(node, "matrix", matrix );
        }
    }
    //http://granular.cs.umu.se/browserphysics/?cat=7
    //=========================　处理　user-select　=========================
    //https://developer.mozilla.org/en/CSS/-moz-user-select
    //http://www.w3.org/TR/2000/WD-css3-userint-20000216#user-select
    //具体支持情况可见下面网址
    //http://help.dottoro.com/lcrlukea.php
    var userSelect = $.cssName("userSelect");
    if( userSelect ){
        adapter[ userSelect+":set" ] = function( node, name, value ) {
            return node.style[ name ] = value;
        };
    }
    adapter[ "zIndex:get" ] = function( node, name, value, position ) {
        while ( node.nodeType !== 9 ) {
            //即使元素定位了，但如果zindex设置为"aaa"这样的无效值，浏览器都会返回auto，如果没有指定zindex值，IE会返回数字0，其他返回auto
            position = $.css(node, "position" );
            if ( position === "absolute" || position === "relative" || position === "fixed" ) {
                // <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
                value = parseInt( adapter[ "_default:get" ](node,"zIndex"), 10 );
                if ( !isNaN( value ) && value !== 0 ) {
                    return value;
                }
            }
            node = node.parentNode;
        }
        return 0;
    }
    //http://extremelysatisfactorytotalitarianism.com/blog/?p=922
    //http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php#matrix-anim-class
    //=========================　处理　width height　=========================
    
 
    var cssPair = {
        Width:['Left', 'Right'],
        Height:['Top', 'Bottom']
    }
    var cssShow = {
        position: "absolute",
        visibility: "hidden",
        display: "block"
    }
    var showHidden = function(node, array){
        if( node && node.nodeType == 1 && !node.offsetWidth ){
            var obj = {
                node: node
            }
            for (var name in cssShow ) {
                obj[ name ] = node.style[ name ];
                node.style[ name ] = cssShow[ name ];
            }
            array.push( obj );
            if(!node.offsetWidth){//如果设置了offsetWidth还是为零，说明父节点也是隐藏元素，继续往上递归
                showHidden(node.parentNode, array)
            }
        }
    }
    $.support.boxSizing = $.cssName( "boxSizing")
    function getWH( node, name, extra  ) {//注意 name是首字母大写
        var getter  = $.cssAdapter["_default:get"], which = cssPair[name], hidden = [];
        showHidden( node, hidden );
        var val = node["offset" + name]
        //if($.support.boxSizing && $.css(node, "boxSizing" ) === "border-box" && extra == 0 ){ return val;  }
        //innerWidth = paddingWidth outerWidth = borderWidth, width = contentWidth
        which.forEach(function(direction){
            if(extra < 1)
                val -= parseFloat(getter(node, 'padding' + direction)) || 0;
            if(extra < 2)
                val -= parseFloat(getter(node, 'border' + direction + 'Width')) || 0;
            if(extra === 3){
                val += parseFloat(getter(node, 'margin' + direction )) || 0;
            }
        });
        for(var i = 0, obj; obj = hidden[i++];){
            node = obj.node;
            for ( name in obj ) {
                if(typeof obj[ name ] == "string"){
                    node.style[ name ] = obj[ name ];
                }
            }
        }
        return val;
    };
    //生成width, height, innerWidth, innerHeight, outerWidth, outerHeight这六种原型方法
    "Height,Width".replace( $.rword, function(  name ) {
        var lower = name.toLowerCase(),
        clientProp = "client" + name,
        scrollProp = "scroll" + name,
        offsetProp = "offset" + name;
        $.cssAdapter[ lower+":get" ] = function( node ){
            return getWH( node, name, 0 ) + "px";//添加相应适配器
        }
        "inner_1,b_0,outer_2".replace(/(\w+)_(\d)/g,function(a, b, num){
            var method = b == "b" ? lower : b + name;
            $.fn[ method ] = function( value ) {
                num = b == "outer" && value === true ? 3 : num;
                return $.access( this, num, value, function( target, num, size ) {
                    if ( $.type( target,"Window" ) ) {//取得窗口尺寸
                        return target.document.documentElement[ clientProp ];
                    }
                    if ( target.nodeType === 9 ) {//取得页面尺寸
                        var doc = target.documentElement;
                        //IE6/IE7下，<html>的box-sizing默认值本就是border-box
                        if ( doc[ clientProp ] >= doc[ scrollProp ] ) {
                            return doc[ clientProp ];
                        }
                        return Math.max(
                            target.body[ scrollProp ], doc[ scrollProp ],
                            target.body[ offsetProp ], doc[ offsetProp ],
                            doc[ clientProp ]
                            );
                    }  else if ( size === void 0 ) {
                        return getWH( target, name, num )
                    } else {
                        $.log(size)
                        return num > 0  ? this : $.css( target, lower, size );
                    }
                }, this)
            }
        })

    });

    //=======================================================
    //获取body的offset
    function getBodyOffsetNoMargin(){
        var el = document.body, ret = parseFloat($.css(el,"marginTop"))!== el.offsetTop;
        function getBodyOffsetNoMargin(){
            return ret;//一次之后的执行结果
        }
        return ret;//第一次执行结果
    }
    function setOffset(elem, options){
        if(elem && elem.nodeType == 1 ){
            var position = $.css( elem, "position" );
            // set position first, in-case top/left are set even on static elem
            if ( position === "static" ) {
                elem.style.position = "relative";
            }
            var curElem = $( elem ),
            curOffset = curElem.offset(),
            curCSSTop = $.css( elem, "top" ),
            curCSSLeft = $.css( elem, "left" ),
            calculatePosition = ( position === "absolute" || position === "fixed" ) &&  [curCSSTop, curCSSLeft].indexOf("auto") > -1,
            props = {}, curPosition = {}, curTop, curLeft;
            // need to be able to calculate position if either top or left is auto and position is either absolute or fixed
            if ( calculatePosition ) {
                curPosition = curElem.position();
                curTop = curPosition.top;
                curLeft = curPosition.left;
            } else {
                curTop = parseFloat( curCSSTop ) || 0;
                curLeft = parseFloat( curCSSLeft ) || 0;
            }

            if ( options.top != null ) {
                props.top = ( options.top - curOffset.top ) + curTop;
            }
            if ( options.left != null ) {
                props.left = ( options.left - curOffset.left ) + curLeft;
            }
            curElem.css( props );
        }
    }
    $.fn.offset = function(options){//取得第一个元素位于页面的坐标
        if ( arguments.length ) {
            return (!options || ( !isFinite(options.top) && !isFinite(options.left) ) ) ?  this :
            this.each(function() {
                setOffset( this, options );
            });
        }

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
    "show,hide".replace($.rword, function(method){
        $.fn[ method ] = function(){
            return this.each(function(){
                if(this.style){
                    this.style.display = method == "show" ? "" : "hide"
                }
            })
        }
    })
    var rroot = /^(?:body|html)$/i;
    $.implement({
        position: function() {//取得元素相对于其offsetParent的坐标
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
        },
        scrollParent: function() {
            var scrollParent;
            if ((window.VBArray && (/(static|relative)/).test(this.css('position'))) || (/absolute/).test(this.css('position'))) {
                scrollParent = this.parents().filter(function() {
                    return (/(relative|absolute|fixed)/).test($.css(this,'position')) && (/(auto|scroll)/).test($.css(this,'overflow')+$.css(this,'overflow-y')+$.css(this,'overflow-x'));
                }).eq(0);
            } else {
                scrollParent = this.parents().filter(function() {
                    return (/(auto|scroll)/).test($.css(this,'overflow')+$.css(this,'overflow-y')+$.css(this,'overflow-x'));
                }).eq(0);
            }

            return (/fixed/).test(this.css('position')) || !scrollParent.length ? $(document) : scrollParent;
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

});




//=========================================
//  事件补丁模块
//==========================================
$.define("event_fix", !!document.dispatchEvent, function(){
    $.log("已加载event_fix模块")
    //模拟IE678的reset,submit,change的事件代理
    var rform  = /^(?:textarea|input|select)$/i ,
    changeType = {
        "select-one": "selectedIndex",
        "select-multiple": "selectedIndex",
        "radio": "checked",
        "checkbox": "checked"
    }
    function changeNotify( event,type ){
        if( event.propertyName === ( changeType[ this.type ] || "value") ){
            //$._data( this, "_just_changed", true );
            $.event._dispatch( $._data( this, "publisher" ), type, event );
        }
    }
    function delegate( fn ){
        return function( item ){
            var adapter = $.event.eventAdapter, src = item.target, type = item.type,
            fix = adapter[ type ] && adapter[ type ].check && adapter[ type ].check( src, item );
            return (fix || item.live ) ? fn( src, item ) : false;
        }
    }

    var facade = $.event = {
        fire: function( event ){
            //这里的代码仅用于IE678
            if(!event.originalEvent){
                event = new $.Event(event);
            }
            event.target = this;
            var type = event.origType || event.type;
            var detail = $._parseEvent( type );
            detail.args = [].slice.call(arguments,1) ;
            facade.detail = detail;
            if( $["@bind"] in this ){
                var cur = this,  ontype = "on" + type;
                do{//模拟事件冒泡与执行内联事件
                    facade.dispatch( cur, event );
                    if (cur[ ontype ] && cur[ ontype ].call(cur) === false) {
                        event.preventDefault();
                    }
                    cur = cur.parentNode ||
                    cur.ownerDocument ||
                    cur === cur.ownerDocument && window;  //在opera 中节点与window都有document属性
                } while ( cur && !event.isPropagationStopped );
            
                if ( !event.isDefaultPrevented  //如果用户没有阻止普通行为，defaultPrevented
                    && this[ type ] && ontype && !this.eval  //并且事件源不为window，并且是原生事件
                    && (type == "click"|| this.nodeName != "A")//如果是点击事件则元素不能为A因为会跳转
                    && ( (type !== "focus" && type !== "blur") || this.offsetWidth !== 0 ) //focus,blur的目标元素必须可点击到，换言之，拥有“尺寸”
                    ) {
                    var inline = this[ ontype ];
                    var disabled = this.disabled;//当我们直接调用元素的click,submit,reset,focus,blur
                    this.disabled = true;//会触发其默认行为与内联事件,但IE下会再次触发内联事件与多投事件
                    this[ ontype ] = null;
                    if(type == "click" && /checkbox|radio/.test(this.type)){
                        this.checked = !this.checked
                    }
                    this[ type ]();
                    this.disabled = disabled
                    this[ ontype ] = inline;
                }
            }else{//普通对象的自定义事件
                facade.dispatch(this, event);
            }
            delete facade.detail
        },
        eventAdapter: {//input事件的支持情况：IE9+，chrome+, gecko2+, opera10+,safari+
            input: {
                bindType: "change",
                delegateType: "change"
            },
            focus: {
                delegateType: "focusin"
            },
            blur: {
                delegateType: "focusout"
            },
            change: {//change事件的冒泡情况 IE6-9全灭
                check: function(){//详见这里https://github.com/RubyLouvre/mass-Framework/issues/13
                    return true //!target.disabled && rform.test( target.tagName ) &&( item.origType !== "input" || item.nodeName != "SELECT" )
                },
                setup: delegate(function( ancestor, item ){
                    var subscriber = item.subscriber || ( item.subscriber = {}) //用于保存订阅者的UUID
                    item.change_beforeactive = $.bind( ancestor, "beforeactivate", function() {
                        //防止出现跨文档调用的情况,找错event
                        var doc = ancestor.ownerDocument || ancestor.document || ancestor;
                        var target = doc.parentWindow.event.srcElement, tid = $.getUid( target )
                        //如果发现孩子是表单元素并且没有注册propertychange事件，则为其注册一个，那么它们在变化时就会发过来通知顶层元素
                        if ( rform.test( target.tagName) && !subscriber[ tid ] ) {
                            subscriber[ tid ] = target;//将select, checkbox, radio, text, textarea等表单元素注册其上
                            var publisher = $._data( target,"publisher") || $._data( target,"publisher",{} );
                            publisher[ $.getUid(ancestor) ] = ancestor;//此孩子可能同时要向N个顶层元素报告变化
                            item.change_propertychange = $.bind( target, "propertychange", changeNotify.bind(target, event, item.origType))
                        }
                    });//如果是事件绑定
                    ancestor.fireEvent("onbeforeactivate")
                }),
                teardown: delegate(function( src, item ){
                    $.unbind( src, "beforeactive", item.change_beforeactive );
                    //   $.unbind( src, "change",  item.change_fire)  ;
                    var els = item.subscriber || {};
                    for(var i in els){
                        $.unbind( els[i], "propertychange",  item.change_propertychange)  ;
                        var publisher = $._data( els[i], "publisher");
                        if(publisher){
                            delete publisher[ src.uniqueNumber ];
                        }
                    }
                })
            }
        }
    }

    var adapter = facade.eventAdapter;
    // adapter.input = adapter.change;
    //submit事件的冒泡情况----IE6-9 :form ;FF: document; chrome: window;safari:window;opera:window
    //reset事件的冒泡情况----FF与opera能冒泡到document,其他浏览器只能到form
    "submit,reset".replace( $.rword, function( type ){
        adapter[ type ] = {
            setup: delegate(function( src ){
                $.fn.on.call( src, "click._"+type+" keypress._"+type, function( e ) {
                    var el = e.target;
                    if( el.form && (adapter[ type ].keyCode[ e.which ] || adapter[ type ].kind[  el.type ] ) ){
                        facade._dispatch( [ src ], type, e );
                    }
                });
            }),
            keyCode: $.oneObject(type == "submit" ? "13,108" : "27"),
            kind:  $.oneObject(type == "submit" ? "submit,image" : "reset"),
            teardown: delegate(function( src ){
                facade.unbind.call( src, "._"+type );
            })
        };
    });
});
//2012.5.1 fix delegate BUG将submit与reset这两个适配器合而为一



//=========================================
// 事件系统v5
//==========================================
$.define("event", top.dispatchEvent ?  "node" : "node,event_fix",function(){
    $.log("已加载event模块v5")
    var facade = $.event = $.event || {};
    $.Object.merge(facade,{
        eventAdapter:{ } //添加或增强二级属性eventAdapter
    });
    var adapter = $.event.eventAdapter, rhoverHack = /(?:^|\s)hover(\.\S+|)\b/
    var bindTop = !adapter.input;//如果没有加载event_fix模块,也就没有input分支,也就说明其是支持dispatchEvent API
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
    
    var parseEvent = $._parseEvent = function (event, live) {
        var parts = ('' + event).split('.');
        var ns = parts.slice(1).sort().join(' ');
        var type = parts[0], hack, tmp;//input -> change -> propertychange
        while( (hack = adapter[ type ]) ){
            tmp = hack[ live ? "delegateType" : "bindType" ];
            if( !tmp ){
                break
            }else{
                type = tmp
            }
        }
        return {
            type:      type,          //事件类型
            origType:  parts[0],      //原事件类型
            live:      live,          //是否使用了事件代理,可以是正则,字符串,布尔或空值
            ns:        ns,            //命名空间
            rns:       ns ? new RegExp("(^|\\.)" + ns.replace(' ', ' .* ?') + "(\\.|$)") : null
        }
    }
    //events为要过滤的集合,后面个参数为过滤条件
    function findHandlers( events, hash, fn, live ) {
        return events.filter(function(quark) {
            return quark && (!hash.rns || hash.rns.test(quark.ns))  //通过事件类型进行过滤
            && (!hash.origType || hash.origType === quark.origType) //通过命名空间进行进行过滤
            && (!fn || fn.uniqueNumber === quark.uuid)//通过uuid进行过滤
            && (!live || live === quark.live || live === "**" && quark.live )//通过选择器进行过滤
        })
    }
    $.mix(facade,{
        //addEventListner API的支持情况:chrome 1+ FF1.6+	IE9+ opera 7+ safari 1+;
        //http://functionsource.com/post/addeventlistener-all-the-way-back-to-ie-6
        bind: function( hash ){//事件系统三大核心方法之一，绑定事件
            var bindTarget =  $[ "@bind" ] in this,//是否能直接绑定到目标对象上
            events = $._data( this ),              //是否能绑定事件
            types  = hash.type,                    //原有的事件类型,可能是复数个
            live   = hash.live ,                   //是否使用事件代理
            target = this;
            if( !events ){
                return
            }
            if( bindTarget ){                       //处理DOM的hover事件
                types = types.replace( rhoverHack, "mouseover$1 mouseout$1" );
            }
            events = events.events || (events.events = []);
            hash.uuid = $.getUid( hash.fn );       //确保hash.uuid与fn.uuid一致
            types.replace( $.rword, function( t ){
                var quark = parseEvent( t, live), type = quark.origType;
                $.mix(quark, {
                    target: target,                 //this,用于绑定数据的
                    index:  events.length           //记录其在列表的位置，在卸载事件时用
                }, hash, false);
                events.push( quark );                //用于事件拷贝
                var count = events[ type+"_count" ] = ( events[ type+"_count" ] | 0 )+ 1;
                var hack = adapter[ quark.type ] || {};
                if( count == 1 ){
                    quark.handle = facade.handle( quark );
                    $._data( target, "first_" + type, quark);  //用于事件派发：$.event.dispatch
                    if( !hack.setup || hack.setup( quark ) === false  ) {
                        if( bindTarget === false && bindTop ){//如果不能绑到当前对象上,尝试绑到window上
                            target = window;
                        }
                        $.bind(target, quark.type, quark.handle, live);
                    }
                }
            //mass Framework早期的事件系统与jQuery都脱胎于 Dean Edwards' addEvent library
            //对于每个元素的某一种事件只绑定一个代理回调，通过它执行用户的所有回调，
            //藉此解决this指向，event存无与标准化，回调顺序这三大问题
            //jquery的创新在于使用多投事件API取代DOM 0事件绑定，解决对DOMMouseScroll，
            //DOMContentLoaded，DOMAttrModified的绑定，并引入命名空间与实现事件冒充，事件代理，
            //以及让无论是自定义事件与原生事件都能沿着DOM树人为地冒泡
            });
        },
        //外部的API已经确保typesr至少为空字符串
        unbind: function( hash ) {//事件系统三大核心方法之一，卸载事件
            var target = this, events = $._data( target, "events");
            if( !events ) return;
            var types = hash.type || "", live = hash.live, bindTarget = $["@bind"] in this;
            if( bindTarget ){ //处理DOM的hover事件
                types = types.replace( rhoverHack, "mouseover$1 mouseout$1" );
            }
            types.replace( $.rword, function( t ){
                var quark = parseEvent( t, live ), type = quark.origType, hack = adapter[ type ] || {};
                findHandlers( events, quark , hash.fn, live ).forEach( function(quark){
                    if( --events[type+"_count"] == 0 ){
                        if( !hack.teardown || hack.teardown( quark ) === false  ) {
                            if( bindTarget === false && bindTop ){//如果不能绑到当前对象上,尝试绑到window上
                                target = window;
                            }
                            $.unbind( target, quark.type, quark.handle, live );
                        }
                        $.removeData( target, "first_" + type, true );
                        delete events[ type+"_count"];
                    }
                    events[ quark.index ] = null;
                })
            });
            for ( var i = events.length; i >= 0; i-- ) {
                if (events[i] == null){
                    events.splice(i, 1);
                }
            }
            if( !events.length ){
                $.removeData( target, "events") ;
            }
        },
        _dispatch: function( list, type, event ){//level2 API 用于事件冒充
            event = facade.fix( event, type );
            for(var i in list){
                if( list.hasOwnProperty(i)){
                    facade.dispatch( list[ i ], event );
                }
            }
        },
        dispatch: function( target, event ){// level2 API 用于旧式的$.event.fire中
            var quark = $._data(target, "first_" + event.type );//取得此元素此类型的第一个quark
            quark && quark.handle.call( target, event )
        },
        handle: function( hash ){// 用于对用户回调进行改造
            var fn =  function( event ){
                var type = hash.origType, detail = facade.detail || {}, target = hash.target//原来绑定事件的对象
                if(detail.origType && detail.origType !== type )//防止在fire mouseover时,把用于冒充mouseenter用的mouseover也触发了
                    return
                //如果是自定义事件, 或者旧式IE678, 或者需要事件冒充
                if(event.originalEvent || !bindTop || hash.type !== hash.origType){
                    var win = bindTop || ( target.ownerDocument || target.document || target ).parentWindow || window
                    event = facade.fix( event || win.event, type );
                    event.currentTarget = target;
                }
                var queue = ( $._data( target, "events") || [] ).concat();
                var eventTarget = event.target, args = [ event ].concat( detail.args || [] ), result;

                for ( var i = 0, quark; quark = queue[i++]; ) {
                    if ( !eventTarget.disabled && !(event.button && event.type === "click")//非左键不能冒泡(e.button 左键为0)
                        && (  event.type == quark.origType )//确保事件类型一致
                        && (!detail.rns || detail.rns.test( quark.ns ) )//如果存在命名空间，则检测是否一致
                        && ( quark.live ? facade.match( eventTarget, target, quark ) : hash.target == quark.target )
                        //如果是事件代理，则检测元素是否匹配给定选择器，否则检测此元素是否是绑定事件的元素
                        ) {
                        result = quark.fn.apply( quark._target || target, args);
                        delete quark._target;
                        quark.times--;
                        if(quark.times === 0){
                            facade.unbind.call( this, quark)
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
                return result;
            }
            fn.uuid = hash.uuid;
            return fn;
        },
        match: function( cur, parent, quark ){//用于判定此元素是否为绑定回调的那个元素或其孩子，并且匹配给定表达式
            if(quark._target)
                return true
            var expr  = quark.live
            var matcher = expr.input ? quickIs : $.match
            for ( ; cur != parent; cur = cur.parentNode || parent ) {
                if(matcher(cur, expr)){
                    quark._target = cur
                    return true
                }
            }
            return false;
        },
        fix: function(event, type){//level2 API 用于修复事件对象的属性与方法,主要能IE678, FF用
            if( !event.originalEvent ){
                var originalEvent = event
                event = new jEvent( originalEvent );
                for( var p in originalEvent ){
                    if( (p in event) ||  /^[A-Z_]+$/.test(p) || typeof originalEvent[p] == "function"){
                        continue;//去掉所有方法与常量
                    }
                    event[p] = originalEvent[p]
                }
                //如果不存在target属性，为它添加一个
                if ( !event.target ) {
                    event.target = event.srcElement || document;
                }
                //safari的事件源对象可能为文本节点，应代入其父节点
                if ( event.target.nodeType === 3 ) {
                    event.target = event.target.parentNode;
                }
   
                event.metaKey = !!event.ctrlKey; // 处理IE678的组合键

                if( /^(?:mouse|contextmenu)|click/.test( type ) ){
                    if ( event.pageX == null && event.clientX != null ) {  // 处理鼠标事件
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
                    //IE event.button的意义 0：没有键被按下 1：按下左键 2：按下右键 3：左键与右键同时被按下 4：按下中键 5：左键与中键同时被按下 6：中键与右键同时被按下 7：三个键同时被按下
                    if ( !event.which && isFinite(button) ) {
                        event.which  = [0,1,3,0,2,0,0,0][button];//0现在代表没有意义
                    }
                    if( type === "mousewheel" ){ //处理滚轮事件
                        if ("wheelDelta" in originalEvent){//统一为±120，其中正数表示为向上滚动，负数表示向下滚动
                            // http://www.w3help.org/zh-cn/causes/SD9015
                            var delta = originalEvent.wheelDelta
                            //opera 9x系列的滚动方向与IE保持一致，10后修正
                            if( window.opera && opera.version() < 10 )
                                delta = -delta;
                            event.wheelDelta = Math.round(delta); //修正safari的浮点 bug
                        }else if( "detail" in originalEvent ){
                            event.wheelDelta = -event.detail * 40;//修正FF的detail 为更大众化的wheelDelta
                        }
                    }
                }else if ( event.which == null ) {//处理键盘事件
                    event.which = event.charCode != null ? event.charCode : event.keyCode;
                }else if( window.Touch && event.touches && event.touches[0] ){
                    event.pageX = event.touches[0].pageX//处理触摸事件
                    event.pageY = event.touches[0].pageY
                }
            }
            if( type ){
                event.type = type
            }
            return event;
        }
    });

    if( bindTop ){//事件系统三大核心方法之一，触发事件
        facade.fire = function( type ){
            var bindTarget = $["@bind"] in this, detail, event, eventType
            var target = bindTarget ? this : window;
            if(typeof type === "string"){
                detail = parseEvent( type );
                eventType = detail.origType;
                var doc = target.ownerDocument || target.document || target || document;
                event = doc.createEvent(eventMap[eventType] || "CustomEvent");
                event.initEvent(eventType, true, true, doc.defaultView);
            }else{//传入一个真正的事件对象
                event = type;
                detail = parseEvent( event.type );
            }
            detail.args = [].slice.call( arguments,1 ) ;
            facade.detail = detail;
            //自定义事件的属性不可修改，必须通过 Object.defineProperty打破其封装
            //支持情况:firefox 4 chrome5 ie9 opera11.6 safari5
            Object.defineProperties && Object.defineProperties(event,{
                target: {
                    writable: true,
                    value: this
                },
                type: {
                    writable:true,
                    value: event.type
                }
            })
            target.dispatchEvent(event);
            delete facade.detail;
        }
    }
    var jEvent = $.Event = function ( event ) {
        this.originalEvent = event.type ? event: {};
        this.origType = event.type || event;
        this.type = (this.origType).replace(/\..*/g,"");
        this.timeStamp = Date.now();
    };
    jEvent.prototype = {
        toString: function(){
            return "[object Uncia]"
        },
        preventDefault: function() {
            this.isDefaultPrevented = true;
            var e = this.originalEvent;
            if ( e.preventDefault ) {
                e.preventDefault();
            }// 如果存在returnValue 那么就将它设为false
            e.returnValue = false;
            return this;
        },
        stopPropagation: function() {
            var e = this.originalEvent;
            if ( e.stopPropagation ) {
                e.stopPropagation();
            } // 如果存在returnValue 那么就将它设为true
            e.cancelBubble = this.isPropagationStopped = true;
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
    //http://www.w3.org/TR/DOM-Level-3-Events/#interface-Event
    var revent = /(^|_|:)([a-z])/g, rmapper = /(\w+)_(\w+)/g;
    $.EventTarget = {
        uniqueNumber : $.getUid({}),
        defineEvents : function( names ){
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
                        return $.fn.on.apply(this, [].concat.apply([name], arguments));
                    };
                }
            },this);
        }
    };
    "bind_on,unbind_off,fire_fire".replace( rmapper,function(_, type, mapper){
        $.EventTarget[ type ] = function(){
            $.fn[ mapper ].apply(this, arguments);
            return this;
        }
    });

    var rquickIs = /^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/
    function quickParse( selector ) {
        var quick = rquickIs.exec( selector );
        if ( quick ) {
            //   0  1    2   3
            // [ _, tag, id, class ]
            quick[1] = ( quick[1] || "" ).toLowerCase();
            quick[3] = quick[3] && new RegExp( "(?:^|\\s)" + quick[3] + "(?:\\s|$)" );
        }
        return quick || selector;//如果为null ,或许这是个复杂的表达式,交由选择器引擎去处理
    }
    function quickIs( elem, m ) {
        var attrs = elem.attributes || {};
        return (
            (!m[1] || elem.nodeName.toLowerCase() === m[1]) &&
            (!m[2] || (attrs.id || {}).value === m[2]) &&
            (!m[3] || m[3].test( (attrs[ "class" ] || {}).value ))
            );
    }
    //以下是用户使用的API
    $.implement({
        toggle: function(/*fn1,fn2,fn3*/){
            var fns = Array.apply([],arguments), i = 0;
            return this.click(function(e){
                var fn  = fns[i++] || fns[i = 0, i++];
                fn.call( this, e );
            })
        },
        hover: function( fnIn, fnOut ) {
            return this.mouseenter( fnIn ).mouseleave( fnOut || fnIn );
        },
        delegate: function( selector, types, fn, times ) {
            return this.on( types, selector, fn, times);
        },
        live: function( types, fn, times ) {
            $( this.ownerDocument ).on( types, this.selector, fn, times );
            return this;
        },
        one: function( types, fn ) {
            return this.on( types, fn, 1 );
        },
        undelegate: function(selector, types, fn ) {/*顺序不能乱*/
            return arguments.length == 1? this.off( selector, "**" ) : this.off( types, fn, selector );
        },
        die: function( types, fn ) {
            $( this.ownerDocument ).off( types, fn, this.selector || "**", fn );
            return this;
        },
        fire: function() {
            var args = arguments;
            if(this.mass && this.each){
                return this.each(function() {
                    $.event.fire.apply(this, args );
                });
            }else{
                return $.event.fire.apply(this, args );
            }
        }
    });
    //这个迭代器产生四个重要的事件绑定API on off bind unbind
    "on_bind,off_unbind".replace( rmapper, function(_,method, mapper){
        $.fn[ method ] = function(types, selector, fn ){
            if ( typeof types === "object" ) {
                for ( var type in types ) {
                    $.fn[ method ].call(this, type, selector, types[ type ], fn );
                }
                return this;
            }
            var hash = {};
            for(var i = 0 ; i < arguments.length; i++ ){
                var el = arguments[i];
                if(typeof el == "number"){
                    hash.times = el;
                }else if(typeof el == "function"){
                    hash.fn = el
                }if(typeof el === "string"){
                    if(hash.type != null){
                        hash.live = el.trim();
                    }else{
                        hash.type = el.trim();//只能为字母数字-_.空格
                        if(!/^[a-z0-9_\-\.\s]+$/i.test(hash.type)){
                            throw "hash.type should be a combination of this event type and the namespace!"
                        }
                    }
                }
            }
            if(method === "on"){
                if( !hash.type || !hash.fn ){
                    $.log("$.fn."+method + " occur error: type and callback must be specified!");
                    return this;
                }
                hash.times = hash.times > 0  ? hash.times : Infinity;
                hash.live =  hash.live ? quickParse( hash.live ) : false
            }
            if(this.mass && this.each){
                return this.each(function() {
                    facade[ mapper ].call( this, hash );
                });
            }else{
                return facade[ mapper ].call( this, hash );
            }
        }
        $.fn[ mapper ] = function(){// $.fn.bind $.fn.unbind
            return $.fn[ method ].apply(this, arguments );
        }
    });
    var mouseEvents =  "contextmenu,click,dblclick,mouseout,mouseover,mouseenter,mouseleave,mousemove,mousedown,mouseup,mousewheel,"
    var eventMap = $.oneObject(mouseEvents, "MouseEvents");
    var types = mouseEvents +",keypress,keydown,keyup," + "blur,focus,focusin,focusout,"+
    "abort,error,load,unload,resize,scroll,change,input,select,reset,submit,input"
    types.replace( $.rword, function( type ){//这里产生以事件名命名的快捷方法
         eventMap[type] = eventMap[type] || (/key/.test(type) ? "UIEvents" : "HTMLEvents")
        $.fn[ type ] = function( callback ){
            return callback?  this.bind( type, callback ) : this.fire( type );
        }
    });
    
    if( !+"\v1" || !$.eventSupport("mouseenter")){//IE6789不能实现捕获与safari chrome不支持
        "mouseenter_mouseover,mouseleave_mouseout".replace(rmapper, function(_, type, mapper){
            adapter[ type ]  = {
                setup: function( quark ){//使用事件冒充
                    quark[type+"_handle"]= $.bind( quark.target, mapper, function( event ){
                        var parent = event.relatedTarget;
                        try {
                            while ( parent && parent !== quark.target ) {
                                parent = parent.parentNode;
                            }
                            if ( parent !== quark.target ) {
                                facade._dispatch( [ quark.target ], type, event );
                            }
                        } catch(e) { };
                    })
                },
                teardown: function( quark ){
                    $.unbind( quark.target, mapper, quark[ type+"_handle" ] );
                }
            };
        });
    }
    //现在只有firefox不支持focusin,focus事件,并且它也不支持DOMFocusIn,DOMFocusOut,不能像DOMMouseScroll那样简单冒充
    if( !$.support.focusin ){
        "focusin_focus,focusout_blur".replace(rmapper, function(_,type, mapper){
            var notice = 0, handler = function (event) {
                var src = event.target;
                do{//模拟冒泡
                    if( $._data(src, "events") ) {
                        facade._dispatch( [ src ], type, event );
                    }
                } while (src = src.parentNode );
            }
            adapter[ type ] = {
                setup: function( ) {
                    if ( notice++ === 0 ) {
                        document.addEventListener( mapper, handler, true );
                    }
                },
                teardown: function() {
                    if ( --notice === 0 ) {
                        document.removeEventListener( mapper, handler, true );
                    }
                }
            };
        });
    }
    try{
        //FF需要用DOMMouseScroll事件模拟mousewheel事件
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

});

//==================================================
// 属性操作模块
//==================================================
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
                    $._remove_attr( this, name, isBool );
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
            if(node  && ( $["@bind"] in node )){
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
                    if( method === "attr" && ( value == null || value == false)){  //为元素节点移除特性
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
    //$.fn["class"] = $.fn.addClass;
    $.mix({
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
        _remove_attr: function( node, name, isBool ) {
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
                $._remove_attr( node, name, true );
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
2012.6.23 attr在value为false, null, undefined时进行删除特性操作
*/
//=========================================
//  操作流模块,用于流程控制
//==========================================
$.define("flow","class",function(){//~表示省略，说明lang模块与flow模块在同一目录
    return $.Flow = $.factory({
        init: function(){
            this.root = {};//数据共享,但策略自定
            this.uuid = $.getUid({})
        },
        //names 可以为数组，用逗号作为分隔符的字符串
        bind: function(names,callback,reload){
            var  root = this.root, deps = {},args = [];
            (names +"").replace($.rword,function(name){
                name = "__"+name;//处理toString与valueOf等属性
                if(!root[name]){
                    root[name] ={
                        unfire : [callback],//正在等待解发的回调
                        fired: [],//已经触发的回调
                        state : 0
                    }
                }else{
                    root[name].unfire.unshift(callback)
                }
                if(!deps[name]){//去重
                    args.push(name);
                    deps[name] = 1;
                }
            });
            callback.deps = deps;
            callback.args = args;
            callback.reload = !!reload;//默认每次重新加载
            return this;
        },
        unbind : function(array,fn){//$.multiUnind("aaa,bbb")
            if(/string|number|object/.test(typeof array) ){
                var tmp = []
                (array+"").replace($.rword,function(name){
                    tmp.push( "__"+name)
                });
                array = tmp;
            }
            var removeAll = typeof fn !== "function";
            for(var i = 0, name ; name = array[i++];){
                var obj = this.root[name];
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
            return this;
        },
        _args : function (arr){//对所有结果进行平坦化处理
            for(var i = 0, result = [], el; el = arr[i++];){
                result.push.apply( result,this.root[el].ret);
            }
            return result;
        },
        fire: function(name, args){
            var root = this.root, obj = root["__"+name], deps;
            if(!obj )
                return this;
            obj.ret = $.slice(arguments,1);//这个供_args方法调用
            obj.state = 2;//标识此操作已完成
            var unfire = obj.unfire,fired = obj.fired;
                loop:
                for (var i = unfire.length,repeat, fn; fn = unfire[--i]; ) {
                    deps = fn.deps;
                    for(var key in deps){//如果其依赖的其他操作都已完成
                        if(deps.hasOwnProperty(key) && root[key].state != 2 ){
                            continue loop;
                        }
                    }
                    unfire.splice(i,1)
                    fired.push( fn );//从unfire数组中取出 ,放进fired数组中
                    repeat = true;
                }
            if(repeat){ //为了谨慎起见再检测一遍
                try{
                    this.fire.apply(this, arguments);
                }catch(e){
                    this.fire( "__error__", e);//如果发生异常，抛出500错误
                }
            }else{//执行fired数组中的回调
                for (i = fired.length; fn = fired[--i]; ) {
                    if(fn.deps["__"+name]){//只处理相关的
                        this.name = name;
                        fn.apply(this, this._args( fn.args ));
                        if(fn.reload){//重新加载所有数据
                            fired.splice(i,1);
                            unfire.push(fn);
                            for(key in fn.deps){
                                root[key].state = 1;
                            }
                        }
                    }
                }

            }
            return this;
        }
    });
//像mashup，这里抓一些数据，那里抓一些数据，看似不相关，但这些数据抓完后最后构成一个新页面。
})
//2012.6.8 对fire的传参进行处理
//2012.7.13 使用新式的相对路径依赖模块
//=========================================
//  数据交互模块
//==========================================
$.define("ajax","event", function(){
    //$.log("已加载ajax模块");
    var global = this, DOC = global.document, r20 = /%20/g,
    rCRLF = /\r?\n/g,
    encode = global.encodeURIComponent,
    rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL

    rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,
    rnoContent = /^(?:GET|HEAD)$/,
    rquery = /\?/,
    rurl =  /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,
    // Document location
    ajaxLocation;
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
            return xml != undefined ? xml : $.parseXML(text);
        },
        html : function(dummyXHR,text,xml){
            return  $.parseHTML(text);
        },
        json : function(dummyXHR,text,xml){
            return  $.parseJSON(text);
        },
        script: function(dummyXHR,text,xml){
            $.parseJS(text);
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
    defaults  = {
        type:"GET",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        async:true,
        jsonp: "callback"
    };
    //将data转换为字符串，type转换为大写，添加hasContent，crossDomain属性，如果是GET，将参数绑在URL后面
    function setOptions( opts ) {
        opts = $.Object.merge( {}, defaults, opts );
        if (opts.crossDomain == null) { //判定是否跨域
            var parts = rurl.exec(opts.url.toLowerCase());
            opts.crossDomain = !!( parts &&
                ( parts[ 1 ] != ajaxLocParts[ 1 ] || parts[ 2 ] != ajaxLocParts[ 2 ] ||
                    ( parts[ 3 ] || ( parts[ 1 ] === "http:" ?  80 : 443 ) )
                    !=
                    ( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ?  80 : 443 ) ) )
                );
        }
        if ( opts.data && opts.data !== "string") {
            opts.data = $.param( opts.data );
        }
        // fix #90 ie7 about "//x.htm"
        opts.url = opts.url.replace(/^\/\//, ajaxLocParts[1] + "//");
        opts.type = opts.type.toUpperCase();
        opts.hasContent = !rnoContent.test(opts.type);//是否为post请求
        if (!opts.hasContent) {
            if (opts.data) {//如果为GET请求,则参数依附于url上
                opts.url += (rquery.test(opts.url) ? "&" : "?" ) + opts.data;
            }
            if ( opts.cache === false ) {//添加时间截
                opts.url += (rquery.test(opts.url) ? "&" : "?" ) + "_time=" + Date.now();
            }
        }
        return opts;
    }
 
    "get,post".replace( $.rword, function( method ){
        $[ method ] = function( url, data, callback, type ) {
            if ( $.isFunction( data ) ) {
                type = type || callback;
                callback = data;
                data = undefined;
            }
            console.log("xxxxxxxxxxxxxx")
            return $.ajax({
                type: method,
                url: url,
                data: data,
                success: callback,
                dataType: type
            });
        };
 
    });
    function isValidParamValue(val) {
        var t = typeof val;  // If the type of val is null, undefined, number, string, boolean, return true.
        return val == null || (t !== 'object' && t !== 'function');
    }
    $.mix($,{
        getScript: function( url, callback ) {
            return $.get( url, null, callback, "script" );
        },
 
        getJSON: function( url, data, callback ) {
            return $.get( url, data, callback, "json" );
        },

        
        upload: function( url, form, data, callback, dataType ) {
            if ($.isFunction(data)) {
                dataType = callback;
                callback = data;
                data = undefined;
            }
            return $.ajax({
                url: url,
                type: 'post',
                dataType: dataType,
                form: form,
                data: data,
                success: callback
            });
        },
        param: function (json, serializeArray) {//对象变字符串
            if (!$.isPlainObject(json)) {
                return "";
            }
            serializeArray = typeof serializeArray == "boolean" ? serializeArray : !0 ;
            var buf = [], key, val;
            for (key in json) {
                if ( json.hasOwnProperty( key )) {
                    val = json[key];
                    key = encode(key);
                    // val is valid non-array value
                    if (isValidParamValue(val)) {
                        buf.push(key, "=", encode(val + ""), "&");
                    } 
                    else if (Array.isArray(val) && val.length) {//不能为空数组
                        for (var i = 0, len = val.length; i < len; ++i) {
                            if (isValidParamValue(val[i])) {
                                buf.push(key, (serializeArray ? encode("[]") : ""), "=", encode(val[i] + ""), "&");
                            }
                        }
                    }//忽略其他值,如空数组,函数,正则,日期,节点等
                }
            }
            buf.pop();
            return buf.join("").replace(r20, "+");
        },
        unparam: function ( url, query ) {//字符串变对象
            var json = {};
            if (!url || !$.type(url, "String")) {
                return json
            }
            url = url.replace(/^[^?=]*\?/ig, '').split('#')[0];	//去除网址与hash信息
            //考虑到key中可能有特殊符号如“[].”等，而[]却有是否被编码的可能，所以，牺牲效率以求严谨，就算传了key参数，也是全部解析url。
            var  pairs = url.split("&"),  pair, key, val,  i = 0, len = pairs.length;
            for (; i < len; ++i) {
                pair = pairs[i].split("=");
                key = decodeURIComponent(pair[0]);
                try {
                    val = decodeURIComponent(pair[1] || "");
                } catch (e) {
                    $.log(e + "decodeURIComponent error : " + pair[1], "error");
                    val = pair[1] || "";
                }
                key = key.replace(/\[\]$/,"")//如果参数名以[]结尾，则当作数组
                var item = json[key];
                if ('undefined' == typeof item) {
                    json[key] = val;//第一次
                } else if (Array.isArray(item)) {
                    item.push(val);//第三次或三次以上
                } else {
                    json[key] = [item, val];//第二次,将它转换为数组
                }
            }
            return query ? json[query] : json;
        },
        serialize: function( form ){//表单元素变字符串
            var json = []
            // 不直接转换form.elements，防止以下情况：   <form > <input name="elements"/><input name="test"/></form>
            $.slice( form || [] ).filter(function( elem ){
                return  elem.name && !elem.disabled && ( elem.checked === true || /radio|checkbox/.test(elem.type) )
            }).forEach( function( elem ) {
                var val = $( elem ).val(), vs;
                val = $.makeArray[val];
                // 字符串换行平台归一化
                val = val.map( function(v) {
                    return v.replace(rCRLF, "\r\n");
                });
                // 全部搞成数组，防止同名
                vs = json[ elem.name] = json[ elem.name ] || [];
                vs.push.apply(vs, val);
            });
            return $.param(json, false);// 名值键值对序列化,数组元素名字前不加 []
        }
    });
//http://sofish.de/file/demo/github/
    //如果没有指定dataType,服务器返回什么就是什么，不做转换
    var ajax = $.ajax = function( opts ) {
        if (!opts || !opts.url) {
            throw "参数必须为Object并且拥有url属性";
        }
        opts = setOptions(opts);//规整化参数对象
        //创建一个伪XMLHttpRequest,能处理complete,success,error等多投事件
        var dummyXHR = new $.XHR(opts), dataType = opts.dataType;

        if( opts.form && opts.form.nodeType === 1 ){
            dataType = "iframe";
        }else if( dataType == "jsonp" ){
            if( opts.crossDomain ){
                ajax.fire("start", dummyXHR, opts.url,opts.jsonp);//用于jsonp请求
                dataType = "script"
            }else{
                dataType = dummyXHR.options.dataType = "json";
            }
        }
        var transportContructor = transports[ dataType ] || transports._default,
        transport = new transportContructor();
        transport.dummyXHR = dummyXHR;
        dummyXHR.transport = transport;
        if (opts.contentType) {
            dummyXHR.setRequestHeader("Content-Type", opts.contentType);
        }
        //添加dataType所需要的Accept首部
        dummyXHR.setRequestHeader( "Accept", accepts[ dataType ] ? accepts[ dataType ] +  ", */*; q=0.01"  : accepts[ "*" ] );
        for (var i in opts.headers) {
            dummyXHR.setRequestHeader( i, opts.headers[ i ] );
        }
 
        "Complete Success Error".replace( $.rword, function(name){
            var method = name.toLowerCase();
            dummyXHR[ method ] = dummyXHR[ "on"+name ];
            if(typeof opts[ method ] === "function"){
                dummyXHR[ method ](opts[ method ]);//添加用户事件
                delete dummyXHR.options[ method ];
                delete opts[ method ];
            }
        });
        dummyXHR.readyState = 1;
        // Timeout
        if (opts.async && opts.timeout > 0) {
            dummyXHR.timeoutID = setTimeout(function() {
                dummyXHR.abort("timeout");
            }, opts.timeout);
        }
        try {
            dummyXHR.state = 1;//已发送
            transport.request();
        } catch (e) {
            if (dummyXHR.status < 2) {
                dummyXHR.dispatch( -1, e );
            } else {
                $.log(e);
            }
        }
        return dummyXHR;
    }
    //new(self.XMLHttpRequest||ActiveXObject)("Microsoft.XMLHTTP")
    $.mix(ajax, $.EventTarget);

    ajax.isLocal = rlocalProtocol.test(ajaxLocParts[1]);
    
    $.XHR = $.factory({
        implement:$.EventTarget,
        init:function(option){
            $.mix(this, {
                responseData:null,
                timeoutID:null,
                responseText:null,
                responseXML:null,
                responseHeadersString: "",
                responseHeaders:{},
                requestHeaders: {},
                readyState: 0,
                //internal state
                state:0,
                statusText: null,
                status:0,
                transport: null
            });
            this.defineEvents("complete success error");
            this.setOptions("options",option);//创建一个options保存原始参数
        },

        setRequestHeader: function(name, value) {
            this.requestHeaders[ name ] = value;
            return this;
        },
        getAllResponseHeaders: function() {
            return this.state === 2 ? this.responseHeadersString : null;
        },
        getResponseHeader:function (name, match) {
            if (this.state === 2) {
                while (( match = rheaders.exec(this.responseHeadersString) )) {
                    this.responseHeaders[ match[1] ] = match[ 2 ];
                }
                match = this.responseHeaders[ name ];
            }
            return match === undefined ? null : match;
        },
        // 重写 content-type 首部
        overrideMimeType: function(type) {
            if ( !this.state ) {
                this.mimeType = type;
            }
            return this;
        },
        toString: function(){
            return "[object Lions]"
        },
        // 中止请求
        abort: function(statusText) {
            statusText = statusText || "abort";
            if (this.transport) {
                this.transport.respond(0, 1);
            }
            this.dispatch( 0, statusText );
            return this;
        },
        
        dispatch: function(status, statusText) {
            // 只能执行一次，防止重复执行
            if (this.state == 2) {//2:已执行回调
                return;
            }
            this.state = 2;
            this.readyState = 4;
            var eventType = "error";
            if ( status >= 200 && status < 300 || status == 304 ) {
                if (status == 304) {
                    statusText = "notmodified";
                    eventType = "success";
                } else {
                    try{
                        var dataType = this.options.dataType || this.options.mimeType || this.nativeXHR && this.nativeXHR.responseType;
                        if(!dataType){//如果没有指定dataType，则根据mimeType或Content-Type进行揣测
                            dataType = this.getResponseHeader("Content-Type") || "";
                            dataType = dataType.match(/json|xml|script|html/) || ["text"];
                            dataType = dataType[ 0 ]
                        }
                        this.responseData = converters[ dataType ](this, this.responseText, this.responseXML);
                        eventType = statusText = "success";
                        $.log("dummyXHR.dispatch success");
                    } catch(e) {
                        $.log("dummyXHR.dispatch parsererror")
                        statusText = "parsererror : " + e;
                    }
                }
 
            }else  if (status < 0) {
                status = 0;
            }
            this.status = status;
            this.statusText = statusText;
            if ( this.timeoutID ) {
                clearTimeout(this.timeoutID);
                delete this.timeoutID;
            }
            // 到这要么成功，调用success, 要么失败，调用 error, 最终都会调用 complete
           
            this.fire( eventType, this.responseData, statusText);
            //$.log("xxxxxxxxxxxxxxxxxxxxxxxxx")
            //$.log(this == ajax)
            ajax.fire( eventType );
            this.fire("complete", this.responseData, statusText);
            ajax.fire("complete");
            this.transport = undefined;
        }
    });
    $.XHR.prototype.fire = function( type ){//覆盖$.EventTarget的fire方法，去掉事件对象
        var events = $._data( this,"events") ,args = $.slice(arguments,1);
        if(!events || !events.length) return;
        for ( var i = 0, item; item = events[i++]; ) {
            if(item.type === type)
                item.fn.apply( this, args );
        }
    }
    //http://www.cnblogs.com/rubylouvre/archive/2010/04/20/1716486.html
    var s = ["XMLHttpRequest",
    "ActiveXObject('Msxml2.XMLHTTP.6.0')",
    "ActiveXObject('Msxml2.XMLHTTP.3.0')",
    "ActiveXObject('Msxml2.XMLHTTP')",
    "ActiveXObject('Microsoft.XMLHTTP')"];
    if(!+"\v1"){
        var v = DOC.documentMode;
        s[0] =  v == 8 ? "XDomainRequest" : location.protocol === "file:" ? "!" : s[0]
    }
    for(var i = 0 ,axo;axo = s[i++];){
        try{
            if(eval("new "+ axo)){
                $.xhr = new Function( "return new "+axo);
                break;
            }
        }catch(e){}
    }
    if ( $.xhr ) {
        var nativeXHR = new $.xhr, allowCrossDomain = false;
        if ("withCredentials" in nativeXHR) {
            allowCrossDomain = true;
        }
        //【XMLHttpRequest】传送器
        transports._default =  $.factory({
            //发送请求
            request: function() {
                var dummyXHR = this.dummyXHR,
                options = dummyXHR.options, i;
                $.log("XhrTransport.sending.....");
                if (options.crossDomain && !allowCrossDomain) {
                    throw "do not allow crossdomain xhr !"
                }
                var nativeXHR = this.nativeXHR = new $.xhr, self = this;
                if ( options.username ) {
                    nativeXHR.open( options.type, options.url, options.async, options.username, options.password );
                } else {
                    nativeXHR.open( options.type, options.url, options.async );
                }
                // 如果支持overrideMimeTypeAPI
                if (dummyXHR.mimeType && nativeXHR.overrideMimeType) {
                    nativeXHR.overrideMimeType(dummyXHR.mimeType);
                }
                if (!options.crossDomain && !dummyXHR.requestHeaders["X-Requested-With"]) {
                    dummyXHR.requestHeaders[ "X-Requested-With" ] = "XMLHttpRequest";
                }
                try {
                    for ( i in dummyXHR.requestHeaders) {
                        nativeXHR.setRequestHeader( i, dummyXHR.requestHeaders[ i ]);
                    }
                } catch(e) {
                    $.log(" nativeXHR setRequestHeader occur error ");
                }
 
                nativeXHR.send(options.hasContent && options.data || null);
                //在同步模式中,IE6,7可能会直接从缓存中读取数据而不会发出请求,因此我们需要手动发出请求
                if (!options.async || nativeXHR.readyState == 4) {
                    this.respond();
                } else {
                    if (nativeXHR.onerror === null) { //如果支持onerror, onload新API
                        nativeXHR.onload =  nativeXHR.onerror = function (e) {
                            this.readyState = 4;//IE9
                            this.status = e.type === "load" ? 200 : 500;
                            self.respond();
                        };
                    } else {
                        nativeXHR.onreadystatechange = function() {
                            self.respond();
                        }
                    }
                }
            },
            //用于获取原始的responseXMLresponseText 修正status statusText
            //第二个参数为1时中止清求
            respond: function(event, abort) {
                // 如果网络问题时访问XHR的属性，在FF会抛异常
                // http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
                var nativeXHR = this.nativeXHR , dummyXHR = this.dummyXHR, detachEvent = false;
                try {
                    if (abort || nativeXHR.readyState == 4) {
                        detachEvent = true;
                        if ( abort ) {
                            if (nativeXHR.readyState !== 4) {  // 完成以后 abort 不要调用
                                //IE的XMLHttpRequest.abort实现于 MSXML 3.0+
                                //http://blogs.msdn.com/b/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx
                                nativeXHR.abort();
                            }
                        } else {
                            var status = nativeXHR.status,
                            xml = nativeXHR.responseXML;
                            dummyXHR.responseHeadersString = nativeXHR.getAllResponseHeaders();
                            // Construct response list
                            if (xml && xml.documentElement /* #4958 */) {
                                dummyXHR.responseXML = xml;
                            }
                            dummyXHR.responseText = nativeXHR.responseText;
                            //火狐在跨城请求时访问statusText值会抛出异常
                            try {
                                var statusText = nativeXHR.statusText;
                            } catch(e) {
                                $.log("xhr statustext error : " + e);
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
                            dummyXHR.dispatch(status, statusText);
                        }
                    }
                } catch (firefoxAccessException) {
                    detachEvent = true;
                    $.log(firefoxAccessException);
                    if (!abort) {
                        dummyXHR.dispatch(-1, firefoxAccessException+"");
                    }
                }finally{
                    if( detachEvent ){
                        nativeXHR.onerror = nativeXHR.onload = nativeXHR.onreadystatechange = $.noop;
                    }
                }
            }
        });
    }
    //【script节点】传送器，只用于跨域的情况
    transports.script = $.factory({
        request: function() {
            var self = this, dummyXHR = self.dummyXHR, options = dummyXHR.options,
            head = $.head,
            script = self.script = DOC.createElement("script");
            script.async = "async";
            $.log("ScriptTransport.sending.....");
            if (options.charset) {
                script.charset = options.charset;
            }
            //当script的资源非JS文件时,发生的错误不可捕获
            script.onerror = script.onload = script.onreadystatechange = function(e) {
                e = e || event;
                self.respond((e.type || "error").toLowerCase()); // firefox onerror 没有 type ?!
            };
            script.src = options.url
            head.insertBefore(script, head.firstChild);
        },
 
        respond: function(event, isAbort) {
            var node = this.script, dummyXHR = this.dummyXHR;
            // 防止重复调用,成功后 abort
            if (!node) {
                return;
            }
            if (isAbort || /loaded|complete|undefined/i.test(node.readyState)  || event == "error"  ) {
                node.onerror = node.onload = node.onreadystatechange = null;
                var parent = node.parentNode;
                if(parent && parent.nodeType === 1){
                    parent.removeChild(node);
                    this.script = undefined;
                }
                //如果没有中止请求并没有报错
                if (!isAbort && event != "error") {
                    dummyXHR.dispatch(200, "success");
                }
                // 非 ie<9 可以判断出来
                else if (event == "error") {
                    dummyXHR.dispatch(500, "scripterror");
                }
            }
        }
    });
 
    //http://www.decimage.com/web/javascript-cross-domain-solution-with-jsonp.html
    //JSONP请求，借用【script节点】传送器
    converters["script json"] = function(dummyXHR){
        return $["jsonp"+ dummyXHR.uniqueID ]();
    }
    ajax.bind("start", function(e, dummyXHR, url, jsonp) {
        $.log("jsonp start...");
        var jsonpCallback = "jsonp"+dummyXHR.uniqueID;
        dummyXHR.options.url = url  + (rquery.test(url) ? "&" : "?" ) + jsonp + "=" + DOC.URL.replace(/(#.+|\W)/g,'')+"."+jsonpCallback;
        dummyXHR.options.dataType = "json";
        //将后台返回的json保存在惰性函数中
        global.$[jsonpCallback]= function(json) {
            global.$[jsonpCallback] = function(){
                return json;
            };
        };
    });
 
    function createIframe(dummyXHR, transport) {
        var id = "iframe-upload-"+dummyXHR.uniqueID;
        var iframe = $.parseHTML("<iframe " +
            " id='" + id + "'" +
            " name='" + id + "'" +
            "  style='position:absolute;left:-9999px;top:-9999px;/>").firstChild;
        iframe.transport = transport;
        return  (DOC.body || DOC.documentElement).insertBefore(iframe,null);
    }
 
    function addDataToForm(data, form, serializeArray) {
        data = $.unparam(data);
        var ret = [], d, isArray, vs, i, e;
        for (d in data) {
            isArray = $.isArray(data[d]);
            vs = $.makeArray( data[d])
            // 数组和原生一样对待，创建多个同名输入域
            for (i = 0; i < vs.length; i++) {
                e = DOC.createElement("input");
                e.type = 'hidden';
                e.name = d + (isArray && serializeArray ? "[]" : "");
                e.value = vs[i];
                form.appendChild(e)
                ret.push(e);
            }
        }
        return ret;
    }
    //【iframe】传送器，专门用于上传
    //http://www.profilepicture.co.uk/tutorials/ajax-file-upload-xmlhttprequest-level-2/ 上传
    transports.iframe = $.factory({
        request: function() {
            var dummyXHR = this.dummyXHR,
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
            $.log("iframe transport...");
            setTimeout(function () {
                $(iframe).bind("load error",this.respond);
                form.submit();
            }, 16);
        },
 
        respond: function( event  ) {
            var iframe = this,
            transport = iframe.transport;
            // 防止重复调用 , 成功后 abort
            if (!transport) {
                return;
            }
            $.log("transports.iframe respond")
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
                dummyXHR.dispatch(200, "success");
            } else if (eventType == 'error') {
                dummyXHR.dispatch(500, "error");
            }
            for(var i in transport.backups){
                form[i] = transport.backups[i];
            }
            //还原form的属性
            transport.fields.forEach(function(elem){
                elem.parentNode.removeChild(elem);
            });
            $(iframe).unbind("load",transport.respond).unbind("error",transport.respond);
            iframe.clearAttributes &&  iframe.clearAttributes();
            setTimeout(function() {
                // Fix busy state in FF3
                iframe.parentNode.removeChild(iframe);
                $.log("iframe.parentNode.removeChild(iframe)")
            }, 16);
        }
    });
 
});
    

//=========================================
// 动画模块v4
//==========================================
$.define("fx", "css",function(){
    var types = {
        color:/color/i,
        scroll:/scroll/i,
        transform: /transform/i
    },
    rfxnum = /^([+\-/*]=)?([\d+.\-]+)([a-z%]*)$/i;
    function isHidden( elem ) {
        return elem.sourceIndex === 0 || $.css( elem, "display" ) === "none" || !$.contains( elem.ownerDocument.documentElement, elem );
    }
    $.mix({//缓动公式
        easing : {
            linear: function( pos ) {
                return pos;
            },
            swing: function( pos ) {
                return (-Math.cos(pos*Math.PI)/2) + 0.5;
            }
        },
        "@queue": [],//主列队
        tick: function(fx){//用于向主列队或元素的子列队插入动画实例，并会让停走了的定时器再次动起来
            var gotoQueue = true;
            for(var i = 0, el; el = $["@queue"][i++];){
                if(el.symbol == fx.symbol){//★★★第一步
                    el.positive.push(fx);//子列队
                    gotoQueue = false
                    break;
                }
            }
            if(gotoQueue){//★★★第二步
                fx.positive = fx.positive || [];
                $["@queue"].unshift( fx );
            }
            if ($.tick.id === null) {
                $.tick.id = setInterval( nextTick, 1000/ fx.fps );//原始的setInterval id并执行动画
            }
        },
        //由于构建更高级的基于元素节点的复合动画
        fx: function ( nodes, duration, hash, effects ){
            nodes = nodes.mass ? nodes : $(nodes);
            var props =  hash || duration ;
            props = typeof props === "object" ? props : {}

            if(typeof duration === "function"){// fx(obj fn)
                hash = duration;               // fx(obj, 500, fn)
                duration = 500;
            }
            if(typeof hash === "function"){   //  fx(obj, num, fn)
                props.after = hash;           //  fx(obj, num, {after: fn})
            }
            if( effects ){
                for(var i in effects){
                    if(typeof effects[i] === "function"){
                        var old = props[i];
                        props[i] = function(node, fx ){
                            effects[i].call(node, node, fx);
                            if(typeof old === "function"){
                                old.call(node, node, fx);
                            }
                        }
                    }else{
                        props[i] = effects[i]
                    }
                }
            }
            return nodes.fx(duration || 500, props);
        },
        //show 开始时计算其width1 height1 保存原来的width height display改为inline-block或block overflow处理 赋值（width1，height1）
        //hide 保存原来的width height 赋值为(0,0) overflow处理 结束时display改为none;
        //toggle 开始时判定其是否隐藏，使用再决定使用何种策略
        show: function(node, fx){
            if(node.nodeType == 1 && isHidden(node)) {
                var display =  $._data(node, "olddisplay");
                if(!display || display == "none"){
                    display = parseDisplay(node.nodeName)
                    $._data(node, "olddisplay", display);
                }
                node.style.display = display;
                if(fx && ("width" in fx || "height" in fx)){//如果是缩放操作
                    //修正内联元素的display为inline-block，以让其可以进行width/height的动画渐变
                    if ( display === "inline" && $.css( node, "float" ) === "none" ) {
                        if ( !$.support.inlineBlockNeedsLayout ) {//w3c
                            node.style.display = "inline-block";
                        } else {//IE
                            if ( display === "inline" ) {
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
        hide: function(node, fx){
            if(node.nodeType == 1 && !isHidden(node)){
                var display = $.css( node, "display" );
                if ( display !== "none" && !$._data( node, "olddisplay" ) ) {
                    $._data( node, "olddisplay", display );
                }
                if( fx ){//缩小
                    if("width" in fx || "height" in fx){//如果是缩放操作
                        //确保内容不会溢出,记录原来的overflow属性，因为IE在改变overflowX与overflowY时，overflow不会发生改变
                        fx.overflow = [ node.style.overflow, node.style.overflowX, node.style.overflowY ];
                        node.style.overflow = "hidden";
                    }
                    var after = fx.after;
                    fx.after = function( node, fx ){
                        node.style.display = "none";
                        if ( fx.overflow != null && !$.support.keepSize  ) {
                            [ "", "X", "Y" ].forEach(function (postfix,index) {
                                node.style[ "overflow" + postfix ] = fx.overflow[index]
                            });
                        }
                        if(typeof after == "function"){
                            after.call( node, node, fx );
                        }
                    };
                }else{
                    node.style.display = "none";
                }
            }
        },
        toggle: function( node ){
            $[ isHidden(node) ? "show" : "hide" ]( node );
        }
    })
    //用于从主列队中剔除已经完成或被强制完成的动画实例，一旦主列队被清空，还负责中止定时器，节省内存
    function nextTick() {
        var fxs = $["@queue"], i = fxs.length;
        while(--i >= 0){
            if ( !(fxs[i].symbol && animate(fxs[i], i)) ) {
                fxs.splice(i, 1);
            }
        }
        fxs.length || (clearInterval($.tick.id), $.tick.id = null);
    }
    $.tick.id = null;
    $.fn.fx = function( duration, hash, /*internal*/ p  ){
        if(typeof duration === "number" ){
            hash = hash || {};
            for( var name in hash){
                p = $.cssName(name) || name;
                if( name != p ){
                    hash[ p ] = hash[ name ];//收集用于渐变的属性
                    delete hash[ name ];
                }
            }
            if(typeof hash.easing !== "function"){//转换easing属性为缓动公式
                var easing = (hash.easing || "swing").toLowerCase() ;
                hash.easing = $.easing[ easing ] || $.easing.swing;
            }
            for(var i = 0, node; node = this[i++];){
                var fx = new Fx;
                $.mix(fx, hash)
                fx.method = "noop"
                fx.duration = duration
                fx.symbol = node;
                $.tick( fx );
            }
            return this;
        }else{
            throw "First argument must be number "
        }
    }

    var cssTransform = $.support.transform
    $.mix($.fx, {
        fps: 30,
        "@debug": 1,
        type: function (attr){//  用于取得适配器的类型
            for(var i in types){
                if(types[i].test(attr)){
                    return i;
                }
            }
            return "_default";
        },
        update: {
            scroll: function(node, per, end, obj){
                node[obj.name] = (end ? obj.to :  obj.from + (obj.to - obj.from ) * obj.easing(per) ) + obj.unit
            },
            color: function(node, per, end, obj){
                var pos = obj.easing( per ),
                rgb = end ? obj.to : obj.from.map(function(from, i){
                    return Math.max(Math.min( parseInt( from + (obj.to[i] - from) * pos, 10), 255), 0);
                });
                node.style[obj.name] = "rgb(" + rgb + ")";
            },
            transform: function(node, per, end, obj){
                if(!obj.parsed){
                    var t = new $.Matrix2D
                    t.set.apply(t, obj.from)
                    obj.from = t.decompose();
                    t.set.apply(t, obj.to)
                    obj.to = t.decompose();
                    obj.parsed = 1;
                }
                var pos = obj.easing(per), transform = "", unit, startVal, endVal, i = obj.from.length;
                while ( i-- ) {
                    startVal = obj.from[i];
                    endVal = obj.to[i];
                    unit = +false;
                    switch ( startVal[0] ) {
                        case "translate":
                            unit = "px";
                        case "scale":
                            unit || ( unit = "");
                            transform = startVal[0] + "(" +
                            (end ? endVal[1][0]: (startVal[1][0] + (endVal[1][0] - startVal[1][0]) * pos).toFixed(7) ) + unit +","+
                            (end ? endVal[1][1]: (startVal[1][1] + (endVal[1][1] - startVal[1][1]) * pos).toFixed(7) ) + unit + ") "+
                            transform;
                            break;
                        case "skewX":
                        case "rotate":
                            transform = startVal[0] + "(" +
                            (end ? endVal[1]:  (startVal[1] + (endVal[1] - startVal[1]) * pos).toFixed(7) ) +"rad) "+
                            transform;
                            break;
                    }
                }
                if(cssTransform){
                    node.style[ obj.name ] = transform;
                }else{
                    $(node).css("transform",transform );
                }
            }
        },
        parse: {
            color:function(node, from, to){
                return [ color2array(from), color2array(to) ]
            },
            transform: function(node, from, to){
                var zero = "matrix(1,0,0,1,0,0)"
                from = from == "none" ? zero  : from;
                if(to.indexOf("matrix") == -1 ){
                    var neo = node.cloneNode(true);
                    //webkit与opera如果display为none,无法取得其变形属性
                    neo.style.position = "relative";
                    neo.style.opacity = "0";
                    node.parentNode.appendChild(neo)
                    neo = $(neo).css("transform", to);
                    to = neo.css("transform");
                    neo.remove();
                }
                to = (from +" "+ to).match(/[-+.e\d]+/g).map(function(el){
                    return el * 1
                });
                from = to.splice(0,6);
                return [from, to]
            }
        },
        _default: $.css,
        scroll: function(el, prop){
            return el[ prop ];
        }
    });

    if(window.WebKitCSSMatrix){
        $.fx.parse.transform = function(node, from, to){
            var first = new WebKitCSSMatrix(from), second = new WebKitCSSMatrix(to)
            from = [], to = [];
            "a,b,c,d,e,f".replace($.rword, function(p){
                from.push( first[ p ] )
                to.push( second[ p ] )
            });
            return [from, to]
        }
    }
    if(!$.support.cssOpacity){
        $.fx.update.opacity = function(node, per, end, obj){
            $.css(node,"opacity", (end ? obj.to :  obj.from + obj.easing(per) * (obj.to - obj.from) ))
        }
        types.opacity = /opacity/i;
    }
    var Fx = function(){}
    Fx.prototype.update = function(per, end){
        var node = this.symbol;
        for(var i = 0, obj; obj = this.props[i++];){
            var fn = $.fx.update[obj.type]
            if(fn){
                fn(node, per, end, obj)
            }else{
                node.style[obj.name] = (end ? obj.to :  obj.from + obj.easing(per) * (obj.to - obj.from)  ) + obj.unit
            }
        }
    }

    var keyworks = $.oneObject("orig,overflow,before,frame,after,easing,revert,record");
    //用于生成动画实例的关键帧（第一帧与最后一帧）所需要的计算数值与单位，并将回放用的动画放到negative子列队中去
    function fxBuilder(node, fx, index ){
        var to, parts, unit, op, props = [], revertProps = [],orig = {}, hidden = isHidden(node);
        for(var name in fx){
            if(!fx.hasOwnProperty(name) && keyworks[name]){
                continue
            }
            var val = fx[name] //取得结束值
            var easing = fx.easing;//公共缓动公式
            var type = $.fx.type(name);
            var from = ($.fx[ type ] || $.fx._default)(node, name);//取得起始值
            //用于分解属性包中的样式或属性,变成可以计算的因子
            if( val === "show" || (val === "toggle" && hidden)){
                val = $._data(node,"old"+name) || from;
                fx.method = "show";
                from = 0;
                $.css(node, name, 0 );
            }else if(val === "hide" || val === "toggle" ){//hide
                orig[name] = $._data(node,"old"+name, from );
                fx.method = "hide";
                val = 0;
            }else if($.isArray( val )){// array
                parts = val;
                val = parts[0];//取得第一个值
                easing = typeof parts[1] == "function" ? parts[1]: easing;//取得第二个值或默认值
            }

            if($.fx.parse[ type ]){
                parts = $.fx.parse[ type ](node, from, val );
            }else{
                from = from == "auto" ? 0 : parseFloat(from)//确保from为数字
                if( (parts = rfxnum.exec( val )) ){
                    to = parseFloat( parts[2] ),//确保to为数字
                    unit = $.cssNumber[ name ] ? "" : (parts[3] || "px");
                    if(parts[1]){
                        op = parts[1].charAt(0);//操作符
                        if (unit && unit !== "px" && (op == "+" || op == "-")  ) {
                            $.css(node, name, (to || 1) + unit);
                            from = ((to || 1) / parseFloat( $.css(node,name) )) * from;
                            $.css( node, name, from + unit);
                        }
                        if(op){//处理+=,-= \= *=
                            to = eval(from+op+to);
                        }
                    }
                    parts = [from, to]
                }else{
                    parts = [0, 0]
                }
            }

            from = parts[0];
            to = parts[1];
            if( from +"" === to +"" ){//不处理初止值都一样的样式与属性
                continue
            }
            var prop = {
                name: name,
                from: from ,
                to: to,
                type: type,
                easing: easing,
                unit: unit
            }
            props.push( prop );
            revertProps.push($.mix({}, prop,{
                to: from,
                from: to
            }))
        }
        fx.props = props;
        fx.orig = orig;
        if ( fx.record || fx.revert ) {
            var fx2 = new Fx;//回滚到最初状态
            for( name in fx ){
                fx2[ name ] = fx[ name ];
            }
            fx2.record = fx2.revert = void 0
            fx2.props = revertProps;
            var el = $["@queue"][ index ];
            el.negative = el.negative || [];
            el.negative.push(fx2);//添加已存负向列队中
        }
    }
    //驱动主列队的动画实例进行补间动画(update)，执行各种回调（before, frame, after），
    //并在动画结束后，从子列队选取下一个动画实例取替自身
    function animate( fx, index ) {
        var node = fx.symbol, now =  +new Date, mix;
        if(!fx.startTime){//第一帧
            mix = fx.before;//位于动画的最前面
            mix && ( mix.call( node, node, fx ), fx.before = 0 );
            if(!fx.props){//from这个值必须在此个时间点才能侦察正确
                fxBuilder( fx.symbol, fx, index ); //添加props属性与设置负向列队
            }
            $[ fx.method ].call(node, node, fx );//这里用于设置node.style.display
            fx.startTime = now;
        }else{
            var per = (now - fx.startTime) / fx.duration;
            var end = fx.gotoEnd || per >= 1;
            fx.update( per, end ); // 处理渐变
            if( (mix = fx.frame ) && !end ){
                mix.call(node, node, fx ) ;
            }
            if ( end ) {//最后一帧
                if(fx.method == "hide"){
                    for(var i in fx.orig){//还原为初始状态
                        $.css( node, i, fx.orig[i] );
                    }
                }
                mix = fx.after;//执行动画完成后的回调
                mix && mix.call( node, node, fx ) ;
                if( fx.revert && fx.negative.length){
                    Array.prototype.unshift.apply( fx.positive, fx.negative.reverse());
                    fx.negative = []; // 清空负向列队
                }
                var neo = fx.positive.shift();
                if ( !neo ) {
                    return false;
                }
                $["@queue"][ index ] = neo;
                neo.positive = fx.positive;
                neo.negative = fx.negative;
            }
        }
        return true;
    }
    $.fn.delay = function( ms ){
        return this.fx( ms );
    }
    //如果clearQueue为true，是否清空列队
    //如果gotoEnd 为true，是否跳到此动画最后一帧
    $.fn.stop = function( clearQueue, gotoEnd  ){
        clearQueue = clearQueue ? "1" : ""
        gotoEnd  = gotoEnd  ? "1" : "0"
        var stopCode = parseInt( clearQueue+gotoEnd ,2 );//返回0 1 2 3
        var array = $["@queue"];
        return this.each(function(node){
            for(var i = 0, fx ; fx = array[i];i++){
                if(fx.symbol === node){
                    switch(stopCode){//如果此时调用了stop方法
                        case 0:  //中断当前动画，继续下一个动画
                            fx.update = fx.after = fx.frame = $.noop
                            fx.revert && fx.negative.shift();
                            fx.gotoEnd = true;
                            break;
                        case 1://立即跳到最后一帧，继续下一个动画
                            fx.gotoEnd = true;
                            break;
                        case 2://清空该元素的所有动画
                            delete fx.symbol
                            break;
                        case 3:
                            Array.prototype.unshift.apply( fx.positive,fx.negative.reverse());
                            fx.negative = []; // 清空负向列队
                            for(var j =0; fx = fx.positive[j++]; ){
                                fx.before = fx.after = fx.frame = $.noop
                                fx.gotoEnd = true;//立即完成该元素的所有动画
                            }
                            break;
                    }
                }
            }
        });
    }

    var fxAttrs = [ [ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
    [ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ], ["opacity"]]
    function genFx( type, num ) {//生成属性包
        var obj = {};
        fxAttrs.concat.apply([], fxAttrs.slice(0,num)).forEach(function(name) {
            obj[ name ] = type;
            if(~name.indexOf("margin")){
                $.fx.update[name] = function(node, per, end, obj){
                    var val = (end ? obj.to :  obj.from + ( obj.from - obj.to) * obj.easing(per) ) ;
                    node.style[name] = Math.max(val,0) + obj.unit;
                }
            }
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

    [ "toggle", "show", "hide" ].forEach(function(  name, i ) {
        var toggle = $.fn[ name ];
        $.fn[ name ] = function( duration, hash ) {
            if(!arguments.length ){
                return this.each(function(node) {
                    $.toggle( node );
                });
            }else if(!i && typeof duration === "function" && typeof duration === "function" ){
                return toggle.apply(this,arguments)
            }else{
                return $.fx( this, duration, hash, genFx( name , 3) );
            }
        };
    });
    
    function beforePuff( node, fx ) {
        var position = $.css(node,"position"),
        width = $.css(node,"width"),
        height = $.css(node,"height"),
        left = $.css(node,"left"),
        top = $.css(node,"top");
        node.style.position = "relative";
        $.mix(fx, {
            width: "*=1.5",
            height: "*=1.5",
            opacity: "hide",
            left: "-=" + parseInt(width) * 0.25,
            top: "-=" + parseInt(height) * 0.25
        });
        var after = fx.after;
        fx.after = function( node, fx ){
            node.style.position = position;
            node.style.width = width;
            node.style.height = height;
            node.style.left = left;
            node.style.top = top;
            if(typeof after === "function"){
                after.call( node, node, fx );
            }
        }
    }
    //扩大1.5倍并淡去
    $.fn.puff = function(duration, hash) {
        return $.fx( this, duration, hash, {
            before: beforePuff
        });
    }

    var colorMap = {
        "black":[0,0,0],
        "gray":[128,128,128],
        "white":[255,255,255],
        "orange":[255, 165, 0],
        "red":[255,0,0],
        "green":[0,128,0],
        "yellow":[255,255,0],
        "blue":[0,0,255]
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
            sandboxDoc.write( ( $.support.boxModel  ? "<!doctype html>" : "" ) + "<html><body>" );
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
    $.parseColor = color2array
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
})


}( this, this.document );
