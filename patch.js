var fs = require("fs")
function getAllFiles(root) {
    var result = [], files = fs.readdirSync(root)
    files.forEach(function(file) {
        var pathname = root+ "/" + file
        , stat = fs.lstatSync(pathname)
        if (stat === undefined) return


        if (!stat.isDirectory()) {
            result.push(pathname)
        } else {
            result = result.concat(getAllFiles(pathname))
        }
    });
    return result
}
var arr = getAllFiles("src/doc"), rhtmljs = /.+(\.html|\.js)$/
arr.forEach(function(name){
    if(rhtmljs.test(name)){
        fs.readFile(name,function(e,fd){
            console.log(name)//accept
            var text = ( fd+"").replace(/rewind/g,'revert');
            fs.writeFile( name, text, function(e){  })
        })
    }



})
