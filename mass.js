window.onerror = function(a, b,c){
    alert(a+" "+c+" "+b)
}

;
(function( global, DOC ){
    var $$ = global.$//保存已有同名变量
    var rmakeid = /(#.+|\W)/g;
    var NsKey = DOC.URL.replace( rmakeid,"")
    var NsVal = global[ NsKey ];//公共命名空间
    var W3C   = DOC.dispatchEvent //w3c事件模型
    var html  = DOC.documentElement;
    var head  = DOC.head || DOC.getElementsByTagName( "head" )[0]
    var loadings = [];//正在加载中的模块列表
    var parsings = []; //储存需要绑定ID与factory对应关系的模块（标准浏览器下，先parse的script节点会先onload）
    var mass = 1;//当前框架的版本号
    var postfix = "";//用于强制别名
    var cbi = 1e5 ; //用于生成回调函数的名字
    var all = "lang_fix,lang,support,class,flow,query,data,node,attr,css_fix,css,event_fix,event,ajax,fx"
    var moduleClass = "mass" + (new Date() - 0);
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
        html:  html,
        head:  head,
        mix:   mix,
        rword: /[^, ]+/g,
        mass:  mass,//大家都爱用类库的名字储存版本号，我也跟风了
        "@bind": W3C ? "addEventListener" : "attachEvent",
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
                if( obj == obj.document && obj.document != obj ){
                    result = "Window"; //返回构造器名字
                }else if( obj.nodeType === 9 ) {
                    result = "Document";//返回构造器名字
                }else if( obj.callee ){
                    result = "Arguments";//返回构造器名字
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
        getUid: global.getComputedStyle ? function( obj ){//IE9+,标准浏览器
            return obj.uniqueNumber || ( obj.uniqueNumber = NsVal.uuid++ );
        }: function( obj ){
            if(obj.nodeType !== 1){//如果是普通对象，文档对象，window对象
                return obj.uniqueNumber || ( obj.uniqueNumber = NsVal.uuid++ );
            }//注：旧式IE的XML元素不能通过el.xxx = yyy 设置自定义属性
            var uid = obj.getAttribute("uniqueNumber");
            if ( !uid ){
                uid = NsVal.uuid++;
                obj.setAttribute( "uniqueNumber", uid );
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
    (function(scripts){
        var cur = scripts[ scripts.length - 1 ];
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

    })(DOC.getElementsByTagName( "script" ));
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
                    throw new Error("不符合模块标识规则: "+url)
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
        bind: W3C ? function( el, type, fn, phase ){
            el.addEventListener( type, fn, !!phase );
            return fn;
        } : function( el, type, fn ){
            el.attachEvent && el.attachEvent( "on"+type, fn );
            return fn;
        },
        unbind: W3C ? function( el, type, fn, phase ){
            el.removeEventListener( type, fn || $.noop, !!phase );
        } : function( el, type, fn ){
            if ( el.detachEvent ) {
                el.detachEvent( "on" + type, fn || $.noop );
            }
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
    var Storage = $.oneObject("setItem,getItem,removeItem,clear",$.noop);
    if( global.localStorage){
        Storage = localStorage; 
    }else  if( html.addBehavior){
        html.addBehavior('#default#userData');
        html.save("massdata");
        //https://github.com/marcuswestin/store.js/issues/40#issuecomment-4617842
        //在IE67它对键名非常严格,不能有特殊字符,否则抛throwed an This name may not contain the '~' character: _key-->~<--
        var rstoragekey = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g");
        function curry(fn) {
            return function(a, b) {
                html.load("massdata");
                a = String(a).replace(rstoragekey, function(w){
                    return w.charCodeAt(0);
                });
                var result = fn( a, b );
                html.save("massdata");
                return result
            }
        }
        Storage = {
            setItem : curry(function(key, val){
                html.setAttribute(key, val);
            }),
            getItem: curry(function(key){
                return html.getAttribute(key);
            }),
            removeItem: curry(function(key){
                html.removeAttribute(key);
            }),
            clear: function(){
                var attributes = html.XMLDocument.documentElement.attributes
                for (var i=0, attr; attr=attributes[i]; i++) {
                    html.removeAttribute(attr.name)
                }
            }
        }
    }
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
        var nodes = head.getElementsByTagName("script")
        for (var i = 0, node; node = nodes[i++];) {
            if ( node.className == moduleClass && node.readyState === "interactive") {
                node.className = "";
                return  node.pass = node.src;
            }
        }
    }
    //检测是否存在循环依赖
    function checkCycle( deps, nick ){
        for(var id in deps){
            if( deps[id] == "司徒正美" && modules[id].state != 2 &&( id == nick || checkCycle(modules[id].deps, nick))){
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
            //注意，在IE通过!modules[ id ].state检测可能不精确，这时立即移除节点会出错
            setTimeout(function(){
                head.removeChild(node)
            }, error ? 0 : 1000 );
            $.log("加载 "+ id +" 失败", 7);
        }else{
            return true;
        }
    }
    function loadJS( url ){
        var node = DOC.createElement("script")//, IE = node.uniqueID
        node.className = moduleClass;
        node[W3C ? "onload" : "onreadystatechange"] = function(){
            if(W3C || /loaded|complete/i.test(node.readyState) ){
                //mass Framework会在_checkFail把它上面的回调清掉，尽可能释放回存，尽管DOM0事件写法在IE6下GC无望
                var factory = parsings.pop() ;
                factory &&  factory.delay(node.src)
                if( checkFail(node) ){
                    $.log("已成功加载 "+node.src, 7);
                }
            }
        }
        node.onerror = function(){
            checkFail(node, true)
        }
        node.src = url;
        head.insertBefore(node, head.firstChild)
        $.log("正准备加载 "+node.src, 7)
    }
    function loadCSS(url){
        var id = url.replace(rmakeid,"");
        if (DOC.getElementById(id))
            return
        var node     =  DOC.createElement("link");
        node.rel     = "stylesheet";
        node.href    = url;
        node.id      = id;
        head.insertBefore( node, head.firstChild );
    }
    function loadStorage( id ){
        var factory =  Storage.getItem( id );
        if( $.config.storage && factory && !modules[id]){
            var parent = Storage.getItem(id+"_parent");
            var deps = Storage.getItem(id+"_deps");
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
        }//上线合并后能直接得到模块ID,否则寻找当前正在解析中的script节点的src作为模块ID
        //但getCurrentScript方法只对IE6-10,FF4+有效,其他使用onload+delay闭包组合
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
            parsings.push( factory )
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
    var readyFn, ready =  W3C ? "DOMContentLoaded" : "readystatechange" ;
    function fireReady(){
        modules.ready.state = 2;
        checkDeps();
        if( readyFn ){
            $.unbind( DOC, ready, readyFn );
        }
        fireReady = $.noop;//隋性函数，防止IE9二次调用_checkDeps
    };
    function doScrollCheck() {
        try {
            html.doScroll( "left" ) ;
            fireReady();
        } catch(e) {
            setTimeout( doScrollCheck, 31 );
        }
    };
    //在firefox3.6之前，不存在readyState属性
    //http://www.cnblogs.com/rubylouvre/archive/2012/12/18/2822912.html
    if(DOC.readyState == null){
        DOC.readyState = "loading";
        var readyState = true;
    }
    if ( DOC.readyState === "complete" ) {
        fireReady();//如果在domReady之外加载
    }else {
        $.bind( DOC, ready, readyFn = function(){
            if ( W3C || DOC.readyState === "complete" ){
                fireReady();
                if(readyState){//IE下不能改写DOC.readyState
                    DOC.readyState  = "complete";
                }
            }
        });
        if( html.doScroll && self.eval === parent.eval)
            doScrollCheck();
    }

    global.VBArray && ("abbr,article,aside,audio,bdi,canvas,data,datalist,details,figcaption,figure,footer," +
        "header,hgroup,mark,meter,nav,output,progress,section,summary,time,video").replace( $.rword, function( tag ){
        DOC.createElement(tag);
    });

    //https://developer.mozilla.org/en/DOM/window.onpopstate
    $.bind( global, "popstate", function(){
        NsKey = DOC.URL.replace(rmakeid,"");
        $.exports();
    });
    $.exports( $.config.nick +  postfix );//防止不同版本的命名空间冲突
/*combine modules*/

})( self, self.document );//为了方便在VS系列实现智能提示,把这里的this改成self或window


/**
 changelog:
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
2012.8.26 升级到v17
2012.8.27 将$.log.level改到$.config.level中去
2012.8.28 将最后一行的this改成self
2012.9.12 升级到v18 添加本地储存的支持
2012.11.21 升级到v19 去掉CMD支持与$.debug的实现,增加循环依赖的判定
2012.12.5 升级到v20，参考requireJS的实现，去掉iframe检测，暴露define与require
2012.12.16 精简loadCSS 让getCurrentScript更加安全
2012.12.18 升级v21 处理opera readyState BUG 与IE6下的节点插入顺序
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
Javascript 文件的同步加载与异步加载 http://www.cnblogs.com/ecalf/archive/2012/12/12/2813962.html
http://sourceforge.net/apps/trac/pies/wiki/TypeSystem/zh
http://tableclothjs.com/ 一个很好看的表格插件
http://layouts.ironmyers.com/
http://warpech.github.com/jquery-handsontable/
http://baidu.365rili.com/wnl.html?bd_user=1392943581&bd_sig=23820f7a2e2f2625c8945633c15089dd&canvas_pos=search&keyword=%E5%86%9C%E5%8E%86
http://unscriptable.com/2011/10/02/closures-for-dummies-or-why-iife-closure/
http://unscriptable.com/2011/09/30/amd-versus-cjs-whats-the-best-format/
http://news.cnblogs.com/n/157042/
http://www.cnblogs.com/beiyuu/archive/2011/07/18/iframe-tech-performance.html iframe异步加载技术及性能
http://www.cnblogs.com/lhb25/archive/2012/09/11/resources-that-complement-twitter-bootstrap.html
http://www.cnblogs.com/rainman/archive/2011/06/22/2086069.html
http://www.infoq.com/cn/articles/how-to-create-great-js-module 优秀的JavaScript模块是怎样炼成的
https://github.com/aralejs
http://y.duowan.com/resources/js/jsFrame/demo/index.html
https://github.com/etaoux/brix
 */
