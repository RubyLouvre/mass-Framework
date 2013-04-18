define("mvvm", "$event,$css,$attr".split(","), function($) {

    var prefix = "ms-";
    var avalon = $.avalon = {
        models: {},
        obsevers: {},
        filters: {
            uppercase: function(str) {
                return str.toUpperCase();
            },
            lowercase: function(str) {
                return str.toLowerCase();
            },
            number: function(str) {
                return isFinite(str) ? str : "";
            },
            aaa: function(str) {
                return str + "AAA"
            }
        }
    };
    var blank = " ";
    var obsevers = avalon.obsevers
    var Publish = {}; //将函数放到发布对象上，让依赖它的函数
    var expando = new Date - 0;
    var subscribers = "$" + expando;
    /*********************************************************************
     *                            View                                    *
     **********************************************************************/
    var regOpenTag = /([^{]*)\{\{/;
    var regCloseTag = /([^}]*)\}\}/;
    function hasExpr(value) {
        var index = value.indexOf("{{");
        return index !== -1 && index < value.indexOf("}}");
    }
    function forEach(obj, fn) {
        if (obj) {//不能传个null, undefined进来
            var isArray = isFinite(obj.length), i = 0
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
                var fn = data.compileFn
                if (typeof fn === "function") {
                    val = fn.apply(fn, data.compileArgs || []);
                } else {
                    if (tokens) {
                        var val = tokens.map(function(obj) {
                            return obj.expr ? evalExpr(obj.value, scopeList, data) : obj.value;
                        }).join("");
                    } else {
                        val = evalExpr(text, scopeList, data);
                    }
                }
                callback(val);
            };
        }
        Publish[ expando ] = updateView;
        updateView();
        delete  Publish[ expando ];
    }
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
        if (window.dispatchEvent) {//判定是否IE9-11或者为标准浏览器
            ok = e instanceof ReferenceError;
        } else {
            ok = e instanceof TypeError;
        }
        if (ok) {
            var variableName = e.message.split(/\s+/).shift();//取得未定义的变量名
            if (variableName.charAt(0) === "'" || variableName.charAt(0) === '"') {
                //处理IE下的引号
                variableName = variableName.slice(1, variableName.length - 1);
            }
            for (var i = 0, scope; scope = scopeList[i++]; ) {
                if (scope.hasOwnProperty(variableName)) {
                    var modelName = scope.$modelName + random;
                    if (names.indexOf(modelName) === -1) {
                        names.push(modelName);
                        args.push(scope)
                    }
                    //这里实际还要做更严格的处理
                    var reg = new RegExp("(^|[^\\w\\u00c0-\\uFFFF_])(" + escapeRegExp(variableName) + ")($|[^\\w\\u00c0-\\uFFFF_])", "g");
                    return  text.replace(reg, function(a, b, c, d) {
                        return b + modelName + "." + c + d;//添加作用域
                    });
                }
            }

        }
    }
    var doubleQuotedString = /"([^\\"\n]|\\.)*"/g;
    var singleQuotedString = /'([^\\'\n]|\\.)*'/g;
    function evalExpr(text, scopeList, data) {
        var names = [], args = [], random = new Date - 0, val;
        if (true) {
            //取得模块的名字
            scopeList.forEach(function(scope) {
                var scopeName = scope.$modelName + random;
                if (names.indexOf(scopeName) === -1) {
                    names.push(scopeName);
                    args.push(model);
                }
            });
            text = "var ret" + random + " = " + text + "\r\n";
            for (var i = 0, name; name = names[i++]; ) {
                text = "with(" + name + "){\r\n" + text + "\r\n}\r\n";
            }
        } else {
            var single = random + 1;
            var double = single + 1;
            var singleHolder = [];
            var doubleHolder = [];
            var loop = true;
            //抽取掉所有字符串
            text = text.replace(singleQuotedString, function(a) {
                singleHolder.push(a);
                return single;
            }).replace(doubleQuotedString, function(b) {
                doubleHolder.push(b);
                return double;
            });
            do {//开始循环
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
                    text = text.replace(new RegExp(single, "g"), function() {
                        return singleHolder.shift();
                    });
                }
                if (doubleHolder.length) {
                    text = text.replace(new RegExp(double, "g"), function() {
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
            var textBuffer = [], fargs;
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

    var bindingHandlers = avalon.bindingHandlers = {
//将模型中的字段与input, textarea的value值关联在一起
        "model": function(data, scope, scopes) {
            var element = data.element;
            var tagName = element.tagName;
            if (typeof  modelBinding[tagName] === "function") {
                var array = [scope].concat(scopes);
                var name = data.node.value, model;
                array.forEach(function(obj) {
                    if (!model && obj.hasOwnProperty(name)) {
                        model = obj;
                    }
                });
                model = model || {};
                modelBinding[tagName](element, model, name);
            }
        },
        //抽取innerText中插入表达式，置换成真实数据放在它原来的位置
        //<div>{{firstName}} + java</div>，如果model.firstName为ruby， 那么变成
        //<div>ruby + java</div>
        "text": function(data, scope, scopes) {
            var node = data.node;
            watchView(data.value, scope, scopes, data, function(val) {
                node.nodeValue = val;
            });
        },
        //控制元素显示或隐藏
        "toggle": function(data, scope, scopes) {
            var element = $(data.element);
            watchView(data.value, scope, scopes, data, function(val) {
                element.toggle(!!val);
            });
        },
        //这是一个字符串属性绑定的范本, 方便你在title, alt,  src, href添加插值表达式
        //<a href="{{url.hostname}}/{{url.pathname}}.html">
        "href": function(data, scope, scopes) {
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
        //text.slice(2, text.lastIndexOf("}}"))
        "disabled": function(data, scope, scopes) {
            var element = data.element, name = data.type,
                    propName = $.propMap[name] || name;
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
            var element = $(data.element);
            watchView(data.value, scope, scopes, data, function(val) {
                if (data.args) {//第一种形式
                    element.toggleClass(data.args.join(""), !!val);
                } else if (typeof val === "string") {
                    element.addClass(val);
                } else if (val && typeof val === "object") {
                    forEach(val, function(cls, flag) {
                        if (flag) {
                            element.addClass(cls);
                        } else {
                            element.removeClass(cls);
                        }
                    });
                }
            });
        },
        //控制流程绑定
        "skip": function() {
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
        "each": function(data, scope, scopes, flags) {
            var args = data.args, itemName = args[0] || "$data", indexName = args[1] || "$index";
            var parent = data.element;
            var scopeList = [scope].concat(scopes);
            var list = evalExpr(data.value, scopeList, data);
            var doc = parent.ownerDocument;
            var fragment = doc.createDocumentFragment();
            while (parent.firstChild) {
                fragment.appendChild(parent.firstChild);
            }
            function updateListView(method, args, len) {
                var listName = list.name;
                switch (method) {
                    case "push":
                        $.each(args, function(index, item) {
                            updateView(len + index, item);
                        });
                        break;
                    case "unshift"  :
                        list.insertBefore = parent.firstChild;
                        $.each(args, function(index, item) {
                            updateView(index, item);
                        });
                        resetIndex(parent, listName);
                        delete list.insertBefore;
                        break;
                    case "pop":
                        var node = findIndex(parent, listName, len - 1);
                        if (node) {
                            removeView(parent, listName, node);
                        }
                        break;
                    case "shift":
                        removeView(parent, listName, 0, parent.firstChild);
                        resetIndex(parent, listName);
                        break;
                    case "clear":
                        while (parent.firstChild) {
                            parent.removeChild(parent.firstChild);
                        }
                        break;
                    case "splice":
                        var start = args[0], second = args[1], adds = [].slice.call(args, 2);
                        var deleteCount = second >= 0 ? second : len - start;
                        var node = findIndex(parent, listName, start);
                        if (node) {
                            removeViews(parent, listName, node, deleteCount);
                            resetIndex(parent, listName);
                            if (adds.length) {
                                node = findIndex(parent, listName, start);
                                list.insertBefore = node;
                                $.each(adds, function(index, item) {
                                    updateView(index, item);
                                });
                                resetIndex(parent, listName);
                                delete list.insertBefore;
                            }
                        }
                        break;
                    case "reverse":
                    case "sort":
                        while (parent.firstChild) {
                            parent.removeChild(parent.firstChild);
                        }
                        $.each(list, function(index, item) {
                            updateView(index, item);
                        });
                        break;
                }
            }
            var isList = Array.isArray(list[ subscribers ] || {});
            if (isList) {
                list[ subscribers ].push(updateListView);
            }

            function updateView(index, item, clone, insertBefore) {
                var newScope = {}, textNodes = [];
                newScope[itemName] = item;
                newScope[indexName] = index;
                if (isList) {
                    var comment = doc.createComment(list.name + index);
                    if (list.insertBefore) {
                        parent.insertBefore(comment, list.insertBefore);
                    } else {
                        parent.appendChild(comment);
                    }
                }
                for (var node = fragment.firstChild; node; node = node.nextSibling) {
                    clone = node.cloneNode(true);
                    if (clone.nodeType === 1) {
                        scanTag(clone, newScope, scopeList, doc); //扫描元素节点
                    } else if (clone.nodeType === 3) {
                        textNodes.push(clone);
                    }
                    if (list.insertBefore) {
                        parent.insertBefore(clone, list.insertBefore);
                    } else {
                        parent.appendChild(clone);
                    }
                }
                for (var i = 0; node = textNodes[i++]; ) {
                    scanText(node, newScope, scopeList, doc); //扫描文本节点
                }
            }
            forEach(list, updateView);
            flags.stopBinding = true;
        }
    };
    //重置所有路标
    function resetIndex(elem, name) {
        var index = 0;
        for (var node = elem.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === 8) {
                if (node.nodeValue.indexOf(name) === 0) {
                    if (node.nodeValue !== name + index) {
                        node.nodeValue = name + index;
                    }
                    index++;
                }
            }
        }
    }
    function removeView(elem, name, node) {
        var nodes = [], doc = elem.ownerDocument, view = doc.createDocumentFragment();
        for (var check = node; check; check = check.nextSibling) {
            //如果到达下一个路标,则断开,将收集到的节点放到文档碎片与下一个路标返回
            if (check.nodeType === 8 && check.nodeValue.indexOf(name) === 0
                    && check !== node) {
                break
            }
            nodes.push(check);
        }
        for (var i = 0; node = nodes[i++]; ) {
            view.appendChild(node);
        }
        return [view, check];
    }
    function removeViews(elem, name, node, number) {
        var ret = [];
        do {
            var array = removeView(elem, name, node);
            if (array[1]) {
                node = array[1];
                ret.push(array[0]);
            } else {
                break
            }
        } while (ret.length !== number);
        return ret;
    }
    function findIndex(elem, name, target) {
        var index = 0;
        for (var node = elem.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === 8) {
                if (node.nodeValue.indexOf(name) === 0) {
                    if (node.nodeValue == name + target) {
                        return node;
                    }
                    index++;
                }
            }
        }
    }
    //循环绑定其他布尔属性
    var bools = "autofocus,autoplay,async,checked,controls,declare,defer,"
            + "contenteditable,ismap,loop,multiple,noshade,open,noresize,readonly,selected";
    bools.replace($.rword, function(name) {
        bindingHandlers[name] = bindingHandlers.disabled;
    });
    //建议不要直接在src属性上修改，因此这样会发出无效的请求，使用ms-src
    "title, alt, src".replace($.rword, function(name) {
        bindingHandlers[name] = bindingHandlers.href;
    });
    var modelBinding = bindingHandlers.model;
    //如果一个input标签添加了model绑定。那么它对应的字段将与元素的value连结在一起
    //字段变，value就变；value变，字段也跟着变。默认是绑定input事件，
    //我们也可以使用ng-event="change"改成change事件
    modelBinding.INPUT = function(element, model, name) {
        if (element.name === void 0) {
            element.name = name;
        }
        var type = element.type, ok;
        function updateModel() {
            model[name] = element.value;
        }
        function updateView() {
            element.value = model[name];
        }
        if (/^(password|textarea|text)$/.test(type)) {
            ok = true;
            updateModel = function() {
                model[name] = element.value;
            };
            updateView = function() {
                element.value = model[name];
            };
            var event = element.attributes[prefix + "event"] || {};
            event = event.value;
            if (event === "change") {
                $.bind(element, event, updateModel);
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
            ok = true;
            updateView = function() {
                element.checked = model[name] === element.value;
            };
            $.bind(element, "click", updateModel); //IE6-8
        } else if (type === "checkbox") {
            ok = true;
            updateModel = function() {
                if (element.checked) {
                    $.Array.ensure(model[name], element.value);
                } else {
                    $.Array.remove(model[name], element.value);
                }
            };
            updateView = function() {
                element.checked = !!~model[name].indexOf(element.value);
            };
            $.bind(element, "click", updateModel); //IE6-8
        }
        Publish[ expando ] = updateView;
        updateView();
        delete Publish[ expando ];
    };
    modelBinding.SELECT = function(element, model, name) {
        var select = $(element);
        function updateModel() {
            model[name] = select.val();
        }
        function updateView() {
            select.val(model[name]);
        }
        $.bind(element, "change", updateModel);
        Publish[ expando ] = updateView;
        updateView();
        delete Publish[ expando ];
    };
    modelBinding.TEXTAREA = modelBinding.INPUT;
    /*********************************************************************
     *                    Collection                                    *
     **********************************************************************/
    //http://msdn.microsoft.com/en-us/library/windows/apps/hh700774.aspx
    //http://msdn.microsoft.com/zh-cn/magazine/jj651576.aspx
    //Data bindings 数据／界面绑定
    //Compatibility 兼容其他
    //Extensibility 可扩充性
    //No direct DOM manipulations 不直接对DOM操作
    function Collection(list, name) {
        var collection = list.concat();
        collection[ subscribers ] = [];
        collection.name = "#" + name;
        String("push,pop,shift,unshift,splice,sort,reverse").replace($.rword, function(method) {
            var nativeMethod = collection[ method ];
            collection[ method ] = function() {
                var len = this.length;
                var ret = nativeMethod.apply(this, arguments);
                notifySubscribers(this, method, arguments, len);
                return ret;
            };
        });
        collection.clear = function() {
            this.length = 0;
            notifySubscribers(this, "clear", []);
            return this;
        };
        collection.sortBy = function(fn, scope) {
            var ret = $.Array.sortBy(this, fn, scope);
            notifySubscribers(this, "sort", []);
            return ret;
        };
        collection.ensure = function(el) {
            var len = this.length;
            var ret = $.Array.ensure(this, el);
            if (this.length > len) {
                notifySubscribers(this, "push", [el], len);
            }
            return ret;
        };
        collection.update = function() {//强制刷新页面
            notifySubscribers(this, "sort", []);
            return this;
        };
        collection.removeAt = function(index) {//移除指定索引上的元素
            this.splice(index, 1);
        };
        collection.remove = function(item) {//移除第一个等于给定值的元素
            var index = this.indexOf(item);
            if (index !== -1) {
                this.removeAt(index);
            }
        };
        return collection;
    }
    /*********************************************************************
     *                            Subscription                           *
     **********************************************************************/
    /*
     为简单起见，我们把双向绑定链分成三层， 顶层， 中层， 底层。顶层是updateView, updateListView等需要撷取底层的值来更新自身的局部刷新函数， 中层是监控数组与依赖于其他属性的计算监控属性，底层是监控属性。高层总是依赖于低层，但高层该如何知道它是依赖哪些底层呢？
     
     在emberjs中，作为计算监控属性的fullName通过property方法，得知自己是依赖于firstName, lastName。
     App.Person = Ember.Object.extend({
     firstName: null,
     lastName: null,
     
     fullName: function() {
     return this.get('firstName') +
     " " + this.get('lastName');
     }.property('firstName', 'lastName')
     });
     
     在knockout中，用了一个取巧方法，将所有要监控的属性转换为一个函数。当fullName第一次求值时，它将自己的名字放到一个地方X，值为一个数组。然后函数体内的firstName与lastName在自身求值时，也会访问X，发现上面有数组时，就放进去。当fullName执行完毕，就得知它依赖于哪个了，并从X删掉数组。
     var ViewModel = function(first, last) {
     this.firstName = ko.observable(first);
     this.lastName = ko.observable(last);
     
     this.fullName = ko.computed(function() {
     // Knockout tracks dependencies automatically. It knows that fullName depends on firstName and lastName, because these get called when evaluating fullName.
     return this.firstName() + " " + this.lastName();
     }, this);
     };
     详见 subscribables/observable.js subscribables/dependentObservable.js
     
     */
    //http://www.cnblogs.com/whitewolf/archive/2012/07/07/2580630.html
    function getSubscribers(accessor) {
        if (typeof accessor === "string") {
            return obsevers[accessor] || (obsevers[accessor] = []);
        } else {
            return accessor[ subscribers ];
        }
    }
    function collectSubscribers(accessor) {//收集依赖于这个域的订阅者
        if (Publish[ expando ]) {
            var list = getSubscribers(accessor);
            $.Array.ensure(list, Publish[ expando ]);//只有数组不存在此元素才push进去
        }
    }
    function notifySubscribers(accessor) {//通知依赖于这个域的订阅者更新自身
        var list = getSubscribers(accessor);
        if (list && list.length) {
            var args = [].slice.call(arguments, 1);
            var safelist = list.concat();
            for (var i = 0, fn; fn = safelist[i++]; ) {
                if (typeof fn === "function") {
                    fn.apply(0, args); //强制重新计算自身
                }
            }
        }
    }
    //http://www.cnblogs.com/whitewolf/archive/2013/04/16/3024843.html
    /*********************************************************************
     *                            Model                                   *
     **********************************************************************/
    $.model = function(name, obj) {
        name = name || "root";
        if (avalon.models[name]) {
            $.error('已经存在"' + name + '"模块');
        } else {
            var model = modelFactory(name, obj, $.skipArray || []);
            model.$modelName = name;
            return avalon.models[name] = model;
        }
    };
    var startWithDollar = /^\$/;
    function modelFactory(name, obj, skipArray) {
        var model = {}, first = [], second = [];
        forEach(obj, function(key, val) {
            //如果不在忽略列表内,并且没有以$开头($开头的属性名留着框架使用)
            if (skipArray.indexOf(key) === -1 && !startWithDollar.test(key)) {
                //相依赖的computed
                var accessor = name + key, old;
                if (Array.isArray(val) && !val[subscribers]) {
                    model[key] = Collection(val, accessor);
                } else if (typeof val === "object") {
                    if ("set" in val && Object.keys(val).length <= 2) {
                        Object.defineProperty(model, key, {
                            set: function(neo) {
                                if (typeof val.set === "function") {
                                    val.set.call(model, neo); //通知底层改变
                                } else {
                                    obj[key] = neo;
                                }
                                if (old !== neo) {
                                    old = neo;
                                    notifySubscribers(accessor); //通知顶层改变
                                }
                            },
                            //get方法肯定存在,那么肯定在这里告诉它的依赖,把它的setter放到依赖的订阅列表中
                            get: function() {
                                var flagDelete = false;
                                if (!obsevers[accessor]) {
                                    flagDelete = true;
                                    Publish[ expando ] = function() {

                                        notifySubscribers(accessor); //通知顶层改变
                                    };
                                    obsevers[accessor] = [];
                                }
                                old = val.get.call(model);
                                obj[name] = old;
                                if (flagDelete) {
                                    delete Publish[ expando ];
                                }
                                return old;
                            },
                            enumerable: true
                        });
                        second.push(key);
                    } else {

                    }
                } else if (typeof val !== "function") {
                    Object.defineProperty(model, key, {
                        set: function(neo) {
                            if (obj[key] !== neo) {
                                obj[key] = neo;
                                //通知中层,顶层改变
                                notifySubscribers(accessor);
                            }
                        },
                        get: function() {
                            //如果中层把方法放在Publish[ expando ]中
                            if (!model.$occoecatio) {//为了防止它在不合适的时候收集订阅者,添加$occoecatio标识让它瞎掉
                                collectSubscribers(accessor);
                            }
                            return obj[key];
                        },
                        enumerable: true
                    });
                    first.push(key);
                }
            }
        });
        first.forEach(function(key) {
            model[key] = obj[key];
        });
        second.forEach(function(key) {
            first = model[key];
        });
        return  model;
    }
    /*********************************************************************
     *                           Scan                                     *
     **********************************************************************/
    //扫描整个DOM树,最开始是从某个元素节点扫起
    function scanTag(elem, scope, scopes, doc) {
        scopes = scopes || [];
        var flags = {};
        scanAttr(elem, scope, scopes, flags); //扫描特点节点
        if (flags.stopBinding) {//是否要停止扫描
            return false;
        }
        if (flags.newScope) {//更换作用域， 复制父作用域堆栈，防止互相影响
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
            for (var i = 0; node = textNodes[i++]; ) {//延后执行
                scanText(node, scope, scopes, doc); //扫描文本节点
            }
        }
    }
    var stopScan = $.oneObject("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed,wbr,script,style".toUpperCase());
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
                        var filters = []
                        if (b.indexOf("|") > 0) {
                            b = b.replace(/\|\s*(\w+)\s*(\([^)]+\))?/g, function(c, d, e) {
                                filters.push(d + e)
                                return ""
                            });
                        }
                        tokens.push({
                            value: b,
                            expr: true,
                            filters: filters.length ? filters : void 0
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
                var isBinding = false, remove = false;
                if (attr.name.indexOf(prefix) !== -1) {//如果是以指定前缀命名的
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
                        node: attr,
                        remove: remove,
                        value: attr.nodeValue
                    });
                }
                if (!flags.newScope && type === "controller") {//更换作用域
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
            bindingHandlers[data.type]($.mix({}, data), scope, scopes, flags);
            if (data.remove) {//移除数据绑定，防止被二次解析
                data.element.removeAttribute(data.node.name);
            }
        });
    }

    function extractTextBindings(textNode, doc) {
        var bindings = [], tokens = scanExpr(textNode.nodeValue);
        if (tokens.length) {
            var fragment = doc.createDocumentFragment();
            while (tokens.length) {//将文本转换为文本节点，并替换原来的文本节点
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

    var model = $.model("app", {
        firstName: "xxx",
        lastName: "oooo",
        bool: false,
        array: [1, 2, 3, 4, 5, 6, 7, 8],
        select: "test1",
        color: "green",
        vehicle: ["car"],
        fullName: {
            set: function(val) {
                var array = val.split(" ");
                this.firstName = array[0] || "";
                this.lastName = array[1] || "";
            },
            get: function() {
                return this.firstName + " " + this.lastName;
            }
        }
    });
    $.model("son", {
        firstName: "yyyy"
    });
    $.model("aaa", {
        firstName: "6666"
    });
    scanTag(document.body, model, [], document);
    setTimeout(function() {
        model.firstName = "setTimeout";
        //  document.querySelector("#eee").firstChild.nextSibling.nodeValue = "!!!!!!!!!!!!"
    }, 2000);
    setTimeout(function() {
        model.array.reverse()
        model.firstName = "3333";
        model.lastName = "2333";
        //  console.log("xxxxxxxxxxxxxxxxx")

        //console.log(obsevers.applastName == obsevers.appfirstName)
    }, 3000);
});