$.define("store","more/spec,more/store",function(s, store){
    $.fixture('本地储存模块', {
        "set": function(){
            store.clear()

            store.set('foo', 'bar')
            expect( store.get('foo') ).eq( 'bar')

            store.remove('foo');
            expect( store.get('foo') ).eq( null );
            
            store.set('foo', 'bar1')
            store.set('foo', 'bar2')
            expect( store.get('foo') ).eq( 'bar2' )

            store.set('foo', 'bar')
            store.set('bar', 'foo')
            store.remove('foo')
            expect( store.get('bar') ).eq( 'foo' )

            store.set('foo', 'bar')
            store.set('bar', 'foo')
            store.clear()
            expect( store.get('foo') == null && store.get('bar') == null ).ok();
            //测试一下存在大量数据
            store.set('foo', {
                name: 'marcus',
                arr: [1,2,3]
            })
            expect( typeof store.get('foo') == 'object').ok();
            expect( store.get('foo') instanceof Object).ok();
            expect( store.get('foo').name ).eq( 'marcus')
            expect( store.get('foo').arr instanceof Array ).ok();
            expect( store.get('foo').arr.length ).eq( 3 )

        },
        "transact" : function( id ){
            store.transact('foosact', function(val) {
                expect( typeof val, id ).eq('object')
                val.foo = 'foo'
            })
            store.transact('foosact', function(val) {
                expect( val.foo, id ).eq('foo')
                val.bar = 'bar'
            })
            expect( store.get('foosact').bar  ).eq( 'bar')

        },
        "remove circularReference" : function(){
            store.remove('circularReference')
            var circularOne = {}
            var circularTwo = { 
                one:circularOne 
            }
            circularOne.two = circularTwo
            var threw = false
            try { 
                store.set('circularReference', circularOne) 
            }
            catch(e) { 
                threw = true 
            }
            //肯定会抛错
            expect( threw ).ok()
            expect( !store.get('circularReference') ).ok()
        },
        "getAll": function(){
            store.set('firstPassFoo', 'bar')
            store.set('firstPassObj', {
                woot: true
            })

            var all = store.getAll()
            expect( all.firstPassFoo  ).eq( 'bar')
            expect( Object.keys(all).length ).eq( 4 );

            store.clear()
            expect(store.get('firstPassFoo') ).eq( null )

            all = store.getAll()
            expect( Object.keys(all).length ).eq( 0 );
            //数据会被序列化为字符串
            store.set('myage', 24)
            expect( typeof store.get('myage') ).eq( "number" );
            store.set("user", { 
                name: 'marcus', 
                likes: 'javascript' 
            })
            expect(  store.get('user').name ).eq( "marcus");
            expect(  store.get('user').likes ).eq( "javascript");

            store.set('tags', ['javascript', 'localStorage', 'store.js'])
            expect( store.get('tags').length ).eq(3)
        }
    })

})