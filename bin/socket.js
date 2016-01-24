/**
 * Created by Minhyeong on 2016-01-22.
 */
var net = require('net');
var async = require('async');

module.exports = function(main, port) {
    var server = net.createServer(function (client) {
        if(port >= 7006)   main.obj['user'].add(client);
        console.log('Client connection: ');
        console.log('   local = %s:%s', client.localAddress, client.localPort);
        console.log('   remote = %s', client.remoteAddress + ":" + client.remotePort);
        client.setEncoding('utf8');
        client.setMaxListeners(0);
        var ip = client.remoteAddress.replace(/:/gi,"");
        ip = ip.replace(/f/gi,"");

        if(port >= 7006){
            var result = main.obj.user.add(client,port);
            if( result == -1 ) {
                console.log("껒여!");
                client.end();
                return;
            }else if( result == 0 )
                return;
            var tmp = result.user_id + ":" + result.client_pr_ip + ":" + result.client_port;
            var packet = create_packet('proxy_link', tmp, true, result.client_cmd_socket);
            send(result.client_cmd_socket,packet);
        }else if(port == 7005){
            if( !main.obj.proxy.link(client, ip, port, false) ){
                client.end();
            }
        }

        client.on('data', function (data) {
            //console.log('Received data from client on port %d: %s', client.remotePort, data.toString());
            console.log('  Bytes received: ' + client.bytesRead);
            if(port == 7004){
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
                            this.end();
                        }
                        break;
                    case 'hs_finish':
                        if(packet.data == 'ok') {
                            console.log("HandShake OK");
                            async.waterfall([
                                function(cb) {
                                    main.psql.check_client(client.localAddress,cb);
                                },
                                function(check,name,cb) {
                                    if(check){
                                        var packet = create_packet('name_check', 'ok', true, client);
                                        send(client,packet);
                                        console.log('[7004][접속 성공] ' + name  + " [" + client.localAddress + "]");
                                        main.obj.client.connect(client,name);
                                        console.log(main.obj.client.get(client).name);
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
                                main.psql.insert_client(packet.data,client.localAddress, cb);
                            },
                            function(check,name,cb) {
                                if(check){
                                    var packet = create_packet('name_check', 'ok', true, client);
                                    send(client,packet);
                                    console.log('[7004][접속 성공] ' + name  + " [" + client.localAddress + "]");
                                    main.obj.client.connect(client,name);
                                    console.log(main.obj.client.get(client).name);
                                }else{
                                    var packet = create_packet('name_check', 'retry', true, client);
                                    send(client,packet);
                                }
                            }
                        ]);
                        break;
                    case 'link_ok':
                        console.log(ip + ":" + packet.data);
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
            }else if(port == 7005){
                var tmp = main.obj.proxy.cross_send(client);
                if(tmp == -1){
                    console.log("데이터 손실 있음!");
                    return;
                }
                //var packet = main.obj.key.decrypt(data,'utf8');
                var packet = data;
                send(tmp,packet);
            }else{
                var tmp = main.obj.proxy.get_client_pb_ip_by_user_id(client.remoteAddress + ":" + client.remotePort);
                if(tmp == -1){
                    console.log("데이터 손실 있음!");
                    return;
                }
                //var packet = main.obj.client.get_by_pb_ip(tmp).key.encrypt(data,'base64');
                var packet = data;
                tmp = main.obj.proxy.cross_send(client);
                if(tmp == -1)   return;
                send(tmp,packet);
            }
        });
        client.on('end', function () {
            console.log('Client disconnected');
            server.getConnections(function (err, count) {
                console.log('Remaining Connections: ' + count);
            });
        });
        client.on('error', function (err) {
            console.log('Socket Error: ', JSON.stringify(err));
            //.obj['user'].delete(client);
            //main.obj['client'].delete(client);
        });
        client.on('timeout', function () {
            console.log('Socket Timed out');
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

        if(encrypt)
            packet = main.obj.client.get(client).key.encrypt(packet,'base64');

        return packet;
    }

    function send(socket, data) {
        var success = !socket.write(data);
        if (!success) {
            (function (socket, data) {
                socket.once('drain', function () {
                    send(socket, data);
                });
            })(socket, data);
        }
    }
    return {
        create_packet:create_packet,
        send:send
    }
}