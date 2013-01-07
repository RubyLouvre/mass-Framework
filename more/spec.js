//==================================================
// 测试模块v5
//==================================================
define(["$lang"], function($) {
    $.log("已加载spec v4模块", 7);
    var global = this,
    DOC = global.document,
    parseDiv = DOC.createElement("div"),
    timeDiv;

    //吞掉所有报错
    global.onerror = function() {
        return true;
    }
    /**
     * 取得元素节点
     * @param {String} id
     * @return {Node|Null}
     * @api private
     */

    function get(id) {
        return DOC.getElementById(id);
    }
    /**
     * 用于生成元素节点，注意第一层只能存在一个标签
     * @param {String} str
     * @return {Node}
     * @api private
     */

    function parseHTML(str) {
        parseDiv.innerHTML = str;
        return parseDiv.firstChild;
    }
    /**
     * 判定两个对象的值是否相似
     * @param {Any} a
     * @param {Any} b
     * @return {Boolean}
     * @api private
     */

    function isEqual(a, b) {
        if(a === b) {
            return true;
        } else if(a === null || b === null || typeof a === "undefined" || typeof b === "undefined" || $.type(a) !== $.type(b)) {
            return false;
        } else {
            switch($.type(a)) {
                case "String":
                case "Boolean":
                case "Number":
                case "Null":
                case "Undefined":
                    //处理简单类型的伪对象与字面值相比较的情况,如1 v new Number(1)
                    if(b instanceof a.constructor || a instanceof b.constructor) {
                        return a == b;
                    }
                    return a === b;
                case "NaN":
                    return isNaN(b);
                case "Date":
                    return +a === +b;
                case "NodeList":
                case "Arguments":
                case "Array":
                    var len = a.length;
                    if(len !== b.length) return false;
                    for(var i = 0; i < len; i++) {
                        if(!isEqual(a[i], b[i])) {
                            return false;
                        }
                    }
                    return true;
                default:
                    for(var key in b) {
                        if(!isEqual(a[key], b[key])) {
                            return false;
                        }
                    }
                    return true;
            }
        }
    }
    /**
     * 由于返回值是作为一个元素ID，而IE10无法捕获以中文命名的元素，因此将中文转换为对应unicode
     * @param {String} str
     * @return {String}
     * @api private
     */

    function escape(str) {
        return str.replace(/[\u4E00-\u9FA5]/g, function(s) {
            return String.charCodeAt(s);
        });
    }
    /**
     * 构筑测试系统的用户界面
     * @api private
     */

    function buildUI() {
        var html = ['<div id="mass-spec-result"><p class="mass-spec-summary">', '<span id="mass-spec-failures" title="0">0</span>&nbsp;failures&emsp;', '<span id="mass-spec-errors" title="0">0</span>&nbsp;errors&emsp;', '<span id="mass-spec-done" title="0">0</span>%&nbsp;done&emsp;', '<span id="mass-spec-time" title="0">0</span>ms&nbsp;</p>', '<p class="mass-spec-summary">', global.navigator.userAgent, '</p><div id="mass-spec-cases"><div id="loading">正在加载测试数据中，请耐心等特</div></div></div>'];
        //div#mass-spec-result为整个系统的容器
        //div#mass-spec-summary用于放置各种统计
        //div#mass-spec-cases用于放置测试模块
        $.log("当DOM树建完之时，开始构筑测试系统的外廓")
        DOC.body.appendChild(parseHTML(html.join("")));
    }
    /**
     * 一个断言类
     * @param {Any} actual
     * @return {String} id
     * @return {Number} index
     * @return {Expect}
     * @api private
     */

    function Expect(actual, id, index) {
        this.actual = actual;
        var node = DOC.createElement("li")
        this.node = Expect[id].node.appendChild(node); //节点
        this.index = index; //当前测试模块的总数
        this.count = Expect[id].count++; //当前模块的个数
        this.id = id;
    }

    $.mix(Expect, {
        //刷新timeDiv的属性，显示总共花了多长时间跑完测试
        refreshTime: function() {
            timeDiv = timeDiv || get("mass-spec-time");
            var duration = parseInt(timeDiv.title, 10) + (new Date - Expect.now);
            timeDiv.title = duration;
            timeDiv.innerHTML = duration;
        },
        //上面方法的内部实现,比较真伪,并渲染结果到页面
        prototype: {
            _should: function(method, expected, threshold) {
                var actual = this.actual;
                var bool = false;
                var length = arguments.length;
                var last = arguments[length - 1];
                var elem = this.node;
                if((length > 2 || method == "ok" || method == "ng")&& (typeof last == "string")) {
                    elem.innerHTML = last;
                }
                switch(method) {
                    case "ok":
                        //布尔真测试
                        bool = actual === true;
                        expected = true;
                        break;
                    case "ng":
                        //布尔非测试
                        bool = actual === false;
                        expected = false;
                        break;
                    case "type":
                        bool = $.type(actual, expected);
                        break;
                    case "eq":
                        //同一性真测试
                        bool = actual == expected;
                        break;
                    case "near":
                        //判定两个数字是否相近
                        return Math.abs(parseFloat(actual) - parseFloat(expected)) <= (threshold | 0);
                        break;
                    case "not":
                        //同一性非测试
                        bool = actual != expected;
                        break;
                    case "same":
                        //判定结果是否与expected相似(用于数组或对象或函数等复合类型)
                        bool = isEqual(actual, expected);
                        break
                    case "property":
                        //判定目标值是否包含prop属性
                        bool = Object.prototype.hasOwnProperty.call(actual, expected);
                        break;
                    case "match":
                        //判定回调是否返回真
                        bool = expected(actual);
                        break;
                    case "contains":
                        //判定目标值是否包含el这个元素(用于数组或类数组)
                        for(var i = 0, n = actual.length; i < n; i++) {
                            if(actual === expected) {
                                bool = true;
                                break;
                            }
                        }
                        break;
                    case "log":
                        bool = "";
                        if(elem) {
                            elem.className = "mass-spec-log";
                            elem.appendChild(parseHTML('<form class="mass-spec-diff"><pre>' + $.dump(actual) + '</pre></form>'));
                        }
                        break;
                }

                //修改统计栏的数值
                var done = get("mass-spec-done");
                var errors = get("mass-spec-errors");
                var failures = get("mass-spec-failures");
                if(typeof bool === "boolean") {
                    elem.innerHTML = elem.innerHTML.replace(/^[\u2714\u2716] /i, "");
                    elem.innerHTML = (bool ? "\u2714" : "\u2716") + elem.innerHTML
                    if(!bool) { //如果没有通过
                        this.status = "unpass";
                        failures.innerHTML = ++failures.title; //更新出错栏的数值
                        if(elem) {
                            elem.className = "mass-assert-unpass";
                            var html = ['<form class="mass-spec-diff clearfix">', '<div>actual:<pre title="actual">', $.type(actual), " : ", $.dump(actual), '</pre></div>', '<div>expected:<pre title="expected">', $.type(expected), " : " + $.dump(expected), '</pre></div>', '</form>'];
                            elem.appendChild(parseHTML(html.join('')));
                        }
                    }
                    done.title++;
                    //更新总数栏的数值
                    done.innerHTML = (((done.title - errors.title - failures.title) / done.title) * 100).toFixed(0);
                    return bool;
                }

            }
        }
    });
    "ok, ng, log, eq, near, match, type, not, property, contains, same".replace($.rword, function(method) {
        Expect.prototype[method] = function() {
            var args = $.slice(arguments);
            args.unshift(method);
            return this._should.apply(this, args);
        }
    })
    //用于收起或展开详细测试结果
    $.bind(DOC, "click", function(e) {
        var target = e.target || e.srcElement;
        var el = target.parentNode;
        if(target.tagName === "A" && el.className === "mass-spec-slide") {
            var parent = el.parentNode;
            if(parent.className == "mass-spec-case") { //用于切换详情面板
                var ul = parent.getElementsByTagName("ul")[0];
                var display = ul.style.display;
                ul.style.display = display === "none" ? "" : "none";
            }
        }
    });
    /**
     * 返回一个断言实例，后接ok, ng, log, eq, match, type等方法判定真伪
     * @param {Any} actual
     * @return {String} id
     * @return {Expect}
     * @api public
     */
    var ids = {};
    global.expect = function(actual, id) {
        id = id || arguments.callee.caller.arguments[0];
        if(id in ids) {
            ids[id] = 0;
        } else {
            ids[id]++;
        }
        return new Expect(actual, id, ids[id]);
    };

    /**
     * 添加一个测试模块，里面包含你所有要测试的方法的断言
     * @param {String} title 模块名
     * @return {Object} asserts 一个函数对象
     * @api public
     */
    global.describe = function(title, asserts) {
        var escaped = escape(title);
        //domReay之后立即构建用户界面，并执行测试，显示测试结果
        $.require("ready", function() {
            //当前模块的名字
            var describeName = "mass-spec-" + escaped;
            //如果还没有创建用户界面，创建用户界面
            if(!get("mass-spec-cases")) {
                buildUI();
            }
            //如果还没有创建当前模块的显示面板，则创建相应面板
            if(!get(describeName)) {
                /** =================每个模块的显示面板大概是如下样子===============
                <div class="mass-spec-case" id="mass-spec-$.js">
                   <p><a href="javascript:void(0)">JS文件名字</a></p>
                   <ul style="display: none;" class="mass-spec-detail">
                   测试结果
                         <li id="方法名(即asserts对象里面的每个键名)" class="通过|不通过|出错">
                            方法名
                            <ol>
                               <li>expect语句</li>
                               <li>expect语句</li>
                               <li>expect语句</li>
                               ...
                            </ol>
                        </li>
                   </ul>
                </div>
                 */
                var html = ['<div id="#{0}" class="mass-spec-case">', '<p class="mass-spec-slide"><a ' + (!"1" [0] ? 'href="javascript:void(0);"' : "") + '>#{1}</a></p>', '<ul class="mass-spec-detail" style="display:none;"></ul></div>'].join('');
                get("mass-spec-cases").appendChild(parseHTML($.format(html, describeName, title)));
            }
            //取得测试对象中的所有方法名
            var methods = Object.keys(asserts),
            name;

            function runTest() {
                if((name = methods.shift())) {
                    //对得当前测试方法（里面包含许多断言）
                    var method = asserts[name]
                    //取得当前测试方法对应的DOM ID
                    var methodId = "mass-spec-case-" + name.replace(/\./g, "-");
                    //移除加载显示条
                    if(!Expect.removeLoading) {
                        var loading = get("loading");
                        loading.parentNode.removeChild(loading);
                        Expect.removeLoading = 1;
                    }
                    //如果还没有创建当前方法的显示面板，则创建相应面板（DIV）
                    if(!get(methodId)) {
                        //取得方法UI元素,它是可以通过其previousSiblingElement来控制展开或折叠
                        var parentNode = get(describeName).getElementsByTagName("ul")[0];
                        var node = parseHTML($.format('<li class="method-parent" id="#{0}">#{1}<ol class="method"></ol></li>', methodId, name));
                        /** =================每个方法的显示面板大概是如下样子===============
                        <li id="方法名(即asserts对象里面的每个键名)" class="通过|不通过|出错">
                            方法名
                            <ol>
                               <li>expect语句</li>
                               <li>expect语句</li>
                               <li>expect语句</li>
                               ...
                            </ol>
                        </li>*/
                        parentNode.appendChild(node);
                    }
                    node = get(methodId).getElementsByTagName("ol")[0]; //对应一个OL元素
                    Expect.now = new Date;
                    var bag = Expect[escaped + "#" + name] = {
                        node: node,
                        status: "pass",
                        count: 0
                    }
                    try {
                        method(escaped + "#" + name); //执行当前方法，从而执行它里面的断言
                    } catch(err) {
                        $.log("error : " + err.message, true);
                        bag.status = "error";
                        var lis = node.getElementsByTagName("li")
                        var el = lis[lis.length - 1];
                        if(el) {
                            el.appendChild(parseHTML('<form class="mass-spec-diff"><pre>' + err + '</pre></form>'));
                            el.className = "mass-assert-error"; //高亮这一行,变成深红色
                        }
                        var errors = get("mass-spec-errors");
                        //修正异常栏的数值
                        errors.innerHTML = ++errors.title;
                    }
                    //添加对应的类名，显示成功与否
                    if(node.className.indexOf("mass-asserts-") == -1) {
                        node.className += " mass-asserts-" + bag.status;
                    }
                    //更新测试所花的时间
                    Expect.refreshTime();
                    //前面必须用window来显式调用,否则会在safari5中
                    //报INVALID_ACCESS_ERR: DOM Exception 15: A parameter or an operation
                    // was not supported by the underlying object.错误
                    global.setTimeout(runTest);
                }
            }
            runTest();
        });
    }

    return $;
});
//2011.8.9    增加getUnpassExpect函数,用于取得没有通过的expect并显示出来
//2011.10.26  优化format与quote
//2011.10.27   runTest添加参数，用于等特一定做量的测试模块都加载完毕才执行
//2011.10.31 去掉deferred模块的依赖，依靠ready列队自行添加测试的模块
//2012.1.28  升级到v3，大大增强错误定位的能力
//2012.4.30  升级到v4 去掉 Expect.Client,Expect.PASS,Expect.index,Expect.Class等属性
//2012.7.31 确保测试的主体轮廓被先添加到页面
//2012.1.4 升级到v5，不再从fn.toString抽取expect语句