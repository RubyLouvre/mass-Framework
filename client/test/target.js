$.define("target","more/spec,target",function(){
    $.fixture("事件派发器模块-target", {
        "$.target":function(){
            var a  = $.a = {};
            $.mix(a, $.target);
            var repeat = function(e){
                expect(e.type).eq("repeat")
            }
            a.bind("repeat",repeat)
            a.bind("repeat",repeat);
            a.bind("repeat",repeat);
            a.fire("repeat");
            a.bind("data",function(e){
                expect(e.type).eq("data")
            });
            a.bind("data",function(e){
                expect( typeof(a.uniqueNumber) ).eq("number")
                expect( e.target ).eq(a)
            });
            a.fire("data",3,5);
            delete $.a;
        }
    })
})


