/**
 * Created by Minhyeong on 2016-01-04.
 */

var cluster = require('cluster'); // Only required if you want the worker id
var sticky = require('sticky-session');
var redis = require('socket.io-redis');
var socketio = require('socket.io');
var www = require('../app');

if (!sticky.listen(www.server, 3001)) {
    // Master code
    www.server.once('listening', function() {
        console.log('server started on 3001 port');
    });
} else {
    // Worker code
    var io = socketio.listen(www.server, {
        'log level': 2
    });

    io.adapter(redis({ host: 'localhost', port: 6379 }));

    var route_request = require('./request-route')(www.app, this, process.pid);
    var route_socket = require('./socket-route')(io, this, process.pid);
}