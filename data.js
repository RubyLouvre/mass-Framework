//==================================================
// 数据缓存模块
//==================================================
define("data", ["lang"], function($) {
    var owners = [],
        caches = [];
    /**
     * 为目标对象指定一个缓存体
     * @param {Any} owner
     * @return {Object} 缓存体
     * @api private
     */

    function add(owner) {
        var index = owners.push(owner);
        return caches[index - 1] = {
            data: {}
        };
    }
    /**
     * 为目标对象读写数据
     * @param {Any} owner
     * @param {Object|String} name ? 要处理的数据或数据包
     * @param {Any} data ? 要写入的数据
     * @param {Boolean} pvt ? 标识为内部数据
     * @return {Any}
     * @api private
     */

    function innerData(owner, name, data, pvt) { //IE678不能为文本节点注释节点添加数据
        var index = owners.indexOf(owner);
        var table = index === -1 ? add(owner) : caches[index];
        var getOne = typeof name === "string" //取得单个属性
        var cache = table;
        //私有数据都是直接放到table中，普通数据放到table.data中
        if(!pvt) {
            table = table.data;
        }
        if(name && typeof name === "object") {
            $.mix(table, name); //写入一组属性
        } else if(getOne && data !== void 0) {
            table[name] = data; //写入单个属性
        }
        if(getOne) {
            if(name in table) {
                return table[name];
            } else if(!pvt && owner && owner.nodeType == 1) {
                //对于用HTML5 data-*属性保存的数据， 如<input id="test" data-full-name="Planet Earth"/>
                //我们可以通过$("#test").data("full-name")或$("#test").data("fullName")访问到
                return $.parseData(owner, name, cache);
            }
        } else {
            return table;
        }
    }
    /**
     * 为目标对象移除数据
     * @param {Any} owner
     * @param {Any} name ? 要移除的数据
     * @param {Boolean} pvt ? 标识为内部数据
     * @return {Any}
     * @api private
     */

    function innerRemoveData(owner, name, pvt) {
        var index = owners.indexOf(owner);
        if(index > -1) {
            var delOne = typeof name === "string",
                table = caches[index],
                cache = table;
            if(delOne) {
                if(!pvt) {
                    table = table.data;
                }
                if(table) {
                    delOne = table[name];
                    delete table[name];
                }//在data_fix模块，我们已经对JSON进行补完
                if(JSON.stringify(cache) === '{"data":{}}') {
                    owners.splice(index, 1);
                    caches.splice(index, 1);
                }
            }
            return delOne; //返回被移除的数据
        }
    }
    var rparse = /^(?:null|false|true|NaN|\{.*\}|\[.*\])$/;
    $.mix({

        hasData: function(owner) {
            //判定是否关联了数据 
            return owners.indexOf(owner) > -1;
        },

        data: function(target, name, data) {
            //读写用户数据
            return innerData(target, name, data);
        },

        _data: function(target, name, data) {
            //读写内部数据
            return innerData(target, name, data, true);
        },

        removeData: function(target, name) {
            //删除用户数据
            return innerRemoveData(target, name);
        },

        _removeData: function(target, name) {
            //移除内部数据
            return innerRemoveData(target, name, true);
        },

        parseData: function(target, name, cache, value) {
            //将HTML5 data-*的属性转换为更丰富有用的数据类型，并保存起来
            var data, _eval, key = $.String.camelize(name);
            if(cache && (key in cache)) return cache[key];
            if(arguments.length !== 4) {
                var attr = "data-" + name.replace(/([A-Z])/g, "-$1").toLowerCase();
                value = target.getAttribute(attr);
            }
            if(typeof value === "string") { //转换 /^(?:\{.*\}|null|false|true|NaN)$/
                if(rparse.test(value) || +value + "" === value) {
                    _eval = true;
                }
                try {
                    data = _eval ? eval("0," + value) : value;
                } catch(e) {
                    data = value;
                }
                if(cache) {
                    cache[key] = data;
                }
            }
            return data;

        },

        mergeData: function(cur, src) {
            //合并数据
            if($.hasData(cur)) {
                var oldData = $._data(src),
                    curData = $._data(cur),
                    events = oldData.events;
                $.Object.merge(curData, oldData);
                if(events) {
                    curData.events = [];
                    for(var i = 0, item; item = events[i++];) {
                        $.event.bind(cur, item);
                    }
                }
            }
        }
    });
    return $;
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
2013.1.2 升级到v4
*/