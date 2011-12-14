动态创建一个script可以abort掉吗
就没还没返回时。
GrayZhang-上海<otakustay@gmail.com>  15:23:31
NO
Franky-上海(449666)  15:29:47
有点办法 不太靠谱...
aoao - 杭州(2222342)  15:30:30
window.stop()????
Franky-上海(449666)  15:31:00
恩
参考代码:
document.onclick = function () {
var el = document.createElement('script'),
    h = document.getElementsByTagName('head')[0];
el.src='http://a.tbcdn.cn/??s/kissy/1.1.6/kissy-min.js,p/global/1.0/global-min.js?t=2011021520110301.js?' + Math.random();
h.appendChild(el);

//for ie

h.removeChild(el);
el = null; //此处必须.否则即使gc.也不会立刻回收el. 
window.CollectGarbage && CollectGarbage(); //此方法对 new Image().src=xxx .无效. 

//for others 非ie都支持...
window.stop && stop();
};

ie 可以把节点从DOM Tree移除,并必须 el = null ,然后必须主动触发垃圾回收. 才能abort掉请求. 但是ie9无效.  
无论是ie还是 非ie的方法,都不是特别可靠.大多数情况下是可以abort掉请求.但如果从缓存走或者请求特别快就完成.则很难说.

而经西红柿测试发现:
使用jsonp的方式发送请求，在response返回之前，remove这个script节点，
IE、FF还是会执行脚本，不依附于script节点
chrome、opera、safari并没有执行脚本,但我测试safari5,有执行.而chrome，要看是不是直接从cache中读.资源.如果是非cache.则chrome确实不执行. 
基本可以考虑为,资源加载时间神马的,貌似会影响safari的结果.



Franky-上海(449666)  15:32:14
最关键的是很危险
ie6,如果 外部脚本正在执行中， script节点被移除 并失去 句柄。 有70%的几率导致ie6崩溃
风之石 - 杭州(153720615)  15:33:15

70%的几率导致ie6崩溃
Franky-上海(449666)  15:33:21
不过好在  执行期间能移除该节点的只有该脚本自己
AKI-北京(470378842)  15:33:26
这个概率好精确。