/**
 * Created by Minhyeong on 2016-01-04.
 */

var www = require('../app'),
    websocket = require('./websocket')(www.io, this, process.pid),
    socket1 = require('./socket')(this, 7004),
    socket2 = require('./socket')(this, 7005);

this.psql = require('./psql.js');
this.obj = require('./obj');