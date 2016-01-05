/**
 * Created by Minhyeong on 2016-01-04.
 */

var cluster = require('cluster'); // Only required if you want the worker id
var sticky = require('sticky-session');
var socketredis = require('socket.io-redis');
var socketio = require('socket.io');
var www = require('../app');
var numCPUs = require('os').cpus().length;
cluster.schedulingPolicy = 2; // RR

if (!sticky.listen(www.server, 3001)) {
    // Master code

    www.server.once('listening', function () {
        console.log('server started on 3001 port');
        console.log(cluster);
    });

    cluster.on('message', function (message) {
        //console.log('마스터가 워커로부터 받은 메시지 : ' + message);
    });
} else {
    // Worker code
    var io = socketio.listen(www.server, {
        'log level': 2
    });
    io.adapter(socketredis({ host: 'localhost', port: 6379 }));
    //var route_request = require('./request-route')(www.app, this, process.pid);
    var route_socket = require('./socket-route')(io, this, process.pid);

    //process.send(process.pid+ "메시지");
}