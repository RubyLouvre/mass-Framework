define("hashchange", ["$event"], function(){
    //介绍 http://www.impng.com/web-dev/hashchange-event-and-onhashchange.html
    //https://github.com/kof/hashchange/blob/master/src/jquery.hashchange.js
    var hashchange = 'hashchange', DOC = document, documentMode = DOC.documentMode,
    supportHashChange = 'on' + hashchange in window && ( documentMode === undefined || documentMode > 7 );
    $.fn[ hashchange ] = function(callback){
        return callback?  this.bind(hashchange, callback ) : this.fire( hashchange);
    }
    $.fn[ hashchange ].delay = 50;
    if(!supportHashChange){
        var iframe, iframe_src, last_hash = get_fragment()
        $.eventAdapter[ hashchange] = {
            setup: function() {
                $.require("ready", function(){
                    if (!iframe) {
                        iframe_src = $.fn.hashchange.src;
                        iframe_src = iframe_src && iframe_src + get_fragment();
                        //创建一个隐藏的iframe，使用这博文提供的技术 http://www.paciellogroup.com/blog/?p=604.
                        iframe = $('<iframe tabindex="-1" hidden style="display:none" widht=0 height=0 title="empty"/>')
                        .one( 'load', function(){
                            iframe_src || history_set( get_fragment() );
                            poll();
                            })
                        .attr( 'src', iframe_src || 'javascript:0' )
                        //为了防止出现人为的滚动条
                        .afterTo( 'html' )[0].contentWindow;

                        // Whenever `document.title` changes, update the Iframe's title to
                        // prettify the back/next history menu entries. Since IE sometimes
                        // errors with "Unspecified error" the very first time this is set
                        // (yes, very useful) wrap this with a try/catch block.
                        $.bind(DOC,"propertychange", function(e){
                            try {
                                if ( e.propertyName === 'title' ) {
                                    iframe.document.title = DOC.title;
                                }
                            } catch(e) {}
                        })
                    }
                });
            }
        };
        function get_fragment (url) {
            url = url || DOC.URL
            // IE6直接用location.hash去hash是不安全的
            // 比如 https://www.google.com.hk/reader/view/#stream/xxxxx?lang=zh_c
            // ie6 => location.hash = #stream/xxxxx
            // 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
            // 2.
            // #!/home/q={%22thedate%22:%2220121010~20121010%22}
            // firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
            return '#' + url.replace( /^[^#]*#?(.*)$/, '$1' );
        }
        //取得隐藏iframe的hash值
        function history_get() {
            return get_fragment( iframe.location.href );
        };
        function history_set( hash, history_hash ) {
            var iframe_doc = iframe.document,
            domain = $.fn[ hashchange ].domain;
        
            if ( hash !== history_hash ) {
                // Update Iframe with any initial `document.title` that might be set.
                iframe_doc.title = DOC.title;
          
                // Opening the Iframe's document after it has been closed is what
                // actually adds a history entry.
                iframe_doc.open();
          
                // Set document.domain for the Iframe document as well, if necessary.
                domain && iframe_doc.write( '<script>document.domain="' + domain + '"</script>' );
          
                iframe_doc.close();
                // Update the Iframe's hash, for great justice.
                iframe.location.hash = hash;
            }
        };
        function poll() {
            var hash = get_fragment(),
            history_hash = history_get( last_hash );
      
            if ( hash !== last_hash ) {
                history_set( last_hash = hash, history_hash );
        
                $(window).fire( "hashchange" );
        
            } else if ( history_hash !== last_hash ) {
                location.href = location.href.replace( /#.*/, '' ) + history_hash;
            }
      
            timeout_id = setTimeout( poll, $.fn[ hashchange ].delay );
        };
        
    }

})