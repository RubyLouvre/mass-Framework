function ui(width, height ,top, left, color, bgcolor,name, title, content ){
    this.width = width;
    this.height = height;
    this.top = top;
    this.left = left;
    this.color = color;
    this.bgcolor = bgcolor;
    this.name = name;
    this.title = title;
    this.content = content;
}


function ui(title, content, name,width, height ,top, left, color, bgcolor ){
    this.width = width || "400px"
    this.height = height|| "300px"
    this.top = top || "0px"
    this.left = left || "0px"
    this.color = color||"black"
    this.bgcolor = bgcolor || "white"
    this.name = name;
    this.title = title;
    this.content = content;
}

function ui( hash ){
    Object.keys( hash ).forEach(function(name){
        this[name] = hash[name]
    },this)
}

var defaults = {
    width : "400px",
    height: "300px",
    top : "0px",
    left : "0px",
    color : "black",
    bgcolor : "white"
}
function ui( hash ){
    this.setOption( hash )
}
ui.prototype = {
    setOption : function( options ){
        Object.keys( defaults ).forEach(function(name){
            this[name] = defaults[name]
        },this);
        Object.keys( options ).forEach(function(name){
            this[name] = options[name]
        },this);
    }
}

function ui( hash){
    $.extend(true, this, defaults, hash || {});//深拷贝属性
}

/*
    animate: function( prop, speed, easing, callback ) {
        var optall = jQuery.speed( speed, easing, callback );

        if ( jQuery.isEmptyObject( prop ) ) {
            return this.each( optall.complete, [ false ] );
        }
        prop = jQuery.extend( {}, prop );
         // 略
  }

after: function() {
    if ( this[0] && this[0].parentNode ) {
        return this.domManip(arguments, false, function( elem ) {
            this.parentNode.insertBefore( elem, this.nextSibling );
        });
    } else if ( arguments.length ) {
        var set = this.pushStack( this, "after", arguments );
        //看到这里的set单词没有？setter，相对应上面就是getter
        set.push.apply( set, jQuery(arguments[0]).toArray() );
        return set;
    }
},

jQuery.attrHooks.contenteditable = {
    get: nodeHook.get,
    set: function( elem, value, name ) {
        if ( value === "" ) {
            value = "false";
        }
        nodeHook.set( elem, value, name );
    }
};

var attrAdapter = {
    "@xml:get": function( node, name ){
        // 略
    },
    "@xml:set": function( node, name, value ){
        // 略
    },
    "tabIndex:get": function( node ) {
        // 略
    },
    "value:get": function( node, name, _, orig ) {
        // 略
    },
    "value:set": function( node, name, value ) {
        // 略
    }
}*/
/*
$.fn.extend( {
    get html(){
        return this.innerHTML;
    },
    set html(val){
        val  = this.parseHTML(val);
        this.empty().append(val)
    }
});

jQuery.each( "ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split( " " ),
function( i, o ){
    jQuery.fn[ o ] = function( f ){
        return this.bind( o, f );
    };
});

jQuery.each( [ "get", "post" ], function( i, method ) {
    jQuery[ method ] = function( url, data, callback, type ) {
        // shift arguments if data argument was omitted
        if ( jQuery.isFunction( data ) ) {
            type = type || callback;
            callback = data;
            data = undefined;
        }

        return jQuery.ajax({
            type: method,
            url: url,
            data: data,
            success: callback,
            dataType: type
        });
    };
});
"push,unshift,pop,shift,splice,sort,reverse".replace( $.rword, function( method ){
    $.fn[ method ] = function(){// $.rword = /[^, ]+/g
        Array.prototype[ method ].apply(this, arguments);
        return this;
    }
});
"remove,empty".replace( $.rword, function( method ){
    $.fn[ method ] = function(){
        var isRemove = method === "remove";
        // 略
        return this;
    }
});
//前导 前置 追加 后放 替换
"append,prepend,before,after,replace".replace( $.rword, function( method ){
    $.fn[ method ] = function( item ){
        return manipulate( this, method, item, this.ownerDocument );
    }
    $.fn[ method+"To" ] = function( item ){//生成appendTo, prependTo etc
        $( item, this.ownerDocument )[ method ]( this );
        return this;
    }
});

//内部使用jQuery.merge与Array.prototype.push进行合并
makeArray: function( array, results ) {
    var ret = results || [];
    if ( array != null ) {
        var type = jQuery.type( array );
        if ( array.length == null || type === "string" || type === "function"
            || type === "regexp" || jQuery.isWindow( array ) ) {
            push.call( ret, array );
        } else {
            //确保有length属性，但又不能是字符串，函数，正则与window对象
            jQuery.merge( ret, array );
        }
    }
    return ret;
},
merge: function( first, second ) {
    var i = first.length,
    j = 0;//可以对类数组对象进行元素合并
    if ( typeof second.length === "number" ) {
        for ( var l = second.length; j < l; j++ ) {
            first[ i++ ] = second[ j ];
        }
    } else {//也可以对普通对象进行成员合并
        while ( second[j] !== undefined ) {
            first[ i++ ] = second[ j++ ];
        }
    }
    first.length = i;
    return first;
},
 */
var a = {};
[].push.call(a, window);
console.log(a)//Object { 0=window, length=1}

var b = {
    length:2
};
[].push.call(b, window);
console.log(b)//Object { length=3, 2=window}

function $A(iterable) {
    if (!iterable) return [];
    if (iterable.toArray) return iterable.toArray();
    var length = iterable.length || 0, results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
}
function $A(iterable){
    if (iterable.item){//NodeList HTMLCollection等都有item属性
        var l = iterable.length, array = new Array(l);
        while (l--) array[l] = iterable[l];
        return array;
    }
    return Array.prototype.slice.call(iterable);
};
var toArray = function(){
    return isIE ?
    function(a, i, j, res){
        res = [];
        Ext.each(a, function(v) {
            res.push(v);
        });
        return res.slice(i || 0, j || res.length);
    } :
    function(a, i, j){
        return Array.prototype.slice.call(a, i || 0, j || a.length);
    }
}()

(function(){
    //高效的方案
    var efficient = function(obj, offset, startWith){
        return (startWith||[]).concat(Array.prototype.slice.call(obj, offset||0));
    };
    //低效的方案
    var slow = function(obj, offset, startWith){
        var arr = startWith||[];
        for(var x = offset || 0; x >obj.length; x++){
            arr.push(obj[x]);
        }
        return arr;
    };
    //IE要视情况选择方案，因为Arguments对象可以高效转换
    dojo._toArray = dojo.isIE ?  function(obj){
        return ((obj.item) ? slow : efficient).apply(this, arguments);
    } :   efficient;
})();

jQuery.event = {

	add: function( elem, types, handler, data, selector ) {
//不能是文本节点与注释节点，即使是元素节点，也必须要验证它是否允许添加自定义属性
//因为IE678中embed，applet以及clsid属性不等于
		if ( elem.nodeType === 3 || elem.nodeType === 8 || !types || !handler || !(elemData = jQuery._data( elem )) ) {
			return;
		}
        }
}