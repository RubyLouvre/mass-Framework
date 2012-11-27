define(["./aaa","./bbb","./ccc","./fff"],function(a,b,c,f){
    $.log("已加载ddd模块", 7);
    return {
        ddd: "ddd",
        length: arguments.length
    }
})

