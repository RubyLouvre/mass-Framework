define(["$spec","$support"],function(){
    $.log("已加载/test/support模块")
    describe('support', {
        '$.support': function() {
            var el = document.getElementById("mass-spec-case-$-support");
            var html = ""
            for(var i in $.support){
                html += "<li>"+i+" : "+$.support[i]+"</li>"
            }
            el.getElementsByTagName("ol")[0] .innerHTML = html;
        }
    });
});
