define(["jquery"
    , "nprogress"
    , "randomColor"
    , "shortcut"
    , "autolink"
    , "util"
    //, "materialize"       // 이거 없어도 렌더링에 문제가 없네?
], function ($
    , $nprogress
    , $randomcolor
    , $shortcut
    , $autolink       // undefined
    , $util           // undefined
) {

    // export
    var mm = {};

    // local variable
    var userInfo = null // 로그인한 사용자 정보
        , memoRef
        , memoList = []
        , visibleRowCnt = 50
    ;

    mm.memoList = memoList;


    // local function
    function showMemoList(uid) {
        $m(".state").html("");
        $m("#list").html("");

        memoRef.limitToLast(visibleRowCnt).once("value").then(function (snapshot) {
            var memoObj = snapshot.val();
            Object.keys(memoObj).forEach(function (key) {
                addItem(key, memoObj[key]);
            });
            $m(".header .title").html(userInfo.data.nickname + "'s " + memoList.length + " memos");
            $nprogress.done();
        });
    }

    function initMemoList(uid) {
        //var memoRef = firebase.database().ref("memos/" + uid).limitToLast(100);
        memoRef = firebase.database().ref("memos/" + uid);
        memoRef.on("child_added", onChildAdded);
        memoRef.on("child_changed", onChildChanged);
        memoRef.on("child_removed", onChildRemoved);
        showMemoList(uid);
    }

    function onChildAdded(data) {
        //console.log("## onChildAdded called");
        memoList.push(data);
        var curDate = Date.now();
        var createDate = data.val().createDate;
        var diff = curDate - createDate;
        //console.log(diff);
        if (diff < 1000) {// 방금 새로 등록한 글인 경우만
            addItem(data.key, data.val());
            if ($m(".state").html() === "") {
                $m(".header .title").html(userInfo.data.nickname + "'s " + memoList.length + " memos");
            } else {
                $m(".header .title").html(memoList.length + " memos");
            }

        }
    }

    function addItem(key, memoData, how) {
        var html = getMemoHtml(key, memoData);

        if (how == "append") {
            $m("#list").append(html.li);
        } else {
            $m("#list").prepend(html.li);
        }

        // 오른쪽 끝 컨텍스트버튼 이벤트 처리
        setContextBtnEvent($("#" + key + " .btnContext"));
        setTouchSlider($("#" + key));
    }


    function getMemoHtml(key, memoData) {
        var txt = memoData.txt;
        var createDate = (new Date(memoData.createDate)).toString().substr(4, 17);
        var firstTxt = txt.substr(0, 1).toUpperCase();

        txt = txt.replace(/</gi, "&lt;").replace(/>/gi, "&gt;")  // XSS 방어코드
                .replace(/\n/gi, "<br/>")  // 새줄표시
                .replace(/[\s]/gi, "&nbsp;")  // 공백표시
                .autoLink({target: "_blank"});

        //console.log("txt = " + txt + ", firstTxt = " + firstTxt);
        var removeBtn = "";
        var editBtn = "";
        if (typeof userInfo != null) {// 내가 작성한 글인 경우만 수정/삭제버튼이 표시
            removeBtn = `<i id="btn_delete" onclick='mm.removeMemo("${key}")' class="material-icons">delete</i>`;
            editBtn = `<i id="btn_edit" onclick='mm.editMemo("${key}")' class="material-icons">edit</i>`;
        }

        var color = $randomcolor({hue: userInfo.data.iconColor, luminosity: "dark"});  // https://randomcolor.llllll.li/

        var liChild = `<i class="material-icons circle" style="background-color:${color};" onclick="mm.searchFirstTxt()">${firstTxt}</i>
                <p><i class="createDate">${createDate}</i><i class="btnContext"><<</i>
                <div class="txt" style="font-size:${userInfo.data.fontSize};">${txt}</div></p>${removeBtn}${editBtn}`;

        var li = `<li id="${key}" class="collection-item avatar">${liChild}</li>`;
        var html = {};
        html.li = li;
        html.liChild = liChild;
        return html;
    }


    function onChildChanged(data) {
        var key = data.key;
        var memoData = data.val();
        var html = getMemoHtml(key, memoData);
        $m("#" + key).html(html.liChild);
        $("#" + key).animate({left: "0px"}, 300);

        // 오른쪽 끝 컨텍스트버튼 이벤트 처리
        setContextBtnEvent($("#" + key + " .btnContext"));
        window.scrollTo("", document.getElementById(key).offsetTop + document.getElementById("list").offsetTop);
    }

    function onChildRemoved(data) {
        var key = data.key;
        $m("#" + key).remove();
        memoList.splice(memoList.indexOf(data), 1);  // memoList에서 삭제된 요소 제거
        $m(".header .title").html(userInfo.data.nickname + "'s " + memoList.length + " memos");
    }


    function setHeader() {
        if (userInfo != null) {
            $m("#nickname").val(userInfo.data.nickname);
            $m("#fontSize").val(userInfo.data.fontSize.replace("px", ""));
            $m("#iconColor").val(userInfo.data.iconColor);
        } else {
            $m(".header .title").html("minimemo");
        }
    }


    function setContextBtnEvent(contextBtn) {
        contextBtn.bind("click", function () {
            if (contextBtn.text() == "<<") {
                contextBtn.parent().parent().animate({left: "-100px"}, 300, function () {
                    contextBtn.text(">>");
                });
            } else {
                contextBtn.parent().parent().animate({left: "0px"}, 300, function () {
                    contextBtn.text("<<");
                });
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
            dom_start_x = $(this).position().left;  // 터치시작할 때 최초 dom요소의 x위치를 기억하고 있어야 함
        }

        function touchmove(e) {
            diff_x = (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX) - start_x;
            diff_y = (e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY) - start_y;
            if (Math.abs(diff_x) > Math.abs(diff_y * 4)) {
                $(this).css("left", dom_start_x + diff_x);
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


    function signout() {
        firebase.auth().signOut().then(function () {
            //userInfo = null;
            //$("#list").html("");
            //$("#writeBtn").hide();
            //alert('Signed Out');
            // index.html 의 로그아웃 공통처리 로직이 수행됨
        }, function (error) {
            console.error("Sign Out Error", error);
        });
    }


    mm.searchFirstTxt = function () {
        var firstTxt = event.target.innerText;
        var memoRef = firebase.database().ref("memos/" + userInfo.uid);
        memoRef.once("value").then(function (snapshot) {
            $m("#list").html("");
            var reg = new RegExp(firstTxt, "i");
            var memoObj = snapshot.val();
            for (key in memoObj) {
                var res = reg.exec(memoObj[key].txt);
                if (res !== null && res.index == 0) {
                    addItem(key, memoObj[key]);
                }
            }
            $m(".header .title").html(memoList.length + " memos");
            $m(".header .state").html(`> <span style="font-style:italic;">${firstTxt}</span> "s ${$("#list li").length} results`);
            // 매칭단어 하이라이트닝
            $(".txt").each(function (i) {
                this.innerHTML = this.innerHTML.replace(firstTxt, `<span style="background-color:yellow;">${firstTxt}</span>`); // html태그 내용까지 매치되면 치환하는 문제가 있음
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
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {// 인증완료
                userInfo = user;
                $("#writeBtn").show();
                var userRef = firebase.database().ref("users/" + userInfo.uid);
                userRef.once('value').then(function (snapshot) {
                    if (snapshot.val() != null) {
                        userInfo.data = snapshot.val();
                        setHeader();
                        initMemoList(userInfo.uid);
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
                            initMemoList(userInfo.uid);
                        });
                    }
                });
            } else {
                userInfo = null;
                setHeader();
                $nprogress.done();
                if (confirm("로그인이 필요합니다")) {
                    firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
                }
            }
        });
    }

    function conOn () {
        if (userInfo != null){
            userInfo.isConnected = true;
        }
        $("#writeBtn").show();
        $m("#addBtn").html("쓰기");
    }

    function conOff () {
        if (userInfo != null){
            userInfo.isConnected = false;
        }
        $("#writeBtn").hide();
        setTimeout(function () {// 20초 동안 연결이 끊어져 있는 경우라면
            if (userInfo.isConnected == false) {
                $("#writeBtn").show();
                $m("#addBtn").html("로긴");
            }
        }, 20000);
        //alert("연결상태가 끊어졌습니다.");
    }

    mm.setNickname = function (nickname) {
        userInfo.data.nickname = nickname;
        firebase.database().ref("users/" + userInfo.uid).update(userInfo.data);
        $(".header .title").html(userInfo.data.nickname + "'s " + memoList.length + " memos");
    };


    mm.setFontSize = function (size) {
        userInfo.data.fontSize = size + "px";
        firebase.database().ref("users/" + userInfo.uid).update(userInfo.data);
        $m(".txt").css("font-size", userInfo.data.fontSize);
    };

    mm.setIconColor = function (color) {
        userInfo.data.iconColor = color;
        firebase.database().ref("users/" + userInfo.uid).update(userInfo.data);
        $m("#list i.circle").each(function () {
            var bgcolor = $randomcolor({hue: color, luminosity: "dark"});
            $(this).css("background-color", bgcolor);
        });
    };

    mm.bodyScroll = function () {
        if ($m(".state").html() != "") {// 검색결과 일때
            return;
        }

        if (window.scrollY == $(document).height() - $(window).height()) {
            $nprogress.start();
            $m("#nprogress .spinner").css("top", "95%");
            var end = memoList.length - $("#list li").length;
            var start = end - visibleRowCnt < 0 ? 0 : end - visibleRowCnt;
            var nextList = memoList.slice(start, end).reverse();
            nextList.forEach(function (x, i) {
                addItem(x.key, x.val(), "append");
            });
            $nprogress.done();
        }
    };

    mm.topNavi = function () {
        $(window).scrollTop(0);
    };

    mm.titleClick = function () {
        if (userInfo) {
            showMemoList(userInfo.uid);
        } else {
            firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
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
        $(".dialog").css("display", "none");
    };


    mm.searchMemo = function () {
        var txt = $m("#input2").val().trim();

        if (txt.length > 100) {
            alert("100자 이내로 입력 가능");
            return;
        }
        if (txt === "") {
            alert("내용을 입력해 주세요");
            return;
        }

        $(".search").css("display", "none");

        memoRef.once("value").then(function (snapshot) {
            $("#list").html("");
            var memoObj = snapshot.val();
            var txts = [];
            for (key in memoObj) {
                if (memoObj[key].txt.indexOf(txt) >= 0) {
                    addItem(key, memoObj[key]);
                    txts.push(memoObj[key].txt);
                }
            }
            $(".header .title").html(memoList.length + " memos");
            $(".header .state").html(`> <span style="font-style:italic;">${txt}</span> 's ${$("#list li").length} results`);

            // 매칭단어 하이라이트닝
            var reg = new RegExp(txt, "gi");
            $(".txt").each(function (i, dom) {
                var oriTxt = txts[txts.length-1-i];
                oriTxt = oriTxt.replace(/</gi, "&lt;").replace(/>/gi, "&gt;")  // XSS 방어코드
                                .replace(/\n/gi, "<br/>")  // 새줄표시
                                .replace(/[\s]dd/gi, "&nbsp;");  // 공백표시
                this.innerHTML = oriTxt.replace(reg, `<span style="background-color:yellow;">${txt}</span>`); //검색할 때 링크는 제공하지 않음; 처리 어려움;;
            });

        });
    };


    mm.saveMemo = function () {
        var key = $m("#input").attr("key");
        var txt = $m("#input").val().trim();

        if (txt.length > 3000) {
            alert("3000자 이내로 입력 가능");
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
                //$("#" + key).remove();
            }
        } else {
            alert("로그인이 필요합니다");
        }
    };

    mm.editMemo = function (key) {
        if (userInfo && userInfo.isConnected) {
            var memoRef = firebase.database().ref("memos/" + userInfo.uid + "/" + key).once("value").then(function (snapshot) {
                $m(".dialog").css("display", "block");
                $m("#input").val(snapshot.val().txt);
                $("#input").focus();
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
            $("#input").focus();
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
            $("#input2").focus();
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


    return mm;
});