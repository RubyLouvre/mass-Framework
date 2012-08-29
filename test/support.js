define(["$spec","$support"],function(){
    $.log("已加载/test/support模块")
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
