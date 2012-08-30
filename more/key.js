function make(a){
    var str="1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    a = typeof a>'t' ? +(Math.random()+'').slice(2) : parseInt(a,36);
    var len = a%62 +1;
    var n=str.length,s=1;
    for(var i=0,j=0,ans=[];i<len;i++){
        j=(a+j)%n;
        ans.push(str.charAt(j-1));
        str = str.replace(ans[ans.length-1],"");
        n=str.length;
    }
    return ans.join('');
}
console.log(make());
console.log(make());
console.log(make('s3wfe'));
console.log(make('s3wfe'));
console.log(make('s3w'));
console.log(make('rtu'));
console.log(make('rtu'));

//要求1：用(0-9 A-Z a-z)生成 任意长度(62位内)的各位不重复的随机字符串。

//要求2：在实现上述功能后，尝试实现新的要求：插入key值，实现同key值情况下生成的字符串相同。
//'object'
//'number'
//'string'
//'boolean'
//'function'
//'undefined'
//开头的字母，'undefined' 刚好>'t'
//约瑟夫环 通过数字生成随机字符串的算法
//随机策略，根据传入的key作为seed，来生成随机策略
function hashCode(str){
    var h = 0, off = 0;
    var len = str.length;
    for(var i = 0; i < len; i++){
        h = 31 * h  + str.charCodeAt(off++);
        if(h > 0x7fffffff || h < 0x80000000){
            h = h & 0xffffffff;
        }
    }
    return h;
};

;(function (window, document, ns, undefined) {
    ns = window[ns];

    var util = ns.Util;
    var _String = util.String;
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
    var _hash = function () {
        var hash = {};
        var len = chars.length;
        var i = 0;
        for (; i< len; i++){
           hash[chars[i]] = i;
        }
        return hash;
    }();

    _String.encodeBase64 = function (str) {
        if(window.btoa){
            /*
                chrome 下 encodeBase64 = btoa, 会有问题.so...

                Firefox 1+
                Safari 3+
                Chrome 1+
                Opera 10+

            */
            return window.btoa(str);
        }
        if(/[^\u0000-\u00ff]/.test(str)){
            throw new Error('encodeBase64 : INVALID_CHARACTER_ERR');
        }
        var hash = chars;
        var i = 2;
        var len = str.length;
        var output = [];
        var link;
        var mod = len % 3;

        len = len - mod;
        for (; i < len; i+=3){
            output.push(
                hash[(link = str.charCodeAt(i-2)) >> 2],
                hash[((link & 3) << 4 | ((link = str.charCodeAt(i-1)) >> 4))],
                hash[((link & 15) << 2 | ((link = str.charCodeAt(i)) >> 6))],
                hash[(link & 63)]
            );
        }
        if(mod){
            output.push(
                hash[(link = str.charCodeAt(i-2)) >> 2],
                hash[((link & 3) << 4 | ((link = str.charCodeAt(i-1)) >> 4))],
                link ? hash[(link & 15) << 2] + '=': '=='
            );
        }

        return output.join('');
    };

    _String.decodeBase64 = function (str) {
        if(window.atob){
            /*
                chrome 下 encodeBase64 = btoa, 会有问题.so...

                Firefox 1+
                Safari 3+
                Chrome 1+
                Opera 10+

            */
            return window.atob(str)
        }

        var hash = _hash;
        var i = 3;
        var len = str.length;
        var output = [];
        var link;
        var end = '';
        var fromCharCode = String.fromCharCode;
        var last = str.charCodeAt(len - 1);
        var penult = str.charCodeAt(len - 2);
        var mod = len % 4;
        var error = 0;

        if(mod === 1){
            //btoa('a') error
            error = 1;
        }else if(!/^[a-zA-Z0-9+\/]{2,}={0,2}$/.test(str)){
            /*
                btoa('=aaaa') errors
                btoa('!!!!') error
            */
            error = 1;
        }else if(mod === 2){
            if(last === 61 || penult === 61){
                 error = 1;
            }else{
                str += '==';
                last = penult = 61
                len += 2;
            }

        }else if(mod === 3){
            if(penult === 61){
                error = 1;
            }else{
                str += '=';
                penult = 61;
                len++;
            }

        }



        if(last === 61){
            end = fromCharCode(hash[str.charAt(len - 4)] << 2 | (link = hash[str.charAt(len - 3)]) >> 4) +
                (penult === 61 ? '' : fromCharCode((link & 15) << 4 | hash[str.charAt(len - 2)] >> 2));
            len = len  - 4;
        }
        for (; i < len; i+=4){
            output.push(
                fromCharCode(hash[str.charAt(i-3)] << 2 | (link = hash[str.charAt(i-2)]) >> 4),
                fromCharCode((link & 15) << 4 |  (link = hash[str.charAt(i-1)]) >>2),
                fromCharCode((link & 3) << 6 | hash[str.charAt(i)])
            );
        }

        return output.join('') + end;


    };

})(window, document, '_SNYU_');

var createUID = (function(){
	var seed = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var cacheIndex = {};
	var cache = [];

	function buildRandom ( length ){
		var _seed = seed.split('');
		var ret = '';
		while ( _seed.length + length > 62 ){
			ret += _seed.splice( Math.random() * _seed.length , 1);
		}
		return ret;
	}
	function build ( key ) {
		if ( cacheIndex[key] != undefined ) {
		    return cache[ cacheIndex[key] ];
		}
		var ret = buildRandom( Math.ceil( Math.random() * 62 ) );
		while ( cache.indexOf(ret) != -1){
			ret = buildRandom( Math.ceil( Math.random() * 62 ) );
		}
		cacheIndex [ key ] = cache.push( ret )-1;
		return ret ;
	}
	return build
})()
//C#有个很好的语言特性，就是它的 initialize 函数，允许对象构造的时候执行一个跟构造函数无关的初始化逻辑，
//这解决了很多问题，但是在其它语言中还没有见过……

//一般在数据库里唯一字段我们用AUTO_ID或者CRC32或者MD5
//AUTO_ID    10进制根据数据列长度，一般是初学者用，应为在高级应用里不灵活
//CRC32 16进制8位，很直观，但是重复几率要比 MD5高，
//MD5   16进制32位，不直观，太占数据库唯一字段，数据选择压力大。
//最近2天一直在研究如何PHP做一个既有MD5的唯一能力又减少位数用在数据库开发里
//想到压缩MD5为32进制8位，下面是函数，希望大家测试或者给点意见，或者有更灵活的方法
