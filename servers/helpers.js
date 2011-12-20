/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
mass.define("helpers",function(){
    var regexps    = {
        'cached': /^cache\//,
        'isHttp': /^https?:\/\/|\/\//
    },
    exts       = {
        'css': '.css',
        'js' : '.js'
    },
    paths = {
        'css': '/stylesheets/',
        'js' : '/javascripts/'
    }
    function checkProd() {
        return mass.settings.env === 'production';
    }
    function checkFile(type, file) {
        var isExternalFile = regexps.isHttp.test(file),
        isCached         = file.match(regexps.cached),
        href             = !isExternalFile ? paths[type] + file + exts[type] : file,
        isProd           = checkProd();
        if (!isCached && !isProd && !isExternalFile) {
            href += '?' + Date.now()
        }
        return href;
    }
    function html_tag_params(params, override) {
        var maybe_params = '';
        mass.mix(params, override,false);
        for (var key in params) {
            if (params[key] != void 0) {
                maybe_params += ' ' + key + '="' + params[key].toString().replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"';
            }
        }
        return maybe_params;
    };
    function genericTag(name, inner, params, override) {
        return '<' + name + html_tag_params(params, override) + '>' + inner + '</' + name + '>';
    }
    return {
        //创建多个相对public的script标签
        javascript_include_tag : function () {
            if (!paths.js || !paths.javascripts) {
                paths.js = mass.settings.jsDirectory || '/javascripts/'
                paths.javascripts = paths.js;
            }
            var args = Array.prototype.slice.call(arguments);
            var options = {
                type: 'text/javascript'
            };
            if (typeof args[args.length - 1] == 'object') {
                options = mass.mix(options, args.pop(),false);
            }
            var scripts = [];
            args.forEach(function (file) {
                // there should be an option to change the /javascripts/ folder
                var href = checkFile('js', file);
                delete options.src;
                scripts.push(genericTag('script', '', options, {
                    src: href
                }));
            });
            return scripts.join('\n    ');
        }
    }
    
})