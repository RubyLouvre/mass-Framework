define(["$attr","$spec"],function(){
    var iframe =  $("<iframe id='test_attr' style='display:none;width:0px;height:0px;' src='pages/attr.html' frameBorder=0  />" ).appendTo("body");//
    window.attrTestCall = function(){
        $.fixture("属性模块-attr",{
            "$.fn.attr":function(){
                var idoc = iframe.contents()[0];
                //shortcuts
                var get = function(ee){
                // $.log(ee.selector+"   :   "+ee.length)
                }
                var foo = $('#foo',idoc),
                a = $('#foo a',idoc),
                img = $('#test-img',idoc),
                input = $('#foo',idoc ).find("input"),
                radio = $('#test-radio',idoc),
                radio2 = $('#test-radio2',idoc),
                button = $('#foo button',idoc),
                label = $('#foo label',idoc),
                td = $('#test-table_td',idoc),
                select = $('#test-select',idoc),
                select2 = $('#test-select2',idoc),
                select3 = $('#test-select3',idoc),
                opt = $('#test-opt',idoc),
                div = $('#test-div',idoc),
                opt2 = $('#test-select',idoc ).find("option" ).eq(1),
                area = $('#foo textarea',idoc),
                disabledTest = $("#test-20110810-disabled",idoc);
                //开始测试
                get(foo);
                get(a);
                get(img);
                get(input);
                get(radio);
                get(radio2);
                get(button);
                get(label);
                get(td);
                get(select);
                expect( input.length ).log();
                // 测试自定义属性的获取
                expect( a.attr("no-exist") ).eq(undefined)
                // 测试自定义属性的获取
                expect( input.attr("readonly") ).eq("readonly");
                expect( radio.attr('checked') ).eq(undefined);
                expect( input.attr( 'value') ).eq('hello');
                expect( $.type(a.attr("style")) ).eq("String");
                expect( opt.attr("selected") ).eq("selected");
                expect( opt.prop("selected") ).eq(true);
                expect( a.attr( 'data-test') ).eq('test');


                // ie7- 要用 className
                expect( label.attr('class') ).eq('test');
                // ie7- 要用 htmlFor
                expect( label.attr( 'for') ).eq('test-input');
                expect( a.attr('href') ).eq("/dom_framework/");

                expect( img.attr('src') ).eq("http://www.baidu.com/img/baidu_sylogo1.gif");
                expect( td.prop('rowspan') ).eq(td[0].rowSpan );

                expect( td.attr("rowspan") ).eq('2');
                expect( a.attr('title') ).eq('test');

                a.attr('data-set','test-xx');
                expect( a.attr('data-set') ).eq('test-xx');
                td.attr('style', 'color:blue;');
                function trimCssText(str) {
                    return (str || "" ).replace(/;|\s/g, "" ).toLowerCase();
                }
                expect( trimCssText(td.attr('style')) ).eq('color:blue');

                var checkbox2 = $('#test-20110810-checkbox',idoc);
                checkbox2.attr('checked', true);
                
                expect( checkbox2.attr( 'checked') ).eq('checked');
                expect( checkbox2.prop( 'checked') ).eq(true);

                checkbox2.removeAttr( 'checked');
                expect( checkbox2.attr( 'checked') ).eq(undefined);
                expect( checkbox2.prop( 'checked') ).eq(false);

                //不存在就返回undefined
                //测试disabled
                expect( disabledTest.attr( "disabled") ).eq(undefined);
                expect( disabledTest.prop( "disabled") ).eq(false);
                expect( disabledTest[0]["disabled"] ).log();
                disabledTest.attr( "disabled", true);

                expect( disabledTest.attr( "disabled") ).eq("disabled");
                expect( disabledTest.prop( "disabled") ).eq(true);
                disabledTest.attr( "disabled", false);

                expect( disabledTest.attr( "disabled") ).eq(undefined);
                //测试removeAttr
                label.attr( 'test-remove', 'xx');
                expect( label.attr('test-remove') ).eq('xx');
                label.removeAttr('test-remove');
                expect( label.attr('test-remove') ).eq(undefined);



                // style
                a.removeAttr( 'style');
                expect( a.attr("style") ).eq(undefined);//凡是移除了就是没有显式设置属性，就是undefined

                // normal
                expect( input.val() ).eq('hello');
                // area 测试取TEXTARE进行取值（val）
                expect( area.val( ).length ).eq(12);
                // option
                expect( opt.val() ).eq('1');
                expect( opt2.val() ).eq('2');

                expect( select.val() ).eq('1');
                expect( select2.val() ).eq('2');
                expect( select3.val() ).same(['1','2']);
                //测试check
                expect( radio.val() ).eq("on");
                expect( radio2.val() ).eq("on");

                a.val('test');
                expect( a.val() ).eq('test');
                a.removeAttr('value');

                // select set value
                select.val( '3');
                expect( select.val() ).eq('3');
                // restore
                select.val( 0);
                select3.val(['2','3']);
                expect( select3.val() ).same(['2','3']);

                //还原
                select3.val( ['1','2']);
                select.val( '1');

                div.text('hello, are you ok?');
                expect( div.text() ).eq('hello, are you ok?');

                select.attr('tabindex', 1);
                expect( select.attr( "tabindex") ).eq(1);

                select.removeAttr("tabindex");
                a = $("<a/>");
                expect( a.attr("tabindex") ).eq(undefined);
                a = $("<a href=# />");
                expect( a.attr("tabindex") ).eq(0);
                a = $("<a href=# tabindex=2 />");
                expect( a.attr("tabindex") ).eq(2);

                //测试表单的相关属性
                var form = $.tag("form xx='zz' action='http://www.taobao.com'  name='form_name'  title='form_title'  onsubmit='return false;'",
                    $.tag("input name='xx' value='yy'"));
                form = $(form+"")
                expect( form.attr("action") ).eq("http://www.taobao.com");
                expect( form.attr( "onsubmit") ).eq("return false;");
                expect( form.attr( "name") ).eq("form_name");
                expect( form.attr( "title") ).eq("form_title");
                expect( form.attr( "xx") ).eq("zz");

                var button = $("<button value='xxx'>zzzz</button>");
                //测试用attr对button标签取value值
                expect( button.attr( "value") ).eq("xxx");

                var d = $("<input type='checkbox' checked='checked'>");
                expect( d.prop( 'checked') ).eq(true);
                // undefined property
                expect( d.prop( 'checked2') ).eq(undefined);
                iframe.remove();
            }
        })
    }

    var iframe2 =  $("<iframe id='test_attr' src='pages/attr2.html' style='display:none;width:0px;height:0px;' frameBorder=0  />" ).appendTo("body");//
    window.classNameTestCall = function(){
        $.fixture("属性模块-attr(className部分)",{
            "className":function(){
                var idoc  =  iframe2.contents()[0];
                var a = $('#foo-class a',idoc);
                a[0].className =  'link link2\t' + 'link9 link3';
                expect( a.hasClass( 'link') ).eq(true);
                expect( a.hasClass( 'link4') ).eq(false);

                expect( a.hasClass( 'link9') ).eq(true);
                a.addClass( 'link-added');
                expect( a.hasClass( 'link-added') ).eq(true);
                a.addClass( '.cls-a cls-b');
                expect( a.hasClass( '.cls-a') ).eq(true);
                expect( a.hasClass( 'cls-b') ).eq(true);


                a[0].className = 'link link2 link3 link4 link5';

                a.removeClass( 'link');
                expect( a.hasClass( 'link') ).eq(false);
                a.removeClass( 'link2 link4');
                a.removeClass( 'link3');
                expect( a[0].className ).eq('link5');

                a[0].className = 'link link3';
                // oldCls 有的话替换
                a.replaceClass( 'link', 'link2');

                expect( a.hasClass( 'link') ).eq(false);
                expect( a.hasClass( 'link2') ).eq(true);

                // oldCls 没有的话，不添加!
                a.replaceClass('link4', 'link');

                expect( a[0].className ).eq('link2 link3');


                a[0].className = 'link link2';

                a.toggleClass( 'link2');
                expect( a.hasClass( 'link2') ).eq(false);

                a.toggleClass( 'link2');
                expect( a.hasClass( 'link2') ).eq(true);

                iframe2.remove();
            }
        });
    }
});
