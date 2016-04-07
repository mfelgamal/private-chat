/* global io */
'use strict';

angular.module('app')
  .factory('mySocket', function(socketFactory) {
    var socket = io.connect();

    var wrappedSocket = socketFactory({
      ioSocket: socket
    });

    wrappedSocket.reconnect = function() {
      if(socket.connected) {
        socket.disconnect();
        socket.connect();
      } else {
        socket.connect();
      }
    };

    wrappedSocket.disconnect = function() {
      socket.disconnect();
    };

    wrappedSocket.connect = function() {
      socket.connect();
    };

    return wrappedSocket;
  });
