//==========================================
// 特征嗅探模块 by 司徒正美
//==========================================
define("support", function(){
    $.log("已加载特征嗅探模块",7);
    var DOC = document, div = DOC.createElement('div'),TAGS = "getElementsByTagName";
    div.setAttribute("className", "t");
    div.innerHTML = ' <link/><a href="/nasami"  style="float:left;opacity:.25;">d</a>'+
    '<object><param/></object><table></table><input type="checkbox"/>';
    var a = div[TAGS]("a")[0], style = a.style,
    select = DOC.createElement("select"),
    input = div[TAGS]( "input" )[ 0 ],
    opt = select.appendChild( DOC.createElement("option") );
    //true为正常，false为不正常
    var support = $.support = {
        //标准浏览器只有在table与tr之间不存在tbody的情况下添加tbody，而IE678则笨多了,即在里面为空也乱加tbody
        insertTbody: !div[TAGS]("tbody").length,
        // 在大多数游览器中checkbox的value默认为on，唯有chrome返回空字符串
        checkOn :  input.value === "on",
        //当为select添加一个新option元素时，此option会被选中，但IE与早期的safari却没有这样做,需要访问一下其父元素后才能让它处于选中状态（bug）
        optSelected: !!opt.selected,
        //IE67无法区分href属性与特性（bug）
        attrHref: a.getAttribute("href") === "/nasami",
        //IE67是没有style特性（特性的值的类型为文本），只有el.style（CSSStyleDeclaration）(bug)
        attrStyle: a.getAttribute("style") !== style,
        //对于一些特殊的特性，如class, for, char，IE67需要通过映射方式才能使用getAttribute才能取到值(bug)
        attrProp:div.className !== "t",
        //http://www.cnblogs.com/rubylouvre/archive/2010/05/16/1736535.html
        //是否能正确返回opacity的样式值，IE8返回".25" ，IE9pp2返回0.25，chrome等返回"0.25"
        cssOpacity: style.opacity == "0.25",
        //某些浏览器不支持w3c的cssFloat属性来获取浮动样式，而是使用独家的styleFloat属性
        cssFloat: !!style.cssFloat,
        //IE678的getElementByTagName("*")无法遍历出Object元素下的param元素（bug）
        traverseAll: !!div[TAGS]("param").length,
        //https://prototype.lighthouseapp.com/projects/8886/tickets/264-ie-can-t-create-link-elements-from-html-literals
        //IE678不能通过innerHTML生成link,style,script节点（bug）
        createAll: !!div[TAGS]("link").length,
        //IE6789由于无法识别HTML5的新标签，因此复制这些新元素时也不正确（bug）
        cloneHTML5: DOC.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>",
        //在标准浏览器下，cloneNode(true)是不复制事件的，以防止循环引用无法释放内存，而IE却没有考虑到这一点，把事件复制了（inconformity）
        cloneNode: true,
        //现在只有firefox不支持focusin,focus事件,并且它也不支持DOMFocusIn,DOMFocusOut,并且此事件无法通过eventSupport来检测
        focusin : $["@bind"] === "attachEvent",//IE肯定支持
        //IE6789的innerHTML对于table,thead,tfoot,tbody,tr,col,colgroup,html,title,style,frameset是只读的（inconformity）
        innerHTML: false,
        //IE的insertAdjacentHTML与innerHTML一样，对于许多元素是只读的，另外FF8之前是不支持此API的
        insertAdjacentHTML: false,
        //是否支持createContextualFragment API，此方法发端于FF3，因此许多浏览器不支持或实现存在BUG，但它是将字符串转换为文档碎片的最高效手段
        fastFragment: false,
        //IE67不支持display:inline-block，需要通过hasLayout方法去模拟（bug）
        inlineBlock: true,
        //http://w3help.org/zh-cn/causes/RD1002
        //在IE678中，非替换元素在设置了大小与hasLayout的情况下，会将其父级元素撑大（inconformity）
        keepSize: true,
        //getComputedStyle API是否能支持将margin的百分比原始值自动转换为像素值
        cssPercentedMargin: true
    };
    //IE6789的checkbox、radio控件在cloneNode(true)后，新元素没有继承原来的checked属性（bug）
    input.checked = true;
    support.cloneChecked = (input.cloneNode( true ).checked === true);
    support.appendChecked = input.checked;
    //添加对optDisabled,cloneAll,insertAdjacentHTML,innerHTML,fastFragment的特征嗅探
    //判定disabled的select元素内部的option元素是否也有diabled属性，没有才是标准
    //这个特性用来获取select元素的value值，特别是当select渲染为多选框时，需要注意从中去除disabled的option元素，
    //但在Safari中，获取被设置为disabled的select的值时，由于所有option元素都被设置为disabled，会导致无法获取值。
    select.disabled = true;
    support.optDisabled = !opt.disabled;
    var clickFn
    if ( !div.addEventListener && div.attachEvent && div.fireEvent ) {
        div.attachEvent("onclick", clickFn = function () {
            support.cloneNode = false;//w3c的节点复制是不复制事件的
        });
        div.cloneNode(true).fireEvent("onclick");
        div.detachEvent( "onclick", clickFn );
    }
    var table = div[TAGS]("table")[0]
    try{//检测innerHTML与insertAdjacentHTML在某些元素中是否存在只读（这时会抛错）
        table.innerHTML = "<tr><td>1</td></tr>";
        support.innerHTML = true;
        table.insertAdjacentHTML("afterBegin","<tr><td>2</td></tr>");
        support.insertAdjacentHTML = true;
    }catch(e){ };
    a = select = table = opt = style =  null;
    $.require("ready",function(){
        var body = DOC.body;
        if(!body)//frameset不存在body标签
            return;
        try{
            var range =  DOC.createRange();
            range.selectNodeContents(body); //fix opera(9.2~11.51) bug,必须对文档进行选取
            support.fastFragment = !!range.createContextualFragment("<a>");
            $.commonRange = range;
        }catch(e){ };
        div.style.cssText = "position:absolute;top:-1000px;left:-1000px;"
        body.insertBefore( div, body.firstChild );
        var ib = '<div style="height:20px;display:inline-block"></div>';
        div.innerHTML = ib + ib;//div默认是block,因此两个DIV会上下排列0,但inline-block会让它们左右排列
        support.inlineBlock = div.offsetHeight < 40;//检测是否支持inlineBlock
        div.style.cssText = "width:20px;"
        div.innerHTML = "<div style='width:40px;'></div>";
        support.keepSize = div.offsetWidth == 20;//检测是否会被子元素撑大
        //http://stackoverflow.com/questions/7337670/how-to-detect-focusin-support
        div.innerHTML = "<a href='#'></a>"
        if(!support.focusin){
            var a = div.firstChild;
            a.addEventListener('focusin', function(){
                support.focusin = true;
            }, false);
            a.focus();
        }
        div.style.width = div.style.paddingLeft = "10px";//检测是否支持盒子模型
        support.boxModel = div.offsetWidth === 20;
        if( window.getComputedStyle ) {
            div.style.marginTop = "1%";//检测是否能转换百分比的margin值
            support.cssPercentedMargin = ( window.getComputedStyle( div, null ) || {
                marginTop: 0
            } ).marginTop !== "1%";
        }
        body.removeChild( div );
        div =  null;
    });
    return support;
});
/**
2011.9.7 优化attrProp判定
2011.9.16所有延时判定的部分现在可以立即判定了
2011.9.23增加fastFragment判定
2012.1.28有些特征嗅探必须连接到DOM树上才能进行
2012.5.22 精简插入DOM树后的五种检测
*/