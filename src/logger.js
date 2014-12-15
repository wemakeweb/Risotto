var Writable = require('stream').Writable,
	fs = require('fs');

var levels = {
	'Log' : 1,
	'Info' : 2,
	'Warn' : 3,
	'Error' : 4
};

var styles = {
	'Info' : 'grey',
	'Log' : 'grey',
	'Warn' : 'yellow',
	'Error' : 'red'
};

/**
 * prefix date with 0 
 */

function longDate(s){
	return (s + '').length === 1 ? '0' + s : s;
}

/** 
 * compose hours:mins
 */

function hoursMins(d){
	return longDate(d.getHours()) + ':' + longDate(d.getMinutes());
}


/**
 * styles strings huray
 */

function stylize (str, style) {
    var styles = {
        //styles
        'bold': [1, 22],
        'italic': [3, 23],
        'underline': [4, 24],
        'inverse': [7, 27],
        //grayscale
        'white': [37, 39],
        'grey': [90, 39],
        'black': [90, 39],
        //colors
        'blue': [34, 39],
        'cyan': [36, 39],
        'green': [32, 39],
        'magenta': [35, 39],
        'red': [31, 39],
        'yellow': [33, 39]
    };
    	
    return '\033[' + styles[style][0] + 'm' + str + '\033[' + styles[style][1] + 'm';
};


function Logger( Yolo ){
	Writable.call(this, {
		decodeStrings : false
	});
	
	this.levels = {
		console : 0,
		file : 5
	};

	if(!fs.existsSync(Yolo.CONFIG + 'logs')){
		console.log("Created Logs Folder");
		fs.mkdirSync(Yolo.CONFIG + 'logs');
	}

	this.logFileStamp = nowStamp();
	this.outStream = getLogFileStream(Yolo.CONFIG + 'logs/' + this.logFileStamp );
	
	this.on('_', function(type, args){
		var now = new Date,
			logUnstyled = '[' + now.toUTCString() + ']' + '['  + type+ '] ' + args;

		if(this.levels.console <= levels[type]){
			var time = stylize(hoursMins(now), 'grey'),
				args = stylize(args, styles[type]);

			if( this.lastLogTime === time ){
				console.log('		%s', args);
			} else {
				console.log('	%s:  %s', time, args);
				this.lastLogTime = time;
			}

			this.emit(type, args);
		}

		//move this in own appender
		if(this.levels.file <= levels[type]){
			if(this.logFileStamp != nowStamp()){				
				this.outStream.end();
				this.outStream.destroySoon();

				this.logFileStamp = nowStamp();
				this.outStream = getLogFileStream(Yolo.CONFIG + 'logs/' + this.logFileStamp );
			}

			if( this.outStream ){
				this.outStream.write(logUnstyled + '\n');
			}
		}

	}, this);
};

Logger.prototype = Object.create( 
	Writable.prototype, { 
		constructor: { 
			value: Logger
		}
	}
);

Logger.prototype._write = function(str, encoding, cb){
	this.emit('_', 'Info', str)
	cb(null);
};
//public
Logger.prototype.log = function(a){
	this.emit('_', 'Log', a);
};

Logger.prototype.info = function(a){
	this.emit('_', 'Info', a);
};

Logger.prototype.warn = function(a){
	this.emit('_', 'Warn', a);
};

Logger.prototype.error = function(a){
	this.emit('_' ,'Error', a);
};

function getLogFileStream(path){
	try{
		fs.openSync(path + '.txt', 'a');
		return fs.createWriteStream(path + '.txt', {
			flags : 'a'
		})
	} catch(err){
		console.log(stylize("Yolo has no write permission to logs folder thus we cannot generate log files", "red"));
	}
	
}

function nowStamp(){
	var n = new Date();
	return [ n.getFullYear(), ('0'+(n.getMonth()+1)).slice(-2), ('0'+n.getDate()).slice(-2)].join('-');
}

module.exports = Logger;