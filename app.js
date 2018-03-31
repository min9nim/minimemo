
//var mm = require("./mm.js");
import mm from "./mm.js";

window.mm = mm;
mm.init();

const R = require('./ext/ramda.js');
window.R = R;
const $m = require("./util.js");
window.$m = $m;
