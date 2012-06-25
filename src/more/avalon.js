
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
        parseBindings : function( node, context ){
            var jsonstr = $.normalizeJSON( node.getAttribute("data-bind"), true, context );
            var fn = $.avalon.evalBindings( jsonstr, 2 );//限制为两层，减少作用链的长度
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
            if( !this.labels ||!field.labels ){
                return //如果viewModel中没有$.computed，也就没有依赖，也不会执行begin函数，返回
            }
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
    //    template - name
    //foreach - data
    //value - data
    //options - data
    //event - handler
    //MVVM三大入口函数之一
    $.applyBindings = $.setBindings = $.avalon.setBindings;
    var parseBindings = $.avalon.parseBindings;
    //在元素及其后代中将数据隐藏与viewModel关联在一起
    function setBindingsToElementAndChildren( node, source ){
        if ( node.nodeType === 1  ){
            var continueBindings = true;
            if( $.avalon.hasBindings( node ) ){
                continueBindings = setBindingsToElement(node, source ) //.shouldBindDescendants;
            }
            if( continueBindings ){
                var elems = getChildren(node)
                elems.length && setBindingsToChildren( elems, source )
            }
        }
    }
    //viewModel类
    $.viewModel = function(current, parent){
        $.mix( this,current );
        if ( parent) {
            $.mix( this, parent );
            this['$parentContext'] = parent;
            this['$parent'] = parent['$data'];
            this['$parents'] = (parent['$parents'] || []).slice(0);
            this['$parents'].unshift( this['$parent'] );
        } else {
            this['$parents'] = [];
            this['$root'] = current;
        }
        this['$data'] = current;
    }
    $.viewModel.prototype = {
        extend : function(source){
            return $.mix( this,source )
        },
        alias: function( neo, old){
            if(this[ neo ]){
                this[ this[neo] ] = this[old]
            }
            return this;
        }
    }
    //为当前元素把数据隐藏与视图模块绑定在一块
    function setBindingsToElement( node, context ){
        //如果bindings不存在，则通过getBindings获取，getBindings会调用parseBindingsString，变成对象
        var callback = parseBindings( node, context )//保存到闭包中
        context = context instanceof $.viewModel ? context : new $.viewModel( context );
        var getBindings = function(){//用于取得数据隐藏
            try{
                return callback( [ node, context ] )
            }catch(e){
                $.log(e)
            }
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
                associateDataAndUI( node, bindings[key], context, key, getBindings)
            }
        }
        return continueBindings;
    }
    function setBindingsToChildren(elems, source){
        for(var i = 0, n = elems.length; i < n ; i++){
            setBindingsToElementAndChildren( elems[i], source );
        }
    }
    //有一些域的依赖在定义vireModel时已经确认了
    //而对元素的操作的$.computed则要在bindings中执行它们才知
    function associateDataAndUI(node, field, context, key, getBindings){
        var adapter = $.bindingAdapter[key], initPhase = 0, cur
        function symptom(){//这是依赖链的末梢,通过process操作节点
            if(!node){
                return disposeObject;//解除绑定
            }
            if(typeof field !== "function"){
                var bindings = getBindings();//每次都取一次,因为viewModel的数据已经发生改变
                field = bindings["@mass_fields"][key];
            }
            if(initPhase === 0){
                cur = field();
                adapter.init && adapter.init(node, cur, field, context);
            }
            var neo = field();
            if(initPhase === 0 || cur != neo){//只要是处理bool假值的比较 
                cur = neo;
                adapter.update && adapter.update(node, cur, field, context, symptom);
            }
            initPhase = 1;
        }
        $.computed( symptom, context.$data );
    }

    //一个数据绑定，负责界面的展示，另一个是事件绑定，负责更高层次的交互，比如动画，数据请求，
    //从现影响viewModel，导致界面的再渲染
    $.bindingAdapter = {
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
        html: {
            update:  function( node, val ){
                $( node ).html( val )
            },
            stopBindings: true
        },
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
        // { text-decoration: someValue }
        // { color: currentProfit() < 0 ? 'red' : 'black' }
        style: {
            update:  function( node, val ){
                var style = node.style, styleName
                for (var name in val) {
                    styleName = $.cssName(name, style) || name
                    style[styleName] = val[ name ] || "";
                }
            }
        },
        attr: {
            update:  function( node, val ){
                for (var name in val) {
                    $.attr(node, name, val[ name ] )
                }
            }
        },
        click: {
            init: function( node, val, field, context ){
                $(node).bind("click",function(e){
                    field.call( context, e )
                });
            }
        },
        checked: {
            init:  function( node, val, field ){
                $(node).bind("change",function(){
                    field(node.checked);
                });
            },
            update:function(node, val ){
                node.checked = !!val
            }
        }
    }
    //if unless with foreach四个适配器都是使用template适配器
    "if,unless,with,foreach".replace($.rword, function( type ){
        $.bindingAdapter[ type ] = {
            update : function(node, val, field, context, symptom){
                $.bindingAdapter['template']['update'](node, function(){
                    switch(type){
                        case "if":
                            return Number(!!val)
                        case "unless":
                            return Number(!val)
                        case "with":
                            return 1
                        default:
                            return 2
                    }
                }, context, symptom);
            },
            stopBindings: true
        }
    })

    $.bindingAdapter[ "template" ] = {
        update: function(node, data, field, context, symptom){
            if(!symptom){//缓存,省得每次都创建
                symptom.frag = node.ownerDocument.createDocumentFragment();
            }
            var number = field(), frag = symptom.frag, el;
            while((el = node.firstChild)){
                frag.appendChild(el)
            }
            if( number == 1 ){ //处理with if unless适配器
                var elems = getChildren(frag)
                node.appendChild( frag );
                if(elems.length){
                    if( data ){
                        context = new $.viewModel( data, context)
                    }
                    return setBindingsToChildren(elems, context)
                }
            }
            if( number == 2  && data && data.length ){//处理foreach适配器
                var frags = [frag];//防止对fragment二次复制,引发safari的BUG
                for(var i = 0, n = data.length - 1 ; i < n ; i++){
                    frags[ frags.length ] = frag.cloneNode(true)
                }
                for( i = 0; frag = frags[i];i++ ){
                    (function( k ){
                        var subclass = new $.viewModel({
                            $index: k,
                            $item: data[ k ]
                        }, context);
                        subclass.extend( data[ k ] )
                        .alias("$itemName", "$item")
                        .alias("$indexName", "$index");
                        elems = getChildren( frag )
                        node.appendChild( frag );
                        if(elems.length){
                            setBindingsToChildren(elems, subclass )
                        }
                    })(i);   
                }
            }
            return void 0
        },
        stopBindings: true
    }


    $.bindingAdapter.disable = {
        update: function( node, val ){
            $.bindingAdapter.enable.update(node, !val);
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
    $.bindingAdapter["css"] = $.bindingAdapter["class"]
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
        //https://github.com/SteveSanderson/knockout/wiki/Asynchronous-Dependent-Observables 伟大的东西
        //https://github.com/rniemeyer/knockout-kendo 一个UI库
        //switch分支
        //https://github.com/mbest/knockout-switch-case/blob/master/knockout-switch-case.js
        //https://github.com/mbest/js-object-literal-parse/blob/master/js-object-literal-parse.js
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
                            extra.$itemName = array[1];
                            extra.$indexName = array[2];
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

   