$.define("test/icarus","more/spec,icarus",function(){
    $.addTestModule('Icarus选择器-icarus', {
        "CSS表达式的切割":function(){
            //http://www.w3.org/TR/selectors/
            var reg_split = /^(?:[-\w\*]|[^\x00-\xa0]|\\.)+|\.(?:[-\w*\.]|[^\x00-\xa0]|\\.)+|[#:](?:[-\w]|[^\x00-\xa0]|\\.)+(?:\([^\)]*\))?|\[[^\]]*\]|(?:\s*)([>+~,\s])(?:\s*)(?=\S)/
            function split(expr){
                var match, ret = []
                do{
                    match = expr.match(reg_split);
                    expr = RegExp.rightContext;
                    ret.push( match[1] || match[0]);
  
                }while(expr);
                return ret
            }
            function logger(expr){
               return expect(split(expr))
            }
            logger("h1.aaa").same(["h1",".aaa"]);  
            logger("h1, h2, h3").same(["h1",",","h2",",","h3"])
            logger("div > span").same(["div",">","span"])
            logger("div * p").same(["div"," ","*"," ","p"])
            logger("h1.opener + h2").same(["h1",".opener","+","h2"])
            logger("h1[title]").same(["h1","[title]"])
            logger("span[class=example]").same(["span","[class=example]"])
            logger('a[rel~="copyright"]').same(["a",'[rel~="copyright"]'])
            logger('a[href="http://www.w3.org/"]').same(["a",'[href="http://www.w3.org/"]'])
            logger('*[lang|="en"]').same(["*",'[lang|="en"]'])
            logger('div > p:first-child').same(["div",">","p",":first-child"])
            logger('a.external:visited').same(["a",".external",":visited"])
            logger('p:nth-child(4n+1)').same(["p",":nth-child(4n+1)"])
            logger('bar:nth-child(1n+0)').same(["bar",":nth-child(1n+0)"])
            logger('tr:nth-last-child(-n+2)').same(["tr",":nth-last-child(-n+2)"])
            logger('body > h2:nth-of-type(n+2):nth-last-of-type(n+2)').same(["body",">","h2",":nth-of-type(n+2)",":nth-last-of-type(n+2)"])
            logger('body > h2:not(:first-of-type):not(:last-of-type)').same(["body",">","h2",":not(:first-of-type)",":not(:last-of-type)"])
            logger('div ol>li p').same(["div"," ","ol",">","li"," ","p"])
            $.icarus("div > span.aaa#id")

             
        }
    })
})

