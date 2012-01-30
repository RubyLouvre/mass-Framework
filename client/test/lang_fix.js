$.define("lang_fix","more/spec,lang_fix",function(){
    $.fixture('语言修正模块-lang_fix', {
        'Object.keys': function() {
            expect(Object.keys({
                aa:1,
                bb:2,
                cc:3
            })).same(["aa","bb","cc"]);
            var array = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(","), testobj = {}
            for(var i = 0, el; el = array[i++];){
                testobj[el] = i;
            };
            expect(Object.keys(testobj)).same(array);
        },
        "Array#reduceRight":function(){
            var flattened = [[0, 1], [2, 3], [4, 5]].reduceRight(function(a, b) {
                return a.concat(b);
            }, []);
            expect(flattened).same([4, 5, 2, 3, 0, 1]);
        },
        "Array#reduce":function(){
            var ret = [1,2,3,4].reduce(function(a, b) {
                return a + b;
            }, 10);
            expect(ret).eq(20);
        },
        "String#trim":function(){
            expect('      dfsd '.trim()).eq('dfsd');
        }
    });
});

