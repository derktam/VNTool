/**
 * Created by Minhyeong on 2016-01-22.
 */
var net = require('net');
var async = require('async');
var util = require('util');

module.exports = function(main, port) {
    var server = net.createServer(function (client) {
        var target_socket = undefined;
        console.log('Client connection: ');
        console.log('   local = %s:%s', client.localAddress, client.localPort);
        console.log('   remote = %s', client.remoteAddress + ":" + client.remotePort);
        var ip = client.remoteAddress.replace(/:/gi,"");
        ip = ip.replace(/f/gi,"");
        client.setMaxListeners(0);
        client.setTimeout(600000);
        if(port == 6004) {
            target_socket = client;
            client.setEncoding('utf8');
        } else {
            client.pause();
            if(port >= 6006){
                if(main.obj.proxy.get_by_user_ip_port(ip,port) != -1) {
                    var check_wait_interval = setInterval(function () {
                        if (!main.obj.user.check_wait(ip, port)) {
                            clearInterval(check_wait_interval);
                            main.obj.user.add(client, port, function (packet, socket) {
                                console.log("####[proxy_link]" + packet);
                                packet = create_packet('proxy_link', packet, true, socket);
                                console.log(socket.remotePort);
                                send(socket, packet);
                            });
                        }
                    }, 100);
                }else{
                    console.log('['+port+'][정책 없음]' + ip);
                    client.end();
                }
            }else{
                main.obj.wait_client.add(client);
            }
        }
        client.on('data', function (data) {
            //console.log('Received data from client on port %d: %s', client.remotePort, data.toString());
            //console.log('[' +port+']  Bytes received: ' + client.bytesRead);
            if(port == 6004){
                var packet = json_parse(data);
                if(packet == -1)    return;
                switch(packet.type){
                    case 'hello':
                        main.obj.client.add(client,true,packet.data);
                        var packet = create_packet('hello', main.obj.key.exportKey('public'), true, client);
                        send(client,packet);
                        break;
                    case 'welcome':
                        if(packet.data == 'encrypt'){
                            console.log("Encrypt Check OK");
                            var packet = create_packet('welcome', 'tpyrcne', true, client);
                            send(client,packet);
                        }else{
                            console.log("Encrypt Session Fail");
                            client.end();
                        }
                        break;
                    case 'hs_finish':
                        if(packet.data == 'ok') {
                            console.log("HandShake OK");
                            async.waterfall([
                                function(cb) {
                                    main.psql.check_client(ip,cb);
                                },
                                function(check,name,cb) {
                                    if(check){
                                        if(main.obj.client.get_by_name(name) == -1) {
                                            var packet = create_packet('name_check', 'ok', true, client);
                                            send(client, packet);
                                            console.log('[6004][접속 성공] ' + name + " [" + ip + "]");
                                            main.obj.client.connect(client, name);
                                        }else{
                                            console.log("[중복 접속]" + name);
                                            client.end();
                                        }
                                    }else {
                                        var packet = create_packet('name_check', 'name', true, client);
                                        send(client, packet);
                                    }
                                }
                            ]);
                        }
                        break;
                    case 'name_check':
                        async.waterfall([
                            function(cb) {
                                // 중복 체크
                              main.psql.check_name(packet.data,cb);
                            },
                            function(check,cb) {
                                if(check){
                                    main.psql.insert_client(packet.data, ip, check, cb);
                                }else{
                                    cb(null, false, false);
                                }
                            },
                            function(check,name,cb) {
                                if(check && name.length > 0){
                                    var packet = create_packet('name_check', 'ok', true, client);
                                    send(client,packet);
                                    console.log('[6004][접속 성공] ' + name  + " [" + ip + "]");
                                    main.obj.client.connect(client,name,client);
                                }else{
                                    var packet = create_packet('name_check', 'retry', true, client);
                                    console.log("중복 닉네임");
                                    send(client,packet);
                                }
                            }
                        ]);
                        break;
                    case 'link':
                        var tmp = packet.data.split('|');
                        tmp[1] = ip + ":" + tmp[1];
                        console.log("[link 명령] " + tmp);
                        var wait_interval = setInterval(function(){
                            var result = main.obj.wait_client.get(tmp[1]);
                            if(result != -1){
                                clearInterval(wait_interval);
                                main.obj.user.link(tmp[0],tmp[1],result.socket,function(session) {
                                    console.log("resume!");
                                    session.socket.resume();
                                    session.target_socket.resume();
                                });
                            }
                        },500);

                        break;
                    case 'link_ok':
                        var tmp = ip + ":" + packet.data;
                        for(var i=0;i<main.obj.proxy.session.length;i++){
                            var tmp2 = main.obj.proxy.session[i].client_pb_ip + ":" + main.obj.proxy.session[i].client_pr_ip + ":" + main.obj.proxy.session[i].client_port;
                            if(tmp == tmp2 && main.obj.proxy.session[i].state == 0){
                                console.log("등록 완료");
                                main.obj.proxy.session[i].websocket.emit("link_request_result","ok");
                                main.obj.proxy.session[i].state = 1;
                                break;
                            }
                        }
                        break;
                    case 'link_fail':
                        console.log(ip + ":" + packet.data);
                        var tmp = ip + ":" + packet.data
                        for(var i=0;i<main.obj.proxy.session.length;i++){
                            var tmp2 = main.obj.proxy.session[i].client_pb_ip + ":" + main.obj.proxy.session[i].client_pr_ip + ":" + main.obj.proxy.session[i].client_port;
                            if(tmp == tmp2 && main.obj.proxy.session[i].state == 0){
                                console.log("삭제 완료");
                                main.obj.proxy.session[i].websocket.emit("link_request_result","fail");
                                main.obj.proxy.session.splice(i,1);
                                break;
                            }
                        }
                        break;
                }
            }else{
                var tmp = main.obj.user.get(client);
                if(tmp != -1){
                    if(port == 6005)    target_socket = tmp.socket;
                    else                target_socket=tmp.target_socket;
                    send(target_socket,data,client);
                }else    console.log("tmp = -1");
            }
        });

        client.on('drain', function () {
            console.log('[drain]'+port);
            target_socket.resume();
        });

        client.on('end', function () {
            console.log('Client disconnected');
            if(port != 6004)
                main.obj.user.delete(client,false);
            else
                main.obj.client.delete(client);

            server.getConnections(function (err, count) {
                console.log('[' + port + ']Remaining Connections: ' + count);
            });
        });
        client.on('error', function (err) {
            console.log('Socket Error: ', JSON.stringify(err));
            console.log(util.inspect(err));
            if(port != 6004)
                main.obj.user.delete(client,true);
            else
                main.obj.client.delete(client);
        });
        client.on('timeout', function () {
            console.log('Socket Timed out');
            if(port != 6004)
                main.obj.user.delete(client,false);
            else
                main.obj.client.delete(client);
        });
    });

    server.listen(port, function () {
        console.log('Server listening: ' + port);
        server.on('close', function () {
            console.log('Server Terminated');
        });
        server.on('error', function (err) {
            console.log('Server Error: ', JSON.stringify(err));
        });
    });

    var json_parse = function(data){
        var result;
        try {
            result = main.obj.key.decrypt(data,'utf8');
            result = JSON.parse(result);
            return result;
        }catch(e){
            try{
                result = JSON.parse(data);
                return result;
            }catch(e) {
                return -1;
            }
        }
    }
    var create_packet = function(type, data, encrypt, client){
        var tmp = {
            type : type,
            data : data
        }
        var packet = JSON.stringify(tmp);

        if(encrypt && main.obj.client.get(client) != -1)
            packet = main.obj.client.get(client).key.encrypt(packet,'base64');

        return packet;
    }

    function send(socket, data, ori_socket) {
        if(ori_socket != undefined){
            ori_socket.pause();
        }
        //console.log("[전송][" + data.length + "]");
        async.waterfall([
            function(cb) {
                var success = socket.write(data,function(){
                    cb(null,success,socket,data,ori_socket);
                });
            },
            function(success,socket,data,ori_socket,cb) {
                if (success) {
                    //console.log("[성공][" + data.length + "]");
                    if(ori_socket != undefined){
                        ori_socket.resume();
                    }
                }
            }
        ]);
    }
    return {
        create_packet:create_packet,
        send:send
    }
}