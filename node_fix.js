//==================================================
// 节点补丁模块 v1 主要是用于在创建或复制节点时处理IE的一些BUG
//==================================================
define("node_fix", !! document.dispatchEvent, ["mass"], function($) {
    //修正IE下对数据克隆时出现的一系列问题
    function fixNode(clone, src) {
        if(src.nodeType == 1) {
            //只处理元素节点
            var nodeName = clone.nodeName.toLowerCase();
            //clearAttributes方法可以清除元素的所有属性值，如style样式，或者class属性，与attachEvent绑定上去的事件
            clone.clearAttributes();
            //复制原对象的属性到克隆体中,但不包含原来的事件, ID,  NAME, uniqueNumber
            clone.mergeAttributes(src, false);
            //IE6-8无法复制其内部的元素
            if(nodeName === "object") {
                clone.outerHTML = src.outerHTML;
            } else if(nodeName === "input" && (src.type === "checkbox" || src.type == "radio")) {
                //IE6-8无法复制chechbox的值，在IE6-7中也defaultChecked属性也遗漏了
                if(src.checked) {
                    clone.defaultChecked = clone.checked = src.checked;
                }
                // 除Chrome外，所有浏览器都会给没有value的checkbox一个默认的value值”on”。
                if(clone.value !== src.value) {
                    clone.value = src.value;
                }
            } else if(nodeName === "option") {
                clone.selected = src.defaultSelected; // IE6-8 无法保持选中状态
            } else if(nodeName === "input" || nodeName === "textarea") {
                clone.defaultValue = src.defaultValue; // IE6-8 无法保持默认值
            } else if(nodeName === "script" && clone.text !== src.text) {
                clone.text = src.text; //IE6-8不能复制script的text属性
            }

        }
    }
    var shim = document.createElement("div"); //缓存parser，防止反复创建

    function shimCloneNode(outerHTML, tree) {
        tree.appendChild(shim);
        shim.innerHTML = outerHTML;
        tree.removeChild(shim);
        return shim.firstChild;
    }
    var unknownTag = "<?XML:NAMESPACE"
    $.fixCloneNode = function(node) {
        //这个判定必须这么长：判定是否能克隆新标签，判定是否为元素节点, 判定是否为新标签
        if(!$.support.cloneHTML5 && node.outerHTML) { //延迟创建检测元素
            var outerHTML = document.createElement(node.nodeName).outerHTML,
                bool = outerHTML.indexOf(unknownTag) // !0 === true;
        }
        //各浏览器cloneNode方法的部分实现差异 http://www.cnblogs.com/snandy/archive/2012/05/06/2473936.html
        var neo = !bool ? shimCloneNode(node.outerHTML, document.documentElement) : node.cloneNode(true)
        fixNode(neo, node);
        var src = node[TAGS]("*"),
            neos = neo[TAGS]("*");
        for(var i = 0; src[i]; i++) {
            fixNode(neos[i], src[i]);
        }
    }

    var rtbody = /<tbody[^>]*>/i
    $.fixParseHTML = function(wrapper, html) {
	if ($.support.noscope) { //移除所有br补丁
		for (els = wrapper["getElementsByTagName"]("br"), i = 0; el = els[i++];) {
			if (el.className && el.className === "fix_noscope") {
				el.parentNode.removeChild(el);
			}
		}
	}
	//当我们在生成colgroup, thead, tfoot时 IE会自作多情地插入tbody节点
	if (!$.support.insertTbody) {
		var noTbody = !rtbody.test(html),
			//矛:html本身就不存在<tbody字样
			els = wrapper["getElementsByTagName"]("tbody");
		if (els.length > 0 && noTbody) { //盾：实际上生成的NodeList中存在tbody节点
			for (var i = 0, el; el = els[i++];) {
				if (!el.childNodes.length) //如果是自动插入的里面肯定没有内容
				el.parentNode.removeChild(el);
			}
		}
	}
	//IE67没有为它们添加defaultChecked
	if (!$.support.appendChecked) {
		for (els = wrapper["getElementsByTagName"]("input"), i = 0; el = els[i++];) {
			if (el.type === "checkbox" || el.type === "radio") {
				el.defaultChecked = el.checked;
			}
		}
	}
    }
})
//2013.1.11