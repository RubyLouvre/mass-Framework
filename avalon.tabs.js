(function(avalon) {
    var defaults = {
        active: 0,
        event: "click", //可以使用click, mouseover
        collapsible: false,
        bottom: false,
        removable: false
    };
    avalon.ui.tabs = function(element, id) {
        var fragment = document.createDocumentFragment();
        var el, tablist, tabs = [],
            tabpanels = [];
        while (el = element.firstChild) {
            if (!tablist && el.tagName === "UL") {
                tablist = el;
            }
            if (el.tagName === "DIV") {
                tabpanels.push(el);
            }
            fragment.appendChild(el);
        }
        var $element = avalon(element);
        var options = avalon.mix({}, defaults);
        avalon.mix(options, $element.data());
        if (options.bottom) {
            fragment.appendChild(tablist);
        }
        $element.addClass("ui-tabs ui-widget ui-widget-content ui-corner-all");
        element.setAttribute("ms-class-ui-tabs-collapsible", "collapsible");
        element.setAttribute("ms-class-tabs-bottom", "bottom");
        avalon(tablist).addClass("ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header");
        tablist.setAttribute("ms-class-ui-corner-all", "!bottom");
        tablist.setAttribute("ms-class-ui-corner-bottom", "bottom");
        for (var i = 0, tab; tab = tablist.children[i]; i++) {
            avalon(tab).addClass("ui-state-default");
            tab.setAttribute("ms-class-ui-corner-top", "!bottom");
            tab.setAttribute("ms-class-ui-corner-bottom", "bottom");
            tab.setAttribute("ms-class-ui-tabs-active", "active == " + i);
            tab.setAttribute("ms-class-ui-state-active", "active == " + i);
            tab.setAttribute("ms-" + options.event, "activate");
            tab.setAttribute("ms-hover", "ui-state-hover");
            if (options.removable) {
                var span = document.createElement("span");
                span.className = "ui-icon ui-icon-close";
                span.setAttribute("ms-click", "remove");
                tab.appendChild(span);
            }
            tabs.push(tab);
        }
        for (var i = 0, panel; panel = tabpanels[i]; i++) {
            avalon(panel).addClass("ui-tabs-panel ui-widget-content");
            panel.setAttribute("ms-visible", "active ==" + i);
            panel.setAttribute("ms-class-ui-corner-bottom", "bottom");
        }
        var model = avalon.define(id, function(vm) {
            vm.active = options.active;
            vm.collapsible = options.collapsible;
            vm.activate = function(e) {
                var index = tabs.indexOf(this);
                if (index >= 0) {
                    vm.active = index;
                }
            };
            vm.remove = function(e) {
                e.preventDefault();
                var tab = this.parentNode;
                var index = tabs.indexOf(tab);
                var panel = tabpanels[index];
                tablist.removeChild(tab);
                element.removeChild(panel);
            };
            vm.bottom = options.bottom;
            vm.$watch("bottom", function(val) {
                if (val) {
                    element.appendChild(tablist);
                } else {
                    element.insertBefore(tablist, element.firstChild);
                }
            });
        });
        avalon.nextTick(function() {
            element.appendChild(fragment);
            avalon.scan(element.parentNode, model);
        });
    };
})(window.avalon);