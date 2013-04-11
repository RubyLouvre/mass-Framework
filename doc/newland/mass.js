(function() {
    //后端部分　2012.7.11 by 司徒正美
    function $() {
    }
    var class2type = {//类型映射
        "[object global]": "Global",
        "null": "Null",
        "NaN": "NaN",
        "undefined": "Undefined"
    };
    var rparams = /[^\(]*\(([^\)]*)\)[\d\D]*/;//用于取得函数的参数列表
    var uuid = 1;
    var toString = Object.prototype.toString;
    var util = require("util");
    //为[[class]] --> type 映射对象添加更多成员,用于$.type函数
    "Boolean,Number,String,Function,Array,Date,RegExp,Arguments".replace(/\w+/g, function(name) {
        class2type[ "[object " + name + "]" ] = name;
    });
    //将一个或多个对象合并到第一个参数（它也必须是对象）中，
    //如果只有一个参数，则合并到mix的调用者上，如果最后一个参数是布尔，则用于判定是否覆盖已有属性
    function mix(receiver, supplier) {
        var args = [].slice.call(arguments), i = 1, key, //如果最后参数是布尔，判定是否覆写同名属性
                ride = typeof args[args.length - 1] == "boolean" ? args.pop() : true;
        if (args.length === 1) {//处理$.mix(hash)的情形
            receiver = !this.window ? this : {};
            i = 0;
        }
        while ((supplier = args[i++])) {
            for (key in supplier) {//允许对象糅杂，用户保证都是对象
                if (supplier.hasOwnProperty(key) && (ride || !(key in receiver))) {
                    receiver[ key ] = supplier[ key ];
                }
            }
        }
        return receiver;
    }
    ;
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    function alias(deps, array, el) {
        if (typeof deps === "string") {
            array = deps.match($.rword);
        } else if (Array.isArray(deps)) {
            array = deps;
        } else {
            throw "arguments error"
        }
        for (var i = 0, n = array.length; i < n; i++) {
            el = array[ i ];
            if ($.config.alias[ el ]) {
                array[ i ] = $.config.alias[ el ];
            }
        }
        return array;
    }
    mix($, {//为此版本的命名空间对象添加成员
        rword: /[^, ]+/g,
        mix: mix,
        isWindows: process.platform === 'win32', //判定当前平台是否为window
        //将类数组对象转换成真正的数组，并进行切片操作(如果第二第三参数存在的情况下)
        slice: function(nodes, start, end) {
            return Array.prototype.slice.call(nodes, start, end);
        },
        getUid: function(node) {
            return node.uniqueNumber || (node.uniqueNumber = uuid++);
        },
        // 创建一个对象，其键值都为1(如果没有指定)或第二个参数，用于用于高速化判定
        oneObject: function(array, val) {
            if (typeof array === "string") {
                array = array.match($.rword) || [];
            }
            var result = {}, value = val !== void 0 ? val : 1;
            for (var i = 0, n = array.length; i < n; i++) {
                result[ array[i] ] = value;
            }
            return result;
        },
        // 用于取得数据的类型（一个参数的情况下）或判定数据的类型（两个参数的情况下）
        type: function(obj, str) {
            var result = class2type[ (obj == null || obj !== obj) ? obj : toString.call(obj) ] || "#";
            if (result.charAt(0) === "#") {
                if (Buffer.isBuffer(obj)) {
                    result = 'Buffer'; //返回构造器名字
                } else {
                    result = toString.call(obj).slice(8, -1);
                }
            }
            if (str) {
                return str === result;
            }
            return result;
        },
        path: require("path"), //将原生path模块劫持到命名空间中

        noop: function() {
        },
        logger: {//这是一个空接口
            write: function() {
            }
        },
        // $.log(str, [], color, timestamp, level )
        log: function(str) {
            var level = 9, orig = str, show = true, timestamp = false;
            if (arguments.length === 1) {
                $.logger.write(9, util.inspect(orig));
                return console.log(orig);
            }
            for (var i = 1; i < arguments.length; i++) {
                var el = arguments[i];
                if (Array.isArray(el)) {
                    el.unshift(str);
                    str = util.format.apply(0, el);
                } else if (typeof el === "string") {
                    if (styles[el]) {
                        str = '\u001b[' + styles[el][0] + 'm' + str + '\u001b[' + styles[el][1] + 'm';
                        //是否在前面加上时间戮
                    } else if (el === "timestamp") {
                        timestamp = true;
                    }
                } else if (typeof el === "number") {
                    show = el <= $.config.level;
                    level = el;
                }
            }
            $.logger.write(level, util.inspect(orig));
            if (show) {
                if (timestamp) {
                    str = $.timestamp() + "  " + str;
                }
                console.log(str);
            }
        },
        timestamp: function() {
            var d = new Date();
            var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
            return [d.getFullYear(), pad(d.getMonth()), d.getDate(), time].join(' ');
        },
        define: function(id, deps, factory) {
            var caller = arguments.callee.caller, array = [], callback, ret;
            var args = caller.arguments;//取得当前模块的参数列表,依次为exports, require, module, __filename,__dirname
            var common = {
                exports: args[0],
                require: args[1],
                module: args[2]
            };
            //一个参数时Object或Function任选其一 ，两个是ID+回调或依赖+回调，三个是ID+依赖+回调
            if (arguments.length === 1 && toString.call(deps) === "[object Object]") {
                ret = deps;//如果是对象,那么它就是exports
            } else {
                var list = Array.apply([], arguments);//将参数列表转换为一个数组
                if (typeof list[0] === "string") {
                    list.shift();// 去掉模块ID
                }
                if (Array.isArray(list[0])) {
                    array = list.shift();//去掉依赖列表
                }
                if (typeof list[0] === "function") {
                    callback = list[0];
                } else {
                    throw "参数错误"
                }
            }
            if (array.length) {//如果存在依赖关系,先加载依赖关系
                array = alias(array).map(function(url) {
                    return  args[1](url);//require某个模块
                });
            }
            if (callback) {
                var match = callback.toString().replace(rparams, "$1") || [];
                var a = common[match[0]];
                var b = common[match[1]];
                var c = common[match[2]];
                if (a && b && a != b && b != c) {//exports, require, module的位置随便
                    ret = callback.apply(0, [a, b, c]);
                } else {
                    ret = callback.apply(0, array);
                }
            }
            if (typeof ret !== "undefined") {
                args[2].exports = ret;
            }
            return args[2].exports;
        },
        config: function(settings) {
            var kernel = $.config;
            for (var p in settings) {
                if (!settings.hasOwnProperty(p))
                    continue
                var prev = kernel[ p ];
                var curr = settings[ p ];
                if (prev && p === 'alias') {
                    for (var c in curr) {
                        if (curr.hasOwnProperty(c)) {
                            var prevValue = prev[ c ];
                            var currValue = curr[ c ];
                            if (prevValue && prev !== curr) {
                                throw c + "不能重命名"
                            }
                            prev[ c ] = currValue;
                        }
                    }
                } else {
                    kernel[ p ] = curr;
                }
            }
            return this;
        }
    });
    $.mix($.config, {
        services: [],
        alias: {
            mass: "mass"
        },
        base: process.cwd() + "/",
        charset: "utf-8",
        debug: true,
        //level 越小,显示的日志越少,它们就越重要,但都打印在文本上
        level: 9
    });
    $.parseQuery = require("querystring").parse;
    var _join = $.path.join;
    //mac下的路径为     app/controllers/doc_controller.js
    //window下的路径为  app\\controllers\\doc_controller.js
    //统一一下风格
    $.path.join = function() {
        var ret = _join.apply(0, arguments)
        return  ret.replace(/\\/g, "/")
    }
    //console.log($.config.alias.lang)
    $.parseUrl = require("url").parse; //将原生URL模块的parse劫持下来
    $.error = util.error;
    $.debug = util.debug;

    //用于实现漂亮的五颜六色的日志打印
    var styles = {
        bold: [1, 22],
        italic: [3, 23],
        underline: [4, 24],
        inverse: [7, 27],
        strike: [9, 29]
    };
    String("red31green32yellow33blue34magenta35cyan36gray37").replace(/([a-z]+)(\d+)/g, function(a, b, c) {
        c = Number(c);
        styles["l" + b] = [c, 39];//暗淡的字体颜色
        styles[ b ] = [c + 60, 39];//明亮的字体颜色
        styles["bg_l" + b] = [c + 10, ''];//暗淡的背景颜色
        styles["bg_" + b] = [c + 70, ''];//明亮的背景颜色
    });
    styles.black = [30, 39];//没有黑色背景,因为默认是黑的
    styles.gray = [90, 39];
    styles.white = [97, 39];
    styles.bg_gray = [100, ''];
    styles.bg_white = [107, ''];
    for (var color in styles) {
        if (color.indexOf("magenta") != -1) {
            styles[ color.replace("magenta", "purple") ] = styles[color];
        }
    }
    //暴露到全局作用域下,所有模块可见!!
    global.define = $.define;
    global.require = function(deps, callback) {
        deps = alias(deps);
        console.log(deps)
        if (deps.length === 1 && !callback) {
            return require(deps[0]);
        }
        var array = [];
        for (var i = 0, el; el = deps[i++]; ) {
            console.log(el);
            if (el === "mass") {
                array.push($);
            } else {
                array.push(require(el));
            }

        }
        if (typeof callback === "function") {
            callback.apply(0, array);
        }
        return array;
    }
    exports.$ = global.$ = $;
})()