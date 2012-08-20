;(function(){
    /**
     * @param target {String|Dom} 瀑布流容器的CSS表达式或DOM
     * @param width {Number} 可选，瀑布流容器的宽
     * @param colWidth {Number} 瀑布流每列的宽
     * @param col {Number} 瀑布流里面一共分多少列
     * @param imgExpr {String} 可选，砖头里大图的CSS表达式，仅在后端没有给出高，使用递归添加砖头时使用
     */
    var Waterfall = function(hash){
        for(var i in hash){
            this[i] = hash[i];// container, width, colWidth
        }
        if(typeof this.target == "string"){
            this.target = W(this.target)
        }
        var col = this.col,
        target = this.target,
        pw = this.width ||  parseFloat( target.getSize().width ),//容器的宽
        gw =  Math.floor((pw - col * this.colWidth)/( col-1));//列间距离
        if(!"1"[0] ){//针对IE6的间距都减去1，防止在个人页出现“两列”布局
            gw = gw - 1;
        }
        for(i = 0; i < col ; i++){
            W("<div class='cols index_"+i+"' />").setStyle({
//                position: "relative",
                "float": "left",
                "overflow-x": !"1"[0] ? "hidden":"",
                marginLeft: (i == 0 ? 0 : gw )+"px",
                width: this.colWidth+"px"
            }).insertTo('beforeend', target[0]);
        }

        this.cols = target.query(".cols");
        this.bricks = [];
    }
    Waterfall.scrollCallbacks = [];

    Waterfall.prototype = {
        shortest: 0,
        //循环添加砖头（需要后端配合）
        addBricks:function(tiles, callback){
            callback = callback || function(){};
            var cols = this.cols;
            for(var i = 0, tile; tile = tiles[i++]; ){
                var ci = this.getShortestColumn();//求出最短的栏栅的索引值
                var brick = W( tile ).insertTo('beforeend', cols[ci] );//插入到DOM树
                this.bricks.push( brick );
            };
            callback.call(this, this.bricks);
        },
//        //递归添加砖头
//        addBricksByRecursion : function( tiles, callback ){
//            callback = callback || function(){};
//            var first = this.cols[0];
//            //如果瀑布流一块砖头也没有，那么就添加到第一列中，然后待到这砖头中的大图加载完毕后再添加下一块砖头
//            this.addBrick( tiles.shift(), tiles, first && first.childNodes.length == 0 ? 0 : NaN , callback);
//        },
//        //为addBricksByRecursion内部调用
//        addBrick: function(html, tiles ,index, callback){
//            var ui = this, img, brick
//            if(html){
//                if(isFinite(index)){
//                    //将HTML数据转换成节点数据
//                    brick = W(html).insertTo('beforeend', ui.cols.item(index)[0] );
//                    ui.bricks.push( brick );
//                    img = brick.query(ui.imgExpr || ".brick_img")[0];
//                    if( img ){//加载下一张图片
//                        var i = 0;
//                        (function fn(){
//                            //判定大图是否加载成功
//                            if(img.complete == true || ++i > 10){
//                                ui.addBrick( tiles.shift(), tiles, ui.getShortestColumn(), callback );
//                            }else{
//                                setTimeout( fn, 20);
//                            }
//                        })();
//                    }else{
//                        ui.addBrick( tiles.shift(), tiles, ui.getShortestColumn(), callback );
//                    }
//                }else {
//                    ui.addBrick( html, tiles, ui.getShortestColumn(), callback );
//                }
//            }else{
//                (callback || function(){} ).call(ui, this.bricks);
//            }
//        },

        //计算出最短的栏栅
        getShortestColumn: function(){
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
            this.shortest = shortest;
            return result;
        },

        //为原始的回调绑定参数
        curry : function( callback ){
            var els = this.bricks, B = Dom.getDocRect();
            if(! Waterfall.isMacSafari ){
                for( var i = 0, n = els.length; i < n; i++ ){
                    var el = els[i], top = el.getXY()[1];//取得元素相对于整个页面的Y位置
                    if( B.scrollY + B.height >= top ) { //如果页面的滚动条拖动要处理的元素所在的位置
                        callback.call(this, el , i, els );//调用回调，让元素显示出来
                    }
                }
            }
            var self = this;
            //用于判定是否接近底部
            setTimeout(function(){
                callback.call(self,  B.scrollY, B.scrollHeight, B );
            },0);
            
        },
        //用于添加scroll回调
        scroll: function( callback ){
            Waterfall.scrollCallbacks.push({
                fn: callback || function(){},
                ui: this
            });
        },
        //用于调试
        log : function(s){
            window.console && console.log(s)
        }
    };
    //在全局添加一个滚动事件，处理所有瀑布流实例的滚动回调
    W(window).on("scroll", function(){
        var els = Waterfall.scrollCallbacks;
        for(var i = 0, el; el = els[i++]; ){
            el.ui.curry(el.fn);
        }
    });

    window.Waterfall = Waterfall;
})();
