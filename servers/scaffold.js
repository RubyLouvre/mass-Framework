mass.define("scaffold","fs,path,router,here_document",function(fs,path,Router){

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
    var actiontmpls = {
        index:function(req,res){
            res.render("tmpl",{})
        },
        show:function(req,res){
            res.render("tmpl",{})
        },
        "new":function(req,res){
            res.render("tmpl",{})
        },
        edit:function(req,res){
            res.render("tmpl",{})
        },
        create:function(req,res){/* POST */ },
        update:function(req,res){ /* PUT */},
        destroy:function(req,res){ /* DELETE */}
    }
    return function(name){
        name = name.replace(/\\/g,"/");
        //将模板文件全部复制到新网站的目录之下
        mass.cpdirSync("./templates",mass.adjustPath(""))     

        var secret = require('crypto').createHash('sha1').update(Math.random().toString()).digest('hex');

        createFile('app/controllers/application_controller.js',  mass.hereDoc(function(){/*
        before('protect from forgery',function(){
            protectFromForgery("#{0}")
        }) */   
            },secret));
        
        var routes_url = mass.adjustPath('config/routes.js'),

        mapper = new Router;

        mass.require("routes("+routes_url+")",function(fn){//读取routes.js配置文件
            fn(mapper);
        });
        var ejstmpl = fs.readFileSync("ejs/index.html")
        for(var controller in mapper.controllers){
            var object = mapper.controllers[controller];
            if(object.namespace){//如果存在命名空间,则需要创建对应的文件夹
                "controllers,views,models".replace(mass.rword,function(word){
                    createDir(path.join("app",word,object.namespace))
                });
            }

            //创建控制器
            var contents = mass.hereDoc(function(){/*
            mass.define("#{0}_controller",function(){
                return {
                   #{1}
                }
            });*/
                },controller,object.actions.map(function(action){ //创建动作
                    return "\t\t\""+action + "\":"+actiontmpls[action]
                }).join(",\n"));
                
    
            createFile(path.join("app","controllers",object.namespace, controller +"_controller.js") ,contents )
            //创建视图
            object.views.forEach(function(view){
                createFile(path.join("app","views",object.namespace, controller ,view +".html") ,ejstmpl )
            });
            //创建模型

            createFile(path.join("app","models",object.namespace, object.model_name +".js") ,"// "+ object.model_name)

        }
        //添加控制器的相关模板
        return mapper;
    }
})

