define('button',[ '$css',"./avalon" ], function(){
    $.log("已加载button",7)
    $.ui = $.ui || {};
    var defaults ={
        parent:"body",
        type: "button",
        text: "Action",
        tag:  "button",
        cls: 'btn-primary',
        btns: []
    }
    $.ui.Button  = $.factory({
        init: function(opts){
            var _type
            if(typeof  opts == "string"){
                _type = opts;
                opts = {};
            }
            opts = opts || {};
            if(_type){
                opts.type = _type;
            }
            this.setOptions ("data", defaults, opts );
            var data = this.data;
            this.preRender = data.preRender || $.noop
            delete data.preRender
            data.tag = data.tag.toLowerCase()
            if(!/^(buttons-checkbox|button|buttons-radio)$/.test(data.type)){
                data.type = "button"
            }
            var btns = data.btns ;
            btns.forEach(function(el,i){
                if(/^(b|n|s)/.test(typeof el)){
                    var text = el
                    btns[i] = el = {
                        text: text
                    };
                }
                el.text = el.text || "";
                el.cls = el.cls || data.cls || defaults.cls
            });

            var tmpl = '<$tag class="btn" data-toggle="button" bind="$text:text,class:cls">单独开关</$tag>';
            switch(data.type){
                case "button":
                    break;
                case "buttons-checkbox":
                    data.cls = ""
                    tmpl = 
                    '<div class="btn-group" data-toggle="buttons-checkbox" bind="foreach:btns,class:cls">'+
                    '     <$tag class="btn" bind="$text:text,class:cls">左</$tag>' +
                    '</div>'
                    break;
                case "buttons-radio":
                    data.cls = ""
                    tmpl = 
                    '<div class="btn-group" data-toggle="buttons-radio" bind="foreach:btns,class:cls">'+
                    '     <$tag class="btn" bind="$text:text,class:cls">左</$tag>' +
                    '</div>'
                    break;
            }
            tmpl =  tmpl.replace(/\$tag/g, data.tag);
            this.tmpl =  tmpl.replace(/\$text/g, data.tag == "input"? "value" : "text");
            this.preRender();
            //插入DOM并绑定数据
            var ui = this.ui = $(this.tmpl).appendTo( data.parent )
            this.VM =  $.ViewModel( data );
            $.View(this.VM, ui[0]);
        }
    })
    
    $('body').on('click', '[data-toggle^=button]', function ( e ) {
        var el = $(e.target)
        if (!el.hasClass('btn')) 
            el = el.closest('.btn')
        var parent = el.parent('[data-toggle="buttons-radio"]');
        if(parent.length){
            parent.find('.active').removeClass('active');
        }
        el.toggleClass('active')
    })
    
})
