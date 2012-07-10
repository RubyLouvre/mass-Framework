$.define("css_more","css",function(){
    //本模块用于处理更多样式兼容问题
    var adapter = $.cssAdapter
    var getter = adapter[ "_default:get" ];
    /*
 <style>
#foo {
  background-position: 10px 20px;
}
</style>

<div id="foo"></div>

<script>
var foo = jQuery( "#foo" );
alert( foo.css( "background-position" ) ); // 10px 20px
foo.css( "background-color", "#FFF" );
alert( foo.css( "background-position" ) ); // 0% 0% !!!
</script>
    https://github.com/jquery/jquery/pull/748/files#r884254
*/
    var rmultiplebg = /,\s?/
    adapter["backgroundPosition:get"] = function(elem, name){
        var ret = getter( elem, "backgroundPosition" ),posX, posY, glue, i = 0, len;
        if ( ret !== "0% 0%" || !window.attachEvent ) {
            return ret;
        }
        ret = [];
        posX = curCSS( elem, "backgroundPositionX" );
        posY = curCSS( elem, "backgroundPositionY" );
        glue = rmultiplebg.exec( posX ) || [""];
        posX = posX.split( rmultiplebg );
        posY = posY.split( rmultiplebg );
        for ( len = posX.length; i < len; ++i ) {
            ret[i] = [posX[i], posY[i]].join(" ");
        }
        return ret.join(glue[0]);
    }
})