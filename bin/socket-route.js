/**
 * Created by Minhyeong on 2016-01-04.
 */

module.exports = function(io, main, pid) {
    this.temp = 1;
    console.log("["+pid+"]socket-route on");

    io.sockets.on('connection', function(socket) {
        console.log('Client Connected' + pid);


        socket.on('disconnect', function (data) {
            console.log('Client Disconnected' + pid);
        });
    });


    return this;
}