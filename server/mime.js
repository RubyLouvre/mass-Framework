/*处理MIME，Multipurpose Internet Mail Extensions的模块, 一般我们可以Content-Type首部取得它.
Content-Type: [type]/[subtype]; parameter
type有下面的形式。
Text：用于标准化地表示的文本信息，文本消息可以是多种字符集和或者多种格式的；
Multipart：用于连接消息体的多个部分构成一个消息，这些部分可以是不同类型的数据；
Application：用于传输应用程序数据或者二进制数据；
Message：用于包装一个E-mail消息；
Image：用于传输静态图片数据；
Audio：用于传输音频或者音声数据；
Video：用于传输动态影像数据，可以是与音频编辑在一起的视频数据格式。
subtype用于指定type的详细形式。content-type/subtype配对的集合和与此相关的参数，将随着时间而增长。
为了确保这些值在一个有序而且公开的状态下开发，MIME使用Internet Assigned Numbers Authority (IANA)作为中心的注册机制来管理这些值。
常用的subtype值如下所示：
text/plain（纯文本）
text/html（HTML文档）
application/xhtml+xml（XHTML文档）
image/gif（GIF图像）
image/jpeg（JPEG图像）【PHP中为：image/pjpeg】
image/png（PNG图像）【PHP中为：image/x-png】
video/mpeg（MPEG动画）
application/octet-stream（任意的二进制数据）
application/pdf（PDF文档）
application/msword（Microsoft Word文件）
message/rfc822（RFC 822形式）
multipart/alternative（HTML邮件的HTML形式和纯文本形式，相同内容使用不同形式表示）
application/x-www-form-urlencoded（使用HTTP的POST方法提交的表单）
multipart/form-data（同上，但主要用于表单提交时伴随文件上传的场合）
*/
mass.define("mime","path,fs",function(){
    var mime =  {
        //此对象键为文件扩展名,值为MIME
        types: {},
        //此对象键为MIME,值为文件扩展名
        extensions :{},
        _define: function(map) {
            //用于构建types与extensions这个两个对象
            //map现在大概是这个样子:
            //{'audio/ogg', ['oga', 'ogg', 'spx'],"application/zip":["zip"]}
            for (var type in map) {
                var exts = map[type];
                for (var i = 0; i < exts.length; i++) {
                    mime.types[exts[i]] = type;
                }
                if (!mime.extensions[type]) {
                    //默认是使用最通用的第一个类型
                    mime.extensions[type] = exts[0];
                }
            }
        },

        load: function(file) {
            //取得文件中非注释行中的MIME,并根据中间的空白拆分为键值,添加支map上.
            // Read file and split into lines
            var map = {},
            content = fs.readFileSync(file, 'ascii'),
            lines = content.split(/[\r\n]+/);
            lines.forEach(function(line, lineno) {
                // Clean up whitespace/comments, and split into fields
                var fields = line.replace(/\s*#.*|^\s*|\s*$/g, '').split(/\s+/);
                map[fields.shift()] = fields;
            });
            mime._define(map);
        },

        //取得pathname中文件扩展名,进而取得MIME
        lookup: function(path, fallback) {
            var ext = path.replace(/.*[\.\/]/, '').toLowerCase();
            return mime.types[ext] || fallback || mime.default_type;
        },
        //通过mime取得文件扩展名
        extension: function(mimeType) {
            return mime.extensions[mimeType];
        },
        charsets: {
            //如果是文本类型取得字符编码
            lookup: function (mimeType, fallback) {
                return (/^text\//).test(mimeType) ? 'UTF-8' : fallback;
            }
        }
    };

    // Load our local copy of
    // http://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types
    mime.load(path.join(__dirname, 'mime/mime.types'));
    // Overlay enhancements submitted by the node.js community
    mime.load(path.join(__dirname, 'mime/node.types'));
    // Set the default type
    mime.default_type = mime.types.bin;
    return mime;
});
