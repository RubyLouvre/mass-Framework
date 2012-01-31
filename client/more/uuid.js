/**
 * UUID模块
 */
$.define("uuid", function () {
    var _time = new Date,
    getBits = function(val, start, end){ 
        val = val.toString(36).split('');
        start = start/4 | 0;
        end = end/4 | 0;
        for(var i = start; i <= end; i++) !val[i] && (val[i] = 0);
        return val.slice(start,end + 1).join(''); 
    },
    rand = function (max) {
        return Math.random() * (max + 1) | 0;
    },
    hnv1a = function (key) {
        key = key.replace(/./g, function (m) {
            return m.charCodeAt();
        }).split('');
        var p = 16777619, hash = 0x811C9DC5, l = key.length;
        for(var i=0; i< l; i++) {
            hash = (hash ^ key[i]) * p;
        }
        hash += hash << 13;
        hash ^= hash >> 7;
        hash += hash << 3;
        hash ^= hash >> 17;
        hash += hash << 5;
        hash = hash & 0x7FFFFFFF; //取正.
        hash = hash.toString(36)
        hash.length < 6 && (hash += (l % 36).toString(36))
        return  hash;         
                
    },
    info = [
    screen.width, 
    screen.height,
    navigator.plugins.length,
    navigator.javaEnabled(),
    screen.colorDepth,
    location.href,
    navigator.userAgent
    ].join('');
                
    return function () {
        var s = new Date,
        t = (+s +  0x92f3973c00).toString(36),
        m = getBits(rand(0xfff),0,7)+
        getBits(rand(0x1fff),0,7)+
        getBits(rand(0x1fff),0,8),
        c = Math.random() * (251) + 50 | 0,// random from 50 - 300
        a = [];
        t.length < 9 && (t += (s % 36).toString(36));
        for (; c--;){//借助不定次数,多次随机，打散客户端，因软硬环境类似，导致产生随机种子的线性规律性，以及重复性.
            a.push(Math.random());
        }

                    
        return  hnv1a(info) + //增加物理维度分流.
        hnv1a([//增加用户随机性分流.
            document.documentElement.offsetWidth, document.documentElement.offsetHeight,                       , 
            history.length, 
            new Date - _time
            ].join('')) +
        t +
        m + 
        hnv1a(a.slice(0, 10).join(''))+
        hnv1a(a.slice(c - 9).join(''));
               
    };
});

 /**
 因为 数据告诉我 相同url 中，同一客户端时间，产生相同字符串的可能性很高
不同cookie 和ip 最高的 居然有6个
其中5个 具备相同的客户端环境ie6, .netframework ,  xp 
如果一个机器的软硬件环境 无限接近的话， 理论上同一物理时间 ，产生的为随机种子 是一样的
然后浏览器 产生随机数的算法 又是相同的，就导致 会产生 相同随机数 
                                                            ——教主
 */
