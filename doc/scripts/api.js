define("api", ["mass"], function() {

    return {
        core: "require,define,config, mix,slice,type,log,oneObject,bind,unbind,html,head,rword,mass,getUid,exports".match($.rword).sort(),
        lang: ("String.contains, String.startsWith, String.endsWith,String.repeat,String.byteLen,String.truncate,String.camelize,String.underscored," +
                "String.capitalize, String.escapeHTML, String.unescapeHTML,String.stripTags,String.stripScripts,String.pad," +
                "Array.clone,Array.contains,Array.remove,Array.removeAt,Array.shuffle,Array.random,Array.min,Array.max,Array.pluck,Array.sortBy," +
                "Array.compact,Array.diff,Array.merge,Array.union,Array.intersect,Array.unique,Array.ensure,Array.inGroupsOf,Array.flatten," +
                "Number.limit,Number.nearer,Number.round,Object.subset,Object.forEach,Object.map,Object.clone,Object.merge," +
                "isPlainObject,isNative,isEmptyObject,isArrayLike,format,range,quote,dump,parseJS,parseJSON,parseXML,isArray,isFunction,each,map").match($.rword).sort(),
        "class": ["factory"],
         newland: [],
        node: ("fn.after,fn.afterTo,fn.append,fn.appendTo,fn.before,fn.beforeTo,fn.children," +
                "fn.clone,fn.closest,fn.collect,fn.contents,fn.data,fn.each,fn.empty,fn.eq," +
                "fn.even,fn.filter,fn.find,fn.first,fn.get,fn.gt,fn.has,fn.html,fn.index,fn.init," +
                "fn.is,fn.last,fn.length,fn.lt,fn.map,fn.mass,fn.next,fn.nextAll,fn.nextUntil," +
                "fn.not,fn.odd,fn.parent,fn.parents,fn.parentsUntil,fn.pop,fn.prepend," +
                "fn.prependTo,fn.prev,fn.prevAll,fn.prevUntil,fn.push,fn.remove,fn.removeData," +
                "fn.replace,fn.replaceTo,fn.reverse,fn.shift,fn.siblings,fn.slice,fn.sort," +
                "fn.splice,fn.text,fn.toString,fn.unshift,fn.valueOf,fn.extend,match,parseHTML,cssName").match($.rword).sort(),
        query: "isXML,contains,getText,unique,query".match($.rword).sort(),
        data: ["data", "parseData", "removeData", "mergeData"],
        css: "fn.css, fn.width, fn.height, fn.innerWidth, fn.innerHeight, fn.outerWidth, fn.outerHeight, fn.offset, fn.position, fn.offsetParent, fn.scrollParent, fn.scrollTop, fn.scrollLeft, css".match($.rword).sort(),
        attr: "fn.addClass, fn.hasClass, fn.removeClass, fn.toggleClass, fn.replaceClass, fn.val, fn.removeAttr, fn.removeProp, fn.attr, fn.prop, attr, prop".match($.rword).sort(),
        event: ("fn.on,fn.bind,fn.off,fn.unbind,fn.delegate,fn.live,Event,eventSupport" +
                "fn.one,fn.undelegate,fn.die,fn.fire,fn.contextmenu,fn.click,fn.dblclick," +
                "fn.mouseout,fn.mouseover,fn.mouseenter,fn.mouseleave,fn.mousemove," +
                "fn.mousedown,fn.mouseup,fn.mousewheel,fn.abort,fn.error,fn.load,fn.unload," +
                "fn.resize,fn.scroll,fn.change,fn.select,fn.reset,fn.submit,fn.blur," +
                "fn.focus,fn.focusin,fn.focusout,fn.keypress,fn.keydown,fn.keyup").match($.rword).sort(),
        flow: [],
        ajax: [],
        fx: ["fn.fx", "fn.stop", "fn.fadeToggle", "fn.fadeIn", "fn.fadeOut",
            "fn.slideDown", "fn.slideUp", "fn.slideToggle", "fn.show", "fn.hide", "fn.toggle", "fn.delay", "fn.pause", "fn.resume"].sort()
    };



});
