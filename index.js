var fs = require('fs'),
  xml2js = require('xml2js');

var pathString = "M";

var settings = {
	xWidth : 2710000.0,
	yWidth : 2320000.0,
}

var mappedLatitude = function(lat) {
  return ((180 - (lat + 90)) / 180) * settings.yWidth;
};
var mappedLongitude = function(lon) {
  if (lon < 0) 
    return (((180 + (180 - Math.abs(lon))) / 360) * settings.xWidth); 
  else 
    return ((lon / 360) * settings.xWidth);
};

var parser = new xml2js.Parser();
fs.readFile(__dirname + '/Rotherhithe_loops.gpx', function (err, data) {
  parser.parseString(data, function (err, result) {    

    const track = result.gpx.trk[0].trkseg[0].trkpt;

    var currentLat = mappedLatitude(track[0].$.lat)
    var currentLon = mappedLongitude(track[0].$.lon)

    for (i = 0; i < track.length; i++) {

      const lat = mappedLatitude(track[i].$.lat)
      const lon = mappedLongitude(track[i].$.lon)

      const diffLat = (lat - currentLat)
      const diffLon = (lon - currentLon)

      pathString += "l" + diffLon + "," + diffLat

      currentLat = lat
      currentLon = lon
    }

    console.log(pathString)   
    generateSVG(pathString)         
  });
});

function generateSVG(path){
  let obj = { 
    svg: {
      $: {
        "xmlns": "http://www.w3.org/2000/svg",
        "version": "1.1"
      },
      "defs": {
        "style": ".way { fill: none; fill-opacity: 0; stroke:green; stroke-opacity: 1; stroke-width:2;}"
      },
      "g": {
        "path": {
          $: {
            "id": "P1",
            "class": "way",
            "d": path
          }
        }
      }  
    }
  }
  
  var builder = new xml2js.Builder();
  var xml = builder.buildObject(obj);
  
  fs.writeFile('output.svg', xml, function (err) {
    if (err) return console.log(err);
  });
}

