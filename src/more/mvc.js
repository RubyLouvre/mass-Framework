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