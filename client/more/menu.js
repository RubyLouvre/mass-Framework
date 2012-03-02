$.define("menu","fx,event,attr",function(){

    var addItem = function(parent , obj){
        var item = $("<div class='menu_item'/>").html(obj.html).addClass(obj.cls)
        return item.appendTo( parent  )
    }
    var addMenu = function(parent, cls){
        return $("<div />").appendTo( parent  ).addClass(cls)
    }
    var addItems = function(parent, els){
        //   var _d = d;
        for(var i = 0, el; el = els[i++];){
            var item = addItem(parent, el);
            if(el.sub && el.sub.length){
                item.css( "position","relative");
                var p = addMenu(item).css({
                    position:"absolute",
                    display:"none",
                    top:  0,
                    left: item.width()
                }).addClass("sub_menu")
            
                p.css( "display","none")
               
                addItems( p , el.sub)
            }

        }
    }
    var defaults = {};
    function init( ui, hash ){
  
        ui.setOptions(defaults , typeof hash === "object" ? hash : {});
        ui.target = addMenu(ui.parent,"mass_menu")
        addItems(ui.target , hash.menu );
        ui.target.delegate(".menu_item","mouseover",function(){
            console.log("ddddddddddddddd")
            $(this).find(".sub_menu").show()
        }).delegate(".menu_item","mouseout",function(){
            $(this).find(".sub_menu").hide()
        })

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