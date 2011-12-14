dom.define("test/dom","more/spec",function(){
    dom.isWindow = function(obj){//单独提出来，专门用于测试对window的判定
        return dom.type(obj,"Window")
    };
    dom.addTestModule('模块加载模块-dom', {
        'type': function() {
            expect(dom.type("string")).eq("String");
            expect(dom.type(1)).eq("Number");
            expect(dom.type(!1)).eq("Boolean");
            expect(dom.type(NaN)).eq("NaN");
            expect(dom.type(/test/i)).eq("RegExp");
            expect(dom.type(dom.noop)).eq("Function");
            expect(dom.type(null)).eq("Null");
            expect(dom.type({})).eq("Object");
            expect(dom.type([])).eq("Array");
            expect(dom.type(new Date)).eq("Date");
            expect(dom.type(window)).eq("Window");
            expect(dom.type(document)).eq("Document");
            expect(dom.type(document.documentElement)).eq("HTML");
            expect(dom.type(document.body)).eq("BODY");
            expect(dom.type(document.childNodes)).eq("NodeList");
            expect(dom.type(document.getElementsByTagName("*"))).eq("NodeList");
            expect(dom.type(arguments)).eq("Arguments");
            expect(dom.type(1,"Number")).eq(true);
        },
        "isWindow" : function(){
            var test1 = {};
            test1.window = test1;
            test1.document = document;
            expect(dom.isWindow(test1)).ng();
            var test2 = {};
            test2.window = window;
            test2.document = document;
            expect(dom.isWindow(test1)).ng();
            expect(dom.isWindow(window)).ok();
            var iframe = document.createElement("iframe");
            document.body.appendChild(iframe);
            var iwin = iframe.contentWindow || iframe.contentDocument.parentWindow;
            expect(dom.isWindow(iwin)).ok();
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
            expect(dom.isWindow(wg)).ng();//false
        },

        "oneObject":function(){
            expect(dom.oneObject("aa,bb,cc")).same({
                "aa":1,
                "bb":1,
                "cc":1
            });
            expect(dom.oneObject([1,2,3],false)).same({
                "1":false,
                "2":false,
                "3":false
            });
        }
    });
});




