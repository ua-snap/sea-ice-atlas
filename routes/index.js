
/*
 * GET various pages.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Sea Ice Atlas' });
};

exports.explore = function(req, res) { res.render('explore', { title: 'Sea Ice Atlas: Explore' }); }
exports.glossary = function(req, res) { res.render('glossary', { title: 'Sea Ice Atlas: Glossary' }); }
exports.download = function(req, res) { res.render('download', { title: 'Sea Ice Atlas: Download' }); }
exports.about = function(req, res) { res.render('about', { title: 'Sea Ice Atlas: About' }); }