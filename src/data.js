//==================================================
// 数据缓存模块
//==================================================
$.define("data", "lang", function(){
    //$.log("已加载data模块");
    var remitter = /object|function/, rbrace = /^(?:\{.*\}|\[.*\])$/;
    $.mix( $, {
        _db: {},
        // 读写数据
        data : function( target, name, data, pvt ) {
            if(target && remitter.test(typeof target)){//只处理HTML节点与普通对象
                var id = $.getUid(target), isEl = target.nodeType === 1
                if(name === "@uuid"){
                    return id;
                }
                var database = isEl ? $._db: target,
                table = database[ "@data_"+id ] || (database[ "@data_"+id ] = {}),
                _table =  table.data || (table.data = {});
                if(isEl && !table.parsedAttrs){
                    var attrs = target.attributes;
                    //将HTML5单一的字符串数据转化为mass多元化的数据
                    for ( var i = 0, attr, val; attr = attrs[i++];) {
                        name = attr.name, val = attr.value
                        if ( name.indexOf( "data-" ) === 0 && typeof  value == "string" ) {
                            try {
                                data = val === "true" ? true :
                                val === "false" ? false :
                                val === "null" ? null :
                                isFinite( val ) ? +val :
                                rbrace.test( val ) ? $.parseJSON( val ) :
                                val;
                            } catch( e ) {
                                val = undefined
                            }
                            _table[ name + id ] = val
                        }
                    }
                    table.parsedAttrs = true;
                }
                if ( !pvt ) {
                    table = _table;
                }
                var getByName = typeof name === "string";
                if ( name && typeof name == "object" ) {
                    $.mix(table, name);
                }else if(getByName && data !== void 0){
                    table[ name ] = data;
                }
                return getByName ? table[ name + id ] || table[ name ] : table;
            }
        },//仅内部调用
        _data:function(target,name,data){
            return $.data(target, name, data, true)
        },
        //移除数据
        removeData : function(target, name, pvt){
            if(target && remitter.test(typeof target)){
                var id =  $.getUid(target);
                if (  !id ) {
                    return;
                }
                var  clear = 1, ret = typeof name == "string",
                database = target.nodeType === 1  ? $._db : target,
                table = database["@data_"+id] ;
                if ( table && ret ) {
                    if(!pvt){
                        table = table.data
                    }
                    if(table){
                        ret = table[ name ];
                        delete table[ name ];
                    }
                    var cache = database["@data_"+id];
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
                    delete database["@data_"+id];
                }
                return ret;
            }
        },
        //合并数据
        mergeData:function(neo, src){
            var srcData = $._data(src), neoData = $._data(neo), events = srcData.events;
            if(srcData && neoData){
                $.Object.merge( neoData, srcData );
                if(events){
                    delete neoData.callback;
                    neoData.events = {};
                    for ( var type in events ) {
                        for (var i = 0, obj ; obj =  events[ type ][i++]; ) {
                            $.event.bind.call( neo, obj );
                        }
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
*/
