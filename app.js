var PORT = 3000;

var express = require('express');
var app = express();
var io = require('socket.io').listen(app.listen(PORT));
var mongoose = require('mongoose');
var models = require('./models/editor_models');

var code = require('./code');

mongoose.connect('mongodb://127.0.0.1/solidifyr');

var toDelete = {};

function New(typeAsString, obj, callback){
	var newInstance = new models[typeAsString](obj);
	newInstance.save(function (err) {
		if(err) return console.error(err);
		if(newInstance.parent === undefined){
			callback(newInstance);
		}else{
			getById(newInstance.parentType, newInstance.parent, function(parentObj) {
					if(err) return console.error(err);
					parentObj.children[typeAsString].push(newInstance._id);
					parentObj.markModified('children');
					parentObj.save(function(err){
						if(err) return console.error(err);
						callback(newInstance);
					});
				}
			);
		}
	});
}

function unlinkObj(id, type, callback){
	// Unlink but do not delete
	getById(type, id, function(doc){
		getById(doc.parentType, doc.parent, function(parent){
			parent.children[type].removeId(id);
			parent.markModified('children');
			parent.save(function(err){
				if(err) return console.error(err);
				doc.deleted = true;
				doc.toDelete = false;
				doc.save(function(err){
					if(err) return console.error(err);
					callback(doc);
				})
			});
		});
	});
}

Array.prototype.remove = function(obj) {
	for(var i = 0; i < this.length; i++){
		if(this[i] === obj){
			this.splice(i, 1);
		}
	}
	return this;
};

Array.prototype.removeId = function(obj) {
	for(var i = 0; i < this.length; i++){
		if(this[i].toString() === obj.toString()){
			this.splice(i, 1);
		}
	}
	return this;
};

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

// Create placeholder data
 /*
	New('project', {
		name: 'MyGame'
	}, function(rootProject){
		New('class', {
			parent: rootProject._id,
			parentType: rootProject.type,
			name: 'Player'
		}, function(newClass){
			New('property', {
				parent: newClass._id,
				name: 'X Position',
				parentType: newClass.type,
				text: 'private int x = 0;'
			}, function(newProperty){
				New('property', {
					parent: newClass._id,
					name: 'Y Position',
					parentType: newClass.type,
					text: 'private int y = 0;'
				}, function(newProperty1){
					New('property', {
						parent: newClass._id,
						name: 'Speed',
					parentType: newClass.type,
						text: 'private int speed = 5;'
					}, function(newProperty2){
						New('property', {
							parent: newClass._id,
							parentType: newClass.type,
							name: 'Direction Enum',
							text: 	'private enum Direction = \n'+
									'{\n'+
									'	RIGHT,\n'+
									'	UP,\n'+
									'	LEFT,\n'+
									'	DOWN\n'+
									'}'
						}, function(newProperty3){
							New('method', {
								parent: newClass._id,
								parentType: newClass.type,
								name: 'Move',
								text: 	'public void move(Direction dir)\n'+
										'	switch(dir)\n'+
										'	{\n'+
										'		case RIGHT:\n'+
										'			this.x += this.speed;\n'+
										'			break;\n'+
										'		case UP:\n'+
										'			this.y += this.speed;\n'+
										'			break;\n'+
										'		case LEFT:\n'+
										'			this.x -= this.speed;\n'+
										'			break;\n'+
										'		case DOWN:\n'+
										'			this.y -= this.speed;\n'+
										'			break;\n'+
										'		default:\n'+
										'			break;\n'+
										'	}\n'+
										'}'
							}, function(newMethod){
								mongoose.model("Project").findOne(function(err, parentObj) {
										if(err) return console.error(err);
									}
								);
							});
						});
					});
				});
			});
		});
	});
	// }
// End place holder data */

function getModel(str){
	return mongoose.model(str.capitalizeFirstLetter());
}

function getById(type, id, callback){
	getModel(type).findById(id, function(err, doc){
		if(err) return console.error(err);
		callback(doc);
	});
}

function sendDatabase(socket){
	for(var i in models){
		if(!models.hasOwnProperty(i)) return;
		getModel(i).find().lean().exec(function(err, doc) {
			socket.emit('api', {
				'action':'put',
				'location':'database',
				'value':doc
			});
		});
	};
}

io.sockets.on('connection', function (socket) {

	sendDatabase(socket);
	
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
						getById(value.type, value._id, function(doc){
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
							getById(data.value.parentType, data.value.parent, function(doc){
								var newObj = data.value;
								newObj.parentType = doc.type;
								New(data.value.type, newObj, function(newInstance){
									io.emit('api', {
										'action':'post',
										'value':newInstance
									});
								});
							});
						}else{
							New(data.value.type, data.value, function(newInstance){
								io.emit('api', {
									'action':'post',
									'value':newInstance
								});
							});
						}
						break;
						
					case 'delete':
						unlinkObj(data.value.id, data.value.type, function(doc){
							io.emit('api', {
								'action':'delete',
								'value':doc
							});
						});
						break;
						
					case 'requestDelete':
						var _id = data.value.id;
						var _type = data.value.type;
						getById(data.value.type, data.value.id, function(doc){
							doc.toDelete = true;
							doc.save(function(err){
								if(err) return console.error(err);
								toDelete[data.value.id] = setTimeout(function(){
									unlinkObj(_id, _type, function(doc){
										io.emit('api', {
											'action':'delete',
											'value':doc
										});
										delete toDelete[doc._id];
									});
								}, 15000);
								io.emit('api', {
									'action':'put',
									'value':doc
								});
							});
						});
						break;
						
					case 'undoDelete':
						clearTimeout(toDelete[data.value.id]);
						getById(data.value.type, data.value.id, function(doc){
							doc.toDelete = false;
							doc.save(function(err){
								if(err) return console.error(err);
								io.emit('api', {
									'action':'put',
									'value':doc
								});
							});
						});
						break;
						
				}
				break;
		}
	});
		
});

app.set('view engine', 'jade');

app.use(express.static('public'));

// respond with "Hello World!" on the homepage
app.get('/', function (req, res) {
  res.render(__dirname + '/private/views/index', { title: 'Hey', message: 'Hello there!'});
  //res.sendFile('C:\\Users\\Jexah\\Documents\\editor_project\\public\\views\\index.html');
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



