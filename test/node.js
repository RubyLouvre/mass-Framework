define(["$spec","$node"],function(){
   $.log("已加载text/node模块");
    var iframe =  $("<iframe id='test_node' frameBorder=0 style='display:none;width:0px;height:0px;' />" ).appendTo("body");//
    var idoc  =  iframe.contents()[0];
    idoc.write( "<!doctype html><html><script>var a = document.createElement('nav');<\/script><body>" );
    idoc.close();
    //=====================================================================================
    var iframe2 =  $("<iframe id='test_node2' frameBorder=0 style='display:none;width:0px;height:0px;' />" ).appendTo("body");//height=0 width=0 frameBorder=0
    var idoc2  =  iframe2.contents()[0];

    idoc2.write( "<!doctype html><html><body>" );
    idoc2.close();
    var ibody2 = idoc2.body;

    $('<ul id="aaa"><li class="_travel" id="aaaa"><b>foo</b></li><li class="_travel" id="bar">bar</li><li id="baz">baz</li></ul>' ).appendTo(ibody2);
    var ul = $("#aaa",idoc2)
    var li = $("#aaa li",idoc2);
    var first = $("#aaaa",idoc2);
    var html = '<ul id="test_next"> <li>list item 1</li><li>list item 2</li><li class="third-item">list item 3</li><li>list item 4</li><li>list item 5</li></ul>';
    $( html ).appendTo(ibody2);
    var thirdItem = $('li.third-item',idoc2);
    //添加另一个测试层级的数据
    var html2 =  '<div id="test-children" class="test-parent">\
                              <p id="test-next"><a>1</a></p>\
                              <p class="test-next-p"><a class="test-a">2</a></p>\
                              <p class="test-next"><a id="test-parent3">3</a></p>\
                              <p class="test-p" id="test-prev"><em class="test-em"><span><a id="test-parent4">4</a></span></em></p>\
                          <div>\
                   <div id="test-contains">text node</div>'
    $( html2 ).appendTo(ibody2);
    var t = $('#test-parent4',idoc2);
    // $.addTestModule2 =$.noop;
    
    describe("node",{
        append: function(){
            //先添加两个类为.test_node的P元素
            $("body",idoc ).append("<p class='test_node'>测试append方法<strong>这是它的内部</strong></p><p class='test_node'>测试append方法<strong>这是它的内部</strong></p><div id='test_text'></div>");
            expect( $(".test_node",idoc ).length ).eq(2,"2");
            $("#test_text",idoc ).text("888888888");
            expect( $("#test_text",idoc ).text() ).eq("888888888","text");
            var nav = $("<nav>test</nav>").appendTo( $("body",idoc ) )
            expect( nav[0].tagName ).eq("NAV");
            nav.remove()
        },
        prepend: function(){
            //再在它们的内部前置两个类为.test_node1的P元素
            $(".test_node",idoc ).prepend("<p class='test_node1'>测试prepend方法</p>");
            expect( $(".test_node1",idoc ).length ).eq(2);
        },
        after: function(){
            //在所有类名为test_node的P元素的后面添加一个类名为test_node2的P元素
            $(".test_node",idoc ).after("<p class='test_node2'>测试after方法</p>");
            expect( $(".test_node2",idoc ).length ).eq(2);
        },
        before: function(){
            //在所有类名为test_node的P元素的前面添加一个类名为test_node2的P元素
            $(".test_node",idoc ).before("<p class='test_node3'>测试before方法</p>");
            expect( $(".test_node3",idoc ).length ).eq(2);
        },
        replace: function(){
            //  将第一类名为test_node2的P元素替换为类名test3的P元素
            $(".test_node2",idoc ).eq(0 ).replace("<p class='test_node3'>测试replace方法</p>");
            expect( $(".test_node3",idoc ).length ).eq(3);
        },
        empty: function(){
            $(".test_node",idoc ).empty();
            expect( $(".test_node1",idoc ).length ).eq(0);
        },
        html: function(){
            $(".test_node",idoc ).html("<em>测试html方法</em>");
            expect( $(".test_node",idoc ).html().toLowerCase() ).eq("<em>测试html方法</em>");
        },
        text: function(){
            $(".test_node3",idoc ).text("<em>测试text方法</em>");
            expect( $(".test_node3", idoc ).text() ).eq("<em>测试text方法</em>");
        },
        remove: function(){
            $(".test_node2",idoc ).remove();
            expect( $(".test_node2",idoc  ).length ).eq(0);
        },
        map: function(){
            $(".inner",idoc ).map(function(){
                expect(this.tagName ).eq("DIV");
                return this;
            });
        },
        parseHTML: function(id){
            var str = "<h1>My First<strong>Heading</strong></h1><p>My first paragraph.</p><script>document.aa = 'test';</script>";
            var fragment = $.parseHTML(str);
            expect(fragment.firstChild.nodeName ).eq("H1","使用parseHTML创建 h1 标签成功");
            var style = $("<style>.testtest {width:1px;height:1px;opacity:0.55;filter:alpha(opacity=55); }</style>")//.appendTo("head");
            expect( style[0].tagName).eq("STYLE", "使用parseHTML创建 style 标签成功");
            "thead,tbody,tfoot,colgroup,caption,tr,th,td,optgroup,option,legend,area,param".replace($.rword, function(tag){
                expect($.parseHTML("<"+tag+"/>").firstChild.tagName.toLowerCase(), id).eq(tag, "使用parseHTML创建 "+tag+" 标签成功")
            })


        },
        "$.fn.data": function(){

            var children = ul.children();
            children.data("_test_children","司徒正美");
            //测试批量赋值
            expect( children.first().data("_test_children") ).eq("司徒正美")
            expect( children.eq( 2 ).data("_test_children") ).eq("司徒正美")
            children.data({
                data1:"value1",
                data2:"value2",
                data3:"value3"
            });
            expect( children.eq(0 ).data("data1") ).eq("value1");
            expect( children.eq(1 ).data("data2") ).eq("value2");
        },
        removeData: function(){
            var children = ul.children();
            children.removeData("_test_children");
            expect( children.first().data("_test_children") ).eq(void 0)
            expect( children.eq(1 ).data("_test_children") ).eq(void 0)
            expect( children.eq(2 ).data("_test_children") ).eq(void 0)
        },
        "toString()":function(){
            expect( ul.children().toString() ).eq("LI, LI, LI");
        },
        index: function(){
            expect(first.index() ).eq(0);
            expect(ul.children().index(first) ).eq(0);
            expect(ul.children().index(first[0]) ).eq(0);
        },
        is: function(){
            expect(first.is("#aaa>li") ).ok();
            expect(first.is("#aaa :nth-child(1)") ).ok();
        },
        find: function(){
            expect(ul.find("li"  ).length ).eq(3);
            expect(ul.find("#aaaa"  ).length ).eq(1);
            expect( $("body",idoc2 ).find("#aaa li"  ).length ).eq(3);
        },
        filter: function(){
            expect(li.filter( "#aaaa" ).length ).eq(1);
            expect(li.filter( "#aaa :nth-child(1)" ).length ).eq(1);
        },
        not: function(){
            expect(li.not("#aaaa"  ).length ).eq(2);
            expect(li.not("#aaa :nth-child(1)"  ).length ).eq(2);
            expect(li.not("._travel"  ).length ).eq(1);
            expect(li.not(":first-child"  ).length ).eq(2);
        },
        closest: function(){
            expect(first.closest("ul")[0].id ).eq("aaa");
            expect(t.closest("p")[0].className ).eq("test-p");
            expect(t.closest(".test-p")[0].id ).eq("test-prev");
            expect(t.closest(".test-parent")[0].id ).eq("test-children");
    
        },
        has: function(){
           // alert($("#aaa",idoc2).html())
            expect(li.has("b" ).length ).eq(1);
            expect(li.filter("._travel"  ).length ).eq(2);
            //移除测试数据
            $("#aaa",idoc2 ).remove();
        },
        next: function(){
            var nodes = thirdItem.next();
            expect(nodes.text() ).eq("list item 4");
            var node = $("#test-next",idoc2);
            expect(node.next()[0].className ).eq('test-next-p');
            expect(node.next().next()[0].className ).eq('test-next');
            expect(node.nextAll(".test-next")[0].tagName ).eq('P');
    
        },
    
        nextAll: function(){
            var nodes = thirdItem.nextAll();
            expect(nodes.eq(1 ).text() ).eq("list item 5");
        },
        prev: function(){
            var nodes = thirdItem.prev();
            expect(nodes.text() ).eq("list item 2");
        },
        prevAll: function(){
            var nodes = thirdItem.prevAll();
            expect(nodes.text() ).eq("list item 1");
        },
        parent: function(){
            var nodes = thirdItem.parent();
            expect(nodes[0].id ).eq("test_next");
            expect( $.type(t.parent()[0]) ).eq('SPAN');
            expect(t.parent().parent().parent().parent()[0].className ).eq('test-parent');
            expect(t.parents('em')[0].className ).eq('test-em');
            expect(t.parents('.test-p')[0].tagName ).eq('P');
            expect( $("body" ).parent()[0] ).eq(document.documentElement);
    
        },
        parents: function(){
            var nodes = thirdItem.parents();
            expect(nodes[0].tagName ).eq("HTML");
        },
        siblings: function(){
            var nodes = thirdItem.siblings();
            expect(nodes.length ).eq(4);
        },
        children: function(){
            var nodes = thirdItem.parent().children();
            expect(nodes.length ).eq(5);
            thirdItem.parent().remove()
        },
        nextUntil: function(){
            var html = '<dl>\
                      <dt>term 1</dt>\
                      <dd>definition 1-a</dd>\
                      <dd>definition 1-b</dd>\
                      <dd>definition 1-c</dd>\
                      <dd>definition 1-d</dd>\
                      <dt id="term-2">term 2</dt>\
                      <dd>definition 2-a</dd>\
                      <dd>definition 2-b</dd>\
                      <dd>definition 2-c</dd>\
                      <dt>term 3</dt>\
                      <dd>definition 3-a</dd>\
                      <dd>definition 3-b</dd>\
                  </dl>'
            $(html,idoc2 ).appendTo(ibody2);
            expect( $('#term-2',idoc2 ).nextUntil('dt'  ).length ).eq(3);
        },
        prevUntil: function(){
            expect( $('#term-2',idoc2 ).prevUntil('dt'  ).length ).eq(4);
        },
        parentsUntil: function(){
            var html = '<ul class="level-1">\
          <li class="item-i">I</li>\
          <li class="item-ii">II\
            <ul class="level-2">\
              <li class="item-a">A</li>\
              <li class="item-b">B\
                <ul class="level-3">\
                  <li class="item-1">1</li>\
                  <li class="item-2">2</li>\
                  <li class="item-3">3</li>\
                </ul>\
              </li>\
              <li class="item-c">C</li>\
            </ul>\
          </li>\
          <li class="item-iii">III</li>\
        </ul>'
            $(html, idoc2 ).appendTo("body");

            expect( $('li.item-a',idoc2 ).parentsUntil('.level-1'  ).length ).eq(2);
            
        },
        "eq last first odd event": function(){
            var lis =  $('.level-1> li',idoc2 );
            expect( lis.eq(0)[0].className ).eq( "item-i" );
            expect( lis.eq(1)[0].className ).eq( "item-ii" );
            expect( lis.eq(2)[0].className ).eq( "item-iii" );
            expect( lis.eq(-1)[0].className ).eq( "item-iii" );
            expect( lis.eq(-2)[0].className ).eq( "item-ii" );
            expect( lis.even().length ).eq( 2 );
            expect( lis.odd().length ).eq( 1 );
            expect( lis.first()[0].className ).eq(  "item-i" );
            expect( lis.last()[0].className ).eq(  "item-iii" );
            iframe.remove();
            iframe2.remove();
        }

    })
   
});
function createXMLDoc() {
    // Initialize DOM based upon latest installed MSXML or Netscape
    var elem,
    aActiveX =
    [ "MSXML6.DomDocument",
    "MSXML3.DomDocument",
    "MSXML2.DomDocument",
    "MSXML.DomDocument",
    "Microsoft.XmlDom" ];
    if ( document.implementation && "createDocument" in document.implementation ) {
        return document.implementation.createDocument( "", "", null );
    } else {
        // IE
        for ( var n = 0, len = aActiveX.length; n < len; n++ ) {
            try {
                elem = new ActiveXObject( aActiveX[ n ] );
                return elem;
            } catch(_){};
        }
    }
}
