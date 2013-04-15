define("mvvm", "$event,$css,$attr".split(","), function($) {

    var prefix = "ms-";
    var avalon = $.avalon = {
        models: {}
    };
    var blank = " ";
    var obsevers = {};
    var bridge = {};
    var expando = new Date - 0;
    var subscribers = "$" + expando;
    var regOpenTag = /([^{]*)\{\{/;
    var regCloseTag = /([^}]*)\}\}/;
    function hasExpr(value) {
        var index = value.indexOf("{{");
        return index !== -1 && index < value.indexOf("}}");
    }

    function evalExpr(scope, text, callback, tokens) {
        return function updateView( ) {
            var flagDelete = false, val;
            if (!updateView.checkDeps) {//在第一次执行时，将自己放到其依赖的订阅者列表中
                flagDelete = true;
                bridge[ expando ] = updateView;//它的依赖将在bridge中得到此方法
                updateView.checkDeps = true;
            }
            if (tokens) {
                val = tokens.map(function(obj) {
                    return obj.expr ? _evalExpr(scope, obj.value) : obj.value;
                }).join("");
            } else {
                val = _evalExpr(scope, text);
            }
            callback(val);
            if (flagDelete) {
                delete bridge[ expando ];
            }
        };
    }
    function _evalExpr(scope, text) {
        var names = [], args = [];
        $.each(scope, function(key, val) {
            names.push(key);
            args.push(val);
        });
        var fn = Function.apply(Function, names.concat(" return " + text));
        return  fn.apply(fn, args);
    }
    function extractExpr(value) {
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
                        tokens.push({
                            value: b,
                            expr: true
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
    avalon.bindings = {
        //将模型中的字段与input, textarea的value值关联在一起
        "model": function(data) {
            var element = data.element;
            var tagName = element.tagName;
            if (typeof  modelBinding[tagName] === "function") {
                modelBinding[tagName](model, element, data);
            }
        },
        //抽取innerText中插入表达式，置换成真实数据放在它原来的位置
        //<div>{{firstName}} + java</div>，如果model.firstName为ruby， 那么变成
        //<div>ruby + java</div>
        "text": function(data) {
            var node = data.node;
            var updateView = evalExpr(data.scope, data.value, function(val) {
                node.nodeValue = val;
            });
            updateView();
        },
        //控制元素显示或隐藏
        "toggle": function(data) {
            var element = $(data.element);
            var updateView = evalExpr(data.scope, data.value, function(val) {
                element.toggle(!!val);
            });
            updateView();
        },
        //这是一个字符串属性绑定的范本, 方便你在title, alt,  src, href添加插值表达式
        //<a href="{{url.hostname}}/{{url.pathname}}.html">
        "href": function(data) {
            //如果没有则说明是使用ng-href的形式
            var text = data.value.trim();
            var node = data.node;
            var simple = node.name.indexOf(prefix) === 0;
            var name = data.type;
            if (!simple && /^\{\{([^}]+)\}\}$/.test(text)) {
                simple = true;
                text = RegExp.$1;
            }
            var updateView = evalExpr(data.scope, text, function(val) {
                data.element[name] = val;
            }, simple ? null : extractExpr(data.value));
            updateView();
        },
        //这是一个布尔属性绑定的范本，布尔属性插值要求整个都是一个插值表达式，用{{}}包起来
        //布尔属性在IE下无法取得原来的字符串值，变成一个布尔，因此需要用ng-disabled
        //text.slice(2, text.lastIndexOf("}}"))
        disabled: function(data) {
            var element = data.element, name = data.type,
                    propName = $.propMap[name] || name;
            var updateView = evalExpr(data.scope, data.value, function(val) {
                element[propName] = !!val;
            });
            updateView();
        },
        //切换类名，有三种形式
        //1、ms-class-xxx="flag" 根据flag的值决定是添加或删除类名xxx 
        //2、ms-class=obj obj为一个{xxx:true, yyy:false}的对象，根据其值添加或删除其键名
        //3、ms-class=str str是一个类名或多个类名的集合，全部添加
        //http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
        "class": function(data) {
            var element = $(data.element);
            var updateView = evalExpr(data.scope, data.value, function(val) {
                if (data.args) {//第一种形式
                    element.toggleClass(data.args.join(""), !!val);
                } else if (typeof val === "string") {
                    element.addClass(val);
                } else if (val && typeof val === "object") {
                    $.each(val, function(cls, flag) {
                        if (flag) {
                            element.addClass(cls);
                        } else {
                            element.removeClass(cls);
                        }
                    });
                }
            });
            updateView();
        },
        //控制流程绑定
        "skip": function(data, directives) {
            directives.stopBinding = true;
        },
        "each": function(data, directives) {
            console.log(data);
            var args = data.args, itemName = args[0] || "$data", indexName = args[1] || "$index";
            var elem = data.element;
            var array = _evalExpr(data.scope, data.value);
            $.each(array, function(index, el) {
                var scope = {};
                scope[itemName] = el;
                scope[indexName] = index;
                console.log(el)
                if (elem.canHaveChildren === false || !noScanText[elem.tagName]) {
                    scanText(elem, scope);
                }
                for (var node = elem.firstChild; node; node = node.nextSibling) {
                    if (node.nodeType === 1) {
                        scan(node, scope);
                    }
                }
            })





            directives.stopBinding = true;
        }
    };
    //循环绑定其他布尔属性
    var bools = "autofocus,autoplay,async,checked,controls,declare,defer,"
            + "contenteditable,ismap,loop,multiple,noshade,open,noresize,readonly,selected";
    bools.replace($.rword, function(name) {
        avalon.bindings[name] = avalon.bindings.disabled;
    });
    //建议不要直接在src属性上修改，因此这样会发出无效的请求，使用ms-src
    "title, alt, src".replace($.rword, function(name) {
        avalon.bindings[name] = avalon.bindings.href;
    });

    var modelBinding = avalon.bindings.model;
    //如果一个input标签添加了model绑定。那么它对应的字段将与元素的value连结在一起
    //字段变，value就变；value变，字段也跟着变。默认是绑定input事件，
    //我们也可以使用ng-event="change"改成change事件
    modelBinding.INPUT = function(model, element, data) {
        var name = data.node.value;
        function updateModel() {
            model[name] = element.value;
        }
        function updateView() {
            element.value = model[name];
        }
        var list = getSubscribers(model.__modelName__ + name);
        $.Array.ensure(list, updateView);
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
    };
    modelBinding.TEXTAREA = modelBinding.INPUT;
    function notifySubscribers(accessor) {//通知依赖于这个域的函数们更新自身
        var list = getSubscribers(accessor);
        //console.log(accessor +" notifySubscribers" + list.length)
        if (list && list.length) {
            var safelist = list.concat();
            for (var i = 0, fn; fn = safelist[i++]; ) {
                if (typeof fn === "function") {
                    fn(); //强制重新计算自身
                }
            }
        }
    }
    function getSubscribers(accessor) {
        if (typeof accessor === "string") {
            return obsevers[accessor] || (obsevers[accessor] = []);
        } else {
            return accessor[ subscribers ];
        }
    }
    function collectSubscribers(accessor) {//收集依赖于这个域的函数
        if (bridge[ expando ]) {
            var list = getSubscribers(accessor);
            $.Array.ensure(list, bridge[ expando ]);
        }
    }
    $.model = function(name, obj, skipArray) {
        skipArray = skipArray || [];
        var model = {}, first = [], second = []
        $.each(obj, function(key, val) {
            if (skipArray.indexOf(key)) {
                //相依赖的computed
                var accessor = name + key, old
                if (typeof val === "object" && "set" in val) {
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
                                bridge[ expando ] = function() {
                                    notifySubscribers(accessor); //通知顶层改变
                                };
                                obsevers[accessor] = [];
                            }
                            old = val.get.call(model);
                            obj[name] = old;
                            if (flagDelete) {
                                delete bridge[ expando ];
                            }
                            return old;
                        },
                        enumerable: true
                    });
                    second.push(key);
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
//如果中层把方法放在bridge[ expando ]中
                            collectSubscribers(accessor);
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
        model.__modelName__ = name;
        return $.avalon.models[blank + name] = model;
    };
    function scanTag(el, scope, directives) {
        var bindings = [], newScope;
        for (var i = 0, attr; attr = el.attributes[i++]; ) {
            if (attr.specified) {
                var directive = false;
                if (attr.name.indexOf(prefix) !== -1) {//如果是以指定前缀命名的
                    var type = attr.name.replace(prefix, "");
                    if (type.indexOf("-") > 0) {
                        var args = type.split("-");
                        type = args.shift();
                    }
                    directive = !!avalon.bindings[type];
                } else if (avalon.bindings[attr.name] && hasExpr(attr.value)) {
                    type = attr.name; //如果只是普通属性，但其值是个插值表达式
                    directive = true;
                }
                if (directive) {
                    bindings.push({
                        type: type,
                        scopes: [],
                        args: args,
                        scope: scope,
                        element: el,
                        node: attr,
                        value: attr.nodeValue
                    });
                }
                if (!newScope && type === "controller") {
                    newScope = $.avalon.models[blank + attr.value] || {};
                }
            }
        }
        if (newScope) {
            bindings.forEach(function(obj) {
                obj.scopes.push(obj.scope);
                obj.scope = newScope;
            });
            directives.scope = newScope
        }
        executeBindings(bindings, directives);
    }
    function createText(doc, text) {
        return  doc.createTextNode(text);
    }
    function executeBindings(bindings, directives) {
        bindings.forEach(function(data) {
            var fn = $.avalon.bindings[data.type];
            fn(data, directives);
        });
    }
    var noScanText = $.oneObject("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed,wbr,script,style".toUpperCase());
    //扫描元素节点中直属的文本节点，并进行抽取
    function scanText(el, scope) {
        var textNodes = [];
        for (var node = el.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === 3) {
                textNodes.push(node);
            }
        }
        if (textNodes.length) {
            var bindings = [];
            textNodes.forEach(function(node) {
                extractTextBindings(node, scope, bindings);
            });
            executeBindings(bindings);
        }
    }



    function extractTextBindings(node, scope, bindings) {
        var doc = node.ownerDocument, tokens = extractExpr(node.nodeValue);
        if (tokens.length) {
            var fragment = doc.createDocumentFragment();
            while (tokens.length) {//将文本转换为文本节点，并替换原来的文本节点
                var data = tokens.shift();
                var textNode = createText(doc, data.value);
                if (data.expr) {
                    bindings.push({
                        type: "text",
                        node: textNode,
                        element: node.parentNode,
                        scope: scope,
                        value: data.value
                    }); //收集带指令的文本
                }
                fragment.appendChild(textNode);
            }
            node.parentNode.replaceChild(fragment, node);
        }
    }

    var model = $.model("app", {
        firstName: "xxx",
        lastName: "oooo",
        array: [1, 2, 3, 4],
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
    function scan(el, scope) {
        var helper = {}
        scanTag(el, scope, helper);
        if (helper.stopBinding) {//停止渲染子节点
            return false;
        }
        scope = helper.scope || scope;
        if (el.canHaveChildren === false || !noScanText[el.tagName]) {
            scanText(el, scope);
        }
        for (var node = el.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === 1) {
                scan(node, scope);
            }
        }
    }
    scan(document.documentElement, model);
    setTimeout(function() {
        model.firstName = "setTimeout";
    }, 2000);
});
