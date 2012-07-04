
$.define("avalon","data,attr,event,fx", function(){
    //knockout的缺陷
    //1看这里，许多BUG没有修https://github.com/SteveSanderson/knockout/issues?page=1&state=open
    //2里面大量使用闭包，有时多达七八层，性能感觉不会很好
    //3with的使用会与ecma262的严格模式冲突
    //4代码隐藏（指data-bind）大量入侵页面，与JS前几年提倡的无侵入运动相悖
    //5好像不能为同一元素同种事件绑定多个回调
    //人家花了那么多心思与时间做出来的东西,你以为是小学生写记叙文啊,一目了然....
    var validValueType = $.oneObject("Null,NaN,Undefined,Boolean,Number,String")
    var disposeObject = {}
    var cur, ID = 1;
    var registry = {}
    var dependent = {}
    $.avalon = {
        //为一个Binding Target(节点)绑定Binding Source(viewModel)
        setBindings: function( source, node ){
            node = node || document.body; //确保是绑定在元素节点上，没有指定默认是绑在body上
            //开始在其自身与孩子中绑定
            return setBindingsToElementAndChildren( node, source, true );
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
        //开始收集依赖
        detectBegin: function( field ){
            var uuid = $.avalon.register( field )
            if( cur ){
                cur[uuid] = field
            }
            //用于收集依赖
            var prev = cur;
            cur = dependent[uuid];
            cur.prev = prev
        },
        //添加依赖到链中
        detectAdd: function( field ){
            if(cur){
                var uuid = $.avalon.register( field )
                cur[ uuid ] = field;
            }
        },
        //结束依赖收集
        detectEnd: function( field ){
            var deps = dependent[ field.observableID ] || {};
            cur = deps.prev;
            for(var key in deps){
                if(deps.hasOwnProperty(key) && (key != "prev")){
                    var low = registry[ key ];
                    low.ensure(field)
                }
            }
        },
        //注册依赖
        register: function( field ){
            var uuid = field.observableID
            if(!uuid || !registry[uuid] ){
                field.observableID  = uuid = "observable" +(++ID);
                registry[uuid] = field;//供发布者使用
                dependent[uuid] = {};//收集依赖
                field.list = []
                field.ensure = function(d){
                    if(this.list.indexOf(d) == -1){
                        this.list.push(d);
                    }
                }
                field.lock = function(){
                    this.locked = true;
                }
                field.unlock = function(){
                    delete this.locked;
                }
                field.notify = function(){//通知依赖于field的上层$.computed更新
                    var list = this.list || [] ;
                    if( list.length ){
                        var safelist = list.concat(), dispose = false
                        for(var i = 0, el; el = safelist[i++];){
                            delete el.cache;//清除缓存
                            if(el.locked === true)
                                break
                            if(el.dispose === true || el() == disposeObject ){//通知顶层的computed更新自身
                                el.dispose = dispose = true
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
            return uuid;
        }
    }

    $.observable = function( val ){
        var cur = val;
        function field( neo ){
            $.avalon.detectAdd(field)
            if( arguments.length ){//setter
                if(cur !== neo ||  Array.isArray(cur)  ){
                    cur = neo;
                    field.notify()
                }
            }else{//getter
                return cur;
            }
        }
        field.toString = field.valueOf = function(){
            return cur;
        }
        field();
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
            if( arguments.length ){
                if(typeof setter === "function"){
                    field.lock()
                    //setter会唤起其依赖的$.observable与$.computed重新计算自身，但它们也会触发其上级更新自身
                    //由于自身已经先行更新了，没有再计算一次
                    neo = setter.apply( scope, arguments );
                    field.unlock()
                }
            }else{
                if( "cache" in field ){//getter
                    neo = field.cache;//从缓存中读取,防止递归读取
                }else{
                    neo = getter.call( scope );
                    field.cache = neo;//保存到缓存
                }
            }
            if(cur !== neo || Array.isArray(cur) && (JSON.stringify(cur) != JSON.stringify(neo)) ){
                cur = neo
                field.notify()
            }
            return cur;
        }
        field.toString = field.valueOf = function(){
            return cur;
        }
        $.avalon.detectBegin( field )
        field();
        $.avalon.detectEnd( field )
        return field;
    }
    $.observableArray = function(array){
        if(!arguments.length){
            array = []
        }else if(!Array.isArray){
            throw "$.observableArray arguments must be a array"
        }
        var field = $.observable(array);
        makeObservableArray(field);
        return field;
    }
    function makeObservableArray( field ){
        ("pop,push,shift,unshift,slice,splice,sort,reverse,map,filter,unique,flatten,merge,"+
            "union,intersect,diff,sortBy,pluck,shuffle,remove,removeAt,inGroupsOf").replace( $.rword, function( method ){
            field[method] = function(){
                var array = this(), n = array.length, change
                Array.prototype.unshift.call(arguments, array);
                var result = $.Array[method].apply( $.Array, arguments );
                if(method !== "splice" && Array.isArray(result)){
                    field(result);
                    change = true
                }
                if(method == "sort" || method == "reverse" || array.length != n || change && result.length != n  ){
                    field.notify()
                }
            }
        });
    }
    //template - name
    //foreach - data
    //value - data
    //options - data
    //event - handler
    //MVVM三大入口函数之一
    $.applyBindings = $.setBindings = $.avalon.setBindings;
    var parseBindings = $.avalon.parseBindings;
    $.contextFor = function(node) {
        switch (node.nodeType) {
            case 1:
                var context = $._data(node,"bindings-context");
                if (context) return context;
                if (node.parentNode) return $.contextFor(node.parentNode);
                break;
            case 9:
                return void 0
        }
        return void 0;
    };
    $.dataFor = function(node) {
        var context = $.contextFor(node);
        return context ? context['$data'] : undefined;
    };
    //在元素及其后代中将数据隐藏与viewModel关联在一起
    function setBindingsToElementAndChildren( node, source, setData ){
        if ( node.nodeType === 1  ){
            var continueBindings = true;
            if( $.avalon.hasBindings( node ) ){
                continueBindings = setBindingsToElement(node, source, setData ) //.shouldBindDescendants;
            }
            if( continueBindings ){
                var elems = getChildren(node)
                elems.length && setBindingsToChildren( elems, source, setData )
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
    function setBindingsToElement( node, context, setData ){
        //如果bindings不存在，则通过getBindings获取，getBindings会调用parseBindingsString，变成对象
        var callback = parseBindings( node, context )//保存到闭包中
        context = context instanceof $.viewModel ? context : new $.viewModel( context );
        if( setData ){
            $._data(node,"bindings-context",context)
        }
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
                associateDataAndUI( node, bindings[key], context, key, getBindings)
            }
        }
        return continueBindings;
    }
    //setBindingsToChildren的第三第四参数是为了实现事件的无侵入绑定
    function setBindingsToChildren(elems, context, setData, force){
        for(var i = 0, n = elems.length; i < n ; i++){
            var node = elems[i]
            setBindingsToElementAndChildren( node, context, setData && !force );
            if( setData && force ){//这是由foreach绑定触发
                $._data(node,"bindings-context", context)
            }
        }
    }
    //有一些域的依赖在定义vireModel时已经确认了
    //而对元素的操作的$.computed则要在bindings中执行它们才知
    function associateDataAndUI(node, field, context, key, getBindings){
        var adapter = $.bindingAdapter[key], initPhase = 0, cur;
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
                adapter.init && adapter.init(node, cur, field, context, symptom);
            }
            var neo = field();
          
            if(initPhase === 0 || cur != neo || Array.isArray(cur)   ){//只要是处理bool假值的比较
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
            init:  function( node, val, field, context ){
                if(context.$hoist && context.$hoist.nodeType == 1 ){
                    var expr =  node.tagName +"['data-bind'="+node.getAttribute("data-bind") +"]";
                    context.$hoisting && $(context.$hoist).delegate( expr,"change", function(){
                        field(node.checked);
                    });
                }else{
                    $(node).bind("change",function(){
                        field(node.checked);
                    });
                }
            },
            update:function(node, val ){
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
        }
    }
    //if unless with foreach四种bindings都是使用template bindings
    "if,unless,with,foreach".replace($.rword, function( type ){
        $.bindingAdapter[ type ] = {
            update : function(node, val, field, context, symptom){
                $.bindingAdapter['template']['update'](node, val, function(){
                    switch(type){//返回结果可能为 -1 0 1 2
                        case "if":
                            return !!val - 0;//1
                        case "unless":
                            return !val - 0;//0
                        case "with":
                            return 2;//2
                        default:
                            return -1;
                    }
                }, context, symptom);
            },
            stopBindings: true
        }
    })
    function retrieve( array ){
        array.forEach(function( obj ){
            obj.nodes.forEach(function( el ){
                obj.template.appendChild(el)
            });
        })

    }
    $.bindingAdapter[ "template" ] = {
        update: function(node, data, field, context, symptom){
            if( !symptom.template ){//缓存,省得每次都创建
                node.normalize();
                symptom.template = node.ownerDocument.createDocumentFragment();
                symptom.nodes = $.slice(node.childNodes);
                symptom.prevData = [{
                    template: symptom.template ,
                    nodes: symptom.nodes
                }];
            }
            var number = field(), template = symptom.template, el;
            if( number > 0 ){ //处理with if bindings
                var elems = getChildren( symptom.nodes )
                if( elems.length ){
                    if( number == 2 ){//处理with bindings
                        context = new $.viewModel( data, context )
                    }
                    return setBindingsToChildren( elems, context, true )
                }
            }else if(number == 0){//处理unless bindings
                while((el = node.firstChild)){
                    template.appendChild(el)
                }
            }
            if( number < 0  && data && isFinite(data.length) ){//处理foreach bindings
                retrieve( symptom.prevData  ); //先回收原有的
                var curData = getEditScripts( symptom.prevData, data );
                console.log(curData)
                for(var i = 0, n = curData.length; i < n ; i++){
                    var obj = curData[i];
                    if(!obj.template){
                        obj.template = template.cloneNode(true);
                        obj.nodes =  $.slice(obj.template.childNodes);  
                    };
                    (function( k, frag ){
                        var subclass = new $.viewModel(data[ k ], context);
                        subclass.extend( {
                            $index: k,
                            $item: data[ k ]
                        } )
                        .alias("$itemName", "$data")
                        .alias("$indexName", "$index");
                        elems = getChildren( frag );
                        //  console.log(subclass)
                        node.appendChild( frag );
                        if(elems.length){
                            setBindingsToChildren(elems, subclass, true, true )
                        }
                    })(i, obj.template);
                }
                symptom.prevData = curData
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

    var getEditScripts = (function () {
        // 一个简单的Levenshtein distance算法
        //编辑距离就是用来计算从原串（s）转换到目标串(t)所需要的最少的插入，删除和替换的数目，
        //在NLP中应用比较广泛，如一些评测方法中就用到了（wer,mWer等），同时也常用来计算你对原文本所作的改动数。
        //http://www.cnblogs.com/pandora/archive/2009/12/20/levenshtein_distance.html
        //https://gist.github.com/982927
        //http://www.blogjava.net/phyeas/archive/2009/01/10/250807.html
        //通过levenshtein distance算法返回一个矩阵，matrix[y][x]为最短的编辑长度
        var getEditDistance = function(from, to, table){
            var matrix = [], fn = from.length, tn = to.length;
            // 初始化一个矩阵,行数为b,列数为a
            var i,j, td;
            for(i = 0; i <= tn; i++){
                matrix[i] = [i];//设置第一列的值
                table && table.insertRow(i)
            }
            for(j = 0; j <= fn; j++){
                matrix[0][j] = j;//设置第一行的值
                if(table){
                    for(i = 0; i <= tn; i++){
                        td = table.rows[i].insertCell(j);
                        td.innerHTML = j;
                    }
                }
            }
            if(table){
                table.rows[0].cells[0].className ="zero"
            }
            // 填空矩阵
            for(i = 1; i <= tn; i++){
                for(j = 1; j <= fn; j++){
                    if( to[i-1] == from[j-1] ){
                        matrix[i][j] = matrix[i-1][j-1];//没有改变
                    } else {
                        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, //代替 substitution
                            matrix[i][j-1] + 1, // 插入insertion
                            matrix[i-1][j] + 1); //删除 deletion
                    }
                    if(table){
                        td = table.rows[i].cells[j]
                        td.innerHTML = matrix[i][j]
                    }
                }
            }
            return matrix
        };
        //返回具体的编辑步骤
        var _getEditScripts = function(from, to, matrix, table){
            var x = from.length;
            var y = to.length;
            var scripts = []
            if(x == 0){//如果原数组为0,那么新数组的都是新增的
                for( ; i < y; i++){
                    scripts[scripts.length] = {
                        action: "add",
                        x: i
                    }
                }
            }else if(y == 0){//如果新数组为0,那么我们要删除所有旧数组的元素
                scripts = []
            }else{
                //把两个JSON合并在一起
                // $.log(matrix.join("\n"))
                var i =  Math.max(x,y),action;
                while( 1 ){
                    var cur = matrix[y][x];
                    if( y == 0 && x == 0){
                        break
                    }
                    var top = matrix[y-1][x];
                    var left = matrix[y][x-1]
                    var diagon = matrix[y-1][x-1];
                    action = "retain"//top == left && cur == diagon
                    var min = Math.min(top, diagon, left);
                    var td =  table && (table.rows[y].cells[x])
                    if( min < cur ){
                        switch(min){
                            case top:
                                action = "add";
                                y--
                                break;
                            case left:
                                action = "delete";
                                x--
                                break;
                            case diagon:
                                action = "update";
                                x--;
                                y--
                                break;
                        }
                    } else{
                        x--;
                        y--
                    }
                    if(table){
                        td.className = action;
                    }
                    scripts[scripts.length] = {
                        action:action,
                        x:x,
                        y:y
                    }
                }
            }
            scripts.reverse();
            var result = [];
            //我们只需要三种操作,从旧组数取得retain类型的元素,从新数组取得update与add类型的元素
            for( i = 0; i < scripts.length ; i++){
                var el = scripts[i]
                switch(el.action){
                    case "retain":
                        result[result.length] = {
                            value: from[el.x]
                        }
                        break;
                    case "add":
                    case "update":
                        result[result.length] = {
                            value: to[el.y]
                        }
                        break;
                }
            }
            return result;
        }

        return function( old, neo ){
            var matrix = getEditDistance( old, neo);
            return _getEditScripts( old, neo, matrix)
        }
    })();

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

   