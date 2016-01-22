/**
 * Created by Minhyeong on 2016-01-04.
 */
var www = require('../app');
var websocket = require('./websocket')(www.io, this, process.pid);
var socket = require('./socket')(this, process.pid);

this.obj = require('./obj');
console.log(this.obj);


