define("avalon",["$attr","$event"], function(){
    $.log("已加载avalon v2")
    //http://angularjs.org/
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
    var uuid = 0;
    var expando = new Date - 0;
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
    //用于生成一个高级域对象
    function computedFiled( host, key, val, type){
        var getter, setter//构建一个至少拥有getter,scope属性的对象
        if(type == "get"){//getter必然存在
            getter = val
        }else if(type == "setget"){
            getter = val.getter
            setter = val.setter;
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

    $.View = function(model, node){
        //确保是绑定在元素节点上，没有指定默认是绑在body上
        node = node || document.body; 
        //开始在其自身与孩子中绑定
        return setBindingsToElementAndChildren( node, model, true );
    }
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
        }
    }
    function hasBindings( node ){
        var str = node.getAttribute( "@bind" );
        return typeof str === "string" && str.indexOf(":") > 1
    }
    //在元素及其后代中将数据隐藏与viewModel关联在一起
    function setBindingsToElementAndChildren( node, model, setData ){
        if ( node.nodeType === 1  ){
            var continueBindings = true;
            if( hasBindings( node ) ){
                continueBindings = setBindingsToElement(node, model, setData )
            }
            if( continueBindings ){
        //  var elems = getChildren( node )
        //  elems.length && setBindingsToChildren( elems, model, setData )
        }
        }
    }

    //为当前元素把数据隐藏与视图模块绑定在一块
    function setBindingsToElement( node, model, setData ){
        //如果bindings不存在，则通过getBindings获取，getBindings会调用parseBindingsString，变成对象
        var attr = node.getAttribute("@bind"), names = [], fns = []
        for(var i in model){
            if(model.hasOwnProperty(i)){
                names.push(i);
                fns.push( model[i] )
            }
        }
        var fn = Function( names, " return {"+ attr+"}");
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
    function interactedFiled (node, value, directive ){
        function field(neo){
            if( arguments.length ){//如果是写方法,则可能改变其value值,并引发其依赖域的值的改变
                if( field.value !== neo ){
                    field.value = neo;
                }
            }
            if( directive.init && !field.init){
                directive.init(node, value())
            }
            field.init = 1
            directive.update(node, value())
            $.log("-------------------------")
            return field.value;
        }
        Field(node, "interacted" ,field);
        if( !field.uuid ){
            $.Array.ensure( value.parents, field );
            field.uuid = ++uuid;
        }
        return field
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