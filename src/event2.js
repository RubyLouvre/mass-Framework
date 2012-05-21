 var $$ = $.zepto.qsa, handlers = {}, _zid = 1, specialEvents={}
function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
        return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
}
function parse(event) {
    var parts = ('' + event).split('.')
    return {
        e: parts[0],
        ns: parts.slice(1).sort().join(' ')
        }
}
function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
}

function eachEvent(events, fn, iterator){
    if ($.isObject(events)) $.each(events, iterator)
    else events.split(/\s/).forEach(function(type){
        iterator(type, fn)
    })
}
//getDelegate可以抽取出来
function add(element, events, fn, selector, getDelegate, capture){
    capture = !!capture
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    eachEvent(events, fn, function(event, fn){
        var delegate = getDelegate && getDelegate(fn, event),
        callback = delegate || fn
        var proxyfn = function (event) {
            var result = callback.apply(element, [event].concat(event.data))
            if (result === false) event.preventDefault()
            return result
        }
        var handler = $.mix(parse(event), {
            fn: fn,
            proxy: proxyfn,
            sel: selector,
            del: delegate,
            i: set.length
            })
        set.push(handler)
        //这里可以检测,如果是自定义事件,则使用window代替
        element.addEventListener(handler.e, proxyfn, capture)
    })
}