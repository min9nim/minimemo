
const $ = require("../ext/jquery.js");
const $nprogress = require("../ext/nprogress.js");
const $randomcolor = require("../ext/randomColor.js");
const $shortcut = require("../ext/shortcut.js");
const $m = require("../src/util.js");
const Vue = require("../ext/vue.js");
const R = require('../ext/ramda.js');
const _ = require('../ext/partial.js');




var mm = {};
module.exports = mm;

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
        $m(".header .title").html(userInfo.data.nickname + "'s " + memoList.length + " memos");
        $nprogress.done();
    });
}

function addItem(key, memoData, how) {
    const memo = {
        key: key,
        createDate : (new Date(memoData.createDate)).toString().substr(4, 17),
        firstTxt : memoData.txt.substr(0, 1).toUpperCase(),
        txt : _br_nbsp_link(memoData.txt),
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

function getMemoHtml(key, memoData) {
    var txt = memoData.txt;
    var createDate = (new Date(memoData.createDate)).toString().substr(4, 17);
    var firstTxt = txt.substr(0, 1).toUpperCase();

    txt = _br_nbsp_link(txt);

    var removeBtn = "";
    var editBtn = "";
    if (typeof userInfo != null) {// 내가 작성한 글인 경우만 수정/삭제버튼이 표시
        removeBtn = `<i id="btn_delete" onclick='mm.removeMemo("${key}")' class="material-icons">delete</i>`;
        editBtn = `<i id="btn_edit" onclick='mm.editMemo("${key}")' class="material-icons">edit</i>`;
    }

    var color = $randomcolor({hue: userInfo.data ? userInfo.data.iconColor : "green", luminosity: "dark"});  // https://randomcolor.llllll.li/

    var liChild = `<i class="material-icons circle" style="background-color:${color};" onclick="mm.searchFirstTxt(this)">${firstTxt}</i>
            <p><i class="createDate">${createDate}</i><i class="btnContext"><<</i>
            <div class="txt" style="font-size:${userInfo.data ? userInfo.data.fontSize : "18px"};">${txt}</div></p>${removeBtn}${editBtn}`;

    var li = `<li id="${key}" class="collection-item avatar">${liChild}</li>`;
    var html = {};
    html.li = li;
    html.liChild = liChild;
    return html;
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
            $m(".header .title").html(userInfo.data.nickname + "'s " + memoList.length + " memos");
        } else {
            $m(".header .title").html(memoList.length + " memos");
        }
    }
}


function onChildChanged(data) {
    inPlaceMemo();
    var key = data.key;
    var memoData = data.val();

    _.go(
    	app.memos,
        _.find(o => o.key === key),
        function(res){
            res.createDate = (new Date(memoData.createDate)).toString().substr(4, 17);
            res.firstTxt = memoData.txt.substr(0, 1).toUpperCase();
            res.txt = _br_nbsp_link(memoData.txt);
        }
    )

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
    $m(".header .title").html(userInfo.data.nickname + "'s " + memoList.length + " memos");
}


function setHeader() {
    if (userInfo != null) {
        $m("#nickname").val(userInfo.data.nickname);
        $m("#fontSize").val(userInfo.data.fontSize.replace("px", ""));
        $m("#iconColor").val(userInfo.data.iconColor);
        mm.iconColor(userInfo.data.iconColor)
    } else {
        $m(".header .title").html("minimemo");
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
    memoRef.once("value").then(function (snapshot) {
        $m("#list").html("");
        var reg = new RegExp(firstTxt, "i");
        var memoObj = snapshot.val();

        $m._each(memoObj, function(val,key,list){
            var res = reg.exec(val.txt);
            if (res !== null && res.index == 0) {
                addItem(key, val);
            }
        });

        $m(".header .title").html(memoList.length + " memos");
        $m(".header .state").html(`> <span style="font-style:italic;">${firstTxt}</span> "s ${$m("#list li").length} results`);
        // 매칭단어 하이라이트닝
        $m(".txt").each(function (val, key, arr) {
            val.innerHTML = val.innerHTML.replace(firstTxt, `<span style="background-color:yellow;">${firstTxt}</span>`); // html태그 내용까지 매치되면 치환하는 문제가 있음
        });
    });
}

function setShortcut(){
    // 단축키 설정
    $shortcut.add("Alt+W", function () {
        mm.writeMemo();
    });
    $shortcut.add("Alt+S", function () {
        mm.searchClick();
    });
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
                if (snapshot.val() != null) {
                    userInfo.data = snapshot.val();
                    app.user = JSON.parse(JSON.stringify(userInfo.data));

                    setHeader();
                    $m("#list li .circle").each(function(val, key, arr){
                        var color = $randomcolor({hue: userInfo.data ? userInfo.data.iconColor : "all", luminosity: "dark"});  // https://randomcolor.llllll.li/
                        $m(val).css("background-color", color);
                    });
                    $m("#list li .txt").each(function(val, key, arr){
                        $m(val).css("font-size", userInfo.data.fontSize);
                    });

                } else {// 신규 로그인 경우
                    var userData = {
                        fontSize: "18px",
                        iconColor: "green",
                        email: userInfo.email,
                        nickname: userInfo.email.split("@")[0]
                    };
                    userRef.set(userData, function () {
                        userInfo.data = userData;
                        setHeader();
                    });
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
    userInfo.data.nickname = nickname;
    firebase.database().ref("users/" + userInfo.uid).update(userInfo.data);
    $m(".header .title").html(userInfo.data.nickname + "'s " + memoList.length + " memos");
};


mm.setFontSize = function (size) {
    app.user.fontSize = userInfo.data.fontSize = size + "px";
    firebase.database().ref("users/" + userInfo.uid).update(userInfo.data);
    $m(".txt").css("font-size", userInfo.data.fontSize);
};

mm.setIconColor = function (color) {
    userInfo.data.iconColor = color;
    firebase.database().ref("users/" + userInfo.uid).update(userInfo.data);
    mm.iconColor(color);
};

mm.iconColor = function(color){
    const setBgColor = (selector, color2) => $m(selector).css("background-color", color2 ? color2 : $randomcolor({hue: color, luminosity: "dark"}));

    // 각 row 들
    /*
    $m("#list i.circle").each(function (val, key, arr) {
        setBgColor(val);
    });
    */

    // R.forEach(setBgColor, $m("#list i.circle").doms);    // 이거는 안됨, https://min9nim.github.io/frontend/2018/03/31/ramdajs-forEach.html
    R.forEach(val => setBgColor(val), $m("#list i.circle").doms);

    // 헤더 및 버튼들
    R.forEach(setBgColor, [".header", "#topNavi", "#btn_search", "#btn_cancel"]);
    var tmp = $randomcolor({hue: color, luminosity: "dark"});
    setBgColor("#addBtn", tmp);
    setBgColor($m("#addBtn").parent(), tmp);
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

        /*
        nextList.forEach(function (x, i) {
            addItem(x.key, x.val(), "append");
        });
        */

        R.forEach(x => addItem(x.key, x.val()), nextList);

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
        if (snap.val() === true) {
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
    $m(".dialog").css("display", "none");
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

    memoRef.once("value").then(function (snapshot) {
        $m("#list").html("");
        var txts = [];

        $m._each(snapshot.val(), function(val, key){
            if (val.txt.toLowerCase().indexOf(word.toLowerCase()) >= 0) {
                addItem(key, val);
                txts.push(val.txt);
            }
        });

        $m(".header .title").html(memoList.length + " memos");
        $m(".header .state").html(`> <span style="font-style:italic;">${word}</span> 's ${$m("#list li").length} results`);
/*
        $m(".txt").each(function (val, key, arr) {
            var oriTxt = txts[txts.length-1-key];
            $m(val).html(_br_nbsp_link(oriTxt, word));
        });
*/

        _.each($m(".txt").doms, (val, key) => _.go(
                _.mr(txts[txts.length-1-key], word),
                _br_nbsp_link,
                _($m.eleHtml, val)
            ));
    });
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
