var fs = require('fs');
var _ = require('underscore');
var	Controller = require('./controller');
var	yaml = require('js-yaml');
var	fs   = require('fs');
var	thunkify = require('thunkify');
var	readFile = thunkify(fs.readFile);
var exec = require('co-exec');
var utils = require('./utils');

/**
 * init controllers
 */

function initializeController( path ){
	var Controller = require(path),
		controller_instance = new Controller();

	/** 
	 * each controller have to inherit from the app.Controller
	*/
	
	if( !(controller_instance instanceof Controller)){
		throw new Error("Controller '" + controller + "' expected to be instance of Risotto.Controller");
	}

	return Controller;
}

/**
 * are all folders present?
 */

exports.performChecks = function*( app ){
	var	checks = {
		"Application File" : app.APP + 'application.js',
		"Config File" : app.CONFIG + app.env + '.js',
		"Controller dir" : app.APP + 'controllers/',
		"Route File" : app.CONFIG + 'routes.yml'
	};
	
	for(var check in checks){
		var exists = yield utils.exists(checks[check])
		
		if(!exists){
			app.exit("No " + check + " searched for: " + checks[check]);
		}
	}
};

/**
 * check the controllers
 */

exports.loadControllers = function(app){
	var controllers = utils.readdirRecursiveSync(app.APP + 'controllers'),
		l = {};

	controllers.forEach(function( controller ){
		var Controller = initializeController( controller.path );

		/* we added only succesfully intialized controllers */
		if(controller){
			l[controller.name] = Controller;
		}
	}, this);

	return l;
};

exports.loadRoutes = function*( app ){
	var file = yield readFile(app.CONFIG + 'routes.yml', 'utf8'),
		routes = yaml.safeLoad(file),
		safeRoutes = [];

	(function routeTraveler( tree, namespace ){

		for( var exp in tree ){
			var matches = exp.match(/(GET|POST|DELETE|PUT) (.+)/);

			if(!matches && _.isObject(tree[exp]) ){
				var next = namespace.slice(0);
				next.push(exp);
				routeTraveler(tree[exp], next);

			} else if(matches) {
				var method = matches[1].toLowerCase(),
					path = matches[2],
					prefix = namespace.join('/'),
					routeOptions =  {
						via : 'get',
						authorized : true
					};

				if(_.isString( tree[exp] )){
					routeOptions = _.extend({}, routeOptions, {
						to : tree[exp]
					});
				} else {
					routeOptions = _.extend({}, routeOptions, tree[exp]);
				}

				routeOptions = _.extend({}, routeOptions, {
					via: method,
					path: prefix ? prefix + '/' + path : path
				});

				if(routeOptions.path.charAt(0) !== '/'){
					routeOptions.path = '/' + routeOptions.path
				}

				if( isValid(routeOptions.to) ){
					safeRoutes.push(routeOptions);
				} else {
					app.logger.warn("Route ["+ routeOptions.via.toUpperCase() + "]" + routeOptions.path + " is not matching any generatorfunction with: "  + routeOptions.to);
				}
			} else {
				app.logger.warn("Route '" + tree[exp] + "' has invalid format");
			}
		}
	})(routes.routes, []);

	function isValid(fn){
		fn = fn.split('.');

		if( fn[0] in Risotto.controllers ){
			var instance = new app.controllers[ fn[0] ]();
			return instance[fn[1]] && instance[fn[1]].constructor.name == 'GeneratorFunction'
		} 
		return false;
	};

	return safeRoutes;
}

exports.loadModules = function*( app ){
	var initializers = utils.readdirRecursiveSync(app.APP + 'modules/');
	for(var initializer in initializers){
		try{
			var module = require(initializers[initializer].path);
			yield module.initialize(app);
		} catch(err){
			app.exit('Initializer "' + initializers[initializer].name + '" failed with: ' + err);
		}
	} 
};

exports.loadApplication = function(app){
	var Application = require(app.APP + 'application.js'),
		instance = new Application();

	if(!(instance instanceof app.Application)){
		app.exit('Application expected to be instance of Risotto.Application');
	}

	return instance;
};

exports.loadFilter = function( app ){
	var filters = utils.readdirRecursiveSync(app.APP + 'filters/');
	for(var filter in filters){
		try{
			require(filters[filter].path);
		} catch(err){
			app.logger.warn('Filter "' + filters[filter].name + '" failed with: ' + err);
		}
	}
};