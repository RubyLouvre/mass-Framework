 /*document.onclick = function () {
            var img = new Image;
            document.body.appendChild(img);
            img.src="//www.a.com/images/a.png";
            alert(img.complete)
            //CollectGarbage();
}

IE7+,opera  如果src是一个静态不变的地址.则 不会再发起请求(无视http缓存相关头域).而直去取缓存文件 。 而且是完全不走network 模块的那种.  所以甚至httpWatch也不会抓到 cache 的项.
因为该img 会被保存在内存中. 即使 没有 img句柄,而直接是一个 new Image().src=xxx  也是如此.  并且 无论a.png 是否强制缓存.http头指定该资源不缓存,亦如此. 这也是为什么IE6有另外某个必须保持new Image句柄的原因.因为IE6 和 IE7+对new Image的策略完全不同， IE6是不会在内存中保持new Image对象的.而 IE7+会在内存中缓存该对象. 并已url作为索引.opera12-也是如此.

所以,如果是借助new Image 上报，即使image资源的http 相关缓存头,配置正确(no-cache,no-store,expires过期).在IE7+和Opera12-中，也应该使用随机数.来绕过浏览器 内存缓存new Image的坑.



而ie6 , 一个简单的 new Image().src=xxx 的上报. 会可能在GC时abort 掉这个请求.(此问题其他浏览器，IE7+都不存在.)

即使是
var img = new Image();
img.src= xxx 也如此

解决办法:
var log = function(){
     var list = [];
     return function(src){
               var index = list.push(new Image) -1;
     list[index].onload = function(){
          list[index] = list[index].onload = null;
     }
     list[index ].src = src;
     }
}();

但是要注意的问题是: 0 content length or not image mimeTypes . 不会触发onload.  也就是说，上面的代码.有可能不会及时回收资源.这取决于上报的服务器的配置了.




这里就是我要说的和image对象有关的 一些相关坑 和历史原因
实际上ie7采用了新策略 来处理image对象， 也许是为了 解决ie6的那个  gc导致aborted的bug*/
 var win = this,hasOwn = Object.prototype.hasOwnProperty;
 function sendLog(url,opt_data){
     var data = opt_data || {};
     var img = new Image;
     var id = "log"+(new Date);
     var query = ['_='+(+new Date)];
     for(var key in data){
         if(hasOwn.call(data,key)){
             query.push(encodeURIComponent(key) + "="+ encodeURIComponent(data[key]))
         }
     }
     win[id] = img;
     img.onload = img.onerror = img.onabort = function(){
         img.onload = img.onerror = img.onabort = null;
         try{
             delete win[id];
         }catch(e){
             win[id] = void 0
         }
         
     }
     img.src = url + (url.indexOf("?") >= 0 ? "&" : "?")+ query.join("&")


}