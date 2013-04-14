define("mvvm", "$event,$css,$attr".split(","), function($) {

    var prefix = "ng-";
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
    avalon.bindings = {
        "model": function(data) {
            var element = data.element;
            var tagName = element.tagName;
            if (typeof  modelBinding[tagName] === "function") {
                modelBinding[tagName](model, element, data);
            }
        },
        "text": function(data) {
            var text = data.value, node = data.node, scope = data.scope;
            var names = [], args = [];
            $.each(scope, function(key, val) {
                names.push(key);
                args.push(val)
            })
            var fn = Function.apply(Function, names.concat(" return " + text));
            var val = fn.apply(fn, args);
            node.nodeValue = val;
        //    function updateView() {
         //       node.nodeValue = model[name];
         //   }
         //   var list = getSubscribers(model.__modelName__ + name);
         //   $.Array.ensure(list, updateView);


            // console.log(val)
            //   var fn = Function(names+"", "return " + text)
            //  console.log(fn())
        }
    };
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
            return obsevers[accessor] || (obsevers[accessor] = [])
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
                                val.set.call(model, neo);//通知底层改变
                            } else {
                                obj[key] = neo;
                            }
                            if (old !== neo) {
                                old = neo;
                                notifySubscribers(accessor);//通知顶层改变
                            }
                        },
                        //get方法肯定存在,那么肯定在这里告诉它的依赖,把它的setter放到依赖的订阅列表中
                        get: function() {
                            var flagDelete = false;
                            if (!obsevers[accessor]) {
                                flagDelete = true;
                                bridge[ expando ] = function() {
                                    notifySubscribers(accessor);//通知顶层改变
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
            console.log("second " + key);
            first = model[key];
        });
        model.__modelName__ = name;
        return $.avalon.models[blank + name] = model;
    };
    function scanTag(el, scope) {
        var bindings = [], newScope;
        for (var i = 0, attr; attr = el.attributes[i++]; ) {
            if (attr.specified) {
                if (attr.name.indexOf(prefix) !== -1) {
                    var type = attr.name.replace(prefix, "");
                    var directive = avalon.bindings[type];
                    if (typeof directive === "function") {
                        bindings.push({
                            type: type,
                            scopes: [],
                            scope: scope,
                            element: el,
                            node: attr
                        });
                    }
                    if (!newScope && type === "controller") {
                        newScope = $.avalon.models[blank + attr.value] || {}
                    }
                }
            }
        }
        if (newScope) {
            bindings.forEach(function(obj) {
                obj.scopes.push(obj.scope);
                obj.scope = newScope;
            });
            scope = newScope;
        }
        executeBindings(bindings);
        return scope;
    }
    function createText(doc, text) {
        return  doc.createTextNode(text);
    }
    function executeBindings(bindings) {
        bindings.forEach(function(bind) {
            var fn = $.avalon.bindings[bind.type];
            fn(bind);
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
        var value = node.nodeValue, doc = node.ownerDocument, datas = [],
                index = value.indexOf("{{");
        if (index !== -1 && index < value.indexOf("}}")) {
            //抽取{{ }} 里面的语句，并以它们为定界符，拆分原来的文本
            do {
                value = value.replace(regOpenTag, function(a, b) {
                    if (b) {
                        datas.push({
                            value: b,
                            directive: false
                        });
                    }
                    return "";
                });
                value = value.replace(regCloseTag, function(a, b) {
                    if (b) {
                        datas.push({
                            value: b,
                            directive: true
                        });
                    }
                    return "";
                });
                index = value.indexOf("{{");
            } while (index !== -1 && index < value.indexOf("}}"));
            if (value) {
                datas.push({
                    value: value,
                    directive: false
                });
            }
            var fragment = doc.createDocumentFragment();
            while (datas.length) {//将文本转换为文本节点，并替换原来的文本节点
                var obj = datas.shift();
                var textNode = createText(doc, obj.value);
                if (obj.directive) {
                    bindings.push({
                        type: "text",
                        node: textNode,
                        element: node.parentNode,
                        scope: scope,
                        value: obj.value
                    });//收集带指令的文本
                }
                fragment.appendChild(textNode);
            }
            node.parentNode.replaceChild(fragment, node);
        }
    }
    var model = $.model("app", {
        firstName: "xxx",
        lastName: "oooo",
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
        var newScope = scanTag(el, scope);
        if (el.canHaveChildren === false || !noScanText[el.tagName]) {
            scanText(el, newScope);
        }
        for (var node = el.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === 1) {
                scan(node, newScope);
            }
        }
    }
    scan(document.documentElement, model);
    setTimeout(function() {
        model.firstName = "setTimeout";
    }, 2000);

});
