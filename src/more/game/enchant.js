game.Event = $.factory({
    init: function(type){
        this.type = type;
        this.target = null;
        this.x = 0;

        this.y = 0;

        this.localX = 0;
        this.localY = 0;
    },
     _initPosition: function(pageX, pageY) {
        this.x = this.localX = (pageX - game._pageX) / game.scale;
        this.y = this.localY = (pageY - game._pageY) / game.scale;
    }
})
