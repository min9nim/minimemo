import {mm, randomcolor, $m, Vue, _} from "../src/mm.js";

window._ = _;
window.mm = mm;
window.$m = $m;

window.app = new Vue({
    el: '#app',
    data: {
        state : "",
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
        title : function(){
            if(mm.memoList.length === 0){
                return "minimemo is loading..";
            }else if(app.user.nickname && app.state === ""){
                return app.user.nickname + "'s " + mm.memoList.length + " memos";
            }else{
                return mm.memoList.length + " memos";
            }
        }
    },
    watch: {

    }
});

mm.init();
