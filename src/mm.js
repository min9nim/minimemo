import $m from "../src/util.js";

const $ = require("../ext/jquery.js");
const $nprogress = require("../ext/nprogress.js");
const $randomcolor = require("../ext/randomColor.js");
const $shortcut = require("../ext/shortcut.js");
const Vue = require("../ext/vue.js");
const _ = require('../ext/partial.js');

var mm = {};

export {mm, randomcolor, $m, Vue, _}

var userInfo = null // 로그인한 사용자 정보
    , memoRef
    , memoList = []
    , visibleRowCnt = 50
;

mm.memoList = memoList;

// local function
function showMemoList(uid) {
    $m(".state").html("");
    firebase.database().ref("memos/" + uid).limitToLast(visibleRowCnt).once("value").then(function (snapshot) {
        $m._each(snapshot.val(), function(val, key){
            addItem(key, val, "append");
        });
    });
}

function initMemoList(uid) {
    //timelog("전체메모 조회 전");
    memoRef = firebase.database().ref("memos/" + uid);
    memoRef.on("child_added", onChildAdded);
    memoRef.on("child_changed", onChildChanged);
    memoRef.on("child_removed", onChildRemoved);
    memoRef.once('value', function(snapshot) {
        //timelog("전체메모 조회 후");
        $m(".header .title").html(app.user.nickname + "'s " + memoList.length + " memos");
        $nprogress.done();
    });
}

function addItem(key, memoData, how, word) {
    const memo = {
        key: key,
        createDate : (new Date(memoData.createDate)).toString().substr(4, 17),
        firstTxt : memoData.txt.substr(0, 1).toUpperCase(),
        txt : _format_txt(memoData.txt, word),
    }

    if(how === "append"){
        app.memos.splice(0, 0, memo);
    }else{
        app.memos.push(memo);

    }

    // 오른쪽 끝 컨텍스트버튼 이벤트 처리
    Vue.nextTick(function() {
        setContextBtnEvent($("#" + key + " .btnContext"));
        setTouchSlider($("#" + key));
    });
}

function _br_nbsp_link(str, word){
    if(word){
        var reg = new RegExp("("+word+")", "gi");
    }

    return str.split("\n").map(function(val){
        return val.split(" ").map(function(val){
            var newval = val.replace(/</gi, "&lt;").replace(/>/gi, "&gt;")  // XSS 방어코드
            if(word){ // 매칭단어 하이라이트
                newval = newval.replace(reg, '<span style="background-color:yellow;">$1</span>');
            }
            if(val.indexOf("http://") == 0 || val.indexOf("https://") == 0){
                return `<a href="${val}" target="_blank">${newval}</a>`;
            }else{
                return newval;
            }
        }).join("&nbsp;");   // 공백문자 &nbsp; 치환
    }).join("<br/>");   // 새줄문자 <br/> 치환
}


function _format_txt(str, word){
     var _link = (val, word) => {
        var newval = val.replace(/</gi, "&lt;").replace(/>/gi, "&gt;")  // XSS 방어코드
        if(word){ // 매칭단어 하이라이트
            var reg = new RegExp("("+word+")", "gi");
            newval = newval.replace(reg, '<span style="background-color:yellow;">$1</span>');
        }
        if(val.indexOf("http://") == 0 || val.indexOf("https://") == 0){
            return `<a href="${val}" target="_blank">${newval}</a>`;
        }else{
            return newval;
        }
    }

    _link = $m._curryr(_link)(word);

    return $m._go(
        str.split("\n"),
        $m._map(val => $m._go(
                val.split(" "),
                $m._map(_link),
                $m._join("&nbsp;")
            )),
        $m._join("<br/>")
    );
}



function inPlaceMemo(){
    // 왼쪽으로 이동된 row들 제자리로 잡아두기
    _.go(
        $m("#list li").doms,
        _.filter(v => $m(v).css("left") === "-100px"),
        _.each(v => $(v).animate({left: "0px"}, 300, () => $m("#"+v.id + " .btnContext").text("<<"))
        )
    );
}


function onChildAdded(data) {
    inPlaceMemo();
    memoList.push(data);
    var curDate = Date.now();
    var createDate = data.val().createDate;
    var diff = curDate - createDate;
    //console.log(diff);
    if (diff < 1000) {// 방금 새로 등록한 글인 경우만
        addItem(data.key, data.val(), "append");
        if ($m(".state").html() === "") {
            $m(".header .title").html(app.user.nickname + "'s " + memoList.length + " memos");
        } else {
            $m(".header .title").html(memoList.length + " memos");
        }
    }
}


function onChildChanged(data) {
    inPlaceMemo();
    var key = data.key;
    var memoData = data.val();

    var idx = $m._findIndex(mm.memoList, o => o.key === key);
    mm.memoList.splice(idx, 1, data);

    var vm_memo = $m._find(app.memos, o => o.key === key);
    vm_memo.createDate = (new Date(memoData.createDate)).toString().substr(4, 17);
    vm_memo.firstTxt = memoData.txt.substr(0, 1).toUpperCase();
    vm_memo.txt = _br_nbsp_link(memoData.txt);

    // 오른쪽 끝 컨텍스트버튼 이벤트 처리
    Vue.nextTick(function(){
        setContextBtnEvent($("#" + key + " .btnContext"));
    });
}

function onChildRemoved(data) {
    inPlaceMemo();
    const key = data.key;
    app.memos.splice(_.findIndex(app.memos, o => o.key === key), 1);
    //$m("#" + key).remove();
    memoList.splice(memoList.indexOf(data), 1);  // memoList에서 삭제된 요소 제거
    $m(".header .title").html(app.user.nickname + "'s " + memoList.length + " memos");
}


function setHeader() {
    if (userInfo) {
        //$m("#nickname").val(app.user.nickname);
        $m.val("#nickname", app.user.nickname);
        //$m("#fontSize").val(app.user.fontSize.replace("px", ""));
        $m.val("#fontSize", app.user.fontSize.replace("px", ""));
        //$m("#iconColor").val(app.user.iconColor);
        $m.val("#iconColor", app.user.iconColor);
        mm.iconColor(app.user.iconColor)
    } else {
        //$m(".header .title").html("minimemo");
        $m.html(".header .title", "minimemo");
    }
}


function setContextBtnEvent(btn) {
    btn.bind("click", function () {
        if (btn.text() == "<<") {
            btn.parent().parent().animate({left: "-100px"}, 300, () => btn.text(">>"));
        } else {
            btn.parent().parent().animate({left: "0px"}, 300, () => btn.text("<<"));
        }
    });
}

function setTouchSlider(row) {
    var start_x, diff_x;
    var start_y, diff_y;
    var dom_start_x;

    function touchstart(e) {
        start_x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
        start_y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
        dom_start_x = $m(this).position().left;  // 터치시작할 때 최초 dom요소의 x위치를 기억하고 있어야 함
    }

    function touchmove(e) {
        diff_x = (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX) - start_x;
        diff_y = (e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY) - start_y;
        if (Math.abs(diff_x) > Math.abs(diff_y * 4)) {
            $m(this).css("left", dom_start_x + diff_x);
        }
    }

    function touchend() {
        if (diff_x < -50) {
            $(this).animate({left: "-100px"}, 300);
        } else {
            $(this).animate({left: "0px"}, 300);
        }
    }

    row.bind("touchstart", touchstart);
    row.bind("touchmove", touchmove);
    row.bind("touchend", touchend);
}


mm.signOut = function () {
    if(confirm("로그아웃 합니다")){
        firebase.auth().signOut().then(function () {
            location.href="/login.html"
        }, function (error) {
            console.error("Sign Out Error", error);
        });
    }
}

mm.searchFirstTxt = function (obj) {
    //var firstTxt = event.target.innerText;
    var firstTxt = obj.innerText;

    app.memos = [];
    var reg = new RegExp(firstTxt, "i");
    $m._each(mm.memoList, function(memo){
        var res = reg.exec(memo.val().txt);
        if (res !== null && res.index == 0) {
            addItem(memo.key, memo.val(), "append", firstTxt);
        }
    });

    $m(".header .title").html(memoList.length + " memos");
    $m(".header .state").html(`> <span style="font-style:italic;">${firstTxt}</span> 's ${app.memos.length} results`);
}

function setShortcut(){
    // 단축키 설정
    $shortcut.add("Alt+W", function () {
        mm.writeMemo();
    });
    $shortcut.add("Meta+W", function () {
        mm.writeMemo();     // 이게 안 잡히네.. ㅠ
    });
    $shortcut.add("Alt+S", function () {
        mm.searchClick();
    });
    $shortcut.add("Meta+S", function () {
        mm.searchClick();
    });

}


function randomcolor(color){
    return $randomcolor({hue: color || "all", luminosity: "dark"});
}

function login(){
    //timelog("로그인 전");
    firebase.auth().onAuthStateChanged(function (user) {
        //timelog("로그인 후");
        if (user) {// 인증완료
            mm.userInfo = userInfo = user;
            showMemoList(userInfo.uid);
            $m("#writeBtn").show();

            //timelog("사용자 정보 로드 전");
            var userRef = firebase.database().ref("users/" + userInfo.uid);
            userRef.once('value').then(function (snapshot) {
                //timelog("사용자 정보 로드 후");
                if (snapshot.val()) {
                    app.user = JSON.parse(JSON.stringify(snapshot.val()));
                    setHeader();
                    $m._each($m("#list li .circle").doms, _($m.css, _, "background-color", randomcolor(app.user.iconColor)));
                    $m._each($m("#list li .txt").doms, _($m.css, _, "font-size", app.user.fontSize));
                } else {// 신규 로그인 경우
                    app.user = {
                        fontSize: "18px",
                        iconColor: "green",
                        email: userInfo.email,
                        nickname: userInfo.email.split("@")[0]
                    };
                    userRef.set(app.user, setHeader);
                }
                initMemoList(userInfo.uid);
            });
        } else {
            location.href = "/login.html";
            /*
            userInfo = null;
            setHeader();
            $nprogress.done();
            if (confirm("로그인이 필요합니다")) {
                firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
            }
            */
        }
    });
}

function conOn () {
    if (userInfo != null){
        userInfo.isConnected = true;
    }
    $m("#writeBtn").show();
    $m("#addBtn").html("쓰기");
}

function conOff () {
    if (userInfo != null){
        userInfo.isConnected = false;
    }
    $m("#writeBtn").hide();
    setTimeout(function () {// 20초 동안 연결이 끊어져 있는 경우라면
        if (userInfo.isConnected == false) {
            $m("#writeBtn").show();
            $m("#addBtn").html("로긴");
        }
    }, 20000);
    //alert("연결상태가 끊어졌습니다.");
}

mm.setNickname = function (nickname) {
    app.user.nickname = nickname;
    firebase.database().ref("users/" + userInfo.uid).update(app.user);
    $m(".header .title").html(app.user.nickname + "'s " + memoList.length + " memos");
};

mm.setFontSize = function (size) {
    app.user.fontSize = app.user.fontSize = size + "px";
    firebase.database().ref("users/" + userInfo.uid).update(app.user);
    //$m(".txt").css("font-size", app.user.fontSize);
    $m.css(".txt", "font-size", app.user.fontSize);
};

mm.setIconColor = function (color) {
    app.user.iconColor = color;
    firebase.database().ref("users/" + userInfo.uid).update(app.user);
    mm.iconColor(color);
};

mm.iconColor = function(color){
    $m._each($m("#list i.circle").doms, _($m.css, _, "background-color", randomcolor(color)))

    $m._each([".header", "#topNavi", "#btn_search", "#btn_cancel"], _($m.css, _, "background-color", randomcolor(color)))

    var color2 = randomcolor(color);
    $m.css("#addBtn", "background-color", color2);
    $m.css($m("#addBtn").parent(), "background-color", color2);

}


mm.bodyScroll = function () {
    if ($m(".state").html() != "") {// 검색결과 일때
        return;
    }

    if (window.scrollY == $(document).height() - $(window).height()) {
        $nprogress.start();
        $m("#nprogress .spinner").css("top", "95%");
        var end = memoList.length - $m("#list li").length;
        var start = end - visibleRowCnt < 0 ? 0 : end - visibleRowCnt;
        var nextList = memoList.slice(start, end).reverse();

        $m._each(nextList, x => addItem(x.key, x.val()))

        $nprogress.done();
    }
};

mm.topNavi = function () {
    $m.scrollTo("", 0);
};

mm.titleClick = function () {
    if (userInfo) {
        showMemoList(userInfo.uid);
    } else {
        //firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
        location.href = "/login.html";
    }
};


mm.init = function () {
    $nprogress.start();  // https://github.com/rstacruz/nprogress
    login();
    setShortcut();
    firebase.database().ref(".info/connected").on("value", function (snap) {
        if (snap.val()) {
            conOn();
        } else {
            conOff();
        }
    });
};


mm.listClick = function () {
    $(".menu").animate({left: "-220px"}, 300);
};


mm.cancelWrite = function () {
    //$m(".dialog").css("display", "none");
    $m.css(".dialog", "display", "none");
};


mm.searchMemo = function () {
    var word = $m("#input2").val().trim();

    if (word.length > 100) {
        alert("100자 이내로 입력 가능");
        return;
    }
    if (word === "") {
        alert("내용을 입력해 주세요");
        return;
    }

    $m(".search").css("display", "none");


    app.memos = [];
    $m._each(mm.memoList, function(memo){
        if (memo.val().txt.toLowerCase().indexOf(word.toLowerCase()) >= 0) {
            addItem(memo.key, memo.val(), "append", word);
        }
    });

    $m.html(".header .title", memoList.length + " memos")
    $m.html(".header .state", `> <span style="font-style:italic;">${word}</span> 's ${app.memos.length} results`)
};


mm.saveMemo = function () {
    var key = $m("#input").attr("key");
    var txt = $m("#input").val().trim();

    if (txt.length > 60000) {
        alert("60000자 이내로 입력 가능");
        return;
    }
    if (txt === "") {
        alert("내용을 입력해 주세요");
        return;
    }

    $m(".dialog").css("display", "none");

    if (key == "") {// 저장
        firebase.database().ref("memos/" + userInfo.uid).push({
            txt: txt,
            createDate: Date.now(),
            updateDate: Date.now()
        });
    } else {// 수정
        firebase.database().ref("memos/" + userInfo.uid + "/" + key).update({
            txt: txt,
            updateDate: Date.now()
        });
    }
};


mm.menuClick = function () {
    if ($m(".menu").css("left") == "0px") {
        $(".menu").animate({left: "-220px"}, 300);
    } else {
        $(".menu").animate({left: "0px"}, 300);
    }
};


mm.removeMemo = function (key) {
    if (userInfo && userInfo.isConnected) {
        if (confirm("삭제하시겠습니까?")) {
            firebase.database().ref("memos/" + userInfo.uid + "/" + key).remove();
        }
    } else {
        alert("로그인이 필요합니다");
    }
};

mm.editMemo = function (key) {
    if (userInfo && userInfo.isConnected) {
        firebase.database().ref("memos/" + userInfo.uid + "/" + key).once("value").then(function (snapshot) {
            $m(".dialog").css("display", "block");
            $m(".dialog").css("top", window.scrollY);
            $m("#input").val(snapshot.val().txt);
            $m("#input").focus();
            $m("#input").attr("key", key);
        });
    } else {
        alert("로그인이 필요합니다");
    }
};


mm.writeMemo = function () {
    if (userInfo && userInfo.isConnected) {
        if ($m(".search").css("display") == "block") {
            return;     // 글검색 상태인 경우에는 취소
        }
        $m(".dialog").css("display", "block");
        $m("#input").val("");
        $m("#input").focus();
        $m("#input").attr("key", "");
    } else {
        if (confirm("로그인이 필요합니다"))
            firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
    }
};


mm.searchClick = function () {
    if (userInfo && userInfo.isConnected) {
        if ($m(".dialog").css("display") == "block") {
            return; // 글쓰기 상태라면 취소
        }
        $m(".search").css("display", "block");
        $m("#input2").val("");
        $m("#input2").focus();
    } else {
        alert("로그인이 필요합니다");
        //firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
    }
};


mm.cancelSearch = function () {
    $m(".search").css("display", "none");
};


mm.keydownCheck = function (event) {
    var keycode = (event.which) ? event.which : event.keyCode;
    if ((event.metaKey || event.altKey) && keycode == 13) {
        if ($m(".dialog").css("display") == "block") {
            mm.saveMemo();
        } else {
            mm.searchMemo();
        }
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
};
