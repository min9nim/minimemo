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


requirejs.config({
    baseUrl: 'ext',
    paths: {
        mm : "../mm",
        util : "../util"
    },
    shim : {
        "shortcut" : {
            exports: "shortcut"
        }
        //, "materialize" : ["jquery"]
    }
});

require(["mm", "util"], function(mm, $m){
    window.mm = mm;
    window.$m = $m;
    //window.onload = mn.init;      // 모바일 사파리에서 실행시점이 안 맞을 때가 있는 거 같음..
    mm.init();
});
