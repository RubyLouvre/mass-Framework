$.define("css","more/random,more/spec,node,css",function(random){
  
    $.fixture("样式操作模块-css",{
        "$.css()":function(){
            var node = $('<div id="test-div" width="8px" height="5px"' +
                'style="padding-left: 2px; ' +
                'background: transparent; ' +
                '' +
                'float: left; ' +
                'border: 5px solid rgb(0,0,0);">x</div>').appendTo("body")
          
            var isWebkit = !!navigator.vendor;
        
            expect( node[0].tagName ).eq( "DIV" );
            expect( node.css('width') ).eq( document.documentMode < 9 ? "7px" : "8px" );
            node.css( 'width',"+=2px" );
            expect( node.css('width') ).eq( document.documentMode < 9 ? "9px" : "10px" );

            expect( node.css('float')).eq('left');
            expect( node.css('position')).eq('static');
            if (isWebkit) {
                expect( node.css( 'backgroundColor' )).eq( 'rgba(0, 0, 0, 0)' );
            } else {
                expect( node.css(  'backgroundColor')).eq( 'transparent' );
            }
            expect( node.css( 'fontSize')).eq('16px');
            expect( node.css( 'border-right-width')).eq('5px');
            expect( node.css( 'paddingLeft')).eq('2px');
            expect( node.css( 'padding-left')).eq('2px');
            expect( node.css( 'padding-right')).eq('0px');
            expect( node.css( 'opacity')).eq('1');

            // 不加入 dom 节点，ie9,firefox 返回 auto by computedStyle
            // ie7,8 返回负数，offsetHeight 返回0
            //alert(elem.currentStyle.height);== auto
            node.css( 'height',"18px")
            expect( node.css( 'height')).eq("18px");

            node.css( 'float', 'right');

            expect( node.css( 'float')).eq('right',"赋值后重新获取float");

            node.css( 'font-size', '100%');

            expect( node.css( 'font-size')).eq('16px',"赋值后重新获取font-size");

            node.css( 'opacity', '0.2');
     
            expect( node.css( 'opacity')).near('0.2',"赋值后重新获取opacity");

            node.css( 'border', '2px dashed red');

            expect(parseFloat( node.css( 'borderTopWidth'))).near(2,"赋值后重新获取borderTopWidth");
            node.css({
                marginLeft: '20px',
                opacity: '0.8',
                border: '2px solid #ccc'
            });

            expect( node.css('opacity')).near(0.8, "赋值后重新获取opacity",0.02);
            var style = $("<style id='sheet_sheet'>.shadow {\
                background-color: #47aed7;\
                -moz-box-shadow: rgba(0, 0, 0, 0.2) 2px 3px 3px;\
                -webkit-box-shadow: rgba(0, 0, 0, 0.2) 2px 3px 3px;\
                filter: progid:DXImageTransform.Microsoft.Shadow(direction = 155, Color = #dadada, Strength = 3)," +
                " progid:DXImageTransform.Microsoft.DropShadow(Color = #22aaaaaa, OffX = -2, OffY = -2);\
                }</stype>").prependTo("head");

            var test_filter = $('<div ' +
                'id="test-filter"' +
                ' class="shadow" ' +
                'style="height: 80px; ' +
                'width: 120px; ' +
                'border:1px solid #ccc;"></div>').appendTo( "body" );

            test_filter.css( 'opacity', .5);

            if (document.documentMode && document.documentMode < 9) {
                // 不加入 dom 节点取不到 class 定义的样式
                expect( test_filter[0].currentStyle.filter ).match(function(value){
                    return /50/.test(value)
                });
            }
            node.remove();
            style.remove();
            test_filter.remove();
        },
        "$.width/height()":function(){
            var node = $('<div id="test-div" ' +
                'style="padding-left: 2pt; ' +
                'background: transparent; ' +
                '' +
                'float: left; ' +
                'border: 5px solid rgb(0,0,0);">x</div>').appendTo("body");
            expect( node.width() ).near(  7, 1.35 );
            expect( node.height() ).near( 19, 1 );
            node.remove();
        },
        "$.inner/outer width/height": function() {
            var node = $('<div ' +
                'style="' +
                'position:absolute;' +
                'margin:9px; ' +
                'background: transparent; ' +
                'padding:3px;' +
                'border: 5px solid rgb(0,0,0);"><div ' +
                'style="padding: 0;margin: 0;' +
                'width:44px;height:44px;font-size:0;line-height:0;"></div>' +
                '</div>').appendTo("body");

            expect( node.width()).near( 44, 1 );
            expect( node.height()).near( 44, 1 );
            //alert(window.getComputedStyle( elem[0], null ).getPropertyValue("height"))
            expect( node.innerWidth()).near( 44 + 3 * 2, 1 );
            expect( node.innerHeight()).near( 44 + 3 * 2, 1 );

            expect( node.outerWidth()).near( 44 + 3 * 2 + 5 * 2, 1 );
            expect( node.outerHeight()).near( 44 + 3 * 2 + 5 * 2, 1 );

            expect( node.outerWidth(true)).near( 44 + 3 * 2 + 5 * 2 + 9 * 2, 2 );
            expect( node.outerHeight(true)).near( 44 + 3 * 2 + 5 * 2 + 9 * 2, 2 );

            node.remove()
        },
        "$.ccs('float')": function() {
            var tag = random.str(5,"float");
            var style = $("<style>." + tag + " {float:left}</style>").appendTo( "head" );
            var node = $("<div class='" + tag + "' style='float:right'/>").appendTo( "body" );
            expect( node.css("float") ).eq( "right" );
            node.css( "float", "left" )
            expect( node.css( "float" ) ).eq( "left" );
            style.remove();
            node.remove();
        },
        "$.ccs('opacity')": function() {
            var tag = random.str(5,"opacity");
            var style = $("<style>." + tag + "  {width:1px;height:1px;opacity:0.55;filter:alpha(opacity=55); }</style>").appendTo("head");
            var node = $("<div class='" + tag + "' style='" +
                "opacity:0.66;filter:Alpha(opacity=66); '/>").appendTo("body");
            expect( node.css( "opacity")).near("0.66","取得opacity值",0.001);
            node.css( "opacity", "" );
            //"清除内联样式后取得opacity值"
            expect( node.css( "opacity" )).near( "0.55", 0.001 );
            style.remove();
            node.remove();
        },
        "$.ccs('rorate')": function() {
            var tag = random.str(5,"rorate");
            var style = $("<style>." + tag + "  {\
                     -webkit-transform: rotate(-90deg);\
                     -moz-transform: rotate(-90deg);\
                     -o-transform:rotate(-90deg);\
                     -ms-transform:rotate(-90deg);\
                     filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);\
                   }</style>").appendTo("head");
            var node = $("<div class='" + tag + "' style='" +
                "width:20px;height:20px; '/>").appendTo("body");
            expect( node.css("rotate")).log();
            //"取得rorate的弧度制值"
            expect( node.css("rotate")).near( -1.5707, 0.0001);
            style.remove();
            node.remove();
        },
        "$.scrollbarWidth": function() {
            expect( $.scrollbarWidth() ).log()
        },
        "$.css(el,left)": function(){
            var node = $("<div style='position:absolute;'/>").appendTo("body");
             
            expect( node.css("left") ).eq((node[0].offsetLeft - document.documentElement.clientLeft) + "px");
            expect( node.offset() ).log();
            expect( node.css("left") ).log();
            node.remove();
        }

 
    });
});