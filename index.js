var fs = require('fs'),
  xml2js = require('xml2js');

const {argv} = require('yargs')

var pathString = "M";
var elePathString = "M"

var settings = {
  xWidth: 2710000.0,
  yWidth: 2320000.0,
}

var mappedLatitude = function (lat) {
  return ((180 - (lat + 90)) / 180) * settings.yWidth;
};
var mappedLongitude = function (lon) {
  if (lon < 0)
    return (((180 + (180 - Math.abs(lon))) / 360) * settings.xWidth);
  else
    return ((lon / 360) * settings.xWidth);
};

var parser = new xml2js.Parser();

if(!argv.gpx) {
  console.log("Pass a gpx file as argument. ie yarn convert --gpx=sample_gpx/workout.gpx");
  return;
}

fs.readFile(__dirname + "/" + argv.gpx, function (err, data) {
  parser.parseString(data, function (err, result) {

    // generate map
    const track = result.gpx.trk[0].trkseg[0].trkpt;

    var currentLat = mappedLatitude(track[0].$.lat)
    var currentLon = mappedLongitude(track[0].$.lon)
    var currentEle = track[0].ele[0]

    elePathString += 0 + "," + 0
    elePathString += "l" + 0 + "," + -currentEle

    pathString += 0 + "," + 0


    var maxLat = 0, minLat = 0, sumLat = 0
    var maxLon = 0, minLon = 0, sumLon = 0
    var maxEle = currentEle, minEle = currentEle, sumEle = 0

    for (i = 0; i < track.length; i++) {

      const lat = mappedLatitude(track[i].$.lat)
      const lon = mappedLongitude(track[i].$.lon)
      const ele = track[i].ele[0]

      const diffLat = Math.round(((lat - currentLat) + Number.EPSILON) * 100) / 100
      const diffLon = Math.round(((lon - currentLon) + Number.EPSILON) * 100) / 100

      const diffEle = Math.round(((currentEle - ele) + Number.EPSILON) * 100) / 100

      pathString += "l" + diffLon + "," + diffLat
      elePathString += "l" + 0.5 + "," + diffEle

      currentLat = lat

      sumLat = sumLat + diffLat
      sumLon = sumLon + diffLon
      sumEle = sumEle + diffEle
      if (sumLat > maxLat) maxLat = sumLat
      if (sumLat < minLat) minLat = sumLat
      if (sumLon > maxLon) maxLon = sumLon
      if (sumLon < minLon) minLon = sumLon
      if (sumEle > maxEle) maxEle = sumEle
      if (sumEle < minEle) minEle = sumEle

      currentLon = lon
      currentEle = ele
    }

    const width = Math.abs(minLat) + Math.abs(maxLat)
    const x = minLat
    const height = Math.abs(minLon) + Math.abs(maxLon)
    const y = minLon

    const eleHeight = Math.abs(minEle) + Math.abs(maxEle)

    elePathString += "l" + 0 + "," + currentEle

    //generate elevation

    //console.log(pathString)   
    // need to remove half stroke width on x,y -2
    // need to add double stroke width on widht,height 4
    generateMapSVG(pathString, x - 2, y - 2, width + 4, height + 4)
    generateElevationSVG(elePathString, 0, -eleHeight, track.length/2 , eleHeight)
  });
});

function generateElevationSVG(path, x, y, width, height) {
  let obj = {
    svg: {
      $: {
        "id": "elevation",
        "viewBox": x + " " + y + " " + width + " " + height,
        "xmlns": "http://www.w3.org/2000/svg",
        "xmlns:xlink": "http://www.w3.org/1999/xlink",
        "version": "1.1"
      },
      "defs": {
        "style": ".way { fill: #333333; fill-opacity: 1; stroke:#333333; stroke-opacity: 1; stroke-width:1;}"
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

  fs.writeFile('output/elevation.svg', xml, function (err) {
    if (err) return console.log(err);
  });
}

function generateMapSVG(path, x, y, width, height) {
  let obj = {
    svg: {
      $: {
        "id": "track",
        "viewBox": y + " " + x + " " + height + " " + width,
        "xmlns": "http://www.w3.org/2000/svg",
        "xmlns:xlink": "http://www.w3.org/1999/xlink",
        "version": "1.1"
      },
      "defs": {
        "style": ".way { fill: none; fill-opacity: 0; stroke:#333333; stroke-opacity: 1; stroke-width:4;}"
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

  fs.writeFile('output/track.svg', xml, function (err) {
    if (err) return console.log(err);
  });
}

