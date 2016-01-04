var socket = io.connect("http://127.0.0.1:3000/", {
               "connect timeout": 2000,
               "reconnect": true,
               "reconnection delay": 1000,
               "reopen delay": 1000,
               "max reconnection attempts": 5
           });
