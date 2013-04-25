//==================================================
// avalon v4 独立版 没有任何依赖，可自由搭配jQuery, mass等使用 by 司徒正美 2013.4.23
//==================================================
(function() {
    var serialize = Object.prototype.toString;
    var Publish = {}; //将函数放到发布对象上，让依赖它的函数
    var expando = new Date - 0;
    var mid = expando;
    function modleID() {
        return (mid++).toString(36) + "";
    }
    var subscribers = "$" + expando;
    var propMap = {};
    var rword = /[^, ]+/g;
    var prefix = "ms-";
    //这两个都与计算属性息息相关
    var stopComputedAssign = false;
    var openComputedCollect = false;
    var DONT_ENUM = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(",");
    var hasOwn = Object.prototype.hasOwnProperty;
    var readyList = [];
    var avalon = window.avalon = {
        mix: function(a, b) {
            for (var i in b) {
                a[i] = b[i];
            }
            return a;
        },
        subscribers: subscribers,
        models: {},
        error: function(str, e) {
            throw new (e || Error)(str);
        },
        log: function log(a) {
            window.console && console.log(a);
        },
        ready: function(fn) {
            if (readyList) {
                readyList.push(fn);
                if (document.readyState == "complete") {
                    fireReady();
                }
            } else {
                fn();
            }
        },
        bind: window.dispatchEvent ? function(el, type, fn, phase) {
            el.addEventListener(type, fn, !!phase);
            return fn;
        } : function(el, type, fn) {
            el.attachEvent && el.attachEvent("on" + type, fn);
            return fn;
        },
        addClass: function(element, className) {
            element.className = (element.className.trim() + ' ' + className).trim();
        },
        addClasses: function(element, classList) {
            classList.replace(/\w+/g, function(className) {
                avalon.addClass(element, className);

            });
        },
        removeClass: function(element, className) {
            if (element.className) {
                element.className = (" " + element.className + " ")
                        .replace(/[\n\t]/g, " ")
                        .replace(" " + className.trim() + " ", " ").trim();
            }
        },
        removeClasses: function(element, classList) {
            classList.replace(/\w+/g, function(className) {
                avalon.removeClass(element, className);
            });
        },
        type: function(obj) { //取得类型
            return obj === null ? "Null" : obj === void 0 ? "Undefined" : serialize.call(obj).slice(8, -1);
        },
        range: function(start, end, step) {//返回一个[)
            step || (step = 1);
            if (end == null) {
                end = start || 0;
                start = 0;
            }
            var index = -1,
                    length = Math.max(0, Math.ceil((end - start) / step)),
                    result = Array(length);

            while (++index < length) {
                result[index] = start;
                start += step;
            }
            return result;
        },
        forEach: function(obj, fn) {
            if (obj) { //不能传个null, undefined进来
                var isArray = Array.isArray(obj) || isFinite(obj.length) && obj[0],
                        i = 0;
                if (isArray) {
                    for (var n = obj.length; i < n; i++) {
                        fn(i, obj[i]);
                    }
                } else {
                    for (i in obj) {
                        if (obj.hasOwnProperty(i)) {
                            fn(i, obj[i]);
                        }
                    }
                }
            }
        }
    };
    function fireReady() {
        if (readyList) {
            for (var i = 0, fn; fn = readyList[i++]; ) {
                fn();
            }
            readyList = null;
        }
        try {
            document.readyState = "complete";
        } catch (e) {
        }
    }
    avalon.bind(window, "load", fireReady);
    avalon.bind(window, "DOMContentLoaded", fireReady)
    /*********************************************************************
     *                           ecma262 v5语法补丁                   *
     **********************************************************************/
    if (!"司徒正美".trim) {
        String.prototype.trim = function() {
            return this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, '')
        };
    }
    for (var i in {
        toString: 1
    }) {
        DONT_ENUM = false;
    }
    if (!Object.keys) {
        Object.keys = function(obj) { //ecma262v5 15.2.3.14
            var result = [];
            for (var key in obj)
                if (hasOwn.call(obj, key)) {
                    result.push(key);
                }
            if (DONT_ENUM && obj) {
                for (var i = 0; key = DONT_ENUM[i++]; ) {
                    if (hasOwn.call(obj, key)) {
                        result.push(key);
                    }
                }
            }
            return result;
        };
    }
    if (!Array.isArray) {
        Array.isArray = function(a) {
            return avalon.type(a) === "Array";
        };
    }

    function iterator(vars, body, ret) {
        var fun = 'for(var ' + vars + 'i=0,n = this.length;i < n;i++){'
                + body.replace('_', '((i in this) && fn.call(scope,this[i],i,this))') + '}' + ret
        return Function("fn,scope", fun);
    }

    avalon.mix(Array.prototype, {
        //定位操作，返回数组中第一个等于给定参数的元素的索引值。
        indexOf: function(item, index) {
            var n = this.length,
                    i = ~~index;
            if (i < 0)
                i += n;
            for (; i < n; i++)
                if (this[i] === item)
                    return i;
            return -1;
        },
        //定位引操作，同上，不过是从后遍历。
        lastIndexOf: function(item, index) {
            var n = this.length,
                    i = index == null ? n - 1 : index;
            if (i < 0)
                i = Math.max(0, n + i);
            for (; i >= 0; i--)
                if (this[i] === item)
                    return i;
            return -1;
        },
        //迭代操作，将数组的元素挨个儿传入一个函数中执行。Ptototype.js的对应名字为each。
        forEach: iterator('', '_', ''),
        //迭代类 在数组中的每个项上运行一个函数，如果此函数的值为真，则此元素作为新数组的元素收集起来，并返回新数组
        filter: iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r'),
        //收集操作，将数组的元素挨个儿传入一个函数中执行，然后把它们的返回值组成一个新数组返回。Ptototype.js的对应名字为collect。
        map: iterator('r=[],', 'r[i]=_', 'return r'),
        //只要数组中有一个元素满足条件（放进给定函数返回true），那么它就返回true。Ptototype.js的对应名字为any。
        some: iterator('', 'if(_)return true', 'return false'),
        //只有数组中的元素都满足条件（放进给定函数返回true），它才返回true。Ptototype.js的对应名字为all。
        every: iterator('', 'if(!_)return false', 'return true')
    });
    /*********************************************************************
     *                          数组增强                        *
     **********************************************************************/
    avalon.Array = {
        sortBy: function(target, fn, scope) {
            //根据指定条件进行排序，通常用于对象数组。
            var array = target.map(function(item, index) {
                return {
                    el: item,
                    re: fn.call(scope, item, index)
                };
            }).sort(function(left, right) {
                var a = left.re,
                        b = right.re;
                return a < b ? -1 : a > b ? 1 : 0;
            });
            return avalon.Array.pluck(array, 'el');
        },
        pluck: function(target, name) {
            //取得对象数组的每个元素的指定属性，组成数组返回。
            var result = [],
                    prop;
            target.forEach(function(item) {
                prop = item[name];
                if (prop != null)
                    result.push(prop);
            });
            return result;
        },
        ensure: function(target, el) {
            //只有当前数组不存在此元素时只添加它
            if (!~target.indexOf(el)) {
                target.push(el);
            }
            return target;
        },
        removeAt: function(target, index) {
            //移除数组中指定位置的元素，返回布尔表示成功与否。
            return !!target.splice(index, 1).length;
        },
        remove: function(target, item) {
            //移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否。
            var index = target.indexOf(item);
            if (~index)
                return avalon.Array.removeAt(target, index);
            return false;
        }
    }
    forEach = avalon.forEach;
    /*********************************************************************
     *                           定时器                  *
     **********************************************************************/
    var nextTick;
    if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        nextTick = setImmediate.bind(window);
    } else {
        (function() {
            // linked list of tasks (single, with head node)
            var head = {task: void 0, next: null};
            var tail = head;
            var maxPendingTicks = 2;
            var pendingTicks = 0;
            var queuedTasks = 0;
            var usedTicks = 0;
            var requestTick = void 0;

            function onTick() {
                // In case of multiple tasks ensure at least one subsequent tick
                // to handle remaining tasks in case one throws.
                --pendingTicks;

                if (++usedTicks >= maxPendingTicks) {
                    // Amortize latency after thrown exceptions.
                    usedTicks = 0;
                    maxPendingTicks *= 4; // fast grow!
                    var expectedTicks = queuedTasks && Math.min(
                            queuedTasks - 1,
                            maxPendingTicks
                            );
                    while (pendingTicks < expectedTicks) {
                        ++pendingTicks;
                        requestTick();
                    }
                }

                while (queuedTasks) {
                    --queuedTasks; // decrement here to ensure it's never negative
                    head = head.next;
                    var task = head.task;
                    head.task = void 0;
                    task();
                }

                usedTicks = 0;
            }

            nextTick = function(task) {
                tail = tail.next = {task: task, next: null};
                if (
                        pendingTicks < ++queuedTasks &&
                        pendingTicks < maxPendingTicks
                        ) {
                    ++pendingTicks;
                    requestTick();
                }
            };

            if (typeof MessageChannel !== "undefined") {
                // modern browsers
                // http://www.nonblocking.io/2011/06/windownexttick.html
                var channel = new MessageChannel();
                channel.port1.onmessage = onTick;
                requestTick = function() {
                    channel.port2.postMessage(0);
                };
            } else {
                requestTick = function() {//旧式IE
                    setTimeout(onTick, 0);
                };
            }
        })();
    }
    avalon.requestTick = nextTick;
    /*********************************************************************
     *                           Define                                 *
     **********************************************************************/
    avalon.define = function(name, deps, factory) {
        var args = [].slice.call(arguments);
        if (typeof name !== "string") {
            name = !avalon.models["root"] ? "root" : modleID();
            args.unshift(name);
        }
        if (!Array.isArray(args[1])) {
            args.splice(1, 0, []);
        }
        deps = args[1];
        if (typeof args[2] !== "function") {
            avalon.error("factory必须是函数");
        }
        factory = args[2];
        var scope = {};
        deps.unshift(scope);
        factory(scope); //得到所有定义
        var model = modelFactory(scope);//转为一个ViewModel
        stopComputedAssign = true;
        deps[0] = model;
        factory.apply(0, deps);//重置它的上下文
        deps.shift();
        stopComputedAssign = false;
        model.$id = name;
        return avalon.models[name] = model;
    };

    function modelFactory(scope) {
        var skipArray = scope.$skipArray,
                description = {},
                model = {},
                callSetters = [],
                callGetters = [],
                VBPublics = [];
        skipArray = Array.isArray(skipArray) ? skipArray : [];
        avalon.Array.ensure(skipArray, "$skipArray");
        forEach(scope, function(name, value) {
            if (typeof value === "function") {
                VBPublics.push(name);
            } else {
                if (skipArray.indexOf(name) !== -1) {
                    return VBPublics.push(name);
                }
                var accessor, oldValue, oldArgs;
                if (typeof value === "object" && typeof value.get === "function" && Object.keys(value).length <= 2) {
                    callGetters.push(name);
                    accessor = function(neo) { //创建computed
                        if (arguments.length) {
                            if (stopComputedAssign) {
                                return;//阻止computed在factory(model)中被赋值
                            }
                            if (typeof value.set === "function") {
                                value.set.call(model, neo);
                            }
                            if (oldArgs !== neo) {
                                oldArgs = neo;
                                notifySubscribers(accessor); //通知顶层改变
                            }
                        } else {
                            var flagDelete = false;
                            if (!accessor[subscribers]) {
                                flagDelete = true;
                                Publish[expando] = function() {
                                    notifySubscribers(accessor); //通知顶层改变
                                };//这里是方便监控属性来通知它
                                accessor[subscribers] = [];
                            }
                            if (openComputedCollect) {
                                collectSubscribers(accessor);
                            }
                            if (typeof value.get === "function") {
                                oldValue = value.get.call(model);
                            }
                            if (flagDelete) {
                                delete Publish[expando];
                            }
                            return oldValue;
                        }
                    };
                } else {
                    callSetters.push(name);
                    accessor = function(neo) { //创建访问器
                        if (arguments.length) {
                            if (oldValue !== neo) {
                                if (typeof neo === "object") {
                                    if (Array.isArray(neo)) {
                                        if (oldValue && oldValue.isCollection) {
                                            var args = [0, oldValue.length].concat(neo);
                                            oldValue.splice.apply(oldValue, args);
                                            oldValue.update();
                                        } else {
                                            oldValue = Collection(neo);
                                        }
                                    } else {
                                        oldValue = modelFactory(neo);
                                    }
                                } else {
                                    oldValue = neo;
                                }
                                notifySubscribers(accessor); //通知顶层改变
                            }
                        } else {
                            collectSubscribers(accessor); //收集视图函数
                            return oldValue;
                        }
                    };
                    accessor[subscribers] = [];
                }
                description[name] = {
                    set: accessor,
                    get: accessor,
                    enumerable: true
                };
            }
        });
        if (defineProperties) {
            defineProperties(model, description);
        } else {
            model = VBDefineProperties(description, VBPublics);
        }
        VBPublics.forEach(function(name) {
            model[name] = scope[name];
        });
        callSetters.forEach(function(prop) {
            model[prop] = scope[prop]; //为空对象赋值
        });
        callGetters.forEach(function(prop) {
            callSetters = model[prop]; //让computed计算自身
        });
        model.$id = modleID();
        return model;
    }
    var defineProperty = Object.defineProperty;
    try {
        defineProperty({}, "_", {
            value: "x"
        });
        var defineProperties = Object.defineProperties;
    } catch (e) {
        if ("__defineGetter__" in avalon) {
            defineProperty = function(obj, prop, desc) {
                if ('value' in desc) {
                    obj[prop] = desc.value;
                }
                if ('get' in desc) {
                    obj.__defineGetter__(prop, desc.get);
                }
                if ('set' in desc) {
                    obj.__defineSetter__(prop, desc.set);
                }
                return obj;
            };
            defineProperties = function(obj, descs) {
                for (var prop in descs) {
                    if (descs.hasOwnProperty(prop)) {
                        defineProperty(obj, prop, descs[prop]);
                    }
                }
                return obj;
            };
        }
    }
    if (!defineProperties && window.VBArray) {
        window.execScript([
            "Function parseVB(code)",
            "\tExecuteGlobal(code)",
            "End Function"].join("\n"), "VBScript");

        function VBMediator(description, name, value) {
            var fn = description[name] && description[name].set;
            if (arguments.length === 3) {
                fn(value);
            } else {
                var ret = fn();
                return ret;
            }
        }

        function VBDefineProperties(description, publics) {
            publics = publics.concat();
            avalon.Array.ensure(publics, "hasOwnProperty");
            avalon.Array.ensure(publics, "$id");
            var className = "VBClass" + setTimeout("1"),
                    owner = {}, buffer = [];
            buffer.push(
                    "Class " + className,
                    "\tPrivate [__data__], [__proxy__]",
                    "\tPublic Default Function [__const__](d, p)",
                    "\t\tSet [__data__] = d: set [__proxy__] = p",
                    "\t\tSet [__const__] = Me", //链式调用
                    "\tEnd Function");
            publics.forEach(function(name) { //添加公共属性,如果此时不加以后就没机会了
                owner[name] = true;//因为VBScript对象不能像JS那样随意增删属性
                buffer.push("\tPublic [" + name + "]");//你可以预先放到skipArray中
            });
            Object.keys(description).forEach(function(name) {
                owner[name] = true;
                buffer.push(
                        //由于不知对方会传入什么,因此set, let都用上
                        "\tPublic Property Let [" + name + "](val)", //setter
                        "\t\tCall [__proxy__]([__data__], \"" + name + "\", val)",
                        "\tEnd Property",
                        "\tPublic Property Set [" + name + "](val)", //setter
                        "\t\tCall [__proxy__]([__data__], \"" + name + "\", val)",
                        "\tEnd Property",
                        "\tPublic Property Get [" + name + "]", //getter
                        "\tOn Error Resume Next", //必须优先使用set语句,否则它会误将数组当字符串返回
                        "\t\tSet[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
                        "\tIf Err.Number <> 0 Then",
                        "\t\t[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
                        "\tEnd If",
                        "\tOn Error Goto 0",
                        "\tEnd Property");
            });
            buffer.push("End Class"); //类定义完毕
            buffer.push(
                    "Function " + className + "Factory(a, b)", //创建实例并传入两个关键的参数
                    "\tDim o",
                    "\tSet o = (New " + className + ")(a, b)",
                    "\tSet " + className + "Factory = o",
                    "End Function");
            // console.log(buffer.join("\r\n"));
            window.parseVB(buffer.join("\r\n"));
            var model = window[className + "Factory"](description, VBMediator);
            model.hasOwnProperty = function(name) {
                return owner[name] === true;
            };
            return model;
        }
    }

    function collectSubscribers(accessor) { //收集依赖于这个访问器的订阅者
        if (Publish[expando]) {
            var list = accessor[subscribers];
            list && avalon.Array.ensure(list, Publish[expando]); //只有数组不存在此元素才push进去
        }
    }

    function notifySubscribers(accessor) { //通知依赖于这个访问器的订阅者更新自身
        var list = accessor[subscribers];
        if (list && list.length) {
            var args = [].slice.call(arguments, 1);
            var safelist = list.concat(),
                    el;
            for (var i = 0, fn; fn = safelist[i++]; ) {
                el = fn.element;
                if (el && (el.sourceIndex === 0 || el.parentNode === null)) {
                    avalon.log("remove " + el)
                    avalon.Array.remove(list, fn);
                } else {
                    fn.apply(0, args); //强制重新计算自身
                }
            }
        }
    }
    /*********************************************************************
     *                           Scan                                     *
     **********************************************************************/
    avalon.scan = function(elem, scope) {
        elem = elem || document.documentElement;
        if (typeof scope !== "object") {
            var models = avalon.models,
                    scopeName = elem.getAttribute(prefix + "app") || "root";
            scope = models[scopeName];
        }
        if (!scope) {
            for (var i in models) {
                if (models.hasOwnProperty(i)) {
                    scope = models[i];
                    break;
                }
            }
            if (!scope) {
                avalon.error("至少定义一个ViewModel");
            }
        }

        scanTag(elem, scope, [], elem.ownerDocument || document);
    };

    function scanTag(elem, scope, scopes, doc) {
        scopes = scopes || [];
        var flags = {};
        scanAttr(elem, scope, scopes, flags); //扫描特点节点
        if (flags.stopBinding) { //是否要停止扫描
            return false;
        }
        if (flags.newScope) { //更换作用域， 复制父作用域堆栈，防止互相影响
            scopes = scopes.slice(0);
            scope = flags.newScope;
        }
        if (elem.canHaveChildren === false || !stopScan[elem.tagName]) {
            var textNodes = [];
            for (var node = elem.firstChild; node; node = node.nextSibling) {
                if (node.nodeType === 1) {
                    scanTag(node, scope, scopes, doc); //扫描元素节点
                } else if (node.nodeType === 3) {
                    textNodes.push(node);
                }
            }
            for (var i = 0; node = textNodes[i++]; ) { //延后执行
                scanText(node, scope, scopes, doc); //扫描文本节点
            }
        }
    }
    var stopScan = {};
    "area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed,wbr,script,style".replace(rword, function(a) {
        stopScan[a.toLowerCase()] = 1;
    });
    //扫描元素节点中直属的文本节点，并进行抽取

    function scanText(textNode, scope, scopes, doc) {
        var bindings = extractTextBindings(textNode, doc);
        if (bindings.length) {
            executeBindings(bindings, scope, scopes);
        }
    }

    function scanExpr(value) {
        var tokens = [];
        if (hasExpr(value)) {
            //抽取{{ }} 里面的语句，并以它们为定界符，拆分原来的文本
            do {
                value = value.replace(regOpenTag, function(a, b) {
                    if (b) {
                        tokens.push({
                            value: b,
                            expr: false
                        });
                    }
                    return "";
                });
                value = value.replace(regCloseTag, function(a, b) {
                    if (b) {
                        var leach = [];
                        if (b.indexOf("|") > 0) {
                            b = b.replace(/\|\s*(\w+)\s*(\([^)]+\))?/g, function(c, d, e) {
                                leach.push(d + (e || ""));
                                return "";
                            });
                        }
                        tokens.push({
                            value: b,
                            expr: true,
                            filters: leach.length ? leach : void 0
                        });
                    }
                    return "";
                });
            } while (hasExpr(value));
            if (value) {
                tokens.push({
                    value: value,
                    expr: false
                });
            }
        }
        return tokens;
    }

    function scanAttr(el, scope, scopes, flags) {
        var bindings = [];
        for (var i = 0, attr; attr = el.attributes[i++]; ) {
            if (attr.specified) {
                var isBinding = false,
                        remove = false;
                if (attr.name.indexOf(prefix) !== -1) { //如果是以指定前缀命名的
                    var type = attr.name.replace(prefix, "");
                    if (type.indexOf("-") > 0) {
                        var args = type.split("-");
                        type = args.shift();
                    }
                    remove = true;
                    isBinding = typeof bindingHandlers[type] === "function";

                } else if (bindingHandlers[attr.name] && hasExpr(attr.value)) {
                    type = attr.name; //如果只是普通属性，但其值是个插值表达式
                    isBinding = true;
                }
                if (isBinding) {
                    bindings.push({
                        type: type,
                        args: args,
                        element: el,
                        remove: remove,
                        node: attr,
                        value: attr.nodeValue
                    });
                }
                if (!flags.newScope && type === "controller") { //更换作用域
                    var temp = avalon.models[attr.value];
                    if (typeof temp === "object" && temp !== scope) {
                        scopes.unshift(scope);
                        flags.newScope = scope = temp;
                    }
                }
            }
        }
        executeBindings(bindings, scope, scopes, flags);
    }

    function executeBindings(bindings, scope, scopes, flags) {
        bindings.forEach(function(data) {
            bindingHandlers[data.type](avalon.mix({}, data), scope, scopes, flags);
            if (data.remove) { //移除数据绑定，防止被二次解析
                data.element.removeAttribute(data.node.name);
            }
        });
    }

    function extractTextBindings(textNode, doc) {
        var bindings = [],
                tokens = scanExpr(textNode.nodeValue);
        if (tokens.length) {
            var fragment = doc.createDocumentFragment();
            while (tokens.length) { //将文本转换为文本节点，并替换原来的文本节点
                var token = tokens.shift();
                var node = doc.createTextNode(token.value);
                if (token.expr) {
                    bindings.push({
                        type: "text",
                        node: node,
                        element: textNode.parentNode,
                        value: token.value,
                        filters: token.filters
                    }); //收集带有插值表达式的文本
                }
                fragment.appendChild(node);
            }
            textNode.parentNode.replaceChild(fragment, textNode);
        }
        return bindings;
    }

    /*********************************************************************
     *                          Parse                                    *
     **********************************************************************/
    //将绑定属性的值或插值表达式里面部分转换一个函数compileFn,里面或包含ViewModel的某些属性
    //而它们分分种都是setter, getter，成为双向绑定链的一部分
    var regEscape = /([-.*+?^${}()|[\]\/\\])/g;

    function escapeRegExp(target) {
        //将字符串安全格式化为正则表达式的源码
        return target.replace(regEscape, "\\$1");
    }
    var isStrict = (function() {
        return !this;
    })();

    function insertScopeNameBeforeVariableName(e, text, scopeList, names, args, random) {
        var ok = false;
        if (window.dispatchEvent) { //判定是否IE9-11或者为标准浏览器
            ok = e instanceof ReferenceError;
        } else {
            ok = e instanceof TypeError;
        }
        //opera9.61
        //message: Statement on line 810: Undefined variable: nickName
        //opera12
        //Undefined variable: nickName
        //safari 5
        //Can't find variable: nickName
        //firefox3-20  chrome
        //ReferenceError: nickName is not defined
        //IE10
        //“nickName”未定义 
        //IE6 
        //'eee' 未定义 
        if (ok) {
            if (window.opera) {
                var varName = e.message.split("Undefined variable: ")[1];
            } else {
                varName = e.message.replace("Can't find variable: ", "")
                        .replace("“", "").replace("'", "");
            }
            varName = (varName.match(/^[\w$]+/) || [""])[0]; //取得未定义的变量名
            for (var i = 0, scope; scope = scopeList[i++]; ) {
                if (scope.hasOwnProperty(varName)) {
                    var scopeName = scope.$id + random;
                    if (names.indexOf(scopeName) === -1) {
                        names.push(scopeName);
                        args.push(scope);
                    }
                    //这里实际还要做更严格的处理
                    var reg = new RegExp("(^|[^\\w\\u00c0-\\uFFFF_])(" + escapeRegExp(varName) + ")($|[^\\w\\u00c0-\\uFFFF_])", "g");
                    return text.replace(reg, function(a, b, c, d) {
                        return b + scopeName + "." + c + d; //添加作用域
                    });
                }
            }

        }
    }
    var doubleQuotedString = /"([^\\"\n]|\\.)*"/g;
    var singleQuotedString = /'([^\\'\n]|\\.)*'/g;

    function parseExpr(text, scopeList, data) {
        var names = [],
                args = [],
                random = new Date - 0,
                val;
        if (!isStrict) {//如果不是严格模式
            //取得模块的名字
            scopeList.forEach(function(scope) {
                var scopeName = scope.$id + "" + random;
                if (names.indexOf(scopeName) === -1) {
                    names.push(scopeName);
                    args.push(scope);
                }
            });
            text = "var ret" + random + " = " + text + "\r\n";
            for (var i = 0, name; name = names[i++]; ) {
                text = "with(" + name + "){\r\n" + text + "\r\n}\r\n";
            }
        } else {
            var singleFix = random + 1;
            var doubleFix = singleFix + 1;
            var singleHolder = [];
            var doubleHolder = [];
            var loop = true;
            //抽取掉所有字符串
            text = text.replace(singleQuotedString, function(a) {
                singleHolder.push(a);
                return singleFix;
            }).replace(doubleQuotedString, function(b) {
                doubleHolder.push(b);
                return doubleFix;
            });
            do { //开始循环
                try {
                    var fn = Function.apply(Function, names.concat("return " + text));
                    var val = fn.apply(fn, args);
                    loop = false;
                } catch (e) {
                    text = insertScopeNameBeforeVariableName(e, text, scopeList, names, args, random);
                    loop = typeof text === "string";
                }
            } while (loop);
            if (text) {
                if (singleHolder.length) {
                    text = text.replace(new RegExp(singleFix, "g"), function() {
                        return singleHolder.shift();
                    });
                }
                if (doubleHolder.length) {
                    text = text.replace(new RegExp(doubleFix, "g"), function() {
                        return doubleHolder.shift();
                    });
                }
                text = "var ret" + random + " = " + text;
            } else {
                data.compileFn = function() {
                    return "";
                };
                return "";
            }
        }
        if (data.filters) {
            var textBuffer = [],
                    fargs;
            textBuffer.push(text, "\r\n");
            for (var i = 0, f; f = data.filters[i++]; ) {
                var start = f.indexOf("(");
                if (start !== -1) {
                    fargs = f.slice(start + 1, f.lastIndexOf(")")).trim();
                    fargs = "," + fargs;
                    f = f.slice(0, start).trim();
                } else {
                    fargs = "";
                }
                textBuffer.push(" if(filters", random, ".", f, "){\r\n\ttry{ret", random,
                        " = filters", random, ".", f, "(ret", random, fargs, ")}catch(e){};\r\n}\r\n");
            }
            text = textBuffer.join("");
            names.push("filters" + random);
            args.push(avalon.filters);
            delete data.filters; //释放内存
        }
        data.compileArgs = args;
        try {
            text += "\r\nreturn ret" + random;
            var fn = Function.apply(Function, names.concat(text));
            val = fn.apply(fn, args);
            data.compileFn = fn; //缓存,防止二次编译
        } catch (e) {
            data.compileFn = function() {
                return "";
            };
            val = "";
        }
        textBuffer = names = null; //释放内存
        return val;
    }
    /*********************************************************************
     *                         Bind                                    *
     **********************************************************************/
    //将视图国的需要局部刷新的部分与ViewModel用绑定处理函数连结在一起,生成updateView函数,
    //而它内部调用着之前编译好的函数compileFn，双向产生依赖，成为双向绑定链的最顶层
    var regOpenTag = /([^{]*)\{\{/;
    var regCloseTag = /([^}]*)\}\}/;

    function hasExpr(value) {
        var index = value.indexOf("{{");
        return index !== -1 && index < value.indexOf("}}");
    }
    var prop = "contentEditable,isMap,longDesc,noHref,noResize,noShade,readOnly,useMap";
    prop.replace(rword, function(name) {
        propMap[name.toLowerCase()] = name;
    });
    //eval一个或多个表达式

    function watchView(text, scope, scopes, data, callback, tokens) {
        var updateView, target, filters = data.filters;
        var scopeList = [scope].concat(scopes);
        var trimText = text.trim();
        if (!filters) {
            for (var i = 0, obj; obj = scopeList[i++]; ) {
                if (obj.hasOwnProperty(trimText)) {
                    target = obj; //如果能在作用域上直接找到,我们就不需要eval了
                    break;
                }
            }
        }
        if (target) {
            updateView = function() {
                callback(target[trimText]);
            };
        } else {
            updateView = function() {
                var fn = data.compileFn;
                if (typeof fn === "function") {
                    val = fn.apply(fn, data.compileArgs || []);
                } else {
                    if (tokens) {
                        var val = tokens.map(function(obj) {
                            return obj.expr ? parseExpr(obj.value, scopeList, data) : obj.value;
                        }).join("");
                    } else {
                        val = parseExpr(text, scopeList, data);
                    }
                }
                callback(val);
            };
        }
        updateView.toString = function() {
            return "eval(" + text + ")";
        };//方便调试
        updateView.element = data.element;
        Publish[expando] = updateView;
        openComputedCollect = true;
        updateView();
        openComputedCollect = false
        delete Publish[expando];
    }

    function fixEvent(event) {
        var target = event.target = event.srcElement;
        event.which = event.charCode != null ? event.charCode : event.keyCode;
        event.timeStamp = new Date - 0;
        if (/mouse|click/.test(event.type)) {
            var doc = target.ownerDocument || document;
            var box = doc.compatMode === "BackCompat" ? doc.body : doc.documentElement;
            event.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0);
            event.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0);
        }
        event.preventDefault = function() { //阻止默认行为
            event.returnValue = false;
        };
        event.stopPropagation = function() { //阻止事件在DOM树中的传播
            event.cancelBubble = true;
        };
        return event
    }
    var bindingHandlers = avalon.bindingHandlers = {
        //跳过流程绑定
        skip: function() {
            arguments[3].stopBinding = true;
        },
        "if": function(data, scope, scopes) {
            var element = data.element;
            var fragment = element.ownerDocument.createDocumentFragment();
            watchView(data.value, scope, scopes, data, function(val) {
                if (val) {
                    while (fragment.firstChild) {
                        element.appendChild(fragment.firstChild);
                    }
                } else {
                    while (element.firstChild) {
                        fragment.appendChild(element.firstChild);
                    }
                }
            });
        },
        on: function(data, scope, scopes) {
            var element = data.element;
            watchView(data.value, scope, scopes, data, function(fn) {
                var type = data.args && data.args[0];
                if (type && typeof fn === "function") { //第一种形式
                    element.$scope = scope;
                    element.$scopes = scopes;
                    avalon.bind(element, type, function(e) {
                        e = e && e.timeStamp ? e : fixEvent(event);//修正IE的参数  
                        fn.call(element, e)
                    });
                }
            });
        },
        //抽取innerText中插入表达式，置换成真实数据放在它原来的位置
        //<div>{{firstName}} + java</div>，如果model.firstName为ruby， 那么变成
        //<div>ruby + java</div>
        text: function(data, scope, scopes) {
            var node = data.node;
            watchView(data.value, scope, scopes, data, function(val) {
                node.nodeValue = val;
            });
        },
        //控制元素显示或隐藏
        visible: function(data, scope, scopes) {
            var element = data.element;
            watchView(data.value, scope, scopes, data, function(val) {
                element.style.display = val ? "block" : "none";
            });
        },
        //这是一个字符串属性绑定的范本, 方便你在title, alt,  src, href添加插值表达式
        //<a href="{{url.hostname}}/{{url.pathname}}.html">
        href: function(data, scope, scopes) {
            //如果没有则说明是使用ng-href的形式
            var text = data.value.trim();
            var node = data.node;
            var simple = node.name.indexOf(prefix) === 0;
            var name = data.type;
            if (!simple && /^\{\{([^}]+)\}\}$/.test(text)) {
                simple = true;
                text = RegExp.$1;  
            }
            watchView(text, scope, scopes, data, function(val) {
                data.element[name] = val;
            }, simple ? null : scanExpr(data.value));
        },
        //这是一个布尔属性绑定的范本，布尔属性插值要求整个都是一个插值表达式，用{{}}包起来
        //布尔属性在IE下无法取得原来的字符串值，变成一个布尔，因此需要用ng-disabled
        disabled: function(data, scope, scopes) {
            var element = data.element,
                    name = data.type,
                    propName = propMap[name] || name;
            watchView(data.value, scope, scopes, data, function(val) {
                element[propName] = !!val;
            });
        },
        //切换类名，有三种形式
        //1、ms-class-xxx="flag" 根据flag的值决定是添加或删除类名xxx 
        //2、ms-class=obj obj为一个{xxx:true, yyy:false}的对象，根据其值添加或删除其键名
        //3、ms-class=str str是一个类名或多个类名的集合，全部添加
        //http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
        "class": function(data, scope, scopes) {
            var element = data.element;
            watchView(data.value, scope, scopes, data, function(val) {
                if (data.args) { //第一种形式
                    var classList = data.args.join(" ");
                    if (val) {
                        avalon.addClasses(element, classList);
                    } else {
                        avalon.removeClasses(element, classList);
                    }
                } else if (typeof val === "string") {
                    avalon.addClasses(element, val);
                } else if (val && typeof val === "object") {
                    forEach(val, function(cls, flag) {
                        if (flag) {
                            avalon.addClass(element, cls);
                        } else {
                            avalon.removeClass(element, cls);
                        }
                    });
                }
            });
        },
        selecting: function fn(data, scope, scopes) {
            var element = data.element;
            if (element.tagName !== "SELECT") {
                avalon.error("options绑定只能绑在SELECT元素");
            }
            watchView(data.value, scope, scopes, data, function(val) {
                if (Array.isArray(val)) {
                    setTimeout(function() {
                        setSelectVal(element, val);
                        avalon.bind(element, "change", function() {
                            var array = getSelectVal(element);
                            val.clear();
                            val.push.apply(val, array);
                        });
                    }, 30); //必须等于options绑定渲染完
                } else {
                    avalon.error("selectedOptions绑定必须对应一个字符串数组");
                }
            });
        },
        options: function(data, scope, scopes) {
            var select = data.element;
            if (select.tagName !== "SELECT") {
                avalon.error("options绑定只能绑在SELECT元素");
            }
            while (select.length > 0) {
                select.remove(0);
            }
            watchView(data.value, scope, scopes, data, function(val) {
                if (Array.isArray(val)) {
                    nextTick(function() {
                        select.setAttribute(prefix + "each-option", data.value);
                        var op = new Option("{{option}}", "");
                        op.setAttribute("ms-value", "option");
                        select.options[0] = op;
                        avalon.scan(select);
                    });
                } else {
                    avalon.error("options绑定必须对应一个字符串数组");
                }
            });
        }
    };
    /*********************************************************************
     *                         model binding                               *
     **********************************************************************/
    //将模型中的字段与input, textarea的value值关联在一起
    var modelBinding = bindingHandlers.model = function(data, scope, scopes) {
        var element = data.element;
        var tagName = element.tagName;
        if (typeof modelBinding[tagName] === "function") {
            var array = [scope].concat(scopes);
            var name = data.node.value,
                    model;
            array.forEach(function(obj) {
                if (!model && obj.hasOwnProperty(name)) {
                    model = obj;
                }
            });
            model = model || {};
            modelBinding[tagName](element, model, name);
        }
    };
    //如果一个input标签添加了model绑定。那么它对应的字段将与元素的value连结在一起
    //字段变，value就变；value变，字段也跟着变。默认是绑定input事件，
    //我们也可以使用ng-event="change"改成change事件
    modelBinding.INPUT = function(element, model, name) {
        if (element.name === void 0) {
            element.name = name;
        }
        var type = element.type;

        function updateModel() {
            model[name] = element.value;
        }

        function updateView() {
            var val = model[name];
            if (val !== element.value) {
                element.value = val === void 0 ? "" : val;
            }
        }
        if (/^(password|textarea|text)$/.test(type)) {
            var event = element.attributes[prefix + "event"] || {};
            event = event.value;
            if (event === "change") {
                avalon.bind(element, event, updateModel);
            } else {
                if (window.addEventListener) { //先执行W3C
                    element.addEventListener("input", updateModel, false);
                } else {
                    element.attachEvent("onpropertychange", updateModel);
                }
                if (window.VBArray && window.addEventListener) { //IE9
                    element.attachEvent("onkeydown", function(e) {
                        var key = e.keyCode;
                        if (key === 8 || key === 46) {
                            updateModel(); //处理回退与删除
                        }
                    });
                    element.attachEvent("oncut", updateModel); //处理粘贴
                }
            }
        } else if (type === "radio") {
            updateView = function() {
                element.checked = model[name] === element.value;
            };
            avalon.bind(element, "click", updateModel); //IE6-8
        } else if (type === "checkbox") {
            updateModel = function() {
                if (element.checked) {
                    avalon.Array.ensure(model[name], element.value);
                } else {
                    avalon.Array.remove(model[name], element.value);
                }
            };
            updateView = function() {
                element.checked = !!~model[name].indexOf(element.value);
            };
            avalon.bind(element, "click", updateModel); //IE6-8
        }
        Publish[expando] = updateView;
        updateView.element = element;
        updateView();
        delete Publish[expando];
    };
    modelBinding.SELECT = function(element, model, name) {
        var select = element;

        function updateModel() {
            model[name] = select.val();
        }

        function updateView() {
            setSelectVal(element, model[name]);
        }
        avalon.bind(element, "change", updateModel);
        Publish[expando] = updateView;
        updateView.element = element;
        updateView();
        delete Publish[expando];
    };
    modelBinding.TEXTAREA = modelBinding.INPUT;

    function getOptionVal(node) {
        var val = node.attributes.value;
        //黑莓手机4.7下val会返回undefined,但我们依然可用node.value取值
        return !val || val.specified ? node.value : node.text;
    }

    function getSelectVal(node, values, value) {
        var option, options = node.options,
                index = node.selectedIndex,
                one = node.type === "select-one" || index < 0,
                values = one ? null : [],
                max = one ? index + 1 : options.length,
                i = index < 0 ? max : one ? index : 0;
        for (; i < max; i++) {
            option = options[i];
            //旧式IE在reset后不会改变selected，需要改用i === index判定
            //我们过滤所有disabled的option元素，但在safari5下，如果设置select为disable，那么其所有孩子都disable
            //因此当一个元素为disable，需要检测其是否显式设置了disable及其父节点的disable情况
            if ((option.selected || i === index) && !option.disabled) {
                value = getOptionVal(option);
                if (one) {
                    return value;
                }
                //收集所有selected值组成数组返回
                values.push(value);
            }
        }
        return values;
    }

    function setSelectVal(node, values) {
        values = [].concat(values); //强制转换为数组
        for (var i = 0, el; el = node.options[i++]; ) {
            el.selected = !!~values.indexOf(getOptionVal(el));
        }
        if (!values.length) {
            node.selectedIndex = -1;
        }
    }
    /*********************************************************************
     *                         boolean preperty binding            *
     **********************************************************************/
    //与disabled绑定器 用法差不多的其他布尔属性的绑定器
    var bools = "autofocus,autoplay,async,checked,controls,declare,defer," +
            "contenteditable,ismap,loop,multiple,noshade,open,noresize,readonly,selected";
    bools.replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.disabled;
    });
    bindingHandlers.enabled = function(data, scope, scopes) {
        var element = data.element;
        watchView(data.value, scope, scopes, data, function(val) {
            element.disabled = !val;
        });
    };
     bindingHandlers.html = function(data, scope, scopes) {
        var element = data.element;
        watchView(data.value, scope, scopes, data, function(val) {
            element.innerHTML = (val || "")+"";
        });
    };
    /*********************************************************************
     *                         string preperty binding              *
     **********************************************************************/
    //与href绑定器 用法差不多的其他字符串属性的绑定器
    //建议不要直接在src属性上修改，这样会发出无效的请求，请使用ms-src
    "title, alt, src, value".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.href;
    });
    /*********************************************************************
     *                         常用事件 binding              *
     **********************************************************************/
    "dblclick,mouseout,click,mouseover,mousemove,mousedown,mouseup,keypress,keydown,keyup,blur,focus".
            replace(rword, function(name) {
        bindingHandlers[name] = function(data) {
            data.args = [name];
            bindingHandlers.on.apply(0, arguments);
        }
    });

    /*********************************************************************
     *                      each binding                              *
     **********************************************************************/
    bindingHandlers.each = function(data, scope, scopes, flags) {
        var parent = data.element;
        var scopeList = [scope].concat(scopes);
        var list = parseExpr(data.value, scopeList, data);
        var doc = parent.ownerDocument;
        var view = doc.createDocumentFragment();
        var comment = doc.createComment(list.$name);
        view.appendChild(comment);
        while (parent.firstChild) {
            view.appendChild(parent.firstChild);
        }
        data.view = view;
        data.collection = list;
        data.scopeList = scopeList;
        nextTick(function() {
            forEach(list, function(index, item) {
                addItemView(index, item, data);
            });
        })
        function updateListView(method, args, len) {
            nextTick(function() {
                var listName = list.$name;
                switch (method) {
                    case "push":
                        forEach(list.slice(len), function(index, item) {
                            addItemView(len + index, item, data);
                        });
                        break;
                    case "unshift":
                        list.insertBefore = parent.firstChild;
                        forEach(list.slice(0, list.length - len), function(index, item) {
                            addItemView(index, item, data);
                        });
                        resetIndex(parent, listName);
                        delete list.insertBefore;
                        break;
                    case "pop":
                        var node = findIndex(parent, listName, len - 1);
                        if (node) {
                            removeItemView(node, listName);
                        }
                        break;
                    case "shift":
                        removeItemView(parent.firstChild, listName);
                        resetIndex(parent, listName);
                        break;

                    case "splice":
                        var start = args[0],
                                second = args[1],
                                adds = [].slice.call(args, 2);
                        var deleteCount = second >= 0 ? second : len - start;
                        var node = findIndex(parent, listName, start);
                        if (node) {
                            removeItemViews(node, listName, deleteCount);
                            resetIndex(parent, listName);
                            if (adds.length) {
                                node = findIndex(node, listName, start);
                                list.insertBefore = node;
                                forEach(adds, function(index, item) {
                                    addItemView(index, item, data);
                                });
                                resetIndex(parent, listName);
                                delete list.insertBefore;
                            }
                        }
                        break;
                    case "clear":
                        while (parent.firstChild) {
                            parent.removeChild(parent.firstChild);
                        }
                        break;
                    case "update":
                        while (parent.firstChild) {
                            parent.removeChild(parent.firstChild);
                        }
                        forEach(list, function(index, item) {
                            addItemView(index, item, data);
                        });
                        break;
                }
            })
        }
        if ((list || {}).isCollection) {
            list[subscribers].push(updateListView);
        }
    };
    //找到目标视图最开头的那个注释节点
    //<!--xxx1--><tag><tag><text><!--xxx2--><tag><tag><text><!--xxx3--><tag><tag><text>
    // 假若 index == 2, 返回<!--xxx2-->
    function findIndex(elem, listName, index) {
        for (var node = elem.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === 8 && (node.nodeValue === listName + index)) {
                return node;
            }
        }
    }

    //重置所有路标
    function resetIndex(elem, name) {
        var index = 0;
        for (var node = elem.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === 8) {
                if (node.nodeValue.indexOf(name) === 0) {
                    if (node.nodeValue !== name + index) {
                        node.nodeValue = name + index;
                        var indexName = node.$indexName;
                        node.$scope[indexName] = index;
                    }
                    index++;
                }
            }
        }
    }
    //为子视图创建一个ViewModel
    function createItemModel(index, item, list, args) {
        var itemName = args[0] || "$data";
        var indexName = args[1] || "$index";
        var removeName = args[2] || "$remove";
        var source = {};
        source[indexName] = index;
        source[itemName] = {
            get: function() {
                return item;
            }
        };
        source[removeName] = function() {
            list.remove(item);
            return item;
        };
        return modelFactory(source);
    }

    function addItemView(index, item, data) {
        var scopeList = data.scopeList;
        var collection = data.collection;
        var parent = data.element;
        var doc = parent.ownerDocument;
        var textNodes = [];
        var $scope = createItemModel(index, item, collection, data.args);
        for (var node = data.view.firstChild; node; node = node.nextSibling) {
            var clone = node.cloneNode(true);
            if (collection.insertBefore) {//必须插入DOM树,否则下为注释节点添加自定义属性会失败
                parent.insertBefore(clone, collection.insertBefore);
            } else {
                parent.appendChild(clone);
            }
            if (clone.nodeType === 1) {
                scanTag(clone, $scope, scopeList, doc); //扫描元素节点
            } else if (clone.nodeType === 3) {
                textNodes.push(clone); //插值表达式所在的文本节点会被移除,创建循环中断(node.nextSibling===null)
            } else if (clone.nodeType === 8) {
                clone.nodeValue = node.nodeValue + "" + index;
                var indexName = data.args[1] || "$index";
                clone.$indexName = indexName;
                clone.$scope = $scope;
                clone.$view = doc.createDocumentFragment();
            }

        }
        for (var i = 0; node = textNodes[i++]; ) {
            scanText(node, $scope, scopeList, doc); //扫描文本节点
        }
    }

    //将上面的<!--xxx2--><tag><tag><text>放进文档碎片中返回
    function removeItemView(node, listName) {
        var nodes = [node];
        var view = node.$view;
        for (var check = node.nextSibling; check; check = check.nextSibling) {
            //遇到下个路标时就断开
            if (check.nodeType === 8 && check.nodeValue.indexOf(listName) === 0) {
                break
            }
            nodes.push(check);
        }
        for (var i = 0; node = nodes[i++]; ) {
            view.appendChild(node);
        }
        return [view, check];//返回被移除的文档碎片及下一个路标
    }
    //移除each中的多个子视图,返回它们对应的文档碎片集合

    function removeItemViews(node, listName, number) {
        var views = [];
        do {
            var array = removeItemView(node, listName);
            if (array[1]) {
                views.push(array[0]);
                node = array[1];
            } else {
                break
            }
        } while (views.length !== number);
        return views;
    }
    /*********************************************************************
     *                 与each绑定息息相关的 Collection类              *
     **********************************************************************/

    function Collection(list) {
        var collection = list.map(function(val) {
            return val && typeof val === "object" ? modelFactory(val) : val;
        });
        collection.$name = modleID();
        collection[subscribers] = [];
        var dynamic = modelFactory({
            length: list.length
        });

        "push,pop,shift,unshift,splice".replace(rword, function(method) {
            var nativeMethod = Array.prototype[method];
            collection[method] = function() {
                var len = this.length;
                var args = [].slice.call(arguments);
                if (/push|unshift|splice/.test(method)) {
                    args = args.map(function(el) {
                        if (el && typeof el === "object" && !el.hasOwnProperty("$id")) {
                            return modelFactory(el);
                        } else {
                            return el;
                        }
                    });
                }
                var ret = nativeMethod.apply(this, args);
                notifySubscribers(this, method, args, len);
                dynamic.length = this.length;
                return ret;
            };
        });
        "sort,reverse".replace(rword, function(method) {
            var nativeMethod = Array.prototype[method];
            collection[method] = function() {
                var isComplex = typeof this[0] === "object";
                var before = isComplex ? this.map(function(obj) {
                    return obj.$id;
                }).join("") : this.join("");
                var ret = nativeMethod.apply(this, arguments);
                var after = isComplex ? this.map(function(obj) {
                    return obj.$id;
                }).join("") : this.join("");
                if (before !== after) {
                    notifySubscribers(this, "update", []);
                }
                return ret;
            };
        });
        collection.isCollection = true;
        collection.clear = function() {
            this.length = 0;
            notifySubscribers(this, "clear", []);
            dynamic.length = 0;
            return this;
        };
        collection.sortBy = function(fn, scope) {
            var ret = avalon.Array.sortBy(this, fn, scope);
            notifySubscribers(this, "sort", []);
            return ret;
        };
        collection.contains = function(el) {
            return this.indexOf(el) !== -1;
        };
        collection.ensure = function(el) {
            if (!this.contains(el)) {
                this.push(el);
            }
            return this;
        };
        collection.update = function() { //强制刷新页面
            notifySubscribers(this, "update", []);
            return this;
        };
        collection.size = function() {
            return dynamic.length;
        };
        collection.remove = function(item) { //移除第一个等于给定值的元素
            var index = this.indexOf(item);
            if (index >= 0) {
                this.removeAt(index);
            }
        };
        collection.removeAt = function(index) { //移除指定索引上的元素
            if (index >= 0 && (index % 1 === 0)) {
                this.splice(index, 1);//DOM操作非常重,因此只有非负整数才删除
            }
        };
        collection.removeAll = function(all) { //移除指定索引上的元素
            if (Array.isArray(all)) {
                all.forEach(function(el) {
                    collection.remove(el);
                });
            } else if (typeof all === "function") {
                for (var i = this.length - 1; i >= 0; i--) {
                    var el = this[i];
                    if (all(el, i)) {
                        this.splice(i, 1);
                    }
                }
            } else {
                this.clear();
            }
        };

        return collection;
    }
    /*********************************************************************
     *                            Filters                              *
     **********************************************************************/
    avalon.filters = {
        uppercase: function(str) {
            return str.toUpperCase();
        },
        lowercase: function(str) {
            return str.toLowerCase();
        },
        truncate: function(target, length, truncation) {
            //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
            length = length || 30;
            truncation = truncation === void(0) ? "..." : truncation;
            return target.length > length ? target.slice(0, length - truncation.length) + truncation : String(target);
        },
        camelize: function(target) {
            //转换为驼峰风格
            if (target.indexOf("-") < 0 && target.indexOf("_") < 0) {
                return target; //提前判断，提高getStyle等的效率
            }
            return target.replace(/[-_][^-_]/g, function(match) {
                return match.charAt(1).toUpperCase();
            });
        },
        escape: function(target) {
            //将字符串经过 html 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt;
            return target.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        },
        currency: function(number, symbol) {
            symbol = symbol || "￥";
            return symbol + avalon.filters.number(number);
        },
        number: function(number, decimals, dec_point, thousands_sep) {
            //与PHP的number_format完全兼容
            //number	必需，要格式化的数字
            //decimals	可选，规定多少个小数位。
            //dec_point	可选，规定用作小数点的字符串（默认为 . ）。
            //thousands_sep	可选，规定用作千位分隔符的字符串（默认为 , ），如果设置了该参数，那么所有其他参数都是必需的。
            // http://kevin.vanzonneveld.net
            number = (number + "").replace(/[^0-9+\-Ee.]/g, '');
            var n = !isFinite(+number) ? 0 : +number,
                    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                    sep = thousands_sep || ",",
                    dec = dec_point || ".",
                    s = '',
                    toFixedFix = function(n, prec) {
                var k = Math.pow(10, prec);
                return '' + Math.round(n * k) / k;
            };
            // Fix for IE parseFloat(0.55).toFixed(0) = 0;
            s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
            if (s[0].length > 3) {
                s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
            }
            if ((s[1] || '').length < prec) {
                s[1] = s[1] || '';
                s[1] += new Array(prec - s[1].length + 1).join('0');
            }
            return s.join(dec);
        }
    }
    /*
     'yyyy': 4 digit representation of year (e.g. AD 1 => 0001, AD 2010 => 2010)
     'yy': 2 digit representation of year, padded (00-99). (e.g. AD 2001 => 01, AD 2010 => 10)
     'y': 1 digit representation of year, e.g. (AD 1 => 1, AD 199 => 199)
     'MMMM': Month in year (January-December)
     'MMM': Month in year (Jan-Dec)
     'MM': Month in year, padded (01-12)
     'M': Month in year (1-12)
     'dd': Day in month, padded (01-31)
     'd': Day in month (1-31)
     'EEEE': Day in Week,(Sunday-Saturday)
     'EEE': Day in Week, (Sun-Sat)
     'HH': Hour in day, padded (00-23)
     'H': Hour in day (0-23)
     'hh': Hour in am/pm, padded (01-12)
     'h': Hour in am/pm, (1-12)
     'mm': Minute in hour, padded (00-59)
     'm': Minute in hour (0-59)
     'ss': Second in minute, padded (00-59)
     's': Second in minute (0-59)
     'a': am/pm marker
     'Z': 4 digit (+sign) representation of the timezone offset (-1200-+1200)
     format string can also be one of the following predefined localizable formats:
     
     'medium': equivalent to 'MMM d, y h:mm:ss a' for en_US locale (e.g. Sep 3, 2010 12:05:08 pm)
     'short': equivalent to 'M/d/yy h:mm a' for en_US locale (e.g. 9/3/10 12:05 pm)
     'fullDate': equivalent to 'EEEE, MMMM d,y' for en_US locale (e.g. Friday, September 3, 2010)
     'longDate': equivalent to 'MMMM d, y' for en_US locale (e.g. September 3, 2010
     'mediumDate': equivalent to 'MMM d, y' for en_US locale (e.g. Sep 3, 2010)
     'shortDate': equivalent to 'M/d/yy' for en_US locale (e.g. 9/3/10)
     'mediumTime': equivalent to 'h:mm:ss a' for en_US locale (e.g. 12:05:08 pm)
     'shortTime': equivalent to 'h:mm a' for en_US locale (e.g. 12:05 pm)
     */
    function toInt(str) {
        return parseInt(str, 10);
    }
    avalon.filters.date = (function(formats) {
        function padNumber(num, digits, trim) {
            var neg = '';
            if (num < 0) {
                neg = '-';
                num = -num;
            }
            num = '' + num;
            while (num.length < digits)
                num = '0' + num;
            if (trim)
                num = num.substr(num.length - digits);
            return neg + num;
        }

        function dateGetter(name, size, offset, trim) {
            return function(date) {
                var value = date['get' + name]();
                if (offset > 0 || value > -offset)
                    value += offset;
                if (value === 0 && offset === -12) {
                    value = 12;
                }
                return padNumber(value, size, trim);
            };
        }

        function dateStrGetter(name, shortForm) {
            return function(date, formats) {
                var value = date['get' + name]();
                var get = uppercase(shortForm ? ('SHORT' + name) : name);
                return formats[get][value];
            };
        }

        function timeZoneGetter(date) {
            var zone = -1 * date.getTimezoneOffset();
            var paddedZone = (zone >= 0) ? "+" : "";
            paddedZone += padNumber(Math[zone > 0 ? 'floor' : 'ceil'](zone / 60), 2) + padNumber(Math.abs(zone % 60), 2);
            return paddedZone;
        }
        //取得上午下午

        function ampmGetter(date, formats) {
            return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1];
        }
        var DATE_FORMATS = {
            yyyy: dateGetter('FullYear', 4),
            yy: dateGetter('FullYear', 2, 0, true),
            y: dateGetter('FullYear', 1),
            MMMM: dateStrGetter('Month'),
            MMM: dateStrGetter('Month', true),
            MM: dateGetter('Month', 2, 1),
            M: dateGetter('Month', 1, 1),
            dd: dateGetter('Date', 2),
            d: dateGetter('Date', 1),
            HH: dateGetter('Hours', 2),
            H: dateGetter('Hours', 1),
            hh: dateGetter('Hours', 2, -12),
            h: dateGetter('Hours', 1, -12),
            mm: dateGetter('Minutes', 2),
            m: dateGetter('Minutes', 1),
            ss: dateGetter('Seconds', 2),
            s: dateGetter('Seconds', 1),
            // while ISO 8601 requires fractions to be prefixed with `.` or `,` 
            // we can be just safely rely on using `sss` since we currently don't support single or two digit fractions
            sss: dateGetter('Milliseconds', 3),
            EEEE: dateStrGetter('Day'),
            EEE: dateStrGetter('Day', true),
            a: ampmGetter,
            Z: timeZoneGetter
        };
        var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/,
                NUMBER_STRING = /^\d+$/;
        var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
        // 1        2       3         4          5          6          7          8  9     10      11

        function jsonStringToDate(string) {
            var match;
            if (match = string.match(R_ISO8601_STR)) {
                var date = new Date(0),
                        tzHour = 0,
                        tzMin = 0,
                        dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
                        timeSetter = match[8] ? date.setUTCHours : date.setHours;
                if (match[9]) {
                    tzHour = toInt(match[9] + match[10]);
                    tzMin = toInt(match[9] + match[11]);
                }
                dateSetter.call(date, toInt(match[1]), toInt(match[2]) - 1, toInt(match[3]));
                timeSetter.call(date, toInt(match[4] || 0) - tzHour, toInt(match[5] || 0) - tzMin, toInt(match[6] || 0), toInt(match[7] || 0));
                return date;
            }
            return string;
        }
        return function(date, format) {
            var text = '',
                    parts = [],
                    fn, match;
            format = format || 'mediumDate';
            format = formats[format] || format;
            if (typeof(date) === "string") {
                if (NUMBER_STRING.test(date)) {
                    date = toInt(date);
                } else {
                    date = jsonStringToDate(date);
                }
            }

            if (avalon.type(date) === "Number") {
                date = new Date(date);
            }

            if (avalon.type(date) === "Date") {
                return date;
            }

            while (format) {
                match = DATE_FORMATS_SPLIT.exec(format);
                if (match) {
                    parts = concat(parts, match, 1);
                    format = parts.pop();
                } else {
                    parts.push(format);
                    format = null;
                }
            }

            forEach(parts, function(value) {
                fn = DATE_FORMATS[value];
                text += fn ? fn(date, formats) : value.replace(/(^'|'$)/g, '').replace(/''/g, "'");
            });
            return text;
        };
    })({
        "AMPMS": {
            "0": "上午",
            "1": "下午"
        },
        "DAY": {
            "0": "星期日",
            "1": "星期一",
            "2": "星期二",
            "3": "星期三",
            "4": "星期四",
            "5": "星期五",
            "6": "星期六"
        },
        "MONTH": {
            "0": "1月",
            "1": "2月",
            "2": "3月",
            "3": "4月",
            "4": "5月",
            "5": "6月",
            "6": "7月",
            "7": "8月",
            "8": "9月",
            "9": "10月",
            "10": "11月",
            "11": "12月"
        },
        "SHORTDAY": {
            "0": "周日",
            "1": "周一",
            "2": "周二",
            "3": "周三",
            "4": "周四",
            "5": "周五",
            "6": "周六"
        },
        "SHORTMONTH": {
            "0": "1月",
            "1": "2月",
            "2": "3月",
            "3": "4月",
            "4": "5月",
            "5": "6月",
            "6": "7月",
            "7": "8月",
            "8": "9月",
            "9": "10月",
            "10": "11月",
            "11": "12月"
        },
        "fullDate": "y年M月d日EEEE",
        "longDate": "y年M月d日",
        "medium": "yyyy-M-d ah:mm:ss",
        "mediumDate": "yyyy-M-d",
        "mediumTime": "ah:mm:ss",
        "short": "yy-M-d ah:mm",
        "shortDate": "yy-M-d",
        "shortTime": "ah:mm"
    });


})()