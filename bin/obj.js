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
/* wait_client 객체 */
var wait_client = [];

/* port */
var port = 6006;
var proxy_id = 0;
var test = 0;

user.session = [];
client.session = [];
proxy.session = [];

user['add'] = function (socket,port,callback) {
    var tmp = [];
    var ip = socket.remoteAddress.replace(/:/gi,"");
    ip = ip.replace(/f/gi,"");
    var tmp2 = proxy.get_by_user_ip_port(ip, port);
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
    tmp.proxy = tmp2;
    tmp.target_id = undefined;
    tmp.target_socket = undefined;
    user.session.push(tmp);

    console.log("[USER ADD] : " + id);

    var client_cmd_socket = client.get_by_name(tmp2.client_name).socket;
    if(client_cmd_socket == -1) console.log("[USER][ADD] " + tmp2.client_name + "의 client_cmd_socket 이 -1 임");

    callback(id + "|" + tmp2.client_pr_ip + "|" + tmp2.client_port,client_cmd_socket);
};

user['get_target_socket'] = function (socket) {
    for(var i=0;i<user.session.length;i++){
        if(Object.is(user.session[i].socket,socket)){
            return user.session[i].target_socket;
        }else if(Object.is(user.session[i].target_socket,socket)){
            return user.session[i].socket;
        }
    }
    return -1;
};
user['get'] = function (socket) {
    for(var i=0;i<user.session.length;i++){
        if(Object.is(user.session[i].socket,socket)){
            return user.session[i];
        }else if(Object.is(user.session[i].target_socket,socket)){
            return user.session[i];
        }
    }
    return -1;
};

user['check_wait'] = function (ip,port) {
    for(var i=0;i<user.session.length;i++){
        if(user.session[i].ip == ip && user.session[i].port == port){
            if(user.session[i].target_socket == undefined){
                return true;
            }
        }
    }
    return false;
};

user['delete'] = function (socket, flag) {
    for(var i=0;i<user.session.length;i++){
        if(Object.is(user.session[i].socket,socket)){
            if(user.session[i].target_socket != undefined)  user.session[i].target_socket.end();
            user.session.splice(i,1);
            console.log("[user][delete] 성공");
            break;
        }else if(Object.is(user.session[i].target_socket,socket)){
            if(user.session[i].socket != undefined)  user.session[i].socket.end();
            user.session.splice(i,1);
            console.log("[user][delete] 성공");
            break;
        }
    }
    if(flag){
        socket.end();
    }
};

user['link'] = function (user_id, client_id, socket, callback) {
    for(var i=0;i<user.session.length;i++){
        if( user.session[i].id == user_id ){
            user.session[i].target_id = client_id;
            user.session[i].target_socket = socket;
            console.log("[LINK] socket 완료");
            callback(user.session[i]);
            return true;
        }
    }
    return false;
};

wait_client['add']  = function (socket){
    var tmp = [];
    tmp.id = socket.remoteAddress;
    tmp.id = tmp.id.replace(/:/gi,"");
    tmp.id = tmp.id.replace(/f/gi,"");
    tmp.id = tmp.id + ":" + socket.remotePort;
    tmp.socket = socket;
    wait_client.push(tmp);
    console.log("[wait_client][add] " + tmp.id);
}

wait_client['get']  = function (id){
    for(var i=0;i<wait_client.length;i++){
        if(wait_client[i].id == id){
            return wait_client[i];
        }
    }

    return -1;
}

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

    console.log(socket.remoteAddress + ":" + socket.remotePort + "추가(" + client.session.length +")");
};

client['connect'] = function (socket, name) {
    client.get(socket).name = name;
    client.get(socket).state = true;
};

client['delete'] = function (socket) {
    for(var i=0;i<client.session.length;i++){
        if(Object.is(client.session[i].socket,socket)){
            console.log("[client][delete]" + socket.remoteAddress + ":" + socket.remotePort + "제거(" + (client.session.length-1) +")");
            client.session.splice(i,1);
            return true;
        }
    }
    return false;
};

client['get_by_name'] = function (name) {
    for(var i=0;i<client.session.length;i++){
        if(client.session[i].name == name && client.session[i].state){
            return client.session[i];
        }
    }
    return -1;
}

client['get'] = function (socket) {
    for(var i=0;i<client.session.length;i++){
        if(Object.is(client.session[i].socket,socket)){
            return client.session[i];
        }
    }
    return -1;
};

client['get_by_pb_ip'] = function (ip) {
    for(var i=0;i<client['session'].length;i++){
        if(client.session[i].ip == ip){
            return client.session[i];
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
    for(var i=0;i<proxy.session.length;i++){
        if(proxy.session[i].user_ip == data.user_ip && proxy.session[i].user_port == data.user_port){
            console.log("[proxy][add]중복 되어있음! 기존 정책을 삭제!");
            proxy.session.splice(i,1);
        }
    }

    if(session != undefined){
        tmp.id = proxy_id;
        proxy_id++;
        tmp.user_ip = data.user_ip;
        tmp.user_port = data.user_port;

        tmp.client_pb_ip = session.ip;
        tmp.client_pr_ip = data.client_pr_ip;
        tmp.client_name = data.client_name;
        tmp.client_port = data.client_port;
        //tmp.client_cmd_socket = session.socket;
        tmp.websocket = socket;
        tmp.state = -1;
        proxy.session.push(tmp);
        return true;
    }
    return false;
};

module.exports = {
    user:user,
    client:client,
    proxy:proxy,
    wait_client:wait_client,
    key:key,
    test:test,
    port:port
};