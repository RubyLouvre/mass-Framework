mass Framework
==================
<p>贡献者列表：</p>
<ul>
   <li> abcd </li>
   <li> sapjax </li>
   <li> 教主Franky </li>
</ul>
<p>一个模块化，以大模块开发为目标，jQuery式的框架。里面涉及的HTML5新API数量，估计除了纯净的手机框架外，无人能敌。<p>
<p>mass Framework的模块化经过一年化调整与改良，大致分为四类：</p>
<ol>
<li>种子模块， mass.js，最精简的内核， 包含模块加载系统。</li>
<li>补丁模块， lang_fix.js, css_fix.js, event_fix.js,主要是用于兼容旧式IE的，在chrome1+, FF4+, opera10+, safari4+是不会加载它们的。</li>
<li>核心模块， 所有位于mass-Framework/src目录下，但不在其子目录下的JS文件， 提供框架的核心功能。</li>
<li>外围模块， 位于mass-Framework/src/more的JS文件。</li>
</ol>
<h3>mass Framework的优点：</h3>
<ol>
<li>多库共存。</li>
<li>多版本共存。</li>
<li>模块系统，将不同业务的代码封存于不同的JS文件中，确保自治，加载时能自行处理依赖关系。(目前版本为v15)</li>
<li>模板机制，提供format，hereDoc，tag, ejs（v9） 这四种级别的字符串拼接方法（后两个是用于生成HTML代码片断）。</li>
<li>操作流，一种比异步列队（Deferred）更为强大的处理异步的机制，避免回调套嵌，将串行等待变成并行等待,一处合并，多处触发。</li>
<li>强大的类工厂。（目前版本为v9）</li>
<li>AS3式的补帧动画系统， 还支持回放呢！</li>
<li>CSS3 transform2D支持， 您可以轻松旋转图片角度了。</li>
<li>第五代选择器引擎Icarus，全面兼容CSS3高级伪类与jQuery自定义伪类的。</li>
<li>支持事件代理，多级hook的事件系统。</li>
<li>lang_fix模块已经为您添加上ECMA262v5的绝对大多数新API的支持，因此可能痛快使用 String.prototype.trim,
 Array.prototype.forEach, Array.prototype.map,Array.prototype.filter, Array.prototype.reduce,
 Function.prototype.bind吧 。</li>
<li>lang模块的提供语言链对象相当于把underscore.js这个库整合进来，你能想到语言扩展都有了。</li>
<li>API 95%与jQuery神似，学习成本极低。</li>
</ol>
<h3>框架的使用：</h3>
<p>点击上面的ZIP按钮将框架下载回来，然后解压取得src文件里面的JS文件，统统放到你的项目下，然后在页面上引用mass.js。</p>
<p>一个简单的例子</p>
<pre>
$.require("ready",function(){
/*待到domReady完成，执行回调*/
   $.log("将日志打印到页面上",true)
})
</pre>
<p>上面的代面相当于：</p>
<pre>
$.require("ready,node",function(){
/*待到domReady完成，并且在node.js模块加载完毕，执行回调*/
   $("&lt;pre&gt;将日志打印到页面上&lt;/pre&gt;").appendTo("body")
})
</pre>
<p>我们在请求node.js时，会自动加载其依赖，如lang.js,support.js,class.js,query.js,data.js等等，
IE下还会加载lang.js，但你无需理会它是怎么处理，只需专注于你的业务逻辑就行了。</p>
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
<p>相比于jQuery只限于DOM的操作，mass Framework提供一个语言链对象进行链式操作</p>
<pre>
$.require("ready,lang",function(){//对字符串进行链式操作
  $.lang("aaa_bbb").toLowerCase().capitalize().camelize().
  split("").forEach(function(){//转换为数组后继续“链”
    $.log(s);
  });
});
</pre>
<p>语言链对象为字符串，数字，对象，数组以及类数组对象的链式操作提供了丰富无比的API接口。</p>
<h3>文档的使用：</h3>
<p>还是刚才解压出来的文件夹，里面有个AspNet.exe服务器（需要微软的.net Framework支持），进去选doc目录就可以运行里面的示例了。
</p>

<h3>mass的JS文件合并</h3>
<p>手动方式</p>
<ol>
<li>将模块加载模块mass.js里面的内容先复制到一个临时文件</li>
<li>在其最后一行"})(this,this.document);" 与倒数第二行" $.exports("$"+postfix);"插入标识模块已加域的代码。
其代码如下：<br/>
<pre>
    var module_value = {
        state:2
    };
    var list = "lang_fix,lang,support,class,data,query,node,css_fix,css,attr.event_fix"+
        "event,fx,flow,ajax".match($.rword);
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
    var list = "lang_fix,lang,support,class,data,query,node,css_fix,css,attr.event_fix,event,fx,flow,ajax".match($.rword);
    for(var i=0, module;module = list[i++];){
        mapper["@"+module] = module_value;
    }
//然后把要合并的JS文件的内容直接抽取出来放在下面
   $.define("lang_fix", function(){
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
<p>脚本方式</p>
<p>位于doc/public/文件夹有个merge.js， 它需要后端<a href="http://nodejs.org/">node.js</a>的支持</p>


<h3>BUG提交与插件的友情贡献。</h3>

<p>大家在github注册后，就可以在<a href="https://github.com/RubyLouvre/mass-Framework/issues">https://github.com/RubyLouvre/mass-Framework/issues</a>里面提交建议或BUG什么了。</p>
<p>如果是想贡献力量，可以点击最上面的Fork按钮，拷贝一份作为自己的版本，然后在里面修改代码，添加插件，写完后通知我，好让我合并到主干上。</p>

<p>by 司徒正美 （zhongqincheng）</p>
<p>2011.11.15</p>
 <a href="http://www.cnblogs.com/rubylouvre/">http://www.cnblogs.com/rubylouvre/</a>
