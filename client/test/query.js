$.define("test/query","more/spec,test/nwmatcher,node,css",function(){
    var iframe =  $("<iframe id='test_query' src='/test/selector.html' style='display:none;width:0px;height:0px;' frameBorder=0  />").appendTo("body");//style='display:none;width:0px;height:0px;'
  
    function eq(obj,expr,msg){
        expect(obj).match(function(){
            return obj.is(expr)
        },msg)
    }
    function sameWithNWMatcher(expr1,expr2,msg,context){
        if(!expr2){
            expr2 = expr1
        }
        if(typeof expr1 === "string"){
            expr1 =  $.query(expr1,context) ;
        }
        if(typeof expr2 === "string"){
            expr2 =  NW.Dom.select(expr2,context) ;
        }
        return expect(expr1).same(expr2,msg);
    }
    window.selectorTestCall = function(){
        var idoc  =  iframe.contents()[0];
        function same(expr1,expr2,msg,context){
            context = context || idoc;
            sameWithNWMatcher(expr1,expr2,msg,context)
        }
       
        $.fixture("选择器测试1-query",{
            testSelectorWithTagName:function(){
                same("li");
                same("strong");
                same("nonexistent");
                same("#p>.first","#link_1")
                var allNodes = $.slice(idoc.getElementsByTagName('*')).filter( function(node) {
                    return node.tagName !== '!';
                });
                same(allNodes, "*");
            },
            testSelectorWithId: function() {
                same('#fixtures');
                same('#nonexistent');
                same('#troubleForm');
            },
                   
            testSelectorWithClassName: function() {
                same('.first','#p,#link_1,#item_1');
                same('.second');
            },

            testSelectorWithTagNameAndId: function() {
                same("strong#strong","strong");
                same('p#strong');
            },

            testSelectorWithTagNameAndClassName: function() {
                same('a.internal','#link_1,#link_2');
                same('a.internal.highlight',"#link_2");
                same('a.highlight.internal',"#link_2");//querySelectorAll 不能让两个类名挨在一起
                same('a.highlight.internal.nonexistent',[]);
            },

            testSelectorWithIdAndClassName: function() {
                same('#link_2.internal','#link_2');
                same('.internal#link_2','#link_2');
                same('#link_2.internal.highlight','#link_2');
                same('#link_2.internal.nonexistent',[]);
            },
        
            testSelectorWithTagNameAndIdAndClassName: function() {
                same('a#link_2.internal','#link_2');
                same('a.internal#link_2','#link_2');
                same('li#item_1.first','#item_1');
                same('li#item_1.nonexistent',[]);
                same('li#item_1.first.nonexistent',[]);
            },

            test$$MatchesAncestryWithTokensSeparatedByWhitespace: function() {
                same('#fixtures a *','#em2,#em,#span');
                same('#em2,#em,#span','#fixtures a *');
                same('div#fixtures p','#p');
            },
            test$$CombinesResultsWhenMultipleExpressionsArePassed: function() {
                same('#link_1,#link_2,#item_1,#item_2,#item_3','#p a, ul#list li');
                same('#p a,ul#list li','#link_1,#link_2,#item_1,#item_2,#item_3');
            },

            testSelectorWithTagNameAndAttributeExistence: function() {
                same('h1[class]',"#fixtures h1");
                same('li#item_3[class]',"#item_3");
            },
            testSelectorWithTagNameAndSpecificAttributeValue: function() {
                same('a[href="#"]',"#link_1,#link_2,#link_3");
                same("a[href='#']","#link_1,#link_2,#link_3");
            },

            testSelectorWithTagNameAndWhitespaceTokenizedAttributeValue: function() {
                same('a[class~="internal"]',"#link_1,#link_2");
                same('a[class~=internal]',"#link_1,#link_2");
                same("a[class~=\"internal\"]","#link_1,#link_2");
            },

            testSelectorWithAttributeAndNoTagName: function() {
                same('a[href]','[href]','',idoc.body);
                same('a[class~="internal"]',"a.internal");
                same('*[id]','[id]');
                same('[type=radio]','#checked_radio,#unchecked_radio');
                same('*[type=checkbox]','[type=checkbox]');
                same('[title]','#with_title,#commaParent');
                same('#troubleForm [type=radio]','#troubleForm *[type=radio]');
                same('#troubleForm *[type]','#troubleForm [type]');
            },
            testSelectorWithUniversalAndHyphenTokenizedAttributeValue: function() {
                same('*[lang|="es"]','#item_3');  //   same('*[xml:lang|="es"]','#item_3');
                same('li[lang|="ES"]','#item_3'); //  same('*[xml:lang|="ES"]','#item_3');
            },
            testSelectorWithTagNameAndNegatedAttributeValue: function() {
                same('a:not([href="#"])',[]);
            },
            testSelectorWithBracketAttributeValue: function() {
                same('#troubleForm2 input[name="brackets[5][]"]','#chk_1,#chk_2');
                same('#troubleForm2 input[name="brackets[5][]"]:checked',"#chk_1");
                same('#troubleForm2 input[name="brackets[5][]"][value="2"]',"#chk_2");
                same('#troubleForm2 input[name=brackets\\[5\\]\\[\\]]','#chk_1,#chk_2');
            },
            test$$WithNestedAttributeSelectors: function() {
                same('div[style] p[id] strong',"#strong")
            },

            testSelectorWithMultipleConditions: function() {
                same('a[class~=external][href="#"]','#link_3');
                same('a[class~=external]:not([href="#"])',[]);
            },
            testElementMatch: function() {
                var span = $('#dupL1',idoc);
           
                eq(span,"span")
                eq(span,'span#dupL1');
                eq(span,'div > span','child combinator');
                eq(span,'#dupContainer span', 'descendant combinator');
                eq(span,'#dupL1', 'ID only');
                eq(span,'span.span_foo', 'class name 1');
                eq(span,'span.span_bar', 'class name 2');
                eq(span,'span:first-child', 'first-child pseudoclass');

                eq($('#link_1',idoc),'a[rel^=external]');
                eq($('#link_1',idoc),'a[rel^="external"]');
                eq($('#link_1',idoc),"a[rel^='external']");
            },
            testSelectorWithSpaceInAttributeValue: function() {
                same('cite[title="hello world!"]','#with_title');
            },
            testSelectorWithChild: function() {
                same('p.first > a','#link_1,#link_2');
                same('div#grandfather > div','#father,#uncle');
                same('#level1>span','#level2_1,#level2_2');
                same('#level1 > span','#level2_1,#level2_2');
                same('#level2_1 > *','#level3_1,#level3_2');
                same('div > #nonexistent',[]);
            },
            testSelectorWithAdjacence: function() {
                same('div.brothers + div.brothers',"#uncle");
                same('div.brothers + div',"#uncle");
                same('#level2_1+span','#level2_2');
                same('#level2_1 + span','#level2_2');
                same('#level2_1 + *','#level2_2');
                same('#level2_2 + span',[]);
                same('#level3_1 + span','#level3_2')
                same("#level3_1 + * ","#level3_2");
                same('#level3_2 + *',[]);
                same('#level3_1 + em',[]);
            },
            testSelectorWithLaterSibling: function() {
                same('h1 ~ ul',"#list");
                same('#level2_1 ~ span',"#level2_2");
                same('#level2_1 ~ *',"#level2_2,#level2_3");
                same('#level2_2 ~ span',[]);
                same('#level3_2 ~ *',[]);
                same('#level3_1 ~ em',[]);
                same('#level3_1 ~ #level3_2','#level3_2');
                same('span ~ #level3_2','#level3_2');
                same('div ~ #level3_2',[]);
                same('div ~ #level2_3',[]);
            },
            testSelectorWithNewAttributeOperators: function() {
                same('div[class^=bro]','#father,#uncle', 'matching beginning of string');
                same('div[class$=men]','#father,#uncle', 'matching end of string');
                same('div[class*="ers m"]','#father,#uncle', 'matching substring')
                same('#level1 *[id^="level2_"]','#level2_1,#level2_2,#level2_3');
                same('#level1 *[id^=level2_]','#level2_1,#level2_2,#level2_3');
                same('#level1 *[id$="_1"]','#level2_1,#level3_1');
                same('#level1 *[id$=_1]','#level2_1,#level3_1');
                same('#level1 *[id*="2"]','#level2_1,#level3_2,#level2_2,#level2_3')
                same("#level1 *[id*='2']",'#level2_1,#level3_2,#level2_2,#level2_3')
            },
            testSelectorWithDuplicates: function() {
                same('div div');
                same('#dupContainer span span','#dupL2,#dupL3,#dupL4,#dupL5');

            },
            testSelectorWithFirstLastOnlyNthNthLastChild: function() {
                same('#level1>*:first-child','#level2_1');
                same('#level1 *:first-child','#level2_1,#level3_1,#level_only_child');
                same('#level1>*:last-child','#level2_3');
                same('#level1 *:last-child','#level3_2,#level_only_child,#level2_3')
                same('#level1>div:last-child','#level2_3');
                same('#level1 div:last-child','#level2_3');
                same('#level1>div:first-child',[]);
                same('#level1>span:last-child',[]);
                same('#level1 span:first-child','#level2_1,#level3_1');
                same('#level1:first-child',[]);
                same('#level1>*:only-child',[]);
                same('#level1 *:only-child','#level_only_child');
                same('#level1:only-child',[]);
                same('#p *:nth-last-child(2)','#link_2', 'nth-last-child');
                same('#p *:nth-child(3)','#link_2', 'nth-child');
                same('#p a:nth-child(3)','#link_2', 'nth-child');
                same('#list > li:nth-child(n+2)','#item_2,#item_3');//2 4
                same('#list > li:nth-child(-n+2)','#item_1,#item_2');

            },
            testSelectorWithFirstLastNthNthLastOfType: function() {
                same('#p a:nth-of-type(2)','#link_2', 'nth-of-type');
                same('#p a:nth-of-type(1)','#link_1', 'nth-of-type');
                same('#p a:nth-last-of-type(1)','#link_2', 'nth-last-of-type');
                same('#p a:first-of-type','#link_1', 'first-of-type');
                same('#p a:last-of-type','#link_2', 'last-of-type');
            },
            testSelectorWithNot: function() {
                same('#p a:not(:first-of-type)','#link_2', 'first-of-type');
                same('#p a:not(:last-of-type)','#link_1', 'last-of-type');
                same('#p a:not(:nth-of-type(1))','#link_2', 'nth-of-type');
                same('#p a:not(:nth-last-of-type(1))','#link_1', 'nth-last-of-type');
                same('#p a:not([rel~=nofollow])','#link_2', 'attribute 1');
                same('#p a:not([rel^=external])','#link_2', 'attribute 2');
                same('#p a:not([rel$=nofollow])','#link_2', 'attribute 3');
                same('#p a:not([rel$="nofollow"]) > em','#em', 'attribute 4')
                same('#list li:not(#item_1):not(#item_3)','#item_2', 'adjacent :not clauses');
                same('#grandfather > div:not(#uncle) #son','#son');
                same('#p a:not([rel$="nofollow"]) em','#em', 'attribute 4 + all descendants');
                same('#p a:not([rel$="nofollow"])>em','#em', 'attribute 4 (without whitespace)');
            },
            testSelectorWithEnabledDisabledChecked: function() {
                same('#troubleForm > *:disabled','#disabled_text_field');
                same('#troubleForm > *:enabled','#troubleForm > *:not(:disabled)');
                same('#troubleForm *:checked','#checked_box,#checked_radio');
            },
            testSelectorWithEmpty: function() {
                if (document.createEvent) {
                    same('#level1 *:empty','#level3_1,#level3_2,#level2_3', '#level1 *:empty');
                    same('#level_only_child:empty',[], 'newlines count as content!');
                } else {
                    same('#level3_1:empty','#level3_1', 'IE forced empty content!');
                }
            },
            testIdenticalResultsFromEquivalentSelectors: function() {
                same('div[class~=brothers]',"div.brothers");
                same('div[class~=brothers].brothers','div.brothers');
                same('div:not([class~=brothers])','div:not(.brothers)');
                same('li:not(:first-child)','li ~ li');
                same('ul > li:nth-child(n)','ul > li');
                same('ul > li:nth-child(2n)','ul > li:nth-child(even)');
                same('ul > li:nth-child(2n+1)','ul > li:nth-child(odd)');
                same('ul > li:nth-child(1)','ul > li:first-child');
                same('ul > li:nth-last-child(1)','ul > li:last-child');
                // Opera 10 does not accept values > 128 as a parameter to :nth-child
                // see Artificial Limits: http://operawiki.info/ArtificialLimits
                same('ul > li','ul > li:nth-child(n-128)');
                same('ul > li','ul>li');
                same('#p a:not([rel$="nofollow"]) > em','#p a:not([rel$="nofollow"])>em')
            },
            testSelectorsThatShouldReturnNothing: function() {
                same('span:empty > *',[]);
                same('div.brothers:not(.brothers)',[]);
                same('#level2_2 :only-child:not(:last-child)',[]);
                same('#level2_2 :only-child:not(:first-child)',[]);
                iframe.remove()
            }

        });
    }
    var iframe2 =  $("<iframe id='test_query' src='/test/selector2.html' style='display:none;width:0px;height:0px;' frameBorder=0  />").appendTo("body");//style='display:none;width:0px;height:0px;'
    window.selectorTestCall2 = function(){
        var idoc2  =  iframe2.contents()[0];

        $.fixture("选择器测试2-query",{
            testSiblings: function() {
                var i = 1, j = 1, n,
                elements, items, expr, types,
                operators = {
                    '+': ' >+~', 
                    '~': ' >+~'
                };
                for (types in operators) {
                    items = operators[types].split('');
                    for (i = 1, n = items.length; n >= i; ++i, ++j) {
                        expr = '#test' + j + ' ' + types + ' div ' + items[i - 1] + ' *';
                        elements = $.query(expr,idoc2)
                        expect(elements.length).eq( i % 5 == 1 ? 3 : 1,expr);
                    }
                }
                iframe2.remove()
            }
        })
    }
    var iframe3 =  $("<iframe id='test_query' src='/test/selector3.html' style='display:none;width:0px;height:0px;' frameBorder=0  />").appendTo("body");
    window.selectorTestCall3 = function(){
        var idoc3  =  iframe3.contents()[0];

        $.fixture("选择器测试3-query",{
            testDescendant: function() {
                var i = 1, j = 1, n,
                elements, items, expr, types,
                operators = {
                    ' ': ' >+~', 
                    '>': ' >+~'
                };
                for (types in operators) {
                    items = operators[types].split('');
                    for (i = 1, n = items.length; n >= i; ++i, ++j) {
                        expr = '#test' + j + ' ' + types + ' div ' + items[i - 1] + ' *';
                        elements = $.query(expr,idoc3)
                        expect(elements.length).eq( i % 5 == 1 ? 3 : 1,expr);
                    }
                }
                iframe3.remove()
            }
        })
    }
//    var iframe4 =  $("<iframe id='test_query' src='/test/selector4.html#target' width=100% height=400px  frameBorder=0  />").appendTo("body");//
//    window.selectorTestCall4 = function(){
//        var idoc4  =  iframe4.contents()[0];
//
//        var styleEl = $("<style>body {background-color:blue;}</style>",idoc4).appendTo("head"),style = styleEl[0];
//        var matchCSS = ""
//        function same(expr1,expr2,css,context){
//            context = context || idoc4;
//            expr2 = expr2 || expr1;
//            var  nodes1 =  $(expr1,context) ;
//  
//            var nodes2 =  NW.Dom.select(expr2,context) ;
//            var ret = expect(nodes1.valueOf()).same(nodes2,css)
//            if(ret&&css){
//                if(!context.querySelectorAll && /(:|\[)/.test(css)){
//                    var cssText = css.replace(expr1,"").replace("{","").replace("}","");
//                    cssText = cssText.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
//                    $.log(cssText)
//                    for(var i = 0,el;el = nodes1[i++];){
//                        el.style.cssText += ";"+cssText;
//                    }
//
//                }else{
//                    matchCSS += css +"\n"
//                }
//            }
//        }
//        var cssText  = $("#teststyle",idoc4).html();
//     
//        var lines = cssText.split(/\r?\n/),line,expr,rcomment = /\/\*/,rules = {},ri = 0,exprs = [];
//        for(var i=0,n=lines.length;i<n;i++){
//            line = lines[i]
//            if(/^\s*$/.test(line)){
//                continue
//            }
//            if(rcomment.test(line)){
//                continue
//            }
//            line = line.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
//            expr = line.substring(0,line.indexOf("{"));
//            rules[expr] = line;
//            exprs.push(expr);
//   
//        }
//        // $.log(rules)
//        $.fixture("选择器-query",{
//            testCSS3_: function() {
//            
//                var expr,  time = 0,exprs2 = exprs, i = 0;
//                (function check(){
//                    if(expr = exprs2.shift()){
//                        same(expr,expr,rules[expr]);
//                        time += 5
//                        setTimeout(check,time)
//                    }else{
//                        same('.blox7[class~="foo"]','#fixblox7','.blox7[class~="foo"] { background-color: lime; }');
//                        same('.attrStart > .t1[class^="unit"]','#fix_attrStart_t1','.attrStart > .t1[class^="unit"] { background-color: lime; }');   
//                        same('.attrEnd > .t1[class$="t1"]','#fix_attrEnd_t1','.attrStart > .t1[class^="unit"] { background-color: lime; }');   
//                        same('.attrMiddle > .t1[class*="t t"]','#fix_attrMiddle_t1','.attrStart > .t1[class^="unit"] { background-color: lime; }');  
//                                                                                                 
//                        if(style.styleSheet){    //ie
//                            style.styleSheet.cssText += matchCSS;//æ·»å æ°çåé¨æ ·å¼
//                        }else if(window.Components){
//                            style.innerHTML += matchCSS;//ç«çæ¯æç´æ¥innerHTMLæ·»å æ ·å¼è¡¨å­ä¸²
//                        }else{
//                            style.appendChild(idoc4.createTextNode(matchCSS))
//                        }
//                    }
//                })();
//
//                iframe4.remove()
//            }
//        })
//    }
    var iframe5 =  $("<iframe id='test_query' src='/test/selector5.html#target' style='display:none;width:0px;height:0px;'  frameBorder=0  />").appendTo("body");//
    window.selectorTestCall5 = function(){
        var idoc5  =  iframe5.contents()[0];
        var styleEl = $("<style>body {background-color:blue;}</style>",idoc5).appendTo("head"),style = styleEl[0];
        function afforest(selector,rule,context){
            context = context || idoc5;
            var nodes = $.query(selector,context) ;
            if(nodes.length && nodes){
                var cssText = rule.replace(selector,"").replace("{","").replace("}","");
                cssText = cssText.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
               
                for(var i = 0,el;el = nodes[i++];){
                    el.style.cssText += ";"+cssText;
                }
            }
        }
        var cssText  = $("#teststyle",idoc5).html();
        var lines = cssText.split(/\r?\n/),line,expr,rcomment = /\/\*/,rules = {},ri = 0,exprs = [];
        for(var i=0,n=lines.length;i<n;i++){
            line = lines[i]
            if(/^\s*$/.test(line)){
                continue
            }
            if(rcomment.test(line)){
                continue
            }
            line = line.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            expr = line.substring(0,line.indexOf("{"));
            rules[expr] = line;
            exprs.push(expr);
        }
 
        $.fixture("选择器测试4-query",{
            testCSS3: function() {
            
                var expr,  time = 0,exprs2 = exprs, i = 0;
                (function check(){
                    if(expr = exprs2.shift()){
                        afforest(expr,rules[expr])
                        i++;
                        if(i%10 ===0)
                            time += 5
                        setTimeout(check,time)
                    }else{
                        afforest('.blox6[foo="\\e9"]','.blox6[foo="\\e9"] { background-color: lime; }')
                        afforest('.blox6[\_foo="\\e9"]','.blox6[\_foo="\\e9"] { background-color: lime; }')
                        afforest('.attrStart > .t4[foo^="\\e9"]','.attrStart > .t4[foo^="\\e9"] { background-color: lime; }')
                        afforest('.attrEnd > .t4[foo$="\\e9"]','.attrEnd > .t4[foo$="\\e9"] { background-color: lime; }')
                        afforest('.attrMiddle > .t4[foo*="\\e9"]','.attrMiddle > .t4[foo*="\\e9"] { background-color: lime; }') ;
                        iframe5.remove()
                    }
                })();

            }
        })
    }
    
    var iframe6 =  $("<iframe id='test_query' src='/test/selector6.html' width=100% height=400px  frameBorder=0  />").appendTo("body");//
    window.selectorTestCall6 = function(){
        var idoc6  =  iframe6.contents()[0];
        function t(a,b,c) {
            var nodes = $.query(b,idoc6);
            expect(nodes).same( q.apply(q,c), a + " (" + b + ")");
        }
        function q() {
            var ret = [];
            for ( var i = 0; i < arguments.length; i++ ) {
                ret.push( idoc6.getElementById( arguments[i] ) );
            }
            return ret;
        }
        function equals(a,b,msg){
            expect(a).eq(b,msg)
        }
        function same(nodes1,nodes2,msg){
            expect(nodes1).same(nodes2,msg)
        }
        $.fixture("选择器测试5-query",{
            "element":function() {
  
                var all = $("*",idoc6);
                expect( all.length >= 30 ).ok( "Select all" );//1
                var good = true;
                for ( var i = 0; i < all.length; i++ )
                    if ( all[i].nodeType == 8 )
                        good = false;
                expect( good).ok( "Select all elements, no comment nodes" );//2
                t( "Element Selector", "#qunit-fixture p", ["firstp","ap","sndp","en","sap","first"] );//3
                t( "Element Selector", "body", ["body"] );//4
                t( "Element Selector", "html", ["html"] );//5
                t( "Parent Element", "div p", ["firstp","ap","sndp","en","sap","first"] );//6
                /* expect( $("#object1 param",idoc6).length).eq( 2, "Object/param as context" );//7 */
                same( $("p", idoc6.getElementsByTagName("div")).get(), q("firstp","ap","sndp","en","sap","first"), "Context is a NodeList)." );
                //如果context是字符串，context就必然是当前文档了
                //same( $("p", "div").get(), q("firstp","ap","sndp","en","sap","first"), "Context is a String." );
                same( $("p", $("div",idoc6)).get(), q("firstp","ap","sndp","en","sap","first"), "Context is a dom instance." );
                same( $("div p",idoc6).get(), q("firstp","ap","sndp","en","sap","first"), "Finding elements with a context." );
                same( $("div",idoc6).find("p").get(), q("firstp","ap","sndp","en","sap","first"), "Finding elements with a context." );
          
                same( $("#form",idoc6).find("select").get(), q("select1","select2","select3","select4","select5"), "Finding selects with a context." );

                expect( $("#length",idoc6).length).eq(1, '&lt;input name="length"&gt; cannot be found under IE, see #945' );
                expect( $("#lengthtest input",idoc6).length).eq(2, '&lt;input name="length"&gt; cannot be found under IE, see #945' );

                // Check for unique-ness and sort order
                same( $("p, div p",idoc6).get(), $("p",idoc6).get(), "Check for duplicates: p, div p" );
       
                t( "Checking sort order", "h2, h1", ["qunit-header", "qunit-banner", "qunit-userAgent"] );
                t( "Checking sort order", "h2:nth-child(2), h1:first-child", ["qunit-header", "qunit-banner"] );
                t( "Checking sort order", "#qunit-fixture p, #qunit-fixture p a", ["firstp", "simon1", "ap", "google", "groups", "anchor1", "mark", "sndp", "en", "yahoo", "sap", "anchor2", "simon", "first"] );

                // Test Conflict ID
                same( $("#lengthtest",idoc6).find("#idTest").get(), q("idTest"), "Finding element with id of ID." );
                same( $("#lengthtest",idoc6).find("[name='id']").get(), q("idTest"), "Finding element with id of ID." );
                same( $("#lengthtest",idoc6).find("input[id='idTest']").get(), q("idTest"), "Finding elements with a context." );
            },

            "xml":function(){
     
                var xmlstr = "<?xml version='1.0' encoding='UTF-8'?>\
<soap:Envelope xmlns:soap='http://schemas.xmlsoap.org/soap/envelope/'\
	xmlns:xsd='http://www.w3.org/2001/XMLSchema'\
	xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'>\
	<soap:Body>\
		<jsconf xmlns='http://www.example.com/ns1'>\
			<response xmlns:ab='http://www.example.com/ns2'>\
				<meta>\
					<component id='seite1' class='component'>\
						<properties xmlns:cd='http://www.example.com/ns3'>\
							<property name='prop1'  >\
								<thing />\
								<value>1</value>\
							</property>\
							<property name='prop2'>\
								<thing att='something' />\
							</property>\
							<foo_bar>foo</foo_bar>\
						</properties>\
					</component>\
				</meta>\
			</response>\
		</jsconf>\
	</soap:Body>\
</soap:Envelope>"  

                var xml = $.parseXML(xmlstr);
                equals( $("foo_bar", xml).length, 1, "Element Selector with underscore" );
                equals( $(".component", xml).length, 1, "Class selector" );
                equals( $("[class*=component]", xml).length, 1, "Attribute selector for class" );
                equals( $("property[name=prop2]", xml).length, 1, "Attribute selector with name" );
                equals( $("[name=prop2]", xml).length, 1, "Attribute selector with name" );
                equals( $("#seite1", xml).length, 1, "Attribute selector with ID" );
                equals( $("component#seite1", xml).length, 1, "Attribute selector with ID" );
                equals( $("component", xml).filter("#seite1").length, 1, "Attribute selector filter with ID" );

                expect( $( xml.lastChild ).is( "soap\\:Envelope" )).ok( "Check for namespaced element" );

            },
            "id": function() {
      
                t( "ID Selector", "#body", ["body"] );
                t( "ID Selector w/ Element", "body#body", ["body"] );
                t( "ID Selector w/ Element", "ul#first", [] );
                t( "ID selector with existing ID descendant", "#firstp #simon1", ["simon1"] );
                t( "ID selector with non-existant descendant", "#firstp #foobar", [] );
                t( "ID selector using UTF8", "#台北Táiběi", ["台北Táiběi"] );
                t( "Multiple ID selectors using UTF8", "#台北Táiběi, #台北", ["台北Táiběi","台北"] );
                t( "Descendant ID selector using UTF8", "div #台北", ["台北"] );
                t( "Child ID selector using UTF8", "form > #台北", ["台北"] );

                t( "Escaped ID", "#foo\\:bar", ["foo:bar"] );
                t( "Escaped ID", "#test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
                t( "Descendant escaped ID", "div #foo\\:bar", ["foo:bar"] );
                t( "Descendant escaped ID", "div #test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
                t( "Child escaped ID", "form > #foo\\:bar", ["foo:bar"] );
                t( "Child escaped ID", "form > #test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );

                t( "ID Selector, child ID present", "#form > #radio1", ["radio1"] ); // bug #267
                t( "ID Selector, not an ancestor ID", "#form #first", [] );
                t( "ID Selector, not a child ID", "#form > #option1a", [] );

                t( "All Children of ID", "#foo > *", ["sndp", "en", "sap"] );
                t( "All Children of ID with no children", "#firstUL > *", [] );
                var fixture = $('#qunit-fixture',idoc6)
                var a = $('<div id="xxxx7><a name="tName1">tName1 A</a><a name="tName2">tName2 A</a><div id="tName1">tName1 Div</div></div>',idoc6).appendTo(fixture);

                equals( $("#tName1",idoc6)[0].id, 'tName1', "ID selector with same value for a name attribute" );
                equals( $("#tName2",idoc6).length, 0, "ID selector non-existing but name attribute on an A tag" );
                a.remove();

                t( "ID Selector on Form with an input that has a name of 'id'", "#lengthtest", ["lengthtest"] );

                t( "ID selector with non-existant ancestor", "#asdfasdf #foobar", [] ); // bug #986

                same( $("body",idoc6).find("div#form").get(), [], "ID selector within the context of another element" );
                //#7533
                equals( $("<div id=\"A'B~C.D[E]\"><p>foo</p></div>").find("p").length, 1, "Find where context root is a node and has an ID with CSS3 meta characters" );
          
                t( "Underscore ID", "#types_all", ["types_all"] );
                t( "Dash ID", "#fx-queue", ["fx-queue"] );

                t( "ID with weird characters in it", "#name\\+value", ["name+value"] );
            },
            "class": function() {

                t( "Class Selector", ".blog", ["mark","simon"] );
                t( "Class Selector", ".GROUPS", ["groups"] );
                t( "Class Selector", ".blog.link", ["simon"] );
                t( "Class Selector w/ Element", "a.blog", ["mark","simon"] );
                t( "Parent Class Selector", "p .blog", ["mark","simon"] );
               
                same( $(".blog", idoc6.getElementsByTagName("p")).get(), q("mark", "simon"), "Finding elements with a context." );
                same( $("p .blog", idoc6).get(), q("mark", "simon"), "Finding elements with a context. p .blog" );
                same( $(".blog", $("p",idoc6)).get(), q("mark", "simon"), "Finding elements with a context." );
                same( $("p",idoc6).find(".blog").get(), q("mark", "simon"), "Finding elements with a context." );

                t( "Class selector using UTF8", ".台北Táiběi", ["utf8class1"] );
                t( "Class selector using UTF8", ".台北", ["utf8class1","utf8class2"] );
                t( "Class selector using UTF8", ".台北Táiběi.台北", ["utf8class1"] );
                t( "Class selector using UTF8", ".台北Táiběi, .台北", ["utf8class1","utf8class2"] );
                t( "Descendant class selector using UTF8", "div .台北Táiběi", ["utf8class1"] );
                t( "Child class selector using UTF8", "form > .台北Táiběi", ["utf8class1"] );

                t( "Escaped Class", ".foo\\:bar", ["foo:bar"] );
                t( "Escaped Class", ".test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
                t( "Descendant scaped Class", "div .foo\\:bar", ["foo:bar"] );
                t( "Descendant scaped Class", "div .test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
                t( "Child escaped Class", "form > .foo\\:bar", ["foo:bar"] );
                t( "Child escaped Class", "form > .test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );

                var div = document.createElement("div");
                div.innerHTML = "<div class='test e'></div><div class='test'></div>";
                same( $(".e", div).get(), [ div.firstChild ], "Finding a second class." );

                div.lastChild.className = "e";

                same( $(".e", div).get(), [ div.firstChild, div.lastChild ], "Finding a modified class." );
                div = null;
            },
            "name": function() {
                t( "Name selector", "input[name=action]", ["text1"] );
                t( "Name selector with single quotes", "input[name='action']", ["text1"] );
                t( "Name selector with double quotes", 'input[name="action"]', ["text1"] );

                t( "Name selector non-input", "[name=test]", ["length", "fx-queue"] );
                t( "Name selector non-input", "[name=div]", ["fadein"] );
                t( "Name selector non-input", "*[name=iframe]", ["iframe"] );

                t( "Name selector for grouped input", "input[name='types[]']", ["types_all", "types_anime", "types_movie"] );

                same( $("#form",idoc6).find("input[name=action]").get(), q("text1"), "Name selector within the context of another element" );
                same( $("#form",idoc6).find("input[name='foo[bar]']").get(), q("hidden2"), "Name selector for grouped form element within the context of another element" );

                var form = $("<form><input name='id'/></form>").appendTo("body");

                equals( form.find("input").length, 1, "Make sure that rooted queries on forms (with possible expandos) work." );

                form.remove();
                var fixture = $('#qunit-fixture',idoc6)
                var a = $('<div id="xxxx8"><a id="tName1ID" name="tName1">tName1 A</a><a id="tName2ID" name="tName2">tName2 A</a><div id="tName1">tName1 Div</div></div>',idoc6).appendTo(fixture);
                var children = a.children();

                equals( children.length, 3, "Make sure the right number of elements were inserted." );
                equals( children[1].id, "tName2ID", "Make sure the right number of elements were inserted." );

                equals( $("[name=tName1]",idoc6)[0], children[0], "Find elements that have similar IDs" );
                equals( $("[name=tName2]",idoc6)[0], children[1], "Find elements that have similar IDs" );
                t( "Find elements that have similar IDs", "#tName2ID", ["tName2ID"] );
                a.remove();
            },
            "multiple":function() {
                t( "Comma Support", "h2, #qunit-fixture p", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
                t( "Comma Support", "h2 , #qunit-fixture p", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
                t( "Comma Support", "h2 , #qunit-fixture p", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
                t( "Comma Support", "h2,#qunit-fixture p", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
            },
            "child and adjacent": function() {
                t( "Child", "p > a", ["simon1","google","groups","mark","yahoo","simon"] );
                t( "Child", "p> a", ["simon1","google","groups","mark","yahoo","simon"] );
                t( "Child", "p >a", ["simon1","google","groups","mark","yahoo","simon"] );
                t( "Child", "p>a", ["simon1","google","groups","mark","yahoo","simon"] );
               
                t( "Child w/ Class", "p > a.blog", ["mark","simon"] );
                t( "All Children", "code > *", ["anchor1","anchor2"] );
                t( "All Grandchildren", "p > * > *", ["anchor1","anchor2"] );
                t( "Adjacent", "#qunit-fixture a + a", ["groups"] );
                t( "Adjacent", "#qunit-fixture a +a", ["groups"] );
                t( "Adjacent", "#qunit-fixture a+ a", ["groups"] );
                t( "Adjacent", "#qunit-fixture a+a", ["groups"] );
                t( "Adjacent", "p + p", ["ap","en","sap"] );
                t( "Adjacent", "p#firstp + p", ["ap"] );
                t( "Adjacent", "p[lang=en] + p", ["sap"] );
                t( "Adjacent", "a.GROUPS + code + a", ["mark"] );
              
                t( "Comma, Child, and Adjacent", "#qunit-fixture a + a, code > a", ["groups","anchor1","anchor2"] );
        
                t( "Element Preceded By", "#qunit-fixture p ~ div", ["foo", "moretests","tabindex-tests", "liveHandlerOrder", "siblingTest"] );
                t( "Element Preceded By", "#first ~ div", ["moretests","tabindex-tests", "liveHandlerOrder", "siblingTest"] );
                t( "Element Preceded By", "#groups ~ a", ["mark"] );
                t( "Element Preceded By", "#length ~ input", ["idTest"] );
                t( "Element Preceded By", "#siblingfirst ~ em", ["siblingnext"] );
                  
                //    same( $("#siblingfirst",idoc6).find("~ em").get(), q("siblingnext"), "Element Preceded By with a context." );
                //    same( $("#siblingfirst",idoc6).find("+ em").get(), q("siblingnext"), "Element Directly Preceded By with a context." );

                equals( $("#listWithTabIndex",idoc6).length, 1, "Parent div for next test is found via ID (#8310)" );

                equals( $("#__sizzle__",idoc6).length, 0, "Make sure the temporary id assigned by sizzle is cleared out (#8310)" );
                equals( $("#listWithTabIndex",idoc6).length, 1, "Parent div for previous test is still found via ID (#8310)" );

                t( "Verify deep class selector", "div.blah > p > a", [] );

                t( "No element deep selector", "div.foo > span > a", [] );

                t( "Non-existant ancestors", ".fototab > .thumbnails > a", [] );
                
            },
            attributes: function() {
              
                t( "Attribute Exists", "a[title]", ["google"] ); 
                t( "Attribute Exists", "*[title]", ["google"] );
                t( "Attribute Exists", "[title]", ["google"] );  
                t( "Attribute Exists", "a[ title ]", ["google"] );
                t( "Attribute Equals", "a[rel='bookmark']", ["simon1"] );
                t( "Attribute Equals", 'a[rel="bookmark"]', ["simon1"] );
                t( "Attribute Equals", "a[rel=bookmark]", ["simon1"] );
                t( "Attribute Equals", "a[href='http://www.google.com/']", ["google"] );
                t( "Attribute Equals", "a[ rel = 'bookmark' ]", ["simon1"] );

                idoc6.getElementById("anchor2").href = "#2";
                t( "href Attribute", "p a[href^=#]", ["anchor2"] );
                t( "href Attribute", "p a[href*=#]", ["simon1", "anchor2"] );

                t( "for Attribute", "form label[for]", ["label-for"] );
                t( "for Attribute in form", "#form [for=action]", ["label-for"] );

                t( "Attribute containing []", "input[name^='foo[']", ["hidden2"] );
                t( "Attribute containing []", "input[name^='foo[bar]']", ["hidden2"] );
                t( "Attribute containing []", "input[name*='[bar]']", ["hidden2"] );
                t( "Attribute containing []", "input[name$='bar]']", ["hidden2"] );
                t( "Attribute containing []", "input[name$='[bar]']", ["hidden2"] );
                t( "Attribute containing []", "input[name$='foo[bar]']", ["hidden2"] );
                t( "Attribute containing []", "input[name*='foo[bar]']", ["hidden2"] );

                t( "Multiple Attribute Equals", "#form input[type='radio'], #form input[type='hidden']", ["radio1", "radio2", "hidden1"] );
                t( "Multiple Attribute Equals", "#form input[type='radio'], #form input[type=\"hidden\"]", ["radio1", "radio2", "hidden1"] );
                t( "Multiple Attribute Equals", "#form input[type='radio'], #form input[type=hidden]", ["radio1", "radio2", "hidden1"] );

                t( "Attribute selector using UTF8", "span[lang=中文]", ["台北"] );

                t( "Attribute Begins With", "a[href ^= 'http://www']", ["google","yahoo"] );
                t( "Attribute Ends With", "a[href $= 'org/']", ["mark"] );
                t( "Attribute Contains", "a[href *= 'google']", ["google","groups"] );
                t( "Attribute Is Not Equal", "#ap a[hreflang!='en']", ["google","groups","anchor1"] );

                t("Empty values", "#select1 option[value='']", ["option1a"]);
                t("Empty values", "#select1 option[value!='']", ["option1b","option1c","option1d"]);

                t("Select options via :selected", "#select1 option:selected", ["option1a"] );
                t("Select options via :selected", "#select2 option:selected", ["option2d"] );
                t("Select options via :selected", "#select3 option:selected", ["option3b", "option3c"] );

                t( "Grouped Form Elements", "input[name='foo[bar]']", ["hidden2"] );

                // Make sure attribute value quoting works correctly. See: #6093
                var body = $("body",idoc6)
                var attrbad = $('<input type="hidden" value="2" name="foo.baz" id="attrbad1"/><input type="hidden" value="2" name="foo[baz]" id="attrbad2"/>',idoc6).appendTo(body);

                t("Find escaped attribute value", "input[name=foo\\.baz]", ["attrbad1"]);
                t("Find escaped attribute value", "input[name=foo\\[baz\\]]", ["attrbad2"]);

                t("input[type=text]", "#form input[type=text]", ["text1", "text2", "hidden2", "name"]);
                t("input[type=search]", "#form input[type=search]", ["search"]);

                attrbad.remove();

                //#6428
                t("Find escaped attribute value", "#form input[name=foo\\[bar\\]]", ["hidden2"]);

                //#3279
                var div = document.createElement("div");
                div.innerHTML = "<div id='foo' xml:test='something'></div>";

                same( $( "[xml\\:test]", div ).get(), [ div.firstChild ], "Finding by attribute with escaped characters." );
            },
            "pseudo_child": function() {
                t( "First Child", "#qunit-fixture p:first-child", ["firstp","sndp"] );
                t( "Last Child", "p:last-child", ["sap"] );
                t( "Only Child", "#qunit-fixture a:only-child", ["simon1","anchor1","yahoo","anchor2","liveLink1","liveLink2"] );
                t( "Empty", "ul:empty", ["firstUL"] );
                t( "Is A Parent", "#qunit-fixture p:parent", ["firstp","ap","sndp","en","sap","first"] );

                t( "First Child", "p:first-child", ["firstp","sndp"] );
                t( "Nth Child", "p:nth-child(1)", ["firstp","sndp"] );
                t( "Nth Child With Whitespace", "p:nth-child( 1 )", ["firstp","sndp"] );
                t( "Not Nth Child", "#qunit-fixture p:not(:nth-child(1))", ["ap","en","sap","first"] );

                // Verify that the child position isn't being cached improperly
                $("p:first-child",idoc6).after("<div></div>");
                $("p:first-child",idoc6).before("<div></div>").next().remove();

                t( "First Child", "p:first-child", [] );
                
                t( "Last Child", "p:last-child", ["sap"] );
                t( "Last Child", "#qunit-fixture a:last-child", ["simon1","anchor1","mark","yahoo","anchor2","simon","liveLink1","liveLink2"] );

                t( "Nth-child", "#qunit-fixture form#form > *:nth-child(2)", ["text1"] );
                t( "Nth-child", "#qunit-fixture form#form > :nth-child(2)", ["text1"] );

            },
            "pseudo - :not": function() {
                t( "Not", "a.blog:not(.link)", ["mark"] );

                t( ":not() failing interior", "#qunit-fixture p:not(.foo)", ["firstp","ap","sndp","en","sap","first"] );
                t( ":not() failing interior", "#qunit-fixture p:not(#blargh)", ["firstp","ap","sndp","en","sap","first"] );

                t( ":not Multiple", "#qunit-fixture p:not(a)", ["firstp","ap","sndp","en","sap","first"] );
                t( ":not Multiple", "#qunit-fixture p:not(a):not(b)", ["firstp","ap","sndp","en","sap","first"] );
                t( ":not Multiple", "#qunit-fixture p:not(a):not(b):not(div)", ["firstp","ap","sndp","en","sap","first"] );
                t( ":not Multiple", "p:not(p)", [] );


                t( "No element not selector", ".container div:not(.excluded) div", [] );

                t( ":not() Existing attribute", "#form select:not([multiple])", ["select1", "select2", "select5"]);
                t( ":not() Equals attribute", "#form select:not([name=select1])", ["select2", "select3", "select4","select5"]);
                t( ":not() Equals quoted attribute", "#form select:not([name='select1'])", ["select2", "select3", "select4", "select5"]);

                t( ":not() Multiple Class", "#foo a:not(.blog)", ["yahoo","anchor2"] );
                t( ":not() Multiple Class", "#foo a:not(.link)", ["yahoo","anchor2"] );
            },
            "pseudo - form": function() {
                var form = $("#form",idoc6)
                var implied = $('<input id="impliedText"/>',idoc6).appendTo(form);

                t( "Form element :input", "#form :input", ["text1", "text2", "radio1", "radio2", "check1", "check2", "hidden1", "hidden2", "name", "search", "button", "area1", "select1", "select2", "select3", "select4", "select5", "impliedText"] );
                t( "Form element :radio", "#form :radio", ["radio1", "radio2"] );
                t( "Form element :checkbox", "#form :checkbox", ["check1", "check2"] );
                t( "Form element :text", "#form :text", ["text1", "text2", "hidden2", "name", "impliedText"] );
                t( "Form element :radio:checked", "#form :radio:checked", ["radio2"] );
                t( "Form element :checkbox:checked", "#form :checkbox:checked", ["check1"] );
                t( "Form element :radio:checked, :checkbox:checked", "#form :radio:checked, #form :checkbox:checked", ["radio2", "check1"] );

                t( "Selected Option Element", "#form option:selected", ["option1a","option2d","option3b","option3c","option4b","option4c","option4d","option5a"] );

                implied.remove();
            }


        })
        
      
        
    }
     
  
});

//生成测试选择器
/*
#test1 + div *
#test2 + div > *
#test3 + div + *
#test4 + div ~ *
#test5 ~ div *
#test6 ~ div > *
#test7 ~ div + *
#test8 ~ div ~ *
 */        