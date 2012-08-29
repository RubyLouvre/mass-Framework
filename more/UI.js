/* 
 * UI库参考
 * 
 */
http://soulwire.co.uk/coffeephysics/#
////http://www.ixueyun.com/community/thread-6248-1-1.html
//md5
http://cache.baidu.com/c?m=9d78d513d99c17a84fece4697c66c0111843f0662ba4da027ea4843e957328375017e1ac50540443939b733d47e90b4beb832b6f6d507be3cc94dd49d9b1852858d87a6d274b9141658244f0d64127c0249551e9b81990e0b66dcd&p=882a914e95921bbe06be9b79580d&user=baidu&fm=sc&query=md5%CB%E3%B7%A8%D4%AD%C0%ED&qid=b59010fe15fad8c5&p1=8
http://d.hatena.ne.jp/sutara_lumpur/20100718/1279420832
jquery.ajaxSuggest.js を公開しました。
//ge 
http://d.hatena.ne.jp/cyokodog/20091212/extable01
IvanK http://lib.ivank.net/index.php?p=download一个基于WEBGL的动画库
http://d.hatena.ne.jp/cyokodog/20101015/exchangeselect01

http://d.hatena.ne.jp/cyokodog/20101101/exresize01

http://d.hatena.ne.jp/cyokodog/20100530/exfitframe01
//jsonp
http://d.hatena.ne.jp/shinichitomita/20060825/1156504036

CSSReg
http://www.businessinfo.co.uk/labs/CSSReg/CSSReg.html
各种REG
http://hackvertor.co.uk/hvurl/2n

//各种瀑布流
 http://guang.com/xihuan
  http://faxianla.com/
http://huaban.com/
http://www.meilishuo.com/goods
http://www.mogujie.com/shopping/
  http://chill.com/
http://pinterest.com/

//iframe参考资料
https://github.com/cmlenz/jquery-iframe-transport/blob/master/jquery.iframe-transport.js

https://github.com/stevepofd/jquery-iframe-utils/blob/master/jquery.iframe-utils.js

https://github.com/house9/jquery-iframe-auto-height/blob/master/release/jquery.iframe-auto-height.plugin.1.5.0.js


Franky-上海(449666)  14:08:41
清除客户端缓存,参考代码: (IE only, Chrome,Safari,Opera会reload parent页.FF则不加载资源. ,so,推荐后面的兼容方案.虽然成本很高.)
        var re = true;
        var ifm = document.createElement('iframe');
        ifm.src='about:blank';
        document.body.appendChild(ifm);
        var doc = ifm.contentWindow.document;
        doc.open();
        doc.write('<script>if(parent.re){parent.re = false;location.reload(true);}else{document.write("<script type=text/c src=http://www.a.com/js/a.js><\\\/script>");}<\/script>');
        doc.close();
     IE方案,解决一个问题，带来了更多的问题:          . about:blank导致的window.onload无法触发问题.          . domain修改，引发的权限bug.          . javascript:document.write方式写入文档流,引发的一些列问题          . base target = _blank , 导致弹窗问题.          . loading 状态问题.

               兼容性方案: 实体页, stroage +  userdata ,存储开关变量,进行reload(true),并引入所有要清楚缓存的资源.为了避免脚本执行.可以使用下列技巧:
                    .<script type="text/cache" src="url"></script> (text/这里是随意的.我们是要故意让浏览器不认识.)
                    支持的浏览器: IE全系, Chrome7-,Safari4-

                    .  <object data="js/a.js" type="application/x-shockwave-flash"></object> (都支持. 缺点是不能用于处理,本身是swf,且非静默资源的情况,且有可能客户端提醒安装确实插件)
               实体页方案的缺点,显而易见.需要额外请求一次,甚至是两次的实体页资源.


                   基本就是这些
关于reload :


5.location.reload(true)
除了早期chrome外其他浏览器一律会去掉请求头中的与缓存有关的头. 或添加Cache-Control:no-cache.等等.即试图请求服务器端新文件.
而chrome 则仅仅是忽略Expires.而试图校验文件有效性. 即 与 Last-Modified 或 ETag有关的头都将保留.

6.location.reload(false)
ie ff,Chrome,等高版本 类似.忽略Expires.并在请求中添加Cache-Control: max-age=0.但试图校验服务器端是否更新了此文件.即与与 Last-Modified 或 ETag有关的头都将保留.
Safari5+ 虽然有Cache-Control: max-age=0, 但是这货刷新，永远都不会有Last-Modified 和 ETag.  即使你f5.而不是调用reload. 所以这货到底咋回事，我也不清楚...


总结 对于 safari4-,以及 opera12-(目前只出到这个版本) 浏览器来说  location.reload方法来说 .参数无意义. 因为他的头里总带着no-cache
而 chrome6-,则是总是带着no-cache:max-age=0. 而没有强刷新.

其实根本来说,对于reload true,false 来说，就对应,览器是否默认支持两种刷新方式,即 f5 和 Ctrl + f5,(除Chrome5-Chrome6,以外. 他们支持ctrl+f5,但reload不支持参数,行为同false) 就目前来说 Chrome7+, Safari5+  才支持两种刷新方式. 而IE,FF自古就支持.
不过Safari的普通刷新 会同时带有,Cache-Control : max-age= 0 和  Program : no-cache . 但最大的问题是,他似乎永远都不会在请求头中加入If-Modified-Since ,或 If-None-Match . 所以至少，我做了N多尝试. Safari都没有304的情况出现...

那么使用我们如果想用 reload方式 更新资源. 到底是true,还是false 参数开启更好呢?  显然我们至少要先确定，我们的反向代理 ,CDN 和其他负载均衡的反向代理(如,我们的net scaler). 是不是严格遵守http1.1协议.遇到 no-cache请求，就回源,还是依照自己的策略去回源.  目前就我了解，我们的CDN,和netscaler是回源的.  所以显然,true 带来的好处就是大多数浏览器,除了早期的 Chrome. ，我们在进行版本控制时, 完全可以击穿反向代理层面的所有缓存层.拿到最新版本.  那么显然:

从单个用户角度来看, reload true 是更适的方式.   但是，这样做的一个问题. 当所有的用户，都强制CDN 和其他反向代理, 以及其他缓存服务器,都回源的话. 原始服务器压力会剧增.

所以,综合考虑,我们应该采用reload false. 配合 手动清除反向代理们缓存的方式.来实现.
那么最后总结:
reload(false).受益的浏览器: IE全系, FF全系, Safari5+, Chrome全系. 会因为false,而受益的是opera12-...和 Safari4-...

var params = document.getElementsByTagName('param'),
objects=[],
html = document.body.innerHTML;

for(var i=0,el; el=params[i++];){
el.parentNode.__params = el.parentNode.__params || (objects.push(el.parentNode),[]);
el.parentNode.__params.push(el.outerHTML);
}

for(i=0; el=objects[i++];){
html = html.replace(trim(el.outerHTML), el.outerHTML.replace(/<\/object>$/i,'')+el.__params.join('')+'</object>');
}
return html;

checkURL = function (url) {//检查trackLog URL 是否超出限制. 如果超出则 返回 false.
        var len = url.length,
            serverLimit = 2048, //上报服务器允许的url长度
            ieLimit = Math.min(2083,serverLimit),
            otherBrowserMinLimit = 65536,//Firefox 65536 , Safari 80000, Opera 190000, Chrome ~= 20000000
            otherLimit = Math.min(serverLimit,otherBrowserMinLimit);
        if(!+'\v1' || window.XDomainRequest ){//ie
               return len <= ieLimit;
        }
        return len <= otherLimit;
    }
kb-929874  这个补丁出来之前
IE6 有个傻逼问题
就是
el.xxx = fn;

写上就废了
包括用setAttribute的方式设置的
所以也包含了 onxxx = fn 等方式


及时你在页面刷新前  onxxx = null  你认为断开了， 其实 IE6 仍然会泄露

只有attachEvent() detachEvent才能避免这个问题

当时DE的一个方案 放弃attachEvent 和detachEvent的方案，还号称如何如何， 但是他就解决不了 IE6早期版本的泄露
悲剧的是这个泄露，一般的工具无法检测， 只能靠肉眼
一直到 kb-929874 补丁的出现
kb-929874 /
这个的出现 ，类似下面的代码 居然不会泄露， 就是这个补丁的功劳 ：


document.onclick = function () {
var ele, a =[];
for (var k = 100000; k--;) a.push(k);
ele = document.createElement('div');
a.leak = ele;
ele.xxx = a;
ele.onclick = function () {
  a;
};
document.body.appendChild(ele);
};
我说的是节点
el -> element

但是这个补丁，并没有解决所有问题
所以最流行的做法 ，也是现在jq等库常用的做法 ， 引入超空间的概念.  来解决这个额问题， 也是针对这个补丁后的版本 ，

也就是这样的东西:

但实际上 这样,即使是SP3,也会出问题:

<div id="woca">asdasdasdasd</div>
       <script>
            //'use strict';
            var a = function () {
                var ele, a =[];
                for (var k = 100000; k--;) a.push(k);
                ele = document.getElementById('woca');
                a.leak = ele;
                ele.xxx = a;
                ele.onclick = function () {
                  a;
                };
                return ele;
            }();
            //document.body.removeChild(a);
       </script>

移除节点,就会放到超空间.保留节点在DOM Tree, ie6 sp3就会像IE7那样.解决掉内存泄露问题.

补丁的问题 基本上只有打了sp3就可以了
，至于要求，当然不可能。 所以最多也就做到 借助超空间， 尽量避免泄露， 也是 现在各种类库能做到的极限了

事实上早期的ie6，就像winter说的

'abc'.replace;  就泄露了



因为引擎需要 对 字符串装箱操作， 创建一个 wraper 的 new String对象. 但是ie6 的早期版本，无法回收这个 wraper 对象



