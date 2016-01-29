/**
 * Created by Minhyeong on 2016-01-04.
 */

var www = require('./../app'),
    websocket = require('./websocket')(www.io, this),
    socket1 = require('./socket')(this, 7004),
    socket2 = require('./socket')(this, 7005),
    socket3 = require('./socket')(this, 7006),
    socket4 = require('./socket')(this, 7007),
    socket5 = require('./socket')(this, 7008),
    socket6 = require('./socket')(this, 7009);

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