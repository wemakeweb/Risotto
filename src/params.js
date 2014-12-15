var _ = require("underscore");

function Params() {}

Params.prototype.set = function(obj, val) {
	if(_.isString(obj) && val){
		this[obj] = val;
		return;
	}

	for (var key in obj) {
		this[key] = _.clone(obj[key]);
	}
};

Params.prototype.take = function(/** args */){
	var taken = {};

	[].forEach.call(arguments, function(key){
		taken[key] = _.clone(this[key]);
	}, this);

	return taken;
};

Params.prototype.setFile = function(file){
	if(!this.files){
		this.files = [];
	}
	this.files.push(file);
};

module.exports = Params;