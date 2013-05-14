void function(global, DOC) {
    var $$ = global.$; //保存已有同名变量
    var rmakeid = /(#.+|\W)/g; //用于处理掉href中的hash与所有特殊符号，生成长命名空间
    var NsKey = DOC.URL.replace(rmakeid, ""); //长命名空间（字符串）
    var NsVal = global[NsKey]; //长命名空间（mass对象）
    var W3C = DOC.dispatchEvent; //IE9开始支持W3C的事件模型与getComputedStyle取样式值
    var html = DOC.documentElement; //HTML元素
    var head = DOC.head || DOC.getElementsByTagName("head")[0]; //HEAD元素
    var loadings = []; //正在加载中的模块列表
    var factorys = []; //储存需要绑定ID与factory对应关系的模块（标准浏览器下，先parse的script节点会先onload）
    var mass = 1; //当前框架的版本号
    var postfix = ""; //用于强制别名
    var all = "mass,lang,class,flow,data,support,query,node,attr,css,event,ajax,fx";
    var moduleClass = "mass" + (new Date - 0);
    var hasOwn = Object.prototype.hasOwnProperty;
    var class2type = {
        "[object HTMLDocument]": "Document",
        "[object HTMLCollection]": "NodeList",
        "[object StaticNodeList]": "NodeList",
        "[object DOMWindow]": "Window",
        "[object global]": "Window",
        "null": "Null",
        "NaN": "NaN",
        "undefined": "Undefined"
    };
    var serialize = class2type.toString,
            basepath, kernel;
    /**
     * 命名空间
     * @namespace 可变的短命名空间
     * @param  {String|Function} expr  CSS表达式或函数
     * @param  {Node|NodeList|Array|Mass} context ？ 上下文对象
     * @return {Mass}
     */
    function $(expr, context) { //新版本的基石
        if (typeof expr === "function" && expr.call) { //注意在safari下,typeof nodeList的类型为function,因此必须使用$.type
            return $.require(all + ",ready", expr);
        }
        if (!$.fn)
            $.error("必须加载node模块");
        return new $.fn.init(expr, context);
    }
    //多版本共存
    if (typeof NsVal !== "function") {
        NsVal = $; //公用命名空间对象
        NsVal.uuid = 1;
    }
    if (NsVal.mass !== mass) {
        NsVal[mass] = $; //保存当前版本的命名空间对象到公用命名空间对象上
        if (NsVal.mass || ($$ && $$.mass == null)) {
            postfix = (mass + "").replace(/\D/g, ""); //是否强制使用多库共存
        }
    } else {
        return;
    }
    /**
     * 糅杂，为一个对象添加更多成员
     * @param {Object} receiver 接受者
     * @param {Object} supplier 提供者
     * @return  {Object} 目标对象
     * @api public
     */

    function mix(receiver, supplier) {
        var args = [].slice.call(arguments),
                i = 1,
                key, //如果最后参数是布尔，判定是否覆写同名属性
                ride = typeof args[args.length - 1] === "boolean" ? args.pop() : true;
        if (args.length === 1) { //处理$.mix(hash)的情形
            receiver = !this.window ? this : {};
            i = 0;
        }
        while ((supplier = args[i++])) {
            for (key in supplier) { //允许对象糅杂，用户保证都是对象
                if (hasOwn.call(supplier, key) && (ride || !(key in receiver))) {
                    receiver[key] = supplier[key];
                }
            }
        }
        return receiver;
    }
    //为此版本的命名空间对象添加成员
    mix($, {
        html: html,
        head: head,
        mix: mix,
        rword: /[^, ]+/g,
        rmapper: /(\w+)_(\w+)/g,
        mass: mass,
        hasOwn: function(obj, key) {
            return hasOwn.call(obj, key);
        },
        //大家都爱用类库的名字储存版本号，我也跟风了
        "@bind": W3C ? "addEventListener" : "attachEvent",
        /**
         * 数组化
         * @param {ArrayLike} nodes 要处理的类数组对象
         * @param {Number} start 可选。要抽取的片断的起始下标。如果是负数，从后面取起
         * @param {Number} end  可选。规定从何处结束选取
         * @return {Array}
         * @api public
         */
        slice: W3C ? function(nodes, start, end) {
            return factorys.slice.call(nodes, start, end);
        } : function(nodes, start, end) {
            var ret = [],
                    n = nodes.length;
            if (end === void 0 || typeof end === "number" && isFinite(end)) {
                start = parseInt(start, 10) || 0;
                end = end == void 0 ? n : parseInt(end, 10);
                if (start < 0) {
                    start += n;
                }
                if (end > n) {
                    end = n;
                }
                if (end < 0) {
                    end += n;
                }
                for (var i = start; i < end; ++i) {
                    ret[i - start] = nodes[i];
                }
            }
            return ret;
        },
        /**
         * 用于建立一个从元素到数据的关联，应用于事件绑定，元素去重
         * @param {Any} obj
         * @return {Number} 一个UUID
         */
        getUid: W3C ? function(obj) { //IE9+,标准浏览器
            return obj.uniqueNumber || (obj.uniqueNumber = NsVal.uuid++);
        } : function(obj) {
            if (obj.nodeType !== 1) { //如果是普通对象，文档对象，window对象
                return obj.uniqueNumber || (obj.uniqueNumber = NsVal.uuid++);
            } //注：旧式IE的XML元素不能通过el.xxx = yyy 设置自定义属性
            var uid = obj.getAttribute("uniqueNumber");
            if (!uid) {
                uid = NsVal.uuid++;
                obj.setAttribute("uniqueNumber", uid);
            }
            return +uid; //确保返回数字
        },
        /**
         * 绑定事件(简化版)
         * @param {Node|Document|window} el 触发者
         * @param {String} type 事件类型
         * @param {Function} fn 回调
         * @param {Boolean} phase ? 是否捕获，默认false
         * @return {Function} fn 刚才绑定的回调
         */
        bind: W3C ? function(el, type, fn, phase) {
            el.addEventListener(type, fn, !!phase);
            return fn;
        } : function(el, type, fn) {
            el.attachEvent && el.attachEvent("on" + type, fn);
            return fn;
        },
        /**
         * 卸载事件(简化版)
         * @param {Node|Document|window} el 触发者
         * @param {String} type 事件类型
         * @param {Function} fn 回调
         * @param {Boolean} phase ? 是否捕获，默认false
         */
        unbind: W3C ? function(el, type, fn, phase) {
            el.removeEventListener(type, fn || $.noop, !!phase);
        } : function(el, type, fn) {
            if (el.detachEvent) {
                el.detachEvent("on" + type, fn || $.noop);
            }
        },
        /**
         * 用于取得数据的类型（一个参数的情况下）或判定数据的类型（两个参数的情况下）
         * @param {Any} obj 要检测的东西
         * @param {String} str ? 要比较的类型
         * @return {String|Boolean}
         * @api public
         */
        type: function(obj, str) {
            var result = class2type[(obj == null || obj !== obj) ? obj : serialize.call(obj)] || obj.nodeName || "#";
            if (result.charAt(0) === "#") { //兼容旧式浏览器与处理个别情况,如window.opera
                //利用IE678 window == document为true,document == window竟然为false的神奇特性
                if (obj == obj.document && obj.document != obj) {
                    result = "Window"; //返回构造器名字
                } else if (obj.nodeType === 9) {
                    result = "Document"; //返回构造器名字
                } else if (obj.callee) {
                    result = "Arguments"; //返回构造器名字
                } else if (isFinite(obj.length) && obj.item) {
                    result = "NodeList"; //处理节点集合
                } else {
                    result = serialize.call(obj).slice(8, -1);
                }
            }
            if (str) {
                return str === result;
            }
            return result;
        },
        /**
         *  将调试信息打印到控制台或页面
         *  $.log(str, page, level )
         *  @param {Any} str 用于打印的信息，不是字符串将转换为字符串
         *  @param {Boolean} page ? 是否打印到页面
         *  @param {Number} level ? 通过它来过滤显示到控制台的日志数量。
         *          0为最少，只显示最致命的错误；7，则连普通的调试消息也打印出来。
         *          显示算法为 level <= $.config.level。
         *          这个$.config.level默认为9。下面是level各代表的含义。
         *          0 EMERGENCY 致命错误,框架崩溃
         *          1 ALERT 需要立即采取措施进行修复
         *          2 CRITICAL 危急错误
         *          3 ERROR 异常
         *          4 WARNING 警告
         *          5 NOTICE 通知用户已经进行到方法
         *          6 INFO 更一般化的通知
         *          7 DEBUG 调试消息
         *  @return {String}
         *  @api public
         */
        log: function(str, page, level) {
            for (var i = 1, show = true; i < arguments.length; i++) {
                level = arguments[i];
                if (typeof level === "number") {
                    show = level <= $.config.level;
                } else if (level === true) {
                    page = true;
                }
            }
            if (show) {
                if (page === true) {
                    $.require("ready", function() {
                        var div = DOC.createElement("pre");
                        div.className = "mass_sys_log";
                        div.innerHTML = str + ""; //确保为字符串
                        DOC.body.appendChild(div);
                    });
                } else if (window.opera) {
                    opera.postError(str)
                    //http://www.cnblogs.com/zoho/archive/2013/01/31/2886651.html
                    //http://www.dotblogs.com.tw/littlebtc/archive/2009/04/06/ie8-ajax-2-debug.aspx
                } else if (global.console && console.info && console.log) {
                    console.log(str);
                }

            }
            return str;
        },
        /**
         * 生成键值统一的对象，用于高速化判定
         * @param {Array|String} array 如果是字符串，请用","或空格分开
         * @param {Number} val ? 默认为1
         * @return {Object}
         */
        oneObject: function(array, val) {
            if (typeof array === "string") {
                array = array.match($.rword) || [];
            }
            var result = {},
                    value = val !== void 0 ? val : 1;
            for (var i = 0, n = array.length; i < n; i++) {
                result[array[i]] = value;
            }
            return result;
        },
        /**
         * 配置框架
         * @param  {Object} settings 配置对象
         * @return {Mass}
         */
        config: function(settings) {
            for (var p in settings) {
                if (!hasOwn.call(settings, p))
                    continue;
                var val = settings[p];
                if (typeof kernel.plugin[p] === "function") {
                    kernel.plugin[p](val);
                } else {
                    kernel[p] = val;
                }
            }
            return this;
        },
        /**
         * 将内部对象挂到window下，此时可重命名，实现多库共存
         * @param {String} name
         * @return {Mass}
         * @api public
         */
        exports: function(name) {
            global.$ = $$; //多库共存 2012.2.1之前为$$ &&(global.$ = $$)
            name = name || $.config.nick; //取得当前简短的命名空间
            $.config.nick = name;
            global[NsKey] = NsVal;
            return global[name] = this;
        },
        //一个空函数
        noop: function() {
        },
        /**
         * 抛出错误,方便调试
         * @param {String} str
         * @param {Error}  e ? 具体的错误对象构造器
         * EvalError: 错误发生在eval()中
         * SyntaxError: 语法错误,错误发生在eval()中,因为其它点发生SyntaxError会无法通过解释器
         * RangeError: 数值超出范围
         * ReferenceError: 引用不可用
         * TypeError: 变量类型不是预期的
         * URIError: 错误发生在encodeURI()或decodeURI()中
         */
        error: function(str, e) {
            throw new (e || Error)(str);
        }
    });
    (function() {
        var cur = getCurrentScript(true);
        if (!cur) {//处理window safari的Error没有stack的问题
            cur = $.slice(document.scripts).pop().src;
        }
        var url = cur.replace(/[?#].*/, "");
        kernel = $.config;
        kernel.plugin = {};
        kernel.alias = {};
        basepath = kernel.base = url.slice(0, url.lastIndexOf("/") + 1);
        var scripts = DOC.getElementsByTagName("script");
        for (var i = 0, el; el = scripts[i++]; ) {
            if (el.src === cur) {
                kernel.nick = el.getAttribute("nick") || "$";
                break;
            }
        }
        kernel.level = 9;
    })();

    kernel.plugin["alias"] = function(val) {
        var map = kernel.alias;
        for (var c in val) {
            if (hasOwn.call(val, c)) {
                var prevValue = map[c];
                var currValue = val[c];
                if (prevValue) {
                    $.error("注意" + c + "出经重写过");
                }
                map[c] = currValue;
            }
        }
    };

    "Boolean,Number,String,Function,Array,Date,RegExp,Window,Document,Arguments,NodeList".replace($.rword, function(name) {
        class2type["[object " + name + "]"] = name;
    });
    //============================加载系统===========================
    var modules = $.modules = {
        ready: {
            exports: $
        },
        mass: {
            state: 2,
            exports: $
        }
    };

    function getCurrentScript(base) {
        // 参考 https://github.com/samyk/jiagra/blob/master/jiagra.js
        var stack;
        try {
            a.b.c(); //强制报错,以便捕获e.stack
        } catch (e) { //safari的错误对象只有line,sourceId,sourceURL
            stack = e.stack;
            if (!stack && window.opera) {
                //opera 9没有e.stack,但有e.Backtrace,但不能直接取得,需要对e对象转字符串进行抽取
                stack = (String(e).match(/of linked script \S+/g) || []).join(" ");
            }
        }
        if (stack) {
            /**e.stack最后一行在所有支持的浏览器大致如下:
             *chrome23:
             * at http://113.93.50.63/data.js:4:1
             *firefox17:
             *@http://113.93.50.63/query.js:4
             *opera12:http://www.oldapps.com/opera.php?system=Windows_XP
             *@http://113.93.50.63/data.js:4
             *IE10:
             *  at Global code (http://113.93.50.63/data.js:4:1)
             *  //firefox4+ 可以用document.currentScript
             */
            stack = stack.split(/[@ ]/g).pop(); //取得最后一行,最后一个空格或@之后的部分
            stack = stack[0] === "(" ? stack.slice(1, -1) : stack.replace(/\s/, ""); //去掉换行符
            return stack.replace(/(:\d+)?:\d+$/i, ""); //去掉行号与或许存在的出错字符起始位置
        }
        var nodes = (base ? document : head).getElementsByTagName("script"); //只在head标签中寻找
        for (var i = nodes.length, node; node = nodes[--i]; ) {
            if ((base || node.className === moduleClass) && node.readyState === "interactive") {
                return node.className = node.src;
            }
        }
    }

    function checkCycle(deps, nick) {
        //检测是否存在循环依赖
        for (var id in deps) {
            if (deps[id] === "司徒正美" && modules[id].state !== 2 && (id === nick || checkCycle(modules[id].deps, nick))) {
                return true;
            }
        }
    }

    function checkDeps() {
        //检测此JS模块的依赖是否都已安装完毕,是则安装自身
        loop: for (var i = loadings.length, id; id = loadings[--i]; ) {
            var obj = modules[id],
                    deps = obj.deps;
            for (var key in deps) {
                if (hasOwn.call(deps, key) && modules[key].state !== 2) {
                    continue loop;
                }
            }
            //如果deps是空对象或者其依赖的模块的状态都是2
            if (obj.state !== 2) {
                loadings.splice(i, 1); //必须先移除再安装，防止在IE下DOM树建完后手动刷新页面，会多次执行它
                fireFactory(obj.id, obj.args, obj.factory);
                checkDeps();//如果成功,则再执行一次,以防有些模块就差本模块没有安装好
            }
        }
    }

    function checkFail(node, onError, fuckIE) {
        var id = node.src;//检测是否死链
        node.onload = node.onreadystatechange = node.onerror = null;
        if (onError || (fuckIE && !modules[id].state)) {
            setTimeout(function() {
                head.removeChild(node);
            });
            $.log("加载 " + id + " 失败" + onError + " " + (!modules[id].state), 7);
        } else {
            return true;
        }
    }

    function loadJSCSS(url, parent, ret, shim) {
        //1. 特别处理mass|ready标识符
        if (/^(mass|ready)$/.test(url)) {
            return url;
        }
        //2. 转化为完整路径
        if ($.config.alias[url]) {//别名机制
            ret = $.config.alias[url];
            if (typeof ret === "object") {
                shim = ret;
                ret = ret.src;
            }
        } else {
            if (/^(\w+)(\d)?:.*/.test(url)) { //如果本来就是完整路径
                ret = url;
            } else {
                parent = parent.substr(0, parent.lastIndexOf('/'));
                var tmp = url.charAt(0);
                if (tmp !== "." && tmp !== "/") { //相对于根路径
                    ret = basepath + url;
                } else if (url.slice(0, 2) === "./") { //相对于兄弟路径
                    ret = parent + url.slice(1);
                } else if (url.slice(0, 2) === "..") { //相对于父路径
                    var arr = parent.replace(/\/$/, "").split("/");
                    tmp = url.replace(/\.\.\//g, function() {
                        arr.pop();
                        return "";
                    });
                    ret = arr.join("/") + "/" + tmp;
                } else if (tmp === "/") {
                    ret = parent + url;//相对于兄弟路径
                } else {
                    $.error("不符合模块标识规则: " + url);
                }
            }
        }
        var src = ret.replace(/[?#].*/, ""),
                ext;
        if (/\.(css|js)$/.test(src)) { // 处理"http://113.93.55.202/mass.draggable"的情况
            ext = RegExp.$1;
        }
        if (!ext) { //如果没有后缀名,加上后缀名
            src += ".js";
            ext = "js";
        }
        //3. 开始加载JS或CSS
        if (ext === "js") {
            if (!modules[src]) { //如果之前没有加载过
                modules[src] = {
                    id: src,
                    parent: parent,
                    exports: {}
                };
                if (shim) {//shim机制
                    require(shim.deps || "", function() {
                        loadJS(src, function() {
                            modules[src].state = 2;
                            modules[src].exports = typeof shim.exports === "function" ?
                                    shim.exports() : window[shim.exports];
                            checkDeps();
                        });
                    });
                } else {
                    loadJS(src);
                }
            }
            return src;
        } else {
            loadCSS(src);
        }
    }

    function loadJS(url, callback) {
        //通过script节点加载目标模块
        var node = DOC.createElement("script");
        node.className = moduleClass; //让getCurrentScript只处理类名为moduleClass的script节点
        node[W3C ? "onload" : "onreadystatechange"] = function() {
            if (W3C || /loaded|complete/i.test(node.readyState)) {
                //mass Framework会在_checkFail把它上面的回调清掉，尽可能释放回存，尽管DOM0事件写法在IE6下GC无望
                var factory = factorys.pop();
                factory && factory.delay(node.src);
                if (callback) {
                    callback();
                }
                if (checkFail(node, false, !W3C)) {
                    $.log("已成功加载 " + node.src, 7);
                }
            }
        };
        node.onerror = function() {
            checkFail(node, true);
        };
        node.src = url; //插入到head的第一个节点前，防止IE6下head标签没闭合前使用appendChild抛错
        head.insertBefore(node, head.firstChild); //chrome下第二个参数不能为null
        $.log("正准备加载 " + node.src, 7); //更重要的是IE6下可以收窄getCurrentScript的寻找范围
    }

    function loadCSS(url) {
        //通过link节点加载模块需要的CSS文件
        var id = url.replace(rmakeid, "");
        if (!DOC.getElementById(id)) {
            var node = DOC.createElement("link");
            node.rel = "stylesheet";
            node.href = url;
            node.id = id;
            head.insertBefore(node, head.firstChild);
        }
    }
    /**
     * 请求模块
     * @param {String|Array} list 依赖列表
     * @param {Function} factory 模块工厂
     * @param {String} parent ? 父路径，没有使用种子模块的根路径或配置项
     * @api public
     */
    window.require = $.require = function(list, factory, parent) {
        // 用于检测它的依赖是否都为2
        var deps = {},
                // 用于保存依赖模块的返回值
                args = [],
                // 需要安装的模块数
                dn = 0,
                // 已安装完的模块数
                cn = 0,
                id = parent || "callback" + setTimeout("1");
        parent = parent || basepath;
        String(list).replace($.rword, function(el) {
            var url = loadJSCSS(el, parent)
            if (url) {
                dn++;
                if (modules[url] && modules[url].state === 2) {
                    cn++;
                }
                if (!deps[url]) {
                    args.push(url);
                    deps[url] = "司徒正美"; //去重
                }
            }
        });
        modules[id] = {//创建一个对象,记录模块的加载情况与其他信息
            id: id,
            factory: factory,
            deps: deps,
            args: args,
            state: 1
        };
        if (dn === cn) { //如果需要安装的等于已安装好的
            fireFactory(id, args, factory); //安装到框架中
        } else {
            //放到检测列队中,等待checkDeps处理
            loadings.unshift(id);
        }
        checkDeps();
    };
    require.config = kernel;

    /**
     * 定义模块
     * @param {String} id ? 模块ID
     * @param {Array} deps ? 依赖列表
     * @param {Function} factory 模块工厂
     * @api public
     */
    window.define = $.define = function(id, deps, factory) { //模块名,依赖列表,模块本身
        var args = $.slice(arguments);
        if (typeof id === "string") {
            var _id = args.shift();
        }
        if (typeof args[0] === "boolean") { //用于文件合并, 在标准浏览器中跳过补丁模块
            if (args[0]) {
                return;
            }
            args.shift();
        }
        if (typeof args[0] === "function") {
            args.unshift([]);
        } //上线合并后能直接得到模块ID,否则寻找当前正在解析中的script节点的src作为模块ID
        //现在除了safari外，我们都能直接通过getCurrentScript一步到位得到当前执行的script节点，
        //safari可通过onload+delay闭包组合解决
        id = modules[id] && modules[id].state >= 1 ? _id : getCurrentScript();
        factory = args[1];
        factory.id = _id; //用于调试
        factory.delay = function(id) {
            args.push(id);
            var isCycle = true;
            try {
               isCycle = checkCycle(modules[id].deps, id);
            } catch (e) {
            }
            if (isCycle) {
                $.error(id + "模块与之前的某些模块存在循环依赖");
            }
            delete factory.delay; //释放内存
            require.apply(null, args); //0,1,2 --> 1,2,0
        };
        if (id) {
            factory.delay(id, args);
        } else { //先进先出
            factorys.push(factory);
        }
    };
    $.define.amd = modules;
    /**
     * 请求模块从modules对象取得依赖列表中的各模块的返回值，执行factory, 完成模块的安装
     * @param {String} id  模块ID
     * @param {Array} deps 依赖列表
     * @param {Function} factory 模块工厂
     * @api private
     */

    function fireFactory(id, deps, factory) {
        for (var i = 0, array = [], d; d = deps[i++]; ) {
            array.push(modules[d].exports);
        }
        var module = Object(modules[id]),
                ret = factory.apply(global, array);
        module.state = 2;
        if (ret !== void 0) {
            modules[id].exports = ret;
        }
        return ret;
    }
    all.replace($.rword, function(a) {
        $.config.alias["$" + a] = basepath + a + ".js";
    });
    //============================domReady机制===========================
    var readyFn, ready = W3C ? "DOMContentLoaded" : "readystatechange";

    function fireReady() {
        modules.ready.state = 2;
        checkDeps();
        if (readyFn) {
            $.unbind(DOC, ready, readyFn);
        }
        fireReady = $.noop; //隋性函数，防止IE9二次调用_checkDeps
    }

    function doScrollCheck() {
        try { //IE下通过doScrollCheck检测DOM树是否建完
            html.doScroll("left");
            fireReady();
        } catch (e) {
            setTimeout(doScrollCheck);
        }
    }
    ;
    //在firefox3.6之前，不存在readyState属性
    //http://www.cnblogs.com/rubylouvre/archive/2012/12/18/2822912.html
    if (!DOC.readyState) {
        var readyState = DOC.readyState = DOC.body ? "complete" : "loading";
    }
    if (DOC.readyState === "complete") {
        fireReady(); //如果在domReady之外加载
    } else {
        $.bind(DOC, ready, readyFn = function() {
            if (W3C || DOC.readyState === "complete") {
                fireReady();
                if (readyState) { //IE下不能改写DOC.readyState
                    DOC.readyState = "complete";
                }
            }
        });
        if (html.doScroll) {
            try { //如果跨域会报错，那时肯定证明是存在两个窗口
                if (self.eval === parent.eval) {
                    doScrollCheck();
                }
            } catch (e) {
                doScrollCheck();
            }
        }
    }
    //============================HTML5新标签支持===========================
    //IE6789必须以硬编码形式把mass.js写在页面才生效
    global.VBArray && ("abbr,article,aside,audio,base,bdi,canvas,data,datalist,details,figcaption,figure,footer," + "header,hgroup,m,mark,meter,nav,output,progress,section,summary,time,video").replace($.rword, function(tag) {
        DOC.createElement(tag);
    });

    //============================HTML5无缝刷新页面支持======================
    //https://developer.mozilla.org/en/DOM/window.onpopstate
    $.bind(global, "popstate", function() {
        NsKey = DOC.URL.replace(rmakeid, "");
        $.exports();
    });
    $.exports($.config.nick + postfix); //防止不同版本的命名空间冲突
    //============================合并核心模块支持===========================
    /*combine modules*/

}(self, self.document); //为了方便在VS系列实现智能提示,把这里的this改成self或window
/**
 changelog:
 2011.7.11
 @开头的为私有的系统变量，防止人们直接调用,
 dom.check改为dom["@emitter"]
 dom.namespace改为dom["mass"]
 去掉无用的dom.modules
 优化exports方法
 2011.8.4
 强化dom.log，让IE6也能打印日志
 重构fixOperaError与resolveCallbacks
 将provide方法合并到require中去
 2011.8.7
 重构define,require,resolve
 添加"@modules"属性到dom命名空间上
 增强domReady传参的判定
 2011.8.18 应对HTML5 History API带来的“改变URL不刷新页面”技术，让URL改变时让namespace也跟着改变！
 2011.8.20 去掉dom.K,添加更简单dom.noop，用一个简单的异步列队重写dom.ready与错误堆栈dom.stack
 2011.9.5  强化dom.type
 2011.9.19 强化dom.mix
 2011.9.24 简化dom.bind 添加dom.unbind
 2011.9.28 dom.bind 添加返回值
 2011.9.30 更改是否在顶层窗口的判定  global.frameElement == null --> self.eval === top.eval
 2011.10.1
 更改dom.uuid为dom["@uuid"],dom.basePath为dom["@path"]，以示它们是系统变量
 修复dom.require BUG 如果所有依赖模块之前都加载执行过，则直接执行回调函数
 移除dom.ready 只提供dom(function(){})这种简捷形式
 2011.10.4 强化对IE window的判定, 修复dom.require BUG dn === cn --> dn === cn && !callback._name
 2011.10.9
 简化fixOperaError中伪dom命名空间对象
 优化截取隐藏命名空间的正则， /(\W|(#.+))/g --〉  /(#.+|\\W)/g
 2011.10.13 dom["@emitter"] -> dom["@target"]
 2011.10.16 移除XMLHttpRequest的判定，回调函数将根据依赖列表生成参数，实现更彻底的模块机制
 2011.10.20 添加error方法，重构log方法
 2011.11.6  重构uuid的相关设施
 2011.11.11 多版本共存
 2011.12.19 增加define方法
 2011.12.22 加载用iframe内增加$变量,用作过渡.
 2012.1.15  更换$为命名空间
 2012.1.29  升级到v15
 2012.1.30 修正_checkFail中的BUG，更名_resolveCallbacks为_checkDeps
 2012.2.3 $.define的第二个参数可以为boolean, 允许文件合并后，在标准浏览器跳过补丁模块
 2012.2.23 修复内部对象泄漏，导致与外部$变量冲突的BUG
 2012.4.5 升级UUID系统，以便页面出现多个版本共存时，让它们共享一个计数器。
 2012.4.25  升级到v16
 简化_checkFail方法，如果出现死链接，直接打印模块名便是，不用再放入错误栈中了。
 简化deferred列队，统一先进先出。
 改进$.mix方法，允许只存在一个参数，直接将属性添加到$命名空间上。
 内部方法assemble更名为setup，并强化调试机制，每加入一个新模块， 都会遍历命名空间与原型上的方法，重写它们，添加try catch逻辑。
 2012.5.6更新rdebug,不处理大写开头的自定义"类"
 2012.6.5 对IE的事件API做更严格的判定,更改"@target"为"@bind"
 2012.6.10 精简require方法 处理opera11.64的情况
 2012.6.13 添加异步列队到命名空间,精简domReady
 2012.6.14 精简innerDefine,更改一些术语
 2012.6.25 domReady后移除绑定事件
 2012.7.23 动态指定mass Framewoke的命名空间与是否调试
 2012.8.26 升级到v17
 2012.8.27 将$.log.level改到$.config.level中去
 2012.8.28 将最后一行的this改成self
 2012.9.12 升级到v18 添加本地储存的支持
 2012.11.21 升级到v19 去掉CMD支持与$.debug的实现,增加循环依赖的判定
 2012.12.5 升级到v20，参考requireJS的实现，去掉iframe检测，暴露define与require
 2012.12.16 精简loadCSS 让getCurrentScript更加安全
 2012.12.18 升级v21 处理opera readyState BUG 与IE6下的节点插入顺序
 2012.12.26 升级v22 移除本地储存，以后用插件形式实现，新增一个HTML5 m标签的支持
 2013.1.22 处理动态插入script节点的BUG, 对让getCurrentScript进行加强
 2013.4.1 升级支v23 支持动态添加加载器，正确取得加载器所在的节点的路径
 2013.4.3 升级支v24 支持不按AMD规范编写的JS文件加载
 
 http://stackoverflow.com/questions/326596/how-do-i-wrap-a-function-in-javascript
 https://github.com/eriwen/javascript-stacktrace
 不知道什么时候开始，"不要重新发明轮子"这个谚语被传成了"不要重新造轮子"，于是一些人，连造轮子都不肯了。
 重新发明东西并不会给我带来论文发表，但是它却给我带来了更重要的东西，这就是独立的思考能力。
 一旦一个东西被你“想”出来，而不是从别人那里 “学”过来，那么你就知道这个想法是如何产生的。
 这比起直接学会这个想法要有用很多，因为你知道这里面所有的细节和犯过的错误。而最重要的，
 其实是由此得 到的直觉。如果直接去看别人的书或者论文，你就很难得到这种直觉，因为一般人写论文都会把直觉埋藏在一堆符号公式之下，
 让你看不到背后的真实想法。如果得到了直觉，下一次遇到类似的问题，你就有可能很快的利用已有的直觉来解决新的问题。
 Javascript 文件的同步加载与异步加载 http://www.cnblogs.com/ecalf/archive/2012/12/12/2813962.html
 http://sourceforge.net/apps/trac/pies/wiki/TypeSystem/zh
 http://tableclothjs.com/ 一个很好看的表格插件
 http://layouts.ironmyers.com/
 http://warpech.github.com/jquery-handsontable/
 http://baidu.365rili.com/wnl.html?bd_user=1392943581&bd_sig=23820f7a2e2f2625c8945633c15089dd&canvas_pos=search&keyword=%E5%86%9C%E5%8E%86
 http://unscriptable.com/2011/10/02/closures-for-dummies-or-why-iife-closure/
 http://unscriptable.com/2011/09/30/amd-versus-cjs-whats-the-best-format/
 http://news.cnblogs.com/n/157042/
 http://www.cnblogs.com/beiyuu/archive/2011/07/18/iframe-tech-performance.html iframe异步加载技术及性能
 http://www.cnblogs.com/lhb25/archive/2012/09/11/resources-that-complement-twitter-bootstrap.html
 http://www.cnblogs.com/rainman/archive/2011/06/22/2086069.html
 http://www.infoq.com/cn/articles/how-to-create-great-js-module 优秀的JavaScript模块是怎样炼成的
 http://y.duowan.com/resources/js/jsFrame/demo/index.html
 https://github.com/etaoux/brix
 */