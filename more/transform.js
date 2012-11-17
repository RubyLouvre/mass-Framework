    //http://extremelysatisfactorytotalitarianism.com/blog/?p=1002
    //http://someguynameddylan.com/lab/transform-origin-in-internet-explorer.php
    //优化HTML5应用的体验细节，例如全屏的处理与支持，横屏的响应，图形缩放的流畅性和不失真，点触的响应与拖曳，Websocket的完善
    //关于JavaScript中计算精度丢失的问题 http://rockyee.iteye.com/blog/891538
    function toFixed(d){
        return  d > -0.0000001 && d < 0.0000001 ? 0 : /e/.test(d+"") ? d.toFixed(7) :  d;
    }
    function toFloat(d, x){
        return isFinite(d) ? d: parseFloat(d) || x
    }
    //http://zh.wikipedia.org/wiki/%E7%9F%A9%E9%98%B5
    //http://help.dottoro.com/lcebdggm.php
    var Matrix2D = $.factory({
        init: function(){
            this.set.apply(this, arguments);
        },
        cross: function(a, b, c, d, tx, ty) {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            this.a  = toFixed(a*a1+b*c1);
            this.b  = toFixed(a*b1+b*d1);
            this.c  = toFixed(c*a1+d*c1);
            this.d  = toFixed(c*b1+d*d1);
            this.tx = toFixed(tx*a1+ty*c1+this.tx);
            this.ty = toFixed(tx*b1+ty*d1+this.ty);
            return this;
        },
        rotate: function( radian ) {
            var cos = Math.cos(radian);
            var sin = Math.sin(radian);
            return this.cross(cos,  sin,  -sin, cos, 0, 0)
        },
        skew: function(sx, sy) {
            return this.cross(1, Math.tan( sy ), Math.tan( sx ), 1, 0, 0);
        },
        skewX: function(radian){
            return this.skew(radian, 0);
        },
        skewY: function(radian){
            return this.skew(0, radian);
        },
        scale: function(x, y) {
            return this.cross( toFloat(x, 1) ,0, 0, toFloat(y, 1), 0, 0)
        },
        scaleX: function(x){
            return this.scale(x ,1);
        },
        scaleY: function(y){
            return this.scale(1 ,y);
        },
        translate : function(x, y) {
            return this.cross(1, 0, 0, 1, toFloat(x, 0), toFloat(y, 0))
        },
        translateX: function(x) {
            return this.translate(x, 0);
        },
        translateY: function(y) {
            return this.translate(0, y);
        },
        toString: function(){
            return "matrix("+this.get()+")";
        },
        get: function(){
            return [this.a,this.b,this.c,this.d,this.tx,this.ty];
        },
        set: function(a, b, c, d, tx, ty){
            this.a = a * 1;
            this.b = b * 1 || 0;
            this.c = c * 1 || 0;
            this.d = d * 1;
            this.tx = tx * 1 || 0;
            this.ty = ty * 1 || 0;
            return this;
        },
        matrix:function(a, b, c, d, tx, ty){
            return this.cross(a, b, c, d, toFloat(tx, 0), toFloat(ty, 0))
        },
        decompose: function() {
            //分解原始数值,返回一个包含translateX,translateY,scale,skewX,rotate的对象
            //https://github.com/louisremi/jquery.transform.js/blob/master/jquery.transform2d.js
            //http://http://mxr.mozilla.org/mozilla-central/source/layout/style/nsStyleAnimation.cpp
            var scaleX, scaleY, skew, A = this.a, B = this.b,C = this.c,D = this.d ;
            if ( A * D - B * C ) {
                // step (3)
                scaleX = Math.sqrt( A * A + B * B );
                A /= scaleX;
                B /= scaleX;
                // step (4)
                skew = A * C + B * D;
                C -= A * skew;
                D -= B * skew;
                // step (5)
                scaleY = Math.sqrt( C * C + D * D );
                C /= scaleY;
                D /= scaleY;
                skew /= scaleY;
                // step (6)
                if ( A * D < B * C ) {
                    A = -A;
                    B = -B;
                    skew = -skew;
                    scaleX = -scaleX;
                }
            } else {
                scaleX = scaleY = skew = 0;
            }
            return [
            ["translate", [+this.tx, +this.ty]],
            ["rotate", Math.atan2(B, A)],
            ["skewX", Math.atan(skew)],
            ["scale", [scaleX, scaleY]]]
        }
    });

    $.Matrix2D = Matrix2D
    var getter = $.cssAdapter["_default:get"], RECT = "getBoundingClientRect",
    //支持情况 ff3.5 chrome ie9 pp6 opara10.5 safari3.1
    cssTransfrom = $.support.transform = $.cssName("transform");
    if( cssTransfrom ){
        adapter[cssTransfrom + ":set"] = function(node, name, value){
            if(value.indexOf("matrix")!== -1 && cssTransfrom === "MozTransform"){
                value = value.replace(/([\d.-]+)\s*,\s*([\d.-]+)\s*\)/,"$1px, $2px)")
            }
            node.style[name] = value;
            var matrix = $._data( node, "matrix" ) || new Matrix2D();
            matrix.set.apply(matrix, getter(node, cssTransfrom).match(/[-+.e\d]+/g).map(function(d){
                return toFixed(d*1)
            }));
            $._data(node, "matrix", matrix );
        }
    }