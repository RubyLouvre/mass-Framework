//=========================================
// MVVM模块v3 by 司徒正美
//=========================================
define("mvvm","$event,$css,$attr".split(","), function($){
    var BINDING = $.config.bindname || "data", 
    bridge = {},  uuid = 0, expando = new Date - 0, subscribers = "$" + expando
    //ViewModel是一个由访问器与命令组成的对象
    //访问器是用于监控Model中的某个字段读写两用的函数，
    //当然有更高级的访问器，它是建立在多个访问器或字段上，依赖它们的结果计算出自己的值，像
    //fullName不存在于M中，它由lastName, firstName这个两个字段组成
    //命令是用于对字段进行再加工，验证，它们也可以作为事件绑定的回调
    $.applyBindings = function(  model, node ){
        node = node || document.body;
        model = convertToViewModel( model );
        setBindingsToElements (node, model)
        return model
    }
    //遍历DOM树，进行绑定转换，转换成DomAccessor，完成双向绑定链
    function setBindingsToElements (node, model){
        if ( node.nodeType === 1  ){
            var continueBindings = true;
            var bindings = getBindings( node )
            if( bindings.length ){
                continueBindings = setBindingsToElement(node, model, bindings );
            }
            if( continueBindings ){
                var elems = getChildren( node );
                elems.length && setBindingsToChildren(elems, model)
            }
        }
    }

    //取得目标路径下的访问器与命令
    function getItemByPath (names, accessor, fn, args){
        if( names ){
            if( args && args[0] === Bindings.on   ){
                args[2] = names;
            }else {
                names = names.split(".");
                for(var k = 0, name; name = names[k++];){
                    if( name in accessor){//accessor[name]可能为零
                        accessor = accessor[name];
                    }
                }
                if(fn && (typeof accessor != "function" || accessor.$uuid ) ){
                    return  //必须是普通函数，不能是访问器
                }
                return accessor;
            }
        }
    }
    //减少对选择器的依赖，将数据与操作绑定在坚固的支点上。
    //取得元素的数据绑定，转换为DomAccessor
    function setBindingsToElement( node, model, bindings ){
        var continueBindings = true;
        for(var i = 0, bind; bind = bindings[i++];){
            //取得MVVM的绑定器与用户参数,如data-on-click,绑定处理器为$.ViewBindings.on, 参数为"click"
            var args = parseBinding(bind[0]);
            if(!args){
                continue
            }//通过binding, 我们可以实现数据的传递; 通过command, 我们可以实现操作的调用
            var path = bind[1].split(/\s*\|\s*/),
            accessor = getItemByPath( path[0], model ),
            command = getItemByPath( path[1], model, true, args );
            // $.log(accessor, 7)
            if(accessor === void 0){//accessor可能为零
                continue
            }
            //移除数据绑定，防止被二次解析
            node.removeAttribute(bind[0]);
            var binding = args.shift();
            //如果该绑定指明不能往下绑,比如html, text会请空原节点的内部
            //或者是foreach绑定,但它又没有子元素作为它的动态模板就中止往下绑
            if(binding.stopBindings || binding == Bindings.each && Array.isArray(accessor) && !accessor.length ){
                continueBindings = false;
            }
            //将VM中的访问器与元素节点绑定在一起,具体做法是将数据隐藏抽象成第三种访问器----DOM访问器
            //DOM访问器通过绑定器操作属性访问器与组合访问器的值渲染页面,
            //而VM通过属性访问器与组合访问器驱动DOM访问器操作DOM
            convertToDomAccessor(node, binding, accessor, model, command, args);
        }
        return continueBindings;
    }
    //遍历同一元素的子元素，进行绑定转换
    function setBindingsToChildren( elems, model ){
        for(var i = 0, el; el = elems[i++];){
            setBindingsToElements(el, model );
        }
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
    var rbindValue = /^[\w$]+(?:(?:\s*\|\s*|\.)[\W\w]+)*$/
    function getBindings( node ){
        var ret = []//&& rbindValue.test(attr.value)
        for ( var j = 0, attr; attr = node.attributes[ j++ ]; ){
            
            if( attr.name.indexOf(BINDING+"-") == 0 ){
                ret.push( [attr.name, attr.value.trim()] )
            }
        }
        return ret
    }
    //转得符合要求的特性节点的值，替换框架自带的绑定器
    function parseBinding( str ){
        var array = str.slice(BINDING.length + 1).split("-") ;
        var binding = Bindings[ array[0] ];
        if( binding){
            array[0] = binding;
            return array;
        }else{
            return false;
        }
    }
    //通知此访问器或监控数组的所有直接订阅者更新自身
    function updateSubscribers( accessor ){
        var list = accessor[ subscribers ] || [] ;
        if( list.length ){
            var safelist = list.concat();
            for(var i = 0, el; el = safelist[i++];){
                if(typeof el == "function"){
                    delete el.$val;
                    el() //强制重新计算自身
                }
            }
        }
    }
    //双向绑定链 ：
    //属性访问器  ┓
    //组合访问器　┫→ 绑定器 ← DOM访问器 ← 数据绑定
    //集合访问器　┛
    function ViewModel(){}
    function convertToViewModel(data, parent){
        if(data instanceof ViewModel){
            return data;
        }
        var model = parent || new ViewModel;
        for(var p in data) {
            if(data.hasOwnProperty(p)){
                convertToAccessor(p, data[p], model);
            }
        }
        return model;
    }
    $.ViewModel = convertToViewModel;
    var err = new Error("只能是字符串，数值，布尔，Null，Undefined，函数以及纯净的对象")
    function convertToAccessor( key, val, model ){
        switch( $.type( val ) ){
            case "Null":
            case "Undefined":
            case "String":
            case "NaN":
            case "Number":
            case "Boolean"://属性访问器
                return convertToPropertyAccessor( key, val, model );
            case "Function"://回调
                if(val[expando] === expando){
                    convertToCombiningAccessor( key, val, model )
                    return 
                }
                
                return  model[key] = val; 
            case "Array"://组合访问器
                return  model[key] = convertToCollectionAccessor( val );
            case "Object"://转换为子VM
                if($.isPlainObject( val )){

                    var object = model[key] || (model[key] = {} );
                    convertToViewModel( val, object );
                    return object
  
                }else{
                    throw err;
                }
                break;
            default:
                throw err;
        }
    }

    //为访问器添加更多必须的方法或属性，让其真正可用！必要将它绑到VM中！
    function completeAccessor( key, accessor, host ){
        //收集依赖于它的访问器或绑定器，,以便它的值改变时,通知它们更新自身
        accessor.toString = function(){
            if( bridge[ expando ] ){
                $.Array.ensure( accessor[ subscribers ] , bridge[ expando ] );
            }
            return accessor.$val
        }
        if(!host.nodeType ){
            accessor.$key = key;
            if(Array.isArray(host)){
                $.log("这是数组"+key)
            }else{
                host[ key ] = accessor;
            }
         
        }
        if(!accessor[ subscribers ]){
            accessor[ subscribers ]  =  [];
            accessor();
        }
        return accessor;
    }
    
    //属性访问器，它是最简单的可读写访问器，位于双向依赖链的最底层，不依赖于其他访问器就能计算到自己的返回值
    function convertToPropertyAccessor( key, val, host ){
        function accessor( neo ){
            if( bridge[ expando ] ){ //收集依赖于它的访问器，,以便它的值改变时,通知它们更新自身
                $.Array.ensure( accessor[ subscribers ] , bridge[ expando ] );
            }
            if( arguments.length ){//在传参不等于已有值时,才更新自已,并通知其的依赖
                if( accessor.$val !== neo ){
                    accessor.$val = neo;
                    updateSubscribers( accessor );
                }
            }
            return accessor.$val;
        }
        accessor.$val = val;
        accessor.$uuid = ++uuid;
        return completeAccessor( key, accessor, host );
    }
    //convertToCombiningAccessor，组合访问器，是它在定义需要通过$.computed帮助生成。
    //它们是位于双向绑定链的中间层，需要依赖于其他属性访问器或组合访问器的返回值计算自己的返回值。
    //当顶层的VM改变了,通知底层的改变
    //当底层的VM改变了,通知顶层的改变
    //当中间层的VM改变,通知两端的改变

    
    function convertToCombiningAccessor( key, curry, host){
        var args = curry(), fn = args[0], deps = args[1] || [], scope = args[2] || host;
        function accessor( neo ){
            if( bridge[ expando ] ){ //收集它的订阅者，以便它的值改变时,通知它们更新自身
                $.Array.ensure( accessor[ subscribers ] , bridge[ expando ] );
            }
            var change = false
            if( arguments.length ){//写入新值
                fn.apply( scope, arguments );
            }else{
                if( !("$val" in accessor) ){
                    if( !accessor.$uuid ){
                        bridge[ expando ] = accessor;
                        accessor.$uuid = ++uuid;
                    }
                    neo = fn.call( scope );
                    change = true;
                    delete bridge[ expando ];
                }
            }
            //放到这里是为了当是最底层的accessor的值发出改变后,当前accessor跟着改变,然后再触发更高层的accessor
            if( change && (accessor.$val !== neo) ){
                accessor.$val = neo;
                //通知此accessor的所有订阅者更新自身
                updateSubscribers( accessor );
            }
            return accessor.$val;
        }
        for(var i = 0, el; el = deps[i++]; ){
            var item = getItemByPath(el, scope);
            if(item && item.$uuid){
                $.Array.ensure( item[ subscribers ] , accessor );
            }
        }
        return completeAccessor( key, accessor, host );
           
    }
    
    $.computed = function(fn, deps, scope){
        var args = arguments;
        function computed(){
            return args;
        }
        computed[expando] = expando;
        return computed
    }

    //集合访问器，这是一个特别的数组对象， 用于一组数据进行监控与操作，当它的顺序或个数发生变化时，
    //它会同步到DOM对应的元素集合中去，因此有关这个数组用于添加，删除，排序的方法都被重写了
    //我们可以在页面通过each绑定此对象
    function convertToCollectionAccessor(array, accessor){
        accessor = accessor || [];
        for(var index = 0; index < array.length; index++){
            convertToAccessor(index, array[index], accessor);
        }
        accessor.$uuid = ++uuid;
        accessor[ subscribers ] = accessor[ subscribers ] || [];
        String("push,pop,shift,unshift,splice,sort,reverse").replace($.rword, function(method){
            var nativeMethod = accessor[ method ];
            accessor[ method ] = function(){
                nativeMethod.apply( this, arguments);
                var visitors =  this[ subscribers ];
                for(var i = 0, visitor; visitor = visitors[i++];){
                    visitor(method, arguments);
                }
                updateSubscribers(this)
            }
        });
        accessor.clear = function(){
            accessor = [];
            var visitors =  this[ subscribers ] || [];
            for(var i = 0, visitor; visitor = visitors[i++];){
                visitor("clear", []);
            }
            updateSubscribers(this)
        }
        accessor.removeAt = function(index){//移除指定索引上的元素
            this.splice(index, 1);
        }
        accessor.remove = function(item){//移除第一个等于给定值的元素
            var index = this.indexOf(item);
            if(index !== -1){
                this.removeAt(index);
            }
        }
        accessor.toString = function(){
            if( bridge[ expando ] ){
                $.Array.ensure( this[ subscribers ], bridge[ expando ] );
            }
            return Array.apply([], this) +"";
        }
        return accessor;
    }
    //DOM访问器，直接与DOM树中的节点打交道的访问器，是实现双向绑定的关键。
    //它们仅在用户调用了$.applyBindings(model, node )方法，才根据用户写在元素节点上的bind属性生成出来。
    function convertToDomAccessor (node, binding, visitor, model, command, args ){
        function accessor( method ){
            if( !accessor.$uuid ){ //只有在第一次执行它时才进入此分支
                if( Array.isArray(  visitor ) || binding == Bindings.each ){
                    arguments = ["start"];
                }
                bridge[ expando ] = accessor;
            }
            var val;
            String(visitor);//强制获取依赖
            if(typeof visitor == "function" && visitor.$uuid && binding != Bindings.on ){
                val = visitor();
            }else{
                val = visitor
            }
            if(typeof command == "function"){
                val = command(val);
            }
            if( !accessor.$uuid ){
                delete bridge[ expando ];
                accessor.$uuid = ++uuid;
                //第四个参数供流程绑定使用
                binding.init && binding.init(node, val, visitor, accessor, command, args);
            }
            method = arguments[0];
            if(  convertToCollectionAccessor[method] ){
                //处理foreach.start, sort, reserve, unshift, shift, pop, push....
                var ret = convertToCollectionAccessor[method]( accessor, val, accessor.templates, method, arguments[1] );
                if( ret ){
                    val = ret;
                }
            }
            //只有执行到这里才知道要不要中断往下渲染
            binding.update && binding.update(node, val, accessor, model, command, args);
            return  accessor.$val = val
        }
        return completeAccessor( "interacted" ,accessor, node);
    }

    //对文档碎片进行改造，通过nodes属性取得所有子节点的引用，以方便把它们一并移出DOM树或插入DOM树
    function gatherReferences( node ){
        node.nodes = $.slice( node.childNodes );
        return node
    }
    function recoverReferences(node){//将这个动态模板所引用的节点全部移出DOM树
        if( node && Array.isArray(node.nodes)){
            for(var i = 0, el; el = node.nodes[i++];){
                node.appendChild(el)
            }
        }
        return node
    }
    //each绑定拥有大量的子方法,用于同步数据的增删改查与排序,它们在convertToCollectionAccessor方法中被调用
    var collection = convertToCollectionAccessor
    collection.start = function( accessor, array ){
        if(!Array.isArray(array)){
            var tmp = [];//处理对象的for in循环
            tmp.$isObj = true;
            for(var key in array){
                //通过这里模拟数组行为
                if(array.hasOwnProperty(key)  && key.indexOf("$")!= 0){
                    tmp.push( array[key] );
                }
            }
            array = tmp;
        }
        for(var i = 1; i < array.length; i++ ){
            accessor.addTemplate();//将文档碎片复制到与集合访问器的个数一致
        }
        return array
    };
    //push ok
    collection.push = function( accessor, models, templates, method, args ){
        var len = args.length, start = models.length - len;
        for(var i = 0; i < len; i++ ){
            var index = start + i
            convertToAccessor(index, models[index], models);
            if(!templates[index]){//确保集合个数与模板个数相同
                accessor.addTemplate( );
            }
        }
    }
    //unshift ok
    collection.unshift = function( accessor, models, templates, method, args ){
        for(var index = 0; index < args.length; index++ ){
            convertToAccessor(index, models[index], models);
            accessor.addTemplate( true )
        }
    }
    // shift pop ok
    collection.shift = function( accessor, models, templates, method, args ){
        var template = templates[method]();//取得需要移出的文档碎片
        recoverReferences(template); //让它收集其子节点,然后一同被销毁
    }
    collection.pop = collection.shift;
    collection.clear = function(accessor, models, templates, method, args){
        for(var i = 0, el; el = templates[i++];){
            recoverReferences( el );
        }
        accessor.templates = [];
    }
    collection.splice = function( accessor, models, templates, method, args ){
        var start = args[0], n = args.length - 2;
        var removes = templates.splice(start, args[1]);
        //移除对应的文档碎片
        for(var i = 0, el; el = removes[i++];){//移除无用的模板
            recoverReferences( el );
        }
        for(i = 0; i < n; i++ ){//如果它又添加了一些新数据，将这些新数据转换成accessor
            var index = start + i
            convertToAccessor(index, models[ index ], models);
            //为这些新数据创建对应的文档碎片
            var dom = accessor.primaryTemplate.cloneNode(true);
            accessor.templates.splice(index, 0, gatherReferences(dom) );
        }
    }

    //执行绑定在元素标签内的各种指令
    //MVVM不代表什么很炫的视觉效果之类的，它只是组织你代码的一种方式。有方便后期维护，松耦合等等优点而已
    var inputOne = $.oneObject("text,password,textarea,tel,url,search,number,month,email,datetime,week,datetime-local")
    var Bindings = $.ViewModel.bindings  = {
        text: {//替换文本
            update:  function( node, val ){
                val = val == null ? "" : val + "";
                if(node.childNodes.length === 1 && node.firstChild.nodeType == 3){
                    node.firstChild.data = val;
                }else{
                    $( node ).text( val );
                }
            }
        },
        html: {//设置innerHTML
            update: function( node, val ){
                $( node ).html( val );
            },
            stopBindings: true
        },
        value:{
            init: function(node, timeoutID, accessor){
                if(/input|textarea/i.test(node.nodeName) && inputOne[node.type]){
                    if(typeof accessor == "function"){
                        $(node).on("mouseenter focus",function(){
                            timeoutID = setInterval(function(){
                                accessor(node.value);
                            },50)
                        });
                        $(node).on("mouseleave blur",function(){
                            clearInterval(timeoutID);
                        });
                    }
                  
                }
            },
            update: function( node, val ){
                node.value = val;
            }
        },
        "class": {//相当于toggleClass
            update:  function( node, val ){
                var $node = $(node), type = typeof val
                if(val && type == "object"){
                    for(var cls in val){
                        if( val.hasOwnProperty(cls)){
                            var check = typeof val[cls] == "function" ? val[cls]() : val[cls];
                            if( check ){
                                $node.addClass(cls);
                            }else{
                                $node.removeClass(cls);
                            }
                        }
                    }
                }else {
                    $node.toggleClass( arguments[5][0] || val );
                }
            }
        },
        attr: {//添加属性
            update: function( node, val ){
                var  type = typeof val
                if(val && type == "object"){
                    for (var name in val) {
                        if(val.hasOwnProperty( name )){
                            $.attr(node, name, val[ name ]() );
                        }
                    }
                }else{
                    $.attr(node, arguments[5][0], val );
                }
            }
        },
        css: {//添加样式
            update: function( node, val ){
                var  type = typeof val
                if(val && type == "object"){
                    for (var name in val) {
                        if(val.hasOwnProperty( name )){
                            $.css(node, name, val[ name ]() );
                        }
                    }
                }else{
                    $.css(node, arguments[5][0], val );
                }
            }
        },
        display: {//根据传入值决定是显示还是隐藏
            update: function( node, val ){
                val = typeof val == "function" ? val() : val;
                $(node).toggle( !!val )
            }
        },
        on: {
            init: function(node, val, callback, type, selector, args){
                type = args[0];
                selector = args[1];
                if(selector){
                    $(node).on(type, selector, callback);
                }else{
                    //   $.bind(node, type, callback)
                    $(node).on(type, callback);
                }
            }
        },
        enable: {//让表单元素处于可用或不可用状态
            update: function( node, val ){
                if (val && node.disabled)
                    node.removeAttribute("disabled");
                else if ((!val) && (!node.disabled))
                    node.disabled = true;
            }
        },
        disable: {//同上
            update: function( node, val ){
                Bindings.enable.update(node, !val);
            }
        },
        options:{//为select标签添加一组子项目
            init: function(node, val, visitor, accessor){
                accessor.primaryTemplate = node.ownerDocument.createDocumentFragment()
                accessor.templates = []; //添加一个数组属性,用于储存经过改造的文档碎片
                accessor.addTemplate = $.noop;
            },
            update: function( node, val, accessor ){
                node.innerHTML = "";
                accessor.templates = []
                val.forEach(function(el){
                    var option;
                    if(typeof el == "function"){
                        option = new Option(el(), el());//使用Option兼容性最好
                    }else if(typeof el == "object"){
                        var text = el.text()
                        option = new Option( text, el.value ? el.value() : text );
                        for(var i in el){//其他属性一律当作自定义属性进行添加
                            if(el.hasOwnProperty(i) && i !== "text" && i !== "value"){
                                option[i] = typeof i =="function" ? el[i]() : el[i]
                            }
                        }
                    }
                    accessor.templates.push(option)
                    option && node.add(option);
                });
            }

        },
 
        template: {
            //它暂时只供内部使用，是实现if unless with each这四种流程绑定的关键
            update: function( node, val, accessor, model, code, args){
                //code对应 1 if,  0  unless,2  with -1 each
                var template = accessor.templates[0];      //取得原始模板
                if( code > 0 ){                            //处理with if 绑定
                    recoverReferences(template);            //将它所引用着的节点移出DOM树
                    var elems = getChildren( template );   //取得它们当中的元素节点
                    node.appendChild( template );          //再放回DOM树
                    if( elems.length ){
                        if( code == 2 ){                    //处理with 绑定
                            var fn = function(){}
                            fn.prototype = model;
                            model = new fn;
                            for(var name in val){
                                if(val.hasOwnProperty(name)){
                                    model[name] = val[name]
                                }
                            }
                        }
                        return setBindingsToChildren( elems, model )
                    }
                }else if( code === 0 ){                    //处理unless 绑定
                    recoverReferences(template);
                }
                if( code < 0  && val ){                    //处理each 绑定
                    var templates = accessor.templates;
                    if(!val.length && templates.length ){                    //如果对应集合为空,那么视图中的节点要移出DOM树
                        return recoverReferences( templates[0]);
                    }
                    for( var i = 0, el ; el = templates[i]; i++){
                        recoverReferences( el );      //先回收，以防在unshift时，新添加的节点就插入在后面
                        elems = getChildren( el );
                        node.appendChild( el );            //继续往元素的子节点绑定数据
                        (function(a, b){
                            if(args.length){
                                var fn = function(){}
                                fn.prototype = model;
                                var m = new fn;
                                if(args[0]){
                                    m[args[0]] = a;//item
                                }
                                if(args[1]){
                                    m[args[1]] = val.$isObj ? a.$key : b;//index
                                }
                            }else{
                                m = model;
                            }
                            setBindingsToChildren( elems, m );
                        })(val[i], i);
                    }
                }
            },
            stopBindings: true
        }
    }
    
    "if,unless,with,each".replace($.rword, function( type ){
        Bindings[ type ] = {
            //node, 子访问器的返回值, 子访问器(位于VM), 父访问器(分解元素bind属性得到DOMAccessor)
            init: function(node, val, accessor, model){
                accessor = model
                //开始编写模板
                node.normalize();                  //合并文本节点数
                var template = node.ownerDocument.createDocumentFragment(), el
                while((el = node.firstChild)){
                    template.appendChild(el);     //将node中的所有节点移出DOM树
                }
                accessor.primaryTemplate = template; //原始模板，仅用于复制
                //模板编写完成
                accessor.templates = [];              //添加一个数组属性,放置与集合访问器同等数量的模板
                accessor.addTemplate = function( unshift ){ //改造文档碎片并放入数组
                    var template = this.primaryTemplate.cloneNode(true);
                    var method = unshift == true ? "unshift" : "push"
                    //gatherReferences为新生的节点添加了个nodes数组，用于保存它的子节点的引用
                    this.templates[ method ]( gatherReferences( template ) );
                    return template;
                }
                template = accessor.addTemplate();  //先改造一翻,方便在update时调用recover方法
                node.appendChild( template );          //将文档碎片中的节点放回DOM树
            },
            update: function(node, val, accessor, model, code, args){
                Bindings['template']['update'](node, val, accessor, model,  (function(){
                    switch(type){//返回结果可能为 -1 0 1 2
                        case "if"://因为if/unless绑定总是对应一个布尔值
                            return  !!val - 0;//1 if
                        case "unless":
                            return  !val - 0; //0  unless
                        case "with":
                            return  2;        //2  with
                        default:
                            return -1;        //-1 each
                    }
                })(), args );
            },
            stopBindings: true
        }
    });
    
    
    return $;
})
//2012.8.31 完成 v1
//https://github.com/RubyLouvre/mass-Framework/commit/708e203a0e274b69729d08de8fe1cde2722520d2
//2012.9.22 完成 v2 90%代码重写，使用新的思路收集依赖完成双向绑定链
//2012.12.11 完成 v3 50% 代码重写 数据绑定部分焕然一新，属性名得到绑定器，
//属性值以|为界，前一部分得访问器或命令或表达式，其中访问器或命令可以通过.号深层遍历VM得到
//实现事件绑定与代理，添加options绑定，相当于ko的options与selectedOptions这两个绑定器
//value绑定是双向的，结合事件与定时器实现。
//IE9的兼容性问题 http://msdn.microsoft.com/zh-tw/ie/gg712396.aspx

 //人家花了那么多心思与时间做出来的东西,你以为是小学生写记叙文啊,一目了然....

//+    /* JS UI Component 最终还是通过 HTML 来描述界面，当 js object 的数据发生变化或者执行某个动作时
//+    需要通知到对应的html，使其发生相应变化。于是js object 需要得到他在页面上对应的html的句柄，
//+    通常做法，是在创建html的时候将createElement返回的句柄保存在js object 内部的某个变量中，
//+    或者赋值给html eLement一个唯一的ID，js object 根据这个ID来找到对应的HTML Element。同样，
//+    当htm elementl的事件（例如onclick）要通知到相对应的 js object 或者回调js object的某个
//+    方法或属性时，也需要得到该js object的一个引用。我的意思是建立一种统一的规则，js object
//+    和他相对应的 html 能通过这种规则互相访问到对方。 建立这个关联以后，实现js object和
//+    对应 html 的数据邦定和数据同步等问题就简单多了