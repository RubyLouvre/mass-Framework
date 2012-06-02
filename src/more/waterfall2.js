$.define("waterfall","more/uibase, more/ejs,event,attr,fx",function(Widget){
    var Waterfall = $.factory({
        inherit: Widget.Class,
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
        },
        //根据屏幕自动调整列宽
        getColumnNumber: function(){
            return 4;
        },
        //设置列的对齐方式
        setColumnAlign: function(space){
            var cols = this.target.find("waterfall-col"), margin;
            this.cols = cols;
            this.align = this.align || "left";
            switch(this.align){
                case "center":
                    margin = Math.floor( space / cols + 1);
                    cols.css({
                        marginLeft: margin,
                        marginRight: margin
                    })
                    break;
                case "left":
                    margin = Math.floor( space / cols - 1);
                    cols.css({
                        marginLeft: 0,
                        marginRight: margin
                    })
                    break;
                case "right":
                    margin = Math.floor( space / cols -1);
                    cols.css({
                        marginLeft: margin,
                        marginRight: 0
                    })
                    break;
            }
        },
        //求当前最短的列
        getShortestColumn: function(){
            var result = 0, cols = this.cols, shortest = this.shortest, h;
            for(var i = 0; i < cols.length; i++){
                h = cols[i].offsetHeight;
                if( h < shortest ){
                    this.shortest = shortest = h
                    result = i
                }
            }
            return cols[ result ];
        },
        appendDatas: function(json){
            var array = this.jsonData;
            //将JSON数据转换成HTML数据
            for(var i = 0, el; el = json[i++];){
                array.push( $.ejs( this.ejs, el) )
            }
            this.loadCallback()
            this.appendCells();
        },
        //添加许多格子
        appendCells: function( num ){//把格子添加到瀑布流的列中去,如果没有指定数量,它会用尽htmlData里面的节点
            var cells = this.target.find("waterfall-cell");
            var total = this.htmlData.length
            var opacity = cells > this.firestScreenCellNumber ? 0 : 1;
            num = num ? Math.min(num, total) : total;
            this.appendCell( cells.splice(0, num), opacity );
        },
        //把指定的格子递归添加到DOM树上
        appendCell: function( cells, opacity ){
            var cell = cells.shift(), ui = this;
            if( cell ){
                var col = this.getShortestColumn();
                col.append( cell );
                var image = $(cell).css("opacity", opacity ).find( this.image )[0];
                if( image ){//加载下一张图片
                    var i = 0;
                    (function recursion(){
                        //判定大图是否加载成功
                        if(image.complete == true || ++i > 15){
                            ui.appendCell( cells, opacity );
                        }else{
                            setTimeout( recursion, 20);
                        }
                    })();
                }else{//如果没有指定图片的CSS表达式,或者图片死链,直接开始添加下一个格子
                    ui.appendCell( cells, opacity );
                }
            }else {
                this.loadCallback();//如果这轮的格子都添加成功了,执行此回调
            }
        },
        setLayout: function(){
            this.adjusting = true;//调整中,此时不宜加载数据
            var cols = this.target.find("waterfall-col");
            var num = this.getColumnNumber();
            var cn = cols.length, n;
            if( n < num){//如果瀑布布里面没有列,或列数不够,补够它
                n = num - cn;
                for(var i = 0; i < n ; i++){
                    $("<div class='waterfall-col' />").css({
                        "float": "left",
                        "width":  this.columnWidth
                    }).appendTo(this.target)
                }
            }else if( cn > num ){//可能瀑布流里面的第一屏格子都用PHP渲染好了,就会出现要求四列,但却输出了五列情况
                n = num - cn;
                var removeColumn = cols.slice(n);//要移除的列队,从右边取起;
                var cells = removeColumn.find("waterfall-cell");//取得里面的格式,回收到htmlData中去
                Array.prototype.push.array(this.htmlData, cells);
            }
            var space = Math.floor( ( this.width - num * this.columnWidth));//取得行间空白的总宽
            this.setColumnAlign( space );//调整列间的空白
            this.adjusting = false;
            this.appendCell();
        }
    });
    var now = 0;
    $(window).scroll( function(){
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
        jsonData: [],
        htmlData: [],
        image: ".waterfall-image",//格子中的大图的CSS表达式
        fade: true,// 是否使用淡入效果
        fadeTime:500,//淡入时间
        shortest: 1, //默认最短的列的高为1px
        loadCallback: function(){},//每次数据加载成功后执行的回调
        appendCallback: function(){},//每次指定的格子都添加到DOM树后执行的回调
        columnAlign: "center",//列的显示方式，是怎么对齐
        firestScreenCellNumber: 20 
    //第一屏要显示出来的格子数。在瀑布流中，默认第一屏格式是不做淡出动画，它们直接显示在页面
    //如果超出这个阀值的格子，当我们用模板生成它们时，会立即把它们的透明度设置为0。当用户滚动到此格子附近时，才淡出显示它。
    }
    //拥有如下参数： 
    var init = function(ui, hash){
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        ui.target = ui.parent;//所有控件都有target属性，这个也不例外
        ui.width = ui.width || ui.target.width();//求得容器宽
        ui.top = ui.target.offset().top//瀑布流容器距离页面顶部的距离
        ui.setLayout();
    }

    $.fn.waterfall = Widget.create("waterfall", Waterfall, init )
});
