define("avalon",["$attr","$event"], function(){
    $.log("已加载avalon v2")
    //http://angularjs.org/
    var BINDING = $.config.binding || "@bind"
    $.ViewModel = function(data){
        var model = {}
        if(Array.isArray(data)){
            return $.ArrayViewModel(data)
        }
        for(var p in data) {
            if(data.hasOwnProperty(p)) {
                defineProperty(model, p, data[p], data);
            }
        }
        return model;
    }

    $.View = function(model, node){
        //确保是绑定在元素节点上，没有指定默认是绑在body上
        node = node || document.body;
        //开始在其自身与孩子中绑定
        return setBindingsToElementAndChildren( node, model, true );
    }
    var uuid = 0;
    var expando = new Date - 0;
    //ViewModel的组成单位
    function Field( host, key, field ){
        field.toString = field.valueOf = function(){
            return field.value;
        }
        if(!host.nodeType){
            field.nick = key;
            host[ key ] = field;
        }
        field.parents = [];
        field();
        return field
    }
    //一个域对象是一个函数,它总是返回其的value值
    //一个域对象拥有nick属性,表示它在model中的属性名
    //一个域对象拥有parents属性,里面是其他依赖于它的域对象
    //一个域对象拥有uuid属性,用于区分它是否已经初始化了
    //一个域对象的toString与valueOf函数总是返回其value值
    //undividedFiled是指在ViewModel定义时，值为类型为字符串，布尔或数值的Field。
    //它们是位于双向依赖链的最底层。不需要依赖于其他Field！
    function undividedFiled( host, key, val ){
        function field( neo ){
            if( this[ expando ] ){ //收集依赖
                $.Array.ensure( field.parents, this[ expando ] );
            }
            if( arguments.length ){//如果是写方法,则可能改变其value值,并引发其依赖域的值的改变
                if( field.value !== neo ){
                    field.value = neo;
                    notifyParentsUpdate( field );
                }
            }
            return field.value;
        }
        field.value = val;
        return Field( host, key, field );
    }
    //当顶层的VM改变了,通知底层的改变
    //当底层的VM改变了,通知顶层的改变
    //当中间层的VM改变,通知两端的改变
    //computedFiled是指在ViewModel定义时，值为类型为函数，或为一个拥有setter、getter函数的对象。
    //它们是位于双向依赖链的中间层，需要依赖于其他undividedFiled或computedFiled的返回值计算自己的value。
    function computedFiled( host, key, val, type){
        var getter, setter//构建一个至少拥有getter,scope属性的对象
        if(type == "get"){//getter必然存在
            getter = val
        }else if(type == "setget"){
            getter = val.getter
            setter = val.setter;
            host = val.scope || host;
        }
        function field( neo ){
            if( this[ expando ] ){ //收集依赖
                $.Array.ensure( field.parents, this[ expando ] );
            }
            var change = false;
            if( arguments.length ){//写入
                if( setter ){
                    setter.apply( host, arguments );
                }
            }else{
                if( !("value" in field) ){
                    if( !field.uuid ){
                        host[ expando ] = field;
                        field.uuid = ++uuid;
                    }
                    neo = getter.call( host );
                    change = true;
                    delete host[ expando ];
                }
            }
            //放到这里是为了当是最底层的域的值发出改变后,当前域跟着改变,然后再触发更高层的域
            if( change && (field.value !== neo) ){
                field.value = neo;
                //通知此域的所有直接依赖者更新自身
                notifyParentsUpdate( field );
            }
            return field.value;
        }
        return Field( host, key, field );
    }
    //interactedFiled用于DOM树或节点打交道的Field，它们仅在用户调用了$.View(viewmodel, node )，
    //把写在元素节点上的@bind属性的分解出来之时生成的。
    function interactedFiled (node, value, directive ){
        function field(neo){
            if( arguments.length ){//如果是写方法,则可能改变其value值,并引发其依赖域的值的改变
                if( field.value !== neo ){
                    field.value = neo;
                }
            }
            var val = value.uuid ? value() : value
            if( directive.init && !field.init){
                directive.init(node, val, value)
            }
            field.init = 1
            directive.update && directive.update(node, val)
            return field.value;
        }
        Field(node, "interacted" ,field);
        //这里要想办法收集依赖！
        if( !field.uuid && typeof value == "function"){
            $.Array.ensure( value.parents, field );
            field.uuid = ++uuid;
        }
        return field
    }
    //执行绑定在元素标签内的各种指令
    var inputOne = $.oneObject("text,password,textarea,tel,url,search,number,month,email,datetime,week,datetime-local")
    $.ViewDirectives = {
        text: {
            update:  function( node, val ){
                val = val == null ? "" : val+""
                if(node.childNodes.length === 1 && node.firstChild.nodeType == 3){
                    node.firstChild.data = val;
                }else{
                    $( node ).text( val );
                }
            }
        },
        value:{
            init: function(node, val, field){
                node.value = val;
                if(/input|textarea/i.test(node.nodeName) && inputOne[node.type]){
                    $(node).on("input",function(){
                        field(node.value)
                    });
                }

            }
        },
        html: {
            update:  function( node, val ){
                $( node ).html( val )
            },
            stopBindings: true
        },
        //通过display样式控制显隐
        visible: {
            update:  function( node, val ){
                node.style.display = val ? "" : "none";
            }
        },
        enable: {
            update:  function( node, val ){
                if (val && node.disabled)
                    node.removeAttribute("disabled");
                else if ((!val) && (!node.disabled))
                    node.disabled = true;
            }
        },
        style: {
            update:  function( node, val ){
                console.log(node)
                var style = node.style, styleName
                for (var name in val) {
                    styleName = $.cssName(name, style) || name
                    style[styleName] = val[ name ] || "";
                }
                console.log("---------------------")
            }
        }
    }
    //在元素及其后代中将数据隐藏与viewModel关联在一起
    function setBindingsToElementAndChildren( node, model, setData ){
        if ( node.nodeType === 1  ){
            var continueBindings = true;
            if( hasBindings( node ) ){
                continueBindings = setBindingsToElement(node, model, setData )
            }
            if( continueBindings ){
                var elems = getChildren( node )
                elems.length && setBindingsToChildren( elems, model, setData )
            }
        }
    }
    function setBindingsToChildren( elems, model, setData, force ){
        for(var i = 0, n = elems.length; i < n ; i++){
            var node = elems[i]
            setBindingsToElementAndChildren( node, model, setData && !force );
            if( setData && force ){//这是由foreach绑定触发
                $._data(node,"bindings-context", model)
            }
        }
    }

    //为当前元素把数据隐藏与视图模块绑定在一块
    function setBindingsToElement( node, model, setData ){
        //如果bindings不存在，则通过getBindings获取，getBindings会调用parseBindingsString，变成对象
        var attr = node.getAttribute(BINDING), names = [], fns = []
        for(var i in model){
            if(model.hasOwnProperty(i)){
                names.push(i);
                fns.push( model[i] );
            }
        }
        var fn
        try{
            fn = Function( names, " return ({"+ str +"})");
        }catch(e){
            var str = normalizeJSON("{"+ attr+"}");
            fn = Function( names, " return ("+ str +")");
        }
        var obj = fn.apply(node, fns);
        var continueBindings = true;
        for(var key in obj){
            if(obj.hasOwnProperty(key)){
                var directive = $.ViewDirectives[key];
                if( directive ){
                    if( directive.stopBindings ){
                        continueBindings = false;
                    }
                    interactedFiled(node,  obj[key], directive);
                }
            }
        }
        return continueBindings;
    }
    //通知此域的所有直接依赖者更新自身
    function notifyParentsUpdate(field){
        var list = field.parents || [] ;
        if( list.length ){
            var safelist = list.concat();
            for(var i = 0, el; el = safelist[i++];){
                delete el.value;
                el()
            }
        }
    }
    function hasBindings( node ){
        var str = node.getAttribute( BINDING );
        return typeof str === "string" && str.indexOf(":") > 1
    }
    function getChildren(node){
        var elems = [] ,ri = 0;
        for (node = node.firstChild; node; node = node.nextSibling){
            if (node.nodeType === 1){
                elems[ri++] = node;
            }
        }
        return elems;
    }
    var err = new Error("只能是字符串，数值，布尔，函数以及纯净的对象")
    function defineProperty(host, key, val, scope ){
        switch( $.type( val )){
            case "String":
            case "Number":
            case "Boolean":
                undividedFiled(host, key, val);
                break;
            case "Function":
                computedFiled(host, key, val, "get");
                break;
            case "Array":
                $.ArrayViewModel(host, key, val, scope);
                break;
            case "Object":
                if($.isPlainObject( val )){
                    if( $.isFunction( val.setter ) && $.isFunction( val.getter )){
                        computedFiled(host, key, val, "setget");
                    }else{
                        $.ViewModel(val, scope, host)
                    }
                }else{
                    throw err
                }
                break;
            default:
                throw err
        }
    }

    //============================================================
    // IE678+IE9的兼容模式补丁 by 司徒正美
    //============================================================
    $.log("这浏览器的对象的键名为关键字时，需要用引号括起来");
    function normalizeJSON(json, array){
        var keyValueArray = parseObjectLiteral(json),resultStrings = [],
        keyValueEntry, propertyToHook = [];
        for (var i = 0; keyValueEntry = keyValueArray[i]; i++) {
            if (resultStrings.length > 0)
                resultStrings.push(",");
            if (keyValueEntry['key']) {
                var key = keyValueEntry['key'].trim();
                var quotedKey = ensureQuoted(key), val = keyValueEntry['value'].trim();
                resultStrings.push(quotedKey);
                resultStrings.push(":");
                if(val.charAt(0) == "{" && val.charAt(val.length - 1) == "}"){
                    val = normalizeJSON( val );//逐层加引号
                }
                resultStrings.push(val);
            } else if (keyValueEntry['unknown']) {
                resultStrings.push(keyValueEntry['unknown']);//基于跑到这里就是出错了
            }
        }
        if(array){
            return resultStrings
        }
        resultStrings = resultStrings.join("");
        return "{" +resultStrings +"}";
    };
    //------------------------------------------
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
//  }

})
/*
<p>ViewModel的设计难点</p>

        var model = $.ViewModel({
                firstName: "aaa",
                lastName:  "bbb",
                fullName: function(){
                   return this.firstName() + this.lastName()
                }
      });

在VM中，它里面的每一项都叫做域的函数，与原始对象的属性同名。
如果这个属性是最简单的数据类型，比如字符串，布尔，数值，就最简单不过，它们都没有依赖，自己构建自己的域就行了。
如果这个属性是函数，那么函数里面的this其实是指向VM，它会依赖于VM的其他域的返回值来计算自己的返回值。
于是问题来了，根据上文的例子，fullName是怎么知道自己是依赖于firstName与lastName这两个域呢？！
 */