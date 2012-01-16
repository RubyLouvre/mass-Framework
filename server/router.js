mass.define("router","lang,plural",function($$){

    var Router = function(){
        this.PATH = "/";
        this.NS = "";
        this.controllers = {};
        this.GET = [];//四种匹配栈
        this.POST = [];
        this.PUT = [];
        this.DELETE = [];
    }
    var availableRoutes = {
        'index': 'GET /',
        'create': 'POST /',
        'new': 'GET /new',
        'edit': 'GET /:id/edit',
        'destroy': 'DELETE /:id',
        'update': 'PUT /:id',
        'show': 'GET /:id'
    };
    var rescape = /([-.*+?^${}()|[\]\/\\])/g;
    //用于生成7种资源路由
    function getActiveRoutes(options) {
        var activeRoutes = {};
        if (options.only) {
            // map.resources('users', {only: ['index', 'show']});
            if (typeof options.only == 'string') {//如果是一个字符串则将它变成一个数组
                options.only = [options.only];
            }
            options.only.forEach(function (action) {
                if (action in availableRoutes) {
                    activeRoutes[action] = availableRoutes[action];
                }
            });
        }else if (options.except) {
            // map.resources('users', {except: ['create', 'destroy']});
            if (typeof options.except == 'string') {//如果是一个字符串则将它变成一个数组
                options.except = [options.except];
            }
            for (var action in availableRoutes) {
                if (!~options.except.indexOf(action) ) {
                    activeRoutes[action] = availableRoutes[action];
                }
            }
        }else {
            for ( action in availableRoutes) {
                activeRoutes[action] = availableRoutes[action];
            }
        }
        return activeRoutes;
    }
    Router.prototype = {
        namespace :function (name, handle) {
            var ns = this.NS, path = this.PATH;
            this.NS = ns + name.replace(/\/$/, '') + '/';
            this.PATH = path + name.replace(/\/$/, '') + '/';
            this._namespace = name;
            handle(this);
            delete this._namespace;
            this.NS = ns;
            this.PATH = path;
        },
        /**
         *用于创建嵌套路由
map.resources('post', function (post) {
    post.resources('comments');
});
     Pathss         method    URLs                             controller#action
     post_comments GET      /posts/:post_id/comments          comments#index
     post_comments POST     /posts/:post_id/comments          comments#create
  new_post_comment GET      /posts/:post_id/comments/new      comments#new
 edit_post_comment GET      /posts/:post_id/comments/:id/edit comments#edit
      post_comment DELETE   /posts/:post_id/comments/:id      comments#destroy
      post_comment PUT      /posts/:post_id/comments/:id      comments#update
      post_comment GET      /posts/:post_id/comments/:id      comments#show
             posts GET      /posts                            posts#index
             posts POST     /posts                            posts#create
          new_post GET      /posts/new                        posts#new
         edit_post GET      /posts/:id/edit                   posts#edit
              post DELETE   /posts/:id                        posts#destroy
              post PUT      /posts/:id                        posts#update
              post GET      /posts/:id                        posts#show
         */
        subroutes : function (name, handle) {
            var path = this.PATH;
            this.PATH = path + name.replace(/\/$/, '') + '/';
            handle(this);
            this.PATH = path;
        },
        /**
         * 创建资源路由
map.resources("photos")
在你的应用程序中，这一行会创建7个不的路由。
HTTP verb    URL          controller      action    用法
GET        /photos        Photos          index    创建一个显示所有photo的页面
GET        /photos/new    Photos          new      用于创建photo的页面
POST       /photos        Photos          create   用于创建photo的POST请求
GET        /photos/1      Photos          show     显示特定photo的明细
GET        /photos/1/edit Photos          edit     用于编辑photo的页面
PUT        /photos/1      Photos          update   用于更新photo的POST请求
DELETE     /photos/1      Photos          destroy  用于删除photo的POST请求
         * @param {String} name 资源的名字，必须是复数
         * @param {Object} options 可选。包含only,except键名的普通对象,或as, path, sensitive等值
         * @param {Number} actions 可选。子路由函数
         */
        resources : function (name, options, handle) {
            //如果只有两个参数，那么将它修正为三个
            options = options || {};
            if (typeof options == 'function') {
                handle = options;
                options = {};
            }
            var adobes  = [], 
            controllers  = this.controllers , 
            object = controllers[name] || (controllers[name] = {
                actions:[],
                views:[],
                model_name:$$(name).singularize(),
                namespace:""
            });
            if(this._namespace){
                object.namespace = this._namespace;
            }
            if(options.action){
                adobes[0] = options;
                object.actions.push(options.action);//收集action
                if(options.method === "GET"){
                    object.views.push(options.action);
                }
            }else{
                // 创建一组资源路由
                var activeRoutes = getActiveRoutes(options);
                // 创建子路由
                if (typeof handle == 'function') {// users/:user_id
                    this.subroutes(name + '/:' + $$(name).singularize() + '_id', handle);
                }
                var  prefix = this.PATH
                for (var action in activeRoutes) {
                    //   (function(action,options, prefix){
                    var route = activeRoutes[action].split(/\s+/);
                    var method = route[0].toUpperCase()
                    var path = route[1]
                    // append format
                    if (path == '/') {//'GET /' ---> 'GET ／ .:format?'
                        path = '.:format?';
                    } else {
                        path += '.:format?';
                    }
                    adobes.push(mass.mix({},options,{
                        controller:name,
                        action:action,
                        method:method,
                        namespace:prefix,
                        //处理map.resources('posts', {path: 'articles'});的情形 articles.:format?
                        url: prefix + (options.path || name) + path
                    }));
                    object.actions.push(action);
                    if(method === "GET"){
                        object.views.push(action);
                    }
                //  })(key,options,this.PATH )
                }
            }
            adobes.forEach(function(obj){
                var path = obj.url.replace(/\.:format\??$/, '').replace(/^\/|\/$/g, '');
                if ( path  === '') {
                    obj.helper = "root";
                    obj.matcher = /^\/$/;
                    this[obj.method].push(obj);
                    return 
                }
                var ahelper = [],amatcher = [];
                path.split('/').forEach(function (token, index, all) {
                    if (token[0] == ':') return;
                    var next_token = all[index + 1] || '';
                    if (index == all.length - 1) {
                        if (token == obj.action.toLowerCase()) {//new edit
                            ahelper.unshift(token);
                            return;
                        }
                    }
                    if (next_token[0] == ':' || next_token == 'new.:format?') {
                        token = options.as || token;
                        token = $$(token).singularize();
                    }
                    ahelper.push(token);
                });
                obj.helper = ahelper.join('_');//    
                path.split('/').forEach(function (token) {
                    if(token[0] === ":"){
                        if(options[token] instanceof RegExp){
                            amatcher.push(options[token].source.replace(rescape, '\\$1'))
                        }else{
                            amatcher.push("\\d+");
                        }
                    }else{
                        amatcher.push(token.replace(rescape, '\\$1'));
                    }
                });
                obj.matcher = new RegExp('^\\/' + amatcher.join("\\/") + '$', options.sensitive ? '' : 'i');
                this[obj.method].push(obj);//添加的匹配栈中;
            },this);
        },
        root : function (controller_action) {
            this.get('/', controller_action);
        }
    }

    'get,post,put,delete'.replace(mass.rword,function (method) {
        Router.prototype[method] = function (url, path, options) {
            path = path.split('#');
            options = options || {}
            this.resources(path[0],mass.mix({},options,{
                controller:path[0],
                action:path[1],
                method:method.toUpperCase(),
                url:url
            }));
        };
    });
    return Router
})