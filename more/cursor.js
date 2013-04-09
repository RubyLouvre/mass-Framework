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