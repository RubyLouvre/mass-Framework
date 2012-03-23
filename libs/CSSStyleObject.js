/*
Author: Rob Reid
Create Date: 08 Mar 2009
Description: Wrapper object (cut down version) used for calculating computed styles cross browser as well as
a function to calculate fontSize in a manner that handles % and ems and conversions to px correctly.
Whether the style is set inline or by CSS and whether its in points, ems or percentages it will be calculated and
returned as an object which has the following properties
style: 100% // current/inline style set on element for fontSize
px: 16px; // size in px (computed) that current style equates to
em: 1.2em // size in em that current size in px equates to
emu: 14px // size in px that 1em equates to on current element
*/


var CSSStyle = {

	// As there seems to be some odd behaviour in IE6 we use a hack in the fontSize function but before hand lets find out
	// whether we are in IE and running in quirks mode.
	isIE : (/msie/i.test(navigator.userAgent) && (!window.opera)),
	
	version : (navigator.userAgent.match( /.+(?:ox|rv|ion|ra|ie|me)[\/: ]([\d.]+)/i ) || [])[1],

	// IE will return 8 or 7 for standards mode and 5 for quirks other browsers should return a value for compatMode
	quirks : (document.documentMode) ? (document.documentMode==5) ? true : false : ((document.compatMode=="CSS1Compat") ? false : true),

	// As IE doesn't give us a computed style we need to be able to convert relative font-sizes such as small to px
	// IE in quirks mode treats small as the browser standard rather than medium so we check for the render mode
	relativeToPx : function(rel){		

		var px = 0;

		if(rel){
			var q = (this.isIE && this.quirks);
			
			switch (rel)
			{
				case "xx-small": 
					px = (q) ? 10 : 9;
					break;
				case "x-small": 
					px = (q) ? 13 : 10;
					break;
				case "small":
					px = (q) ? 16 : 13;
					break;
				case "medium": 
					px = (q) ? 16 : 18;
					break;
				case "large": 
					px = (q) ? 24 : 19;
					break;						
				case "x-large": 
					px = (q) ? 32 : 24;
					break;
				case "xx-large":						
					px = (q) ? 48 : 32;
					break;
			}
		}

		return px + "px";
	},

	// Functions for converting properties from camelCase to CSS-Property format and vice versa
	toCamelCase : function(name){
		var camelCase = name.replace(/\-(\w)/g, function(all, letter){
					return letter.toUpperCase();
				});
		return camelCase
	},

	toCSSProp : function(name){
		return name.replace( /([A-Z])/g, "-$1" ).toLowerCase();
	},

	// returns the current style of an element with no conversions
	// call like 
	// var val = getStyle('myDiv','fontSize'); 
	// var val = getStyle('myDiv','font-size');
	getCurCSS : function(el,style){
		var instyle,css;
		var elem = (typeof(el)=="string")?document.getElementById(el):el;
		var val = "", doc = (elem.ownerDocument||elem.document);

		// Make sure we have both formats for JS and CSS styles
		var camelCase = this.toCamelCase(style); //convert to camelCase
		var CSSProp = this.toCSSProp(style); //convert to css-property
		
		// If an inline style has been applied then store it
		if( elem.style && elem.style[ camelCase ] ){
			//Default to style if its been set by JS or inline styling
			instyle = elem.style[ camelCase ];
		}

		// Try for computed style first as this will return the actual value converted to px
		if (typeof doc.defaultView !== 'undefined' && typeof doc.defaultView.getComputedStyle !== 'undefined'){

			// We only require the word float for computedStyle
			if ( style.match( /float/i ) )
				style = "float";			

			var computedStyle = doc.defaultView.getComputedStyle( elem, null );
			//Standard Compliant function that will return the true computed size in px
			if ( computedStyle )
				css = computedStyle.getPropertyValue( CSSProp );			

		} else if ( elem.currentStyle ) {			
			//IE only 
			css = elem.currentStyle[ camelCase ];

		}

		return {
			"style" : (instyle || css),
			"css" : css
		}
	},
	
	// Returns a computed style
	getComputedStyle : function(el,style){
		
		var curCSS = this.getCurCSS(el,style);
		
		// Handle IE where we don't get a computed style in px
		if(!/^\d+px$/.test(curCSS)){
			
			// if the css value is a unit we can try to compute then try to convert it
			if(/(em|ex|pt|%)$/.test(curCSS.css)){
				return Math.round(this.getPixelSize(el,curCSS.css)) + "px";
			
			}else{
				return curCSS.css;
			}

		}
	},

	//Cache to hold element sizes to prevent recursion
	fontCache : {},
	
	// Specific function designed for calculating true fontSize when styles set in %, em, px, pt etc
	// Will return an object with the current style, size in px, size in em, size that 1em equates to on this element
	getFontSize : function(el){
		var em,px,emu,fs,u,depx,cn,curCSS,style;
		var auto=false,pauto=false;
		// as we need to do a hack to handle IE 6 oddities (what a surprise) set up a flag now
		var hack = (this.isIE && this.version<=6)?true:false;

		el = (typeof(el)=="string")?document.getElementById(el):el;
		
		// Try and get from cache if we have already calculated size details for this element
		cn = (el.id) ? el.id : (el.tagName=="BODY") ? "BODY" : ""; //we store in cache by ID or BODY otherwise we dont store

		// Get current/computed style details for element will return in px in Moz otherwise we have work to do
		// Do this before checking cache in case the style for the element we want to check has changed
		curCSS = this.getCurCSS(el,"fontSize");
		style = curCSS.style; //get style as it appears inline or in CSS if possible
		fs = curCSS.css; //gets computed/currentStyle
		
		// if we have a value in our cache that hasn't had its style reset since it was added then use that
		if(cn && this.fontCache[cn]){
			// if style is still the same
			if(this.fontCache[cn].style == fs){
				return this.fontCache[cn];
			}
		}	

		// for IE currentStyle we need to get px for relative styles such as small,large,xx-large etc
		// we have a lookup function to do this. As long as the user doesn't change the text-size on browser!!!
		if(/^[-a-z]+$/.test(fs)){
			fs = this.relativeToPx(fs);
			u = "px";
		}else{
			// Get the unit type from the fontSize e.g em,px,pt,%
			u = fs.match(/^\d*\.?\d*\s*([\w%]+)$/)[1];
		}

		// calculate the size of 1em in relation to this element as we will use this in calculations
		if(fs!="1em"){
			emu = this.getPixelSize(el,"1em",false);
		}else{
			emu = px;
		}
		
		// Get size in px of 1em using current element as the parent this is required for IE when working out
		// whether a style is auto or not.
		var cem = this.getPixelSize(el,"1em",true);

		if(el.currentStyle && el.tagName!="BODY"){
			// For % we need details of its parent to calculate size in relation of it
			// we also need the parents details to do some double checking in the case of IE 6		
			// as a recursive loop up the DOM from this element could be a hit we only do it if
			// we need to.
			if(u=="%" || hack){
				var ps = this.getFontSize(el.parentNode||el);
			}
		}

		if(u=="em"){
			// convert em to px by checking size in relation to its parent fontSize as em is a relative style if the parent element
			// has a fontSize of 10px and this elements fontSize is 0.5em then it will be 5px as the size of 1em is the size in px of the
			// the parent
			px = this.em2px(fs,el);
			em = fs;				
		}else{
			// Size is not currently in ems so calculate size in px then work out em size
			
			// If size is a % this means we need to calculate in relation to its parent being careful not to confuse auto
			// which will appear as the same % as its parent as an actual % of the parent!
			if(u=="%"){

				// If size is in % and we are on the body we calculate the correct size by checking the size in px of 1em on the BODY style
				if(el.tagName=="BODY"){
					px = emu; //size in pixels will be whatever the size in px of 1em on a child of BODY
					
				// otherwise we get the fontSize in px of this elements parent and work out the size in relation to that
				// this is where the cache comes in handy as if we have already checked these elements it will not re-calculate it unless
				// the elements style has been changed since it was cached.
				}else{
					
					// If parent fontSize is also in % then we compare this elements style to the parents as if they are both the same eg 50%
					// then this may mean that the current elements style was set to "auto" which would mean it takes the same computed size
					// rather than 50% of the parents size. We set a flag if this is the case and will correct later on.
					if(/%$/.test(ps.style)){
						// if the style is auto and the parent is 50% then both will appear as 50% in the currentStyle value as we do not know
						// yet whether to use 50% of 50% or use the same px size as the parent calculate the % now and we can reset later
						if(ps.style==fs){
							// Parent style % is same as current elements so maybe auto was involved which we cannot extract unfortunatley 
							// so some testing is required to confirm this later on.
							pauto = true; //set flag so that later we may change according to futher tests							
						}
					}

					// We calculate px as a % of parent however this may change later if we can establish
					// that actually the % was inherited from the parent e.g auto
					var px = ((ps.px/100)*parseFloat(fs));
				}			

			// If size is already in px
			}else if(u=="px"){
				px = parseFloat(fs);			

			//handle all other units
			}else{
				//get size in px by creating a div and then measuring it.				
				px = this.getPixelSize(el,fs);
			}							
				
			// If we earlier set a flag to tell us that we are dealing with a % style that could be "auto" we need
			// to double check our px size as we don't want to calculate the px as a % of the parent but instead
			// we should use the parents size. As there is no way of extracting "auto" we check the size of 1em on the child compare
			// it to the px size we currently have and if its different it means our original calculation was wrong and the style is
			// in fact auto.

			if(pauto){

				// Get size in px of 1em using current element as the parent.
				
				// Check to see if the child 1em px == element px size
				if(cem==px){
					// It matches so our earlier % calculation was correct and this style is not actually "auto"
					auto = false;					
				}else{
					// It doesn't match so we need to change our original px size after a double check to make sure 1em (child)
					// equals 1em on current. As this should be the case on auto.
					if(cem==emu){
						// If child 1em px = 1em px size on this element then we have an auto style and we change our px
						// to this value as our % calculation was wrong earlier.
						px = cem;
						auto = true;
						style = "auto";
		
						// Handle bugs in IE6 when the calculation of px by creating divs with a size in em/% gives slightly off results
						// due to background imagery. Even if the figures of emu/cem are incorrect due to the DIV measurement being wrong
						// the logic used above is still correct. However we can correct these mistakes by using the rule that auto will 
						// inherit from a parent so the px size should be the same as the parents and 1em should also equal the parents px.
						if(px != ps.px){
							px = ps.px; //auto px size always same as parent pixel size
						}
						if(emu != ps.px){
							emu = ps.px; //size of 1 em in px is always size in px of parent element
						}
					}
				}			
			}
			// Convert px to em	
			
			// if its auto (IE) then we know its 1em
			if(auto){
				em=1.00.toFixed(2);
			// otherwise convert our px sixe to ems
			}else{
				em = this.px2em(parseFloat(px),el);		
			}
		}	

		// Handle IE 6 issues when div measurements are off in certain instances
		if(hack && ps){
			if(emu!=ps.px){
				emu=ps.px;
				// correct the px size as this will probably be wrong if the above is as well
				if(u=="em"){
					px = (parseFloat(emu)/100)*(parseFloat(em)*100)
				}
			}
		}

		// Create our fontSize object
		var fontSize = {
			"style":style,   // current/computed style will be px in standards compliant browsers but currentStyle in IE
			"px": Math.round(px),  // size in px
			"em":em,  // size in em
			"emu":emu,  // size in px that 1em equates to on this element			
			"cem":cem // size of 1em using this element as parent
		}

		// Add this object to our cache if we can uniquely identify it (either by ID or unique tag e.g BODY)
		// which we checked earlier.
		if(cn){
			this.fontCache[cn] = fontSize;
		}		

		return fontSize;
	},

	// Based on the function from Gimme.codeplex.com
	// This function calculates the size in px by creating a div with the required css style that needs converting
	// e.g if you need to convert em or % to px.
	// var px = getPixelSize('myDiv','20%')

	getPixelSize : function(el,styleVal,force){
		// get unit of measurement
		var u = styleVal.match(/^\d*\.?\d*\s*([\w%]+)$/)[1];
		// If size is in pt then use Dean Edwards method to convert it to px as it works if not
		// we fallback to some simple math which relies on the fact that most browsers treat points the same now
		// based on the following calculation.
		// 1pt = 1/72nd of an inch
		// Browsers assume 96 CSS px per inch so the calculation is 96/72 = 1.333px per pt
		if(u=="pt"){
			if(el.currentStyle){
				var style = el.style,left = style.left,rsLeft = el.runtimeStyle.left;
				// Put in the new values to get a computed value out
				el.runtimeStyle.left = el.currentStyle.left;
				style.left = styleVal || 0;
				
				px = style.pixelLeft;

				style.left = left;
				el.runtimeStyle.left = rsLeft;
			}else{
				px = Math.round(1.3333*parseFloat(styleVal));		
			}
			return px;
		}

		if(document.createElement){
			var px, el = (!el)?document.body:(typeof(el)=="string")?document.getElementById(el):el; //allow passing of ids OR element references
			var name = (el.id) ? el.id : el.tagName;
			var ue = el.tagName.toUpperCase();
			var div = document.createElement("div"); 
			div.style.position = "absolute"; 
			div.style.visibility = 'hidden'; //hide	
			div.style.lineHeight = '0'; //Apparently IE adds invisible space if this is not set

			// % and em need to be calculated in relation to the parent of the element so do IMG tags
			if(/(%|em)$/.test(styleVal) || ue === "IMG"){
				// unless we have forced it to use the current element
				if(!force && ue!="BODY"){
					el = el.parentNode || el;
				}
				div.style.height = styleVal;
			}else{
				div.style.borderStyle = 'solid';
				div.style.borderBottomWidth = '0';					
				div.style.borderTopWidth = styleVal;	
			}
			//append hidden div to our element OR parent element if required
			el.appendChild(div);			
			//measure size in px by getting offsetHeight
			px = div.offsetHeight;

			//clean up			
			el.removeChild(div); 
		}
		return px || 0;
	},

	// Convert px to em
	px2em : function(px,el){
		if(!px||px=="0")return 0;
		//calculate value of 1em which will be done in relation to this elements parent (handled in getPixelSize function)
		var em = this.getPixelSize(el,"1em");
		var val = (((px/em)*10000)/10000).toFixed(2);
		return val;
	},

	// Convert em to px
	em2px : function(em,el){
		if(!em||em=="0")return 0;
		em = parseFloat(em)+"em"; //may have passed in 2.3em or 2.3 or 2
		var px = this.getPixelSize(el,em);
		return px;
	}

}