/**
 * Created by Minhyeong on 2016-01-04.
 */
require('console-stamp')(console, 'yyyy:mm:dd HH:MM:ss');

var www = require('./../app'),
    websocket = require('./websocket')(www.io, this),
    socket1 = require('./socket')(this, 6004),
    socket2 = require('./socket')(this, 6005),
    socket3 = require('./socket')(this, 6006),
    socket4 = require('./socket')(this, 6007),
    socket5 = require('./socket')(this, 6008),
    socket6 = require('./socket')(this, 6009);

this.psql = require('./psql.js');
this.obj = require('./obj');

var check_new_proxy = function(obj){
    setInterval(function (){
        for(var i = 0;i < obj.proxy.session.length;i++){
            if(obj.proxy.session[i].state != -1)  continue;
            console.log(obj.proxy.session[i].client_name);
            var socket = obj.client.get_by_name(obj.proxy.session[i].client_name).socket;
            var packet = socket1.create_packet('link',obj.proxy.session[i].client_pr_ip + ":" + obj.proxy.session[i].client_port,true, socket);
            socket1.send(socket,packet,socket);
            obj.proxy.session[i].state = 0;
        }
    }, 1000);
}
check_new_proxy(this.obj);