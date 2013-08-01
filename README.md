# Sea Ice Atlas

Web app for exploring arctic sea ice extent.

## Development

Basic idea is there's a simple web app (```client/```) which communicates with a basic data API and/or other services as required.

### Client

#### Installation of build environment

The client application is handled with [Yeoman](http://yeoman.io/), using the [Backbone generator](https://github.com/yeoman/generator-backbone).  Follow steps on those sites to get Yeoman and the appropriate generator installed.

Then,

```bash
git clone git@github.com:ua-snap/sea-ice-atlas.git
cd sea-ice-atlas/client
npm install
bower install
```

#### Building the project

To run a development environment, it's ```grunt server``` and to build for release, it's ```grunt```.

#### Important files, locations

The ```index.html``` file in ```client/app/``` is where a fair amount of initial templating can be done, and other page elements that are rendered on the fly are located in ```client/app/scripts/templates/```.  *It's probably important to keep that ```index.html``` in sync, at least in terms of script references, with the one used in the ```test/``` directory*.

### Server

#### Installation

The repo is already cloned, as above.  At this point, the server is just stubbed in place at this point, but for what it's worth:

```bash
cd sea-ice-atlas/server
npm install
npm start
```

### Jenkins

Upon changes to the master branch (checked every 5 minutes), Jenkins runs ```grunt``` then copies the contents of the ```dist/``` to Icarus.  One gotcha: the "publish over ssh" plugin chokes on removing prefixes from dotfiles (in this case, ```.htaccess```) so those files are omitted from being copied to the production server.