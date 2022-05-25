/**
 * Aufgabe 4, Geosoft 1, SoSe 2022
 * @author {Tobias Krumrein}   matr.Nr.: {506269}
 */

"use strict";

//declaration of global variables
var haltestellen = [];
var haltestellenInBbox = [];
var naechsteHaltestelle;
var point;


/**
 * @function onLoad function that is executed when the page is loaded
 */
function onLoad() {
  //event listener
  document.getElementById("refreshBtn").addEventListener("click",
    () => {
      refresh()
    }
  );
  document.getElementById("getLocationBtn").addEventListener("click",
    () => {
      var x = document.getElementById("userPosition");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
        navigator.geolocation.getCurrentPosition(displayLocation);
      } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
      }
    }
  );

  //Haltestellen bekommen
  getHaltestellen();
}

//##############################################################################
//## FUNCTIONS
//##############################################################################

/**
 * @function main the main function
 */
function main(point, pointcloud) {
  //sortiere Daten nach distanz und mach damit eine Tabelle auf der HTML-Seite
  let results = sortByDistance(point, pointcloud);
  drawTable(results);
}

/**
 * @function refresh
 * @desc is called when new coordinates are inserted. refreshes the data on the site
 */
function refresh() {
  let positionGeoJSON = document.getElementById("userPosition").value;

  //remove all table rows
  var tableHeaderRowCount = 1;
  var table = document.getElementById('resultTable');
  var rowCount = table.rows.length;
  for (var i = tableHeaderRowCount; i < rowCount; i++) {
    table.deleteRow(tableHeaderRowCount);
  }

  try {
    positionGeoJSON = JSON.parse(positionGeoJSON);
    //check validity of the geoJSON. it can only be a point
    if (validGeoJSONPoint(positionGeoJSON)) {
      point = positionGeoJSON.features[0].geometry.coordinates;
      main(point, haltestellen);
    } else {
      alert("invalid input.please input a single valid point in a feature collection");
    }
  } catch (error) {
    console.log(error);
    alert("invalid input. see console for more info.");
  }
}

/**
 * @function sortByDistance
 * @desc takes a point and an array of points and sorts them by distance ascending
 * @param point array of [lon, lat] coordinates
 * @param pointArray array of points to compare to
 * @returns Array with JSON Objects, which contain coordinate and distance
 */
function sortByDistance(point, pointArray) {
  let output = [];

  for (let i = 0; i < pointArray.length; i++) {
    let distance = twoPointDistance(point, pointArray[i].coordinates);
    let j = 0;
    //Searches for the Place
    while (j < output.length && distance > output[j].distance) {
      j++;
    }
    let newPoint = {
      coordinates: pointArray[i].coordinates,
      distance: distance.toFixed(2),
      name: pointArray[i].lbez,
      richtung: pointArray[i].richtung,
      aURL: pointArray[i].aURL
    };

    output.splice(j, 0, newPoint);
  }
  // Die nächstgelegene Haltestelle abspeichern
  naechsteHaltestelle = output[0];

  // ruft getAbfahrten() auf um die Abfahrten der Busse an der nächstgelegenen Bushaltestelle in den nächsten 5 Minuten zu berechnen
  getAbfahrten(naechsteHaltestelle);

  return output;
}

/**
 * @function twoPointDistance
 * @desc takes two geographic points and returns the distance between them. Uses the Haversine formula (http://www.movable-type.co.uk/scripts/latlong.html, https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula)
 * @param start array of [lon, lat] coordinates
 * @param end array of [lon, lat] coordinates
 * @returns the distance between 2 points on the surface of a sphere with earth's radius
 */
function twoPointDistance(start, end) {
  //variable declarations
  var earthRadius; //the earth radius in meters
  var phi1;
  var phi2;
  var deltaLat;
  var deltaLong;

  var a;
  var c;
  var distance; //the distance in meters

  //function body
  earthRadius = 6371e3; //Radius
  phi1 = toRadians(start[1]); //latitude at starting point. in radians.
  phi2 = toRadians(end[1]); //latitude at end-point. in radians.
  deltaLat = toRadians(end[1] - start[1]); //difference in latitude at start- and end-point. in radians.
  deltaLong = toRadians(end[0] - start[0]); //difference in longitude at start- and end-point. in radians.

  a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLong / 2) * Math.sin(deltaLong / 2);
  c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  distance = earthRadius * c;

  return distance;
}

/**
 * @function validGeoJSONPoint
 * @desc funtion that validates the input GeoJSON so it's only a point
 * @param geoJSON the input JSON that is to be validated
 * @returns boolean true if okay, false if not
 */
function validGeoJSONPoint(geoJSON) {
  if (geoJSON.features.length == 1 &&
    geoJSON.features[0].geometry.type.toUpperCase() == "POINT"
  ) {
    return true;
  } else {
    return false;
  }
}

/**
 * @function toRadians
 * @desc helping function, takes degrees and converts them to radians
 * @returns a radian value
 */
function toRadians(degrees) {
  var pi = Math.PI;
  return degrees * (pi / 180);
}

/**
 * @function toDegrees
 * @desc helping function, takes radians and converts them to degrees
 * @returns a degree value
 */
function toDegrees(radians) {
  var pi = Math.PI;
  return radians * (180 / pi);
}

/**
 * @function drawTable
 * @desc Die 10 nächsten Bushaltestellen von dem Punkt in einer Tabelle ausgeben
 * @param {*} results array of JSON with contains
 */
function drawTable(results) {
  var table = document.getElementById("resultTable");
  //creates the Table with the 
  for (var j = 0; j < 10; j++) {
    var newRow = table.insertRow(j + 1);
    var cel1 = newRow.insertCell(0);
    var cel2 = newRow.insertCell(1);
    var cel3 = newRow.insertCell(2);
    var cel4 = newRow.insertCell(3);
    cel1.innerHTML = results[j].coordinates;
    cel2.innerHTML = results[j].name;
    cel3.innerHTML = results[j].richtung;
    cel4.innerHTML = results[j].distance;
  }
}

/**
 * @function drawTableAbfahrt()
 * @desc gibt die Ergebnisse in einer Tabelle aus
 * @param {*} res Array der Abfahrtsattribute in den nächsten 5 Minuten von nächster Bushaltestelle
 */
function drawTableAbfahrt(res) {
  var table = document.getElementById("resultTableAbfahrt");
  for (var j = 0; j < res.length; j++) {
    var newRow = table.insertRow(j + 1);
    var cel1 = newRow.insertCell(0);
    var cel2 = newRow.insertCell(1);
    var cel3 = newRow.insertCell(2);
    var cel4 = newRow.insertCell(3);
    cel1.innerHTML = res[j].linienid;
    cel2.innerHTML = res[j].lbez;
    cel3.innerHTML = res[j].richtungstext;
    cel4.innerHTML = verbleibendeZeit(res[j].ankunftszeit);
  }
}

/**
 * @function arrayToGeoJSON
 * @desc function that converts a given array of points into a geoJSON feature collection.
 * @param inputArray Array that is to be converted
 * @returns JSON of a geoJSON feature collectio
 */
function arrayToGeoJSON(inputArray) {
  //"Skeleton" of a valid geoJSON Feature collection
  let outJSON = {
    "type": "FeatureCollection",
    "features": []
  };
  //skelly of a (point)feature
  let pointFeature = {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Point",
      "coordinates": []
    }
  };

  //turn all the points in the array into proper features and append
  for (const element of inputArray) {
    let newFeature = pointFeature;
    newFeature.geometry.coordinates = element;
    outJSON.features.push(JSON.parse(JSON.stringify(newFeature)));
  }

  return outJSON;
}

/**
 * @function showPosition
 * @desc Shows the position of the user in the textares
 * @param {*} position Json object of the user
 */
function showPosition(position) {
  var x = document.getElementById("userPosition");
  //"Skeleton" of a valid geoJSON Feature collection
  let outJSON = {
    "type": "FeatureCollection",
    "features": []
  };
  //skelly of a (point)feature
  let pointFeature = {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Point",
      "coordinates": []
    }
  };
  pointFeature.geometry.coordinates = [position.coords.longitude, position.coords.latitude];
  //add the coordinates to the geoJson
  outJSON.features.push(pointFeature);
  x.innerHTML = JSON.stringify(outJSON);
}

/**
 * @function getHaltestellen()
 * @description mit fetch Haltestellen-Array erstellen 
 */
async function getHaltestellen() {
  const API_URL = "https://rest.busradar.conterra.de/prod";
  const response = await fetch(API_URL + `/haltestellen`);
  const data = await response.json();
  let res = data;
  for (var i = 0; i < res.features.length; i++) {
    haltestellen[i] = new Haltestelle(
      res.features[i].properties.nr,
      res.features[i].properties.lbez,
      res.features[i].properties.richtung,
      res.features[i].geometry.coordinates
    )
  }
  main(point, haltestellen);
}

/**
 * @function getAbfahrten()
 * @description gibt die Abfahrten zu der nächstgelegenen Bushaltestelle aus mit Hilfe von fetch
 * @param {*} naechsteHaltestelle Ein array mit der nächstgelegenen Haltestelle wird übergeben  
 */
async function getAbfahrten(naechsteHaltestelle) {
  let resource = naechsteHaltestelle.aURL;
  const response = await fetch(resource);
  const data = await response.json();
  let res = data;
  let message = "";
  if (res.length > 0) {
    message = 'Hier sind die Busse, die von ' + naechsteHaltestelle.name + ' abfahren:';
    document.getElementById('AbfahrtVon').innerHTML = message;
    drawTableAbfahrt(res);
  } else {
    message = "Leider fahren in den nächsten 5 Minuten keine Busse von der Haltestelle " + naechsteHaltestelle.name + ".";
    document.getElementById('AbfahrtVon').innerHTML = message;
  }
}

/**
 * @function verbleibendeZeit()
 * @description Die Funktion soll die Zeit bis der nächste Bus von der nächsten Station kommt ausrechnen
 * @param {*} sekunden 
 * @returns String verbleibende Zeit bis der Bus kommt in Minuten und Sekunden
 */
function verbleibendeZeit(sekunden) {
  var akutellesDatum = new Date();
  akutellesDatum = akutellesDatum.getTime() / 1000;
  var verbleibendeZeit = sekunden - akutellesDatum;
  var verbleibendeZeitMin = Math.floor(verbleibendeZeit / 60);
  var verbleibendeZeitSek = Math.round(verbleibendeZeit % 60);
  var verbleibendeZeitZ = verbleibendeZeitMin + "Min " + verbleibendeZeitSek + "Sek";
  return verbleibendeZeitZ
}

/**
 * Leafletkarte erstellen
 */
var map = new L.Map('muenstersHaltestellen', {
  center: new L.LatLng(51.96, 7.627),
  zoom: 13
});
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

/**
 * @desc zeigt auf der Leafletkarte die aktuelle Position des Nutzers als Marker mit Popup zur Position an
 * @param position aktuelle Position des Nutzers mithilfe von getLocation() 
 * @return marker mit Popup vom aktuellen Standort
 */
function displayLocation(position) {
  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  var marker = L.marker([lat, lng]).addTo(map);
  marker.bindPopup("Aktueller Standort: " + lat + " " + lng);
  marker.openPopup();;
  map.setView([lat, lng], 13);
}


var bbox = [] 

// Werkzeuge für Leaflet erstellen
var drawnItems = new L.FeatureGroup()
var drawControl = new L.Control.Draw({
  draw: {
    polygon: false,
    marker: false,
    circle: false,
    polyline: false,
    circlemarker: false
  },
  edit: {
    featureGroup: drawnItems
  }
})
// Beides in die Karte einladen
map.addLayer(drawnItems)
map.addControl(drawControl)

map.on(L.Draw.Event.CREATED, (e) => {
  var type = e.layerType;
  var layer = e.layer;
  bbox = layer.toGeoJSON().geometry.coordinates;
  drawnItems.addLayer(layer);
  map.addLayer(layer);

  var haltestellenInBbox = sortByDistance(point, haltestellen);

  for (var i = 0; i < haltestellenInBbox.length; i++) {

    var poly = turf.polygon(bbox);
    var pt = turf.point(haltestellenInBbox[i].coordinates);

    
    turf.booleanPointInPolygon(pt, poly)
    if (turf.booleanPointInPolygon(pt, poly) == true) {
    let marker = new L.marker([haltestellenInBbox[i].coordinates[1], haltestellenInBbox[i].coordinates[0]], {
        
      }).addTo(map)
      
      marker.bindPopup("Koordinaten: " + haltestellenInBbox[i].coordinates + "<br> Bushaltestellenname: " + haltestellenInBbox[i].name +
        "m <br> Richtung: " + haltestellenInBbox[i].richtung + "<br> Distanz (in Meter): " + haltestellenInBbox[i].distance)
        
    } 
  }
})
