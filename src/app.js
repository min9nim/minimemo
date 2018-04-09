import {mm, randomcolor, $m, Vue, _} from "../src/mm.js";
//import $m from "../src/util.js";
//import Vue from "../ext/vue.js";
//const _ = require('../ext/partial.js');

window._ = _;
window.mm = mm;
window.$m = $m;

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
        bgcolor : function(){
            return `background-color:${randomcolor(app.user.iconColor)};`;
        }
    },
    computed : {
    },
    watch: {

    }
});

mm.init();
