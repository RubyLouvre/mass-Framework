define("valuechange", ["$event"], function(){
    var adapter = $.event.eventAdapter,
    KEY = 'event/valuechange',
    old_key = KEY + '/history',
    new_key = KEY + '/poll',
    interval = 50;
    function startPoll(target, type) {
        var id = setTimeout(function(){
            startPoll(target, type);
        },interval);
        $._data(target, "valuechangeID",id)
        var old = $._data(target, old_key);
        var neo = target.value;
        if(old !== neo){
            $._data(target, old_key,neo);
            var event = new $.Event("valuechange")
            event.origtype = type
            event.oldValue = old;
            event.newValue = neo;
            $.event.fire.call(target, event) 
        }
    }
    //http://liumiao.me/html/wd/W3C/264.html
    function startPollHandler(e) {
        var target = e.target;
        if (e.type == 'focus' ) {
            $._data(target, old_key , target.value);
        }
        startPoll(target,e.type);
    }
    function stopPollHandler(e){
        var target = e.target;
        var id = $._data(target, "valuechangeID")
        clearTimeout(id)
        
    }
    
    function monitor(elem) {
        $(elem).bind('keydown keyup focus', startPollHandler)
        $(elem).bind('blur', stopPollHandler)
    // unmonitored(target);
    // fix #94
    // see note 2012-02-08
    //   Event.on(elem, 'webkitspeechchange', webkitSpeechChangeHandler);
    // Event.on(elem, 'mousedown keyup keydown focus', startPollHandler);
    }
    adapter.valuechange = {
        setup: function(desc){
            var elem = desc.currentTarget, nodeName = elem.tagName;
            if (nodeName == 'INPUT' || nodeName == 'TEXTAREA') {
                monitor(elem);
                return false
            }
            
        },
        tearDown: function (desc) {
            unmonitored(desc.currentTarge);
        }
    }
})
