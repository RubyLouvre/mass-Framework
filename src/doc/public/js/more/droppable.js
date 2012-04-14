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
                        this.dropper = drp.elem;
                        this.hoverClass && this.dropper.addClass(this.hoverClass);
                        type = "dragenter"
                    }else{//标识已进入
                        type = "dragover"
                    }
                    this.dispatch(this.event, this.dragger, type );
                }else{//如果光标离开放置对象
                    if(drp["###"+uuid]){
                        $.log("pppppppppppppppp")
                        this.hoverClass && this.dropper.removeClass(this.hoverClass);
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
                if(  this.activeClass ){
                    drp.elem.removeClass(this.activeClass);
                }
                if(drp["###" + uuid]){
                    if( this.ghosting ){
                        this.dragger = this.target;
                    }
                    this.dispatch( event, this.dragger, "drop" );
                    delete drp["###"+uuid]
                }
            }
        },
        //target 拥有四个坐标属性， dragger可能是相同的对象，也可能只是一个数组[x, y]
        //判定dropper是否包含dragger
        contains: function(  dropper, dragger ){
            return ( ( dragger[0] || dragger.left ) >= dropper.left && ( dragger[0] || dragger.right ) <= dropper.right
                && ( dragger[1] || dragger.top ) >= dropper.top && ( dragger[1] || dragger.bottom ) <= dropper.bottom );
        },
        modes: {
            //判定是否相交
            intersect: function( event, dragger, dropper ){
                return this.contains( dropper, [ event.pageX, event.pageY ] ) ? // check cursor
                1e9 : this.modes.overlap.apply( this, arguments ); // check overlap
            },
            //求出两个方块的重叠面积
            overlap: function( event, dragger, dropper ){
                return Math.max( 0, Math.min( dropper.bottom, dragger.bottom ) - Math.max( dropper.top, dragger.top ) )
                * Math.max( 0, Math.min( dropper.right, dragger.right ) - Math.max( dropper.left, dragger.left ) );
            },
            //判定是否完全位于靶场
            fit: function( event,  dragger, dropper  ){
                return this.contains( dropper, dragger ) ? 1 : 0
            },
            // center of the proxy is contained within target bounds
            middle: function( event, dragger, dropper ){
                return this.contains( dropper, [ dragger.left + dragger.width * .5, dragger.top + dragger.height * .5 ] )? 1 : 0
            }
        }
    })

    $.fn.droppable = function( hash ){
        return this.draggable( hash )
    }
})
