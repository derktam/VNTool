var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var debug = require('debug')('VNTool:server');
var http = require('http');
var socketio = require('socket.io');
var app = express();

http.globalAgent.maxSockets = Infinity;


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.set('port', process.env.PORT || '3000');


//-------------------------------------- server start -----------------------------------------------------
var server = http.createServer(app);
server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

var io = socketio.listen(server, {
    'log level': 2
});

io.sockets.setMaxListeners(0);

// module return
module.exports = {
    server:server,
    app:app,
    io:io
};