(function() {

  /**
   * IsObject
   *
   * @param {object} input
   */
  var isObject = function(input) {
    return Object.prototype.toString.call(input) === '[object Object]';
  };

  /**
   * IsArray
   *
   * @param {object} input
   */
  var isArray = function(input) {
    return Object.prototype.toString.call(input) === '[object Array]';
  };

  /**
   * IsEmpty
   *  
   * Returns true if input is empty.
   *
   * @param {object} input
   */
  var isEmpty = function(input) {
    
    // Arrays and strings
    if (isArray(input)) {
      return input.length === 0;
    }

    // Objects
    if (isObject(input)) {
      for (var key in input) {
        if (hasOwnProperty.call(input, key)) {
          return false;
        }
      }
    }

    return true;

  };

  /**
   * Each
   *
   * Applies an iterator function to each item in an array or an object, in series.
   *
   * @param {object} list
   * @param {function} iterator
   * @param {function} callback
   */
  var each = function(list, iterator, callback) {

    /**
     * SyncEach
     *
     * @param {object} list
     * @param {function} iterator
     */
    var syncEach = function(list, iterator) {

      // If the list is an array
      if (isArray(list) && !isEmpty(list)) {
        for (var i = 0, len = list.length; i < len; i++) {
          iterator(i, list[i]);
        }
      }

      // If the list is an object
      if (isObject(list) && !isEmpty(list)) {
        for (var key in list) {
          if (list.hasOwnProperty(key)) {
            iterator(key, list[key]);
          }
        } 
      }

    };

    /**
     * AsyncEach
     * @param {object} list
     * @param {function} iterator
     * @param {function} callback
     */
    var asyncEach = function(list, iterator, callback) {

      var uncompleted;

      // If the list is an object
      if (isObject(list) && !isEmpty(list)) {
        uncompleted = Object.keys(list).length;

      // If the list is an array
      } else if (isArray(list) && !isEmpty(list)) {
        uncompleted = list.length;

      // If the list is not an array or an object
      } else {
        return callback();
      }

      /**
       * Next
       */
      var next = function(error) {
        uncompleted -= 1;
        if (error) {
          callback(error);
          callback = function() {};
        }
        if (!error && uncompleted === 0) {
          return callback();
        }
      };

      syncEach(list, function(key, value) {
        return iterator(key, value, next);
      });

    };

    if (typeof callback === 'undefined') {
      return syncEach.apply(this, arguments);
    } else {
      return asyncEach.apply(this, arguments);
    }

  };

  /**
   * Pluck
   *
   * Extracts a list of property values.
   *
   * @param {object} list
   * @param {string} propertyName
   */
  var pluck = function(list, propertyName) {
    var output = [];
    for (var i = 0, len = list.length; i < len; i++) {
      var property = list[i][propertyName];
      if (output.indexOf(property) === -1) {
        output.push(property);
      }
    }
    return output;
  };

  /**
   * Error
   *
   * @constructor
   */
  var Error = function() {
    this.length = 0;
  };

  Error.prototype.addError = function(error) {
    this[this.length] = error;
    this.length++;
  };

  /**
   * Error.getProperties
   * Error.getMessages
   */
  each({
    getProperties: 'property',
    getMessages: 'message'
  }, function(key, value) {
    Error.prototype[key] = function() {
      return pluck(this, value);
    };    
  });

  /**
   * Validator
   *
   * @constructor
   * @param {object} options
   */
  var Validator = function(options) {

    var self = this;

    // Errors
    this.Errors = new Error();

    // Options
    each([
      'singleError',
      'validators'
    ], function(key, value) {
      self[value] = options[value];
    });

  };

  /**
   * Validator.validateProperty
   *
   * @param {string} property
   * @param {object} propertyValidators
   * @param {string|object} propertyValue
   * @param {boolean} singleError
   * @param {function} callback
   */
  Validator.prototype.validateProperty = function(property, propertyValue, propertyValidators, callback) {

    // Reference na this
    var self = this;

    /**
     * Iterator
     *
     * @param {string} validatorName
     * @param {function} callback
     */
    var iterator = function(validatorName, validatorFn, callback) {
      if (propertyValidators[validatorName]) {
        validatorFn(property, propertyValue, propertyValidators[validatorName], propertyValidators, function(error) {

          if (error) {
            self.Errors.addError({
              property: property,
              propertyValue: propertyValue,
              validator: validatorName,
              validatorValue: propertyValidators[validatorName],
              message: error
            });
            return (self.singleError) ? callback(true) : callback();
          }

          return callback();

        });
      } else {
        return callback();
      }
    };

    if (propertyValidators.required !== true && typeof propertyValue === 'undefined') {
      return callback();
    } else {
      return each(self.validators, iterator, callback);
    }

  };

  /**
   * Validator.validate
   *
   * @param {object} instance
   * @param {object} schema
   * @param {boolean} singleError
   * @param {function} callback
   */
  Validator.prototype.validate = function(instance, schema, callback) {

    var self = this;

    return this.validateSchema(instance, schema, '', function(error) {
      return callback((self.Errors.length > 0) ? self.Errors : undefined);
    });

  };

  /**
   * Validator.validateSchema
   *
   * @param {object} instance
   * @param {object} schema
   * @param {boolean} singleError
   * @param {function} callback
   */
  Validator.prototype.validateSchema = function(instance, schema, path, callback) {

    var self = this;

    /**
     * {
     *   type: 'object',
     *   properties: {
     *     ... 
     *   }
     * }
     * ¡ª or ¡ª
     * {
     *   type: 'array',
     *   items: {
     *     ...
     * }
     */
    if (['object', 'array'].indexOf(schema.type) !== -1) {
      return self.validateProperty(path, instance, schema, function(error) {

        /**
         * {
         *   type: 'object',
         *   properties: {
         *     ... 
         *   }
         * }
         */
        if (schema.properties) {
          return each(schema.properties, function(property, propertyValidators, callback) {
            
            var isObject = propertyValidators.type === 'object' && propertyValidators.properties,
                isArray =  propertyValidators.type === 'array';

            // Get the value of property (instance[property])
            var propertyValue = self.getProperty(instance, property);

            // Compose the property path
            var propertyPath = (path.length === 0) ? property : path + '.' + property;

            /**
             * {
             *   type: 'object',
             *   properties: {
             *     user: {
             *       type: 'object',
             *       properties: {
             *         ...
             *       }
             *     }
             *   }
             * }
             */
            if (isObject || isArray)  {
              return self.validateSchema(propertyValue, schema.properties[property], propertyPath, callback);
            } else {
              return self.validateProperty(propertyPath, propertyValue, propertyValidators, callback);
            }

          }, callback);

        /**
         * {
         *   type: 'array',
         *   items: {
         *     type: 'string'
         *     ... 
         *   }
         * }
         */
        } else if (schema.items) {

          if (instance && !isEmpty(instance)) {

            /**
             * {
             *   type: 'array',
             *   items: {
             *     type: 'object'
             *   }
             * }
             * ¡ª or ¡ª
             * {
             *   type: 'array',
             *   items: {
             *     type: 'array'
             *   }
             * }
             */
            if (['object', 'array'].indexOf(schema.items.type) !== -1) {
              return each(instance, function(index, propertyValue, callback) {
                var propertyPath = path + '[' + index + ']';
                return self.validateSchema(propertyValue, schema.items, propertyPath, callback);
              }, callback);

            /*
             * {
             *   type: 'array',
             *   items: {
             *     type: 'string'
             *   }
             * }
             */
            } else {
              return each(instance, function(index, propertyValue, callback) {
                var propertyPath = path + '[' + index + ']';
                return self.validateProperty(propertyPath, propertyValue, schema.items, callback);
              }, callback);
            }

          } else {
            return callback();
          } 

        /**
         * {
         *   type: 'array'
         * }
         * ¡ª or ¡ª
         * {
         *   type: 'object'
         * }
         */
        } else {
          return callback();
        }

      });

    /**
     * {
     *   type: 'string',
     *   length: ...
     * }
     */
    } else {
      return self.validateProperty(path, instance, schema, callback);
    }

  };

  /**
   * GetProperty
   *
   * @param {object} source
   * @param {string} property
   */
  Validator.prototype.getProperty = function(source, property) {
    if (!source) {
      return undefined;
    } else {
      return source[property];
    }
  };

  /**
   * Validators
   */
  var validators = {

    /**
     * Required
     */
    'required': function(property, propertyValue, validator, propertyValidators, callback) {
      if (validator && propertyValue === undefined) {
        return callback('¡®' + property + '¡¯ is required');
      } else {
        return callback();
      }
    },

    /**
     * Type
     */
    'type': (function() {
      
      var types = {
        'object': function(input) {
          return Object.prototype.toString.call(input) === '[object Object]';
        },
        'array': function(input) {
          return Object.prototype.toString.call(input) === '[object Array]';
        },
        'integer': function(input) {
          return (typeof input === 'number') && input % 1 === 0;
        }
      };

      // Generate the rest of type checkers
      [
        'string',
        'number',
        'function',
        'boolean'
      ].forEach(function(type) {
        types[type] = function() {
          return typeof arguments[0] === type;
        };
      });

      return function(property, propertyValue, validator, propertyValidators, callback) {

        /**
         * {
         *   type: ['string', 'number']
         * }
         */
        if (Object.prototype.toString.call(validator) === '[object Array]') {
          var noError = validator.some(function(type) {
            return types[type](propertyValue);
          });
          return (noError) ? callback() : callback('¡®' + property + '¡¯ must be ' + validator.join(' or '));

        /**
         * {
         *   type: 'string'
         * }
         */
        } else {
          return (types[validator](propertyValue)) ? callback() : callback('¡®' + property + '¡¯ must be ' + validator);
        }

      };

    }()),

    /**
     * Format
     */
    'format': (function() {

      /**
       * Formats
       */
      var formats = {
        'alpha': function(input) {
          return (typeof input === 'string' && input.match(/^[a-zA-Z]+$/));
        },
        'alphanumeric': function(input) {
          return (typeof input === 'string' && /^[a-zA-Z0-9]+$/.test(input)) || typeof input === 'number';
        },
        'ipv4': function(input) {
          return typeof input === 'string' && input.match(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);
        },
        'ipv6': function(input) {
          return typeof input === 'string' && input.match(/(?:(?:[a-f\d]{1,4}:)*(?:[a-f\d]{1,4}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|(?:(?:[a-f\d]{1,4}:)*[a-f\d]{1,4})?::(?:(?:[a-f\d]{1,4}:)*(?:[a-f\d]{1,4}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))?)/);
        },
        'ip': function(input) {
          return formats.ipv4(input) || formats.ipv6;
        },
        'email': function(input) {
          return typeof input === 'string' && input.match(/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/);
        },
        'url': function(input) {
          return typeof input === 'string' && input.match(/^(?:(?:ht|f)tp(?:s?)\:\/\/|~\/|\/)?(?:\w+:\w+@)?((?:(?:[-\w\d{1-3}]+\.)+(?:com|org|cat|coop|int|pro|tel|xxx|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|[a-z]{2})?)|((\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)(\.(\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)){3}))(?::[\d]{1,5})?(?:(?:(?:\/(?:[-\w~!$+|.,=]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:\?(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[-\w~!$ |\/.,*:;=]|%[a-f\d]{2})*)?$/);
        },
        'date': function(input) {
          return Object.prototype.toString.call(input) === '[object Date]';
        },
        'decimal': function(input) {
          return /^[0-9]+(\.[0-9]{1,2})?$/.test(input);
        },
        'int': function(input) {
          return /^-?[0-9]+$/.test(input);
        },
        'percentage': function(input) {
          return (typeof input == 'string' && input.match(/^-?[0-9]{0,2}(\.[0-9]{1,2})?$|^-?(100)(\.[0]{1,2})?$/)) || (input >= -100 && input <= 100);
        },
        'port': function(input) {
          return /\:\d+/.test(input);
        },
        'regexp': function(input) {
          return input && input.test && input.exec;
        },
        'unsignedInt': function(input) {
          return /^[0-9]+$/.test(input);
        }
      };

      return function(property, propertyValue, validator, propertyValidators, callback) {
        return (formats[validator](propertyValue)) ? callback() : callback(true);
      };

    }()),

    /**
     * Length
     */
    'length': function(property, propertyValue, validator, propertyValidators, callback) {
    
      // Check the length only if the type of ¡®paramValue¡¯ is string
      if (typeof propertyValue === 'string') {


        // If the length is specified as an array (for instance ¡®[2, 45]¡¯)
        if (Array.isArray(validator) && (propertyValue.length < validator[0] || propertyValue.length > validator[1])) {
          return callback(true);

        // If the length is specified as a string (for instance ¡®2¡¯)
        } else if (typeof validator === 'number' && propertyValue.length !== validator) {
          return callback(true);

        // If the length is specified in a different way
        } else {
          return callback();
        }

      } else {
        return callback(); 
      }

    },

    /**
     * Enum
     */
    'enum': function(property, propertyValue, validator, propertyValidators, callback) {
      return (validator.indexOf(propertyValue) === -1) ? callback(true) : callback();
    },

    /**
     * Except
     */
    'except': function(property, propertyValue, validator, propertyValidators, callback) {
      return (validator.indexOf(propertyValue) !== -1) ? callback(true) : callback();
    },

    /**
     * Minimum
     */
    'minimum': function(property, propertyValue, validator, propertyValidators, callback) {
      if (typeof propertyValue === 'number') {
        var condition = (propertyValidators.exclusiveMinimum) ? propertyValue > validator : propertyValue >= validator;
        return (condition) ? callback() : callback(true);
      } else {
        return callback(true);
      }
    },

    /**
     * Maximum
     */
    'maximum': function(property, propertyValue, validator, propertyValidators, callback) {
      if (typeof propertyValue === 'number') {
        var condition = (propertyValidators.exclusiveMaximum) ? propertyValue < validator : propertyValue <= validator;
        return (condition) ? callback() : callback(true);
      } else {
        return callback(true);
      }
    },

    /**
     * Pattern
     */
    'pattern': function(property, propertyValue, validator, propertyValidators, callback) {
      return (typeof propertyValue === 'string' && !propertyValue.match(validator)) ? callback(true) : callback();
    },

    /**
     * MinItems
     */
    'minItems': function(property, propertyValue, validator, propertyValidators, callback) {
      return (isArray(propertyValue) && propertyValue.length >= validator) ? callback() : callback(true);
    },

    /**
     * MaxItems
     */
    'maxItems': function(property, propertyValue, validator, propertyValidators, callback) {
      return (isArray(propertyValue) && propertyValue.length <= validator) ? callback() : callback(true);
    },

    /**
     * UniqueItems
     */
    'uniqueItems': function(property, propertyValue, validator, propertyValidators, callback) {
      return each(propertyValue, function(index, value, callback) {
        return (propertyValue.indexOf(value) < index) ? callback(true) : callback();
      }, callback);
    },

    /**
     * DivisibleBy
     */
    'divisibleBy': function(property, propertyValue, validator, propertyValidators, callback) {
      var isNumber = typeof propertyValue === 'number',
          isDivisible = propertyValue % validator === 0;
      return (isNumber && isDivisible) ? callback() : callback(true);
    }

  };

  /**
   * Amanda
   */
  var amanda = {

    /**
     * Validate
     *
     * @param {object} structure
     */
    validate: function(data, schema, options, callback) {

      if ( typeof options === 'function') {
        callback = options;
        options = {
          singleError: true
        };
      }

      options.validators = validators;

      return (new Validator(options)).validate(data, schema, callback);

    },

    /**
     * AddValidator
     *
     * @param {string} validatorName
     * @param {function} validatorFn
     */
    addValidator: function(validatorName, validatorFn) {
      validators[validatorName] = validatorFn;
    },

    /**
     * GetVersion
     */
    getVersion: function() {
      return [0, 2, 0].join('.');
    },

    /**
     * GetValidators
     */
    getValidators: function() {
      return validators;
    }

  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = amanda;
  } else if (typeof define !== 'undefined') {
    define(function() {
      return amanda;
    });
  } else {
    this.amanda = amanda;
  }

}());