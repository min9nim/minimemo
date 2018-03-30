
// Initialize Firebase
var config = {
    apiKey: "AIzaSyDrdUoYgtjhIGHOLxvEQtq3oUlximeEMI8",
    authDomain: "minimemo-3ea72.firebaseapp.com",
    databaseURL: "https://minimemo-3ea72.firebaseio.com",
    projectId: "minimemo-3ea72",
    storageBucket: "minimemo-3ea72.appspot.com",
    messagingSenderId: "55060595181"
};
firebase.initializeApp(config);

//var mm = require("./mm.js");
import mm from "./mm.js";

window.mm = mm;
mm.init();
