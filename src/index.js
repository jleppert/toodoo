var PACKAGE 	= require('../package.json'),
	_			= require('lodash'),
	express 	= require('express'),
	cons    	= require('consolidate'),
	util		= require('util'),
	path    	= require('path'),
	bodyParser	= require('body-parser');


/**
 * Toodoo application
 * @constructor
 * @param {object} opts.name     		The name of the application
 * @param {object} opts.title    		The display name of the application
 * @param {object} opts.description 	Short description
 * @param {object} opts.port 			The port to listen to requests on
 * @param {object} opts.paths.appRoot 	The root where the application is running
 * @param {object} opts.paths.views 	The path to view files
 * @param {object} opts.paths.logs 		Where to put logs
 * @param {object} opts.paths.build 	Where to put any files requiring a compilation step (e.g. templates)
 * @param {object} opts.paths.www 		The web root for static content files
 * @param {object} opts.paths.data 		Where data files should be stored
 */
function Toodoo(opts) {
	this.opts = _.defaults(opts, {
		name: PACKAGE.name,
		title: PACKAGE.title,
		description: PACKAGE.description,
		version: PACKAGE.version,
		port: 8080,
		paths: {}
	});

	this.start();
}

/**
 * Starts up the application, setting up express and running the web server
 */
Toodoo.prototype.start = function start() {
	var self = this,
		app  = this.app = this.app || express();

	app.use(express.static(this.opts.paths.www, { redirect: false }));
	app.engine('dust', cons.dust);

	app.set('view engine', 'dust');
	app.set('views', path.resolve(self.opts.paths.appRoot, self.opts.paths.views));
	app.use(bodyParser.json());

	// index page
	app.get('/', function(req, res) {
		res.render('layout/main', {
			app: self.opts,
			page: {
				title: 'Create A List',
				template: 'index'
			}
		});
	});

	// handle 404's
	app.get('*', function(req, res) {
		res.statusCode = 404;
		res.render('layout/main', {
			app: self.opts,
			page: {
				title: 'Page Not Found',
				template: 'error/404'
			}
		});
	});

	this.server = this.server || app.listen(this.opts.port, function logStart() {
		self.log('%s is listening on port %d', self.opts.name, self.server.address().port);
	});
};

/**
 * Logs messages with a timestamp
 */
Toodoo.prototype.log = function log() {
	var args = ['[%s]', new Date().toISOString()].concat(util.format.apply(this, Array.prototype.slice.call(arguments, 0)));
	console.log.apply(this, args);
};

/**
 * Singleton instance of application
 * @private
 */
var instance = undefined;
module.exports = {
	run: function run(opts) {
		if(instance === undefined) instance = new Toodoo(opts);
		return instance;
	}	
};