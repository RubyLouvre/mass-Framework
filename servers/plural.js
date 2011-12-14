mass.define("plural","lang",function($$){//处理单词的单复数
    var PLURALS = [],
    SINGULARS = [],
    UNCOUNTABLES = [];
    var plural = function (rule, replacement) {
        PLURALS.unshift([rule, replacement]);
    }

    var singular = function (rule, replacement) {
        SINGULARS.unshift([rule, replacement]);
    }

    var uncountable = function (word) {
        UNCOUNTABLES.unshift(word);
    }

    var irregular = function (s, p) {
        if (s.substr(0, 1).toUpperCase() == p.substr(0, 1).toUpperCase()) {
            plural(new RegExp("(" + s.substr(0, 1) + ")" + s.substr(1) + "$", "i"), '$1' + p.substr(1));
            plural(new RegExp("(" + p.substr(0, 1) + ")" + p.substr(1) + "$", "i"), '$1' + p.substr(1));
            singular(new RegExp("(" + p.substr(0, 1) + ")" + p.substr(1) + "$", "i"), '$1' + s.substr(1));
        } else {
            plural(new RegExp(s.substr(0, 1).toUpperCase() + s.substr(1) + "$"), p.substr(0, 1).toUpperCase() + p.substr(1));
            plural(new RegExp(s.substr(0, 1).toLowerCase() + s.substr(1) + "$"), p.substr(0, 1).toLowerCase() + p.substr(1));
            plural(new RegExp(p.substr(0, 1).toUpperCase() + p.substr(1) + "$"), p.substr(0, 1).toUpperCase() + p.substr(1));
            plural(new RegExp(p.substr(0, 1).toLowerCase() + p.substr(1) + "$"), p.substr(0, 1).toLowerCase() + p.substr(1));
            singular(new RegExp(p.substr(0, 1).toUpperCase() + p.substr(1) + "$"), s.substr(0, 1).toUpperCase() + s.substr(1));
            singular(new RegExp(p.substr(0, 1).toLowerCase() + p.substr(1) + "$"), s.substr(0, 1).toLowerCase() + s.substr(1));
        }
    }
    plural(/$/, "s");
    plural(/s$/i, "s");
    plural(/(ax|test)is$/i, "$1es");
    plural(/(octop|vir)us$/i, "$1i");
    plural(/(alias|status)$/i, "$1es");
    plural(/(bu)s$/i, "$1ses");
    plural(/(buffal|tomat)o$/i, "$1oes");
    plural(/([ti])um$/i, "$1a");
    plural(/sis$/i, "ses");
    plural(/(?:([^f])fe|([lr])f)$/i, "$1$2ves");
    plural(/(hive)$/i, "$1s");
    plural(/([^aeiouy]|qu)y$/i, "$1ies");
    plural(/(x|ch|ss|sh)$/i, "$1es");
    plural(/(matr|vert|ind)(?:ix|ex)$/i, "$1ices");
    plural(/([m|l])ouse$/i, "$1ice");
    plural(/^(ox)$/i, "$1en");
    plural(/(quiz)$/i, "$1zes");

    singular(/s$/i, "")
    singular(/(n)ews$/i, "$1ews")
    singular(/([ti])a$/i, "$1um")
    singular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, "$1$2sis")
    singular(/(^analy)ses$/i, "$1sis")
    singular(/([^f])ves$/i, "$1fe")
    singular(/(hive)s$/i, "$1")
    singular(/(tive)s$/i, "$1")
    singular(/([lr])ves$/i, "$1f")
    singular(/([^aeiouy]|qu)ies$/i, "$1y")
    singular(/(s)eries$/i, "$1eries")
    singular(/(m)ovies$/i, "$1ovie")
    singular(/(x|ch|ss|sh)es$/i, "$1")
    singular(/([m|l])ice$/i, "$1ouse")
    singular(/(bus)es$/i, "$1")
    singular(/(o)es$/i, "$1")
    singular(/(shoe)s$/i, "$1")
    singular(/(cris|ax|test)es$/i, "$1is")
    singular(/(octop|vir)i$/i, "$1us")
    singular(/(alias|status)es$/i, "$1")
    singular(/^(ox)en/i, "$1")
    singular(/(vert|ind)ices$/i, "$1ex")
    singular(/(matr)ices$/i, "$1ix")
    singular(/(quiz)zes$/i, "$1")
    singular(/(database)s$/i, "$1")

    irregular("person", "people");
    irregular("man", "men");
    irregular("child", "children");
    irregular("sex", "sexes");
    irregular("move", "moves");
    irregular("cow", "kine");

    uncountable("equipment");
    uncountable("information");
    uncountable("rice");
    uncountable("money");
    uncountable("species");
    uncountable("series");
    uncountable("fish");
    uncountable("sheep");
    uncountable("jeans");


    mass.mix(mass.String,{
        pluralize : function () {//复数化
            var word = this.toLowerCase();
            for (var i = 0, el; el = UNCOUNTABLES[i++];) {//如果是不可数名词
                if (word == el) {
                    return this;
                }
            }
            for (i = 0; el = PLURALS[i++];) {
                var rule = el[0],replacement = el[1];
                if (rule.test(this)) {
                    return this.replace(rule, replacement);
                }
            }
        },
        singularize:function(){
            var word = this.toLowerCase();
            for (var i = 0, el; el = UNCOUNTABLES[i++];) {//如果是不可数名词
                if (word == el) {
                    return this;
                }
            }
            for (i = 0; el = SINGULARS[i++];) {
                var rule = el[0],replacement = el[1];
                if (rule.test(this)) {
                    return this.replace(rule, replacement);
                }
            }
        }

    });
    $$.force("String")
   // console.log(mass.String.singularize+"")
});