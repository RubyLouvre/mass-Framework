define("deltectZoom", function() {
    /* 设备检测
     *  继续探索一种不使用mediaQuery的方法，求推荐
     */
    var mediaQueryBinarySearch = function(property, unit, a, b, maxIter, epsilon) {
        var matchMedia;
        var head, style, div;
        if (window.matchMedia) {
            matchMedia = window.matchMedia;
        } else {
            head = document.getElementsByTagName('head')[0];
            style = document.createElement('style');
            head.appendChild(style);
            div = document.createElement('div');
            div.className = 'mediaQueryBinarySearch';
            div.style.display = 'none';
            document.body.appendChild(div);
            matchMedia = function(query) {
                style.sheet.insertRule('@media ' + query + '{.mediaQueryBinarySearch ' + '{text-decoration: underline} }', 0);
                var matched = getComputedStyle(div, null).textDecoration === 'underline';
                style.sheet.deleteRule(0);
                return {matches: matched};
            };
        }
        var ratio = binarySearch(a, b, maxIter);
        if (div) {
            head.removeChild(style);
            document.body.removeChild(div);
        }
        return ratio;
        function binarySearch(a, b, maxIter) {
            var mid = (a + b) / 2;
            if (maxIter <= 0 || b - a < epsilon) {
                return mid;
            }
            var query = "(" + property + ":" + mid + unit + ")";
            if (matchMedia(query).matches) {
                return binarySearch(mid, b, maxIter - 1);
            } else {
                return binarySearch(a, mid, maxIter - 1);
            }
        }
    };
    function deleteBrower() {
        if (self.VBArray) {
            return "ie";
        }
        if (self.netscape) {
            return "firefox";
        }
        if (self.opera) {
            return "opera";
        }
        if (self.chrome) {
            return "chrome";
        }
    }
    switch (user_agent()) {
        case 'ie':
            var x = Math.round((win.screen.deviceXDPI / win.screen.logicalXDPI) * 100);
            break;
        case 'firefox':
            // 检测设备缩放比例
            var x = mediaQueryBinarySearch('min--moz-device-pixel-ratio', '', 0, 10, 20, 0.0001);
            x = Math.round(x * 100);
            break;
        case 'opera':
            var x = win.outerWidth / win.innerWidth;
            x = Math.round(x * 100);
            break;
        default :
            var tempElem = document.createElement('div');
            document.body.appendChild(tempElem);
            var x = win.screen.width / tempElem.clientWidth;
            x = Math.round(x * 100);
    }
    return x;//返回当前缩放比例

});

