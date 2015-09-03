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
