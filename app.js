var GitHubStrategy = require('passport-github').Strategy;
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var express = require('express');
var morgan = require('morgan');
var Mabolo = require('mabolo');
var cors = require('cors');
var _ = require('underscore');

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

User.prototype.wipe = function() {
  return {
    _id: this._id,
    id: this.id,
    provider: this.provider,
    profile: _.pick(this.profile, 'login', 'name', 'avatar_url', 'blog', 'location', 'followers')
  }
};

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
    type: ObjectID
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
app.use(session({
  secret: config.secret,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

/*
  GET /comments?domain=jysperm.me&topic=unit-of-abstract

  [{
    "_id": "548c10bf5727a30e1890b4d0",
    "domain": "jysperm.me",
    "topic": "unit-of-abstract",
    "created_at": "2015-03-14T15:38:06.224Z",
    "parent_id": null,
    "body": "正因为 Python 在提供复杂抽象手段的同时，又提出了一些限制，才能被广泛地使用。"
    "author": {
      "_id": "548c10bf5727a30e1890b4d0",
      "id": 1191561,
      "provider": "github",
      "profile": {
        "login": "jysperm",
        "name": "王子亭",
        "avatar_url": "https://avatars.githubusercontent.com/u/1191561?v=3",
        "blog": "https://jysperm.me",
        "location": "Suzhou, Jiangsu, China",
        "followers": 275
      }
    }
  }, {
    // ...
  }]
*/
app.get('/comments', function(req, res) {
  // TODO
});

/*
  POST /comments HTTP/1.1
  Content-Type: application/json
  Cookie: required

  {
    "domain": "jysperm.me",
    "topic": "unit-of-abstract",
    "parent_id": "548c10bf5727a30e1890b4d0", // optional
    "body": "很多人是没有系统地学习过「抽象」这项技能的，对于他们而言，编程语言必须直接提供强有力的抽象手段。"
  }

  HTTP/1.1 200 OK
  Content-Type: application/json

  {
    "_id": "548c10bf5727a30e1890b4d0",
    "domain": "jysperm.me",
    "topic": "unit-of-abstract",
    "created_at": "2015-03-14T15:38:06.224Z",
    "parent_id": "548c10bf5727a30e1890b4d0",
    "body": "很多人是没有系统地学习过「抽象」这项技能的，对于他们而言，编程语言必须直接提供强有力的抽象手段。",
    "author": // ...
  }
*/
app.post('/comments', ensureAuthenticated, function(req, res) {
  Comment.create(_.extend(req.body, {
    created_at: new Date(),
    author_id: new ObjectID(req.user._id)
  }), function(err, comment) {
    if (err) {
      res.status(400).json({
        error: err.toString()
      });
    } else {
      res.json(_.extend(comment, {
        author: req.user.wipe()
      }));
    }
  });
});

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
    done(null, user._id);
  });

  passport.deserializeUser(function(user_id, done) {
    User.findById(user_id, done);
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
        }, function(err) {
          done(err, _.extend(user, {
            profile: profile._json
          }));
        });
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
