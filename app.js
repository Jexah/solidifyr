var PORT = 3000;

var express = require('express');
var app = express();
var io = require('socket.io').listen(app.listen(PORT));
var types = require('./types/editor_types');

var code = require('./code');
var databaseCount = 0;
var database = [];
var projects = [];

function New(typeAsString, parentId){
	return new types[typeAsString](databaseCount++, parentId);
}

function unlinkObj(id){
	var obj = database[id];
	var parent = database[obj.parent];
	parent.children[obj.type].remove(id);
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

var rootProject = New('project');
database.push(rootProject);
rootProject.name = 'MyGame';

var newClass = New('class', rootProject.id);
database.push(newClass);
newClass.name = 'Player';


var newProperty = New('property', newClass.id);
database.push(newProperty);
newProperty.name = 'X Position';
newProperty.text = 'private int x = 0;';


var newProperty2 = New('property', newClass.id);
database.push(newProperty2);
newProperty2.name = 'Y Position';
newProperty2.text = 'private int y = 0;';


var newProperty3 = New('property', newClass.id);
database.push(newProperty3);
newProperty3.name = 'speed';
newProperty3.text = 'private int speed = 5;';

var newMethod = New('method', newClass.id);
database.push(newMethod);
newMethod.name = 'Move';
newMethod.text = 
'public void move(Direction dir)'			+
'{<br>' 										+
'	switch(dir)\n= 5;';



projects.push(rootProject.id);
database[0].addChild(newClass.id, 'class');
database[1].addChild(newMethod.id, 'method');
database[1].addChild(newProperty.id, 'property');
database[1].addChild(newProperty2.id, 'property');
database[1].addChild(newProperty3.id, 'property');

io.sockets.on('connection', function (socket) {
	socket.emit('api', {
		'action':'put',
		'location':'database',
		'value':database
	});
	socket.on('api', function (data) {
		switch(data.location){
			case 'types':
				switch(data.action){
					case 'get':
						socket.emit('api', {
							'action':'post',
							'location':'types',
							'value':types
						});
						break;
				}
				break;
			case 'database':
				switch(data.action){
					case 'get':
						socket.emit('api', {
							'action':'put',
							'location':'database',
							'value':database
						});
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
						for(var p in value){
							database[value.id][p] = value[p];
						}
						socket.broadcast.emit('api', {
							'action':'put',
							'value':database[data.value.id]
						});
						break;
					case 'post':
						var parentId = data.value.parent;
						var type = data.value.type;
						var newObject = New(type, parentId);
						database.push(newObject);
						database[parentId].addChild(newObject.id, type);
						io.emit('api', {
							'action':'post',
							'value':database[newObject.id]
						});
						break;
					case 'delete':
						unlinkObj(data.value.id);
						console.log(data.value.id);
						io.emit('api', {
							'action':'delete',
							'value':database[data.value.id]
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



