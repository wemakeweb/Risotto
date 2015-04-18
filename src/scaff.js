var github = require("transfer-github");


var scaff = {
	defaultRepo: 'deshi-basara/Risotto-boilerplate',

	/**
	 * Downloads the default Risotto-project-structure to the
	 * current execution folder.
	 * @param {object} app           [Risotto-app-object]
	 */
	getDefaultRepo: function* (app) {

		// download default repo from github
		github.get(this.defaultRepo, '', function(err) {

			if(err) {
				app.exit("Error while scaffolding project-structure from Github");
			}
			else {
				app.logger.info("Scaffolding project structure initiated");
			}

		});

	}

};

module.exports = scaff;