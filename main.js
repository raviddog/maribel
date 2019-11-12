

// main module

// create Maribel and Renko

var Maribel = require('./maribel.js');
var Renko = require('./renko.js');

Maribel.setRenko(Renko);
Renko.setMaribel(Maribel);

Maribel.initialize();
Renko.initialize();