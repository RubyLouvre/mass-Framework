
$.define("avalon","data,attr,event,fx", function(){
    //knockout的缺陷
    //1看这里，许多BUG没有修https://github.com/SteveSanderson/knockout/issues?page=1&state=open
    //2里面大量使用闭包，有时多达七八层，性能感觉不会很好
    //3with的使用会与ecma262的严格模式冲突
    //4代码隐藏（指data-bind）大量入侵页面，与JS前几年提倡的无侵入运动相悖
    //5好像不能为同一元素同种事件绑定多个回调
    //人家花了那么多心思与时间做出来的东西,你以为是小学生写记叙文啊,一目了然....
    var validValueType = $.oneObject("Null,NaN,Undefined,Boolean,Number,String")
    var count = 0, disposeObject = {}
    $.avalon = {
        //为一个Binding Target(节点)绑定Binding Source(viewModel)
        setBindings: function( source, node ){
            node = node || document.body; //确保是绑定在元素节点上，没有指定默认是绑在body上
            //开始在其自身与孩子中绑定
            return setBindingsToElementAndChildren( node, source );
        },
        //取得节点的数据隐藏
        hasBindings: function( node ){
            var str = node.getAttribute( "data-bind" );
            return typeof str === "string" && str.indexOf(":") > 1
        },
        //将字符串变成一个函数
        evalBindings: function(expression, level){
            var body = "return (" + expression + ")";
            for (var i = 0; i < level; i++) {
                body = "with(sc[" + i + "]) { " + body + " } ";
            }
            return  Function( "sc", body );
        },
        //转换数据隐藏为一个函数
        parseBindings : function( node, extra ){
            var jsonstr = $.normalizeJSON( node.getAttribute("data-bind"), true, extra || {} );
            var fn = $.avalon.evalBindings( jsonstr, 3 );
            return fn;
        },
        begin : function(){//开始依赖收集
            this.list = [];
            this.labels = {};
        },
        end : function(){//结束依赖收集
            var list = this.list;
            this.begin();
            return list;
        },
        add : function(field){
            //当一个$.observable或$.computed在第一次执行自己时(初始化)是没有labels属性
            //会立即返回,避免不必要的逻辑运作
            if( !field.labels )
                return
            //如果一个$.computed A依赖于另一个$.computed B与一个$.observable C,
            //而B与C又存在依赖关系,那么C将被T出依赖列表中
            //因为我们没有必要叫它们重复通知A进行更新
            var add = false, empty = true, labels = field.labels;
            for(var i in labels ){
                if( labels.hasOwnProperty(i) ){
                    empty = false;
                    if(this.labels[ i ] !== 1){ //如果不为空,那么随个key取出来,看在this.labels存不存在,不存在就加
                        add = true;
                        this.labels[ i ] = 1;
                    }
                }
            }
            if( empty ){//如果是空白,说明是原子属性
                if(this.labels[ field.label ] !== 1){
                    this.list.push( field );
                    this.labels[ field.label ] = 1;
                }
            }
            if( add ){
                this.list.push( field )
            }
        },
        notify : function( field ){//通知依赖于field的上层$.computed更新
            var list = field.list || [] ;
            if( list.length ){
                var safelist = list.concat(), dispose = false
                for(var i = 0, el; el = safelist[i++];){
                    delete el.cache;//清除缓存
                    if(!el.stopReflow){
                        if(el.dispose === true || el() == disposeObject ){//通知顶层的computed更新自身
                            el.dispose = dispose = true
                        }
                    }
                }
                if( dispose == true ){//移除无意义的绑定
                    for (  i = list.length; el = list[ --i ]; ) {
                        if( el.dispose == true ){
                            el.splice( i, 1 );
                        }
                    }
                }
            }
        }
    }
    $.observable = function( val ){
        var cur = val;
        function field( neo ){
            $.avalon.add( field );
            if( arguments.length ){//setter
                if(cur !== neo){
                    cur = neo;
                    $.avalon.notify( field );
                }
            }else{//getter
                return cur;
            }
        }
        field.list = [];//订阅者列表
        field.toString = field.valueOf = function(){
            return cur;
        }
        field();
        field.label = ++count;//原子属性拥有label属性,与永远为空的labels属性
        field.labels = {};
        return field;
    }
   
    $.computed = function( obj, scope ){
        var getter, setter, cur//构建一个至少拥有getter,scope属性的对象
        if(typeof obj == "function"){//getter必然存在
            getter = obj
        }else if( typeof obj == "object" && obj ){
            getter = obj.getter
            setter = obj.setter;
            scope =  obj.scope;
        }
        function field( neo ){
            $.avalon.add( field );
            if( arguments.length ){
                if(typeof setter === "function"){
                    field.stopReflow = true;
                    //setter会唤起其依赖的$.observable与$.computed重新计算自身，但它们也会触发其上级更新自身
                    //由于自身已经先行更新了，没有再计算一次
                    neo = setter.apply( scope, arguments );
                    field.stopReflow = false
                }
            }else{
                if( "cache" in field ){//getter
                    neo = field.cache;//从缓存中读取,防止递归读取
                }else{
                    neo = getter.call( scope );
                    field.cache = neo;//保存到缓存
                }
            }
            if(cur !== neo){
                cur = neo
                $.avalon.notify( field );
            }
            return cur;
        }
        field.list = [];//订阅者列表
        field.toString = field.valueOf = function(){
            return cur;
        }
        $.avalon.begin();
        field();
        field.labels = $.avalon.labels;
        //取得其依赖的原子与分子们
        var deps = $.avalon.end(), list;
        for(var i = 0, d; d = deps[i++];){
            list = d.list || (d.list = []);
            if (  list.indexOf( field ) == -1 ){//防止重复添加
                list.push( field );//低层向高层发送通知
            }
        }
        return field;
    }
    //MVVM三大入口函数之一
    $.applyBindings = $.setBindings = $.avalon.setBindings;
    var parseBindings =  $.avalon.parseBindings;
    //在元素及其后代中将数据隐藏与viewModel关联在一起
    function setBindingsToElementAndChildren( node, source, extra ){
        if ( node.nodeType === 1  ){
            var continueBindings = true;
            if( $.avalon.hasBindings( node ) ){
                continueBindings = setBindingsToElement(node, source, extra ) //.shouldBindDescendants;
            }
            if( continueBindings ){
                var elems = getChildren(node)
                elems.length && setBindingsToChildren( elems, source, extra )
            }
        }
    }
    //为当前元素把数据隐藏与视图模块绑定在一块
    function setBindingsToElement( node, viewModel, extra ){
        //如果bindings不存在，则通过getBindings获取，getBindings会调用parseBindingsString，变成对象
        extra = extra || {}
        var callback = parseBindings( node, extra )//保存到闭包中
        var getBindings = function(){//用于取得数据隐藏
            return callback( [node, viewModel, extra] )
        }
        var bindings = getBindings();
        var continueBindings = true;
        for(var key in bindings){
            var adapter = $.bindingAdapter[key];
            if( adapter ){
                if( adapter.stopBindings ){
                    continueBindings = false;
                }
                $.log("associateDataAndUI : "+key)
                associateDataAndUI( node, bindings[key], viewModel, extra, key, getBindings)
            }
        }
        return continueBindings;
    }
    function setBindingsToChildren(elems, source, extra){
        $.log("setBindingsToChildren")
        for(var i = 0, n = elems.length; i < n ; i++){
            setBindingsToElementAndChildren( elems[i], source, extra );
        }
    }
    //有一些域的依赖在定义vireModel时已经确认了
    //而对元素的操作的$.computed则要在bindings中执行它们才知
    function associateDataAndUI(node, field,  viewModel, extra, key, getBindings){
        var adapter = $.bindingAdapter[key], args = arguments, initPhase = 0
        function symptom(){//这是依赖链的末梢,通过process操作节点
            if(!node){
                $.log("node 不存在或已删除?")
                return disposeObject;//解除绑定
            }
            if(typeof field !== "function"){
                var bindings = getBindings();
                field = bindings["@mass_fields"][key];
            }
            if(initPhase == 0){
                adapter.init && adapter.init.apply(adapter, args);
                initPhase = 1
            }
            adapter.update && adapter.update.apply(adapter, args);
        }
        window.TEST = $.computed(symptom, viewModel);
    }
    var checkDiff = function( update ){
        return function anonymity (node, field){
            var val = field();
            if(!("cache" in anonymity)){
                update(node, val);
            }else {
                if( anonymity.cache !== val ){
                    update(node, val);
                }
            }
            anonymity.cache = val
        }
    }
    $.bindingAdapter = {
        text: {
            update:checkDiff(function ( node, val ) {
                $(node).text(val == null ? "" : val+"");
            })
        },
        visible: {
            update:checkDiff(function ( node, val ) {
                node.style.display = val ? "" : "none"
            })
        },
        enable: {
            update:checkDiff(function ( node, val ) {
                if (val && node.disabled)
                    node.removeAttribute("disabled");
                else if ((!val) && (!node.disabled))
                    node.disabled = true;
            })
        },
        html: {
            update:checkDiff(function ( node, val ) {
                $(node).html( val )
            }),
            stopBindings: true
        },
        "class":{
            update:checkDiff(function ( node, val ) {
                if (typeof value == "object") {
                    for (var className in val) {
                        var shouldHaveClass = val[className];
                        toggleClass(node, className, shouldHaveClass);
                    }
                } else {
                    val = String(val || ''); // Make sure we don't try to store or set a non-string value
                    toggleClass(node, val, true);
                }
            })
        } ,
        // { text-decoration: someValue }
        // { color: currentProfit() < 0 ? 'red' : 'black' }
        style: {
            update:function(node, field){
                var val = field(), style = node.style, styleName
                for (var name in val) {
                    if (typeof style == "string") {
                        styleName = $.cssName(name, style) || name
                        node.style[styleName] = val[ name ] || "";
                    }
                }
            }
        },
        attr: {
            update:function(node, field){
                var val = field();
                for (var name in val) {
                    $.attr(node, name, val[ name ] )
                }
            }
        },
        prop: {
            update:function(node, field){
                var val = field();
                for (var name in val) {
                    $.prop(node, name, val[ name ] )
                }
            }
        },
        click: {
            init: function(node, field, viewModel){
                $(node).bind("click",function(e){
                    field.call( viewModel, e )
                });
            }
        },
        checked: {
            init: function(node, field){
                $(node).bind("change",function(){
                    field(node.checked);
                });
            },
            update:function(node, field){
                node.checked = !!field()
            }
        },
        "if":{
            update:checkDiff(function fn(node, val){
                if(!fn.frag){
                    fn.frag = node.ownerDocument.createDocumentFragment()
                }
                var length = fn.frag.childNodes.length, first;
                console.log(val)
                if( val  ){
                    if(length)
                        node.appendChild( fn.frag )
                }else {
                    while( first = node.firstChild){
                        fn.frag.appendChild(first)
                    }
                }
            })
        },
        unless:{
            update: function(node,field){
                $.bindingAdapter["if"]["update"](node, function(){
                    return !field()
                })
            }
        },
        foreach: {
            update:function(node, field, viewModel, more ){
                var val = field()
                var frag = node.ownerDocument.createDocumentFragment(),
                el;
                while(el = node.firstChild){
                    frag.appendChild(el)
                }
                var frags = [frag];//防止对fragment二次复制,引发safari的BUG
                for(var i = 0, n = val.length - 1 ; i < n ; i++){
                    frags[frags.length] = frag.cloneNode(true)
                }
                for(i = 0; frag = frags[i];i++){
                    var extra = {
                        $parent: viewModel,
                        $index: i,
                        $item: val[i]
                    }
                    if(more.$itemName){
                        extra[ more.$itemName ] = val[i]
                    }
                    if(more.$indexName){
                        extra[ more.$indexName ] = i
                    }
                    var elems = getChildren(frag)
                    node.appendChild(frag);
                    if(elems.length){
                        setBindingsToChildren(elems, val[i], extra)
                    }
                }
            },
            stopBindings: true
        }
    }
    //if unless with foreach四个适配器都是使用template适配器
    "if,unless".replace($.rword, function( type ){
        $.bindingAdapter[ type ] = {
            update : function(node, field){
                $.bindingAdapter['template']['update'](node, function(){
                    return {
                        showChildNodes: type == "if" ?  field() : !field()
                    }
                })
            }
        }
    })
    $.bindingAdapter["with"] = {
        update : function(node, field){
            $.bindingAdapter['template']['update'](node, function(){
                var value = field()
                return {
                    showChildNodes: value, 
                    data: value
                }
            })
        }
    }
    $.bindingAdapter[ "foreach" ] = {
        update : function(node, field){
            $.bindingAdapter['template']['update'](node, function(){
                return {
                    foreach: field()
                }
            })
        }
    }
     $.bindingAdapter[ "template" ] = {
         update: function(node, obj ){

         }
     }
    $.bindingAdapter.disable = {
        update: function( node, field){
            $.bindingAdapter.enable.update(node, function(){
                return !field()
            })
        }
    }
    var getChildren = function(node){
        var elems = [] ,ri = 0
        for (node = node.firstChild; node; node = node.nextSibling){
            if (node.nodeType === 1){
                elems[ri++] = node;
            }
        }
        return elems;
    }
    // var b
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
        $.normalizeJSON = function (json, insertFields, extra) {//对键名添加引号，以便安全通过编译
            var keyValueArray = parseObjectLiteral(json),resultStrings = [] ,keyValueEntry, propertyToHook = [];
            for (var i = 0; keyValueEntry = keyValueArray[i]; i++) {
                if (resultStrings.length > 0)
                    resultStrings.push(",");
                if (keyValueEntry['key']) {
                    var key = keyValueEntry['key'].trim();
                    var quotedKey = ensureQuoted(key), val = keyValueEntry['value'].trim();
                    resultStrings.push(quotedKey);
                    resultStrings.push(":");
                    if(insertFields === true && key === "foreach"){//特殊处理foreach
                        var array = val.match($.rword);
                        val = array.shift();
                        if(array[0] === "as"){//如果用户定义了多余参数
                            extra.$itemName = array[1]
                            extra.$indexName = array[2]
                        }
                    }
                    if(val.charAt(0) == "{" && val.charAt(val.length - 1) == "}"){
                        val = $.normalizeJSON( val );//逐层加引号
                    }
                    resultStrings.push(val);
                    if(insertFields == true){//用函数延迟值部分的执行
                        if (propertyToHook.length > 0)
                            propertyToHook.push(", ");
                        propertyToHook.push(quotedKey + " : function() { return " + val + " }")
                    }
                } else if (keyValueEntry['unknown']) {
                    resultStrings.push(keyValueEntry['unknown']);//基于跑到这里就是出错了
                }
            }
            resultStrings = resultStrings.join("");
            if(insertFields == true){
                resultStrings += ' , "@mass_fields": {'+ propertyToHook.join("") + '}'
            }
            return "{" +resultStrings +"}";
        }
    }();

});

//http://tunein.yap.tv/javascript/2012/06/11/javascript-frameworks-and-data-binding/

   