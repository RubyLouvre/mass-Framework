$.require("flow",function(){
    var Test = {
        model:{
            firstName:"xxx",
            lastName:"yyy",
            fullName:[function(){
                $.log("执行fullName回调！")
                var val = this.firstName+" "+this.lastName;
                return val;
            },"firstName","lastName"]//返回一个带标识的数组
        }
    }

    var flow = new $.flow;
    var model = Test.model, fields = [];
    for(var prop in model){
        if(model.hasOwnProperty(prop)){
            var value = model[prop];
            if(Array.isArray(value)
                && value.length >= 2
                && (typeof value[0] =="function")
                && (typeof value[value.length - 1] === "string" ) ){
                var callback =  value.shift();
                var reload = typeof value[0] == "boolean" ? value.shift() : false;
                //放进操作流中
                flow.bind(value, function(){
                    callback.call(model)
                },reload);
                model[prop] = callback.call(model)
            }else{
                fields.push(prop);//取得原子属性
            }
        }
    }
    Test.set = function(key,value){
        var obj
        if ($.isPlainObject(key) ) {
            obj = key;
        } else {
            obj = {};
            obj[key] = value;
        }
        if (!obj) return this;
        for(var i in obj){
            if(obj.hasOwnProperty(i) && this.fields.indexOf(i) !== -1){
                var now = obj[i], prev = this.model[i];
                this.model[i] = now;
                if(now != prev){
                    flow.fire( i );
                }
            }
        }
    }
    Test.get = function( name ){
        return this.model[name]
    }
    Test.set("firstName", "aaa")
    $.log(Test.get("fullName"))

});//模型层必须提供get与set方法

var bindingProvider = function(){
    this.bindingCache = {};
}
bindingProvider.prototype = {
    //取得data-bind中的值
    getBindings: function(node, bindingContext) {
        return node.getAttribute("data-bind")
    },
    //转换为函数
    parseBindings: function(bindingsString, bindingContext){
        try {
            var viewModel = bindingContext['$data'];
            var scopes = (typeof viewModel == 'object' && viewModel != null) ? [viewModel, bindingContext] : [bindingContext];
            var cacheKey = scopes.length + '_' + bindingsString;//缓存
            var bindingFunction = this.bindingCache[cacheKey];
            if(typeof bindingFunction != "function" ){
                bindingFunction = this.createBindingsStringEvaluator(bindingsString, scopes.length)
            }
            return bindingFunction(scopes);
        } catch (ex) {
            throw new Error("Unable to parse bindings.\nMessage: " + ex + ";\nBindings value: " + bindingsString);
        }
    },
    createBindingsStringEvaluator : function(bindingsString, scopesCount) {
        var rewrittenBindings = " { " + ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson(bindingsString) + " } ";
        return this.createScopedFunction(rewrittenBindings, scopesCount);
    },
    createScopedFunction: function(expression,scopeLevels){
        var functionBody = "return (" + expression + ")";
        for (var i = 0; i < scopeLevels; i++) {
            functionBody = "with(sc[" + i + "]) { " + functionBody + " } ";
        }
        return new Function("sc", functionBody);
    }
}

    if (!$ || !$['fn']) throw new Error('jQuery library is required.');

    /**
    * Private method to recursively render key value pairs into a string
    *
    * @param {Object} options Object to render into a string.
    * @return {string} The string value of the object passed in.
    */
   //http://machadogj.com/demos/knocklist.html
   //http://machadogj.com/demos/Scripts/jquery.unobtrusive-knockout.js
    function render(options) {
        var rendered = [];
        for (var key in options) {
            var val = options[key];
            switch (typeof val) {
                case 'string': rendered.push(key + ':' + val); break;
                case 'object': rendered.push(key + ':{' + render(val) + '}'); break;
                case 'function': rendered.push(key + ':' + val.toString()); break;
            }
        }
        return rendered.join(',');
    }

    /**
    * jQuery extension to handle unobtrusive Knockout data binding.
    *
    * @param {Object} options Object to render into a string.
    * @return {Object} A jQuery object.
    */
    $['fn']['dataBind'] = $['fn']['dataBind'] || function(options) {
        return this['each'](function() {
            var opts = $.extend({}, $['fn']['dataBind']['defaults'], options);
            var attr = render(opts);
            if (attr != null && attr != '') {
                $(this)['attr']('data-bind', attr);
            }
        });
    }