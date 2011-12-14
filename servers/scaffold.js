mass.define("scaffold","fs,path,router",function(fs,path,Router){
    var dirs = [ 'app/',
    'app/models/',
    'app/controllers/',
    'app/observers/',
    'app/helpers/',
    'app/views/',
    'app/views/layouts/',
    'db/',
    'log/',
    'public/',
    'public/stylesheets/',
    'public/javascripts/',
    'node_modules/',
    'config/',
    'config/locales/',
    'config/initializers/',
    'config/environments/'
    ]
    function createFileByTemplate(filename, template, prepare) {
        if (!template.match(/\..+$/)) {
            var fileExtension =  '.js';
            template += fileExtension;
            filename += fileExtension;
        }
        var text = fs.readFileSync(path.join(__dirname, "templates", template));
        if (prepare) {
            text = text.toString('utf8');
            if (typeof prepare === 'function') {
                prepare = [prepare];
            }
            prepare.forEach(function (p) {
                text = p(text);
            });
        }
        return createFile(filename, text);
    }
    function createFile(filename, contents) {

        var fullPath = mass.adjustPath(filename);
       
        if (path.existsSync(fullPath)) {
            mass.log("<code style='color:red'>创建文件"+filename+"失败</code>",true);
        } else {
            fs.writeFileSync(fullPath, contents);
            mass.log("<code style='color:magenta'>创建文件"+filename+"成功</code>",true);
        }
        return fullPath;
    }
    function replaceViewEngine(template) {
        return template.replace(/VIEWENGINE/g,  'ejs');
    }
    
    function createDir(dir) {

        var fullPath = mass.adjustPath(dir);
        if (path.existsSync(fullPath)) {
            mass.log("<code style='color:red'>创建目录"+dir+"失败</code>",true);
        } else {
            fs.mkdirSync(fullPath,0755);
            mass.log("<code style='color:green'>创建目录"+dir+"成功</code>",true);
        }
    }
    return function(name){
        name = name.replace(/\\/,"/")
        dirs.forEach(function(dir){
            createDir(dir)
        });
        createFileByTemplate('config/routes.js', 'config/routes.js');
        createFileByTemplate('public/favicon.ico', 'public/favicon.ico');
        createFileByTemplate('public/404.html', 'public/404.html');
        createFileByTemplate('public/500.html', 'public/500.html');
        var secret = require('crypto').createHash('sha1').update(Math.random().toString()).digest('hex');

        createFile('app/controllers/application_controller.js', 'before(\'protect from forgery\', function () {\n    protectFromForgery(\'' + secret + '\');\n});\n');
        
        var routes_url = mass.adjustPath('config/routes.js'),
        action_url = "app/controllers/",
        view_url = "app/views/",
        mapper = new Router

        mass.require("routes("+routes_url+")",function(fn){//读取routes.js配置文件
            fn(mapper)
        });
        console.log(mapper.controllers)
          console.log(mapper.GET)
        for(var controller in mapper.controllers){
            var object = mapper.controllers[controller];
            if(object.namespace){//如果存在命名空间,则需要创建对应的文件夹
                action_url = action_url + object.namespace;
                view_url = view_url + object.namespace;
                createDir(action_url)
                createDir(view_url)
            }
            //创建控制器
            var contents = ["mass.define(\"",controller ,"_controller\",function(){\n", "\treturn {\n"]
            contents.push( object.actions.map(function(action){
                return "\t\t\""+action + "\":function(){}"
            }).join(",\n"));
            contents.push("\n\t}\n });") ;
            createFile(path.join(action_url, controller +"_controller.js") ,contents.join("") )
            //创建视图
            object.views.forEach(function(view){
                createFile(path.join(view_url, view +".html") ,controller+"#"+view )
            });
            action_url = "app/controllers/"//还原
            view_url = "app/views/";
        }
        //添加控制器的相关模板
        return mapper;
    }
})

