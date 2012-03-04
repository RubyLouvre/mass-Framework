$.define("pager","more/uibase,event",function(Widget){
    var defaults = {
        show_last: true,
        show_first:true,
        show_prev: true,
        show_next: true,
        link_class: "link",
        prev_class: "prev_page",
        next_class: "next_page",
        next_text: "下一页&gt;",
        prev_text: "&lt;上一页",
        curr_page: 1,//都是从1开始的
        per_page: 10,//每页显示多少条目
        show_pages:10,//显示多少个页码,建议取最中间的那个页码,比如是说11取6,可以确保视觉上的对称性
        fill_text:"...",
        show_jump:false,//是否显示跳转框
        callback: function(e, ui , i){}
    /*total: 1000*/
    }
    function createLink(tag, index, text, cls){
        return tag == "a" ?  $.format('<#{tag} class="#{cls}" data-page="#{index}" href="?page=#{index}">#{text}<\/#{tag}>',{
            tag: tag,
            index: index,
            text: text,
            cls: cls
        }) : text
    }
    function init( ui, hash ){
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        if(!isFinite( ui.total)){
            throw "必须拥有total属性，它为一个正整数"
        }
        ui.render();
        ui.target.delegate("a, input", "click",function(e){
            if( typeof ui.callback == "function" ){
                return ui.callback.call( this, e, ui, ~~this.getAttribute("data-page") );
            }
        })
    }
    var Pager = $.factory({
        inherit: Widget.Class,
        render: function(){
            var max = this.total_pages = Math.ceil( this.total / this.per_page),//计算总页数
            count = this.show_pages = Math.min( this.show_pages, this.total_pages ),//计算还剩下多少页要生成
            curr = this.curr_page, add_more = false, link = this.link_class;
            curr = this.curr_page = curr < 1 ? 1 : curr > this.total_pages ? this.total_pages : curr;
            //生成当前页
            var html = [ createLink( "span", curr ,curr,"current_page") ], left = curr-1,  right = curr + 1;
            --count ;
            //当成中间要显示的页
            while( count > 0 ) {
                if( left >= 1 && count != 0 ) {//在日常生活是以1开始的
                    html.unshift( createLink( "a", left--, left + 1, link ) );
                    --count
                }
                if( right <= max && count != 0 ) {
                    html.push( createLink( "a", right, right++ , link ) );
                    --count;
                }
            }
            var space = left ;
            if( space > 1 ){//如果有至少两个位置,则可以用它放置第一页与省略号
                html.unshift( createLink( "code", 0, this.fill_text ) );//添加省略号
                add_more = true;//如果有省略号肯定能向前翻
            }
            if( space >= 1 && this.show_first ) {//只要留有至少一个空位,就可以显示最后一页
                html.unshift( createLink("a", 1, 1, link ) );
            }
            if( add_more  && this.show_prev ) {//如果允许显示上一页
                html.unshift( createLink("a", curr - 1, this.prev_text, this.prev_class ) );
            }
            space = max - (right-1), add_more = false;
            if( space > 1 ) {//如果有至少两个位置,则可以用它放置最后一页与省略号
                html.push( createLink( "code", 0, this.fill_text ) );//添加省略号
                add_more = true;//如果有省略号肯定能向后翻
            }
            if( space >= 1 && this.show_last ) {//只要留有至少一个空位,就可以显示最后一页
                html.push( createLink( "a",max, max, link ) );
            }
            if( add_more  && this.show_next ) {//如果允许显示下一页
                html.push( createLink( "a", curr + 1, this.next_text, this.next_class ) );
            }
            if( this.show_jump ){
                html.push( "<kbd>跳转到第<input \/>页<\/kbd>" );
            }
            html.unshift( '<div class="mass_pager">' );
            html.push( '<\/div>' );
            this.parent.html( html.join("") );//每次都会清空目标元素,因此记得找个空标签来放分页栏啊
            this.target = this.parent.find("> .mass_pager")
        }
    });

    $.fn.pager = Widget.create("pager", Pager, init )

   
});
/*
另外suggest 我在githup上放过一个
http://leecade.github.com/suggest/
http://leecade.github.com/suggest/demo.html
http://www.xarg.org/2011/09/jquery-pagination-revised/#1
*/