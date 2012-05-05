function rad(value) {
    value += "";
    return  parseFloat(value) * ( ~value.indexOf("deg") ? Math.PI/180 : 1)
}
var Matrix = $.factory({
    init: function(){
        this.xd = this.yd = 3;//d = dimensionality维度
        for(var i = 0, n = this.xd * this.yd; i < n; i++){
            //Math.floor(i /3) 决定行号 x轴
            //i % 3 决定列号 y 轴
            this[ Math.floor(i / this.xd) +","+(i % this.yd) ] = arguments[i] || 0;
        }
    },
    //http://msdn.microsoft.com/zh-tw/library/system.windows.media.matrix.append.aspx
    //这个运算等于将这个 Matrix 结构乘以 matrix 参数。
    //在複合转换中，个别转换的顺序非常重要。 例如，如果先旋转、再缩放，然后平移，则取得的结果会与先平移、再旋转，
    //然后缩放的结果不同。 顺序很重要的原因之一是，旋转和缩放这类的转换是根据座标系统的原点来进行。
    //缩放中心位于原点的对象所产生的结果，与缩放已从原点移开的对象不同。 同样地，
    //旋转中心位于原点的对象所产生的结果，也会与旋转已从原点移开的对象不同。
    multiply: function(matrix){
        var tmp = new Matrix();
        var n = Math.max(this.xd, this.yd)
        for(var key in tmp){
            if(~key.indexOf(",")){
                var r = key.charAt(0), c = key.charAt(2)//肯定不会大于10D的情况
                for(var i = 0; i < n; i++ ){
                    tmp[key] += ( (this[r+","+i] || 0) * (matrix[i+","+c] || 0))//X轴*Y轴
                }
            }
        }
        for( key in tmp){
            if(~key.indexOf(",")){
                this[key] = tmp[key]
            }
        }
        return this
    },
    //http://www.w3.org/TR/css3-2d-transforms/
    translate: function(tx, ty) {
        tx = parseFloat(tx) || 0;//沿 x 轴平移每个点的距离。
        ty = parseFloat(ty) || 0;//沿 y 轴平移每个点的距离。
        var m = new Matrix(1 ,0 ,tx, 0, 1, ty, 0, 0, 1);
        this.multiply(m)
    },
    translateX : function(tx) {
        this.translate(tx, 0)
    },
    translateY : function(ty) {
        this.translate(0, ty)
    },
    scale: function(sx, sy){
        sx = isFinite(sx) ? parseFloat(sx) : 1 ;
        sy = isFinite(sy) ? parseFloat(sy) : 1 ;
        var m = new Matrix(sx, 0, 0, 0, sy, 0, 0, 0, 1);
        this.multiply(m)
    },
    scaleX : function(sx) {
        this.scale(sx, 1)
    },
    scaleY : function(sy) {
        this.scale(1, sy)
    },
    rotate: function(angle){
        angle = rad(angle)
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var m = new Matrix(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
        this.multiply(m)
    },
    skew : function(ax, ay){
        var m = new Matrix(1, Math.tan( rad(ax) ), 0, Math.tan( rad(ay) ), 1, 0, 0, 0, 1);
    },
    skewX : function(ax){
        this.skew(ax, "0");
    },
    skewY : function(ay){
        this.skew("0", ay);
    },
    array: function(){//变成
        return [this["0,0"],this["1,1"],this["1,0"],this["0,1"],this["2,0"],this["2,2"]]
    },
    toString: function(){
        return  "matrix("+this.array()+")";
    },
    decompose: function(){
        //http://help.adobe.com/zh_CN/FlashPlatform/reference/actionscript/3/flash/geom/Matrix.html
        //只能用于transform 2D http://www.w3.org/TR/css3-2d-transforms/
        //参考自http://www.createjs.com/Docs/EaselJS/Matrix2D.js.html p.decompose方法 
        var object = {}//添加FLASH表示法与CSS3最原始的表示法
        this.a = this["0,0"]
        this.d = this["1,1"]
        this.c = this["1,0"]
        this.b = this["0,1"]
        object.x = this.tx = this["2,0"]
        object.y = this.ty = this["2,2"]
        
        object.scaleX = Math.sqrt(this.a * this.a + this.b * this.b);
        object.scaleY = Math.sqrt(this.c * this.c + this.d * this.d);

        var skewX = Math.atan2(-this.c, this.d);
        var skewY = Math.atan2(this.b, this.a);

        if (skewX == skewY) {
            object.rotation = skewY/Matrix2D.DEG_TO_RAD;
            if (this.a < 0 && this.d >= 0) {
                object.rotation += (object.rotation <= 0) ? 180 : -180;
            }
            object.skewX = object.skewY = 0;
        } else {
            object.skewX = skewX/Matrix2D.DEG_TO_RAD;
            object.skewY = skewY/Matrix2D.DEG_TO_RAD;
        }
        return object;
    }
});
Matrix2D.DEG_TO_RAD = Math.PI/180;
//http://css3.bradshawenterprises.com/
//http://stackoverflow.com/questions/5051451/javascript-ie-rotation-transform-maths
//测试数据见http://course.bnu.edu.cn/course/jswl/files/class/skja/ppt0102.pdf
// a为┌         ┐
//    │ 2  8  10│
//    │ 11 3  7 │
//    │ 6  9  4 │
//    └         ┘
// b为┌         ┐
//    │ 12 9  4 │
//    │ 5  2 21 │
//    │ 8  4  6 │
//    └         ┘
// a*b为┌            ┐
//      │ 144 74 236 │
//      │ 203 133 149│
//      │ 149 88  237│
//      └            ┘

