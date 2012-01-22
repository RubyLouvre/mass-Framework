$.define("cookie",function(){
    return {
        /**
         * 获取 cookie 值
         * @return {string} 如果 name 不存在，返回 undefined
         */
        get: function(name) {
            var ret, m;
            if (isNotEmptyString(name)) {
                if ((m = String(document.cookie).match(
                    new RegExp('(?:^| )' + name + '(?:(?:=([^;]*))|;|$)')))) {
                    ret = m[1] ? decode(m[1]) : '';
                }
            }
            return ret;
        },

        set: function(name, val, opts) {
            opts = opts || {};
            var text = String(encodeURIComponent(val))
            for(var i in opts){
                switch(i){
                    case "expires":
                        // 从当前时间开始，多少天后过期
                        var date = opts[i];
                        if (typeof date === 'number') {
                            date = new Date();
                            date.setTime(date.now + opts.expires * 24 * 60 * 60 * 1000);
                        }
                        // expiration date
                        if (date instanceof Date) {
                            text += '; expires=' + date.toUTCString();
                        }
                        break;
                    case "secure":
                        text += '; secure';
                        break;
                    default :
                        text += '; '+i+'=' + opts[i];    
                }
            }
            document.cookie = name + '=' + text;
        },

        remove: function(name, opt) {
            // 置空，并立刻过期
            this.set(name, '', opt);
        }
    }
});