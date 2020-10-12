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

function getRandomColorSimilarTo(color) {
	var p = 1; // To manage # in color
	var temp;
	var	random = Math.random();
	var result = '#';

	while (p < color.length) {
		// We displace each color component with a random value:
		temp = parseInt(color.slice(p, p += 2), 16)
		// We se random^2 to maximaze the distance between previous colors:
		temp += Math.floor((255 - temp) * random);
		result += temp.toString(16).padStart(2, '0');
	}
	return result;
}

function getColors(projects, tasks){
	var colors = [];
	var todoistColors = {
		"30": "#b8256f",
		"31": "#db4035",
		"32": "#ff9933",
		"33": "#fad000",
		"34": "#afb83b",
		"35": "#7ecc49",
		"36": "#299438",
		"37": "#6accbc",
		"38": "#158fad",
		"39": "#14aaf5",
		"40": "#96c3eb",
		"41": "#4073ff",
		"42": "#884dff",
		"43": "#af38eb",
		"44": "#eb96eb",
		"45": "#e05194",
		"46": "#ff8d85",
		"47": "#808080",
		"48": "#b8b8b8",
		"49": "#ccac93"
	}

	for (var i = 0; i < projects.length; i++){
		var projectColor = todoistColors[projects[i]["color"]];
		var projectID = projects[i]["id"];
		for (var j = 0; j < tasks.length; j++){
			
			if (tasks[j]["project_id"] == projectID){
				do {
					var newColor = getRandomColorSimilarTo(projectColor);
					colors.push(newColor);
					tasks[j]["todayist_color"] = newColor;
				} while (!containsObject(newColor, colors));
			}
		}
	}

	return tasks;

}

function compareDueDateTasks(a, b) {
	// Sort by due hour, nulls go to the end:

	if (a["todayist_due_time"] == null && b["todayist_due_time"] != null){
		return 1;
	}
	if (a["todayist_due_time"] != null && b["todayist_due_time"] == null){
		return -1;
	}
	if (a["todayist_due_time"] == null && b["todayist_due_time"] == null){
		return 0;
	}

	if (Date.parse('01/01/2020 ' + a["todayist_due_time"]) < Date.parse('01/01/2020 ' + b["todayist_due_time"])){
		return -1;
  	}
  	if (Date.parse('01/01/2020 ' + a["todayist_due_time"]) > Date.parse('01/01/2020 ' + b["todayist_due_time"])){
		return 1;
  	}
	return 0;
}

function searchDueHour(task){
	var dateString = task["due"]["date"];
	var date = new Date(dateString);
	var time = "";
	
	if (dateString.includes(":")){
		// Task is planned for a specific hour:

		var hour = date.getHours();
		if (hour < 10){
			hour = "0" + hour.toString();
		}

		var minutes = date.getMinutes();
		if (minutes < 10){
			minutes = "0" + minutes.toString();
		}

		var seconds = date.getSeconds();
		if (seconds < 10){
			seconds = "0" + seconds.toString();
		}

		time = hour + ":" + minutes + ":" + seconds;

	} else {
		// Task is not planned for any specific hour:
		time = null;
	}
    
	return time;
}

function sortTasks(tasks){
	var sortedTasks = [];

	for (var i = 0; i < tasks.length; i++){
		tasks[i]["todayist_due_time"] = searchDueHour(tasks[i]);
	}

	sortedTasks = tasks.sort(compareDueDateTasks);

	return sortedTasks;
}

function calculateDuration(task, priorTask, taskIndex){

	var beginDayTime = new Date('01/01/2020 11:00:00');
	var durationMinutes = 0;

	if (taskIndex == 0){
		if (task["todayist_due_time"] != null){
			var date = new Date('01/01/2020 ' + task["todayist_due_time"]);
			var difference = Math.abs(date - beginDayTime);
			durationMinutes = difference / 1000 / 60;
		}
	} else {
		if (task["todayist_due_time"] != null){
			var priorDate = new Date('01/01/2020 ' + priorTask["todayist_due_time"]);
			var date = new Date('01/01/2020 ' + task["todayist_due_time"]);
			var difference = Math.abs(date - priorDate);
			durationMinutes = difference / 1000 / 60;
		}
	}

	return durationMinutes
}

function searchDuration(taskName){
	// Pattern: \number\, in case of more than one, get the last:
	var pattern = /\\[0-9]+\\/g;
	var result = taskName.match(pattern);
	if (result != null){
		if (result.length > 0){
			result = result[result.length - 1];
		}
		result = result.replaceAll("\\", "");
	}
	return result;
}

function setTasksDurations(sortedTasks){

	for (var i = 0; i < sortedTasks.length; i++){
		durationInName = searchDuration(sortedTasks[i]["content"]);
		if (durationInName != null){
			sortedTasks[i]["todayist_duration"] = durationInName;
		} else {
			// TODO: Calculate duration
			if (i == 0){
				sortedTasks[i]["todayist_duration"] = calculateDuration(sortedTasks[i], null, i);
			} else {
				sortedTasks[i]["todayist_duration"] = calculateDuration(sortedTasks[i], sortedTasks[i - 1], i);
			}
		}
	}

	return sortedTasks;

}

function getData(token){

	var data = [];

	var projectsPromise = getProjects(token);

	projectsPromise.then(function(result) {
		data["projects"] = result["projects"];
		console.log("PROJECTS");
		console.log(data["projects"]);

		var todayTasksPromise = getTasks(token);

		todayTasksPromise.then(function(result) {
			data["tasks"] = [];

			var today = new Date();
			var dd = String(today.getDate()).padStart(2, '0');
			var mm = String(today.getMonth() + 1).padStart(2, '0');
			var yyyy = today.getFullYear();
			today = yyyy + "-" + mm + "-" + dd;

			for (var i = 0; i < result["items"].length; i++){
				if (result["items"][i]["due"] != null && result["items"][i]["due"]["date"].includes(today)){
					data["tasks"].push(result["items"][i]);
				}
			}

			console.log("TASKS");
			console.log(data["tasks"]);

			data["tasks"] = getColors(data["projects"], data["tasks"]);

			console.log("TASKS WITH COLOR");
			console.log(data["tasks"]);

			sortedTasks = sortTasks(data["tasks"]);

			console.log("SORTED TASKS");
			console.log(sortedTasks);

			console.log("SORTED TASKS WITH DURATION");
			sortedTasks = setTasksDurations(sortedTasks);
			console.log(sortedTasks);

				
		}).catch(function(data) {
			swal("Ups! 🙈", "Something went wrong! Please check if the token you entered is correct. Otherwise, please try again later. If it was our fault we will do our best to fix it!", "error");
		});

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



