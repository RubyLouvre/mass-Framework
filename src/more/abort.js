动态创建一个script可以abort掉吗
就没还没返回时。
GrayZhang-上海<otakustay@gmail.com>  15:23:31
NO
Franky-上海(449666)  15:29:47
有点办法 不太靠谱...
aoao - 杭州(2222342)  15:30:30
window.stop()????
Franky-上海(449666)  15:31:00
恩
参考代码:
document.onclick = function () {
var el = document.createElement('script'),
    h = document.getElementsByTagName('head')[0];
el.src='http://a.tbcdn.cn/??s/kissy/1.1.6/kissy-min.js,p/global/1.0/global-min.js?t=2011021520110301.js?' + Math.random();
h.appendChild(el);

//for ie

h.removeChild(el);
el = null; //此处必须.否则即使gc.也不会立刻回收el. 
window.CollectGarbage && CollectGarbage(); //此方法对 new Image().src=xxx .无效. 

//for others 非ie都支持...
window.stop && stop();
};

ie 可以把节点从DOM Tree移除,并必须 el = null ,然后必须主动触发垃圾回收. 才能abort掉请求. 但是ie9无效.  
无论是ie还是 非ie的方法,都不是特别可靠.大多数情况下是可以abort掉请求.但如果从缓存走或者请求特别快就完成.则很难说.

而经西红柿测试发现:
使用jsonp的方式发送请求，在response返回之前，remove这个script节点，
IE、FF还是会执行脚本，不依附于script节点
chrome、opera、safari并没有执行脚本,但我测试safari5,有执行.而chrome，要看是不是直接从cache中读.资源.如果是非cache.则chrome确实不执行. 
基本可以考虑为,资源加载时间神马的,貌似会影响safari的结果.



Franky-上海(449666)  15:32:14
最关键的是很危险
ie6,如果 外部脚本正在执行中， script节点被移除 并失去 句柄。 有70%的几率导致ie6崩溃
风之石 - 杭州(153720615)  15:33:15

70%的几率导致ie6崩溃
Franky-上海(449666)  15:33:21
不过好在  执行期间能移除该节点的只有该脚本自己
AKI-北京(470378842)  15:33:26
这个概率好精确。


进入一个执行环境(Entering An Execution):
     每个函数或构造器的调用,都会进入一个新的执行环境.即使是函数自身的递归调用,亦是如此.每次返回退出当前执行环境（出栈,进入下一个执行坏境,即外层执行环境).
     未被捕捉的异常,会导致退出栈中,全部执行环境.
     当控制器进入一个执行环境后, 作用域链对象,     就被创建并初始化,变量初始化工作也就开始进行了. 并且this的值,也确定下来了.
     作用域链、变量 的初始化,以及 this的值.取决于所进入的代码类型:
          .Global Code :
               . 作用域链对象被创建时,只包含全局对象(global object).
               . 变量初始化期间,把全局对象(global object) 作为 variable object .来维护标识符（变量名、函数名.). 且所有对应属性.都是具有不可删除特性(DontDelete Attribute).
               . this的值,就是全局对象(global object).(注5)

          .Eval Code :
               当控制器进入一个eval code 的执行环境时,前一个(eval函数调用代码所处的)活动的执行环境,作为调用环境(calling context,调用环境),用以决定作用域链.变量对象,及this关键字的值
               如果没有calling context,则作用域链、变量对象、以及this值的处理同Global Code相同.(注6)
               . 其作用域链的初始化工作,就是按相同顺序,使其包含,同调用环境的作用域链对象所包含的相同的那些对象(活动对象、变量对象,等等等等,甚至是with和catch所添加的那些对象).
               . 其变量对象初始化过程,虽然使用的就是调用环境的变量对象.但Eval Code内的标识符对应属性.不具备任何特性.(注7)


    . this的值,与调用环境的this值相同.(此处,与edition 5所指,非直接调用的eval,视为全局调用并无冲突. 即该情况下,其calling context为global context. 则this应指向global.)

          .Function Code:
               . 其作用域链的初始化工作.就是先包含活动对象(activation object).然后把所有在做用域链对象上的成员对象都.保存到 当前函数对象的 Scope 内部属性上去.
               . 变量初始化过程,则是把活动对象activation object 当做 变量对象(variable object).来进行.且对应属性名都具备不可删除特性(DontDelete Attribute)(注8)
               . 调用者决定 this的值,如果提供this的值不是对象(包括null的情况),那么this就确定为全局对象(global object).(注9)

活动对象(Activation Object)
     当控制器进入一个函数(Function Code)的执行环境后, 会有一个叫做,活动对象(activation object)的东东被创建,并与执行环境相关联,并为其初始化一个不可删除的(具备DontDelete Attribute)叫做arguments的属性. 他的初始化值即arguments对象.
     具体描述如下:
          .activation object ，就好像 variable object一样,用来初始化变量(其实,对于function code的执行环境来说,其variable object 就是 activation object).


.活动对象,仅仅是一种规范性机制,所以只能访问到活动对象的成员,而永远不能访问到活动对象自身.
          . 一但对某个,base object 为 activation object的 ReferenceType  进行call 运算(参考,函数对象的直接调用,fn(),因为fn是avtivation object的属性)的时候. call操作则把null作为 this关键字的引用.

作用域链和标识符解析:
     每个执行环境都有一个与其相关联的 作用域链对象(scope chain).
     作用域链对象是个用于标识符（变量名、函数名、形参名）查找的 List Type内部对象.
     当控制器进入一个执行环境时,就会根据代码类型,创建与其相关联的作用域链对象,并进行初始化工作.
     在执行环境内的运行时,其关联作用域链对象,只会受到with语句,或catch从句的影响.(即with或catch块,会在当前作用域链的顶端强行加入一个额外的对象.)
     运行时,从语法角度,解析出的-标识符（变量、函数名、形参名）执行基础表达式的过程如下:
          1. 获取作用域链（单向链表）对象中的 next object. 如果没有则转到步骤-5.
          2. 把标识符作为参数，调用步骤-1结果的 HasProperty方法.
          3. 如果步骤-2的结果是 true, 返回一个 基础对象为步骤-1结果的, Property Name为标识符的引用类型值.(注3)
          4. 转到步骤-1.
          5. 返回一个 base object为 null 的 property name为标识符的引用类型值.
          Note: 执行一个标识符,总会产生一个property name 为标识符 的引用类型值(value of type Reference. 即一个 Reference Type )


.
对于一个 Reference Type来说,其base object 为null时,对其进行getValue(r),应该抛出一个ReferenceError .这就是为神马未声明变量直接调用会抛出异常.


.而typeof variable 不报异常是因为 typeof delete等运算符, 不会getValue().而是先调用GetBase, 如果 base object 是null. 则直接返回 "undefined". 不为null, 才去调用内部运算符 Type 获取其类型信息..


变量实例化(Variable Instantiation):(初始化执行环境阶段)
     每个执行环境都有一个相关联的变量对象(variable object).用来维护变量和函数的声明的标识符. 他们被当做变量对象的属性(property),添加到该对象上. 对于函数执行环境来说,形式参数也同变量声明一样被当做属性,添加到该对象上.
     什么对象被当做变量对象来使用，以及该对象相关属性具备哪些特性.是由可执行代码的类型决定的.
          .对于函数代码(function code) :
               对于每个形参来说,同样会在变量对象上创建一个属性名与形参名（标识符）相同的属性. 这些属性的特性同样由代码类型决定. 这些参数的值由函数调用者提供.
               如果函数调用者,提供的实参数量少于形参数量,余下的形参的值就是undefined.
               如果有两个或多个形参同名,则由最后一个使用此名的形参对应的实参,向变量对象对应属性提供值,如果无对应实参,则对应属性值为undefined.（即该形参的值为undefined）.

          .对于代码中的每个函数声明(FunctionDeclaration)语句来说 :
               按照源码文本的顺序,以函数标识符（函数名）作为属性名,来建立对应变量对象的属.性.并把同时创建的函数对象作为该属性的值. 这些属性的特性由代码类型决定.
               如果变量对象已经具备一个同名的属性,则覆盖掉原来的.
               出于语义化的考量, 这个步骤必须在形式参数列表对象(本意应该是指,对应形参标识符的 变量对象的属性创建过程)创建之后. (注1)


          .对于代码中的每个变量声明语句,或语句中不包含 in 运算符的变量声明来说 :(For each VariableDeclaration or VariableDeclarationNoIn in the code)(注2)
               根据变量标识符(变量名) ,为变量对象创建对应的属性.属性值为 undefined. 这些属性的特性由代码的类型决定.
               如果变量对象已经具备一个同变量标识符同名的属性,则该属性不做任何改变.包括特性.
     所以,如果一个声明的变量名和一个函数名或者形参重名，那么这个变量的声明并不影响变量对象已经存在的对应属性以及该属性的特性.(这一点和函数名相反.)
     (即特指函数声明和形参的优先级,高于变量声明 . 根据,函数声明语句的说明，我们得出 函数声明 > 形参 > 变量声明的结论)
注1 . Edition5中,对标识符初始化的过程描述,细节上虽然有很大差异.但最终的流程却是统一的, 即 先做形参初始化（包括arguments的初始化）, 然后是函数声明,最后才是变量声明. 优先级也雷同.
        所谓语义化的考量. 即如下情况:
         void function(fn){
               function fn(){};
               alert(typeof fn)// function.
          }();
       即,考虑开发者对函数形参和函数声明语句中的标识符的期待. 这种期待是一种语义上的诉求. 即函数声明.具备最高优先级.

       但是下面的代码，会很让人诧异:

          function test(fn){
               function fn(){}
               alert(fn );
          }
          test(123);

     测试结果:
          Firefox1.5-   打印 123
其他浏览器  打印 fn函数的字符串表示

     仅仅参考这里是无法知道 什么叫做,函数名的初始化过程要在 参数列表对象创建之后. 参考  13.2.1章节 的函数调用的具体步骤可看出:
         1.  Establish a new execution context using F's FormalParameterList, the passed arguments list, and the this value as described in 10.2.3
         2.  Evaluate F's FunctionBody.
      第一步就是创建新的执行环境,并使用该函数被调用时候,调用者提供的参数列表创建形参列表. 然后第二部才是执行函数体内的语句.所以说,局部函数声明,的初始化过程要在形参初始化之后.而形参初始化时,其对应的实参值,就已经被相应的写入到variable object上去了. 所以函数声明时,会覆盖掉形参，而不是形参对应的实参会覆盖函数声明.

          那么我们可以看出,早期的Firefox对标准理解有错误.其他浏览器都是OK的
注2 . ExpressionNoIn ....etc  都是指语句、或表达式 中不包含 in 运算符的形式. 在注释2中的 VariableDeclarationNoIn 特指 如 for (var o in obj)   语句中 ,var o in obj部分 就属于一个 非NoIn的变量声明表达式..


注3 .Reference Type 是一种用作协助运算的 内部对象. 一个 Reference Type 有两个属性
          1. base object
          2. property name
      当对Reference Type求值时,即返回 base object 的名为 property name 的属性.

注4 . 对于非IE的比较新的各个浏览器js引擎实现来说来说,是可以访问到对象的内部属性Prototype的. 即object.__proto__

注5 . 通过测试,初步确定主流浏览器都没有按照此处规范实现.而是简单的.把this指向了window. 从 this.abc = 123. 和 var abc 的方式,访问abc,其速度差距就可证明此问题.
注6 . 没有calling context 的情况,应该是特指,global 下的eval调用.否则实在想不出还有什么情况下是  no calling context的.
         假如 setTimeout等回调时没有calling context的话:参考下面的代码(v8下可测)
var i = 1;
void function (){
var i = 2;
setTimeout(eval,1,'alert(i)');
}(); //  打印1了

         但是ECMA262 Edition5中.有提出,非直接调用的eval 就视作全局调用. 参考下面的代码.（非IE有效,ie9也有效. ie6-ie8无视Edition5的规定.）
          参考以下代码:
               var i = 1,obj = {};
               void function (){
                    var i = 2;
                    //alert(eval('eval(i)')); //2
                    //alert(eval('eval')('i'))//1 单独的(eval) 不存在此问题的原因在于,()分组运算符并不会有GetValue()过程.或者可能浏览器按照Edition5标准 所说的 .在词法分析期.认为这也属于直接调用.
                    alert((1,eval)('[i,this === obj,this === window]')) ; // firefox true false ,chrome opera safari , false true.
               }.call(obj);
          证明. this.在 chrome opera safari下也是受影响的.比较符合Edition3标准. 而Firefox则没有完全按照标准来实现. 即eval code中的 this值,没受到影响.

   eval 带来的另外一个问题是  fn.caller .但是ECMA262 Edition3和5都没有详细说明.参考测试代码 :

     function a(){
         alert(eval('b()') + '\n\n\n' + (1,eval)('b()'));
     }

     function b(){
          return b.caller
     }

     a();
我觉得这个问题,只有firefox4是比较合理的.其他任何浏览器的实现都有错误.

因为,只有firefox4.和Chrome2+ 在处理 eval 和 window.eval()或(1,eval)()时是区别对待的. 即对于ECMA262 Edition5中定义的,eval 非直接调用时, 视作calling context为global execution context.此时的caller的的值, Firefox4 是undefined. 同它在global execution context中调用某函数的情况一致. 而直接调用,则因其calling context为其所在的execution context所以fn.caller,就是所在calling context所隶属的函数对象 .  而Chrome,这种把内部方法的实现层接口eval函数作为calling context的做法...是在让人哭笑不得啊.......

Franky-上海(449666)  16:14:27
注7 . 而其他情况的 variable object 属性,具备DontDelete特性. 也就是为什么 eval('var a =123'); delete a;// true.

          而下面的代码则说明, Eval Code 的变量初始化,对于variable object上已存在的同名属性处理,依然同其他执行环境下相同.
void function(b){
    var a =123; //注释此处则结果完全不同.    eval ('var a; function b(){}');
    delete a;//false
    delete b;//false
    /*
          .一旦,去掉测试代码中的形参b，则delete b为true.
          .对于函数声明来说,其产生的函数对象覆盖variable object上既有同名属性的特点.在任何执行环境.都是有效的.
    */
}();

注8 .  variable object 仅仅是概念上的 变量对象. 他根据不同的 execution context。 可能是global 也可能是 activation object.

注9 . 两种方式指定 this值:
          1. obj.func();
          2. func.call(obj,arg) 或 func.apply(obj,[args.])
