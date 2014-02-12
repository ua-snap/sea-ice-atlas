
/**
 * Module dependencies.
 */

var express = require('express')
  , csv = require('express-csv')
  , contentRoutes = require('./routes/index')
  , dataRoutes = require('./routes/data')
  , http = require('http')
  , path = require('path')
  , conf = require('nconf');

var app = express();

// Establish config file connections, add it to the app + expose to templates
conf.file({ file: './config.json' });
app.set('config', conf);
app.locals.config = conf.get();

app.configure(function(){
  app.set('port', conf.get('port'));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.compress());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', contentRoutes.index);
app.get('/explore', contentRoutes.explore);
app.get('/glossary', contentRoutes.glossary);
app.get('/about', contentRoutes.about);
app.get('/download', contentRoutes.download);
app.get('/credits', contentRoutes.credits);
app.get('/disclaimer', contentRoutes.disclaimer);
app.get('/data/concentration', dataRoutes.data.concentration);
app.get('/csv/concentration', dataRoutes.data.concentrationCsv);
app.get('/data/openwater', dataRoutes.data.openwater);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
