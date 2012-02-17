$.require("ready,event,fx",function(){
    var search = $("#search"), hash = window, prefix = "",  fixIE = NaN;
    search.addClass("search_target");
    search.input(function(){//监听输入
        var
        input = this.value,//原始值
        val = input.slice( prefix.length),//比较值
        output = []; //用来放置输出内容
        if( fixIE === input){
            return //IE下肃使是通过程序改变输入框里面的值也会触发propertychange事件，导致我们无法进行上下翻操作
        }
        for(var prop in hash){
            if( prop.indexOf( val ) === 0  ){//取得以输入值开头的API
                if( output.push( '<li><a href="javascript:void(0)" data-value="'+prefix +
                    prop+'">'+ input + "<b>" + (prefix  + prop ).slice( input.length ) +"</b></a></li>" ) == 10){
                    break;
                }
            }
        }
        //如果向前遇到点号,或向后取消点号
        if( val.charAt(val.length - 1) === "." || (input && !val) ){
            var arr = input.split("."); hash = window;
            for(var j = 0; j < arr.length; j++){
                var el = arr[j];
                if(el && hash[ el ]){
                    hash = hash[ el ];//重新设置要遍历API的对象
                }
            }
            prefix = input == "." ? "" : input;
            for( prop in hash){
                if( output.push( '<li><a href="javascript:void(0)" class="search_target" data-value="'+prefix +
                    prop+'">'+ input + "<b>" + (prefix + prop ).slice( prefix.length ) +"</b></a></li>" ) == 10){
                    break;
                }
            }
        }
        if(!input){
            hash = window;
            fixIE = prefix = output = [];
        }
        $("#suggest_list").html( output.join("") );
    });
    var glowIndex = -1,  dd = $("#leftsection dd");
    $(document).keyup(function(e){//监听上下翻
        if(/search_target/i.test( e.target.className)){//只代理特定元素,提高性能
            var upOrdown = 0
            if(e.which === 38 || e.which === 104){ //up 8
                upOrdown --;
            }else if(e.which === 40 || e.which === 98){//down 2
                upOrdown ++;
            }
            if(upOrdown){
                var list =  $("#suggest_list a");
                //转移高亮的栏目
                list.eq(glowIndex).removeClass("glow_suggest");
                glowIndex += upOrdown;
                var el = list.eq( glowIndex ).addClass("glow_suggest");
                fixIE = el.attr("data-value")
                search.val( fixIE )
                if(glowIndex === list.length - 1){
                    glowIndex = -1;
                }
            }
        }
    });
    search.keyup(function(e){//监听提交
        var input = this.value;
        if(input && (e.which == 13 || e.which == 108)){ //如果按下ENTER键
            for(var i = 0 , el ; el = dd[i++];){
                var path = $(el).attr("path");
                var start = path.indexOf("/");
                if( path.slice(start+1).indexOf(input) === 0){
                    $("#iframe").attr("src", "/doc/"+path );//更新iframe
                    console.log("8888888888888")
                    $("#suggest_list").html( "" );
                    break;
                }
            }
        }
    });

})
//初步完成suggest控件,其实更像IDE的语法提示

