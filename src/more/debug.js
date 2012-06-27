$.define("debug", function(){
    var rdebug =  /^(init|constructor|lang|query)$|^is|^[A-Z]/;
    function debug(obj, name, module, p){
        var fn = obj[name];
        if( obj.hasOwnProperty(name) && typeof fn == "function" && !fn["@debug"]){
            if( rdebug.test( name )){
                fn["@debug"] = name;
            }else{
                var method = obj[name] = function(){
                    try{
                        return  method["@debug"].apply(this,arguments)
                    }catch(e){
                        $.log( module+"'s "+(p? "$.fn." :"$.")+name+" method error "+e);
                        throw e;
                    }
                }
                for(var i in fn){
                    method[i] = fn[i];
                }
                method["@debug"] = fn;
                method.toString = function(){
                    return fn.toString()
                }
                method.valueOf = function(){
                    return fn.valueOf();
                }
            }
        }
    }
    $.debug = function(name){
        if(!$["@debug"])
            return
        for( var i in $){
            debug($, i, name);
        }
        for( i in $.prototype){
            debug($.prototype, i, name,1);
        }
    }

})
