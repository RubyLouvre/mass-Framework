$["@modules"]["@plugin_map"] = {
    state:2
}
$.define("plugin_map",function(){
    var obj = {}
    "placeholder,pagination,tabs,flip,menu".replace($.rword, function(method){
        obj[ "$.fn." + method ] = "plugin/$.fn."+ method +".html"
    });
    return obj
})

/*
 *
 http://guang.com/xihuan
  http://faxianla.com/
http://huaban.com/
http://www.meilishuo.com/goods
http://www.mogujie.com/shopping/
  http://chill.com/
http://pinterest.com/
 *
 **/