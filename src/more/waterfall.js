$.define("waterfall","more/uibase,more/ejs,event,attr,fx",function(Widget){
    $.log("已加载waterfall模块")
    var Waterfall = $.factory({
        inherit: Widget.Class,
        addBricks: function(json){
            var array = [];
            //将JSON数据转换成HTML数据
            for(var i = 0, el; el = json[i++];){
                array.push($.ejs( this.ejs_id, el))
            }
            var first = this.cols[0];
            //如果瀑布流一块砖头也没有，那么就添加到第一列中，然后待到这砖头中的大图加载完毕后再添加下一块砖头
            this.addBrick( array.shift(), array, first && first.childNodes.length == 0 ? 0 : NaN );
        },
        addBrick: function(html, htmls ,index ){
            var ui = this, img, brick
            if(isFinite(index)){
                //将HTML数据转换成节点数据
                brick = $(html).appendTo( ui.cols.eq(index) );
                ui.bricks.push(brick);
                img = brick.find(ui.img_expr)[0];
                if( img ){
                    (function fn(){
                        //判定大图是否加载成功
                        if(img.complete == true){
                            index = ui.whichCol();
                            ui.addBrick( htmls.shift(), htmls, index );
                        }else{
                            setTimeout( fn, 16 );
                        }
                    })();
                }
            }else {
                index = ui.whichCol();
                ui.addBrick( htmls.shift(), htmls, index );
            }
            if(!html){
                ui.append_callback();
            }
        },
        whichCol: function(){
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
        scroll: function( callback ){
            var now = 0, ui = this, interval = ui.interval, bricks = this.bricks,
            mode = !document.compatMode || document.compatMode == 'CSS1Compat',
            body = mode ?  document.documentElement : document.body;
            W(window).on("scroll", function(){
                var time = new Date;
                if(time - now > interval ){
                    now = time;
                    var pageYOffset  =  window.pageYOffset || body.scrollTop, //"pageXOffset" in window ? window.pageXOffset :
                    viewportHeight = body.clientHeight,
                    pageHeight = $(document).height(),
                    rollHeight = pageYOffset + viewportHeight;
                    for( var i = 0; i < bricks.length; i++ ){
                        var el = bricks[i], top = el.offset().top;//取得元素相对于整个页面的Y位置
                        if( rollHeight >= top ) { //如果页面的滚动条拖动要处理的元素所在的位置
                            callback.call( ui ,el );//调用回调，让元素显示出来
                        }
                    }
                    callback.call(ui, rollHeight, pageHeight)
                }
            });
        }
    });
    var defaults = {
        bricks: [],
        img_expr: ".waterfall_img",
        append_callback: $.noop
    }
    //拥有如下参数： ejs_id，data, col_width, width, img_expr
    var init = function(ui, hash){
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        ui.target = ui.parent;//所有控件都有target属性，这个也不例外
        ui.width = ui.width || ui.target.width();//求得容器宽
        
        var gw = ( ui.width - ui.col * ui.col_width)/ ui.col; //列间距离
        for(var i = 0; i < ui.col ; i++){
            $("<div class='waterfall_cols' />").css({
                "float": "left",
                "margin-left": (i == 0 ? 0 : gw),
                "width": ui.col_width
            }).addClass("waterfall_cols").appendTo(ui.target)
        }
        ui.cols = ui.target.find(".waterfall_cols");
    }


    $.fn.waterfall = Widget.create("waterfall", Waterfall, init )
})