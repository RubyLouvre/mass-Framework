/**
* Sliderman.js
* Version: 1.3.5
* Author: Taras Ozarko (tozarko@gmail.com)
*
* (c) 2010-2011 Devtrix. All rights reserved. http://www.devtrix.net/sliderman/
**/

var Sliderman = new function(){
	var Sliderman = this;

	function foreach(o, f){for(var k in o) if(o.hasOwnProperty(k) && f(k,o[k],o)) return;}
	function is_array(a){return a && a.constructor == Array;}
	function is_string(a){return typeof(a) == 'string';}
	function is_function(a){return typeof(a) == 'function';}
	function now(){return (new Date()).getTime();}
	function this_blur(){this.blur();}
	
	function random(l){
		r = Math.round(Math.random()*(l+1));
		if(r > 0 && r < l+1) r--;
		else r = random(l);
		return r;
	}//random

	function addElementEvent(o,e,f){
		var of = o[e];
		var f2 = function(){of();f();}
		o[e] = !is_function(of) ? f : f2;
	}//addElementEvent

	var _loadImage = [];
	function loadImage(s,f,always_show_loading){
		var i_onload = function(){_loadImage[s]=true;if(f)f(s);}
		var l = function(){if(_loadImage[s]){if(f)f(s);}else{var i=newElement('IMG');i.onload=i_onload;new function(){i.src=s;};}}
		if(always_show_loading) setTimeout(l, typeof(always_show_loading) == 'number' ? always_show_loading : 1000);
		else l();
	}//loadImage

	function array_copy(a){
		if(is_array(a)) var r = [];
		else var r = {};
		foreach(a, function(i){r[i] = typeof(a[i]) != 'object' ? a[i] : array_copy(a[i]);});
		return r;
	}//array_copy

	function eq(a, b){
		return String(a).replace(/^\s+/, '').replace(/\s+$/, '').toLowerCase() == String(b).replace(/^\s+/, '').replace(/\s+$/, '').toLowerCase();
	}//eq

	function array_search(arr, a, b){
		var result = false;
		if(!b){
			foreach(arr, function(i){
				if(eq(arr[i], b)){
					result = i;
					return true;
				}
			});
		}
		else{
			foreach(arr, function(i){
				if(eq(arr[i][a], b)){
					result = i;
					return true;
				}
			});
		}
		return result;
	}//array_search

	function validateOption(a, b){
		b = b.split(',');
		var result;
		foreach(b, function(i){
			result = b[i];
			if(eq(a, b[i])) return true;
		});
		return result;
	}//validateOption

	var setOpacity;
	function setOpacityInit(){
		if(setOpacity) return;
		var p, b = document.body, s = b.style;
		if(is_string(s.opacity)) p = 'opacity';
	  else if(is_string(s.MozOpacity)) p = 'MozOpacity';
	  else if(is_string(s.KhtmlOpacity)) p = 'KhtmlOpacity';
	  else if(b.filters && navigator.appVersion.match(/MSIE ([\d.]+);/)[1]>=5.5) p = 'filter';
	  if(p == 'filter'){
			setOpacity = function(style, v){
				if(v > 1) v = 1;
				else if(v < 0) v = 0;
			  style[p] = "alpha(opacity=" + Math.round(v*100) + ")";
			}
		}else if(p){
			setOpacity = function(style, v){
				if(v > 1) v = 1;
				else if(v < 0) v = 0;
			  style[p] = v.toFixed(2);
			}
		}else setOpacity = ef
	}//setOpacityInit

	function setStyle(style, property, value){
		if(is_string(value)) style[property] = value;
		else if(property == 'clip') style[property] = 'rect('+Math.round(value[0])+'px, '+Math.round(value[1])+'px, '+Math.round(value[2])+'px, '+Math.round(value[3])+'px)';
		else if(property == 'opacity') setOpacity(style, value);
		else style[property] = Math.round(value)+'px';
	}//setStyle
	function setStyles(style, properties){
		foreach(properties, function(property){
			setStyle(style, property, properties[property]);
		});
	}
	function hide(style){style.display = 'none';}
	function show(style){style.display = '';}

	function newElement(tagName, styles){
		var e = document.createElement(tagName);
		if(styles) setStyles(e.style, styles);
		return e;
	}//newElement
	
	var definedObjects = [];
	function defineObject(t, o){
		if(!is_array(definedObjects[t])) definedObjects[t] = [];
		if(o){
			var n = -1, i;
			if(o.name){
				if(i = array_search(definedObjects[t], 'name', o.name)) n = i;
			}else o.name = 'Sliderman-nameless-object-'+definedObjects[t].length;
			if(n >= 0) definedObjects[t][n] = o;
			else definedObjects[t].push(o);
		}
	}//defineObjects
	Sliderman.easing = function(e){defineObject('easing', e);}
	Sliderman.order = function(e){defineObject('order', e);}
	Sliderman.effect = function(e){defineObject('effect', EffectObject(e));}
	
	function getDefinedObjects(t){
		return definedObjects[t];
	}//getDefinedObjects
	
	function getDefinedObject(t, n){
		var a = getDefinedObjects(t), i;
		return is_array(a) && (i = array_search(a, 'name', n)) ? a[i] : false;
	}//getDefinedObject
	
	var _EffectObject = 0;
	function EffectObject(a){
		if(typeof(a) != 'object') a = {};
		if(!a.name) a.name = 'Sliderman-nameless-effect-'+_EffectObject++;
		a.interval = parseInt(a.interval) || 40; a.duration = parseInt(a.duration) || 200; a.delay = parseInt(a.delay) || 0;
		a.cols = parseInt(a.cols) || 1; a.rows = parseInt(a.rows) || 1; a.count = a.cols*a.rows;
		a.top = a.top ? true : false; a.right = a.right ? true : false; a.bottom = a.bottom ? true : false; a.left = a.left ? true : false;
		a.fade = a.fade ? true : false; a.zoom = a.zoom ? true : false; a.move = a.move ? true : false, a.chess = a.chess ? true : false;
		a.easing = getDefinedObject('easing', a.easing) ? a.easing : 'swing';
		a.order = getDefinedObject('order', a.order) ? a.order : 'random'; a.order_cache_id = [a.order, a.cols, a.rows, a.road, a.reverse].join(',');
		a.cache_id = [a.interval, a.duration, a.delay, a.top, a.right, a.bottom, a.left, a.fade, a.zoom, a.move, a.chess, a.order_cache_id].join(',');
		a.cacheId = function(){return a.cache_id + (a.order == 'random' ? now() : '');}
		a.frames_count = Math.round(a.duration/a.interval); a.easingArr = getEasing(a);
		a.P = []; a.pieces = function(w,h){w /= a.cols; h /= a.rows; var wh = w+'x'+h; if(!a.P[wh]){a.P[wh] = {width: w, height: h};
			for(var c = 0; c < a.cols; c++) for(var r = 0; r < a.rows; r++) a.P[wh][r+','+c] = [r*h, c*w+w, r*h+h, c*w];
			}return a.P[wh];}
		return a;
	}//EffectObject
	
	function slideContainer(slidesContainer, display){
		var container = newElement('div', {width: display.width, height: display.height, position: 'absolute', top: 0, left: 0, overflow: 'hidden'});
		slidesContainer.appendChild(container);
		return container;
	}//slideContainer

	var EffectsArr = [];
	function Effects(parameters){
		var effect = parameters.effect,	display = parameters.display;
		if(parameters.contentmode) effect.zoom = false;
		var cr, piece, r, image, startStylesArr = [], AnimateArr = [], needAnimate = [], AnimateItemsArr = [], styleStart, styleEnd, styleDif;

		var container = slideContainer(parameters.container, display);

		var pieces = effect.pieces(display.width, display.height);
		var e_top, e_bottom, e_left, e_right;
		var effectsOptStr = effect.cacheId();
		var frameN;
		var orderArr = getOrder(effect);

		if(EffectsArr[effectsOptStr]){
			startStylesArr = EffectsArr[effectsOptStr].startStylesArr;
			AnimateArr = EffectsArr[effectsOptStr].AnimateArr;
			needAnimate = EffectsArr[effectsOptStr].needAnimate;
		}else{
			for(r = 0; r < effect.rows; r++) for(c = 0; c < effect.cols; c++){cr = r+','+c;
				if(effect.chess && orderArr[cr] % 2 == 1){
					e_top = effect.bottom; e_bottom = effect.top;
					e_left = effect.right; e_right = effect.left;
				}else{
					e_top = effect.top; e_bottom = effect.bottom;
					e_left = effect.left; e_right = effect.right;
				}

				styleStart = {top: 0, left: 0, opacity: 1, width: display.width, height: display.height, overflow: 'hidden'};
				styleEnd = array_copy(styleStart); piece = array_copy(pieces[cr]);

				if(effect.fade) styleStart.opacity = 0;

				if(e_top && e_bottom) piece[0] = piece[2] = (piece[0] + piece[2]) / 2;
				else if(e_top) piece[2] -= pieces.height;
				else if(e_bottom) piece[0] += pieces.height;
				if(e_left && e_right) piece[1] = piece[3] = (piece[1] + piece[3]) / 2;
				else if(e_left) piece[1] -= pieces.width;
				else if(e_right) piece[3] += pieces.width;

				if(effect.zoom){
					styleStart.left = pieces[cr][3];
					styleStart.top = pieces[cr][0];
					if(e_left && e_right) styleStart.left += pieces.width / 2;
					else if(e_right) styleStart.left += pieces.width;
					else if(!e_left) styleStart.left = 0;
					if(e_top && e_bottom) styleStart.top += pieces.height / 2;
					else if(e_bottom) styleStart.top += pieces.height;
					else if(!e_top) styleStart.top = 0;
					if(e_left || e_right) piece[1] = piece[3] = 0;
					if(e_top || e_bottom) piece[0] = piece[2] = 0;
					styleStart.width = e_left || e_right ? 0 : display.width;
					styleStart.height = e_top || e_bottom ? 0 : display.height;
				}

				if(effect.move){
					if(e_top){
						styleStart.top = parseInt(styleStart.top)-pieces.height;
						piece[0] += pieces.height; piece[2] += pieces.height;
					}
					if(e_bottom){
						styleStart.top = parseInt(styleStart.top)+pieces.height;
						piece[0] -= pieces.height; piece[2] -= pieces.height;
					}
					if(e_left){
						styleStart.left = parseInt(styleStart.left)-pieces.width;
						piece[1] += pieces.width; piece[3] += pieces.width;
					}
					if(e_right){
						styleStart.left = parseInt(styleStart.left)+pieces.width;
						piece[1] -= pieces.width; piece[3] -= pieces.width;
					}
				}

				styleStart.clip = piece;
				styleEnd.clip = pieces[cr];

				styleDif = [];
				foreach(styleEnd, function(property){
					if(styleStart[property].toString() != styleEnd[property].toString()){
						styleDif[property] = [];
						if(property == 'clip'){
							foreach(styleStart[property], function(n){
								styleDif[property][n] = styleEnd[property][n] - styleStart[property][n];
							});
						}else styleDif[property] = styleEnd[property] - styleStart[property];
						needAnimate[cr] = true;
					}
				});

				startStylesArr[cr] = styleStart; AnimateArr[cr] = [];
				if(effect.delay) for(var n = 0; n < Math.round(orderArr[cr]*effect.delay/effect.interval); n++) AnimateArr[cr].push(null);

				if(!needAnimate[cr]) AnimateArr[cr].push({display: ''});
				else for(frameN = 1; frameN <= effect.frames_count; frameN++){
					var style_c = [];
					if(frameN == effect.frames_count) style_c = styleEnd;
					else{
						foreach(styleDif, function(property){
							value = [];
							if(property == 'clip'){
								foreach(styleDif[property], function(n){
									value[n] = styleStart[property][n]+styleDif[property][n]*effect.easingArr[frameN]
								});
							}else value = styleStart[property]+styleDif[property]*effect.easingArr[frameN]
							style_c[property] = value;
						});
					}
					AnimateArr[cr].push(style_c);
				}

			}//for
			EffectsArr[effectsOptStr] = {startStylesArr: startStylesArr, AnimateArr: AnimateArr, needAnimate: needAnimate};
		}

		for(r = 0; r < effect.rows; r++) for(c = 0; c < effect.cols; c++){cr = r+','+c;
			if(parameters.contentmode){
				image = newElement('DIV', startStylesArr[cr]);
				image.appendChild(parameters.src.cloneNode(true));
			}else{
				image = newElement('IMG', startStylesArr[cr]);
				image.src = parameters.src;
			}
			var style = image.style;
			style.position = 'absolute';
			container.appendChild(image);
			AnimateItemsArr[cr] = style;
			if(!needAnimate[cr]) hide(AnimateItemsArr[cr]);
		}

		//ANIMATE
		var time_s = now();
		var framesCountAll = 1;
		foreach(AnimateArr, function(index){framesCountAll = Math.max(AnimateArr[index].length, framesCountAll);});
		var AnimateItem, AnimateItemsComplete = [], timerFuncStatus = true, timerFunc = function(){
			if(timerFuncStatus){
				var frameC = Math.ceil((now() - time_s) / effect.interval);
				frameC = frameC >= framesCountAll ? framesCountAll-1 : frameC-1;
				foreach(AnimateArr, function(index){
					AnimateItem = frameC > AnimateArr[index].length-1 ? AnimateArr[index].length-1 : frameC;
					if(AnimateArr[index][AnimateItem] && !AnimateItemsComplete[index+','+AnimateItem]){
						setStyles(AnimateItemsArr[index], AnimateArr[index][AnimateItem]);
						AnimateItemsComplete[index+','+AnimateItem] = true;
					}
				});
				if(frameC == framesCountAll-1){
					if(effect.count > 1){
						container.innerHTML = '';
						if(parameters.contentmode) container.appendChild(parameters.src);
						else container.innerHTML = '<img src="'+parameters.src+'" width="'+display.width+'" height="'+display.height+'" />';
					}
					parameters.callback(container);
					timerFuncStatus = false;
				}
			}
			return timerFuncStatus;
		};
		var animateInterval = setInterval(function(){
			if(!timerFunc()) clearInterval(animateInterval);
		}, effect.interval);

	}//Effects
	function getOrder(effect){
		var a = [], o, m = 0;
		if(effect.count > 1){
			o = getDefinedObject('order', effect.order);
			if(!is_array(o.cache)) o.cache = [];
			if(o.nocache || !o.cache[effect.order_cache_id]){
				a = o.method(effect);
				if(effect.reverse){
					foreach(a, function(i, v){m = Math.max(m, v);});
					foreach(a, function(i){a[i] = m - a[i];});
				}
				o.cache[effect.order_cache_id] = a;
			}
			a = o.cache[effect.order_cache_id];
		}else a['0,0'] = 0;
		return a;
	}//getOrder
	
	function getEasing(effect){
		var o = getDefinedObject('easing', effect.easing), i, c = effect.frames_count;
		if(!is_array(o.cache)) o.cache = [];
		if(!o.cache[c]){
			o.cache[c] = [];
			for(i = 1; i <= c; i++) o.cache[c][i] = o.method(i/c);
		}
		return o.cache[c];
	}//getEasing
	
	Sliderman.slider = function(parameters){
		setOpacityInit();

		var Slider = {}, current = null, previous = null, EffectN = 0, nextIndex = null, prevImg, status = 'free', isHover = false, images = [], descriptions = [], links = [], ef = function(){};

		//EVENTS
		var events = parameters.events, eventCall = events ? function(e){if(events[e] && is_function(events[e])) events[e](Slider);} : ef;
		var contentmode = parameters.contentmode;

		//SLIDER EFECTS
		var effects = [];
		var effectsNames = [];
		var addEffect = function(e){
			if(is_string(e)){
				e = e.split(',');
				if(e.length == 1){
					var globalEffect = getDefinedObject('effect', e[0]);
					if(globalEffect) addEffect(globalEffect);
				}else for(var i = 0; i < e.length; i++) addEffect(e[i]);
			}else if(e){
				e = EffectObject(e);
				var effectsId = array_search(effects, 'name', e.name);
				if(!effectsId) effectsId = effects.length;
				effectsNames.push(e.name);
				effects[effectsId] = array_copy(e);
			}
		}//addEffect
		var getEffect = function(){
			var n = 0;
			if(effects.length > 1){
				switch(display.effects_order){
					case 'slides': n = current % effectsNames.length; break;
					case 'effects': n = EffectN % effectsNames.length; break;
					default:/*random*/
						n = random(effectsNames.length);
				}
			}
			EffectN++;
			return effects[array_search(effects, 'name', effectsNames[n])];
		}//getEffect
		if(parameters.effects){
			if(!is_array(parameters.effects)) parameters.effects = [parameters.effects];
			for(var i = 0; i < parameters.effects.length; i++) addEffect(parameters.effects[i]);
		}else parameters.effects = [];
		if(!effects.length) effects = array_copy(getDefinedObjects('effect'));

		//OPTIONS
		var display = parameters.display || {};
		display.width = parameters.width;
		display.height = parameters.height;
		var loading = display.loading || {};
		var description = display.description || null;
		var navigation = display.navigation || null;
		var buttons = display.buttons || null;
		
		Slider.random = function(){
			var r = random(images.length);
			return images.length > 1 && r == current ? Slider.random() : Slider.go(r);
		}
		Slider.next = function(){
			var r = Slider.go(current === null ? 0 : current + 1);
			if(display.loop && r){
				autoplayCount++;
				if(autoplayCount+1 >= images.length*display.loop) autoplay = ef;
			}
			return r;
		}
		Slider.prev = function(){
			var r = Slider.go(current === null ? -1 : current - 1);
			if(display.loop && r) autoplayCount--;
			return r;
		}
		Slider.go = function(index){
			index = (images.length + index) % images.length;
			autoplay(false);
			if(status != 'free') nextIndex = index;
			if(status != 'free' || current == index) return autoplay(true) && false;
			previous = current;
			current = index;
			eventCall('loading');
			showLoading(true);
			if(contentmode) doEffect(images[current]);
			else loadImage(images[current], doEffect, display.always_show_loading);
			return true;
		}//go
		Slider.get = function(a){
			switch(a){
				case 'length': return images.length; break;
				case 'current': return current; break;
				case 'previous': return previous; break;
				case 'images': return images; break;
				case 'links': return links; break;
				case 'descriptions': return descriptions; break;
			}
		}//get
		var autoplayStatus = 'stop';//play,pause,stop
		Slider.play = function(){if(!display.autoplay) return;
			if(autoplayStatus != 'play'){
				var s = autoplayStatus == 'stop';
				autoplayStatus = 'play';
				if(s) (display.random ? Slider.random : Slider.go)(0);
				else autoplay(true);
			}
		}//play
		Slider.pause = function(){if(!display.autoplay) return;
			if(autoplayStatus == 'pause') Slider.play();
			else if(autoplayStatus == 'play'){
				autoplayStatus = 'pause';
				autoplay(false);
			}
		}//pause
		Slider.stop = function(){if(!display.autoplay) return;
			autoplayStatus = 'stop';
			current = null;
			previous = null;
			nextIndex = null;
			EffectN = 0;
			autoplay(false);
			removePrevImg();
			if(display.first_slide) displayFirstSlide();
			update();
		}//stop
		Slider.start = function(){if(!display.autoplay) return;
			Slider.stop();
			Slider.play();
		}//start
		
		var removePrevImg = function(){
			if(prevImg && status == 'free'){
				prevImg.parentNode.removeChild(prevImg);
				prevImg = null;
			}
		}//removePrevImg
		
		function displayFirstSlide(){
			var c = slideContainer(imagesCont, display);
			if(parameters.contentmode) c.appendChild(images[0]);
			else c.innerHTML = '<img src="'+images[0]+'" width="'+display.width+'" height="'+display.height+'" />';
			EffectN = 1;
			previous = null;
			current = 0;
		}//displayFirstSlide
		
		function update(){
			descriptionShow(); linkUpd(); navigationUpd();
		}//update

		var styleDef = {width: display.width, height: display.height, position: 'absolute', top: 0, left: 0, display: 'block'};

		var mainCont = document.getElementById(parameters.container);
		function addElementEventOnmouseover(){isHover = true;
			if(buttons && buttons.hide) show(buttonsCont.style);
			if(description && description.hide && !contentmode) show(descriptionCont.style);
			if(display.pause) autoplay(false);
		}
		addElementEvent(mainCont, 'onmouseover', addElementEventOnmouseover);
		function addElementEventOnmouseout(){isHover = false;
			if(buttons && buttons.hide) hide(buttonsCont.style);
			if(description && description.hide && !contentmode) hide(descriptionCont.style);
			if(display.pause) autoplay(true);
		}
		addElementEvent(mainCont, 'onmouseout', addElementEventOnmouseout);

		//GET CONTENT
		var maps = document.getElementsByTagName('MAP');
		for(var i = 0; i < mainCont.childNodes.length; i++) if(mainCont.childNodes[i].nodeType == 1){
			if(contentmode) images.push(mainCont.childNodes[i].cloneNode(true));
			else{
				switch(mainCont.childNodes[i].tagName){
					case 'A':
						var img = mainCont.childNodes[i].getElementsByTagName('IMG');
						if(img.length){
							images.push(img[0].src);
							links[images.length-1] = mainCont.childNodes[i];
						}else descriptions[images.length-1] = mainCont.childNodes[i];
					break;
					case 'IMG':
						images.push(mainCont.childNodes[i].src);
						if(mainCont.childNodes[i].useMap && maps.length) for(var m = 0; m < maps.length; m++){
							if(maps[m].name && mainCont.childNodes[i].useMap.replace(/^[^#]*#/, '') == maps[m].name) links[images.length-1] = maps[m];
						}
					break;
					case 'MAP': continue; break;
					default: descriptions[images.length-1] = mainCont.childNodes[i];
				}
			}
			hide(mainCont.childNodes[i].style);
		}
		if(!contentmode) for(var i = 0; i < images.length; i++) loadImage(images[i]);

		//CONTAINERS
		var sliderCont = newElement('DIV', {width: display.width, height: display.height, position: 'relative'}); mainCont.appendChild(sliderCont);
		var imagesCont = newElement('DIV', styleDef); sliderCont.appendChild(imagesCont);
		partsCont = sliderCont;

		//LINKS
		if(contentmode) var linkUpd = ef;
		else{
			var lnk = newElement('DIV', styleDef); partsCont.appendChild(lnk);
			var linkUpd = function(){
				lnk.innerHTML = ''; value = links[current];
				if(value){
					if(value.tagName == 'MAP'){
						var a = newElement('IMG', styleDef);
						a.src = images[current]; a.useMap = '#'+value.name;
					}else{
						var a = newElement('A', styleDef);
						a.href = value.href; a.target = value.target;
					}
					setStyles(a.style, {opacity: 0, background: '#000000'});
					a.onfocus = this_blur;
					lnk.appendChild(a);
				}
			}
		}

		//LOADING
		if(contentmode) var showLoading = ef;
		else{
			var loadingCont = newElement('DIV'); partsCont.appendChild(loadingCont);
			hide(loadingCont.style);
			if(loading.background){
				var loadingBgStyle = array_copy(styleDef);
				loadingBgStyle.background = loading.background;
				if(loading.opacity) loadingBgStyle.opacity = loading.opacity;
				loadingCont.appendChild(newElement('DIV', loadingBgStyle));
			}
			if(loading.image){
				var loadingImgStyle = array_copy(styleDef);
				loadingImgStyle.background = 'url('+(loading.image)+') no-repeat center center';
				loadingCont.appendChild(newElement('DIV', loadingImgStyle));
			}
			var showLoading = function(a){
				if(a) show(loadingCont.style);
				else hide(loadingCont.style);
				status = a ? 'loading' : 'free';
			}
		}

		//DESCRIPTION
		var descriptionShow;
		if(description && !contentmode){
			var descriptionCont = newElement('DIV'); partsCont.appendChild(descriptionCont);
			if(description.hide) hide(descriptionCont.style);

			var descriptionStl = {position: 'absolute', overflow: 'hidden', textAlign: 'left'};
			if(!description) description = [];
			description.position = validateOption(description.position, 'top,left,right,bottom')
			descriptionStl.background = description.background || 'white';
			descriptionStl.opacity = description.opacity || 0.5;
			descriptionStl.width = description.position == 'top' || description.position == 'bottom' ? display.width : description.width || display.width*0.2;
			descriptionStl.height = description.position == 'left' || description.position == 'right' ? display.height : description.height || display.height*0.2;
			descriptionStl[description.position == 'bottom'?'bottom':'top'] = 0;
			descriptionStl[description.position == 'right'?'right':'left'] = 0;

			var descBg = newElement('DIV', descriptionStl); descriptionCont.appendChild(descBg);
			descriptionStl.opacity = 1; descriptionStl.background = '';
			var desc = newElement('DIV', descriptionStl); descriptionCont.appendChild(desc);

			function descriptionShow(){
				desc.innerHTML = '';
				setStyle(descriptionCont.style, 'visibility', 'hidden');
				var value = descriptions[current];
				if(value){
					setStyle(descriptionCont.style, 'visibility', 'visible');
					value = value.cloneNode(true);
					show(value.style);
					desc.appendChild(value);
					if(isHover) show(descriptionCont.style);
				}
			}
		}else descriptionShow = ef

		//BUTTONS
		if(buttons){
			var buttonsCont = newElement('DIV'); partsCont.appendChild(buttonsCont);
			if(buttons.hide) hide(buttonsCont.style);
			var btnPrev = newElement('A'); buttonsCont.appendChild(btnPrev);
			btnPrev.href = 'javascript:void(0);';
			var btnNext = btnPrev.cloneNode(true); buttonsCont.appendChild(btnNext);
			btnPrev.onfocus = this_blur;
			btnNext.onfocus = this_blur;
			btnPrev.onclick = Slider.prev;
			btnNext.onclick = Slider.next;
			if(buttons.prev.label) btnPrev.innerHTML = is_string(buttons.prev.label) ? buttons.prev.label : 'prev';
			if(buttons.prev.label) btnNext.innerHTML = is_string(buttons.next.label) ? buttons.next.label : 'next';
			if(buttons.prev.className) btnPrev.className = buttons.prev.className;
			if(buttons.next.className) btnNext.className = buttons.next.className;
			if(buttons.opacity || buttons.prev.opacity) setOpacity(btnPrev.style, buttons.opacity || buttons.prev.opacity);
			if(buttons.opacity || buttons.next.opacity) setOpacity(btnNext.style, buttons.opacity || buttons.next.opacity);
		}

		//NAVIGATION
		var navigationUpd;
		if(navigation){
			var navigationCont = document.getElementById(navigation.container);
			var a;

			if(navigation.prev){
				a = newElement('A');
				if(navigation.prev.label) a.innerHTML = is_string(navigation.prev.label) ? navigation.prev.label : 'Prev';
				if(navigation.prev.className) a.className = navigation.prev.className;
				a.href = 'javascript:void(0);';
				a.onfocus = this_blur;
				a.onclick = Slider.prev;
				navigationCont.appendChild(a);
			}

			var navigationLinks = [];
			function a_onclick(){Slider.go(this.id.replace(parameters.container+'_SliderNavigation', ''));};
			for(var i = 0; i < images.length; i++){
				a = newElement('A');
				if(navigation.label) a.innerHTML = is_string(navigation.label) ? navigation.label : i+1;
				if(navigation.className) a.className = navigation.className;
				a.href = 'javascript:void(0);';
				a.id = parameters.container+'_SliderNavigation'+i;
				a.onfocus = this_blur;
				a.onclick = a_onclick;
				navigationLinks.push(a);
				navigationCont.appendChild(a);
			}

			if(navigation.next){
				a = newElement('A');
				if(navigation.next.label) a.innerHTML = is_string(navigation.next.label) ? navigation.next.label : 'Next';
				if(navigation.next.className) a.className = navigation.next.className;
				a.href = 'javascript:void(0);';
				a.onfocus = this_blur;
				a.onclick = Slider.next;
				navigationCont.appendChild(a);
			}

			function navigationUpd(){
				for(var i = 0; i < navigationLinks.length; i++) navigationLinks[i].className = navigationLinks[i].className.replace(/\bactive\b/g, '');
				if(navigationLinks[current]) navigationLinks[current].className += ' active';
			}
		}else navigationUpd = ef

		//AUTOPLAY
		var autoplayCount = 0;
		if(display.autoplay){
			var autoplayTimeout;
			var autoplay = function(a){
				if(autoplayTimeout){
					clearTimeout(autoplayTimeout);
					autoplayTimeout = null;
				}
				if(a && !(isHover && display.pause) && autoplayStatus == 'play') autoplayTimeout = setTimeout(display.random ? Slider.random : Slider.next, display.autoplay);
			}//autoplay
		}else var autoplay = ef

		var doEffect = function(src){
			if(autoplayStatus == 'stop') autoplayStatus = 'pause';
			eventCall('before');
			showLoading(false); status = 'busy'; update();
			Effects({effect: getEffect(), display: display, container: imagesCont, src: src, callback: function(img){
				status = 'free'; autoplay(true);
				removePrevImg();
				prevImg = img;
				eventCall('after');
				if(autoplayStatus == 'stop') removePrevImg();
				else if(nextIndex !== null){
					Slider.go(nextIndex);
					nextIndex = null;
				}
			}, contentmode: contentmode});
		};

		if(display.mousewheel){
			onmousewheel = function(d){
				if(d > 0) Slider.prev();
				else if(d < 0) Slider.next();
				return true;
			};
			function wheel(event){
				var d = 0;
				if(!event) event = window.event;
				if(event.wheelDelta){
					d = event.wheelDelta/120;
					if(window.opera) d = -d;
				}else if(event.detail) d = -event.detail/3;
				if(d && onmousewheel(d)){
					if(event.preventDefault) event.preventDefault();
					event.returnValue = false;
				}
			}//wheel
			if(mainCont.addEventListener){
				mainCont.addEventListener("DOMMouseScroll",wheel,false);
				mainCont.addEventListener("mousewheel",wheel,false);
			}else addElementEvent(mainCont, 'onmousewheel', wheel);
		}
		
		if(display.first_slide) displayFirstSlide();
		update();
		if(typeof(display.autostart) == 'undefined' || display.autostart) Slider.play();
		return Slider;
	}//Sliderman.slider
	

}//Sliderman

/* predefined easing functions */
Sliderman.easing({name: 'none', method: function(x){return x;}});
Sliderman.easing({name: 'swing', method: function(x){return -Math.cos(x*Math.PI)/2 + 0.5;}});
Sliderman.easing({name: 'wave', method: function(t){return ((Math.cos((1-t)*3*Math.PI+2*Math.PI))*0.5+0.5+t)/2;}});
Sliderman.easing({name: 'bounce', method: function(t){return 1 - Math.abs(Math.cos((1-t)*(2.5+t*t*3)*Math.PI+0.5*Math.PI)*(1-t));}});
/* predefined order functions */
Sliderman.order({name: 'straight', method: function(e){
	var cols = e.cols, rows = e.rows, road = e.road, count = e.count;
	var a = [], i = 0, c = 0, r = 0, cl = cols - 1, rl = rows - 1, il = count - 1, cr;
	for(r = 0; r < rows; r++) for(c = 0; c < cols; c++){cr = r+','+c;
		switch(road){
			case 'BL': a[cr] = il-(c*rows+(rl-r)); break;
			case 'RT': a[cr] = il-(r*cols+(cl-c)); break;
			case 'TL': a[cr] = il-(c*rows+r);
			case 'LT': a[cr] = il-(r*cols+c); break;
			case 'BR': a[cr] = c*rows+r; break;
			case 'LB': a[cr] = r*cols+(cl-c); break;
			case 'TR': a[cr] = c*rows+(rl-r); break;
			default: a[cr] = r*cols+c; break;//'RB'
		}
	}
	return a;
}});
Sliderman.order({name: 'swirl', method: function(e){
	var cols = e.cols, rows = e.rows, road = e.road, count = e.count;
	var a = [], i = 0, c = 0, r = 0, cl = cols - 1, rl = rows - 1, il = count - 1, cr;
	var courses, course = 0;
	switch(road){
		case 'BL': c = cl; r = 0; courses = ['r+', 'c-', 'r-', 'c+']; break;
		case 'RT': c = 0; r = rl; courses = ['c+', 'r-', 'c-', 'r+']; break;
		case 'TL': c = cl; r = rl; courses = ['r-', 'c-', 'r+', 'c+']; break;
		case 'LT': c = cl; r = rl; courses = ['c-', 'r-', 'c+', 'r+']; break;
		case 'BR': c = 0; r = 0; courses = ['r+', 'c+', 'r-', 'c-']; break;
		case 'LB': c = cl; r = 0; courses = ['c-', 'r+', 'c+', 'r-']; break;
		case 'TR': c = 0; r = rl; courses = ['r-', 'c+', 'r+', 'c-']; break;
		default: c = 0; r = 0; courses = ['c+', 'r+', 'c-', 'r-']; break;//'RB'
	}
	i = 0;
	while(i < count){
		cr = r+','+c;
		if(c >= 0 && c < cols && r >= 0 && r < rows && typeof(a[cr]) == 'undefined') a[cr] = i++;
		else switch(courses[course++%courses.length]){case 'c+': c--; break; case 'r+': r--; break; case 'c-': c++; break; case 'r-': r++; break;}
		switch(courses[course%courses.length]){case 'c+': c++; break; case 'r+': r++; break; case 'c-': c--; break; case 'r-': r--; break;}
	}
	return a;
}});
Sliderman.order({name: 'snake', method: function(e){
	var cols = e.cols, rows = e.rows, road = e.road, count = e.count;
	var a = [], i = 0, c = 0, r = 0, cl = cols - 1, rl = rows - 1, il = count - 1, cr;
	var courses, course = 0;
	switch(road){
		case 'BL': c = cl; r = 0; courses = ['r+', 'c-', 'r-', 'c-']; break;
		case 'RT': c = 0; r = rl; courses = ['c+', 'r-', 'c-', 'r-']; break;
		case 'TL': c = cl; r = rl; courses = ['r-', 'c-', 'r+', 'c-']; break;
		case 'LT': c = cl; r = rl; courses = ['c-', 'r-', 'c+', 'r-']; break;
		case 'BR': c = 0; r = 0; courses = ['r+', 'c+', 'r-', 'c+']; break;
		case 'LB': c = cl; r = 0; courses = ['c-', 'r+', 'c+', 'r+']; break;
		case 'TR': c = 0; r = rl; courses = ['r-', 'c+', 'r+', 'c+']; break;
		default: c = 0; r = 0; courses = ['c+', 'r+', 'c-', 'r+']; break;//'RB'
	}
	i = 0;
	while(i < count){cr = r+','+c;
		if(c >= 0 && c < cols && r >= 0 && r < rows && typeof(a[cr]) == 'undefined'){a[cr] = i++;
			switch(courses[course%courses.length]){case 'c+': c++; break; case 'r+': r++; break; case 'c-': c--; break; case 'r-': r--; break;}
		}
		else{
			switch(courses[course++%courses.length]){case 'c+': c--; break; case 'r+': r--; break; case 'c-': c++; break; case 'r-': r++; break;}
			switch(courses[course++%courses.length]){case 'c+': c++; break; case 'r+': r++; break; case 'c-': c--; break; case 'r-': r--; break;}
		}
	}
	return a;
}});
Sliderman.order({name: 'straight_stairs', method: function(e){
	var cols = e.cols, rows = e.rows, road = e.road, count = e.count;
	var a = [], i = 0, c = 0, r = 0, cl = cols - 1, rl = rows - 1, il = count - 1, cr;
	switch(road){
		case 'BL': case 'TR': case 'TL': case 'BR': var C = 0, R = 0; break;
		case 'LB': case 'RT': case 'LT': case 'RB': default: road = 'RB'; var C = cl, R = 0; break;
	}
	c = C; r = R;
	while(i < count){cr = r+','+c;
		if(road.indexOf('T') == 1 || road.indexOf('R') == 1) a[cr] = il - i++;
		else a[cr] = i++;
		switch(road){
			case 'BL': case 'TR': c--; r++; break;
			case 'TL': case 'BR': c++; r--; break;
			case 'LB': case 'RT': c--; r--; break;
			case 'RB': case 'LT': default: c++; r++; break;
		}
		if(c < 0 || r < 0 || c > cl || r > rl){
			switch(road){
				case 'BL': case 'TR': C++; break;
				case 'LB': case 'RT': case 'TL': case 'BR': R++; break;
				case 'RB': case 'LT': default: C--; break;
			}
			if(C < 0 || R < 0 || C > cl || R > rl){
				switch(road){
					case 'BL': case 'TR': C = cl; R++; break;
					case 'TL': case 'BR': R = rl; C++; break;
					case 'LB': case 'RT': R = rl; C--; break;
					case 'RB': case 'LT': default: C = 0; R++; break;
				}
				if(R > rl) R = rl; else if(R < 0) R = 0; else if(C > cl) C = cl; else if(C < 0) C = 0;
			}
			r = R; c = C;
		}
	}
	return a;
}});
Sliderman.order({name: 'square', method: function(effect){
	var cols = effect.cols || 1, rows = effect.rows || 1, arr = [], i = 0, c, r, dc, dr, cr;
	dc = cols < rows ? (rows-cols)/2 : 0; dr = cols > rows ? (cols-rows)/2 : 0; cr = Math.round(Math.max(cols/2, rows/2)) + 1;
	for(c = 0; c < cols; c++) for(r = 0; r < rows; r++) arr[r+','+c] = cr - Math.min(c+1+dc, r+1+dr, cols-c+dc, rows-r+dr);
	return arr;
}});
Sliderman.order({name: 'rectangle', method: function(effect){
	var cols = effect.cols || 1, rows = effect.rows || 1, arr = [], i = 0, c, r, cr;
	cr = Math.round(Math.min(cols/2, rows/2)) + 1;
	for(c = 0; c < cols; c++) for(r = 0; r < rows; r++) arr[r+','+c] = cr - Math.min(c+1, r+1, cols-c, rows-r);
	return arr;
}});
Sliderman.order({name: 'random', method: function(effect){
	var a = [], tmp = [], r, c, i;
	for(r = 0; r < effect.rows; r++) for(c = 0; c < effect.cols; c++) tmp.push(r+','+c);
	tmp.sort(function(a,b){return Math.random() > 0.5;});
	for(i = 0; i < effect.count; i++) a[tmp[i]] = i;
	return a;
}});
Sliderman.order({
	name: 'circle', method: function(effect){
  	var cols = effect.cols || 1, rows = effect.rows || 1, arr = [], i = 0, c, r;
  	var hc = cols/2-0.5, hr = rows/2-0.5;
		for(c = 0; c < cols; c++) for(r = 0; r < rows; r++) arr[r+','+c] = Math.round(Math.sqrt(Math.pow(c-hc, 2)+Math.pow(r-hr, 2)));
		return arr;
	}
});
Sliderman.order({
	name: 'cross', method: function(effect){
  	var cols = effect.cols || 1, rows = effect.rows || 1, arr = [], i = 0, c, r;
  	var hc = cols/2-0.5, hr = rows/2-0.5;
		for(c = 0; c < cols; c++) for(r = 0; r < rows; r++) arr[r+','+c] = Math.round(Math.min(Math.abs(c-hc), Math.abs(r-hr)));
		return arr;
	}
});
Sliderman.order({
	name: 'rectangle_cross', method: function(effect){
  	var cols = effect.cols || 1, rows = effect.rows || 1, arr = [], i = 0, c, r;
  	var hc = cols/2-0.5, hr = rows/2-0.5, cr = Math.max(hc, hr)+1;
		for(c = 0; c < cols; c++) for(r = 0; r < rows; r++) arr[r+','+c] = Math.round(cr-Math.max(hc-Math.abs(c-hc), hr-Math.abs(r-hr)))-1;
		return arr;
	}
});
/* predefined effects */
Sliderman.effect({name: 'fade', fade: true, duration: 400});
Sliderman.effect({name: 'move', left: true, move: true, duration: 400});
Sliderman.effect({name: 'stairs', cols: 7, rows: 5, delay: 30, order: 'straight_stairs', road: 'BL', fade: true});
Sliderman.effect({name: 'blinds', cols: 10, delay: 100, duration: 400, order: 'straight', right: true, zoom: true, fade: true});
Sliderman.effect({name: 'rain', cols: 10, delay: 100, duration: 400, order: 'straight', top: true, fade: true});


