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

    /**
     * @class $
     * mass Framework拥有两个命名空间,
     * 第一个是DOC.URL.replace(/(\W|(#.+))/g,'')，根据页面的地址动态生成
     * 第二个是$，我们可以使用别名机制重写它
     */
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
    /**
     * 糅杂，为一个对象添加更多成员
     * @param {Object} receiver 接受者
     * @param {Object} supplier 提供者
     * @return  {Object} 目标对象
     */
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
            var ret = [], n = nodes.length
            if(end === void 0 || typeof end == "number" && isFinite(end)){
                start = parseInt(start,10) || 0
                end = end == void 0 ? n : parseInt(end, 10)
                if(start < 0){
                    start += n
                }
                if(end > n){
                    end = n
                }
                if(end < 0){
                    end += n
                }
                for (var i = start; i < end; ++i) {
                    ret[i - start] = nodes[i];
                }
            }
            return ret;
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
        //$.log(str, showInPage=true, '>=5' )
        log: function (){
            var args = $.slice(arguments), show = true, page = false,  str = args.shift();
            for(var i = 0 ; i < args.length; i++){
                var el = args[i]
                if(typeof el == "string" && /^\s*(?:[<>]=?|=)\s*\d\s*$/.test(el) ){
                    show = Function ( "return "+ $.log.level + el)()
                }else if(el === true){
                    page = true;
                }
            }
            if(show){
                if( page === true ){
                    $.require( "ready", function(){
                        var div =  DOC.createElement("pre");
                        div.className = "mass_sys_log";
                        div.innerHTML = str +"";//确保为字符串
                        DOC.body.appendChild(div)
                    });
                }else if( global.console ){
                    global.console.log( str );
                }
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
    $.log.level = 1;
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
    /**
     * 将要安装的模块通过iframe中的script加载下来
     * @param {String} name 模块名
     * @param {String} url  模块的路径
     * @param {String} mass  当前框架的版本号
     */
    function loadJS( name, url, parent ){
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
                    loadJS( name, match[2], $["@path"] );//将要安装的模块通过iframe中的script加载下来
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
/*combine modules*/

}( this, this.document );
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
2012.2.23 修复内部对象泄漏，导致与外部$变量冲突的BUG
2012.4.5 升级UUID系统，以便页面出现多个版本共存时，让它们共享一个计数器。
2012.4.25  升级到v16
简化_checkFail方法，如果出现死链接，直接打印模块名便是，不用再放入错误栈中了。
简化deferred列队，统一先进先出。
改进$.mix方法，允许只存在一个参数，直接将属性添加到$命名空间上。
内部方法assemble更名为setup，并强化调试机制，每加入一个新模块， 都会遍历命名空间与原型上的方法，重写它们，添加try catch逻辑。
2012.5.6更新rdebug,不处理大写开头的自定义"类"
2012.6.5 对IE的事件API做更严格的判定,更改"@target"为"@bind"
2012.6.10 精简require方法 处理opera11.64的情况
2012.6.13 添加异步列队到命名空间,精简domReady
2012.6.14 精简innerDefine,更改一些术语
2012.6.25 domReady后移除绑定事件
2012.7.23 动态指定mass Framewoke的命名空间与是否调试
http://hi.baidu.com/flondon/item/1275210a5a5cf3e4fe240d5c
检测当前页面是否在iframe中（包含与普通方法的比较）
http://stackoverflow.com/questions/326596/how-do-i-wrap-a-function-in-javascript
https://github.com/eriwen/javascript-stacktrace
不知道什么时候开始，"不要重新发明轮子"这个谚语被传成了"不要重新造轮子"，于是一些人，连造轮子都不肯了。
重新发明东西并不会给我带来论文发表，但是它却给我带来了更重要的东西，这就是独立的思考能力。
一旦一个东西被你“想”出来，而不是从别人那里 “学”过来，那么你就知道这个想法是如何产生的。
这比起直接学会这个想法要有用很多，因为你知道这里面所有的细节和犯过的错误。而最重要的，
其实是由此得 到的直觉。如果直接去看别人的书或者论文，你就很难得到这种直觉，因为一般人写论文都会把直觉埋藏在一堆符号公式之下，
让你看不到背后的真实想法。如果得到了直觉，下一次遇到类似的问题，你就有可能很快的利用已有的直觉来解决新的问题。
http://sourceforge.net/apps/trac/pies/wiki/TypeSystem/zh
http://tableclothjs.com/ 一个很好看的表格插件
http://layouts.ironmyers.com/
*/