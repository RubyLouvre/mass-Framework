//==================================================
// 属性操作模块 v2
//==================================================
define("attr",["$support","$node"], function( support ){
    // $.log("已加载attr模块")
    var rreturn = /\r/g,
    rfocusable = /^(?:button|input|object|select|textarea)$/i,
    rclickable = /^a(?:rea)?$/i,
    rnospaces = /\S+/g
    function getValType( el ){
        var ret = el.tagName.toLowerCase();
        return ret == "input" && /checkbox|radio/.test(el.type) ? el.type : ret;
    }
    $.implement({
        /**
         *  为所有匹配的元素节点添加className，添加多个className要用空白隔开
         *  如$("body").addClass("aaa");$("body").addClass("aaa bbb");
         *  <a href="http://www.cnblogs.com/rubylouvre/archive/2011/01/27/1946397.html">相关链接</a>
         */
        addClass: function( item ){
            if ( typeof item == "string") {
                for ( var i = 0, el; el = this[i++]; ) {
                    if ( el.nodeType === 1 ) {
                        if ( !el.className ) {
                            el.className = item;
                        } else {
                            var a = (el.className+" "+item).match( rnospaces );
                            a.sort();
                            for (var j = a.length - 1; j > 0; --j)
                                if (a[j] == a[j - 1])
                                    a.splice(j, 1);
                            el.className = a.join(" ");
                        }
                    }
                }
            }
            return this;
        },
        //如果第二个参数为true，要求所有匹配元素都拥有此类名才返回true
        hasClass: function( item, every ) {
            var method = every === true ? "every" : "some",
            rclass = new RegExp('(\\s|^)'+item+'(\\s|$)');//判定多个元素，正则比indexOf快点
            return $.slice(this)[ method ](function( el ){//先转换为数组
                return "classList" in el ? el.classList.contains( item ):
                (el.className || "").match(rclass);
            });
        },
        //如果不传入类名,则清空所有类名,允许同时删除多个类名
        removeClass: function( item ) {
            if ( (item && typeof item === "string") || item === void 0 ) {
                var classNames = ( item || "" ).match( rnospaces ), cl = classNames.length;
                for ( var i = 0, node; node = this[ i++ ]; ) {
                    if ( node.nodeType === 1 && node.className ) {
                        if ( item ) {//rnospaces = /\S+/
                            var set = " " + node.className.match( rnospaces ).join(" ") + " ";
                            for ( var c = 0; c < cl; c++ ) {
                                set = set.replace(" " + classNames[c] + " ", " ");
                            }
                            node.className = set.slice( 1, set.length - 1 );
                        } else {
                            node.className = "";
                        }
                    }
                }
            }
            return this;
        },
        //如果存在（不存在）就删除（添加）指定的类名。对所有匹配元素进行操作。
        toggleClass: function( value ){
            var type = typeof value , classNames = type === "string" && value.match( rnospaces ) || [], className, i;
            return this.each(function( el ) {
                i = 0;
                if(el.nodeType === 1){
                    var self = $( el );
                    if(type == "string" ){
                        while ( (className = classNames[ i++ ]) ) {
                            self[ self.hasClass( className ) ? "removeClass" : "addClass" ]( className );
                        }
                    } else if ( type === "undefined" || type === "boolean" ) {
                        if ( el.className ) {
                            $._data( el, "__className__", el.className );
                        }
                        el.className = el.className || value === false ? "" : $._data( el, "__className__") || "";
                    }
                }
            });
        },
        //如果匹配元素存在类名old则将其置换为类名neo
        replaceClass: function( old, neo ){
            for ( var i = 0, node; node = this[ i++ ]; ) {
                if ( node.nodeType === 1 && node.className ) {
                    var arr = node.className.match( rnospaces ), arr2 = [];
                    for ( var j = 0; j < arr.length; j++ ) {
                        arr2.push( arr[j] == old ? neo : arr[j]);
                    }
                    node.className = arr2.join(" ");
                }
            }
            return this;
        },
        val : function( item ) {
            var el = this[0], getter = valAdapter[ "option:get" ];
            if ( !arguments.length ) {//读操作
                if ( el && el.nodeType == 1 ) {
                    //处理select-multiple, select-one,option,button
                    var ret =  (valAdapter[ getValType(el)+":get" ] ||
                        $.propAdapter[ "@default:get" ])( el, "value", getter );
                    return  typeof ret === "string" ? ret.replace( rreturn, "" ) : ret == null ? "" : ret;
                }
                return void 0;
            }
            //我们确保传参为字符串数组或字符串，null/undefined强制转换为"", number变为字符串
            if( Array.isArray( item ) ){
                item = item.map(function (item) {
                    return item == null ? "" : item + "";
                });
            }else if( isFinite(item) ){
                item += "";
            }else{
                item = item || "";
            }
            return this.each(function( el ) {//写操作
                if ( el.nodeType == 1 ) {
                    (valAdapter[ getValType(el)+":set" ] ||
                        $.propAdapter[ "@default:set" ])( el, "value", item , getter );
                }
            });
        }
    });
    //=========================valAdapter 部分==========================
    var valAdapter = {
        "option:get":  function( node ) {
            var val = node.attributes.value;
            //黑莓手机4.7下val会返回undefined,但我们依然可用node.value取值
            return !val || val.specified ? node.value : node.text;
        },
        "select:get": function( node ,value, getter) {
            var option,  options = node.options,
            index = node.selectedIndex,
            one = node.type === "select-one" || index < 0,
            values = one ? null : [],
            max = one ? index + 1 : options.length,
            i = index < 0 ? max :  one ? index : 0;
            for ( ; i < max; i++ ) {
                option = options[ i ];
                //旧式IE在reset后不会改变selected，需要改用i === index判定
                //我们过滤所有disabled的option元素，但在safari5下，如果设置select为disable，那么其所有孩子都disable
                //因此当一个元素为disable，需要检测其是否显式设置了disable及其父节点的disable情况
                if ( ( option.selected || i === index ) &&
                    (support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null) &&
                    (!option.parentNode.disabled || !$.type( option.parentNode, "OPTGROUP" )) ) {
                    value = getter( option );
                    if ( one ) {
                        return value;
                    }
                    //收集所有selected值组成数组返回
                    values.push( value );
                }
            }
            return values;
        },
        "select:set": function( node, name, values, getter ) {
            $.slice(node.options).forEach(function( el ){
                el.selected = !!~values.indexOf( getter(el) );
            });
            if ( !values.length ) {
                node.selectedIndex = -1;
            }
        }
    }
    if(!support.attrInnateName){
        valAdapter["button:get"] = function( node ) {
            return node.innerText
        }
        valAdapter["button:set"] = function( node, name, value ) {
            node.innerText = value
        }
    }
  
    //checkbox的value默认为on，唯有chrome 返回空字符串
    if ( !support.checkOn ) {
        "radio,checkbox".replace( $.rword, function( name ) {
            valAdapter[ name + ":get" ] = function( node ) {
                return node.getAttribute("value") === null ? "on" : node.value;
            }
        });
    }
    //处理单选框，复选框在设值后checked的值
    "radio,checkbox".replace( $.rword, function( name ) {
        valAdapter[ name + ":set" ] = function( node, name, value) {
            if ( Array.isArray( value ) ) {
                return node.checked = !!~value.indexOf(node.value ) ;
            }
        }
    });

    //=========================prop attr 的部分==========================
    $.prop = function(node, name, value){
        if($["@bind"] in node){
            if(node.nodeType === 1 && !$.isXML( node )){
                name = $.propMap[ name.toLowerCase() ] || name;
            }
            var access = value === void 0 ? "get" : "set"
            return ($.propAdapter[name+":"+access] ||
                $.propAdapter["@default:"+access] )(node, name, value)
        }
    }
    $.attr = function(node, name, value){
        if($["@bind"] in node){
            if ( typeof node.getAttribute === "undefined" ) {
                return $.prop( node, name, value );
            }
            //这里只剩下元素节点
            var noxml = !$.isXML( node ), type = "@w3c", isBool
            if( noxml ){
                name = name.toLowerCase();
                var prop = $.propMap[ name ] || name
                if( !support.attrInnateName ){
                    type = "@ie"
                }     
                isBool = typeof node[ prop ] == "boolean" //判定是否为布尔属性
            }
            //移除操作
            if(noxml){
                if (value === null || value === false && isBool ){
                    return $.removeAttr(node, name )
                }
            }else if( value === null ) {
                return node.removeAttribute(name)
            }
            //读写操作
            var access = value === void 0 ? "get" : "set"
            if(isBool && access == "get"){
                type = "@bool";
                name = prop
            }
            return ( noxml  && $.attrAdapter[ name+":"+access ] ||
                $.attrAdapter[ type +":"+access] )(node, name, value)
        }
    }
    var cacheProp = {}
    function defaultProp(node, prop){
        var name = node.tagName+":"+prop;
        if(name in cacheProp){
            return cacheProp[name]
        }
        return cacheProp[name] = document.createElement(node.tagName)[prop]
    }

    $.mix({
        propMap:{//属性名映射
            "accept-charset": "acceptCharset",
            "char": "ch",
            "charoff": "chOff",
            "class": "className",
            "for": "htmlFor",
            "http-equiv": "httpEquiv"
        },
        //只能用于HTML,元素节点的内建不能删除（chrome真的能删除，会引发灾难性后果），使用默认值覆盖
        removeProp: function( node, name ) {
            if(node.nodeType === 1){
                if(!support.attrInnateName){
                    name = $.propMap[ name.toLowerCase() ] ||  name;
                }
                node[name] = defaultProp(node, name)
            }else{
                node[name] = void 0;
            }
        },
        //只能用于HTML
        removeAttr: function( node, name ) {
            if(name && node.nodeType === 1){
                name = name.toLowerCase();
                if(!support.attrInnateName){
                    name = $.propMap[ name ] ||  name;
                }
                //小心contentEditable,会把用户编辑的内容清空
                if(typeof node[ name ] != "boolean"){
                    node.setAttribute( name, "")
                }
                node.removeAttribute( name );
                // 确保bool属性的值为bool
                if ( node[ name ] === true ) {
                    node[ name ] = false;
                }
            }
        },
        propAdapter:{
            "@default:get": function( node, name ){
                return node[ name ]
            },
            "@default:set": function(node, name, value){
                node[ name ] = value;
            },
            "tabIndex:get": function( node ) {
                // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
                var attributeNode = node.getAttributeNode( "tabIndex" );
                return attributeNode && attributeNode.specified ?
                parseInt( attributeNode.value, 10 )  :
                rfocusable.test(node.nodeName) || rclickable.test(node.nodeName) && node.href  ? 0 : void 0;
            }
        },

        attrAdapter: {
            "@w3c:get": function( node, name ){
                var ret =  node.getAttribute( name ) ;
                return ret === null ? void 0 : ret;
            },
            "@w3c:set": function( node, name, value ){
                node.setAttribute( name, "" + value )
            },
            "@bool:get": function(node, name){
                //布尔属性在IE6-8的标签大部字母大写，没有赋值，并且无法通过其他手段获得用户的原始设值
                return node[ name ] ? name.toLowerCase() : void 0 
            },
            "@ie:get": function( node, name ){
                //http://rommelsantor.com/clog/2012/03/12/fixing-the-ie7-submit-value/
               //  $.log(node.nodeName)
                 //  $.log(node.value)
                var ret = node.getAttributeNode( name );
                if(ret){
                    if(ret.expando ){
                       return ret.specified ? ret.value : undefined
                    }else{
                       return ret.value
                    }
                }else{
                    return undefined
                }
                
//                return ret && ( fixSpecified[ name ] ? ret.value !== "" : ret.specified ) ?
//                ret.value :   undefined;
            },
            "@ie:set": function( node, name, value ){
               
                var attr = node.getAttributeNode( name );
                if ( !attr ) {//不存在就创建一个同名的特性节点
                    attr = node.ownerDocument.createAttribute( name );
                    node.setAttributeNode( attr );
                }
                attr.value = value + "" ;
            }

        }
    });
    $.attrAdapter["tabindex:get"] =  $.propAdapter["tabIndex:get"]
    "Attr,Prop".replace($.rword, function( method ){
        $.fn[ method.toLowerCase() ] = function( name, value ) {
            return $.access( this, name, value, $[ method.toLowerCase() ] );
        }
        $.fn[ "remove" + method] = function(name){
            return this.each(function() {
                $["remove" + method]( this, name );
            });
        }
    });

  
    //========================propAdapter 的相关修正==========================
    var propMap = $.propMap;
    var prop = "accessKey,allowTransparency,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan,contentEditable,"+
    "dateTime,defaultChecked,defaultSelected,defaultValue,frameBorder,isMap,longDesc,maxLength,marginWidth,marginHeight,"+
    "noHref,noResize,noShade,readOnly,rowSpan,tabIndex,useMap,vSpace,valueType,vAlign";
    prop.replace($.rword, function(name){
        propMap[name.toLowerCase()] = name;
    });
    if(!document.createElement("form").enctype){//如果不支持enctype， 我们需要用encoding来映射
        propMap.enctype = "encoding";
    }
    //safari IE9 IE8 我们必须访问上一级元素时,才能获取这个值
    if ( !support.optSelected ) {
        $.propAdapter[ "selected:get" ] = function( node ) {
            var parent = node
            for( ;!parent.add; parent.selectedIndex, parent = parent.parentNode){};
            return node.selected;
        }
    }
    if ( !support.attrInnateValue ) {
        // https://github.com/kissyteam/kissy/issues/198
        // http://gabriel.nagmay.com/2008/11/javascript-href-bug-in-ie/
        //大IE6-8如果一个A标签，它里面包含@值，并且没任何元素节点，那么它里面的文本会变成链接值
        $.attrAdapter[ "href:set" ] = $.propAdapter[ "href:set" ] = function( node, name, value ) {
            var b
            if(node.tagName == "A" && node.innerText.indexOf("@") > 0 
                && !node.children.length){
                b = node.ownerDocument.createElement('b');
                b.style.display = 'none';
                node.appendChild(b);
            }
            node.setAttribute(name, value+"");
            if (b) {
                node.removeChild(b);
            }
        }
    }

    //========================attrAdapter 的相关修正==========================
    var attrAdapter = $.attrAdapter
    if ( !support.attrInnateHref ) {
        //http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
        //IE的getAttribute支持第二个参数，可以为 0,1,2,4
        //0 是默认；1 区分属性的大小写；2取出源代码中的原字符串值(注，IE67对动态创建的节点没效),4用于取得完整路径
        //IE 在取 href 的时候默认拿出来的是绝对路径，加参数2得到我们所需要的相对路径。
        "href,src,width,height,colSpan,rowSpan".replace( $.rword, function( method ) {
            attrAdapter[ method.toLowerCase() + ":get" ] =  function( node,name ) {
                var ret = node.getAttribute( name, 2 );
                return ret === null ? void 0 : ret;
            }
        });
        "width,height".replace( $.rword, function( attr ){
            attrAdapter[attr+":set"] = function(node, name, value){
                node.setAttribute( attr, value === "" ? "auto" : value+"");
            }
        });
        $.propAdapter["href:get"] = function( node, name ) {
            return node.getAttribute( name, 4 );
        };
    }

    if ( !support.attrInnateStyle ) {
        //IE67是没有style特性（特性的值的类型为文本），只有el.style（CSSStyleDeclaration）(bug)
        attrAdapter[ "style:get" ] = function( node ) {
            return node.style.cssText.toLowerCase() || undefined ;
        }
        attrAdapter[ "style:set" ] = function( node, name, value ) {
            node.style.cssText = value + "";
        }
    }

});

/*
2011.8.2
将prop从attr分离出来
添加replaceClass方法
2011.8.5  重构val方法
2011.8.12 重构replaceClass方法
2011.10.11 重构attr prop方法
2011.10.21 FIX valAdapter["select:set"] BUG
2011.10.22 FIX boolaAdapter.set方法
2011.10.27 对prop attr val大重构
2012.6.23 attr在value为false, null, undefined时进行删除特性操作
// attrAdapter移除
//            "value:get": function( node, name ) {
//                if(node.nodeName ==="BUTTON" && !support.attrInnateName){
//                    return node.innerText
//                }
//                return name in node ? node.value: void 0;
//            },
//            "value:set": function( node, name, value ) {
//                if(node.nodeName ==="BUTTON" && !support.attrInnateName){
//                    return node.innerText = value +""
//                }
//                node.value = value+"";
//            }
*/

