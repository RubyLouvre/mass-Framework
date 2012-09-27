define('button',[ '$css',"./avalon" ], function(){
    $.log("button...",7)
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
        inherit: $.Flow,
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
                el.cls = el.cls || defaults.cls
            });
            console.log(btns)
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
            $.log(data.tag);
            $.log(/\$tag/g)
            this.tmpl =  tmpl.replace(/\$tag/g, data.tag);
            this.tmpl =  tmpl.replace(/\$text/g, data.tag == "input"? "value" : "text");
            console.log(this.tmpl+"!!!!!!!!!1")
            var ui = this.ui = $(this.tmpl).appendTo( data.parent )
            
            this.VM =  $.ViewModel( data );

            $.View(this.VM, ui[0]);
            //保存实例
            if(data.type == "button"){
                this.ui.data("button", this)
            }else{
                this.ui.children("[data-toggle^=button]").data("button", this)
            }
        }
    })
    
    $('body').on('click', '[data-toggle^=button]', function ( e ) {
        var el = $(e.target)
        if (!el.hasClass('btn')) 
            el = el.closest('.btn')
        var button = el.data("button");
        if( button && button.data.type == "buttons-radio" ){
            button.ui.find('.active').removeClass('active')
            el.toggleClass('active')
        }
    })
    
})
