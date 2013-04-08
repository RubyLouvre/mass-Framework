
define(!!this.FormData, ["flow"], function($) {
    var str =  'Function BinaryToArray(binary)\r\n\
                 Dim oDic\r\n\
                 Set oDic = CreateObject("scripting.dictionary")\r\n\
                 length = LenB(binary) - 1\r\n\
                 For i = 1 To length\r\n\
                     oDic.add i, AscB(MidB(binary, i, 1))\r\n\
                 Next\r\n\
                 BinaryToArray = oDic.Items\r\n\
              End Function'
    execScript(str, "VBScript");
    $.ajaxConverters.arraybuffer = function() {
        var body = this.tranport && this.tranport.responseBody
        if (body) {
            return  new VBArray(BinaryToArray(body)).toArray();
        }
    };
    $.fixAjax = function() {
        function createIframe(ID) {
            var iframe = $.parseHTML("<iframe " + " id='" + ID + "'" +
                    " name='" + ID + "'" + " style='position:absolute;left:-9999px;top:-9999px;/>").firstChild;
            return (DOC.body || DOC.documentElement).insertBefore(iframe, null);
        }
        function addDataToForm(form, data) {
            var ret = [],
                    d, isArray, vs, i, e;
            for (d in data) {
                isArray = Array.isArray(data[d]);
                vs = isArray ? data[d] : [data[d]];
                // 数组和原生一样对待，创建多个同名输入域
                for (i = 0; i < vs.length; i++) {
                    e = DOC.createElement("input");
                    e.type = 'hidden';
                    e.name = d;
                    e.value = vs[i];
                    form.appendChild(e);
                    ret.push(e);
                }
            }
            return ret;
        }
        $.AjaxTransports.upload = {
            request: function() {
                var self = this;
                var opts = this.options;
                var ID = "iframe-upload-" + this.uniqueID;
                var form = opts.form;
                var iframe = this.transport = createIframe(ID);
                //form.enctype的值
                //1:application/x-www-form-urlencoded   在发送前编码所有字符（默认）
                //2:multipart/form-data 不对字符编码。在使用包含文件上传控件的表单时，必须使用该值。
                //3:text/plain  空格转换为 "+" 加号，但不对特殊字符编码。
                this.backups = {
                    target: form.target || "",
                    action: form.action || "",
                    enctype: form.enctype,
                    method: form.method
                };
                //必须指定method与enctype，要不在FF报错
                //“表单包含了一个文件输入元素，但是其中缺少 method=POST 以及 enctype=multipart/form-data，所以文件将不会被发送。”
                // 设置target到隐藏iframe，避免整页刷新
                form.target = ID;
                form.action = opts.url;
                form.method = "POST";
                form.enctype = "multipart/form-data";
                this.fields = opts.data ? addDataToForm(form, opts.data) : [];
                this.form = form; //一个表单元素
                $.log("iframe transport...");
                this.uploadcallback = $.bind(iframe, "load", function(event) {
                    self.respond(event);
                });
                setTimeout(function() {
                    form.submit();
                });
            },
            respond: function(event, forceAbort) {
                var node = this.transport;
                // 防止重复调用,成功后 abort
                if (!node) {
                    return;
                }
                if (event && event.type === "load") {
                    var doc = node.contentWindow.document;
                    this.responseXML = doc;
                    if (doc.body) {
                        // response is html document or plain text
                        this.responseText = doc.body.innerHTML;
                        //当，MIME为"text/plain",浏览器会把文本放到一个PRE标签中
                        if (doc.body.firstChild && doc.body.firstChild.nodeName === 'PRE') {
                            this.responseText = doc.body.firstChild.firstChild.nodeValue;
                        }
                    }
                    this.dispatch(200, "success");
                }
                //还原form的属性
                var form = this.options.form;
                for (var i in transport.backups) {
                    form[i] = transport.backups[i];
                }
                //移除之前动态添加的节点
                transport.fields.forEach(function(input) {
                    form.removeChild(input);
                });
                this.uploadcallback = $.unbind(node, "load", this.uploadcallback);
                delete this.uploadcallback;
                setTimeout(function() {
                    // Fix busy state in FF3
                    node.parentNode.removeChild(node);
                    $.log("iframe.parentNode.removeChild(iframe)");
                });
            }
        };
        delete $.fixAjax;
    };
    return $;
});



