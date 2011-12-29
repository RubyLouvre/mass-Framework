mass.define("scaffolds_controller", function() {
    //免费赠送的手脚架控制器
    return {
        "index": function(req, res) {
            res.render("file", "public/index.html",{aaa:"这是动态生成的"})
        },
        dispatch: function(req, res) {
            res.render("json", {aaa:"这是动态生成的"})
        }
    }
});