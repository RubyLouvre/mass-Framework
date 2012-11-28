define("menu",["$node","$event","$attr","$css"],function($){

    var defaults = {
        data:[],
        flag_close: false,
        hover_class: "hover",
        item_class: "mass_menu_item",
        main_class: "mass_main_menu",
        sub_class: "mass_sub_menu",
        direction: "vertical"
    }
    //IE678中，如果鼠标离开菜单想进入main_menu，它会被认为mouseleave了菜单，需要延迟一下
    var timeout = $["@bind"] == "attachEvent" ? 100 : 17;
    var Menu = $.factory({
        init: function(el, opts){
            var ui = this;
            this.setOptions(defaults ,  opts || {});
            var target = ui.element = $(el);
            var hoverClass = ui.hover_class;
            var mainClass = ui.main_class;
            var itemClass = ui.item_class;
            var menu = ui.addMenu(target, mainClass); //添加主菜单的容器
            ui.addItems(menu, opts.data || [] );//添加主菜单与多级子菜单
            delete ui.data;//结构过于庞大，没有必要储存它
            if(this.direction == "horizontal"){
                var first =  target.find(">."+itemClass).css("float","left");
                first.find("> ."+ui.sub_class).css({
                    top: first.innerHeight(),
                    left: 0,
                    zIndex:~~first.css("z-index")+1
                })
            }
            //绑定hover事件
            target.delegate("."+itemClass, "mouseover", function(){
                $(this).addClass(hoverClass)
                .siblings().removeClass(hoverClass) //移除其兄弟的hover效果
                .find("."+hoverClass).removeClass(hoverClass);//移除其兄弟的后代的hover效果
            });
            menu.mouseleave(function(){
                ui.flag_close = true;
                setTimeout(function(){
                    if( ui.flag_close ){//fix IE
                        menu.find("."+itemClass).removeClass(hoverClass)
                    }
                },timeout)
             
            }).mouseenter(function(){
                ui.flag_close = false;
            })
        //不要绑在body上，有时body的高度只有几十px，没有占满浏览器的视窗
        //            $(document).click(function(){
        //                if( ui.flag_close )  {
        //                    $("."+itemClass).removeClass(hoverClass)
        //                }
        //            });
        },
        addMenu : function( parent, cls ){
            return $("<div />").appendTo( parent ).addClass(cls)
        },
        addItems: function( parent, objects ){
            for(var i = 0, object; object = objects[i++];){
                var item = this.addItem(parent, object );
                if(object.sub && object.sub.length){
                    item.css( "position","relative");
                    var sub_menu = this.addMenu( item ).css({
                        position:"absolute",
                        top:  0,
                        left: item.outerWidth()
                    }).addClass( this.sub_class )
                    this.addItems( sub_menu, object.sub );
                }
            }
            return this;
        },
        addItem: function( parent, opts){
            var item = $("<div/>").addClass( this.item_class );
            for(var i in opts){
                if(typeof item[ i ] === "function"){
                    item[ i ]( opts[ i ] );
                }
            }
            return item.appendTo( parent );
        }
    });
    $.fn.menu = function (option) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('menu')
            , options = typeof option == 'object' && option
            if (!data) $this.data('menu', (data = new Menu(this, options)))
            if (typeof option == 'string')
                data[option] &&  data[option]()
        })
    }
//参数 可以是任何类型的场景， 你要么借助约定 要么借助接口 要么借助防御性代码
/*     jquery 菜单 http://apycom.com/# http://pupunzi.open-lab.com/mb-jquery-components/mb-_menu/
        http://users.tpg.com.au/j_birch/plugins/superfish/# http://www.dynamicdrive.com/dynamicindex1/ddsmoothmenu.htm
        http://www.filamentgroup.com/examples/menus/ipod.php#</body>
        https://github.com/bwsewell/tablecloth

     * <style>
            .mass_main_menu , .mass_sub_menu{
                width:130px;
                -moz-box-shadow:0 0 5px #06c;
                -webkit-box-shadow:0 0 5px #06c;
                box-shadow:0 0 5px #06c;
            }

            .mass_menu_item{
                width:120px;
                padding-left:10px;
                height:24px;
                line-height:24px;
                border-bottom:1px solid #fff;
                background:#0088aa;
                color:#fff;
            }
            .hover {
                background:#f36100;
                color:black;
            }
            .mass_sub_menu{
                display:none;
            }
            .hover > .mass_sub_menu{
                display:block
            }
        </style>
       <script>
    $.require("ready,menu",function(){
    var data = [
    {
        html:"菜单1",
        sub:[
        {
            html:"菜单1-1"
        },

        {
            html:"菜单1-2",
            sub:[
            {
                html:"菜单3-1"
            },

            {
                html:"菜单3-2"
            }
            ]
        }
        ]
    },
    {
        html:"菜单2",
        sub:[
        {
            html:"菜单2-1"
        },

        {
            html:"菜单2-2"
        }
        ]
        },

        {
        html:"菜单3"
    },

    {
        html:"菜单4"
    }
    ]
    $("body").menu({
        data: data
    });
})
       </script>
     */

})
