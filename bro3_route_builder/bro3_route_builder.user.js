// ==UserScript==
// @name		bro3_route_builder
// @namespace	https://github.com/RAPT21/bro3-tools/
// @description	ブラウザ三国志ルート構築(51x51) with RAPT
// @include		https://*.3gokushi.jp/big_map.php*
// @include		http://*.3gokushi.jp/big_map.php*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @grant		GM_deleteValue
// @grant		GM_getValue
// @grant		GM_setValue
// @author		RAPT
// @version		1.07.1
// ==/UserScript==

// 1.01		2016.03.19	Craford 氏
//						http://silent-stage.air-nifty.com/steps/2016/03/post-60ac.html
// 1.01.1	2017.07.14	RAPT. 2017/07/12 の大型アップデートに伴い、ツールが動作しなくなっていたのを修正
// 1.04		2018.07.25	Craford NPC領地に対応、FF3+GM3系で動かない問題を修正
//						http://silent-stage.air-nifty.com/steps/2018/08/beyond-route_bu.html
// 1.07.1	2021/01/23	公輝・杁耶. マス数が同じなら★数が少ないルートを構築する
// 1.07.2	2021/06/19	公輝・杁耶. 争覇ワールド対応
// 1.07.4	2023.07.14	RAPT. アップデートに伴い、ツールが動作しなくなっていたのを修正。地形1.0マップにも対応
// 1.07.5	2023.11.15	RAPT. 地形2.0対応

var ua = window.navigator.userAgent;

if (ua.indexOf("Firefox") > 0 && GM_info.version >= 4) {
	// Firefox+GreaseMonkey4ではjQueryの読み込み方を変える

	// GreaseMonkeyラッパー関数の定義
	initGMWrapper();

	// load jQuery
	q$ = $;
} else {
	// load jQuery
	jQuery.noConflict();
	q$ = jQuery;
}

// load jQuery
jQuery.noConflict();
q$ = jQuery;

var HOST = location.hostname;		// アクセスURLホスト
var SERVICE = '';					// サービス判定が必要な場合に使用する予約定数
var SVNAME = HOST.substr(0, location.hostname.indexOf(".")) + SERVICE;
var GM_KEY = "RB001_" + HOST.substr(0, HOST.indexOf("."));

//----------------//
// メインルーチン //
//----------------//
// 周囲8マスへの距離
var chkptn = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

(function() {
	// 実行判定
	if (isExecute() === false) {
		return;
	}
	// マップ画面以外はなにもしない
	if (!location.href.match(/big_map.php/)) {
		return;
	}

	// 選択されているマップサイズチェック
	var viewSize = -1;
	if (q$("#change-map-scale2 a.btn_map_51.map-link.selected").length) {
		//地形2.0
		viewSize = 51;
	} else {
		if (q$("#change-map-scale2 div.elevation-map-link").length) {
			//地形1.0
			viewSize = 51;
		} else {
			q$("div[id=change-map-scale2] div a[class*=now]").each(
				function () {
					if (q$(this).attr("class").match(/sort(\d+) now/) !== null) {
						viewSize = RegExp.$1;
					}
				}
			);
		}
	}
	if (viewSize != 51) {
		console.log("viewSize != 51");
		return;
	}

	//[マップスクロール]ボタン//配置修正
	q$("#map-scroll").css({ 'left': '336px' });

	//マップ表示切替ボタン//配置修正
	if (q$("#change-map-scale2 div.elevation-map-link").length) {
		//地形1.0
	} else {
		q$("#change-map-scale2 div.sort").css({ 'width': '180px' });
		q$("#change-map-scale2 div a").css({ 'width': '55px' });
	}

	//[敵対設定表示]ボタン//配置修正
	if (q$('#enemyView2 a').length == 1) {
		q$('#enemyView2 a').css("width", 95);
	} else {
		//争覇ワールド
		if (q$("#emc_map_button li").length == 3) {
			q$("#emc_map_button li").css({ 'width': '27px' });
		}
	}

	//[自動出兵]ボタン
	q$("#toAutoSendTroop").css({ 'left': '119px' });

	// マップデータ保持用
	var mapdata = [];

	// 経路設定マーカー（始点座標、中間座標の保持用）
	var routemarkers = [];

	// 座標指示マーカー（通過禁止、強制通過座標の保持用）
	var positionmarkers = [];

	//------------------------
	// 51x51のマップ情報収集
	//------------------------
	q$("#change-map-scale2 ul").css({ 'width': '350px' });
	q$("#change-map-scale2").after(
		"<div style='margin-left: 209px; margin-top: 58px; font-size: 16px;'>" +
		"<span>" +
		"<a style='font-weight: bold; color: blue;' href='#' id='route_setting'>ルート構築</a>" +
		"</span>" +
		"<span>" +
		"<input type='button' id='routing_start' style='padding: 0px 4px;' value='開始'></input>" +
		"<input type='button' id='restore_map' style='display:none; padding: 0px 4px;' value='終了'></input>" +
		"</span>" +
		"</div>"
	);

	q$("#single-allow-south").after(
		"<div style='text-align: left;'>" +
			"<fieldset id='routing' style='display:none; -moz-border-radius:5px; border-radius: 5px; -webkit-border-radius: 5px; margin-bottom:6px; border: 2px solid black; background-color:#faebd7; margin-left:20px; margin-right:20px; position: absolute; top: 120px; left: 0px; width: 716px; height: 200px; z-index:200;'>" +
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
						"<option value='2'>空き地のみ（NPC領地を含む）</option>" +
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
							"<span style='font-weight: bold;'>空き地を探す：<br>例「★2(0-3-0-0)」</span>" +
							"<input style='font-weight: normal; font-size:12px;' type='button' id='viewres' value='反映'></input>" +
						"</div>" +
						"<textarea cols=40 rows=1 style='font-size:10px; resize:none; overflow:auto; margin-right:6px;' id='search_res'></textarea>" +
					"</div>" +
				"</div>" +
			"</fieldset>" +
		"</div>" +
		"<div>" +
		"<fieldset id='routing2' style='display:none; border-radius: 5px; border: 2px solid black; background-color:#faebd7; position: absolute; top: 35px; left: 510px; height: 64px; margin-right: 20px; z-index:201;'>" +
		"<div style='padding: 4px; text-align: left;'>" +
		"<span style='font-weight: bold;'>生成ルート</span>" +
		"<input style='font-weight: normal; font-size:12px; float:right; margin-left:4px;' type='button' id='clearroute' value='クリア'></input>" +
		"<input style='font-weight: normal; font-size:12px; float:right; margin-left:4px;' type='button' id='viewroute' value='反映'></input>" +
		"<textarea cols=27 rows=2 style='font-size:10px; resize:none; overflow:auto;' id='route'></textarea>" +
		"</div>" +
		"</fieldset>" +
		"</div>"
	);

	q$("#map51-navi").after(
	"<div id='route_info' style='display:none; color:blue; font-weight:bold; float:left; position:absolute; font-size:12px; left:40px; margin-top: 24px;'>左クリックで経路設定、右クリックでルート構築</div>"
	);

	//---------------------
	// 保存ボタン
	//---------------------
	q$("#save_route_setting").click(
		function() {
			q$("#routing").css({'display':'none'});

			saveValue("pass_level", q$("#pass_level").val());	// 探索レベル
			saveValue("pass_area", q$("#pass_area").val());		// 通過対象
			saveValue("skip_area", q$("#skip_area").val());		// 非通過領地
			saveValue("pass_limit", q$("#pass_limit").val());	// 通過数制限
			saveValue("search_res", q$("#search_res").val());	// 領地検索

			alert("保存しました");
		}
	);

	//-------------------------
	// （ルート）クリアボタン
	//-------------------------
	q$("#clearroute").click(
		function() {
			for (var keyx in mapdata) {
				for (var keyy in mapdata[keyx]) {
					if (mapdata[keyx][keyy].view_route === true) {
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
	q$("#viewroute").click(
		function() {
			q$("#clearroute").click();

			var readtext = q$("#route").val();
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
	q$("#viewskiparea").click(
		function() {
			var keyx, keyy;

			// 設定済みの領地をクリア
			for (keyx in mapdata) {
				for (keyy in mapdata[keyx]) {
					if (mapdata[keyx][keyy].view_skip === true) {
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
	q$("#viewres").click(
		function() {
			var keyx, keyy;

			// 設定済みの領地をクリア
			for (keyx in mapdata) {
				for (keyy in mapdata[keyx]) {
					if (mapdata[keyx][keyy].view_res === true) {
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
							if (mapdata[keyx][keyy].blank === true &&
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
	q$("#restore_map").click(
		function() {
			q$("#routing_start").css({'display':'inline-block'});
			q$("#restore_map").css({'display':'none'});
			q$("#map51-content").css({'border':''});
			q$("#routing").css({'display':'none'});
			q$("#routing2").css({'display':'none'});
			q$("#route_info").css({'display':'none'});

			//-------------------------------------------------
			// マップを元に戻す
			//-------------------------------------------------
			for (var keyx in mapdata) {
				for (var keyy in mapdata[keyx]) {
					q$(mapdata[keyx][keyy].map).css({'background-color':''});
					q$(mapdata[keyx][keyy].map).css({'color':'black'});
					q$(mapdata[keyx][keyy].map).css({"text-decoration":""});
					q$(mapdata[keyx][keyy].map).off('click');
					q$(mapdata[keyx][keyy].map).off('contextmenu');
					var url = '/land.php?x=' + mapdata[keyx][keyy].x + '&y=' + mapdata[keyx][keyy].y + '#ptop';
					q$(mapdata[keyx][keyy].map).attr('href', url);
				}
			}
		}
	);

	//-------------------
	// ルート構築モード
	//-------------------
	q$("#route_setting").click(
		function() {
			if (q$("#routing").css('display') === 'none') {
				q$("#routing").css({'display':'block'});
			} else {
				q$("#routing").css({'display':'none'});
			}
		}
	);

	q$("#routing_start").click(
		function() {
			q$("#routing_start").css({'display':'none'});
			q$("#routing2").css({'display':'block'});
			q$("#route_setting").css({'display':'inline-block'});
			q$("#restore_map").css({'display':'inline-block'});
			q$("#route_info").css({'display':'block'});

			q$("#map51-content").css({'border':'3px solid green'});
			var map = q$("#map51-content a[href*='/land.php']");

			q$("#pass_level").val(loadValue("pass_level", "1"));	// 探索レベル
			q$("#pass_area").val(loadValue("pass_area", "0"));	 // 通過対象
			q$("#skip_area").val(loadValue("skip_area", ""));		// 非通過領地
			q$("#pass_limit").val(loadValue("pass_limit", ""));	// 通過数制限
			q$("#search_res").val(loadValue("search_res", ""));	// 領地検索

			//-----------------------
			// マップデータ収集処理
			//-----------------------
			var skiplist = get_skip_area();
			var reslist = get_search_area();
			for (var i = 0; i < map.length; i++) {
				var obj = new Object({});
				obj.map = map[i];

				q$(map[i]).attr('href').match(/x=([-]*\d+).*y=([-]*\d+)#ptop/);
				var x = RegExp.$1;
				var y = RegExp.$2;
				obj.x = x;
				obj.y = y;
				obj.blank = false;
				obj.npc_territory = false;
				obj.npc = false;
				obj.npcname = "";
				obj.base = false;
				obj.view_route = false;
				obj.view_res = false;
				obj.view_skip = false;
				obj.view_build_route = false;
				obj.text = q$(map[i]).text();

				// 領地の状態の設定
				var mtext = q$(map[i]).attr('onmouseover');
				if ( mtext.match(/空き地/) !== null ) {
					obj.blank = true;
				}
				if ( mtext.match(/君主名<\/dt><dd>NPC/) !== null ) {
					obj.npc_territory = true;
				}
				obj.stars = -1;
				obj.wood = 0;
				obj.stone = 0;
				obj.iron = 0;
				obj.food = 0;
				var match = mtext.match(/戦力.*>([★]+)\[?\d?\]?<.*木(\d+).*岩(\d+).*鉄(\d+).*糧(\d+)/);
				if (match !== null) {
					obj.stars = RegExp.$1.length;
					obj.wood = parseInt(RegExp.$2, 10);
					obj.stone = parseInt(RegExp.$3, 10);
					obj.iron = parseInt(RegExp.$4, 10);
					obj.food = parseInt(RegExp.$5, 10);
					// 白地図モード搭載するときはこれを外す
//					q$(map[i]).css({"background-color":"white"});
				} else if(mtext.match(/npc-red-star/) !== null) {
					obj.npc = true;
					mtext.match(/bigmap-caption">(.*)<\/dt><dd class="bigmap-subcap.*npc-red-star">([★]+).*</);
					obj.npcname = RegExp.$1;
					obj.stars = RegExp.$2.length;
				} else {
					obj.base = true;
				}

				// 非通過領地の判定
				var j;
				for (j = 0; j < skiplist.length; j++) {
					if (obj.stars == skiplist[j].stars &&
						obj.wood == skiplist[j].wood &&
						obj.stone == skiplist[j].stone &&
						obj.iron == skiplist[j].iron &&
						obj.food == skiplist[j].food) {
						obj.view_skip = true;	// 通過不可
						break;
					}
				}

				// 検索した空き地の判定
				for (j = 0; j < reslist.length; j++) {
					if (obj.blank === true &&
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
				q$(map[i]).attr('href', '#');

				// 領地の状態を描画
				draw_decorate(keyx, keyy);

				//---------------------------------
				// マップを左クリックした時の動作
				//---------------------------------
				q$(map[i]).on('click',
					function(event) {
						var keyx, keyy;

						//-------------------------------------------------
						// 作成済みルートを消す（マップの着色を元に戻す）
						//-------------------------------------------------
						for (keyx in mapdata) {
							for (keyy in mapdata[keyx]) {
								if (mapdata[keyx][keyy].view_build_route === true) {
									mapdata[keyx][keyy].view_build_route = false;
								}
							}
						}
						draw_conditions();

						//---------------------------------
						// クリックされたマップ座標の取得
						//---------------------------------
						q$(this).attr('onmouseover').match(/距離<.*\(([-]*\d+),([-]*\d+)\)/);
						var mx = RegExp.$1;
						var my = RegExp.$2;
						var deleted = false;
						var i;
						if (routemarkers.length !== 0) {
							// すでに同じ座標がいたら解除
							keyx = "x" + mx;
							keyy = "y" + my;
							var target = -1;
							for (i = 0; i < routemarkers.length; i++) {
								if (routemarkers[i].x == mx && routemarkers[i].y == my) {
									target = i;
									break;
								}
							}
							// 解除ポイントから先の中間点をすべて削除
							if (target >= 0) {
								for (i = target; i < routemarkers.length; i++) {
									keyx = "x" + routemarkers[i].x;
									keyy = "y" + routemarkers[i].y;
									draw_decorate(keyx, keyy);
									q$(mapdata[keyx][keyy].map).text(mapdata[keyx][keyy].text);
								}
								routemarkers.splice(target, routemarkers.length - target + 1);
								deleted = true;
							}
						}

						//--------------------------------------------------
						// 削除でない場合は、クリックした座標をマーキング
						//--------------------------------------------------
						if (deleted === false) {
							if (routemarkers.length > 20) {
								alert("経由ルートはこれ以上指定できません。");
								return false;
							}
							var obj = new Object({});
							obj.x = mx;
							obj.y = my;
							if (routemarkers.length === 0) {
								q$(this).css({ "background-color": "indigo" });
								q$(this).text("S").css({ "color": "white" });
							} else {
								var str = String.fromCharCode(0x60 + routemarkers.length);
								q$(this).css({ "background-color": "indigo" });
								q$(this).text(str).css({ "color": "white" });
							}
							routemarkers.push(obj);
						}
						return false;
					}
				);

				//---------------------------------
				// マップを右クリックした時の動作
				//---------------------------------
				q$(map[i]).on('contextmenu',
					function() {
						if (routemarkers.length < 2) {
							alert("ルート構築用の座標が設定されていません。");
							return false;
						}

						//-------------------------------------------------
						// 作成済みルートを消す（マップの着色を元に戻す）
						//-------------------------------------------------
						for (var keyx in mapdata) {
							for (var keyy in mapdata[keyx]) {
								if (mapdata[keyx][keyy].view_build_route === true) {
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
							var pass_level = parseInt(q$("#pass_level").val(), 10);
							var pass_area = q$("#pass_area").val();

							var marks = [0, 0, 0, 0, 0, 0, 0, 0, 0];
							repeat = 0;	// 再評価オフ

							SEARCH_ALL: for (var k = 0; k < routemarkers.length - 1; k++) {
								var i;

								//-------------------------------
								// ルート探索事前処理
								//-------------------------------
								var statuses = [];
								var sumOfStars = [];
								for (keyx in mapdata) {
									statuses[keyx] = [];
									sumOfStars[keyx] = [];
									for (keyy in mapdata[keyx]) {
										statuses[keyx][keyy] = -1;	// 未設定

										//-----------------------
										// 固定通過条件設定処理
										//-----------------------
										if (mapdata[keyx][keyy].stars > pass_level || mapdata[keyx][keyy].npc === true || mapdata[keyx][keyy].base === true) {
											statuses[keyx][keyy] = -2;	// 通過不可
											continue;
										}
										if (pass_area == '0' && mapdata[keyx][keyy].blank === false) {
											statuses[keyx][keyy] = -2;	// 通過不可
											continue;
										}
										if (pass_area == '2' && mapdata[keyx][keyy].blank === false && mapdata[keyx][keyy].npc_territory === false) {
											statuses[keyx][keyy] = -2;	// 通過不可
											continue;
										}
										for (i = 0; i < skiplist.length; i++) {
											if (mapdata[keyx][keyy].stars == skiplist[i].stars &&
												mapdata[keyx][keyy].wood == skiplist[i].wood &&
												mapdata[keyx][keyy].stone == skiplist[i].stone &&
												mapdata[keyx][keyy].iron == skiplist[i].iron &&
												mapdata[keyx][keyy].food == skiplist[i].food) {
												statuses[keyx][keyy] = -2;	// 通過不可
												break;
											}
										}
									}
								}

								// 通過禁止ブロックの設定（個数上限）
								for (i = 0; i < block_ct; i++) {
									var keyx = "x" + parseInt(blocks[i].x, 10);
									var keyy = "y" + parseInt(blocks[i].y, 10);
									statuses[keyx][keyy] = -2;	// 通過不可
								}

								// 終点マーカーの座標は無条件通過許可にする
								var epx = "x" + parseInt(routemarkers[k + 1].x, 10);
								var epy = "y" + parseInt(routemarkers[k + 1].y, 10);
								statuses[epx][epy] = -1;

								//----------------------
								// 1パス間のルート探索
								//----------------------
								var routing = [];
								var routing_ct = 0;

								// 始点は各間の開始ポイントとする
								routing[0] = { x: parseInt(routemarkers[k].x, 10), y: parseInt(routemarkers[k].y, 10) };
								statuses["x" + routing[0].x]["y" + routing[0].y] = 0;	// 始点の距離は0
								sumOfStars["x" + routing[0].x]["y" + routing[0].y] = 0;	// 始点の★合計は0
								for (var i = 0; i < routing.length; i++) {

									// 現在の座標の距離を取得
									var dist = parseInt(statuses["x" + routing[i].x]["y" + routing[i].y], 10);
									var sumOf = sumOfStars["x" + routing[i].x]["y" + routing[i].y];

									// 周囲8マスをチェック
									for (var j = 0; j < chkptn.length; j++) {

										// 調査する座標
										var searchx = parseInt(routing[i].x, 10) + parseInt(chkptn[j][0], 10);
										var searchy = parseInt(routing[i].y, 10) + parseInt(chkptn[j][1], 10);
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
										var nextdist = parseInt(dist, 10) + 1;
										var nextsumof = sumOf + mapdata[keyx][keyy].stars;
										if (statuses[keyx][keyy] == -1 || statuses[keyx][keyy] > nextdist || (statuses[keyx][keyy] == nextdist && sumOfStars[keyx][keyy] > nextsumof)) {
											statuses[keyx][keyy] = nextdist;
											sumOfStars[keyx][keyy] = nextsumof;
											routing_ct ++;
											routing[routing_ct] = { x: searchx, y: searchy };
										}
									}
								}

								//-----------
								// 到達判定
								//-----------
								var targetx = "x" + parseInt(routemarkers[k + 1].x, 10);
								var targety = "y" + parseInt(routemarkers[k + 1].y, 10);
								if (statuses[targetx][targety] < 0) {
									alert("指定されたルートは設定された条件では到達できません");
									return false;
								}

								//---------------------------------------------------
								// ルート作成（求まった距離からルートを逆探索する）
								//---------------------------------------------------
								var routing = [];
								var routing_ct = 0;
								var rest = parseInt(statuses[targetx][targety], 10);
								var basex = parseInt(routemarkers[k + 1].x, 10);
								var basey = parseInt(routemarkers[k + 1].y, 10);
								routing[0] = { x: basex, y: basey };
								for (var i = rest - 1; i >= 0; i--) {
									var saved = [];
									for (var j = 0; j < chkptn.length; j++) {
										var searchx = basex + parseInt(chkptn[j][0], 10);
										var searchy = basey + parseInt(chkptn[j][1], 10);
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
											if (saved.length == 0 || saved[0].sumOfStars > sumOfStars[keyx][keyy]) {
												saved[0] = { sumOfStars: sumOfStars[keyx][keyy], stars: mapdata[keyx][keyy].stars, x: searchx, y: searchy };
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
											blocks[block_ct] = { x: saved[0].x, y: saved[0].y };
											block_ct++;

											repeat = 1;		 // 上記ブロックを通過不可にして、再評価する
											break SEARCH_ALL;	// ルート計算のループを抜ける
										}
									}

									routing_ct ++;
									routing[routing_ct] = { x: saved[0].x, y: saved[0].y };
									basex = saved[0].x;
									basey = saved[0].y;
								}

								// ルート記録
								for (var i = routing_ct; i >= 0; i--) {
									if (k > 0 && i == routing_ct) {
										continue;
									}
									fixed[fixed_ct] = { x: routing[i].x, y: routing[i].y };
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
								var searchx = parseInt(fixed[i].x, 10) + parseInt(chkptn[j][0], 10);
								var searchy = parseInt(fixed[i].y, 10) + parseInt(chkptn[j][1], 10);
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
									mapdata[keyx][keyy].iron + '-' + mapdata[keyx][keyy].food + ")" + neighbornpc;
								if (mapdata[keyx][keyy].npc_territory == true) {
									resources += ' NPC領地';
								}
							}
							allRoutes += '(' + fixed[i].x + ',' + fixed[i].y + ")\t" + resources + "\r\n";
							lines++;
						}

						//-----------------
						// 結果表示＋選択
						//-----------------
						q$("#route").val(allRoutes).select();
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
		var readtext = q$("#skip_area").val();
		var list = [];
		var ct = 0;
		if (readtext !== "") {
			var match = readtext.match(/(★[\d]\(\d+-\d+-\d+-\d+\))/g);
			if (match !== null) {
				for (var i = 0; i < match.length; i++) {
					match[i].match(/★(\d)\((\d+)-(\d+)-(\d+)-(\d+)\)/);
					list[list.length] = { stars: parseInt(RegExp.$1, 10), wood: parseInt(RegExp.$2, 10), stone: parseInt(RegExp.$3, 10), iron: parseInt(RegExp.$4, 10), food: parseInt(RegExp.$5, 10) };
				}
			}
		}
		return list;
	}

	//-------------------
	// 通過制限数の取得
	//-------------------
	function get_limit_count() {
		var readtext = q$("#pass_limit").val();
		var list = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
		if (readtext !== "") {
			var match = readtext.match(/(★[\d]\(\d+\))/g);
			if (match !== null) {
				for (var i = 0; i < match.length; i++) {
					match[i].match(/★(\d)\((\d+)\)/);
					list[parseInt(RegExp.$1, 10) - 1] = parseInt(RegExp.$2, 10);
				}
			}
		}
		return list;
	}

	//-----------------------
	// 空き地検索情報の取得
	//-----------------------
	function get_search_area() {
		var readtext = q$("#search_res").val();
		var list = [];
		var match = readtext.match(/(★[\d]\(\d+-\d+-\d+-\d+\))/g);
		if (match !== null) {
			for (var i = 0; i < match.length; i++) {
				match[i].match(/★(\d)\((\d+)-(\d+)-(\d+)-(\d+)\)/);
				list[list.length] = { stars: parseInt(RegExp.$1, 10), wood: parseInt(RegExp.$2, 10), stone: parseInt(RegExp.$3, 10), iron: parseInt(RegExp.$4, 10), food: parseInt(RegExp.$5, 10) };
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
				if (!isNaN(parseInt(q$(mapdata[keyx][keyy].map).text(), 10))) {
					// 非通過領地の再設定
					mapdata[keyx][keyy].view_skip = false;
					for (var i = 0; i < skiplist.length; i++) {
						if (mapdata[keyx][keyy].stars == skiplist[i].stars &&
							mapdata[keyx][keyy].wood == skiplist[i].wood &&
							mapdata[keyx][keyy].stone == skiplist[i].stone &&
							mapdata[keyx][keyy].iron == skiplist[i].iron &&
							mapdata[keyx][keyy].food == skiplist[i].food) {
							mapdata[keyx][keyy].view_skip = true;	// 通過不可
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
		q$(mapdata[posx][posy].map).css({ "text-decoration": "" });
		if (mapdata[posx][posy].view_build_route === true) {
			q$(mapdata[posx][posy].map).css({ 'background-color': 'indigo' });
			q$(mapdata[posx][posy].map).css({ 'color': 'white' });
		} else if (mapdata[posx][posy].view_route === true) {
			q$(mapdata[posx][posy].map).css({ "background-color": "#8a2be2" });
			q$(mapdata[posx][posy].map).css({ "color": "white" });
		} else if (mapdata[posx][posy].view_res === true) {
			q$(mapdata[posx][posy].map).css({ "background-color": "#4169e1" });
			q$(mapdata[posx][posy].map).css({ "color": "white" });
		} else if (mapdata[posx][posy].view_skip === true) {
			q$(mapdata[posx][posy].map).css({ "text-decoration": "line-through" });
			q$(mapdata[posx][posy].map).css({ 'background-color': '' });
			q$(mapdata[posx][posy].map).css({ 'color': 'black' });
		} else {
			q$(mapdata[posx][posy].map).css({ 'background-color': '' });
			q$(mapdata[posx][posy].map).css({ 'color': 'black' });
		}
	}

})();

//----------------//
// 個別変数の保存 //
//----------------//
function saveValue(key, value) {
	var wkey = GM_KEY + key;
	GM_setValue(wkey, value);
}

//----------------//
// 個別変数の取得 //
//----------------//
function loadValue(key, def) {
	var wkey = GM_KEY + key;
	var value = GM_getValue(wkey, "");
	if (value === "") {
		return def;
	}
	return value;
}

//--------------------//
// スクリプト実行判定 //
//--------------------//
function isExecute() {
	// mixi鯖障害回避用: 広告iframe内で呼び出されたら無視
	if (q$("#container").length === 0) {
		return false;
	}

	// 歴史書モードの場合、ツールを動かさない
	if (q$("#sidebar img[title=歴史書]").length > 0) {
		return false;
	}
	return true;
}

//----------------------//
// Greasemonkey Wrapper //
//----------------------//
// Firefox + GreaseMonkey4 でGMラッパー関数を動かすための定義
function initGMWrapper() {
	// @copyright		2009, James Campos
	// @license		cc-by-3.0; http://creativecommons.org/licenses/by/3.0/
	if ((typeof GM_getValue == 'undefined') || (GM_getValue('a', 'b') == undefined)) {
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
