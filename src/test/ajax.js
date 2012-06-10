$.define("ajax","more/spec,ajax",function(){
    $.fixture('监听者模块', {
        "Content-Type": function(id){
            var text = "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript";
            var rtype = /json|xml|script/
            expect(text.match(rtype)).same(["script"])
            text = "application/json; charset=utf-8"
            expect(text.match(rtype)).same(["json"])
            text = "application/xml, text/xml";
            expect(text.match(rtype)).same(["xml"])
        },
        "$.param": function(){
            expect($.param({
                foo:1,
                bar:2
            })).eq('foo=1&bar=2');
            expect($.param({
                foo:1,
                bar:[2, 3]
            },  false)).eq('foo=1&bar=2&bar=3');

            expect($.param({
                '&#':'!#='
            })).eq('%26%23=!%23%3D');

            expect($.param({
                foo:1,
                bar:[]
            })).eq('foo=1');
            expect($.param({
                foo:{},
                bar:2
            })).eq('bar=2');
            expect($.param({
                foo:function () {
                },
                bar:2
            })).eq('bar=2');

            expect($.param({
                foo:undefined,
                bar:2
            })).eq('foo=undefined&bar=2');
            expect($.param({
                foo:null,
                bar:2
            })).eq('foo=null&bar=2');
            expect($.param({
                foo:true,
                bar:2
            })).eq('foo=true&bar=2');
            expect($.param({
                foo:false,
                bar:2
            })).eq('foo=false&bar=2');
            expect($.param({
                foo:'',
                bar:2
            })).eq('foo=&bar=2');
            expect($.param({
                foo:NaN,
                bar:2
            })).eq('foo=NaN&bar=2');

            expect($.param({
                b:[2, 3]
            })).eq('b%5B%5D=2&b%5B%5D=3')
        },
        "$.unparam": function(){
            expect($.unparam('foo=1&bar=2').foo).eq('1');
            expect($.unparam('foo=1&bar=2').bar).eq('2');

            expect($.unparam('foo').foo).eq('');
            expect($.unparam('foo=').foo).eq('');

            expect($.unparam('foo=1&bar=2&bar=3').bar[0]).eq('2');
            expect($.unparam('foo=1&bar=2&bar=3').bar[1]).eq('3');

            expect($.unparam('foo=null&bar=2').foo).eq('null');
            expect($.unparam('foo=&bar=2').foo).eq('');
            expect($.unparam('foo&bar=2').foo).eq('');

            expect($.unparam('foo=1&bar=2&foo=3').foo[1]).eq('3');

            expect($.unparam('foo=1&bar[]=2&bar[]=3').bar[0]).eq('2');
        }
    })
});
