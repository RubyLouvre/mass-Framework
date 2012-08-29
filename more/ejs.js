define( ["$lang"],function(){
    $.log("已加载ejs模块", 7)
    $.ejs = function( id,data,opts){
        var el, source
        if( !$.ejs.cache[ id] ){
            opts = opts || {}
            var doc = opts.doc || document;
            data = data || {};
            if($.fn){
                el = $(id, doc)[0];
            }else if(doc.querySelectorAll){
                el = doc.querySelectorAll(id)[0];
            }else{
                el = doc.getElementById(id.slice(1));
            }
            if(! el )
                throw "can not find the target element";
            source = el.innerHTML;
            if(!(/script|textarea/i.test(el.tagName))){
                source = $.String.unescapeHTML( source );
            }
            var fn = $.ejs.compile( source, opts );
            $.ejs.cache[ id ] = fn;
        }
        return $.ejs.cache[ id ]( data );
    }
    var isNodejs = typeof exports == "object";
    if(isNodejs){
        $.ejs = function( source,data,opts){
            var fn = $.ejs.compile( source, opts );
            return fn( data )
        }
    }
    $.ejs.compile = function( source, opts){
        opts = opts || {}
        var tid = opts.tid
        if(typeof tid === "string" && typeof $.ejs.cache[tid] == "function"){
            return $.ejs.cache[tid];
        }
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
        var rstr = /(['"])(?:\\[\s\S]|[^\ \\r\n])*?\1/g // /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/
        var rtrim = /(^-|-$)/g;
        var rmass = /mass/
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
                            var arr = []
                            var str = code.replace(rstr, function(str){
                                arr.push(str);//先收拾所有字符串字面量
                                return 'mass'
                            }).replace(/\|\|/g,"@");//再收拾所有短路或
                            if(str.indexOf("|") > 1){
                                var segments = str.split("|")
                                var filtered = segments.shift().replace(/\@/g,"||").replace(rmass, function(){
                                    return arr.shift();
                                });
                                for( var filter;filter = arr.shift();){
                                    segments = filter.split(":");
                                    name = segments[0];
                                    args = "";
                                    if(segments[1]){
                                        args = ', ' + segments[1].replace(rmass, function(){
                                            return arr.shift();//还原
                                        })
                                    }
                                    filtered = "$.ejs.filters."+ name +"(" +filtered + args+")"
                                }
                                code = "="+ filtered
                            }
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
        var compiled = fn.apply(this, args.concat(helpers));
        if(typeof tid === "string"){
            return  $.ejs.cache[tid] = compiled
        }
        return compiled;
    }
    $.ejs.cache = {};//用于保存编译好的模板函数
    $.ejs.filters = {//用于添加各种过滤器
        contains: $.String.contains,
        truncate: $.String.truncate,
        camelize: $.String.camelize,
        escape: $.String.escapeHTML,
        unescape: $.String.unescapeHTML
    };
    return $.ejs;
})



