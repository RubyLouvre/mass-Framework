
if (typeof(Ten) == 'undefined')

    Ten = {};
Ten.Function = {/*略*/}
Ten.Array = {/*略*/}
Ten.Class = function(){/*略*/}
Ten.JSONP = new Ten.Class(/*略*/)
Ten.XHR = new Ten.Class(/*略*/);

//jQuery1.2
var _jQuery = window.jQuery,_$ = window.$;//先把可能存在的同名变量保存起来

jQuery.extend({
    noConflict: function( deep ) {
        window.$ = _$;//这时再放回去
        if ( deep )
            window.jQuery = _jQuery;
        return jQuery;
    }
})

namespace = DOC.URL.replace( /(#.+|\W)/g,'');

function extend(destination, source) {
    for (var property in source)
        destination[property] = source[property];
    return destination;
}

Object.keys = Object.keys || function(obj){
    var a = [];
    for(a[a.length] in obj);
    return a ;
}

function mix( target, source ){//如果最后参数是布尔，判定是否覆写同名属性
    var args = [].slice.call( arguments ),i = 1, key,
    ride = typeof args[args.length - 1] == "boolean" ? args.pop() : true;
    if(args.length === 1){//处理$.mix(hash)的情形
        target = !this.window ? this : {} ;
        i = 0;
    }
    while((source = args[i++])){
        for ( key in source ) {//允许对象糅杂，用户保证都是对象
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
    "@debug": true,
    "@target": w3c ? "addEventListener" : "attachEvent",
//……其他想要添加的属性或方法
})


    slice: function ( nodes, start, end ) {
        for(var i = 0, n = nodes.length, result = []; i < n; i++){
            result[i] = nodes[i];
        }
        if ( arguments.length > 1 ) {
            return result.slice( start , ( end || result.length ) );
        } else {
            return result;
        }
    }


typeof null// "object"
typeof document.childNodes //safari "function"
typeof document.createElement('embed')//ff3-10 "function"
typeof document.createElement('object')//ff3-10 "function"
typeof document.createElement('applet')//ff3-10 "function"
typeof /\d/i //在实现了ecma262v4的浏览器返回 "function"
typeof window.alert //IE678 "object""

var iframe = document.createElement('iframe');
document.body.appendChild(iframe);
xArray = window.frames[window.frames.length-1].Array;
var arr = new xArray(1,2,3); // [1,2,3]
arr instanceof Array; // false
arr.constructor === Array; // false

window.onload = function(){
    alert(window.constructor);// IE67 undefined
    alert(document.constructor);// IE67 undefined
    alert(document.body.constructor);// IE67 undefined
    alert( (new ActiveXObject('Microsoft.XMLHTTP')).constructor);// IE6789 undefined
}

isNaN("aaa") //true

if(typeof window.ActiveXObject != "undefined"){
    var xhr = new ActiveXObject("Msxml2.XMLHTTP");
    alert(typeof xhr.abort);
}

typeof new Boolean(1);//"object"
typeof new Number(1);//"object"
typeof new String("aa");//"object"

var toString = Object.prototype.toString;
alert(toString.call(null)); //[object Null] IE678是[object Object]
alert(toString.call(undefined));//[object Undefined] IE678是[object Object]
alert(toString.call(1));//[object Number]
alert(toString.call([1,2,3]));//[object Number]
alert(toString.call("xxx"));//[object String]
alert(toString.call(new Date));//[object Date]
alert(toString.call(/test/));//[object RegExp]
alert(toString.call(function(){}));//[object Function]

function isNaN( obj ){
    return obj !== obj
}
function isNull ( obj ){
    return obj === null;
}
function isUndefined ( obj ){
    return obj === void 0;
}
function isArray( arr ) {
    return aar instanceof Array;
}
function isArray( arr ) {
    return !!arr && arr.constructor == Array;
}
function isArray(arr) {//Prototype.js1.6.0.3
    return arr != null && typeof arr === "object" &&
    'splice' in arr && 'join' in arr;
}
function isArray(arr){//Douglas Crockford
    return typeof arr.sort == 'function'
}
function isArray(array){//kriszyp
    var result = false;
    try{
        new array.constructor(Math.pow(2, 32))
    }catch(e){
        result=/Array/.test(e.message)
    };
    return result;
};
function isArray(o) {// kangax
    try {
        Array.prototype.toString.call(o); return true;
    } catch(e) { }
    return false;
};
function isArray(o) {//kangax
    if (o && typeof o == 'object' && typeof o.length == 'number' && isFinite(o.length)) {
        var _origLength = o.length;o[o.length] = '__test__';
        var _newLength = o.length; o.length = _origLength;
        return _newLength == _origLength + 1;
    }
    return false;
}



window == document // IE678 true;
document == window // IE678 false;

    //var isArrayLike = selector.length && selector[selector.length - 1] !== undefined && !selector.nodeType;
    //
    //isFunction: function( fn ) {
    //    return !!fn && typeof fn != "string" && !fn.nodeName &&
    //        fn.constructor != Array && /^[\s[]?function/.test( fn + "" );
    //    }
    //class2type = {}
    //jQuery.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
    //    class2type[ "[object " + name + "]" ] = name.toLowerCase();
    //});
    //type: function( obj ) {
    //    return obj == null ?
    //        String( obj ) :
    //        class2type[ toString.call(obj) ] || "object";
    //},
    //jquery1.43~1.64

    //    isNaN: function( obj ) {
    //        return obj == null || !rdigit.test( obj ) || isNaN( obj );
    //    },
    //    //jquery1.7 就是isNaN的取反版
    //    isNumeric: function( obj ) {
    //        return obj != null && rdigit.test( obj ) && !isNaN( obj );
    //    },
    //    //jquery1.71~1.72
    //    isNumeric: function( obj ) {
    //        return !isNaN( parseFloat(obj) ) && isFinite( obj );
    //    }
    /*
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
"Boolean,Number,String,Function,Array,Date,RegExp,Window,Document,Arguments,NodeList"
.replace( $.rword, function( name ){
    class2type[ "[object " + name + "]" ] = name;
});
type: function ( obj, str ){
    var result = class2type[ (obj == null || obj !== obj ) ? obj :  toString.call( obj ) ]
        || obj.nodeName || "#";
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
*/
    //tangram
    isDate: function(o){
        return {}.toString.call(o) === "[object Date]" && o.toString() !== 'Invalid Date' && !isNaN(o);
    }
    isNumber:function(o){
        return '[object Number]'  == {}.toString.call(o) && isFinite(o);
    }
var MODULE = (function () {
    var my = {},
    privateVariable = 1;

    function privateMethod() {
    // ...
    }
    my.moduleProperty = 1;
    my.moduleMethod = function () {
    // ...
    };

    return my;
}());

var scripts = document.getElementsByTagName( "script" );
node = scripts[ scripts.length - 1 ];
console.log(node.src)//http://localhost:8888/src/test.js

//"@path": (function( url, scripts, node ){
//    scripts = DOC.getElementsByTagName( "script" );
//    node = scripts[ scripts.length - 1 ];//FF下可以使用DOC.currentScript
//    url = node.hasAttribute ?  node.src : node.getAttribute( 'src', 4 );
//    return url.substr( 0, url.lastIndexOf('/') );
//})()


define(function(require, exports, module) {
    var $ = require('jquery');
    var m2 = require('module2');
    var m3 = require('module3');

    exports.run = function() {
        return $.merge(['module1'], $.merge(m2.run(), m3.run()));
    }
});

require(['jquery', 'event', 'selector'], function($, E, S) {
    alert($);
});

define("foo/title", ["my/cart", "my/inventory"], function(cart, inventory) {
    //Define foo/title object in here.
    } );

$.define("foo/title", "my/cart,my/inventory", function(cart, inventory) {
    //Define foo/title object in here.
    } );

$.define = function(name, deps, factory){//定义一个模块
    factory.token = "@"+ name;
    this.require( deps, factory)
}
var mapper = {},    //用于储存模块的信息
returns = {},       //用于储存模块的返回值
loadings = [],      //正在加载的模块
rmodule = /([^(\s]+)\(?([^)]*)\)?/,//分解出模块名与可能存在的URL地址
cbi = 1e5           //用于为普通回调起名
//请求模块（依赖列表,模块工厂,加载失败时触发的回调）
$.require =  function( deps, factory, errback ){
    var _deps = {}, // 用于检测它的依赖是否都为2
    args = [],      // 用于依赖列表中的模块的返回值
    dn = 0,         // 需要加载的模块数
    cn = 0;         // 已加载完的模块数
    ( deps +"" ).replace( $.rword, function( url, name, match ){
        dn++;
        match = url.match( rmodule );
        name  = "@"+ match[1];//取得模块名
        if( !mapper[ name ] ){ //防止重复生成节点与请求
            mapper[ name ] = { };//state: undefined, 未加载; 1 已加载; 2 : 已执行
            loadJS( name, match[2] );//加载JS文件
        }else if( mapper[ name ].state === 2 ){
            cn++;
        }
        if( !_deps[ name ] ){
            args.push( name );
            _deps[ name ] = "司徒正美";//去重，去掉@ready
        }
    });
    var token = factory.token || "@cb"+ ( cbi++ ).toString(32);
    if( dn === cn ){//如果需要加载的等于已加载好的
        (mapper[ token ] || {}).state = 2;
        return returns[ token ] = setup( token, args, factory );//装配到框架中
    }
    if( errback ){
        $.stack( errback );//压入错误堆栈
    }
    mapper[ token ] = {//储存模块的信息
        callback:factory,
        name: token,
        deps: _deps,
        args: args,
        state: 1
    };//在正常情况下模块只能通过resolveCallbacks执行
    loadings.unshift( token );
    $._checkDeps();//FIX opera BUG。opera在内部解析时修改执行顺序，导致没有执行最后的回调
}

var script = document.createElement('script') ;
var head = document.getElementsByTagName("head")[0];
head.insertBefore(script, head.firstChild);//规避IE6下自闭合base标签BUG
script.onload = script.onreadystatechange = function(){//先绑定事件再指定src发出请求
    if(/loaded|complete|undefined/.test(this.readyState) && !this.once ){
        console.log(this.readyState + "加载成功")
        this.once = 1;
        this.parentNode.removeChild(this);
    }
}
script.src = 'http://files.cnblogs.com/rubylouvre/html5.js'

$.check = {
    aaa: 1,
    bbb: 1,
    ccc: 1
}
$.bind(el1,"onload", function(){//el1是用于加载aaa模块的script节点
    delete $.check.aaa
});
$.bind(el2,"onload", function(){//el2是用于加载bbb模块的script节点
    delete $.check.bbb
})
$.bind(el3,"onload", function(){//el3是用于加载ccc模块的script节点
    delete $.check.ccc
});
window.onload = function(){
    for(var module in $.check){
        if($.check[ module ] === 1){
            reportError( module );//通报module模块没有加载成功
        }
    }
}

function loadJS( name, url ){
    url = url  || $[ "@path" ] +"/"+ name.slice(1) + ".js" + ( $[ "@debug" ] ?
        "?timestamp="+(new Date-0) : "" );
    var iframe = DOC.createElement("iframe"),//IE9的onload经常抽疯
    codes = ['<script>var nick ="', name, '", $ = {}, Ns = parent.', $["@name" ],
    '; $.define = ', innerDefine, '<\/script><script src="',url,'" ',
    (DOC.uniqueID ? "onreadystatechange" : "onload"),
    '="if(/loaded|complete|undefined/i.test(this.readyState) ){ ',
    'Ns._checkDeps();Ns._checkFail(this.ownerDocument,nick); ',
    '} " onerror="Ns._checkFail(this.ownerDocument, nick, true);" ><\/script>' ];
    iframe.style.display = "none";//opera在11.64已经修复了onerror BUG
    //http://www.tech126.com/https-iframe/
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

//执行所有依赖都已加载成功的模块
$._checkDeps = function (){
    loop:
    for ( var i = loadings.length, name; name = loadings[ --i ]; ) {
        var obj = mapper[ name ], deps = obj.deps;
        for( var key in deps ){
            if( deps.hasOwnProperty( key ) && mapper[ key ].state != 2 ){
                continue loop;
            }
        }
        if( obj.state != 2){
            loadings.splice( i, 1 );//从加载列队中移除
            returns[ obj.name ] = setup( obj.name, obj.args, obj.callback );
            obj.state = 2;//置为2，表示已执行过
            $._checkDeps();//再执行一次，以防有其他模块依赖于它
        }
    }
}

//用于检测这模块有没有加载成功
$._checkFail = function(  doc, name, error ){
    doc && (doc.ok = 1);//添加标识，如果ok不为1说明没有加载成功
    if( error || !mapper[ name ].state ){
        this.log("Failed to load [[ "+name+" ]]");
        this.stack.fire();//打印错误堆栈
    }
}

function setup( name, deps, fn ){
    for ( var i = 0,argv = [], d; d = deps[i++]; ) {
        argv.push( returns[ d ] );//从returns对象取得依赖列表中的各模块的返回值
    }//global为window
    var ret = fn.apply( global, argv );//执行模块工厂，然后把返回值放到returns对象中
    $.debug( name )
    return ret;
}


//http://webreflection.blogspot.com/search?q=onContent
//by Andrea Giammarchi 2006.9.24
document.write("<script id=__ie_onload defer src=//0><\/scr"+"ipt>");
script = document.getElementById("__ie_onload");
script.onreadystatechange = function() {//IE即使是死链也能触发事件
    if (this.readyState == "complete")
        init(); // 指定了defer的script会在DOM树建完才触发
};

//http://javascript.nwbox.com/IEContentLoaded/
//by Diego Perini 2007.10.5
function IEContentLoaded (w, fn) {
    var d = w.document, done = false,
    init = function () {
        if (!done) {//只执行一次
            done = true;
            fn();
        }
    };
    (function () {
        try {//在DOM未建完之前调用元素的doScroll发抛错
            d.documentElement.doScroll('left');
        } catch (e) {//延迟再试
            setTimeout(arguments.callee, 50);
            return;
        }
        init();//没有错误则执行用户回调
    })();
    // 如果用户是在domReady之后绑定这个函数呢？立即执行它
    d.onreadystatechange = function() {
        if (d.readyState == 'complete') {
            d.onreadystatechange = null;
            init();
        }
    };
}