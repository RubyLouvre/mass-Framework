$.define("pagination","event",function(){
    var defaults = {
        show_first:true,
        show_last: true,
        show_prev: true,
        show_next: true,
        show_jump: false,//是否显示跳转框
        prev_class: "prev_page",
        next_class: "next_page",
        curr_class: "curr_page",
        link_class: "link_page",
        fill_class: "fill_page",
        disabled_class: "disabled",
        curr_tag: "em",
        fill_tag: "code",
        next_text: "下一页&gt;",
        prev_text: "&lt;上一页",
        fill_text:"...",
        disabled_tag: "span",
        selector: "a,input",
        /* total : 100 ,*/
        /* offset : 100 ,*/
        curr_page: 1,//都是从1开始的
        per_pages: 10,//每页显示多少条目
        show_pages:10,//显示多少个页码,建议取最中间的那个页码,比如是说11取6,可以确保视觉上的对称性
        layout: "prev,first,link,last,next,jump",//布局
        jump_text: "<kbd>跳转到第<input \/>页<\/kbd>" ,
        link_tmpl: '<#{tag} class="#{class}" data-page="#{index}" href="?page=#{index}">#{text}<\/#{tag}>',//链接的模板
        callback: function(e, ui , i){}
    }
    var Pager = $.factory({
        init: function( target, total, option ){
            if( isFinite( total ) ){
                this.total = total;
            }else{
                throw "第一个参数必须是一个正整数"
            }
            var opt = $.Object.merge( {}, defaults, option || {});
            this.target = target;
            for(var i in opt){
                this[i] = opt[i];
            }
            this.render();
        },
        //暴露出来让人改写
        createPage: function (type, index, disabled){
            var d = disabled === true;
            return  $.format(this.link_tmpl,{
                index:    index,
                tag:      this[(d ? "disabled" : type)+"_tag"] || "a",
                text:     this[type+"_text"] || index,
                "class":  (this[type+"_class"] || "")+ (d ? " "+ this.disabled_class : "")
            })
        },
        render: function(){
            var max = this.total_pages = Math.ceil( this.total / this.per_pages),//计算总页数
            count = this.show_pages = Math.min( this.show_pages, this.total_pages ),//计算还剩下多少页要生成

            curr = this.curr_page, disabled = true;
            curr = this.curr_page = curr < 1 ? 1 : curr > this.total_pages ? this.total_pages : curr;
            //生成当前页
            var pages = [ this.createPage( "curr", curr ) ], left = curr-1,  right = curr + 1;
            --count ;
            //生成中间要显示的页
            while( count > 0 ) {
                if( left >= 1 && count != 0 ) {//在日常生活是以1开始的
                    pages.unshift( this.createPage( "link", left-- ) );
                    --count
                }
                if( right <= max && count != 0 ) {
                    pages.push( this.createPage( "link", right++ ) );
                    --count;
                }
            }
            var space = left ;
            if( space > 1 ){//如果有至少两个位置,则可以用它放置第一页与省略号
                pages.unshift( this.createPage( "fill" ) );//添加省略号
                disabled = false;//如果有省略号肯定能向前翻
            }
            if( space >= 1  && this.show_first ) {//只要留有至少一个空位,就可以显示第一页
                pages.first = this.createPage( "first" ,1 );
            }
            if(this.show_prev){
                pages.prev = this.createPage( "prev" ,curr - 1, disabled );
            }
            space = max - (right-1), disabled = true;
            if( space > 1 ) {//如果有至少两个位置,则可以用它放置最后一页与省略号
                pages.push( this.createPage( "fill" ) );//添加省略号
                disabled = false;//如果有省略号肯定能向后翻
            }
            if( space >= 1 && this.show_last ) {//只要留有至少一个空位,就可以显示最后一页
                pages.last = this.createPage( "last", max );//最后一页
            }
            if(this.show_next){
                pages.next = this.createPage( "next", curr + 1, disabled );
            }
            if(this.show_jump){
                pages.jump = this.jump_text;
            }
            pages.link = pages.join("");
            var html = '<div class="pagination">';
            this.layout.replace( $.rword, function( key ){
                if(  pages[ key ] ){
                    html += pages[ key ];
                }
            });
            this.target.html( html + '<\/div>' );//每次都会清空目标元素,因此记得找个空标签来放分页栏啊
        }
    });

    $.fn.pagination = function( total, opt ){
        var ui = new Pager( this, total, opt );
        return this.delegate( ui.selector, "click",function(e){
            if( typeof ui.callback == "function" ){
                $.log(this)
                return ui.callback.call( this, e, ui, ~~this.getAttribute("data-page") );
            }
        })
    }
})
/*
另外suggest 我在githup上放过一个
http://leecade.github.com/suggest/
http://leecade.github.com/suggest/demo.html
    var decode = window.decodeURIComponent
    var getParam = function(path){
        var result = {},param = /([^?=&]+)=([^&]+)/ig,match;
        while((match = param.exec(path)) != null){
            result[decode(match[1])] = decode(match[2]||"");
        }
        return result;
    }
*/