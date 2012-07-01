
function contains(target, it) {
    return target.indexOf(it) != -1; //indexOf改成search，lastIndexOf也行得通
};

function contains(target, str, separator){
    return separator ?
    (separator + target + separator).indexOf(separator + str + separator) > -1 :
    target.indexOf(str) > -1;
}

//最后一参数是忽略大小写
function startsWith(target, str, ignorecase) {
    var start_str = target.substr(0, str.length);
    return ignorecase ? start_str.toLowerCase() === str.toLowerCase() :
    start_str === str;
}

//最后一参数是忽略大小写
function endsWith(target, str, ignorecase) {
    var end_str = target.substring(target.length - str.length);
    return ignorecase ? end_str.toLowerCase() === str.toLowerCase() :
    end_str === str;
}

function repeat(target, n) {
    return (new Array(n+1)).join(target);
}

function repeat(target, n) {
    return Array.prototype.join.call({
        length:n+1
    }, target);
}

var repeat = (function() {
    var join = Array.prototype.join, obj = { };
    return function(target, n) {
        obj.length = n + 1;
        return join.call(obj, target);
    }
})();


function repeat(target,n) {
    var s = target, total = [];
    while(n > 0) {
        if (n % 2 == 1) total[total.length] = s;//如果是奇数
        if (n == 1) break;
        s += s;
        n = n>>1;//相当于将n除以2取其商,或说开2二次方
    }
    return total.join('');
}

function repeat(target,n) {
    var s = target,c = s.length * n
    do {
        s += s;
    } while (n = n>>1);
    s = s.substring(0, c);
    return s;
}

function repeat(target,n) {
    var s = target, total = "";
    while(n > 0) {
        if (n % 2 == 1) total += s;
        if (n == 1) break;
        s += s;
        n = n>>1;
    }
    return total;
}

function repeat(target,n) {
    if( n == 1 ) {
        return target;
    }
    var s= repeat(target,Math.floor(n/2));
    s+= s;
    if ( n % 2 ) {
        s+= target;
    }
    return s;
}
function repeat(target,n){
    return (n <= 0)? "": target.concat( repeat(target,--n) );
}

function byteLen (target){
    var byteLength = target.length, i = 0;
    for (; i < target.length; i++){
        if (target.charCodeAt(i) > 255) {
            byteLength++;
        }
    }
    return byteLength;
}

function byteLen(target){
    return target.replace(/[^\x00-\xff]/g,"--").length;
}

function truncate(target, length, truncation) {
    length = length || 30;
    truncation = truncation === void(0) ? '...' : truncation;
    return target.length > length ?
    target.slice(0, length - truncation.length) + truncation : String(target);
}

function camelize(target){
    if (target.indexOf('-') < 0 && target.indexOf('_') < 0) {
        return target;//提前判断，提高getStyle等的效率
    }
    return target.replace(/[-_][^-_]/g, function (match) {
        return match.charAt(1).toUpperCase();
    });
}

function underscored(target) {
    return target.replace(/([a-z\d])([A-Z])/g, '$1_$2').
    replace(/\-/g, '_').toLowerCase();
}

function dasherize(target) {
    return underscored(target).replace(/_/g, '-');
}

function capitalize(target){
    return target.charAt(0).toUpperCase() + target.substring(1).toLowerCase();
}





















