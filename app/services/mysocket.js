/* global io */
'use strict';

angular.module('app')
  .factory('mySocket', function(socketFactory) {
    var socket = io.connect();

    var wrappedSocket = socketFactory({
      ioSocket: socket
    });

    return wrappedSocket;
  });
