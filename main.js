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
		datasets: [
		  {
			backgroundColor: generateColors(100),
			borderWidth: 0,
			data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
		  }
		]
	};

	return graphData;
}

/* ** ENTRY POINT: ** */

var graphData = generateData();

generateGraph("graph-day", graphData["day"]);


