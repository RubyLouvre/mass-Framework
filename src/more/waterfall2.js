$.define("waterfall","more/uibase, event,attr,fx",function(Widget){
    var Waterfall = $.factory({
        inherit: Widget.Class,
        //为原始的回调绑定参数
        curry : function( callback ){
            var els = this.fadeData;
            var thresholds = this.shortest + this.top + this.diff;
            var rollHeight = Math.max( document.body.scrollTop, $.html.scrollTop)
            for( var i = 0; i < els.length; i++ ){
                var dom = els[i], top = dom.offset().top;//取得元素相对于整个页面的Y位置
                if( rollHeight >= top ) { //如果页面的滚动条拖动要处理的元素所在的位置
                    if(this.fade){
                        dom.fx( this.fadeTime,{
                            o:1
                        });
                    }
                    callback.call( this ,dom );//调用回调，让元素显示出来
                }
            }
            callback.call(this, rollHeight, thresholds);
        },
        scroll: function( callback ){
            //这只是一个代理，用于添加回调的
            Waterfall.scrollCallbacks.push({
                fn: callback || function(){},
                ui: this
            });
        },
        //设置列的对齐方式
        setColumnAlign: function(space){
            this.cols = this.target.find(".waterfall-col");
            this.align = this.align || "left";
            var cols = this.cols.length, margin;
            switch(this.align){
                case "center":
                    margin = Math.floor( space / cols + 1);
                    this.cols.css({
                        marginLeft: margin,
                        marginRight: margin
                    })
                    break;
                case "left":
                    margin = Math.floor( space / cols - 1);
                    this.cols.css({
                        marginLeft: 0,
                        marginRight: margin
                    })
                    break;
                case "right":
                    margin = Math.floor( space / cols -1);
                    this.cols.css({
                        marginLeft: margin,
                        marginRight: 0
                    })
                    break;
            }
        },
        //求当前最短的列
        getShortestColumn: function(){
            var result = 0, cols = this.cols, shortest , h;
            for(var i = 0; i < cols.length; i++){
                h = cols[i].offsetHeight;
                if(i == 0){
                    shortest = h;
                }
                if(h < shortest ){
                    shortest = h;
                    this.shortest = h
                    result = i
                }
            }
            return cols[ result ]
        },
        //将JSON数据转换成HTML数据
        appendDatas: function(json){
            var array = this.htmlData;
            for(var i = 0, el; el = json[i++];){
                array.push( this.makeCallback(el, this) )
            }
            this.loadCallback()
            this.appendCells();
        },
        //将HTML数据转换成DOM数据
        appendCells: function( num ){
            var cells = this.target.find(".waterfall-cell").get();//检测瀑布流已经插入了多少格子
            var array = this.htmlData;//等待添加到DOM树的HTML数据
            var opacity = cells.length > this.screenCellNumber() ? 0 : 1;
            num = num ? Math.min(num, array.length) : array.length;
            this.appendCell( array.splice(0, num), opacity );
        },
        //把DOM数据添加到DOM树
        appendCell: function( cells, opacity ){
            this.adjusting = true;
            var cell = cells.shift(), ui = this;
            if( cell ){
                var col = this.getShortestColumn();
                var dom = $(cell).appendTo(col);
                if(opacity == 0){
                    this.fadeData.push( dom );
                    dom.css("opacity", opacity );
                }
                //  $.log(this.image)
                var image = dom.find( this.image )[0];
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
                this.adjusting = false;
                this.appendCallback();//如果这轮的格子都添加成功了,执行此回调
            }
        },
        setLayout: function(){
            this.adjusting = true;//调整中,此时不宜加载数据
            var cols = this.target.find(".waterfall-col");
            var num = this.columnNumber();
            var cn = cols.length,  n = num - cn;
            if( cn < num){//如果瀑布布里面没有列,或列数不够,补够它
                for(var i = 0; i < n ; i++){
                    $("<div class='waterfall-col' tabindex="+i+" />").css({
                        "float": "left",
                        "width":  this.columnWidth
                    }).appendTo(this.target)
                }
            }else if( cn > num ){//可能瀑布流里面的第一屏格子都用PHP渲染好了,就会出现要求四列,但却输出了五列情况
                var removeColumn = cols.slice(n);//要移除的列队,从右边取起;
                var cells = removeColumn.find(".waterfall-cell");//取得里面的格式,回收到htmlData中去
                Array.prototype.push.array(this.htmlData, cells);
            }
            var space = Math.floor( ( parseInt(this.width) - num * this.columnWidth));//取得行间空白的总宽
            this.setColumnAlign( space );//调整列间的空白
            this.appendCells();//开始添加格子
            this.adjusting = false;
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
        fadeData: [],
        image: ".waterfall-image",//格子中的大图的CSS表达式
        fade: true,// 是否使用淡入效果
        fadeTime:500,//淡入时间
        shortest: 1, //默认最短的列的高为1px
        diff: 1,
        makeCallback: function(json){},//此回调必须返回HTML数据或DOM数据
        loadCallback: function(){},//每次数据加载成功后执行的回调
        appendCallback: function(){},//每次指定的格子都添加到DOM树后执行的回调
        columnNumber:function(){ //根据屏幕自动调整列宽
            return 4
        },
        screenCellNumber:function(){//每屏的大致格子数
            return 5
        },
        columnAlign: "center",//列的显示方式，是怎么对齐
        columnWidth: 200,//列宽
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
