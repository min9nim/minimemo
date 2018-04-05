
//var mm = require("./mm.js");
import mm from "./mm.js";
import Vue from "./ext/vue.js";
const $randomcolor = require("./ext/randomColor.js");

window.mm = mm;

window.app = new Vue({
    el: '#app',
    data: {
        title : "minimemo is loading..",
        memos : [],
        user : {
            "email":"",
            "fontSize":"",
            "iconColor":"",
            "nickname":""
        },
        mm : mm
    },
    methods: {

    },
    computed : {
        bgcolor : function(){
            return `background-color:${$randomcolor({hue: app.user.iconColor, luminosity: "dark"})};`;
        }
    },
    watch: {

    }
});

mm.init();




const R = require('./ext/ramda.js');
window.R = R;

const _ = require('./ext/partial.js');
window._ = _;

const $m = require("./util.js");
window.$m = $m;
