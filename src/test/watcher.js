$.define("watcher","more/spec,more/watcher",function(s, watcher){
    $.fixture('监听者模块', {
        "watch unwatch": function(id){
            var hash = {
                test:"mmm"
            }
            watcher.watch(hash, "test", function(prop, old, neo){
                expect(prop, id ).eq( "test" )
                expect(old, id ).eq( "mmm" )
                expect(neo, id ).eq( "nnn" )
                $.log("hash." + prop + " changed from " + old + " to " + neo);
            });

            setInterval(function(){
                hash.test = "nnn"
                delete hash.test
            },390)
        }
    })
});
