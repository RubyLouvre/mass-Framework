define(["$spec"], function() {
    $.log("已加载test/mass模块", 7)
    $.isWindow = function(obj) { //单独提出来，专门用于测试对window的判定
        return $.type(obj, "Window")
    };
    describe('mass', {
        type: function() {
            expect($.type("string")).eq("String", "取字符串的类型");
            expect($.type(1)).eq("Number", "取数字的类型");
            expect($.type(!1)).eq("Boolean", "取布尔的类型");
            expect($.type(NaN)).eq("NaN", "取NaN的类型");
            expect($.type(/test/i)).eq("RegExp", "取正则的类型");
            expect($.type($.noop)).eq("Function", "取函数的类型");
            expect($.type(null)).eq("Null", "取null的类型");
            expect($.type({})).eq("Object", "取对象的类型");
            expect($.type([])).eq("Array", "取数组的类型");
            expect($.type(new Date)).eq("Date", "取日期的类型");
            expect($.type(window)).eq("Window", "取window的类型");
            expect($.type(document)).eq("Document", "取document的类型");
            expect($.type(document.documentElement)).eq("HTML", "取HTML节点的类型");
            expect($.type(document.body)).eq("BODY", "取BODY节点的类型");
            expect($.type(document.childNodes)).eq("NodeList", "取节点集合的类型");
            expect($.type(document.getElementsByTagName("*"))).eq("NodeList", "取节点集合的类型");
            expect($.type(arguments)).eq("Arguments", "取参数对象的类型");
            expect($.type(1, "Number")).eq(true, "测试$.type的第二个参数");
        },

        isWindow: function() {
            //不要使用ok, ng
            var test1 = {};
            test1.window = test1;
            test1.document = document;
            //创建一个对象,拥有环引用的window与document;
            expect($.isWindow(test1)).eq(false, "一个拥有指向自身的window属性与document属性的原生对象不能通过测试");
            var test2 = {};
            test2.window = window;
            test2.document = document;
            //创建一个对象,拥有window与document;
            expect($.isWindow(test2)).eq(false,"一个拥有原生window与document引用的原生对象不能通过测试");
            //测试真正的window对象
            expect($.isWindow(window)).eq(true,"当前window对象当然返回true");
            var iframe = document.createElement("iframe");
            document.body.appendChild(iframe);
            var iwin = iframe.contentWindow || iframe.contentDocument.parentWindow;
            //检测iframe的window对象
            expect($.isWindow(iwin)).eq(true,"一个iframe中的window能通过测试");
            document.body.removeChild(iframe);

        },

        oneObject: function() {

            expect($.oneObject("aa,bb,cc")).same({
                "aa": 1,
                "bb": 1,
                "cc": 1
            }, "测试默认值");

            expect($.oneObject([1, 2, 3], false)).same({
                "1": false,
                "2": false,
                "3": false
            }, "测试第二个参数");
        },

        getUid: function() {
            expect($.getUid(document.body)).type("Number","$.getUid总会返回数字");
        },

        slice: function() {
            var a = [1, 2, 3, 4, 5, 6, 7];
            expect($.slice(a, 0)).same(a.slice(0), "$.slice(a, 0)");
            expect($.slice(a, 1, 4)).same(a.slice(1, 4), "$.slice(a, 1, 4)");
            expect($.slice(a, -1)).same(a.slice(-1), "$.slice(a, -1)");
            expect($.slice(a, 1, -2)).same(a.slice(1, -2), "$.slice(a, 1, -2)");
            expect($.slice(a, 1, NaN)).same(a.slice(1, NaN), "$.slice(a, 1, NaN)");
            expect($.slice(a, 1, 2.1)).same(a.slice(1, 2.1), "$.slice(a, 1, 2.1)");
            expect($.slice(a, 1.1, 4)).same(a.slice(1.1, 4), "$.slice(a, 1.1, 4)");
            expect($.slice(a, 1.2, NaN)).same(a.slice(1, NaN), "$.slice(a, 1.2, NaN)");
            expect($.slice(a, NaN)).same(a.slice(NaN), "$.slice(a, NaN)");
            expect($.slice(a, 1.3, 3.1)).same(a.slice(1.3, 3.1), "$.slice(a, 1.3, 3.1)");
            expect($.slice(a, 2, "XXX")).same(a.slice(2, "XXX"), '$.slice(a, 2, "XXX")');
            expect($.slice(a, -2)).same(a.slice(-2), '$.slice(a, -2)');
            expect($.slice(a, 1, 9)).same(a.slice(1, 9), "$.slice(a, 1, 9)");
            expect($.slice(a, 20, -21)).same(a.slice(20, -21), "$.slice(a, 20, -21)");
            expect($.slice(a, -1, null)).same(a.slice(-1, null), "$.slice(a, -1, null)");
        },

        config: function() {
            $.config({
                level: 0
            });
            expect($.config.level).eq(0,"应该返回零");
            //alias是用于对模块别名，方便移到文件后，其他模块也能访问到它
            $.config({
                level: 9,
                alias: {
                    $xxx: "/aaa/ddd.js"
                }
            });
            expect($.config.alias.$xxx).eq("/aaa/ddd.js","测试模块标识转URL");
        },
        mix: function() {
            var a = {
                cc: "cc"
            };
            a.mix = $.mix;

            var d = $.mix({
                test:"test"
            },{
                second:"second"
            }, {
                third: "third"
            })
            expect(d).same({
                test:"test",
                second:"second" ,
                third:"third"
            }, "测试同时合并多个对象");

            expect(a.mix({
                aa: "aa",
                bb: "bb"
            })).same({
                aa: "aa",
                bb: "bb"
            }, "测试只有一个参数的情况");

            expect(a.mix({
                aa: "aa",
                cc: "44"
            }, false)).same({
                aa: "aa",
                bb: "bb",
                cc: "cc"
            }, "测试不覆写的情况")
        }
    });

});
//2012.4.28,增加slice, mix, getUid的测试