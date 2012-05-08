/*
 * transform: A jQuery cssHooks adding cross-browser 2d transform capabilities to $.fn.css() and $.fn.animate()
 *
 * limitations:
 * - requires jQuery 1.4.3+
 * - Should you use the *translate* property, then your elements need to be absolutely positionned in a relatively positionned wrapper **or it will fail in IE678**.
 * - transformOrigin is not accessible
 *
 * latest version and complete README available on Github:
 * https://github.com/louisremi/jquery.transform.js
 *
 * Copyright 2011 @louis_remi
 * Licensed under the MIT license.
 *
 * This saved you an hour of work?
 * Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
 *
 */
(function( $, window, document, Math, undefined ) {
"use strict";

/*
 * Feature tests and global variables
 */
var div = document.createElement("div"),
	divStyle = div.style,
	propertyName = "transform",
	suffix = "Transform",
	testProperties = [
		propertyName,
		"O" + suffix,
		"ms" + suffix,
		"Webkit" + suffix,
		"Moz" + suffix
	],
	originSuffix = "Origin",
	originPropertyCssName = propertyName + "-origin",
	originPropertyName = propertyName + originSuffix,
	i = testProperties.length,
	supportProperty,
	supportOriginProperty,
	supportMatrixFilter,
	supportFloat32Array = "Float32Array" in window,
	propertyHook,
	propertyGet,
	originPropertyHook,
	originPropertyGet,
	originPropertySet,
	rMatrix = /Matrix([^)]*)/,
	rAffine = /^\s*matrix\(\s*1\s*,\s*0\s*,\s*0\s*,\s*1\s*(?:,\s*0(?:px)?\s*){2}\)\s*$/,
	runits = /^([\+\-]=)?(-?[\d+\.\-]+)([a-z]+|%)?(.*?)$/i,
	rperc = /%/,
	_parseFloat = parseFloat,
	_relative = "relative",
	_static = "static",
	_position = "position",
	_translate = "translate",
	_rotate = "rotate",
	_scale = "scale",
	_skew = "skew",
	_matrix = "matrix";

// test different vendor prefixes of this property
while ( i-- ) {
	if ( testProperties[i] in divStyle ) {
		$.support[propertyName] = supportProperty = testProperties[i];
		continue;
	}
}
supportOriginProperty = supportProperty + originSuffix;

// IE678 alternative
if ( !supportProperty ) {
	$.support.matrixFilter = supportMatrixFilter = divStyle.filter === "";
}

// px isn"t the default unit of this property
$.cssNumber[propertyName] = true;
$.cssNumber[originPropertyName] = true;

/*
 * fn.css() hooks
 */
if ( supportProperty && supportProperty != propertyName ) {
	// Modern browsers can use jQuery.cssProps as a basic hook
	$.cssProps[propertyName] = supportProperty;
	$.cssProps[originPropertyName] = supportOriginProperty;

	// Firefox needs a complete hook because it stuffs matrix with "px"
	if ( supportProperty == "Moz" + suffix ) {
		propertyHook = {
			get: function( elem, computed ) {
				return (computed ?
					// remove "px" from the computed matrix
					$.css( elem, supportProperty ).split("px").join(""):
					elem.style[supportProperty]
				);
			},
			set: function( elem, value ) {
				// add "px" to matrices
				elem.style[supportProperty] = /matrix\([^)p]*\)/.test(value) ?
					value.replace(/matrix((?:[^,]*,){4})([^,]*),([^)]*)/, _matrix+"$1$2px,$3px"):
					value;
			}
		};
	/* Fix two jQuery bugs still present in 1.5.1
	 * - rupper is incompatible with IE9, see http://jqbug.com/8346
	 * - jQuery.css is not really jQuery.cssProps aware, see http://jqbug.com/8402
	 */
	} else if ( /^1\.[0-5](?:\.|$)/.test($.fn.jquery) ) {
		propertyHook = {
			get: function( elem, computed ) {
				return (computed ?
					$.css( elem, supportProperty.replace(/^ms/, "Ms") ):
					elem.style[supportProperty]
				);
			}
		};
	}
	/* TODO: leverage hardware acceleration of 3d transform in Webkit only
	else if ( supportProperty == "Webkit" + suffix && support3dTransform ) {
		propertyHook = {
			set: function( elem, value ) {
				elem.style[supportProperty] =
					value.replace();
			}
		}
	}*/

} else if ( supportMatrixFilter ) {
	var translateX = suffix + "-translate-x",
		translateY = suffix + "-translate-y"
	;

	propertyHook = {
		get: function( elem, computed ) {
			var $elem = $(elem),
				elemStyle = ( computed && elem.currentStyle ? elem.currentStyle : elem.style ),
				matrix;

			if ( elemStyle && rMatrix.test( elemStyle.filter ) ) {
				matrix = RegExp.$1.split(",");
				matrix = [
					matrix[0].split("=")[1],
					matrix[2].split("=")[1],
					matrix[1].split("=")[1],
					matrix[3].split("=")[1]
				];
			} else {
				matrix = [1,0,0,1];
			}
			matrix[4] = $elem.data(translateX) || 0;
			matrix[5] = $elem.data(translateY) || 0;
			return _matrix+"(" + matrix + ")";
		},
		set: function( elem, value, animate ) {
			var $elem = $(elem),
				elemStyle = elem.style,
				currentStyle,
				Matrix,
				filter,
				centerOrigin;

			if ( !animate ) {
				elemStyle.zoom = 1;
			}

			value = matrix(value);

			// rotate, scale and skew
			//if ( !animate || animate.M ) {
				Matrix = [
					"Matrix("+
						"M11="+value[0],
						"M12="+value[2],
						"M21="+value[1],
						"M22="+value[3],
						"SizingMethod='auto expand'"
				].join();
				filter = ( currentStyle = elem.currentStyle ) && currentStyle.filter || elemStyle.filter || "";

				elemStyle.filter = rMatrix.test(filter) ?
					filter.replace(rMatrix, Matrix) :
					filter + " progid:DXImageTransform.Microsoft." + Matrix + ")";

				// remember the translation for later
				$elem.data(translateX, value[4]);
				$elem.data(translateY, value[5]);

				// fake the origin
				originPropertySet(elem);
			//}
		}
	};


	// handle transform-origin
	originPropertyHook = {
		get: function( elem, computed ) {
			// TODO: handle computed
			var $elem = $(elem),
				origin = $elem.data(originPropertyCssName)
			;

			// try to look it up in the existing CSS
			if (!origin) {
				// ordered backwards because we loop backwards
				var testProperties = [
						//"-o-" + originPropertyCssName,
						//"-moz-" + originPropertyCssName,
						//"-webkit-" + originPropertyCssName,
						"-ms-" + originPropertyCssName,
						originPropertyCssName
					],
					i = testProperties.length,
					currStyle = elem.currentStyle
				;

				// loop backwards
				while ( i-- ) {
					if ( testProperties[i] in currStyle ) {
						origin = currStyle[testProperties[i]];
						$elem.data(originPropertyCssName, origin);
						break;
					}
				}
			}

			// otherwise use the default
			if (!origin) {
				origin = "50% 50%"; // use percentages instead of keywords
				$elem.data(originPropertyCssName, origin);
			}

			return origin;
		},

		set: function( elem, value ) {
			var $elem = $(elem),
				transform = propertyGet(elem)
			;

			// save it if there"s a new value
			// NOTE: undefined means we"re trying to set a transform and need to handle translation
			if (value !== undefined) { $elem.data(originPropertyCssName, value) }

			// if there"s no transform, don"t do anything
			if (!transform) {
				return;
			}

			// convert the transform into a useful array
			transform = matrix(transform);

			// fake the origin with some fancy css
			// we also fake the translation here
			var tx = transform[4] || $elem.data(translateX) || 0,
				ty = transform[5] || $elem.data(translateY) || 0,
				origin = keywordsToPerc(value === undefined ? originPropertyGet(elem) : value).split(" ")
			;

			// calculate and return the correct size
			// find the real size of the original object
			// (IE reports the size of the transformed object)
			// the ratio is basically the transformed size of 1x1 object
			var ratio = transformOffset(transform, 1, 1),
				width = $elem.outerWidth() / ratio.width,
				height = $elem.outerHeight() / ratio.height,
				i = 2, matches
			;

			// turn the origin into unitless pixels
			while (i--) {
				matches = origin[i].match(runits);
				if (matches[3] !== "px") {
					origin[i] = matches[3] === "%" ? percentageToPx(origin[i], elem, i, ratio, width, height) :  toPx(origin[i], elem);
				} else {
					origin[i] = _parseFloat(origin[i]);
				}
			}

			// find the origin offset
			var	toCenter = transformVector(transform, origin[0], origin[1]),
				fromCenter = transformVector(transform, 0, 0),
				offset = {
					top: fromCenter[1] - (toCenter[1] - origin[1]),
					left: fromCenter[0] - (toCenter[0] - origin[0])
				},
				sides = transformSides(transform, width, height)
			;

			// apply the css
			var cssPosition = $elem.css(_position),
				usePosition = cssPosition === _relative || cssPosition === _static || $.transform.centerOrigin === _position,
				css = {},
				propTop = usePosition ? "top" : "marginTop" ,
				propLeft = usePosition ? "left" : "marginLeft" ,
				top = offset.top + ty + sides.top,
				left = offset.left + tx + sides.left,
				cssTop = 0,
				cssLeft = 0,
				currentTop,
				currentLeft,
				elemStyle = elem.style,
				currStyle = elem.currentStyle
			;

			if (cssPosition === _static) {
				css[_position] = _relative;
			} else {
				// try to respect an existing top/left if it"s in the CSS
				// blank out the inline styles, we"re going to overwrite them anyway
				elemStyle[propTop] = null;
				elemStyle[propLeft] = null;

				// look up the CSS styles
				currentTop = currStyle[propTop];
				currentLeft = currStyle[propLeft];

				// if they"re not "auto" then use those
				// TODO: handle non-pixel units and percentages
				if (currentTop !== "auto") { cssTop = parseInt(currentTop, 10); }
				if (currentLeft !== "auto") { cssLeft = parseInt(currentLeft, 10); }
			}

			css[propTop] = top + cssTop;
			css[propLeft] = left + cssLeft;
			$elem.css(css);
		}
	};
}
// populate jQuery.cssHooks with the appropriate hook if necessary
if ( propertyHook ) {
	$.cssHooks[propertyName] = propertyHook;
}
if (originPropertyHook) {
	$.cssHooks[originPropertyName] = originPropertyHook;
}
// we need a unique setter for the animation logic
propertyGet = propertyHook && propertyHook.get || $.css;
originPropertyGet = originPropertyHook && originPropertyHook.get || $.css;
originPropertySet = originPropertyHook && originPropertyHook.set || $.css;

/*
 * fn.animate() hooks
 */
$.fx.step.transform = function( fx ) {
	var elem = fx.elem,
		start = fx.start,
		end = fx.end,
		pos = fx.pos,
		transform = "", i, startVal, endVal, unit;

	// fx.end and fx.start need to be converted to interpolation lists
	if ( !start || typeof start === "string" ) {

		// the following block can be commented out with jQuery 1.5.1+, see #7912
		if ( !start ) {
			start = propertyGet( elem, supportProperty );
		}

		// force layout only once per animation
		if ( supportMatrixFilter ) {
			elem.style.zoom = 1;
		}

		// replace "+=" in relative animations (-= is meaningless with transforms)
		// TODO: this is not how people would expect this to work. it makes more sense to support something like: rotate(+=45deg) translate(-=10px, +=15px)
		end = end.split("+=").join(start);

		// parse both transform to generate interpolation list of same length
		return $.extend( fx, interpolationList( start, end ) );
	}

	i = start.length;

	// interpolate functions of the list one by one
	while ( i-- ) {
		startVal = start[i];
		endVal = end[i];
		unit = +false;

		switch ( startVal[0] ) {

			case _translate:
				unit = "px";
			case _scale:
				unit || ( unit = " ");
			case _skew:
				unit || ( unit = "rad" );

				transform = startVal[0] + "(" +
					(startVal[1][0] + (endVal[1][0] - startVal[1][0]) * pos) + unit +","+
					(startVal[1][1] + (endVal[1][1] - startVal[1][1]) * pos) + unit + ")"+
					transform;
				break;

			case _rotate:
				transform = _rotate + "(" +
					(startVal[1] + (endVal[1] - startVal[1]) * pos) +"rad)"+
					transform;
				break;
		}
	}

	fx.origin && ( transform = fx.origin + transform );

	propertyHook && propertyHook.set ?
		propertyHook.set( elem, transform, +true ):
		elem.style[supportProperty] = transform;
};


/*
 * fn.animate() hooks for transform-origin
 */
$.fx.step.transformOrigin = function( fx ) {
	var elem = fx.elem,
		start,
		value = [],
		pos = fx.pos,
		i = 2,
		relativeUnit,
		unit = [],
		startVal,
		endVal,
		ratio;

	if ( !fx.state ) {
		// correct for keywords
		startVal = keywordsToPerc(originPropertyGet( elem, supportOriginProperty )).split(" ");
		endVal = keywordsToPerc(fx.end).split(" ");

		// TODO: use a unit conversion library!
		while(i--) {
			// parse the end value for the +=/-= prefix
			relativeUnit = endVal[i].match(runits)[1];

			// get the height/width ratio for IE
			if ( supportMatrixFilter) {
				ratio = transformOffset(matrix(propertyGet(elem)), 1, 1);
			}

			// convert the start value
			startVal[i] = convertOriginValue(startVal[i], elem, i, ratio);
			endVal[i] = convertOriginValue(endVal[i], elem, i, ratio);

			// handle +=/-= prefixes
			if (relativeUnit) {
				endVal[i] = startVal[i] + (relativeUnit === "+=" ? 1 : -1) * endVal[i]
			}
		}
		i = 2;

		// record the doctored values on the fx object
		fx.start = startVal;
		fx.end = endVal;
		fx.unit = "px";
	}

	// read the doctored values from the fx object
	start = fx.start;

	// animate the values
	while (i--) {
		value[i] = (start[i] + (fx.end[i] - start[i]) * pos) + fx.unit;
	}
	value = value.join(" ");

	// set it and forget it
	supportMatrixFilter ? originPropertySet( elem, value ) : elem.style[supportOriginProperty] = value;
}

// convert a value for the origin animation, accounting for +=/-=
function convertOriginValue(value, elem, useHeight, useRatio) {
	var matches = value.match(runits);
	value = matches[2] + matches[3];
	if (matches[3] !== "px") {
		value = matches[3] === "%" ? percentageToPx(value, elem, useHeight, useRatio) : toPx(value, elem);
	} else {
		value = _parseFloat(value);
	}
	return value;
}

/*
 * Utility functions
 */

// keywords
function keywordsToPerc (value) {
	var _top = "top",
		_right = "right",
		_bottom = "bottom",
		_center = "center",
		_left  = "left",
		_space = " ",
		_0 = "0",
		_50 = "50%",
		_100  = "100%",
		split,
		i = 2;

	switch (value) {
		case _top + _space + _left: // no break
		case _left + _space + _top:
			value = _0 + _space + _0;
			break;
		case _top: // no break
		case _top + _space + _center: // no break
		case _center + _space + _top:
			value = _50 + _space + _0;
			break;
		case _right + _space + _top: // no break
		case _top + _space + _right:
			value = _100 + _space + _0;
			break;
		case _left: // no break
		case _left + _space + _center: // no break
		case _center + _space + _left:
			value = _0 + _space + _50;
			break;
		case _right: // no break
		case _right + _space + _center: // no break
		case _center + _space + _right:
			value = _100 + _space + _50;
			break;
		case _bottom + _space + _left: // no break
		case _left + _space + _bottom:
			value = _0 + _space + _100;
			break;
		case _bottom: // no break
		case _bottom + _space + _center: // no break
		case _center + _space + _bottom:
			value = _50 + _space + _100;
			break;
		case _bottom + _space + _right: // no break
		case _right + _space + _bottom:
			value = _100 + _space + _100;
			break;
		case _center: // no break
		case _center + _space + _center:
			value = _50 + _space + _50;
			break;
		default:
			// handle mixed keywords and other units
			// TODO: this isn"t 100% to spec. mixed units and keywords require the keyword in the correct position
			split = value.split(_space);
			if (split[1] === undefined) { split[1] = split[0]; }
			while(i--) {
				switch(split[i]) {
					case _left: // no break
					case _top:
						split[i] = _0;
						break;
					case _right: // no break
					case _bottom:
						split[i] = _100;
						break;
					case _center:
						split[i] = _50;
				}
			}
			value = split.join(_space);
	}
	return value;
}

// convert a vector
function transformVector(a, x, y) {
	return [
		a[0] * x + a[2] * y,
		a[1] * x + a[3] * y
	];
}

// calculate the corner vectors
function transformCorners(a, x, y) {
	return [
		/* tl */ transformVector(a, 0, 0),
		/* bl */ transformVector(a, 0, y),
		/* tr */ transformVector(a, x, 0),
		/* br */ transformVector(a, x, y)
	];
}

// measure the length of the sides
// TODO: arrays are faster than objects (and compress better)
function transformSides(a, x, y) {
	// The corners of the box
	var c = transformCorners(a, x, y);

	return {
		top: Math.min(c[0][1], c[2][1], c[3][1], c[1][1]),
		bottom: Math.max(c[0][1], c[2][1], c[3][1], c[1][1]),
		left: Math.min(c[0][0], c[2][0], c[3][0], c[1][0]),
		right: Math.max(c[0][0], c[2][0], c[3][0], c[1][0])
	};
}

// measure the offset height and width
// TODO: arrays are faster than objects (and compress better)
function transformOffset(a, x, y) {
	// The sides of the box
	var s = transformSides(a, x, y);

	// return offset
	return {
		height: Math.abs(s.bottom - s.top),
		width: Math.abs(s.right - s.left)
	};
}

// turns a transform string into its "matrix(A,B,C,D,X,Y)" form (as an array, though)
// column-major order
function matrix( transform ) {
	transform = transform.split(")");
	var trim = $.trim
		, i = -1
		// last element of the array is an empty string, get rid of it
		, l = transform.length -1
		, split, prop, val
		, prev = supportFloat32Array ? new Float32Array(6) : []
		, curr = supportFloat32Array ? new Float32Array(6) : []
		, rslt = supportFloat32Array ? new Float32Array(6) : [1,0,0,1,0,0]
		;

	prev[0] = prev[3] = rslt[0] = rslt[3] = 1;
	prev[1] = prev[2] = prev[4] = prev[5] = 0;

	// Loop through the transform properties, parse and multiply them
	while ( ++i < l ) {
		split = transform[i].split("(");
		prop = trim(split[0]);
		val = split[1];
		curr[0] = curr[3] = 1;
		curr[1] = curr[2] = curr[4] = curr[5] = 0;

		switch (prop) {
			case _translate+"X":
				curr[4] = parseInt(val, 10);
				break;

			case _translate+"Y":
				curr[5] = parseInt(val, 10);
				break;

			case _translate:
				val = val.split(",");
				curr[4] = parseInt(val[0], 10);
				curr[5] = parseInt(val[1] || 0, 10);
				break;

			case _rotate:
				val = toRadian(val);
				curr[0] = Math.cos(val);
				curr[1] = Math.sin(val);
				curr[2] = -curr[1];
				curr[3] = curr[0];
				break;

			case _scale+"X":
				curr[0] = +val;
				break;

			case _scale+"Y":
				curr[3] = val;
				break;

			case _scale:
				val = val.split(",");
				curr[0] = val[0];
				curr[3] = val.length>1 ? val[1] : val[0];
				break;

			case _skew+"X":
				curr[2] = Math.tan(toRadian(val));
				break;

			case _skew+"Y":
				curr[1] = Math.tan(toRadian(val));
				break;

			case _skew:
				val = val.split(",");
				curr[2] = Math.tan(toRadian(val[0]));
				val[1] && ( curr[1] = Math.tan(toRadian(val[1])) );
				break;

			case _matrix:
				val = val.split(",");
				curr[0] = val[0];
				curr[1] = val[1];
				curr[2] = val[2];
				curr[3] = val[3];
				curr[4] = parseInt(val[4], 10);
				curr[5] = parseInt(val[5], 10);
				break;
		}

		// Matrix product (array is in column-major order!)
		rslt[0] = prev[0] * curr[0] + prev[2] * curr[1];
		rslt[1] = prev[1] * curr[0] + prev[3] * curr[1];
		rslt[2] = prev[0] * curr[2] + prev[2] * curr[3];
		rslt[3] = prev[1] * curr[2] + prev[3] * curr[3];
		rslt[4] = prev[0] * curr[4] + prev[2] * curr[5] + prev[4];
		rslt[5] = prev[1] * curr[4] + prev[3] * curr[5] + prev[5];

		prev = [rslt[0],rslt[1],rslt[2],rslt[3],rslt[4],rslt[5]];
	}
	return rslt;
}

// turns a matrix into its rotate, scale and skew components
// algorithm from http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp
function unmatrix(matrix) {
	var scaleX
		, scaleY
		, skew
		, A = matrix[0]
		, B = matrix[1]
		, C = matrix[2]
		, D = matrix[3]
		;

	// Make sure matrix is not singular
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
			//scaleY = -scaleY;
			//skew = -skew;
			A = -A;
			B = -B;
			skew = -skew;
			scaleX = -scaleX;
		}

	// matrix is singular and cannot be interpolated
	} else {
		throw new Error("matrix is singular");
	}

	// The recomposition order is very important
	// see http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp#l971
	return [
		[_translate, [+matrix[4], +matrix[5]]],
		[_rotate, Math.atan2(B, A)],
		[_skew, [Math.atan(skew), 0]],
		[_scale, [scaleX, scaleY]]
	];
}

// build the list of transform functions to interpolate
// use the algorithm described at http://dev.w3.org/csswg/css3-2d-transforms/#animation
function interpolationList( start, end ) {
	var list = {
			start: [],
			end: []
		},
		i = -1, l,
		currStart, currEnd, currType;

	// get rid of affine transform matrix
	( start == "none" || isAffine( start ) ) && ( start = "" );
	( end == "none" || isAffine( end ) ) && ( end = "" );

	// if end starts with the current computed style, this is a relative animation
	// store computed style as the origin, remove it from start and end
	if ( start && end && !end.indexOf("matrix") && toArray( start ).join() == toArray( end.split(")")[0] ).join() ) {
		list.origin = start;
		start = "";
		end = end.slice( end.indexOf(")") +1 );
	}

	if ( !start && !end ) { return; }

	// start or end are affine, or list of transform functions are identical
	// => functions will be interpolated individually
	if ( !start || !end || functionList(start) == functionList(end) ) {

		start && ( start = start.split(")") ) && ( l = start.length );
		end && ( end = end.split(")") ) && ( l = end.length );

		while ( ++i < l-1 ) {
			start[i] && ( currStart = start[i].split("(") );
			end[i] && ( currEnd = end[i].split("(") );
			currType = $.trim( ( currStart || currEnd )[0] );

			append( list.start, parseFunction( currType, currStart ? currStart[1] : 0 ) );
			append( list.end, parseFunction( currType, currEnd ? currEnd[1] : 0 ) );
		}

	// otherwise, functions will be composed to a single matrix
	} else {
		list.start = unmatrix(matrix(start));
		list.end = unmatrix(matrix(end))
	}

	return list;
}

function parseFunction( type, value ) {
	var
		// default value is 1 for scale, 0 otherwise
		defaultValue = +(!type.indexOf(_scale)),
		// value is parsed to radian for skew, int otherwise
		valueParser = !type.indexOf(_skew) ? toRadian : _parseFloat,
		scaleX,
		cat = type.replace( /[XY]/, "" );

	switch ( type ) {
		case _translate+"Y":
		case _scale+"Y":
		case _skew+"Y":

			value = [
				defaultValue,
				value ?
					valueParser( value ):
					defaultValue
			];
			break;

		case _translate+"X":
		case _translate:
		case _scale+"X":
			scaleX = 1;
		case _scale:
		case _skew+"X":
		case _skew:

			value = value ?
				( value = value.split(",") ) &&	[
					valueParser( value[0] ),
					valueParser( value.length>1 ? value[1] : type == _scale ? scaleX || value[0] : defaultValue+"" )
				]:
				[defaultValue, defaultValue];
			break;

		case _rotate:
			value = value ? toRadian( value ) : 0;
			break;

		case _matrix:
			return unmatrix( value ? toArray(value) : [1,0,0,1,0,0] );
			break;
	}

	return [[ cat, value ]];
}

function isAffine( matrix ) {
	return rAffine.test(matrix);
}

function functionList( transform ) {
	return transform.replace(/(?:\([^)]*\))|\s/g, "");
}

function append( arr1, arr2, value ) {
	while ( value = arr2.shift() ) {
		arr1.push( value );
	}
}

// converts an angle string in any unit to a radian Float
function toRadian(value) {
	var val = _parseFloat(value), PI = Math.PI;

	// TODO: why use the tilde here? seems useless, it"s not like you"d ever want to see deg as the first character
	return ~value.indexOf("deg") ?
		val * (PI / 180):
		~value.indexOf("grad") ?
			val * (PI / 200):
			~value.indexOf("turn") ?
				val * (PI / 0.5):
				val;
}

function toPx(value, elem, prop) {
	prop = prop || "left";
	var style = elem.style[prop],
		inStyle = style !== undefined && style !== null,
		curr = $.css(elem, prop), // read the current value
		val;

	// set the style on the target element
	$.style( elem, prop, value);
	val = $.css(elem, prop);

	// reset the style back to what it was
	inStyle ? $.style( this, prop, curr) : elem.style[prop] = null;
	return _parseFloat(val);
}

function percentageToPx(value, elem, useHeight, useRatio, width, height) {
	var ratio = 1,
		$elem = $(elem),
		outer = (useHeight ? height : width) || $elem["outer" + (useHeight ? "Height" : "Width")]();

	// IE doesn"t report the height and width properly
	if ( supportMatrixFilter ) {
		ratio = useRatio[(useHeight ? "height" : "width")];
	}

	// TODO: Chrome appears to use innerHeight/Width
	value = outer * _parseFloat(value) / 100 / ratio;
	return value;
}

// Converts "matrix(A,B,C,D,X,Y)" to [A,B,C,D,X,Y]
function toArray(matrix) {
	// remove the unit of X and Y for Firefox
	matrix = /([^,]*),([^,]*),([^,]*),([^,]*),([^,p]*)(?:px)?,([^)p]*)(?:px)?/.exec(matrix);
	return [matrix[1], matrix[2], matrix[3], matrix[4], matrix[5], matrix[6]];
}

$.transform = {
	centerOrigin: _position
};

})( jQuery, window, document, Math );