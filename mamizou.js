const express = require('express');
const app = express();
const port = 3000;
let moment = require('moment');

var Maribel = null;

app.set('view engine','hbs')

app.get('/hello', function(req,res) {
	res.send("Hello from another world!");
});

app.get('/schedule', function(req,res) {
	let scheduleRenderData = prepareScheduleFromReplayArray(
			Maribel.getReplays()
	);
	res.render('schedule', scheduleRenderData);
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

function prepareScheduleFromReplayArray(replays) {
	let schedule = {
		timestamp: moment().format(),
	};
	// `git rev-parse HEAD`
	replaysCopy = Array.from(replays);
	replaysCopy.forEach(function(x,i) {
		x.id = i;
	})
	replaysCopy.sort(function(a,b) {
		if (a.theater_date == b.theater_date) {
			if (a.theater_date == null) {
				// fuck it
				return 0;
			} else {
				return a.theater_order - b.theater_order;
			}
		} else {
			if (a.theater_date > b.theater_date) {
				return 1;
			} else {
				return -1;
			}
		}
	});
	schedule.replays = replaysCopy;

	return schedule;
}