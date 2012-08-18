//=========================================
//  数据交互模块
//==========================================
$.define("ajax","event", function(){
    //$.log("已加载ajax模块");
    var global = this, DOC = global.document, r20 = /%20/g,
    rCRLF = /\r?\n/g,
    encode = global.encodeURIComponent,
    rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL

    rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,
    rnoContent = /^(?:GET|HEAD)$/,
    rquery = /\?/,
    rurl =  /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,
    // Document location
    ajaxLocation;
    // #8138, IE may throw an exception when accessing
    // a field from window.location if document.domain has been set
    try {
        ajaxLocation = global.location.href;
    } catch( e ) {
        // Use the href attribute of an A element
        // since IE will modify it given document.location
        ajaxLocation = DOC.createElement( "a" );
        ajaxLocation.href = "";
        ajaxLocation = ajaxLocation.href;
    }
 
    // Segment location into parts
    var ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [],
    transports = { },//传送器
    converters ={//转换器
        text: function(dummyXHR,text,xml){
            return text != undefined ? text : ("xml" in xml ?  xml.xml: new XMLSerializer().serializeToString(xml));
        },
        xml : function(dummyXHR,text,xml){
            return xml != undefined ? xml : $.parseXML(text);
        },
        html : function(dummyXHR,text,xml){
            return  $.parseHTML(text);
        },
        json : function(dummyXHR,text,xml){
            return  $.parseJSON(text);
        },
        script: function(dummyXHR,text,xml){
            $.parseJS(text);
        }
    },
    accepts  = {
        xml: "application/xml, text/xml",
        html: "text/html",
        text: "text/plain",
        json: "application/json, text/javascript",
        script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript",
        "*": "*/*"
    },
    defaults  = {
        type:"GET",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        async:true,
        jsonp: "callback"
    };
    //将data转换为字符串，type转换为大写，添加hasContent，crossDomain属性，如果是GET，将参数绑在URL后面
    function setOptions( opts ) {
        opts = $.Object.merge( {}, defaults, opts );
        if (opts.crossDomain == null) { //判定是否跨域
            var parts = rurl.exec(opts.url.toLowerCase());
            opts.crossDomain = !!( parts &&
                ( parts[ 1 ] != ajaxLocParts[ 1 ] || parts[ 2 ] != ajaxLocParts[ 2 ] ||
                    ( parts[ 3 ] || ( parts[ 1 ] === "http:" ?  80 : 443 ) )
                    !=
                    ( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ?  80 : 443 ) ) )
                );
        }
        if ( opts.data && opts.data !== "string") {
            opts.data = $.param( opts.data );
        }
        // fix #90 ie7 about "//x.htm"
        opts.url = opts.url.replace(/^\/\//, ajaxLocParts[1] + "//");
        opts.type = opts.type.toUpperCase();
        opts.hasContent = !rnoContent.test(opts.type);//是否为post请求
        if (!opts.hasContent) {
            if (opts.data) {//如果为GET请求,则参数依附于url上
                opts.url += (rquery.test(opts.url) ? "&" : "?" ) + opts.data;
            }
            if ( opts.cache === false ) {//添加时间截
                opts.url += (rquery.test(opts.url) ? "&" : "?" ) + "_time=" + Date.now();
            }
        }
        return opts;
    }
 
    "get,post".replace( $.rword, function( method ){
        $[ method ] = function( url, data, callback, type ) {
            if ( $.isFunction( data ) ) {
                type = type || callback;
                callback = data;
                data = undefined;
            }
            console.log("xxxxxxxxxxxxxx")
            return $.ajax({
                type: method,
                url: url,
                data: data,
                success: callback,
                dataType: type
            });
        };
 
    });
    function isValidParamValue(val) {
        var t = typeof val;  // If the type of val is null, undefined, number, string, boolean, return true.
        return val == null || (t !== 'object' && t !== 'function');
    }
    $.mix($,{
        getScript: function( url, callback ) {
            return $.get( url, null, callback, "script" );
        },
 
        getJSON: function( url, data, callback ) {
            return $.get( url, data, callback, "json" );
        },

        /**无刷新上传
         * @param {String} url 提交地址
         * @param {HTMLElement} 元素
         * @param {Object} data 普通对象（用于添加额外参数）
         * @param {Function} 正向回调
         * with parameter<br/>
         * 1. data returned from this request with type specified by dataType<br/>
         * 2. status of this request with type String<br/>
         * 3. XhrObject of this request , for details {@link IO.XhrObject}
         * @param {String} [dataType] 注明要返回何种数据类型("xml" or "json" or "text")
         * @returns {IO.XhrObject}
         */
        upload: function( url, form, data, callback, dataType ) {
            if ($.isFunction(data)) {
                dataType = callback;
                callback = data;
                data = undefined;
            }
            return $.ajax({
                url: url,
                type: 'post',
                dataType: dataType,
                form: form,
                data: data,
                success: callback
            });
        },
        param: function (json, serializeArray) {//对象变字符串
            if (!$.isPlainObject(json)) {
                return "";
            }
            serializeArray = typeof serializeArray == "boolean" ? serializeArray : !0 ;
            var buf = [], key, val;
            for (key in json) {
                if ( json.hasOwnProperty( key )) {
                    val = json[key];
                    key = encode(key);
                    // val is valid non-array value
                    if (isValidParamValue(val)) {
                        buf.push(key, "=", encode(val + ""), "&");
                    } 
                    else if (Array.isArray(val) && val.length) {//不能为空数组
                        for (var i = 0, len = val.length; i < len; ++i) {
                            if (isValidParamValue(val[i])) {
                                buf.push(key, (serializeArray ? encode("[]") : ""), "=", encode(val[i] + ""), "&");
                            }
                        }
                    }//忽略其他值,如空数组,函数,正则,日期,节点等
                }
            }
            buf.pop();
            return buf.join("").replace(r20, "+");
        },
        unparam: function ( url, query ) {//字符串变对象
            var json = {};
            if (!url || !$.type(url, "String")) {
                return json
            }
            url = url.replace(/^[^?=]*\?/ig, '').split('#')[0];	//去除网址与hash信息
            //考虑到key中可能有特殊符号如“[].”等，而[]却有是否被编码的可能，所以，牺牲效率以求严谨，就算传了key参数，也是全部解析url。
            var  pairs = url.split("&"),  pair, key, val,  i = 0, len = pairs.length;
            for (; i < len; ++i) {
                pair = pairs[i].split("=");
                key = decodeURIComponent(pair[0]);
                try {
                    val = decodeURIComponent(pair[1] || "");
                } catch (e) {
                    $.log(e + "decodeURIComponent error : " + pair[1], "error");
                    val = pair[1] || "";
                }
                key = key.replace(/\[\]$/,"")//如果参数名以[]结尾，则当作数组
                var item = json[key];
                if ('undefined' == typeof item) {
                    json[key] = val;//第一次
                } else if (Array.isArray(item)) {
                    item.push(val);//第三次或三次以上
                } else {
                    json[key] = [item, val];//第二次,将它转换为数组
                }
            }
            return query ? json[query] : json;
        },
        serialize: function( form ){//表单元素变字符串
            var json = []
            // 不直接转换form.elements，防止以下情况：   <form > <input name="elements"/><input name="test"/></form>
            $.slice( form || [] ).filter(function( elem ){
                return  elem.name && !elem.disabled && ( elem.checked === true || /radio|checkbox/.test(elem.type) )
            }).forEach( function( elem ) {
                var val = $( elem ).val(), vs;
                val = $.makeArray[val];
                // 字符串换行平台归一化
                val = val.map( function(v) {
                    return v.replace(rCRLF, "\r\n");
                });
                // 全部搞成数组，防止同名
                vs = json[ elem.name] = json[ elem.name ] || [];
                vs.push.apply(vs, val);
            });
            return $.param(json, false);// 名值键值对序列化,数组元素名字前不加 []
        }
    });
//http://sofish.de/file/demo/github/
    //如果没有指定dataType,服务器返回什么就是什么，不做转换
    var ajax = $.ajax = function( opts ) {
        if (!opts || !opts.url) {
            throw "参数必须为Object并且拥有url属性";
        }
        opts = setOptions(opts);//规整化参数对象
        //创建一个伪XMLHttpRequest,能处理complete,success,error等多投事件
        var dummyXHR = new $.XHR(opts), dataType = opts.dataType;

        if( opts.form && opts.form.nodeType === 1 ){
            dataType = "iframe";
        }else if( dataType == "jsonp" ){
            if( opts.crossDomain ){
                ajax.fire("start", dummyXHR, opts.url,opts.jsonp);//用于jsonp请求
                dataType = "script"
            }else{
                dataType = dummyXHR.options.dataType = "json";
            }
        }
        var transportContructor = transports[ dataType ] || transports._default,
        transport = new transportContructor();
        transport.dummyXHR = dummyXHR;
        dummyXHR.transport = transport;
        if (opts.contentType) {
            dummyXHR.setRequestHeader("Content-Type", opts.contentType);
        }
        //添加dataType所需要的Accept首部
        dummyXHR.setRequestHeader( "Accept", accepts[ dataType ] ? accepts[ dataType ] +  ", */*; q=0.01"  : accepts[ "*" ] );
        for (var i in opts.headers) {
            dummyXHR.setRequestHeader( i, opts.headers[ i ] );
        }
 
        "Complete Success Error".replace( $.rword, function(name){
            var method = name.toLowerCase();
            dummyXHR[ method ] = dummyXHR[ "on"+name ];
            if(typeof opts[ method ] === "function"){
                dummyXHR[ method ](opts[ method ]);//添加用户事件
                delete dummyXHR.options[ method ];
                delete opts[ method ];
            }
        });
        dummyXHR.readyState = 1;
        // Timeout
        if (opts.async && opts.timeout > 0) {
            dummyXHR.timeoutID = setTimeout(function() {
                dummyXHR.abort("timeout");
            }, opts.timeout);
        }
        try {
            dummyXHR.state = 1;//已发送
            transport.request();
        } catch (e) {
            if (dummyXHR.status < 2) {
                dummyXHR.dispatch( -1, e );
            } else {
                $.log(e);
            }
        }
        return dummyXHR;
    }
    //new(self.XMLHttpRequest||ActiveXObject)("Microsoft.XMLHTTP")
    $.mix(ajax, $.EventTarget);

    ajax.isLocal = rlocalProtocol.test(ajaxLocParts[1]);
    /**
         * XHR类,用于模拟原生XMLHttpRequest的所有行为
         */
    $.XHR = $.factory({
        implement:$.EventTarget,
        init:function(option){
            $.mix(this, {
                responseData:null,
                timeoutID:null,
                responseText:null,
                responseXML:null,
                responseHeadersString: "",
                responseHeaders:{},
                requestHeaders: {},
                readyState: 0,
                //internal state
                state:0,
                statusText: null,
                status:0,
                transport: null
            });
            this.defineEvents("complete success error");
            this.setOptions("options",option);//创建一个options保存原始参数
        },

        setRequestHeader: function(name, value) {
            this.requestHeaders[ name ] = value;
            return this;
        },
        getAllResponseHeaders: function() {
            return this.state === 2 ? this.responseHeadersString : null;
        },
        getResponseHeader:function (name, match) {
            if (this.state === 2) {
                while (( match = rheaders.exec(this.responseHeadersString) )) {
                    this.responseHeaders[ match[1] ] = match[ 2 ];
                }
                match = this.responseHeaders[ name ];
            }
            return match === undefined ? null : match;
        },
        // 重写 content-type 首部
        overrideMimeType: function(type) {
            if ( !this.state ) {
                this.mimeType = type;
            }
            return this;
        },
        toString: function(){
            return "[object Lions]"
        },
        // 中止请求
        abort: function(statusText) {
            statusText = statusText || "abort";
            if (this.transport) {
                this.transport.respond(0, 1);
            }
            this.dispatch( 0, statusText );
            return this;
        },
        /**
             * 用于派发success,error,complete等回调
             * http://www.cnblogs.com/rubylouvre/archive/2011/05/18/2049989.html
             * @param {Number} status 状态码
             * @param {String} statusText 对应的扼要描述
             */
        dispatch: function(status, statusText) {
            // 只能执行一次，防止重复执行
            if (this.state == 2) {//2:已执行回调
                return;
            }
            this.state = 2;
            this.readyState = 4;
            var eventType = "error";
            if ( status >= 200 && status < 300 || status == 304 ) {
                if (status == 304) {
                    statusText = "notmodified";
                    eventType = "success";
                } else {
                    try{
                        var dataType = this.options.dataType || this.options.mimeType || this.nativeXHR && this.nativeXHR.responseType;
                        if(!dataType){//如果没有指定dataType，则根据mimeType或Content-Type进行揣测
                            dataType = this.getResponseHeader("Content-Type") || "";
                            dataType = dataType.match(/json|xml|script|html/) || ["text"];
                            dataType = dataType[ 0 ]
                        }
                        this.responseData = converters[ dataType ](this, this.responseText, this.responseXML);
                        eventType = statusText = "success";
                        $.log("dummyXHR.dispatch success");
                    } catch(e) {
                        $.log("dummyXHR.dispatch parsererror")
                        statusText = "parsererror : " + e;
                    }
                }
 
            }else  if (status < 0) {
                status = 0;
            }
            this.status = status;
            this.statusText = statusText;
            if ( this.timeoutID ) {
                clearTimeout(this.timeoutID);
                delete this.timeoutID;
            }
            // 到这要么成功，调用success, 要么失败，调用 error, 最终都会调用 complete
           
            this.fire( eventType, this.responseData, statusText);
            //$.log("xxxxxxxxxxxxxxxxxxxxxxxxx")
            //$.log(this == ajax)
            ajax.fire( eventType );
            this.fire("complete", this.responseData, statusText);
            ajax.fire("complete");
            this.transport = undefined;
        }
    });
    $.XHR.prototype.fire = function( type ){//覆盖$.EventTarget的fire方法，去掉事件对象
        var events = $._data( this,"events") ,args = $.slice(arguments,1);
        if(!events || !events.length) return;
        for ( var i = 0, item; item = events[i++]; ) {
            if(item.type === type)
                item.fn.apply( this, args );
        }
    }
    //http://www.cnblogs.com/rubylouvre/archive/2010/04/20/1716486.html
    var s = ["XMLHttpRequest",
    "ActiveXObject('Msxml2.XMLHTTP.6.0')",
    "ActiveXObject('Msxml2.XMLHTTP.3.0')",
    "ActiveXObject('Msxml2.XMLHTTP')",
    "ActiveXObject('Microsoft.XMLHTTP')"];
    if(!+"\v1"){
        var v = DOC.documentMode;
        s[0] =  v == 8 ? "XDomainRequest" : location.protocol === "file:" ? "!" : s[0]
    }
    for(var i = 0 ,axo;axo = s[i++];){
        try{
            if(eval("new "+ axo)){
                $.xhr = new Function( "return new "+axo);
                break;
            }
        }catch(e){}
    }
    if ( $.xhr ) {
        var nativeXHR = new $.xhr, allowCrossDomain = false;
        if ("withCredentials" in nativeXHR) {
            allowCrossDomain = true;
        }
        //【XMLHttpRequest】传送器
        transports._default =  $.factory({
            //发送请求
            request: function() {
                var dummyXHR = this.dummyXHR,
                options = dummyXHR.options, i;
                $.log("XhrTransport.sending.....");
                if (options.crossDomain && !allowCrossDomain) {
                    throw "do not allow crossdomain xhr !"
                }
                var nativeXHR = this.nativeXHR = new $.xhr, self = this;
                if ( options.username ) {
                    nativeXHR.open( options.type, options.url, options.async, options.username, options.password );
                } else {
                    nativeXHR.open( options.type, options.url, options.async );
                }
                // 如果支持overrideMimeTypeAPI
                if (dummyXHR.mimeType && nativeXHR.overrideMimeType) {
                    nativeXHR.overrideMimeType(dummyXHR.mimeType);
                }
                if (!options.crossDomain && !dummyXHR.requestHeaders["X-Requested-With"]) {
                    dummyXHR.requestHeaders[ "X-Requested-With" ] = "XMLHttpRequest";
                }
                try {
                    for ( i in dummyXHR.requestHeaders) {
                        nativeXHR.setRequestHeader( i, dummyXHR.requestHeaders[ i ]);
                    }
                } catch(e) {
                    $.log(" nativeXHR setRequestHeader occur error ");
                }
 
                nativeXHR.send(options.hasContent && options.data || null);
                //在同步模式中,IE6,7可能会直接从缓存中读取数据而不会发出请求,因此我们需要手动发出请求
                if (!options.async || nativeXHR.readyState == 4) {
                    this.respond();
                } else {
                    if (nativeXHR.onerror === null) { //如果支持onerror, onload新API
                        nativeXHR.onload =  nativeXHR.onerror = function (e) {
                            this.readyState = 4;//IE9
                            this.status = e.type === "load" ? 200 : 500;
                            self.respond();
                        };
                    } else {
                        nativeXHR.onreadystatechange = function() {
                            self.respond();
                        }
                    }
                }
            },
            //用于获取原始的responseXMLresponseText 修正status statusText
            //第二个参数为1时中止清求
            respond: function(event, abort) {
                // 如果网络问题时访问XHR的属性，在FF会抛异常
                // http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
                var nativeXHR = this.nativeXHR , dummyXHR = this.dummyXHR, detachEvent = false;
                try {
                    if (abort || nativeXHR.readyState == 4) {
                        detachEvent = true;
                        if ( abort ) {
                            if (nativeXHR.readyState !== 4) {  // 完成以后 abort 不要调用
                                //IE的XMLHttpRequest.abort实现于 MSXML 3.0+
                                //http://blogs.msdn.com/b/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx
                                nativeXHR.abort();
                            }
                        } else {
                            var status = nativeXHR.status,
                            xml = nativeXHR.responseXML;
                            dummyXHR.responseHeadersString = nativeXHR.getAllResponseHeaders();
                            // Construct response list
                            if (xml && xml.documentElement /* #4958 */) {
                                dummyXHR.responseXML = xml;
                            }
                            dummyXHR.responseText = nativeXHR.responseText;
                            //火狐在跨城请求时访问statusText值会抛出异常
                            try {
                                var statusText = nativeXHR.statusText;
                            } catch(e) {
                                $.log("xhr statustext error : " + e);
                                statusText = "";
                            }
                            //用于处理特殊情况,如果是一个本地请求,只要我们能获取数据就假当它是成功的
                            if (!status && ajax.isLocal && !dummyXHR.options.crossDomain) {
                                status = dummyXHR.responseText ? 200 : 404;
                            //IE有时会把204当作为1223
                            //returning a 204 from a PUT request - IE seems to be handling the 204 from a DELETE request okay.
                            } else if (status === 1223) {
                                status = 204;
                            }
                            dummyXHR.dispatch(status, statusText);
                        }
                    }
                } catch (firefoxAccessException) {
                    detachEvent = true;
                    $.log(firefoxAccessException);
                    if (!abort) {
                        dummyXHR.dispatch(-1, firefoxAccessException+"");
                    }
                }finally{
                    if( detachEvent ){
                        nativeXHR.onerror = nativeXHR.onload = nativeXHR.onreadystatechange = $.noop;
                    }
                }
            }
        });
    }
    //【script节点】传送器，只用于跨域的情况
    transports.script = $.factory({
        request: function() {
            var self = this, dummyXHR = self.dummyXHR, options = dummyXHR.options,
            head = $.head,
            script = self.script = DOC.createElement("script");
            script.async = "async";
            $.log("ScriptTransport.sending.....");
            if (options.charset) {
                script.charset = options.charset;
            }
            //当script的资源非JS文件时,发生的错误不可捕获
            script.onerror = script.onload = script.onreadystatechange = function(e) {
                e = e || event;
                self.respond((e.type || "error").toLowerCase()); // firefox onerror 没有 type ?!
            };
            script.src = options.url
            head.insertBefore(script, head.firstChild);
        },
 
        respond: function(event, isAbort) {
            var node = this.script, dummyXHR = this.dummyXHR;
            // 防止重复调用,成功后 abort
            if (!node) {
                return;
            }
            if (isAbort || /loaded|complete|undefined/i.test(node.readyState)  || event == "error"  ) {
                node.onerror = node.onload = node.onreadystatechange = null;
                var parent = node.parentNode;
                if(parent && parent.nodeType === 1){
                    parent.removeChild(node);
                    this.script = undefined;
                }
                //如果没有中止请求并没有报错
                if (!isAbort && event != "error") {
                    dummyXHR.dispatch(200, "success");
                }
                // 非 ie<9 可以判断出来
                else if (event == "error") {
                    dummyXHR.dispatch(500, "scripterror");
                }
            }
        }
    });
 
    //http://www.decimage.com/web/javascript-cross-domain-solution-with-jsonp.html
    //JSONP请求，借用【script节点】传送器
    converters["script json"] = function(dummyXHR){
        return $["jsonp"+ dummyXHR.uniqueID ]();
    }
    ajax.bind("start", function(e, dummyXHR, url, jsonp) {
        $.log("jsonp start...");
        var jsonpCallback = "jsonp"+dummyXHR.uniqueID;
        dummyXHR.options.url = url  + (rquery.test(url) ? "&" : "?" ) + jsonp + "=" + DOC.URL.replace(/(#.+|\W)/g,'')+"."+jsonpCallback;
        dummyXHR.options.dataType = "json";
        //将后台返回的json保存在惰性函数中
        global.$[jsonpCallback]= function(json) {
            global.$[jsonpCallback] = function(){
                return json;
            };
        };
    });
 
    function createIframe(dummyXHR, transport) {
        var id = "iframe-upload-"+dummyXHR.uniqueID;
        var iframe = $.parseHTML("<iframe " +
            " id='" + id + "'" +
            " name='" + id + "'" +
            "  style='position:absolute;left:-9999px;top:-9999px;/>").firstChild;
        iframe.transport = transport;
        return  (DOC.body || DOC.documentElement).insertBefore(iframe,null);
    }
 
    function addDataToForm(data, form, serializeArray) {
        data = $.unparam(data);
        var ret = [], d, isArray, vs, i, e;
        for (d in data) {
            isArray = $.isArray(data[d]);
            vs = $.makeArray( data[d])
            // 数组和原生一样对待，创建多个同名输入域
            for (i = 0; i < vs.length; i++) {
                e = DOC.createElement("input");
                e.type = 'hidden';
                e.name = d + (isArray && serializeArray ? "[]" : "");
                e.value = vs[i];
                form.appendChild(e)
                ret.push(e);
            }
        }
        return ret;
    }
    //【iframe】传送器，专门用于上传
    //http://www.profilepicture.co.uk/tutorials/ajax-file-upload-xmlhttprequest-level-2/ 上传
    transports.iframe = $.factory({
        request: function() {
            var dummyXHR = this.dummyXHR,
            options = dummyXHR.options,
            form = options.form
            //form.enctype的值
            //1:application/x-www-form-urlencoded   在发送前编码所有字符（默认）
            //2:multipart/form-data 不对字符编码。在使用包含文件上传控件的表单时，必须使用该值。
            //3:text/plain  空格转换为 "+" 加号，但不对特殊字符编码。
            this.backups = {
                target:form.target || "",
                action:form.action || "",
                enctype:form.enctype,
                method:form.method
            };
            var iframe = createIframe(dummyXHR, this);
            //必须指定method与enctype，要不在FF报错
            //“表单包含了一个文件输入元素，但是其中缺少 method=POST 以及 enctype=multipart/form-data，所以文件将不会被发送。”
            // 设置target到隐藏iframe，避免整页刷新
            form.target =  "iframe-upload-"+dummyXHR.uniqueID;
            form.action =  options.url;
            form.method =  "POST";
            form.enctype = "multipart/form-data";
            this.fields = options.data ? addDataToForm(options.data, form) : [];
            this.form = form;//一个表单元素
            $.log("iframe transport...");
            setTimeout(function () {
                $(iframe).bind("load error",this.respond);
                form.submit();
            }, 16);
        },
 
        respond: function( event  ) {
            var iframe = this,
            transport = iframe.transport;
            // 防止重复调用 , 成功后 abort
            if (!transport) {
                return;
            }
            $.log("transports.iframe respond")
            var form = transport.form,
            eventType = event.type,
            dummyXHR = transport.dummyXHR;
            iframe.transport = undefined;
            if (eventType == "load") {
                var doc = iframe.contentDocument ? iframe.contentDocument : window.frames[iframe.id].document;
                var iframeDoc = iframe.contentWindow.document;
                if (doc.XMLDocument) {
                    dummyXHR.responseXML = doc.XMLDocument;
                } else if (doc.body){
                    // response is html document or plain text
                    dummyXHR.responseText = doc.body.innerHTML;
                    dummyXHR.responseXML = iframeDoc;
                    //当，MIME为"text/plain",浏览器会把文本放到一个PRE标签中
                    if (doc.body.firstChild && doc.body.firstChild.nodeName.toUpperCase() == 'PRE') {
                        dummyXHR.responseText  = doc.body.firstChild.firstChild.nodeValue;
                    }
                }else {
                    // response is a xml document
                    dummyXHR.responseXML = doc;
                }
                dummyXHR.dispatch(200, "success");
            } else if (eventType == 'error') {
                dummyXHR.dispatch(500, "error");
            }
            for(var i in transport.backups){
                form[i] = transport.backups[i];
            }
            //还原form的属性
            transport.fields.forEach(function(elem){
                elem.parentNode.removeChild(elem);
            });
            $(iframe).unbind("load",transport.respond).unbind("error",transport.respond);
            iframe.clearAttributes &&  iframe.clearAttributes();
            setTimeout(function() {
                // Fix busy state in FF3
                iframe.parentNode.removeChild(iframe);
                $.log("iframe.parentNode.removeChild(iframe)")
            }, 16);
        }
    });
 
});
    /**
2011.8.31
将会传送器的abort方法上传到$.XHR.abort去处理
修复serializeArray的bug
对XMLHttpRequest.abort进行try...catch
2012.3.31 v2 大重构,支持XMLHttpRequest Level2
     */
