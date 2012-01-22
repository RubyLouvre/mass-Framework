//==================================================
// 测试模块
//==================================================
$.define("more/spec","lang", function(){
    $.log("已加载spec模块");
    var global = this, DOC = global.document;
    //模块为dom添加如下方法:
    //quote isEqual dump Deferred runTest addTestModule
    //在全局命名空间下多添加一个函数 expect
    $.isEqual = function(a, b) {
            if (a === b) {
                return true;
            } else if (a === null || b === null || typeof a === "undefined" || typeof b === "undefined" || $.type(a) !== $.type(b)) {
                return false; // don't lose time with error prone cases
            } else {
                switch($.type(a)){
                    case "String":
                    case "Boolean":
                    case "Number":
                    case "Null":
                    case "Undefined":
                        //处理简单类型的伪对象与字面值相比较的情况,如1 v new Number(1)
                        if (b instanceof a.constructor || a instanceof b.constructor) {
                            return a == b;
                        }
                        return a === b;
                    case "NaN":
                        return isNaN(b);
                    case "Date":
                        return  a.valueOf() === b.valueOf();
                    case "NodeList":
                    case "Arguments":
                    case "Array":
                        var len = a.length;
                        if (len !== b.length)
                            return false;
                        for (var i = 0; i < len; i++) {
                            if (!this.isEqual(a[i], b[i])) {
                                return false;
                            }
                        }
                        return true;
                    default:
                        for (var key in b) {
                            if (!this.isEqual(a[key], b[key])) {
                                return false;
                            }
                        }
                        return true;
                }
            }
        }
        //用于查看对象的内部构造
        

    //这里尽量不依赖其他核主模块
    var get = function(id) {
        return DOC.getElementById(id);
    };
    var parseHTML = function() {//用于生成元素节点，注意第一层只能用一个元素
        var div = DOC.createElement("div");
        return function(html) {
            div.innerHTML = html;
            return div.firstChild;
        };
    }();
    //在字符串嵌入表达式 http://www.cnblogs.com/rubylouvre/archive/2011/03/06/1972176.html
    var reg_format = /\\?\#{([^{}]+)\}/gm;
    var format = function(str, object){
        var array = $.slice(arguments,1);
        return str.replace(reg_format, function(match, name){
            if (match.charAt(0) == '\\')
                return match.slice(1);
            var index = Number(name)
            if(index >=0 )
                return array[index];
            if(object && object[name] !== void 0)
                return  object[name];
            return  '' ; ;
        });
    }
    var Expect = function(actual){
        return this instanceof Expect ? this.init(actual) : new Expect(actual);
    }
    function getUnpassExpect(str){
        var boolIndex = 1,ret = "error!",section = 0, qualifier = "("
        for(var j=1;j < str.length;j++){
            if(str.charAt(j) == "("){
                boolIndex++
            }else if(str.charAt(j) == ")"){
                boolIndex--
            }else if(str.charAt(j) != qualifier && boolIndex == 0){
                section++
                if(section == 1){
                    qualifier = ")"//取得expect(...)中的部分
                    boolIndex = -1
                }else if(section == 2){
                    boolIndex = 1;//取得ok,eq,match,log等函数名
                    qualifier = ")"
                }else if(section == 3){//取得最后的函数体,并返回整个匹配项
                    ret = "expect" + str.slice(0,j)
                    break
                }
            }
        }
        return ret;
    }

    $.require("ready",function(){
        var html = ['<div id="dom-spec-result"><p class="dom-spec-summary">',
        '<span id="dom-spec-failures" title="0">0</span>&nbsp;failures&emsp;',
        '<span id="dom-spec-errors" title="0">0</span>&nbsp;errors&emsp;',
        '<span id="dom-spec-done" title="0">0</span>%&nbsp;done&emsp;',
        '<span id="dom-spec-time" title="0">0</span>ms&nbsp;</p>',
        '<p class="dom-spec-summary">',global.navigator.userAgent,
        '</p><div id="dom-spec-cases"><div id="loading">正在加载测试数据中，请耐心等特</div></div></div>'];
        //div#dom-spec-result为整个系统的容器
        //div#dom-spec-summary用于放置各种统计
        //div#dom-spec-cases用于放置测试模块
        DOC.body.appendChild(parseHTML(html.join("")));
    });

    $.mix(Expect,{
        refreshTime : function(){//刷新花费时间
            var el = get("dom-spec-time");
            var times = parseInt(el.title,10) + (new Date - Expect.now);
            el.title = times;
            el.innerHTML = times
        },
        addTestModule : function(title, cases) {   
            $.require("ready",function(){
                var moduleId = "dom-spec-"+title, names = [];
                if(!get(moduleId)){//在主显示区中添加一个版块
                    /**   =================每个模块大抵是下面的样子===============
                    <div class="dom-spec-case" id="dom-spec-$.js">
                    <p><a href="javascript:void(0)">JS文件名字</a></p>
                    <ul style="display: none;" class="dom-spec-detail">
                    测试结果
                    </ul>
                    </div>
                     */
                    var html = ['<div id="#{0}" class="dom-spec-case">',
                    '<p class="dom-spec-slide"><a href="javascript:void(0)">#{1}</a></p>',
                    '<ul class="dom-spec-detail" style="display:none;"></ul></div>'].join('');
                    get("dom-spec-cases").appendChild(parseHTML(format(html, moduleId, title)));
                       
                }
                for(var name in cases){//取得describe第二个参数的那个对象所包含的所有函数,并放到异步列队中逐一执行它们
                    if(cases.hasOwnProperty(name)){
                        names.push(name);
                    }
                };
                (function runTest(){
                    if((name = names.shift())){
                        var suite = cases[name],//测试函数
                        caseId = "dom-spec-case-"+name.replace(/\./g,"-");
                        if(!Expect.removeLoading){
                            var loading = get("loading");
                            loading.parentNode.removeChild(loading);
                            Expect.removeLoading = 1
                        }        
                        if(!get(caseId)){//对应一个方法
                            var parentNode = get(moduleId).getElementsByTagName("ul")[0];
                            //处理函数体的显示 
                            var safe = (suite+"").replace(/</g,"&lt;").replace(/>/g,"&gt;");
                            //从函数体内分解出所有测试单元
                            Expect.expectArray = safe.split("expect");
                            //函数体本身
                            var node = parseHTML(format('<li id="#{0}">#{1}<pre>#{2}</pre></li>',caseId,name,uni2hanzi(safe)));
                            parentNode.appendChild(node);
                        }
                        Expect.Client = get(caseId);//对应一个LI元素
                        Expect.PASS = 1;//用于判定此测试套件有没有通过
                        Expect.boolIndex = 0;//用于记录当前是执行到第几条测试
                        Expect.totalIndex = 0;
                        Expect.now = new Date;
                        try{
                            suite();//执行测试套件
                        }catch(err){
                            Expect.PASS = 2;
                            var htm = ["第",Expect.boolIndex,"行测试发生错误\n",Expect.Msgs[Expect.boolIndex],"\n"];
                            //  htm.push(getUnpassExpect((Expect.expectArray[Expect.totalIndex] || "")))
                            for(var e in err){
                                htm.push(e+" "+(err[e]+"").slice(1,80)+"\n");
                            }
                            htm = '<pre title="error">'+htm.join("").replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+"</pre>";
                            Expect.Client.appendChild(parseHTML(htm));
                            var errors = get("dom-spec-errors");
                            errors.title++;
                            errors.innerHTML = errors.title;
                        }
                        get(caseId).className = Expect.CLASS[Expect.PASS];
                        Expect.refreshTime();//更新测试所花的时间
                        setTimeout(runTest,16);
                    }
                })();
            });
        },
        CLASS : {
            0:"dom-spec-unpass",
            1:"dom-spec-pass",
            2:"dom-spec-error"
        },
        Msgs:{},
        prototype:{
            init:function(actual){//传入一个目标值以进行比较或打印
                this.actual = actual;
                return this;
            },
            ok:function(msg){//判定是否返回true
                return this._should("ok",void 0,msg);
            },
            ng:function(msg){//判定是否返回false
                return  this._should("ng",void 0,msg);
            },
            log:function(msg){//不做判断,只打印结果,用于随机数等肉眼验证
                this._should("log",msg);
            },
            eq:function(expected,msg){//判定目标值与expected是否全等
                return this._should("eq", expected, msg);
            },
            near:function(expected, msg){
                return this._should("near", expected, msg);
            },
            match:function(fn,msg){//判定目标值与expected是否全等
                return this._should("match", fn, msg);
            },
            not:function(expected,msg){//判定目标值与expected是否非全等
                return  this._should("not", expected,msg);
            },
            has:function(prop,msg){//判定目标值是否包含prop属性
                return  this._should("has", prop,msg);
            },
            contains:function(el,msg){//判定目标值是否包含el这个元素(用于数组或类数组)
                return this._should("contains", el,msg);
            },
            same: function(expected,msg){//判定结果是否与expected相似(用于数组或对象或函数等复合类型)
                return  this._should("same", expected,msg);
            },
            _should:function(method,expected, msg){//上面方法的内部实现,比较真伪,并渲染结果到页面
                var actual = this.actual,bool = false;
                if(method != "log"){
                    Expect.Msgs[Expect.boolIndex] = msg;
                    Expect.boolIndex++;
                }
                Expect.totalIndex++
                switch(method){
                    case "ok"://布尔真测试
                        bool = actual === true;
                        expected = true;
                        break;
                    case "ng"://布尔非测试
                        bool = actual === false;
                        expected = false;
                        break;
                    case "eq"://同一性真测试
                        bool = actual == expected;
                        break;
                    case "near":
                        var threshold = arguments[3] | 0;
                        return Math.abs(parseFloat(this.actual) - parseFloat(expected)) <= threshold;
                        break;
                    case "not"://同一性非测试
                        bool = actual != expected;
                        break;
                    case "same":
                        bool = $.isEqual(actual, expected);
                        break
                    case "has":
                        bool = Object.prototype.hasOwnProperty.call(actual, expected);
                        break;
                    case "match":
                        bool = expected(actual);
                        break;
                    case "contains":
                        for(var i = 0,n = actual.length; i < n ;i++ ){
                            if(actual === expected ){
                                bool = true;
                                break;
                            }
                        }
                        break;
                    case "log":
                        bool = "";
                        Expect.Client.appendChild(parseHTML('<pre class="dom-spec-log" title="log">'+(expected||"")+"  "+$.dump(actual)+'</pre>'));
                        break;
                }
                // Expect.Msgs[Expect.boolIndex] = msg;
                //修改统计栏的数值
                var done = get("dom-spec-done");
                var errors = get("dom-spec-errors");
                var failures = get("dom-spec-failures");
                if(typeof bool === "boolean"){
                    Expect.PASS = ~~bool;
                    if(!bool){//如果没有通过
                        failures.title++;
                        failures.innerHTML = failures.title;
                        var statement = getUnpassExpect((Expect.expectArray[Expect.totalIndex] || ""))
                        var html = ['<div class="dom-spec-diff clearfix">'+(msg ? "<p>"+msg+"</p>" : "")+'<p>本测试套件中第',Expect.boolIndex,
                        '条测试出错: ',statement,'</p><div>actual:<pre title="actual">'+$.type(actual)+" : "+$.dump(actual)+'</pre></div>',
                        '<div>expected:<pre title="expected">'+$.type(expected)+" : "+$.dump(expected)+'</pre></div>',
                        '</div>'];
                        Expect.Client.appendChild(parseHTML(html.join('')));
                    }
                    done.title++;
                    done.innerHTML = (((done.title-errors.title-failures.title)/done.title)*100).toFixed(0);
                    return bool
                }
                    
            }
        }
    });
    //用于收起或展开详细测试结果
    $.bind(DOC,"click",function(e){
        var target = e && e.target || event.srcElement;
        if(target.tagName === "A"){
            var parent = target.parentNode.parentNode;
            if(parent.className== "dom-spec-case"){//用于切换详情面板
                var ul = parent.getElementsByTagName("ul")[0];
                var display = ul.style.display;
                ul.style.display = display === "none" ? "" : "none";
            }
        }
    });
    //shortcut
    //暴露到全局作用域
    global.expect = Expect;
    $.addTestModule = Expect.addTestModule;
    //此函数是解决FF无法显示函数体内的汉字问题
    var uni2hanzi = global.netscape ? function(s){
        return  unescape(s.replace(/\\u/g,'%u'));
    }: function(s){
        return s
    }
        
});
//2011.8.9    增加getUnpassExpect函数,用于取得没有通过的expect并显示出来
//2011.10.26  优化format与quote
//2011.10.27   runTest添加参数，用于等特一定做量的测试模块都加载完毕才执行
//2011.10.31 去掉deferred模块的依赖，依靠ready列队自行添加测试的模块
