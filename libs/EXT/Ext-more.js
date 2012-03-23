/**
 * @class Ext
 *
 * Ext is the global namespace for the whole Sencha Touch framework. Every class, function and configuration for the
 * whole framework exists under this single global variable. The Ext singleton itself contains a set of useful helper
 * functions (like {@link #apply}, {@link #min} and others), but most of the framework that you use day to day exists
 * in specialized classes (for example {@link Ext.Panel}, {@link Ext.Carousel} and others).
 *
 * If you are new to Sencha Touch we recommend starting with the [Getting Started Guide][getting_started] to
 * get a feel for how the framework operates. After that, use the more focused guides on subjects like panels, forms and data
 * to broaden your understanding. The MVC guides take you through the process of building full applications using the
 * framework, and detail how to deploy them to production.
 *
 * The functions listed below are mostly utility functions used internally by many of the classes shipped in the
 * framework, but also often useful in your own apps.
 *
 * A method that is crucial to beginning your application is {@link #setup Ext.setup}. Please refer to it's documentation, or the
 * [Getting Started Guide][getting_started] as a reference on beginning your application.
 *
 *     Ext.setup({
 *         onReady: function() {
 *             Ext.Viewport.add({
 *                 xtype: 'component',
 *                 html: 'Hello world!'
 *             });
 *         }
 *     });
 *
 * [getting_started]: #!/guide/getting_started
 */
Ext.setVersion('touch', '2.0.0');

Ext.apply(Ext, {
    /**
     * The version of the framework
     * @type String
     */
    version: Ext.getVersion('touch'),

    /**
     * @private
     */
    idSeed: 0,

    /**
     * Repaints the whole page. This fixes frequently encountered painting issues in mobile Safari.
     */
    repaint: function() {
        var mask = Ext.getBody().createChild({
            cls: Ext.baseCSSPrefix + 'mask ' + Ext.baseCSSPrefix + 'mask-transparent'
        });
        setTimeout(function() {
            mask.destroy();
        }, 0);
    },

    /**
     * Generates unique ids. If the element already has an id, it is unchanged
     * @param {Mixed} el (optional) The element to generate an id for
     * @param {String} prefix (optional) Id prefix (defaults "ext-gen")
     * @return {String} The generated Id.
     */
    id: function(el, prefix) {
        if (el && el.id) {
            return el.id;
        }

        el = Ext.getDom(el) || {};

        if (el === document || el === document.documentElement) {
            el.id = 'ext-application';
        }
        else if (el === document.body) {
            el.id = 'ext-viewport';
        }
        else if (el === window) {
            el.id = 'ext-window';
        }

        el.id = el.id || ((prefix || 'ext-element-') + (++Ext.idSeed));

        return el.id;
    },

    /**
     * Returns the current document body as an {@link Ext.Element}.
     * @return Ext.Element The document body
     */
    getBody: function() {
        if (!Ext.documentBodyElement) {
            if (!document.body) {
                throw new Error("[Ext.getBody] document.body does not exist at this point");
            }

            Ext.documentBodyElement = Ext.get(document.body);
        }

        return Ext.documentBodyElement;
    },

    /**
     * Returns the current document head as an {@link Ext.Element}.
     * @return Ext.Element The document head
     */
    getHead: function() {
        if (!Ext.documentHeadElement) {
            Ext.documentHeadElement = Ext.get(document.head || document.getElementsByTagName('head')[0]);
        }

        return Ext.documentHeadElement;
    },

    /**
     * Returns the current HTML document object as an {@link Ext.Element}.
     * @return Ext.Element The document
     */
    getDoc: function() {
        if (!Ext.documentElement) {
            Ext.documentElement = Ext.get(document);
        }

        return Ext.documentElement;
    },

    /**
     * This is shorthand reference to {@link Ext.ComponentMgr#get}.
     * Looks up an existing {@link Ext.Component Component} by {@link Ext.Component#getId id}
     * @param {String} id The component {@link Ext.Component#getId id}
     * @return Ext.Component The Component, <tt>undefined</tt> if not found, or <tt>null</tt> if a
     * Class was found.
    */
    getCmp: function(id) {
        return Ext.ComponentMgr.get(id);
    },

    /**
     * Copies a set of named properties fom the source object to the destination object.
     *
     * Example:
     *
     *     ImageComponent = Ext.extend(Ext.Component, {
     *         initComponent: function() {
     *             this.autoEl = { tag: 'img' };
     *             MyComponent.superclass.initComponent.apply(this, arguments);
     *             this.initialBox = Ext.copyTo({}, this.initialConfig, 'x,y,width,height');
     *         }
     *     });
     *
     * Important note: To borrow class prototype methods, use {@link Ext.Base#borrow} instead.
     *
     * @param {Object} dest The destination object.
     * @param {Object} source The source object.
     * @param {String/String[]} names Either an Array of property names, or a comma-delimited list
     * of property names to copy.
     * @param {Boolean} usePrototypeKeys (Optional) Defaults to false. Pass true to copy keys off of the prototype as well as the instance.
     * @return {Object} The modified object.
     */
    copyTo : function(dest, source, names, usePrototypeKeys) {
        if (typeof names == 'string') {
            names = names.split(/[,;\s]/);
        }
        Ext.each (names, function(name) {
            if (usePrototypeKeys || source.hasOwnProperty(name)) {
                dest[name] = source[name];
            }
        }, this);
        return dest;
    },

    /**
     * Attempts to destroy any objects passed to it by removing all event listeners, removing them from the
     * DOM (if applicable) and calling their destroy functions (if available).  This method is primarily
     * intended for arguments of type {@link Ext.Element} and {@link Ext.Component}.
     * Any number of elements and/or components can be passed into this function in a single
     * call as separate arguments.
     * @param {Mixed...} args An {@link Ext.Element}, {@link Ext.Component}, or an Array of either of these to destroy
     */
    destroy: function() {
        var args = arguments,
            ln = args.length,
            i, item;

        for (i = 0; i < ln; i++) {
            item = args[i];

            if (item) {
                if (Ext.isArray(item)) {
                    this.destroy.apply(this, item);
                }
                else if (Ext.isFunction(item.destroy)) {
                    item.destroy();
                }
            }
        }
    },

     /**
      * Return the dom node for the passed String (id), dom node, or Ext.Element.
      * Here are some examples:
      * <pre><code>
// gets dom node based on id
var elDom = Ext.getDom('elId');
// gets dom node based on the dom node
var elDom1 = Ext.getDom(elDom);

// If we don&#39;t know if we are working with an
// Ext.Element or a dom node use Ext.getDom
function(el){
 var dom = Ext.getDom(el);
 // do something with the dom node
}
       </code></pre>
     * <b>Note</b>: the dom node to be found actually needs to exist (be rendered, etc)
     * when this method is called to be successful.
     * @param {Mixed} el
     * @return HTMLElement
     */
    getDom: function(el) {
        if (!el || !document) {
            return null;
        }

        return el.dom ? el.dom : (typeof el == 'string' ? document.getElementById(el) : el);
    },

    /**
     * <p>Removes this element from the document, removes all DOM event listeners, and deletes the cache reference.
     * All DOM event listeners are removed from this element.
     * @param {HTMLElement} node The node to remove
     */
    removeNode: function(node) {
        if (node && node.parentNode && node.tagName != 'BODY') {
            Ext.get(node).clearListeners();
            node.parentNode.removeChild(node);
            delete Ext.cache[node.id];
        }
    },

    /**
     * @private
     */
    defaultSetupConfig: {
        eventPublishers: {
            dom: {
                xclass: 'Ext.event.publisher.Dom'
            },
            touchGesture: {
                xclass: 'Ext.event.publisher.TouchGesture',
                recognizers: {
                    drag: {
                        xclass: 'Ext.event.recognizer.Drag'
                    },
                    tap: {
                        xclass: 'Ext.event.recognizer.Tap'
                    },
                    doubleTap: {
                        xclass: 'Ext.event.recognizer.DoubleTap'
                    },
                    longPress: {
                        xclass: 'Ext.event.recognizer.LongPress'
                    },
                    swipe: {
                        xclass: 'Ext.event.recognizer.HorizontalSwipe'
                    },
                    pinch: {
                        xclass: 'Ext.event.recognizer.Pinch'
                    },
                    rotate: {
                        xclass: 'Ext.event.recognizer.Rotate'
                    }
                }
            },
            componentDelegation: {
                xclass: 'Ext.event.publisher.ComponentDelegation'
            },
            componentPaint: {
                xclass: 'Ext.event.publisher.ComponentPaint'
            },
            componentSize: {
                xclass: 'Ext.event.publisher.ComponentSize'
            }
        },

        //<feature logger>
        logger: {
            enabled: true,
            xclass: 'Ext.log.Logger',
            minPriority: 'deprecate',
            writers: {
                console: {
                    xclass: 'Ext.log.writer.Console',
                    throwOnErrors: true,
                    formatter: {
                        xclass: 'Ext.log.formatter.Default'
                    }
                }
            }
        },
        //</feature>

        animator: {
            xclass: 'Ext.fx.Runner'
        },

        viewport: {
            xclass: 'Ext.viewport.Viewport'
        }
    },

    /**
     * @private
     */
    isSetup: false,

    /**
     * @private
     */
    setupListeners: [],

    /**
     * @private
     */
    onSetup: function(fn, scope) {
        if (Ext.isSetup) {
            fn.call(scope);
        }
        else {
            Ext.setupListeners.push({
                fn: fn,
                scope: scope
            });
        }
    },

    /**
     * Ext.setup is used to launch a basic application. It handles creating an {@link Ext.Viewport} instance for you.
     *
     *     Ext.setup({
     *         onReady: function() {
     *             Ext.Viewport.add({
     *                 xtype: 'component',
     *                 html: 'Hello world!'
     *             });
     *         }
     *     });
     *
     * @param {Object} config An object with the following config options:
     *
     * @param {Function} config.onReady
     * A function to be called when the application is ready. Your application logic should be here. Please see the example above.
     *
     * @param {Object} config.viewport
     * An object to be used when creating the global {@link Ext.Viewport} instance. Please refer to the {@link Ext.Viewport}
     * documentation for more information.
     *
     *     Ext.setup({
     *         viewport: {
     *             layout: 'vbox'
     *         },
     *         onReady: function() {
     *             Ext.Viewport.add({
     *                 flex: 1,
     *                 html: 'top (flex: 1)'
     *             });
     *
     *             Ext.Viewport.add({
     *                 flex: 4,
     *                 html: 'bottom (flex: 4)'
     *             });
     *         }
     *     });
     *
     * @param {String/Object} config.icon
     * A icon configuration for this application. This will work on iOS and Android applications which are saved to the homescreen.
     *
     * You can either pass a string which will be applied to all different sizes:
     *
     *     Ext.setup({
     *         icon: 'icon.png',
     *         onReady: function() {
     *             console.log('Launch...');
     *         }
     *     });
     *
     * Or an object which has a location for different sizes:
     *
     *     Ext.setup({
     *         icon: {
     *             '57': 'icon57.png',
     *             '77': 'icon77.png',
     *             '114': 'icon114.png'
     *         },
     *         onReady: function() {
     *             console.log('Launch...');
     *         }
     *     });
     *
     * Android devices will alway use the 57px version.
     *
     * @param {String} config.icon.57 The icon to be used on non-retna display devices (iPhone 3GS and below).
     * @param {String} config.icon.77 The icon to be used on the iPad.
     * @param {String} config.icon.114 The icon to be used on retna display devices (iPhone 4 and above).
     *
     * @param {Boolean} glossOnIcon
     * True to add a gloss effect to the icon. This is ignored on Android (it will *not* add gloss).
     *
     * @param {String} phoneStartupScreen
     * Sets the apple-touch-icon `<meta>` tag so your home screen application can have a startup screen on phones.
     * Please look here for more information: http://developer.apple.com/library/IOs/#documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
     *
     * @param {String} tabletStartupScreen
     * Sets the apple-touch-icon `<meta>` tag so your home screen application can have a startup screen on tablets.
     * Please look here for more information: http://developer.apple.com/library/IOs/#documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
     *
     * @param {String} statusBarStyle
     * The style of status bar to be shown on applications added to the iOS homescreen. Valid options are:
     *
     * * `default`
     * * `black`
     * * `black-translucent`
     *
     * @param {String[]} config.requires
     * An array of required classes for your application which will be automatically loaded if {@link Ext.Loader#enabled} is set
     * to `true`. Please refer to {@link Ext.Loader} and {@link Ext.Loader#require} for more information.
     *
     *     Ext.setup({
     *         requires: ['Ext.Button', 'Ext.tab.Panel'],
     *         onReady: function() {
     *             //...
     *         }
     *     });
     *
     * @param {Object} config.eventPublishers
     * Sencha Touch, by default, includes various {@link Ext.event.recognizer.Recognizer} subclasses to recognise events fired
     * in your application. The list of default recognisers can be found in the documentation for {@link Ext.event.recognizer.Recognizer}.
     *
     * To change the default recognisers, you can use the following syntax:
     *
     *     Ext.setup({
     *         eventPublishers: {
     *             touchGesture: {
     *                 recognizers: {
     *                     swipe: {
     *                         //this will include both vertical and horizontal swipe recognisers
     *                         xclass: 'Ext.event.recognizer.Swipe'
     *                     }
     *                 }
     *             }
     *         },
     *         onReady: function() {
     *             //...
     *         }
     *     });
     *
     * You can also disable recognizers using this syntax:
     *
     *     Ext.setup({
     *         eventPublishers: {
     *             touchGesture: {
     *                 recognizers: {
     *                     swipe: null,
     *                     pinch: null,
     *                     rotate: null
     *                 }
     *             }
     *         },
     *         onReady: function() {
     *             //...
     *         }
     *     });
     */
    setup: function(config) {
        var defaultSetupConfig = Ext.defaultSetupConfig,
            emptyFn = Ext.emptyFn,
            onReady = config.onReady || emptyFn,
            onUpdated = config.onUpdated || emptyFn,
            scope = config.scope,
            requires = Ext.Array.from(config.requires),
            extOnReady = Ext.onReady,
            icon = config.icon,
            callback, viewport, precomposed;

        Ext.setup = function() {
            throw new Error("Ext.setup has already been called before");
        };

        delete config.requires;
        delete config.onReady;
        delete config.onUpdated;
        delete config.scope;

        Ext.require(['Ext.event.Dispatcher', 'Ext.MessageBox']);

        callback = function() {
            var listeners = Ext.setupListeners,
                ln = listeners.length,
                i, listener;

            delete Ext.setupListeners;
            Ext.isSetup = true;

            for (i = 0; i < ln; i++) {
                listener = listeners[i];
                listener.fn.call(listener.scope);
            }

            Ext.onReady = extOnReady;
            Ext.onReady(onReady, scope);
        };

        Ext.onUpdated = onUpdated;
        Ext.onReady = function(fn, scope) {
            var origin = onReady;

            onReady = function() {
                origin();
                Ext.onReady(fn, scope);
            };
        };

        config = Ext.merge({}, defaultSetupConfig, config);

        Ext.onDocumentReady(function() {
            Ext.factoryConfig(config, function(data) {
                Ext.event.Dispatcher.getInstance().setPublishers(data.eventPublishers);

                if (data.logger) {
                    Ext.Logger = data.logger;
                }

                if (data.animator) {
                    Ext.Animator = data.animator;
                }

                if (data.viewport) {
                    Ext.Viewport = viewport = data.viewport;

                    if (!scope) {
                        scope = viewport;
                    }

                    Ext.require(requires, function() {
                        Ext.Viewport.on('ready', callback, null, {single: true});
                    });
                }
                else {
                    Ext.require(requires, callback);
                }
            });
        });

        function addMeta(name, content) {
            var meta = document.createElement('meta');
            meta.setAttribute('name', name);
            meta.setAttribute('content', content);
            Ext.getHead().append(meta);
        }

        function addLink(rel, href, sizes) {
            var link = document.createElement('link');
            link.setAttribute('rel', rel);
            link.setAttribute('href', href);
            if (sizes) {
                link.setAttribute('sizes', sizes);
            }
            Ext.getHead().append(link);
        }

        var phoneIcon = config.phoneIcon,
            tabletIcon = config.tabletIcon,
            tabletStartupScreen = config.tabletStartupScreen,
            statusBarStyle = config.statusBarStyle,
            phoneStartupScreen = config.phoneStartupScreen,
            isIpad = Ext.os.is.iPad,
            retina = window.devicePixelRatio > 1;

        addMeta('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no');
        addMeta('apple-mobile-web-app-capable', 'yes');
        addMeta('apple-touch-fullscreen', 'yes');

        //status bar style
        if (Ext.isString(statusBarStyle)) {
            addMeta('apple-mobile-web-app-status-bar-style', 'statusBarStyle');
        }

        //startup screens
        if (tabletStartupScreen && isIpad) {
            addLink('apple-touch-startup-image', tabletStartupScreen);
        }

        if (phoneStartupScreen && !isIpad) {
            addLink('apple-touch-startup-image', phoneStartupScreen);
        }

        // icon
        if (Ext.isString(icon) || Ext.isString(phoneIcon) || Ext.isString(tabletIcon)) {
            icon = {
                '57': phoneIcon || tabletIcon || icon,
                '72': tabletIcon || phoneIcon || icon,
                '114': phoneIcon || tabletIcon || icon,
                '144': tabletIcon || phoneIcon || icon
            };
        }

        precomposed = (Ext.os.is.iOS && config.glossOnIcon === false) ? '-precomposed' : '';

        if (icon) {
            var iconString = 'apple-touch-icon' + precomposed,
                iconPath;

            // Add the default icon
            addLink(iconString, icon['57'] || icon['72'] || icon['114'] || icon['144']);

            // Loop through each icon size and add it
            for (iconPath in icon) {
                addLink(iconString, icon[iconPath], iconPath + 'x' + iconPath);
            }
        }
    },

    /**
     * @member Ext
     * @method application
     *
     * Loads Ext.app.Application class and starts it up with given configuration after the page is ready.
     *
     *     Ext.application({
     *         launch: function() {
     *             alert('Application launched!');
     *         }
     *     });
     *
     * See {@link Ext.app.Application} for details.
     *
     * @param {Object} config An object with the following config options:
     *
     * @param {Function} config.launch
     * A function to be called when the application is ready. Your application logic should be here. Please see {@link Ext.app.Application}
     * for details.
     *
     * @param {Object} config.viewport
     * An object to be used when creating the global {@link Ext.Viewport} instance. Please refer to the {@link Ext.Viewport}
     * documentation for more information.
     *
     *     Ext.application({
     *         viewport: {
     *             layout: 'vbox'
     *         },
     *         launch: function() {
     *             Ext.Viewport.add({
     *                 flex: 1,
     *                 html: 'top (flex: 1)'
     *             });
     *
     *             Ext.Viewport.add({
     *                 flex: 4,
     *                 html: 'bottom (flex: 4)'
     *             });
     *         }
     *     });
     *
     * @param {String/Object} config.icon
     * A icon configuration for this application. This will only apply to iOS applications which are saved to the homescreen.
     *
     * You can either pass a string which will be applied to all different sizes:
     *
     *     Ext.setup({
     *         icon: 'icon.png',
     *         onReady: function() {
     *             console.log('Launch...');
     *         }
     *     });
     *
     * Or an object which has a location for different sizes:
     *
     *     Ext.setup({
     *         icon: {
     *             '57': 'icon57.png',
     *             '77': 'icon77.png',
     *             '114': 'icon114.png'
     *         },
     *         onReady: function() {
     *             console.log('Launch...');
     *         }
     *     });
     *
     * @param {String} config.icon.57 The icon to be used on non-retna display devices (iPhone 3GS and below).
     * @param {String} config.icon.77 The icon to be used on the iPad.
     * @param {String} config.icon.114 The icon to be used on retna display devices (iPhone 4 and above).
     *
     * @param {Boolean} glossOnIcon
     * True to add a gloss effect to the icon.
     *
     * @param {String} phoneStartupScreen
     * Sets the apple-touch-icon `<meta>` tag so your home screen application can have a startup screen on phones.
     * Please look here for more information: http://developer.apple.com/library/IOs/#documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
     *
     * @param {String} tabletStartupScreen
     * Sets the apple-touch-icon `<meta>` tag so your home screen application can have a startup screen on tablets.
     * Please look here for more information: http://developer.apple.com/library/IOs/#documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
     *
     * @param {String} statusBarStyle
     * The style of status bar to be shown on applications added to the iOS homescreen. Valid options are:
     *
     * * `default`
     * * `black`
     * * `black-translucent`
     *
     * @param {String[]} config.requires
     * An array of required classes for your application which will be automatically loaded if {@link Ext.Loader#enabled} is set
     * to `true`. Please refer to {@link Ext.Loader} and {@link Ext.Loader#require} for more information.
     *
     *     Ext.application({
     *         requires: ['Ext.Button', 'Ext.tab.Panel'],
     *         launch: function() {
     *             //...
     *         }
     *     });
     *
     * @param {Object} config.eventPublishers
     * Sencha Touch, by default, includes various {@link Ext.event.recognizer.Recognizer} subclasses to recognise events fired
     * in your application. The list of default recognisers can be found in the documentation for {@link Ext.event.recognizer.Recognizer}.
     *
     * To change the default recognisers, you can use the following syntax:
     *
     *     Ext.application({
     *         eventPublishers: {
     *             touchGesture: {
     *                 recognizers: {
     *                     swipe: {
     *                         //this will include both vertical and horizontal swipe recognisers
     *                         xclass: 'Ext.event.recognizer.Swipe'
     *                     }
     *                 }
     *             }
     *         },
     *         launch: function() {
     *             //...
     *         }
     *     });
     *
     * You can also disable recognizers using this syntax:
     *
     *     Ext.application({
     *         eventPublishers: {
     *             touchGesture: {
     *                 recognizers: {
     *                     swipe: null,
     *                     pinch: null,
     *                     rotate: null
     *                 }
     *             }
     *         },
     *         launch: function() {
     *             //...
     *         }
     *     });
     */
    application: function(config) {
        var appName = config.name,
            onReady, scope, requires;

        if (!config) {
            config = {};
        }

        if (!Ext.Loader.config.paths[appName]) {
            Ext.Loader.setPath(appName, config.appFolder || 'app');
        }

        requires = Ext.Array.from(config.requires);
        config.requires = ['Ext.app.Application'];

        onReady = config.onReady;
        scope = config.scope;

        config.onReady = function() {
            config.requires = requires;
            new Ext.app.Application(config);

            if (onReady) {
                onReady.call(scope);
            }
        };

        Ext.setup(config);
    },

    /**
     * @private
     * @param config
     * @param callback
     * @member Ext
     */
    factoryConfig: function(config, callback) {
        var isSimpleObject = Ext.isSimpleObject(config);

        if (isSimpleObject && config.xclass) {
            var className = config.xclass;

            delete config.xclass;

            Ext.require(className, function() {
                Ext.factoryConfig(config, function(cfg) {
                    callback(Ext.create(className, cfg));
                });
            });

            return;
        }

        var isArray = Ext.isArray(config),
            keys = [],
            key, value, i, ln;

        if (isSimpleObject || isArray) {
            if (isSimpleObject) {
                for (key in config) {
                    if (config.hasOwnProperty(key)) {
                        value = config[key];
                        if (Ext.isSimpleObject(value) || Ext.isArray(value)) {
                            keys.push(key);
                        }
                    }
                }
            }
            else {
                for (i = 0,ln = config.length; i < ln; i++) {
                    value = config[i];

                    if (Ext.isSimpleObject(value) || Ext.isArray(value)) {
                        keys.push(i);
                    }
                }
            }

            i = 0;
            ln = keys.length;

            if (ln === 0) {
                callback(config);
                return;
            }

            function fn(value) {
                config[key] = value;
                i++;
                factory();
            }

            function factory() {
                if (i >= ln) {
                    callback(config);
                    return;
                }

                key = keys[i];
                value = config[key];

                Ext.factoryConfig(value, fn);
            }

            factory();
            return;
        }

        callback(config);
    },

    /**
     * @private
     * @param config
     * @param classReference
     * @member Ext
     */
    factory: function(config, classReference, instance, aliasNamespace) {
        var manager = Ext.ClassManager,
            newInstance;

        // If config is falsy or a valid instance, destroy the current instance
        // (if it exists) and replace with the new one
        if (!config || config.isInstance) {
            if (instance && instance !== config) {
                instance.destroy();
            }

            return config;
        }

        if (aliasNamespace) {
             // If config is a string value, treat is as an alias
            if (typeof config == 'string') {
                return manager.instantiateByAlias(aliasNamespace + '.' + config);
            }
            // Same if 'type' is given in config
            else if (Ext.isObject(config) && 'type' in config) {
                return manager.instantiateByAlias(aliasNamespace + '.' + config.type, config);
            }
        }
        else if (typeof config == 'string') {
            return Ext.getCmp(config);
        }

        if (config === true) {
            if (instance) {
                return instance;
            }
            else {
                return manager.instantiate(classReference);
            }
        }

        //<debug error>
        if (!Ext.isObject(config)) {
            Ext.Logger.error("Invalid config, must be a valid config object");
        }
        //</debug>

        if ('xtype' in config) {
            newInstance = manager.instantiateByAlias('widget.' + config.xtype, config);
        }

        if ('xclass' in config) {
            newInstance = manager.instantiate(config.xclass, config);
        }

        if (newInstance) {
            if (instance) {
                instance.destroy();
            }

            return newInstance;
        }

        if (instance) {
            return instance.setConfig(config);
        }

        return manager.instantiate(classReference, config);
    },

    /**
     * @private
     * @member Ext
     */
    deprecateClassMember: function(cls, oldName, newName, message) {
        return this.deprecateProperty(cls.prototype, oldName, newName, message);
    },

    /**
     * @private
     * @member Ext
     */
    deprecateClassMembers: function(cls, members) {
       var prototype = cls.prototype,
           oldName, newName;

       for (oldName in members) {
           if (members.hasOwnProperty(oldName)) {
               newName = members[oldName];

               this.deprecateProperty(prototype, oldName, newName);
           }
       }
    },

    /**
     * @private
     * @member Ext
     */
    deprecateProperty: function(object, oldName, newName, message) {
        if (!message) {
            message = "'" + oldName + "' is deprecated";
        }
        if (newName) {
            message += ", please use '" + newName + "' instead";
        }

        if (newName) {
            Ext.Object.defineProperty(object, oldName, {
                get: function() {
                    //<debug warn>
                    Ext.Logger.deprecate(message, 1);
                    //</debug>
                    return this[newName];
                },
                set: function(value) {
                    //<debug warn>
                    Ext.Logger.deprecate(message, 1);
                    //</debug>

                    this[newName] = value;
                },
                configurable: true
            });
        }
    },

    /**
     * @private
     * @member Ext
     */
    deprecatePropertyValue: function(object, name, value, message) {
        Ext.Object.defineProperty(object, name, {
            get: function() {
                //<debug warn>
                Ext.Logger.deprecate(message, 1);
                //</debug>
                return value;
            },
            configurable: true
        });
    },

    /**
     * @private
     * @member Ext
     */
    deprecateMethod: function(object, name, method, message) {
        object[name] = function() {
            //<debug warn>
            Ext.Logger.deprecate(message, 2);
            //</debug>
            if (method) {
                return method.apply(this, arguments);
            }
        };
    },

    /**
     * @private
     * @member Ext
     */
    deprecateClassMethod: function(cls, name, method, message) {
        if (typeof name != 'string') {
            var from, to;

            for (from in name) {
                if (name.hasOwnProperty(from)) {
                    to = name[from];
                    Ext.deprecateClassMethod(cls, from, to);
                }
            }
            return;
        }

        var isLateBinding = typeof method == 'string',
            member;

        if (!message) {
            message = "'" + name + "()' is deprecated, please use '" + (isLateBinding ? method : method.name) +
                "()' instead";
        }

        if (isLateBinding) {
            member = function() {
                //<debug warn>
                Ext.Logger.deprecate(message, this);
                //</debug>

                return this[method].apply(this, arguments);
            };
        }
        else {
            member = function() {
                //<debug warn>
                Ext.Logger.deprecate(message, this);
                //</debug>

                return method.apply(this, arguments);
            };
        }

        if (name in cls.prototype) {
            Ext.Object.defineProperty(cls.prototype, name, {
                value: null,
                writable: true,
                configurable: true
            });
        }

        cls.addMember(name, member);
    },

    //<debug>
    /**
     * Useful snippet to show an exact, narrowed-down list of top-level Components that are not yet destroyed.
     * @private
     */
    showLeaks: function() {
        var map = Ext.ComponentManager.all.map,
            leaks = [],
            parent;

        Ext.Object.each(map, function(id, component) {
            while ((parent = component.getParent()) && map.hasOwnProperty(parent.getId())) {
                component = parent;
            }

            if (leaks.indexOf(component) === -1) {
                leaks.push(component);
            }
        });

        console.log(leaks);
    },
    //</debug>

    /**
     * True when the document is fully initialized and ready for action
     * @type Boolean
     * @member Ext
     */
    isReady : false,

    /**
     * @private
     * @member Ext
     */
    readyListeners: [],

    /**
     * @private
     * @member Ext
     */
    triggerReady: function() {
        var listeners = Ext.readyListeners,
            i, ln, listener;

        if (!Ext.isReady) {
            Ext.isReady = true;

            for (i = 0,ln = listeners.length; i < ln; i++) {
                listener = listeners[i];
                listener.fn.call(listener.scope);
            }
            delete Ext.readyListeners;
        }
    },

    /**
     * @private
     * @member Ext
     */
    onDocumentReady: function(fn, scope) {
        if (Ext.isReady) {
            fn.call(scope);
        }
        else {
            var triggerFn = Ext.triggerReady;

            Ext.readyListeners.push({
                fn: fn,
                scope: scope
            });

            if (Ext.browser.is.PhoneGap && !Ext.os.is.Desktop) {
                if (!Ext.readyListenerAttached) {
                    Ext.readyListenerAttached = true;
                    document.addEventListener('deviceready', triggerFn, false);
                }
            }
            else {
                if (document.readyState.match(/interactive|complete|loaded/) !== null) {
                    triggerFn();
                }
                else if (!Ext.readyListenerAttached) {
                    Ext.readyListenerAttached = true;
                    window.addEventListener('DOMContentLoaded', triggerFn, false);
                }
            }
        }
    },

    /**
     * Calls function after specified delay, or right away when delay == 0.
     * @param {Function} callback The callback to execute
     * @param {Object} scope (optional) The scope to execute in
     * @param {Array} args (optional) The arguments to pass to the function
     * @param {Number} delay (optional) Pass a number to delay the call by a number of milliseconds.
     * @member Ext
     */
    callback: function(callback, scope, args, delay) {
        if (Ext.isFunction(callback)) {
            args = args || [];
            scope = scope || window;
            if (delay) {
                Ext.defer(callback, delay, scope, args);
            } else {
                callback.apply(scope, args);
            }
        }
    }
});

//<deprecated product=touch since=2.0>
Ext.deprecateMethod(Ext, 'getOrientation', function() {
    return Ext.Viewport.getOrientation();
}, "Ext.getOrientation() is deprecated, use Ext.Viewport.getOrientation() instead");

Ext.deprecateMethod(Ext, 'log', function(message) {
    return Ext.Logger.log(message);
}, "Ext.log() is deprecated, please use Ext.Logger.log() instead");

/**
 * @member Ext.Function
 * @method createDelegate
 * @inheritdoc Ext.Function#bind
 * @deprecated 2.0.0
 * Please use {@link Ext.Function#bind bind} instead
 */
Ext.deprecateMethod(Ext.Function, 'createDelegate', Ext.Function.bind, "Ext.createDelegate() is deprecated, please use Ext.Function.bind() instead");

/**
 * @member Ext
 * @method createInterceptor
 * @inheritdoc Ext.Function#createInterceptor
 * @deprecated 2.0.0
 * Please use {@link Ext.Function#createInterceptor createInterceptor} instead
 */
Ext.deprecateMethod(Ext, 'createInterceptor', Ext.Function.createInterceptor, "Ext.createInterceptor() is deprecated, " +
    "please use Ext.Function.createInterceptor() instead");

/**
 * @member Ext
 * @property {Boolean} SSL_SECURE_URL
 * URL to a blank file used by Ext when in secure mode for iframe src and onReady
 * src to prevent the IE insecure content warning.
 * @removed 2.0.0
 */
Ext.deprecateProperty(Ext, 'SSL_SECURE_URL', null, "Ext.SSL_SECURE_URL has been removed");

/**
 * @member Ext
 * @property {Boolean} enableGarbageCollector
 * True to automatically uncache orphaned Ext.Elements periodically.
 * @removed 2.0.0
 */
Ext.deprecateProperty(Ext, 'enableGarbageCollector', null, "Ext.enableGarbageCollector has been removed");

/**
 * @member Ext
 * @property {Boolean} enableListenerCollection
 * True to automatically purge event listeners during garbageCollection.
 * @removed 2.0.0
 */
Ext.deprecateProperty(Ext, 'enableListenerCollection', null, "Ext.enableListenerCollection has been removed");

/**
 * @member Ext
 * @property {Boolean} isSecure
 * True if the page is running over SSL.
 * @removed 2.0.0 Please use {@link Ext.env.Browser#isSecure} instead
 */
Ext.deprecateProperty(Ext, 'isSecure', null, "Ext.enableListenerCollection has been removed, please use Ext.env.Browser.isSecure instead");

/**
 * @member Ext
 * @method dispatch
 * Dispatches a request to a controller action.
 * @removed 2.0.0 Please use {@link Ext.app.Application#dispatch} instead
 */
Ext.deprecateMethod(Ext, 'dispatch', null, "Ext.dispatch() is deprecated, please use Ext.app.Application.dispatch() instead");

/**
 * @member Ext
 * @method getOrientation
 * Returns the current orientation of the mobile device.
 * @removed 2.0.0
 * Please use {@link Ext.Viewport#getOrientation getOrientation} instead
 */
Ext.deprecateMethod(Ext, 'getOrientation', null, "Ext.getOrientation() has been removed, " +
    "please use Ext.Viewport.getOrientation() instead");

/**
 * @member Ext
 * @method reg
 * Registers a new xtype.
 * @removed 2.0.0
 */
Ext.deprecateMethod(Ext, 'reg', null, "Ext.reg() has been removed");

/**
 * @member Ext
 * @method preg
 * Registers a new ptype.
 * @removed 2.0.0
 */
Ext.deprecateMethod(Ext, 'preg', null, "Ext.preg() has been removed");

/**
 * @member Ext
 * @method redirect
 * Dispatches a request to a controller action, adding to the History stack
 * and updating the page url as necessary.
 * @removed 2.0.0
 */
Ext.deprecateMethod(Ext, 'redirect', null, "Ext.redirect() has been removed");

/**
 * @member Ext
 * @method regApplication
 * Creates a new Application class from the specified config object.
 * @removed 2.0.0
 */
Ext.deprecateMethod(Ext, 'regApplication', null, "Ext.regApplication() has been removed");

/**
 * @member Ext
 * @method regController
 * Creates a new Controller class from the specified config object.
 * @removed 2.0.0
 */
Ext.deprecateMethod(Ext, 'regController', null, "Ext.regController() has been removed");

/**
 * @member Ext
 * @method regLayout
 * Registers new layout type.
 * @removed 2.0.0
 */
Ext.deprecateMethod(Ext, 'regLayout', null, "Ext.regLayout() has been removed");

//</deprecated>
