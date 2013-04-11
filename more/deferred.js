// deferred.js - this code is in the Public Domain

function Deferred() {
	this._callbackFunc = null;
	this._errbackFunc = null;
	this._state = "initial"; // initial, set, fired, canceled, canceled-fired
	this.canceller = null;
}

Deferred.noop = function() {};

Deferred.prototype = {
	callback: function (value) {
		setTimeout(this.callbackSync.bind(this, value));
	},
	errback: function (value) {
		setTimeout(this.errbackSync.bind(this, value));
	},
	callbackSync: function (value) {
		this._toFired("callback()");
		if (this._callbackFunc) this._callbackFunc(value);
	},
	errbackSync: function (value) {
		this._toFired("errback()");
		if (this._errbackFunc)
			this._errbackFunc(value);
		else
			throw value;
	},
	_toFired: function (action) {
		this._stateCheck(["initial", "set", "canceled"], action);
		this._state = this._state === "canceled" ? "canceled-fired" : "fired";
	},
	then: function(callbackFunc, errbackFunc) {
		this._stateCheck(["initial"], "then()");
		this._state = "set";
		this._callbackFunc = callbackFunc;
		this._errbackFunc = errbackFunc;
	},
	cancel: function () {
		this._stateCheck(["initial", "set"], "cancel()");
		if (this.canceller) this.canceller();
		this._state = "canceled";
		this._callbackFunc = this._errbackFunc = Deferred.noop();
	},
	_stateCheck: function (expected, action) {
		if (expected.indexOf(this._state) === -1) {
			throw new Error("can't "+action+" in "+this._state+" state");
		}
	}
};

Deferred.wait = function (seconds) {
	var deferred = new Deferred();
	var timerId = setTimeout(function () deferred.callbackSync(), seconds * 1000);
	deferred.canceller = function () clearTimeout(timerId);
	return deferred;
};

Deferred.returnValue = function (value) {
	return {value: value, __proto__: Deferred.returnValue.prototype};
};

Deferred.generator = function (func) {
	return function () {
		var deferred = new Deferred();
		var generator = func.apply(this, arguments);
		var callback = function (val) loop(val, false);
		var errback = function (val) loop(val, true);
		var waitTask;
		deferred.canceller = function () {
			if (waitTask) waitTask.cancel();
		};

		function loop(val, isError) {
			waitTask = null;
			try {
				if (isError) {
					generator.throw(val);
				} else {
					var ret = generator.send(val);
					if (ret instanceof Deferred.returnValue) {
						deferred.callback(ret.value);
					} else {
						waitTask = ret;
						waitTask.then(callback, errback);
					}
				}
			} catch (e if e instanceof StopIteration) {
				deferred.callback();
			} catch (e) {
				deferred.errback(e);
			}
		}
		loop(undefined, false);
		return deferred;
	};
};