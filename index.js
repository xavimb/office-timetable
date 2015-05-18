var fs = require('fs');
var express = require('express');
var request = require('request');
var _ = require('underscore');

var IndexTemplate = fs.readFileSync('./index.html').toString();
var Styles = fs.readFileSync('./styles.css').toString();

var app = express();

app.get('/', function (req, res) {
	request
		.get('http://www.pubtrans.it/hsl/reittiopas/departure-api?stops%5B%5D=1203402&stops%5B%5D=1203401', function (err, httpResponse, body) {
			if(err) {
				return res.status(500).send(err);
			}

			var departures = JSON.parse(body);
			
			departures = departures.sort(function(departure1, departure2) {
				var departureTime1 = departure1.rtime || departure1.time;
				var departureTime2 = departure2.rtime || departure2.time;
				return departureTime1 - departureTime2;
			});
			
			var departureTimes = _.map(departures, function(departure) {
					return { 
						line: departure.line,
						time: getTimeString(departure),
						destination: departure.dest
					}
				});
			
			departureTimes = _.filter(departureTimes, function(departure) { return !_.isUndefined(departure); });
			
			var timetableTemplate = _.template(IndexTemplate);
			res.send(timetableTemplate({
				departureTimes: departureTimes,
				styles: Styles
			}));
		});
});

function getTimeString(departure) {
	var nextDepartureDate = new Date((departure.rtime || departure.time) * 1000);
	var dateNow = new Date();

	if(nextDepartureDate < dateNow) { 
		return;
	}
	
	var remainingTimeInMs = nextDepartureDate - dateNow;
	var remainingTimeInSeconds = Math.floor(remainingTimeInMs / 1000);
	var remainingTimeInMinutes = Math.floor(remainingTimeInSeconds / 60);
	var remainingTimeInHours = Math.floor(remainingTimeInMinutes / 60);

	if(remainingTimeInHours > 24) {
		return;
	}

	var displayMinutes = ((remainingTimeInMinutes % 60) > 9 ? (remainingTimeInMinutes % 60) : "0" + (remainingTimeInMinutes % 60));
	var displayHours = ((remainingTimeInHours % 24) > 9 ? (remainingTimeInHours % 24) : "0" + (remainingTimeInHours % 24));
	
	return displayHours + " : " + displayMinutes; 
}

var server = app.listen(4000, function () {
  	console.log('App listening at port %s', server.address().port);
});
