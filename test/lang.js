define(["$lang"], function(  ) {
    $.log("已加载text/lang模块");

    describe("lang", {
        "Object.keys": function() {
            expect(Object.keys({
                aa: 1,
                bb: 2,
                cc: 3
            })).same(["aa", "bb", "cc"], "返回包含三个元素的数组");
            //测试特殊属性
            var array = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(","), testobj = {}
            for (var i = 0, el; el = array[i++]; ) {
                testobj[el] = i;
            }
            ;
            expect(Object.keys(testobj)).same(array, "测试IE下不能遍历的对象原型属性");
        },
        map: function() {
            var ret = [1, 2, 3, 4].map(function(a, b) {
                return a + b;
            });
            expect(ret).same([1, 3, 5, 7], "[1, 3, 5, 7]");
        },
        filter: function() {
            var ret = [1, 2, 3, 4, 5, 6, 7, 8].filter(function(a, b) {
                return a > 4
            });
            expect(ret).same([5, 6, 7, 8], "[5, 6, 7, 8]");
            var even = $.filter([0, 1, 2, 3, 4, 5], function(el) {
                return el % 2 === 0;
            })
            expect(even).same([0, 2, 4], "[0,2,4]");
        },
        reduce: function() {
            var ret = [1, 2, 3, 4].reduce(function(a, b) {
                return a + b;
            }, 10);
            expect(ret).eq(20, "[1, 2, 3, 4] reduce to 10");
        },
        reduceRight: function() {
            var flattened = [[0, 1], [2, 3], [4, 5]].reduceRight(function(a, b) {
                return a.concat(b);
            }, []);
            expect(flattened).same([4, 5, 2, 3, 0, 1], "[4, 5, 2, 3, 0, 1]");
        },
        some: function() {
            function isBigEnough(element, index, array) {
                return (element >= 10);
            }
            var passed = [2, 5, 8, 1, 4].some(isBigEnough);
            expect(passed).eq(false, "return false");
            passed = [12, 5, 8, 1, 4].some(isBigEnough);
            expect(passed).eq(true, "return true");
        },
        every: function() {
            function isBigEnough(element, index, array) {
                return (element >= 10);
            }
            var passed = [12, 5, 8, 130, 44].every(isBigEnough);
            expect(passed).eq(false, "return false");
            passed = [12, 54, 18, 130, 44].every(isBigEnough);
            expect(passed).eq(true, "return true");
        },
        "Array.isArray": function() {
            var iframe = document.createElement('iframe');
            iframe.style.display = "none";
            document.body.appendChild(iframe);
            var d = iframe.contentDocument || iframe.contentWindow.document;
            d.write("<!doctype html><body><script>top.xArray = Array<\/script>")
            d.close();
            var xArray = window.xArray
            var arr = new xArray(1, 2, 3); // [1,2,3]
            expect($.isArray(arr)).eq(true, "iframe中的Array也返回true");
            expect($.isArray([])).eq(true, "当前window的Array当然返回true");
            document.body.removeChild(iframe);
            expect($.isArray(function test(a, b, c) {
            })).eq(false, "函数返回false")
            expect($.isArray(/test/)).eq(false, "正则返回false")
            expect($.isArray("test")).eq(false, "字符串返回false")
            expect($.isArray(window)).eq(false, "window返回false")
            expect($.isArray({
                0: 0,
                1: 1,
                2: 2,
                length: 3,
                sort: function() {
                }
            })).eq(false, "伪装的对象返回false")
        },
        trim: function() {
            expect("  test  ".trim()).eq("test", "去掉两边空白");
            expect("ipad\xA0".trim()).eq("ipad", "nbsp should be trimmed");
        },
        Date: function() {
            expect(/^\d+$/.test(Date.now())).eq(true, "时间戮必须是纯数字");
            var date = new Date("2012/4/29");
            expect(date.getYear()).eq(112, "getYear是从1900算起");
            date.setYear(2014);
            expect(date.getYear()).eq(114, "getYear是从1900算起");
        },
        "$.isPlainObject": function() {
            //不能DOM, BOM与自定义"类"的实例
            expect($.isPlainObject([])).ng();
            expect($.isPlainObject(1)).ng();
            expect($.isPlainObject(null)).ng();
            expect($.isPlainObject(void 0)).ng();
            expect($.isPlainObject(window)).ng();
            expect($.isPlainObject(document.body)).ng();
            expect(window.location).log();
            expect($.isPlainObject(window.location)).ng();
            var fn = function() {
            }
            expect($.isPlainObject(fn)).ng();
            fn.prototype = {
                someMethod: function() {
                }
            };
            expect($.isPlainObject(new fn)).ng();
            expect($.isPlainObject({})).ok();
            expect($.isPlainObject({
                aa: "aa",
                bb: "bb",
                cc: "cc"
            })).ok();
            expect($.isPlainObject(new Object)).ok();
        },
        "$.isArrayLike": function() {
            //函数,正则,元素,节点,文档,window等对象为非
            expect($.isArrayLike(function() {
            })).ng();
            expect($.isArrayLike(document.createElement("select"))).ng();
            expect($.isArrayLike(document)).ng();
            expect($.isArrayLike(window)).ng();
            //用于下面的对arguments的判定
            expect($.type(arguments)).eq("Arguments", "判定Arguments类型");
            expect(isFinite(arguments.length)).eq(true, "Arguments.length")
            expect($.isArrayLike(arguments)).eq(true, "Arguments为类数组");
            expect($.isArrayLike(document.links)).eq(true, "document.links为类数组");
            expect($.isArrayLike(document.documentElement.childNodes)).eq(true, "html标签的子节点为类数组");
            //自定义对象必须有length,并且为非负正数
            expect($.isArrayLike({
                0: "a",
                1: "b",
                length: 2
            })).eq(true, "拥有length属性的自定义对象为类数组");


        },
        "$.isNative": function() {

            expect($.isNative("slice", Array.prototype)).ok();
            expect($.isNative("indexOf", Array.prototype)).log();
            expect($.isNative("forEach", Array.prototype)).log();
            expect($.isNative("quote", String.prototype)).log();
            expect($.isNative("trim", String.prototype)).log();
            expect($.isNative("getPrototypeOf", Object)).log();
            expect($.isNative("bind", Function.prototype)).log();
        },
        "$.range": function() {
            expect($.range(10)).same([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            expect($.range(1, 11)).same([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            expect($.range(0, 30, 5)).same([0, 5, 10, 15, 20, 25]);
            expect($.range(0, -10, -1)).same([0, -1, -2, -3, -4, -5, -6, -7, -8, -9]);
            expect($.range(0)).same([]);
        },
        "$.format": function() {

            expect($.format("pi is #{0}", Math.PI)).eq("pi is 3.141592653589793");

            var ret = $.format("style.#{name}=((isEnd ? #{end} : adapter.#{type}( #{from}, #{change},'#{easing}',per ))|0)+'#{unit}';", {
                name: "width",
                end: "0",
                type: "_default",
                from: "200",
                change: "200",
                easing: "linear",
                unit: "px"
            });

            expect(ret).eq("style.width=((isEnd ? 0 : adapter._default( 200, 200,'linear',per ))|0)+'px';");

        },
        "$.parseXML": function() {
            var str = "<note><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don't forget me this weekend!</body></note>"
            expect($.parseXML(str).nodeType).eq(9, "应该返回一个文档对象")//[object XMLDocument]
        },
        "$.String": function() {
            expect($.String.contains("aaabbbcc", "bbb")).ok();
            expect($.String.startsWith('http://index', 'http')).ok();
            expect($.String.endsWith('image.gif', '.gif')).ok();
            expect($.String.endsWith('image.gif', '.GIF')).ng();
            expect($.String.byteLen('司徒正美')).eq(8);
            expect($.String.truncate("this is a test test", 10)).eq("this is...");
            expect($.String.camelize("foo-bar")).eq("fooBar");
            expect($.String.capitalize("boo boo boo")).eq("Boo boo boo");
            expect($.String.underscored("fooBar")).eq("foo_bar");
            expect($.String.underscored("foo-bar")).eq("foo_bar");
            expect($.String.capitalize("foo-bar")).eq("Foo-bar");
            expect($.String.escapeRegExp("animals.sheep[1]")).eq("animals\\.sheep\\[1\\]");
            expect($.String.pad(2, 4, "0", 1)).eq("2000");
            expect($.String.pad(2, 4, " ")).eq("   2");
            expect($.String.repeat("ruby", 2)).eq("rubyruby");
        },
        "$.String.escapeHTML": function() {
            expect($.String.escapeHTML("<")).eq("&lt;");
            expect($.String.escapeHTML(">")).eq("&gt;");
            expect($.String.escapeHTML("&")).eq("&amp;");
            expect($.String.escapeHTML('"')).eq("&quot;");
        },
        "$.String.stripTags": function() {
            expect($.String.stripTags("a<strong>ru<b>b</b>y</strong>ee")).eq("arubyee");
        },
        "$.Array": function() {
            var a = ["aaa", 1, 2, undefined, 3, 4, null, {
                    2: 2
                }];
            //复制一个副本
            var b = $.Array.clone(a)
            expect(a).same(b);
            expect(a).not(b);
            expect($.Array.contains(a, 2)).ok();
            expect($.Array.diff(a, [1, 2, 3])).same(["aaa", undefined, 4, null, {
                    2: 2
                }]);
            expect($.Array.remove(b, 1)).eq(true);
            expect($.Array.removeAt(b, 1)).eq(true);
            expect($.Array.shuffle(a)).log();
            expect($.Array.random(a)).log();
            expect($.Array.compact(a).length).eq(6);
            expect($.Array.union(a, [3, 4, 5]).sort()).same([
                1,
                2,
                3,
                4,
                5,
                {
                    "2": 2
                },
                "aaa",
                null,
                undefined]);
            var c = [3, 4, 6, 1, 45, 9, 5, 3, 4, 22, 3];
            expect($.Array.min(c)).eq(1);
            expect($.Array.max(c)).eq(45);
            expect($.Array.unique(c)).same([6, 1, 45, 9, 5, 4, 22, 3]);
            expect($.Array.unique([1, 2, 1, 3, 1, 4])).same([2, 3, 1, 4]);
            //测试平坦化
            var d = ['frank', ['bob', 'lisa'], ['jill', ['tom', 'sally']]];
            expect($.Array.flatten(d)).same(['frank', 'bob', 'lisa', 'jill', 'tom', 'sally']);

            var e = ['hello', 'world', 'this', 'is', 'nice'];
            expect($.Array.pluck(e, "length")).same([5, 5, 4, 2, 4]);
            expect($.Array.sortBy(e, function(s) {
                return s.length;
            })).same(["is", "this", "nice", "hello", "world"]);

            expect($.Array.diff([0, 1, 2, 9], [0, 5, 2])).same([1, 9]);

            var h = $.Array.union([1, 2, 3], [2, 3, 4, 5, 6]);//取并集
            expect(h).same([1, 2, 3, 4, 5, 6]);
            var j = $.Array.intersect([1, 2, 3, "a"], [1, "a", 2]);//取交集
            expect(j).same([1, 2, "a"]);

        },
        "$.String.wbr": function() {
            expect($.String.wbr("abcd")).eq("a<wbr>b<wbr>c<wbr>d<wbr>")
        },
        "$.Number": function() {
            expect($.Number.round(4.444, 1)).eq(4.4);
            expect($.Number.round(4.444, 2)).eq(4.44);
            expect($.Number.round(4.444, 3)).eq(4.444);
            expect($.Number.limit(7, 3, 5)).eq(5);
            expect($.Number.limit(4, 3, 5)).eq(4);
            expect($.Number.nearer(4, 3, 9)).eq(3);
            expect($.Number.nearer(454, -4543, 6576)).eq(-4543);
        },
        "$.Object": function() {

            var a = {
                a: "one",
                b: "two",
                c: "three"
            };
            expect($.Object.subset(a, ["a", "c"])).same({
                a: 'one',
                c: 'three'
            });
            a = {
                first: 'Sunday',
                second: 'Monday',
                third: 'Tuesday'
            };
            var b = [];
            $.Object.forEach(a, function(value) {
                b.push(value);
            });
            expect(b).same(["Sunday", "Monday", "Tuesday"]);
            a = {
                e: 1,
                b: "aaa",
                c: [1, 2, 3],
                d: {
                    bb: "bb"
                }
            };

            expect($.Object.clone(a)).same(a);
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
            var merged = $.Object.merge(obj1, obj2, obj3);
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
            var nested = $.Object.merge(nestedObj1, nestedObj2);
            expect(nested).same({
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
            expect($.Object.without(a, "a")).same({
                b: 2,
                c: 3
            });
        }

    });
});
//2012.4.29
//将原lang与lang_fix的测试全部合在一起，增加Date, isArray, map, filter等测试
//更新isArray取得iframe中的Array的逻辑，原xArray = window.frames[window.frames.length-1].Array; 是取不到数组的
