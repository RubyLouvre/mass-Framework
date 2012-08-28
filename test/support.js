
$.define("support","more/spec,support",function(){
    $.fixture('特征嗅探模块-support', {
        '$.support': function() {
            var el = document.getElementById("mass-spec-case-$-support");
            var html = ""
            for(var i in $.support){
                html += "<p>"+i+" : "+$.support[i]+"</p>"
            }
            el.getElementsByTagName("pre")[0].innerHTML = html;
        }
    });
});
