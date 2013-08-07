var express = require('express');
var app = express();

app.get('/', function(req, res){
	res.send('Sea ice atlas API server.');
});

app.listen(3000);