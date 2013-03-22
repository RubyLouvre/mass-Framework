
define("storage",["mass"],function( $ ){
    var host = $.removeStorage, html = $.html
    if(!host.Storage && html.addBehavior ){
        html.addBehavior('#default#userData');
        html.save("massdata");
        //https://github.com/marcuswestin/store.js/issues/40#issuecomment-4617842
        //在IE67它对键名非常严格,不能有特殊字符,否则抛throwed an This name may not contain the '~' character: _key-->~<--
        var rstoragekey = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g");
        function curry(fn) {
            return function(a, b) {
                html.load("massdata");
                a = String(a).replace(rstoragekey, function(w){
                    return w.charCodeAt(0);
                });
                var result = fn( a, b );
                html.save("massdata");
                return result
            }
        }
        host.Storage = {
            setItem : curry(function(key, val){
                html.setAttribute(key, val);
            }),
            getItem: curry(function(key){
                return html.getAttribute(key);
            }),
            removeItem: curry(function(key){
                html.removeAttribute(key);
            }),
            clear: function(){
                var attributes = html.XMLDocument.documentElement.attributes
                for (var i=0, attr; attr=attributes[i]; i++) {
                    html.removeAttribute(attr.name)
                }
            }
        }
    }
    return $;

})