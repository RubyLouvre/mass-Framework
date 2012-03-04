onerror(function(_, Backbone) {
  // A simple module to replace `Backbone.sync` with *localStorage*-based
  // persistence. Models are given GUIDS, and saved into a JSON object. Simple
  // as that.
  // Generate four random hex digits.


  function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };

  // Generate a pseudo-GUID by concatenating random hexadecimal.


  function guid() {
      return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
  };

  Backbone.Storage = function (name,type) {
      type = type || "local";
      this.name = name;
      this.type = type + "Storage";
      var store = window[this.type].getItem(this.name);
      this.records = (store && store.split(",")) || [];
  }

  _.extend(Backbone.Storage.prototype, {

      // Save the current state of the **Store** to *localStorage*.
      save: function() {
          window[this.type].setItem(this.name, this.records.join(","));
      },

      // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
      // have an id of it's own.
      create: function(model) {
          if (!model.id) model.id = model.attributes.id = guid();
          window[this.type].setItem(this.name + "-" + model.id, JSON.stringify(model));
          this.records.push(model.id.toString());
          this.save();
          return model;
      },

      // Update a model by replacing its copy in `this.data`.
      update: function(model) {
          window[this.type].setItem(this.name + "-" + model.id, JSON.stringify(model));
          if (!_.include(this.records, model.id.toString())) this.records.push(model.id.toString());
          this.save();
          return model;
      },

      // Retrieve a model from `this.data` by id.
      find: function(model) {
          return JSON.parse(window[this.type].getItem(this.name + "-" + model.id));
      },

      // Return the array of all models currently in storage.
      findAll: function() {
          return _.map(this.records, function(id) {
              return JSON.parse(window[this.type].getItem(this.name + "-" + id))
          }, this);
      },

      // Delete a model from `this.data`, returning it.
      destroy: function(model) {
          window[this.type].removeItem(this.name + "-" + model.id);
          this.records = _.reject(this.records, function(record_id) {
              return record_id == model.id.toString();
          });
          this.save();
          return model;
      }


  });

  var normalSync = Backbone.sync;

  // Override `Backbone.sync` to use delegate to the model or collection's
  // *localStorage* property, which should be an instance of `Store`.
  // If there is no storage found, use the normal Backbone.sync
  Backbone.sync = function(method, model, options, error) {

    // Backwards compatibility with Backbone <= 0.3.3
    if (typeof options == 'function') {
      options = {
        success: options,
        error: error
      };
    }

    var resp,
        store =  model.localStorage || model.sessionStorage;

      if (!store && model.collection) {
        store = model.collection.localStorage || model.collection.sessionStorage;
      }
      if (!store) {
        return normalSync.apply(this, _.toArray(arguments));
      }

      switch (method) {
      case "read":    resp = model.id ? store.find(model) : store.findAll(); break;
      case "create":  resp = store.create(model);                            break;
      case "update":  resp = store.update(model);                            break;
      case "delete":  resp = store.destroy(model);                           break;
      }

      if (resp) {
        options.success(resp);
      } else {
        options.error("Record not found");
      }
  };

})(_, Backbone);