define("mass",["more/spec"],function(){
    $.log("已加载test/mass模块",7)
    $.isWindow = function(obj){//单独提出来，专门用于测试对window的判定
        return $.type(obj,"Window")
    };
    $.fixture('模块加载模块-mass', {
        type: function() {
            expect( $.type("string")).eq("String");
            expect( $.type(1)).eq("Number");
            expect( $.type(!1)).eq("Boolean");
            expect( $.type(NaN)).eq("NaN");
            expect( $.type(/test/i)).eq("RegExp");
            expect( $.type($.noop)).eq("Function");
            expect( $.type(null)).eq("Null");
            expect( $.type({})).eq("Object");
            expect( $.type([])).eq("Array");
            expect( $.type(new Date)).eq("Date");
            expect( $.type(window)).eq("Window");
            expect( $.type(document)).eq("Document");
            expect( $.type(document.documentElement)).eq("HTML");
            expect( $.type(document.body)).eq("BODY");
            expect( $.type(document.childNodes)).eq("NodeList");
            expect( $.type(document.getElementsByTagName("*"))).eq("NodeList");
            expect( $.type(arguments)).eq("Arguments");
            expect( $.type(1,"Number")).eq(true);
        },

        isWindow: function(){
            var test1 = {};
            test1.window = test1;
            test1.document = document;
            //创建一个对象,拥有环引用的window与document;
            expect( $.isWindow(test1)).ng();
            var test2 = {};
            test2.window = window;
            test2.document = document;
            //创建一个对象,拥有window与document;
            expect( $.isWindow(test2)).ng();
            //测试真正的window对象
            expect( $.isWindow(window)).ok();
            var iframe = document.createElement("iframe");
            document.body.appendChild(iframe);
            var iwin = iframe.contentWindow || iframe.contentDocument.parentWindow;
            //检测iframe的window对象
            expect( $.isWindow(iwin)).ok();
            document.body.removeChild(iframe);

        },

        oneObject: function(){
            //测试默认值
            expect( $.oneObject("aa,bb,cc")).same({
                "aa": 1,
                "bb": 1,
                "cc": 1
            });
            //测试第二个参数
            expect( $.oneObject([1,2,3],false)).same({
                "1": false,
                "2": false,
                "3": false
            });
        },
        getUid: function(){
            //$.getUid在正常情况下返回数字
            expect( typeof $.getUid(document.body) ).eq("number");
        },

        "slice,用于数组化": function(){
            var a = [1,2,3,4,5,6,7]
            expect( $.slice(a, 0) ).same( a.slice(0) );
            expect( $.slice(a, 1, 4) ).same( a.slice( 1, 4) );
            expect( $.slice(a, -1) ).same( a.slice(-1) );
            expect( $.slice(a, 1, -2) ).same( a.slice(1, -2) );
            expect( $.slice(a, 1, NaN) ).same( a.slice(1, NaN) );
            expect( $.slice(a, 1, 2.1) ).same( a.slice(1, 2.1) );
            expect( $.slice(a, 1.1, 4) ).same( a.slice(1.1, 4) );
            expect( $.slice(a, 1.2, NaN) ).same( a.slice(1, NaN) );
            expect( $.slice(a, NaN) ).same( a.slice(NaN) );
            expect( $.slice(a, 1.3, 3.1) ).same( a.slice(1.3, 3.1) );
            expect( $.slice(a, 2, "XXX") ).same( a.slice( 2, "XXX") );
            expect( $.slice(a, -2) ).same( a.slice( -2) );
            expect( $.slice(a, 1, 9) ).same( a.slice( 1, 9) );
            expect( $.slice(a, 20, -21) ).same( a.slice( 20, -21) );
            expect( $.slice(a, -1, null) ).same( a.slice( -1, null) );
        },
        "config, 用于配置": function(){
            $.config({
                level:0
            });
            expect( $.core.level ).eq( 0 );
            //alias是用于对模块别名，方便移到文件后，其他模块也能访问到它
            $.config({
                level:9,
                alias:{
                    $xxx: "/aaa/ddd.js"
                }
            });
            expect( $.core.alias.$xxx ).eq( "/aaa/ddd.js" );
        },
        "mix,对象合并": function(){
            var a = {
                cc:"cc"
            };
            a.mix = $.mix;
            //测试只有一个参数的情况
            expect( a.mix({
                aa:"aa",
                bb:"bb"
            })).same({
                aa:"aa",
                bb:"bb"
            });
            //测试不覆写的情况
            expect( a.mix({
                aa:"aa",
                cc:"44"
            },false)).same({
                aa:"aa",
                bb:"bb",
                cc:"cc"
            })
        }
    });
});
//2012.4.28,增加slice, mix, getUid的测试



