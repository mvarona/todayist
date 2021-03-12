// ** GLOBALS: ** //

var Todayist = {}; // Namespace for variables and default values
var TodayistCookieData = {}; // Namespace for variables and custom values, stored on cookies

Todayist.cookieName = "todayist_cookie";
Todayist.noCookiesToCleanString = "There aren't cookies to clean, reload the page to create them again";
Todayist.confirmCookieCleaningString = "Are you sure that you want to delete the cookies only for this page? That will restore all your data, and you will have to add the Todoist API token again. This action cannot be undone";
Todayist.cookiesDeletedString = "Cookies successfully deleted";
Todayist.missingSettings = "Some fields are missing";
Todayist.mockDate = "01/01/2020 ";
Todayist.infinite = Infinity;
TodayistCookieData.cookieToken = "";
TodayistCookieData.cookieBeginDayTime = "08:00";

// ** FUNCTIONS: ** //

function containsObject(obj, list) {
	var i;
	for (i = 0; i < list.length; i++) {
		if (list[i] === obj) {
			return true;
		}
	}
	return false;
}

function generateGraph(graphID, data, clearData = false){
	var donutOptions = {
	  cutoutPercentage: 85, 
	  legend:{ display:false },
	  maintainAspectRatio: false,
	  responsive: true
	};

	var sumDurations = 0;
	var graphData;

	if (!clearData) {
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

			graphData = {
			labels: data["taskNames"],
			datasets: [{
				backgroundColor: data["taskColors"],
				borderWidth: 0,
				data: data["taskDurations"]
			}]
		};
	}

	if (clearData){
		graphData = [];
		donutOptions = [];
	}

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
		temp += Math.floor((255 - temp) * random*0.5);
		
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

	if (Date.parse(Todayist.mockDate + a["todayist_due_time"]) < Date.parse(Todayist.mockDate + b["todayist_due_time"])){
		return -1;
	}
	if (Date.parse(Todayist.mockDate + a["todayist_due_time"]) > Date.parse(Todayist.mockDate + b["todayist_due_time"])){
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

	var beginDayTime = new Date(Todayist.mockDate + TodayistCookieData.cookieBeginDayTime);
	var durationMinutes = 0;

	if (taskIndex == 0){
		if (task["todayist_due_time"] != null){
			var date = new Date(Todayist.mockDate + task["todayist_due_time"]);
			var difference = Math.abs(date - beginDayTime);
			durationMinutes = difference / 1000 / 60;
		}
	} else {
		if (task["todayist_due_time"] != null){
			var priorDate = new Date(Todayist.mockDate + priorTask["todayist_due_time"]);
			var date = new Date(Todayist.mockDate + task["todayist_due_time"]);
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
		var taskBegin = new Date(Todayist.mockDate + dueDate);
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
	
	var taskBeginDate = new Date(Todayist.mockDate + beginTime);
	var referenceDate = new Date(Todayist.mockDate + referenceTime);
	var timeDifference = (taskBeginDate - referenceDate) / MS_PER_MINUTE;
	
	return timeDifference;
}

function generateGraphSegments(sortedTasks){
	var taskNames = [];
	var taskColors = [];
	var taskDurations = [];
	var graphData = {};
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

					// There is time difference, therefore we need to add a Free segment, and then respective task:

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

					// There is time difference, therefore we need to add a Free segment, and then respective task:

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
				
			// There is time difference, therefore we need to add a Free segment, and then respective task:

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
	var limitDayDate = new Date(Todayist.mockDate + "12:00:00"); // Noon time
	var SECS_PER_MINUTE = 60;
	var MS_PER_MINUTE = SECS_PER_MINUTE * 1000;
	var indexTaskSplitted = Todayist.infinite;

	for (var i = 0; i < data["taskNames"].length; i++){

		if (data["taskNames"][i] === "Free"){
			// The Free tasks are not in Todoist, so they don't have due or calculated begin time:
			if (i < indexTaskSplitted){
				taskNamesDay.push(data["taskNames"][i]);
				taskColorsDay.push(data["taskColors"][i]);
				taskDurationsDay.push(data["taskDurations"][i]);
			} else {
				taskNamesNight.push(data["taskNames"][i]);
				taskColorsNight.push(data["taskColors"][i]);
				taskDurationsNight.push(data["taskDurations"][i]);
			}

		} else {
			var taskDueDate = new Date(Todayist.mockDate + getDueTimeForTask(data["taskNames"][i], allTasks));
			var taskBeginDate = new Date(Todayist.mockDate + getBeginTimeForTask(data["taskNames"][i], allTasks));
			
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

				indexTaskSplitted = i;

				var minutesDay = (limitDayDate - taskBeginDate) / MS_PER_MINUTE;
				
				taskNamesDay.push(data["taskNames"][i]);
				taskColorsDay.push(data["taskColors"][i]);
				taskDurationsDay.push(minutesDay);

				taskNamesNight.push(data["taskNames"][i]);
				taskColorsNight.push(data["taskColors"][i]);
				taskDurationsNight.push(data["taskDurations"][i] - minutesDay);
			}
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

	generateGraph("graph-day", [], clearData = true);
	generateGraph("graph-night", [], clearData = true);

	var projectsPromise = getProjects(token);

	projectsPromise.then(function(result) {
		data["projects"] = result["projects"];
		
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

			data["tasks"] = getColors(data["projects"], data["tasks"]);

			sortedTasks = sortTasks(data["tasks"]);

			sortedTasks = setTasksDurations(sortedTasks);
			
			var graphData = [];

			graphData = generateGraphSegments(sortedTasks);
			graphData = splitGraphData(graphData, sortedTasks);	

			generateGraph("graph-day", graphData["day"]);
			generateGraph("graph-night", graphData["night"]);
				
		}).catch(function(data) {
			showError("Something went wrong! Please check if the token you entered is correct. Otherwise, please try again later. If it was our fault we will do our best to fix it!");
		});

	}).catch(function(data) {
		showError("Something went wrong! Please check if the token you entered is correct. Otherwise, please try again later. If it was our fault we will do our best to fix it!");
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

function checkSession(){
	if (!$.cookie(Todayist.cookieName)) {
		// No saved data:
		$('#background').delay(500).fadeIn();
		$('#modal-setup').delay(500).fadeIn();
		$('#time').bootstrapMaterialDatePicker({ date: false, shortTime: false, format: 'HH:mm' });
		mockData();

	} else {
		// Saved data:
		TodayistCookieData = JSON.parse($.cookie(Todayist.cookieName));
	    getData(TodayistCookieData.cookieToken, TodayistCookieData.beginTime);
	    loadSettings();
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

function loadSettings(){
	$('#token').val(TodayistCookieData.cookieToken);
	$('#time').val(TodayistCookieData.cookieBeginDayTime);
}

function saveSettings(token, time){
	TodayistCookieData.cookieToken = token;
	TodayistCookieData.cookieBeginDayTime = time; 
	$.cookie(Todayist.cookieName, JSON.stringify(TodayistCookieData));
}

function updateUI(token, time){
	getData(token, time);
}

function mockData(){
	var sampleTasks = [{"content":"Prepare licence","due":{"date":"2020-10-14T09:00:00","timezone":null},"todayist_color":"#fad726","todayist_due_time":"09:00:00","todayist_duration":60,"todayist_begin_time":"08:00:00"},{"content":"Manage explicit consent","date_added":"2020-10-09T14:58:09Z","due":{"date":"2020-10-14T13:00:00","timezone":null},"todayist_color":"#fbe000","todayist_due_time":"13:00:00","todayist_duration":240,"todayist_begin_time":"09:00:00"},{"content":"Integrate analytics","date_added":"2020-10-09T14:58:17Z","due":{"date":"2020-10-14T14:00:00","timezone":null},"todayist_color":"#fce575","todayist_due_time":"14:00:00","todayist_duration":60,"todayist_begin_time":"13:00:00"},{"content":"Rewrite Readme","date_added":"2020-10-13T22:25:47Z","due":{"date":"2020-10-14T15:00:00","timezone":null},"todayist_color":"#fbdd4b","todayist_due_time":"15:00:00","todayist_duration":60,"todayist_begin_time":"14:00:00"},{"content":"Lesson Legal Aspects","date_added":"2020-10-01T13:47:38Z","due":{"date":"2020-10-14T16:00:00","timezone":null},"todayist_color":"#ff9a36","todayist_due_time":"16:00:00","todayist_duration":60,"todayist_begin_time":"15:00:00"},{"content":"Ask Niko about allowance","due":{"date":"2020-10-14T17:00:00","timezone":null},"todayist_color":"#c1c1c1","todayist_due_time":"17:00:00","todayist_duration":60,"todayist_begin_time":"16:00:00"},{"content":"Lesson Business Management","due":{"date":"2020-10-14T18:00:00","timezone":null},"todayist_color":"#ffa851","todayist_due_time":"18:00:00","todayist_duration":60,"todayist_begin_time":"17:00:00"},{"content":"Prepare dinner","due":{"date":"2020-10-14T19:00:00","timezone":null},"todayist_color":"#6cccbc","todayist_due_time":"19:00:00","todayist_duration":60,"todayist_begin_time":"18:00:00"},{"content":"Pushups 30 minutes","due":{"date":"2020-10-14T19:30:00","timezone":null},"todayist_color":"#a1ded4","todayist_due_time":"19:30:00","todayist_duration":30,"todayist_begin_time":"19:00:00"},{"content":"Log habits","due":{"date":"2020-10-14T23:59:00","timezone":null},"todayist_color":"#a0ddaa","todayist_due_time":"23:59:00","todayist_duration":269,"todayist_begin_time":"19:30:00"},{"content":"Improve posture","due":{"date":"2020-10-14","timezone":null},"todayist_color":"#6accbc","todayist_due_time":null,"todayist_duration":0,"todayist_begin_time":null},{"content":"Prepare tee","due":{"date":"2020-10-14","timezone":null},"todayist_color":"#8bd7ca","todayist_due_time":null,"todayist_duration":0,"todayist_begin_time":null},{"content":"Listen to Kevin","due":{"date":"2020-10-14","timezone":null},"todayist_color":"#eda0ed","todayist_due_time":null,"todayist_duration":0,"todayist_begin_time":null},{"content":"Reply Kevin","due":{"date":"2020-10-14","timezone":null},"todayist_color":"#f0b1f0","todayist_due_time":null,"todayist_duration":0,"todayist_begin_time":null}];

	sampleTasks = setTasksDurations(sampleTasks);

	graphData = generateGraphSegments(sampleTasks);
	graphData = splitGraphData(graphData, sampleTasks);

	generateGraph("graph-day", graphData["day"]);
	generateGraph("graph-night", graphData["night"]);	
}

function loadUI(){
	$('.current-year').html(new Date().getFullYear());
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

loadUI();
checkSession();