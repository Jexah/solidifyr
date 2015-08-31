var mongoose = require('mongoose');

var Project = mongoose.model('Project', {
	name: {
		type: String,
		required: true
	},
	type: {
		type: String,
		default: 'project'
	},
	children: {
		type: mongoose.Schema.Types.Mixed,
		default: {
			'class': [mongoose.Types.ObjectId]
		}
	}
});

module.exports = Project;