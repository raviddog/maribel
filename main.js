

// main module

// create Maribel and Renko
let config = require('./config.json');

var Maribel = require('./maribel.js');
var Renko = require('./renko.js');
var Keine = require('./keine.js');

Maribel.setRenko(Renko);
Renko.setMaribel(Maribel);

let IS_DEBUG_ON = config.DEBUG_MODE;

Maribel.initialize(IS_DEBUG_ON);
Renko.initialize(IS_DEBUG_ON);

if (IS_DEBUG_ON) {
	// how do I test locally? without connect hope
	Maribel.debugOrganize();
}