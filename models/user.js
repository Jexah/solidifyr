var mongoose = require('mongoose');

var User = mongoose.model('User', {
	username: {
		type: String,
		required: true
	},
	displayName: {
		type: String,
		required: true
	},
	projects: {
		type: [mongoose.Types.ObjectId],
		default: []
	},
	currentlyEditing: {
		type: [mongoose.Schema.Types.ObjectId],
		default: []
	}
});

module.exports = User;