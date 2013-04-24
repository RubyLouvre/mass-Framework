var toBitmapURL = (function ($fromCharCode, FF, MAX_LENGTH) {
    
    /**
     * (C) WebReflection - Mit Style License
     *      given a canvas, returns BMP 32bit with alpha channel data uri representation
     *
     * Why ?
     *      because many canvas implementation may not support toDataURL
     *      ( HTMLCanvasElement.prototype.toDataURL || HTMLCanvasElement.prototype.toDataURL = function () {return toBitmapURL(this)}; )
     *
     * I mean ... Why BMP 32 rather than PNG ?!!!
     *      because JavaScript size matter as well as computation time.
     *      PNG requires DEFLATE compression and multiple pass over the data.
     *      BMP is straight forward
     *
     * Fine, but which browser supports BMP in 2011 ?
     *      pretty much all of them, except some version of Chrome. Safari and Webkit are fine as well as Firefox, Opera and of course IE
     *
     * Sure, but why on earth should I use BMP as data uri ?
     *      this method is about creation of canvas snapshots. If toDataURL is not presemt
     *      there is still a way to create a portable, NOT COMPRESSED, bitmap image
     *      that could be optionally sent to the server and at that point converted into proper PNG
     *      Bitmap format was fast enough to parse (on mobile as well) and it was RGBA compatible plus widely supported.
     *
     * I think this was a wasteof time
     *      well, if you still think so, I can say that was actually fun to create a proper
     *      32 bit image format via JavaScript on the fly.
     *      However, please share your own toDataURL version with full mime type support in JavaScript :P
     *      Moreover, have you ever tried to use native toDataURL("image/bmp") ?
     *      Most likely you gonna have max 24bit bitmap with all alpha channel info lost.
     */
    
    function fromCharCode(code) {
        for (var
            result = [],
            i = 0,
            length = code.length;
            i < length; i += MAX_LENGTH
        ) {
            result.push($fromCharCode.apply(null, code.slice(i, i + MAX_LENGTH)));
        }
        return result.join("");
    }
    
    function numberToInvertedBytes(number) {
        return [
            number & FF,
            (number >> 8) & FF,
            (number >> 16) & FF,
            (number >> 24) & FF
        ];
    }
    
    function swapAndInvertY(data, width, height) {
        /**
         * Bitmap pixels array is stored "pseudo inverted"
         * RGBA => BGRA (read as Alpha + RGB)
         * in few words this canvas pixels array
         * [
         *   0, 1,  2,  3,  4,  5,  6,  7,
         *   8, 9, 10, 11, 12, 13, 14, 15
         * ]
         * is stored as bitmap one like
         * [
         *   10, 9, 8, 11, 14, 13, 12, 15,
         *   2, 1, 0,  3,  6,  5,  4,  7
         * ]
         */
        for (var
            i, j, x0, x1, y0, y1,
            sizeX = 4 * width,
            sizeY = height - 1,
            result = [];
            height--;
        ) {
            y0 = sizeX * (sizeY - height);
            y1 = sizeX * height;
            for (i = 0; i < width; i++) {
                j = i * 4;
                x0 = y0 + j;
                x1 = y1 + j;
                result[x0] = data[x1 + 2];
                result[x0 + 1] = data[x1 + 1];
                result[x0 + 2] = data[x1];
                result[x0 + 3] = data[x1 + 3];
            }
        }
        return result;
    }
    
    function toBitmapURL(canvas) {
        var
            width = canvas.width,
            height = canvas.height,
            header = [].concat(
                numberToInvertedBytes(width),
                numberToInvertedBytes(height),
                1, 0,
                32, 0,
                3, 0, 0, 0,
                numberToInvertedBytes(
                    width * height * 4
                ),
                19, 11, 0, 0,
                19, 11, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, FF, 0,
                0, FF, 0, 0,
                FF, 0, 0, 0,
                0, 0, 0, FF,
                32, 110, 105, 87
            ),
            data = swapAndInvertY(
                canvas.getContext("2d").getImageData(
                    0, 0, width, height
                ).data,
                width,
                height
            ),
            offset
        ;
        header = numberToInvertedBytes(header.length).concat(header);
        offset = 14 + header.length;
        return "data:image/bmp;base64," + btoa(fromCharCode(
            [66, 77].concat(
                numberToInvertedBytes(offset + data.length),
                0, 0, 0, 0,
                numberToInvertedBytes(offset),
                header,
                data
            )
        ));
    }
    
    return toBitmapURL;
    
}(String.fromCharCode, 0xFF, 0x7FFF));