const express = require('express');
const app = express();
let moment = require('moment');
let bodyParser = require('body-parser');
let _ = require('lodash');

var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('ssl/private.key', 'utf8');
var certificate = fs.readFileSync('ssl/certificate.crt', 'utf8');
var cart = fs.readFileSync('ssl/ca_bundle.crt', 'utf8');

const httpServer = http.createServer((req, res) => {
   res.statusCode = 301;
   res.setHeader('Location', `https://raviddog.site${req.url}`);
   res.end(); // make sure to call send() or end() to send the response
});

var credentials = {key: privateKey, cert: certificate, ca: cart};

var urlencodedParser = bodyParser.urlencoded({
	limit: '25MB'
});

var Maribel = null;

app.set('view engine','hbs')

app.get('/hello', function(req,res) {
	res.send("Hello from another world!");
});

app.all('/api/github/payload', urlencodedParser, function(req,res) {
	// console.log("got payload",req.url,req.query,req.body);
	let payload = JSON.parse(req.body.payload);
	Maribel.devLog("```"+JSON.stringify(payload, null, 2)+"```");
	res.send("ok");
});

app.get('/oldschedule', function(req,res) {
	res.redirect('/schedule');
});

app.get('/schedule', function(req, res) {
	//console.log(req.query);
	let scheduleData = prepareScheduleFromReplayArray(
		Maribel.getReplays(),
		{
			showAll: req.query.all == 1
		}
	);
	let theaters = _.groupBy(scheduleData.replays, 'theater_date')

	let theaterArray = [];

	_.forEach(theaters, function(theater_replays, k) {
		let t = {}
		t.replays = theater_replays;
		t.sort_date = k;
		t.display_date = moment(k, "YYYY-MM-DD").format("MMMM Do YYYY");
		theaterArray.push(t);
	});
	theaterArray = _.sortBy(theaterArray, 'sort_date');
	let scheduleRenderData = {
		theaters: theaterArray,
		allFlag: req.query.all,
		timestamp: scheduleData.timestamp
	};
	
	res.render('schedule', scheduleRenderData);
});

var httpsServer = https.createServer(credentials, app);

httpServer.listen(80);
httpsServer.listen(443);

// app.get('/json', function(req, res) {
// 	res.send(JSON.stringify(Maribel.getReplays()));
// });

// debug disable?
// app.listen(port, function() {
// 	console.log(`mamizou module listening on ${port}`);
// });



module.exports = {
	_app: app, // do we expose it?,
	setMaribel: function(x) {
		Maribel = x;
	}
};

function prepareScheduleFromReplayArray(replays, opts) {
	let schedule = {
		timestamp: moment().format(),
	};
	// `git rev-parse HEAD`
	replaysCopy = Array.from(replays);
	replaysCopy.forEach(function(x,i) {
		x.id = i;
	})
	if (!opts.showAll) {
		let todayMinus2 = moment().add(-2,'d').format('YYYY-MM-DD');
		replaysCopy = replaysCopy.filter(function(r) {
			return todayMinus2 < r.theater_date
		});
	}
	replaysCopy.sort(function(a,b) {
		if (a.theater_date == b.theater_date) {
			if (a.theater_date == null) {
				// fuck it
				return a.id - b.id;
			} else {
				return a.theater_order - b.theater_order;
			}
		} else {
			if (a.theater_date == null) {
				return 1;
			}
			if (!b.theater_date == null) {
				return -1;
			}
			if (a.theater_date > b.theater_date) {
				return 1;
			} else if (a.theater_date < b.theater_date) {
				return -1;
			}
		}
	});
	schedule.replays = replaysCopy;

	return schedule;
}
