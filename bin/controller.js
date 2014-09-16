#!/usr/bin/env node
var appRoot = process.env.TOODOO_APP_ROOT || process.cwd(),
	path 	= require('path'),
	PACKAGE = require('../package.json');

var argv    = require('yargs')
    .options('port', {
    	alias: 'p',
    	default: '8080',
    	requiresArg: true,
    	describe: 'The port where the application should listen'
    })
    .example('$0 --port 8080', "Run the application on port 8080")
    .version(PACKAGE.version, 'version')
    .help('help')
    .showHelpOnFail(true)
    .argv;

var toodooApp = require(path.resolve(appRoot, 'src/index'));
toodooApp.run({ 
	port: argv.port,
	paths: {
		appRoot: appRoot,
		views:   'src/views',
		logs:    'var/logs',
		build:   'var/build',
		www:     'var/www',
		data:    'var/data'
	}
});