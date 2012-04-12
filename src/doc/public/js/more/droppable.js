$.define("droppable","more/draggable",function(Draggable){
    Draggable.implement({
        dropinit: function( hash ){
            this.accept = $(hash.accept);
        },
        locate: function( $elem ){
            var posi = $elem.offset() || {},
            height = $elem.outerHeight(),
            width = $elem.outerWidth()
            return  {
                elem: $elem[0],
                width: width,
                height: height,
                top: posi.top,
                left: posi.left,
                right: posi.left + width,
                bottom: posi.top + height
            };
        },
        dropstart: function(){
            var els = this.accept, rects = []
            if( els ){
                els =  els.mass ? els : $(els);
                if(els.length === 1){
                    rects.push( this.locate(els) )
                }else{
                    for(var i = 0 ,elem ; elem = els[i++]; ){
                        rects.push( this.locate( $( elem ) ) )
                    }
                }
            }
            this.droppers = rects 
        },
        drop: function(){
            var tolerance = this.tolerance || this.modes[ this.mode ];
            var xy = [ this.event.pageX, this.event.pageY ], drg, drp
            if ( tolerance )
                drg = this.locate( this.dragger );
            for( var i = 0, n = this.droppers.length; i < n ; i++ ){
                drp = this.droppers[i]
                this.winner = tolerance ? tolerance.call( this, this.event, drg, drp )
                // mouse position is always the fallback
                : this.contains( drp, xy ) ? 1 : 0;
                $.log(this.winner)
            }
        },
        //target 拥有四个坐标属性， test可能是相同的对象，也可能只是一个数组[x, y]
        //判定target是否包含test
        contains: function( target, test ){ // target { location } contains test [x,y] or { location }
            return ( ( test[0] || test.left ) >= target.left && ( test[0] || test.right ) <= target.right
                && ( test[1] || test.top ) >= target.top && ( test[1] || test.bottom ) <= target.bottom );
        },
        modes: {
            'intersect': function( event, dragger, dropper ){
                //有时光标虽然没有进入放置对象,但拖动块已经与放置对象相交了
                return this.contains( dropper, [ event.pageX, event.pageY ] ) ? // check cursor
                1e9 : this.modes.overlap.apply( this, arguments ); // check overlap
            },
            //返回拖动块遮住了放置对象的多少面积   // (y2 - y1) * (x2 - x2)
            'overlap': function( event, dragger, dropper ){//
                return Math.max( 0, Math.min( dropper.bottom, dragger.bottom ) - Math.max( dropper.top, dragger.top ) )
                * Math.max( 0, Math.min( dropper.right, dragger.right ) - Math.max( dropper.left, dragger.left ) );
            },
            // 拖动块完全位于放置对象之中
            'fit': function( event, dragger, dropper ){
                return this.contains( dropper, dragger ) ? 1 : 0;
            },
            // center of the proxy is contained within target bounds
            'middle': function( event, dragger, dropper ){
                return this.contains( dropper, [ dragger.left + dragger.width * .5, dragger.top + dragger.height * .5 ] ) ? 1 : 0;
            }
        }

    })

    $.fn.droppable = function( hash ){
        return this.draggable( hash )
    }
})
