define("mvvm","$event,$css,$attr".split(","), function($){
    var source = {}
    $.applyBindings = function(  model, node ){
        node = node || document.body;
        model = $.ViewModel( model );
        console.log( model )
        setBindingsToElements (node, model)
    }
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
    //在写框架时，最担心的事是——这些api设计得合理吗？使用者们能以多低的成本理解我的设计意图？
    //我的设计是在帮助他们，还是在限制他们？在保持功能不变的情况下，学习成本还能进一步降低吗？
    //对于写框架，我有种敬畏心理，感激愿意使用你框架的人，要为易用性、灵活性和健壮性负责，这是很大的挑战。
    function setBindingsToElement( node, model, bindings ){   
        var continueBindings = true;
        for(var i = 0, bind; bind = bindings[i++];){
            var args = parseBinding(bind[0]);
            if(!args){
                continue
            }
            var  match = bind[1].split(/\s*:\s*/),
            accessor = model,
            names = match[0], 
            callback = match[1];
            names = names.split(".");
            for(var k = 0, name; name = names[k++];){
                if( accessor[name]){
                    accessor = accessor[name];
                }
            }
            if(!accessor){
                continue
            }
            var binding = args.shift();
            if(binding.stopBindings || binder[0] == "each" && Array.isArray(accessor) && !accessor.length ){
                continueBindings = false;
            }
            console.log(node)
            convertToDomAccessor(node, binding, accessor, model, callback, args);
        }
        return continueBindings;
    }
    function convertToDomAccessor(node, binding, accessor, args, callback){
        binding.update && binding.update(node, accessor, args, callback)
    }
    //DOM访问器，直接与DOM树中的节点打交道的访问器，是实现双向绑定的关键。
    //它们仅在用户调用了$.View(viewmodel, node )方法，才根据用户写在元素节点上的bind属性生成出来。
    //names values 包含上一级的键名与值
    function convertToDomAccessor (node, binding, accessor, model, callback, args ){
        function accessor( neo ){
            if( !accessor.$uuid ){ //只有在第一次执行它时才进入此分支
                if( binding == $.ViewBindings.each ){
                    var p = accessor["$"+expando] || ( accessor[ "$"+ expando] =  [] );
                    $.Array.ensure( p ,accessor);
                    arguments = ["start"];
                }
                bridge[ expando ] = accessor;
            }
            var val = accessor()
            if( !accessor.$uuid ){
                delete bridge[ expando ];
                accessor.$uuid = ++uuid;
                //第四个参数供流程绑定使用
                binding.init && binding.init(node, val, accessor);
            }
            var method = arguments[0], more = arguments[1]
            if( typeof binding[method] == "function" ){
                //处理foreach.start, sort, reserve, unshift, shift, pop, push....
                var ret = binding[method]( accessor, val, accessor.fragments, method, more );
                if( ret ){
                    val = ret;
                }
            }
            //只有执行到这里才知道要不要中断往下渲染
            binding.update(node, val, accessor, model, callback, args, more);
            return accessor.$val =  val + ":"+accessor.$uuid  //val;
        }
        return completeAccessor( "interacted" ,accessor, node);
    }
    function parseBinding( str ){
        var array = str.slice(5).split("-") 
        var binding = $.ViewBindings[ array[0] ];
        if( binding){
            array[0] = binding;
            return array;
        }else{
            return false;
        }
    }
    $.ViewBindings  = {
        "each" : function(){
            
        },
        text: {
            update: function(node, value){
                if("innerText" in node){
                    node.innerText = value;
                }else{
                    node.textContent = value;
                }
            }
        }
    }
    //参数分别为model, pnames, pvalues
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
    var rbingName = /^bind\-/, rbindValue = /\w+(?:\.|\s*:\s*)\w+/
    function getBindings( node ){
        var ret = []
        for ( var j = 0, attr; attr = node.attributes[ j++ ]; ){
            if( attr.specified ){//复制其属性
                if( rbingName.test(attr.name) && rbindValue.test(attr.value)){
                    ret.push( [attr.name, attr.value.trim()] )
                }
            }
        }
        return ret
    }
    $.ViewModel = function(data, model){
        model = model || {   };
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
    var bridge = {}, //用于收集依赖
    uuid = 0, expando = new Date - 0;
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

    //集合访问器，这是一个特别的数组对象， 用于一组数据进行监控与操作，当它的顺序或个数发生变化时，
    //它会同步到DOM对应的元素集合中去，因此有关这个数组用于添加，删除，排序的方法都被重写了
    //我们可以在页面通过foreach绑定此对象
    function convertToCollectionAccessor(array, models){
        models = models || [];
        for(var index = 0; index < array.length; index++){
            convertToAccessor(index, array[index], models);
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
        return models;
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
    
    
    
    
    
    
    return $;
})

