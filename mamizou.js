const express = require('express');
const app = express();
const port = 3000;

app.get('/hello', function(req,res) {
	res.send("Hello from another world!");
});

app.listen(port, function() {
	console.log(`mamizou module listening on ${port}`);
});

module.exports = {
	_app: app // do we expose it?
};