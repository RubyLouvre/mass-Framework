
$.define("avalon","data,attr,event,fx", function(){
    //knockout的缺陷
    //1看这里，许多BUG没有修https://github.com/SteveSanderson/knockout/issues?page=1&state=open
    //2里面大量使用闭包，有时多达七八层，性能感觉不会很好
    //3with的使用会与ecma262的严格模式冲突
    //4代码隐藏（指data-bind）大量入侵页面，与JS前几年提倡的无侵入运动相悖
    //5好像不能为同一元素同种事件绑定多个回调
    //人家花了那么多心思与时间做出来的东西,你以为是小学生写记叙文啊,一目了然....
    /* JS UI Component 最终还是通过 HTML 来描述界面，当 js object 的数据发生变化或者执行某个动作时，
    需要通知到对应的html，使其发生相应变化。于是js object 需要得到他在页面上对应的html的句柄，
    通常做法，是在创建html的时候将createElement返回的句柄保存在js object 内部的某个变量中，
    或者赋值给html eLement一个唯一的ID，js object 根据这个ID来找到对应的HTML Element。同样，
    当htm elementl的事件（例如onclick）要通知到相对应的 js object 或者回调js object的某个
    方法或属性时，也需要得到该js object的一个引用。我的意思是建立一种统一的规则，js object
    和他相对应的 html 能通过这种规则互相访问到对方。 建立这个关联以后，实现js object和
    对应 html 的数据邦定和数据同步等问题就简单多了
     */
    // var validValueType = $.oneObject("Null,NaN,Undefined,Boolean,Number,String")
    var disposeObject = {}
    var cur, ID = 1;
    var registry = {}
    var dependent = {}
    var fieldFns = {
        ensure : function(d){
            if(this.list.indexOf(d) == -1){
                this.list.push(d);
            }
        },
        lock : function(){
            this.locked = true;
        },
        unlock : function(){
            delete this.locked;
        },
        notify : function(){//通知依赖于field的上层$.computed更新
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
                $.mix(field, fieldFns);
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
        ("pop,push,shift,unshift,slice,splice,sort,reverse,remove,removeAt").replace( $.rword, function( method ){
            field[method] = function(){
                var array = this(), n = array.length
                Array.prototype.unshift.call(arguments, array);
                $.Array[method].apply( $.Array, arguments );
                if( /sort|reverse|splice/.test(method) ){
                    field.notify()
                }else if( array.length != n  ){
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
    //dataFor与contextFor是为事件的无侵入绑定服务的
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
        return context ? context['$data'] : void 0;
    };
    //在元素及其后代中将数据隐藏与viewModel关联在一起
    function setBindingsToElementAndChildren( node, source, setData ){
        if ( node.nodeType === 1  ){
            var continueBindings = true;
            if( $.avalon.hasBindings( node ) ){
                continueBindings = setBindingsToElement(node, source, setData ) 
            }
            if( continueBindings ){
                var elems = getChildren( node )
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
            if( key == "case"){//这个应该如何处理更好呢?
                if(field  === context.$switch){//$default;
                    neo = !context.$switch.not;
                }else{
                    //如果前面有一个通过,那么它将不会进入$default分支;
                    neo = context.$switch() == neo;
                    if( neo ){
                        context.$switch.not = true;
                    }
                }
            }
            if(initPhase === 0 ||  cur != neo || Array.isArray(cur)   ){//只要是处理bool假值的比较
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
        "switch":{
            init:function( node, val, field, context){
                context.$switch = field;
                context.$default = field
                setBindingsToChildren( node.childNodes, context )
            },
            update:function(node, val, field, context){
                delete context.$switch.not;//每次都清空它
            },
            stopBindings: true
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
    "if,unless,with,foreach,case".replace($.rword, function( type ){
        $.bindingAdapter[ type ] = {
            update : function(node, val, field, context, symptom){
                if(type == "case" && (typeof context.$switch != "function" )){
                    throw "Must define switch statement above all";
                }
                $.bindingAdapter['template']['update'](node, val, function(){
                    switch(type){//返回结果可能为 -1 0 1 2
                        case "case":
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
    });



    var Tmpl = function(t){
        this.template = t
        this.nodes = $.slice(t.childNodes)
    }
    Tmpl.prototype.recovery = function(){
        this.nodes.forEach(function( el ){
            this.template.appendChild(el)
        },this);
        return this.template
    }
    //http://net.tutsplus.com/tutorials/javascript-ajax/5-awesome-angularjs-features/
    /*
         * Data-binding is probably the coolest and most useful feature in AngularJS. It will save you from writing a considerable amount of boilerplate code. A typical web application may contain up to 80% of its code base, dedicated to traversing, manipulating, and listening to the DOM. Data-binding makes this code disappear, so you can focus on your application.
Think of your model as the single-source-of-truth for your application. Your model is where you go to to read or update anything in your application. The data-binding directives provide a projection of your model to the application view. This projection is seamless, and occurs without any effort from you.
Traditionally, when the model changes, the developer is responsible for manually manipulating the DOM elements and attributes to reflect these changes. This is a two-way street. In one direction, the model changes drive change in DOM elements. In the other, DOM element changes necessitate changes in the model. This is further complicated by user interaction, since the developer is then responsible for interpreting the interactions, merging them into a model, and updating the view. This is a very manual and cumbersome process, which becomes difficult to control, as an application grows in size and complexity.
There must be a better way! AngularJS’ two-way data-binding handles the synchronization between the DOM and the model, and vice versa.
         */
    $.bindingAdapter[ "template" ] = {
        update: function(node, data, field, context, symptom){
            var ganso = symptom.ganso//取得最初的那个节点的内部作为模块
            if( !symptom.ganso ){//缓存,省得每次都创建
                //合并文本节点数
                node.normalize();
                //保存模板
                ganso = node.ownerDocument.createDocumentFragment();
                while((el = node.firstChild)){
                    ganso.appendChild(el)
                }
                symptom.ganso = ganso;
                //复制一份出来放回原位
                var first = ganso.cloneNode(true);
                symptom.references = [ new Tmpl( first ) ];//先取得nodes的引用再插入DOM树
                node.appendChild( first );
                symptom.prevData = [{}];//这是伪数据，目的让其update
                
            }
            //  console.log("===============")
            var code = field(),  el;
            first = symptom.references[0];
            // console.log(code)
            if( code > 0 ){ //处理with if bindings
                template = first.recovery();
                var elems = getChildren( template );
                node.appendChild( template );  //显示出来
                if( elems.length ){
                    if( code == 2 ){//处理with bindings
                        context = new $.viewModel( data, context )
                    }
                    return setBindingsToChildren( elems, context, true )
                }
            }else if( code == 0){//处理unless bindings
                first.recovery();
            }
            if( code < 0  && data && isFinite(data.length) ){//处理foreach bindings
                var scripts = getEditScripts( symptom.prevData, data, true ), hasDelete
                //obj必须有x,y
                for(var i = 0, n = scripts.length; i < n ; i++){
                    var obj = scripts[i], tmpl = false;
                    switch(obj.action){
                        case "update":
                            tmpl = symptom.references[ obj.x ];//这里要增强
                            break;
                        case "add":
                            tmpl =  new Tmpl( ganso.cloneNode(true) );
                            symptom.references.push( tmpl );
                            break;
                        case "retain":
                            //如果发生删除操作，那么位于删除元素之后的元素的索引值会发生改变
                            //则重置它们
                            if(obj.x !== obj.y){
                                tmpl = symptom.references[ obj.x ];
                                tmpl.index(obj.y);
                                tmpl = null;
                            }
                            break;
                        case "delete":
                            tmpl = symptom.references[ obj.y ];
                            $(tmpl.nodes).remove();
                            hasDelete = tmpl.destroy = true;
                            tmpl = null;
                            break;
                    };
                    if(tmpl){
                      
                        (function( k, tmpl ){
                            var template = tmpl.template
                            if(!template.childNodes.length){
                                tmpl.recovery();//update
                            }
                            tmpl.index = $.observable(k)
                            var subclass = new $.viewModel( data[ k ], context);
                            subclass.extend( {
                                $index:  tmpl.index
                               // $item: data[ k ]
                            } )
//                            .alias("$itemName", "$data")
//                            .alias("$indexName", "$index");
                               
                            elems = getChildren( template );
                            node.appendChild( template );
                            if(elems.length){
                                setBindingsToChildren(elems, subclass, true, true );
                            }
                        })(obj.y || 0, tmpl);
                    }
                }
                symptom.prevData = data.concat();
                if(hasDelete){
                    symptom.references = symptom.references.filter(function(el){
                        return !el.destroy
                    })
                };
               
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
        var elems = [] ,ri = 0;
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
            var i, j, td;
            for(i = 0; i <= tn; i++){
                matrix[i] = [i];//设置第一列的值
                table && table.insertRow(i)
            }
            for(j = 0; j <= fn; j++){
                matrix[0][j] = j;//设置第一行的值
                if(table){
                    for(i = 0; i <= tn; i++){
                        td = table.rows[i].insertCell(j);
                        if(isFinite(matrix[i][j])){
                            td.innerHTML = matrix[i][j];
                            td.className = "zero";
                        }
                    }
                }
            }
            // 填空矩阵
            for(i = 1; i <= tn; i++){
                for(j = 1; j <= fn; j++){
                    if( to[i-1] == from[j-1] ){
                        matrix[i][j] = matrix[i-1][j-1];//保留
                    } else {
                        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, //更新
                            matrix[i][j-1] + 1, // 插入
                            matrix[i-1][j] + 1); //删除
                    }
                    if(table){
                        td = table.rows[i].cells[j];
                        td.innerHTML = matrix[i][j];
                    }
                }
            }
            $.log(matrix.join("\n"));
            return matrix;
        };
        //返回具体的编辑步骤
        var _getEditScripts = function(from, to, matrix, table){
            var x = from.length, y = to.length, scripts = [], _action;
            if(x == 0 || y == 0){//如果原数组为0,那么新数组的都是新增的,如果新数组为0,那么我们要删除所有旧数组的元素
                var n =  Math.max(x,y), action = x == 0 ? "add" : "delete";
                for( var i = 0; i < n; i++ ){
                    scripts[scripts.length] = {
                        action: action,
                        x: i,
                        y: i
                    }
                }
            }else{
                while( 1 ){
                    var cur = matrix[y][x];
                    if( y == 0 && x == 0){
                        break;
                    }
                    var left = matrix[y][x-1]
                    var diagon = matrix[y-1][x-1];
                    var top = matrix[y-1][x];
                    action = "retain"//top == left && cur == diagon
                    var min = Math.min(top, diagon, left);
                    var td =  table && (table.rows[y].cells[x]);
                    x--;
                    y--;
                    if( min < cur ){
                        switch(min){
                            case top:
                                action = "add";
                                x++;
                                break;
                            case left:
                                action = "delete";
                                y++;
                                break;
                            case diagon:
                                action = "update";
                                if(_action){
                                    action = _action;
                                    _action = false;
                                }
                                break;
                        }
                    } else{
                        switch(min){
                            case top:
                                _action = "add";
                                x++;
                                break;
                            case left:
                                _action = "delete";
                                y++;
                                break;
                        }
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
            return scripts
        }

        return function( old, neo, debug ){
            if(debug){
                debug = document.createElement("table");
                document.body.appendChild(debug);
                debug.className = "compare";
            }
            var matrix = getEditDistance( old, neo, debug );
            return _getEditScripts( old, neo, matrix, debug );
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
//                    if(insertFields === true && key === "foreach"){//特殊处理foreach
//                        var array = val.match($.rword);
//                        val = array.shift();
//                        if(array[0] === "as"){//如果用户定义了多余参数
//                            extra.$itemName = array[1];
//                            extra.$indexName = array[2];
//                        }
//                    }
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

   