var GitHubStrategy = require('passport-github').Strategy;
var bodyParser = require('body-parser');
var passport = require('passport');
var express = require('express');
var morgan = require('morgan');
var Mabolo = require('mabolo');
var cors = require('cors');

var config = require('./config');
var app = express();
var mabolo = new Mabolo(config.mongodb);
var ObjectID = mabolo.ObjectID;

var User = mabolo.model('User', {
  provider: {
    type: String,
    required: true
  },
  id: {
    type: Number,
    required: true
  },
  profile: {
    type: Object,
    required: true
  }
});

var Comment = mabolo.model('Comment', {
  domain: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    required: true
  },
  parent_id: {
    type: ObjectID,
    required: true
  },
  author_id: {
    type: ObjectID,
    required: true
  },
  body: {
    type: String,
    required: true
  }
});

setupPassport();

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback', passport.authenticate('github'), function(req, res) {
  res.json({
    message: 'auth success',
    user: req.user
  });
});

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));

app.listen(config.port, function() {
  console.log('Cocona started at', config.port);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    next();
  else
    res.redirect('/auth/github');
}

function setupPassport() {
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

  passport.use(new GitHubStrategy({
    clientID: config.GITHUB_CLIENT_ID,
    clientSecret: config.GITHUB_CLIENT_SECRET,
    callbackURL: config.GITHUB_CALLBACK_URL
  }, function(accessToken, refreshToken, profile, done) {
    User.findOne({
      provider: profile.provider,
      id: profile.id
    }, function(err, user) {
      if (user) {
        user.update({
          $set: {
            profile: profile._json
          }
        }, done)
      } else {
        User.create({
          provider: profile.provider,
          id: profile.id,
          profile: profile._json
        }, done);
      }
    });
  }));
}
