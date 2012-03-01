$.define("layer2","fx,attr,event",function(){
    var ie6 = !window.XMLHttpRequest
    var defaults = {
        css: {
            width:  	'400px',
            height:     '300px',
            top:	'10px',
            left:   	'5px',
            filter:     'alpha(opacity=50)',
            border: 	'none',
            padding:	'5px',
            opacity:	0.6,
            cursor: 	'default',
            color:	'#fff',
            backgroundColor: '#d8d8d8',
            '-webkit-border-radius': '10px',
            '-moz-border-radius':	 '10px',
            'border-radius': 		 '10px'
        },
        iframe_src: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank'
    }

    $.layer = $.factory({
        init: function( obj ){
            var target = this.target = $("<div />");
            this.setOptions("options",defaults, obj || {});
            var style = this.options.css;
            var layers = this.layers = [target];
            target.css( style );
            if(ie6){
                var iframe = $('<iframe style="position:absolute;width:100%;height:100%;top:0;left:0" src="'+
                    defaults.iframe_src+'"><body bgColor="transparent"/></iframe>'), istyle = {};
                for(var name in style){
                    if( !/color|font|text/i.test( name ) ){
                        istyle[ name ] = style[ name ];
                    }
                }
                iframe.css( istyle )
                layers.unshift( iframe );
            }
            if(this.options.parent){
                var parent = $(this.options.parent);
                $.each(layers,function(){
                    this.appendTo(parent)
                });
            }
        }
    });

})