app.controller('TextEditorController', function ($scope) {

	var socket = io.connect('http://110.175.72.12:3000');

	var Types;
	var totalWatching = 0;
	$scope.database = [];

	var watching = true;

	function updateWatchers(){
		while($scope.database.length > totalWatching){
			addWatcher(totalWatching++);
		}
	}

	$scope.aceLoaded = function(editor) {
		editor.setOptions({
			maxLines: Infinity,
			showPrintMargin: false
		});
		editor.renderer.setScrollMargin(20, 20, 20, 20);
		editor.renderer.setPadding(20);
		editor.container.style.lineHeight = '20px';
	};

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
				console.log($scope.database[id].text);
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