var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

    var param = {
        title: '123123',
        temp: '3313',
        id: 'test'
    };

    res.render('index', param);
});

module.exports = router;
