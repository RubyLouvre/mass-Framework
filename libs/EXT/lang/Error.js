Ext.Error = {
    raise: function(object) {
        throw new Error(object.msg);
    }
};
