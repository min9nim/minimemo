
function showMemoList(uid) {
  $(".state").text("");
  $("#list").text("");

  memoRef.limitToLast(visibleRowCnt).once("value").then(function(snapshot){
    NProgress.done();
//    NProgress.remove();
    //console.log("## once called..")
    var memoObj = snapshot.val();
    for(key in memoObj){
      addItem(key, memoObj[key]);
    }
    $(".header .title").html(userInfo.data.nickname + "'s "+memoList.length+" memos");
  });
}

function initMemoList(uid) {
  //var memoRef = firebase.database().ref('memos/' + uid).limitToLast(100);
  memoRef = firebase.database().ref('memos/' + uid);
  memoRef.on('child_added', onChildAdded);
  memoRef.on('child_changed', onChildChanged);
  memoRef.on('child_removed', onChildRemoved);
  showMemoList(uid);
}

function onChildAdded(data) {
  //console.log("## onChildAdded called");
  memoList.push(data);
  var curDate = new Date().getTime();
  var createDate = data.val().createDate;
  var diff = curDate - createDate;
  //console.log(diff);
  if(diff < 1000){// 방금 새로 등록한 글인 경우만
    addItem(data.key, data.val());
    if($(".state").html() == ""){
      $(".header .title").html(userInfo.data.nickname + "'s "+memoList.length+" memos");
    }else{
      $(".header .title").html(memoList.length+" memos");
    }

  }
}

function addItem(key, memoData, how){
  var html = getMemoHtml(key, memoData);

  if(how == "append"){
    $("#list").append(html.li);
  }else{
    $("#list").prepend(html.li);
  }

  // 오른쪽 끝 컨텍스트버튼 이벤트 처리
  setContextBtnEvent($("#"+key+" .btnContext"));
  setTouchSlider($("#"+key));
}


function getMemoHtml(key, memoData){
  var txt = memoData.txt;
  var createDate = (new Date(memoData.createDate)).toString().substr(4, 17);
  var firstTxt = txt.substr(0, 1).toUpperCase();

  txt = txt.replaceAll("<", "&lt;").replaceAll(">", "&gt;");  // XSS 방어코드
  txt = txt.replaceAll("\n", "<br/>");  // 새줄표시
  txt = txt.replaceAll(" ", "&nbsp;");  // 공백표시
  txt = txt.autoLink({ target: "_blank" });

  //console.log("txt = " + txt + ", firstTxt = " + firstTxt);
  var removeBtn = "";
  var editBtn = "";
  if(typeof userInfo != null && userInfo.uid == uid_disp){// 내가 작성한 글인 경우만 수정/삭제버튼이 표시
      removeBtn = `<i id='btn_delete' onclick='removeMemo("${key}")' class='material-icons'>delete</i>`;
      editBtn = `<i id='btn_edit' onclick='editMemo("${key}")' class='material-icons'>edit</i>`;
  }

  var color = randomColor({hue: userInfo.data.iconColor, luminosity: 'dark'});  // https://randomcolor.llllll.li/

  var liChild = `<i class="material-icons circle" style="background-color:${color};" onclick="searchFirstTxt('${memoData.txt.substr(0, 1)}')">${firstTxt}</i>
                <p><i class='createDate'>${createDate}</i><i class='btnContext'><<</i>
                <div class='txt' style="font-size:${userInfo.data.fontSize};">${txt}</div></p>${removeBtn}${editBtn}`;

  var li = `<li id="${key}" class="collection-item avatar">${liChild}</li>`;
  var html = {};
  html.li = li;
  html.liChild = liChild;
  return html;
}



function onChildChanged(data) {
  //console.log("## onChildChanged called..");
    var key = data.key;
    var memoData = data.val();
    var html = getMemoHtml(key, memoData);
    $("#"+key).html(html.liChild);
    $("#"+key).animate({left: "0px"}, 300);

    // 오른쪽 끝 컨텍스트버튼 이벤트 처리
    setContextBtnEvent($("#"+key+" .btnContext"));
    window.scrollTo("", document.getElementById(key).offsetTop + document.getElementById("list").offsetTop);
}

function onChildRemoved(data) {
//  console.log("## onChildRemoved called..");
  var key = data.key;
  $('#' + key).remove();
  memoList.splice(memoList.indexOf(data),1);  // memoList에서 삭제된 요소 제거
  $(".header .title").html(userInfo.data.nickname + "'s "+memoList.length+" memos");
}

function saveMemo() {
    var key = $("#input").attr("key");
    var txt = $("#input").val().trim();

    if(txt.length > 3000){
      alert("3000자 이내로 입력 가능");
      return;
    }
    if (txt === '') {
        alert("내용을 입력해 주세요");
        return;
    }

    $(".dialog").css("display", "none");

    if(key == ""){// 저장
      firebase.database().ref('memos/' + userInfo.uid).push({
          txt: txt,
          createDate: new Date().getTime()
      });
    }else{// 수정
      firebase.database().ref('memos/' + userInfo.uid + "/" + key).update({
          txt: txt,
          createDate: new Date().getTime()
      });
    }
}



function fn_get_data_one(key) {
    selectedKey = key;
    var memoRef = firebase.database().ref('memos/' + userInfo.uid + '/' + key).once('value').then(function(snapshot){
        $('.textarea').val(snapshot.val().txt);
    });
}

function removeMemo(key) {
  if (userInfo != null && userInfo.isConnected) {
    if (confirm("삭제하시겠습니까?")) {
        firebase.database().ref('memos/' + userInfo.uid + '/' + key).remove();
        //$('#' + key).remove();
    }
  }else{
    alert("로그인이 필요합니다");
  }
}

function editMemo(key) {
  if (userInfo != null && userInfo.isConnected) {
    var memoRef = firebase.database().ref('memos/' + userInfo.uid + '/' + key).once('value').then(function(snapshot){
      $(".dialog").css("display", "block");
      $("#input").val(snapshot.val().txt);
      $("#input").focus();
      $("#input").attr("key", key);
    });
  }else{
    alert("로그인이 필요합니다");
  }
}


function writeMemo() {
    if (userInfo != null && userInfo.isConnected) {
      $(".dialog").css("display", "block");
      $("#input").val("");
      $("#input").focus();
      $("#input").attr("key", "");
    } else {
      if(confirm("로그인이 필요합니다"))
        firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
   }
}


function searchClick() {
    if (userInfo != null && userInfo.isConnected) {
      $(".search").css("display", "block");
      $("#input2").val("");
      $("#input2").focus();
    } else {
      alert("로그인이 필요합니다");
      //firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
   }
}


function searchMemo(){
  var txt = $("#input2").val().trim();

  if(txt.length > 100){
    alert("100자 이내로 입력 가능");
    return;
  }
  if (txt === '') {
      alert("내용을 입력해 주세요");
      return;
  }

  $(".search").css("display", "none");

  memoRef.once("value").then(function(snapshot){
    $("#list").html("");
    var memoObj = snapshot.val();
    for(key in memoObj){
      if(memoObj[key].txt.indexOf(txt) >= 0){
        addItem(key, memoObj[key]);
      }
    }
    $(".header .title").html(memoList.length+" memos");
    $(".header .state").html(`> <span style="font-style:italic;">${txt}</span> 's ${$("#list li").length} results`);

    // 매칭단어 하이라이트닝
    var reg = new RegExp(txt, "g");
    $(".txt").each(function(i){
      this.innerHTML = this.innerHTML.replace(reg, `<span style="background-color:yellow;">${txt}</span>`); // html태그 내용까지 매치되면 치환하는 문제가 있음
    });

  });
}


function cancelWrite() {
    $(".dialog").css("display", "none");
}

function cancelSearch() {
    $(".search").css("display", "none");
}


function keydownCheck(event){
  var keycode = (event.which) ? event.which : event.keyCode;
  if((event.metaKey || event.altKey) && keycode == 13) {
    if($(".dialog").css("display") == "block"){
      saveMemo();
    }else {
      searchMemo();
    }
    event.preventDefault();
    return false;
  }
}


function setHeader(){
  if(nickname){
    $(".header .title").html(nickname + "'s memo");
  }else if(userInfo != null){
    //$(".header .title").html(userInfo.data.nickname + "'s "+memoList.length+"memos");
    $("#nickname").val(userInfo.data.nickname);
    $("#fontSize").val(userInfo.data.fontSize.replace("px",""));
    $("#iconColor").val(userInfo.data.iconColor);
  }else{
    $(".header .title").html("Lounge");
  }
}


function setContextBtnEvent(contextBtn){
  contextBtn.bind("click", function(){
    if(contextBtn.text() == "<<"){
      contextBtn.parent().parent().animate({left: "-100px"}, 300, function(){contextBtn.text(">>");});
    }else{
      contextBtn.parent().parent().animate({left: "0px"}, 300, function(){contextBtn.text("<<");});
    }
  });
}

function setTouchSlider(row){
      var start_x, diff_x;
      var start_y, diff_y;
      var dom_start_x;

      function touchstart(e){
        start_x = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
        start_y = e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY;
        dom_start_x = $(this).position().left;  // 터치시작할 때 최초 dom요소의 x위치를 기억하고 있어야 함
      }

      function touchmove(e){
        diff_x = (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX) - start_x;
        diff_y = (e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY) - start_y;
        if(Math.abs(diff_x) > Math.abs(diff_y*4)){
          $(this).css("left", dom_start_x + diff_x);
        }
      }

      function touchend(){
        if(diff_x < -50){
          $(this).animate({left: "-100px"}, 300);
        }else{
          $(this).animate({left: "0px"}, 300);
        }
      }

      row.bind("touchstart", touchstart);
      row.bind("touchmove", touchmove);
      row.bind("touchend", touchend);
}


function menuClick(){
  if($(".menu").css("left") == "0px"){
    $(".menu").animate({left:"-220px"},300);
  }else{
    $(".menu").animate({left:"0px"},300);
  }
}


function signout(){
  firebase.auth().signOut().then(function() {
    //userInfo = null;
    //$("#list").html("");
    //$("#writeBtn").hide();
    //alert('Signed Out');
    // index.html 의 로그아웃 공통처리 로직이 수행됨
  }, function(error) {
    console.error('Sign Out Error', error);
  });
}


function searchFirstTxt(firstTxt){
  var memoRef = firebase.database().ref('memos/' + userInfo.uid);
  memoRef.once("value").then(function(snapshot){
    $("#list").html("");
    var memoObj = snapshot.val();
    for(key in memoObj){
      if(memoObj[key].txt.indexOf(firstTxt) == 0)
        //console.log(memoObj[key].txt);
        addItem(key, memoObj[key]);
    }
    $(".header .title").html(memoList.length+" memos");
    $(".header .state").html(`> <span style="font-style:italic;">${firstTxt}</span> 's ${$("#list li").length} results`);
    // 매칭단어 하이라이트닝
    $(".txt").each(function(i){
      this.innerHTML = this.innerHTML.replace(firstTxt, `<span style="background-color:yellow;">${firstTxt}</span>`); // html태그 내용까지 매치되면 치환하는 문제가 있음
    });
  });
}

function setNickname(nickname){
  userInfo.data.nickname = nickname;
  firebase.database().ref('users/' + userInfo.uid).update(userInfo.data);
  $(".header .title").html(userInfo.data.nickname + "'s "+memoList.length+" memos");
}


function setFontSize(size){
  userInfo.data.fontSize = size+"px";
  firebase.database().ref('users/' + userInfo.uid).update(userInfo.data);
  $(".txt").css("font-size", userInfo.data.fontSize);
}

function setIconColor(color){
  userInfo.data.iconColor = color;
  firebase.database().ref('users/' + userInfo.uid).update(userInfo.data);
  $("#list i.circle").each(function(i){
    var bgcolor = randomColor({hue: color, luminosity: 'dark'});
    $(this).css("background-color", bgcolor);
  });
}


function listClick(){
  $(".menu").animate({left:"-220px"},300);
}

function bodyScroll(){
  if($(".state").html() != ""){// 검색결과 일때
    return;
  }

  if(window.scrollY == $(document).height() - $(window).height()){
    NProgress.start();
    $("#nprogress .spinner").css("top", "95%");
    var end = memoList.length - $("#list li").length;
    var start = end-visibleRowCnt < 0 ? 0 : end-visibleRowCnt;
    var nextList = memoList.slice(start, end).reverse();
    nextList.forEach(function(x,i){
      addItem(x.key, x.val(), "append");
    });
    NProgress.done();
  }
}

function topNavi(){
  $(window).scrollTop(0);
}
