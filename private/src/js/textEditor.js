app.controller('TextEditorController', function ($scope) {

	var socket = io.connect('http://127.0.0.1:3000');

	var totalWatching = 0;
	$scope.database = {};
	$scope.projectArr = [];

	$scope.myId;

	var watching = true;

	$scope.aceLoaded = function(editor) {
		editor.setOptions({
			maxLines: Infinity,
			showPrintMargin: false
		});
		var margin = editor.container.hasAttribute('small') ? 7 : 20;
		editor.renderer.setScrollMargin(margin, margin, margin, margin);
		editor.renderer.setPadding(20);
		editor.container.style.lineHeight = '20px';
		editor.container.style.fontSize = '16px';
		editor.on('focus', function(){
			beginEditing(editor.container.getAttribute('name').split('-')[0]);
		});
	};

	function updateProjectArr(){
		$scope.projectArr = [];
		for(var id in $scope.database){
			if(!$scope.database.hasOwnProperty(id)) continue;
			if($scope.database[id].type === 'project'){
				$scope.projectArr.push(id);
			}
		}
	}

	function beginEditing(id){
		var toSend = $scope.database[id];
		$scope.database[id].currentlyEditing = myId;
		socket.emit('api', {
			action: 'put',
			value: $scope.database[id]
		});
		console.log($scope.database[id]);
	}

	$scope.create = function(type, parentId){
		socket.emit('api', {
			action: 'post',
			value: {
				type: type,
				parent: parentId,
				parentType: $scope.database[parentId].type
			}
		});
	};

	$scope.delete = function(id, type){
		socket.emit('api', {
			action: 'requestDelete',
			value: {
				id: id,
				type:type
			}
		});
	};

	$scope.undoDelete = function(id, type){
		socket.emit('api', {
			action: 'undoDelete',
			value: {
				id: id,
				type: type
			}
		});
	};

	function addWatcher(id){
		$scope.$watch('database["' + id + '"]', function() {
			if(watching){
				socket.emit('api', {
					action: 'put',
					value: $scope.database[id]
				});
			}
	 	}, true);
	}

	socket.on('api', function(data){
		switch(data.location){
			case 'database':
				switch(data.action){
					case 'put':
						watching = false;
						for(var i = 0; i < data.value.length; i++){
							$scope.database[data.value[i]._id] = data.value[i];
							addWatcher(data.value[i]._id);
						}
						updateProjectArr();
						$scope.$apply();
						watching = true;
						break;
				}
				break;
			default:
				switch(data.action){
					case 'put':
						watching = false;
						$scope.database[data.value._id] = data.value;
						updateProjectArr();
						$scope.$apply();
						watching = true;
						console.log($scope.database[data.value._id]);
						break;
					case 'post':
						var value = data.value;
						var parentId = value.parent;
						var id = value._id;
						$scope.database[id] = value;
						$scope.database[parentId].children[value.type].push(id);
						addWatcher(id);
						updateProjectArr();
						$scope.$apply();
						break;
					case 'delete':
						watching = false;
						unlinkObj(data.value);
						$scope.$apply();
						watching = true;
						break;
					case 'userId':
						myId = data.value;
						break;
				}
		}
	});

		
	function unlinkObj(obj){
		var parent = $scope.database[obj.parent];
		parent.children[obj.type].remove(obj._id);
		delete $scope.database[obj._id];
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


/*
	$(function(){ // on dom ready

		$('#project').cytoscape({
			style: cytoscape.stylesheet()
			.selector('node')
			.css({
				'content': function(ele){return ele.data('name') + '\n' + 'test';},
				'text-valign':'center',
				'text-halign':'right',
				'color':'#454545',
				'font-size':'24px',
				'text-shadow-blur':'0',
				'text-shadow-color':'white',
				'text-shadow-opacity':'1',
				'text-shadow-offset-y':'1px',
				'background-color':'#F5F5F5',
				'width':'200px',
				'height':'50px',
				'shape':'roundrectangle',
				'text-wrap':'wrap',
				'selection-box-color':'blue',
				'selection-box-border-color':'red',
				'selection-bg-size':'0',
				'selection-box-border-width':'0',
				'selection-box-opacity':'0.2',
				'active-bg-color':'blue',
				'active-bg-opacity':'0.2',
				'active-bg-size':'0'
			})
			.selector('edge')
			.css({
				'target-arrow-shape': 'triangle',
				'target-arrow-color':'black',
				'line-color':'black'
			})
			.selector(':selected')
			.css({
				'background-color': 'blue',
				'line-color': 'red',
				'target-arrow-color': 'purple',
				'source-arrow-color': 'green'
			})
			.selector('.faded')
			.css({
				'opacity': 1,
				'text-opacity': 0
			})
			.selector('.core')
			.css({
				'selection-box-color':'blue',
				'selection-box-border-color':'red',
				'selection-bg-size':'0',
				'selection-box-border-width':'0',
				'selection-box-opacity':'0.2',
				'active-bg-color':'blue',
				'active-bg-opacity':'0.2',
				'active-bg-size':'0'
			}),

			elements: {
				nodes: [
					{ data: { id: 'j', type: 'class', name: 'Jerry' } },
					{ data: { id: 'e', type: 'class', name: 'Elaine' } },
					{ data: { id: 'k', type: 'class', name: 'Kramer' } },
					{ data: { id: 'g', type: 'class', name: 'George' } }
				],
				edges: [
					{ data: { source: 'j', target: 'e' } },
					{ data: { source: 'j', target: 'k' } },
					{ data: { source: 'j', target: 'g' } },
					{ data: { source: 'e', target: 'j' } },
					{ data: { source: 'e', target: 'k' } },
					{ data: { source: 'k', target: 'j' } },
					{ data: { source: 'k', target: 'e' } },
					{ data: { source: 'k', target: 'g' } },
					{ data: { source: 'g', target: 'j' } }
				]
			},

			layout: {
				name: 'breadthfirst',
				padding: 10
			},

			// on graph initial layout done (could be async depending on layout...)
			ready: function(){
				window.cy = this;

				// giddy up...

				cy.elements().unselectify();

				/*
				cy.on('tap', 'node', function(e){
				var node = e.cyTarget; 
				var neighborhood = node.neighborhood().add(node);

				cy.elements().addClass('faded');
					neighborhood.removeClass('faded');
				});

				cy.on('tap', function(e){
					if( e.cyTarget === cy ){
						cy.elements().removeClass('faded');
					}
				});
	
			}
		});
	});
*/

});