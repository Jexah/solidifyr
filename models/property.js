var mongoose = require('mongoose');

var Property = mongoose.model('Property', {
	parent: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	},
	parentType: {
		type: String,
		required: true
	},
	type: {
		type: String,
		default: 'property'
	},
	name: {
		type: String,
		default: ''
	},
	text: {
		type: String,
		default: ''
	}
});

module.exports = Property;