

// main module

// create Maribel and Renko
var Maribel = require('./maribel.js');
var Renko = require("./renko.js");
var Mamizou = require("./mamizou.js");

Maribel.setRenko(Renko);
Renko.setMaribel(Maribel);
Mamizou.setMaribel(Maribel)

Maribel.initialize();
Renko.initialize();
Mamizou.initialize();