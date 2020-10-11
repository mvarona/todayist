// ** FUNCTIONS: ** //

function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

function generateColors(limit){
	var colors = [];
	for (var i = 0; i < limit; i++) {
		var color = getRandomColor();
		if (!containsObject(color, colors)){
			colors.push(color);
		}
	}

	return colors;
}

function generateGraph(graphID, graphData){
	var donutOptions = {
	  cutoutPercentage: 85, 
	  legend: {position:'bottom', padding:5, labels: {pointStyle:'circle', usePointStyle:true}}
	};

	var graph = document.getElementById(graphID);
	if (graph) {
	  new Chart(graph, {
		  type: 'pie',
		  data: graphData,
		  options: donutOptions
	  });
	}	
}

function generateData(){
	var graphData = [];

	graphData["day"] = {
		labels: ['Bootstrap', 'Popper', 'Other'],
		datasets: [{
			backgroundColor: generateColors(100),
			borderWidth: 0,
			data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
		}]
	};

	return graphData;
}

function getData(token){

	var data = [];

	/*

	var projectsPromise = getProjects(token);

	projectsPromise.then(function(data) {
		data["projects"] = data["projects"];
		console.log("PROJECTS");
		console.log(data["projects"]);

	}).catch(function(data) {
		swal("Ups! 🙈", "Something went wrong! Please check if the token you entered is correct. Otherwise, please try again later. If it was our fault we will do our best to fix it!", "error");
	});

	*/

	var todayTasksPromise = getTasks(token);

	todayTasksPromise.then(function(data) {
		data["tasks"] = [];

		for (var i = 0; i < data["items"].length; i++){
			if (data["items"][i]["due"] != null && data["items"][i]["due"]["date"].includes("2020-10-11")){
				data["tasks"].push(data["items"][i]);
			}
		}

		console.log("TASKS");
		console.log(data["tasks"]);
			
	}).catch(function(data) {
		swal("Ups! 🙈", "Something went wrong! Please check if the token you entered is correct. Otherwise, please try again later. If it was our fault we will do our best to fix it!", "error");
	});
}

function getProjects(token){
	return $.ajax({
	  dataType: 'json',
	  url: 'https://api.todoist.com/sync/v8/sync',
	  data: {
	  	'token': token,
	  	'sync_token': '*',
	    'resource_types': '["projects"]'
	  }
	});
}

function getTasks(token){
	return $.ajax({
	  dataType: 'json',
	  url: 'https://api.todoist.com/sync/v8/sync',
	  data: {
	  	'token': token,
	  	'sync_token': '*',
	    'resource_types': '["items"]'
	  }
	});
}

// ** ENTRY POINT: ** //

var token = "1a36056aa851fe8266a5bcd5a8a51075b8e2ce79";

getData(token);

var graphData = generateData();

generateGraph("graph-day", graphData["day"]);



