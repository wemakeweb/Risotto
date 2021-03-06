#Risotto
Risotto is a VC framework based on koajs.

##Install
__Risotto requires redis to run__
```sh
$ npm install risotto
```

#Scaffolding 
Risotto needs a special project structure to run:
```
app/
	controllers/
	filters/
	modules/
	public/
	views/
	application.js

config/
	production.js
	development.js
	routes.yml
```

Require Risotto where ever you want and pass the those folders to the *initialize* method like this: 
__it makes heavy use of es6 harmony features and thus requires node´s **--harmony** flag__
```js
require('risotto').initialize(__dirname);
```

After calling *initialize* Risotto will boot up and look up all [controllers](https://github.com/wemakeweb/Risotto#controllers) in /app/controllers. It will bind all [routes](https://github.com/wemakeweb/Risotto#routes) configured in the /config/routes.yml file for you. 
__Be Aware__ Risotto will register a global variable named "Risotto".

##Controllers
Controllers take the main part in handling incoming requests and processing them.

A controller consists of a group of methods which handle one type of request defined in the **route**. Example:
```js
module.exports = Risotto.Controller.extend({
	index : function*(params){
		yield this.render("dashboard/index", {user : user });
	}
});
```
The params object passed to each method contains every parameter that might be passed to the server. In the methods you have access to the following methods:

### this.render(pathToView, options = {})
Generator Function which renders and returns a html template at **path**. Everything into the options object will be available as variable in the template.

### this.body = 
setter/getter for the response body

###this.status =
setter/getter for the response status code

###this.redirect(path)
Redirects the Request to **path**

###this.error(code [, message])
Returns an http error with the given **code** and optional with the **message**.

###this.attachment
access to the koa attachment method

###this.json
access to the koa method json

###this.type
access to the koa attribute type

###this.session
access to the koa attribute session

###this.request
access to the koa request object

###this.response
access to the koa response object

##Routes
The routes file in the config directory contains all the individual routes to the controllers. It has the following syntax:

```yml
routes:
 GET /:username/: Profile.show
```
###namespacing
Routes can be namespaced in the following way:

```yml
routes:
 project:
  GET :id-(.+): Project.show
```

##Application.js

```js
module.exports = Risotto.Application.extend({
	
	// process title
	title: "My Risotto App",
	
	onAuthorizationError : function*(koaContext, next){
		//do something onAuthorizationError
	},

	onNotFoundError : function*(koaContext, next){
		// do something onNotFoundError
	},

	onError : function*(koaContext, next){
		// do something onError
	}
});
```

##Modules
…

##Filters
Filters are a way to reuse common controller functionality. We differentiate between **beforeFilter** which run before the controller and the **afterFilter** which run after the actual controller.
###Using Filters

```js
Risotto.Controller.extend({
	// calls the `user` and the `authorize` filter before
	beforeFilter: ['user', 'authorize']
})

Risotto.Controller.extend({
	beforeFilter: {
		/* 
		 * calls `user` filter before 
		 * all controller methods
		 */
		user: '*', 

		/*
		 * calls `authorize` filter only 
		 * before protectedMethod
		 */
		authorize: 'protectedMethod',

		/*
		 * calls `foo` filter only 
		 * before protectedMethod and show
		 */
		foo: ['show', 'protectedMethod']
	}
});
```
###Defining Filters
Create a new file in app/filters and call `Risotto.before` to register a beforeFilter and `Risotto.after` to register a afterFilter.
```js
Risotto.before('user', function*(){
	if( !this.session || !this.session.user_id ){
		return;
	}
	
	//`this` referes to the controller context
	this.user = yield User.findOne({ id: this.session.user_id });
});
```