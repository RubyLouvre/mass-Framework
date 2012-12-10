define("avalon",["mass","$attr","$event"], function($){
    $.log("已加载avalon v2", 7);
    //http://rivetsjs.com/#rivets
    var BINDING = $.config.bindname || "bind",  bridge = {}, //用于收集依赖
    uuid = 0, expando = new Date - 0;
    //将一个普通的对象转换为ViewModel,ViewModel都是对原来数据进行持续监控与读写的访问器
    $.ViewModel = function(data, model){
        model = model || {
            commands: {}
        };
        if(Array.isArray(data)){
            return convertToCollectionAccessor(data);
        }
        for(var p in data) {
            if(data.hasOwnProperty(p) && p !== "commands") {
                convertToAccessor(p, data[p], model);
            }
        }
        return model;
    }
    //集合访问器，这是一个特别的数组对象， 用于一组数据进行监控与操作，当它的顺序或个数发生变化时，
    //它会同步到DOM对应的元素集合中去，因此有关这个数组用于添加，删除，排序的方法都被重写了
    //我们可以在页面通过foreach绑定此对象
    function convertToCollectionAccessor(array, models){
        models = models || [];
        for(var index = 0; index < array.length; index++){
            var f =  changeToAccessors(index, array[index], models);
            f.$value = f.$value || f;
        }
        String("push,pop,shift,unshift,splice,sort,reverse").replace($.rword, function(method){
            var nativeMethod = models[ method ];
            models[ method ] = function(){
                nativeMethod.apply( models, arguments)
                var accessors = models["$"+expando];
                for(var i = 0, accessor; accessor = accessors[i++];){
                    accessor(method, arguments);
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
        //模拟监控函数的行为,监控函数在foreach都会生成一个$value函数
        models.$value = function(){
            return models
        }
        models.$value.$uuid = ++uuid;
        return models;
    }
    //将ViewMode绑定到元素节点上，没有指定默认是绑在body上
    $.View = function(model, node){
        node = node || document.body;
        //开始在其自身与孩子中绑定
        return setBindingsToElements.call( node, model );
    }
    //我们根据用户提供的最初普通对象的键值，选用不同的方式转换成各种监控函数或监控数组
    var err = new Error("只能是字符串，数值，布尔，Null，Undefined，函数以及纯净的对象")
    function convertToAccessor( key, val, model ){
        switch( $.type( val )){
            case "Null":
            case "Undefined":
            case "String":
            case "NaN":
            case "Number":
            case "Boolean"://属性访问器
                return convertToPropertyAccessor( key, val, model );
            case "Function"://组合访问器
                return convertToCombiningAccessor( key, val, model, "get");
            case "Array"://组合访问器
                var models = model[key] || (model[key] = []);
                return convertToCollectionAccessor( val, models );
            case "Object"://转换为子VM
                if($.isPlainObject( val )){
                    if( $.isFunction( val.setter ) && $.isFunction( val.getter )){
                        return convertToCombiningAccessor( key, val, model, "setget");
                    }else{
                        var object = model[key] || (model[key] = {});
                        $.ViewModel( val, object );
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
    //为访问器添加更多必须的方法或属性，让其真正可用！必要将它绑到VM中！
    function completeAccessor( key, accessor, host ){
        //收集依赖于它的访问器或绑定器，,以便它的值改变时,通知它们更新自身
        accessor.toString = accessor.valueOf = function(){
            if( bridge[ expando ] ){
                $.Array.ensure( accessor.$deps, bridge[ expando ] );
            }
            return accessor.$val
        }
        if(!host.nodeType){
            accessor.$key = key;
            host[ key ] = accessor;
        }
        accessor.$deps = [];
        accessor();
        return accessor;
    }
    //属性访问器，它是最简单的可读写访问器，位于双向依赖链的最底层，不依赖于其他访问器就能计算到自己的返回值
    function convertToPropertyAccessor( key, val, host ){
        function accessor( neo ){
            if( bridge[ expando ] ){ //收集依赖于它的访问器或绑定器，,以便它的值改变时,通知它们更新自身
                $.Array.ensure( accessor.$deps, bridge[ expando ] );
            }
            if( arguments.length ){//在传参不等于已有值时,才更新自已,并通知其的依赖
                if( accessor.$val !== neo ){
                    accessor.$val = neo;
                    updateDeps( accessor );
                }
            }
            return accessor.$val;
        }
        accessor.$val = val;
        accessor.$uuid = ++uuid
        return completeAccessor( key, accessor, host );
    }

    //convertToCombiningAccessor，组合访问器，是指在ViewModel定义时，值为类型为函数，或为一个拥有setter、getter函数的对象。
    //它们是位于双向绑定链的中间层，需要依赖于其他属性访问器或组合访问的返回值计算自己的返回值。
    //当顶层的VM改变了,通知底层的改变
    //当底层的VM改变了,通知顶层的改变
    //当中间层的VM改变,通知两端的改变
    function convertToCombiningAccessor( key, val, host, type){
        var getter, setter//构建一个至少拥有getter,scope属性的对象
        if(type == "get"){//getter必然存在
            getter = val;
        }else if(type == "setget"){
            getter = val.getter;
            setter = val.setter;
            host = val.scope || host;
        }
        function accessor( neo ){
            if( bridge[ expando ] ){
                //收集依赖于它的depsWatch与bindWatch,以便它的值改变时,通知它们更新自身
                $.Array.ensure( accessor.$deps, bridge[ expando ] );
            }
            var change = false;
            if( arguments.length ){//写入新值
                if( setter ){
                    setter.apply( host, arguments );
                }
            }else{
                if( !("$val" in accessor) ){
                    if( !accessor.$uuid ){
                        bridge[ expando ] = accessor;
                        accessor.$uuid = ++uuid;
                    }
                    neo = getter.call( host );
                    change = true;
                    delete bridge[ expando ];
                }
            }
            //放到这里是为了当是最底层的域的值发出改变后,当前域跟着改变,然后再触发更高层的域
            if( change && (accessor.$val !== neo) ){
                accessor.$val = neo;
                //通知此域的所有直接依赖者更新自身
                updateDeps( accessor );
            }
            return accessor.$val;
        }
        return completeAccessor( key, accessor, host );
    }
    //DOM访问器，直接与DOM树中的节点打交道的访问器，是实现双向绑定的关键。
    //它们仅在用户调用了$.View(viewmodel, node )方法，才根据用户写在元素节点上的bind属性生成出来。
    //names values 包含上一级的键名与值
    function convertToDomAccessor (node, names, values, key, str, binding, model ){
        function accessor( neo ){
            if( !accessor.$uuid ){ //只有在第一次执行它时才进入此分支
                if( key == "foreach" ){
                    var arr = model[str]
                    var p = arr["$"+expando] || ( arr[ "$"+ expando] =  [] );
                    $.Array.ensure( p ,accessor);
                    arguments = ["start"];
                }
                bridge[ expando ] = accessor;
            }
            var _accessor, val;
            try{
                val = Function(names, "return "+ str).apply(null, values );
            }catch(e){
                return  $.log(e, 3)
            }
            if(typeof val == "function" ){ //如果我们得到的是一个访问器
                _accessor = val;
                val = _accessor();//那么我们尝试取得它的值
            }
            if( !accessor.$uuid ){
                delete bridge[ expando ];
                accessor.$uuid = ++uuid;
                //第四个参数供流程绑定使用
                binding.init && binding.init(node, val, _accessor, accessor);
            }
            var method = arguments[0], args = arguments[1]
            if( typeof binding[method] == "function" ){
                //处理foreach.start, sort, reserve, unshift, shift, pop, push....
                var ret = binding[method]( accessor, val, accessor.fragments, method, args );
                if(ret){
                    val = ret;
                }
            }
            //只有执行到这里才知道要不要中断往下渲染
            binding.update(node, val, accessor, model, names, values);
            return accessor.$val =  key +":"+ str   //val;
        }
        return completeAccessor( "interacted" ,accessor, node);
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
            init: function(node, val, accessor){
                if(/input|textarea/i.test(node.nodeName) && inputOne[node.type]){
                    $(node).on("input",function(){
                        accessor(node.value)
                    });
                }
            },
            update: function( node, val ){
                node.value = val;
            }
        },
        html: {
            update: function( node, val ){
                $( node ).html( val );
            },
            stopBindings: true
        },
        //通过display样式控制显隐
        display: {
            update: function( node, val ){
                node.style.display = val ? "" : "none";
            }
        },
        enable: {
            update: function( node, val ){
                if (val && node.disabled)
                    node.removeAttribute("disabled");
                else if ((!val) && (!node.disabled))
                    node.disabled = true;
            }
        },
        style: {
            update: function( node, val ){
                var style = node.style, styleName;
                for (var name in val) {
                    styleName = $.cssName(name, style) || name;
                    style[styleName] = val[ name ] || "";
                }
            }
        },
        "class": {
            update: function( node, val ){
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
            update: function( node, val ){
                for (var name in val) {
                    $.attr(node, name, val[ name ] );
                }
            }
        },
        checked: {
            init: function( node, val, accessor ){
                if(typeof accessor !== "function"){
                    throw new Error("check的值必须是一个Feild")
                }
                $(node).bind("change",function(){
                    accessor(node.checked);
                });
            },
            update: function( node, val ){
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
            //它暂时只供内部使用
            update: function( node, val, callback, model, names, values){
                //code对应 1 if,  0  unless,2  with -1 foreach
                var transfer = callback(), code = transfer[0], accessor = transfer[1];
                var fragment = accessor.fragments[0];      //取得原始模板
                if( code > 0 ){                            //处理with if 绑定
                    fragment.recover();                    //将它所引用着的节点移出DOM树
                    var elems = getChildren( fragment );   //取得它们当中的元素节点
                    node.appendChild( fragment );          //再放回DOM树
                    if( elems.length ){
                        if( code == 2 ){                    //处理with 绑定
                            model = transfer[2]
                        }
                        return setBindingsToChildren.call( elems, model, true, names, values )
                    }
                }else if( code === 0 ){                    //处理unless 绑定
                    fragment.recover();
                }
                if( code < 0  && val ){                    //处理foreach 绑定
                    var fragments = accessor.fragments, models = val;
                    if(!models.length){                    //如果对应集合为空,那么视图中的节点要移出DOM树
                        fragments[0].recover();
                        return
                    }
                    for( var i = 0, el ; el = fragments[i]; i++){
                        el.recover();                      //先回收，以防在unshift时，新添加的节点就插入在后面
                        elems = getChildren( el );
                        node.appendChild( el );            //继续往元素的子节点绑定数据
                        setBindingsToChildren.call( elems, models[i], true, names, values );
                    }
                }
            },
            stopBindings: true
        }
    }
    $.ViewBindings.disable = {
        update: function( node, val ){
            $.ViewBindings.enable.update(node, !val);
        }
    }
    //if unless with foreach四种bindings都是基于template bindings
    "if,unless,with,foreach,case".replace($.rword, function( type ){
        $.ViewBindings[ type ] = {
            //node, 子访问器的返回值, 子访问器(位于VM), 父访问器(分解元素bind属性得到DOMAccessor)
            init: function(node, _, _, accessor){
                node.normalize();                  //合并文本节点数
                var fragment = node.ownerDocument.createDocumentFragment(), el
                while((el = node.firstChild)){
                    fragment.appendChild(el);     //将node中的所有节点移出DOM树
                }
                accessor.fragments = [];             //添加一个数组属性,用于储存经过改造的文档碎片
                accessor.fragment = fragment;         //最初的文档碎片,用于克隆
                accessor.cloneFragment = function( dom, unshift ){ //改造文档碎片并放入数组
                    dom = dom || accessor.fragment.cloneNode(true);
                    var add = unshift == true ? "unshift" : "push"
                    accessor.fragments[add]( patchFragment(dom) );//fragments用于foreach,with等循环生成子节点的绑定中
                    return dom;
                }
                var clone = accessor.cloneFragment();  //先改造一翻,方便在update时调用recover方法
                node.appendChild( clone );          //将文档碎片中的节点放回DOM树
            },
            update: function(node, val, accessor, model, names, values){
                $.ViewBindings['template']['update'](node, val, function(){
                    switch(type){//返回结果可能为 -1 0 1 2
                        case "if"://因为if/unless绑定总是对应一个布尔值
                            return [ !!val - 0, accessor];//1 if
                        case "unless":
                            return [!val - 0, accessor]; //0  unless
                        case "with":
                            return [2, accessor, val];   //2  with
                        default:
                            return [-1, accessor];       //-1 foreach
                    }
                }, model, names, values);
            },
            stopBindings: true
        }
    });
    //foreach绑定拥有大量的子方法,用于同步数据的增删改查与排序,它们在convertToDomAccessor方法中被调用
    var foreach = $.ViewBindings.foreach;
    foreach.start = function( accessor, models, fragments, method, args ){
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
            accessor.cloneFragment();//将文档碎片复制到与模型集合的个数一致
        }
        return models
    };
    //push ok
    foreach.push = function( accessor, models, fragments, method, args ){
        var l = fragments.length
        for(var index = 0; index < args.length; index++ ){
            var n = index + l;
            var f =  changeToAccessors(n, models[n], models);
            f.$value = f;
            accessor.cloneFragment()
        }
    }
    //unshift ok
    foreach.unshift = function( accessor, models, fragments, method, args ){
        for(var index = 0; index < args.length; index++ ){
            var f =  changeToAccessors(index, models[index], models);
            f.$value = f;
            accessor.cloneFragment(0, true)
        }
        for( index = 0; index < models.length; index++ ){
            models[index].$key = index;//重排集合元素的$key
        }
    }
    // shift pop ok
    foreach.shift = function( accessor, models, fragments, method, args ){
        var fragment = fragments[method]();//取得需要移出的文档碎片
        fragment.recover() = null;//让它收集其子节点,然后一同被销毁
        for(var index = 0; index < models.length; index++ ){
            models[index].$key = index;//重排集合元素的$key
        }
    }
    foreach.pop = foreach.shift;
    foreach.splice = function( accessor, models, fragments, method, args ){
        var start = args[0], n = args.length - 2;
        var removes = fragments.splice(start, args[1]);
        //移除对应的文档碎片
        for(var i = 0; i < removes.length; i++){
            removes[i].recover();
        }
        for(i = 0; i < n; i++ ){
            //将新数据封装成域
            var index = start + i
            var f =  changeToAccessors(index, models[ index ], models);
            f.$value = f;
            //为这些新数据创建对应的文档碎片
            var dom = accessor.fragment.cloneNode(true);
            accessor.fragments.splice(index, 0, patchFragment(dom) );
        }
        for( index = start+n; index < models.length; index++ ){
            models[index].$key = index
        }
    }
    //对文档碎片进行改造，通过nodes属性取得所有子节点的引用，以方便把它们一并移出DOM树或插入DOM树
    function patchFragment( fragment ){
        fragment.nodes = $.slice( fragment.childNodes );
        fragment.recover = function(){
            this.nodes.forEach(function( el ){
                this.appendChild(el)
            },this);
        }
        return fragment;
    }
    //$.ViewBindings.class的辅助方法
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
        var accessor = $(this).model()
        if(typeof accessor == "function"){
            return accessor();
        }
    }
    //取得标签内的属性绑定，然后构建成bindWatch，并与ViewModel关联在一块
    function setBindingsToElement( model, pnames, pvalues ){    
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
                //如果这个绑定器明确指出不能继续往子节点进行绑定,或者是foreach绑定器,但此元素没有子节点,则不让它绑定了
                if(binding.stopBindings || key == "foreach" && Array.isArray(model[key]) && !model[key].length ){
                    continueBindings = false;
                }
                convertToDomAccessor(node, names, values, key, val, binding, model);
            }
        }
        return continueBindings;
    }

    //取得元素的所有子元素节点
    function getChildren( node ){
        var elems = [] ,ri = 0;
        for (node = node.firstChild; node; node = node.nextSibling){
            if (node.nodeType === 1){
                elems[ri++] = node;
            }
        }
        return elems;
    }
    //在元素及其后代中将数据隐藏与viewModel关联在一起
    //参数分别为model, pnames, pvalues
    function setBindingsToElements(){
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
        for(var i = 0, el; el = this[i++];){
            setBindingsToElements.apply(el, arguments );
        }
    }
    //通知此监控函数或数组的所有直接依赖者更新自身
    function updateDeps(accessor){
        var list = accessor.$deps || [] ;
        if( list.length ){
            var safelist = list.concat();
            for(var i = 0, el; el = safelist[i++];){
                delete el.$val;
                el()
            }
        }
    }
    //判定是否设置数据绑定的标记
    function hasBindings( node ){
        var str = node.getAttribute( BINDING );
        return typeof str === "string" && str.indexOf(":") > 1
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
