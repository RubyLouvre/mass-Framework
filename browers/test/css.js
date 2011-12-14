dom.define("test/css","more/random,more/spec,node,css",function(random){
  
    dom.addTestModule("样式操作模块-css",{
        "dom.css()":function(){
            var fragment = dom.parseHTML('<div id="test-div" ' +
                'style="padding-left: 2px; ' +
                'background: transparent; ' +
                '' +
                'float: left; ' +
                'border: 5px solid rgb(0,0,0);">x</div>');
            var elem = fragment.firstChild;
            document.body.appendChild(fragment);
          
            var isWebit = !!navigator.vendor
            // getter
            expect(dom.css(elem, 'float')).eq('left',"获取float");
            expect(dom.css(elem, 'position')).eq('static',"获取position");

            if (isWebit) {
                expect(dom.css(elem, 'backgroundColor')).eq('rgba(0, 0, 0, 0)',"获取backgroundColor");
            } else {
                expect(dom.css(elem, 'backgroundColor')).eq('transparent',"获取backgroundColor");
            }

  

            expect(dom.css(elem, 'fontSize')).eq('16px',"获取fontSize");

            expect(dom.css(elem, 'border-right-width')).eq('5px',"获取border-right-width");

            expect(dom.css(elem, 'paddingLeft')).eq('2px',"获取paddingLeft");
  
            expect(dom.css(elem, 'padding-left')).eq('2px',"获取padding-left");

            expect(dom.css(elem, 'padding-right')).eq('0px',"获取padding-right");

            expect(dom.css(elem, 'opacity')).eq('1',"获取opacity");

            // 不加入 dom 节点，ie9,firefox 返回 auto by computedStyle
            // ie7,8 返回负数，offsetHeight 返回0
            //alert(elem.currentStyle.height);== auto
            expect(parseInt(dom.css(elem, 'height'))).match(function(value){
                return value == 18 || value== 19;
            },"获取height");

            dom.css(elem, 'float', 'right');

            expect(dom.css(elem, 'float')).eq('right',"赋值后重新获取float");

            dom.css(elem, 'font-size', '100%');

            expect(dom.css(elem, 'font-size')).eq('16px',"赋值后重新获取font-size");

            dom.css(elem, 'opacity', '0.2');

            expect(dom.css(elem, 'opacity')).near('0.2',"赋值后重新获取opacity");

            dom.css(elem, 'border', '2px dashed red');

            expect(parseFloat(dom.css(elem, 'borderTopWidth'))).near(2,"赋值后重新获取borderTopWidth");


            dom.css(elem, {
                marginLeft: '20px',
                opacity: '0.8',
                border: '2px solid #ccc'
            });
         
            expect(dom.css(elem, 'opacity')).near(0.8,"赋值后重新获取opacity",0.02);  

            var fragment2 = dom.parseHTML("<style id='sheet_sheet'>.shadow {\
                background-color: #47aed7;\
                -moz-box-shadow: rgba(0, 0, 0, 0.2) 2px 3px 3px;\
                -webkit-box-shadow: rgba(0, 0, 0, 0.2) 2px 3px 3px;\
                filter: progid:DXImageTransform.Microsoft.Shadow(direction = 155, Color = #dadada, Strength = 3)," +
                " progid:DXImageTransform.Microsoft.DropShadow(Color = #22aaaaaa, OffX = -2, OffY = -2);\
                }</stype>");
            var style = fragment2.style;
            dom.head.appendChild(fragment2);
            

            var fragment3 = dom.parseHTML('<div ' +
                'id="test-filter"' +
                ' class="shadow" ' +
                'style="height: 80px; ' +
                'width: 120px; ' +
                'border:1px solid #ccc;"></div>');
            var test_filter = fragment3.firstChild;
            document.body.appendChild(fragment3);
     
            // test filter  #issue5
            dom.css(test_filter, 'opacity', .5);
            if (document.documentMode && document.documentMode < 9) {
                // 不加入 dom 节点取不到 class 定义的样式
                expect(test_filter.currentStyle.filter).log();
            }

            dom("#sheet_sheet").remove();
            dom("#test-div").remove();
            dom("#test-filter").remove();
        },
        "width/height()":function(){
            var elem = dom('<div id="test-div" ' +
                'style="padding-left: 2pt; ' +
                'background: transparent; ' +
                '' +
                'float: left; ' +
                'border: 5px solid rgb(0,0,0);">x</div>').appendTo("body");


            expect(elem.width()).near(7,"测试width()",1.35);
            expect(elem.height()).near(19,"测试width()",1);
            elem.remove();
        // elem
        },
        
        "inner/outer width/height": function() {
            var elem = dom('<div ' +
                'style="' +
                'position:absolute;' +
                'margin:9px; ' +
                'background: transparent; ' +
                'padding:3px;' +
                'border: 5px solid rgb(0,0,0);"><div ' +
                'style="padding: 0;margin: 0;' +
                'width:44px;height:44px;font-size:0;line-height:0;"></div>' +
                '</div>').appendTo("body");


            expect(elem.width()).near(44,"测试width()",1);
            expect(elem.height()).near(44,"测试height()",1);
            //alert(window.getComputedStyle( elem[0], null ).getPropertyValue("height"))
            expect(elem.innerWidth()).near(44 + 3 * 2,"测试innerWidth()",1);
            expect(elem.innerHeight()).near(44 + 3 * 2,"测试innerHeight()",1);

            expect(elem.outerWidth()).near(44 + 3 * 2 + 5 * 2,"测试outerWidth()",1);
            expect(elem.outerHeight()).near(44 + 3 * 2 + 5 * 2,"测试outerHeight()",1);

            expect(elem.outerWidth(true)).near(44 + 3 * 2 + 5 * 2 + 9 * 2,"测试outerWidth(true)",2);
            expect(elem.outerHeight(true)).near(44 + 3 * 2 + 5 * 2 + 9 * 2,"测试outerHeight(true)",2);

            elem.remove()
        },
        
        "ccs('float')": function() {
            var tag = random.str(5,"float")
            var style = dom("<style>." + tag + " {float:left}</style>").appendTo("head");
            var d = dom("<div class='" + tag + "' style='float:right'/>").appendTo("body");
            expect(d.css("float")).eq("right");
            d.css("float","left")

            expect(d.css("float")).eq("left");
            style.remove();
            d.remove();
        },
        "ccs('opacity')": function() {
            var tag = random.str(5,"opacity");
            var style = dom("<style>." + tag + "  {width:1px;height:1px;opacity:0.55;filter:alpha(opacity=55); }</style>").appendTo("head");
            var d = dom("<div class='" + tag + "' style='" +
                "opacity:0.66;filter:Alpha(opacity=66); '/>").appendTo("body");
            expect(d.css( "opacity")).near("0.66","取得opacity值",0.001);
            d.css( "opacity", "");
            expect(d.css("opacity")).near("0.55","清除内联样式后取得opacity值",0.001);
            style.remove();
            d.remove();
        },
        "ccs('opacity')": function() {
            var tag = random.str(5,"rorate");
            var style = dom("<style>." + tag + "  {\
                     -webkit-transform: rotate(-90deg);\
                     -moz-transform: rotate(-90deg);\
                     -o-transform:rotate(-90deg);\
                     -ms-transform:rotate(-90deg);\
                     filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);\
                   }</style>").appendTo("head");
            var d = dom("<div class='" + tag + "' style='" +
                "width:20px;height:20px; '/>").appendTo("body");
            expect(d.css("rotate")).log();
            expect(d.css("rotate")).near( -1.5707, "取得rorate的弧度制值",0.0001);
            style.remove();
            d.remove();
        },
        "dom.scrollbarWidth": function() {
            expect(dom.scrollbarWidth()).log()
        },
        "dom.css(el,left)":function(){
            var div = dom("<div style='position:absolute;'/>").appendTo("body");
             
            expect(div.css("left")).eq((div[0].offsetLeft - document.documentElement.clientLeft) + "px");
            expect(div.offset()).log();
             expect(div.css("left")).log();
            div.remove();
        }
           
 
    });
});