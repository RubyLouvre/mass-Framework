$.define("droppable","more/draggable",function(Draggable){
    //http://help.dottoro.com/ljrkqflw.php
    Draggable.implement({
        dropinit: function( hash ){
            this.range = $(hash.range);//设置靶场（放置对象）
            this.hoverClass = hash.hoverClass;
            this.activeClass = hash.activeClass
            this.tolerance = typeof hash.tolerance === "function" ? hash.tolerance : this.modes[hash.tolerance];
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
            var xy = [ this.event.pageX, this.event.pageY ],tolerance = this.tolerance,
            uuid = this.target.data("@uuid"), droppers = this.droppers,
            drg, drp, type;
            if ( tolerance )
                drg = this.locate( this.dragger )
            //  tolerance//自己规定何时触发dragenter dragleave
            for( var i = 0, n = droppers.length; i < n ; i++ ){
                drp = droppers[i];
                if( !droppers.actived && this.activeClass){
                    drp.elem.addClass(this.activeClass);
                }
                //判定光标是否进入到dropper的内部
                var isEnter = tolerance ? tolerance.call(this, this.event, drg, drp ): this.contains( drp, xy );
                //  $.log(isEnter)
                if(isEnter){
                    if(!drp["###" + uuid]){//如果是第一次进入,则触发dragenter事件
                        drp["###"+uuid] = 1;
                        this.hoverClass && drp.elem.addClass(this.hoverClass);
                        this.dropper = drp.elem;
                        $.log(this.dropper.data("@uuid")+"!!")
                        type = "dragenter"
                    }else{//标识已进入
                        type = "dragover"
                    }
                    this.dispatch(this.event, this.dragger, type );
                }else{//如果光标离开放置对象
                    if(drp["###"+uuid]){
                        this.hoverClass && drp.elem.removeClass(this.hoverClass);
                        this.dropper = drp.elem;//处理覆盖多个靶场
                        this.dispatch(this.event, this.dragger, "dragleave" );
                        delete drp["###"+uuid]
                    }
                }
            }
            droppers.actived = 1;
        },
        dropend: function( event ){
            var uuid = this.target.data("@uuid"), drp;
            for( var i = 0, n = this.droppers.length; i < n ; i++ ){
                drp = this.droppers[i];
                this.activeClass && drp.elem.removeClass(this.activeClass);
                if(drp["###" + uuid]){
                    if( this.ghosting ){
                        this.dragger = this.target;
                    }
                    this.dropper = drp.elem;
                    this.dispatch( event, this.dragger, "drop" );
                    delete drp["###"+uuid]
                }
            }
        },
        // 判定dropper是否包含dragger
        contains: function(  dropper, dragger ){
            return ( ( dragger[0] || dragger.left ) >= dropper.left && ( dragger[0] || dragger.right ) <= dropper.right
                && ( dragger[1] || dragger.top ) >= dropper.top && ( dragger[1] || dragger.bottom ) <= dropper.bottom );
        },
        // 求出两个方块的重叠面积
        overlap: function( dragger, dropper ){
            return Math.max( 0, Math.min( dropper.bottom, dragger.bottom ) - Math.max( dropper.top, dragger.top ) )
            * Math.max( 0, Math.min( dropper.right, dragger.right ) - Math.max( dropper.left, dragger.left ) );
        },
        modes: {
            // 拖动块是否与靶场相交，允许覆盖多个靶场
            intersect: function( event, dragger, dropper ){
                return this.contains( dropper, [ event.pageX, event.pageY ] ) ? 
                true : this.overlap( dragger, dropper );
            },
            // 判定光标是否在靶场之内
            pointer: function( event, dragger, dropper ){
                return this.contains( dropper, [ event.pageX, event.pageY ] )
            },
            // 判定是否完全位于靶场
            fit: function( event,  dragger, dropper  ){
                return this.contains( dropper, dragger ) //? 1 : 0
            },
            // 至少有一半进入耙场才触发dragenter
            middle: function( event, dragger, dropper ){
                return this.contains( dropper, [ dragger.left + dragger.width * .5, dragger.top + dragger.height * .5 ] )//? 1 : 0
            }
        }
    })

    $.fn.droppable = function( hash ){
        return this.draggable( hash )
    }
})
