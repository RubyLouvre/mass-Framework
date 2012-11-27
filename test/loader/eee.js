define(["./more/ggg"],function(ret){
    $.log("已加载eee模块",7)
    return {
        eee: "eee",
        aaa: ret.aaa,
        ggg: ret.ggg
    }
})