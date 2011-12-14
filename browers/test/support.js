dom.define("test/support","more/spec,support",function(){
    dom.addTestModule('特征嗅探模块-support', {
        'dom.support': function() {
            for(var i in dom.support){
                expect(dom.support[i]).log(i);
            }
        }
    });
});
