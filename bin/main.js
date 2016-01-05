/**
 * Created by Minhyeong on 2016-01-04.
 */

var cluster = require('cluster'); // Only required if you want the worker id
var sticky = require('sticky-session');
var redis = require('socket.io-redis');
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
        console.log('마스터가 워커로부터 받은 메시지 : ' + message);
    });
} else {
    // Worker code
    var io = socketio.listen(www.server, {
        'log level': 2
    });
    io.adapter(redis({ host: 'localhost', port: 6379 }));
    //var route_request = require('./request-route')(www.app, this, process.pid);
    var route_socket = require('./socket-route')(io, this, process.pid);
    for(var i=0;i<20000000;i++) {
        if(i%1000000 == 0)
            console.log("[" + process.pid + "] " + ((i*100)/20000000) + "%")
        var a = Math.sin(i) * Math.cos(i) * Math.tan(i);
    }
    process.send(process.pid+ "메시지");
}