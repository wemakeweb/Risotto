var _ = require('underscore');
var extend = require('backbone').Model.extend;

/**
 * Expose.
 */

module.exports = BaseApplication;


/**
 * Risotto.Application is the base Application
 */

function BaseApplication(){}

_.extend( BaseApplication.prototype, {
    /**
     * Default title.
     */

    title: 'Risotto Application',
    
    /**
     * Handle authorization errors.
     */
    
    onAuthorizationError : function*(koaContext, next){

    },

    /**
     * Handle generic errors.
     */

    onError : function*(koaContext, next, error){
        if(Risotto.devMode){
            koaContext.response.body = '<pre>' + error.stack + '</pre>';
        }

        Risotto.logError(error);
    },

    /**
     * Handle not found errors.
     */

    onNotFoundError : function*(koaContext, next){

    }
});


/**
 * Make it extendable
 */

BaseApplication.extend = extend;