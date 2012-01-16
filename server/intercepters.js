mass.define("intercepters", (mass.settings.intercepters || []).map(function(str){
    return "intercepters/"+str
}).join(","), function(){
    console.log("取得一系列栏截器");
    return [].slice.call(arguments,0)
});
