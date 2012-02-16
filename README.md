mass Framework
==================
<p>这是一个前后端一体化的javascript框架。client部分用于前端，从零开始建起，不依赖于其他框架。sever则构建在node.js，需要node.js的环境支持。<p>
<p>前后端都是以mass.js这个“模块加载模块”为起点，利用require方法构建框架，但它们内部的实现并不一样。后端的require只是node.js 原生require方法的一层薄薄的包装，
而前端则通过script标签在iframe沙箱环境进行加载，组装。除此之外，前端专注于DOM的操作，后端则忙碌于IO的操作。前端的操作除了事件系统，Ajax与动画系统是异步之外，都是线性的同步操作。
后端则需要挖掘CPU的利用率，许多操作都有两套方法（同步与异步），不过异步方法更受青睐，为此，mass Framework对此发展出三种不同层次的解决方案，让用户更方便地使用异步方法。</p>
<p>前端是从模块加载开始，通过选择器构建<em>节点链对象</em>实现jQuery式的各种操作(数据缓存，样式操作，事件绑定，ajax调用，dom操作，属性操作），许多API都与jQuery非常相近。在语言底层，通过对ecma262v5新API的检测与补丁支持确保连IE6也能使用
 String.prototype.trim, Array.prototype.forEach, Array.prototype.map,Array.prototype.filter, Array.prototype.reduce, Function.prototype.bind 等高级API，
 享受Prototype.js那种编程快感。另，还通过$.lang(aaa)生成<em>语言链对象</em>对字符串，
数字，数组，类数组,对象这几种数据类型提供更多便捷操作, 这在保证不污染原型的同时, 亦能够进行链式操作。</p>
<p>在大规模开发过程，mass Framework提供以下特征确保迅敏开发：</p>
<ol>
<li>多库共存。</li>
<li>多版本共存。</li>
<li>模块系统，将不同业务的代码封存于不同的JS文件中，确保自治，加载时能自行处理依赖关系。(目前版本为v14)</li>
<li>模板机制，提供format，hereDoc，tag, ejs 这四种级别的字符串拼接方法（后两个是用于生成HTML代码片断）。</li>
<li>异步列队，将一组方法延迟到末来某一时间点时执行，并能应对时间上的异常捕获。</li>
<li>操作流，将多个相关的回调组织起来，避免回调套嵌，将串行等待变成并行等待,一处合并，多处触发。</li>
<li>自定义事件，方便设置UI的各种行为。</li>
<li>强大的类工厂。（目前版本为v7）</li>
<li>AS3式的补帧动画系统。</li>
<li>CSS3 transform2D支持。</li>
</ol>
<p>后端部分，核心功能是手脚架，热部署，拦截器群集，MVC，ORM。它正在编写中，前三大功能基本成型。。。。</p>
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
