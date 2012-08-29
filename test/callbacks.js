var Callbacks =  function(){
    return
    var hock = ""
    function fn1( value ){
        hock += value
    }

    function fn2( value ){
        hock += "|"+value
        return false;
    }
    //函数保存到一个列表中
    var callbacks = $.Callbacks();
    callbacks.add( fn1 );
    callbacks.fire( "aaa" );

    callbacks.add( fn2 );
    callbacks.fire( "bbb" );

    expect( hock ).eq("aaabbb|bbb")
    hock = ""
    var callbacks1 = $.Callbacks( "once" );
    callbacks1.add( fn1 );
    callbacks1.fire( "foo" );
    callbacks1.add( fn2 );
    callbacks1.fire( "bar" );

    expect( hock ).eq("foo")
    hock = ""

    var callbacks2 = $.Callbacks( 'memory' );

    callbacks2.add( fn1 );
    callbacks2.fire( "foo" );
    callbacks2.add( fn2 );
    callbacks2.fire( "bar" );

    expect( hock ).eq("foo|foobar|bar")
    hock = ""
    var callbacks3 = $.Callbacks( "unique" );
    callbacks3.add( fn1 );
    callbacks3.fire( "foo" );
    callbacks3.add( fn1 ); // repeat addition
    callbacks3.add( fn2 );
    callbacks3.fire( "bar" );
    callbacks3.remove( fn2 );
    callbacks3.fire( "www" );

    expect( hock ).eq("foobar|barwww")//foobar|barwww
    hock = ""
    var callbacks = $.Callbacks( "stopOnFalse");
    function fn1( value ){
        hock += value
        return false;
    }
    callbacks.add( fn1 );
    callbacks.fire( "foo" );
    callbacks.add( fn2 );
    callbacks.fire( "bar" );
    callbacks.remove( fn2 );
    callbacks.fire( "foobar" );
    expect( hock ).eq("foobarfoobar")//foobar|barwww

}