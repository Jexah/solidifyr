var Property = function(databaseCount, parentId){
	var _this = this;

	this.id = databaseCount;
	this.parent = parentId;
	this.name = 'Property Name';
	this.text = 'Property Text';
	this.type = 'property';
	
}

module.exports = Property;