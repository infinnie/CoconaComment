var GitHubStrategy = require('passport-github').Strategy;
var bodyParser = require('body-parser');
var passport = require('passport');
var express = require('express');
var morgan = require('morgan');
var Mabolo = require('mabolo');
var cors = require('cors');

var config = require('./config');
var app = express();

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
    },
    function(accessToken, refreshToken, profile, done) {
      done(null, profile);
    }
  ));
}
