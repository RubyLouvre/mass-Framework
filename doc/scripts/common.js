(function() {
    ("abbr article aside audio canvas datalist details figcaption figure footer " +
            "header hgroup mark meter nav output progress section summary time video"
            ).replace($.rword, function(tag) {
        document.createElement(tag);
    });
    var prefix = location.protocol + "//" + location.host;
    var head = document.getElementsByTagName("head")[0];
    var appendScript = function(url) {
        var node = document.createElement("script");
        node.src = prefix + "/doc/scripts" + url;
        head.appendChild(node);
    };
    var appendStyle = function(url) {
        var node = document.createElement("link");
        node.type = "text/css";
        node.rel = "stylesheet";
        node.href = prefix + "/doc/styles" + url;
        head.appendChild(node);
    };
    "/shCore.js  /common.css /shCore.css /shThemeRDark.css".replace(/[^, ]+/g, function(url) {
        if (/\.js$/.test(url)) {
            appendScript(url);
        } else {
            appendStyle(url);
        }
    });
    function Highlight() {
        try {
            SyntaxHighlighter.highlight()
        } catch (e) {
            setTimeout(Highlight, 500);
        }
    }
    require("ready,event", function($) {
        $("pre").each(function() {
            if (this.exec !== "function") {
                try {
                    var self = $(this), btn = self.next("button.doc_btn");
                    if (/brush:\s*j/i.test(this.className) && btn.length) {
                        var code = $.String.unescapeHTML(this.innerHTML);
                        var fn = Function(code);
                        btn[0].exec = fn;
                    }
                } catch (e) {
                    $.log(this)
                    $.log(e);
                    $.log(code)
                }
            }
        });

        Highlight();

        $("body").delegate(".doc_btn", "click", function() {
            if (typeof this.exec == "function") {
                this.exec.call(window)
            }
        });
    });
})();
