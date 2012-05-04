
/*******************************************************************************
 * This notice must be untouched at all times.
 *
 * CSS Sandpaper: smooths out differences between CSS implementations.
 *
 * This javascript library contains routines to implement the CSS transform,
 * box-shadow and gradient in IE.  It also provides a common syntax for other
 * browsers that support vendor-specific methods.
 *
 * Written by: Zoltan Hawryluk. Version 1.0 beta 1 completed on March 8, 2010.
 *
 * Some routines are based on code from CSS Gradients via Canvas v1.2
 * by Weston Ruter <http://weston.ruter.net/projects/css-gradients-via-canvas/>
 *
 * Requires sylvester.js by James Coglan http://sylvester.jcoglan.com/
 *
 * cssSandpaper.js v.1.0 beta 1 available at http://www.useragentman.com/
 *
 * released under the MIT License:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 ******************************************************************************/
if (!document.querySelectorAll) {
    document.querySelectorAll = cssQuery;
}

var cssSandpaper = new function(){
    var me = this;

    var styleNodes, styleSheets = new Array();

    var ruleSetRe = /[^\{]*{[^\}]*}/g;
    var ruleSplitRe = /[\{\}]/g;

    var reGradient = /gradient\([\s\S]*\)/g;
    var reHSL = /hsl\([\s\S]*\)/g;

    // This regexp from the article
    // http://james.padolsey.com/javascript/javascript-comment-removal-revisted/
    var reMultiLineComment = /\/\/.+?(?=\n|\r|$)|\/\*[\s\S]+?\*\//g;

    var reAtRule = /@[^\{\};]*;|@[^\{\};]*\{[^\}]*\}/g;

    var reFunctionSpaces = /\(\s*/g
    var reMatrixFunc = /matrix\(([^\,]+),([^\,]+),([^\,]+),([^\,]+),([^\,]+),([^\,]+)\)/g

    var ruleLists = new Array();
    var styleNode;

    var tempObj;
    var body;


    me.init = function(reinit){

        if (EventHelpers.hasPageLoadHappened(arguments) && !reinit) {
            return;
        }

        body = document.body;

        tempObj = document.createElement('div');

        getStyleSheets();

        indexRules();


        fixTransforms();
        fixBoxShadow();
        fixLinearGradients();

        fixBackgrounds();
        fixColors();
        fixOpacity();
        setClasses();
    //fixBorderRadius();

    }






    me.setTransform = function(obj, transformString){
        var property = CSS3Helpers.findProperty(obj, 'transform');

        if (property == "filter") {
            var matrix = CSS3Helpers.getTransformationMatrix(transformString);
            CSS3Helpers.setMatrixFilter(obj, matrix)
        } else if (obj.style[property] != null) {
            /*
			 * Firefox likes the matrix notation to be like this:
			 *   matrix(4.758, -0.016, -0.143, 1.459, -7.058px, 85.081px);
			 * All others like this:
			 *   matrix(4.758, -0.016, -0.143, 1.459, -7.058, 85.081);
			 * (Note the missing px strings at the end of the last two parameters)
			 */



            var agentTransformString = transformString;
            if (property == "MozTransform") {
                agentTransformString = agentTransformString.replace(reMatrixFunc, 'matrix($1, $2, $3, $4, $5px, $6px)');
            }

            obj.style[property] = agentTransformString;
        }
    }

    function fixTransforms(){

        var transformRules = getRuleList('-sand-transform').values;
        var property = CSS3Helpers.findProperty(document.body, 'transform');


        for (var i in transformRules) {
            var rule = transformRules[i];
            var nodes = document.querySelectorAll(rule.selector);

            for (var j = 0; j < nodes.length; j++) {
                me.setTransform(nodes[j], rule.value)
            }

        }

    }



    me.getProperties = function (obj, objName)
    {
        var result = ""

        if (!obj) {
            return result;
        }

        for (var i in obj)
        {
            try {
                result += objName + "." + i.toString() + " = " + obj[i] + ", ";
            } catch (ex) {
            // nothing
            }
        }
        return result
    }




}





var MatrixGenerator = new function(){
    var me = this;
    var reUnit = /[a-z]+$/;
    me.identity = $M([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);


    function degreesToRadians(degrees){
        return (degrees - 360) * Math.PI / 180;
    }

    function getRadianScalar(angleStr){

        var num = parseFloat(angleStr);
        var unit = angleStr.match(reUnit);


        if (angleStr.trim() == '0') {
            num = 0;
            unit = 'rad';
        }

        if (unit.length != 1 || num == 0) {
            return 0;
        }


        unit = unit[0];


        var rad;
        switch (unit) {
            case "deg":
                rad = degreesToRadians(num);
                break;
            case "rad":
                rad = num;
                break;
            default:
                throw "Not an angle: " + angleStr;
        }
        return rad;
    }

    me.prettyPrint = function(m){
        return StringHelpers.sprintf('| %s %s %s | - | %s %s %s | - |%s %s %s|', m.e(1, 1), m.e(1, 2), m.e(1, 3), m.e(2, 1), m.e(2, 2), m.e(2, 3), m.e(3, 1), m.e(3, 2), m.e(3, 3))
    }

    me.rotate = function(angleStr){
        var num = getRadianScalar(angleStr);
        return Matrix.RotationZ(num);
    }

    me.scale = function(sx, sy){
        sx = parseFloat(sx)

        if (!sy) {
            sy = sx;
        } else {
            sy = parseFloat(sy)
        }


        return $M([[sx, 0, 0], [0, sy, 0], [0, 0, 1]]);
    }

    me.scaleX = function(sx){
        return me.scale(sx, 1);
    }

    me.scaleY = function(sy){
        return me.scale(1, sy);
    }

    me.skew = function(ax, ay){
        var xRad = getRadianScalar(ax);
        var yRad;

        if (ay != null) {
            yRad = getRadianScalar(ay)
        } else {
            yRad = xRad
        }

        if (xRad != null && yRad != null) {

            return $M([[1, Math.tan(xRad), 0], [Math.tan(yRad), 1, 0], [0, 0, 1]]);
        } else {
            return null;
        }
    }

    me.skewX = function(ax){

        return me.skew(ax, "0");
    }

    me.skewY = function(ay){
        return me.skew("0", ay);
    }

    me.translate = function(tx, ty){

        var TX = parseInt(tx);
        var TY = parseInt(ty)

        //jslog.debug(StringHelpers.sprintf('translate %f %f', TX, TY));

        return $M([[1, 0, TX], [0, 1, TY], [0, 0, 1]]);
    }

    me.translateX = function(tx){
        return me.translate(tx, 0);
    }

    me.translateY = function(ty){
        return me.translate(0, ty);
    }


    me.matrix = function(a, b, c, d, e, f){

        // for now, e and f are ignored
        return $M([[a, c, parseInt(e)], [b, d, parseInt(f)], [0, 0, 1]])
    }
}

var CSS3Helpers = new function(){
    var me = this;


    var reTransformListSplitter = /[a-zA-Z]+\([^\)]*\)\s*/g;

    var reLeftBracket = /\(/g;
    var reRightBracket = /\)/g;
    var reComma = /,/g;

    var reSpaces = /\s+/g

    var reFilterNameSplitter = /progid:([^\(]*)/g;

    var reLinearGradient

    var canvas;

    var cache = new Array();


    me.supports = function(cssProperty){
        if (CSS3Helpers.findProperty(document.body, cssProperty) != null) {
            return true;
        } else {
            return false;
        }
    }



    me.getTransformationMatrix = function(CSS3TransformProperty, doThrowIfError){

        var transforms = CSS3TransformProperty.match(reTransformListSplitter);

        /*
		 * Do a check here to see if there is anything in the transformation
		 * besides legit transforms
		 */
        if (doThrowIfError) {
            var checkString = transforms.join(" ").replace(/\s*/g, ' ');
            var normalizedCSSProp = CSS3TransformProperty.replace(/\s*/g, ' ');

            if (checkString != normalizedCSSProp) {
                throw ("An invalid transform was given.")
            }
        }


        var resultantMatrix = MatrixGenerator.identity;

        for (var j = 0; j < transforms.length; j++) {

            var transform = transforms[j];

            transform = transform.replace(reLeftBracket, '("').replace(reComma, '", "').replace(reRightBracket, '")');


            try {
                var matrix = eval('MatrixGenerator.' + transform);


                //jslog.debug( transform + ': ' + MatrixGenerator.prettyPrint(matrix))
                resultantMatrix = resultantMatrix.x(matrix);
            }
            catch (ex) {

                if (doThrowIfError) {
                    var method = transform.split('(')[0];

                    var funcCall = transform.replace(/\"/g, '');

                    if (MatrixGenerator[method]  == undefined) {
                        throw "Error: invalid tranform function: " + funcCall;
                    } else {
                        throw "Error: Invalid or missing parameters in function call: " + funcCall;

                    }
                }
            // do nothing;
            }
        }

        return resultantMatrix;

    }




    me.setMatrixFilter = function(obj, matrix){


        if (!hasIETransformWorkaround(obj)) {
            addIETransformWorkaround(obj)
        }

        var container = obj.parentNode;
        //container.xTransform = degrees;


        filter = obj.filters.item('DXImageTransform.Microsoft.Matrix');
        //jslog.debug(MatrixGenerator.prettyPrint(matrix))
        filter.M11 = matrix.e(1, 1);
        filter.M12 = matrix.e(1, 2);
        filter.M21 = matrix.e(2, 1);
        filter.M22 = matrix.e(2, 2);


        // Now, adjust the margins of the parent object
        var offsets = me.getIEMatrixOffsets(obj, matrix, container.xOriginalWidth, container.xOriginalHeight);
        container.style.marginLeft = offsets.x;
        container.style.marginTop = offsets.y;
        container.style.marginRight = 0;
        container.style.marginBottom = 0;
    }

    me.getTransformedDimensions = function (obj, matrix) {
        var r = {};

        if (hasIETransformWorkaround(obj)) {
            r.width = obj.offsetWidth;
            r.height = obj.offsetHeight;
        } else {
            var pts = [
            matrix.x($V([0, 0, 1]))	,
            matrix.x($V([0, obj.offsetHeight, 1])),
            matrix.x($V([obj.offsetWidth, 0, 1])),
            matrix.x($V([obj.offsetWidth, obj.offsetHeight, 1]))
            ];
            var maxX = 0, maxY =0, minX=0, minY=0;

            for (var i = 0; i < pts.length; i++) {
                var pt = pts[i];
                var x = pt.e(1), y = pt.e(2);
                var minX = Math.min(minX, x);
                var maxX = Math.max(maxX, x);
                var minY = Math.min(minY, y);
                var maxY = Math.max(maxY, y);
            }


            r.width = maxX - minX;
            r.height = maxY - minY;

        }

        return r;
    }

    me.getIEMatrixOffsets = function (obj, matrix, width, height) {
        var r = {};

        var originalWidth = parseFloat(width);
        var originalHeight = parseFloat(height);


        var offset;
        if (CSSHelpers.getComputedStyle(obj, 'display') == 'inline') {
            offset = 0;
        } else {
            offset = 13; // This works ... don't know why.
        }
        var transformedDimensions = me.getTransformedDimensions(obj, matrix);

        r.x = (((originalWidth - transformedDimensions.width) / 2) - offset + matrix.e(1, 3)) + 'px';
        r.y  = (((originalHeight - transformedDimensions.height) / 2) - offset + matrix.e(2, 3)) + 'px';

        return r;
    }

    function hasIETransformWorkaround(obj){

        return CSSHelpers.isMemberOfClass(obj.parentNode, 'IETransformContainer');
    }

    function addIETransformWorkaround(obj){
        if (!hasIETransformWorkaround(obj)) {
            var parentNode = obj.parentNode;
            var filter;

            // This is the container to offset the strange rotation behavior
            var container = document.createElement('div');
            CSSHelpers.addClass(container, 'IETransformContainer');


            container.style.width = obj.offsetWidth + 'px';
            container.style.height = obj.offsetHeight + 'px';

            container.xOriginalWidth = obj.offsetWidth;
            container.xOriginalHeight = obj.offsetHeight;
            container.style.position = 'absolute'
            container.style.zIndex = obj.currentStyle.zIndex;


            var horizPaddingFactor = 0; //parseInt(obj.currentStyle.paddingLeft);
            var vertPaddingFactor = 0; //parseInt(obj.currentStyle.paddingTop);
            if (obj.currentStyle.display == 'block') {
                container.style.left = obj.offsetLeft + 13 - horizPaddingFactor + "px";
                container.style.top = obj.offsetTop + 13 + -vertPaddingFactor + 'px';
            } else {
                container.style.left = obj.offsetLeft + "px";
                container.style.top = obj.offsetTop + 'px';

            }
            //container.style.float = obj.currentStyle.float;


            obj.style.top = "auto";
            obj.style.left = "auto"
            obj.style.bottom = "auto";
            obj.style.right = "auto";
            // This is what we need in order to insert to keep the document
            // flow ok
            var replacement = obj.cloneNode(true);
            replacement.style.visibility = 'hidden';

            obj.replaceNode(replacement);

            // now, wrap container around the original node ...

            obj.style.position = 'absolute';
            container.appendChild(obj);
            parentNode.insertBefore(container, replacement);
            container.style.backgroundColor = 'transparent';

            container.style.padding = '0';

            filter = me.addFilter(obj, 'DXImageTransform.Microsoft.Matrix', "M11=1, M12=0, M21=0, M22=1, sizingMethod='auto expand'")
            var bgImage = obj.currentStyle.backgroundImage.split("\"")[1];
       

        }

    }

    me.addFilter = function(obj, filterName, filterValue){
        // now ... insert the filter so we can exploit its wonders

        var filter;
        try {
            filter = obj.filters.item(filterName);
        }
        catch (ex) {
            // dang! We have to go through all of them and make sure filter
            // is set right before we add the new one.


            var filterList = new MSFilterList(obj)

            filterList.fixFilterStyle();

            var comma = ", ";

            if (obj.filters.length == 0) {
                comma = "";
            }

            obj.style.filter += StringHelpers.sprintf("%sprogid:%s(%s)", comma, filterName, filterValue);

            filter = obj.filters.item(filterName);

        }

        return filter;
    }


    function degreesToRadians(degrees){
        return (degrees - 360) * Math.PI / 180;
    }

    me.findProperty = function(obj, type){
        capType = type.capitalize();

        var r = cache[type]
        if (!r) {


            var style = obj.style;


            var properties = [type, 'Moz' + capType, 'Webkit' + capType, 'O' + capType, 'filter'];
            for (var i = 0; i < properties.length; i++) {
                if (style[properties[i]] != null) {
                    r = properties[i];
                    break;
                }
            }

            if (r == 'filter' && document.body.filters == undefined) {
                r = null;
            }
            cache[type] = r;
        }
        return r;
    }



}

function MSFilterList(node){
    var me = this;

    me.list = new Array();
    me.node = node;

    var reFilterListSplitter = /[\s\S]*\([\s\S]*\)/g;

    var styleAttr = node.style;

    function init(){

        var filterCalls = styleAttr.filter.match(reFilterListSplitter);

        if (filterCalls != null) {

            for (var i = 0; i < filterCalls.length; i++) {
                var call = filterCalls[i];

                me.list.push(new MSFilter(node, call));

            }
        }


    }

    me.toString = function(){
        var sb = new StringBuffer();

        for (var i = 0; i < me.list.length; i++) {

            sb.append(me.list[i].toString());
            if (i < me.list.length - 1) {
                sb.append(',')
            }
        }
        return sb.toString();
    }


    me.fixFilterStyle = function(){

        try {
            me.node.style.filter = me.toString();
        }
        catch (ex) {
        // do nothing.
        }

    }

    init();
}

function MSFilter(node, filterCall){
    var me = this;

    me.node = node;
    me.filterCall = filterCall;

    var reFilterNameSplitter = /progid:([^\(]*)/g;
    var reParameterName = /([a-zA-Z0-9]+\s*)=/g;


    function init(){
        me.name = me.filterCall.match(reFilterNameSplitter)[0].replace('progid:', '');

        //This may not be the best way to do this.
        var parameterString = filterCall.split('(')[1].replace(')', '');
        me.parameters = parameterString.match(reParameterName);

        for (var i = 0; i < me.parameters.length; i++) {
            me.parameters[i] = me.parameters[i].replace('=', '');
        }

    }

    me.toString = function(){

        var sb = new StringBuffer();

        sb.append(StringHelpers.sprintf('progid:%s(', me.name));

        for (var i = 0; i < me.parameters.length; i++) {
            var param = me.parameters[i];
            var filterObj = me.node.filters.item(me.name);
            var paramValue = filterObj[param];
            if (typeof(paramValue) == 'string') {
                sb.append(StringHelpers.sprintf('%s="%s"', param, filterObj[param]));
            } else {
                sb.append(StringHelpers.sprintf('%s=%s', param, filterObj[param]));
            }

            if (i != me.parameters.length - 1) {
                sb.append(', ')
            }
        }
        sb.append(')');

        return sb.toString();
    }

    init();
}






document.write('<style type="text/css">.cssSandpaper-initiallyHidden { visibility: hidden;} </style>');



EventHelpers.addPageLoadEvent('cssSandpaper.init')
