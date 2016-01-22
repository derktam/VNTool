/**
 * Created by Minhyeong on 2016-01-22.
 */
/* USER 객체
 id
 socket
 links = [];
 */
var user = [];
user['session'] = [];
user['add'] = function (socket) {
    var tmp = [];
    tmp['id'] = socket.remoteAddress + ":" + socket.remotePort;
    tmp['socket'] = socket;
    user['session'].push(tmp);

    console.log(user);
};

user['delete'] = function (socket) {
    for(var i=0;i<user['session'].length;i++){
        if(Object.is(user.session[i].socket,socket)){
            user.session.splice(i,1);
            console.log(socket.remoteAddress + ":" + socket.remotePort + "제거 완료");
            break;
        }
    }
};

user['link'] = function (socket) {


};

user['drop'] = function (socket) {


};

module.exports = {
    user:user
};