mass.define("here_document","lang",function(){
    //http://stackoverflow.com/questions/805107/multiline-strings-in-javascript
    //只允许最前面出现一个 "\*" ,只允许最后面出现一个 "*／" 
    mass.hereDoc = function(f) {
        var str = f.toString().
        replace(/^[^\/]+\/\*!?/, '').
        replace(/\*\/[^\/]+$/, '');
        if(arguments.length > 1){
            arguments[0] = str;
            return mass.format.apply(mass,arguments)
        }
        return str
    }
})

