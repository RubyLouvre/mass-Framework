/**
 * 延迟加载模块
 * https://github.com/rgrove/lazyload/blob/master/lazyload.js
 */
$.define("lazyload","lang,node,css",function($$){
    var nodes = [], now = new Date;
    function loading() {
        var st = $(window).scrollTop(), sth = st + $(window).height();
        for(var i = 0; i < nodes.length; i++){
            var obj = nodes[i], el = obj.el , top = $(el).offset().top();//取得元素相对于整个页面的Y位置
            if(sth > top ) { //如果页面的滚动条拖动要处理的元素所在的位置
                obj.callback(el);//重设图片的SRC或用HTML来填充当前的元素
                nodes.splice( i--, 1 );
            } 
        }	
    };
    $(window).bind("scroll", function(){
        var time = new Date;
        if(time - now > 30){
            now = time;
            loading();
        }
    });
    /**
     *@params  {Dom|NodeList|Array} instance
     *@params  {Function} fn
     */
    return function(instance,fn){//比如 $("img")
        $$(instance).forEach(function(el){
            nodes.push({
                el: el,
                callback: fn
            });
        });
        loading();//立即加载第一屏数据
    }
});

