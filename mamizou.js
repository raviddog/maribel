const express = require('express');
const app = express();
const port = 3000;
const showdown = require('showdown');
let converter = new showdown.Converter({tables: true});
let moment = require('moment');
let bodyParser = require('body-parser');

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
	console.log(req.query);
	let scheduleRenderData = prepareScheduleFromReplayArray(
			Maribel.getReplays(),
			{
				showAll: req.query.all == 1
			}
	);
	res.render('schedule', scheduleRenderData);
});

app.get('/schedule', function(req, res) {
	console.log(req.query);
	let scheduleRenderData = prepareScheduleFromReplayArray(
		Maribel.getReplays(),
		{
			showAll: req.query.all == 1
		}
	);

	var htmltext = '<!DOCTYPE html><head><style>th, td {padding: 8px;\ntext-align: left;}\ntr:nth-child(even) {background-color: #e5e5e5;}\ntable {border: 1px solid black;}</style><title>TRT Schedule</title></head><body>';

	var markdowntext = "# TRT Slightly Less Beta Replay Schedule Listing\n\n";
	markdowntext += "This is the schedule page for Touhou Replay Theater, hosted every Sunday 7PM PST at <https://www.twitch.tv/touhou_replay_theater>.\n\n";
	
	if(req.query.all != 1) {
		markdowntext += "[View all replays](./schedule?all=1)\n\n";
	} else {
		markdowntext += "[View unshown replays](./schedule)\n\n";
	}

	//	do last week so that its guaranteed(?) to create a new heading
	var tempdate = moment().add(-7,'d').format('YYYY-MM-DD');

	if(req.query.all == 1) {
		//	set tempdate to the beginning of time i guess
		//	beginning of 2017 should do
		tempdate = moment("20170101", "YYYYMMDD");
	}
	
	scheduleRenderData.replays.forEach(function(cur, index) {
		if(cur.theater_date !== tempdate) {
			//	different date, create new heading
			tempdate = cur.theater_date;
			markdowntext += "\n\n## " + moment(tempdate, "YYYY-MM-DD").format("MMMM Do YYYY");
			markdowntext += "\n|ID |User |URL |Notes|\n|---|---|---|---|\n";
		}
		markdowntext += "|" + cur.id + "|" + cur.user + "|<" + cur.url + ">|" + cur.notes + "|\n";
	});

	markdowntext += "\n\nPage generated at " + moment().format("MMMM Do YYYY, h:mm:ss a");
	markdowntext += "\n\n[View the old schedule](./oldschedule)";

	htmltext += converter.makeHtml(markdowntext);
	htmltext += "</body></html>";

	res.send(htmltext);
});

// debug disable?
app.listen(port, function() {
	console.log(`mamizou module listening on ${port}`);
});

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
