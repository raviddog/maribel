

let MAX_REPLAYS_PER_THEATER = 8;
let API = {};
let moment = require('moment');
module.exports = API;

API.organizeReplays = function(replays) {
	// given a list of active replays, sort them into theaters

	console.log(replays);

	// could clean, for now just assume array of replay objects
	let replaysByTheater = {};

	for (let i = 0, ii = replays.length; i<ii; i++) {
		let r = replays[i];
		let key = r.theater_date || null;
		if (!replaysByTheater[key]) {
			replaysByTheater[key] = {
				replays: [],
				next_order: 10
			};
		}
		if (key) {

		}

		replaysByTheater[key].replays.push(r);
		replaysByTheater[key].next_order = Math.max(replaysByTheater[key].next_order, r.theater_order+10);
	}

	// invariant: should have grouped list by theater_date, now organize those without a date
	// default case
	console.log(replaysByTheater);
	if (!Object.keys(replaysByTheater).length) {
		replaysByTheater["2019-11-17"] = {
			replays: [],
			next_order: 10
		};
	}

	let dates = Object.keys(replaysByTheater).filter(function(x) { return x != null && x != 'null'; });

	dates.sort();
	console.log(dates);


	// XXX: use created date if possible, for now just sort by physical order
	// TODO: force same author replays into a separate theater if possible
	for (let i = 0, ii = replays.length; i<ii; i++) {
		let r = replays[i];
		let targetDate = null;
		if (r.theater_date) {
			continue;
		}

		// XXX: going fast can be more efficient I guess
		// toy code so not worrying
		for (let j = 0, jj = dates.length; j<jj; j++) {
			targetDate = dates[j];
			if (replaysByTheater[targetDate].replays.length < MAX_REPLAYS_PER_THEATER) {
				break;
			}
			targetDate = null;
			
		}

		// no theater found
		if (targetDate == null) {
			// take last date and add
			let newDate = moment(dates[dates.length-1]).add(1,"w").format("YYYY-MM-DD");
			dates.push(newDate);

			// XXX: support fox being a bitchass and not presubmitting replays
			let placeholder = {
				user: 'TRT HOST',
				url: 'about: blank',
				notes: 'TRT HOST opening replay placeholder',
				theater_date: newDate,
				theater_order: 0
			}
			replays.push(placeholder);
			replaysByTheater[newDate] = {
				replays: [placeholder],
				next_order: 10
			};
			targetDate = newDate;
		}
		console.log(targetDate, r.user, i);


		// found a good date place it into the theater
		r.theater_date = targetDate;
		r.theater_order = replaysByTheater[targetDate].next_order;
		replaysByTheater[targetDate].next_order += 10;
		replaysByTheater[targetDate].replays.push(r);
	}
	delete replaysByTheater[null];

	// debug out
	let debugKeys = Object.keys(replaysByTheater);
	for (let i = 0, ii = debugKeys.length; i<ii; i++) {
		console.log(debugKeys[i], replaysByTheater[debugKeys[i]].replays);
	}

	//save as needed
};

API.changeTheaterDate = function(replays, oldDate, newDate) {
	replays.each(function(r) {
		if (r.theater_date == oldDate) {
			r.theater_date = newDate;
		}
	});

	//save as needed
};

API.swapReplay = function(r1, r2) {
	// get replays from ids if needed
	let tmp = r1.theater_date;
	r1.theater_date = r2.theater_date;
	r2.theater_date = tmp;
	tmp = r1.theater_order;
	r1.theater_order = r2.theater_order;
	r2.theater_order = tmp;

	//save as needed
}