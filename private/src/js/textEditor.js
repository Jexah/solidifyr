app.controller('TextEditorController', function ($scope) {

	var socket = io.connect('http://110.175.72.12:3000');

	var Types;
	var totalWatching = 0;
	$scope.database = [];

	var watching = true;

	function updateWatchers(){
		while($scope.database.length > totalWatching){
			console.log(totalWatching);
			addWatcher(totalWatching++);
		}
	}

	$scope.$watch('database.length', function(){
		updateWatchers();
		socket.emit('api', {
			'action':'get',
			'location':'database'
		});
	});

	$scope.create = function(type, parentId){
		socket.emit('api', {
			'action':'post',
			'value':{
				'type': type,
				'parent': parentId
			}
		});
		console.log('parentId:' + parentId);
	};

	$scope.delete = function(id){
		socket.emit('api', {
			'action':'delete',
			'value':{
				'id': id
			}
		});
	};

	function addWatcher(id){
		$scope.$watch('database[' + id + ']', function() {
			if(watching){
				socket.emit('api', {
					'action':'put',
					'value':$scope.database[id]
				});
				console.log($scope.database[id]);
			}
	 	}, true);
	}

	socket.on('api', function(data){
		switch(data.location){
			case 'types':
				switch(data.action){
					case 'put':
						Types = data.value;
						break;
				}
				break;
			case 'database':
				switch(data.action){
					case 'put':
						$scope.database = data.value;
						$scope.$apply();
						break;
				}
				break;
			default:
				switch(data.action){
					case 'put':
						watching = false;
						$scope.database[data.value.id] = data.value;
						$scope.$apply();
						watching = true;
						break;
					case 'post':
						$scope.database.push(data.value);
						$scope.$apply();
						break;
					case 'delete':
						unlinkObj(data.value.id);
						$scope.$apply();
						console.log(data.value.id);
						console.log($scope.database[data.value.id]);
						break;
				}
		}
	});

	
function unlinkObj(id){
	var obj = $scope.database[id];
	var parent =$scope.database[obj.parent];
	parent.children[obj.type].remove(id);
}


Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

});