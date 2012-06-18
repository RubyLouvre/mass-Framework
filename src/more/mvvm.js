
$.define("mvvm","data,attr,event,fx", function(){
    //    $.applyBindings = function(viewModel, root){
    //        if(!$.type(viewModel,"Object") ){
    //            throw "first argument must be object"
    //        }
    //        if(root){
    //            root = root.mass ? root[0] : root.nodeType === 1 ? root : 0
    //        }
    //        root = root || document.body;
    //        $.parseBindings(root,viewModel)
    //    }
    $.Observable = function(a){
        this.value = a
    }
    $.applyBindings = function(viewModel,node){
        var obj = new $.Observable;
        var str = node.getAttribute("data-bind");
        var arr = str.split(":");
        var handle = arr[0].trim();
        var type =   arr[1].trim();
        $(node).bind(type, function(e){
            $.binds[handle].apply(this,arguments)
        })

        for(var key in viewModel){
            if(viewModel.hasOwnProperty(key)){
                var val = viewModel[key];
                if(typeof val == "function" && val.__observable__ == true){ 
                    val.call(obj, key, node, viewModel)
                }
            }
        }
      
    //        for(var i = 0, el; el = this[i++];){
    //            if(el.nodeType == 1 || el.nodeType == 8){
    //                $.parseBindings(viewModel,el)
    //            }
    //        }
    //        return this;
    }
    $.binds = {};
    $.binds.visible = function(e, bool){
        $.log("进入visible回调")
        this.style.display =  bool ? "" : "none"
    }
    $.binds.css = function(e,bool){

    }
    $.binds.text = function(e, text){
        //                var viewModel = {
        //                    myMessage: $.observable(4) // Initially blank
        //                };
        //                viewModel.myMessage("Hello, world!"); // Text appears
        //                viewModel.myMessage("XXXXX"); // Text appears
        //                $.applyBindings(viewModel,$("#aaa")[0]);
        $.log("进入text回调")
        $(this).text(text)
    }
    $.bindNodeData = function(node,viewModel){
        var data = node.getAttribute("data-bind");
        if(data && data.length > 3){
            var d =  $.data(node, "@data-bind");
        
            if(!d){
                var a = Function( "return {"+  data.trim()+"}");
     
                $.data(node, "@data-bind",data);
            }
        }
    }
    $.bindDescendantData = function(node,viewModel){
        for (node = node.firstChild; node; node = node.nextSibling){
            if(node.nodeType == 1){
                $.bindNodeData(node, viewModel);
                $.bindDescendantData(node, viewModel)
            }else if(node.nodeType == 8){

        }
        }
    }
    $.parseBindings = function(root,viewModel){
        //  $.data(root,"data-bind");
        $.bindNodeData(root,viewModel)
        $.bindDescendantData(root,viewModel)
    }
    $.bindingHandlers = {}

    $.unwrapObservable = function (value) {
        return $.isObservable(value) ? value() : value;
    }
    $.isObservable = function (instance) {
        return instance instanceof Observable
    }
    function isChange(fn, val){
        $.log("isChange "+val)
        if( fn.__value__ != val){
            fn.__change__ = true;
            fn.__value__ = val;
        }
    }
    //    $.observable =  function (initialValue) {
    //        var _latestValue = initialValue;
    //        function observable() {
    //            if (arguments.length > 0) {
    //                // 通过equalityComparer方法比较它闭包内的_latestValue值与刚传递进行的参数是否相等
    //                // 不相等就触发valueWillMutate,valueHasMutated方法,把依赖链激活,并刷新_latestValue的值
    //                if ((!observable['equalityComparer']) || !observable['equalityComparer'](_latestValue, arguments[0])) {
    //                    observable.valueWillMutate();
    //                    _latestValue = arguments[0];
    //                    if ($["@debug"]) observable._latestValue = _latestValue;
    //                    observable.valueHasMutated();
    //                }
    //                return this; // Permits chained assignments
    //            }
    //            else {//没有则返回现在的_latestValue
    //                ko.dependencyDetection.registerDependency(observable); // The caller only needs to be notified of changes if they did a "read" operation
    //                return _latestValue;
    //            }
    //        }
    //    }

    //人家花了那么多心思与时间做出来的东西,你以为是小学生写记叙文啊,一目了然....
    $.observable = function(init){
      
        function fn( value, node, viewModel){
            if( (this instanceof $.Observable) && (!fn.__init__) ){
                fn.__name__ = value
                fn.__init__ = true;
                fn.__node__ = node;
            }else{
                isChange(fn, value);
            }
            if(fn.__init__ && fn.__change__){
                $(fn.__node__).fire( fn.__name__, fn.__value__);
                fn.__change__ = false;
            }
        }

        fn.__value__ = init;
        fn.__observable__ = true;
        return fn;
    }

    function MyViewModel() {
        this.firstName = ko.observable('Planet');
        this.lastName = ko.observable('Earth');

        this.fullName = ko.computed({
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
    }

    $.computed = function(obj, scope){
        var getter, setter
        if(typeof obj == "function"){
            getter = obj
        }else if(obj && typeof obj == "object"){
            getter = obj.getter;
            setter = obj.setter;
            scope = obj.scope;
        }
        var ret = function(){
            if(arguments.length){
                if(typeof setter == "function"){
                    setter.call(scope, arguments[0])
                }
                return ret;
            }else{
                return getter.call(scope)
            }
        }
        return ret;
    }
    $.observable = function(value){
        var v = value
        function ret(){
            if(arguments.length){
                v = arguments[0];
                return ret;
            }else{
                return v;
            }
        }
        return v;
    }
    $.applyBindings = function(viewModel){

    }

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