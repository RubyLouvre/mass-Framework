void function( global, DOC ){
    var $$ = global.$//保存已有同名变量
    var rmakeid = /(#.+|\W)/g;
    var NsKey = DOC.URL.replace( rmakeid,"")
    var NsVal = global[ NsKey ];//公共命名空间
    var HTML  = DOC.documentElement;
    var HEAD  = DOC.head;
    var loadings = [];//正在加载中的模块列表
    var stack = []; //储存需要绑定ID与factory对应关系的模块（标准浏览器下，先parse的script节点会先onload）
    var mass = 1;//当前框架的版本号
    var postfix = "";//用于强制别名
    var cbi = 1e5 ; //用于生成回调函数的名字
    var all = "lang_fix,lang,support,class,flow,query,data,node,attr,css_fix,css,event_fix,event,ajax,fx"
    var class2type = {
        "[object HTMLDocument]"   : "Document",
        "[object HTMLCollection]" : "NodeList",
        "[object StaticNodeList]" : "NodeList",
        "[object IXMLDOMNodeList]": "NodeList",
        "[object DOMWindow]"      : "Window"  ,
        "[object global]"         : "Window"  ,
        "null"                    : "Null"    ,
        "NaN"                     : "NaN"     ,
        "undefined"               : "Undefined"
    }
    var toString = class2type.toString, basepath
    function $( expr, context ){//新版本的基石
        if( $.type( expr,"Function" ) ){ //注意在safari下,typeof nodeList的类型为function,因此必须使用$.type
            return  $.require( all+",ready", expr );
        }else{
            if( !$.fn )
                throw "node module is required!"
            return new $.fn.init( expr, context );
        }
    }
    //多版本共存
    if( typeof NsVal !== "function"){
        NsVal = $;//公用命名空间对象
        NsVal.uuid = 1;
    }
    if(NsVal.mass !== mass  ){
        NsVal[ mass ] = $;//保存当前版本的命名空间对象到公用命名空间对象上
        if(NsVal.mass || ($$ && $$.mass == null)) {
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
    var has = Object.prototype.hasOwnProperty
    function mix( receiver, supplier ){
        var args = Array.apply([], arguments ),i = 1, key,//如果最后参数是布尔，判定是否覆写同名属性
        ride = typeof args[args.length - 1] == "boolean" ? args.pop() : true;
        if(args.length === 1){//处理$.mix(hash)的情形
            receiver = !this.window ? this : {} ;
            i = 0;
        }
        while((supplier = args[i++])){
            for ( key in supplier ) {//允许对象糅杂，用户保证都是对象
                if ( has.call(supplier,key) && (ride || !(key in receiver))) {
                    receiver[ key ] = supplier[ key ];
                }
            }
        }
        return receiver;
    }

    mix( $, {//为此版本的命名空间对象添加成员
        html:  HTML,
        head:  HEAD,
        mix:   mix,
        rword: /[^, ]+/g,
        mass:  mass,//大家都爱用类库的名字储存版本号，我也跟风了
        "@bind": "addEventListener" ,
        //将内部对象挂到window下，此时可重命名，实现多库共存  name String 新的命名空间
        exports: function( name ) {
            $$ && ( global.$ = $$ );//多库共存
            name = name || $.config.nick;//取得当前简短的命名空间
            $.config.nick = name;
            global[ NsKey ] = NsVal;
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
            var ret = [], n = nodes.length;
            if(end === void 0 || typeof end == "number" && isFinite(end)){
                start = parseInt(start,10) || 0;
                end = end == void 0 ? n : parseInt(end, 10);
                if(start < 0){
                    start += n;
                }
                if(end > n){
                    end = n;
                }
                if(end < 0){
                    end += n;
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
                if( obj.nodeType === 9 ) {
                    result = "Document";//返回构造器名字
                }else if( isFinite( obj.length ) && obj.item ){
                    result = "NodeList"; //处理节点集合
                }else{
                    result = toString.call( obj ).slice( 8, -1 );
                }
            }
            if( str ){
                return str === result;
            }
            return result;
        },
        //$.log(str, showInPage=true, 5 )
        //level Number，通过它来过滤显示到控制台的日志数量。0为最少，只显示最致命的错误，
        //7则连普通的调试消息也打印出来。 显示算法为 level <= $.config.level。
        //这个$.colre.level默认为9。下面是level各代表的含义。
        //0 EMERGENCY 致命错误,框架崩溃
        //1 ALERT 需要立即采取措施进行修复
        //2 CRITICAL 危急错误
        //3 ERROR 异常
        //4 WARNING 警告
        //5 NOTICE 通知用户已经进行到方法
        //6 INFO 更一般化的通知
        //7 DEBUG 调试消息
        log: function (str){
            var show = true, page = false
            for(var i = 1 ; i < arguments.length; i++){
                var el = arguments[i]
                if(typeof el == "number"){
                    show = el <=  $.config.level
                }else if(el === true){
                    page = true;
                }
            }
            if(show){
                if( page === true ){
                    $.require( "ready", function(){
                        var div =  DOC.createElement( "pre" );
                        div.className = "mass_sys_log";
                        div.innerHTML = str +"";//确保为字符串
                        DOC.body.appendChild(div);
                    });
                }else if( global.console ){
                    global.console.log( str );
                }
            }
            return str
        },
        //主要用于建立一个从元素到数据的引用，具体用于数据缓存，事件绑定，元素去重
        getUid:  function( obj ){//IE9+,标准浏览器
            return obj.uniqueNumber || ( obj.uniqueNumber = NsVal.uuid++ );
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
        },
        config: function( settings ) {
            var kernel  = $.config;
            for ( var p in settings ) {
                if (!settings.hasOwnProperty( p ))
                    continue
                var prev = kernel[ p ];
                var curr = settings[ p ];
                if (prev && p === "alias") {
                    for (var c in curr) {
                        if (curr.hasOwnProperty( c )) {
                            var prevValue = prev[ c ];
                            var currValue = curr[ c ];
                            if( prevValue && prev !== curr ){
                                throw new Error(c + "不能重命名")
                            }
                            prev[ c ] = currValue;
                        }
                    }
                } else {
                    kernel[ p ] = curr;
                }
            }
            return this
        }
    });
    (function(scripts, cur){
        cur = scripts[ scripts.length - 1 ];
        var url = cur.hasAttribute ?  cur.src : cur.getAttribute( "src", 4 );
        url = url.replace(/[?#].*/, "");
        var a = cur.getAttribute("debug");
        var b = cur.getAttribute("storage");
        var kernel = $.config;
        kernel.debug = a == "true" || a == "1";
        kernel.storage = b == "true"|| b == "1";
        basepath =  kernel.base = url.substr( 0, url.lastIndexOf("/") ) +"/";
        kernel.nick = cur.getAttribute("nick") || "$";
        kernel.erase = cur.getAttribute("erase") || "erase";
        kernel.alias = {};
        kernel.level = 9;

    })(DOC.scripts );
    $.noop = $.error = function(){};

    "Boolean,Number,String,Function,Array,Date,RegExp,Window,Document,Arguments,NodeList".replace( $.rword, function( name ){
        class2type[ "[object " + name + "]" ] = name;
    });

    function parseURL(url, parent, ret){
        //[]里面，不是开头的-要转义，因此要用/^[-a-z0-9_$]{2,}$/i而不是/^[a-z0-9_-$]{2,}
        //别名至少两个字符；不用汉字是避开字符集的问题
        if( /^(mass|ready)$/.test(url)){//特别处理ready标识符
            return [url, "js"];
        }
        if(/^[-a-z0-9_$]{2,}$/i.test(url) && $.config.alias[url] ){
            ret = $.config.alias[url];
        }else{
            parent = parent.substr( 0, parent.lastIndexOf('/') )
            if(/^(\w+)(\d)?:.*/.test(url)){  //如果用户路径包含协议
                ret = url
            }else {
                var tmp = url.charAt(0);
                if( tmp !== "." && tmp != "/"){  //相对于根路径
                    ret = basepath + url;
                }else if(url.slice(0,2) == "./"){ //相对于兄弟路径
                    ret = parent + url.substr(1);
                }else if( url.slice(0,2) == ".."){ //相对于父路径
                    var arr = parent.replace(/\/$/,"").split("/");
                    tmp = url.replace(/\.\.\//g,function(){
                        arr.pop();
                        return "";
                    });
                    ret = arr.join("/")+"/"+tmp;
                }else if(tmp == "/"){
                    ret = parent  + url
                }else{
                    throw new Error("不符合模块标识规则")
                }
            }
        }
        var ext = "js";
        tmp = ret.replace(/[?#].*/, "");
        if(/\.(\w+)$/.test( tmp )){
            ext = RegExp.$1;
        }
        if( ext!="css" &&tmp == ret && !/\.js$/.test(ret)){//如果没有后缀名会补上.js
            ret += ".js";
        }
        return [ret, ext];
    }

    $.mix({
        //绑定事件(简化版)
        bind: function( el, type, fn, phase ){
            el.addEventListener( type, fn, !!phase );
            return fn;
        },
        unbind:  function( el, type, fn, phase ){
            el.removeEventListener( type, fn || $.noop, !!phase );
        },
        //移除指定或所有本地储存中的模块
        erase : function( id, v ){
            if(id == void 0){
                Storage.clear();
            }else{
                var old = Storage.getItem( id+"_version" );
                if(old && (!v || v > Number(old)) ){
                    Storage.removeItem( id );
                    Storage.removeItem( id+"_deps" );
                    Storage.removeItem( id+"_parent" );
                    Storage.removeItem( id+"_version" );
                }
            }
        }
    });
    //================================localStorage===============================
    var Storage =  localStorage;
    var rerase = new RegExp("(?:^| )" + $.config.erase + "(?:(?:=([^;]*))|;|$)")
    var match = String(DOC.cookie).match( rerase );
    //读取从后端过来的cookie指令，转换成一个对象，键名为模块的URL，值为版本号（这是一个时间戮）
    if(match && match[1]){
        try{
            var obj = eval("0,"+match[1]);
            for(var i in obj){//$.erase会版本号比现在小的模块从本地储存中删掉
                $.erase(i, obj[i])
            }
        }catch(e){}
    }

    //============================加载系统===========================
    var modules = $.modules =  {
        ready:{ },
        mass: {
            state: 2,
            exports: $
        }
    };
    function getCurrentScript(){
        if(DOC.currentScript){
            return DOC.currentScript.src
        }
        var nodes = DOC.getElementsByTagName("script")
        for (var i = 0, node; node = nodes[i++];) {
            if (!node.pass && node.readyState === "interactive") {
                return  node.pass = node.src;
            }
        }
    }
    //检测是否存在循环依赖
    function checkCycle( deps, nick ){
        for(var id in deps){
            if( deps[id] == "司徒正美" &&( id == nick || checkCycle(modules[id].deps, nick))){
                return true;
            }
        }
    }
    //检测此JS模块的依赖是否都已安装完毕,是则安装自身
    function checkDeps(){
        loop:
        for ( var i = loadings.length, id; id = loadings[ --i ]; ) {
            var obj = modules[ id ], deps = obj.deps;
            for( var key in deps ){
                if( deps.hasOwnProperty( key ) && modules[ key ].state != 2 ){
                    continue loop;
                }
            }
            //如果deps是空对象或者其依赖的模块的状态都是2
            if( obj.state != 2){
                loadings.splice( i, 1 );//必须先移除再安装，防止在IE下DOM树建完后手动刷新页面，会多次执行它
                fireFactory( obj.id, obj.args, obj.factory );
                checkDeps();
            }
        }
    }
    function checkFail( node, error ){
        var id = node.src;
        node.onload = node.onreadystatechange = node.onerror = null;
        if( error || !modules[ id ].state ){
            if(error){//注意，在标准浏览器下通过!modules[ id ].state检测可能不精确，这时移出节点会出错
                HEAD.removeChild(node)
            }
            $.log("加载 "+ id +" 失败", 7);
        }else{
            return true;
        }
    }
    function loadJS( url ){
        var node = DOC.createElement("script")
        node.onload = node.onreadystatechange = function(){
            if(/loaded|complete|undefined/i.test(node.readyState) ){
                //mass Framework会在_checkFail把它上面的回调清掉
                //因为在IE9-10, opera中，它们同时支持onload，onreadystatechange，以防重复执行factory.delay
                var factory = stack.pop() ;
                factory &&  factory.delay(node.src)
                if( checkFail(node) ){
                    $.log("已成功加载 "+node.src, 7);
                }
            }
        }
        node.onerror = function(){
            checkFail(node, true)
        }
        node.src = url
        $.log("正准备加载 "+node.src, 7)
        HEAD.appendChild( node );
    }
    function loadStorage( id ){
        var factory =  Storage.getItem( id );
        if( $.config.storage && factory && !modules[id]){
            var parent = Storage.getItem(id+"_parent");
            var deps   = Storage.getItem(id+"_deps");
            deps = deps ?  deps.match( $.rword ) : "";
            modules[ id ] ={
                id: id,
                parent: parent,
                exports: {},
                state: 1
            };
            require(deps, Function("return "+ factory )(), id) //0,1,2 --> 1,2,0
        }
    }
    function loadCSS(url){
        var id = url.replace(rmakeid,"");
        if (DOC.getElementById(id))
            return
        var link     =  DOC.createElement("link");
        link.charset = "utf-8";
        link.rel     = "stylesheet";
        link.href    = url;
        link.type    = "text/css";
        link.id      = id;
        HEAD.appendChild( link );
    }
    //请求模块（依赖列表,模块工厂,加载失败时触发的回调）
    window.require = $.require = function( list, factory, parent ){
        var deps = {},  // 用于检测它的依赖是否都为2
        args = [],      // 用于依赖列表中的模块的返回值
        dn = 0,         // 需要安装的模块数
        cn = 0,         // 已安装完的模块数
        id = parent || "cb"+ ( cbi++ ).toString(32);
        parent = parent || basepath
        String(list).replace( $.rword, function(el){
            var array = parseURL(el, parent ),  url = array[0];
            if(array[1] == "js"){
                dn++
                loadStorage( id )
                if( !modules[ url ]  ){
                    modules[ url ] = {
                        id: url,
                        parent: parent,
                        exports: {}
                    };
                    loadJS( url );
                }else if( modules[ url ].state === 2 ){
                    cn++;
                }
                if( !deps[ url ] ){
                    args.push( url );
                    deps[ url ] = "司徒正美";//去重
                }
            }else if(array[1] === "css"){
                loadCSS( url );
            }
        });
        //创建或更新模块的状态
        modules[id] = {
            id: id,
            factory: factory,
            deps: deps,
            args: args,
            state: 1
        }
        if( dn === cn ){//如果需要安装的等于已安装好的
            fireFactory( id, args, factory );//装配到框架中
            checkDeps();
            return
        }
        //在正常情况下模块只能通过_checkDeps执行
        loadings.unshift( id );
    }
    //定义模块
    var rcomment =  /\/\*(?:[^*]|\*+[^\/*])*\*+\/|\/\/.*/g
    window.define = $.define = function( id, deps, factory ){//模块名,依赖列表,模块本身
        var args = Array.apply([],arguments), _id
        if(typeof id == "string"){
            _id = args.shift();
        }
        if( typeof args[0] === "boolean" ){//用于文件合并, 在标准浏览器中跳过补丁模块
            if( args[0] ){
                return;
            }
            args.shift()
        }
        if(typeof args[0] == "function"){
            args.unshift([]);
        }
        id = modules[id] && modules[id].state == 2 ? _id : getCurrentScript();
        factory = args[1];
        factory.id = _id;//用于调试
        factory.delay = function( id ){
            args.push( id );
            if( checkCycle(modules[id].deps, id)){
                throw new Error( id +"模块与之前的某些模块存在循环依赖")
            }
            if( $.config.storage && !Storage.getItem( id ) ){
                Storage.setItem( id, factory.toString().replace(rcomment,""));
                Storage.setItem( id+"_deps", args[0]+"");
                Storage.setItem( id+"_parent",  id);
                Storage.setItem( id+"_version", new Date - 0);
            }
            delete factory.delay;//释放内存
            require.apply(null, args); //0,1,2 --> 1,2,0
        }
        if(id ){
            factory.delay(id,args)
        }else{//先进先出
            stack.push( factory )
        }
    }
    $.require.amd = modules

    //从returns对象取得依赖列表中的各模块的返回值，执行factory, 完成模块的安装
    function fireFactory( id, deps, factory ){
        for ( var i = 0, array = [], d; d = deps[i++]; ) {
            array.push( modules[ d ].exports );
        }
        var module = Object( modules[id] ), ret;
        ret =  factory.apply(global, array);
        module.state = 2;
        if( ret !== void 0 ){
            modules[ id ].exports = ret
        }
        return ret;
    }
    all.replace($.rword,function(a){
        $.config.alias[ "$"+a ] = basepath + a + ".js";
    });
    //domReady机制
    var readyFn, ready =  "DOMContentLoaded";
    function fireReady(){
        modules.ready.state = 2;
        checkDeps();
        if( readyFn ){
            $.unbind( DOC, ready, readyFn );
        }
        fireReady = $.noop;//隋性函数，防止IE9二次调用_checkDeps
    };


    if ( DOC.readyState === "complete" ) {
        fireReady();//如果在domReady之外加载
    }else {
        $.bind( DOC, ready, readyFn = function(){
            fireReady();
        });
    }
    //https://developer.mozilla.org/en/DOM/window.onpopstate
    $.bind( global, "popstate", function(){
        NsKey = DOC.URL.replace(rmakeid,"");
        $.exports();
    });
    $.exports( $.config.nick +  postfix );//防止不同版本的命名空间冲突
/*combine modules*/

}( self, self.document );//为了方便在VS系列实现智能提示,把这里的this改成self或window


/**
 changelog:
2012.12.6 mass_neo
 */
