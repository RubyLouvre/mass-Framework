$.define("menu","fx,event,attr",function(){
    var getIP = function(){
        return (new Date - 0)  + (Math.random()*0x1000000<<0).toString(16).slice(-6) 
    }
    var addItem = function(parent, obj, ip){
        var item = $("<div class='menu_item'/>")
        for(var i in obj){
            item[i] && item[i](obj[i])
        }
        item.attr("ip", ip)
        return item.appendTo( parent  )
    }
    var addMenu = function(parent, cls ){
        return $("<div />").appendTo( parent  ).addClass(cls)
    }
    var addItems = function(parent, els, prefix){
       
        for(var i = 0, el; el = els[i++];){
            var ip = prefix ? prefix +"-"+ getIP() : getIP()
            var item = addItem(parent, el, ip);
            if(el.sub && el.sub.length){
                item.css( "position","relative");
                var p = addMenu(item).css({
                    position:"absolute",
                    display:"none",
                    top:  -1,
                    left: item.innerWidth()
                }).addClass("sub_menu").attr("ip", ip);

                addItems( p , el.sub, ip)
            }

        }
    }
    var defaults = {};
    function init( ui, hash ){
  
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        ui.target = addMenu(ui.parent,"mass_menu");

        addItems(ui.target , hash.menu, "" );
      
        ui.target.delegate(".menu_item", "mouseover", function(){
            //1 第一重的子菜单不能隐藏
            //2 如果当前选中的菜单是原选中菜单之内，也不用隐藏
            var self = $(this);
            var menu = ui.target.find(".sub_menu:visible");
            if( menu[0]){
                var ip = self.attr("ip")
                var lip = menu.attr("ip");
                if( (lip.length > lip.ip ?  lip.indexOf(ip) :  ip.indexOf(lip) ) != 0){
                    menu.hide()
                }
            }
            $(this).find("> .sub_menu").show()
            
        });

    }
    var Menu = $.factory({
        init: function( parent ){
            this.parent = parent;
        },
        invoke: function(method, value){
            if(typeof this[method] === "function"){
                this[method].apply( this, [].slice.call(arguments,1) );
            }else{
                this[method] = value;
            }
        },
        active: function(index, callback){

        },
        remove: function(index,callback){

        },
        destroy: function(){
            this.target.delegate(".menu_item");
            this.target.remove();
        }
    });
    $.fn.menu = function( method){
        for(var i =0 ; i < this.length; i++){
            if(this[i] && this[i].nodeType === 1){
                var tabs = $.data(this[i],"_init_menu")
                if(! tabs  ){
                    tabs = new Menu(this[i]);
                    init(tabs, method);
                    $.data(this[i],"_init_menu");
                }else if(typeof method == "string"){
                    tabs.invoke.apply(tabs, arguments )
                }else if(method && typeof method == "object"){
                    tabs.setOptions( method );
                }
            }
        }
        return this;
    }
})
/*
          $.require("ready,more/menu",function( api ){
                $("body").menu({
                    menu:[
                        {html:"菜单1",
                            sub:[
                                {html:"菜单1-1"},
                                {html:"菜单1-2",
                                    sub:[
                                        {html:"菜单3-1"},
                                        {html:"菜单3-2"}
                                    ]
                                }
                            ]
                        },
                        {html:"菜单2",
                            sub:[
                                {html:"菜单2-1"},
                                {html:"菜单2-2"}
                            ]},
                        {html:"菜单3"},
                        {html:"菜单4"}
                    ]
                })
            })

*/