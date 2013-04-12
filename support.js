//==========================================
// 特征嗅探模块 by 司徒正美
//==========================================
define("support", ["mass"], function($) {
    var DOC = document,
        div = DOC.createElement('div'),
        TAGS = "getElementsByTagName";
    div.setAttribute("className", "t");
    div.innerHTML = ' <link/><a href="/nasami"  style="float:left;opacity:.25;">d</a>' + '<object><param/></object><table></table><input type="checkbox" checked/>';
    var a = div[TAGS]("a")[0],
        style = a.style,
        select = DOC.createElement("select"),
        input = div[TAGS]("input")[0],
        opt = select.appendChild(DOC.createElement("option"));
    //true为正常，false为不正常
    var support = $.support = {
        //标准浏览器只有在table与tr之间不存在tbody的情况下添加tbody，而IE678则笨多了,即在里面为空也乱加tbody
        insertTbody: !div[TAGS]("tbody").length,
        // 在大多数游览器中checkbox的value默认为on，唯有chrome返回空字符串
        checkOn: input.value === "on",
        //当为select添加一个新option元素时，此option会被选中，但IE与早期的safari却没有这样做,需要访问一下其父元素后才能让它处于选中状态（bug）
        optSelected: !! opt.selected,
        //IE67，无法取得用户设定的原始href值
        attrInnateHref: a.getAttribute("href") === "/nasami",
        //IE67，无法取得用户设定的原始style值，只能返回el.style（CSSStyleDeclaration）对象(bug)
        attrInnateStyle: a.getAttribute("style") !== style,
        //IE67, 对于某些固有属性需要进行映射才可以用，如class, for, char，IE8及其他标准浏览器不需要
        attrInnateName: div.className !== "t",
        //IE6-8,对于某些固有属性不会返回用户最初设置的值
        attrInnateValue: input.getAttribute("checked") == "",
        //http://www.cnblogs.com/rubylouvre/archive/2010/05/16/1736535.html
        //是否能正确返回opacity的样式值，IE8返回".25" ，IE9pp2返回0.25，chrome等返回"0.25"
        cssOpacity: style.opacity == "0.25",
        //某些浏览器不支持w3c的cssFloat属性来获取浮动样式，而是使用独家的styleFloat属性
        cssFloat: !! style.cssFloat,
        //IE678的getElementByTagName("*")无法遍历出Object元素下的param元素（bug）
        traverseAll: !! div[TAGS]("param").length,
        //https://prototype.lighthouseapp.com/projects/8886/tickets/264-ie-can-t-create-link-elements-from-html-literals
        //IE678不能通过innerHTML生成link,style,script节点（bug）
        noscope: !div[TAGS]("link").length ,
        //IE6789由于无法识别HTML5的新标签，因此复制这些新元素时也不正确（bug）
        cloneHTML5: DOC.createElement("nav").cloneNode(true).outerHTML !== "<:nav></:nav>",
        //在标准浏览器下，cloneNode(true)是不复制事件的，以防止循环引用无法释放内存，而IE却没有考虑到这一点，把事件复制了（inconformity）
        //        noCloneEvent: true,
        //现在只有firefox不支持focusin,focus事件,并且它也不支持DOMFocusIn,DOMFocusOut,并且此事件无法通过eventSupport来检测
        focusin: $["@bind"] === "attachEvent",
        //IE肯定支持
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
        //        keepSize: true,
        //getComputedStyle API是否能支持将left, top的百分比原始值自动转换为像素值
        pixelPosition: true,
        transition: false
    };
    //IE6789的checkbox、radio控件在cloneNode(true)后，新元素没有继承原来的checked属性（bug）
    input.checked = true;
    support.cloneChecked = (input.cloneNode(true).checked === true);
    support.appendChecked = input.checked;
    //添加对optDisabled,cloneAll,insertAdjacentHTML,innerHTML,fastFragment的特征嗅探
    //判定disabled的select元素内部的option元素是否也有diabled属性，没有才是标准
    //这个特性用来获取select元素的value值，特别是当select渲染为多选框时，需要注意从中去除disabled的option元素，
    //但在Safari中，获取被设置为disabled的select的值时，由于所有option元素都被设置为disabled，会导致无法获取值。
    select.disabled = true;
    support.optDisabled = !opt.disabled;
    //IE下对div的复制节点设置与背景有关的样式会影响到原样式,说明它在复制节点对此样式并没有深拷贝,还是共享一份内存
    div.style.backgroundClip = "content-box";
    div.cloneNode(true).style.backgroundClip = "";
    support.cloneBackgroundStyle = div.style.backgroundClip === "content-box";
    var table = div[TAGS]("table")[0];
    try { //检测innerHTML与insertAdjacentHTML在某些元素中是否存在只读（这时会抛错）
        table.innerHTML = "<tr><td>1</td></tr>";
        support.innerHTML = true;
        table.insertAdjacentHTML("afterBegin", "<tr><td>2</td></tr>");
        support.insertAdjacentHTML = true;
    } catch(e) {};

    a = select = table = opt = style = null;
    require("ready", function() {
        var body = DOC.body;
        if(!body) //frameset不存在body标签
        return;
        try {
            var range = DOC.createRange();
            range.selectNodeContents(body.firstChild || body); 
            //fix opera(9.2~11.51) bug,必须对文档进行选取，尽量只选择一个很小范围
            support.fastFragment = !! range.createContextualFragment("<a>");
            $.cachedRange = range;
        } catch(e) {};
        div.style.cssText = "position:absolute;top:-1000px;left:-1000px;";
        body.insertBefore(div, body.firstChild);
        var a = '<div style="height:20px;display:inline-block"></div>';
        div.innerHTML = a + a; //div默认是block,因此两个DIV会上下排列0,但inline-block会让它们左右排列
        support.inlineBlock = div.offsetHeight < 40; //检测是否支持inlineBlock
        if(window.getComputedStyle) {
            div.style.top = "1%";
            var computed = window.getComputedStyle(div, null) || {};
            support.pixelPosition = computed.top !== "1%";
        }
        //http://stackoverflow.com/questions/7337670/how-to-detect-focusin-support
        div.innerHTML = "<a href='#'></a>";
        if(!support.focusin) {
            a = div.firstChild;
            a.addEventListener('focusin', function() {
                support.focusin = true;
            }, false);
            a.focus();
        }
        div.style.width = div.style.paddingLeft = "10px"; //检测是否支持盒子模型
        support.boxModel = div.offsetWidth === 20;
        body.removeChild(div);
        div = null;
    });
    return $;
});
/**
2011.9.7 优化attrProp判定
2011.9.16所有延时判定的部分现在可以立即判定了
2011.9.23增加fastFragment判定
2012.1.28有些特征嗅探必须连接到DOM树上才能进行
2012.5.22 精简插入DOM树后的五种检测
*/