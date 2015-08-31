var mongoose = require('mongoose');

var Method = mongoose.model('Method', {
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
		default: 'method'
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

module.exports = Method;