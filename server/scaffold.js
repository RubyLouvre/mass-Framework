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
        var hasBuilt = mass.settings.hasBuilt;
        if(!hasBuilt){
            mass.cpdirSync("./templates",mass.adjustPath(""))     

            var secret = require('crypto').createHash('sha1').update(Math.random().toString()).digest('hex');

            createFile('app/controllers/application_controller.js',  mass.hereDoc(function(){/*
        before('protect from forgery',function(){
            protectFromForgery("#{0}")
        }) */   
                },secret));
        }

     
        var routes_url = mass.adjustPath('config/routes.js'),

        mapper = new Router;

        mass.require("routes("+routes_url+")",function(fn){//读取routes.js配置文件
            fn(mapper);
        });
        if(!hasBuilt){
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
                contents =  require('./js_beautify.js').js_beautify(contents)
                
    
                createFile(path.join("app","controllers",object.namespace, controller +"_controller.js") ,contents )
                //创建视图
                object.views.forEach(function(view){
                    createFile(path.join("app","views",object.namespace, controller ,view +".html") ,ejstmpl )
                });
                //创建模型

                createFile(path.join("app","models",object.namespace, object.model_name +".js") ,"// "+ object.model_name)

            }
        }
        //添加控制器的相关模板
        return mapper;
    }
});
////转换成一个字符串
//utils.serializeCookie = function (name, val, options) {
//    var ret = name + '=' + escape(val) + ';';
//    if (options.path)
//        ret += ' path=' + options.path + ';';
//    if (options.expires)
//        ret += ' expires=' + options.expires.toGMTString() + ';';
//    if (options.domain)
//        ret += ' domain=' + options.domain + ';';
//    if (options.secure)
//        ret += ' secure';
//    return ret;
//};
////将它转换为一个对象
//utils.unserializeCookie = function (cookies) {
//    if (!cookies)
//        return {}
//    var cookieline = cookies.toString().split(';');
//    var ret = {};
//    for (i in cookieline) {
//        var line = cookieline[i].trim().split('=');
//        if (line.length > 1) {
//            var k = line[0].trim();
//            var v = unescape(line[1].trim());
//            ret[k] = v;
//        }
//    }
//    return ret;
//};
//

//            
//            exports.parse = function(cookie, name) {
//  var cookies = {};
//  if (typeof cookie == 'string') {
//    // Copied from: [cookie-sessions](http://github.com/caolan/cookie-sessions/blob/master/lib/cookie-sessions.js)
//    cookies = cookie.split(/\s*;\s*/g).map(
//        function(x) {
//          return x.split('=');
//        }).reduce(function(a, x) {
//          a[unescape(x[0])] = unescape(x[1]);
//          return a;
//        }, {});
//  }
//  return name ? cookies[name] : cookies;
//};
//
//exports.stringify = function(name, value, options) {
//  var cookie = name + "=" + escape(value);
//  if (options) {
//    options.expires && (cookie += "; expires=" + options.expires.toUTCString());
//    options.path && (cookie += "; path=" + options.path);
//    options.domain && (cookie += "; domain=" + options.domain);
//    options.secure && (cookie += "; secure=" + options.secure);
//    options.httponly && (cookie += "; httponly=" + options.httponly);
//  }
//  return cookie;
//};
//
//exports.checkLength = function(cookieStr) {
//  // recommended in [RFC2109](http://tools.ietf.org/html/rfc2109.html) Section `6.3 Implementation Limits`
//  return cookieStr.length <= 4096;
//};