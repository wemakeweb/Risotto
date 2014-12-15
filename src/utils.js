var fs = require('fs');

/**
 * escapeShell
 * Escapes certain characters for shell
 * @param {String} s
 * @returns {String} escaped string
 */

exports.escapeShell = function( s ) {
	return s.replace(/(["\s'$`\\])/g,'\\$1').replace(/&/g,'\\&');
};

/**
 * readdirRecursiveSync
 * @param {String} rootDir
 * @returns {Array} list of all files
 *
 * Recursivly gets all files -
 * Dotfiles and files prefixed with a 
 * dash wount be loaded
 */

exports.readdirRecursiveSync = function( rootDir ){

	return (function travel( dir, dirs, traveld ){
		var files = []

		try{
			files = fs.readdirSync(dir);
		} catch(err){
			return files;
		}
		
	    files.forEach(function(file){
	    	/**
	    	 * Dont load dotfiles and dashed files
	    	 * ProTipp: prefix files with a dash to prevent the loading 
	    	 */
	    	if(file.charAt(0) === '.' || file.charAt(0) === '_'){
	    		return;
	    	}

        	var filePath = [dir, file].join('/'),
            	stat = fs.statSync(filePath);

            if( stat.isDirectory() ){
            	var copy = traveld.slice();

            	copy.push(file);
            	travel(filePath, dirs, copy);
            } else {
            	var p = traveld.join('/');
            	dirs.push({ path : filePath, name: (p ? p + '/' : '' ) + formatName(file) });
            }
	    });

	    return dirs;
	})(rootDir, [], []);
};


/**
 * exists
 * thunkified version of fs.exists
 * @api public
 */
 
exports.exists = function(path){
	return function(fn){
		fs.exists(path, function(a){
			fn(!a, a)
		});
	}
};


/**
 * replaces .js
 * @api private
 */

function formatName(str){
	return str.charAt(0).toUpperCase() + str.slice(1).replace('.js', '');
}