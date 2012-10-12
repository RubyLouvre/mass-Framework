这个是设置位置.
function setCurPosition(t, s, e){
			var s, e, range, stored_range;
			if(t.selectionStart  ==  undefined){
				var txtRanage = t.createTextRange();
				txtRanage.move('character', s);
				e && txtRanage.moveEnd('character', e - s);
				txtRanage.select();
			}else{
				t.selectionStart = s;
				t.selectionEnd = e || s;
			}
		}
这个是得到位置
$.fn.selection = function(){
		var s, e, range, stored_range;
		if(this[0].selectionStart  ==  undefined){
			var selection = document.selection;
			if (this[0].tagName.toLowerCase() !=  "textarea") {
				var val = this.val(), 
					range = selection.createRange().duplicate();
				range.moveEnd("character",  val.length);
				s = (range.text  ==  "" ? val.length : val.lastIndexOf(range.text));
				range = selection.createRange().duplicate();
				range.moveStart("character",  -val.length);
				e = range.text.length;
			} else {
				range = selection.createRange();
				stored_range = range.duplicate();
				stored_range.moveToElementText(this[0]);
				stored_range.setEndPoint('EndToEnd',  range);
				s = stored_range.text.length - range.text.length;
				e = s + range.text.length;
			}
		}else{
			s = this[0].selectionStart;
			e = this[0].selectionEnd;
		}
		var te = this[0].value.substring(s, e);
		return {s:s, e:e, t:te};
	};
        
        //=====================
        /**
         *香蕉梨(609004948) 
	 * 选取文本框中的文本
	 * 
	 * @param {Object} Object Dom对象
	 * @param {Number} Number 开始位置
	 * @param {Number} Number 结束位置
	 * @param {Number} Number 当前位置
	 *            @example
	 *            MI.selectTxt(el,1,2,2);
	 */
	selectTxt : function(el,start,end,curPosition){
		var range;
		if (document.createRange) {
			el.setSelectionRange(start,end);
		}
		else {
			range = el.createTextRange();
			range.collapse(1);
			range.moveStart('character',start);
			range.moveEnd('character',end - start);
			range.select();
		}
	},
	/**
	 * 返回文本框中的文本参数
	 * 
	 * @param {Object} Object Dom对象
	 * @return {Object} Object {start:开始位置,end:结束位置,txt:选中文本}
	 *            @example
	 *            getSelectTxt(el);
	 */
	getSelectTxt : function(el){
		var start = MI.cursorX(el),end = 0,txt = '';
		if (document.selection) {
			txt = document.selection.createRange().text;
			end = start + txt.length;
		} else {
			end = el.selectionEnd;
			txt = el.value.substring(start, end);
		}
		return {
			start : start,
			end : end,
			txt : txt
		}
	},
	insertTxt : function(el,text,cursorX,del){
		if (del == undefined) {
			del = 0;
		}
		el.focus();
		if (document.selection) {
			var range = document.selection.createRange();
			range.moveStart('character',-del);
			range.text = text;
		}
		else {
			var textTmp = el.value,
				cursor = cursorX + text.length - del;
			el.value = textTmp.substring(0,cursorX - del) + text + textTmp.substring(cursorX,textTmp.length);
			MI.selectTxt(el,cursor,cursor,cursor);
		}
	},
	/**
	 * 获取光标位置
	 * 
	 * @param {Object} Object Dom对象
	 * @return {Number} Number 光标位置
	 *            @example
	 *            MI.cursorX(el);
	 */
	cursorX : function(el){
		if (document.selection){

			var range = document.selection.createRange(),position = 0,txt;
			range.moveStart ('character',-el.value.length);
			txt = range.text.split('\001');
			var selectedTxt = document.selection.createRange().text; //有文字选中时，取到的MI.cursorX包括了选中的文字长度
			position = txt[txt.length - 1].replace(/\r/g,'').length - selectedTxt.length;
			return position;

		}
		else return el.selectionStart;
	},

//腾讯微博用的

按照这种写法，如果文本框中文字选中的话，ie下获取光标位置会有些问题...
香蕉梨(609004948)  16:39:20
 
所以这里要减去长度

香蕉梨(609004948)  16:40:17
txt = range.text.split('\001');  这一句的\001   是在每个textArea前面加上的\001字符
专门用于取位置的，没加的话不行 
香蕉梨(609004948)  16:42:37
ie下的问题是会把textarea外面的前面某些字符给算到textarea的计算中
香蕉梨(609004948)  16:43:04
所以加个\001做区分，然后split  得到正确的计算值
