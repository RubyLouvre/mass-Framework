
$.define("link", function(){
    function getBody(fn){
        return fn.toString().match(/\{([\s\S]*)\}/m)[1];
    }
    function iframeWindowOnload(){
        setTimeout(function(){//注意这里document不能缩写
            var succeed = typeof DOC.x === "number";
            var url = document.styleSheets[0].href;
            parent[parent.document.URL.replace(/(#.+|\W)/g,'')].link.check(succeed, url);
        },1000);
    }
    //对于IE,链接是否正常都会进入onload回调,这时我们可以通过访问CSSRuleList
    //只要不抛出异常即为加载成功,
    //对于opera,如果链接不正常则肯定无法进入onload回调
    function iframeLinkOnload(){
        if(this.readyState == "complete"){//ie
            try{
                var sheet = this.sheet || this.styleSheet
                var rules = sheet.cssRules || sheet.rules;
                document.x = 1;
            }catch(e){ }
        }else if(!this.readyState){//opera
            document.x = 1;
        }
    }
    function iframeCheck(url,obj){
        var iframe = DOC.createElement("iframe");
        obj.proxy = iframe
        iframe.style.display = "none";
        $.head.appendChild(iframe);
        var idoc = iframe.contentDocument || iframe.contentWindow.document;
        var html =  '<link rel="stylesheet" type="text/css" href="'+url+'" onload=\''+getBody(iframeLinkOnload)+'\'/>' +
        '<script>window.onload = '+iframeWindowOnload.toString()+'<\/script>'
        idoc.url = url;
        idoc.write(html)
        idoc.close();
    }
    //FF可以使用Object标签充当小白鼠，但它只有onload事件，
    //safari chrome则只能使用script标签来加载CSS样式表，能同时触发onload与onerror
    //幸好FF也支持用script标签来模拟，但它会试图解析里面的内容，
    //这当然会报错，我们需要用window.onerror屏蔽此错误！
    function scriptCheck(url,obj){
        //对于FF safari chrome
        var script = DOC.createElement('script');
        obj.proxy = script;
        window.onerror = function(){
            return true;
        }
        script.onload = function() {
            $.link.check(true,url);
        };
        script.onerror = function(){
            $.link.check(false,url);
        }
        script.src = url;
        $.head.appendChild(script);
    }
    var linkMap = {};//用于保存相关回调与节点
    var UseIframeCheck = ("attachEvent" in DOC)  && ((~~DOC.documentMode) < 9);
    $.link =  function (url, callback, errback) {
        if(!linkMap[url]){
            var link = DOC.createElement("link")
            link.rel = "stylesheet";
            link.type = "text/css";
            var obj = linkMap[url] = { };
            obj.link = link;
            if(UseIframeCheck){
                iframeCheck(url,obj);
            }else{
                scriptCheck(url,obj);
            }
            obj.callback = callback || $.noop;
            obj.errback = errback || $.noop;
            //开始加载
            link.href = url;
            $.HEAD.appendChild(link);
        }
    }
    $.link.check = function(succeed,url){
        var obj = linkMap[url];
        var fn =  obj[succeed ? "callback" : "errback"]
        fn.call(obj.link);
        var proxy = obj.proxy ;
        if(proxy.parentNode){
            proxy.parentNode.removeChild(proxy);
            obj.proxy = 1;
        }
        window.onerror = null;
    }
});
