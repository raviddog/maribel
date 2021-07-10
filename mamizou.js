const express = require('express');
const app = express();
let moment = require('moment');

var fs = require('fs');
var http = require('http');

var Maribel = null;

module.exports = {
	setMaribel: function(x) {
		Maribel = x;
	},

	initialize: function() {
		// app.listen(3000);
		httpserver = http.createServer(app);
		httpserver.listen(8080);
		// httpsServer = https.createServer(credentials, app);
		// httpsServer.listen(4443);
		// httpsServer.listen(8080);
	}
};



app.set('view engine','hbs')


app.get('/schedule', function(req, res) {
	//console.log(req.query);
	var theaters = Maribel.getSchedule();
	var scheduled = Maribel.getScheduleID();
	var filtered = [];
	if(req.query.archive == 1) {
		//	view archive
		theaters.forEach(function(value, index) {
			if(!value.active) {
				if(index == scheduled) {
					//	scheduled to be shown so dont include
				} else {
					value.id = index;
					value.datetext = moment(value.date).format("MMMM Do YYYY");
					filtered.push(value);
				}
			}
		});
	} else {
		//	view live schedule
		theaters.forEach(function(value, index) {
			if(value.active) {
				value.id = index;
				filtered.push(value);
				value.datetext = moment(value.date).format("MMMM Do YYYY");
			} else {
				if(index == scheduled) {
					value.id = index;
					value.datetext = moment(value.date).format("MMMM Do YYYY");
					filtered.push(value);
				}				
			}
		});
	}

	var finaldata = {
		theaters: filtered,
		archive: req.query.archive
	};

	res.render('schedule', finaldata);


});




