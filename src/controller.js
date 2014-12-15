var _ = require('underscore');
var extend = require('backbone').Model.extend;
var delegate = require('delegates');
var ejs = require('ejs');
var path = require('path');
var fs = require('co-fs');

/**
 * default render options
 */

var renderSettings = {
  cache: false,
  layout: 'layout',
  viewExt: '.html',
  open: '<%',
  close: '%>'
};

/**
 * Intermediate render cache.
 */

var renderCache = {};

/**
* generate html with view name and options
* @param {String} view
* @param {Object} options
* @return {String} html
*/
function *render(view, options) {
    view += renderSettings.viewExt;
    var viewPath = path.join(Risotto.APP, 'views', view);
    
    //expose Risotto.config
    options.Risotto = {
      config: Risotto.config
    };

    // get from cache
    if (renderSettings.cache && renderCache[viewPath]) {
      return renderCache[viewPath](this, options);
    }

    var tpl = yield fs.readFile(viewPath, 'utf8');
    var fn = ejs.compile(tpl, {
      filename: viewPath,
      _with: true,
      compileDebug: true,
      open: renderSettings.open,
      close: renderSettings.close,
      scope: this
    });

    if (renderSettings.cache) {
      renderCache[viewPath] = fn;
    }

    return fn.call(this, options);
}


/**
 * Expose the BaseController.
 */

module.exports = BaseController;

/**
 * Risotto.Controller
 * is the Base Controller all other Controllers should inherit from.
 */

function BaseController(){}

/**
 * The prototype.
 */

var proto = BaseController.prototype;

_.extend(proto, {   
    /**
    * generate html with view name and options
    * @param {String} view
    * @param {Object} options
    * @return {String} html
    */
    render: function*(view, options) {
        options = options || {};
        options.user = this.user || null;

        var html = yield *render.call(this, view, options);

        var layout = ("layout" in options && options.layout === false) ? false : (options.layout || renderSettings.layout);
        if (layout) {
          // if using layout
          options.body = html;
          html = yield *render.call(this, layout, options);
        }

        this.type = 'html';
        this.body = html;
    },


    /**
     * array holding the beforeFilter names
     */
     
    beforeFilter: [],

    /**
     * array holding the afterFilter names
     */
     
    afterFilter: []
});

/**
 * Delegate the `koaContext` methods & accessors to ours
 */

delegate(proto, 'koaContext')
    //.method('throw')
    .method('attachment')
    .method('json')
    .method('url')
    .method('redirect')
    .access('status')
    .access('body')
    .access('type')
    .access('session')
    .access('request')
    .access('response')

/**
 * Make it extendable.
 */ 

BaseController.extend = extend;