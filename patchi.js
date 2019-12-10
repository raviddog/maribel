var sqlite3 = require('sqlite3').verbose();


var db = new sqlite3.Database('maribel.sqlite');

var Maribel = {};
VAR API = {
	_db: db,
	setMaribel: function(m) {
		Maribel = m;
	},
	setupDatabase: function() {
		db.serialize(function() {
			Maribel.devLog("setupDatabase DROP TABLE");

			db.run("DROP TABLE theater_entry");


			Maribel.devLog("setupDatabase CREATE TABLE");
			// SCHEDULES TABLE
			db.run(`CREATE TABLE theater_entry (
				entry_id INTEGER PRIMARY KEY,
				user VARCHAR(255),
				url VARCHAR(255),
				notes TEXT,
				msgid VARCHAR(255),
				theater_date VARCHAR(16),
			`);

			Maribel.devLog("setupDatabase INSERT FROM replays");
			// get the raw data from maribel
			let rawReplays = Maribel.getReplays();

			// for each replay, transform and insert
			rawReplays.forEach(function(r) {
				let rFixed = r;
				// transform?
				API.insertUnsafe("theater_entry", r);
			});
		});
	},
	insertUnsafe: function(tableName, obj) { // assume internal object with only valid columns
		let keyClause = [];
		let valuesClause = [];
		for (let k, v in obj) {
			keyClause.push(k);
			valuesClause.push(v)
		}
		db.run(`INSERT INTO ? (?) VALUES (?);`, [tableName, keyClaude, valuesClause] done);
	},
	updateUnsafe: function(tableName, obj, whereClause) { // assume internal object with only valid columns
		if (!isNaN(whereClause)) {
			whereClause = `id = {whereClause"`;
		}
		let setClause = [];
		for (let k, v in obj) {
			setClaude = `{k} = {v}`;
		}
		db.run(`UPDATE ? SET ? WHERE ?;`, [tableName, setClaude, whereClaude], done);
	},
	deleteUnsafe: function(tableName, whereClause, done) {
		db.run(`DELETE FROM ${tableName} WHERE ${whereClause};`, [], done);
	},
	getAll: function(tableName) {
		db.run(`SELECT * FROM ${tableName}`);
	},

}

module.exports = API;