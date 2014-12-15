var flags = require('optimist').argv,
	Logger = require('./src/logger'),
	startup = require('./src/startup'),
	path = require('path'),
	redis = require("redis"),
	co = require('co');

/**
 * expose Risotto
 */

module.exports = function(){
	return new Risotto();
}();

/*
 * the Risotto class
 */

function Risotto(){
	/**
	 * expose the base application
	 */

	this.Application = require('./src/application');

	/**
	 * expose the base controller
	 */

	this.Controller = require('./src/controller');

	/**
	 * expose version
	 */

	this.version = require('./package.json').version;
}

/**
 * Risotto.initialize
 * @params {String} base
 * @api public
 *
 * here we are going to boot the
 * risotto application.
 * currently the following is done:
 * - check the mode
 * - startup the logging service
 * - perform as series of checks
 * - load the environment specific config file
 * - load application, modules & controller
 * - load the hooks
 * - load route file and parse it
 * - start http server and bind the routes
 *
 * This method will globalize Risotto!
 */

Risotto.prototype.initialize = co(function*( base ){
	//load the check lib
	require('./src/check');

 	this.env = flags.e || 'development';
	this.devMode = (this.env == "development");
	
	this.path = base;

	this.CONFIG = path.join(base, 'config/');
	this.APP = path.join(base, 'app/');

	this.controllers = {};
	this.routes = {};

	this.logger = new Logger(this);
	this.printStartupInfo();

	//globalize Risotto
	global.Risotto = this;

	yield startup.performChecks(this);

	//if all files are present we are good to go
	this.config = require(this.CONFIG + this.env);

	//set log level
	this.logger.levels = this.config.logger.levels;

	//load the application file
	this.application = startup.loadApplication(this);

	yield startup.loadModules(this);

	this.controllers = startup.loadControllers(this);

	//load filter
	require('./src/filter');
	startup.loadFilter(this);

	//load routes & check them
	this.routes = yield startup.loadRoutes(this);

	//start http
	this.httpServer = require('./src/http')(this, this.routes);

	/**
	 * Bind things to the process.
	 */
	process.on('uncaughtException', this.onerror.bind(this));
	process.title = this.application.title;

	//ready to go
	this.logger.info("Ready!");
});

/**
 * print startup info
 */

Risotto.prototype.printStartupInfo = function(){
	this.logger.info('Risotto - Welcome');
	this.logger.info('Booting ' + this.env );
	this.logger.info('Version: ' + this.version);
	this.logger.info('Globalizing Risotto');
}	


/**
 * error catcher
 */

Risotto.prototype.onerror = function(err){
	// throw in dev mode
	if(this.env === 'development') throw err;
	this.logError(err);
};

Risotto.prototype.logError = function(err) {
	var msg = err.stack || err.toString();

	this.logger.error(msg.replace(/^/gm, '  '));
	this.logger.error('');
	this.logger.error('');
}

/**
 * method to explizit exit
 */
Risotto.prototype.exit = function(err){
	this.logger.error(err);
	process.exit(1); 
};