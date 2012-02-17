var fs = require("fs")
function getAllFiles(root) {
    var result = [], files = fs.readdirSync(root)
    files.forEach(function(file) {
        var pathname = root+ "/" + file
        , stat = fs.lstatSync(pathname)
        if (stat === undefined) return
 
        // �����ļ��о����ļ�
        if (!stat.isDirectory()) {
            result.push(pathname)
        // �ݹ�����
        } else {
            result = result.concat(getAllFiles(pathname))
        }
    });
    return result
}
var arr = getAllFiles("doc")
arr.forEach(function(name){
    console.log(name);
    // var neo = name.replace("/array.","$.Array.")
    fs.renameSync(name, name.replace("object.","$.Object."))
//  fs.readFile(name,function(e,fd){
//     var text = ( fd+"").replace('<!doctype html>\n<!DOCTYPE html>',"<!DOCTYPE html>");
//     fs.writeFile(name,text, function(e){
//     })
//  })

})
