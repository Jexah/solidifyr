var Class = require('./class');

var Project = function(databaseCount){
	var _this = this;

	this.name = 'Project Name';
	this.id = databaseCount;
	this.type = 'project';
	this.children = {
		'class':[]
	};

	this.addChild = function(id, type){
		_this.children[type].push(id);
	};
};

module.exports = Project;