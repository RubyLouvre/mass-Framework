$.define("droppable","more/draggable",function(Draggable){
    //http://help.dottoro.com/ljrkqflw.php
    Draggable.implement({
        dropinit: function( hash ){
            this.range = $(hash.range);//设置靶场（放置对象）
            this.hoverClass = hash.hoverClass;
            this.activeClass = hash.activeClass
            this.overlap = typeof hash.overlap === "function" ? hash.overlap : this.overlap
        },
        //取得放置对象的坐标宽高等信息
        locate: function( $elem ){
            var posi = $elem.offset() || {},
            height = $elem.outerHeight(),
            width = $elem.outerWidth()
            return  {
                elem: $elem,
                width: width,
                height: height,
                top: posi.top,
                left: posi.left,
                right: posi.left + width,
                bottom: posi.top + height
            };
        },
        dropstart: function(){
            var els = this.range
            this.droppers = []
            if( els ){
                els =  els.mass ? els : $(els);
                if(els.length === 1){
                    this.droppers.push( this.locate(els) )
                }else{
                    for(var i = 0 ,elem ; elem = els[i++]; ){
                        this.droppers.push( this.locate( $( elem ) ) )
                    }
                }
            }
        },
        drop: function(){
            //此事件在draggable的drag事件上执行
            var xy = [ this.event.pageX, this.event.pageY ],
            uuid = this.dragger.data("@uuid"),droppers = this.droppers,
            drg = this.locate( this.dragger ), drp, type;
            for( var i = 0, n = droppers.length; i < n ; i++ ){
                drp = droppers[i];
                if( !droppers.actived && this.activeClass){
                    drp.elem.addClass(this.activeClass)
                }
                var isEnter = this.contains( drp, xy );//判定光标是否进入到dropper的内部
                if(isEnter){
                    if(!drp["###" + uuid]){//如果是第一次进入,则触发dragenter事件
                        drp["###"+uuid] = 1;
                        this.dropper = drp.elem;
                        this.hoverClass && this.dropper.addClass(this.hoverClass);
                        type = "dragenter"
                    }else{//标识已进入
                        type = "dragover"
                    }
                    this.dispatch(this.event, this.dragger, type );
                }else{//如果光标离开放置对象
                    if(drp["###"+uuid]){
                        this.hoverClass && this.dropper.removeClass(this.hoverClass);
                        this.dispatch(this.event, this.dragger, "dragleave" );
                        delete drp["###"+uuid]
                    }
                }
            }
            droppers.actived = 1;
        },
        dropend: function( event ){
            var uuid = this.dragger.data("@uuid"), drp
            for( var i = 0, n = this.droppers.length; i < n ; i++ ){
                drp = this.droppers[i];
                if(  this.activeClass ){
                    drp.elem.removeClass(this.activeClass);
                }
                if(drp["###" + uuid]){
                    $.log("xxxxxxxxxxxxxxxxxx");
                    $.log(this.dragger);
                    this.dispatch( event, this.dragger, "drop" );
                    delete drp["###"+uuid]
                }
            }
        },
        //target 拥有四个坐标属性， test可能是相同的对象，也可能只是一个数组[x, y]
        //判定dropper是否包含test
        contains: function( dropper, test ){
            return ( ( test[0] || test.left ) >= dropper.left && ( test[0] || test.right ) <= dropper.right
                && ( test[1] || test.top ) >= dropper.top && ( test[1] || test.bottom ) <= dropper.bottom );
        },
        //求出两个方块的重叠面积
        overlap: function(dropper,dragger){
            return Math.max( 0, Math.min( dropper.bottom, dragger.bottom ) - Math.max( dropper.top, dragger.top ) )
            * Math.max( 0, Math.min( dropper.right, dragger.right ) - Math.max( dropper.left, dragger.left ) );
        }
    })

    $.fn.droppable = function( hash ){
        return this.draggable( hash )
    }
})
