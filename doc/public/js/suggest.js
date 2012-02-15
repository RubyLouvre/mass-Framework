$.require("ready,event,fx",function(){
    var hash = $, prefix = "", last = [];//上次的查询结果
    $("#search").input(function(e){
        var
        input = this.value,//原始值
        val = input.slice(prefix.length),//比较值
        output = [], //用来放置输出内容
        apis = []; //放置方法或属性名
        $.log(val)

        for(var prop in hash){
            if( prop.indexOf(val) === 0  ){
                apis.push( prop );
                if( output.push( '<li><a href="javascript:void(0)" data-value="'+prefix +
                    prop+'">'+ input + "<b>" + (prefix  + prop ).slice( input.length ) +"</b></a></li>" ) == 10){
                    break;
                }
            }
        }
        if(apis.length){
            last = apis
        }
        if( val.charAt(val.length - 1) === "." ){
            if(last[0]){
                hash = hash[ last[0] ], prefix = last[0]+".";
            }
            var sliceLen = input.length === 1 ? 0 : input.length;
            for(var prop in hash){
                apis.push( prop );
                if( output.push( '<li><a href="javascript:void(0)" data-value="'+prefix +
                    prop+'">'+ input + "<b>" + (prefix  + prop ).slice( sliceLen ) +"</b></a></li>" ) == 10){
                    break;
                }
            }
        }
        $("#suggest_list").html( output.join("") );
        if(!input){
            hash = $;
            prefix = "";
            last = output = apis = [];
        }
    });
    var glowIndex = -1;
    $(window).keyup(function(e){
        e.preventDefault();
        var upOrdown = 0
        if(e.which === 38 || e.which === 104){ //up 8
            upOrdown = -1;
        }else if(e.which === 40 || e.which === 98){//down
            upOrdown = +1;
        }
        if(upOrdown){
            var list =  $("#suggest_list a");
            list.eq(glowIndex).removeClass("glow_suggest");
            glowIndex += upOrdown;
            if(glowIndex > list.length){
                glowIndex = 0
            }
            var el = list.eq( glowIndex ).addClass("glow_suggest");
            $("#search").val( el.attr("data-value") )
        }

    });

})

