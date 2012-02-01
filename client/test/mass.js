$.define("mass","more/spec",function(){
    $.log("已加载text/mass模块")
    $.isWindow = function(obj){//单独提出来，专门用于测试对window的判定
        return $.type(obj,"Window")
    };
    $.fixture('模块加载模块-mass', {
        'type': function() {
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
        "isWindow" : function(){
            var test1 = {};
            test1.window = test1;
            test1.document = document;
            expect( $.isWindow(test1)).ng();
            var test2 = {};
            test2.window = window;
            test2.document = document;
            expect( $.isWindow(test1)).ng();
            expect( $.isWindow(window)).ok();
            var iframe = document.createElement("iframe");
            document.body.appendChild(iframe);
            var iwin = iframe.contentWindow || iframe.contentDocument.parentWindow;
            expect( $.isWindow(iwin)).ok();
            document.body.removeChild(iframe);
    
            var wg = {
                document : {}
            }, wgdoc = wg.document;
            wg.window = wg;
            wgdoc.createElement = function(){
                return wg;
            };
            wgdoc.getElementsByTagName = function(){
                return [wg];
            };
            wgdoc.parentWindow = wg;
            wg.insertBefore = function(){};
            wg.firstChild = wg.firstChild;
            wg.removeChild = function(){};
            expect( $.isWindow(wg)).ng();//false
        },
    
        "oneObject":function(){
            expect( $.oneObject("aa,bb,cc")).same({
                "aa": 1,
                "bb": 1,
                "cc": 1
            });
            expect( $.oneObject([1,2,3],false)).same({
                "1": false,
                "2": false,
                "3": false
            });
        }
    });
});




