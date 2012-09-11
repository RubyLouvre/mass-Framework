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

function myFunction1 ( name ) {
	var content = 'return function '+name+' () {\n\
		return [custom function];\n\
	}';
	return new Function( content );
}
function myFunction2 (name) {
	var content = 'function ' + name +'(){\n[custom function]\n}';
	return function () {
		return content;
	}
}

myFunction1 比 myFunction2 更省空间？

func2确实占内存要少点啊
ssddi456(592247119)  12:33:26
啊 说反了
ssddi456(592247119)  12:33:46
//new Function造出来的 会少占内存
ssddi456(592247119)  12:34:04
linqjs这么干是有道理的



@司徒正美 我昨天问了franky大大一个问题：
iframe.src="javascript:void((function(){var d=document;d.open();d.domain='7k7k.com';d.write('"+objs[j].content+"');d.close()})())";

通过这种方式向一个跨域的iframe注入代码，ie6-8下会弹窗，能解决么？

==================

franky大大给出的解释是：

弹窗一定是因为你有 <base target=_blank

使用javascript: 伪协议. 即 设置iframe的url 为 javascript:document.write(xxx)的方式来写入文档流.实现同样的功能. 记住,write的机会只有一次.所以我们务必要一次性把内容写入. 但是当我们决定这样做的那一刻起,注定我们要面对IE系对我们设置的重重考验.因为这样做可能带来的问题如下:
　　(1). 当parent页存在 base标签,且target 为_blank时, 使用伪协议方式,会导致IE系弹窗(并可能会被浏览器拦截).
　　　　解决办法: 扫描parent页面的所有base标签,看是不是target为_blank.如果有,就暂时把它的target改为 _self.  后面对iframe写入伪协议结束后.再改回去.
　　　　ps: 务必迭代所有base标签,网上有资料说, 多个base标签 只有第一个生效是错误的. 实际上只要有target=_blank的base,无论他在哪，优先级都高于其他.
　　　　　　且,务必不要移除base标签,因为你可能遇到 IE6 base单闭合引发的bug.导致base后面的节点都被IE6解析成base的子节点.移除它，再恢复是很可怕的.

======================
我的那个朋友@方晓 说，还有另外一种方法：

如果先创建iframe，并设置src，再把元素append到页面上，就不会弹窗，而且无视base标签

我担心会有坑啊。  目前是想通过iframe并行加载广告， 但是各种domain的问题， 导致只能通过iframe src伪协议。

而且我是刚来这公司，用异步后，样式方面各种需要调整 ， 不过我觉得用伪协议这种风险有点大。

另外firefox -chrome 无视 父页面显式的设置domain  .  但 ie6-ie9 就不行。

10也不行
教主Franky(449666) 15:09:21
这是IE 同源策略的bug
教主Franky(449666) 15:09:31
一直没修正，据说也不打算修正

10也不行
教主Franky(449666) 15:09:21
这是IE 同源策略的bug
教主Franky(449666) 15:09:31
一直没修正，据说也不打算修正

javascript:伪协议这里不能直接 document.domain = xxx的样子
你意思是说 不document.open, 就这几document.domain  ??
教主Franky(449666) 15:16:53
另外，你写iframe.src =xxx 这个估计将来也会出问题的样子
教主Franky(449666) 15:17:08
不过可能也没关系 ，你们和我们的情况不同
教主Franky(449666) 15:17:27
我是说 伪协议的代码里不能直接改iframe的domain的样子
方晓(19805849) 15:18:03
其实伪协议是用来  解决iframe里面的内容需要动态创建的这种情况。

所以我说你要这样改:

javascript:document.open();document.write('<script>try{document.domain="' + document.domain + '"}catch(_domainError_){}<\\\/script>')
教主Franky(449666) 15:21:13
我这边一天20亿pv 用的就是我的方案
教主Franky(449666) 15:21:18
你现在上肯定有问题

document.open, 是否需要close()都是有说法的
呵呵有些浏览器不能闭合
方晓(19805849) 15:22:32
有啥说法，多赐教。
教主Franky(449666) 15:22:42
还有，你注意看看 ，你的页面的window.onload 还能触发不
方晓(19805849) 15:23:30
父页面的？
方晓(19805849) 15:23:35
还是子页面？
教主Franky(449666) 15:23:45
父
方晓(19805849) 15:23:52
我试下。
教主Franky(449666) 15:23:55
你要面对的情况比我这边简单
教主Franky(449666) 15:23:58
所以可能会绕过一些坑
教主Franky(449666) 15:24:15
比如 浏览器后退按钮失效，陷入无限后退bug 什么的
ssddi456(592247119) 15:24:42
- -


教主Franky(449666) 15:27:47
看看 document.readyState 是不是一直卡在innerActive即可
方晓(19805849) 15:27:51
我这里onload可以。
教主Franky(449666) 15:28:43
那就好
方晓(19805849) 15:28:59
@ssddi456

你是？
教主Franky(449666) 15:29:03
我再想 是不是你先写伪协议 再appendChild,先天会绕过 很多坑
方晓(19805849) 15:29:31
我没办法先写伪协议，再appendChild
呵呵有些浏览器不能闭合
方晓(19805849) 15:22:32
有啥说法，多赐教。
教主Franky(449666) 15:22:42
还有，你注意看看 ，你的页面的window.onload 还能触发不
方晓(19805849) 15:23:30
父页面的？
方晓(19805849) 15:23:35
还是子页面？
教主Franky(449666) 15:23:45
父
方晓(19805849) 15:23:52
我试下。
教主Franky(449666) 15:23:55
你要面对的情况比我这边简单
教主Franky(449666) 15:23:58
所以可能会绕过一些坑
教主Franky(449666) 15:24:15
比如 浏览器后退按钮失效，陷入无限后退bug 什么的
ssddi456(592247119) 15:24:42
- -

方晓(19805849)  15:18:03
其实伪协议是用来  解决iframe里面的内容需要动态创建的这种情况。

教主Franky(449666)  15:18:35
恩
教主Franky(449666)  15:18:45
算了 你没遇到问题就好.
教主Franky(449666)  15:18:51
遇到问题，我们再讨论吧
舍瓦(282783664)  15:19:00
这成BD群了
方晓(19805849)  15:19:04

我昨天也想直接修改，就是不成功
方晓(19805849)  15:19:15
舍瓦是谁？
ssddi456(592247119)  15:19:21

【提示：此用户正在使用Q+ Web： http://web.qq.com/】
ssddi456(592247119)  15:19:30
被占领了
ssddi456(592247119)  15:19:38
楼上是谁
方晓(19805849)  15:20:04
@franky   我担心有问题 ，现在在考虑是否上线。
教主Franky(449666)  15:20:58
所以我说你要这样改:

javascript:document.open();document.write('<script>try{document.domain="' + document.domain + '"}catch(_domainError_){}<\\\/script>')
教主Franky(449666)  15:21:13
我这边一天20亿pv 用的就是我的方案
教主Franky(449666)  15:21:18
你现在上肯定有问题
hehe123(241728923)  15:21:23
再次被bd 帮占领哇
教主Franky(449666)  15:21:28
因为各种坑，你还没塌到
方晓(19805849)  15:21:58
@franky   好我价加个try,catche
教主Franky(449666)  15:22:00
document.open, 是否需要close()都是有说法的
方晓(19805849)  15:22:20
我印象中都有闭合。
教主Franky(449666)  15:22:27
呵呵有些浏览器不能闭合
方晓(19805849)  15:22:32
有啥说法，多赐教。
教主Franky(449666)  15:22:42
还有，你注意看看 ，你的页面的window.onload 还能触发不
方晓(19805849)  15:23:30
父页面的？
方晓(19805849)  15:23:35
还是子页面？
教主Franky(449666)  15:23:45
父
方晓(19805849)  15:23:52
我试下。
教主Franky(449666)  15:23:55
你要面对的情况比我这边简单
教主Franky(449666)  15:23:58
所以可能会绕过一些坑
教主Franky(449666)  15:24:15
比如 浏览器后退按钮失效，陷入无限后退bug 什么的
ssddi456(592247119)  15:24:42
- -


教主Franky(449666)  15:27:47
看看 document.readyState 是不是一直卡在innerActive即可
方晓(19805849)  15:27:51
我这里onload可以。
教主Franky(449666)  15:28:43
那就好
方晓(19805849)  15:28:59
@ssddi456

你是？
教主Franky(449666)  15:29:03
我再想 是不是你先写伪协议 再appendChild,先天会绕过 很多坑
方晓(19805849)  15:29:31
我没办法先写伪协议，再appendChild
教主Franky(449666)  15:29:46
那你居然会绕过这些坑...厉害..
教主Franky(449666)  15:30:20
哦对了 IE下不能close
教主Franky(449666)  15:30:29
document.close() ..
教主Franky(449666)  15:30:35
但是webkit就必须
教主Franky(449666)  15:30:38
其他就无所谓
方晓(19805849)  15:31:04
我昨天郁闷一整天 ，之前都不知道domain的这些问题。包括在ie下如果父显式， 子也必须显示设计。
 幽灵(909939313)  15:31:12
好久没有写js了
教主Franky(449666)  15:31:28
1. 不能加document.close() ,close 会导致 ie 和 opera 内部加载联盟广告出问题. 内部联盟广告再次document.write会打开新的文档流.导致广告代码不执行.

                但是,  webkit 浏览器需要在向iframe write 内容时,close ,否则 在复杂的parent环境, 会导致 document.readyState 永远卡在  interactive 状态.
                一旦渠道，的代码有需要检测readyState 的状态 的逻辑，就会引发严重问题.另外，这本质上其实还会引起parent.onload不被触发.


                并且没有document.close(),可能会导致部分浏览器(确定有 IE.),总保持在loading状态.不停的转啊转..... 不过如果iframe里又去引入其他资源(必须走网络模块,cahce不行)
                就会绕过此问题.(但其实,IE6,写入document.close()的话也能修正loading问题.不过这个会引发其他问题,前面已经描述了.)

                另一个有趣的事情是.
                document.open('text/html', 'replace'); 在此处，其实是有一定意义的. 那就是.带参数.则刷新时,没有document.close()也不会有loading状态的问题.
                但无论是否带replace参,直接访问和收藏夹访问.都会产生问题.


                2. 其实，此处还有个隐藏的bug. 那就是收藏夹访问,不渲染的bug. 如果我们的str内的脚本没有一些强制flush render tree的操作的话.那么就可能在ie下触发这个bug.

                简单的解决办法是 : doc.write(str);document.body.offsetWidth; 读一次body.offsetWidth.就可以绕过此bug.
                此bug,ie6-9都存在.

                但是.我们的代码.和其他联盟的,基本上都能做到flush render tree.所以其实我们那样做是多余的. 但如果str中只是 123等文本.而没有其他操作.则bug就会显现!
方晓(19805849)  15:31:31
这是做主页性能优化， 觉得之前同步的广告代码太浪费时间。
教主Franky(449666)  15:31:37
这部分和 渲染有关的东西，你可以看看
教主Franky(449666)  15:31:47
有些我没有写在blog里
教主Franky(449666)  15:32:05
那个blog主要是为了解决 无版本号自更新脚本的. 所以很多细节没写
方晓(19805849)  15:32:46
哇，这个好好看看。
教主Franky(449666)  15:33:29
还有opera 你最好用dataURI
教主Franky(449666)  15:33:42
9.6-用dataURI
教主Franky(449666)  15:34:17
opera9.8则无问题
教主Franky(449666)  15:34:24
9.8+
教主Franky(449666)  15:34:36
需要注意一个问题, about:blank 的iframe. Firefox3.6- 的浏览器,如果获取 在iframe内部获取 location.host 则会抛出一个异常.
            异常信息为:
            uncaught exception: [Exception... "Component returned failure code: 0x80004005 (NS_ERROR_FAILURE) [nsIDOMLocation.host]"
            nsresult: "0x80004005 (NS_ERROR_FAILURE)" location: "JS frame :: xxxxxxxxx.js? :: <TOP_LEVEL> :: line xxx" data: no]

            这个问题，首次被发现，就是因为alimama的脚本,调用了该接口,在FF3.6一下抛出了该异常，并导致广告无法展现.
方晓(19805849)  15:34:43
对了@franky  我之前还想在domready后  动态载入百度统计的js ,   但上线后， 当天百度统计的数据就少了300万pv ,
教主Franky(449666)  15:35:12
那说明你们的 用户瞬关的很多啊？
教主Franky(449666)  15:35:26
还有就是动态加载 会放大ie6 gizp bug被触发的可能性
教主Franky(449666)  15:35:38
我不确定 百度统计是否配置了gzip
西红柿(770104121)  15:35:43
不是瞬关
很多广告没加载好，domready没触发就关闭了
教主Franky(449666)  15:35:53
这个可能性也很大
方晓(19805849)  15:35:56
不是， cnzz就没缺少 ，我怀疑是百度统计代码有坑。
教主Franky(449666)  15:35:58
比如你的domReady检测不靠谱
教主Franky(449666)  15:36:25
如果两边都是domReady的话 ，那显然baidu统计自身 动态加载会有隐患的样子
方晓(19805849)  15:36:46
domReady检测不靠谱？
教主Franky(449666)  15:37:23
你cnzz也是domReady的话，并且没减少的话， 这个结论就可能有问题吧
方晓(19805849)  15:37:29
是这样的。 百度统计本身的代码是页面的最底部<script>document.write方式。

我后面改成ready后 loadscript方式
方晓(19805849)  15:37:50
嗯，cnzz 和百度统计都是放在 ready后弄的。
教主Franky(449666)  15:38:05
.........
教主Franky(449666)  15:38:29
他本身有document.write.你为啥还loadScript呢？
方晓(19805849)  15:38:32
Franky(449666)  15:35:12
那说明你们的 用户瞬关的很多啊？
还有就是动态加载 会放大ie6 gizp bug被触发的可能性
我不确定 百度统计是否配置了gzip

动态加载会导致 gzip bug?
教主Franky(449666)  15:38:56
会增加触发概率(如果baidu的代码部署http不合理的话)
教主Franky(449666)  15:39:01
这个可能性不太大
教主Franky(449666)  15:39:08
Franky(449666)  15:38:29
他本身有document.write.你为啥还loadScript呢？



方晓(19805849)  15:39:31
document.write只是在ie可以并行加载执行， 但firefox ,chrome 下不一样的表现。
教主Franky(449666)  15:39:36
你不明白
方晓(19805849)  15:39:44
………………

方晓(19805849)  15:39:51
还真请假
方晓(19805849)  15:39:53
请教下
教主Franky(449666)  15:40:03
DOM Insert的 script的行为和 其他的script有很多差异
教主Franky(449666)  15:40:05
举个例子
教主Franky(449666)  15:40:20
即使你保证他执行的时候 没有document.close
方晓(19805849)  15:40:30
嗯，必须自行来控制执行的顺序
Mr.Q(44662077)  15:40:34
方晓? 方菊？
方晓(19805849)  15:40:39
嗯，是
教主Franky(449666)  15:40:48
使用 domElement.appendChild方式动态加载script.

FF4.0+, IE10+, Safari5+, Chrome 6+

无论该脚本执行时,文档流是否关闭, 使用document.write方式 再次插入脚本 无论是行内脚本还是外链脚本,都不会被执行.  .但向文档流内插入其他东西,则没问题...

Opera12.5- ,IE9-, FF3.6-, Safari4-, Chrome5- 则无此现象.


应避免在动态加载脚本中操作文档流, 哪怕不在文档流中插入脚本(文档流闭合的问题更严重.).......

Mr.Q(44662077)  15:41:00
我靠。方菊都在2b群啊
方晓(19805849)  15:41:03
Mr.Q 是谁。
Mr.Q(44662077)  15:41:18
不告诉你，哈哈
方晓(19805849)  15:41:35
晕………………
西红柿(770104121)  15:41:42
你想想那条金链子
Mr.Q(44662077)  15:41:43
你不离职了吗
ssddi456(592247119)  15:41:43

【提示：此用户正在使用Q+ Web： http://web.qq.com/】
教主Franky(449666)  15:41:43
现在的趋势是,浏览器对动态插入DOM的 script ，操作文档流的行为 有很多限制
西红柿(770104121)  15:41:46
就大概知道了
教主Franky(449666)  15:41:55
刚才说的是，我自己已经测知的问题,也许有其他的
ssddi456(592247119)  15:42:21


教主Franky(449666)  15:42:32
所以 我建议..如果某个脚本有操作文档流的行为，就别 用DOM Insert 的方式动态加载他，即使你能保证它执行时，文档流不会关闭
方晓(19805849)  15:42:48
嗯，好，刚刚这所有的我都再看下吧， 将你所说的各种情况都试下。 再上线伪协议吧
教主Franky(449666)  15:43:32
还有很多坑，总是非IE别用伪协议 能解决很多问题
教主Franky(449666)  15:43:40
总之..

(1). 当parent页存在 base标签,且target 为_blank时, 使用伪协议方式,会导致IE系弹窗(并可能会被浏览器拦截). 
　　　　解决办法: 扫描parent页面的所有base标签,看是不是target为_blank.如果有,就暂时把它的target改为 _self.  后面对iframe写入伪协议结束后.再改回去.
　　　　ps: 务必迭代所有base标签,网上有资料说, 多个base标签 只有第一个生效是错误的. 实际上只要有target=_blank的base,无论他在哪，优先级都高于其他.
　　　　　　且,务必不要移除base标签,因为你可能遇到 IE6 base单闭合引发的bug.导致base后面的节点都被IE6解析成base的子节点.移除它，再恢复是很可怕的.


教主Franky(449666)  16:57:46
 fixBase = function () {
                    var baseList = document.getElementsByTagName('base');
                    var baseElement;

                    for (var i = baseList.length ; i--; ){
                        if(baseList[i].target === '_blank'){
                            baseElement = baseList[i];
                            break;
                        }
                    }
                    
                    if(baseElement){
                        baseElement.target = '_self';
                        return baseElement;
                    }
                };
                resetBase = function (baseElement) {
                    baseElement.target = '_blank';
                };
教主Franky(449666)  16:57:55
用着来货来搞
教主Franky(449666)  16:58:07

                    var baseElement = fixBase(ifm);
                    
                    ifm.contentWindow.location.replace('javascript:document.open();document.write("' + url + '");document.close();');
                    if(baseElement){
                        resetBase(baseElement);
                    }