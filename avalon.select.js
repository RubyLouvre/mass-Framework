(function(avalon) {
    //判定是否触摸界面
    var defaults = {
        minWidth: 225,
        height: 175,
        toggle: false,
        caption: "请选择",
        selectedIndex: 0,
        checkAllText: "全选",
        unCheckAllText: "全不选"
    };
    var domParser = document.createElement("div");

    avalon.ui["select"] = function(element, id, opts, model) {
        var $element = avalon(element);
        var options = avalon.mix({}, defaults);
        if (typeof opts === "object") {
            for (var i in opts) {
                if (i === "$id")
                    continue;
                options[i] = opts[i];
            }
        }
        avalon.mix(options, $element.data());
        domParser.innerHTML = '<button type="button" ms-hover="ui-state-hover" ms-active="ui-state-focus"  ms-click="toggleMenu" class="ui-multiselect ui-widget ui-state-default ui-corner-all" aria-haspopup="true" >' +
                '<span class="ui-icon ui-icon-triangle-2-n-s"></span><span>{{caption}}</span></button>';
        var button = domParser.removeChild(domParser.firstChild);
        button.style.minWidth = options.minWidth + "px";
        button.style.width = Math.max(options.minWidth, element.offsetWidth) + "px";
        button.title = element.title;
        $element.addClass("ui-helper-hidden-accessible");

        domParser.innerHTML = '<div class="ui-multiselect-menu ui-widget ui-widget-content ui-corner-all"'
                + ' ms-visible="toggle" >'
                + '<div class="ui-widget-header ui-corner-all ui-multiselect-header ui-helper-clearfix">'
                + '<ul class="ui-helper-reset">'
                + '<span ms-if="!multiple">' + options.caption + '</span>'
                + '<li ms-if="multiple"><a class="ui-multiselect-all"  href="return false" ms-click="checkAll"><span class="ui-icon ui-icon-check"></span><span>{{checkAllText}}</span></a></li>'
                + '<li ms-if="multiple"><a class="ui-multiselect-none" href="return false" ms-click="unCheckAll"><span class="ui-icon ui-icon-closethick"></span><span>{{unCheckAllText}}</span></a></li>'
                + '<li class="ui-multiselect-close"><a href="#" class="ui-multiselect-close" ms-click="closeMenu"><span class="ui-icon ui-icon-circle-close"></span></a></li>'
                + '</ul></div>'
                + '<ul class="ui-multiselect-checkboxes ui-helper-reset" ms-css-height="height" ms-each-el="list" >'
                + '<li ms-class-ui-multiselect-optgroup-label="!el.isOption">'
                + '<a href="#" ms-if="!el.isOption" >{{el.text}}</a>'
                + '<label ms-if="el.isOption" ms-hover="ui-state-hover" ms-class-ui-state-disabled="el.disabled" class="ui-corner-all" ms-click="changeState">'
                + '<input ms-visible="multiple" ms-disabled="el.disabled"  ms-checked="el.selected" type="checkbox"><span>{{el.text}}</span></label></li>'
                + '</ul></div>';
        var list = [], index = 0, els = [];
        function getOptions(i, el) {
            //  console.log(el)
            if (el.tagName === "OPTION") {
                list.push({
                    isOption: true,
                    text: el.text,
                    index: index++,
                    selected: !el.disabled && el.selected,
                    disabled: el.disabled
                });
                els.push(el);
            } else if (el.tagName === "OPTGROUP") {
                list.push({
                    isOption: false,
                    text: el.label,
                    index: 0,
                    selected: false,
                    disabled: true
                });
                els.push(el);
                avalon.forEach(el.childNodes, getOptions);
            }
        }
        ;
        avalon.forEach(element.childNodes, getOptions);

        var menu = domParser.removeChild(domParser.firstChild);
        menu.style.width = button.style.width;
        var curCaption = options.caption;

        model = avalon.define(id, function(vm) {
            avalon.mix(vm, options);
            vm.list = list;
            vm.multiple = element.multiple;
            function getCaption() {
                if (vm.multiple) {
                    var l = vm.list.$vms.filter(function(el) {
                        return el.isOption && el.selected && !el.disabled;
                    }).length;
                    return l ? l + " selected" : curCaption;
                } else {
                    return  element[element.selectedIndex].text;
                }
            }
            vm.caption = getCaption();
            vm.toggleMenu = function() {
                vm.toggle = !vm.toggle;
            };
            vm.$watch("toggle", function(v) {
                if (v) {
                    var offset = avalon(button).offset();
                    menu.style.top = offset.top + button.offsetHeight + "px";
                    menu.style.left = offset.left + "px";
                }
            });
            vm.closeMenu = function(e) {
                e.preventDefault();
                vm.toggle = false;
            };
            vm.checkAll = function(e, val) {
                e.preventDefault();
                val = !val;
                vm.list.$vms.forEach(function(el) {
                    if (el.isOption && !el.disabled) {
                        el.selected = val;
                    }
                });
                vm.caption = getCaption();
            };
            vm.unCheckAll = function(e) {
                vm.checkAll(e, true);
            };
        
            vm.changeState = function(e) {
                 console.log("--------------")
                if(this.locked){//一次点击可以引起此元素或此元素的孩子触发多个click(每个元素一次)
                    return;//为了只让当中的某一个click生效,我们需要一个锁
                }
               
                this.locked = true;
                setTimeout(function(){
                    this.locked = void 0
                },4)
            //    console.log("xxxxxxxxxxxxxx")
                var obj = this.$scope.el;
                if (!obj.disabled ) {//重要技巧,通过e.target == this排除冒泡上来的事件
                    var index = obj.index;
                    var option = els[index];
                    if (vm.multiple) {
                         var a = vm.list.$vms[index]
                         a.selected = !a.selected;
                         option.selected = a.selected 
                    //    console.log("999999999")
                   //     option.selected = obj.selected = !obj.selected;
                    //   var a = vm.list[index]
                    //    console.log("obj.selected")
                    } else {
                        element.selectedIndex = vm.selectedIndex = index;
                        option.selected = true;
                        vm.toggle = false;
                    }
                    vm.caption = getCaption();
                }
            };
        });
        avalon.ready(function() {
            element.parentNode.insertBefore(button, element.nextSibling);
            avalon.scan(button, model);
            document.body.appendChild(menu);
            avalon.scan(menu, model);
        });

        return model;
    };

})(window.avalon);
//http://www.erichynds.com/examples/jquery-ui-multiselect-widget/demos/#single
