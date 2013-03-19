// wrapped by build app
//https://code.google.com/p/vbclass/
//http://webreflection.blogspot.com/2011/03/rewind-getters-setters-for-all-ie-with.html
//http://webreflection.blogspot.com/2011/02/btw-getters-setters-for-ie-6-7-and-8.html
//http://download.dojotoolkit.org/release-1.8.3/dojo-release-1.8.3/dojox/lang/observable.js
define("mvvm", ["mass"], function() {
    function observable(/*Object*/wrapped, /*function*/onRead, /*function*/onWrite, /*function*/onInvoke) {
        // summary:
        //		Creates a wrapper object, which can be observed. The wrapper object
        //		is a proxy to the wrapped object. If you will be making multiple wrapper
        //		objects with the same set of listeners, it is recommended that you
        //		use makeObservable, as it is more memory efficient.
        // wrapped:
        //		The object to be wrapped and monitored for property access and modification
        // onRead:
        //		See dojox.lang.makeObservable.onRead
        // onWrite:
        //		See dojox.lang.makeObservable.onWrite
        // onInvoke:
        //		See dojox.lang.makeObservable.onInvoke

        return makeObservable(onRead, onWrite, onInvoke)(wrapped);
    }
    var defineProperty = false;
    try {
        Object.defineProperty({}, 'a', {
            get: function() {
            }
        });
        defineProperty = true;
    } catch (e) {
    }
    var oldIE = !defineProperty || !Object.prototype.__defineGetter__;
    function makeObservable(/*function*/onRead, /*function*/onWrite, /*function*/onInvoke, /*Object*/hiddenFunctions) {
        hiddenFunctions = hiddenFunctions || {};
        onInvoke = onInvoke || function(scope, obj, method, args) {
            // default implementation for onInvoke, just passes the call through
            return obj[method].apply(scope, args);
        };
        function makeInvoker(scope, wrapped, i) {
            return function() {
                // this is function used for all methods in the wrapper object
                return onInvoke(scope, wrapped, i, arguments);
            };
        }

        if (oldIE) { // create the vb class
            var factory = makeObservable;
            factory.inc = (factory.inc || 0) + 1;//当前实例的编号
            // create globals for the getters and setters so they can be accessed from the vbscript
            var getName = "gettable_" + factory.inc;//当前实例的getter适配器
            factory.lettableWin[getName] = onRead;
            var setName = "settable_" + factory.inc;//当前实例的setter适配器
            factory.lettableWin[setName] = onWrite;
            var cache = {};
            return function(wrapped) {//要求必须传入一个对象,在它上面添加东西
                if (wrapped.__observable) { // if it already has an observable, use that
                    return wrapped.__observable;
                }
                if (wrapped.data__) {
                    throw new Error("Can wrap an object that is already wrapped");
                }
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
                var prop, clazz = cache[signature];
                if (!clazz) {
                    var tname = "dj_lettable_" + (factory.inc++);
                    var gtname = tname + "_dj_getter";
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
                    factory.lettableWin.vbEval(cParts.join("\n"));

                    // Put the new class in the cache
                    cache[signature] = clazz = function() {
                        return factory.lettableWin.construct(gtname); // the class can't be accessed, only called, so we have to wrap it with a function
                    };
                }
                console.log("starting5");
                var newObj = clazz();
                newObj.data__ = wrapped;
                console.log("starting6");
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
                        console.log("error ", prop, e);
                    }
                    if (typeof val == 'function' || hiddenFunctions[prop]) { // we can make a delegate function here
                        newObj[prop] = makeInvoker(newObj, wrapped, prop);
                    }
                }
                return newObj;
            };
        } else {
            return function(wrapped) { // do it with getters and setters
                if (wrapped.__observable) { // if it already has an observable, use that
                    return wrapped.__observable;
                }
                var newObj = wrapped instanceof Array ? [] : {};
                newObj.data__ = wrapped;
                for (var i in wrapped) {
                    if (i.charAt(0) != '_') {
                        if (typeof wrapped[i] == 'function') {
                            newObj[i] = makeInvoker(newObj, wrapped, i); // TODO: setup getters and setters so we can detect when this changes
                        } else if (typeof wrapped[i] != 'object') {
                            (function(i) {
                                newObj.__defineGetter__(i, function() {
                                    return onRead(wrapped, i);
                                });
                                newObj.__defineSetter__(i, function(value) {
                                    return onWrite(wrapped, i, value);
                                });
                            })(i);
                        }
                    }
                }
                for (i in hiddenFunctions) {
                    newObj[i] = makeInvoker(newObj, wrapped, i);
                }
                wrapped.__observable = newObj;
                return newObj;
            };
        }
    }
    ;
    if (oldIE) {
        // to setup the crazy lettable hack we need to
        // introduce vb script eval
        // the only way that seems to work for adding a VBScript to the page is with a document.write
        // document.write is not always available, so we use an iframe to do the document.write
        // the iframe also provides a good hiding place for all the global variables that we must
        // create in order for JScript and VBScript to interact.
        var frame;
        if (document.body) { // if the DOM is ready we can add it
            frame = document.createElement("iframe");
            document.body.appendChild(frame);
        } else { // other we have to write it out
            document.write("<iframe id='dj_vb_eval_frame'></iframe>");
            frame = document.getElementById("dj_vb_eval_frame");
        }
        frame.style.display = "none";
        var doc = frame.contentWindow.document;
        dojox.lang.lettableWin = frame.contentWindow;
        doc.write('<html><head><script language="VBScript" type="text/VBScript">' +
                'Function vb_global_eval(code)' +
                'ExecuteGlobal(code)' +
                'End Function' +
                '</script>' +
                '<script type="text/javascript">' +
                'function vbEval(code){ \n' + // this has to be here to call it from another frame
                'return vb_global_eval(code);' +
                '}' +
                'function construct(name){ \n' + // and this too
                'return window[name]();' +
                '}' +
                '</script>' +
                '</head><body>vb-eval</body></html>');
        doc.close();
    } else {
        throw new Error("This browser does not support getters and setters");
    }
    return observable;
});
