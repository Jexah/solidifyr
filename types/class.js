var Method = require('./method');
var Property = require('./property');

var Class = function(databaseCount, parentId){
	var _this = this;

	this.id = databaseCount;
	this.parent = parentId;
	this.type = 'class';
	this.name = 'Class Name';

	this.children = {
		'method':[],
		'property':[]
	};

	this.addChild = function(id, type){
		_this.children[type].push(id);
	};
};

module.exports = Class;