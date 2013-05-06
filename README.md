mass Framework
==================
<h3>mass Framework的贡献者列表(排名不分先后)：</h3>
<p>abcd(1群) ,Alucelx(1群)， <a href="http://stylechen.com/">带刀</a>(1群)，sapjax(2群) ,教主Franky(2群), 一三一四君(2B群), <a href="https://github.com/riophae">riophae</a>,<br/>
    soom(5群),Hodor(5群)，小叶(3群，904591031)
</p>
<hr/>
<p>一个模块化，以大模块开发为目标，jQuery式的框架。里面优先应用了大量HTML5新API，估计除了个别手机专属框架外，没有像它如此大范围应用了。这一来可以大大减少框架的体积，二来大幅提高运行效率。<p>
<p>mass Framework的模块化经过一年化调整与改良，大致分为四类：</p>
<ol>
    <li>种子模块， mass.js，最精简的内核， 包含模块加载系统。</li>
    <li>补丁模块， lang_fix.js, css_fix.js, event_fix.js, node_fix.js, attr_fix, ajax_fix, 主要是用于兼容IE678的，在chrome1+, FF4+, opera10+, safari4+是不会加载它们的。</li>
    <li>核心模块， 所有位于根目录下，但不在其子目录下的JS文件， 提供框架的核心功能。</li>
    <li>外围模块， 位于more的JS文件。</li>
</ol>
<hr/>
<h3>mass Framework的源码阅读顺序</h3>
<p>都是位于src目录下，里面的子目录是外围模块。</p>
<p>mass.js -> lang.js(lang_fix.js) ->  class.js -> flow.js -> data.js -> support.js -> query.js -><br/>
    node.js(node_fix.js) -> css.js(css_fix.js) -> attr.js(attr_fix.js) -> event.js(event_fix.js) -> fx.js -> ajax.js(ajax_fix.js)
</p>
<p>lang, class, flow, data专注于语言层面，query, node, css, attr, event, fx, ajax专注于DOM层面。</p>
<hr/>
<h3>mass Framework的文档：</h3>
<p>它大部分文档已经转移到newland.js项目之下，我们可以在<a href="http://rubylouvre.github.com/doc/index.html">这里</a>访问得到它！</p>
<h3>mass Framework的优点：</h3>
<ol>
    <li>多库共存。</li>
    <li>多版本共存。</li>
    <li>高度模块化，使用AMD规范的加载系统，实现并行加载，按需加载，自行处理依赖，有利于调试与最小化资源调度。(目前版本为v21)</li>
    <li>flow提供自定义事件机制，$.Observer是一般化的观察者模块，</br/>
	$.Flow, 是其强化版， 专注于流程控制与从多处获取数据，解耦回调嵌套，减少等待时间，实现多路监听，一处归化;<br/>
    </li>
    <li>强大的类工厂。（目前版本为v11）</li>
    <li>AS3式的补帧动画系统，支持回放，旋转，暂停！</li>
    <li>第五代选择器引擎Icarus，全面兼容CSS3高级伪类与jQuery自定义伪类的。</li>
    <li>与jQuery完全兼容的事件系统，强大的事件系统机制能轻松处理动态添加的节点的事件监听问题，此外还内置对滚轮事件的支持。</li>
    <li>lang_fix模块已经为您修复了旧式IE的语言BUG，与添加上ECMA262v5的绝对大多数新API的支持与，因此痛快使用 String.prototype.trim,
        Array.prototype.forEach, Array.prototype.map,Array.prototype.filter, Array.prototype.reduce,
        Function.prototype.bind吧。</li>
     <li>ajax模块支持XMLHTTPRequest2.0绝对大多数功能，能在旧式IE下上传下载二进制数据。</li>
    <li>lang模块的提供语言链对象相当于把underscore.js这个库整合进来，你能想到语言扩展都有了。</li>
    <li>API 95%与jQuery神似，学习成本极低。</li>
    <li>全中文注释与大量参考链接与版本变更日志，绝对对你提高JS水平的好教程。</li>
</ol>
<h3>框架的使用：</h3>
<p style="color:red; font-weight: bold;">点击上面的ZIP按钮将框架下载回来，解压，运行里面的Sws.exe服务器。</p>
<p>一个简单的例子</p>
<pre>
require("ready",function(){
/*待到domReady完成，执行回调*/
   $.log("将日志打印到页面上",true)
})
</pre>
<p>上面的代面相当于：</p>
<pre>
require("ready,node",function(){
/*待到domReady完成，并且在node.js模块加载完毕，执行回调*/
   $("&lt;pre&gt;将日志打印到页面上&lt;/pre&gt;").appendTo("body")
})
</pre>
<p>我们在请求node.js时，会自动加载其依赖，如lang.js,support.js,class.js,query.js,data.js等等，
    IE下还会加载lang_fix.js，但你无需理会它是怎么处理，只需专注于你的业务逻辑就行了。</p>
<p>如果嫌麻烦，直接像jQuery那样，不过会把许多无用的部分都加载下来了。</p>
<pre style="color:red">

$(function(){
  $("&lt;pre&gt;将日志打印到页面上&lt;/pre&gt;").appendTo("body")
});
</pre>
<p>jQuery1.7最新的API它也支持了</p>
<pre>
$(function(){
 $("#dataTable tbody tr").on("click", function(event){
	alert($(this).text());
 });
});
</pre>

<p>相比于jQuery只限于DOM的操作，mass Framework对基本数据类型提供了大量的工具方法，甚至连es6的候选方法你都能找到。它们分别挂在$.String, $.Array, $.Number, $.Object之下。

<h3>多库共存</h3>
<pre>
&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
    &lt;head&gt;
        &lt;meta charset="utf-8"/&gt;
        &lt;title&gt;多库共存&lt;/title&gt;
        &lt;script&gt;
            var $ = {
                toString:function(){
                    return "[object jQuery]"
                }
            };//假设这是已存在的库
        &lt;/script&gt;
        &lt;script type="text/javascript" src="../mass.js" charset="UTF-8"&gt;&lt;/script&gt;
        &lt;script&gt;
            //mass的命名空间将自动改为$+它当前的版本号
            $1.require("lang",function(){
                $1.log($+"")//[object jQuery]
            })

        &lt;/script&gt;
    &lt;/head&gt;
    &lt;body&gt;
    &lt;/body&gt;
&lt;/html&gt;
</pre>
<pre>
写个框架，将自己过往的积累都沉淀下来，等到回头去看时，发现之前攻克的每一个知识点，都乖巧地排在框架里，
在你需要的时候，可以快速派上用场。这种感觉就像在组织自己的军团一样，军团中有驯服得很好的，也有个性还很浮躁的刺儿头。
你慢慢将这支军团由一盘散沙驯练成精锐部队，这感觉真好。
                                                     ——真阿当
	以前的程序员们，经常会为了做一个数据处理程序而自己开发一门编程语言。
	比如Charls Moore在美国国家天文台，做射电望远镜数据提取程序，开发了Forth。有的为了给自己写的书排版漂亮些，
	写了TeX。近的说，有人为了做网站写了Rails 和 Django。想想都不好意思称自己是程序员了。												 
</pre>
<h3>JS文件的合并</h3>
<p>使用combo.js</p>
<pre>
node.exe combo
</pre>

<h3>JS文件的合并</h3>
<p>使用compiler.jar( GCC，需要有JAVA运行环境)</p>
<pre>
java -jar compiler.jar --js mass_merge.js --js_output_file mass_min.js
java -jar compiler.jar --js avalon.js --js_output_file avalon_min.js
</pre>

<h3>BUG提交与插件的友情贡献。</h3>

<p>大家在github注册后，就可以在<a href="https://github.com/RubyLouvre/mass-Framework/issues">https://github.com/RubyLouvre/mass-Framework/issues</a>里面提交建议或BUG什么了。</p>
<p>如果是想贡献力量，可以点击最上面的Fork按钮，拷贝一份作为自己的版本，然后在里面修改代码，添加插件，写完后通知我，好让我合并到主干上。</p>

<p>by 司徒正美 （zhongqincheng）</p>
<p>2011.11.15</p>
<a href="http://www.cnblogs.com/rubylouvre/">http://www.cnblogs.com/rubylouvre/</a>
<h1>如何贡献自己的力量</h1>
<p>首先你总得有<strong>自己的github帐号</strong>吧，注册一个，非常简单，只需用户名，邮箱，密码，邮箱只是用来找回密码的，不做验证。因此注册后立即能用！比如我现在新注册一个叫JsLouvre的示范帐号。</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/1.jpg"/>
<p>然后搜索我的项目——mass Framework</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/2.jpg"/>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/3.jpg"/>
<p>第一个就是，点击进入项目，然后点上方的Fork按钮，这就拷贝一份我的项目的副本作为<strong>你自己的项目</strong></p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/4.jpg"/>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/5.jpg"/>
<p>创建成功！</P>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/6.jpg"/>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/7.jpg"/>
<p>接着就是修改代码了，这要在自己发现真的存在漏洞或有什么改进之处才要动手啊！不能想改就改。要通读你要改的那一部分，必要时通读全框架。因此新手们最好找国内高手的框架进行学习，
    一来中文注释比较亲切，二来也方便接下来的交流。通常我们在clone git到本地进行修改的，这又涉及另外一些工具与命令的学习。不过，github完全允许你在线上进行修改，提交，合并。</p>
<p>比如你发现data模块的注释与mass模块的不一样，要统一合并，将函数外的注释移到里头。（更有意义的方式是，打开<a href="http://www.jshint.com/">http://www.jshint.com/</a>，就能发现许多小问题。</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/8.jpg"/>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/9.jpg"/>
<p>变成编辑状态，不过不太好用。大家有条件一定要学学如何使用TortoiseGit或Sublime Text 2下载github项目到本地，进行修改，提交，pull request啊！</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/10.jpg"/>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/11.jpg"/>
<p>请认真写下你的修改日志，方便原框架作者查阅。</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/12.jpg"/>
<p>修改成功后的样子：</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/13.jpg"/>
<p>接着下来一步非常重要，就是提交你的修改给原作者。点击上方的pull request按钮！</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/14.jpg"/>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/15.jpg"/>
<p>红色区域为原作者的项目，你要贡献的目标；亮蓝色区域为你的项目；黑色处填写标题与必须描述；点击右下方绿区域的按扭进行提交！</p>
<hr/>
<hr/>
<p>接着下来就是框架作者的事儿了，我会在自己的项目看到你们的提交。万一以后你们有幸被别人贡献代码，也做这活儿。</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/16.jpg"/>
<p>点击中间那个大大的pull request(2)的按钮到另一页面，中间有个被鲜绿色高亮的merge pull request按钮。作者查看你的修改，觉得可以就点它进行合并。</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/17.jpg"/>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/18.jpg"/>
<p>最后你们就会在原项目上看到自己贡献的代码！</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/19.jpg"/>
<hr/>
<h1>如何让自己的项目与原作者的项目保持同步！</h1>
<p>我经常看到许多人，只会fork一次，提交过一次修改就不知怎么办了！因此原框架作者是非常勤奋的，一天会提交N次，一个星期后许多文件都改动过了，而那些代码贡献者不可能一个个跟着修改。
因此我们还是用到上方的pull request按钮。
</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/20.jpg"/>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/21.jpg"/>
<p>这次是把自己的项目放到左边，原框架作者放到右边，在选择过程中，你会发现原框架作者有许多贡献者的。这里我希望大家一定要浏览<em>Commits与Files Changed</em>进行学习!这也是github最大的价值所在！把握别人对代码的改进，最能提高我们编码水平。这里面会涉及大量的编码技巧！</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/22.jpg"/>
<p>补上必要说明，然后点击下方send pull request按钮。</p>
<p>很快你就看到评论区最下方有个鲜绿色高亮的按钮，继续点就是。</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/23.jpg"/>
<p>继续让你确认，没问题就继续点！</p>
<img src="https://raw.github.com/RubyLouvre/mass-Framework/master/course/24.jpg"/>
<p>这样就同步成功！！！！！！</p>
</fieldset>



