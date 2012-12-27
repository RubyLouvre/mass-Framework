
define("random", function(){
    var cs = "_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"; 
    // $.log("已加载random模块");
    // http://www.flickriver.com/groups/coresvivas/pool/random/
    //http://paulirish.com/2009/random-hex-color-code-snippets/
    //http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
    var rgb =  function () {
        return Math.floor(Math.random()*256)
    };
    return {
        hex: function(){
            return  '#'+('00000'+(Math.random()*0x1000000<<0).toString(16)).slice(-6);
        },
        hsb: function(){//颜色比效鲜艳
            return "hsb(" + Math.random()  + ", 1, 1)";
        },
        rgb: function(){
            return "rgb("+ [ rgb(), rgb(), rgb() ]+")";
        },
        vivid: function(ranges) {
            if (!ranges) {
                ranges = [
                [150,256],
                [0, 190],
                [0, 30]
                ];
            }
            var g = function() {
                //select random range and remove
                var range = ranges.splice(Math.floor(Math.random()*ranges.length), 1)[0];
                //pick a random number from within the range
                return Math.floor(Math.random() * (range[1] - range[0])) + range[0];
            }
            return "rgb(" + g() + "," + g() + "," + g() +")";
        },
        str: function(len,prefix) {
            if (!len) len = 10;
            var s = typeof prefix === "string" ? prefix : '';
            for (var i = 0; i < len; ++i) {
                var n = Math.random() * 1e6;
                s += cs.charAt(n % cs.length);
            }
            return s;
        },
        /*
        min 随机数的最小值， 整型， 输出的随机数必须大于等于该值
        max 随机数的最大值， 整型， 输出的随机数必须小于等于该值
        opt 随机数的区域权重权重，可有0个或多个，每一个权重对象结构为{form:xx, to:xx, value:xx}表示从
           from（大于等于）到to(小于)的范围内拥有权重value
        返回一个整型随机数
        关于权重：
            1每个权重对象表示在某个范围内随机数出现的权值
            2权重对象表示的范围不会重叠（调用者保证）
            3未指定权重的范围权值默认为1
         例如random(1, 100, { from:1, to: 50, value:4})表示输出一个1-100之间的随机数，其中随机数出现在1-50范围内的概率是50-100范围内的4倍
        random(1, 100, {from:1,to:50,value:4}, {from:70,to:80,value:2})
  */
        num: function (min,max,opts){
            //用于游戏掉装备，抽奖之类的场景，大奖只是给你看的，中奖只是给大多数人看的。 小将是人人都有机会的 场景...
            var span = max - min + 1,//默认跨度
            span2 = 0;
            if(opts) span2 =  (max.to - opts.from) * (opts.value - 1);//增加跨度
            var seed = Math.random() * (span + span2); //全跨度取种子
            if(seed < span) return Math.floor(seed) + min; //默认跨度内
            else return Math.floor((seed - span)/(opts.value - 1)) +  opts.from; //如果是在增加的跨度内
        }
    }

});
/*
utils.random = (function() {
    var seed = 49734321;
    return function() {
      // Robert Jenkins' 32 bit integer hash function.
      seed = ((seed + 0x7ed55d16) + (seed << 12))  & 0xffffffff;
      seed = ((seed ^ 0xc761c23c) ^ (seed >>> 19)) & 0xffffffff;
      seed = ((seed + 0x165667b1) + (seed << 5))   & 0xffffffff;
      seed = ((seed + 0xd3a2646c) ^ (seed << 9))   & 0xffffffff;
      seed = ((seed + 0xfd7046c5) + (seed << 3))   & 0xffffffff;
      seed = ((seed ^ 0xb55a4f09) ^ (seed >>> 16)) & 0xffffffff;
      return (seed & 0xfffffff) / 0x10000000;
    };
  })();
*/