$.require("flow,more/watcher",function(r,watcher){
    var Test = {
        attrs:{
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
    var attrs = Test.attrs, props = [];
    for(var prop in attrs){
        if(attrs.hasOwnProperty(prop)){
            var value = attrs[prop];
            // $.log(typeof value[value.length - 1] +" "+prop)
            if(Array.isArray(value)
                && value.length >= 2
                && (typeof value[0] =="function")
                && (typeof value[value.length - 1] === "string" ) ){
                var callback =  value.shift();
                //$.log(value[0])
                var reload = typeof value[0] == "boolean" ? value.shift() : false;
                //放进操作流中
                flow.bind(value, function(){
                    callback.call(attrs)
                },reload)
            }else{
                props.push(prop);
            }
        }
    }
    for(var i = 0, n = props.length; i < n; i++){
        watcher.watch(attrs, props[i], function(p){
            flow.fire( p )
        })
    }
    Test.attrs.firstName = "zzz"
    Test.attrs.lastName = "oooo";
    Test.attrs.lastName = "uuu"
});