//用于设置路由规则
mass.define("routes",function(){
    //支持五种路由:方法路由,资源路由,嵌套路由,命名空间路由,根路由
    return function(map){
        //方法路由
        //        map.get('/','site#index');
        //        map.get('/get_comments/:post_id','site#get_comments');
        //        map.post('/add_comment','site#add_comment');
        //        //资源路由
        //   map.resources('posts');
        //        map.resources('users');
        //        map.get('/view/:post_name','site#view_post');
        //        map.get('/rss','site#rss');


        // map.resources('posts', {path: 'articles', as: 'stories'});
        //嵌套路由
        //        map.resources('posts', function (post) {
        //            post.resources('users');
        //        });
        //命名空间路由
        map.namespace("tests",function(tests){
            tests.resources('comments');
        })
    //        map.resources('users', {
    //            only: ['index', 'show']
    //        });
    //
    //        map.resources('users', {
    //            except: ['create', 'destroy']
    //        });
    //        map.resources('users', function (user) {
    //            user.get('avatar', 'users#avatar');
    //        });
    }
});
//
