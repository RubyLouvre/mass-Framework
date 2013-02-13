define(["$spec"],function( spec ){
  
    describe('loader', {
        "加载单个模块":function(id){
            //语言模块会返回一个函数
            $.require("$lang",function(ret){
                expect(typeof ret.each , id).eq( "function" );
            });
            //特征嗅探模块会返回一个对象，包含所有测试结果
            $.require("$support",function(ret){
                expect( ret, id).eq( spec );
            });
            //类工厂没有返回值，返回exports对象
            $.require("$class",function(ret){
                expect( typeof ret.factory , id).eq("function");
                expect( ret == spec, id).ok();
                expect( ret == $.modules[$.config.base+"class.js"].exports, id).ok();
            });
            $.require( $.config.base + "class", function(ret){
                expect( ret == $.modules[$.config.base+"class.js"].exports, id).ok();
            });
            //测试加载同一目录的模块
            $.require( "./test/mmm", function(ret){
                expect( ret, id).eq( "这是mmm模块的返回值");
            });
            //测试填得很深的模块
            $.require( "./test/loader/aaa", function(ret){
                expect( ret, id).eq( "aaa" );
            });
            //测试是用exports做返回值的模块
            $.require( "./test/loader/bbb", function(ret){
                $.log("测试./test/loader/bbb")
                expect( ret.bbb, id).eq( "bbb" );
            });
            $.require( "./test/loader/aaa.bbb.ccc", function(ret){
                $.log("测试./test/loader/aaa.bbb.ccc")
                expect( ret, id).eq( "aaa.bbb.ccc" );
            });
        },
        "测试exports模块依赖":function(id){
            //ccc模块与aaa模块是位于同一目录下,并将aaa模块的返回值作为ccc的exports的一个属性
            $.require("./test/loader/ccc", function(ret){
                expect( ret.aaa, id).eq( "aaa" );
                expect( ret.ccc, id).eq( "ccc" );
            });
            $.require("./test/loader/bbb", function(ret){
                expect( ret.aaa, id).eq( "aaa" );
                expect( ret.ccc, id).eq( "ccc" );
                expect( ret.bbb, id).eq( "bbb" );
            });
            $.require("./test/loader/ddd", function(ret){
                expect( ret.ddd, id).eq( "ddd" );
                expect( ret.length, id).eq( 4 );
            });
            //测试exports模块依赖
            $.require("./test/loader/eee", function(ret){
                expect( ret.aaa, id).eq( "aaa" );
                expect( ret.ggg, id).eq( "ggg" );
                expect( ret.eee, id).eq( "eee" );
            });
        },
        "返回值测试":function(id){
            //以下几个模块都是返回mass的命名空间对象,与spec模块一样
            $.require("$lang", function(ret){
                expect( ret, id).eq( spec );
            });
            $.require("$class", function(ret){
                expect( ret, id).eq( spec );
            });
            $.require("$support", function(ret){
                expect( ret, id).eq( spec );
            });
            $.require("$attr", function(ret){
                expect( ret, id).eq( spec );
            });
            $.require("$css", function(ret){
                expect( ret, id).eq( spec );
            });
            $.require("$event", function(ret){
                expect( ret, id).eq( spec );
            });
            $.require("$node", function(ret){
                expect( ret, id).eq( spec );
            });
            $.require("$fx", function(ret){
                expect( ret, id).eq( spec );
            });
            $.require("$ajax", function(ret){
                expect( ret, id).eq( spec );
            });
            //以下两个模块特殊
            $.require("$query", function(ret){
                expect( typeof ret.pseudoHooks, id).eq( "object" );
            });

        },
        "死链测试": function(){
            $.require("dead_link",function(){
                $.log("这个回调是永远不执行， 我们可以在控制台查看打印日志")
            });
        }
    })
});
