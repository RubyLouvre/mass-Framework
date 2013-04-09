//=========================================
//  数据交互模块
//==========================================
//var reg = /^[^\u4E00-\u9FA5]*$/;
define("ajax", this.FormData ? ["flow"] : ["ajax_fix"], function($) {
    var global = this,
            DOC = global.document,
            r20 = /%20/g,
            rCRLF = /\r?\n/g,
            encode = encodeURIComponent,
            decode = decodeURIComponent,
            rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg,
            // IE的换行符不包含 \r
            rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
            rnoContent = /^(?:GET|HEAD)$/,
            rquery = /\?/,
            rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,
            //在IE下如果重置了document.domain，直接访问window.location会抛错，但用document.URL就ok了
            //http://www.cnblogs.com/WuQiang/archive/2012/09/21/2697474.html
            curl = DOC.URL,
            segments = rurl.exec(curl.toLowerCase()) || [],
            isLocal = rlocalProtocol.test(segments[1]),
            //http://www.cnblogs.com/rubylouvre/archive/2010/04/20/1716486.html
            s = ["XMLHttpRequest", "ActiveXObject('Msxml2.XMLHTTP.6.0')",
        "ActiveXObject('Msxml2.XMLHTTP.3.0')", "ActiveXObject('Msxml2.XMLHTTP')"];
    if (!"1" [0]) { //判定IE67
        s[0] = location.protocol === "file:" ? "!" : s[0];
    }
    for (var i = 0, axo; axo = s[i++]; ) {
        try {
            if (eval("new " + axo)) {
                $.xhr = new Function("return new " + axo);
                break;
            }
        } catch (e) {
        }
    }

    var accepts = {
        xml: "application/xml, text/xml",
        html: "text/html",
        text: "text/plain",
        json: "application/json, text/javascript",
        script: "text/javascript, application/javascript",
        "*": ["*/"] + ["*"] //避免被压缩掉
    },
    defaults = {
        type: "GET",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        async: true,
        jsonp: "callback"
    };
    //将data转换为字符串，type转换为大写，添加hasContent，crossDomain属性，如果是GET，将参数绑在URL后面

    function setOptions(opts) {
        opts = $.Object.merge({}, defaults, opts);
        if (typeof opts.crossDomain !== "boolean") { //判定是否跨域
            var parts = rurl.exec(opts.url.toLowerCase());
            opts.crossDomain = !!(parts && (parts[1] !== segments[1] || parts[2] !== segments[2] || (parts[3] || (parts[1] === "http:" ? 80 : 443)) !== (segments[3] || (segments[1] === "http:" ? 80 : 443))));
        }
        if (opts.data && typeof opts.data !== "object") {
            $.error("data必须为对象");
        }
        var querystring = $.param(opts.data);
        opts.querystring = querystring || "";
        opts.url = opts.url.replace(/#.*$/, "").replace(/^\/\//, segments[1] + "//");
        opts.type = opts.type.toUpperCase();
        opts.hasContent = !rnoContent.test(opts.type); //是否为post请求
        if (!opts.hasContent) {
            if (querystring) { //如果为GET请求,则参数依附于url上
                opts.url += (rquery.test(opts.url) ? "&" : "?") + querystring;
            }
            if (opts.cache === false) { //添加时间截
                opts.url += (rquery.test(opts.url) ? "&" : "?") + "_time=" + Date.now();
            }
        }
        return opts;
    }
    //ajax主函数
    $.ajax = function(opts) {
        if (!opts || !opts.url) {
            $.error("参数必须为Object并且拥有url属性");
        }
        opts = setOptions(opts); //处理用户参数，比如生成querystring, type大写化
        //创建一个伪XMLHttpRequest,能处理complete,success,error等多投事件
        var dummyXHR = new $.XMLHttpRequest(opts);
        "complete success error".replace($.rword, function(name) { //绑定回调
            if (typeof opts[name] === "function") {
                dummyXHR.bind(name, opts[name]);
                delete opts[name];
            }
        });
        var dataType = opts.dataType; //目标返回数据类型
        var transports = $.ajaxTransports;
        var name = opts.form ? "upload" : dataType;
        var transport = transports[name] || transports.xhr;
        $.mix(dummyXHR, transport );//取得传送器的request, respond, preproccess
        if (dummyXHR.preproccess) { //这用于jsonp upload传送器
            dataType = dummyXHR.preproccess() || dataType;
        }
        //设置首部 1、Content-Type首部
        if (opts.contentType) {
            dummyXHR.setRequestHeader("Content-Type", opts.contentType);
        }
        //2、Accept首部
        dummyXHR.setRequestHeader("Accept", accepts[dataType] ? accepts[dataType] + ", */*; q=0.01" : accepts["*"]);
        for (var i in opts.headers) { //3 haders里面的首部
            dummyXHR.setRequestHeader(i, opts.headers[i]);
        }
        // 处理超时
        if (opts.async && opts.timeout > 0) {
            dummyXHR.timeoutID = setTimeout(function() {
                dummyXHR.abort("timeout");
            }, opts.timeout);
        }
        dummyXHR.request();
        return dummyXHR;
    };
    "get,post".replace($.rword, function(method) {
        $[method] = function(url, data, callback, type) {
            if ($.isFunction(data)) {
                type = type || callback;
                callback = data;
                data = undefined;
            }
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
        var t = typeof val; // If the type of val is null, undefined, number, string, boolean, return true.
        return val == null || (t !== 'object' && t !== 'function');
    }

    $.mix({
        ajaxTransports: {
            xhr: {
                //发送请求
                request: function() {
                    var self = this;
                    var opts = this.options;
                    $.log("XhrTransport.request.....");
                    var transport = this.transport = new $.xhr;
                    if (opts.crossDomain && !("withCredentials" in transport)) {
                        $.error("本浏览器不支持crossdomain xhr");
                    }
                    if (opts.username) {
                        transport.open(opts.type, opts.url, opts.async, opts.username, opts.password);
                    } else {
                        transport.open(opts.type, opts.url, opts.async);
                    }
                    if (this.mimeType && transport.overrideMimeType) {
                        transport.overrideMimeType(this.mimeType);
                    }
                    this.requestHeaders["X-Requested-With"] = "XMLHTTPRequest";
                    for (var i in this.requestHeaders) {
                        transport.setRequestHeader(i, this.requestHeaders[i]);
                    }
                    var dataType = this.options.dataType;
                    if ("responseType" in transport && /^(blob|arraybuffer|text)$/.test(dataType)) {
                        transport.responseType = dataType;
                        this.useResponseType = true;
                    }
                    transport.send(opts.hasContent && (this.formdata || this.querystring) || null);
                    //在同步模式中,IE6,7可能会直接从缓存中读取数据而不会发出请求,因此我们需要手动发出请求
                    if (!opts.async || transport.readyState === 4) {
                        this.respond();
                    } else {
                        if (transport.onerror === null) { //如果支持onerror, onload新API
                            transport.onload = transport.onerror = function(e) {
                                this.readyState = 4; //IE9+ 
                                this.status = e.type === "load" ? 200 : 500;
                                self.respond();
                            };
                        } else {
                            transport.onreadystatechange = function() {
                                self.respond();
                            };
                        }
                    }
                },
                //用于获取原始的responseXMLresponseText 修正status statusText
                //第二个参数为1时中止清求
                respond: function(event, forceAbort) {
                    var transport = this.transport;
                    if (!transport) {
                        return;
                    }
                    try {
                        var completed = transport.readyState === 4;
                        if (forceAbort || completed) {
                            transport.onerror = transport.onload = transport.onreadystatechange = $.noop;
                            if (forceAbort) {
                                if (!completed && typeof transport.abort === "function") { // 完成以后 abort 不要调用
                                    transport.abort();
                                }
                            } else {
                                var status = transport.status;
                                this.responseText = transport.responseText;
                                try {
                                    //当responseXML为[Exception: DOMException]时，
                                    //访问它会抛“An attempt was made to use an object that is not, or is no longer, usable”异常
                                    var xml = transport.responseXML
                                } catch (e) {
                                }
                                if (this.useResponseType) {
                                    this.response = transport.response;
                                }
                                if (xml && xml.documentElement) {
                                    this.responseXML = xml;
                                }
                                this.responseHeadersString = transport.getAllResponseHeaders();
                                //火狐在跨城请求时访问statusText值会抛出异常
                                try {
                                    var statusText = transport.statusText;
                                } catch (e) {
                                    statusText = "firefoxAccessError";
                                }
                                //用于处理特殊情况,如果是一个本地请求,只要我们能获取数据就假当它是成功的
                                if (!status && isLocal && !this.options.crossDomain) {
                                    status = this.responseText ? 200 : 404;
                                    //IE有时会把204当作为1223
                                    //returning a 204 from a PUT request - IE seems to be handling the 204 from a DELETE request okay.
                                } else if (status === 1223) {
                                    status = 204;
                                }
                                this.dispatch(status, statusText);
                            }
                        }
                    } catch (e) {
                        // 如果网络问题时访问XHR的属性，在FF会抛异常
                        // http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
                        if (!forceAbort) {
                            this.dispatch(500, e + "");
                        }
                    }
                }
            },
            jsonp: {
                preproccess: function() {
                    var namespace = DOC.URL.replace(/(#.+|\W)/g, ''); //得到框架的命名空间
                    var opts = this.options;
                    var name = this.jsonpCallback = opts.jsonpCallback || "jsonp" + setTimeout("1");
                    opts.url = opts.url + (rquery.test(opts.url) ? "&" : "?") + opts.jsonp + "=" + namespace + "." + name;
                    //将后台返回的json保存在惰性函数中
                    global[namespace][name] = function(json) {
                        $[name] = json;
                    };
                    return "script"
                }
            },
            script: {
                request: function() {
                    var opts = this.options;
                    var node = this.transport = DOC.createElement("script");
                    $.log("ScriptTransport.sending.....");
                    if (opts.charset) {
                        node.charset = opts.charset;
                    }
                    var load = node.onerror === null; //判定是否支持onerror
                    var self = this;
                    node.onerror = node[load ? "onload" : "onreadystatechange"] = function() {
                        self.respond();
                    };
                    node.src = opts.url;
                    $.head.insertBefore(node, $.head.firstChild);
                },
                respond: function(event, forceAbort) {
                    var node = this.transport;
                    if (!node) {
                        return;
                    }
                    var execute = /loaded|complete|undefined/i.test(node.readyState);
                    if (forceAbort || execute) {
                        node.onerror = node.onload = node.onreadystatechange = null;
                        var parent = node.parentNode;
                        if (parent) {
                            parent.removeChild(node);
                        }
                        if (!forceAbort) {
                            var args = typeof $[this.jsonpCallback] === "function" ? [500, "error"] : [200, "success"];
                            this.dispatch.apply(this, args);
                        }
                    }
                }
            },
            upload: {
                preproccess: function() {
                    var opts = this.options;
                    var formdata = new FormData(opts.form); //将二进制什么一下子打包到formdata
                    $.each(opts.data, function(key, val) {
                        formdata.append(key, val); //添加客外数据
                    });
                    this.formdata = formdata;
                }
            }
        },
        ajaxConverters: {//转换器，返回用户想要做的数据
            text: function(text) {
                return text || "";
            },
            xml: function(text, xml) {
                return xml !== void 0 ? xml : $.parseXML(text);
            },
            html: function(text) {
                return $.parseHTML(text);//一个文档碎片,方便直接插入DOM树
            },
            json: function(text) {
                return $.parseJSON(text);
            },
            script: function(text) {
                $.parseJS(text);
            },
            jsonp: function() {
                var json = $[this.jsonpCallback];
                delete $[this.jsonpCallback];
                return json;
            }
        },
        getScript: function(url, callback) {
            return $.get(url, null, callback, "script");
        },
        getJSON: function(url, data, callback) {
            return $.get(url, data, callback, "jsonp");
        },
        upload: function(url, form, data, callback, dataType) {
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
        //将一个对象转换为字符串
        param: function(json, bracket) {
            if (!$.isPlainObject(json)) {
                return "";
            }
            bracket = typeof bracket === "boolean" ? bracket : !0;
            var buf = [],
                    key, val;
            for (key in json) {
                if (json.hasOwnProperty(key)) {
                    val = json[key];
                    key = encode(key);
                    if (isValidParamValue(val)) { //只处理基本数据类型,忽略空数组,函数,正则,日期,节点等
                        buf.push(key, "=", encode(val + ""), "&");
                    } else if (Array.isArray(val) && val.length) { //不能为空数组
                        for (var i = 0, n = val.length; i < n; i++) {
                            if (isValidParamValue(val[i])) {
                                buf.push(key, (bracket ? encode("[]") : ""), "=", encode(val[i] + ""), "&");
                            }
                        }
                    }
                }
            }
            buf.pop();
            return buf.join("").replace(r20, "+");
        },
        //将一个字符串转换为对象
        //$.deparam = jq_deparam = function( params, coerce ) {
        //https://github.com/cowboy/jquery-bbq/blob/master/jquery.ba-bbq.js
        unparam: function(url, query) {
            var json = {};
            if (!url || !$.type(url, "String")) {
                return json;
            }
            url = url.replace(/^[^?=]*\?/ig, '').split('#')[0]; //去除网址与hash信息
            //考虑到key中可能有特殊符号如“[].”等，而[]却有是否被编码的可能，所以，牺牲效率以求严谨，就算传了key参数，也是全部解析url。
            var pairs = url.split("&"),
                    pair, key, val, i = 0,
                    len = pairs.length;
            for (; i < len; ++i) {
                pair = pairs[i].split("=");
                key = decode(pair[0]);
                try {
                    val = decode(pair[1] || "");
                } catch (e) {
                    $.log(e + "decodeURIComponent error : " + pair[1], 3);
                    val = pair[1] || "";
                }
                key = key.replace(/\[\]$/, ""); //如果参数名以[]结尾，则当作数组
                var item = json[key];
                if (item === void 0) {
                    json[key] = val; //第一次
                } else if (Array.isArray(item)) {
                    item.push(val); //第三次或三次以上
                } else {
                    json[key] = [item, val]; //第二次,将它转换为数组
                }
            }
            return query ? json[query] : json;
        },
        serialize: function(form) { //表单元素变字符串
            var json = {};
            // 不直接转换form.elements，防止以下情况：   <form > <input name="elements"/><input name="test"/></form>
            $.filter(form || [], function(el) {
                return el.name && !el.disabled && (el.checked === true || /radio|checkbox/.test(el.type));
            }).forEach(function(el) {
                var val = $(el).val(),
                        vs;
                val = Array.isArray(val) ? val : [val];
                val = val.map(function(v) {
                    return v.replace(rCRLF, "\r\n");
                });
                // 全部搞成数组，防止同名
                vs = json[el.name] || (json[el.name] = []);
                vs.push.apply(vs, val);
            });
            return $.param(json, false); // 名值键值对序列化,数组元素名字前不加 []
        }
    });
    var transports = $.ajaxTransports;
    $.mix(transports.jsonp, transports.script);
    $.mix(transports.upload, transports.xhr);
    /**
     * 伪XMLHttpRequest类,用于屏蔽浏览器差异性
     * var ajax = new(self.XMLHttpRequest||ActiveXObject)("Microsoft.XMLHTTP")
     * ajax.onreadystatechange = function(){
     *   if (ajax.readyState==4 && ajax.status==200){
     *        alert(ajax.responseText)
     *   }
     * }
     * ajax.open("POST", url, true);
     * ajax.send("key=val&key1=val2");
     */
    $.XMLHttpRequest = $.factory($.Observer, {
        init: function(opts) {
            $.mix(this, {
                responseHeadersString: "",
                responseHeaders: {},
                requestHeaders: {},
                querystring: opts.querystring,
                readyState: 0,
                uniqueID: setTimeout("1"),
                status: 0
            });
            this.addEventListener = this.bind;
            this.removeEventListener = this.unbind;
            this.setOptions("options", opts); //创建一个options保存原始参数
        },
        setRequestHeader: function(name, value) {
            this.requestHeaders[name] = value;
            return this;
        },
        getAllResponseHeaders: function() {
            return this.readyState === 4 ? this.responseHeadersString : null;
        },
        getResponseHeader: function(name, match) {
            if (this.readyState === 4) {
                while ((match = rheaders.exec(this.responseHeadersString))) {
                    this.responseHeaders[match[1]] = match[2];
                }
                match = this.responseHeaders[name];
            }
            return match === undefined ? null : match;
        },
        overrideMimeType: function(type) {
            this.mimeType = type;
            return this;
        },
        toString: function() {
            return "[object XMLHttpRequest]";
        },
        // 中止请求
        abort: function(statusText) {
            statusText = statusText || "abort";
            if (this.transport) {
                this.respond(0, statusText);
            }
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
            if (!this.transport) { //2:已执行回调
                return;
            }
            this.readyState = 4;
            var eventType = "error";
            if (status >= 200 && status < 300 || status === 304) {
                eventType = "success";
                if (status === 204) {
                    statusText = "nocontent";
                } else if (status === 304) {
                    statusText = "notmodified";
                } else {
                    //如果浏览器能直接返回转换好的数据就最好不过,否则需要手动转换
                    if (typeof this.response === "undefined") {
                        var dataType = this.options.dataType || this.options.mimeType;
                        if (!dataType) { //如果没有指定dataType，则根据mimeType或Content-Type进行揣测
                            dataType = this.getResponseHeader("Content-Type") || "";
                            dataType = dataType.match(/json|xml|script|html/) || ["text"];
                            dataType = dataType[0];
                        }
                        try {
                            this.response = $.ajaxConverters[dataType].call(this, this.responseText, this.responseXML);
                        } catch (e) {
                            eventType = "error";
                            statusText = "parsererror : " + e;
                        }
                    }
                }
            }
            this.status = status;
            this.statusText = statusText;
            if (this.timeoutID) {
                clearTimeout(this.timeoutID);
                delete this.timeoutID;
            }
            this.rawFire = true;
            this._transport = this.transport;
            // 到这要么成功，调用success, 要么失败，调用 error, 最终都会调用 complete
            if (eventType === "success") {
                this.fire(eventType, this.response, statusText, this);
            } else {
                this.fire(eventType, this, statusText);
            }
            this.fire("complete", this, statusText);
            delete this.transport;
        }
    });
    if (typeof $.fixAjax === "function") {
        $.fixAjax();
    }
    return $;
});
/**
 2011.8.31
 将会传送器的abort方法上传到$.XHR.abort去处理
 修复serializeArray的bug
 对XMLHttpRequest.abort进行try...catch
 2012.3.31 v2 大重构,支持XMLHttpRequest Level2
 2013.4.8 v3 大重构 支持二进制上传与下载
 */