define(["$interact"],function(){
    describe('ObserverAndFlow', {
        Observer: function(id){
            var a = 0;
            var target = new $.Observer;
            target.bind("click", function(){
                a++
            })
            target.bind("click", function(){
                a++
            })
            target.bind("click", function(){
                a++
            });
            target.bind("click", function(e){
                expect(e.target, id).eq(target,"测试event.target");
                expect(e.type, id).eq("click","测试event.type");
                a++
            });
            target.fire("click");
            target.unbind()
            expect(a).same(4,"测试$.Observer");
        },
        refresh: function(id){
            var flow = new $.Flow;
            var fireCount = 0;//用于统计aaa,bbb这个组合的回调一共执行了多少次
            var callback = function(a,b,c){
                fireCount++;
                switch(fireCount){
                    case 1:
                        expect([].slice.call(arguments),id).same([10,20,30],"第1次被触发")//测试多路监听时收集的返回值
                        break;
                    case 2:
                        expect([].slice.call(arguments),id).same([15,20,30],"第2次被触发")//测试多路监听时收集的返回值
                        break;
                    case 3:
                        expect([].slice.call(arguments),id).same([15,25,30],"第3次被触发")//测试多路监听时收集的返回值
                        break;
                    case 4:
                        expect([].slice.call(arguments),id).same([15,25,35],"第4次被触发")//测试多路监听时收集的返回值
                        break;
                }
            
            }

            flow.refresh("aaa,bbb,ccc",callback);
            flow.fire("aaa",10);
            flow.fire("bbb",20);
            flow.fire("ccc",30);

            flow.fire("aaa",15);
            flow.fire("bbb",25);
            flow.fire("ccc",35);


            flow.fire("ddd",40);
            flow.fire("ddd",50);
            flow.fire("ddd",60);
            expect(fireCount).eq(4, "一共触发了四次");
        },
        reload: function(id){
            var flow = new $.Flow;
            var fireCount = 0;//用于统计aaa,bbb这个组合的回调一共执行了多少次
            var callback = function(a,b,c){

                fireCount++;
                switch(fireCount){
                    case 1:
                        expect([].slice.call(arguments),id).same([10,20,30],"第1次被触发")//测试多路监听时收集的返回值
                        break;
                    case 2:
                        expect([].slice.call(arguments),id).same([15,25,35],"第2次被触发")//测试多路监听时收集的返回值
                        break;
                }

            }

            flow.reload("aaa,bbb,ccc",callback);
            flow.fire("aaa",10);
            flow.fire("bbb",20);
            flow.fire("ccc",30);

            flow.fire("aaa",15);
            flow.fire("bbb",25);
            flow.fire("ccc",35);


            flow.fire("ddd",40);
            flow.fire("ddd",50);
            flow.fire("ddd",60);
            expect(fireCount).eq(2, "一共触发了2次");
        },
        repeat: function(id){
            var flow = new $.Flow;
            var callback = function(){
                expect(arguments.length, id).eq(5,"一共收集到5个结果")//测试多路监听时收集的返回值
            }
            flow.repeat("aa",5,callback);
            var time = 5;
            var tineoutID = setInterval(function(){
                flow.fire("aa",50);
                if(--time == 0){
                    clearInterval(tineoutID)
                }
            },20 )
         
        }

    });
})

