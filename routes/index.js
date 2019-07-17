var express = require('express');
var router = express.Router();

/* GET manage home page. */
router.get('/', function(req, res, next) {
	//res.redirect('/spatial')
	res.redirect('/spatial/manage/index')
    //res.render('index', { title: 'Express' });
});

module.exports = router;
