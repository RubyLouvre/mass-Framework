
	var switcher = function (scope, tests, options) {
		var defaultOptions = {
			breakMode: true // if set to true switcher will stop after the first match
		};
		if (!options)
			options = defaultOptions;
		else
			for (var option in defaultOptions)
				if (!options.hasOwnProperty(option))
					options[option] = defaultOptions[option];
		var matched = false;
		for (var test in tests) {
			test = {
				fullExpression: test,
				expression: test.substr(0,1)=='/'?test.substr(1, test.lastIndexOf('/')-1):test,
				flags: test.substr(0,1)=='/'?test.substr(test.lastIndexOf('/')+1):''
			};
			if (new RegExp(test.expression, test.flags).test(scope)) {
				matched = true;
				tests[test.fullExpression](scope, test.fullExpression);
				if (options.breakMode)
					break;
			}
		}
		return matched;
	};