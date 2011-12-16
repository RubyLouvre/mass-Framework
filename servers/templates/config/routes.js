//最重要的部分，根据它生成controller, action, model, views

mass.define("routes",function(){
    return function(map){
        //方法路由
        mass.log("<code style='color:yellow'>-------------------</code>",true);
//        map.get('/','site#index');
//        map.get('/get_comments/:post_id','site#get_comments');
//        map.post('/add_comment','site#add_comment');
//        //资源路由
//        map.resources('posts');
//        map.resources('users');
//        map.get('/view/:post_name','site#view_post');
//        map.get('/rss','site#rss');


    // map.resources('posts', {path: 'articles', as: 'stories'});
    //嵌套路由
            map.resources('post', function (post) {
                post.resources('comments');
            });
    //
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

