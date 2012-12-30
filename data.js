//==================================================
// 数据缓存模块
//==================================================
define("data", ["$lang"], function( $ ){
    function Data(user) {
        this.owners = [];
        this.user = user;
        this.cache = [];
    }
    Data.prototype = {
        add: function( owner ) {
            var index = this.owners.push( owner );
            return (this.cache[ index - 1 ] = {});
        },
        access: function( owner, key, value ) {
            var index = this.owners.indexOf( owner );
            var cache = index === -1 ?  this.add( owner ) : this.cache[ index ];
            if(typeof key == "string"){
                if(value == undefined){//读方法
                    //对于用HTML5 data-*属性保存的数据， 如<input id="test" data-full-name="Planet Earth"/>
                    //我们可以通过$("#test").data("full-name")或$("#test").data("fullName")访问到
                    if(this.user && !(key in cache) && owner && owner.nodeType == 1 ){
                        $.parseData( owner, key, cache );
                    }
                    return cache[key];
                }else{
                    return cache[key] = value;//写方法
                }
            }
            return key && typeof key == "object" ?  $.mix(cache, value) : cache;
        },
        remove: function( owner, key ) {
            var name,
            camel = $.String.camelize,
            index = this.owners.indexOf( owner ),
            cache = this.cache[ index ];
            if ( key === undefined ) {
                cache = {};
            } else {
                if ( cache ) {//如果已经存在
                    if ( !Array.isArray( key ) ) { //如果不是数组
                        if ( key in cache ) {
                            name = [ key ];
                        } else {//尝试驼峰化再求,再不行数组化
                            name = camel( key );
                            name = name in cache ? [ name ] : name.match($.rword);
                        }
                    } else {//如果是数组
                        name = key.concat( key.map( camel ) );
                    }
                    for (var i =0, l = name.length ; i < l; i++ ) {
                        delete cache[ name[i] ];
                    }
                }
            }
            this.cache[ index ] = cache;
        },
        hasData: function( owner ) {
            var index = this.owners.indexOf( owner );
            if ( index > -1 ) {
                return !$.isEmptyObject( this.cache[ index ] );
            }
            return false;
        }
    };
    var user = new Data(true), priv = new Data;
    $.mix( {
        data: function( elem, name, data ) {
            return user.access( elem, name, data );
        },
        removeData: function( elem, name ) {
            return user.remove( elem, name );
        },
        _data: function( elem, name, data ) {
            return priv.access( elem, name, data );
        },
        _removeData: function( elem, name ) {
            return priv.remove( elem, name );
        },
        hasData: function( elem ) {
            return user.hasData( elem ) || priv.hasData( elem );
        },
        parseData: function(target, name, cache, value){
            var data, key = $.String.camelize(name),_eval
            if(cache && (key in cache))
                return cache[key];
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
                if(cache){
                    cache[ key ] = data
                }
            }
            return data;

        },
        //合并数据
        mergeData: function( cur, src){
            if( priv.hasData(src) ){
                var oldData  = priv.access(src), curData = priv.access(cur), events = oldData .events;
                $.Object.merge( curData , oldData  );
                if(events){
                    curData.events = [];
                    for (var i = 0, item ; item =  events[i++]; ) {
                        $.event.bind( cur, item );
                    }
                }
            }
            if( user.hasData(src) ){
                oldData = user.access(src)
                curData = user.access(cur)
                $.Object.merge( curData , oldData  );
            }
        }
    });
    return $
});

/**
2011.9.27 uniqueID改为uniqueNumber 简化data与removeData
2011.9.28 添加$._data处理内部数据
2011.10.21 强化mergeData，可以拷贝事件
2012.1.31 简化$.Object.merge的调用
2012.4.5 修正mergeData BUG, 让$.data能获取HTML5 data-*
2012.5.2 $._db -> $["@data]
2012.5.21 抽象出validate私有方法
2012.9.29 对parseData的数据进行严格的验证后才转换  v2
2012.12.30 使用jquery2.0的新思路,通过存放目标的数组的索引值来关联目标与缓存体 v3
*/
