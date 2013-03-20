/* 
 * UI库参考
 * 
 */
lhgdialog 
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
http://www.cnblogs.com/pansly/archive/2011/12/18/2292743.html
http://www.cnblogs.com/zr824946511/archive/2010/02/25/1673520.html
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
59
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
					
					swfobject 要解决的是这个问题:

xp ie6 : KB912945  2/10/2006  参考地址:  http://support.microsoft.com/kb/912945

总结:
. 引入 manifest方式为 :  <html manifest="name.appcache">
. manifest的加载是晚于页面其他资源的.
. manifest的contentType应为 : text/cache-manifest
. 建议其扩展名为 : appcache
. manifest文件本质是一个,要采用UTF-8编码方式编码的文本文件.
. 引入manifest的页面,即使没有被列入缓存清单中，仍然会被用户代理缓存.
. manifest文件从标准角度来说,是不能直接从缓存读取的.即使像上一条说的,你明确的把manifest放入另一个清单中.至少也是服务器尝试返回304.再去读缓存.(注1)
. 在线的情况下,用户代理每次访问页面，都会去读一次manifest.如果发现其改变, 则重新加载全部清单中的资源(注2).
. 对于浏览器来说,manifest的加载是要晚于其他资源的. 这就导致check manifest的过程是滞后的.发现manifest改变.所有浏览器的实现都是紧随这做静默更新资源.以保证下次pv,应用到更新.
. manifest文件必须与引入它的页面同源.
. 如果manifest文件是一个https或其他加密协议资源,则其清单中明示项(explicit section)的资源都必须和manifest同源.
. 备用项和备用名称空间,必须与当前的manifest同源.
. 备用项如果发生命中,则也会被缓存.
. 明示项和备用项优先级高于白名单.
. 白名单使用通配符"*". 则会进入白名单的open状态. 这种状态下.所有不在相关Cache区域出现的url都默认使用HTTP相关缓存头策略.
. 白名单使用具体的前缀匹配或更具体的URL,则都属于blocking状态.这种状态下,白名单所匹配的,非Cache区域出现的URL,与open的*匹配的结果一致,但是不在白名单中,又不在整个manifest的资源,会block.也就是访问，加载不能.
. manifest中的url ,必须与manifest使用相同的协议.
. 一个manifest的明示项中可以包含另一个manifest.(但这种设计，我认为很2.)
. manifest中的url,不应有"#" 锚点部分出现(比如 abc.htm#1,如果出现#,则 #以及后面部分，会被丢弃.)
. 建议使用<!DOCTYPE html> DTD, 因为据说,某些浏览器会因为，进入非标准模式,而无视manifest.
     (我本人没有实测，但我个人猜测，如果有这样一款浏览器，那么它很可能就是IE10. 因为IE10进入兼容模式,很多html5草案的API都使用不能.比如performance API)
. 被清单缓存的资源,是无视http cache 相关 头域, 或其是否是https资源的.
. 相同备用名称空间,不能重复出现在 备用区域中.
. 不应有相包含的备用名称空间出现在备用区域中(因为前缀匹配的原因.出现包含，显然是多余的，如果真有一个URL同时匹配两个通配符.那么就以更长的那个为准.).
. 备用名称空间 和 白名单名称空间 都使用前缀匹配模式.即支持通配符匹配模式.(可以放心的是 // www.a.com/abc 是不匹配 // www.a.com/ab的,因为// www.a.com/ab 实际上是// www.a.com/ab/)
. 前缀匹配对端口的匹配是宽松的.如abc.com:80/a.png 就会被 abc.com/所匹配.
. 在写相对路径的时候 不是相对 引入它的html  而是相对 manifest文件所在目录的
. 一但manifest检测,需要更新,导致所有cache资源更新。其中manifest会再次加载一次.(所以给所有缓存资源配置合理的304机制.是十分有必要的.)
. 一组不同的页面引入相同的manifest文件时,这组页面的即构构成一个group.并已document作为标识,来区分他们.其中任何一个的manifest或资源更新,甚至是检测都会触发其他页面的applicationCache的相应事件.
. applicationCache.update(), 只会立刻检测manifest文件,而不会更新相应资源.并且会遵守304相关http缓存头.
. a,b两个页面,引入相同资源,但a有使用manifest,而b没有.那么,即使a页面缓存了资源.b页面也不会有效.而且b页面强制更新了资源.a页面的缓存也不会因为b的更新，而更新.
. a页面引入manifest,缓存的资源, 在浏览器地址栏中直接访问,则也命中offline application的缓存.刷新也如此.至少chrome,FF都是如此实现的.
. a,b两个页面,分别引入A,B两个manifest文件,且分别缓存相同的一个资源R,则 如果此时更新R,然后更新B.则.b刷新后重新获取资源R,但是a的R资源缓存副本是不会被更新的.
. a,b两个页面,引用同一份manifest A. 则更新A,更新R,刷新b, b对应的R资源更新后,a的R资源副本也会随之更新. 这就是cache group的机制.因为a和b对应的application cache,同属于同一个application cache group.

. 建议为manifest文件配置304相关 头域时,也配置expires和cache-control : max-age.因为chrome,safari,以及android,只有304相关头域，而没有expires 或 max-age时,不会有304，而只会是200, opera则无视一切http cache头域.总是200.
  (浏览器的实现都有问题,webkit的问题是,没有遵守http协议.因为304相关头域是足矣使浏览器是具备资源副本,并做握手的. 而opera则完全无视http缓存头域.更加不靠谱. (IE10 pp2,FF系列.不方便测试))



注1: FF的实现有bug.他有自己的时间管理,在短时间内重复请求一个manifest,FF会有直接从cache中读取的情况出现.即使,我们主动使用applicationCache.update().而 FF9+开始,这个所谓的短时间,被延长了很久,至少我个人没有实测出到底要多久.因为同样一个manifest,有时候他就要我等很久，有时候很短暂(暂时没有找出具体规律,至少和Expires,max-age等头域无关.). 这是不符合规范的做法.规范中唯一允许，不经验证，直接从cache读取manifest的就是,如在地址栏直接get manifest或类似的的情况.

注2 : 所谓重新加载, 是依然遵守http 的缓存相关头域的, android webkit browser, chrome ,FF6- 等. 但是FF7+ 开始有了优化, 当缓存资源的http Expires 等相关缓存头域显示该资源没有过期时,FF6+依然会去本地缓存去的资源. 而不像其他浏览器,则会尝试带着304相关头域发起http请求.

但目前的习惯是，实例只保存与其有直接关联的必要的值，方法大都在原型里。
恐龙♂(396686)  12:07:35
其实能区分开，我个人感觉也是更清爽，但还是觉得难以实施。关联的问题太多，引发社会动荡太大，激起民愤就比较麻烦了。
教主Franky(449666)  12:07:45
恩..确实如此的样子
教主Franky(449666)  12:07:52
好苦逼
恐龙♂(396686)  12:08:08
[NaN].contains(NaN)
恐龙♂(396686)  12:11:10
这玩意要顾虑的忒多。
比如，一些用户操作会导致对应的 DOM 方法被调用，然后对应的 DOM 事件被触发。
这里边有个比较特殊的 submit。
按说统一事件模型后，大可以与其他类似行为一样，执行 submit() 后触发 submit 事件，但实际上没有哪个浏览器敢这么整吧。
恐龙♂(396686)  12:11:39
规范可能可以怎样怎样设计，但如果市区支持也挺尴尬。
教主Franky(449666)  12:12:32
我也记录下
恐龙♂(396686)  12:14:02
跟 钓鱼岛是中国的 一样，带了那么点尴尬……
教主Franky(449666)  12:14:26
恩，这个话题结束吧. 我记录下...
恐龙♂(396686)  12:14:53
对了教主，null <= 0 是咋回事啊？
教主Franky(449666)  12:15:07
就是设计失误啊
教主Franky(449666)  12:15:20
按照它的 流程 true是必然结果
教主Franky(449666)  12:15:36
标准 只处理了undefined, 忘了处理null 就是这个鸟样
教主Franky(449666)  12:15:48
null <= 0 的流程 就是  ! null > 0
教主Franky(449666)  12:15:51
所以你懂得
教主Franky(449666)  12:16:04
而undefined 标准是额外拿出来说的.
教主Franky(449666)  12:16:15
null 忘了拿出来单拎了..就悲剧了
恐龙♂(396686)  12:16:20
其实这俩玩意要是能合体，也挺好。
实际用起来，除了字面上能区分，感觉没别的用处。
教主Franky(449666)  12:16:31
用处肯定是没有的
教主Franky(449666)  12:16:43
但是 一些场景肯能出问题 也是真的
教主Franky(449666)  12:17:15
比如 


function fn(x){
    if(x >= 0) ....
}


fn(null) 显然不符合预期的样子
恐龙♂(396686)  12:17:51
还好，我代码里 null 都是对象类型取值失败的时候返回的值……
教主Franky(449666)  12:18:03
恩 通过规范 肯定能解决问题..
教主Franky(449666)  12:18:22
我们只是讨论这个问题，有没有必要 在ES6 里提一下，修正一下？
恐龙♂(396686)  12:19:37
单从 ES 角度看，访问一个变量时，不必爬 Global 的原型链，看起来是更清晰的。毕竟变量和属性是不同的。
教主Franky(449666)  12:20:23
恩...这个问题我被你说服了，我不打算提出异议 或改进了
恐龙♂(396686)  12:20:45
变量爬作用域链，属性爬原型链，他们俩啊，爬着爬着，发现，哎？兄弟你也在啊！
教主Franky(449666)  12:20:50
但是 null >= 0  呢？ 大家是否认为应该改进？
恐龙♂(396686)  12:21:51
应该。不是做类型转换了么，null 转成数字不是 0 么？
教主Franky(449666)  12:22:14
no ..
教主Franky(449666)  12:22:54
如果 null == 0  //是true 我也没啥好说的
恐龙♂(396686)  12:23:07
那就麻烦了。当成 0 还好改点……要是 NaN 那真和 undefined 没啥两样了。
恐龙♂(396686)  12:23:30
完了，忘没了。这些个乱七八糟的值，转换什么的……
Hax(2304207995)  12:24:06
contains的问题是 === 的问题，因为 NaN !== NaN，顺带 indexOf 也有这个问题。
恐龙♂(396686)  12:24:40
对，所以说不严密。但不能说 indexOf 不好用。
Hax(2304207995)  12:24:50
我觉得ES6或许会修复contains，也就是用egal比较。indexOf肯定保持原样了。
恐龙♂(396686)  12:24:59
加个 isNaN 的情况反而把问题搞复杂了。
Hax(2304207995)  12:25:15
不仅是NaN，还有 +0 -0问题。
教主Franky(449666)  12:25:28
+0 -0 也很奇葩
Hax(2304207995)  12:25:48
ES6加了个方法： Object.is(+0, -0)  => false

Hax(2304207995)  12:26:01
Object.is (NaN, NaN) => true

Hax(2304207995)  12:27:13
还有 Franky讲的那个问题，es-discuss有讨论的。基本上好像是决定不遍历prototype。然后改webIDL让那些属性都打平到每个接口上。
教主Franky(449666)  12:27:30
哈哈，这是我支持的观点.
恐龙♂(396686)  12:27:34
ES6或许会修复contains
麻烦了……要真修了很多人都要改代码。
Tina(527081709)  12:27:47
被罩不要买了。。。
Hax(2304207995)  12:27:57
应该不用改，你的代码里通常不会处理NaN。
Tina(527081709)  12:28:01
这次回家。让我妈去我三姑家那边批发。
Hax(2304207995)  12:28:08
既然你本来就没处理NaN，也没差。
Tina(527081709)  12:28:08
那边可便宜了。
Tina(527081709)  12:28:21
 
恐龙♂(396686)  12:28:43
一？突然想起一个问题。我找找。
Hax(2304207995)  12:28:55
继承prototype，其实有个很大的问题是 getter  /  setter
Hax(2304207995)  12:29:36
比如Object.defineProperty(Object.prototype, 'a', {get:function(){}});
Hax(2304207995)  12:29:46
然后 var a = 1 ，结果发生什么？？
Tina(527081709)  12:30:29
没关系。。
教主Franky(449666)  12:30:43
这个没关系吧, var a 在实例上啊
教主Franky(449666)  12:30:49
hax 帮我发下 null的问题? 
Hax(2304207995)  12:30:54
不对啊。
Hax(2304207995)  12:31:07
getter / setter 是会追溯prototype的。
Tina(527081709)  12:31:16
a,是字符串了。。
Hax(2304207995)  12:31:21
所以 var a = 1 就麻烦了。
Hax(2304207995)  12:32:10
所以是否要在 global 上创建 record binding， 这就吵上了。
Tina(527081709)  12:31:56
那边传值。是字符串啊。跟定义的变量a没有关系。
Hax(2304207995)  12:32:46
@Franky null的啥问题？
Tina(527081709)  12:33:09
空值
恐龙♂(396686)  12:33:13
但从 ES 角度看，问题简单些，怎么设计都好说。
我感觉麻烦的就是这玩意主要还是跑在浏览器里的。
教主Franky(449666)  12:33:21
null == 0 // false
null > 0 // false
null < 0 // false

null >= 0 // true
null <= 0 // true

没啥说的,苦逼的ES3,5都忘了把null像undefined那样单拎出来. 所以 null >= 0 的逻辑 就是 求 ! null < 0 的逻辑.结果就悲剧了. 

教主Franky(449666)  12:33:59
Hax , var 不是一直有特权么？
Hax(2304207995)  12:34:11
@Tina 没看懂吗？我定义了一个 不可configurable 的 a getter 在 Object.prototype 上。在global上的var a =  1是否应该建立binding？这其实是个很大的坑。
教主Franky(449666)  12:34:43
先把我这个 确认的 错误，提了吧
教主Franky(449666)  12:34:50
不希望ES6 还是这个鸟样
教主Franky(449666)  12:34:59
处理方式 同undefined 
Hax(2304207995)  12:35:10
按照一般认知 var a = 1会建立一个 global.a ，但是现在跟getter 冲突了。
恐龙♂(396686)  12:35:40
呃？我不怎么看规范，不过我一直以为 var 的玩意不是 property。
教主Franky(449666)  12:36:05
一直都是property 只是是谁的property的区别..
教主Franky(449666)  12:36:25
ES5 的各种坑 不论
恐龙♂(396686)  12:36:29
不从实现上看，用使用角度来看，变量 不是 property。
GZhang<otakustay@gmail.com>  12:37:10
var a建立global.a
Object.defineProperty修改Object.prototype.a为configurable:false，无setter
a = 1由于global上有了a，不上溯到prototype，所以有效
不是这样的吗？
一丝冰凉(50167214)  12:37:14
@Hax 请问 wrap-flow  这个属性在 w3c 中进展如何了？
Hax(2304207995)  12:38:00
其实 var a 通常不是property，只在 global 上出毛病了。 BE 自己说的： 我把 scope 跟 prototype 在这里连起来 真是脑残了 （大意）
GZhang<otakustay@gmail.com>  12:38:05
var a建立global.a的过程怎么着也应该在defineProperty前面才对吧？
教主Franky(449666)  12:38:39
 
教主Franky(449666)  12:38:58
ES5 应该变的复杂了， 所以各种问题 就更多了的样子
Hax(2304207995)  12:39:34
@Franky 你那个不错，自个儿上去给提了吧！哈哈。
教主Franky(449666)  12:40:12
英文太挫，你来提吧.. Hax 威武!
教主Franky(449666)  12:40:28
话说,你和winter 都欠我一次分享的样子..啥时候有时间啊？
教主Franky(449666)  12:40:38
国庆之后吧？ 没问题吧？
Hax(2304207995)  12:40:39
@GZhang 注意 var a = 1应该建立global.a（own property），而getter / setter是要穿透prototype的。
Hax(2304207995)  12:41:17
@一丝冰凉 我不清楚，问下 kenney 吧。
GZhang<otakustay@gmail.com>  12:41:42
嗯，然后a = 1的时候，是要在当前的VE里找a，当前的VE是global对象自身，global.a存在，所以a = 1这一行的identifier resolution应该是和prototype无关的才对
一丝冰凉(50167214)  12:41:55
@kenney 好像不在群里吧 
GZhang<otakustay@gmail.com>  12:42:20
a = 1这一语句整个过程中不应该会和getter发生任何关系吧？是不是我以前对这个过程理解有问题……
恐龙♂(396686)  12:42:26
那写值的时候把 Global 上的变量别当属性一样，没人想这么搞么？教主刚才的意思？
Hax(2304207995)  12:42:32
第一个get的例子，@Franky 你好牛掰，写出如此蛋疼的测试用例，哈哈。
教主Franky(449666)  12:42:57
那不是我写的..是 kenny写的...我也膜拜了很久
恐龙♂(396686)  12:43:20
时序设计不严密啊。
Hax(2304207995)  12:43:28
@Franky 问winter，我跟他后面。
教主Franky(449666)  12:43:35
ok
教主Franky(449666)  12:43:39
我去wc ,你们继续....
恐龙♂(396686)  12:44:13
我的 animation.on('play', function(){this.stop()}); 在以前的版本也这个熊样，后来改好了……
Hax(2304207995)  12:48:42
@GZhang 你理解的没问题，我表达有误。实际情况是引擎有特殊处理，因为有很多这样的代码： function onmessage() {} ，但是onmessage如果是在DOMWindow上的setter，那么就傻了。
Hax(2304207995)  12:51:48
@Franky 那你找kenney发呀！
教主Franky(449666)  12:58:17
kenny大人 这不是不知道去干啥了么
教主Franky(449666)  12:59:13
hax 为啥会傻了？
一丝冰凉(50167214)  12:59:20
@Hax 哪里去找 kenney 哈
教主Franky(449666)  12:59:35
DOMWindow 实例上的setter 的话，就按setter 的来呗？
教主Franky(449666)  12:59:48
如果是原型上的.那就是在实例上搞，不应该影响原型啊
教主Franky(449666)  13:00:10
或者说，你吐槽的是 某些引擎的实现？
kennyluck(1296340270)  13:07:03
啥米狀況？
教主Franky(449666)  13:07:37
熬 kenny 我个人希望你帮我提个 fixed 或在 ES6里的改进？

但是我不确定ES6是否已经改进了？
教主Franky(449666)  13:07:51
null == 0 // false
null > 0 // false
null < 0 // false

null >= 0 // true
null <= 0 // true

没啥说的,苦逼的ES3,5都忘了把null像undefined那样单拎出来. 所以 null >= 0 的逻辑 就是 求 ! null < 0 的逻辑.结果就悲剧了. 


就是这个问题
kennyluck(1296340270)  13:08:01
寫中文信我就來啊翻啊… 
教主Franky(449666)  13:08:16
这就是全部内容啊...
教主Franky(449666)  13:08:30
你把这个原文发过去？
教主Franky(449666)  13:08:40
只是 你觉得这个是发到ES5 的组 还是 ES6的？
kennyluck(1296340270)  13:08:59
看不懂這個沒前文後語的段落。
kennyluck(1296340270)  13:09:51
所以你是要求怎樣？null >= 0 也 false?



inter(shaofeic)(348853132)  16:55:40
included user-testing on some developers who really wanted something broken for ==, and I foolishly gave it to them (and to everyone).

这句话是解释他认为这个difference是不合理的吧
教主Franky(449666)  16:58:11
他说的不是 >= 不合理 而是  == 这个不合理吧?
教主Franky(449666)  16:58:24
null == 0 这个设计原则上, null不会发生转型. 所以结果是false .  而 null > 0 , null会转型成0 所以也是false .  null >= 0 ,null转型成 0 . 所以true.    所以 ! null < 0 的规则可以简单实现这种设计思路.而不是设计之初,的遗漏.


这是我现在 对这个问题的理解..
教主Franky(449666)  16:59:08
这是我理解的, BE的设计思路 . 我们姑且不讨论 这个思路是否合理...
winter(shaofeic)(348853132)  16:59:27
对 something broken大约是指 undefined的事情
winter(shaofeic)(348853132)  16:59:41
或者 null == 0这个事情
教主Franky(449666)  17:00:48
恩
教主Franky(449666)  17:01:28
所以从他的设计思路上来说  null 在数学相关的运算中 就代表0  所以 0 > 0 flase , 0 >= 0  true  .这就是他的设计思路
winter(shaofeic)(348853132)  17:01:42
对 他似乎认为这个没错
教主Franky(449666)  17:01:47
他有意见的是 null == 0 违背了他的设计思路 
winter(shaofeic)(348853132)  17:01:52
但是 == 和!=是有问题的
教主Franky(449666)  17:01:57
恩
教主Franky(449666)  17:02:11
总算捋顺了..我个人表示可以接受这个说法的样子. 
winter(shaofeic)(348853132)  17:02:41
所以你决定ok了？
教主Franky(449666)  17:03:28
 因为改动 null == 0 比改动 null >= 0 危险的多
徐涵(19364440)  17:03:34
小调查：浏览器，大家有什么推荐码？
madao(864835951)  17:03:45
….
winter(shaofeic)(348853132)  17:04:01
Chrome
Sogl(53248714)  17:04:05
ie6
GZhang<otakustay@gmail.com>  17:04:22
lynx
madao(864835951)  17:04:27
 ie6和黑直长自古以来都是不二王道
徐涵(19364440)  17:04:34
遨游，360，海豚，搜狗这些呢？
kennyluck(1296340270)  17:04:40
 
madao(864835951)  17:04:41
小受们速速给跪
AKI(470378842)  17:04:46
。。。 为啥突然变成浏览器了
徐涵(19364440)  17:05:11
不好意思，我查了个小调查，呵呵
UC-Ray(21310524)  17:05:16
UC挺好的
徐涵(19364440)  17:05:25
哦对，还有UC ;)
winter(shaofeic)(348853132)  17:05:32
小调查强势插入~
winter(shaofeic)(348853132)  17:05:50
教主可以回封信
winter(shaofeic)(348853132)  17:05:51
嗯
winter(shaofeic)(348853132)  17:06:04
就说 哎呀 真nb
kennyluck(1296340270)  17:06:07
我覺得這邊想弄懂還是要弄清楚 "The non-conversion of null in this case is actually good." 這句話的理由。
米粽 (Leo Deng)(17705532)  17:06:07
你们在干啥？
米粽 (Leo Deng)(17705532)  17:06:14
lynx一下变到黑长直了……
教主Franky(449666)  17:06:32
我准备写个blog  记录今天这个问题..   因为我反省到一个问题,就是对标准的解读，我自己总以为理解的很深入了. 今天发现很多地方理解的还不够.至少和设计者的设计思路有背离. 
米粽 (Leo Deng)(17705532)  17:07:09
拜教主！
kennyluck(1296340270)  17:07:21
我覺得你一直講「设计者的设计思路」這句話本身就很有問題
kennyluck(1296340270)  17:07:34
BE 不就說是別人的錯了嗎？ 
winter(shaofeic)(348853132)  17:08:24
BE说是自己的错 嗯
winter(shaofeic)(348853132)  17:08:29
但是表示是被忽悠的
教主Franky(449666)  17:09:12
咦... kenny这句话 不是把 null == 0 给推翻了么? 
winter(shaofeic)(348853132)  17:09:43
这是后面再说 ==的事情
教主Franky(449666)  17:09:48
我知道啊
教主Franky(449666)  17:10:05
 in this case is actually good 
教主Franky(449666)  17:10:09
this case 指啥？
教主Franky(449666)  17:10:13
null == 0 
winter(shaofeic)(348853132)  17:10:23
The broken Equality operators == and != are more complicated, but in this case they at least do not convert null at all
winter(shaofeic)(348853132)  17:10:40
他觉得这样挺好的
winter(shaofeic)(348853132)  17:10:57
至少null被搭救出来了 这样的感觉
教主Franky(449666)  17:10:57
问题是他不能两头堵啊
教主Franky(449666)  17:11:02
他得有立场啊
winter(shaofeic)(348853132)  17:11:38
这是 == 刚才说的是关系
教主Franky(449666)  17:11:43
null == 0 这个设计原则上, null不会发生转型. 所以结果是false .  而 null > 0 , null会转型成0 所以也是false .  null >= 0 ,null转型成 0 . 所以true.    所以 ! null < 0 的规则可以简单实现这种设计思路.而不是设计之初,的遗漏.

他承认自己在 null == 0 的设计上有不够好 对吧？
winter(shaofeic)(348853132)  17:11:47
关系运算符 < > >= <=
winter(shaofeic)(348853132)  17:12:00
他承认自己在 == 设计上不够好
winter(shaofeic)(348853132)  17:12:08
但是 null == 0 还不错
教主Franky(449666)  17:12:11
然后最后说 在 null == 0 这个case 上 还不错?
kennyluck(1296340270)  17:12:18
他不是承認他根本沒設計 == 嗎？
winter(shaofeic)(348853132)  17:12:40
......
教主Franky(449666)  17:12:58
恩对，他前面说 == 是别人的错
winter(shaofeic)(348853132)  17:13:02
他意思是 做了设计 但是别人给了他测试用例 然后做了些例外吧
教主Franky(449666)  17:13:28
问题是 正反话都让他说了啊
kennyluck(1296340270)  17:13:49
總之，我看到「设计者的设计思路」這種話就想吐嘈。
winter(shaofeic)(348853132)  17:14:09
他讲的something broken for == 他犯傻给了他们
教主Franky(449666)  17:14:24
如果 null == 0 的结果他认为是不错的

前面又表达了 null > 0 , null >= 0 都符合他设计的话  那我们到底在讨论什么呢？
winter(shaofeic)(348853132)  17:14:29
但是 null == 0 单就这个case而言还不错
winter(shaofeic)(348853132)  17:15:15
可能是他觉得 ==的其它broken case他不满意
教主Franky(449666)  17:15:14
那谁为这个 不符合逻辑的 三个case 买单？
教主Franky(449666)  17:15:21
别这样....
教主Franky(449666)  17:16:20
(?) > 0  //false
(?) == 0 // false
(?) >= 0 //true ..

这种填空题 哪到哪都不符合逻辑啊.
kennyluck(1296340270)  17:16:27
我根本搞不懂為什麼我們要一直討論 BE 是怎麼想的 …
winter(shaofeic)(348853132)  17:16:49
我们要先明白BE说的话的意思吧
kennyluck(1296340270)  17:18:04
他隨便哈拉了幾句，不直接回他的信卻在這裡硬是隨便解讀絕對不明智…
winter(shaofeic)(348853132)  17:18:25
理解有误的话 回信很不礼貌吧？
winter(shaofeic)(348853132)  17:18:40
The non-conversion of null in this case is actually good. Doesn't make up for all the broken-ness, though.
----------------------------------------------------------------------
这个例子里面null不转换其实不错。尽管如此，这不能粉饰所有的broken-ness。
教主Franky(449666)  17:20:57
我英文不好，无力吐槽..winter 上吧.
winter(shaofeic)(348853132)  17:21:13
这个例子里面null不转换其实不错。尽管如此，这不能掩盖所有的broken-ness的缺陷。
winter(shaofeic)(348853132)  17:21:22
算了 我自己的提案都没说明白
winter(shaofeic)(348853132)  17:21:49
话说教主你想吐槽啥啊？
winter(shaofeic)(348853132)  17:22:04
其实仔细看看 我觉得确实没回答 undefined的行为啊......
winter(shaofeic)(348853132)  17:22:31
undefined<=0 为啥就没转换呢？
教主Franky(449666)  17:22:37
因为我没搞明白这三个case的结果到底是谁的错
kennyluck(1296340270)  17:22:45
轉成 NaN 所以是 false 吧。
winter(shaofeic)(348853132)  17:23:20
教主你这个说法好奇怪 这肯定是BE的问题
恐龙♂(396686)  17:23:21
NO
winter(shaofeic)(348853132)  17:23:32
就算是别人给了他case 也是他做决定的啊
教主Franky(449666)  17:23:41
但是BE 把责任推干净了啊
winter(shaofeic)(348853132)  17:24:05
他哪里推了责任了啊
教主Franky(449666)  17:24:40
最后一句 算是自我安慰么？
恐龙♂(396686)  17:24:55
==
>=
二者的转换方法是不一样的，只是这个 case 看起来怪。实际要说都是有据可依。也不好改了。
所以说当初 null == 0 是 true 就没事儿了。
winter(shaofeic)(348853132)  17:25:17
不是啊 他不觉得null == 0的情况不对 也不觉得 null <= 0的情况不对
winter(shaofeic)(348853132)  17:25:37
但是他觉得 == 和!=的某些broken case的情况不对
教主Franky(449666)  17:25:48
所以啊. 他觉得都合理.但是我们看看我最初的问题:

(?) > 0  //false
(?) == 0 // false
(?) >= 0 //true ..

这种填空题 哪到哪都不符合逻辑啊.
恐龙♂(396686)  17:26:08
null == 0  现在是 false，这个如果是 true 就全好了。但因为 == 的规则早已确定，也是没招的事儿。
winter(shaofeic)(348853132)  17:26:13
这个问题BE已经解释了啊
winter(shaofeic)(348853132)  17:26:30
>=的定义不是 >加==
winter(shaofeic)(348853132)  17:26:34
没有这种设定吧
kennyluck(1296340270)  17:26:43
Franky:  17:22:38
因为我没搞明白这三个case的结果到底是谁的错

誰的錯很重要嗎？不就說是歷史共業了？
恐龙♂(396686)  17:26:46
但现在在 JS 里说的通。

好消息是  一个困然很长时间的历史问题， 在将来会被修正
Object.prototype.xxx = 1;

typeof xxx //Firefix1.5-, IE8- undefined , others number

这本质上是ES3没有提过的细节, 我个人认为是一种疏漏. 因为 打印undefined才是符合我们直觉,并期待的结果. 而ES5,仍然没有明确提到标识符查找到global后.如何. 但相对ES3,的global object,却补充了这样一段相关的话:

The values of the [[Prototype]] and [[Class]] internal properties of the global object are implementation-dependent . 显然.按照结果. 我们有符合ES的推测是.大部分浏览器的global.[[Prototype]] = Object.prototype

我们测试下即可 :  alert(Object.prototype.isPrototypeOf(window)) .  这至少说明在非IE8- 中,  Object.prototype在window的原型链上.

但这些都不是我们关心的,我们真正关心的是ES应该明确指出 标识符查找过程.到global是否应该中断,而不要去global的原型链上去找. 这是我认为的javascript的一大败笔

但是将来是否能改进呢?
     现在看起来希望不大, 因为似乎IE9+ 和其他那些浏览器,都把很多宿主方法 挂在DOMWindow的原型上了, 当前window对象访问那些宿主方法都是原型上访问的..所以理论上,这些浏览器里:
     alert(123) ; 发生的标识符alert的查找，是找到原型链上的..如果把这种机制干掉. 那alert 这些东西,就要放到global(may be window)实例上去,而不是window原型上. 否则 alert(123) 就会抛出异常,除非我们使用window.alert(123) .这显然也不合理.
     所以.改动的成本也是很大的..涉及到浏览器DOM BOM 和 ES的桥接模型的改变..... 哎.一声叹息...
     BE自己也承认此处，是当初的设计失误.
     好消息是 : es-discuss有讨论这个问题。基本上好像是决定不遍历prototype。然后改webIDL让那些属性都打平到每个接口上。
 
 
 关于缓存

在开始之前,不得不提到  "web 缓存".如果您对它有充分理解，请直接跳过.
　　我们可以简单的理解下什么是资源文件的缓存,  比如一个页面中引入了一个脚本 a.js ,这个文件的内容可能不会经常变化. 所以每次打开这个页面, 如果都去服务器端加载这个脚本,而它又没有任何变化，就会显得很多余.浪费带宽和时间. 所以浏览器可以把一些不常改变的东西,做本地缓存,即,当我再次打开这个页面时,使用的a.js,不再通过网络,去服务器下载,而是直接使用浏览器缓存的副本. 一般我们称这种资源为"静态资源". 我们可以借助HTTP协议，通过一些缓存控制头域和配套的缓存控制指令,来告知浏览器.某个文件,你可以缓存多久, 在这个允许的时间范围内,你无须到服务器下载,而可以直接使用你的缓存副本.  有趣的是, 类似的缓存机制,不仅仅浏览器具备,充斥在整个网络中的一些代理服务器,也有相似的功能.所以我们称这种代理服务器为 "缓存代理服务器" .
　　你可以把浏览器,缓存代理,服务器原站,想象成这样子:
　　　　浏览器 : 你的学习笔记 
　　　　缓存代理: 你的学习成绩优异的同桌同学 A
　　　　原始服务器: 你的老师.
　　当你遇到一个,老师曾经教过，但是被你遗忘的问题,你就先去问了同学A ,他说:"这个问题我会,我告诉你". 然后你再把答案记在自己的学习笔记上. 下次再遇到这个问题,你就无需再问.你只要看看自己的学习笔记就行了.  这个过程,就是缓存代理的作用,当缓存代理有a.js的副本,并且确认这个副本没有过期时,就会把副本直接作为响应返回给浏览器. 然后浏览器再把响应作为副本,自己缓存起来. 
　　 假如同学 A 也不知道这个问题的答案,我们看看会发生什么.  他为了面子,就对你说:"稍等下,我要上个厕所,回来告诉你." . 然后这货，跑到老师那边,得到了答案.记在他自己的笔记上.然后又跑回来,把答案告诉了你.  这就是缓存代理的回源过程.缓存代理，自己没有副本,或者确认副本过期了以后,就会这样做.
　　 假如有一天,教育局更改了教材,发现那个问题的答案,其实一直有需要改进的地方. 又怎么办呢. 老实会紧急在课堂说对所有的同学们说:"对于问题A,老的答案可能有些问题,现在我们来重新学习一下这个问题....." . 然后同学们会如何呢? 会重新记一份笔记.把新的答案记下来.
　　后来,老师发现,来问问题的同学越来越多,严重耽误了他干别的事情, 他决定请一个助教,专门来应对来问问题的同学们.他把常见问题的答案都告诉给这个助教.让他在教研室门口,拦住所有来问问题的学生,并把他们想要的答案,告知他们. 这位助教扮演的角色,就是我们耳熟能详的"反向代理",又因为他也有一份答案保留.并不是每次都代替学生来问问题.所以，它也是缓存代理. 而反向代理和非反向代理的区别,就是, 同学A,是你主动去问的. 而助教是被动存在的.他是老师安排的. 所以从你的角度来说,助教就是反向代理.因为他是服务提供者安排并控制的.
　　
　　再后来,由于教委的人抽风,经常要更新答案. 无论是同学,还是老师,都有些崩溃. 同学也发现,刚从其他同学 或助教那里得来的答案,往往和老师去教委开会后,获得的最新答案有出入. 有些细心的学生,逐渐开始不信任别的同学,甚至是助教的答案.他每次像问问题,被助教拦和其他同学拦下来时,都会大喊一句:"别想糊弄我,你给我去问老师". 迫于淫威,他们可能就真的不自作主张的把自己的答案告诉你.而去很抱歉的,打扰老师了. 这是一种传递性的情况. 也是我们后面要经常提到的 端对端重载的概念..  但是现实和理想总是有些偏差,  你对同学A发威, 同学A买账了.结果他对拦在门口的助教说,这个问题，我们想知道老师怎么说.但是助教可能并不买账.因为老师交代过他.任何问题,你都别来烦我.直接把你的答案给他们就是了... 所以.往往你还是拿不到最新的答案. 这就是协议的遵守和违约. 有时候违约并不是单向的. 比如同学A,他很有自信,他为了不没事就往办公室跑. 即使老师交代他, 某个问题的答案最近可能有改动.如果明天有同学还问你某个问题.你一定要来我这里确认一下,拿到新的内容在做答复. 但是同学A,完全没当一回事,自作主张的把自己的答案直接交给了 来问的同学.并且还骗他说,这就是最新的.相信我吧... 这种人,就是我们后面可能要提到的,ISP,或一些内网的 流氓缓存代理所干的肮脏勾当.
　
 
　　前面的比喻，可能并不是特别恰当.但是基本上能说清楚这个过程了. 
　　然后,我建议你可以详细的看看这个链接里的内容 :  http://www.cnblogs.com/_franky/archive/2011/11/23/2260109.html
　　看完后，我们来提一下几个Http1.1 的Cache-Control头域的重要的伪指令, 你可以把这些指令看做是,老师的承诺,比如老师说,这个答案大家可以放心.在半年内,是不会有什么变化的. 指令也可以是学生发出的.比如学生对助教说, 你滚蛋,我要老师那里最新的答案.. 
　　如果,你看过我上面给出的链接的全部内容,那么下面这几个伪指令,你就不会陌生 : 
　　　　1. max-age = x (单位秒)  缓存新鲜期.对所有代理有效,包括用户代理(也就是我们的浏览器)
　　　　2. s-maxage = x (单位秒) 缓存的新鲜期,仅对缓存代理有效(不包括我们的浏览器)
　　　　3. no-cache  请求头中出现这个是告知缓存代理不要拿你的缓存副本来骗我,请你回源.  说白了就是,我的期望是,服务器端直接返回给我一个最新鲜的版本.(对应名词:端对端重载)
　　
　　请记住这几个东西,我们会在稍后的地方详细讲解对他们的使用.  现在，我们开始讲讲,我们到底要解决什么问题.
      
      变量实例化(Variable Instantiation):(初始化执行环境阶段)
     每个执行环境都有一个相关联的变量对象(variable object).用来维护变量和函数的声明的标识符. 他们被当做变量对象的属性(property),添加到该对象上. 对于函数执行环境来说,形式参数也同变量声明一样被当做属性,添加到该对象上.
     什么对象被当做变量对象来使用，以及该对象相关属性具备哪些特性.是由可执行代码的类型决定的.
          .对于函数代码(function code) :
               对于每个形参来说,同样会在变量对象上创建一个属性名与形参名（标识符）相同的属性. 这些属性的特性同样由代码类型决定. 这些参数的值由函数调用者提供. 
               如果函数调用者,提供的实参数量少于形参数量,余下的形参的值就是undefined.
               如果有两个或多个形参同名,则由最后一个使用此名的形参对应的实参,向变量对象对应属性提供值,如果无对应实参,则对应属性值为undefined.（即该形参的值为undefined）.

          .对于代码中的每个函数声明(FunctionDeclaration)语句来说 : 
               按照源码文本的顺序,以函数标识符（函数名）作为属性名,来建立对应变量对象的属.性.并把同时创建的函数对象作为该属性的值. 这些属性的特性由代码类型决定.
               如果变量对象已经具备一个同名的属性,则覆盖掉原来的.
               出于语义化的考量, 这个步骤必须在形式参数列表对象(本意应该是指,对应形参标识符的 变量对象的属性创建过程)创建之后. (注1)


          .对于代码中的每个变量声明语句,或语句中不包含 in 运算符的变量声明来说 :(For each VariableDeclaration or VariableDeclarationNoIn in the code)(注2)
               根据变量标识符(变量名) ,为变量对象创建对应的属性.属性值为 undefined. 这些属性的特性由代码的类型决定.
               如果变量对象已经具备一个同变量标识符同名的属性,则该属性不做任何改变.包括特性.
     所以,如果一个声明的变量名和一个函数名或者形参重名，那么这个变量的声明并不影响变量对象已经存在的对应属性以及该属性的特性.(这一点和函数名相反.)
     (即特指函数声明和形参的优先级,高于变量声明 . 根据,函数声明语句的说明，我们得出 函数声明 > 形参 > 变量声明的结论)
绑定形参 -> 形参赋值 -> 绑定函数 -> 函数赋值 -> ([如果没有arguments绑定] 绑定arguments -> arguments则赋值) -> 绑定变量
补充两注释:

今天在QW交流群里看到有同学讨论使数组随机化的问题，其中给出的算法很不错，让我想起了之前自己实现过的不怎么“漂亮”的方法。想想我们有时候在繁忙的写业务代码时只是为了实现其功能，并未花太大心思去思考是否有更好的实现方法。

就这个数组问题(随即排序一个数组里的值，返回一个新数组)来说，我以前的实现方法是这样的：


function randArr(arr) {
    var ret = [],
    obj = {},
    i = arr.length,
    l = i,
    n;

    while (--i >= 0) {
        n = Math.floor( Math.random() * l );
        if (obj[n] === void 0) {
            ret[ret.length] = obj[n] = arr[n];
        } else {
            i++;
        }
    }
    return ret;
}

上面的代码会工作，但并不是一个好的算法，它打算执行“原数组的长度”次循环，每一次循环会随机取一个原数组中的索引，然后判断该索引是否已被取过，如果没有则把该索引的值放入新数组中，如果取过则把自减键 i 自增1（目的是重复该次循环直到取到另一个未取过的索引）。这样的方法的性能是很看人品的，原因相信看到这种思路的同学都已明白了。

现在给出群里那位同学的算法：


function randArr(arr) {
    var ret = [],
    i = arr.length,
    n;
    arr = arr.slice(0);

    while (--i >= 0) {
        n = Math.floor( Math.random() * i);
        ret[ret.length] = arr.splice(n, 1)[0];
    }
    return ret;
}

这是一个相当巧妙的算法，在每次循环中取一个随机的索引后，并把它的值从数组中删除，这样，如果后面依然随机取到这个索引，这个索引就已经不再是上一次取到的值了，而且随机数的取值范围会根据数组的长度的减小而减小，这样就能一次性循环一定的次数而得到理想的结果。

还看到了一个改进版的，是考虑到了对数组的删除操作而导致的些许性能问题，运用了JK大的洗牌算法，即把每一次删除操作改为了位置替换操作(取到的该索引的值和当前自减键 i 对应的值进行互换)，这样对整个数组的影响是最小的，还是放代码吧：


function randArr(arr) {
    var ret = [],
    i = arr.length,
    n;
    arr = arr.slice(0);

    while (--i >= 0) {
        n = Math.floor( Math.random() * i);
        ret[ret.length] = arr[n];
        arr[n] = arr[i];
    }
    return ret;
}

最后给出一个“创建值为min~max间的随机数组”的方法,算法原理同上面的差不多：


function makeRandArr(min, max) {
    var ret = [],
    obj = {},
    n;

    for (; max >= min; max--) {
        n = Math.ceil( Math.random() * (max - min) ) + min;
        ret[ret.length] = obj[n] || n;
        obj[n] = obj[max] || max;
    }

    return ret;
}


是的
GZhang<otakustay@gmail.com> 15:31:18
然后在with里面，你用eval弄个函数定义，再用eval弄个函数表达式
一丝(一淘)(50167214) 15:31:23
 我不淹没你，我阉割你
GZhang<otakustay@gmail.com> 15:31:25
然后他们的执行结果，这个你很容易构造出来
GZhang<otakustay@gmail.com> 15:31:34
所有浏览器，都和标准不一样
GZhang<otakustay@gmail.com> 15:31:39
你妹打不开邮箱！
一丝(一淘)(50167214) 15:31:42
JS 敞开的说
winter(shaofeic)<csf178@163.com> 15:31:53
 灰酱又威武了
 
GZhang<otakustay@gmail.com> 15:32:21
只有eval才能让函数表达式延迟出现，只有with和catch能构造出VE和LE不同的情况
winter(shaofeic)<csf178@163.com> 15:32:43
 灰酱试试看catch
 
GZhang<otakustay@gmail.com> 15:33:00
试了，一个结果
winter(shaofeic)<csf178@163.com> 15:33:38
赞哦
 
kennyluck<kennyluckco@gmail.com> 15:33:53
求解惑，所以規範是哪裡要改，假如要符合實現的話？
GZhang<otakustay@gmail.com> 15:33:56
var x = 1;
try { throw new Error(); }
catch (x) {
eval('function a(){alert(x)}')
eval('var b = function(){alert(x)}')
}
a();
b();

winter(shaofeic)<csf178@163.com> 15:34:39
好棒 
GZhang<otakustay@gmail.com> 15:34:45
13章
Function Expression的production过程
Pass in the LexicalEnvironment
改成
VariableEnvironment
一丝(一淘)(50167214) 15:34:58
真棒！
GZhang<otakustay@gmail.com> 15:35:00
哦不是，是Function Definition改，说反了
GZhang<otakustay@gmail.com> 15:35:19
13章
Function Definition的production过程
Pass in the VariableEnvironment
改成
LexicalEnvironment
winter(shaofeic)<csf178@163.com> 15:35:30
所以你要给es discuss发信？ 
GZhang<otakustay@gmail.com> 15:35:54
我发信想问问，为什么设计上Definition用VE，Expression用LE，出于什么考虑
qMi(525663423) 15:44:01
LexicalEnvironment就是那个让我容易走神的词
qMi(525663423) 15:44:09
你上次分享的时候，前面我思路都跟得上
qMi(525663423) 15:44:17
到这里以后，我就彻底走神了
GZhang<otakustay@gmail.com> 15:44:29
这词太高深了，词法……
GZhang<otakustay@gmail.com> 15:45:41
行，具体的内容发到中文兴趣小组了
kennyluck<kennyluckco@gmail.com> 15:53:48
 
kennyluck<kennyluckco@gmail.com> 15:53:58
努力理解中…
winter(shaofeic)<csf178@163.com> 16:10:03
LE和VE缩写比较好
 
winter(shaofeic)<csf178@163.com> 16:10:08
太长了 
GZhang<otakustay@gmail.com> 16:10:18
好吧，果然是缩写好
winter(shaofeic)<csf178@163.com> 16:10:34
或者 LexicalE9t 
winter(shaofeic)<csf178@163.com> 16:10:42
VariableE9t 
winter(shaofeic)<csf178@163.com> 16:11:00
说起来我刚刚入了 a11y.org.cn啊 哈哈哈 
GZhang<otakustay@gmail.com> 16:11:26
- -
Ray.Lei(81783959) 16:13:33
ally?
Ray.Lei(81783959) 16:13:38
这是什么？
一丝(一淘)(50167214) 16:13:58
 
winter(shaofeic)<csf178@163.com> 16:14:10
accessbility 
一丝(一淘)(50167214) 16:14:29
《中国无障碍联盟》
winter(shaofeic)<csf178@163.com> 16:14:57
在黄老师和黄老师的关照下 
winter(shaofeic)<csf178@163.com> 16:15:17
我指stone君和梅大大 以及我司的小马大大等人的关注下 
一丝(一淘)(50167214) 16:15:23
还有程老湿
JUSTICE(33841623) 16:11:52
还有一老师
winter(shaofeic)<csf178@163.com> 16:15:34
由一丝等同学努力成立的组织 
winter(shaofeic)<csf178@163.com> 16:15:44
还没成立完 
winter(shaofeic)<csf178@163.com> 16:15:49
努力成立中 
winter(shaofeic)<csf178@163.com> 16:15:56
持续成立中 
一丝(一淘)(50167214) 16:16:00
winter 你这是赤裸裸的广告
winter(shaofeic)<csf178@163.com> 16:16:20
说回VE和LE的问题 
winter(shaofeic)<csf178@163.com> 16:16:26
想想咋普及吧 
GZhang<otakustay@gmail.com> 16:16:36
就叫LE和VE啊
winter(shaofeic)<csf178@163.com> 16:16:46
还有AO 
winter(shaofeic)<csf178@163.com> 16:17:01
完全讲不明白 
winter(shaofeic)<csf178@163.com> 16:17:02
确实我从来没讲明白过这俩玩意 
GZhang<otakustay@gmail.com> 16:17:12
没讲明白过+1
教主Franky(449666) 16:19:02
所以我就说ES3好么.
教主Franky(449666) 16:19:06
这部分
一丝(一淘)(50167214) 16:19:15
a11y 好容易看成 ally
kennyluck<kennyluckco@gmail.com> 16:22:39
GZhang:  15:32:21
只有eval才能让函数表达式延迟出现，只有with和catch能构造出VE和LE不同的情况

你這是說函數宣告嗎？函數表達式不是本來就會延遲出現？
所以你的例子我沒弄錯的話，應該是和 

 function test() {
        var x = 1;
        var o = { x: 2 };
        with (o) {
            eval('function foo() { console.log(x); }');
            var bar = function() { console.log(x); };
        }
        foo();
        bar();
    }
    test();

沒有分別對吧？（學習中，請不要計較）
教主Franky(449666) 16:28:53
为啥函数表达式 和 函数定义 来分类的?
教主Franky(449666) 16:29:08
不是 函数声明 和 函数表达式  属于两种函数定义的方式么?
GZhang<otakustay@gmail.com> 16:29:10
对，没区别
kennyluck<kennyluckco@gmail.com> 16:29:09
s/請不要計較/請指點/
GZhang<otakustay@gmail.com> 16:29:24
好吧，教主你是叫函数声明的
GZhang<otakustay@gmail.com> 16:29:27
我是叫它函数定义的- -
教主Franky(449666) 16:29:33
不对啊 
GZhang<otakustay@gmail.com> 16:29:44
function definition嘛，定义……
教主Franky(449666) 16:29:53
function definition  是某章节标题吧?
GZhang<otakustay@gmail.com> 16:30:17
好吧，TMD我脑子坏掉了
GZhang<otakustay@gmail.com> 16:30:21
那东西叫function declaration
教主Franky(449666) 16:31:38
 额 
kennyluck<kennyluckco@gmail.com> 16:32:05
嗯，反正我終於比較了解這個神奇的問題了… 雖然我也不懂 VE/LE…
树残由尔□(180669793) 16:32:23
好牛
GZhang<otakustay@gmail.com> 16:33:25
教主也看看这问题？
教主Franky(449666) 16:33:45
嗯 看看
GZhang<otakustay@gmail.com> 16:34:13
我就发中文兴趣小组了，其实对平时开发完全没影响就是觉得有趣
教主Franky(449666) 16:35:38
我去看下你说的
bird(jzoo)<zjcli@vip.qq.com> 16:37:28
灰哥 920用的怎么样 还想要wp手机
GZhang<otakustay@gmail.com> 16:37:44
很不错，应用不多，你要是想玩游戏啥的就放弃
GZhang<otakustay@gmail.com> 16:37:52
另外会死机，会重启，有很多奇怪的小问题
bird(jzoo)<zjcli@vip.qq.com> 16:37:57
。。
bird(jzoo)<zjcli@vip.qq.com> 16:38:09
好稀罕metro的界面
GZhang<otakustay@gmail.com> 16:38:18
确实，非常舒服
摸掰心晴大大(79194034) 16:38:25
我觉得VE和LE的区别 可能就是LE是需要另外解析的
bird(jzoo)<zjcli@vip.qq.com> 16:38:32
简单 
GZhang<otakustay@gmail.com> 16:38:45
为啥LE需要解析……
GZhang<otakustay@gmail.com> 16:38:55
不都是从EC里拿么- -
教主Franky(449666) 16:39:10
hotmail打不开呢. 等会吧 擦
摸掰心晴大大(79194034) 16:39:16
我没读过规范 只是猜测。。
GZhang<otakustay@gmail.com> 16:39:23
你用outlook.com打开会更快- -
abcd(1730956117) 16:40:48
不懂ve、le
Hodor(331492653) 16:40:46
winter大，你的ecmascript.cn有一些小错漏
bird(jzoo)<zjcli@vip.qq.com> 16:40:56
今天刚看到nokia 920 宣传片， 照相功能是亮点
GZhang<otakustay@gmail.com> 16:41:14
照相在白天是准2流水平，在晚上是超1流水平，你做好心理准备
abcd(1730956117) 16:41:24
哈哈
bird(jzoo)<zjcli@vip.qq.com> 16:41:34
这是为啥
bird(jzoo)<zjcli@vip.qq.com> 16:43:27
灰哥居然用黄色啊 口味好重的样子~~ 
GZhang<otakustay@gmail.com> 16:43:48
亮骚啊
bird(jzoo)<zjcli@vip.qq.com> 16:44:00
+1 
GZhang<otakustay@gmail.com> 16:44:14
920的镜头强在2.0的大光圈和防抖所以晚上进光亮大，但白天大家都不担心进光量的时候，2.0就拖累画质了
bird(jzoo)<zjcli@vip.qq.com> 16:44:21
坐等降价
bird(jzoo)<zjcli@vip.qq.com> 16:45:06
你在哪里买的 能给我看看吗
bird(jzoo)<zjcli@vip.qq.com> 16:45:12
链接
GZhang<otakustay@gmail.com> 16:46:16
http://item.taobao.com/item.htm?spm=a1z09.5.0.43.TnNH7d&id=17335199141
AKI(470378842) 16:53:56
- -之前看过一个评测。。。还好吧
AKI(470378842) 16:54:09
夜间确实很nb
GZhang<otakustay@gmail.com> 16:54:37
夜间是条龙，白天是只虫
GZhang<otakustay@gmail.com> 16:54:52
以上来自一个玩了5年单反的人的亲身体验
bird(jzoo)<zjcli@vip.qq.com> 16:55:27
 
教主Franky(449666) 16:58:41
看完了
教主Franky(449666) 16:58:43
在`with`语句里面，会有一个新的**LexicalEnvironment**产生（是个object environment），而**VariableEnvironment**保持不变，这个新的**LexicalEnvironment**就叫它`innerEnv`。
教主Franky(449666) 16:58:49
这个说法有待商榷吧
教主Franky(449666) 16:59:14
 eval里会创建 新的词法环境 只有严格模式啊>?
GZhang<otakustay@gmail.com> 16:59:42
with会创建啊，和eval无关
教主Franky(449666) 16:59:43
额 我看漏了 说的是with
教主Franky(449666) 16:59:45
shit
教主Franky(449666) 16:59:48
我继续
GZhang<otakustay@gmail.com> 16:59:50
eval只会共享外层的……
摸掰心晴大大(79194034) 17:01:18
我看到的解释是这个
摸掰心晴大大(79194034) 17:03:30
会产生新scope的就认为是LexicalEnvironment @Frank 大大？
bird(jzoo)<zjcli@vip.qq.com> 17:04:20
我认为LE = copy（VE） 不过with，catch会改变LE吧
GZhang<otakustay@gmail.com> 17:04:29
不一定，也有可能是VariableEnvironment，比如进一个函数的时候……
GZhang<otakustay@gmail.com> 17:04:34
LE = reference(VE)，不是copy
bird(jzoo)<zjcli@vip.qq.com> 17:04:42
嗯 对
bird(jzoo)<zjcli@vip.qq.com> 17:04:54
咦
bird(jzoo)<zjcli@vip.qq.com> 17:05:19
既然是引用，岂不是LE 变了 VE也变？
GZhang<otakustay@gmail.com> 17:05:35
no
GZhang<otakustay@gmail.com> 17:05:48
var a = {};
var b  =a;
a = 3;
b不会变
winter(shaofeic)<csf178@163.com> 17:05:56
LE和VE有可能有 共同的"核" 
winter(shaofeic)<csf178@163.com> 17:06:08
通常它们公用VO为自己的核 
winter(shaofeic)<csf178@163.com> 17:06:27
但是with里面 LE的"核"变了 
winter(shaofeic)<csf178@163.com> 17:06:30
不再是VO了 
bird(jzoo)<zjcli@vip.qq.com> 17:07:20
。。 还真是
教主Franky(449666) 17:08:33
看完了
教主Franky(449666) 17:08:38
似乎标准没错啊
教主Franky(449666) 17:09:39
with创建一个新的词法环境, 这个此法环境又使用一个新的 对象环境记录 
教主Franky(449666) 17:10:05
然后都是2 不是对的么?
GZhang<otakustay@gmail.com> 17:10:43
with有了一个新的词法环境
GZhang<otakustay@gmail.com> 17:11:14
然后问题就在于，函数声明用的是外层的变量环境，函数表达式用的是外层的词法环境
那么理论上，这2个函数的[[Scope]]是不一样的，取到的x也应该不一样
是这样的么？
教主Franky(449666) 17:12:19
哦 我终于懂了你的意思
教主Franky(449666) 17:12:28
我去翻下原文
摸掰心晴大大(79194034) 17:16:58
var foo = "abc";
    with({ foo: "bar" }) {
       function f() {
           console.log(foo);
       }
       f();
    }
这个例子吧？
摸掰心晴大大(79194034) 17:17:29
看到说spidermonkey返还bar，V8返回abc
摸掰心晴大大(79194034) 17:17:39
V8更接近规范
GZhang<otakustay@gmail.com> 17:17:42
这个例子没用，因为函数声明会被提前，所以肯定返回'abc'才对
GZhang<otakustay@gmail.com> 17:17:55
FF是BUG（他自己说是feature），叫conditional function declaration
教主Franky(449666) 17:18:47
看完了
教主Franky(449666) 17:19:18
FF 不用看的
bird(jzoo)<zjcli@vip.qq.com> 17:19:26
var a = 10;
 
// FD
function foo() {
  console.log(a);
}
 
with ({a: 20}) {
 
  // FE
  var bar = function () {
    console.log(a);
  };
 
  foo(); // 10 VE
  bar(); // 20 LE
 
}
 
foo(); // 10
bar(); // 20
教主Franky(449666) 17:19:26
他多了一个语法 所以不考虑
教主Franky(449666) 17:19:37
阿灰你的问题我完全 catch到了
GZhang<otakustay@gmail.com> 17:19:53
这个问题描述应该是正确的吧……我想了N久
abcd(1730956117) 17:20:03
纠结这个干嘛，就是说不清的东西
GZhang<otakustay@gmail.com> 17:20:06
别说得我的问题是个Error一样catch住啊- -
教主Franky(449666) 17:20:26
我觉得这个问题 应该在于 with 没说 它的变量环境是同自己新造的 词法环境  还是用它外层的?
abcd(1730956117) 17:20:54
var foo = "abc";
    with({ foo: "bar" }) {
       function f() {
           console.log(foo);
       }
       f();
    }
GZhang<otakustay@gmail.com> 17:20:58
with显然用外层的啊，不然var就不能在entering function code的时候扫描了……
abcd(1730956117) 17:21:02
这个照ecma标准看，是语法错误
GZhang<otakustay@gmail.com> 17:21:16
怎么就是语法错误了……
abcd(1730956117) 17:21:29
with块内出现了函数声明
abcd(1730956117) 17:21:36
只允许语句
教主Franky(449666) 17:22:14
啥时候有这条规定的?
教主Franky(449666) 17:22:22
我咋没看到过.
GZhang<otakustay@gmail.com> 17:22:21
 
教主Franky(449666) 17:22:44
完全没问题啊
教主Franky(449666) 17:22:54
它是一个 block statement 里面出现啥都行啊
GZhang<otakustay@gmail.com> 17:23:26
 
abcd(1730956117) 17:23:25
 
GZhang<otakustay@gmail.com> 17:23:31
 
abcd(1730956117) 17:23:56
 
GZhang<otakustay@gmail.com> 17:23:57
除非你说block里面不能有function存在
abcd(1730956117) 17:24:27
 
教主Franky(449666) 17:24:35
...
GZhang<otakustay@gmail.com> 17:24:57
但是statement里也不包含function expression，何解呢
winter(shaofeic)<csf178@163.com> 17:25:18
灰酱你这个就不对了 
winter(shaofeic)<csf178@163.com> 17:25:32
问题在eval的代码可没说不能包含声明啊 
winter(shaofeic)<csf178@163.com> 17:25:45
eval的意思 不是"原地执行代码" 
GZhang<otakustay@gmail.com> 17:25:45
嗯，eval肯定可以
哦 这样啊  
winter(shaofeic)<csf178@163.com> 17:26:21
好吧  
abcd(1730956117) 17:26:26
？ 
winter(shaofeic)<csf178@163.com> 17:26:28
话题变了 我没注意 囧  
教主Franky(449666) 17:26:30
乱套了啊 
GZhang<otakustay@gmail.com> 17:26:32
关于if之类的里面出现函数声明是不是符合语法 
GZhang<otakustay@gmail.com> 17:26:36
我现在也觉得似乎不符合 
winter(shaofeic)<csf178@163.com> 17:26:37
abcd的代码是语法错误  
abcd(1730956117) 17:26:49
虽然浏览器都允许 
winter(shaofeic)<csf178@163.com> 17:26:50
但是因为IE这个傻鸟浏览器支持了  
abcd(1730956117) 17:26:53
但不符合ecma 
winter(shaofeic)<csf178@163.com> 17:27:01
所以大家都不得不抄来  
abcd(1730956117) 17:27:05
这种sb写法，不要用 
winter(shaofeic)<csf178@163.com> 17:27:19
嗯 +1  
GZhang<otakustay@gmail.com> 17:27:58
不要用是一方面，但这个群似乎可以在实践之外，标准层面来谈谈问题？ 
教主Franky(449666) 17:28:08
嗯 abcd 是对的 
abcd(1730956117) 17:28:10
这个不标准 
教主Franky(449666) 17:28:22
根据产生式来看 确实  with 里不能出现函数声明.. 
GZhang<otakustay@gmail.com> 17:28:36
但是用eval放在那，也不能出现吗？ 
GZhang<otakustay@gmail.com> 17:28:45
用eval又不可能搞成语法错误来 
abcd(1730956117) 17:28:49
eval，就不好说了 
教主Franky(449666) 17:28:53
eval 肯定没问题啊 
abcd(1730956117) 17:28:54
但是很怪 
GZhang<otakustay@gmail.com> 17:29:00
嗯，超怪 
教主Franky(449666) 17:29:01
eval里面出现啥都可以的 
GZhang<otakustay@gmail.com> 17:29:05
我觉得这种怪问题很有趣啊 
教主Franky(449666) 17:29:09
因为它是单独 词法 语法分析的 
教主Franky(449666) 17:29:16
所以和你的问题不冲突吧 
教主Franky(449666) 17:29:18
和你的问题 
教主Franky(449666) 17:29:25
你的问题 我catch到了 
GZhang<otakustay@gmail.com> 17:29:40
嗯 
教主Franky(449666) 17:29:40
但是建议把邮件里函数声明改成表达式 
GZhang<otakustay@gmail.com> 17:29:48
邮件已经发了TQT 
教主Franky(449666) 17:29:48
额 擦 说错了 我也糊涂了 
教主Franky(449666) 17:29:55
吧函数定义改成函数声明... 
教主Franky(449666) 17:29:56
嗯 
GZhang<otakustay@gmail.com> 17:30:19
教主怎么看这问题，浏览器全错还是标准没必要这么搞？ 
教主Franky(449666) 17:30:33
你的问题我没法回答. 
教主Franky(449666) 17:30:42
我们只能根据直觉去看哪个更合理 
abcd(1730956117) 17:31:07
有问题的地方多了，没必要去碰 
GZhang<otakustay@gmail.com> 17:31:19
嗯，我的直觉是浏览器的实现很正常…… 
GZhang<otakustay@gmail.com> 17:31:35
而且利于优化，比如词法环境的扁平化 
GZhang<otakustay@gmail.com> 17:31:53
要是特么扁平完了，碰到个函数定义还得展开来把上级的挖出来…… 
教主Franky(449666) 17:32:38
这里浏览器实现的很一致的话, 我有怀疑我们哪里理解有误差 
abcd(1730956117) 17:32:59
不用eval、with、Function，才能扁平化 
教主Franky(449666) 17:33:08
我一直很讨厌 ES5的这部分内容 就是因为有些情况我不确定我理解的是正确的  太绕了 
教主Franky(449666) 17:33:48
抽根烟, 容我三思 
GZhang<otakustay@gmail.com> 17:34:16
确实要三思- -用ES3解释一次也行，但还是这问题 
教主Franky(449666) 17:39:25
ES3 解释不了的 
教主Franky(449666) 17:39:34
它关于这个细节的定义是空白的 
bird(jzoo)<zjcli@vip.qq.com> 17:39:36
插一句啊 你们说的扁平化是个啥子意思呀 
abcd(1730956117) 17:40:29
非扁平化，就是每一个函数内的变量都有个表，执行到一个函数的时候，会从内向外挨个找。 
abcd(1730956117) 17:40:51
如果扁平化，每一个环境的变量都可以在一个列表里找到 
abcd(1730956117) 17:40:53
不用分层了 
教主Franky(449666) 17:41:19
 就是不用作用于链查找了 
教主Franky(449666) 17:41:52
扁平化是优化, 但是ES 并不是这样定义的.它需要你去查找责任连. 但是 又额外的说. 这部分 你可以自己看着办 并不一定非要这样实现的样子 
教主Franky(449666) 17:42:03
我刚才在想的是 
bird(jzoo)<zjcli@vip.qq.com> 17:42:06
哦 那何时需要扁平化呢 是谁操心的呢 
abcd(1730956117) 17:42:23
不写js引擎，不需要关心 
bird(jzoo)<zjcli@vip.qq.com> 17:42:30
哦  
with(expression) {
    var a = 1;  
}
如果 statement里不允许 varStatement 的话 就说得通了 
教主Franky(449666) 17:42:47
但是 却是支持的
教主Franky(449666) 17:42:51
这就傻逼了
abcd(1730956117) 17:43:07
var在里面和外面，是一样的
abcd(1730956117) 17:43:20
with(expr)a=1; var a; 一样
教主Franky(449666) 17:43:33
就像阿灰说的.  with 里的 变量声明要在 with 所在执行环境 进行初始化绑定. 必然要用到 变量环境
abcd(1730956117) 17:43:53
变量，只是声明下，在这个函数内存在
abcd(1730956117) 17:44:03
就这一个作用
教主Franky(449666) 17:44:09
这就导致  with statement内不必须 沿用 其变量对象 而不是新建一个
教主Franky(449666) 17:44:53
所以 可以确定 eval 内的  变量环境 和 词法环境是两个不同的的东西了
教主Franky(449666) 17:45:03
所以可以确定 是ECMAScript 的bug 了
abcd(1730956117) 17:45:17
eval，相当于 画中画
abcd(1730956117) 17:45:33
这个肯定比较乱。 我也没管过
教主Franky(449666) 17:45:44
阿灰 给 es 写信吧 可以写了
GZhang<otakustay@gmail.com> 17:45:48
eval是个神器
abcd(1730956117) 17:46:00
我没怎么纠结过eval、with
abcd(1730956117) 17:46:08
用的时候没有不正常过
GZhang<otakustay@gmail.com> 17:46:15
我也没有不正常过啊
树残由尔□(180669793) 17:46:17
with 不是不建议用么
abcd(1730956117) 17:46:22
知道可能呢存在的坑不去踩
GZhang<otakustay@gmail.com> 17:46:26
我竟然能在正常用了这么久后，想出个不正常的案例，我太TM牛了……
树残由尔□(180669793) 17:46:43
还可以这么夸自己的
GZhang<otakustay@gmail.com> 17:46:43
什么with不建议，eval不要用，都是对新手说的
树残由尔□(180669793) 17:46:45
牛逼
树残由尔□(180669793) 17:46:50
哦
树残由尔□(180669793) 17:46:57
我是新手
winter(shaofeic)<csf178@163.com> 17:47:12
灰酱威武 
bird(jzoo)<zjcli@vip.qq.com> 17:51:30
哈哈  
树残由尔□(180669793) 17:51:51
灰大 收我为徒吧
小黄鱼--上海(510876239) 17:54:23
灰大，计子黑你
GZhang<otakustay@gmail.com> 17:54:31
黑吧，我受了
小黄鱼--上海(510876239) 17:54:44
 
教主Franky(449666) 17:56:39
一个好消息是..Opear12 的结果是俩1 
教主Franky(449666) 17:56:51
这算是惊喜么
教主Franky(449666) 17:57:56
这个消息 阿灰一定高兴了 ...
winter(shaofeic)<csf178@163.com> 17:58:03
我只是引述了灰酱的话罢了 
GZhang<otakustay@gmail.com> 17:58:09
太TM惊喜了！
教主Franky(449666) 17:58:22
Safair6 也是 俩2 
教主Franky(449666) 17:58:27
IE10 你看了没有?
教主Franky(449666) 17:59:58
IE10 也是俩2
GZhang<otakustay@gmail.com> 17:59:58
两2
GZhang<otakustay@gmail.com> 18:00:17
这世界怎么这么2呢
教主Franky(449666) 18:00:36
主要是我们没法确认是我们读错了 还是 浏览器都不按标准实现
教主Franky(449666) 18:00:45
因为实际上有更2的事情浏览器都会实现错误
教主Franky(449666) 18:00:55
我们担心的是 为啥浏览器实现的这么一致.
GZhang<otakustay@gmail.com> 18:01:40
嗯，所以最好es-discuss那个邮件能发出去
教主Franky(449666) 18:04:46
问问看吧
kennyluck<kennyluckco@gmail.com> 18:05:21
Franky:  17:28:09
嗯 abcd 是对的
abcd:  17:28:10
这个不标准

但是在 ES6 好像就標準了：

 
 
   <p>捕捉浏览器中的JS运行时错误，主要通过监听window.onerror来实现。但是对于不同的脚本执行方式以及不同的浏览器，能捕获到的信息会有区别。</p>

<p>window.onerror 讲接收3个参数：</p>

<ul>
<li>
<code>msg</code>：错误描述，比如：a is not defined</li>
<li>
<code>url</code>：出错脚本所在的url</li>
<li>
<code>lineNumber</code>：出错脚本的行数</li>
</ul><p>本文将对不同浏览器和不同的脚本执行方式进行测试，并总结这些区别。</p>

<p>首先对于脚本的执行主要有下面几种：</p>

<ul>
<li>页面内嵌的<code>&lt;script&gt;</code>，需要执行的代码在<code>&lt;script&gt;</code>标签内</li>
<li>使用<code>&lt;script src="external.js"&gt;</code>的方式引入外部脚本，脚本为同域地址</li>
<li>使用<code>&lt;script src="external.js"&gt;</code>的方式引入外部脚本，脚本为不同域地址</li>
<li>使用<code>&lt;script src="external.js"&gt;</code>的方式引入外部脚本，脚本为本地地址</li>
<li>使用eval方法来执行脚本</li>
<li>动态地创建内嵌的<code>&lt;script&gt;</code>并设置其innerHTML为需要执行的代码</li>
</ul><p>下面列一下各浏览器对与上面集中脚本执行的捕获情况（Markdown对于table的支持不是很好，我是直接在页面上copy HTML进来的，维护可以看下 <a href="https://www.evernote.com/shard/s43/sh/a36fc90e-9f72-43b5-8710-1476340d14ac/1160f515582d297f22f495924ba10d3d">https://www.evernote.com/shard/s43/sh/a36fc90e-9f72-43b5-8710-1476340d14ac/1160f515582d297f22f495924ba10d3d</a> )</p>

<h2>Chrome</h2>

<table border="1" width="100%" cellspacing="0" cellpadding="2">
<tr>
<td valign="top"><br></td>
<td valign="top">page script</td>
<td valign="top">external script ( same origin )</td>
<td valign="top">external script ( cross domain )</td>
<td valign="top">external script ( local )</td>
<td valign="top">eval</td>
<td valign="top">dynamic page script</td>
</tr>
<tr>
<td valign="top">msg</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✗（only Script error）<br>
</td>
<td valign="top">✗（only Script error）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
</tr>
<tr>
<td valign="top">url</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✗（""）<br>
</td>
<td valign="top">✗（""）<br>
</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">✓（current page）<br>
</td>
</tr>
<tr>
<td valign="top">lineNumber</td>
<td valign="top">✓（from current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✗（0）<br>
</td>
<td valign="top">✗（0）<br>
</td>
<td valign="top">✓（from code）<br>
</td>
<td valign="top">✓（from its code）<br>
</td>
</tr>
</table><h3>Firefox</h3>

<table border="1" width="100%" cellspacing="0" cellpadding="2">
<tr>
<td valign="top"><br></td>
<td valign="top">page script</td>
<td valign="top">external script ( same origin )</td>
<td valign="top">external script ( cross domain )</td>
<td valign="top">external script ( local )</td>
<td valign="top">eval</td>
<td valign="top">dynamic page script</td>
</tr>
<tr>
<td valign="top">msg</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✗（only Script error）<br>
</td>
<td valign="top">✗（only Script error）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
</tr>
<tr>
<td valign="top">url</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓（file that call this eval）<br>
</td>
<td valign="top">✓（current page）<br>
</td>
</tr>
<tr>
<td valign="top">lineNumber</td>
<td valign="top">✓（from current page））<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✗（0）<br>
</td>
<td valign="top">✗（0）<br>
</td>
<td valign="top">✓（position that calls this eval）<br>
</td>
<td valign="top">✓（from its code）<br>
</td>
</tr>
</table><h3>Safari</h3>

<table border="1" width="100%" cellspacing="0" cellpadding="2">
<tr>
<td valign="top"><br></td>
<td valign="top">page script</td>
<td valign="top">external script ( same origin )</td>
<td valign="top">external script ( cross domain )</td>
<td valign="top">external script ( local )</td>
<td valign="top">eval</td>
<td valign="top">dynamic page script</td>
</tr>
<tr>
<td valign="top">msg</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✗（only Script error）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
</tr>
<tr>
<td valign="top">url</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✗（undefined）<br>
</td>
<td valign="top">✓（current page）<br>
</td>
</tr>
<tr>
<td valign="top">lineNumber</td>
<td valign="top">✓（from current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✗（0）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓（from code）<br>
</td>
<td valign="top">✓（from its code）<br>
</td>
</tr>
</table><h3>Opera</h3>

<table border="1" width="100%" cellspacing="0" cellpadding="2">
<tr>
<td valign="top"><br></td>
<td valign="top">page script</td>
<td valign="top">external script ( same origin )</td>
<td valign="top">external script ( cross domain )</td>
<td valign="top">external script ( local )</td>
<td valign="top">eval</td>
<td valign="top">dynamic page script</td>
</tr>
<tr>
<td valign="top">msg</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✗（only Script error）<br>
</td>
<td valign="top">-</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
</tr>
<tr>
<td valign="top">url</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✗（""）<br>
</td>
<td valign="top">-</td>
<td valign="top">✗（""）<br>
</td>
<td valign="top">✓（current page）<br>
</td>
</tr>
<tr>
<td valign="top">lineNumber</td>
<td valign="top">✓（from current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✗（0）<br>
</td>
<td valign="top">-</td>
<td valign="top">✓（from code）<br>
</td>
<td valign="top">✓（from its code）<br>
</td>
</tr>
</table><h3>IE9</h3>

<table border="1" width="100%" cellspacing="0" cellpadding="2">
<tr>
<td valign="top"><br></td>
<td valign="top">page script</td>
<td valign="top">external script ( same origin )</td>
<td valign="top">external script ( cross domain )</td>
<td valign="top">external script ( local )</td>
<td valign="top">eval</td>
<td valign="top">dynamic page script</td>
</tr>
<tr>
<td valign="top">msg</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
</tr>
<tr>
<td valign="top">url</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓（file path that call this eval）<br>
</td>
<td valign="top">✓（current page）<br>
</td>
</tr>
<tr>
<td valign="top">lineNumber</td>
<td valign="top">✓（from current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓（position that calls this eval）<br>
</td>
<td valign="top">✓（from its code）<br>
</td>
</tr>
</table><h3>IE8</h3>

<table border="1" width="100%" cellspacing="0" cellpadding="2">
<tr>
<td valign="top"><br></td>
<td valign="top">page script</td>
<td valign="top">external script ( same origin )</td>
<td valign="top">external script ( cross domain )</td>
<td valign="top">external script ( local )</td>
<td valign="top">eval</td>
<td valign="top">dynamic page script（not available）</td>
</tr>
<tr>
<td valign="top">msg</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">-</td>
</tr>
<tr>
<td valign="top">url</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓（file path that call this eval）<br>
</td>
<td valign="top">-</td>
</tr>
<tr>
<td valign="top">lineNumber</td>
<td valign="top">✓（from current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓（position that calls this eval）<br>
</td>
<td valign="top">-</td>
</tr>
</table><h3>IE7</h3>

<table border="1" width="100%" cellspacing="0" cellpadding="2">
<tr>
<td valign="top"><br></td>
<td valign="top">page script</td>
<td valign="top">external script ( same origin )</td>
<td valign="top">external script ( cross domain )</td>
<td valign="top">external script ( local )</td>
<td valign="top">eval</td>
<td valign="top">dynamic page script（not available）</td>
</tr>
<tr>
<td valign="top">msg</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">-</td>
</tr>
<tr>
<td valign="top">url</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓（file path that call this eval）<br>
</td>
<td valign="top">-</td>
</tr>
<tr>
<td valign="top">lineNumber</td>
<td valign="top">✓（from current page）<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓（position that calls this eval）<br>
</td>
<td valign="top">-</td>
</tr>
</table><h3>IE6</h3>

<table border="1" width="100%" cellspacing="0" cellpadding="2">
<tr>
<td valign="top"><br></td>
<td valign="top">page script</td>
<td valign="top">external script ( same origin )</td>
<td valign="top">external script ( cross domain )</td>
<td valign="top">external script ( local )</td>
<td valign="top">eval</td>
<td valign="top">dynamic page script（not available）</td>
</tr>
<tr>
<td valign="top">msg</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">✓<br>
</td>
<td valign="top">-</td>
</tr>
<tr>
<td valign="top">url</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">✓（current page）<br>
</td>
<td valign="top">-</td>
</tr>
<tr>
<td valign="top">lineNumber</td>
<td valign="top">✓（from current page）<br>
</td>
<td valign="top">✓（line number start from 1）<br>
</td>
<td valign="top">✓（line number start from 1）<br>
</td>
<td valign="top">✓（line number start from 1）<br>
</td>
<td valign="top">✓（position that calls this eval，line number start from 1）<br>
</td>
<td valign="top">-</td>
</tr>
</table>
教主Franky(449666)  14:53:16
应该是靠谱的. 至少onload 肯定能干掉. 但是不知道声音是不是也能干掉
var ifm = document.createElement('iframe');
ifm.src = 'about:blank';
document.body.insertBefore(ifm, document.body.lastChild);
ifm.contentWindow.location.replace('javascript:;');


我测试下来, 可能 js replace 是最佳做法的样子
额 说错.  把笔记贴来看看
1. window.open 
被弹出页面,IE全系,不会带有refer.非ie 带有当前页面地址作为 refer .

2.一个页面用 <meta http-equiv="refresh" content="0;url=redirect url">
跳转. 则IE,FF 不会带有refer .     chrome, opera, safari则会带有. 另外值得一提的是,ie6,7 使用meta 跳转.会留有历史记录, 这一点和其他浏览器有重要区别. IE8+改进了这个行为.


3.swf 弹窗:
    ie : refer 为swf的url
    ff : 无refer .
    webkit : refer 为 swf所在页面url.
教主Franky(449666)  15:50:03
不过 firefox 最近改变了 refer 的策略


教主Franky(449666)  15:52:59

另外要注意的几个问题是.  appendChild这种动态加载的脚本引入的外部脚本中如果有document.write 操作 就会有很大兼容性差异
两种场景
A: 当外部脚本写入文档流时,当前页面文档流未关闭
    除了Opera,以及早期webkit浏览器比如Safari4-,Chrome8-,Firefox3.6- , 其他浏览器都不会有写入文档流操作


B: 外部脚本写入文档流时,当前页面文档流已关闭
  除了webkit 早期版本如Safari4-, chrome8-,Firefox3.6-,Opera11-(11.6+已修正) 其他浏览器都不会写入或覆盖文档流… (这应该是浏览器做的防范措施)

这是 最近我有动态加载 cnzz统计代码需求时遇到的. 因为cnzz 的统计代码里 要doc.write 他们的logo到文档流
教主Franky(449666)  15:54:29
又因为这个渠道 是ie only .所以确定可以动态加载cnzz . 不会有被覆盖文档流的风险.   从发展角度来看 ie系一直有这种保护.其他浏览器在后期才开始改进
教主Franky(449666)  15:56:18
跟各种渠道 和代理商 交流 是见很长见识的事情.. 你根本想不到,他们能写出什么样的 js代码来
