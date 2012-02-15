//=========================================
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
