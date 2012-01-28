$.define("tsupport","more/spec,support",function(){
    $.fixture('特征嗅探模块-support', {
        '$.support': function() {
            for(var i in $.support){
                expect($.support[i]).log(i);
            }
        }
    });
});
