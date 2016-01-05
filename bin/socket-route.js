/**
 * Created by Minhyeong on 2016-01-04.
 */

module.exports = function(io, main, pid) {
    this.temp = 1;
    console.log("["+pid+"]socket-route on");

    io.sockets.on('connection', function(socket) {
        console.log("["+pid+"] connect" + pid);


        socket.on('disconnect', function (data) {
            console.log("["+pid+"] disconnect" + pid);
        });
    });

    return this;
}