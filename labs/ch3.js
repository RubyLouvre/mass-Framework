

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

window == document // IE678 true;
document == window // IE678 false;