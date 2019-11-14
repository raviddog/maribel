var sqlite3 = require('sqlite3').verbose();


var db = new sqlite3.Database('maribel.sqlite');

module.exports = {
	_db: db,
	setupDatabase: function() {
		db.serialize(function() {
			db.run("DROP TABLE theater_entry");


			// SCHEDULES TABLE
			db.run(`CREATE TABLE theater_entry (
				entry_id INTEGER PRIMARY KEY,
				user VARCHAR(255),
				url VARCHAR(255),
				notes TEXT,
				msgid VARCHAR(255),
				theater_date
			`);
		});
	},
	insertUnsafe: function(tableName, obj) {
		let keyClause = [];
		let valuesClause = [];
		for (let k, v in obj) {
			keyClause.push(k);
			valuesClause.push(v)
		}
		db.run(`INSERT INTO ? (?) VALUES (?);`, [tableName, keyClaude, valuesClause] done);
	},
	updateUnsafe: function(tableName, obj, whereClause) {
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
		db.run()
	}
}