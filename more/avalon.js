define("avalon",["$attr","$event"], function(){
    $.log("已加载avalon v2")
    //http://angularjs.org/
    //明天处理命令模式
    var BINDING = $.config.bindname || "bind", bridge = {}, uuid = 0, expando = new Date - 0;
    $.ViewModel = function(data, model){
        model = model || {};//默认容器是对象
        if(Array.isArray(data)){
            return listWatch(data);
        }
        for(var p in data) {
            if(data.hasOwnProperty(p)) {
                addWatchs(p, data[p], model);
            }
        }
        return model;
    }
    //listWatch返回的对象，可以允许您添加、删除、移动、刷新或替换数组中的项目时触发对应元素集合的局部刷新
    //我们可以在页面通过foreach绑定此对象
    function listWatch(array, models){
        models = models || [];
        for(var index = 0; index < array.length; index++){
            var f =  addWatchs(index, array[index], models);
            f.$value = f.$value || f;
        }
        //pop,push,shift,unshift,splice,sort,reverse,remove,removeAt
        String("push,pop,shift,unshift,splice,sort,reverse").replace($.rword, function(method){
            var nativeMethod = models[ method ];
            models[ method ] = function(){
                nativeMethod.apply( models, arguments)
                var Watchs = models["$"+expando];
                for(var i = 0, Watch; Watch = Watchs[i++];){
                    Watch(method, arguments);
                }
            }
        });
        models.removeAt = function(index){//移除指定索引上的元素
            models.splice(index, 1);
        }
        models.remove = function(item){//移除第一个等于给定值的元素
            var array = models.map(function(el){
                return el();
            })
            var index = array.indexOf(item);
            models.removeAt(index);
        }
        models.$value = function(){
            return models
        }
        models.$value.$uuid = ++uuid;
        return models;
    }

    $.View = function(model, node){
        //确保是绑定在元素节点上，没有指定默认是绑在body上
        node = node || document.body;
        //开始在其自身与孩子中绑定
        return setBindingsToElementAndChildren.call( node, model, true );
    }
    var err = new Error("只能是字符串，数值，布尔，Null，Undefined，函数以及纯净的对象")
    function addWatchs( key, val, model ){
        switch( $.type( val )){
            case "Null":
            case "Undefined":
            case "String":
            case "Number":
            case "Boolean":
                return atomWatch( key, val, model );
            case "Function":
                return depsWatch( key, val, model, "get");
            case "Array":
                var models = model[key] || (model[key] = []);
                return listWatch( val, models );
            case "Object":
                if($.isPlainObject( val )){
                    if( $.isFunction( val.setter ) && $.isFunction( val.getter )){
                        return  depsWatch( key, val, model, "setget");
                    }else{
                        var object = model[key] || (model[key] = {});
                        $.ViewModel( val,object );
                        object.$value = function(){
                            return object
                        }
                        return object
                    }
                }else{
                    throw err
                }
                break;
            default:
                throw err
        }
    }
    //一个监控体是一个函数,它总是返回其的value值
    //一个监控体拥有$key属性,表示它在model中的属性名
    //一个监控体拥有$deps属性,里面是其他依赖于它的监控体
    //一个监控体拥有uuid属性,用于区分它是否已经初始化了
    //一个监控体的toString与valueOf函数总是返回其value值
    //atomWatch是指在ViewModel定义时，值为类型为字符串，布尔或数值的Watch。
    //它们是位于双向依赖链的最底层。不需要依赖于其他Watch！
    function atomWatch( key, val, host ){
        function Watch( neo ){
            if( bridge[ expando ] ){ //收集依赖于它的computedWatch,以便它的值改变时,通它们更新自身
                $.Array.ensure( Watch.$deps, bridge[ expando ] );
            }
            if( arguments.length ){//在传参不等于已有值时,才更新自已,并通知其依赖域
                if( Watch.$val !== neo ){
                    Watch.$val = neo;
                    updateDeps( Watch );
                }
            }
            return Watch.$val;
        }
        Watch.$val = val;
        Watch.$uuid = ++uuid
        return addWatch( key, Watch, host );
    }
    //当顶层的VM改变了,通知底层的改变
    //当底层的VM改变了,通知顶层的改变
    //当中间层的VM改变,通知两端的改变
    //depsWatch是指在ViewModel定义时，值为类型为函数，或为一个拥有setter、getter函数的对象。
    //它们是位于双向依赖链的中间层，需要依赖于其他atomWatch或computedWatch的返回值计算自己的value。
    function depsWatch( key, val,host, type){
        var getter, setter//构建一个至少拥有getter,scope属性的对象
        if(type == "get"){//getter必然存在
            getter = val;
        }else if(type == "setget"){
            getter = val.getter;
            setter = val.setter;
            host = val.scope || host;
        }
        function Watch( neo ){
            if( bridge[ expando ] ){
                //收集依赖于它的computedWatch与actionWatch,以便它的值改变时,通知它们更新自身
                $.Array.ensure( Watch.$deps, bridge[ expando ] );
            }
            var change = false;
            if( arguments.length ){//写入
                if( setter ){
                    setter.apply( host, arguments );
                }
            }else{
                if( !("$val" in Watch) ){
                    if( !Watch.$uuid ){
                        bridge[ expando ] = Watch;
                        Watch.$uuid = ++uuid;
                    }
                    neo = getter.call( host );
                    change = true;
                    delete bridge[ expando ];
                }
            }
            //放到这里是为了当是最底层的域的值发出改变后,当前域跟着改变,然后再触发更高层的域
            if( change && (Watch.$val !== neo) ){
                Watch.$val = neo;
                //通知此域的所有直接依赖者更新自身
                updateDeps( Watch );
            }
            return Watch.$val;
        }
        return addWatch( key, Watch, host );
    }
    //actionWatch用于DOM树或节点打交道的Watch，它们仅在用户调用了$.View(viewmodel, node )，
    //把写在元素节点上的@bind属性的分解出来之时生成的。
    //names values 包含上一级的键名与值
    function bindWatch (node, names, values, key, str, binding, model ){
        function Watch( neo ){
            if( !Watch.$uuid ){ //如果是第一次执行这个域
                var arr = model[str]
                if( key == "foreach" ){
                    var p = arr["$"+expando] || ( arr[ "$"+ expando] =  [] );
                    $.Array.ensure( p ,Watch);
                    arguments = ["start"];
                }
                bridge[ expando ] = Watch;
            }
            var callback, val;
            try{
                val = Function(names, "return "+ str).apply(null, values );
            }catch(e){
                return  $.log(e, 3)
            }
            if(typeof val == "function" ){ //&& isFinite( val.$uuid ) 如果返回值也是个域
                callback = val; //这里的域为它所依赖的域
                val = callback();//如果是监控体
            }
            if( !Watch.$uuid ){
                delete bridge[ expando ];
                Watch.$uuid = ++uuid;
                //第四个参数供流程绑定使用
                binding.init && binding.init(node, val, callback, Watch);
            }
            var method = arguments[0], args = arguments[1]
            if( typeof binding[method] == "function" ){
                //处理foreach.start, sort, reserve, unshift, shift, pop, push
                var ret = binding[method]( Watch, val, Watch.fragments, method, args );
                if(ret){
                    val = ret;
                }
            }
            binding.update(node, val, Watch, model, names, values);
            return Watch.$val = val;
        }
        return addWatch( "interacted" ,Watch, node);
    }
    //执行绑定在元素标签内的各种指令
    //MVVM不代表什么很炫的视觉效果之类的，它只是组织你代码的一种方式。有方便后期维护，松耦合等等优点而已
    var inputOne = $.oneObject("text,password,textarea,tel,url,search,number,month,email,datetime,week,datetime-local")
    $.ViewBindings = {
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
            init: function(node, val, Watch){
                if(/input|textarea/i.test(node.nodeName) && inputOne[node.type]){
                    $(node).on("input",function(){
                        Watch(node.value)
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
        display: {
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
            init:  function( node, val, Watch ){
                if(typeof Watch !== "function"){
                    throw new Error("check的值必须是一个Feild")
                }
                $(node).bind("change",function(){
                    Watch(node.checked);
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
            //●●●●●●●●●●●●●
            update: function( node, val, callback, model, names, values){
                var transfer = callback(), code = transfer[0], Watch = transfer[1];
                var fragment = Watch.fragments[0];         //取得原始模板
                if( code > 0 ){                //处理with if 绑定
                    fragment.recover();        //将Watch所引用着的节点移出DOM树
                    var elems = getChildren( fragment );//取得它们当中的元素节点
                    node.appendChild( fragment );  //将Watch所引用着的节点放回DOM树
                    if( elems.length ){
                        if( code == 2 ){      //处理with 绑定
                            model = transfer[2]
                        }
                        return setBindingsToChildren.call( elems, model, true, names, values )
                    }
                }else if( code === 0 ){        //处理unless 绑定
                    fragment.recover();
                }
                if( code < 0  && val ){      //处理foreach 绑定
                    $.log("这原来的foreach绑定的代码");
                    var fragments = Watch.fragments, models = val;
                    for( var i = 0, el ; el = fragments[i]; i++){
                        el.recover(); //先回收，以防在unshift时，新添加的节点就插入在后面
                        elems = getChildren( el );
                        node.appendChild( el );//将VM绑定到模板上
                        setBindingsToChildren.call( elems, models[i], true, names, values );
                    }
                }
            },
            stopBindings: true
        }
    }
    //位于数组中的Watch,它们每一个增加i
    //if unless with foreach四种bindings都是使用template bindings
    "if,unless,with,foreach,case".replace($.rword, function( type ){
        $.ViewBindings[ type ] = {
            init: function(node, _, _, Watch){
                node.normalize();            //合并文本节点数
                var fragment = node.ownerDocument.createDocumentFragment(), el
                while((el = node.firstChild)){
                    fragment.appendChild(el); //将node中的所有节点移出DOM树
                }
                Watch.fragments = [];         //添加一个数组属性,用于储存经过改造的文档碎片
                Watch.fragment = fragment;    //最初的文档碎片,用于克隆
                Watch.cloneFragment = function( dom, unshift ){ //改造文档碎片并放入数组
                    dom = dom || Watch.fragment.cloneNode(true);
                    var add = unshift == true ? "unshift" : "push"
                    Watch.fragments[add]( patchFragment(dom) );
                    return dom;
                }
                var clone = Watch.cloneFragment(); //先改造一翻,方便在update时调用recover方法
                node.appendChild( clone );  //将文档碎片中的节点放回DOM树
            },
            update : function(node, val, Watch, model, names, values){
                $.ViewBindings['template']['update'](node, val, function(){
                    switch(type){//返回结果可能为 -1 0 1 2
                        case "case":
                        case "if":
                            return [ !!val - 0, Watch];//1
                        case "unless":
                            return [!val - 0, Watch]; //0
                        case "with":
                            return [2, Watch, val];   //2
                        default:
                            return [-1, Watch];       //-1 foreach
                    }
                }, model, names, values);
            },
            stopBindings: true
        }
    });
    //Google IO 2012 - V8引擎突破速度障碍 http://www.tudou.com/programs/view/bqxvrifP4mk/
    //foreach绑定拥有大量的子方法,用于同步数据的增删改查与排序
    var foreach = $.ViewBindings.foreach;
    foreach.start = function( Watch, models, fragments, method, args ){
        if(!Array.isArray(models)){
            var array = []
            for(var key in models){
                //通过这里模拟数组行为
                if(models.hasOwnProperty(key) && (key !== "$value") && (key != "$"+expando)){
                    var value = models[key];
                    value.$value = value;
                    array.push( value );
                }
            }
            models = array
        }
        for(var i = 1; i < models.length; i++ ){
            Watch.cloneFragment();
        }
        return models
    };
    //push ok
    foreach.push = function( Watch, models, fragments, method, args ){
        var l = fragments.length
        for(var index = 0; index < args.length; index++ ){
            var n = index + l;
            var f =  addWatchs(n, models[n], models);
            f.$value = f;
            Watch.cloneFragment()
        }
    }
    //unshift ok
    foreach.unshift = function( Watch, models, fragments, method, args ){
        for(var index = 0; index < args.length; index++ ){
            var f =  addWatchs(index, models[index], models);
            f.$value = f;
            Watch.cloneFragment(0, true)
        }
        for( index = 0; index < models.length; index++ ){
            models[index].$key = index
        }
    }
    // shift pop ok
    foreach.shift = function( Watch, models, fragments, method, args ){
        var fragment = fragments[method]()
        fragment.recover();
        for(var index = 0; index < models.length; index++ ){
            models[index].$key = index
        }
    }
    foreach.pop = foreach.shift;
    foreach.splice = function( Watch, models, fragments, method, args ){
        var start = args[0], n = args.length - 2;
        var removes = fragments.splice(start, args[1]);
        //移除对应的文档碎片
        for(var i = 0; i < removes.length; i++){
            removes[i].recover();
        }
        for(i = 0; i < n; i++ ){
            //将新数据封装成域
            var index = start + i
            var f =  addWatchs(index, models[ index ], models);
            f.$value = f;
            //为这些新数据创建对应的文档碎片
            var dom = Watch.fragment.cloneNode(true);
            Watch.fragments.splice(index, 0, patchFragment(dom) );
        }
        for( index = start+n; index < models.length; index++ ){
            models[index].$key = index
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

    $.ViewBindings.disable = {
        update: function( node, val ){
            $.ViewBindings.enable.update(node, !val);
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
    //参数分别为model, pnames, pvalues
    $.fn.model = function(){
        return $._data(this[0], "$model")
    }
    $.fn.$value = function(){
        var watch = $(this).model()
        if(watch){
            var v = watch();
            $.log(v)
            return v
        }
    }
    function setBindingsToElement( model, pnames, pvalues ){
        //取得标签内的属性绑定，然后构建成actionWatch，并与ViewModel关联在一块
        var node = this;
        pnames = pnames || [];
        pvalues = pvalues || [];
        var attr = node.getAttribute( BINDING ), names = [], values = [], continueBindings = true,
        key, val, binding;
        $._data(node,"$model",model);
        for(var name in model){
            if(model.hasOwnProperty(name)){
                names.push( name );
                values.push( model[ name ] );
            }
        }
        if(pnames.length){
            pnames.forEach(function(name, i){
                if(names.indexOf(name) === -1){
                    names.push(name);
                    values.push(pvalues[i])
                }
            })
        }
        var array = normalizeJSON("{"+ attr+"}",true);
        for(var i = 0; i < array.length; i += 2){
            key = array[i]
            val = array[i+1];

            binding = $.ViewBindings[ key ];

            if( binding ){
                if( binding.stopBindings ){
                    continueBindings = false;
                }
                bindWatch(node, names, values, key, val, binding, model);
            }
        }
        return continueBindings;
    }
    //在元素及其后代中将数据隐藏与viewModel关联在一起
    //参数分别为model, pnames, pvalues
    function setBindingsToElementAndChildren(){
        if ( this.nodeType === 1  ){
            var continueBindings = true;
            if( hasBindings( this ) ){
                continueBindings = setBindingsToElement.apply(this, arguments);
            }
            if( continueBindings ){
                var elems = getChildren( this );
                elems.length && setBindingsToChildren.apply(elems, arguments);
            }
        }
    }
    //参数分别为model, pnames, pvalues
    function setBindingsToChildren( ){
        for(var i = 0, n = this.length; i < n ; i++){
            setBindingsToElementAndChildren.apply( this[i], arguments );
        }
    }
    //通知此域的所有直接依赖者更新自身
    function updateDeps(Watch){
        var list = Watch.$deps || [] ;
        if( list.length ){
            var safelist = list.concat();
            for(var i = 0, el; el = safelist[i++];){
                delete el.$val;
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
    function addWatch( key, Watch, host ){
        //收集依赖于它的computedWatch与actionWatch,以便它的值改变时,通知它们更新自身
        Watch.toString = Watch.valueOf = function(){
            if( bridge[ expando ] ){
                $.Array.ensure( Watch.$deps, bridge[ expando ] );
            }
            return Watch.$val
        }
        if(!host.nodeType){
            Watch.$key = key;
            host[ key ] = Watch;
        }
        Watch.$deps = [];
        Watch();
        return Watch;
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
        while (string != prevValue) { //把原字符串放回占位符的位置之上
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
                    case "{":
                        tokenStart = position;
                        tokenStartChar = c;
                        tokenEndChar = "}";
                        break;
                    case "(":
                        tokenStart = position;
                        tokenStartChar = c;
                        tokenEndChar = ")";
                        break;
                    case "[":
                        tokenStart = position;
                        tokenStartChar = c;
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
