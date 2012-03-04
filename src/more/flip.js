$.define("flip", "fx", function(){
    var flip = {
        begin: function() {
            var hyaline =  (!"1"[0] ? "#123456" : "transparent")//透明色，IE6不支持透明，因此要使用滤镜hack一下
            return {//初始化属性
                hyaline: hyaline,
                backgroundColor: hyaline,
                fontSize:0,
                lineHeight:0,
                borderTopWidth:0,
                borderLeftWidth:0,
                borderRightWidth:0,
                borderBottomWidth:0,
                borderTopColor: hyaline,
                borderBottomColor: hyaline,
                borderLeftColor: hyaline,
                borderRightColor: hyaline,
                background: "none",
                borderStyle: 'solid',
                height:0,
                width:0
            };
        },
        horizontal: function( obj ){
            var waist = obj.height /100 *25;
            var begin = flip.begin();
            begin.width= obj.width;//将初始属性克隆成三份，并逐渐改变它们
            return {
                hyaline: begin.hyaline,
                begin: begin,
                middle: {
                    borderTopWidth: 0,
                    borderBottomWidth: 0,
                    borderLeftWidth: waist,
                    borderRightWidth: waist,
                    borderTopColor: "#999",
                    borderBottomColor:"#999",
                    top:  obj.top + (obj.height/2),//向上移
                    left: obj.left - waist//向左移
                },
                end: {
                    borderBottomWidth: 0,
                    borderTopWidth: 0,
                    borderLeftWidth: 0,
                    borderRightWidth: 0,
                    borderTopColor: begin.hyaline,
                    borderBottomColor: begin.hyaline,
                    top: obj.top,
                    left: obj.left
                }
            };
        },
        vertical:  function ( obj ) {
            var waist = obj.height/100 * 25;
            var begin =  flip.begin();
            begin.height = obj.height;
            return {
                hyaline: begin.hyaline,
                begin : begin,
                middle : {
                    borderTopWidth: waist,
                    borderBottomWidth: waist,
                    borderLeftWidth: 0,
                    borderRightWidth: 0,
                    borderLeftColor: "#999",
                    borderRightColor: "#999",
                    top: obj.top-waist,
                    left: obj.left+ (obj.width/2)
                },
                end: {
                    borderTopWidth: 0,
                    borderLeftWidth: 0,
                    borderRightWidth: 0,
                    borderBottomWidth: 0,
                    borderLeftColor: begin.hyaline,
                    borderRightColor: begin.hyaline,
                    top: obj.top,
                    left: obj.left
                }
            };
        }
    }
    var dirMap = {
        t: "Top",
        b: "Bottom",
        l: "Left",
        r: "Right"
    }
    function getDirOption( obj, dir, orientation ){
        var result = flip[ orientation ]( obj ), arr = ["begin", "end"]
        dir.replace( $.rword, function( who ){
            var which = arr.shift();
            result[ which ]["border"+ who + "Width"] = obj[ orientation === "horizontal" ? "height" : "width"];
            result[ which ]["border"+ who + "Color"] = obj[which + "Bgc"];
        });
        return result;
    }
    //hash 中的主要参数 beginBgc endBgc before after frame, direction
    $.fn.flip = function(duration, hash){//并不是原对象进行动画,而是其克隆进行动画
        var props =  hash || duration || {}
        if(typeof duration === "function"){// fx(obj fn)
            hash = duration;               // fx(obj, 500, fn)
            duration = 500;
        }
        if(typeof hash === "function"){   //  fx(obj, num, fn)
            props.after = hash;           //  fx(obj, num, {after: fn})
        }
        var direction = props.direction || "tb";
        direction = dirMap[ direction.charAt(0) ] + ","+dirMap[ direction.charAt(1) ]
        duration = Math.floor( duration / 2 );
        var orientation = direction.charAt(1) === "o" ?  "horizontal" : "vertical" ;
        return this.each(function(){
            var $this = $(this);
            if($this.data('fliping')){
                return false;
            }
            $this.data("fliping", 1);
            //取得原有对象中的有用的信息
            var message = {
                width: $this.width(),
                height: $this.height(),
                beginBgc: hash.beginBgc || $this.css("bgc"),
                endBgc: hash.endBgc || "#999",
                top: $this.offset().top,
                left: $this.offset().left
            };
            //添加替身
            var $clone = $this.css("visibility","hidden")
            .clone(true)
            .data('fliping',1)
            .appendTo("body")
            .html("")
            .css({
                visibility: "visible",
                position: "absolute",
                left: message.left,
                top: message.top,
                margin: 0,
                zIndex: 9999,
                boxShadow:"0px 0px 0px #000"
            });
            var dirOption = getDirOption( message, direction, orientation);
            if(!"1"[0]){//fuck IE6
                dirOption.begin.filter = "chroma(color=" + dirOption.hyaline + ")";
            }
            var middle = dirOption.middle, end = dirOption.end, self = this;
            //绑定回调
            middle.before = function( clone, prop, fx ){
                if(typeof props.before === "function" ){
                    props.before.call( self, clone, prop, fx );
                }
            }
            middle.frame = end.frame = function( clone, prop, fx ){
                if(typeof props.frame === "function" ){
                    props.frame.call( self, clone, prop, fx );
                }
            }
            end.after = function( clone, prop, fx){
                $this.css("visibility", "visible").removeData('fliping');
                $clone.remove();
                if(typeof props.after === "function" ){
                    props.after.call( self, clone, prop, fx );
                }
            }
            $clone.css( dirOption.begin ).fx( duration, middle).fx( duration, dirOption.end );
        })
    }
})
// 2012.2.19 发布