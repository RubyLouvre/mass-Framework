define("avalon",["$attr","$event"], function(){
    $.log("已加载avalon v2")
    //http://angularjs.org/
    var BINDING = $.config.bindname || "bind", bridge = {}, uuid = 0, expando = new Date - 0;
    $.ViewModel = function(data, model){
        model = model || {};//默认容器是对象
        if(Array.isArray(data)){
            return $.ArrayViewModel(data);
        }
        for(var p in data) {
            if(data.hasOwnProperty(p)) {
                addFields(p, data[p], model);
            }
        }
        return model;
    }
    $.ArrayViewModel = function(data, model){
        model = model || []
        for(var i = 0; i < data.length; i++){
            addFields(i, data[i], model );
        }
        //pop,push,shift,unshift,slice,splice,sort,reverse,remove,removeAt
        //必须对执行foreach指令的那个交互域发出特别指令，同于同步DOM
        model.push = function(){
            var fields = model["arr_"+expando];
            for(var i = 0, field; field = fields[i++];){

                field("push", arguments)
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

    //一个域对象是一个函数,它总是返回其的value值
    //一个域对象拥有nick属性,表示它在model中的属性名
    //一个域对象拥有parents属性,里面是其他依赖于它的域对象
    //一个域对象拥有uuid属性,用于区分它是否已经初始化了
    //一个域对象的toString与valueOf函数总是返回其value值
    //undividedFiled是指在ViewModel定义时，值为类型为字符串，布尔或数值的Field。
    //它们是位于双向依赖链的最底层。不需要依赖于其他Field！
    function undividedFiled( host, key, val ){
        function field( neo ){
            if( bridge[ expando ] ){ //收集依赖于它的computedFiled,以便它的值改变时,通它们更新自身
                $.Array.ensure( field.parents, bridge[ expando ] );
            }
            if( arguments.length ){//在传参不等于已有值时,才更新自已,并通知其依赖域
                if( field.value !== neo ){
                    field.value = neo;
                    notifyParentsUpdate( field );
                }
            }
            return field.value;
        }
        field.value = val;
        field.uuid = ++uuid
        return addField( key, field, host );
    }
    //当顶层的VM改变了,通知底层的改变
    //当底层的VM改变了,通知顶层的改变
    //当中间层的VM改变,通知两端的改变
    //computedFiled是指在ViewModel定义时，值为类型为函数，或为一个拥有setter、getter函数的对象。
    //它们是位于双向依赖链的中间层，需要依赖于其他undividedFiled或computedFiled的返回值计算自己的value。
    function computedFiled( host, key, val, type){
        var getter, setter//构建一个至少拥有getter,scope属性的对象
        if(type == "get"){//getter必然存在
            getter = val;
        }else if(type == "setget"){
            getter = val.getter;
            setter = val.setter;
            host = val.scope || host;
        }
        function field( neo ){
            if( bridge[ expando ] ){
                //收集依赖于它的computedFiled与interactedFiled,以便它的值改变时,通知它们更新自身
                $.Array.ensure( field.parents, bridge[ expando ] );
            }
            var change = false;
            if( arguments.length ){//写入
                if( setter ){
                    setter.apply( host, arguments );
                }
            }else{
                if( !("value" in field) ){
                    if( !field.uuid ){
                        bridge[ expando ] = field;
                        field.uuid = ++uuid;
                    }
                    neo = getter.call( host );
                    change = true;
                    delete bridge[ expando ];
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
        return addField( key, field, host );
    }
    //interactedFiled用于DOM树或节点打交道的Field，它们仅在用户调用了$.View(viewmodel, node )，
    //把写在元素节点上的@bind属性的分解出来之时生成的。
    function interactedFiled (node, names, values, key, str, directive, model ){
        function field( neo ){
            if( !field.uuid ){ //如果是第一次执行这个域
                var arr = model[str]
                if(Array.isArray( arr ) ){
                    var p = arr["arr_"+expando] || ( arr[ "arr_"+ expando] =  [] );
                    $.Array.ensure( p ,field);
                    arguments = ["init"]
                }
                bridge[ expando ] = field;
            }
       
            var fn = Function(names, "return "+ str), callback, val;
            val = fn.apply(null, values );
            if(typeof val == "function" && isFinite( val.uuid )){ //如果返回值也是个域
                callback = val; //这里的域为它所依赖的域
                val = callback();//如果是域对象
            }
            if( !field.uuid ){
                delete bridge[ expando ];
                field.uuid = ++uuid;
                //第四个参数供流程绑定使用
                directive.init && directive.init(node, val, callback, field);
            }
            if(directive.preupdate && arguments.length){
                directive.preupdate(node, field, model[str], arguments[0],arguments[1] )
            }
            //这里需要另一种指令！用于处理数组增删改查与排序
            directive.update && directive.update(node, val, field, model);
            return field.value = val;
        }
        return addField( "interacted" ,field, node);
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
                if(/input|textarea/i.test(node.nodeName) && inputOne[node.type]){
                    $(node).on("input",function(){
                        field(node.value)
                    });
                }
            },
            update:  function( node, val ){
                node.value = val;
            }
        },
        html: {
            update:  function( node, val ){
                $( node ).html( val );
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
                var style = node.style, styleName;
                for (var name in val) {
                    styleName = $.cssName(name, style) || name;
                    style[styleName] = val[ name ] || "";
                }
            }
        },
        "class": {
            update:  function( node, val ){
                if (typeof val == "object") {
                    for (var className in val) {
                        var shouldHaveClass = val[className];
                        toggleClass(node, className, shouldHaveClass);
                    }
                } else {
                    val = String(val || '');
                    toggleClass(node, val, true);
                }
            }
        } ,
        attr: {
            update:  function( node, val ){
                for (var name in val) {
                    $.attr(node, name, val[ name ] );
                }
            }
        },
        checked: {
            init:  function( node, val, field ){
                if(typeof field !== "function"){
                    throw new Error("check的值必须是一个Feild")
                }
                $(node).bind("change",function(){
                    field(node.checked);
                });
            },
            update:function( node, val ){
                if ( node.type == "checkbox" ) {
                    if (Array.isArray( val )) {
                        node.checked = val.indexOf(node.value) >= 0;
                    } else {
                        node.checked = val;
                    }
                } else if (node.type == "radio") {
                    node.checked = ( node.value == val );
                }
            }
        },
        template: {
            update: function( node, val, callback, model){
                var transfer = callback(), code = transfer[0], field = transfer[1];
                var fragment = field.fragments[0];         //取得原始模板
                if( code > 0 ){                //处理with if 绑定
                    fragment.recover();        //将Field所引用着的节点移出DOM树
                    var elems = getChildren( fragment );//取得它们当中的元素节点
                    node.appendChild( fragment );  //将Field所引用着的节点放回DOM树
                    if( elems.length ){
                        if( code == 2 ){      //处理with 绑定
                            model = transfer[2]
                        }
                        return setBindingsToChildren( elems, model, true )
                    }
                }else if( code === 0 ){        //处理unless 绑定
                    fragment.recover();
                }
                if( code < 0  && val ){      //处理foreach 绑定
                    $.log("这原来的foreach绑定的代码");
                    var nodeArray = field.fragments, modelArray = field.models;
                    for( var i = 0, el ; el = nodeArray[i]; i++){
                        elems = getChildren( el );
                        node.appendChild( el );//将VM绑定到模板上
                        setBindingsToChildren( elems, modelArray[i], true );
                    }
                }
            },
            stopBindings: true
        }

    }

    //if unless with foreach四种bindings都是使用template bindings
    "if,unless,with,foreach,case".replace($.rword, function( type ){
        $.ViewDirectives[ type ] = {
            init: function(node, _, _, field){
                node.normalize();            //合并文本节点数
                var fragment = node.ownerDocument.createDocumentFragment(), el
                while((el = node.firstChild)){
                    fragment.appendChild(el); //将node中的所有节点移出DOM树
                }
                field.fragments = [];         //添加一个数组属性,用于储存经过改造的文档碎片
                field.fragment = fragment;    //最初的文档碎片,用于克隆
                field.cloneFragment = function( node ){ //改造文档碎片并放入数组
                    node = node || field.fragment.cloneNode(true);
                    field.fragments.push( patchFragment(node) );
                }
                field.cloneFragment(fragment); //先改造一翻,方便在update时调用recover方法
                node.appendChild( fragment );  //将文档碎片中的节点放回DOM树
            },
            update : function(node, val, field, model){
                if(type == "case" && (typeof model.$switch != "function" )){
                    throw "Must define switch statement above all";
                }
                $.ViewDirectives['template']['update'](node, val, function(){
                    switch(type){//返回结果可能为 -1 0 1 2
                        case "case":
                        case "if":
                            return [ !!val - 0, field];//1
                        case "unless":
                            return [!val - 0, field]; //0
                        case "with":
                            return [2, field, val];   //2
                        default:
                            return [-1, field];       //-1 foreach
                    }
                }, model);
            },
            stopBindings: true
        }

    });
    $.ViewDirectives.foreach.preupdate = function(node, field, array, method, args){
        if(method == "init"){
            var models = []
            for(var index = 0; index < array.length; index++){
                models.push( $.ViewModel({
                    $key: index,
                    $value: array[ index ]
                }))
            }
            field.models = models;
            var fragments = field.fragments
            fragments[0].recover();
            for(var i = 1; i < models.length; i++ ){
                field.cloneFragment()
            }
        }
     
    }

    //nodes属性为了取得所有子节点的引用
    function patchFragment( fragment ){
        fragment.nodes = $.slice( fragment.childNodes );
        fragment.recover = function(){
            this.nodes.forEach(function( el ){
                this.appendChild(el)
            },this);
        }
        return fragment;
    }

    $.ViewDirectives.disable = {
        update: function( node, val ){
            $.ViewDirectives.enable.update(node, !val);
        }
    }

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


    //为当前元素把数据隐藏与视图模块绑定在一块
    function setBindingsToElement( node, model, setData ){
        //取得标签内的属性绑定，然后构建成interactedFiled，并与ViewModel关联在一块
        var attr = node.getAttribute( BINDING ), names = [], values = [], continueBindings = true,
        key, val, directive;
        for(var name in model){
            if(model.hasOwnProperty(name)){
                names.push( name );
                values.push( model[ name ] );
            }
        }
        var array = normalizeJSON("{"+ attr+"}",true);
        for(var i = 0; i < array.length; i += 2){
            key = array[i]
            val = array[i+1];
            directive = $.ViewDirectives[ key ];
            if( directive ){
                if( directive.stopBindings ){
                    continueBindings = false;
                }
                interactedFiled(node,  names, values, key, val, directive, model);
            }
        }
        return continueBindings;
    }
    //在元素及其后代中将数据隐藏与viewModel关联在一起
    function setBindingsToElementAndChildren( node, model, setData ){
        if ( node.nodeType === 1  ){
            var continueBindings = true;
            if( hasBindings( node ) ){
                continueBindings = setBindingsToElement(node, model, setData );
            }
            if( continueBindings ){
                var elems = getChildren( node );
                elems.length && setBindingsToChildren( elems, model, setData );
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
    function getChildren( node ){
        var elems = [] ,ri = 0;
        for (node = node.firstChild; node; node = node.nextSibling){
            if (node.nodeType === 1){
                elems[ri++] = node;
            }
        }
        return elems;
    }
    function addField( key, field, host ){
        field.toString = field.valueOf = function(){
            if( bridge[ expando ] ){
                //收集依赖于它的computedFiled与interactedFiled,以便它的值改变时,通知它们更新自身
                $.Array.ensure( field.parents, bridge[ expando ] );
            }
            return field.value
        }
        if(!host.nodeType){
            field.nick = key;
            host[ key ] = field;
        }
        field.parents = [];
        field();
        return field;
    }
    var err = new Error("只能是字符串，数值，布尔，函数以及纯净的对象")
    function addFields( key, val, model ){
        switch( $.type( val )){
            case "String":
            case "Number":
            case "Boolean":
                undividedFiled(model, key, val);
                break;
            case "Function":
                computedFiled(model, key, val, "get");
                break;
            case "Array":
                model[key] = model[key] || []
                $.ArrayViewModel(val, model[key]);
                break;
            case "Object":
                if($.isPlainObject( val )){
                    if( $.isFunction( val.setter ) && $.isFunction( val.getter )){
                        computedFiled(model, key, val, "setget");
                    }else{
                        model[key] = model[key] || {};
                        $.ViewModel(val, model[key] );
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
    // 将bindings变成一个对象或一个数组 by 司徒正美
    //============================================================
    function normalizeJSON(json, array){
        var keyValueArray = parseObjectLiteral(json),resultStrings = [],keyValueEntry;
        for (var i = 0; keyValueEntry = keyValueArray[i]; i++) {
            if (resultStrings.length > 0 && !array)
                resultStrings.push(",");
            if (keyValueEntry['key']) {
                var key = keyValueEntry['key'].trim();
                var quotedKey = ensureQuoted(key, array), val = keyValueEntry['value'].trim();
                resultStrings.push(quotedKey);
                if(!array)
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
    //============================================================
    // normalizeJSON的辅助函数 by 司徒正美
    //============================================================
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
    function ensureQuoted(key, array) {
        var trimmedKey = key.trim()
        if(array){
            return trimmedKey;
        }
        switch (trimmedKey.length && trimmedKey.charAt(0)) {
            case "'":
            case '"':
                return key;
            default:
                return "'" + trimmedKey + "'";
        }
    }
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