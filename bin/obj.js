/**
 * Created by Minhyeong on 2016-01-22.
 */
var NodeRSA = require('node-rsa');
var key = new NodeRSA({b: 512});

/* USER 객체 */
var user = [];
/* client 객체 */
var client = [];
/* proxy 객체*/
var proxy = [];

/* link_wait_queue 객체*/
var link_wait_queue = [];

/* port */
var port = 7006;
var proxy_id = 0;

user.session = [];
client.session = [];
proxy.session = [];


user['add'] = function (socket,port) {
    var tmp = [];
    var ip = socket.remoteAddress.replace(/:/gi,"");
    ip = ip.replace(/f/gi,"");
    var tmp2 = proxy.get_by_user_ip_port(ip,port);
    if(tmp2 == -1)  return -1;
    var id = socket.remoteAddress + ":" + socket.remotePort;
    for(var i=0;i<user.session.length;i++){
        if(user.session[i].id == id){
            return 0;
        }
    }
    tmp.id = id;
    tmp.ip = ip;
    tmp.port = port;
    tmp.socket = socket;
    tmp.target_socket = undefined;
    tmp.target_name = tmp2.client_name;
    tmp.packet_queue = [];

    user.session.push(tmp);

    console.log(socket.remoteAddress + ":" + socket.remotePort + "추가");

    return {
        user_id:id,
        client_pr_ip:tmp2.client_pr_ip,
        client_port:tmp2.client_port,
        client_cmd_socket:tmp2.client_cmd_socket
    };
};

user['delete'] = function (socket) {
    for(var i=0;i<user.session.length;i++){
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

client['add'] = function (socket, isCmd, pbkey) {
    var tmp = [];
    tmp.id = socket.remoteAddress + ":" + socket.remotePort;
    var ip = socket.remoteAddress.replace(/:/gi,"");
    ip = ip.replace(/f/gi,"");
    tmp.ip = ip;
    tmp.socket = socket;
    tmp.key = null;
    tmp.state = false;
    tmp.isCmd = isCmd;
    tmp.key = new NodeRSA({b: 512});
    tmp.key.importKey(pbkey,'public');

    client.session.push(tmp);

    console.log(socket.remoteAddress + ":" + socket.remotePort + "추가");
};

client['connect'] = function (socket, name) {
    client.get(socket).name = name;
    client.get(socket).state = true;
};

client['delete'] = function (socket) {
    for(var i=0;i<client.session.length;i++){
        if(Object.is(client.session[i].socket,socket)){
            client.session.splice(i,1);
            console.log(socket.remoteAddress + ":" + socket.remotePort + "제거");
            break;
        }
    }
};

client['get_by_name'] = function (name) {
    for(var i=0;i<client.session.length;i++){
        if(client.session[i].name == name && client.session[i].state){
            return client.session[i];
        }
    }
}

client['get'] = function (socket) {
    for(var i=0;i<client.session.length;i++){
        if(Object.is(client.session[i].socket,socket)){
            return client.session[i];
        }
    }
};

client['get_by_pb_ip'] = function (ip) {
    for(var i=0;i<client['session'].length;i++){
        if(client.session[i].ip == ip){
            return client.session[i];
        }
    }
    return -1;
};

client['link'] = function (socket) {


};

client['drop'] = function (socket) {


};

proxy['link'] = function (socket, ip, port, flag) {
    for(var i=0;i<proxy.session.length;i++){
        if(flag){
            if(proxy.session[i].user_port == port && proxy.session[i].user_ip == ip && proxy.session[i].state == 1){
                if(proxy.session[i].client_id != "")    proxy.session[i].state = 2;
                proxy.session[i].user_id = socket.remoteAddress + ":" + socket.remotePort;
                proxy.session[i].user_socket = socket;
                console.log("User Link 완료!!");
                return true;
            }
        }else{
            console.log(proxy.session[i].state);
            if(port == 7005 && proxy.session[i].client_pb_ip == ip && (proxy.session[i].state == 0 || proxy.session[i].state == 1)){
                if(proxy.session[i].user_id != "")    proxy.session[i].state = 2;
                proxy.session[i].client_id = socket.remoteAddress + ":" + socket.remotePort;
                proxy.session[i].client_socket = socket;
                console.log("Client Link 완료!!");
                return true;
            }
        }
    }
    return false;
};

proxy['cross_send'] = function (socket) {
    for(var i=0;i<proxy.session.length;i++){
        if(proxy.session[i].state == 2){
            if(Object.is(proxy.session[i].client_socket,socket)){
                if(proxy.session[i].user_socket == "")  return -1;
                return proxy.session[i].user_socket;
            }else if(Object.is(proxy.session[i].user_socket,socket)){
                if(proxy.session[i].client_socket == "")  return -1;
                return proxy.session[i].client_socket;
            }
        }
    }
    return -1;
};

proxy['get_by_user_ip_port'] = function (ip,port) {
    for(var i=0;i<proxy.session.length;i++){
        if(proxy.session[i].user_ip == ip && proxy.session[i].user_port == port && proxy.session[i].state == 1){
            return proxy.session[i];
        }
    }
    return -1;
};

proxy['add'] = function (data,socket) {
    var tmp = [];
    var session  = client.get_by_name(data.client_name);
    if(session != undefined){
        tmp.id = proxy_id;
        proxy_id++;
        tmp.user_ip = data.user_ip;
        tmp.user_port = data.user_port;

        tmp.client_pb_ip = session.ip;
        tmp.client_pr_ip = data.client_pr_ip;
        tmp.client_name = data.client_name;
        tmp.client_port = data.client_port;
        tmp.client_cmd_socket = session.socket;
        tmp.websocket = socket;
        tmp.state = -1;
        proxy.session.push(tmp);
        return true;
    }
    return false;
};

proxy['delete'] = function (socket) {

};

module.exports = {
    user:user,
    client:client,
    proxy:proxy,
    link_wait_queue:link_wait_queue,
    key:key,
    port:port
};