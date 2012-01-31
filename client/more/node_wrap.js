
$.define("node_wrap",'node',function(){
    $.implement({
        /**
             *用一个标签包裹所有匹配节点
             */
        wrapAll: function( html ) {
            if ( this[0] ) {
                var wrap = $( html, this.ownerDocument ).beforeTo( this[0] );
                wrap = this[0].previousSibling;//取得包裹体的最外层
                while ( wrap && wrap.firstChild && wrap.firstChild.nodeType === 1 ) {
                    wrap = wrap.firstChild;//取得包裹体的最内层
                }
                this.each(function(el){
                    wrap && wrap.appendChild(el)//把匹配节点都移入包裹体的最内层中
                });
            }
            return this;
        },
        /**
             * 移除所有匹配元素的父节点,并把它们放到其祖父中去.此方法其实叫removeParent更合适
             */
        unwrap: function() {
            return this.map(function(el){
                return el.parentNode;
            }).each(function(){
                if(this.parentNode && this.parentNode.nodeType == 1 && this.tagName !== "BODY" ){
                    $(this,this.ownerDocument).replace(this.childNodes );
                }
            });
        },
        /**
             * 把每一个匹配元素都用东西包裹起来
             */
        wrap : function( html ) {
            return this.each(function() {
                $( this,this.ownerDocument ).wrapAll( html );
            });
        },
        //把每一个匹配元素的子节点都用东西包裹起来
        wrapInner :function(html){
            return this.each(function() {
                var contents = this.childNodes;
                if ( contents.length ) {
                    $(contents,this.ownerDocument).wrapAll( html );
                } else {
                    $(this,this.ownerDocument ).append( html );
                }
            });
        }
    });
})
