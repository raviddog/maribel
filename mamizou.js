const express = require('express');
const app = express();
let moment = require('moment');

var fs = require('fs');
var https = require('https');
// const sslcert = require('./ssl.json');
// var privateKey  = fs.readFileSync(sslcert.ssl.key, 'utf8');
// var certificate = fs.readFileSync(sslcert.ssl.cert, 'utf8');
// var cart = fs.readFileSync(sslcert.ssl.ca, 'utf8');
// var credentials = {key: privateKey, cert: certificate, ca: cart};

var Maribel = null;

module.exports = {
	setMaribel: function(x) {
		Maribel = x;
	},

	initialize: function() {
		app.listen(3000);
	}
};



app.set('view engine','hbs')


app.get('/schedule', function(req, res) {
	//console.log(req.query);
	var theaters = Maribel.getWebSchedule();
	var scheduled = Maribel.getScheduleID();
	var filtered = [];
	if(req.query.archive == 1) {
		//	view archive
		theaters.forEach(function(value, index) {
			if(!value.active) {
				if(index === scheduled) {
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
				if(index === scheduled) {
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



// var httpsServer = https.createServer(credentials, app);
// httpsServer.listen(4443);
