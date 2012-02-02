//==================================================
// 测试模块v3
//==================================================
$.define("spec","lang", function(){
    $.log("已加载spec v3模块");
    var global = this, DOC = global.document;
  
    //模块为$添加如下方法:
    // isEqual  fixture
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
                    return a.valueOf() === b.valueOf();
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
    //取得元素节点
    var get = function(id) {
        return DOC.getElementById(id);
    };
    //用于生成元素节点，注意第一层只能用一个元素
    var parseHTML = function() {
        var div = DOC.createElement("div");
        return function(html) {
            div.innerHTML = html;
            return div.firstChild;
        };
    }();
    /**
*expect($.type("string")).eq("String");
*<kbd>expect($.type("string")).eq("String");</kbd>
*/
    function retouch(str){
        for(var step = 1, section = 0, i = 1, n = str.length; i < n; i++){
            if(str.charAt(i) == "("){
                step++;
            }else if(str.charAt(i) == ")"){
                step--;
                if(!step){
                    section++;
                    if(section == 2){
                        return str.slice(0,i+1) +
                        str.slice(i+1, i+3).replace(/\s*;?\s*/,";</a>\n")+
                        str.slice(i+3)
                    }
                }
            }
        }
        return str;
    }
    var Expect = function(actual){
        this.actual = actual;
    }
    var specTime ;
    $.mix(Expect,{
        refreshTime : function(){//刷新花费时间
            specTime = specTime || get("mass-spec-time");
            var times = parseInt(specTime.title,10) + (new Date - Expect.now);
            specTime.title = times;
            specTime.innerHTML = times
        },
        CLASS : {
            0:"mass-asserts-unpass",
            1:"mass-asserts-pass",
            2:"mass-asserts-error"
        },
        prototype:{
            _should:function(method, expected){//上面方法的内部实现,比较真伪,并渲染结果到页面
                var actual = this.actual,bool = false;
                var el = Expect.Client.getElementsByTagName("a")[Expect.index];
                Expect.index++;//当前测试套件中第index条测试
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
                    case "near"://判定两个数字是否相近
                        var threshold = arguments[2] | 0;
                        return Math.abs(parseFloat(this.actual) - parseFloat(expected)) <= threshold;
                        break;
                    case "not"://同一性非测试
                        bool = actual != expected;
                        break;
                    case "same"://判定结果是否与expected相似(用于数组或对象或函数等复合类型)
                        bool = $.isEqual(actual, expected);
                        break
                    case "has"://判定目标值是否包含prop属性
                        bool = Object.prototype.hasOwnProperty.call(actual, expected);
                        break;
                    case "match"://判定回调是否返回真
                        bool = expected(actual);
                        break;
                    case "contains"://判定目标值是否包含el这个元素(用于数组或类数组)
                        for(var i = 0,n = actual.length; i < n ;i++ ){
                            if(actual === expected ){
                                bool = true;
                                break;
                            }
                        }
                        break;
                    case "log":
                        bool = "";
                        if(el){
                            el.className = "mass-spec-log";
                            el.appendChild( parseHTML('<form class="mass-spec-diff"><pre>'+$.dump(actual)+'</pre></form>') );
                        }
                        break;
                }
                //修改统计栏的数值
                var done = get("mass-spec-done");
                var errors = get("mass-spec-errors");
                var failures = get("mass-spec-failures");
                if(typeof bool === "boolean"){
                    if(!bool){//如果没有通过
                        Expect.PASS = 0;
                        failures.innerHTML = ++failures.title;//更新出错栏的数值
                        if(el){
                            el.className = "mass-assert-unpass";
                            var html = ['<form class="mass-spec-diff clearfix"><div>actual:<pre title="actual">'+$.type(actual)+" : "+$.dump(actual)+'</pre></div>',
                            '<div>expected:<pre title="expected">'+$.type(expected)+" : "+$.dump(expected)+'</pre></div>',
                            '</form>'];
                            el.appendChild(parseHTML(html.join('')));
                        }
                    }
                    done.title++;
                    //更新总数栏的数值
                    done.innerHTML = (((done.title-errors.title-failures.title)/done.title)*100).toFixed(0);
                    return bool
                }
              
            }
        }
    });
    "ok, ng, log, eq, near, match, not, has, contains, same".replace( $.rword, function( method ){
        Expect.prototype[ method ] = function( a, b, c ){
            return this._should(method, a, b, c)
        }
    })
    //用于收起或展开详细测试结果

    $.bind(DOC,"click",function(e){
        var target = e && e.target || event.srcElement;
        var el = target.parentNode;
        if(target.tagName === "A" && el.className === "mass-spec-slide"){
            var parent = el.parentNode;
            if(parent.className== "mass-spec-case"){//用于切换详情面板
                var ul = parent.getElementsByTagName("ul")[0];
                var display = ul.style.display;
                ul.style.display = display === "none" ? "" : "none";
            }
        }
    });
    //暴露到全局作用域
    global.expect = function(actual){
        return new Expect(actual);
    };
    $.fixture = function( title, asserts ) {
        $.require("ready",function(){
          
            var moduleId = "mass-spec-"+title;
            if(!get(moduleId)){//在主显示区中添加一个版块
                /** =================每个模块大抵是下面的样子===============
                <div class="mass-spec-case" id="mass-spec-$.js">
                   <p><a href="javascript:void(0)">JS文件名字</a></p>
                   <ul style="display: none;" class="mass-spec-detail">
                   测试结果
                   </ul>
                </div>
                */
                var html = ['<div id="#{0}" class="mass-spec-case">',
                '<p class="mass-spec-slide"><a href="javascript:void(0)">#{1}</a></p>',
                '<ul class="mass-spec-detail" style="display:none;"></ul></div>'].join('');
                get("mass-spec-cases").appendChild(parseHTML($.format(html, moduleId, title)));
            }
            var names = Object.keys(asserts), name;
         
            ;(function runTest(){
                if((name = names.shift())){
                    var assert = asserts[name],//测试函数
                    caseId = "mass-spec-case-"+name.replace(/\./g,"-");
                    if(!Expect.removeLoading){
                        var loading = get("loading");
                        loading.parentNode.removeChild(loading);
                        Expect.removeLoading = 1
                    }
                    if(!get(caseId)){//对应一个方法
                        var parentNode = get(moduleId).getElementsByTagName("ul")[0];
                        //替换函数体内的<与>字符
                        var body = (assert+"").replace(/</g,"&lt;").replace(/>/g,"&gt;");
                        //将函数体内的expect测试语句用<kbd></kbd>标签包裹起来
                        body = body.split("expect").map(function(segment){
                            if(segment.charAt(0) === "("){
                                return retouch(segment)
                            }else{
                                return segment
                            }
                        }).join('<a href="javascript:void(0);" hidefocus="true" >expect');
                        //将经过修整的内容放到DOM树上。
                        var node = parseHTML($.format('<li id="#{0}">#{1}<pre>#{2}</pre></li>', caseId, name, uni2hanzi(body)));  
                        parentNode.appendChild(node);
                    }
                    Expect.Client = get(caseId);//对应一个LI元素
                    Expect.PASS = 1;//默认为通过
                    Expect.index = 0;
                    Expect.now = new Date;
                    try{
                        assert();//执行测试套件
                    }catch(e){
                    
                        Expect.PASS = 2;
                        var el = Expect.Client.getElementsByTagName("a")[0];
                        if(el){
                            var arr = [];
                            for(var i in e){
                                arr.push( i + " : "+e[i] )
                            }
                            el.appendChild(parseHTML('<form class="mass-spec-diff"><pre>'+arr.join("\n")+'</pre></form>'));
                            el.className = "mass-assert-error";
                        }
                        var errors = get("mass-spec-errors");
                        //修正异常栏的数值
                        errors.innerHTML = ++errors.title;
                    }
                    Expect.Client.className = Expect.CLASS[Expect.PASS];
                    Expect.refreshTime();//更新测试所花的时间
                    //前面必须用window来显式调用,否则会在safari5中
                    //报INVALID_ACCESS_ERR: DOM Exception 15: A parameter or an operation
                    // was not supported by the underlying object.错误
                    global.setTimeout(runTest,15);
                }
            })();
        });
    }
    //此函数是解决FF无法显示函数体内的汉字问题
    var uni2hanzi = global.netscape ? function(s){
        return unescape(s.replace(/\\u/g,'%u'));
    }: function(s){
        return s
    }
    $.require("ready",function(){
        //当DOM树建完之时，开始构筑测试系统的外廓
        var html = ['<div id="mass-spec-result"><p class="mass-spec-summary">',
        '<span id="mass-spec-failures" title="0">0</span>&nbsp;failures&emsp;',
        '<span id="mass-spec-errors" title="0">0</span>&nbsp;errors&emsp;',
        '<span id="mass-spec-done" title="0">0</span>%&nbsp;done&emsp;',
        '<span id="mass-spec-time" title="0">0</span>ms&nbsp;</p>',
        '<p class="mass-spec-summary">',global.navigator.userAgent,
        '</p><div id="mass-spec-cases"><div id="loading">正在加载测试数据中，请耐心等特</div></div></div>'];
        //div#mass-spec-result为整个系统的容器
        //div#mass-spec-summary用于放置各种统计
        //div#mass-spec-cases用于放置测试模块
        DOC.body.appendChild(parseHTML(html.join("")));
    });
});
//2011.8.9    增加getUnpassExpect函数,用于取得没有通过的expect并显示出来
//2011.10.26  优化format与quote
//2011.10.27   runTest添加参数，用于等特一定做量的测试模块都加载完毕才执行
//2011.10.31 去掉deferred模块的依赖，依靠ready列队自行添加测试的模块
//2012.1.28  升级到v3，大大增强错误定位的能力