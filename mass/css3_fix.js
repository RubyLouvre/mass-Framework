//http://fetchak.com/ie-css3/


function limit(target, n1, n2){
    var a = [n1, n2].sort();
    if(target < a[0]) target = a[0];
    if(target > a[1]) target = a[1];
    return target;
}

function nearer(target, n1, n2){
    var diff1 = Math.abs(target - n1),
    diff2 = Math.abs(target - n2);
    return diff1 < diff2 ? n1 : n2
}