$.define("menu","more/uibase,fx,event,attr",function(Widget){
    var addItem = function( parent, obj ){
        var item = $("<div class='menu_item'/>")
        for(var i in obj){
            item[i] && item[i]( obj[i] );
        }
        return item.appendTo( parent );
    }
    var addMenu = function( parent, cls ){
        return $("<div />").appendTo( parent  ).addClass(cls)
    }
    var addItems = function( parent, els ){
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
        data:[],
        hover_class: "hover",
        direction: "vertical"
    }
    function init( ui, hash ){
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        delete ui.data;//结构过于庞大，没有必要储存它
        ui.target = addMenu( ui.parent,"mass_menu" );
        addItems(ui.target , hash.data );
        var hover = ui.hover_class;
        if(ui.direction == "horizontal"){
            var first = ui.target.find(">.menu_item").css("float","left");
            first.find("> .sub_menu").css({
                top: first.innerHeight(),
                left: 0,//(parseFloat(first.css("border-left-width")) + parseFloat(first.css("padding-left"))) * -1,
                zIndex:~~first.css("z-index")+1
            })
        }
        ui.target.delegate(".menu_item", "mouseover", function(){
            ui.target.find("."+hover).removeClass(hover);
            $(this).addClass(hover).find("> .sub_menu").show(600);
            ui.target.find(".sub_menu:visible:not(:has(."+hover+"))").hide()
        });
    }

    $.fn.menu = Widget.create("tabs", Widget.Class, init )
})
    /*
                .mass_menu , .sub_menu{
                width:130px;
                -moz-box-shadow:0 0 10px #06c;
                -webkit-box-shadow:0 0 10px #06c;
                box-shadow:0 0 10px #06c;
            }
            .menu_item{
                width:120px;
                padding-left:10px;
                height:24px;
                line-height:24px;
                border-bottom:1px solid #fff;
                background:#0088aa;
                color:#fff;
            }
            .hover {
                background:#f36100!important;
                color:black;
            }
          $.require("ready,more/menu",function( api ){
                $("body").menu({
                    data:[
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