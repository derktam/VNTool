var express = require('express');
var main = require('../bin/main');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var param = {
        clients: main.obj.client.session
    };

    res.render('index', param);
});

module.exports = router;
