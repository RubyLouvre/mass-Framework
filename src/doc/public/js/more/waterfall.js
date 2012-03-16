$.define("waterfall","more/uibase, more/ejs,event,attr,fx",function(Widget){
    //$.log("已加载waterfall模块")
    var Waterfall = $.factory({
        inherit: Widget.Class,
        addTiles: function(json){
            var array = this.data;
            //将JSON数据转换成HTML数据
            for(var i = 0, el; el = json[i++];){
                array.push($.ejs( this.ejs_id, el))
            }
            var first = this.cols[0];
            //如果瀑布流一块砖头也没有，那么就添加到第一列中，然后待到这砖头中的大图加载完毕后再添加下一块砖头
            this.addTile( array.shift(), array, first && first.childNodes.length == 0 ? 0 : NaN );
        },
        addTile: function(html, htmls ,index ){
            var ui = this, img, tile
            if(html){
                if(isFinite(index)){
                    //将HTML数据转换成节点数据
                    tile = $(html).appendTo( ui.cols.eq(index) );
                    if(ui.fade){
                        tile.css("opacity",0)
                    }
                    ui.tiles.push( tile );
                    img = tile.find(ui.img_expr)[0];
                    if( img ){
                        (function fn(){
                            //判定大图是否加载成功
                            if(img.complete == true){
                                ui.addTile( htmls.shift(), htmls, ui.getShortestColumn() );
                            }else{
                                setTimeout( fn, 16 );
                            }
                        })();
                    }
                }else {
                    ui.addTile( html, htmls, ui.getShortestColumn() );
                }
            }else{
                ui.callback();
            }
        },
        getShortestColumn: function(){
            //求当前最短的列
            var result = 0, cols = this.cols, shortest, h;
            for(var i = 0; i < cols.length; i++){
                h = cols[i].offsetHeight;
                if(i == 0){
                    shortest = h;
                }
                if(h < shortest ){
                    shortest = h;
                    result = i
                }
            }
            return result;
        },
        //为原始的回调绑定参数
        curry : function( callback ){
            var ui = this, tiles = ui.tiles;
            var pageHeight = $(document).height(), rollHeight = $(window).scrollTop() +  $(window).height()
            for( var i = 0; i < tiles.length; i++ ){
                var tile = tiles[i], top = tile.offset().top;//取得元素相对于整个页面的Y位置
                if( rollHeight >= top ) { //如果页面的滚动条拖动要处理的元素所在的位置
                    if(ui.fade){
                        tile.fx( ui.fade_time,{
                            o:1
                        });
                    }
                    callback.call( ui ,tile );//调用回调，让元素显示出来
                }
            }
            callback.call(ui, rollHeight, pageHeight);
        },
        scroll: function( callback ){
            //这只是一个代理，用于添加回调的
            Waterfall.scrollCallbacks.push({
                fn: callback || function(){},
                ui: this
            });
        }
    });
    var now = 0;
    $(window).scroll(function(){
        var time = new Date, els = Waterfall.scrollCallbacks;
        if(time - now > 13 ){
            now = time;
            for(var i = 0, el; el = els[i++]; ){
                el.ui.curry( el.fn );
            }
        }
    });
    Waterfall.scrollCallbacks = [];
    var defaults = {
        tiles: [],
        data: [],
        img_expr: ".waterfall_img",/*砖头中的大图的CSS表达式*/
        callback: $.noop,
        fade: false,/* 是否使用淡入效果*/
        fade_time:500/*淡入时间*/
    }
    //拥有如下参数： ejs_id，data, col_width, width, img_expr
    var init = function(ui, hash){
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        ui.target = ui.parent;//所有控件都有target属性，这个也不例外
        ui.width = ui.width || ui.target.width();//求得容器宽
        var gutter = Math.floor( ( ui.width - ui.col * ui.col_width)/ (ui.col - 1) ); //列间距离
        for(var i = 0; i < ui.col ; i++){
            $("<div class='waterfall_cols' />").css({
                "float": "left",
                "margin-left": (i == 0 ? 0 : gutter),
                "width": ui.col_width
            }).addClass("waterfall_cols").appendTo(ui.target)
        }
        ui.cols = ui.target.find(".waterfall_cols");
    }

    $.fn.waterfall = Widget.create("waterfall", Waterfall, init )
});
