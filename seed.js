
var check = {}

require = function(name, callback){
    //name切割成多个模块名，然后转换为URL
    //for循环
    //这里会运行于iframe中
    var s = document.createElement("script")
    document.body.appendChild(s)
    s.src = name
    //for循环结束
    check[name] = callback //以后check[name]会对应一个对象
}
//这是执行回调
require.exec = function(factory, name, list){
  
  var ret = factory.apply(null, list || [])
  check[name](ret)
}
//这是模块用到define方法
define = function(name, callback, list){
    var str = "require.exec(" + callback.toString() +",'"+name +"')"
    var s = document.createElement("script")
    document.body.appendChild(s)
    s.text = str;
}


