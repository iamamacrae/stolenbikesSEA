

// Adding 500 Data Points
var map, pointarray, heatmap;

// new google.maps.LatLng(37.751266, -122.403355)

var bikeRecords = [];
var parse = function(data) {
	var data = data.split("\n");
	var points = [];
	for(var i = 0, x = data.length; i < x; i++) {
		try {
		var record = JSON.parse(data[i]);
		var location = record.location;
    		points.push(parseFloat(location.latitude));
    		points.push(parseFloat(location.longitude));
		bikeRecords.push(record);
		} catch(e) {};
	}
	return points;
};

var superInit = function(cb) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
	    if (xhr.readyState === 4) {
		var data = xhr.responseText;
		cb(parse(data));
	    }
	};
	xhr.open('GET', 'dsg-data.json', true);
	xhr.send(null);
};

function initialize(points) {

  var bikePointData = [ ];
  var bikeMarkerData = [ ];

  var mapOptions = {
    zoom: 13,
    center: new google.maps.LatLng(47.656504,-122.3351672),
    mapTypeId: google.maps.MapTypeId.SATELLITE
  };

  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

function msToDHM(v) {
  var days = v / 8.64e7 | 0;
  var hrs  = (v % 8.64e7)/ 3.6e6 | 0;
  var mins = Math.round((v % 3.6e6) / 6e4);
  if(days < 1 && hrs < 1) return '';

  var out = [];
  out.push("<br>Reported after: ");
  if(days > 0) out.push(days + " days");
  if(hrs > 0) out.push(hrs + " hours");
  return out.join(' ');

  return days + ':' + z(hrs) + ':' + z(mins);

  function z(n){return (n<10?'0':'')+n;}
}

  var html = function(entry) {
	var id = entry.rms_cdw_id;
	var time = entry.occurred_date_or_date_range_start;
	if(entry.occurred_date_range_end) time += " - " + entry.occurred_date_range_end;

	var loc = entry.hundred_block_location;
	var html = [
		"Case: ", id, "<br>",
		"Time: ", time, "<br>",
		"Loc: ", loc
	];
	var reported = entry.date_reported;
	var lag = Date.parse(entry.occurred_date_range_end || entry.occurred_date_or_date_range_start);
	lag = +Date.parse(reported) - (+lag) ;
	lag = msToDHM(lag);
	html.push(lag);
	return '<div id="sel">'+html.join('')+'</div>';
  };

  for(var i = 0, x = points.length, offset = 0; i < x; i+=2) {
   var entry = bikeRecords[offset];
   // FIXME: Heatmap not working out.
   bikePointData.push(new google.maps.LatLng(points[i], points[i+1]));
   // NOTES: Heavy but we only have a few thousand points.
   var marker = new google.maps.Marker({map: map, title: entry.date_reported, position: bikePointData[bikePointData.length-1]});
   (function(marker,entry) { 
    //marker.setIcon('stolen-small.png');
    var select = function() {
	var iwin;
	if(entry.iwin) iwin = entry.iwin;
	else {
		entry.iwin = iwin = new google.maps.InfoWindow({content: html(entry)});
		google.maps.event.addListener(iwin,'closeclick',select);
	}
	    // marker.setMap(null);
	    if(entry.hasSelection) {
		marker.setIcon(null);
		entry.hasSelection = false;
		iwin.close();
	    }
	    else {
		entry.hasSelection = true;
		marker.setIcon('stolen-small.png');
	        //console.log("thing", entry);
		iwin.open(map, marker);

	    }
    };
    google.maps.event.addListener(marker, "click", select);
   })(marker,entry);

   bikeMarkerData.push(marker);
   offset++;
  }

  var pointArray = new google.maps.MVCArray(bikePointData);

  heatmap = new google.maps.visualization.HeatmapLayer({
    data: pointArray
  });

  heatmap.setMap(map);
}

function toggleHeatmap() {
  heatmap.setMap(heatmap.getMap() ? null : map);
}

function changeGradient() {
  var gradient = [
    'rgba(0, 255, 255, 0)',
    'rgba(0, 255, 255, 1)',
    'rgba(0, 191, 255, 1)',
    'rgba(0, 127, 255, 1)',
    'rgba(0, 63, 255, 1)',
    'rgba(0, 0, 255, 1)',
    'rgba(0, 0, 223, 1)',
    'rgba(0, 0, 191, 1)',
    'rgba(0, 0, 159, 1)',
    'rgba(0, 0, 127, 1)',
    'rgba(63, 0, 91, 1)',
    'rgba(127, 0, 63, 1)',
    'rgba(191, 0, 31, 1)',
    'rgba(255, 0, 0, 1)'
  ]
  heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
}

function changeRadius() {
  heatmap.set('radius', heatmap.get('radius') ? null : 100);
}

function changeOpacity() {
  heatmap.set('opacity', heatmap.get('opacity') ? null : 0.8);
}

google.maps.event.addDomListener(window, 'load', function() {
 superInit(initialize);
});

