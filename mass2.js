var $ ={
    rword: /[^, ]+/g
}
var list = [], loading, _callback
var scripts = document.getElementsByTagName("script")
var script = scripts[scripts.length - 1];
var baseURL = script.url
function require(deps, callback, parent){
    var id = parent || "@cb"+ (new Date - 0),
    args = []
    parent = parent || baseURL;
    String(deps).replace($.rword, function(name){
        
        
        args.push( name+".js")
        list.push({
            url: name+".js",
            parent:  parent
        })
        
        
    });
    
    parent = parent || baseURL;
    _callback = callback;
    modules[id] = {
        url: id,
        factory: callback
    }
    if(! loading ){
     
        while( obj = list.shift()   ){
            if( !modules[ obj.url ]){
                modules[ obj.url ] = obj;
                loading = obj
                loadJS( )
                break;
            }
        }
    }
}
function loadJS(){
    var node = document.createElement("script");
    node.onload = function(){
        console.log("onload")
    }
    node.onerror = function(){
        loading = null;
        loadNext()
    }
    node.src = loading.url
    document.head.appendChild(node)
}
var modules = {}

function define(name, deps, factory){
    var args = Array.apply([],arguments);
    if(typeof args[0] == "string"){
        args.shift()
    }
    console.log("define")
    
    args.unshift( loading.url ); 
    if(typeof args[1] == "function"){
        [].splice.call( args, 1, 0, [] );
    }
    var obj = modules[loading.url] 
    obj.factory = factory
    obj.deps = args[1]

    loading = null;
    loadNext()
    _callback()
    
}

function loadNext(){
    var url =   list.shift()
}