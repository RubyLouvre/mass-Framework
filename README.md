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
<li>补丁模块， lang_fix.js, css_fix.js, event_fix.js, node_fix.js, attr_fix, 主要是用于兼容IE678的，在chrome1+, FF4+, opera10+, safari4+是不会加载它们的。</li>
<li>核心模块， 所有位于根目录下，但不在其子目录下的JS文件， 提供框架的核心功能。</li>
<li>外围模块， 位于more的JS文件。</li>
</ol>
<hr/>
<h3>mass Framework的源码阅读顺序</h3>
<p>都是位于src目录下，里面的子目录是外围模块。</p>
<p>mass.js -> lang.js(lang_fix.js) ->  class.js -> interact.js -> data.js -> support.js -> query.js -><br/>
 node.js(node_fix.js) -> css.js(css_fix.js) -> attr.js(attr_fix.js) -> event.js(event_fix.js) -> fx.js -> ajax.js
</p>
<p>lang, class, interact, data专注于语言层面，query, node, css, attr, event, fx, ajax专注于DOM层面。</p>
<hr/>
<h3>mass Framework的文档：</h3>
<p>它大部分文档已经转移到newland.js项目之下，我们可以在<a href="http://rubylouvre.github.com/doc/index.html">这里</a>访问得到它！</p>
<h3>mass Framework的优点：</h3>
<ol>
<li>多库共存。</li>
<li>多版本共存。</li>
<li>高度模块化，使用AMD规范的加载系统，实现并行加载，按需加载，自行处理依赖，有利于调试与最小化资源调度。(目前版本为v21)</li>
<li>interact模块提供三种组件交互的机制，$.Observer是提供观察者模块，以实现自定义事件与一般化的订阅机制；<br/>
$.Flow, 专注于流程控制与从多处获取数据，解耦回调嵌套，减少等待时间，实现多路监听，一处归化;<br/>
$.Twitter, 类似twitter的观察者模式，可以看作是事件强化版，实现单点发布 自愿收听 单向联接 分散传播
</li>
<li>强大的类工厂。（目前版本为v11）</li>
<li>AS3式的补帧动画系统，支持回放，旋转，暂停！</li>
<li>第五代选择器引擎Icarus，全面兼容CSS3高级伪类与jQuery自定义伪类的。</li>
<li>与jQuery完全兼容的事件系统，强大的事件系统机制能轻松处理动态添加的节点的事件监听问题，此外还内置对滚轮事件的支持。</li>
<li>lang_fix模块已经为您修复了旧式IE的语言BUG，与添加上ECMA262v5的绝对大多数新API的支持与，因此痛快使用 String.prototype.trim,
 Array.prototype.forEach, Array.prototype.map,Array.prototype.filter, Array.prototype.reduce,
 Function.prototype.bind吧。</li>
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
<pre>
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
</pre>
<h3>JS文件的合并</h3>
<p>请利用我的newland.js项目</p>
<h3>BUG提交与插件的友情贡献。</h3>

<p>大家在github注册后，就可以在<a href="https://github.com/RubyLouvre/mass-Framework/issues">https://github.com/RubyLouvre/mass-Framework/issues</a>里面提交建议或BUG什么了。</p>
<p>如果是想贡献力量，可以点击最上面的Fork按钮，拷贝一份作为自己的版本，然后在里面修改代码，添加插件，写完后通知我，好让我合并到主干上。</p>

<p>by 司徒正美 （zhongqincheng）</p>
<p>2011.11.15</p>
 <a href="http://www.cnblogs.com/rubylouvre/">http://www.cnblogs.com/rubylouvre/</a>
