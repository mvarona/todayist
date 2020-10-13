// ** GLOBALS: ** //

var Todayist = {}; // Namespace for variables and default values

Todayist.cookieName = "todayist_cookie";
Todayist.noCookiesToCleanString = "There aren't cookies to clean, reload the page to create them again";
Todayist.confirmCookieCleaningString = "Are you sure that you want to delete the cookies only for this page? That will restore all your data, and you will have to add the Todoist API token again. This action cannot be undone";
Todayist.cookiesDeletedString = "Cookies successfully deleted";
Todayist.missingSettings = "Some fields are missing";

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

function generateGraph(graphID, data){
	var donutOptions = {
	  cutoutPercentage: 85, 
	  legend:{ display:false },
	  maintainAspectRatio: false,
	  responsive: true
	};

	var sumDurations = 0;

	for (var i = 0; i < data["taskDurations"].length; i++){
		sumDurations += data["taskDurations"];
	}

	if (sumDurations < 720){
		data["taskNames"].unshift("Free");
		data["taskColors"].unshift("#eeeeee");
		data["taskDurations"].unshift(720 - sumDurations);
	}

	if (data["taskNames"].length == 0){
		data["taskNames"].push("Free");
		data["taskColors"].push("#eeeeee");
		data["taskDurations"].push(720);
	}

	var graphData = {
		labels: data["taskNames"],
		datasets: [{
			backgroundColor: data["taskColors"],
			borderWidth: 0,
			data: data["taskDurations"]
		}]
	};

	var graph = document.getElementById(graphID);
	if (graph) {
	  var graphObject = new Chart(graph, {
		  type: 'pie',
		  data: graphData,
		  options: donutOptions
	  });
	  document.getElementById(graphID + '-leyend').innerHTML = graphObject.generateLegend();
	}	
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

	var beginDayTime = new Date('01/01/2020 00:00:00');
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
	// Pattern: $number, in case of more than one, get the last:
	var pattern = /\$[0-9]+/g;
	var result = taskName.match(pattern);
	if (result != null){
		if (result.length > 0){
			result = result[result.length - 1];
		}
		result = result.replaceAll("$", "");
	}
	return result;
}

function calculateBeginTime(dueDate, durationInMinutes){

	var SECS_PER_MINUTE = 60;
	var MS_PER_MINUTE = SECS_PER_MINUTE * 1000;

	if (dueDate != null && durationInMinutes != null){
		var taskBegin = new Date("01/01/2020 " + dueDate);
		taskBegin = new Date(taskBegin - durationInMinutes * MS_PER_MINUTE);
		var taskBeginHour = taskBegin.getHours();
		if (taskBeginHour < 10){
			taskBeginHour = "0" + taskBeginHour.toString();
		}
		var taskBeginMinutes = taskBegin.getMinutes();
		if (taskBeginMinutes < 10){
			taskBeginMinutes = "0" + taskBeginMinutes.toString();
		}
		var taskBeginSeconds = taskBegin.getSeconds();
		if (taskBeginSeconds < 10){
			taskBeginSeconds = "0" + taskBeginSeconds.toString();
		}
		var taskBeginTime = taskBeginHour + ":" + taskBeginMinutes + ":" + taskBeginSeconds;

	} else {
		return null;
	}
	
	return taskBeginTime;
}

function setTasksDurations(sortedTasks){

	for (var i = 0; i < sortedTasks.length; i++){
		durationInName = searchDuration(sortedTasks[i]["content"]);
		if (durationInName != null){
			sortedTasks[i]["todayist_duration"] = durationInName;
		} else {
			if (i == 0){
				sortedTasks[i]["todayist_duration"] = calculateDuration(sortedTasks[i], null, i);
				sortedTasks[i]["todayist_begin_time"] = calculateBeginTime(sortedTasks[i]["todayist_due_time"], sortedTasks[i]["todayist_duration"]);
			} else {
				sortedTasks[i]["todayist_duration"] = calculateDuration(sortedTasks[i], sortedTasks[i - 1], i);
				sortedTasks[i]["todayist_begin_time"] = calculateBeginTime(sortedTasks[i]["todayist_due_time"], sortedTasks[i]["todayist_duration"]);
			}
		}
	}

	return sortedTasks;

}

function calculateTimeDifference(beginTime, referenceTime){

	// Returns time in minutes between the beginning date of a task, and the prior task (referenceTime)
	var SECS_PER_MINUTE = 60;
	var MS_PER_MINUTE = SECS_PER_MINUTE * 1000;

	var MINS_PER_HOUR = 60;
	(taskBeginDate - referenceDate) / MS_PER_MINUTE;
	
	var taskBeginDate = new Date("01/01/2020 " + beginTime);
	var referenceDate = new Date("01/01/2020 " + referenceTime);
	var timeDifference = (taskBeginDate - referenceDate) / MS_PER_MINUTE;
	
	return timeDifference;
}

function generateGraphSegments(sortedTasks){
	var taskNames = [];
	var taskColors = [];
	var taskDurations = [];
	var graphData = {};
	var beginDay = new Date("01/01/2020 00:00:00");
	var sortedPlannedTasks = [];

	for (var i = 0; i < sortedTasks.length; i++){
		if (sortedTasks[i]["todayist_due_time"] != null && sortedTasks[i]["todayist_duration"]){
			sortedPlannedTasks.push(sortedTasks[i]);
		}
	}

	for (var i = 0; i < sortedPlannedTasks.length; i++){
		var taskName = "";
		var taskColor = "";
		var taskDuration = 0;

		if (i < sortedPlannedTasks.length - 1){
			// All except last tasks:			

			if (i == 0){
				// First task:

				taskDuration = calculateTimeDifference(sortedPlannedTasks[i]["todayist_begin_time"], "00:00:00");
				
				if (taskDuration > 0){
					taskName = "Free";
					taskColor = "#eeeeee";

					taskNames.push(taskName);
					taskColors.push(taskColor);
					taskDurations.push(taskDuration);

					taskName = sortedPlannedTasks[i]["content"];
					taskColor = sortedPlannedTasks[i]["todayist_color"];
					taskDuration = sortedPlannedTasks[i]["todayist_duration"];

					taskNames.push(taskName);
					taskColors.push(taskColor);
					taskDurations.push(taskDuration);

				} else {
					taskName = sortedPlannedTasks[i]["content"];
					taskColor = sortedPlannedTasks[i]["todayist_color"];
					taskDuration = sortedPlannedTasks[i]["todayist_duration"];

					taskNames.push(taskName);
					taskColors.push(taskColor);
					taskDurations.push(taskDuration);
				}

			} else {
				// All except first and last tasks:

				taskDuration = calculateTimeDifference(sortedPlannedTasks[i]["todayist_begin_time"], sortedPlannedTasks[i - 1]["todayist_due_time"]);
				
				if (taskDuration > 0){
					taskName = "Free";
					taskColor = "#eeeeee";

					taskNames.push(taskName);
					taskColors.push(taskColor);
					taskDurations.push(taskDuration);

					taskName = sortedPlannedTasks[i]["content"];
					taskColor = sortedPlannedTasks[i]["todayist_color"];
					taskDuration = sortedPlannedTasks[i]["todayist_duration"];

					taskNames.push(taskName);
					taskColors.push(taskColor);
					taskDurations.push(taskDuration);


				} else {
					taskName = sortedPlannedTasks[i]["content"];
					taskColor = sortedPlannedTasks[i]["todayist_color"];
					taskDuration = sortedPlannedTasks[i]["todayist_duration"];

					taskNames.push(taskName);
					taskColors.push(taskColor);
					taskDurations.push(taskDuration);
				}
			}

		} else {
			// Last task:
			taskDuration = calculateTimeDifference(sortedPlannedTasks[i]["todayist_begin_time"], "23:59:59");
				
			if (taskDuration > 0){
				taskName = "Free";
				taskColor = "#eeeeee";

				taskNames.push(taskName);
				taskColors.push(taskColor);
				taskDurations.push(taskDuration);

				taskName = sortedPlannedTasks[i]["content"];
				taskColor = sortedPlannedTasks[i]["todayist_color"];
				taskDuration = sortedPlannedTasks[i]["todayist_duration"];

				taskNames.push(taskName);
				taskColors.push(taskColor);
				taskDurations.push(taskDuration);

			} else {
				taskName = sortedPlannedTasks[i]["content"];
				taskColor = sortedPlannedTasks[i]["todayist_color"];
				taskDuration = sortedPlannedTasks[i]["todayist_duration"];

				taskNames.push(taskName);
				taskColors.push(taskColor);
				taskDurations.push(taskDuration);
			}
		}
	}
	
	graphData["taskNames"] = taskNames;
	graphData["taskColors"] = taskColors;
	graphData["taskDurations"] = taskDurations;

	console.log("GRAPH DATA");
	console.log(graphData);

	return graphData;
}

function getDueTimeForTask(taskContent, allTasks){
	for (var i = 0; i < allTasks.length; i++){
		if (allTasks[i]["content"] === taskContent){
			return allTasks[i]["todayist_due_time"];
		}
	}
}

function getBeginTimeForTask(taskContent, allTasks){
	for (var i = 0; i < allTasks.length; i++){
		if (allTasks[i]["content"] === taskContent){
			return allTasks[i]["todayist_begin_time"];
		}
	}
}

function splitGraphData(data, allTasks){
	var taskNamesDay = [];
	var taskColorsDay = [];
	var taskDurationsDay = [];
	var taskNamesNight = [];
	var taskColorsNight = [];
	var taskDurationsNight = [];
	var splittedGraphData = {};
	var dayObject = {};
	var nightObject = {};
	var limitDayDate = new Date("01/01/2020 12:00:00");
	var SECS_PER_MINUTE = 60;
	var MS_PER_MINUTE = SECS_PER_MINUTE * 1000;

	for (var i = 0; i < data["taskNames"].length; i++){
		var taskDueDate = new Date("01/01/2020 " + getDueTimeForTask(data["taskNames"][i], allTasks));
		var taskBeginDate = new Date("01/01/2020 " + getBeginTimeForTask(data["taskNames"][i], allTasks));
		
		if (taskBeginDate < limitDayDate && taskDueDate <= limitDayDate){
			// Task is during day:
			taskNamesDay.push(data["taskNames"][i]);
			taskColorsDay.push(data["taskColors"][i]);
			taskDurationsDay.push(data["taskDurations"][i]);

		} else if (taskBeginDate >= limitDayDate){
			// Task is during night:
			taskNamesNight.push(data["taskNames"][i]);
			taskColorsNight.push(data["taskColors"][i]);
			taskDurationsNight.push(data["taskDurations"][i]);
		
		} else if (taskBeginDate < limitDayDate && taskDueDate > limitDayDate){
			// Task starts during day and ends during night (split task):

			var minutesDay = (limitDayDate - taskBeginDate) / MS_PER_MINUTE;
			
			taskNamesDay.push(data["taskNames"][i]);
			taskColorsDay.push(data["taskColors"][i]);
			taskDurationsDay.push(minutesDay);

			taskNamesNight.push(data["taskNames"][i]);
			taskColorsNight.push(data["taskColors"][i]);
			taskDurationsNight.push(data["taskDurations"][i] - minutesDay);
		}

	}

	dayObject["taskNames"] = taskNamesDay;
	dayObject["taskColors"] = taskColorsDay;
	dayObject["taskDurations"] = taskDurationsDay;

	nightObject["taskNames"] = taskNamesNight;
	nightObject["taskColors"] = taskColorsNight;
	nightObject["taskDurations"] = taskDurationsNight;

	splittedGraphData["day"] = dayObject;
	splittedGraphData["night"] = nightObject;

	return splittedGraphData;

}

function getData(token, time){

	var data = [];

/*

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
			showError("Something went wrong! Please check if the token you entered is correct. Otherwise, please try again later. If it was our fault we will do our best to fix it!");
		});

	}).catch(function(data) {
		showError("Something went wrong! Please check if the token you entered is correct. Otherwise, please try again later. If it was our fault we will do our best to fix it!");
	});

	*/

	var sortedTasks = [{"content":"Clase Legales TA1","due":{"date":"2020-10-12T16:00:00","is_recurring":true,"lang":"es","string":"todos lunes a las 16","timezone":null},"id":4220572517,"project_id":664695256,"todayist_color":"#ffe0c2","todayist_due_time":"16:00:00","todayist_begin_time":"11:00:00","todayist_duration":300},{"content":"Teóricas Gestión","due":{"date":"2020-10-12T18:00:00","is_recurring":true,"lang":"es","string":"todos lunes a las 18","timezone":null},"id":4220572528,"project_id":664695256,"todayist_color":"#ffc68e","todayist_due_time":"18:00:00","todayist_begin_time":"16:00:00","todayist_duration":120},{"content":"Merendar","due":{"date":"2020-10-12T19:00:00","is_recurring":true,"lang":"es","string":"todos días a las 19:00","timezone":null},"id":4076720689,"project_id":664695029,"todayist_color":"#6dcdbd","todayist_due_time":"19:00:00","todayist_begin_time":"18:00:00","todayist_duration":60},{"content":"30 minutos pesas","due":{"date":"2020-10-12T19:30:00","is_recurring":true,"lang":"es","string":"todos lunes, miércoles, viernes, domingos 19:30","timezone":null},"id":2799442432,"project_id":664695029,"todayist_color":"#f1faf8","todayist_due_time":"19:30:00","todayist_begin_time":"19:00:00","todayist_duration":30},{"content":"Dedicar 2 horas a ejercicio","due":{"date":"2020-10-12T20:00:00","is_recurring":true,"lang":"es","string":"todos domingos 20:00","timezone":null},"id":2799356737,"project_id":664695029,"todayist_color":"#7fd3c5","todayist_due_time":"20:00:00","todayist_begin_time":"19:30:00","todayist_duration":30},{"content":"Loguear hábitos","due":{"date":"2020-10-12T23:59:00","is_recurring":true,"lang":"es","string":"todos días 23:59","timezone":null},"id":4035761332,"project_id":664695029,"todayist_color":"#77d0c2","todayist_due_time":"23:59:00","todayist_begin_time":"20:00:00","todayist_duration":239},{"content":"Intentar tener mejor postura","due":{"date":"2020-10-12","is_recurring":true,"lang":"es","string":"todos dias","timezone":null},"id":4134069418,"project_id":664695029,"todayist_color":"#caede7","todayist_due_time":null,"todayist_begin_time":null,"todayist_duration":0}];

	var graphData = [];

	graphData = generateGraphSegments(sortedTasks);
	graphData = splitGraphData(graphData, sortedTasks);	

	console.log("SPLITTED GRAPH DATA")
	console.log(graphData);

	generateGraph("graph-day", graphData["day"]);
	generateGraph("graph-night", graphData["night"]);

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

function checkSession(){
	if (!$.cookie(Todayist.cookieName)) {
		$('#background').delay(500).fadeIn();
		$('#modal-setup').delay(500).fadeIn();
		$('#time').bootstrapMaterialDatePicker({ date: false, shortTime: false, format: 'HH:mm' });
		mockData();
	}
}

function showError(msg) {
	swal("Ups! 🙈", msg, "error");
}

function showSuccess(msg) {
	swal("Yay! 😄", msg, "success");
}

function showConfirm(msg, okTxt, cancelTxt, okFunction, cancelFunction){
	swal({
		title: "Are you sure?",
		text: msg,
		icon: "warning",
		buttons: [
	    	cancelTxt,
	    	okTxt
	    ],
	}).then(function(isConfirm) {
      if (isConfirm) {
      		okFunction();
		} else {
			cancelFunction();
		}
	});
}

function deleteCookies(){
	document.cookie = Todayist.cookieName + '=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
	showSuccess(Todayist.cookiesDeletedString);
}

function saveSettings(token, time){

}

function updateUI(token, time){
	//getData(token, time);
}

function mockData(){
	var token = "1a36056aa851fe8266a5bcd5a8a51075b8e2ce79";
	getData(token);
}

// ** JQUERY EVENTS: ** //

$('#delete-cookies').click(function(){
	if ($.cookie(Todayist.cookieName)) {
		showConfirm(Todayist.confirmCookieCleaningString, "Ok", "Cancel", deleteCookies, function(){});
	} else {
		showError(Todayist.noCookiesToCleanString);
	}
});

$('#save-settings').click(function(){
	if ($('#token').val().length > 0 && $('#time').val().length > 0){
		var token = $('#token').val().trim();
		var time = $('#time').val().trim();
		saveSettings(token, time);
		updateUI(token, time);

		$('#background').fadeOut();
		$("#modal-setup").fadeOut();
	} else {
		showError(Todayist.missingSettings);
	}
});

$('#settings').click(function(){
	$('#background').fadeIn();
	$("#modal-setup").fadeIn();
});

$("#modal-setup .close").click(function() {
	$('#background').fadeOut();
	$("#modal-setup").fadeOut();
});

$("#close-modal-setup").click(function() {
	$('#background').fadeOut();
	$("#modal-setup").fadeOut();
});


// ** ENTRY POINT: ** //

checkSession();