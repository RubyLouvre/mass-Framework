mass.define("scaffold","fs,path,router,heredocument",function(fs,path,Router){
    var dirs = [ 
    'app/models/',
    'app/controllers/',
    'app/observers/',
    'app/helpers/',
    'app/views/layouts/',
    'db/',
    'log/',
    'public/stylesheets/',
    'public/javascripts/',
    'node_modules/',
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
        var fullPath = mass.adjustPath(filename).replace(/\\/g,"/");
        var match = fullPath.match(/(.*)\//);
        if(match){
            mass.mkdirSync(match[1]);
        }
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
        mass.mkdirSync(fullPath)
    }
    return function(name){
        var a  = mass.hereDoc(function(){
         /*
          var b = c;
          */   
        })
        console.log(a)
        name = name.replace(/\\/g,"/");
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

        mapper = new Router;

        mass.require("routes("+routes_url+")",function(fn){//读取routes.js配置文件
            fn(mapper);
        });

        for(var controller in mapper.controllers){
            var object = mapper.controllers[controller];
            if(object.namespace){//如果存在命名空间,则需要创建对应的文件夹
                "controllers,views,models".replace(mass.rword,function(word){
                    createDir(path.join("app",word,object.namespace))
                });
            }
            //创建控制器
            var contents = ["mass.define(\"",controller ,"_controller\",function(){\n", "\treturn {\n"]
            //创建动作
            contents.push( object.actions.map(function(action){
                return "\t\t\""+action + "\":function(){}"
            }).join(",\n"));
            contents.push("\n\t}\n });") ;
            createFile(path.join("app","controllers", controller +"_controller.js") ,contents.join("") )
            //创建视图
            object.views.forEach(function(view){
                createFile(path.join("app","views",object.namespace, controller ,view +".html") ,controller+"#"+view )
            });
            //创建模型
           // console.log(path.join("app","models",object.namespace, object.model_name +".js"))
            createFile(path.join("app","models",object.namespace, object.model_name +".js") ,"// "+ object.model_name)

        }
        //添加控制器的相关模板
        return mapper;
    }
})

