/**
 * Created by Minhyeong on 2016-01-04.
 */

module.exports = function(io, main) {
    this.temp = 1;
    console.log("[load]socket-route on");

    io.sockets.on('connection', function(socket) {
        socket.on('link_request', function (data) {
            data = JSON.parse(data);
            var ip = String(socket.handshake.address).replace(/:/gi,"");
            ip = ip.replace(/f/gi,"");
            data.user_ip = ip;

            if(!main.obj.proxy.add(data,socket)){
                socket.emit("link_request_result","fail");
            }
            console.log(main.obj.proxy.session);
        });

        socket.on('disconnect', function (data) {

        });
    });

    return this;
}