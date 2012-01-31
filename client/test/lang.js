$.define("lang","lang,more/spec",function( $$ ){
    $.log("已加载text/lang模块")
    $.fixture("语言扩展模块-lang",{
        "$.isPlainObject": function() {
            expect($.isPlainObject([])).ng();
            expect($.isPlainObject(1)).ng();
            expect($.isPlainObject(null)).ng();
            expect($.isPlainObject(void 0)).ng();
            expect($.isPlainObject(window)).ng();
            expect($.isPlainObject(document.body)).ng();
            expect(window.location).log();
            expect($.isPlainObject(window.location)).ng();
            var fn = function(){}
            expect($.isPlainObject(fn)).ng();
            fn.prototype = {
                someMethod: function(){}
            };
            expect($.isPlainObject(new fn)).ng();
            expect($.isPlainObject({})).ok();
            expect($.isPlainObject({
                aa:"aa",
                bb:"bb",
                cc:"cc"
            })).ok();
            expect($.isPlainObject(new Object)).ok();
        },
        "$.isArrayLike":function(){
            expect($.isArrayLike(arguments)).ok();//1
            expect($.isArrayLike(document.links)).ok();//2
            expect($.isArrayLike(document.documentElement.childNodes)).ok();
            expect($.isArrayLike({
                0:"a",
                1:"b",
                length:2
            })).ok();

            var tag = $.tag
            var html = tag("select",tag("option","aaa") + tag("option","bbb")+ tag("option","ccc"))
            var div = document.createElement("div");
            div.innerHTML = html;
            var select = div.firstChild;
            expect($.isArrayLike(select)).ng();

        },
        "$.isNative":function(){
            expect($.isNative(Array.prototype,"slice")).ok();
            expect($.isNative(Array.prototype,"indexOf")).log();
            expect($.isNative(Array.prototype,"forEach")).log();
            expect($.isNative(String.prototype,"quote")).log();
            expect($.isNative(String.prototype,"trim")).log();
            expect($.isNative(Function.prototype,"bind")).log();
        },
        "$.range":function(){
            expect($.range(10)).same([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect($.range(1, 11)).same([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            expect($.range(0, 30, 5)).same([0, 5, 10, 15, 20, 25]);
            expect($.range(0, -10, -1)).same([0, -1, -2, -3, -4, -5, -6, -7, -8, -9]);
            expect($.range(0)).same([]);
        },
        "$.format":function(){
            expect($.format("pi is #{0}", Math.PI)).eq("pi is 3.141592653589793");

            var a = $.format("style.#{name}=((isEnd ? #{end} : adapter.#{type}( #{from}, #{change},'#{easing}',per ))|0)+'#{unit}';",{
                name:"width",
                end:"0",
                type:"_default",
                from:"200",
                change:"200",
                easing:"linear",
                unit:"px"
            })   ;

            expect(a).eq("style.width=((isEnd ? 0 : adapter._default( 200, 200,'linear',per ))|0)+'px';");

        },
        "$.tag":function(){
            var tag = $.tag
            var html = tag("h1 title='aaa'","sss")
            ('a href=#' ,
                tag("img src='http://www.google.com.hk/images/nav_logo83.png'")
                ('br')
                ('' ,"View larger image") );
            expect(html+"").eq("<h1 title='aaa'>sss</h1><a href=#><img src='http://www.google.com.hk/images/nav_logo83.png'><br>View larger image</a>");
        },
        "$.parseXML":function(){
            var str = "<note><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don't forget me this weekend!</body></note>"
            expect($.parseXML(str).nodeType).eq(9)//[object XMLDocument]
        },

        "$.String":function(){
            expect($$("aaabbbcc").contains("bbb")).ok();
            expect($$('http://index').startsWith('http')).ok();
            expect($$('image.gif').endsWith('.gif')).ok();
            expect($$('image.gif').endsWith('.GIF')).ng();
            expect($$('image.gif').endsWith(".GIF",true)).ok();

            expect($$('司徒正美').byteLen()).eq(8);

            expect($$('').empty()).ok();
            expect($$(' ').empty()).ng();

            expect($$(' ').blank()).ok();
            expect($$('').blank()).ok();
            expect($$('\n').blank()).ok();
            expect($$(' a').blank()).ng();

            expect($$("this is a test test").truncate(10)).eq("this is...");

            expect($$("foo-bar").camelize()).eq("fooBar");

            expect($$("boo boo boo").capitalize()).eq("Boo boo boo");

            expect($$("fooBar").underscored()).eq("foo_bar");
            expect($$("foo-bar").underscored()).eq("foo_bar");

            expect($$("foo-bar").capitalizeX().camelize()).eq("FooBar");
            
            expect($$("10.23").toInt()).eq(10);
            expect($$("1.23").toFloat()).eq(1.23);

            expect($$("animals.sheep[1]").escapeRegExp()).eq("animals\\.sheep\\[1\\]");

            expect($$("2").padLeft(4)).eq("0002");

            expect($$("2").padRight(4," ")).eq("2   ");
            expect($$("ruby").times(2)).eq("rubyruby");

        },
        "$.Array":function(){
            var a = ["aaa",1,2,undefined,3,4,null,{
                2:2
            }];
            //复制一个副本
            var b = $$(a).clone();
            expect(a).same(b);
            expect(a).not(b);

            expect($$(a).first()).eq('aaa');
            expect($$(a).first(function(el){
                return el >1
            })).eq(2);
            expect($$(a).last()).same({
                2:2
            });
            expect($$(a).last(function(el){
                return el >1
            })).eq(4);

            expect($$(a).contains(2)).ok();

            expect($$(a).diff([1,2,3])).same(["aaa",undefined,4,null,{
                2:2
            }]);

            expect($$(b).remove(1)).same([1]);
            expect($$(b).removeAt(1)).same([2]);
            expect($$(a).shuffle()).log();
            expect($$(a).random()).log();
            expect($$(a).compact()).same(["aaa",1,2,3,4,{
                2:2
            }]);
            expect($$(a).merge([3,4,5])).same(["aaa",1,2,undefined,3,4,null,{
                2:2
            },3,4,5]);
            var c = [3,4,6,1,45,9,5,3,4,22,3];
            expect($$(c).min()).eq(1);
            expect($$(c).max()).eq(45);
            expect($$(c).unique()).same([6,1,45,9,5,4,22,3]);
            expect($$([1, 2, 1, 3, 1, 4]).unique()).same([2,3,1,4]);

            var d =['frank', ['bob', 'lisa'], ['jill', ['tom', 'sally']]];
            expect($$(d).flatten()).same(['frank', 'bob', 'lisa', 'jill', 'tom', 'sally']);

            var e = ['hello', 'world', 'this', 'is', 'nice'];
            expect($$(e).pluck("length")).same([5, 5, 4, 2, 4]);
            expect($$(e).sortBy(function(s) {
                return s.length;
            })).same(["is","this","nice","hello","world"]);

            var f = [0,1,2,9];
            var g = [0,5,2];
            expect($$(f).diff(g)).same([1,9]);

            var h = [1,2,3];
            h = $$(h).union([2,3,4,5,6]);//取并集
            expect(h).same([1,2,3,4,5,6]);
            var j = [1, 2, 3, "a"];
            j = $$(j).intersect([1, "a", 2]);//取交集
            expect(j).same([1, 2, "a"]);

        },
        "$.Number" : function(){
            var a = [];
            $$(8).downto(4, function(i) {
                a.push(i);
            });
            expect(a).same([8,7,6,5,4]);

            expect($$(4.444).round(1)).eq(4.4);
            expect($$(4.444).round(2)).eq(4.44);
            expect($$(4.444).round(3)).eq(4.444);
            expect($$(7).constrain(3,5)).eq(5);
            expect($$(4).constrain(3,5)).eq(4);
            expect($$(4).nearer(3,9)).eq(3);
            expect($$(454).nearer(-4543,6576)).eq(-4543);
        },
        "$.Object":function(){

            var a = {
                a:"one",
                b:"two",
                c:"three"
            };
            expect($$(a).subset(["a","c"])).same({
                a: 'one',
                c: 'three'
            });
            a = {
                first: 'Sunday',
                second: 'Monday',
                third: 'Tuesday'
            };
            var b = [];
            $$(a).forEach(function(value){
                b.push(value);
            });
            expect(b).same(["Sunday","Monday","Tuesday"]);
            a = {
                e:1,
                b:"aaa",
                c:[1,2,3],
                d:{
                    bb:"bb"
                }
            };

            expect($$(a).clone()).same(a);
            var obj1 = {
                a: 0,
                b: 1
            };
            var obj2 = {
                c: 2,
                d: 3
            };
            var obj3 = {
                a: 4,
                d: 5
            };
            var merged  = $$(obj1).merge(obj2, obj3);
            expect(obj1).same(merged);
            var nestedObj1 = {
                a: {
                    b: 1,
                    c: 1
                }
            };
            var nestedObj2 = {
                a: {
                    b: 2
                }
            };
            var nested  = $$(nestedObj1).merge(nestedObj2);
            expect(nested).same({
                a: {
                    b: 2,
                    c: 1
                }
            });

            a = {
                a:1,
                b:2,
                c:3
            };
            expect($$(a).without("a")).same({
                b:2,
                c:3
            });
        }
       
    });
});
   

