
$.define("brower", function( ){
    //$.log("已加载brower模块");
    var ver = top.opera ? (opera.version().replace(/\d$/, "") - 0)
    : parseFloat((/(?:IE |fox\/|ome\/|ion\/)(\d+\.\d)/.
        exec(navigator.userAgent) || [,0])[1]);
    return {
        //测试是否为ie或内核为trident，是则取得其版本号
        ie: !!top.VBArray && Math.max(document.documentMode||0, ver),//内核trident
        //测试是否为firefox，是则取得其版本号
        firefox: !!top.crypto && ver,//内核Gecko
        //测试是否为opera，是则取得其版本号
        opera:  !!top.opera && ver,//内核 Presto 9.5为Kestrel 10为Carakan
        //测试是否为chrome，是则取得其版本号
        chrome: !! top.chrome &&  ver ,//内核V8
        //测试是否为safari，是则取得其版本号
        safari: /apple/i.test(navigator.vendor) && ver// 内核 WebCore
    }
});




