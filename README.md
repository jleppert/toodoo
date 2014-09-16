Toodoo
============

Running The Application
-------------

    git clone https://github.com/jleppert/toodoo.git
    cd toodoo
    npm install .
    npm start [--port 8080]

If you're running it from somewhere other than the root of the checked out repo, set 
the environment variable `TOODOO_APP_ROOT` to the absolute path of the repo on your system, e.g.:

	TOODOO_APP_ROOT='/home/www/toodooo' npm run /home/www/toodoo start --port 8080

Running The Tests
-------------

    npm test