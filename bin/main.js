/**
 * Created by Minhyeong on 2016-01-04.
 */

var www = require('./www');
var io = require('socket.io')(www.server);
var handle_request = require('./request-route')(www.app, this);
var handle_socket = require('./socket-route')(www.server, this);


