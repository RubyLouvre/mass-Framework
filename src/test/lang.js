$.define("lang","lang,more/spec",function( $$ ){
    $.log("已加载text/lang模块")
    $.fixture("语言扩展模块-lang",{
        'Object.keys': function() {
            expect(Object.keys({
                aa:1,
                bb:2,
                cc:3
            })).same(["aa","bb","cc"]);
            //测试特殊属性
            var array = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(","), testobj = {}
            for(var i = 0, el; el = array[i++];){
                testobj[el] = i;
            };
            expect(Object.keys(testobj)).same(array);
        },

        "Array#map":function(){
            var ret = [1, 2, 3, 4].map(function(a, b) {
                return a + b;
            });
            expect(ret).same( [1, 3, 5, 7] );
        },
        "Array#filter":function(){
            var ret = [1, 2, 3, 4, 5, 6, 7, 8].filter(function(a, b) {
                return a > 4
            });
            expect(ret).same( [5, 6, 7, 8] );
        },
        "Array#reduce":function(){
            var ret = [1, 2, 3, 4].reduce(function(a, b) {
                return a + b;
            }, 10);
            expect(ret).eq(20);
        },
        "Array#reduceRight":function(){
            var flattened = [[0, 1], [2, 3], [4, 5]].reduceRight(function(a, b) {
                return a.concat(b);
            }, []);
            expect(flattened).same([4, 5, 2, 3, 0, 1]);
        },
        "isDuckType": function(){
            //测试鸭子类型
            var a = function(){}
            a.prototype.toString = function(){
                return "[object XXX]"
            }
            var aa = new a()
            expect( Object.prototype.toString.call(aa) ).eq("[object Object]")
        },
        "$.isArray": function(){
            var iframe = document.createElement('iframe');
            iframe.style.display = "none";
            document.body.appendChild(iframe);
            var d = iframe.contentDocument || iframe.contentWindow.document;
            d.write("<!doctype html><body><script>top.xArray = Array<\/script>")
            d.close();
            var xArray = window.xArray
            var arr = new xArray(1,2,3); // [1,2,3]
            expect( $.isArray(arr) ).ok();
            expect( $.isArray([]) ).ok();
            document.body.removeChild(iframe);
            expect( $.isArray(function test(a,b,c){}) ).ng();
            expect( $.isArray(/test/) ).ng();
            expect( $.isArray( "test") ).ng();
            expect( $.isArray(window) ).ng();
            expect( $.isArray({
                0: 0,
                1: 1,
                2: 2,
                length: 3,
                sort: function(){}
            }) ).ng();
        },
        "String#trim":function(){
            expect('  test  '.trim() ).eq('test');
        },
        Date: function(){
            expect( /^\d+$/.test( Date.now() ) ).ok();
            var date = new Date("2012/4/29");
            expect( date.getYear() ).eq( 112 );
            date.setYear( 2014 );
            expect( date.getYear() ).eq( 114 );
        },

        "$.isPlainObject": function() {
            //不能DOM, BOM与自定义"类"的实例
            expect( $.isPlainObject([])).ng();
            expect( $.isPlainObject(1)).ng();
            expect( $.isPlainObject(null)).ng();
            expect( $.isPlainObject(void 0)).ng();
            expect( $.isPlainObject(window)).ng();
            expect( $.isPlainObject(document.body)).ng();
            expect(window.location).log();
            expect( $.isPlainObject(window.location)).ng();
            var fn = function(){}
            expect( $.isPlainObject(fn)).ng();
            fn.prototype = {
                someMethod: function(){}
            };
            expect( $.isPlainObject(new fn)).ng();
            expect( $.isPlainObject({})).ok();
            expect( $.isPlainObject({
                aa:"aa",
                bb:"bb",
                cc:"cc"
            })).ok();
            expect( $.isPlainObject(new Object)).ok();
        },
        "$.isArrayLike":function(){
            //函数,正则,元素,节点,文档,window等对象为非
            expect( $.isArrayLike(function(){})).ng();
            expect( $.isArrayLike(document.createElement("select"))).ng();
            expect( $.isArrayLike(document)).ng();
            expect( $.isArrayLike(window)).ng();
            //用于下面的对arguments的判定
            expect( $.type(arguments)).eq("Arguments");
            expect( isFinite(arguments.length) ).ok()
            expect( $.isArrayLike(arguments)).ok();
            expect( $.isArrayLike(document.links)).ok();
            expect( $.isArrayLike(document.documentElement.childNodes)).ok();
            //自定义对象必须有length,并且为非负正数
            expect( $.isArrayLike({
                0:"a",
                1:"b",
                length:2
            })).ok();


        },
        "$.isNative":function(){
            
            expect( $.isNative(Array.prototype,"slice") ).ok();
            expect( $.isNative(Array.prototype,"indexOf") ).log();
            expect( $.isNative(Array.prototype,"forEach") ).log();
            expect( $.isNative(String.prototype,"quote") ).log();
            expect( $.isNative(String.prototype,"trim") ).log();
            expect( $.isNative(Function.prototype,"bind") ).log();
        },
        "$.range":function(){
            expect( $.range(10)).same([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect( $.range(1, 11)).same([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            expect( $.range(0, 30, 5)).same([0, 5, 10, 15, 20, 25]);
            expect( $.range(0, -10, -1)).same([0, -1, -2, -3, -4, -5, -6, -7, -8, -9]);
            expect( $.range(0)).same([]);
        },
        "$.format":function(){

            expect( $.format("pi is #{0}", Math.PI)).eq("pi is 3.141592653589793");

            var ret = $.format( "style.#{name}=((isEnd ? #{end} : adapter.#{type}( #{from}, #{change},'#{easing}',per ))|0)+'#{unit}';",{
                name:"width",
                end:"0",
                type:"_default",
                from:"200",
                change:"200",
                easing:"linear",
                unit:"px"
            })   ;

            expect( ret ).eq( "style.width=((isEnd ? 0 : adapter._default( 200, 200,'linear',per ))|0)+'px';");

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
            expect( $.parseXML(str).nodeType).eq(9)//[object XMLDocument]
        },
        "$.String": function(){
            expect( $.String.contains("aaabbbcc", "bbb") ).ok();
            expect( $.String.startsWith('http://index', 'http') ).ok();
            expect( $.String.endsWith('image.gif', '.gif') ).ok();
            expect( $.String.endsWith('image.gif', '.GIF') ).ng();
            expect( $.String.endsWith('image.gif',".GIF",true) ).ok();
            expect( $.String.byteLen('司徒正美') ).eq(8);
            expect( $.String.empty('') ).ok();
            expect( $.String.empty(' ') ).ng();
            expect( $.String.blank(' ') ).ok();
            expect( $.String.blank('') ).ok();
            expect( $.String.blank('\n') ).ok();
            expect( $.String.blank(' a') ).ng();
            expect( $.lang("this is a test test").truncate(10) ).eq("this is...");
            expect( $.lang("foo-bar").camelize() ).eq("fooBar");
            expect( $.lang("boo boo boo").capitalize() ).eq("Boo boo boo");
            expect( $.lang("fooBar").underscored() ).eq("foo_bar");
            expect( $.lang("foo-bar").underscored() ).eq("foo_bar");
            expect( $.lang("foo-bar").capitalize().camelize()).eq("FooBar");
            expect( $.lang("10.23").toInt()).eq( 10 );
            expect( $.lang("1.23").toFloat()).eq( 1.23 );
            expect( $.lang("animals.sheep[1]").escapeRegExp() ).eq("animals\\.sheep\\[1\\]");
            expect( $.lang("2").padLeft(4) ).eq("0002");
            expect( $.lang("2").padRight(4," ") ).eq("2   ");
            expect( $.lang("ruby").times(2) ).eq("rubyruby");
        },

        "$.Array":function(){
            var a = ["aaa",1,2,undefined,3,4,null,{
                2:2
            } ];
            //复制一个副本
            var b = $.lang(a).clone().value();
            expect( a ).same( b );
            expect( a ).not( b );
            expect( $.lang(a).first().value() ).eq('aaa');
            expect( $.lang(a).first(function(el){
                return el >1
            }).value() ).eq(2);
            expect( $.lang(a).last().value() ).same({
                2:2
            });
            expect( $.lang(a).last(function(el){
                return el >1
            }).value() ).eq(4);
            expect( $.lang(a).contains(2).value() ).ok();
            expect( $.lang(a).diff([1,2,3]).value() ).same(["aaa",undefined,4,null,{
                2:2
            }]);

            expect( $.lang(b).remove(1).value() ).same([1]);
            expect( $.lang(b).removeAt(1).value() ).same([2]);
            expect( $.lang(a).shuffle().value() ).log();
            expect( $.lang(a).random().value() ).log();
            expect( $.lang(a).compact().value() ).same(["aaa",1,2,3,4,{
                2:2
            }] );
            expect( $.lang(a).merge([3,4,5]).value() ).same(["aaa",1,2,undefined,3,4,null,{
                2:2
            },3,4,5]);
            var c = [3,4,6,1,45,9,5,3,4,22,3];
            expect( $.lang(c).min().value() ).eq(1);
            expect( $.lang(c).max().value() ).eq(45);
            expect( $.lang(c).unique().value() ).same( [ 6, 1, 45, 9, 5, 4, 22, 3 ] );
            expect( $.lang([1, 2, 1, 3, 1, 4]).unique().value() ).same( [2,3,1,4] );
            //测试平坦化
            var d =[ 'frank', ['bob', 'lisa'], [ 'jill', ['tom', 'sally'] ] ];
            expect( $.lang(d).flatten().value() ).same( ['frank', 'bob', 'lisa', 'jill', 'tom', 'sally'] );

            var e = ['hello', 'world', 'this', 'is', 'nice'];
            expect( $.lang(e).pluck("length").value() ).same([5, 5, 4, 2, 4]);
            expect( $.lang(e).sortBy(function(s) {
                return s.length;
            }).value() ).same( ["is","this","nice","hello","world"] );

            expect( $.lang( [0, 1, 2, 9] ).diff( [0, 5, 2] ).value() ).same( [1, 9] );

            var h = $.lang( [1, 2, 3] ).union( [2, 3, 4, 5, 6 ] ).value();//取并集
            expect( h ).same( [1, 2, 3, 4, 5, 6 ] );
            var j = $.lang( [1, 2, 3, "a"] ).intersect( [ 1, "a", 2 ] ).value();//取交集
            expect( j ).same([1, 2, "a"]);

        },
        "$.Number" : function(){
            var a = [];
            $.lang(8).downto( 4, function(i) {
                a.push(i);
            });
            expect( a ).same( [8, 7, 6, 5, 4] );
            expect( $.Number.round( 4.444, 1 ) ).eq(4.4);
            expect( $.Number.round( 4.444, 2 ) ).eq(4.44);
            expect( $.Number.round( 4.444, 3 ) ).eq(4.444);
            expect( $.Number.constrain( 7,3,5 ) ).eq(5);
            expect( $.Number.constrain( 4, 3, 5 ) ).eq(4);
            expect( $.Number.nearer( 4, 3, 9 ) ).eq(3);
            expect( $.Number.nearer( 454, -4543 ,6576 ) ).eq(-4543);
        },
        "$.Object":function(){

            var a = {
                a:"one",
                b:"two",
                c:"three"
            };
            expect(  $.lang(a).subset(["a","c"]).value() ).same({
                a: 'one',
                c: 'three'
            });
            a = {
                first: 'Sunday',
                second: 'Monday',
                third: 'Tuesday'
            };
            var b = [];
            $.lang(a).each(function(value){
                b.push(value);
            });
            expect( b ).same(["Sunday","Monday","Tuesday"]);
            a = {
                e: 1,
                b: "aaa",
                c: [1,2,3],
                d: {
                    bb:"bb"
                }
            };

            expect(  $.lang(a).clone().value() ).same(a);
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
            var merged  = $.lang( obj1 ).merge(obj2, obj3).value();
            expect( obj1 ).same(merged);
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
            var nested  = $.lang( nestedObj1 ).merge(nestedObj2).value();
            expect( nested ).same({
                a: {
                    b: 2,
                    c: 1
                }
            });

            a = {
                a: 1,
                b: 2,
                c: 3
            };
            expect(  $.lang(a).without("a").value() ).same({
                b:2,
                c:3
            });
        }
       
    });
});
//2012.4.29
//将原lang与lang_fix的测试全部合在一起，增加Date, isArray, map, filter等测试
//更新isArray取得iframe中的Array的逻辑，原xArray = window.frames[window.frames.length-1].Array; 是取不到数组的
