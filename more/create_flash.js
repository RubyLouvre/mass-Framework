define(function(){
    /**
* 创建Flash对象 by 教主
*
* @param {Element} container 放置flash的容器元素
* @param {Object} info swf的相关信息
* @param {string} [params] 可选的参数
*/
    return function (container, info, params) {
        /* IE使用appendChild添加object标签是没有用的，只能用innerHTML
           在Chrome中，如果object标签前面有一个元素有background-image样式，则很有可能该object不显示
           测试代码，保存为html文件，本地Chrome打开，刷新几次会出现该现象
  <div style="background-image: url(xxx.png); width: 270px; height: 129px;"></div>
    <object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
         type="application/x-shockwave-flash"
            codebase=" http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,0,0"
            width="600"
             height="360">
         <param name="allowScriptAccess" value="always" />
         <param name="quality" value="high" />
         <param name="wmode" value="transparent" />
         <param name="movie" value=" http://imgc.zol.com.cn/small_flash_channel/donghua/20060803qrj.swf" />
         <embed wmode="transparent"
                src=" http://imgc.zol.com.cn/small_flash_channel/donghua/20060803qrj.swf"
                quality="high"
                width="600"
                height="360"
                allowscriptaccess="always"
                type="application/x-shockwave-flash"
               pluginspage=" http://www.macromedia.com/go/getflashplayer" />
     </object>
     */
        // 只有flash的话，仅使用embed是可以的
        //  http://www.w3help.org/zh-cn/causes/HO8001 参见“问题分析”的第4点和“解决方案”
        // 但是要与flash交互（javascript <-> flash相互调用），IE下就必须用object
        // XXX: 需要QA关注

        // 由于默认的交互参数是JSON格式，会有双引号，需要转义掉，以免HTML解析出错
        params = params && params.replace(/"/g, '&quot;');

        var html;
        info.id = info.id || 'sdo_beacon_flash' + ( Math.random() * 1000000 | 0);
        info.width = info.width || 1;
        info.height = info.height || 1;
        if ('classid' in document.createElement('object')) {//ie only
            // IE下必须有id属性，不然与javascript交互会报错
            //  http://drupal.org/node/319079
            html = '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" name="' + info.id+ '" ' +
            (info.id ? 'id="' + info.id + '" ' : '') +
            'width="' + info.width + '" height="' + info.height + '">' +
            '<param name="allowScriptAccess" value="always" />' +
            '<param name="quality" value="high" />' +
            '<param name="wmode" value="window" />' +
            '<param name="movie" value="' + info.src + '" />' +
            (params ? '<param name="flashvars" value="' + params + '" />' : '') +
            '</object>';

        } else {
            //style="width:1px;height:1px" 是为了保证firefox下正常工作.
            html = '<embed quality="high" wmode="window" allowScriptAccess="always" type="application/x-shockwave-flash"'+
                    'style="width:' + info.width +'px;height:' + info.height + 'px;" '+
                    'src="' + info.src + '"  name="' + info.id + '" ' + '"  id="' + info.id + '" '
                    + (params ? 'flashVars="' + params + '" ' : '')
            'width="' + info.width + '" height="' + info.height + '" ' +
            'type="application/x-shockwave-flash"/>';
        }

        container.innerHTML = html;
        return container.firstChild;
    //应注意, container必须在DOM Tree中， 否则 先更新innerHTML,后进入DOM Tree, 部分IE8可能flash无法正常显示，并工作.
    }

/** 例子
    $.createFlash(container, {
        src : url,
        width : 50,
        height : 50
    });
    */
})


/**
应注意: 如果浏览器是firefox, 有可能触发下面这个问题:
flash所在容器,或祖先节点的滚动条的可视状态改变或祖先节点的position的定位方式发生改变.
就会触发一个更高层次的重绘. 导致flash被重新创建, 导致flash发生了reload.
所以document.body, document.documentELement 或flash的容器的overflow的切换,都能触发这个bug.
xp ie6 : KB912945  2/10/2006  参考地址:  http://support.microsoft.com/kb/912945


历史问题:
最近微軟出的 patch，搞的是人仰馬翻．．．因為它讓廣告或是互動的flash變得不太好用． 看看這３個的?係.. KB912945 發佈日期： 2006/2/24 KB912812 發佈日期： 2006/4/11 KB917425 發佈日期： 2006/4/20 於是為了測試，自己去抓下了 KB912945 ，升級．．沒想到，網路上的一堆特別寫法都沒用，框框依舊存在．．狀況竟然和同事的不同（他們看類似flashObject或是把flash坎到外面是OK的．．而我依然會看到框框）．．怪了．．不該是這個狀況． 今天看到，還有一個patch 版本KB912812也有這個問題，於是把KB912945移除了，裝成KB912812，咦，所有狀況都和同事們相同了，原來公司自動升級的版本是KB912812．．但是，問題來了，當初心的是微軟會不會又出X招，讓你不管寫了什麼特殊寫法都沒用．．而KB912945，就會讓你有這個狀況．．． 沒想到誤打誤撞，竟然遇到我的問題．．． 微軟又出了一個 patch 是 KB917425，安裝後它就會停止 KB912812 的行為．但僅適用於 IE 6.0，哇哩．．． 有沒有發現這３個奇怪的問題？最簡單的方法是移除前２個patch，你就不用裝第３個patch．但你如果硬是莫名其妙被裝，那只好接受事實．．． 這到底在搞什麼？

KB947864  2008 年 4 月

包含在安全更新 912812 中的 Internet Explorer ActiveX 更新被禁用
部署用于 Internet Explorer 的更新 912945 后，包含在安全更新 912812 中的 Internet Explorer ActiveX 更新的行为将会被禁用。包含在安全更新 912812 中的安全修补程序仍然存在并起作用。只有 Internet Explorer ActiveX 更新行为被禁用。

2008年才取消这种破玩意的限制.....

其实现在可以不用js创建flash了
教主Franky(449666)  18:42:50
如果是页面固有的flash可以这样:


兼容 IOS:
<object style="outline:none" id="video_player" type="application/x-shockwave-flash" data=" http://player.ku6.com/refer/HNy8VYICR0BTOwr7/v.swf" height="400" width="500">
<!--[if lt IE 9.0]>
<param name="movie" value=" http://player.ku6.com/refer/HNy8VYICR0BTOwr7/v.swf">
<![endif]-->
<param name="quality" value="high">
<param name="allowScriptAccess" value="always">
<param name="allowFullScreen" value="true">
<param name="wMode" value="window">
<param name="swLiveConnect" value="true">
<param name="flashvars" value="img= http://i0.ku6img.com/cms/news/201104/13/891.jpg&amp;auto=1">
<video controls height="400" width="500" poster=" http://i0.ku6img.com/cms/news/201104/13/891.jpg" src=" http://v.ku6.com/fetchwebm/HNy8VYICR0BTOwr7.m3u8"></video>
</object>

教主Franky(449666)  18:43:11
简易版本: 

<OBJECT id="id_2324" name="id_2324" type="application/x-shockwave-flash" width="480" height="400" data=" http://player.ku6.com/refer/8pf0RgHjbRXRBALK/v.swf">
            <PARAM NAME="Movie" VALUE=" http://player.ku6.com/refer/8pf0RgHjbRXRBALK/v.swf">
            <PARAM NAME="AllowScriptAccess" VALUE="always">
            <PARAM NAME="AllowNetworking" VALUE="all">
</OBJECT>
教主Franky(449666)  18:43:26

非IE也可以使用: 
 <embed id="id_2324" name="id_2324" src=" http://player.ku6.com/refer/8pf0RgHjbRXRBALK/v.swf" width="480" height ="400" allowNetworking="all" allowScriptAccess="always"  type="application/x-shockwave-flash" />

*/
