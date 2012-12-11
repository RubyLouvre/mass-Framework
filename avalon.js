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
    function getTarget (names, accessor, fn, args){
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
    //在jQuery时代，ID是我们命中元素最可靠的基点，以此为起点八爪鱼般处理周遭的节点。
    //行为层上，我们可以通过事件绑定，几乎可以用根据代理一切事件。
    //在MVVM中，数据绑定与元素是一体的，因此绝没有片差。处理交互上，事件以命令的新身份登场，
    //回调被集合管理，状态被收笼于VM中，不再为如何组织代码现搔首，所有都有章而循，新手接力也易上手
    //取得元素的数据绑定，转换为DomAccessor
    function setBindingsToElement( node, model, bindings ){
        var continueBindings = true;
        for(var i = 0, bind; bind = bindings[i++];){
            //取得MVVM的绑定器与用户参数,如data-on-click,绑定处理器为$.ViewBindings.on, 参数为"click"
            var args = parseBinding(bind[0]);
            if(!args){
                continue
            }//通过binding, 我们可以实现数据的传递; 通过command, 我们可以实现操作的调用
            var match = bind[1].split(/\s*\|\s*/),
            accessor = getTarget( match[0], model ),
            command = getTarget( match[1], model, true, args );
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

    var rbindValue = /^[\w$]+(?:(?:\s*\|\s*|\.)[\W\w]+)*$/
    function getBindings( node ){
        var ret = []
        for ( var j = 0, attr; attr = node.attributes[ j++ ]; ){
            if( attr.name.indexOf(BINDING+"-") == 0 && rbindValue.test(attr.value)){
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
                delete el.$val;
                el() //强制重新计算自身
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
                return  model[key] = val; 
            case "Array"://组合访问器
                var models = model[key] || (model[key] = []);
                return convertToCollectionAccessor( val, models );
            case "Object"://转换为子VM
                if($.isPlainObject( val )){
                    if( $.isFunction( val.setter ) && $.isFunction( val.getter )){
                        return convertToCombiningAccessor( key, val, model, "setget");
                    }else{
                        var object = model[key] || (model[key] = {} );
                        convertToViewModel( val, object );
                        return object
                    }
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
        if(!host.nodeType){
            accessor.$key = key;
            host[ key ] = accessor;
        }
        accessor[ subscribers ]  = [];
        accessor();
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
    //convertToCombiningAccessor，组合访问器，是指在ViewModel定义时，值为类型为函数，或为一个拥有setter、getter函数的对象。
    //它们是位于双向绑定链的中间层，需要依赖于其他属性访问器或组合访问器的返回值计算自己的返回值。
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
                //收集订阅了它的访问器,以便它的值改变时,通知它们更新自身
                $.Array.ensure( accessor[ subscribers ] , bridge[ expando ] );
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
                updateSubscribers( accessor );
            }
            return accessor.$val;
        }
        return completeAccessor( key, accessor, host );
    }

    //集合访问器，这是一个特别的数组对象， 用于一组数据进行监控与操作，当它的顺序或个数发生变化时，
    //它会同步到DOM对应的元素集合中去，因此有关这个数组用于添加，删除，排序的方法都被重写了
    //我们可以在页面通过each绑定此对象
    function convertToCollectionAccessor(array, accessor){
        accessor = accessor || [];
        for(var index = 0; index < array.length; index++){
            convertToAccessor(index, array[index], accessor);
        }
        String("push,pop,shift,unshift,splice,sort,reverse").replace($.rword, function(method){
            var nativeMethod = accessor[ method ];
            accessor[ method ] = function(){
                nativeMethod.apply( accessor, arguments)
                var visitors =  accessor[ subscribers ];
                for(var i = 0, visitor; visitor = visitors[i++];){
                    visitor(method, arguments);
                }
            }
        });
        accessor.removeAt = function(index){//移除指定索引上的元素
            accessor.splice(index, 1);
        }
        accessor.remove = function(item){//移除第一个等于给定值的元素
            var array = accessor.map(function(el){
                return el();
            })
            var index = array.indexOf(item);
            accessor.removeAt(index);
        }
        accessor[ subscribers ] = accessor[ subscribers ] || [];
        accessor.toString =  function(){
            if( bridge[ expando ] ){
                $.Array.ensure( accessor[ subscribers ], bridge[ expando ] );
            }
            return Array.apply([], accessor) +"";
        }
        return accessor;
    }
    //DOM访问器，直接与DOM树中的节点打交道的访问器，是实现双向绑定的关键。
    //它们仅在用户调用了$.View(viewmodel, node )方法，才根据用户写在元素节点上的bind属性生成出来。
    //names values 包含上一级的键名与值
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
            if(typeof visitor == "function" && visitor.$uuid){
                val = visitor();
            }else{
                val = visitor
            }
            if(typeof command == "function"){
                val = command(val)
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
                var ret = convertToCollectionAccessor[method]( accessor, val, accessor.fragments, method, arguments[1] );
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

    //data-each-item?-index?
    //each绑定拥有大量的子方法,用于同步数据的增删改查与排序,它们在convertToCollectionAccessor方法中被调用
    var collection = convertToCollectionAccessor
    collection.start = function( accessor, models, fragments, method, args ){
        if(!Array.isArray(models)){
            $.log("处理对象的for in循环")
            var array = [];//处理对象的for in循环
            array.$isObj = true;
            for(var key in models){
                //通过这里模拟数组行为
                if(models.hasOwnProperty(key)  && key.indexOf("$")!= 0){
                    var value = models[key];
                    array.push( value );
                }
            }
            models = array;
        }
        for(var i = 1; i < models.length; i++ ){
            accessor.cloneFragment();//将文档碎片复制到与模型集合的个数一致
        }
        return models
    };
    //push ok
    collection.push = function( accessor, models, fragments, method, args ){
        var l = fragments.length
        for(var index = 0; index < args.length; index++ ){
            var n = index + l;
            convertToAccessor(n, models[n], models);
            accessor.cloneFragment();
        }
    }
    //unshift ok
    collection.unshift = function( accessor, models, fragments, method, args ){
        for(var index = 0; index < args.length; index++ ){
            convertToAccessor(index, models[index], models);
            accessor.cloneFragment(0, true)
        }
        for( index = 0; index < models.length; index++ ){
            models[index].$key = index;//重排集合元素的$key
        }
    }
    // shift pop ok
    collection.shift = function( accessor, models, fragments, method, args ){
        var fragment = fragments[method]();//取得需要移出的文档碎片
        fragment.recover && fragment.recover();//让它收集其子节点,然后一同被销毁
        for(var index = 0; index < models.length; index++ ){
            models[index].$key = index;//重排集合元素的$key
        }
    }
    collection.pop = collection.shift;
    collection.splice = function( accessor, models, fragments, method, args ){
        var start = args[0], n = args.length - 2;
        var removes = fragments.splice(start, args[1]);
        //移除对应的文档碎片
        for(var i = 0, el; el = removes[i++];){
            el.recover && el.recover ();
        }
        for(i = 0; i < n; i++ ){
            //将新数据封装成域
            var index = start + i
            convertToAccessor(index, models[ index ], models);
            //为这些新数据创建对应的文档碎片
            var dom = accessor.fragment.cloneNode(true);
            accessor.fragments.splice(index, 0, patchFragment(dom) );
        }
        for( index = start+n; index < models.length; index++ ){
            models[index].$key = index
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
                    $(node).on("mouseenter focus",function(){
                        timeoutID = setInterval(function(){
                            accessor(node.value);
                        },50)
                    });
                    $(node).on("mouseleave blur",function(){
                        clearInterval(timeoutID);
                    });
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
                $(node).toggle( !!val )
            }
        },
        on: {
            init: function(node, callback, type, selector, _, args){
                type = args[0];
                selector = args[1];
                if(selector){
                    $(node).on(type, selector, callback);
                }else{
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
                accessor.fragment = node.ownerDocument.createDocumentFragment()
                accessor.fragments = []; //添加一个数组属性,用于储存经过改造的文档碎片
                accessor.cloneFragment = $.noop;
            },
            update: function( node, val, accessor ){
                var display = node.style.display;
                node.innerHTML = "";
                accessor.fragments = []
                //http://lives.iteye.com/blog/966217
                val.forEach(function(el){
                    var option;
                    if(typeof el == "function"){
                        option = new Option(el(), el());
                    }else if(typeof el == "object"){
                        var text = el.text()
                        option = new Option( text, el.value ? el.value() : text );
                        for(var i in el){
                            if(el.hasOwnProperty(i) && i !== "text" && i !== "value"){
                                option[i] = typeof i =="function" ? el[i]() : el[i]
                            }
                        }
                    }
                    accessor.fragments.push(option)
                    option && node.add(option);
                });
                node.style.display = display;
            }

        },
 
        template: {
            //它暂时只供内部使用，是实现if unless with each这四种流程绑定的关键
            update: function( node, val, accessor, model, code, args){
                //code对应 1 if,  0  unless,2  with -1 each
                var fragment = accessor.fragments[0];      //取得原始模板
                if( code > 0 ){                            //处理with if 绑定
                    fragment.recover();                    //将它所引用着的节点移出DOM树
                    var elems = getChildren( fragment );   //取得它们当中的元素节点
                    node.appendChild( fragment );          //再放回DOM树
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
                    fragment.recover();
                }
                if( code < 0  && val ){                    //处理each 绑定
                    var fragments = accessor.fragments;
                    if(!val.length){                    //如果对应集合为空,那么视图中的节点要移出DOM树
                        fragments[0].recover();
                        return
                    }
                    for( var i = 0, el ; el = fragments[i]; i++){
                        el.recover();                      //先回收，以防在unshift时，新添加的节点就插入在后面
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
                    accessor.fragments[add]( patchFragment(dom) );//fragments用于each,with等循环生成子节点的绑定中
                    return dom;
                }
                var clone = accessor.cloneFragment();  //先改造一翻,方便在update时调用recover方法
                node.appendChild( clone );          //将文档碎片中的节点放回DOM树
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

//IE9的兼容性问题 http://msdn.microsoft.com/zh-tw/ie/gg712396.aspx