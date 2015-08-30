var Method = function(databaseCount, parentId){
	var _this = this;

	this.id = databaseCount;
	this.parent = parentId;
	this.name = 'Method name';
	this.text = 'Method Text';
	this.type = 'method';
}

module.exports = Method;