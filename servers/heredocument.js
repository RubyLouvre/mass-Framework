mass.define("heredocument",function(){
    //http://stackoverflow.com/questions/805107/multiline-strings-in-javascript
    //只允许最前面出现一个 "\*" ,只允许最后面出现一个 "*／" 
    mass.hereDoc = function(fn) {
        return fn.toString().
        replace(/^[^\/]+\/\*!?/, '').
        replace(/\*\/[^\/]+$/, '');
    }
})
