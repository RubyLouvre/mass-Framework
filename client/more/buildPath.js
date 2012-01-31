$.define("buildPath",function(){

    //javascript获取直线路径算法
    //http://www.kinogam.com/?p=377
    return function(cx, cy, x, y) {
        var deltaCol = x - cx;
        var deltaRow = y - cy;
        var xstep = deltaCol > 0 ? 1 : -1;
        var ystep = deltaRow > 0 ? 1 : -1;
        deltaRow = Math.abs(deltaRow);
        deltaCol = Math.abs(deltaCol);
        var maxlen;

        var path = new Array();
        var currentX = cx;
        var currentY = cy;
        if (deltaRow > deltaCol) {
            maxlen = deltaRow;
            var k = deltaRow / deltaCol;
            path.push({
                x: currentX,
                y: currentY
            });
            for (var i = 0; i < maxlen; i++) {
                if (currentX == x && currentY == y) {
                    path.push({
                        x: currentX,
                        y: currentY
                    });
                    break;
                }
                currentY = currentY + ystep;
                deltaRow--;
                if (deltaRow / deltaCol < k) {
                    currentX = currentX + xstep;
                    deltaCol--;
                }
                path.push({
                    x: currentX,
                    y: currentY
                });
            }
        }
        else {
            maxlen = deltaCol;
            var k = deltaCol / deltaRow;
            path.push({
                x: currentX,
                y: currentY
            });
            for (var i = 0; i < maxlen; i++) {
                if (currentX == x && currentY == y) {
                    path.push({
                        x: currentX,
                        y: currentY
                    });
                    break;
                }
                currentX = currentX + xstep;
                deltaCol--;
                if (deltaCol / deltaRow < k) {
                    currentY = currentY + ystep;
                    deltaRow--;
                }
                path.push({
                    x: currentX,
                    y: currentY
                });
            }

        }
        return path;
    }

})