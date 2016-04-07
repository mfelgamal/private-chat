(function() {
  'use strict';

  angular
    .module('app')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['$location', 'UserService', '$rootScope', '$scope', 'mySocket'];

  function HomeController($location, UserService, $rootScope, $scope, mySocket) {

    $scope.showChat = false
    $scope.user = null;
    $scope.msg = ""
    $scope.allUsers = [];
    $scope.friends = [];
    $scope.onlineUsers = [];
    $scope.messages = []
    $scope.currentPrivateChat = null
    initController();

    $scope.chatWith = null
    $scope.errorMessage = ''

    var allPrivateChats = []

    var socket = io.connect();
    var uploader = new SocketIOFileUpload(socket);



    function initController() {
      loadCurrentUser();
      loadAllUsers();
      loadAllFriends($rootScope.globals.currentUser.id)

    }

    function loadCurrentUser() {
      UserService.GetByUsername($rootScope.globals.currentUser.username)
        .then(function(data) {
          $scope.user = data.user;
          mySocket.emit('login', $scope.user);

        });
    }

    function loadAllUsers() {
      UserService.GetAll()
        .then(function(users) {
          $scope.allUsers = users;
        });
    }

    function loadAllFriends(id) {
      UserService.GetAllFriends(id)
        .then(function(users) {
          $scope.friends = users;
        });
    }

    $scope.sendMassege = function() {
      mySocket.emit('chat message', { content: $scope.msg, from: $scope.user._id, sender_username: $scope.user.username, to: $scope.chatWith._id, room: $scope.room, created: new Date() })
      $scope.msg = ''
    }

    $scope.makePrivateChat = function(user) {
      $scope.chatWith = user
      if (!user) {
        $scope.showChat = false
        return
      }
      var isReleationExisting = false
      var from = $scope.user
      var to = user

      for (var i in allPrivateChats) {
        if ((allPrivateChats[i].to._id == from._id && allPrivateChats[i].from._id == to._id) ||
          (allPrivateChats[i].to._id == to._id && allPrivateChats[i].from._id == from._id)) {
          isReleationExisting = true
          break;
        }

      }

      if (isReleationExisting == false)
        mySocket.emit('new private', { from: from, to: to })
      else {
        $scope.room = allPrivateChats[i].room
        $scope.messages = allPrivateChats[i].messages
        $scope.currentPrivateChat = allPrivateChats[i]
        $scope.showChat = true
      }

    }

    $scope.addFriend = function(username) {
      if (!username) return
      UserService.GetByUsername(username)
        .then(function(data) {
          if (!data.success) $scope.errorMessage = data.message
          else {

            UserService.AddFriend($scope.user._id, data.user._id)
              .then(function(relation) {
                if (!relation.success)
                  $scope.errorMessage = relation.message
                else {
                  $scope.errorMessage = ''
                  $scope.friends.push(data.user);
                }
              });
          }
        })
    }

    $scope.logout = function() {
      mySocket.emit('logout', $rootScope.globals.currentUser.username);
      $location.path('#/login');
    }


    uploader.listenOnInput(document.getElementById("siofu_input"));
    uploader.addEventListener("start", function(event) {
      event.file.meta.msg = { from: $scope.user._id, sender_username: $scope.user.username, to: $scope.chatWith._id, room: $scope.room, created: new Date() };
    });
    // Do something on upload progress:
    uploader.addEventListener("progress", function(event) {
      var percent = event.bytesLoaded / event.file.size * 100;
      // console.log("File is", percent.toFixed(2), "percent loaded");
    });

    // Do something when a file is uploaded:
    uploader.addEventListener("complete", function(event) {
      // console.log(event.success);
      // console.log(event.file);
    });


    mySocket.on('sender private messages', function(data) {
      $scope.room = data.room
      $scope.messages = data.messages
      $scope.currentPrivateChat = data
      allPrivateChats.push(data)
      $scope.showChat = true

    })
    mySocket.on('reciever private messages', function(data) {
      allPrivateChats.push(data)
    })



    mySocket.on('chat message', function(msg) {
      var chat = null

      for (var i in allPrivateChats) {
        if (allPrivateChats[i].room == msg.room) {
          allPrivateChats[i].messages.push(msg)
          chat = allPrivateChats[i]
          break
        }
      }

    })

    mySocket.on('online users', function(users) {
      $scope.onlineUsers = []
      Object.keys(users).forEach(function(key) {
        var value = users[key]
        for (var i in $scope.friends) {
          if (value.username == $scope.friends[i].username && value.username != $rootScope.globals.currentUser.username)
            $scope.friends[i].status = true
        }
      })
    })



  }

})();
