
$.define("more/random", function(){
    var cs = "_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"; 
    var uuid_arr =  '0123456789ABCDEFG'.split('');
    $.log("已加载random模块");
    //http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
    //http://paulirish.com/2009/random-hex-color-code-snippets/
    return {
        hex:function(){
            return  '#'+('00000'+(Math.random()*0x1000000<<0).toString(16)).slice(-6);
        },
        hsb:function(){//颜色比效鲜艳
            return "hsb(" + Math.random()  + ", 1, 1)";
        },
        rgb:function(){
            return [Math.floor(Math.random() * 255),
            Math.floor(Math.random() * 255),
            Math.floor(Math.random() * 255)];
        },
        str:function(len,prefix) {
            if (!len) len = 10;
            var s = typeof prefix === "string" ? prefix : '';
            for (var i = 0; i < len; ++i) {
                var n = Math.random() * 1e6;
                s += cs.charAt(n % cs.length);
            }
            return s;
        },
        num:function (min,max) {
            return Math.floor(Math.random()*(max-min+1)) + min;
        },
        //https://github.com/louisremi/Math.uuid.js/blob/master/Math.uuid.js
        uuid:function(){
            var  uuid = [], r, i = 36;
            // rfc4122 requires these characters
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            // Fill in random data.  At i==19 set the high bits of clock sequence as
            // per rfc4122, sec. 4.1.5
            while (i--) {
                if (!uuid[i]) {
                    r = Math.random()*16|0;
                    uuid[i] = uuid_arr[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
            return uuid.join('');
        }
    }

});
