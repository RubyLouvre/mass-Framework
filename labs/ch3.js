

namespace = DOC.URL.replace( /(#.+|\W)/g,'');

function extend(destination, source) {
    for (var property in source)
        destination[property] = source[property];
    return destination;
}

function mix( target, source ){
    var args = [].slice.call( arguments ), key,//如果最后参数是布尔，判定是否覆写同名属性
    ride = typeof args[args.length - 1] == "boolean" ? args.pop() : true;
    target = target || {};//如果只传入一个参数，则是拷贝对象
    for(var i = 1; source = args[i++];){//允许对象糅杂，用户保证都是对象
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
    try{new array.constructor(Math.pow(2, 32))}catch(e){result=/Array/.test(e.message)};
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