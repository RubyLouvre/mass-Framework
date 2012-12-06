define("scrollIntoView", "$event,$fx,$attr".split(","), function(){


    $.fn.scrollIntoView = function(duration, easing, complete) {
        var opts = $.mix({},$.fn.scrollIntoView.defaults);
        //处理传参
        if ($.type(duration, "Object")) {
            $.mix(opts, duration);
        } else if ($.type(duration, "Number")) {
            $.mix(opts, {
                duration: duration,
                easing: easing,
                complete: complete
            });
        } else if (duration == false) {
            opts.smooth = false;
        }

        // get enclosing offsets
        var elY = Infinity, elH = 0;
        if (this.size()==1){
            ((elY=this.get(0).offsetTop)==null || (elH=elY+this.get(0).offsetHeight));
        }else{
            this.each(function( el){
                (el.offsetTop < elY ? elY=el.offsetTop:el.offsetTop+el.offsetHeight>elH?elH=el.offsetTop+el.offsetHeight:null)
            });
        }
        elH -= elY;
        elH -= elY;

        // start from the common ancester
        var pEl = this.commonAncestor().get(0);

        var wH = $(window).height();

        // go up parents until we find one that scrolls
        while (pEl) {
            var pY = pEl.scrollTop, pH = pEl.clientHeight;
            if (pH > wH) pH = wH;

            // case: if body's elements are all absolutely/fixed positioned, use window height
            if (pH == 0 && pEl.tagName == "BODY") pH = wH;

            if (
                // it wiggles?
                (pEl.scrollTop != ((pEl.scrollTop += 1) == null || pEl.scrollTop) && (pEl.scrollTop -= 1) != null) ||
                (pEl.scrollTop != ((pEl.scrollTop -= 1) == null || pEl.scrollTop) && (pEl.scrollTop += 1) != null)) {
                if (elY <= pY) scrollTo(pEl, elY); // scroll up
                else if ((elY + elH) > (pY + pH)) scrollTo(pEl, elY + elH - pH); // scroll down
                else scrollTo(pEl, undefined) // no scroll
                return;
            }

            // try next parent
            pEl = pEl.parentNode;
        }

        function scrollTo(el, scrollTo) {
            if (scrollTo === undefined) {
                if ($.isFunction(opts.complete)) opts.complete.call(el);
            } else if (opts.smooth) {
                $(el).stop().animate({ 
                    scrollTop: scrollTo
                }, opts);
            } else {
                el.scrollTop = scrollTo;
                if ($.isFunction(opts.complete)) opts.complete.call(el);
            }
        }
        return this;
    };

    $.fn.scrollIntoView.defaults = {
        smooth: true,
        duration: null,
        easing: $.easing && $.easing.easeOutExpo ? 'easeOutExpo': null,
        // Note: easeOutExpo requires jquery.effects.core.js
        //       otherwise jQuery will default to use 'swing'
        complete: $.noop(),
        step: null,
        specialEasing: null
    };

    /*
     Returns whether the elements are in view
     */
    $.fn.isOutOfView = function(completely) {
        // completely? whether element is out of view completely
        var outOfView = true;
        this.each(function() {
            var pEl = this.parentNode, pY = pEl.scrollTop, pH = pEl.clientHeight, elY = this.offsetTop, elH = this.offsetHeight;
            if (completely ? (elY) > (pY + pH) : (elY + elH) > (pY + pH)) {}
            else if (completely ? (elY + elH) < pY: elY < pY) {}
            else outOfView = false;
        });
        return outOfView;
    };

    /*
     Returns the common ancestor of the elements.
     It was taken from http://stackoverflow.com/questions/3217147/jquery-first-parent-containing-all-children
     It has received minimal testing.
     */
    $.fn.commonAncestor = function() {
        var parents = [];
        var minlen = Infinity;

        $(this).each(function() {
            var curparents = $(this).parents();
            parents.push(curparents);
            minlen = Math.min(minlen, curparents.length);
        });

        for (var i in parents) {
            parents[i] = parents[i].slice(parents[i].length - minlen);
        }

        // Iterate until equality is found
        for (var i = 0; i < parents[0].length; i++) {
            var equal = true;
            for (var j in parents) {
                if (parents[j][i] != parents[0][i]) {
                    equal = false;
                    break;
                }
            }
            if (equal) return $(parents[0][i]);
        }
        return $([]);
    }
})

//https://github.com/Arwid/jQuery.scrollIntoView/blob/master/jquery.scrollIntoView.js
//http://arwid.github.com/jQuery.scrollIntoView/