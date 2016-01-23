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
        client.on('data', function (data) {
            console.log('Received data from client on port %d: %s', client.remotePort, data.toString());
            console.log('  Bytes received: ' + client.bytesRead);
            if(port == 7004){
                var packet = json_parse(data);
                if(packet == -1)    return;
                switch(packet.type){
                    case 'hello':
                        main.obj.proxy.add(client,true,packet.data);
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
                            console.log("HandShake 끝!");
                            async.waterfall([
                                function(cb) {
                                    main.psql.check_client(client.localAddress,cb);
                                },
                                function(check,cb) {
                                    console.log(check);
                                    if(check > 0){
                                        var packet = create_packet('name_check', 'ok', true, client);
                                        send(client,packet);
                                    }else {
                                        var packet = create_packet('name_check', 'name', true, client);
                                        send(client, packet);
                                    }
                                }
                            ]);
                        }
                        break;
                    case 'name_check':
                        console.log(packet.data);
                        async.waterfall([
                            function(cb) {
                                main.psql.insert_client(packet.data,client.localAddress, cb);
                            },
                            function(check,cb) {
                                if(check){
                                    var packet = create_packet('name_check', 'ok', true, client);
                                    send(client,packet);
                                }else{
                                    var packet = create_packet('name_check', 'retry', true, client);
                                    send(client,packet);
                                }
                            }
                        ]);
                        break;
                }
            }else{

            }
        });
        client.on('end', function () {
            console.log('Client disconnected');
            main.obj['user'].delete(client);
            main.obj['proxy'].delete(client);
            server.getConnections(function (err, count) {
                console.log('Remaining Connections: ' + count);
            });
        });
        client.on('error', function (err) {
            console.log('Socket Error: ', JSON.stringify(err));
            main.obj['user'].delete(client);
            main.obj['proxy'].delete(client);
        });
        client.on('timeout', function () {
            console.log('Socket Timed out');
            main.obj['user'].delete(client);
            main.obj['proxy'].delete(client);
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
            packet = main.obj.proxy.get(client).key.encrypt(packet,'base64');

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
}