/**
 * Created by Minhyeong on 2016-01-24.
 */
var socket = io.connect("http://192.168.100.135:3000/", {
    "connect timeout": 2000,
    "reconnect": true,
    "reconnection delay": 1000,
    "reopen delay": 1000,
    "max reconnection attempts": 5
});