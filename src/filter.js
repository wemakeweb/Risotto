var forEach = require('generator-foreach');

var filters = {
	before: { },
	after: { }
};

/**
 * shorthands
 * @api public
 */

['before', 'after'].forEach(function(when){
 	Risotto[when] = function(name, fn){
 		if(filters[when][name]){
			throw new Error('There\'s already a Filter named:"'+ name +'"');
		}

 		filters[when][name] = fn;
 	};
});

/**
 * use this to invoke the filters
 * @api private
 */

Risotto.callBefore = function *(toCall, controllerContext){
	yield * forEach(toCall, function*(filter){
		if(!(filter in filters.before)){
			throw new Error('There\'s no Filter named: '+ filter);
		}
		yield filters.before[filter].call(controllerContext);
	});
};

Risotto.callAfter = function *(toCall, controllerContext){
	yield * forEach(toCall, function*(filter){
		if(!(filter in filters.after)){
			throw new Error('There\'s no Filter named: '+ filter);
		}
		yield filters.after[filter].call(controllerContext);
	});
};