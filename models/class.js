var mongoose = require('mongoose');

var Class = mongoose.model('Class', {
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
		default: 'class'
	},
	name: {
		type: String,
		default: ''
	},
	children: {
		type: mongoose.Schema.Types.Mixed,
		default: {
			'property': [mongoose.Types.ObjectId],
			'method': [mongoose.Types.ObjectId]
		}
	}
});



module.exports = Class;