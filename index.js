var flags = require('optimist').argv,
	Logger = require('./src/logger'),
	cli = require('./src/cli'),
	startup = require('./src/startup'),
	path = require('path'),
	redis = require("redis"),
	co = require('co'),
	cluster = require('cluster'),
	cpuCount = require('os').cpus().length;

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

Risotto.prototype.initialize = co(function*( base, cb ){
	//load the check lib
	require('./src/check');

	//load cli
	yield cli.init(this.version);
	var params = yield cli.getParams();

	//needs setup

	//production mode?
	this.env = (params.production) ? 'production' : 'development';
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

	//run Risotto as cluster?
	if(this.config.cluster.enabled && cluster.isMaster){
		var masterRisotto = this;
		this.logger.info('Running as Master');

		// calculate max cpu count
		var proc = 0;
		if(this.config.cluster.cpus === 'all') {
			// use 'nearly' all cpus
			proc = Math.ceil(0.75 * cpuCount);
		}
		else if(this.config.cluster.cpus <= cpuCount) {
			// valid cpu count specified in the config, use config
			proc = Math.ceil(0.75 * config.cpus);
		}

		// is the current process our master process?
		if(cluster.isMaster) {
			// master process, start forking workers
			for(var i = 0; i < cpuCount; i++) {
				cluster.fork();
			}

			// listen for worker-responses
			cluster.on('listening', function(worker) {
				masterRisotto.logger.info('Worker #' + worker.process.pid + ' is running');
			});

			cluster.on('exit', function(worker) {
				masterRisotto.logger.info('Worker #' + worker.process.pid + ' has died');

				// restart processes, after they have died?
				if(config.restart) {
					masterRisotto.logger.info('Worker #' + worker.process.pid + ' restarting ...');
					cluster.fork();
				}
			});
		}

	} else{
		//load the application file
		this.application = startup.loadApplication(this);

		yield startup.loadModules(this);

		this.controllers = startup.loadControllers(this);

		//load filter
		require('./src/filter');
		startup.loadFilter(this);

		//load routes & check them
		this.routes = yield startup.loadRoutes(this);

		this.httpServer = require('./src/http')(this, this.routes);

		/**
		 * Bind things to the process.
		 */
		process.on('uncaughtException', this.onerror.bind(this));
		process.title = this.application.title;

		//ready to go
		this.logger.info("Ready!");

		//initialization callback
		if(cb) {
			cb();
		}
	}
});

/**
 * print startup info
 */

Risotto.prototype.printStartupInfo = function(){
	this.logger.info('Risotto - Welcome');
	this.logger.info('Booting ' + this.env );
	this.logger.info('Version: ' + this.version);
	this.logger.info('Globalizing Risotto');
};

/**
 * error catcher
 */

Risotto.prototype.onerror = function(err){
	// throw in dev mode
	if (this.env === 'development') {throw err};
	this.logError(err);
};

Risotto.prototype.logError = function(err) {
	var msg = err.stack || err.toString();
	this.logger.error(msg.replace(/^/gm, '  '));
	this.logger.error('');
	this.logger.error('');
};

/**
 * method to explizit exit
 */
Risotto.prototype.exit = function(err){
	this.logger.error(err);
	process.exit(1);
};