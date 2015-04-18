var program = require('commander');

/**
 * All available cli parameters
 * @type {Object}
 */
var parameters = [
	{scaffolding: ['-s, --scaffolding', 'Initializes the Risotto default project-structure']},
	{production: ['-p, --production', 'Starts Risotto in production-mode']},
];

var cli = {
	/**
	 * Initiates all available cli-parameters & sets the current Risotto-version.
	 * @param {string} version       [Risotto-version string]
	 */
	init: function* (version) {

		// set Risotto-version
		program.version(version);

		// add all available cli-options to program
		parameters.forEach(function(parameter) {
			var key = Object.keys(parameter); // e.g.: 'production'

			// cli-flag, cli-help
			program.option(parameter[key][0], parameter[key][1]);
		});

		// parse arguments
		program.parse(process.argv);

	},

	/**
	 * Loops through all available parameters, uses 'program' to check if a
	 * cli-flag was set and adds it to 'boolParameters' with the flag-state.
	 * @yield {object} [All available parameters with their state (true/false)]
	 */
	getParams: function* () {

		// object with all available parameters states
		var boolParameters = {};

		// set cli parameters accordingly to program
		parameters.forEach(function(parameter) {
			var key = Object.keys(parameter); // e.g.: 'production'

			// check if the key was set
			if(program[key]) {
				boolParameters[key] = true;
			}
			else {
				boolParameters[key] = false;
			}
		});

		return boolParameters;
	}

};

module.exports = cli;