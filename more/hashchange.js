define("hashchange", ["$event"], function($){
    $.log("已加载hashchange模块")

    var hashchange = 'hashchange',  DOC = document,  documentMode = DOC.documentMode,
    supportHashChange = ('on' + hashchange in window) && ( documentMode === void 0 || documentMode > 7 );
   
    $.fn[ hashchange ] = function(callback){
        return callback?  this.bind(hashchange, callback ) : this.fire( hashchange);
    }
    $.fn[ hashchange ].delay = 50;
    if(!supportHashChange){
        $.log("不支持hashchange，使用iframe加定时器模拟")
        var iframe, timeoutID, html = '<!doctype html><html><body>#{0}</body></html>'
        
        if( $.fn[ hashchange ].domain){
            html = html.replace("<body>","<script>document.domain ="+ 
                $.fn[ hashchange ].domain +"</script><body>" )
        }
        // IE6直接用location.hash取hash，可能会取少一部分内容
        // 比如 http://www.cnblogs.com/rubylouvre#stream/xxxxx?lang=zh_c
        // ie6 => location.hash = #stream/xxxxx
        // 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
        // firefox 会自作多情对hash进行decodeURIComponent
        // 又比如 http://www.cnblogs.com/rubylouvre/#!/home/q={%22thedate%22:%2220121010~20121010%22}
        // firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
        // 其他浏览器 => #!/home/q={%22thedate%22:%2220121010~20121010%22}
        function getHash ( url) {//用于取得当前窗口或iframe窗口的hash值
            url = url || DOC.URL
            return '#' + url.replace( /^[^#]*#?(.*)$/, '$1' );
        }
        function getHistory(){
            return getHash(iframe.location);
        }
        function setHistory(hash, history_hash){
            var doc = iframe.document;
            if (  hash !== history_hash ) {//只有当新hash不等于iframe中的hash才重写
                //用于产生历史
                try{
                    doc.open();
                    doc.write($.format(html, hash));
                    doc.close();
                }catch(e){
                    clearInterval(timeoutID)
                }
            }
        }
        var last_hash = getHash(), history_hash, hash = "#";
        $.event.special[ hashchange ] = {
            setup: function(desc) {
                $.require("ready", function(){
                    if (!iframe) {
                        //创建一个隐藏的iframe，使用这博文提供的技术 http://www.paciellogroup.com/blog/?p=604.
                        //iframe是直接加载父页面，为了防止死循环，在DOM树未建完之前就擦入新的内容 
                        var el = $('<iframe tabindex="-1" style="display:none" widht=0 height=0 title="empty" />').appendTo( document.body )[0], fn
                        iframe = el.contentWindow
                        $.bind(el, "load",fn = function(){
                            $.unbind(el, "load", fn)
                            var doc = iframe.document
                            doc.open();
                            doc.write($.format(html, hash))
                            doc.close();
                            timeoutID = setInterval(poll,  $.fn[ hashchange ].delay)
                        });
                        function poll() {
                            var hash = getHash(),//取得主窗口中的hash
                            history_hash = iframe.document.body.innerText;//取得现在iframe中的hash
                            if(hash !== last_hash){//如果是主窗口的hash发生变化
                                setHistory(last_hash = hash, history_hash )
                                $(desc.currentTarget).fire(hashchange)
                            }else if(history_hash !== last_hash){//如果按下回退键，
                                location.href = location.href.replace( /#.*/, '' ) + history_hash;
                            }
                        }
                    }
                   
                });
            },
            teardown: function(){
                if(!iframe){
                    clearTimeout(timeoutID);
                    $(iframe).remove();
                    iframe = 0;
                }
            }
        };
    }
return $
})


/**
* 
      <script type="html">
            $(function(){
            var el = $("#show_result")
            document.onclick = function() {
            var t = "#" + Math.random();
            location.hash = t
            }
            $(window).hashchange(function() {
            el.html(location.href)
            })
            })
        </script>
* 
*/