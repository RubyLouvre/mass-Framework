
$.define("mvvm","data,attr,event,fx", function(){
//1看这里，许多BUG没有修https://github.com/SteveSanderson/knockout/issues?page=1&state=open
//2里面大量使用闭包，有时多达七八层，性能感觉不会很好
//3with的使用会与ecma262的严格模式冲突
//4代码隐藏（指data-bind）大量入侵页面，与JS前几年提倡的无侵入运动相悖
//5好像不能为同一元素同种事件绑定多个回调
     var validValueType = $.oneObject("Null,NaN,Undefined,Boolean,Number,String")
            $.dependencyChain = (function () {
                var _frames = [];
                return {
                    begin: function (ret) {
                        _frames.push(ret);
                    },
                    end: function () {
                        _frames.pop();
                    },
                    collect: function (self) {
                        if (_frames.length > 0) {
                            self.list = self.list || [];
                            var fn = _frames[_frames.length - 1];
                            if ( self.list.indexOf( fn ) >= 0)
                                return;
                            self.list.push(fn);
                        }
                    }
                };
            })();
            $.notifyUpdate = function(observable){
                var list = observable.list;
                if($.type(list,"Array")){
                    for(var i = 0, el; el = list[i++];){
                        delete el.cache;//清除缓存
                        el();//通知顶层的computed更新自身
                    }
                }
            }

            $.computed = function(obj, scope){
                var args//构建一个至少拥有getter,scope属性的对象
                if(typeof obj == "function"){
                    args = {
                        getter: obj,
                        scope: scope
                    }
                }else if( typeof obj == "object" && obj && obj.getter){
                    args = obj
                }
                return $.observable(args, true)
            }

            $.observable = function(old, isComputed){
                var cur, getter, setter, scope
                function ret(neo){
                    var set;//判定是读方法还是写方法
                    if(arguments.length){ //setter
                        neo =  typeof setter === "function" ? setter.apply( scope, arguments ) : neo
                        set = true;
                    }else{  //getter
                        if(typeof getter === "function"){
                            $.dependencyChain.begin(ret);//只有computed才在依赖链中暴露自身
                            if("cache" in ret){
                                neo = ret.cache;//从缓存中读取,防止递归
                            }else{
                                neo = getter.call( scope  );
                                ret.cache = neo;//保存到缓存
                                //  console.log(neo+"!!!!!!!!!!");//
                            }
                            $.dependencyChain.end()
                        }else{
                            neo = cur
                        }
                        $.dependencyChain.collect(ret)//将暴露到依赖链的computed放到自己的通知列表中
                    }
                    if(cur !== neo ){
                        cur = neo;
                        $.notifyUpdate(ret);
                    }
                    return set ? ret : cur
                }
                if( isComputed == true){
                    getter = old.getter;  setter = old.setter; scope  = old.scope;
                    ret();//必须先执行一次
                }else{
                    old = validValueType[$.type(old)] ? old : void 0;
                    cur = old;//将上一次的传参保存到cur中,ret与它构成闭包
                    ret(old);//必须先执行一次
                }
                return ret
            }

            function MyViewModel() {
                this.firstName = $.observable('Planet');
                this.lastName = $.observable('Earth');

                this.fullName = $.computed({
                    getter: function () {
                        return this.firstName() + " " + this.lastName();
                    },
                    setter: function (value) {
                        var lastSpacePos = value.lastIndexOf(" ");
                        if (lastSpacePos > 0) { // Ignore values with no space character
                            this.firstName(value.substring(0, lastSpacePos)); // Update "firstName"
                            this.lastName(value.substring(lastSpacePos + 1)); // Update "lastName"
                        }
                    },
                    scope: this
                });

                this.card = $.computed(function(){
                    return this.fullName() +" 屌丝"
                },this);
                this.wordcard = $.computed(function(){
                    return this.card() +"工作卡 "
                },this)
                this.wordcardA = $.computed(function(){
                    return this.wordcard() +"A "
                },this)
            }

            $.buildEvalWithinScopeFunction =  function (expression, scopeLevels) {
                var functionBody = "return (" + expression + ")";
                for (var i = 0; i < scopeLevels; i++) {
                    functionBody = "with(sc[" + i + "]) { " + functionBody + " } ";
                }
                return new Function("sc", functionBody);
            }
            $.applyBindings = function(model, node){

                var nodeBind = $.computed(function (){
                    var str = "{" + node.getAttribute("data-bind")+"}"
                    var fn = $.buildEvalWithinScopeFunction(str,2);
                    var bindings = fn([node,model]);
                    for(var key in bindings){
                        if(bindings.hasOwnProperty(key)){
                            var fn = $.bindingHandlers["text"]["update"];
                            var observable = bindings[key]
                            $.dependencyChain.collect(observable);//绑定viewModel与UI
                            fn(node, observable)
                        }
                    }
                },node);
                return nodeBind

            }
            $.bindingHandlers = {}
            $.bindingHandlers["text"] = {
                'update': function (node, observable) {
                    var val = observable()
                    val = val == null ? "" : val+"";
                    if("textContent" in node){//优先考虑标准属性textContent
                        node.textContent = val;
                    }else{
                        node.innerText = val;
                    }
                    //处理IE9的渲染BUG
                    if (document.documentMode == 9) {
                        node.style.display = node.style.display;
                    }

                }
            }
            window.onload = function(){
                var model = new MyViewModel();
                var node = document.getElementById("node");
                var nodeBind = $.applyBindings(model, node);
                setTimeout(function(){
                    model.firstName("BBB")
                },1500)
                setTimeout(function(){
                    model.lastName("CCC")
                },3000)
                setTimeout(function(){
                    model.fullName("DDD AAA")
                },4500)
            }
//人家花了那么多心思与时间做出来的东西,你以为是小学生写记叙文啊,一目了然....




});

//http://tunein.yap.tv/javascript/2012/06/11/javascript-frameworks-and-data-binding/

//$.define("mvvm",function(){
//    var data_name = "data-bind";
//    var OptionallyClosingChildren = $.oneObject("UL,OL");
//
//    //IE9的注释节点的nodeValue若是条件注释就不正确了
//    var commentNodesHaveTextProperty = document.createComment("test").text === "<!--test-->";
//
//    var startCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*ko\s+(.*\:.*)\s*-->$/ : /^\s*ko\s+(.*\:.*)\s*$/;
//    var endCommentRegex =   commentNodesHaveTextProperty ? /^<!--\s*\/ko\s*-->$/ : /^\s*\/ko\s*$/;
//    //若返回一个数组，里面是其内容
//    function isStartComment(node) {
//        return (node.nodeType == 8) && (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(startCommentRegex);
//    }
//
//    function isEndComment(node) {
//        return (node.nodeType == 8) && (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(endCommentRegex);
//    }
//    function getVirtualChildren(startComment, allowUnbalanced) {
//        var currentNode = startComment;
//        var depth = 1;
//        var children = [];
//        while (currentNode = currentNode.nextSibling) {
//            if (isEndComment(currentNode)) {
//                depth--;
//                if (depth === 0)
//                    return children;
//            }
//
//            children.push(currentNode);
//
//            if (isStartComment(currentNode))
//                depth++;
//        }
//        if (!allowUnbalanced)
//            throw new Error("Cannot find closing comment tag to match: " + startComment.nodeValue);
//        return null;
//    }
//    function getMatchingEndComment(startComment, allowUnbalanced) {
//        var allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
//        if (allVirtualChildren) {
//            if (allVirtualChildren.length > 0)
//                return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
//            return startComment.nextSibling;
//        } else
//            return null; // Must have no matching end comment, and allowUnbalanced is true
//    }
//    //对得不对称的标签
//    function getUnbalancedChildTags(node) {
//        // e.g., from <div>OK</div><!-- ko blah --><span>Another</span>, returns: <!-- ko blah --><span>Another</span>
//        //       from <div>OK</div><!-- /ko --><!-- /ko -->,             returns: <!-- /ko --><!-- /ko -->
//        var childNode = node.firstChild, captureRemaining = null;
//        if (childNode) {
//            do {
//                if (captureRemaining)                   // We already hit an unbalanced node and are now just scooping up all subsequent nodes
//                    captureRemaining.push(childNode);
//                else if (isStartComment(childNode)) {
//                    var matchingEndComment = getMatchingEndComment(childNode, /* allowUnbalanced: */ true);
//                    if (matchingEndComment)             // It's a balanced tag, so skip immediately to the end of this virtual set
//                        childNode = matchingEndComment;
//                    else
//                        captureRemaining = [childNode]; // It's unbalanced, so start capturing from this point
//                } else if (isEndComment(childNode)) {
//                    captureRemaining = [childNode];     // It's unbalanced (if it wasn't, we'd have skipped over it already), so start capturing
//                }
//            } while (childNode = childNode.nextSibling);
//        }
//        return captureRemaining;
//    }
//    var virtualElements = {
//        getBindings: function(node){
//            var regexMatch = isStartComment(node);
//            return regexMatch ? regexMatch[1] : null;
//        },
//        normaliseStructure: function(node) {
//            // Workaround for https://github.com/SteveSanderson/knockout/issues/155
//            /*
//<ul>
//    <li><strong>Here is a static header item</strong></li>
//    <!-- ko foreach: products -->
//    <li>
//        <em data-bind="text: name"></em>
//        <!-- ko if: manufacturer -->
//            &mdash; made by <span data-bind="text: manufacturer.company"></span>
//        <!-- /ko -->
//    </li>
//    <!-- /ko -->
//</ul>
//有序列表与无序列表会在IE678与IE9的怪异模式下变成这样
//<UL>
//     <LI><STRONG>Here is a static header item</STRONG>
//     <!-- ko foreach: products -->
//     <LI>
//          <EM data-bind="text: name"></EM>
//          <!-- ko if: manufacturer -->
//                &mdash;  made by <SPAN data-bind="text: manufacturer.company"></SPAN>
//          <!-- /ko -->
//      <!-- /ko -->
//     </LI>
//</UL>
//*/
//            if (!OptionallyClosingChildren[node.nodeName])
//                return;
//            var childNode = node.firstChild;
//            if (childNode) {
//                do {
//                    if (childNode.nodeType === 1) {//逐个li元素进行处理
//                        var unbalancedTags = getUnbalancedChildTags(childNode);
//                        if (unbalancedTags) {
//                            // Fix up the DOM by moving the unbalanced tags to where they most likely were intended to be placed - *after* the child
//                            var nodeToInsertBefore = childNode.nextSibling;
//                            for (var i = 0; i < unbalancedTags.length; i++) {
//                                if (nodeToInsertBefore)
//                                    node.insertBefore(unbalancedTags[i], nodeToInsertBefore);
//                                else
//                                    node.appendChild(unbalancedTags[i]);
//                            }
//                        }
//                    }
//                } while (childNode = childNode.nextSibling);
//            }
//        }
//    }
//
//    var bindingProvider = $.factory({
//        init: function(){
//            this.bindingCache = {};
//        },
//        //取得data-bind中的值
//        getBindings: function(node) {
//            switch (node.nodeType) {
//                case 1: return node.getAttribute(data_name);   // Element
//                case 8: return virtualElements.getBindings(node);          // Comment node
//            }
//            return null;
//        },
//        hasBindings: function(node){
//            return !(this.getBindings(node) == null)
//        },
//        //转换为函数
//        parseBindings: function(bindingsString, bindingContext){
//            try {
//                var viewModel = bindingContext['$data'];
//                var scopes = (typeof viewModel == 'object' && viewModel != null) ? [viewModel, bindingContext] : [bindingContext];
//                var cacheKey = scopes.length + '_' + bindingsString;//缓存
//                var bindingFunction = this.bindingCache[cacheKey];
//                if(typeof bindingFunction != "function" ){
//                    bindingFunction = this._createBindingsStringEvaluator(bindingsString, scopes.length)
//                }
//                return bindingFunction(scopes);
//            } catch (ex) {
//                throw new Error("Unable to parse bindings.\nMessage: " + ex + ";\nBindings value: " + bindingsString);
//            }
//        },
//        _createBindingsStringEvaluator : function(bindingsString, scopesCount) {
//            var rewrittenBindings = " { " + ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson(bindingsString) + " } ";
//            return this._createScopedFunction(rewrittenBindings, scopesCount);
//        },
//        _createScopedFunction: function(expression,scopeLevels){
//            var functionBody = "return (" + expression + ")";
//            for (var i = 0; i < scopeLevels; i++) {
//                functionBody = "with(sc[" + i + "]) { " + functionBody + " } ";
//            }
//            return new Function("sc", functionBody);
//        }
//    });
//    //创建一个出来,方便使用其原型方法
//    bindingProvider['instance'] = new bindingProvider();
//
//    var bindingContext = function(dataItem, context) {
//        if (context) {
//            $.mix(this, context); // Inherit $root and any custom properties
//            this['$parentContext'] = context;
//            this['$parent'] = context['$data'];
//            this['$parents'] = (context['$parents'] || []).slice(0);
//            this['$parents'].unshift(this['$parent']);
//        } else {
//            this['$parents'] = [];
//            this['$root'] = dataItem;
//        }
//        this['$data'] = dataItem;
//    }
//    //创建一个子绑定上下文
//    bindingContext.prototype.createChildContext = function (dataItem) {
//        return new bindingContext(dataItem, this);
//    };
//    //复制一个相同的实例来添加这些属性
//    bindingContext.prototype.extend = function(properties) {
//        return $.mix(new bindingContext(), this, properties);
//    };
//
//    //框架的入口函数,从指定节点绑定viewModel对象
//    $.applyBindings = function (viewModel, rootNode) {
//        if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
//            throw new Error("只能帮定元素节点与注释节点上");
//        rootNode = rootNode || document.body; //确保是绑定在元素节点上，没有指定默认是绑在body上
//        //开始在其自身与后代中绑定
//        startBind(viewModel, rootNode, true);
//    };
//    function startBind (viewModel, node, bindingContextMayDifferFromDomParentElement) {
//        var shouldBindDescendants = true;
//
//        // Perf optimisation: Apply bindings only if...
//        // (1) We need to store the binding context on this node (because it may differ from the DOM parent node's binding context)
//        //     Note that we can't store binding contexts on non-elements (e.g., text nodes), as IE doesn't allow expando properties for those
//        // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)
//        var isElement = (node.nodeType === 1);
//        if (isElement && OptionallyClosingChildren[node.nodeName]) // Workaround IE <= 8 HTML parsing weirdness
//             virtualElements.normaliseStructure(node);//修正元素节点的内容结构
//        //默认为true
//        var canBindings = (isElement && bindingContextMayDifferFromDomParentElement)             // Case (1)
//        || bindingProvider['instance']['hasBindings'](node);       // Case (2)
//        //通常会执行这一步
//        if (canBindings)
//            shouldBindDescendants = applyBindingsToNodeInternal(node, null, viewModel, bindingContextMayDifferFromDomParentElement).shouldBindDescendants;
//
//        if (shouldBindDescendants) {
//            // We're recursing automatically into (real or virtual) child nodes without changing binding contexts. So,
//            //  * For children of a *real* element, the binding context is certainly the same as on their DOM .parentNode,
//            //    hence bindingContextsMayDifferFromDomParentElement is false
//            //  * For children of a *virtual* element, we can't be sure. Evaluating .parentNode on those children may
//            //    skip over any number of intermediate virtual elements, any of which might define a custom binding context,
//            //    hence bindingContextsMayDifferFromDomParentElement is true
//            applyBindingsToDescendantsInternal(viewModel, node, /* bindingContextsMayDifferFromDomParentElement: */ !isElement);
//        }
//    }
//})