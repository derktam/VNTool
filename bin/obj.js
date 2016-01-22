/**
 * Created by Minhyeong on 2016-01-22.
 */
var NodeRSA = require('node-rsa');
var key = new NodeRSA({b: 512});

/* USER 객체 */
var user = [];
/* target 객체 */
var proxy = [];

/* port */
var port = 7006;
var proxy_id = 0;

user['session'] = [];
proxy['session'] = [];

user['add'] = function (socket) {
    var tmp = [];
    tmp['id'] = socket.remoteAddress + ":" + socket.remotePort;
    tmp['socket'] = socket;
    user['session'].push(tmp);

    console.log(socket.remoteAddress + ":" + socket.remotePort + "추가");
};

user['delete'] = function (socket) {
    for(var i=0;i<user['session'].length;i++){
        if(Object.is(user.session[i].socket,socket)){
            user.session.splice(i,1);
            console.log(socket.remoteAddress + ":" + socket.remotePort + "제거");
            break;
        }
    }
};

user['link'] = function (socket) {


};

user['drop'] = function (socket) {


};

proxy['add'] = function (socket, isCmd, pbkey) {
    var tmp = [];
    tmp['id'] = socket.remoteAddress + ":" + socket.remotePort;
    tmp['socket'] = socket;
    tmp['key'] = null;
    tmp['state'] = -1;
    tmp['isCmd'] = isCmd;
    tmp['key'] = new NodeRSA({b: 512});
    tmp['key'].importKey(pbkey,'public');

    proxy.session.push(tmp);

    console.log(socket.remoteAddress + ":" + socket.remotePort + "추가");
};

proxy['delete'] = function (socket) {
    for(var i=0;i<proxy['session'].length;i++){
        if(Object.is(proxy.session[i].socket,socket)){
            proxy.session.splice(i,1);
            console.log(socket.remoteAddress + ":" + socket.remotePort + "제거");
            break;
        }
    }
};

proxy['get'] = function (socket) {
    for(var i=0;i<proxy['session'].length;i++){
        if(Object.is(proxy.session[i].socket,socket)){
            return proxy.session[i];
        }
    }
}

proxy['link'] = function (socket) {


};

proxy['drop'] = function (socket) {


};

module.exports = {
    user:user,
    proxy:proxy,
    key:key,
    port:port
};