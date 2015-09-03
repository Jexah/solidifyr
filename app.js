var PORT = 3000;

require('./utility')

var express = require('express');
var app = express();
var io = require('socket.io').listen(app.listen(PORT));
var mongoose = require('mongoose');
var Promise = require('bluebird');
var fs = require('fs');
Promise.promisifyAll(mongoose);
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var methodOverride = require('method-override');
var passportSocketIo = require('passport.socketio');
var models = require('./models/editor_models');
var User = require('./models/user');

var GITHUB_CLIENT_ID = fs.readFileSync(__dirname + '/security/github_client_id.txt', 'utf8');
var GITHUB_CLIENT_SECRET = fs.readFileSync(__dirname + '/security/github_client_secret.txt', 'utf8');
var SESSION_SECRET = fs.readFileSync(__dirname + '/security/session_secret.txt', 'utf8');

passport.serializeUser(function(user, done){
	User.findAsync({username: user.username})
	.then(function(doc){
		done(null, doc);
	});
});

passport.deserializeUser(function(obj, done){
	User.findByIdAsync(obj._id)
	.then(function(doc){
		done(null, doc);
	});
});

passport.use(new GitHubStrategy({
	clientID: GITHUB_CLIENT_ID,
	clientSecret: GITHUB_CLIENT_SECRET,
	callbackURL: "http://127.0.0.1:3000/auth/github/callback"
},
	function(accessToken, refreshToken, profile, done) {
		// asynchronous verification, for effect...
		process.nextTick(function(){
			//Users.find();
			// To keep the example simple, the user's GitHub profile is returned to
			// represent the logged-in user.  In a typical application, you would want
			// to associate the GitHub account with a user record in your database,
			// and return that user instead.
			return done(null, profile);
		});
	}
));

var code = require('./code');

mongoose.connect('mongodb://127.0.0.1/solidifyr');
var sessionStore = new MongoStore({ mongooseConnection: mongoose.connection });

var toDelete = {};

var New = Promise.coroutine(function* (typeAsString, obj){
	var newInstance = new models[typeAsString](obj);

	yield newInstance.saveAsync()
	.then(function(err){
		if(newInstance.parent !== undefined){
			return getById(newInstance.parentType, newInstance.parent);
		}
	})
	.then(function(parentObj){
		parentObj.children[typeAsString].push(newInstance._id);
		parentObj.markModified('children');
		return parentObj.saveAsync();
	})
	.catch(function(err){
		console.error(err);
	});
	return newInstance;
});

var unlinkObj = Promise.coroutine(function* (type, id) {

	// Unlink but do not delete
	var targetDoc;

	return yield getById(type, id)
	.then(function(doc){
		targetDoc = doc;
		return getById(targetDoc.parentType, targetDoc.parent);
	})
	.then(function(parent){
		parent.children[type].removeId(id);
		parent.markModified('children');
		return parent.save()
	})
	.then(function(){
		targetDoc.deleted = true;
		targetDoc.toDelete = false;
		return targetDoc.saveAsync();
	})
	.catch(function(err){
		console.error(err);
	});
});

function getModel(str){
	return mongoose.model(str.capitalizeFirstLetter());
}

var getById = Promise.coroutine(function* (type, id) {
	return getModel(type).findByIdAsync(id);
});

function sendDatabase(socket){
	for(var i in models){
		if(!models.hasOwnProperty(i)) return;
		getModel(i).find().lean().execAsync()
		.then(function(doc) {
			socket.emit('api', {
				'action':'put',
				'location':'database',
				'value':doc
			});
		})
		.catch(function(err){
			console.error(err);
		});
	};
}

io.sockets.on('connection', function (socket) {

	sendDatabase(socket);

	if(socket.request.user){
		socket.emit('api', {
			action: 'userId',
			value: socket.request.user._id
		});
	}

	socket.on('api', function (data) {
		switch(data.location){
			case 'database':
				switch(data.action){
					case 'get':
						sendDatabase(socket);
						break;
				}
				break;
			default:
				switch(data.action){
					case 'get':
						socket.emit('api', {
							'action':'post',
							'value':database[data.value.id]
						});
						break;
					case 'put':
						var value = data.value;
						getById(value.type, value._id)
						.then(function(doc){
							for(var p in value){
								if(!value.hasOwnProperty(p)) continue;
								if(p !== 'name' && p !== 'text') continue;
								doc[p] = value[p];
								doc.markModified(p);
							}
							doc.save(function(err){
								if(err) return console.error(err);
								socket.broadcast.emit('api', {
									'action':'put',
									'value':doc
								});
							});
						});
						break;
						
					case 'post':
						if(data.value.parent){
							getById(data.value.parentType, data.value.parent)
							.then(function(parentInstance){
								var newObj = data.value;
								newObj.parentType = parentInstance.type;
								return New(data.value.type, newObj)
							})
							.then(function(newInstance){
								io.emit('api', {
									'action':'post',
									'value':newInstance
								});
							});
						}else{
							New(data.value.type, data.value)
							.then(function(newInstance){
								io.emit('api', {
									'action':'post',
									'value':newInstance
								});
							});
						}
						break;
						
					case 'delete':
						unlinkObj(data.value.type, data.value.id)
						.then(function(doc){
							io.emit('api', {
								'action':'delete',
								'value':doc
							});
						});
						break;
						
					case 'requestDelete':
						var id = data.value.id;
						var type = data.value.type;

						var elementToDelete;

						getById(type, id)
						.then(function(doc){
							elementToDelete = doc;
							doc.toDelete = true;
							return doc.saveAsync();
						})
						.then(function(){
							toDelete[id] = setTimeout(function(){
								unlinkObj(type, id)
								.then(function(doc){
									io.emit('api', {
										'action':'delete',
										'value':doc[0]
									});
									delete toDelete[doc[0].id];
								});
							}, 1500);
							io.emit('api', {
								'action':'put',
								'value':elementToDelete
							});
						})
						.catch(function(err){
							console.error(err);
						});
						break;
						
					case 'undoDelete':
						clearTimeout(toDelete[data.value.id]);
						getById(data.value.type, data.value.id)
						.then(function(doc){
							doc.toDelete = false;
							return doc.save();
						})
						.then(function(){
							io.emit('api', {
								'action':'put',
								'value':doc
							});
						})
						.catch(function(err){
							console.error(err);
						});
						break;
						
				}
				break;
		}
	});
		
});


//app.use(express.logger());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({
    secret: SESSION_SECRET,
    name: 'solidifyr',
    resave: true,
    store: sessionStore,
    saveUninitialized: true
}));

io.use(passportSocketIo.authorize({
	cookieParser: cookieParser,     
	key: 'solidifyr',
	secret: SESSION_SECRET,
	store: sessionStore,
	passport: passport
}));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'jade');

app.use(express.static('public'));

app.get('/account', ensureAuthenticated, function(req, res){
	res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
	res.send('');
});

app.get('/auth/github',
	passport.authenticate('github'),
	function(req, res){
		// The request will be redirected to GitHub for authentication, so this
		// function will not be called.
	}
);

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/github/callback', 
	passport.authenticate('github', { failureRedirect: '/login' }),
	function(req, res) {
		var usr;
		User.findAsync({username: req.username})
		.then(function(doc){
			if(doc.length === 0){
				var newUser = new User({
					username: req.user.username,
					displayName: req.user.displayName
				});
				return newUser.saveAsync();
			}else{
				usr = doc;
			}
		})
		.then(function(newUser){
			// Do something with new user
			usr = usr || newUser;
		});
		res.redirect('/');
	}
);

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/login')
}

// respond with "Hello World!" on the homepage
app.get('/', function (req, res) {
	res.render(__dirname + '/private/views/index', {
		user: req.user
	});
});

// accept POST request on the homepage
app.post('/', function (req, res) {
  res.send('Got a POST request');
});

// accept PUT request at /user
app.put('/user', function (req, res) {
  res.send('Got a PUT request at /user');
});

// accept DELETE request at /user
app.delete('/user', function (req, res) {
  res.send('Got a DELETE request at /user');
});

app.use('/code', code);