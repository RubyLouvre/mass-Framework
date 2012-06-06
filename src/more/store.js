$.define("store", top.JSON && JSON.parse ? "support" :"support,json2", function(){
    var store = {
        //一些接口(空实现)
        disabled: false,
        set : function(key, value) {},
        get: function(key) {},
        remove : function(key) {},
        clear : function() {},
        transact : function(key, defaultVal, transactionFn) {
            var val = store.get(key)
            if (transactionFn == null) {
                transactionFn = defaultVal
                defaultVal = null
            }
            if (typeof val == 'undefined') {
                val = defaultVal || {}
            }
            transactionFn(val)
            store.set(key, val)
        },
        getAll : function() {},
        serialize : function(value) {
            return JSON.stringify(value)
        },
        deserialize : function(value) {
            if (typeof value != 'string') {
                return undefined
            }
            return JSON.parse(value)
        }
    }
    //http://wojodesign.com/full-browser-support-for-localstorage-without-cookies/
    //http://mathiasbynens.be/notes/localstorage-pattern
    var name = "test"+ (new Date-0), win = window, localStorageName = "localStorage",storage
    var supportLocalStorage = $.support.localStorage = false;
    try {
        localStorage.setItem(name,"mass");
        localStorage.removeItem(name);
        supportLocalStorage = true;
    }catch(e){}

    var supportGlobalStorage = $.support.globalStorage = false;
    try {
        supportGlobalStorage = win["globalStorage"][win.location.hostname]
    }catch(e){}

    if (supportLocalStorage) {
        storage = localStorage;
        $.mix(store,{//重写
            set: function(key, val) {
                if (val === undefined) {
                    return store.remove(key)
                }
                storage.setItem(key, store.serialize(val))
            },
            get:  function(key) {
                return store.deserialize(storage.getItem(key))
            },
            remove: function(key) {
                storage.removeItem(key)
            },
            clear: function() {
                storage.clear()
            },
            getAll: function() {
                var ret = {}
                for (var i=0; i<storage.length; ++i) {
                    var key = storage.key(i)
                    ret[key] = store.get(key)
                }
                return ret
            }
        })
      
    }else if(supportGlobalStorage){
        storage = supportGlobalStorage
        $.mix(store,{//重写
            set: function(key, val) {
                if (val === undefined) {
                    return store.remove(key)
                }
                storage[key] = store.serialize(val)
            },
            get:  function(key) {
                return store.deserialize(storage[key] && storage[key].value)
            },
            remove: function(key) {
                delete storage[key]
            },
            clear:  function() {
                for (var key in storage ) {
                    delete storage[key]
                }
            },
            getAll: function() {
                var ret = {}
                for (var i=0; i<storage.length; ++i) {
                    var key = storage.key(i)
                    ret[key] = store.get(key)
                }
                return ret
            }
        })


    }else if ( $.html.addBehavior) {
        var storageOwner,
        storageContainer
        //由于＃userData的存储仅适用于特定的路径，
        //我们需要以某种方式关联我们的数据到一个特定的路径。我们选择/favicon.ico作为一个非常安全的目标，
        //因为所有的浏览器都发出这个URL请求，而且这个请求即使是404也不会有危险。
        //我们可以通过一个ActiveXObject(htmlfle)对象的文档来干这事。
        //(参见:http://msdn.microsoft.com/en-us/library/aa752574(v = VS.85). aspx)
        //因为iframe的访问规则允许直接访问和操纵文档中的元素，即使是404。
        //这文档可以用来代替当前文档（这被限制在当前路径）执行＃userData的存储。
        try {
            storageContainer = new ActiveXObject('htmlfile')
            storageContainer.open()
            storageContainer.write('<s' + 'cript>document.w=window</s' + 'cript><iframe src="/favicon.ico"></frame>')
            storageContainer.close()
            storageOwner = storageContainer.w.frames[0].document
            storage = storageOwner.createElement('div')
        } catch(e) {
            // somehow ActiveXObject instantiation failed (perhaps some special
            // security settings or otherwse), fall back to per-path storage
            storage = document.createElement('div')
            storageOwner = document.body
        }
        function withIEStorage(storeFunction) {
            return function() {
                var args = Array.apply([],arguments);
                args.unshift(storage)
                // See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
                // and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
                storageOwner.appendChild(storage)
                storage.addBehavior('#default#userData')
                storage.load(localStorageName)
                var result = storeFunction.apply(store, args)
                storageOwner.removeChild(storage)
                return result
            }
        }
        function ieKeyFix(key) {
            // In IE7, keys may not begin with numbers.
            // See https://github.com/marcuswestin/store.js/issues/40#issuecomment-4617842
            return '_'+key
        }
        $.mix(store,{//重写
            set:  withIEStorage(function(storage, key, val) {
                key = ieKeyFix(key)
                if (val === undefined) {
                    return store.remove(key)
                }
                storage.setAttribute(key, store.serialize(val))
                storage.save(localStorageName)
            }),
            get:  withIEStorage(function(storage, key) {
                key = ieKeyFix(key)
                return store.deserialize(storage.getAttribute(key))
            }),
            remove: withIEStorage(function(storage, key) {
                key = ieKeyFix(key)
                storage.removeAttribute(key)
                storage.save(localStorageName)
            }),
            clear:  withIEStorage(function(storage) {
                var attributes = storage.XMLDocument.documentElement.attributes
                storage.load(localStorageName)
                for (var i=0, attr; attr=attributes[i]; i++) {
                    storage.removeAttribute(attr.name)
                }
                storage.save(localStorageName)
            }),
            getAll: withIEStorage(function(storage) {
                var attributes = storage.XMLDocument.documentElement.attributes
                storage.load(localStorageName)
                var ret = {}
                for (var i=0, attr; attr=attributes[i]; ++i) {
                    ret[attr] = store.get(attr)
                }
                return ret
            })
        })
    }
    try {
        store.set(localStorageName, localStorageName)
        if (store.get(localStorageName) != localStorageName) {
            store.disabled = true
        }
        store.remove(localStorageName);
    } catch(e) {
        store.disabled = true
    }

    return store;
})
//这里提供了一个用cookie实现本地储存的方案 https://developer.mozilla.org/en/DOM/Storage
//http://www.cnblogs.com/NNUF/archive/2012/06/01/2531436.html