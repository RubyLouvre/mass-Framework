//==================================================
// 依赖内存的cache by ssddi456
//==================================================
define("cache", ["mass","$class"],function() {
    function now () {
        return new Date().getTime();
    }
    $.Cache =$.factory({
        init: function( opts ) {
            this.cache  = {};
            this.cacheStatus = false;
            this.expire = 0;
            this.count  = now();
            this.url    = opts.url;
            this.uuid   = '';
            this.method = 'post';
        },
        get : function( data, cb ) {
            var self = this;
            // get(cb)
            if( "function" === typeof data){
                // do
                cb = data;
                data = null;
            }
            // do expire
            if( this.expire && ( now() - this.count ) > this.expire ){
                // do
                this.destoryCache();
            }
            // check cache
            if( this.cacheStatus ){
                // do
                cb( this.getCache() );
                return;
            }

            $[this.method](
                this.url,
                data,
                function( data ) {
                    self.setCache( data );
                    cb( data );
                },'json');
        },
        destoryCache : function() {
            this.cache = null;
            this.cacheStatus = false;
        },
        getCache : function( next ) {
            return this.cache;
        },
        setCache : function( data ) {
            this.cacheStatus = true;
            this.cache = data;
            this.count = now();
        }
    });
});

/*
有时候会有同步请求
我不想对付同步请求 于是定时同步
用户的数据可以通过多个入口改变
 */