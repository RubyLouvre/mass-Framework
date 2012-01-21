(function(){
    var safeFrag = document.createDocumentFragment();
    ("abbr article aside audio canvas datalist details figcaption figure footer " +
        "header hgroup mark meter nav output progress section summary time video"
        ).replace($.rword,function(tag){
        document.createElement(tag)
    });


    $.mix($,{
        exec:function(id){
            var tmpl = document.getElementById(id);
            window.eval( tmpl.text)
        },
        runCode : function(code){
            if (code!=""){
                var newwin = window.open('', "_blank", '');
                newwin.document.open('text/html', 'replace');
                newwin.opener = null;
                newwin.document.write(code);
                newwin.document.close();
            }
        }
    });
    if(self.eval !== top.eval){
       
//        $.require("ready,node,css",function(){
//            var iheight = $("article").height() | 0; //取得其高
//            if(iheight < 400)
//                iheight = 400;
            
            var iframe = parent.document.getElementById("iframe");
            iframe.style.height ="400px"
//            iframe.style.height = (iheight+ 24) + "px";
//
//        });
    }
})();