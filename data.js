//==================================================
// 数据缓存模块
//==================================================
define("data", ["$lang"], function(){
    $.log("已加载data模块",7);
    var remitter = /object|function/, rtype = /[^38]/;
    function innerData( target, name, data, pvt ) {//IE678不能为文本节点注释节点添加数据
        if( $.acceptData(target) ){
            var id = $.getUid(target), isEl = target.nodeType === 1;
            if(name === "@uuid"){
                return id;
            }
            var one = typeof name === "string",//取得指定值
            database = isEl ? $["@data"]: target,
            table = database[ "@data_"+id ] || (database[ "@data_"+id ] = {
                data:{}
            });
            var _table = table;
            //对于用HTML5 data-*属性保存的数据， 如<input id="test" data-full-name="Planet Earth"/>
            //我们可能通过$("#test").data("full-name")或$("#test").data("fullName")访问到
            if(isEl && !table.parsedAttrs){
                var attrs = target.attributes;
                //将HTML5单一的字符串数据转化为mass多元化的数据，并储存起来
                for ( var i = 0, attr; attr = attrs[i++];) {
                    var key = attr.name;
                    if (  key.length > 5 && !key.indexOf( "data-" ) ) {
                        $.parseData(target, key.slice(5), _table, attr.value);
                    }//camelize
                }
                table.parsedAttrs = true;
            }
            //私有数据都是直接放到table中，普通数据放到table.data中
            if ( !pvt ) {
                table = table.data;
            }
            if ( name && typeof name == "object" ) {
                $.mix( table, name );//写入一组方法
            }else if(one && data !== void 0){
                table[ name ] = data;//写入单个方法
            }
            if(one){
                if(name in table){
                    return table[name]
                }else if(isEl && !pvt){
                    return $.parseData( target, name, _table );
                }
            }else{
                return table
            }
        }
    }
    function innerRemoveData (target, name, pvt){
        if( $.acceptData(target) ){
            var id =  $.getUid(target);
            if (  !id ) {
                return;
            }
            var  clear = 1, ret = typeof name == "string",
            database = target.nodeType === 1  ? $["@data"] : target,
            table = database["@data_"+id],
            cache = table;
            if ( table && ret ) {
                if(!pvt){
                    table = table.data
                }
                if(table){
                    ret = table[ name ];
                    delete table[ name ];
                }
                    loop:
                    for(var key in cache){
                        if(key == "data"){
                            for(var i in cache.data){
                                clear = 0;
                                break loop;
                            }
                        }else{
                            clear = 0;
                            break loop;
                        }
                    }
            }
            if(clear){
                try{
                    delete database["@data_"+id];
                }catch(e){
                    database["@data_"+id] = void 0;
                }
            }
            return ret;
        }
    }

    $.mix( {
        "@data": {},
        acceptData: function( target ) {
            return target && remitter.test(typeof target) && rtype.test(target.nodeType)
        },
        data: function( target, name, data ) {  // 读写数据
            return innerData(target, name, data)
        },
        _data: function(target,name,data){//仅内部调用
            return innerData(target, name, data, true)
        },
        removeData: function(target, name){  //移除数据
            return innerRemoveData(target, name);
        },
        _removeData: function(target, name){//仅内部调用
            return innerRemoveData(target, name, true);
        },
        parseData: function(target, name, table, value){
            var data, key = $.String.camelize(name),_eval
            if(table && (key in table))
                return table[key];
            if(arguments.length != 4){
                var attr = "data-" + name.replace( /([A-Z])/g, "-$1" ).toLowerCase();
                value = target.getAttribute( attr );
            }
            if ( typeof value === "string") {//转换 /^(?:\{.*\}|null|false|true|NaN)$/
                if(/^(?:\{.*\}|\[.*\]|null|false|true|NaN)$/.test(value) || +value + "" === value){
                    _eval = true
                }
                try {
                    data = _eval ?  eval("0,"+ value ) : value
                } catch( e ) {
                    data = value
                }
                if(table){
                    table[ key ] = data
                }
            }
            return data;

        },
        //合并数据
        mergeData: function( cur, src){
            var oldData  = $._data(src), curData  = $._data(cur), events = oldData .events;
            if(oldData  && curData ){
                $.Object.merge( curData , oldData  );
                if(events){
                    curData .events = [];
                    for (var i = 0, item ; item =  events[i++]; ) {
                        $.event.bind( cur, item );
                    }
                }
            }
        }
    });
});

/**
2011.9.27 uniqueID改为uniqueNumber 简化data与removeData
2011.9.28 添加$._data处理内部数据
2011.10.21 强化mergeData，可以拷贝事件
2012.1.31 简化$.Object.merge的调用
2012.4.5 修正mergeData BUG, 让$.data能获取HTML5 data-*
2012.5.2 $._db -> $["@data]
2012.5.21 抽象出validate私有方法
2012.9.29 对parseData的数据进行严格的验证后才转换
*/
