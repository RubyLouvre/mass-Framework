// wrapped by build app
//https://code.google.com/p/vbclass/
//http://webreflection.blogspot.com/2011/03/rewind-getters-setters-for-all-ie-with.html
//http://webreflection.blogspot.com/2011/02/btw-getters-setters-for-ie-6-7-and-8.html
//http://download.dojotoolkit.org/release-1.8.3/dojo-release-1.8.3/dojox/lang/observable.js
define("mvvm", ["mass"], function($) {
//特征测试，依次使用以下实现
//1 Object.defineProperty，
//2  __defineGetter__、 __defineSetter__
//3  VBScript
    var defineProperty = false, lettableWin
    try {
        Object.defineProperty({}, 'a', {
            get: function() {
            }
        });
        defineProperty = true;
    } catch (e) {
    }
    var supportAccessor = defineProperty || Object.prototype.__defineGetter__;
    if (!supportAccessor && window.VBArray) {

        var frame;
        if (document.body) { // 如果DOM树已建成
            frame = document.createElement("iframe");
            document.body.appendChild(frame);
        } else { // 否则使用document.write
            document.write("<iframe id='mass_vb_eval_frame'></iframe>");
            frame = document.getElementById("mass_vb_eval_frame");
        }
        frame.style.display = "none";
        var doc = frame.contentWindow.document;
        lettableWin = frame.contentWindow;
        doc.write('<html><head><script language="VBScript" type="text/VBScript">' +
                'Function vb_global_eval(code)' +
                '    ExecuteGlobal(code)' +
                'End Function' +
                '</script>' +
                '<script type="text/javascript">' +
                'function vbEval(code){ \n' +
                '    return vb_global_eval(code);' +
                '}' +
                'function construct(name){ \n' +
                '    return window[name]();' +
                '}' +
                '</script>' +
                '</head><body>vb-eval</body></html>');
        doc.close();
    }

    var hiddenFunctions = {}
    //取得原来的方法转到原对象下执行
    function defaultInvoker(scope, obj, method, args) {
        return obj[method].apply(scope, args);
    }

    return supportAccessor ? function(wrapped, onRead, onWrite, onInvoke) {
        onInvoke = onInvoke || defaultInvoker;
        function makeInvoker(scope, wrapped, name) {
            return function() {
                return onInvoke(scope, wrapped, name, arguments);
            };
        }
        if (wrapped.__observable) { // 判定是否已经处理完毕
            return wrapped.__observable;
        }
        var newObj = wrapped instanceof Array ? [] : {};
        newObj.data__ = wrapped;
        for (var key in wrapped) {
            if (key.charAt(0) != '_') {
                if (typeof wrapped[key] == 'function') {
                    newObj[key] = makeInvoker(newObj, wrapped, key);
                } else if (typeof wrapped[key] != 'object') {
                    (function(name) {
                        if (defineProperty) {
                            Object.defineProperty(newObj, name, {
                                set: function(value) {
                                    return onWrite(wrapped, name, value);
                                },
                                get: function() {
                                    return onRead(wrapped, name);
                                },
                                enumerable: true
                            })
                        } else {
                            newObj.__defineGetter__(name, function() {
                                return onRead(wrapped, name);
                            });
                            newObj.__defineSetter__(name, function(value) {
                                return onWrite(wrapped, name, value);
                            });
                        }
                    })(key);
                }
            }
        }
        for (key in hiddenFunctions) {
            newObj[key] = makeInvoker(newObj, wrapped, key);
        }
        wrapped.__observable = newObj;
        return newObj;
    } : function makeObservable(wrapped, onRead, onWrite, onInvoke) {
        if (lettableWin) { //创建一个iframe沙箱环境调用VBScript
            if (wrapped.__observable) { // if it already has an observable, use that
                return wrapped.__observable;
            }
            if (wrapped.data__) {
                throw new Error("Can wrap an object that is already wrapped");
            }
            onInvoke = onInvoke || defaultInvoker;
            function makeInvoker(scope, wrapped, name) {
                return function() {
                    // this is function used for all methods in the wrapper object
                    return onInvoke(scope, wrapped, name, arguments);
                };
            }
            var ID  = setTimeout("1"); //当前实例的编号
            // create globals for the getters and setters so they can be accessed from the vbscript
            var getName = "gettable_" + ID; //当前实例的getter适配器
            lettableWin[getName] = onRead;
            var setName = "settable_" + ID; //当前实例的setter适配器
            lettableWin[setName] = onWrite;
            // create the class
            var props = [], i, l;
            for (i in hiddenFunctions) {
                props.push(i);
            }
            var vbReservedWords = {type: 1, event: 1};
            // find the unique signature for the class so we can reuse it if possible
            for (i in wrapped) {
                if (i.match(/^[a-zA-Z][\w\$_]*$/) && !(i in hiddenFunctions) && !(i in vbReservedWords)) { //can only do properties with valid vb names/tokens and primitive values
                    props.push(i);
                }
            }
            var signature = props.join(",");
            var prop, clazz = makeObservable[signature];
            if (!clazz) {
                var tname = "mass_lettable_" + setTimeout("1");
                var gtname = tname + "_getter";
                var cParts = [
                    "Class " + tname,
                    "	Public data__" // this our reference to the original object
                ];
                for (i = 0, l = props.length; i < l; i++) {
                    prop = props[i];
                    var type = typeof wrapped[prop];
                    if (type === 'function' || hiddenFunctions[prop]) { // functions must go in regular properties for delegation:/
                        cParts.push("  Public " + prop);
                    } else if (type != 'object') { // the getters/setters can only be applied to primitives
                        cParts.push(
                                "	Public Property Let " + prop + "(val)",
                                "		Call " + setName + "(me.data__,\"" + prop + "\",val)",
                                "	End Property",
                                "	Public Property Get " + prop,
                                "		" + prop + " = " + getName + "(me.data__,\"" + prop + "\")",
                                "	End Property");
                    }
                }
                cParts.push("End Class");
                cParts.push(
                        "Function " + gtname + "()",
                        "	Dim tmp",
                        "	Set tmp = New " + tname,
                        "	Set " + gtname + " = tmp",
                        "End Function");
                lettableWin.vbEval(cParts.join("\n"));
                // Put the new class in the cache
                makeObservable[signature] = clazz = function() {
                    return lettableWin.construct(gtname); // the class can't be accessed, only called, so we have to wrap it with a function
                };
            }
            var newObj = clazz();
            newObj.data__ = wrapped;
            try {
                wrapped.__observable = newObj;
            } catch (e) { // some objects are not expando
            }
            for (i = 0, l = props.length; i < l; i++) {
                prop = props[i];
                try {
                    var val = wrapped[prop];
                }
                catch (e) {
                    $.log("error ", prop, e);
                }
                if (typeof val == 'function' || hiddenFunctions[prop]) { // we can make a delegate function here
                    newObj[prop] = makeInvoker(newObj, wrapped, prop);
                }
            }
            return newObj;
        } else {
            throw new Error("不支持getter，setter")
        }
    }

});
