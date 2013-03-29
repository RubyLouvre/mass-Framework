! function(global, DOC) {
    var $$ = global.$; //保存已有同名变量
    var rmakeid = /(#.+|\W)/g; //用于处理掉href中的hash与所有特殊符号，生成长命名空间
    var NsKey = DOC.URL.replace(rmakeid, ""); //长命名空间（字符串）
    var NsVal = global[NsKey]; //长命名空间（mass对象）
    var W3C = DOC.dispatchEvent; //IE9开始支持W3C的事件模型与getComputedStyle取样式值
    var html = DOC.documentElement; //HTML元素
    var head = DOC.head; //HEAD元素
    var loadings = []; //正在加载中的模块列表
    var parsings = []; //储存需要绑定ID与factory对应关系的模块（标准浏览器下，先parse的script节点会先onload）
    var mass = 1; //当前框架的版本号
    var postfix = ""; //用于强制别名
    var cbi = 1e5; //用于生成回调函数的名字
    var all = "mass,lang,class,flow,data,support,query,node,attr,css,event,ajax,fx";
    var moduleClass = "mass" + (new Date - 0);
    var hasOwn = Object.prototype.hasOwnProperty;
    var class2type = {
        "[object HTMLDocument]": "Document",
        "[object HTMLCollection]": "NodeList",
        "[object DOMWindow]": "Window",
        "[object global]": "Window",
        "null": "Null",
        "NaN": "NaN",
        "undefined": "Undefined"
    };
    var serialize = class2type.toString,
        basepath;
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
        if (!$.fn) $.error("必须加载node模块");
        return $.fn.init(expr, context);
    }
    $.init = function() {}
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
        "@bind": "addEventListener",
        /**
         * 数组化
         * @param {ArrayLike} nodes 要处理的类数组对象
         * @param {Number} start 可选。要抽取的片断的起始下标。如果是负数，从后面取起
         * @param {Number} end  可选。规定从何处结束选取
         * @return {Array}
         * @api public
         */
        slice: function(nodes, start, end) {
            return parsings.slice.call(nodes, start, end);
        },
        /**
         * 用于建立一个从元素到数据的关联，应用于事件绑定，元素去重
         * @param {Any} obj
         * @return {Number} 一个UUID
         */
        getUid: function(obj) { //IE9+,标准浏览器
            return obj.uniqueNumber || (obj.uniqueNumber = setTimeout("1"));
        },
        /**
         * 绑定事件(简化版)
         * @param {Node|Document|window} el 触发者
         * @param {String} type 事件类型
         * @param {Function} fn 回调
         * @param {Boolean} phase ? 是否捕获，默认false
         * @return {Function} fn 刚才绑定的回调
         */
        bind: function(el, type, fn, phase) {
            el.addEventListener(type, fn, !! phase);
            return fn;
        },
        /**
         * 卸载事件(简化版)
         * @param {Node|Document|window} el 触发者
         * @param {String} type 事件类型
         * @param {Function} fn 回调
         * @param {Boolean} phase ? 是否捕获，默认false
         */
        unbind: function(el, type, fn, phase) {
            el.removeEventListener(type, fn || $.noop, !! phase);
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
                if (obj.nodeType === 9) {
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
                } else if (global.console) {
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
            var kernel = $.config;
            for (var p in settings) {
                if (!hasOwn.call(settings, p)) continue;
                var prev = kernel[p];
                var curr = settings[p];
                if (prev && p === "alias") {
                    for (var c in curr) {
                        if (hasOwn.call(curr, c)) {
                            var prevValue = prev[c];
                            var currValue = curr[c];
                            if (prevValue && prev !== curr) {
                                $.error(c + "不能重命名");
                            }
                            prev[c] = currValue;
                        }
                    }
                } else {
                    kernel[p] = curr;
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
        noop: function() {},
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
            throw new(e || Error)(str);
        }
    });
    (function(scripts) {
        var cur = scripts[scripts.length - 1],
            url = cur.src.replace(/[?#].*/, ""),
            kernel = $.config;
        basepath = kernel.base = url.slice(0, url.lastIndexOf("/") + 1);
        kernel.nick = cur.getAttribute("nick") || "$";
        kernel.alias = {};
        kernel.level = 9;
    })(DOC.scripts);

    "Boolean,Number,String,Function,Array,Date,RegExp,Window,Document,Arguments,NodeList,Error".replace($.rword, function(name) {
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
    /**
     * 将模块标识转换为URL
     * @param  {String} url    模块标识
     * @param  {String} parent 父路径
     * @return {Array}  ret [url, type]
     * @api private
     */

    function parseURL(url, parent, ret) {
        if (/^(mass|ready)$/.test(url)) { //特别处理ready标识符
            return [url, "js"];
        }
        if ($.config.alias[url]) {
            ret = $.config.alias[url];
        } else {
            parent = parent.substr(0, parent.lastIndexOf('/'))
            if (/^(\w+)(\d)?:.*/.test(url)) { //如果用户路径包含协议
                ret = url;
            } else {
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
                    ret = parent + url;
                } else {
                    $.error("不符合模块标识规则: " + url);
                }
            }
        }
        var ext = "js";
        tmp = ret.replace(/[?#].*/, "");
        if (/\.(css|js)$/.test(tmp)) { // 处理"http://113.93.55.202/mass.draggable"的情况
            ext = RegExp.$1;
        }
        if (ext !== "css" && tmp === ret && !/\.js$/.test(ret)) { //如果没有后缀名会补上.js
            ret += ".js";
        }
        return [ret, ext];
    }

    function getCurrentScript() {
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
             */
            stack = stack.split(/[@ ]/g).pop(); //取得最后一行,最后一个空格或@之后的部分
            stack = stack[0] === "(" ? stack.slice(1, -1) : stack.replace(/\s/, ""); //去掉换行符
            return stack.replace(/(:\d+)?:\d+$/i, ""); //去掉行号与或许存在的出错字符起始位置
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
        loop: for (var i = loadings.length, id; id = loadings[--i];) {
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
                checkDeps();
            }
        }
    }

    function checkFail(node, error) {
        //检测是否死链
        var id = node.src;
        node.onload = node.onerror = null;
        if (error || !modules[id].state) {
            setTimeout(function() {
                head.removeChild(node);
            });
            $.log("加载 " + id + " 失败" + error + " " + (!modules[id].state), 7);
        } else {
            return true;
        }
    }

    function loadJS(url) {
        //通过script节点加载目标模块
        var node = DOC.createElement("script");
        node.className = moduleClass; //让getCurrentScript只处理类名为moduleClass的script节点
        node.onload = function() {
            //mass Framework会在_checkFail把它上面的回调清掉，尽可能释放回存，尽管DOM0事件写法在IE6下GC无望
            var factory = parsings.pop();
            factory && factory.delay(node.src);
            if (checkFail(node)) {
                $.log("已成功加载 " + node.src, 7);
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
        // 用于依赖列表中的模块的返回值
        args = [],
            // 需要安装的模块数
            dn = 0,
            // 已安装完的模块数
            cn = 0,
            id = parent || "cb" + (cbi++).toString(32);
        parent = parent || basepath;
        String(list).replace($.rword, function(el) {
            var array = parseURL(el, parent),
                url = array[0];
            if (array[1] === "js") {
                dn++;
                if (!modules[url]) {
                    modules[url] = {
                        id: url,
                        parent: parent,
                        exports: {}
                    };
                    loadJS(url);
                } else if (modules[url].state === 2) {
                    cn++;
                }
                if (!deps[url]) {
                    args.push(url);
                    deps[url] = "司徒正美"; //去重
                }
            } else if (array[1] === "css") {
                loadCSS(url);
            }
        });
        //创建或更新模块的状态
        modules[id] = {
            id: id,
            factory: factory,
            deps: deps,
            args: args,
            state: 1
        };
        if (dn === cn) { //如果需要安装的等于已安装好的
            fireFactory(id, args, factory); //装配到框架中
            return checkDeps();
        }
        //在正常情况下模块只能通过_checkDeps执行
        loadings.unshift(id);
    };
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
        //现在除了safari外，我们都能直接通过getCurrentScript一步到位得到当前执行的script节点，safari可通过onload+delay闭包组合解决
        id = modules[id] && modules[id].state >= 1 ? _id : getCurrentScript();
        factory = args[1];
        factory.id = _id; //用于调试
        factory.delay = function(id) {
            args.push(id);
            if (checkCycle(modules[id].deps, id)) {
                $.error(id + "模块与之前的某些模块存在循环依赖");
            }
            delete factory.delay; //释放内存
            require.apply(null, args); //0,1,2 --> 1,2,0
        };
        if (id) {
            factory.delay(id, args);
        } else { //先进先出
            parsings.push(factory);
        }
    };
    $.require.amd = modules;
    /**
     * 请求模块从modules对象取得依赖列表中的各模块的返回值，执行factory, 完成模块的安装
     * @param {String} id  模块ID
     * @param {Array} deps 依赖列表
     * @param {Function} factory 模块工厂
     * @api private
     */

    function fireFactory(id, deps, factory) {
        for (var i = 0, array = [], d; d = deps[i++];) {
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
    var readyFn, ready = "DOMContentLoaded";

    function fireReady() {
        modules.ready.state = 2;
        checkDeps();
        if (readyFn) {
            $.unbind(DOC, ready, readyFn);
        }
        fireReady = $.noop; //隋性函数，防止IE9二次调用_checkDeps
    }

    ;
    //在firefox3.6之前，不存在readyState属性
    //http://www.cnblogs.com/rubylouvre/archive/2012/12/18/2822912.html
    if (!DOC.readyState) {
        var readyState = DOC.readyState = "loading";
    }
    if (DOC.readyState === "complete") {
        fireReady(); //如果在domReady之外加载
    } else {
        $.bind(DOC, ready, readyFn = function() {
            fireReady();
            if (readyState) { //IE下不能改写DOC.readyState
                DOC.readyState = "complete";
            }
        });
    }
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
 2013.3.29 此版本面向触摸版
 */