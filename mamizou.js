const express = require('express');
const app = express();
const port = 3000;

var Maribel = null;

app.get('/hello', function(req,res) {
	res.send("Hello from another world!");
});

app.get('/schedule', function(req,res) {
	res.send('implementing...');
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