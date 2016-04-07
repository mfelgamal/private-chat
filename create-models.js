var mongoose = require('mongoose');
Schema = mongoose.Schema,
  bcrypt = require('bcrypt'),
  SALT_WORK_FACTOR = 10;

mongoose.connect("mongodb://localhost:27017/vodafone-chat");

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
});

var UserSchema = new Schema({
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true }
});

// create a model from the user schema

UserSchema.pre('save', function(next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);

      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });


});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};



// create a schema for chat
var ChatSchema = new Schema({
  created: Date,
  content: String,
  from: String,
  sender_username: String,
  to: String,
  room: String,
  kind: String
});


var FriendshipSchema = new Schema({
  first_user: String,
  second_user: String

});

var User = mongoose.model('User', UserSchema);

// create a model from the chat schema
var Chat = mongoose.model('Chat', ChatSchema);


// create a model from the user schema
var Friendship = mongoose.model('Friendship', FriendshipSchema);

// var user1 = new User({ username: "ahmed", password: "123456789" });
// user1.save(function (err) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log('success');
//   }
// });
// var user2 = new User({ username: "mahmoud22",  password: "123456789" });
// user2.save(function (err) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log('success');
//   }
// });
// var user2 = new User({ username: "karem", password: "123456789" });
// user2.save(function (err) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log('success');
//   }
// });

module.exports = {
  chat: Chat,
  user: User,
  friendship: Friendship

}
