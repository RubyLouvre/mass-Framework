mass Framework
==================
<p>一个模块化，以大模块开发为目标，jQuery式的框架。里面涉及的HTML5新API数量，估计除了纯净的手机框架外，无人能敌。<p>
<p>mass Framework的模块化经过一年化调整与改良，大致分为四类：</p>
<ol>
<li>种子模块， mass.js，最精简的内核， 包含模块加载系统。</li>
<li>补丁模块， lang_fix.js, css_fix.js，主要是用于兼容旧式IE的，在chrome1+, FF4+, opera10+, safari4+是不会加载它们的。</li>
<li>核心模块， 所有位于mass-Framework/src目录下，但不在其子目录下的JS文件， 提供框架的核心功能。</li>
<li>外围模块， 位于mass-Framework/src/more的JS文件。</li>
</ol>
<p>mass Framework的优点：</p>
<ol>
<li>多库共存。</li>
<li>多版本共存。</li>
<li>模块系统，将不同业务的代码封存于不同的JS文件中，确保自治，加载时能自行处理依赖关系。(目前版本为v15)</li>
<li>模板机制，提供format，hereDoc，tag, ejs（v9） 这四种级别的字符串拼接方法（后两个是用于生成HTML代码片断）。</li>
<li>操作流，一种比异步列队（Deferred）更为强大的处理异步的机制，避免回调套嵌，将串行等待变成并行等待,一处合并，多处触发。</li>
<li>强大的类工厂。（目前版本为v9）</li>
<li>AS3式的补帧动画系统， 还支持回放呢！</li>
<li>CSS3 transform2D支持， 你可以轻松旋转图片角度了。</li>
<li>全面兼容CSS3高级伪类与jQuery自定义伪类的选择器引擎。</li>
<li>支持事件代理，多级hook的事件系统。</li>
<li>lang_fix模块已经为您添加上ECMA262v5的绝对大多数新API的支持，因此可能痛快使用 String.prototype.trim,
 Array.prototype.forEach, Array.prototype.map,Array.prototype.filter, Array.prototype.reduce,
 Function.prototype.bind吧 。</li>
<li>lang模块的提供语言链对象相当于把underscore.js这个库整合进来，你能想到语言扩展都有了。</li>
<li>API 95%与jQuery神似。</li>
</ol>
<p>框架的使用：</p>


<h3>mass的合并</h3>
<ol>
<li>将模块加载模块mass.js里面的内容先复制到一个临时文件</li>
<li>在其最后一行"})(this,this.document);" 与倒数第二行" $.exports("$"+postfix);"插入标识模块已加域的代码。
其代码如下：<br/>
<pre>
    var module_value = {
        state:2
    };
    var list = "ecma,lang,spec,support,class,data,query,node,css_ie,css,dispatcher,event,attr,fx,ajax".match($.rword);
    for(var i=0, module;module = list[i++];){
        mapper["@"+module] = module_value;
    }
</pre>
list里面的为要合并的模块名
</li>
<li>将其他模块里面的内容直接拷到上面的代码之下。</li>
</ol>
<p>成功后，整个代码结构如下：</p>
<pre>
(function(global , DOC){
//这是最核心的模块加载模块
//XXXXXXXXXXX
 //然后加上这样一段
    var module_value = {
        state:2
    };
    var list = "ecma,lang,spec,support,class,data,query,node,css_ie,css,dispatcher,event,attr,fx,ajax".match($.rword);
    for(var i=0, module;module = list[i++];){
        mapper["@"+module] = module_value;
    }
//然后把要合并的JS文件的内容直接抽取出来放在下面
   $.define("ecma", function(){
//XXXXXXXXXXXXXX
});
   $.define("lang", function(){
//XXXXXXXXXXXXXX
})
   dom.define("class", function(){
//XXXXXXXXXXXXXX
})
   $.define("data", function(){
//XXXXXXXXXXXXXX
})
   $.define("node", function(){
//XXXXXXXXXXXXXX
})
//....
})(this,this.document)
</pre>
<p>注意，以上合并工作已经有脚本实现了，它位于doc/public/merge.js文件之中。</p>
<h3>如何试用mass Framework?</h3>
<p>点上方“ZIP”按钮下载到本地，解压后里面有个AspNet.exe服务器（需要微软的.net Framework支持），进去选doc目录就可以运行里面的示例了。</p>

<p>大家在github注册后,就可以在<a href="https://github.com/RubyLouvre/mass-Framework/issues">https://github.com/RubyLouvre/mass-Framework/issues</a>里面提交建议或BUG什么了.</p>
<p>by 司徒正美 （zhongqincheng）</p>
<p>2011.11.15</p>
 <a href="http://www.cnblogs.com/rubylouvre/">http://www.cnblogs.com/rubylouvre/</a>
