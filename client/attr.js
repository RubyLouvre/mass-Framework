$.define("attr","support,node", function( support ){
   // $.log("已加载attr模块")
    var rreturn = /\r/g,
    rfocusable = /^(?:button|input|object|select|textarea)$/i,
    rclickable = /^a(?:rea)?$/i,
    rnospaces = /\S+/g,
    valOne = {
        "SELECT": "select",
        "OPTION": "option",
        "BUTTON": "button"
    },
    getValType = function( node ){
        return "form" in node && (valOne[ node.tagName ] || node.type);
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
                            el.className = a.join(' ');
                        }
                    }
                }
            }
            return this;
        },
        //如果第二个参数为true，则只判定第一个是否存在此类名，否则对所有元素进行操作；
        hasClass: function( item, every ) {
            var method = every === true ? "every" : "some",
            rclass = new RegExp('(\\s|^)'+item+'(\\s|$)');//判定多个元素，正则比indexOf快点
            return $.slice(this)[ method ](function( el ){
                return "classList" in el ? el.classList.contains( item ):
                (el.className || "").match(rclass);
            });
        },
        //如果不传入类名,则去掉所有类名,允许传入多个类名
        removeClass: function( item ) {
            if ( (item && typeof item === "string") || item === void 0 ) {
                var classNames = ( item || "" ).match( rnospaces );
                for ( var i = 0, node; node = this[ i++ ]; ) {
                    if ( node.nodeType === 1 && node.className ) {
                        if ( item ) {
                            var set = " " + node.className.match( rnospaces ).join(" ") + " ";
                            for ( var c = 0, cl = classNames.length; c < cl; c++ ) {
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
        //如果存在（不存在）就删除（添加）一个类。对所有匹配元素进行操作。
        toggleClass: function( item ){
            var type = typeof item , classNames = type === "string" && item.match( rnospaces ) || [],  className, i;
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
                            self._data( "__className__", el.className );
                        }
                        el.className = el.className || item === false ? "" : self.data( "__className__") || "";
                    }
                }
            });
        },
        //如果匹配元素存在old类名则将其改应neo类名
        replaceClass: function( old, neo ){
            for ( var i = 0, node; node = this[ i++ ]; ) {
                if ( node.nodeType === 1 && node.className ) {
                    var arr = node.className.match( rnospaces ), arr2 = [];
                    for ( var j = 0; j < arr.length; j++ ) {
                        arr2.push( arr[j] != old ? arr[j] : neo );
                    }
                    node.className = arr2.join(" ");
                }
            }
            return this;
        },
        val : function( item ) {
            var el = this[0], adapter = $.valAdapter, fn = adapter[ "option:get" ];
            if ( !arguments.length ) {//读操作
                if ( el && el.nodeType == 1 ) {
                    //处理select-multiple, select-one,option,button
                    var ret =  (adapter[ getValType( el )+":get" ] || $.propAdapter[ "@xml:get" ])( el, "value", fn );
                    return  typeof ret === "string" ? ret.replace( rreturn, "" ) : ret == null ? "" : ret;
                }
                return void 0;
            }
            //强制将null/undefined转换为"", number变为字符串
            if( Array.isArray( item ) ){
                item = item.map(function (item) {
                    return item == null ? "" : item + "";
                });
            }else if( isFinite(item) ){
                item += "";
            }else{
                item = item || "";//强制转换为数组
            }
            return this.each(function( el ) {//写操作
                if ( el.nodeType == 1 ) {
                    (adapter[ getValType( el )+":set" ] || $.propAdapter[ "@xml:set" ])( el, "value", item , fn );
                }
            });
        },
        removeAttr: function( name ) {
            name = $.attrMap[ name ] || name;
            var isBool = boolOne[ name ];
            return this.each(function() {
                if( this.nodeType === 1 ){
                    $[ "@remove_attr" ]( this, name, isBool );
                }
            });
        },
        removeProp: function( name ) {
            name = $.propMap[ name ] || name;
            return this.each(function() {
                // try/catch handles cases where IE balks (such as removing a property on window)
                try {
                    this[ name ] = void 0;
                    delete this[ name ];
                } catch( e ) {};
            });
        }
    });
        
    "attr,prop".replace($.rword, function( method ){
        $[ method ] = function( node, name, value ) {
            if(node  && ( $["@target"] in node )){
                var isElement = "setAttribute" in node,
                notxml = !isElement || !$.isXML(node),
                //对于HTML元素节点，我们需要对一些属性名进行映射
                orig = name.toLowerCase();
                if ( !isElement ) {
                    method = "prop"
                }
                var adapter = $[ method+"Adapter" ];
                name = notxml && $[ boolOne[name] ? "propMap" : method+"Map" ][ name ] || name;
                if ( value !== void 0 ){
                    if( method === "attr" && value === null ){  //为元素节点移除特性
                        return  $[ "@remove_"+method ]( node, name );
                    }else { //设置HTML元素的属性或特性
                        return (notxml && adapter[name+":set"] || adapter["@"+ ( notxml ? "html" : "xml")+":set"] )( node, name, value, orig );
                    }
                } //获取属性 
                return (adapter[name+":get"] || adapter["@"+ (notxml ? "html" : "xml")+":get"])( node, name, '', orig );
            }
        };
        $.fn[ method ] = function( name, value ) {
            return $.access( this, name, value, $[method] );
        }
    });
        
    $.extend({
        attrMap:{//特性名映射
            tabindex: "tabIndex"
        },
        propMap:{//属性名映射
            "accept-charset": "acceptCharset",
            "char": "ch",
            charoff: "chOff",
            "class": "className",
            "for": "htmlFor",
            "http-equiv": "httpEquiv"
        },
        //内部函数，原则上拒绝用户的调用
        "@remove_attr": function( node, name, isBool ) {
            var propName;
            name = $.attrMap[ name ] || name;
            //如果支持removeAttribute，则使用removeAttribute
            $.attr( node, name, "" );
            node.removeAttribute( name );
            // 确保bool属性的值为bool
            if ( isBool && (propName = $.propMap[ name ] || name) in node ) {
                node[ propName ] = false;
            }
        },
        propAdapter:{
            "@xml:get": function( node, name ){
                return node[ name ]
            },
            "@xml:set": function(node, name, value){
                node[ name ] = value;
            }
        },
            
        attrAdapter: {
            "@xml:get": function( node, name ){
                return  node.getAttribute( name ) || void 0 ;
            },
            "@xml:set": function( node, name, value ){
                node.setAttribute( name, "" + value )
            },
            "tabIndex:get": function( node ) {
                // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
                var attributeNode = node.getAttributeNode( "tabIndex" );
                return attributeNode && attributeNode.specified ?
                parseInt( attributeNode.value, 10 )  : 
                rfocusable.test(node.nodeName) || rclickable.test(node.nodeName) && node.href  ? 0 : void 0;
            },
            "value:get": function( node, name, _, orig ) {
                if(node.nodeName ==="BUTTON"){
                    return attrAdapter["@html:get"](node,name);
                }
                return name in node ? node.value: void 0;
            },
            "value:set": function( node, name, value ) {
                if(node.nodeName ==="BUTTON"){
                    return attrAdapter["@html:set"]( node, name, value);
                }
                node.value = value;
            }
        },
        valAdapter:  {
            "option:get":  function( node ) {
                var val = node.attributes.value;
                return !val || val.specified ? node.value : node.text;
            },
            "select:get": function( node ,value, valOpt) {
                var i, max, option, index = node.selectedIndex, values = [], options = node.options,
                one = node.type === "select-one";
                // 如果什么也没选中
                if ( index < 0 ) {
                    return null;
                }
                i = one ? index : 0;
                max = one ? index + 1: options.length;
                for ( ; i < max; i++ ) {
                    option = options[ i ];
                    //过滤所有disabled的option元素或其父亲是disabled的optgroup元素的孩子
                    if ( option.selected && (support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null) &&
                        (!option.parentNode.disabled || !$.type( option.parentNode, "OPTGROUP" )) ) {
                        value = valOpt( option );
                        if ( one ) {
                            return value;
                        }
                        //收集所有selected值组成数组返回
                        values.push( value );
                    }
                }
                // Fixes Bug #2551 -- select.val() broken in IE after form.reset()
                if ( one && !values.length && options.length ) {
                    return  valOpt(  options[ index ] );
                }
                return values;
            },
            "select:set": function( node, name, values, fn ) {
                $.slice(node.options).forEach(function( el ){
                    el.selected = !!~values.indexOf( fn(el) );
                });
                if ( !values.length ) {
                    node.selectedIndex = -1;
                }
            }
        }
    });
    var attrAdapter = $.attrAdapter,propAdapter = $.propAdapter, valAdapter = $.valAdapter;//attr方法只能获得两种值 string undefined
    "get,set".replace($.rword,function(method){
        attrAdapter[ "@html:"+method ] = attrAdapter[ "@xml:"+method ];
        propAdapter[ "@html:"+method ] = propAdapter[ "@xml:"+method ];
        propAdapter[ "tabIndex:"+method ] = attrAdapter[ "tabIndex:"+method ];
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
    propAdapter[ "tabIndex:get" ] = attrAdapter[ "tabIndex:get" ];
    //safari IE9 IE8 我们必须访问上一级元素时,才能获取这个值
    if ( !support.optSelected ) {
        $.propAdapter[ "selected:get" ] = function( node ) {
            var parent = node
            for( ;!parent.add; parent.selectedIndex, parent = parent.parentNode){};
            return node.selected;
        }
    }    
        
    //========================attrAdapter 的相关修正==========================
    var bools = $["@bools"];
    var boolOne = $.oneObject( support.attrProp ? bools.toLowerCase() : bools );
    bools.replace( $.rword,function( method ) {
        //bool属性在attr方法中只会返回与属性同名的值或undefined
        attrAdapter[ method+":get" ] = function( node, name ){
            var attrNode, property =  node[ name ];
            return property === true || typeof property !== "boolean" && ( attrNode = node.getAttributeNode(name) ) && attrNode.nodeValue !== false ?
            name.toLowerCase() :
            undefined;
        }
        attrAdapter[ method+":set" ] = function( node, name, value ){
            if ( value === false ) {//value只有等于false才移除此属性，其他一切值都当作赋为true
                $[ "@remove_attr" ]( node, name, true );
            } else {
                if ( name in node ) {
                    node[ name ] = true;
                }
                node.setAttribute( name, name.toLowerCase() );
            }
            return name;
        }
    });
    if ( !support.attrHref ) {
        //IE的getAttribute支持第二个参数，可以为 0,1,2,4
        //0 是默认；1 区分属性的大小写；2取出源代码中的原字符串值(注，IE67对动态创建的节点没效)。
        //IE 在取 href 的时候默认拿出来的是绝对路径，加参数2得到我们所需要的相对路径。
        "href,src,width,height,colSpan,rowSpan".replace( $.rword, function( method ) {//
            attrAdapter[ method + ":get" ] =  function( node,name ) {
                var ret = node.getAttribute( name, 2 );
                return ret === null ? undefined : ret;
            }
        });
    }
    if ( !support.attrStyle ) {
        //IE67是没有style特性（特性的值的类型为文本），只有el.style（CSSStyleDeclaration）(bug)
        attrAdapter[ "style:get" ] = function( node ) {
            return node.style.cssText.toLowerCase() || undefined ;
        }
        attrAdapter[ "style:set" ] = function( node, name, value ) {
            return (node.style.cssText = "" + value);
        }
    }
              
    if( !support.attrProp ){
        //如果我们不能通过el.getAttribute("class")取得className,必须使用el.getAttribute("className")
        //又如formElement[name] 相等于formElement.elements[name]，会返回其辖下的表单元素， 这时我们就需要用到特性节点了
        $.mix( $.attrMap , $.propMap);//使用更全面的映射包
        var fixSpecified = $.oneObject("name,id");
        valAdapter[ "button:get" ] = attrAdapter[ "@html:get" ] =  function( node, name, value, orig ) {//用于IE6/7
            if(orig in $.propMap){
                return node[name];
            }
            var ret = node.getAttributeNode( name );//id与name的特性节点没有specified描述符，只能通过nodeValue判定
            return ret && (fixSpecified[ name ] ? ret.nodeValue !== "" : ret.specified) ?  ret.nodeValue : undefined;
        }
        valAdapter[ "button:set" ] = attrAdapter[ "@html:set" ] =  function( node, name, value, orig ) {
            if(orig in $.propMap){
                return (node[name] = value);
            }
            var ret = node.getAttributeNode( name );
            if ( !ret ) {
                ret = node.ownerDocument.createAttribute( name );
                node.setAttributeNode( ret );
            }
            ret.nodeValue = value + "";
        }  
        attrAdapter[ "contentEditable:set" ] =  function( node, name, value ) {
            if ( value === "" ) {
                value = "false";
            }
            attrAdapter["@html:set"]( node, name, value );
        };
        "width,height".replace( $.rword, function( attr ){
            attrAdapter[attr+":set"] = function(node, name, value){
                node.setAttribute( attr, value === "" ? "auto" : value+"");
            }
        });
    }
        
    //=========================valAdapter 的相关修正==========================
    //checkbox的value默认为on，唯有Chrome 返回空字符串
    if ( !support.checkOn ) {
        "radio,checkbox".replace( $.rword, function( name ) {
            $.valAdapter[ name + ":get" ] = function( node ) {
                return node.getAttribute("value") === null ? "on" : node.value;
            }
        });
    }
    //处理单选框，复选框在设值后checked的值
    "radio,checkbox".replace( $.rword, function( name ) {
        $.valAdapter[ name + ":set" ] = function( node, name, value) {
            if ( Array.isArray( value ) ) {
                return node.checked = !!~value.indexOf(node.value ) ;
            }
        }
    });
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
*/
