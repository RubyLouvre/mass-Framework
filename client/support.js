//==========================================
// 特征嗅探模块 by 司徒正美
//==========================================
$.define("support", function(){
    $.log("已加载support模块");
    var global = this, DOC = global.document, div = DOC.createElement('div'),TAGS = "getElementsByTagName";
    div.setAttribute("className", "t");
    div.innerHTML = ' <link/><a href="/nasami"  style="float:left;opacity:.25;">d</a>'+
    '<object><param/></object><table></table><input type="checkbox"/>';
    var a = div[TAGS]("a")[0], style = a.style,
    select = DOC.createElement("select"),

    opt = select.appendChild( DOC.createElement("option") );
    var support = $.support = {
        //是否支持自动插入tbody
        insertTbody: !!div[TAGS]("tbody").length,
        // checkbox的value默认为on，唯有Chrome 返回空字符串
        checkOn :  div[TAGS]( "input" )[ 0 ].value === "on",
        //safari下可能无法取得这个属性,需要访问一下其父元素后才能取得该值
        attrSelected:!!opt.selected,
        //是否区分href属性与特性
        attrHref: a.getAttribute("href") === "/nasami",
        //IE67是没有style特性（特性的值的类型为文本），只有el.style（CSSStyleDeclaration）(bug)
        attrStyle:a.getAttribute("style") !== style,
        //IE8,FF能直接用getAttribute("class")取得className,而IE67则需要将"class"映射为"className",才能用getAttribute取得
        attrProp:div.className !== "t",
        //http://www.cnblogs.com/rubylouvre/archive/2010/05/16/1736535.html
        //IE8返回".25" ，IE9pp2返回0.25，chrome等返回"0.25"
        cssOpacity: style.opacity == "0.25",
        //某些浏览器不支持w3c的cssFloat属性来获取浮动样式，而是使用独家的styleFloat属性
        cssFloat: !!style.cssFloat,
        //某些浏览器使用document.getElementByTagName("*")不能遍历Object元素下的param元素（bug）
        traverseAll: !!div[TAGS]("param").length,
        //https://prototype.lighthouseapp.com/projects/8886/tickets/264-ie-can-t-create-link-elements-from-html-literals
        //某些浏览器不能通过innerHTML生成link,style,script节点
        createAll: !!div[TAGS]("link").length,
        //IE的cloneNode才是真正意义的复制，能复制动态添加的自定义属性与事件（可惜这不是标准，归为bug）
        cloneAll: false,
        optDisabled: false,
        boxModel: null,
        insertAdjacentHTML:false,
        innerHTML:false,
        fastFragment:false
    };

    //当select元素设置为disabled后，其所有option子元素是否也会被设置为disabled
    select.disabled = true;
    support.optDisabled = !opt.disabled;
    if ( !div.addEventListener && div.attachEvent && div.fireEvent ) {
        div.attachEvent("onclick", function click() {
            support.cloneAll = true;//w3c的节点复制是不复制事件的
            div.detachEvent("onclick", click);
        });
        div.cloneNode(true).fireEvent("onclick");
    }
    //测试是否符合w3c的盒子模型
    div.style.width = div.style.paddingLeft = "1px";
    //判定insertAdjacentHTML是否完美，用于append,prepend,before,after等方法
    var table = div[TAGS]("table")[0]
    try{
        table.insertAdjacentHTML("afterBegin","<tr><td>1</td></tr>");
        support.insertAdjacentHTML = true;
    }catch(e){ }
    try{
        var range =  DOC.createRange();
        support.fastFragment = range.createContextualFragment("<a>") && range;
    }catch(e){ };
    //判定innerHTML是否完美，用于html方法
    try{
        table.innerHTML = "<tr><td>1</td></tr>";
        support.innerHTML = true;
    }catch(e){};

    //有些特征嗅探必须连接到DOM树上才能进行
    var body = DOC[TAGS]( "body" )[ 0 ],i,
    testElement = DOC.createElement( body ? "div" : "body" ),
    testElementStyle = {
        visibility: "hidden",
        width: 0,
        height: 0,
        border: 0,
        margin: 0,
        background: "none"
    };
    if ( body ) {
        $.mix( testElementStyle, {
            position: "absolute",
            left: "-1000px",
            top: "-1000px"
        });
    }
    for ( i in testElementStyle ) {
        testElement.style[ i ] = testElementStyle[ i ];
    }
    testElement.appendChild( div );//将DIV加入DOM树
    var testElementParent = body || $.html;
    testElementParent.insertBefore( testElement, testElementParent.firstChild );

    support.boxModel = div.offsetWidth === 2;
    if ( "zoom" in div.style ) {
        //IE7以下版本并不支持display: inline-block;样式，而是使用display: inline;
        //并通过其他样式触发其hasLayout形成一种伪inline-block的状态
        div.style.display = "inline";
        div.style.zoom = 1;
        support.inlineBlockNeedsLayout = div.offsetWidth === 2;
        //http://w3help.org/zh-cn/causes/RD1002
        // 在 IE6 IE7(Q) IE8(Q) 中，如果一个明确设置了尺寸的非替换元素的 'overflow' 为 'visible'，
        // 当该元素无法完全容纳其内容时，该元素的尺寸将被其内容撑大
        // 注:替换元素（replaced element）是指 img，input，textarea，select，object等这类默认就有CSS格式化外表范围的元素
        div.style.display = "";
        div.innerHTML = "<div style='width:4px;'></div>";
        support.shrinkWrapBlocks = div.offsetWidth !== 2;
        if( global.getComputedStyle ) {
            div.style.marginTop = "1%";
            support.pixelMargin = ( global.getComputedStyle( div, null ) || {
                marginTop: 0
            } ).marginTop !== "1%";
        }

    }
    div.innerHTML = "";
    testElementParent.removeChild( testElement );
    div = null;
    return support;
});
/**
2011.9.7 优化attrProp判定
2011.9.16所有延时判定的部分现在可以立即判定了
2011.9.23增加fastFragment判定
*/