mass.define("settings", function(){
    return mass.settings = {
        //栏截器"favicon",
        intercepters :["mime","location","static","postData","methodOverride","json","render","matcher"],
        view_engine:"ejs",
        //你想建立的网站的名字（请修正这里）
        appname:"jslouvre",
        //在哪个目录下建立网站（请修正这里）
        approot:process.cwd(),
        http_method:"_method",//用于模拟PUT,DELETE方法
        environments:"development",
        port:8888,
        hot_deploy :{//热部署要监听文件夹与文件类型
            "dirs":["styles","javascripts","app"] ,
            "exts":["js","css"]
        } ,
        maxObjects:128,
        maxLength:1024 * 256,
        maxAge: 60*60*24*365,
        db:{
            development:{
                driver:   "mongoose", 
                host:     "localhost", 
                database: "cms-dev"
            }, 
            test: {
                driver:   "mongoose" , 
                host:     "localhost", 
                database: "cms-test"
            } , 
            staging:{
                driver:   "mongoose", 
                host:     "localhost", 
                database: "cms-staging"
            }, 
            production:{
                driver:   "mongoose" , 
                host:     "localhost" , 
                database: "cms-production"
            }
        }
    }
});