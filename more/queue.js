define("queue", function(){
    //高性能列队模块
    function Queue() {
        this.tail = [];
        this.head = [];
        this.offset = 0;
    }

    Queue.prototype.shift = function () {
        if (this.offset === this.head.length) {
            var tmp = this.head;
            tmp.length = 0;
            this.head = this.tail;
            this.tail = tmp;
            this.offset = 0;
            if (this.head.length === 0) {
                return;
            }
        }
        return this.head[this.offset++]; // sorry, JSLint
    };

    Queue.prototype.push = function (item) {
        return this.tail.push(item);
    };

    Queue.prototype.forEach = function (fn, thisv) {
        var array = this.head.slice(this.offset), i, il;

        array.push.apply(array, this.tail);

        if (thisv) {
            for (i = 0, il = array.length; i < il; i += 1) {
                fn.call(thisv, array[i], i, array);
            }
        } else {
            for (i = 0, il = array.length; i < il; i += 1) {
                fn(array[i], i, array);
            }
        }

        return array;
    };

    Queue.prototype.getLength = function () {
        return this.head.length - this.offset + this.tail.length;
    };

    Object.defineProperty(Queue.prototype, 'length', {
        get: function () {
            return this.getLength();
        }
    });
})

/*
var queue = new Queue // 或换作[]
var now = new Date
for(var i = 0; i<500000;i++){
   queue.push(i)
}
while(queue.length){
  queue.shift()
}
console.log(queue.length)
console.log(new Date - now)
*/