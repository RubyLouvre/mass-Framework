define("api", ["mass"], function() {

    return {
        core: "require,define,config, mix,slice,type,log,oneObject,bind,unbind,html,head,rword,mass,getUid,exports".match($.rword).sort(),
        lang: ("String.contains, String.startsWith, String.endsWith,String.repeat,String.byteLen,String.truncate,String.camelize,String.underscored," +
                "String.capitalize, String.escapeHTML, String.unescapeHTML,String.stripTags,String.stripScripts,String.pad," +
                "Array.clone,Array.contains,Array.remove,Array.removeAt,Array.shuffle,Array.random,Array.min,Array.max,Array.pluck,Array.sortBy," +
                "Array.compact,Array.diff,Array.merge,Array.union,Array.intersect,Array.unique,Array.ensure,Array.inGroupsOf,Array.flatten," +
                "Number.limit,Number.nearer,Number.round,Object.subset,Object.forEach,Object.map,Object.clone,Object.merge,Object.without," +
                "isPlainObject,isNative,isEmptyObject,isArrayLike,format,range,quote,dump,parseJS,parseJSON,parseXML,isArray,isFunction,each,map").match($.rword).sort(),
        "class": ["factory"],
        node: ("fn.after,fn.afterTo,fn.append,fn.appendTo,fn.before,fn.beforeTo,fn.children," +
                "fn.clone,fn.closest,fn.collect,fn.contents,fn.data,fn.each,fn.empty,fn.eq," +
                "fn.even,fn.filter,fn.find,fn.first,fn.get,fn.gt,fn.has,fn.html,fn.index,fn.init," +
                "fn.is,fn.last,fn.length,fn.lt,fn.map,fn.mass,fn.next,fn.nextAll,fn.nextUntil," +
                "fn.not,fn.odd,fn.parent,fn.parents,fn.parentsUntil,fn.pop,fn.prepend," +
                "fn.prependTo,fn.prev,fn.prevAll,fn.prevUntil,fn.push,fn.remove,fn.removeData," +
                "fn.replace,fn.replaceTo,fn.reverse,fn.shift,fn.siblings,fn.slice,fn.sort," +
                "fn.splice,fn.text,fn.toString,fn.unshift,fn.valueOf,fn.extend,match,parseHTML,cssName").match($.rword).sort(),
        query: "isXML,contains,getText,unique,query".match($.rword).sort(),
        data: ["data","parseData","removeData","mergeData"],
        css: "fn.css, fn.width, fn.height, fn.innerWidth, fn.innerHeight, fn.outerWidth, fn.outerHeight, fn.offset, fn.position, fn.offsetParent, fn.scrollParent, fn.scrollTop, fn.scrollLeft, css".match($.rword).sort(),
          
        "属性模块": {
            "fn": {
                "addClass": "function",
                "hasClass": "function",
                "removeClass": "function",
                "toggleClass": "function",
                "replaceClass": "function",
                "val": "function",
                "removeAttr": "function",
                "removeProp": "function",
                "attr": "function",
                "prop": "function",
                "class": "function"
            },
            "attr": "function",
            "prop": "function",
            "attrMap": "object",
            "propMap": "object",
            "_remove_attr": "function",
            "propAdapter": "object",
            "valAdapter": "object"
        },
        "事件模块": {
            "fn": {
                "on": "function",
                "bind": "function",
                "off": "function",
                "unbind": "function",
                "toggle": "function",
                "hover": "function",
                "delegate": "function",
                "live": "function",
                "one": "function",
                "undelegate": "function",
                "die": "function",
                "fire": "function",
                "contextmenu": "function",
                "click": "function",
                "dblclick": "function",
                "mouseout": "function",
                "mouseover": "function",
                "mouseenter": "function",
                "mouseleave": "function",
                "mousemove": "function",
                "mousedown": "function",
                "mouseup": "function",
                "mousewheel": "function",
                "abort": "function",
                "error": "function",
                "load": "function",
                "unload": "function",
                "resize": "function",
                "scroll": "function",
                "change": "function",
                "select": "function",
                "reset": "function",
                "submit": "function",
                "blur": "function",
                "focus": "function",
                "focusin": "function",
                "focusout": "function",
                "keypress": "function",
                "keydown": "function",
                "keyup": "function"
            },
            "eventAdapter": {
                "focus": "object",
                "blur": "object",
                "beforeunload": "object",
                "focusin": "object",
                "focusout": "object",
                "mousewheel": "object"
            },
            "event": {
                "bind": "function",
                "unbind": "function",
                "fire": "function",
                "filter": "function",
                "dispatch": "function",
                "fix": "function"
            },
            "Event": "function",
            "EventTarget": "object",
            "eventSupport": "function"
        },
        "数据交互模块": {
            "get": "function",
            "post": "function",
            "getScript": "function",
            "getJSON": "function",
            "upload": "function",
            "serialize": "function",
            "serializeArray": "function",
            "param": "function",
            "ajax": {
                "uniqueNumber": "number",
                "defineEvents": "function",
                "bind": "function",
                "unbind": "function",
                "fire": "function",
                "isLocal": "boolean",
                "@data_14": "object"
            },
            "XHR": {
                "inherit": "function",
                "implement": "function",
                "extend": "function",
                "toString": "function"
            },
            "xhr": "function"
        },
        "fx": ["fn.fx", "fn.stop", "fn.fadeToggle", "fn.fadeIn", "fn.fadeOut",
            "fn.slideDown", "fn.slideUp", "fn.slideToggle", "fn.show", "fn.hide", "fn.toggle", "fn.delay", "fn.pause", "fn.resume"].sort(),
        "flow": {
            "Flow": "function",
            "flow.bind": "function",
            "flow.unbind": "function",
            "flow.fire": "function",
            "flow.find": "function",
            "flow.append": "function",
            "flow.reduce": "function"
        },
        "特征侦探模块": {}
    }



})
