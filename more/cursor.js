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

dom的范围是非常讨厌也是非常强大的一个部分。为了以后不百度，封装了一下操纵光标的函数。

目前的功能：
设置光标位置
设置一个选区
得到光标位置
得到选区的值
<!DOCTYPE HTML>
<html lang="en-US">
<head>
	<meta charset="UTF-8">
	<title></title>
</head>
<body>
<label for="textA">点击选择后可得到光标位置</label><input type="text" name="" id="textA" value="hello"/>
<label for="numberSetStart">设置光标起始位置</label><input type="text" name="" id="numberSetStart" value="2"/>
<label for="numberSetEnd">设置光标结束位置</label><input type="text" name="" id="numberSetEnd" value="2"/>
<input type="button" value="点击设置光标位置" id="setPos"/>
	<script type="text/javascript">
	var cursorPos = {
		getTxt : function(o) {
		var start= this.getStart(o);
		var end= this.getEnd(o);
		return (start != end) ? o.value.substring(start,end): "";
	},
		getStart : function (o) {
			if (o.createTextRange) {
				var r = document.selection.createRange().duplicate()
					r.moveEnd('character', o.value.length)
					if (r.text == '')
						return o.value.length
						return o.value.lastIndexOf(r.text)
			} else
				return o.selectionStart
		},
		getEnd : function (o) {
			if (o.createTextRange) {
				var r = document.selection.createRange().duplicate()
					r.moveStart('character', -o.value.length)
					return r.text.length
			} else
				return o.selectionEnd
		},
		set : function (o, a, b) {
			//o是当前对象，例如文本域对象
			//a是起始位置，b是终点位置
			var a = parseInt(a, 10),
			b = parseInt(b, 10);
			var l = o.value.length;
			if (l) {
				//如果非数值，则表示从起始位置选择到结束位置
				!a&&(a = 0);
				!b&&(b = l);
				(a > l)&&(a = l);
				(b > l)&&(b = l);
				//如果为负值，则与长度值相加
				(a < 0) &&(a = l + a);
				(b < 0)&&(b = l + b);
				if (o.createTextRange) { //IE浏览器
					var range = o.createTextRange();
					range.moveStart("character", -l);
					range.moveEnd("character", -l);
					range.moveStart("character", a);
					range.moveEnd("character", b);
					range.select();
				} else {
					o.setSelectionRange(a, b);
					o.focus();
				}
			}
		}
	}
	function $id(s){
	return document.getElementById(s)
	}
	window.onload = function(){
	$id('textA').onclick = function(){
	alert('光标位置:'+cursorPos.getStart($id('textA'))+'选择区域尾端:'+cursorPos.getEnd($id('textA'))+'区域的值是'+cursorPos.getTxt($id('textA')))
	}
	$id('setPos').onclick = function(){
	cursorPos.set($id('textA'),$id('numberSetStart').value,$id('numberSetEnd').value)
	}
	}
	</script>
</body>
</html>


测试地址：http://jsbin.com/opusuy/1

参考了

http://www.zhangxinxu.com/study/201004/textarea-test-select-code-test.html

http://www.zhangxinxu.com/wordpress/?p=1428

http://www.planabc.net/demo/range/textarea-cursor-position.html

http://javascript.nwbox.com/cursor_position/
