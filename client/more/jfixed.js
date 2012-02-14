(function( $ ) {

  $.fn.fixedIn = function( aContainerSelector ){
    return this.each(function(){
      
      // Required variables
      var fixed = false,

      block = $(this),
      container = $(aContainerSelector),

      blockOffsetTop = block.offset().top,
      containerOffsetTop = container.offset().top;
      
      // Set current block width in case of fixed positioning 
      // behave like absolute positioning
      block.css({ width: block.width() });
      
      jQuery( window ).scroll(function(){
        if( !block || !container ){
          return;
        }

        var maxBottomPosition = Math.max( 0, container.height() - block.height() - ( blockOffsetTop - containerOffsetTop ) ),
        scrollTop = jQuery( document ).scrollTop(),
        blockBiggerThanWindow = block.outerHeight() < jQuery( window ).height();

        if( ( scrollTop - blockOffsetTop ) >= maxBottomPosition ){
          fixed = false;
          block.css({ top: maxBottomPosition, position: 'relative' });
        }
        else {
          if( scrollTop >= blockOffsetTop && !fixed && blockBiggerThanWindow ){
            fixed = true;
            block.css({ position: 'fixed', top: 0 });
          }
          else if( scrollTop < blockOffsetTop && fixed ){
            fixed = false;
            block.css({ position: 'relative', top: 0 });
          }
        }
        
      });
      
    });
  };
  
  $.fn.fixed = function(){
    return this.each(function(){
      $(this).fixedIn( $(this).parent() );
    });
  };

})( jQuery );