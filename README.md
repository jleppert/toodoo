Toodoo
============

* Uses express for web server and dust server side templating
* Uses dust client side templates with shared views on client/server
* Templates are rendered on the server for performance on initial load, and then state and control are managed by Backbone on the client
* Foundation & Zepto for frontend

Running The Application
-------------

    git clone https://github.com/jleppert/toodoo.git
    cd toodoo
    npm install .
    npm start

If you're running it from somewhere other than the root of the checked out repo, set 
the environment variable `TOODOO_APP_ROOT` to the absolute path of the repo on your system, e.g.:

	TOODOO_APP_ROOT='/home/www/toodooo' node /home/www/toodoo/bin/controller.js --port 8080
	
Demo
------------
A running demo is available at: http://toodoo.stuffzies.com/
