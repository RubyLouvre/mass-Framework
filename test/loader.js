define(["$spec"],function(require, exports, module){

    var gexports = exports
    $.fixture('模块加载模块的加载测试', {
        "加载单个模块":function(id){
            //语言模块会返回一个函数
            $.require("$lang",function(ret){
                expect(typeof  ret === "function", id).ok();
            });
            //特征嗅探模块会返回一个对象，包含所有测试结果
            $.require("$support",function(ret){
                expect( typeof  ret === "object", id).ok();
            });
            //类工厂没有返回值，返回exports对象
            $.require("$class",function(ret){
                expect( typeof ret === "object", id).ok();
                expect( ret !== gexports, id).ok();
                expect( ret == $.modules[$.core.base+"class.js"].exports, id).ok();
            });
            $.require( $.core.base + "class", function(ret){
                expect( ret == $.modules[$.core.base+"class.js"].exports, id).ok();
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
                expect( ret.bbb, id).eq( "bbb" );
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
        "测试module相关的元信息": function(){
            expect( /\/test\/loader\.js/i.test(module.id) ).ok()
            expect( module.parent ).eq( $.core.base )
            expect( module.args[0] ).eq( $.core.base + "more/spec.js") ;
        }

    });

})