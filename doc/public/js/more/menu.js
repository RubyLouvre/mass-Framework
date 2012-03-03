$.define("menu","fx,event,attr",function(){

    var addItem = function(parent, obj){
        var item = $("<div class='menu_item'/>")
        for(var i in obj){
            item[i] && item[i](obj[i])
        }
        return item.appendTo( parent  )
    }
    var addMenu = function(parent, cls ){
        return $("<div />").appendTo( parent  ).addClass(cls)
    }
    var addItems = function(parent, els ){
       
        for(var i = 0, el; el = els[i++];){
            var item = addItem(parent, el );
            if(el.sub && el.sub.length){
                item.css( "position","relative");
                var sub_menu = addMenu(item).css({
                    position:"absolute",
                    display:"none",
                    top:  (parseFloat(item.css("border-top-width")) + parseFloat(item.css("padding-top"))) * -1,
                    left: item.innerWidth()
                }).addClass("sub_menu")

                addItems( sub_menu , el.sub );
            }

        }
    }
    var defaults = {
        hover_class: "hover"
    }
    function init( ui, hash ){
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        delete ui.menu;//结构过于庞大，没有必要储存它
        ui.target = addMenu(ui.parent,"main_menu");
        var ID = "mass_menu_"+(new Date - 0);
        ui.target.attr("id", ID );
        ui.ID = ID;
        addItems(ui.target , hash.menu );
        var hover = ui.hover_class;
        ui.target.delegate(".menu_item", "mouseover", function(){
            ui.target.find("."+hover).removeClass(hover);
            $(this).addClass(hover).find("> .sub_menu").show(500);
            ui.target.find(".sub_menu:visible:not(:has(."+hover+"))").hide()
        });
    }
    var Menu = $.factory({
        init: function( parent ){
            this.parent = parent;
        },
        invoke: function(method, value){
            if(typeof this[method] === "function"){
                return this[method].apply( this, [].slice.call(arguments,1) );
            }else{
                this[method] = value;
            }
        },
        getID: function(){
            return this.ID;
        },
        destroy: function(){
            this.target.undelegate(".main_menu","mouseover");
            this.target.remove();
        }
    });
    $.fn.menu = function( method){
        for(var i =0 ; i < this.length; i++){
            if(this[i] && this[i].nodeType === 1){
                var menu = $.data(this[i],"_init_menu")
                if(! menu  ){
                    menu = new Menu(this[i]);
                    init(menu, method);
                    $.data(this[i],"_init_menu", menu);
                }else if(typeof method == "string"){
                    var ret = menu.invoke.apply(menu, arguments );
                    if(ret !== void 0){
                        return ret;
                    }
                }else if(method && typeof method == "object"){
                    menu.setOptions( method );
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