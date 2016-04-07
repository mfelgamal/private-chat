var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var async = require('async');
var bodyParser = require('body-parser')
var models = require('./create-models');
var siofu = require("socketio-file-upload");


var User = models.user;
var Chat = models.chat
var Friendship = models.friendship



app.use(bodyParser.json())

app.use('/assets', express.static(__dirname + '/app/assets'));
app.use('/app', express.static(__dirname + '/app'));
app.use('/app/bower_components', express.static(__dirname + '/bower_components'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});


// Check login of user
app.post('/api/authenticate', function(req, res) {

  User.findOne({ username: req.body.username }, function(err, user) {
    if (err) res.json({ success: false, message: 'Username or password are incorrect' });
    // test a matching password
    user.comparePassword(req.body.password, function(err, isMatch) {
      if (err) res.json({ success: false, message: 'Username or password are incorrect' });
      if (isMatch)
        res.json({ success: true, _id: user._id })
    });

  });

});

// Creating User
app.post('/api/users', function(req, res) {
  var user = new User({ username: req.body.username, password: req.body.password })
  user.save(function(err, users) {
    if (err) res.json({ success: false, message: 'Creation Error' })
    res.json({ success: true })
  });

});


// Return all users
app.get('/api/users', function(req, res) {
  User.find({}, function(err, rs) {
    res.json(rs)
  })

});

// Return all friends
app.get('/api/friends/:id', function(req, res) {

  Friendship.find({ $or: [{ first_user: req.params.id }, { second_user: req.params.id }] }, function(err, relations) {
    var ids = []

    for (var i in relations) {
      if (relations[i].first_user != req.params.id) ids.push(relations[i].first_user)
      if (relations[i].second_user != req.params.id) ids.push(relations[i].second_user)
    }

    async.map(ids, function(id, callback) {
      User.findById(id, function(err, rs) {
        callback(null, rs);
      })
    }, function(err, results) {
      res.json(results)

    });

  })

});

// Return user by username
app.get('/api/users/:username', function(req, res) {
  User.findOne({ username: req.params.username }, function(err, rs) {
    if (!rs) res.json({ success: false, message: "No user with this username" })
    else res.json({ success: true, user: rs })
  })

});

// Return user by id
app.get('/api/users/:id', function(req, res) {
  User.findById(req.params.id, function(err, rs) {
    res.json(rs)
  })

});

// Add relation between two users
app.post('/api/users/add_friend', function(req, res) {
  var from_id = req.body.from
  var to_id = req.body.to

  if (from_id == to_id) res.json({ success: false, message: "Error" })

  Friendship.findOne({ first_user: from_id, second_user: to_id }, function(err, rs) {
    if (!rs) {
      Friendship.findOne({ first_user: to_id, second_user: from_id }, function(err, rs2) {
        if (!rs2) {
          var friends_relation = new Friendship({ first_user: from_id, second_user: to_id })
          friends_relation.save(function(err) {
            if (!err) res.json({ success: true })
          })
        } else res.json({ success: false, message: "Already friends" })
      })
    } else res.json({ success: false, message: "Already friends" })

  });
});


var privatechat = []
var onlineUsers = {}
var sockets = {}

io.on('connection', function(socket) {


  var uploader = new siofu();
  uploader.dir = __dirname + '/app/files'; // directory for stroring files
  uploader.listen(socket);

  // Do something when a file is saved:
  uploader.on("saved", function(event) {
    var msg = event.file.meta.msg;
    var path = event.file.pathName
    // stotr path in content
    msg.content = '/app/files/' + path.substring(path.lastIndexOf("/") + 1, path.length);
    msg.kind = 'file'
    var room = msg.room
    var pChat = null
    for (var i in privatechat) {
      if (room == privatechat[i].room) {
        privatechat[i].messages.push(msg)
        pChat = privatechat[i]
        break;

      }
    }

    var chat = new Chat(msg)
    chat.save(function(err, msgr) {
      if (sockets[pChat.from.username])
        sockets[pChat.from.username].emit('chat message', msgr)
      if (sockets[pChat.to.username])
        sockets[pChat.to.username].emit('chat message', msgr)
    })
  });

  // Error handler:
  uploader.on("error", function(event) {
    console.log("Error from uploader", event);
  });

  // when the client emits 'login', this listens and executes
  socket.on('login', function(user) {

    var username = user.username
    if (sockets[username]) return

    sockets[username] = socket
    onlineUsers[username] = user
      // we store the username in the socket session for this client
    socket.username = username;
      // echo globally (all clients) that a person has connected
    io.emit('online users', onlineUsers);
  });


  // when user connects with another user to first time.
  socket.on('new private', function(data) {
    var from = data.from
    var to = data.to
    var pChat = null
    var isReleationExisting = false

    for (var i in privatechat) {
      if ((privatechat[i].to._id == from._id && privatechat[i].from._id == to._id) ||
        (privatechat[i].to._id == to._id && privatechat[i].from._id == from._id)) {
        isReleationExisting = true
        pChat = privatechat[i]
        break;
      }

    }

    if (isReleationExisting == false) {
      var roomCode = to._id + from._id
      Chat.find({ $or: [{ to: to._id, from: from._id }, { to: from._id, from: to._id }] }, function(err, res) {
        pChat = { from: from, to: to, messages: res, room: roomCode }
        privatechat.push(pChat)
        sockets[from.username].emit('sender private messages', pChat)
        if (sockets[to.username])
          sockets[to.username].emit('reciever private messages', pChat)
      });
    } else {
      sockets[from.username].emit('sender private messages', pChat)
      if (sockets[to.username])
        sockets[to.username].emit('reciever private messages', pChat)
    }


  })


  socket.on('chat message', function(msg) {

    msg.kind = 'text'
    var room = msg.room
    var pChat = null
    for (var i in privatechat) {
      if (room == privatechat[i].room) {
        privatechat[i].messages.push(msg)
        pChat = privatechat[i]
        break;

      }
    }
    var chat = new Chat(msg)
    chat.save(function(err, msgr) {
      if (sockets[pChat.from.username])
        sockets[pChat.from.username].emit('chat message', msgr)
      if (sockets[pChat.to.username])
        sockets[pChat.to.username].emit('chat message', msgr)
    })
  });

  socket.on('logout', function(data) {
    if (!sockets[socket.username]) return
    delete sockets[socket.username]
    delete onlineUsers[socket.username]
    io.emit('online users', onlineUsers)
  })

  socket.on('disconnect', function(data) {
    if (!sockets[socket.username]) return
    delete sockets[socket.username]
    delete onlineUsers[socket.username]
    io.emit('online users', onlineUsers)
  })
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
