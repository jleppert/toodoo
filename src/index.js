var PACKAGE 	= require('../package.json'),
	_			= require('lodash'),
	express 	= require('express'),
	cons    	= require('consolidate'),
	dust        = require('dustjs-linkedin'),
	util		= require('util'),
	path    	= require('path'),
	bodyParser	= require('body-parser'),
	uuid		= require('uuid-v4'),
	md5			= require('MD5'),
	fs          = require('fs'),
	lazy        = require('lazy');

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
 * Name of the file to store index of UUIDs
 */
Toodoo.indexFilename = 'index';

/**
 * Starts up the application, setting up express and running the web server
 */
Toodoo.prototype.start = function start() {
	var self = this,
		app  = this.app = this.app || express();

	// setup static content
	app.use(express.static(this.opts.paths.www, { redirect: false }));

	// setup template engine
	app.engine('dust', cons.dust);
	app.set('view engine', 'dust');
	app.set('views', path.resolve(self.opts.paths.appRoot, self.opts.paths.views));
	app.use(bodyParser.json());

	// index page - this "redirects" (internally) to create -- no 'listing of lists' feature
	app.get('/', this.list.index(this));

	// new list UI
	app.get('/list', this.list.new(self));

	// create a list
	app.post('/list', this.list.create(this));

	// view an existing list
	app.get('/list/:uuid', this.list.read(this));

	// update an existing list
	app.put('/list/:uuid', this.list.update(this));

	// get compiled dust templates
	app.get('/tpl/**', function(req, res) {
		var templatePath = req.url.replace('/tpl/', '');
		try {
			var tplPath = path.resolve(self.opts.paths.appRoot, self.opts.paths.views, req.url.replace('/tpl/', ''));
			var tplSource = fs.readFileSync(tplPath);
			res.statusCode = 200;
			res.send(dust.compile(tplSource.toString(), path.basename(tplPath, '.dust')));
			return;
		} catch(error) {
			app.log('Error compiling dust template:', tplPath, error.message);
			res.statusCode = 500;
			res.send();
			return;
		}
	});

	// handle other random paths we don't know about
	app.get('*', this.list[404](this));

	this.server = this.server || app.listen(this.opts.port, function logStart() {
		self.log('%s is listening on port %d', self.opts.name, self.server.address().port);
	});
};

/**
 * Defines CRUD operations for a list
 */
Toodoo.prototype.list = {
	/**
 	* The index page, right now this just goes to create a new list, but could be extended to show a list of created lists
 	*/
	index: function listIndex(app) {
		var routes = this;

		return function index(req, res) {
			routes.new(app).apply(this, arguments);
		}
	},
	/**
 	* The new page, to create a new list
 	*/
	new: function listNew(app) {
		var routes = this;

		return function create(req, res) {
			// render list creation page
			res.render('layout/main', {
				app: app.opts,
				page: {
					title: 'Create a New List',
					template: 'list/create',
					state: { title: '', uuid: '', list: [{ title: '', checked: false}]}
				}
			});
		}
	},
	/**
 	* Create operation
 	*/
	create: function listCreate(app) {
		var routes = this;

		return function create(req, res) {
			// handle creation of new lists
			if(req.body.uuid) {
				routes.update(app).apply(this, arguments);
				return;
			}

			if(req.body != undefined) {
				try {
					var listData  = req.body,
						id   	  = uuid();

					listData.uuid = id;
					// write the file data
					var stream = fs.createWriteStream(uuidPath(app.opts.paths.appRoot, app.opts.paths.data, uuid));
					stream.end(JSON.stringify(listData));

					// append to index (so we can keep track of what uuid's were created)
					var index = fs.createWriteStream(path.resolve(app.opts.paths.appRoot, app.opts.paths.data, Toodoo.indexFilename), { flags: 'a'});
					index.end(id + "\n");

					// all went well, notify client
					res.statusCode = 201;
					res.send(listData);
					return;
				} catch(error) {
					// an error occured, send a status code to notify the client
					app.log('Error writing data', error.message);
					res.statusCode = 500;
					res.send({ message: 'Error saving data'});
					return;
				}
			}
		}
	},
	/**
 	* Read operation
 	*/
	read: function listRead(app) {
		var routes = this;

		return function read(req, res) {
			try {
				var listData = require(uuidPath(app.opts.path.appRoot, app.opts.path.data, req.param('uuid')));
			} catch(error) {
				routes[404]().apply(this, arguments);
			}

			res.render('layout/main', {
				app: app.opts,
				page: {
					title: listData.title,
					list: JSON.stringify(listData),
					template: 'list/edit'
				}
			});
		}
	},
	/**
 	* Update operation
 	*/
	update: function(app) {
		var routes = this;

		return function update(req, res) {
			if(req.body.list != undefined) {
				try {
					var listData = req.body;
					var id = req.param('uuid') || listData.uuid;

					var stream = fs.createWriteStream(uuidPath(app.opts.paths.appRoot, app.opts.paths.data, uuid));
					stream.end(JSON.stringify(listData));

					try {
						var exists = false,
							index  = fs.createReadStream(path.resolve(app.opts.paths.appRoot, app.opts.paths.data, Toodoo.indexFilename), { flags: 'r'});
						var lazyReader = new lazy(index).lines.forEach(function(line) {
								if(line == id) exists = true;
							});
						index.on('end', function() {
							if(!exists) {
								var updateIndex = fs.createWriteStream(path.resolve(app.opts.paths.appRoot, app.opts.paths.data, Toodoo.indexFilename), { flags: 'a'});
								updateIndex.end(id + "\n");
							}
						});
					} catch(error) {
						app.log('Error updating index', error.message);
						res.statusCode = 500;
						res.send({ message: 'Error saving data'});
						return;
					}

					// all went well, notify client
					res.statusCode = 200;
					res.send(listData);
					return;
				} catch(error) {
					app.log('Error updating data', error.message);
					res.statusCode = 500;
					res.send({ message: 'Error saving data'});
				}
			}
		}
	},
	/**
 	* 404's and list items that cannot be found on the file system
 	*/
	404: function list404(app) {
		var self = this;

		return function error_404(req, res) {
			res.statusCode = 404;
			res.render('layout/main', {
				app: app.opts,
				page: {
					title: 'Page Not Found',
					template: 'error/404'
				}
			});
		}
	}
};

/**
 * Logs messages with a timestamp
 */
Toodoo.prototype.log = function log() {
	var args = ['[%s]', new Date().toISOString()].concat(util.format.apply(this, Array.prototype.slice.call(arguments, 0)));
	console.log.apply(this, args);
};

/**
 * Gets a secure data file path for a given uuid
 * @param {string} appRoot	path to root of the application
 * @param {string} dataPath	path to data directory
 * @param {id}     id		unique id parameter
 * @private
 */
 function uuidPath(appRoot, dataPath, id) {
 	return path.resolve(appRoot, dataPath, md5(id) + '.json');
 }

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