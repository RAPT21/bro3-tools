// ==UserScript==
// @name         bro3_route_builder
// @namespace    bro3_route_builder
// @include      http://*.3gokushi.jp/big_map.php*
// @description  ブラウザ三国志ルート構築(51x51)
// @version      1.01

// @grant   GM_addStyle
// @grant   GM_deleteValue
// @grant   GM_getValue
// @grant   GM_listValues
// @grant   GM_log
// @grant   GM_setValue
// @grant   GM_xmlhttpRequest
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js

// ==/UserScript==
// version date       author
// 1.01		2016.03.19	Craford 氏	http://silent-stage.air-nifty.com/steps/2016/03/post-60ac.html

// load jQuery
jQuery.noConflict();
j$ = jQuery;

j$("#mapAll").css({'height':'1160px'});

// iframeの高さは動的に変えられないので、更新をiframeに通知する
j$('iframe').on(
    'load', function(){
        try {  
            j$(this).height(this.contentWindow.document.documentElement.scrollHeight);
        } catch (e) {
    }
});
j$('iframe').trigger('load');


// GreaseMonkeyラッパー関数の定義
initGMWrapper();

var HOST = location.hostname;        // アクセスURLホスト
var SERVICE = '';                    // サービス判定が必要な場合に使用する予約定数
var SVNAME = HOST.substr(0,location.hostname.indexOf(".")) + SERVICE;
var GM_KEY = "RB001_" + HOST.substr(0,HOST.indexOf("."));

//----------------//
// メインルーチン //
//----------------//
// 周囲8マスへの距離
var chkptn = [ [1,0], [0,1], [-1,0], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1] ];

(function() {
  // 実行判定
  if (isExecute() == false) {
    return;
  }
  // マップ画面以外はなにもしない
  if (!location.href.match(/big_map.php/)) {
      return;
  }

  // 選択されているマップサイズチェック
  var viewSize = -1;
  j$("div[id=change-map-scale] li[class*=now]").each(
      function(){
          if( j$(this).attr("class").match(/sort(\d+) now/) != null ){
              viewSize = RegExp.$1;
          }
      }
  );
  if (viewSize != 51) {
      return;
  }

  // マップデータ保持用
  var mapdata = [];

  // 経路設定マーカー（始点座標、中間座標の保持用）
  var routemarkers = [];

  // 座標指示マーカー（通過禁止、強制通過座標の保持用）
  var positionmarkers = [];

  //------------------------
  // 51x51のマップ情報収集
  //------------------------
  j$("#change-map-scale ul").css({'width' : '350px'});
  j$("#change-map-scale").after(
    "<div style='margin-top:60px;'>" + 
      "<input type='button' id='routing_start' style='margin-left: 20px;' value='ルート構築を開始する'></input>" +
      "<input type='button' id='restore_map' style='display:none; margin-left: 20px;' value='ルート構築をやめる'></input>" +
    "</div>"
  );
  j$("#single-allow-south").after(
    "<div style='text-align: left;'>" + 
      "<fieldset id='routing' style='display:none; -moz-border-radius:5px; border-radius: 5px; -webkit-border-radius: 5px; margin-bottom:6px; border: 2px solid black; background-color:#faebd7; margin-left:20px;  margin-right:20px;'>" +
        "<div style='margin-top:2px; margin-left:6px; margin-bottom: 2px;'>" +
          "<div style='float:left;'>" +
            "<div>" +
              "<span style='font-weight: bold;'>探索レベル：</span>" +
              "<select id='pass_level'>" +
                "<option value='1'>★1以下</option>" +
                "<option value='2'>★2以下</option>" +
                "<option value='3'>★3以下</option>" +
                "<option value='4'>★4以下</option>" +
                "<option value='5'>★5以下</option>" +
                "<option value='6'>★6以下</option>" +
                "<option value='7'>★7以下</option>" +
                "<option value='8'>★8以下</option>" +
                "<option value='9'>すべて</option>" +
              "</select>" +
              "<span style='margin-left: 6px; font-weight: bold;'>通過対象：</span>" +
              "<select id='pass_area'>" +
                "<option value='0'>空き地のみ</option>" +
                "<option value='1'>すべて</option>" +
              "</select>" +
            "</div>" +
            "<div>" +
              "<div style='font-weight: bold;'>非通過領地：<br>例「★2(0-3-0-0),★3(1-1-1-0)」" +
              "<input style='font-weight: normal; font-size:12px;' type='button' id='viewskiparea' value='反映'></input></div>" +
              "<textarea cols=45 rows=1 style='resize:none;' id='skip_area'></textarea>" + 
            "</div>" + 
            "<div>" +
              "<div style='font-weight: bold;'>通過数上限（通過ルートが検知できないことあり）：<br>例「★2(20),★3(10)」</div>" +
              "<textarea cols=45 rows=1 style='resize:none;' id='pass_limit'></textarea>" + 
            "</div>" + 
            "<input id='save_route_setting' type='button' value='設定を保存'></input>" +
          "</div>" +
          "<div style='float:right;'>" +
            "<div>" +
              "<span style='font-weight: bold;'>生成ルート(CTRL+Cでコピー)</span>" +
              "<input style='font-weight: normal; font-size:12px;' type='button' id='viewroute' value='反映'></input>" +
              "<input style='font-weight: normal; font-size:12px;' type='button' id='clearroute' value='クリア'></input>" +
            "</div>" +
            "<textarea cols=40 rows=3 style='font-size:10px; resize:none; overflow:auto; margin-right:6px;' id='route'></textarea>" + 
            "<div>" +
              "<span style='font-weight: bold;'>空き地を探す：<br>例「★2(0-3-0-0)」</span>" +
              "<input style='font-weight: normal; font-size:12px;' type='button' id='viewres' value='反映'></input>" +
            "</div>" +
            "<textarea cols=40 rows=1 style='font-size:10px; resize:none; overflow:auto; margin-right:6px;' id='search_res'></textarea>" + 
          "</div>" +
        "</div>" +
      "</fieldset>" +
    "</div>"
  );
  j$("#map51-navi").after(
    "<div id='route_info' style='display:none; color:blue; font-weight:bold; float:left; position:absolute; font-size:12px; left:24px; margin-top: 24px;'>左クリックで経路設定、右クリックでルート構築</div>"
  );

  //---------------------
  // 保存ボタン
  //---------------------
  j$("#save_route_setting").click(
      function() {
         saveValue("pass_level", j$("#pass_level").val());  // 探索レベル
         saveValue("pass_area", j$("#pass_area").val());    // 通過対象
         saveValue("skip_area", j$("#skip_area").val());    // 非通過領地
         saveValue("pass_limit", j$("#pass_limit").val());  // 通過数制限
         saveValue("search_res", j$("#search_res").val());  // 領地検索
         alert("保存しました");
      }
  );

  //-------------------------
  // （ルート）クリアボタン
  //-------------------------
  j$("#clearroute").click(
      function() {
          for (keyx in mapdata) {
              for (keyy in mapdata[keyx]) {
                  if (mapdata[keyx][keyy].view_route == true) {
                      mapdata[keyx][keyy].view_route = false;
                  }
                  draw_decorate(keyx, keyy);
              }
          }
      }
  );

  //-----------------------
  // （ルート）反映ボタン
  //-----------------------
  j$("#viewroute").click(
      function() {
          j$("#clearroute").click();

          var readtext = j$("#route").val();
          var match = readtext.match(/\(([-]*\d+,[-]*\d+)\)/g);
          for (var i = 0; i < match.length; i++) {
              match[i].match(/([-]*\d+),([-]*\d+)/);
              var keyx = "x" + RegExp.$1;
              var keyy = "y" + RegExp.$2;

              // マップデータがないばあいは通過不可能な壁とみなす
              if (typeof mapdata[keyx] == 'undefined') {
                   continue;
              }
              if (typeof mapdata[keyx][keyy] == 'undefined') {
                   continue;
              }
              mapdata[keyx][keyy].view_route = true;
              draw_decorate(keyx, keyy);
          }
      }
  );

  //---------------------------
  // （非通過領地）反映ボタン
  //---------------------------
  j$("#viewskiparea").click(
      function() {
          // 設定済みの領地をクリア
          for (keyx in mapdata) {
              for (keyy in mapdata[keyx]) {
                  if (mapdata[keyx][keyy].view_skip == true) {
                      mapdata[keyx][keyy].view_skip = false;
                  }
                  draw_decorate(keyx, keyy);
              }
          }

          // 設定内容の反映
          var skiplist = get_skip_area();
          if (skiplist.length > 0) {
              for (keyx in mapdata) {
                  for (keyy in mapdata[keyx]) {
                      for (var i = 0; i < skiplist.length; i++) {
                          if (mapdata[keyx][keyy].stars == skiplist[i].stars &&
                              mapdata[keyx][keyy].wood == skiplist[i].wood &&
                              mapdata[keyx][keyy].stone == skiplist[i].stone &&
                              mapdata[keyx][keyy].iron == skiplist[i].iron &&
                              mapdata[keyx][keyy].food == skiplist[i].food) {
                              mapdata[keyx][keyy].view_skip = true;
                              draw_decorate(keyx, keyy);
                              break;
                          }
                      }
                  }
              }
          }
      }
  );

  //-----------------------
  // （空き地）反映ボタン
  //-----------------------
  j$("#viewres").click(
      function() {
          // 設定済みの領地をクリア
          for (keyx in mapdata) {
              for (keyy in mapdata[keyx]) {
                  if (mapdata[keyx][keyy].view_res == true) {
                      mapdata[keyx][keyy].view_res = false;
                  }
                  draw_decorate(keyx, keyy);
              }
          }

          // 設定内容の反映
          var reslist = get_search_area();
          if (reslist.length > 0) {
              for (keyx in mapdata) {
                  for (keyy in mapdata[keyx]) {
                      for (var i = 0; i < reslist.length; i++) {
                          if (mapdata[keyx][keyy].blank == true &&
                              mapdata[keyx][keyy].stars == reslist[i].stars &&
                              mapdata[keyx][keyy].wood == reslist[i].wood &&
                              mapdata[keyx][keyy].stone == reslist[i].stone &&
                              mapdata[keyx][keyy].iron == reslist[i].iron &&
                              mapdata[keyx][keyy].food == reslist[i].food) {
                              mapdata[keyx][keyy].view_res = true;
                              draw_decorate(keyx, keyy);
                              break;
                          }
                      }
                  }
              }
          }
      }
  );

  //-------------------
  // 通常マップに戻る
  //-------------------
  j$("#restore_map").click(
      function() {
          j$("#routing_start").css({'display':'block'});
          j$("#restore_map").css({'display':'none'});
          j$("#map51-content").css({'border':''});
          j$("#routing").css({'display':'none'});
          j$("#route_info").css({'display':'none'});

          //-------------------------------------------------
          // マップを元に戻す
          //-------------------------------------------------
          for (keyx in mapdata) {
              for (keyy in mapdata[keyx]) {
                  j$(mapdata[keyx][keyy].map).css({'background-color':''});
                  j$(mapdata[keyx][keyy].map).css({'color':'black'});
                  j$(mapdata[keyx][keyy].map).css({"text-decoration":""});
                  j$(mapdata[keyx][keyy].map).off('click');
                  j$(mapdata[keyx][keyy].map).off('contextmenu');
                  var url = '/land.php?x=' + mapdata[keyx][keyy].x + '&y=' + mapdata[keyx][keyy].y + '#ptop';
                  j$(mapdata[keyx][keyy].map).attr('href', url);
              }
          }
      }
  );

  //-------------------
  // ルート構築モード
  //-------------------
  j$("#routing_start").click(
      function() {
          j$("#routing").css({'display':'block'});
          j$("#routing_start").css({'display':'none'});
          j$("#restore_map").css({'display':'block'});
          j$("#route_info").css({'display':'block'});

          j$("#map51-content").css({'border':'3px solid green'});
          var map = j$("#map51-content a[href*='/land.php']");

          j$("#pass_level").val(loadValue("pass_level", "1"));   // 探索レベル
          j$("#pass_area").val(loadValue("pass_area", "0"));     // 通過対象
          j$("#skip_area").val(loadValue("skip_area", ""));      // 非通過領地
          j$("#pass_limit").val(loadValue("pass_limit", ""));    // 通過数制限
          j$("#search_res").val(loadValue("search_res", ""));    // 領地検索

          //-----------------------
          // マップデータ収集処理
          //-----------------------
          var skiplist = get_skip_area();
          var reslist = get_search_area();
          for (var i = 0; i < map.length; i++) {
              var obj = new Object;
              obj.map = map[i];

              j$(map[i]).attr('href').match(/x=([-]*\d+).*y=([-]*\d+)#ptop/);
              var x = RegExp.$1;
              var y = RegExp.$2;
              obj.x = x;
              obj.y = y;
              obj.blank = false;
              obj.npc = false;
              obj.npcname = "";
              obj.base = false;
              obj.view_route = false;
              obj.view_res = false;
              obj.view_skip = false;
              obj.view_build_route = false;
              obj.text = j$(map[i]).text();

              // 領地の状態の設定
              var mtext = j$(map[i]).attr('onmouseover');
              if ( mtext.match(/空き地/) != null ) {
                  obj.blank = true;
              }
              obj.stars = -1;
              obj.wood = 0;
              obj.stone = 0;
              obj.iron = 0;
              obj.food = 0;
              var match = mtext.match(/戦力.*>([★]+)<.*木(\d+).*岩(\d+).*鉄(\d+).*糧(\d+)/);
              if (match != null) {
                  obj.stars = RegExp.$1.length;
                  obj.wood = parseInt(RegExp.$2);
                  obj.stone = parseInt(RegExp.$3);
                  obj.iron = parseInt(RegExp.$4);
                  obj.food = parseInt(RegExp.$5);
                    // 白地図モード搭載するときはこれを外す
//                  j$(map[i]).css({"background-color":"white"});
              } else if(mtext.match(/npc-red-star/) != null) {
                  obj.npc = true;
                  mtext.match(/bigmap-caption">(.*)<\/dt><dd class="bigmap-subcap.*npc-red-star">([★]+)</);
                  obj.npcname = RegExp.$1;
                  obj.stars = RegExp.$2.length;
              } else {
                  obj.base = true;
              }

              // 非通過領地の判定
              for (var j = 0; j < skiplist.length; j++) {
                   if (obj.stars == skiplist[j].stars &&
                       obj.wood == skiplist[j].wood &&
                       obj.stone == skiplist[j].stone &&
                       obj.iron == skiplist[j].iron &&
                       obj.food == skiplist[j].food) {
                       obj.view_skip = true;  // 通過不可
                       break;
                   }
              }

              // 検索した空き地の判定
              for (var j = 0; j < reslist.length; j++) {
                  if (obj.blank == true &&
                      obj.stars == reslist[j].stars &&
                      obj.wood == reslist[j].wood &&
                      obj.stone == reslist[j].stone &&
                      obj.iron == reslist[j].iron &&
                      obj.food == reslist[j].food) {
                      obj.view_res = true;
                      break;
                  }
              }

              // ルート構築用にマップデータを蓄積
              var keyx = "x" + x;
              var keyy = "y" + y;
              if (typeof mapdata[keyx] == 'undefined') {
                 mapdata[keyx] = [];
              }
              mapdata[keyx][keyy] = obj;

              // 運営の左クリックジャンプを潰す
              j$(map[i]).attr('href', '#');

              // 領地の状態を描画
              draw_decorate(keyx, keyy);

              //---------------------------------
              // マップを左クリックした時の動作
              //---------------------------------
              j$(map[i]).on('click',
                  function(event){
                      //-------------------------------------------------
                      // 作成済みルートを消す（マップの着色を元に戻す）
                      //-------------------------------------------------
                      for (keyx in mapdata) {
                          for (keyy in mapdata[keyx]) {
                              if (mapdata[keyx][keyy].view_build_route == true) {
                                  mapdata[keyx][keyy].view_build_route = false;
                              }
                          }
                      }
                      draw_conditions();

                      //---------------------------------
                      // クリックされたマップ座標の取得
                      //---------------------------------
                      j$(this).attr('onmouseover').match(/距離<.*\(([-]*\d+),([-]*\d+)\)/);
                      var mx = RegExp.$1;
                      var my = RegExp.$2;
                      var deleted = false;
                      if (routemarkers.length != 0) {
                          // すでに同じ座標がいたら解除
                          var keyx = "x" + mx;
                          var keyy = "y" + my;
                          var target = -1;
                          for (var i = 0; i < routemarkers.length; i++) {
                              if (routemarkers[i].x == mx && routemarkers[i].y == my) {
                                  target = i;
                                  break;
                              }
                          }
                          // 解除ポイントから先の中間点をすべて削除
                          if (target >= 0) {
                              for (var i = target; i < routemarkers.length; i++) {
                                  keyx = "x" + routemarkers[i].x;
                                  keyy = "y" + routemarkers[i].y;
                                  draw_decorate(keyx, keyy);
                                  j$(mapdata[keyx][keyy].map).text(mapdata[keyx][keyy].text);
                              }
                              routemarkers.splice(target, routemarkers.length - target + 1);
                              deleted = true;
                          }
                      }

                      //--------------------------------------------------
                      // 削除でない場合は、クリックした座標をマーキング
                      //--------------------------------------------------
                      if (deleted == false) {
                          if (routemarkers.length > 20) {
                              alert("経由ルートはこれ以上指定できません。");
                              return false;
                          }
                          var obj = new Object;
                          obj.x = mx;
                          obj.y = my;
                          if (routemarkers.length == 0) {
                              j$(this).css({"background-color":"indigo"});
                              j$(this).text("S").css({"color":"white"});
                          } else {
                              var str = String.fromCharCode(0x60 + routemarkers.length);
                              j$(this).css({"background-color":"indigo"});
                              j$(this).text(str).css({"color":"white"});
                          }
                          routemarkers.push(obj);
                      }
                      return false;
                  }
              );

              //---------------------------------
              // マップを右クリックした時の動作
              //---------------------------------
              j$(map[i]).on('contextmenu',
                  function(){
                      if (routemarkers.length < 2) {
                          alert("ルート構築用の座標が設定されていません。");
                          return false;
                      }

                      //-------------------------------------------------
                      // 作成済みルートを消す（マップの着色を元に戻す）
                      //-------------------------------------------------
                      for (keyx in mapdata) {
                          for (keyy in mapdata[keyx]) {
                              if (mapdata[keyx][keyy].view_build_route == true) {
                                  mapdata[keyx][keyy].view_build_route = false;
                              }
                          }
                      }
                      draw_conditions();

                      //-------------------
                      // 非通過領地の取得
                      //-------------------
                      var skiplist = get_skip_area();

                      //-----------------------------
                      // 通過数上限の取得
                      //-----------------------------
                      var limits = get_limit_count();

                      //--------------------//
                      // ルート再評価ループ //
                      //--------------------//
                      var blocks = [];
                      var block_ct = 0;

                      var repeat = 1;
                      while (repeat) {
                          var fixed = [];
                          var fixed_ct = 0;

                          //-------------------------------
                          // 複数中継点に対応させるループ
                          //-------------------------------
                          // 固定数通過上限
                          var pass_level = parseInt(j$("#pass_level").val());
                          var pass_area = j$("#pass_area").val();

                          var marks = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                          repeat = 0;   // 再評価オフ

SEARCH_ALL:               for (var k = 0; k < routemarkers.length - 1; k++) {
                              //-------------------------------
                              // ルート探索事前処理
                              //-------------------------------
                              var statuses = [];
                              for (keyx in mapdata) {
                                  statuses[keyx] = [];
                                  for (keyy in mapdata[keyx]) {
                                      statuses[keyx][keyy] = -1;  // 未設定

                                      //-----------------------
                                      // 固定通過条件設定処理
                                      //-----------------------
                                      if (mapdata[keyx][keyy].stars > pass_level || mapdata[keyx][keyy].npc == true || mapdata[keyx][keyy].base == true) {
                                           statuses[keyx][keyy] = -2;  // 通過不可
                                           continue;
                                      }
                                      if (pass_area == '0' && mapdata[keyx][keyy].blank == false) {
                                           statuses[keyx][keyy] = -2;  // 通過不可
                                           continue;
                                      }
                                      for (var i = 0; i < skiplist.length; i++) {
                                           if (mapdata[keyx][keyy].stars == skiplist[i].stars &&
                                               mapdata[keyx][keyy].wood == skiplist[i].wood &&
                                               mapdata[keyx][keyy].stone == skiplist[i].stone &&
                                               mapdata[keyx][keyy].iron == skiplist[i].iron &&
                                               mapdata[keyx][keyy].food == skiplist[i].food) {
                                               statuses[keyx][keyy] = -2;  // 通過不可
                                               break;
                                           }
                                      }
                                  }
                              }

                              // 通過禁止ブロックの設定（個数上限）
                              for (var i = 0; i < block_ct; i++) {
                                  var keyx = "x" + parseInt(blocks[i].x);
                                  var keyy = "y" + parseInt(blocks[i].y);
                                  statuses[keyx][keyy] = -2;  // 通過不可
                              }

                              // 終点マーカーの座標は無条件通過許可にする
                              var epx = "x" + parseInt(routemarkers[k + 1].x);
                              var epy = "y" + parseInt(routemarkers[k + 1].y);
                              statuses[epx][epy] = -1;

                              //----------------------
                              // 1パス間のルート探索
                              //----------------------
                              var routing = [];
                              var routing_ct = 0;

                              // 始点は各間の開始ポイントとする
                              routing[0] = {x: parseInt(routemarkers[k].x), y: parseInt(routemarkers[k].y)};
                              statuses["x" + routing[0].x]["y" + routing[0].y] = 0;   // 始点の距離は0
                              for (var i = 0; i < routing.length; i++) {

                                  // 現在の座標の距離を取得
                                  var dist = parseInt(statuses["x" + routing[i].x]["y" + routing[i].y]);
 
                                 // 周囲8マスをチェック
                                  for (var j = 0; j < chkptn.length; j++) {

                                      // 調査する座標
                                      var searchx = parseInt(routing[i].x) + parseInt(chkptn[j][0]);
                                      var searchy = parseInt(routing[i].y) + parseInt(chkptn[j][1])
                                      var keyx = "x" + searchx;
                                      var keyy = "y" + searchy;

                                      // マップデータがないばあいは通過不可能な壁とみなす
                                      if (typeof statuses[keyx] == 'undefined') {
                                           continue;
                                      }
                                      if (typeof statuses[keyx][keyy] == 'undefined') {
                                           continue;
                                      }

                                      // 未設定か、距離が長い場合は距離を再設定して積み直す
                                      var nextdist = parseInt(dist) + 1;
                                      if (statuses[keyx][keyy] == -1 || statuses[keyx][keyy] > nextdist) {
                                          statuses[keyx][keyy] = nextdist;
                                          routing_ct ++;
                                          routing[routing_ct] = {x: searchx, y: searchy};
                                      }
                                  }
                              }

                              //-----------
                              // 到達判定
                              //-----------
                              var targetx = "x" + parseInt(routemarkers[k + 1].x);
                              var targety = "y" + parseInt(routemarkers[k + 1].y);
                              if (statuses[targetx][targety] < 0) {
                                  alert("指定されたルートは設定された条件では到達できません");
                                  return false;
                              }

                              //---------------------------------------------------
                              // ルート作成（求まった距離からルートを逆探索する）
                              //---------------------------------------------------
                              var routing = [];
                              var routing_ct = 0;
                              var rest = parseInt(statuses[targetx][targety]);
                              var basex = parseInt(routemarkers[k + 1].x);
                              var basey = parseInt(routemarkers[k + 1].y);
                              routing[0] = {x: basex, y: basey};
                              for (var i = rest - 1; i >= 0; i--) {
                                  var saved = [];
                                  for (var j = 0; j < chkptn.length; j++) {
                                      var searchx = basex + parseInt(chkptn[j][0]);
                                      var searchy = basey + parseInt(chkptn[j][1])
                                      var keyx = "x" + searchx;
                                      var keyy = "y" + searchy;

                                      // マップデータがないばあいは通過不可能な壁とみなす
                                      if (typeof statuses[keyx] == 'undefined') {
                                           continue;
                                      }
                                      if (typeof statuses[keyx][keyy] == 'undefined') {
                                           continue;
                                      }

                                      if (statuses[keyx][keyy] == i) {
                                          // なるべく低資源パネル優先ルートを決める（完璧ではない）
                                          if (saved.length == 0 || saved[0].stars > mapdata[keyx][keyy].stars) {
                                              saved[0] = {stars:mapdata[keyx][keyy].stars, x:searchx, y:searchy};
                                          }
                                      }
                                  }
                                  if (saved.length == 0) {
                                      alert("予期しないエラーが発生しました。");
                                      return false;
                                  }

                                  // 通過した領地レベルを記録
                                  var checkstars = saved[0].stars - 1;
                                  if (limits[checkstars] != -1) {
                                      marks[checkstars] ++;

                                      if (limits[checkstars] < marks[checkstars]) {
                                          // 通過可能上限を超えた
                                          blocks[block_ct] = {x: saved[0].x, y:saved[0].y};
                                          block_ct++;

                                          repeat = 1;         // 上記ブロックを通過不可にして、再評価する
                                          break SEARCH_ALL;   // ルート計算のループを抜ける
                                      }
                                  }

                                  routing_ct ++;
                                  routing[routing_ct] = {x: saved[0].x, y:saved[0].y};
                                  basex = saved[0].x;
                                  basey = saved[0].y;
                              }

                              // ルート記録
                              for (var i = routing_ct; i >= 0; i--) {
                                  if ( k > 0 && i == routing_ct) {
                                       continue;
                                  }
                                  fixed[fixed_ct] = {x: routing[i].x, y:routing[i].y};
                                  fixed_ct ++;
                              }
                          }
                      }

                      //-------------
                      // ルート描画
                      //-------------
                      var allRoutes = "";
                      var lines = 0;
                      for (var i = 0; i < fixed_ct; i++) {
                          var keyx = "x" + fixed[i].x;
                          var keyy = "y" + fixed[i].y;

                          // マップに描画
                          mapdata[keyx][keyy].view_build_route = true;
                          draw_decorate(keyx, keyy);

                          // NPC隣接をチェック
                          var neighbornpc = "";
                          for (var j = 0; j < 8; j++) {

                              // 調査する座標
                              var searchx = parseInt(fixed[i].x) + parseInt(chkptn[j][0]);
                              var searchy = parseInt(fixed[i].y) + parseInt(chkptn[j][1])
                              var nkeyx = "x" + searchx;
                              var nkeyy = "y" + searchy;

                              // マップデータがないばあいは通過不可能な壁とみなす
                              if (typeof statuses[nkeyx] == 'undefined') {
                                   continue;
                              }
                              if (typeof statuses[nkeyx][nkeyy] == 'undefined') {
                                   continue;
                              }
                              if (mapdata[nkeyx][nkeyy].npc == true && mapdata[nkeyx][nkeyy].npcname != "") {
                                   neighbornpc = " NPC隣接(" + mapdata[nkeyx][nkeyy].npcname + ")★" + mapdata[nkeyx][nkeyy].stars;
                                   break;
                              }
                          }

                          var resources = "";
                          if (mapdata[keyx][keyy].base == true) {
                             resources = "個人拠点" + neighbornpc;
                          } else if (mapdata[keyx][keyy].npc == true) {
                             resources = "NPC★" + mapdata[keyx][keyy].stars + "(" + mapdata[keyx][keyy].npcname + ")";
                          } else {
                             resources = "★" + mapdata[keyx][keyy].stars +
                                         '(' + mapdata[keyx][keyy].wood + '-' + mapdata[keyx][keyy].stone + '-' +
                                         mapdata[keyx][keyy].iron + '-' + mapdata[keyx][keyy].food + ")"  + neighbornpc;
                          }
                          allRoutes += '(' + fixed[i].x + ',' + fixed[i].y + ")\t" + resources + "\r\n";
                          lines++;
                      }

                      //-----------------
                      // 結果表示＋選択
                      //-----------------
                      j$("#route").val(allRoutes).select();
                      alert("ルートを作成しました(距離：" + lines + "マス)");

                      return false;
                  }
              );
          }
      }
  );

  //---------------------------
  // 非通過領地のリストを取得
  //---------------------------
  function get_skip_area() {
      var readtext = j$("#skip_area").val();
      var list = [];
      var ct = 0;
      if (readtext != "") {
          var match = readtext.match(/(★[\d]\(\d+-\d+-\d+-\d+\))/g);
          if (match != null) {
              for (var i = 0; i < match.length; i++) {
                  match[i].match(/★(\d)\((\d+)-(\d+)-(\d+)-(\d+)\)/);
                  list[list.length] = {stars: parseInt(RegExp.$1), wood: parseInt(RegExp.$2), stone: parseInt(RegExp.$3), iron: parseInt(RegExp.$4), food: parseInt(RegExp.$5)};
              }
          }
      }
      return list;
  }

  //-------------------
  // 通過制限数の取得
  //-------------------
  function get_limit_count() {
      var readtext = j$("#pass_limit").val();
      var list = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
      if (readtext != "") {
          var match = readtext.match(/(★[\d]\(\d+\))/g);
          if (match != null) {
              for (var i = 0; i < match.length; i++) {
                  match[i].match(/★(\d)\((\d+)\)/);
                  list[parseInt(RegExp.$1) - 1] = parseInt(RegExp.$2);
              }
          }
      }
      return list;
  }

  //-----------------------
  // 空き地検索情報の取得
  //-----------------------
  function get_search_area() {
      var readtext = j$("#search_res").val();
      var list = [];
      var match = readtext.match(/(★[\d]\(\d+-\d+-\d+-\d+\))/g);
      if (match != null) {
          for (var i = 0; i < match.length; i++) {
              match[i].match(/★(\d)\((\d+)-(\d+)-(\d+)-(\d+)\)/);
              list[list.length] = {stars: parseInt(RegExp.$1), wood: parseInt(RegExp.$2), stone: parseInt(RegExp.$3), iron: parseInt(RegExp.$4), food: parseInt(RegExp.$5)};
          }
      }
      return list;
  }

  //--------------------------------------------
  // 現在の条件にあわせてマップの描画を初期化
  //--------------------------------------------
  function draw_conditions() {
      // 非通過領地の取得
      var skiplist = get_skip_area();
      var reslist = get_search_area();

      // 作成済みルートを消す（マップの着色を元に戻す）
      for (keyx in mapdata) {
          for (keyy in mapdata[keyx]) {
              if (!isNaN(parseInt(j$(mapdata[keyx][keyy].map).text()))) {
                  // 非通過領地の再設定
                  mapdata[keyx][keyy].view_skip = false;
                  for (var i = 0; i < skiplist.length; i++) {
                       if (mapdata[keyx][keyy].stars == skiplist[i].stars &&
                           mapdata[keyx][keyy].wood == skiplist[i].wood &&
                           mapdata[keyx][keyy].stone == skiplist[i].stone &&
                           mapdata[keyx][keyy].iron == skiplist[i].iron &&
                           mapdata[keyx][keyy].food == skiplist[i].food) {
                           mapdata[keyx][keyy].view_skip = true;  // 通過不可
                           break;
                       }
                  }

                  // 検索空き地の再設定
                  mapdata[keyx][keyy].view_res = false;
                  for (var i = 0; i < reslist.length; i++) {
                      if (mapdata[keyx][keyy].blank == true &&
                          mapdata[keyx][keyy].stars == reslist[i].stars &&
                          mapdata[keyx][keyy].wood == reslist[i].wood &&
                          mapdata[keyx][keyy].stone == reslist[i].stone &&
                          mapdata[keyx][keyy].iron == reslist[i].iron &&
                          mapdata[keyx][keyy].food == reslist[i].food) {
                          mapdata[keyx][keyy].view_res = true;
                          break;
                      }
                  }
                  draw_decorate(keyx, keyy);
              }
          }
      }
  }

  //-------------------------------
  // 設定に従って座標の装飾を変更
  //-------------------------------
  function draw_decorate(posx, posy) {
    j$(mapdata[posx][posy].map).css({"text-decoration":""});
    if (mapdata[posx][posy].view_build_route == true) {
        j$(mapdata[posx][posy].map).css({'background-color':'indigo'});
        j$(mapdata[posx][posy].map).css({'color':'white'});
    } else if (mapdata[posx][posy].view_route == true) {
        j$(mapdata[posx][posy].map).css({"background-color":"#8a2be2"});
        j$(mapdata[posx][posy].map).css({"color":"white"});
    } else if (mapdata[posx][posy].view_res == true) {
        j$(mapdata[posx][posy].map).css({"background-color":"#4169e1"});
        j$(mapdata[posx][posy].map).css({"color":"white"});
    } else if (mapdata[posx][posy].view_skip == true) {
        j$(mapdata[posx][posy].map).css({"text-decoration":"line-through"});
        j$(mapdata[posx][posy].map).css({'background-color':''});
        j$(mapdata[posx][posy].map).css({'color':'black'});
    } else {
        j$(mapdata[posx][posy].map).css({'background-color':''});
        j$(mapdata[posx][posy].map).css({'color':'black'});
    }
  }

})();

//----------------//
// 個別変数の保存 //
//----------------//
function saveValue(key, value) {
  var key = GM_KEY + key;
  GM_setValue(key, value);
}

//----------------//
// 個別変数の取得 //
//----------------//
function loadValue(key, def) {
  var key = GM_KEY + key;
  var value = GM_getValue(key, "");
  if (value == "") {
    return def;
  }
  return value;
}

//--------------------//
// スクリプト実行判定 //
//--------------------//
function isExecute() {
  // mixi鯖障害回避用: 広告iframe内で呼び出されたら無視
  if (j$("#container").length == 0) {
    return false;
  }

  // 歴史書モードの場合、ツールを動かさない
  if( j$("#sidebar img[title=歴史書]").length > 0 ){
    return false;
  }
  return true;
}

//----------------------//
// Greasemonkey Wrapper //
//----------------------//
function initGMWrapper() {
  // @copyright    2009, James Campos
  // @license    cc-by-3.0; http://creativecommons.org/licenses/by/3.0/
  if ((typeof GM_getValue == 'undefined') || (GM_getValue('a', 'b') == undefined)) {
    GM_addStyle = function (css) {
      var style = document.createElement('style');
      style.textContent = css;
      document.getElementsByTagName('head')[0].appendChild(style);
    };
    GM_deleteValue = function (name) {
      sessionStorage.removeItem(name);
      localStorage.removeItem(name);
    };
    GM_getValue = function (name, defaultValue) {
      var value;
      value = sessionStorage.getItem(name);
      if (!value) {
        value = localStorage.getItem(name);
        if (!value) {
          return defaultValue;
        }
      }
      var type = value[0];
      value = value.substring(1);
      switch (type) {
      case 'b':
        return value == 'true';
      case 'n':
        return Number(value);
      default:
        return value;
      }
    };
    GM_log = function (message) {
      if (window.opera) {
        opera.postError(message);
        return;
      }
      console.log(message);
    };
    GM_registerMenuCommand = function (name, funk) {
      //todo
    };
    GM_setValue = function (name, value) {
      value = (typeof value)[0] + value;
      try {
        localStorage.setItem(name, value);
      } catch (e) {
        localStorage.removeItem(name);
        sessionStorage.setItem(name, value);
        throw e;
      }
    };
  }
}
