define("ejs", ["../lang"],function(){
    //用法如如ASP，JSP，ruby的ERB, 完全没有入门难度
    //不过太过自由写意，让用户任意在HTML镶嵌逻辑容易造成维护灾难
    //使用者请自行约束
    //http://www.cnblogs.com/rubylouvre/archive/2012/03/19/2405867.html
    function filtered(js) {
        return js.substr(1).split('|').reduce(function(js, filter){
            var parts = filter.split(':')
            , name = parts.shift()
            , args = parts.shift() || '';
            if (args) args = ', ' + args;
            return '$.ejs.filters.' + name + '(' + js + args + ')';
        });
    };
    $.log("ejs模板机制")
    $.ejs = function( id,data,opts){
        var el, source
        if( !$.ejs.cache[ id] ){
            opts = opts || {}
            var doc = opts.doc || document;
            data = data || {};
            el = $.query ? $(id, doc)[0] : doc.getElementById(id.slice(1));
            if(! el )
                throw "can not find the target element";
            source = el.innerHTML;
            if(!(/script|textarea/i.test(el.tagName))){
                source = $.String.unescapeHTML( source );
            }
            var fn = $.ejs.compile( source, opts );
            $.ejs.cache[ id ] = fn;
        }
        $.log( $.ejs.cache[ id ] +"")
        return $.ejs.cache[ id ]( data );
    }
    var isNodejs = typeof exports == "object";
    $.ejs.cache = {};
    $.ejs.filters = {
        contains: $.String.contains,
        truncate: $.String.truncate,
        camelize: $.String.camelize,
        escape: $.String.escapeHTML,
        unescape: $.String.unescapeHTML
    };
    $.ejs.compile = function( source, opts){
        opts = opts || {}
        var open  = opts.open  || isNodejs ? "<%" : "<&";
        var close = opts.close || isNodejs ? "%>" : "&>";
        var helperNames = [], helpers = []
        for(var name in opts){
            if(opts.hasOwnProperty(name) && typeof opts[name] == "function"){
                helperNames.push(name)
                helpers.push( opts[name] )
            }
        }
        var flag = true;//判定是否位于前定界符的左边
        var codes = []; //用于放置源码模板中普通文本片断
        var time = new Date * 1;// 时间截,用于构建codes数组的引用变量
        var prefix = " ;r += txt"+ time +"[" //渲染函数输出部分的前面
        var postfix = "];"//渲染函数输出部分的后面
        var t = "return function(data){ try{var r = '',line"+time+" = 0;";//渲染函数的最开始部分
        var rAt = /(^|[^\w\u00c0-\uFFFF_])(@)(?=\w)/g;
        var rtrim = /(^-|-$)/g;
        var js = []
        var pre = 0, cur, code, trim
        for(var i = 0, n = source.length; i < n; ){
            cur = source.indexOf( flag ? open : close, i);
            if( cur < pre){
                if( flag ){//取得最末尾的HTML片断
                    t += prefix + codes.length + postfix
                    code = source.slice( pre+ close.length );
                    if(trim){
                        code = code.trim();
                        trim = false;
                    }
                    codes.push( code );
                }else{
                    $.error("发生错误了");
                }
                break;
            }
            code = source.slice(i, cur );//截取前后定界符之间的片断
            pre = cur;
            if( flag ){//取得HTML片断
                t += prefix + codes.length + postfix;
                if(trim){
                    code = code.trim()
                    trim = false;
                }
                codes.push( code );
                i = cur + open.length;
            }else{//取得javascript罗辑
                js.push(code)
                t += ";line"+time+"=" +js.length+";"
                switch(code.charAt(0)){
                    case "="://直接输出
                        code = code.replace(rtrim,function(){
                            trim = true;
                            return ""
                        });
                        code = code.replace(rAt,"$1data.");
                        if( code.indexOf("|") > 1 ){//使用过滤器
                            code = "="+ filtered(code);
                        }
                        t += " ;r +" +code +";"
                        break;
                    case "#"://注释,不输出
                        break
                    case "-":
                    default://普通逻辑,不输出
                        code = code.replace(rtrim,function(){
                            trim = true;
                            return ""
                        });
                        t += code.replace(rAt,"$1data.")
                        break
                }
                i = cur + close.length;
            }
            flag = !flag;
        }
        t += " return r; }catch(e){ $.log(e);\n$.log(js"+time+"[line"+time+"-1]) }}"
        var body = ["txt"+time,"js"+time, "filters"]
        var fn = Function.apply(Function, body.concat(helperNames,t) );
        var args = [codes, js, $.ejs.filters];
        return fn.apply(this, args.concat(helpers));
    }
    return $.ejs;
})

//添加更多分号，防止编译错误

