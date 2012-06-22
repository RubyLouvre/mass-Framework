
$.define("bindings","data,attr,event,fx", function(){
    //1看这里，许多BUG没有修https://github.com/SteveSanderson/knockout/issues?page=1&state=open
    //2里面大量使用闭包，有时多达七八层，性能感觉不会很好
    //3with的使用会与ecma262的严格模式冲突
    //4代码隐藏（指data-bind）大量入侵页面，与JS前几年提倡的无侵入运动相悖
    //5好像不能为同一元素同种事件绑定多个回调
    //人家花了那么多心思与时间做出来的东西,你以为是小学生写记叙文啊,一目了然....
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
            },
            pubblico : [],
            put: function(fn){
                this.pubblico.push(fn)
            }

        };
    })();

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
        return $.observable( args, true )
    }

    $.observable = function(old, isComputed){
        var cur, getter, setter, scope, init = true
        function field( neo ){
            var set;//判定是读方法还是写方法
            if(arguments.length){ //setter
                neo =  typeof setter === "function" ? setter.apply( scope, arguments ) : neo
                set = true;
            }else{  //getter
                if(typeof getter === "function"){
                    init && $.dependencyChain.begin( field );//只有computed才在依赖链中暴露自身
                    if("cache" in field){
                        neo = field.cache;//从缓存中读取,防止递归读取
                    }else{
                        neo = getter.call( scope );
                        field.cache = neo;//保存到缓存
                    }
                    init &&  $.dependencyChain.end()
                }else{
                    neo = cur
                }
                init && $.dependencyChain.collect( field )//将暴露到依赖链的computed放到自己的通知列表中
                $.dependencyChain.put( field )
                init = false
            }
            if(cur !== neo ){
                cur = neo;
                $.bindings.notify( field );
            }
            return set ? field : cur
        }
        if( isComputed == true){
            getter = old.getter;  setter = old.setter; scope  = old.scope;
            field();//必须先执行一次
        }else{
            old = validValueType[ $.type(old) ] ? old : void 0;
            cur = old;//将上一次的传参保存到cur中,ret与它构成闭包
            field(old);//必须先执行一次
        }
        return field
    }

    //normalizeJSON及其辅助方法与变量
    void function(){
        var restoreCapturedTokensRegex = /\@mass_token_(\d+)\@/g;
        function restoreTokens(string, tokens) {
            var prevValue = null;
            while (string != prevValue) { // Keep restoring tokens until it no longer makes a difference (they may be nested)
                prevValue = string;
                string = string.replace(restoreCapturedTokensRegex, function (match, tokenIndex) {
                    return tokens[tokenIndex];
                });
            }
            return string;
        }
        function parseObjectLiteral(objectLiteralString) {
            var str = objectLiteralString.trim();
            if (str.length < 3)
                return [];
            if (str.charAt(0) === "{")// 去掉最开始{与最后的}
                str = str.substring(1, str.length - 1);
            // 首先用占位符把字段中的字符串与正则处理掉
            var tokens = [];
            var tokenStart = null, tokenEndChar;
            for (var position = 0; position < str.length; position++) {
                var c = str.charAt(position);//IE6字符串不支持[],开始一个个字符分析
                if (tokenStart === null) {
                    switch (c) {
                        case '"':
                        case "'":
                        case "/":
                            tokenStart = position;//索引
                            tokenEndChar = c;//值
                            break;
                    }//如果再次找到一个与tokenEndChar相同的字符,并且此字符前面不是转义符
                } else if ((c == tokenEndChar) && (str.charAt(position - 1) !== "\\")) {
                    var token = str.substring(tokenStart, position + 1);
                    tokens.push(token);
                    var replacement = "@mass_token_" + (tokens.length - 1) + "@";//对应的占位符
                    str = str.substring(0, tokenStart) + replacement + str.substring(position + 1);
                    position -= (token.length - replacement.length);
                    tokenStart = null;
                }
            }
            // 将{},[],()等括起来的部分全部用占位符代替
            tokenEndChar = tokenStart = null;
            var tokenDepth = 0, tokenStartChar = null;
            for (position = 0; position < str.length; position++) {
                var c = str.charAt(position);
                if (tokenStart === null) {
                    switch (c) {
                        case "{": tokenStart = position; tokenStartChar = c;
                            tokenEndChar = "}";
                            break;
                        case "(": tokenStart = position; tokenStartChar = c;
                            tokenEndChar = ")";
                            break;
                        case "[": tokenStart = position; tokenStartChar = c;
                            tokenEndChar = "]";
                            break;
                    }
                }
                if (c === tokenStartChar)
                    tokenDepth++;
                else if (c === tokenEndChar) {
                    tokenDepth--;
                    if (tokenDepth === 0) {
                        var token = str.substring(tokenStart, position + 1);
                        tokens.push(token);
                        replacement = "@mass_token_" + (tokens.length - 1) + "@";
                        str = str.substring(0, tokenStart) + replacement + str.substring(position + 1);
                        position -= (token.length - replacement.length);
                        tokenStart = null;
                    }
                }
            }
            //拆解字段，还原占位符的部分
            var result = [];
            var keyValuePairs = str.split(",");
            for (var i = 0, j = keyValuePairs.length; i < j; i++) {
                var pair = keyValuePairs[i];
                var colonPos = pair.indexOf(":");
                if ((colonPos > 0) && (colonPos < pair.length - 1)) {
                    var key = pair.substring(0, colonPos);
                    var value = pair.substring(colonPos + 1);
                    result.push({
                        'key': restoreTokens(key, tokens),
                        'value': restoreTokens(value, tokens)
                    });
                } else {//到这里应该抛错吧
                    result.push({
                        'unknown': restoreTokens(pair, tokens)
                    });
                }
            }
            return result;
        }
        function ensureQuoted(key) {
            var trimmedKey = key.trim()
            switch (trimmedKey.length && trimmedKey.charAt(0)) {
                case "'":
                case '"':
                    return key;
                default:
                    return "'" + trimmedKey + "'";
            }
        }
        // var e =  $.normalizeJSON("{aaa:111,bbb:{ccc:333, class:'xxx', eee:{ddd:444}}}");
        // console.log(e)
        $.normalizeJSON = function (json, insertFields) {//对键名添加引号，以便安全通过编译
            var keyValueArray = parseObjectLiteral(json),resultStrings = [] ,keyValueEntry, propertyToHook = [];
            for (var i = 0; keyValueEntry = keyValueArray[i]; i++) {
                if (resultStrings.length > 0)
                    resultStrings.push(",");
                if (keyValueEntry['key']) {
                    var key = keyValueEntry['key'].trim();
                    var quotedKey = ensureQuoted(key), val = keyValueEntry['value'].trim();
                    resultStrings.push(quotedKey);
                    resultStrings.push(":");
                    if(val.charAt(0) == "{" && val.charAt(val.length - 1) == "}"){
                        val = $.normalizeJSON( val );//逐层加引号
                    }
                    resultStrings.push(val);
                    if(insertFields == true){
                        if (propertyToHook.length > 0)
                            propertyToHook.push(", ");
                        propertyToHook.push(quotedKey + " : function() { return " + val + " }")
                    }
                } else if (keyValueEntry['unknown']) {
                    resultStrings.push(keyValueEntry['unknown']);
                }
            }
            resultStrings = resultStrings.join("");
            if(insertFields == true){
                resultStrings += ' , "@mass_fields": {'+ propertyToHook.join("") + '}'
            }
            return "{" +resultStrings +"}";
        }
    }();
    
    var specialElements = $.oneObject("OL,UL");
    $.bindings = {
        //为一个节点绑定viewModel
        set: function(model, node){
            if (node && (node.nodeType !== 1) && (node.nodeType !== 8))
                throw new Error("只能帮定元素节点与注释节点上");
            node = node || document.body; //确保是绑定在元素节点上，没有指定默认是绑在body上
            //开始在其自身与后代中绑定
            console.log(node);
            return setBindingsToSelfAndDescendants(node, model, true);
        },
        //取得节点的数据隐藏
        get: function(node){
            return node.getAttribute("data-bind")
        },
        //转换数据隐藏为一个函数;;;相当于ko的buildEvalWithinScopeFunction
        parse: function(expression, level){
            var body = "return (" + expression + ")";
            for (var i = 0; i < level; i++) {
                body = "with(sc[" + i + "]) { " + body + " } ";
            }
            return  Function("sc", body);
        },
        notify: function( field ){
            var list = field.list;
            if($.type(list,"Array") && list.length){
                var safelist = list.concat(), dispose = false
                for(var i = 0, el; el = safelist[i++];){
                    delete el.cache;//清除缓存
                    if(el.dispose === true || el() == true ){//通知顶层的computed更新自身
                        el.dispose = dispose = true
                    }
                }
                if( dispose == true ){//移除无意义的绑定
                    for (  i = list.length; el = list[ --i ]; ) {
                        if(el.dispose == true){
                            el.splice( i, 1 );
                        }
                    }
                }
            }
        }
    }
    //MVVM三大入口函数之一
    $.applyBindings = $.setBindings = $.bindings.set;
    $.parseBindings = function(node){
        var jsonstr = $.normalizeJSON( node.getAttribute("data-bind"), true );
        var fn = $.bindings.parse( jsonstr, 2 );
        return fn;//返回一个对象
    }
    function applyBindingsToDescendants(){}
    function associateDataAndUI(node, field, process, viewModel, getBindings, key){
        function symptom(){
            if(!node){
                return true;//解除绑定
            }
            if(typeof value !== "function"){
                var bindings = getBindings([ node, viewModel ]);
                field = bindings["@mass_fields"][key]
            }
            process(node, field, viewModel);
        }
        symptom();
        var pubblico = $.dependencyChain.pubblico = []
        field();
        $.dependencyChain.pubblico = [];
        for(var i = 0, el; el = pubblico[i++];){
            var list = el.list ||  (el.list = [])
            if ( list.indexOf( symptom ) == -1 ){
                list.push( symptom )
            }
        }
      

    }
    //为当前元素把数据隐藏与视图模块绑定在一块
    function setBindingsToSelf(node, viewModel, force){
        //如果bindings不存在，则通过getBindings获取，getBindings会调用parseBindingsString，变成对象
        console.log("setBindingsToSelf")
        var getBindings =  $.parseBindings( node)//保存到闭包中
        var bindings = getBindings( [node,viewModel] )
        for(var key in bindings){
            var process = $.bindingAdapter[key];
            if (typeof process  == "function") {
                $.log("associateDataAndUI : "+key)
                associateDataAndUI(node, bindings[key], process, viewModel, getBindings, key)
            }
        }
        return {}
    }
    //在元素及其后代中将数据隐藏与viewModel关联在一起
    function setBindingsToSelfAndDescendants( node,viewModel, force){
        var canBindToDescendants = true;
        var isElement = (node.nodeType === 1);
        if (isElement && specialElements[node.nodeName]) {
        //  virtualElements.normaliseStructure(node);//修正元素节点的内容结构
        }
        console.log(node)
        var shouldApplyBindings = isElement && force  || $.bindings.get(node);
        if (shouldApplyBindings){
            console.log("setBindingsToSelfAndDescendants")
            setBindingsToSelf(node, viewModel, force) //.shouldBindDescendants;
        //canBindToDescendants
        }
        if (canBindToDescendants) {
    // applyBindingsToDescendants(viewModel, node, !isElement);
    }
    }
  
    $.bindingAdapter = {
        text: function ( node, field ) {
            var val = field();
            val = val == null ? "" : val+"";
            $(node).text(val)
        },
        visible: function( node, field ){
            var val = !!field();
            node.style.display = val ? "" : "none"
        },
        html:  function( node, field ){
            var val = field();
            $(node).html( val )
        },
        "class": function( node, field ){
            var val = field();
            if (typeof value == "object") {
                for (var className in val) {
                    var shouldHaveClass = val[className];
                    toggleClass(node, className, shouldHaveClass);
                }
            } else {
                val = String(val || ''); // Make sure we don't try to store or set a non-string value
                toggleClass(node, val, true);
            }
        },
        // { text-decoration: someValue }
        // { color: currentProfit() < 0 ? 'red' : 'black' }
        style: function(node, field){
            var val = field(), style = node.style, styleName
            for (var name in val) {
                if (typeof style == "string") {
                    styleName = $.cssName(name, style) || name
                    node.style[styleName] = val[ name ] || ""; 
                }
            }
        },
        attr: function(node, field){
            var val = field();
            for (var name in val) {
                $.attr(node, name, val[ name ] )
            }
        },
        prop: function(node, field){
            var val = field();
            for (var name in val) {
                $.prop(node, name, val[ name ] )
            }
        },
        foreach: function(node,field){
            var val = field()
            var frag = document.createDocumentFragment(), first
            while(first = node.firstChild){
                frag.appendChild(first)
            }
            console.log(frag)
            for(var i = 0, n = val.length ; i < n ; i++){
                node.appendChild( frag.cloneNode(true))
             
            }


        }
    }
    $.bindingAdapter["css"] = $.bindingAdapter["css"]
    var toggleClass = function (node, className, shouldHaveClass) {
        var classes = (node.className || "").split(/\s+/);
        var hasClass = classes.indexOf( className) >= 0;//原className是否有这东西
        if (shouldHaveClass && !hasClass) {
            node.className += (classes[0] ? " " : "") + className;
        } else if (hasClass && !shouldHaveClass) {
            var newClassName = "";
            for (var i = 0; i < classes.length; i++)
                if (classes[i] != className)
                    newClassName += classes[i] + " ";
            node.className = newClassName.trim();
        }
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
 