var socket = io.connect("http://192.168.100.252:3001/", {
               "connect timeout": 2000,
               "reconnect": true,
               "reconnection delay": 1000,
               "reopen delay": 1000,
               "max reconnection attempts": 5
           });
