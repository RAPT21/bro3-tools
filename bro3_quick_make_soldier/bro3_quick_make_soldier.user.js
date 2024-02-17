// ==UserScript==
// @name		bro3_quick_make_soldier
// @namespace	https://github.com/RAPT21/bro3-tools/
// @description	ブラウザ三国志 援軍造兵＋派遣
// @include		http://*.3gokushi.jp/village.php*
// @include		https://*.3gokushi.jp/village.php*
// @include		http://*.3gokushi.jp/land.php*
// @include		https://*.3gokushi.jp/land.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://*.3gokushi.jp/maintenance*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @grant		GM_getValue
// @grant		GM_setValue
// @author		RAPT
// @version 	1.1
// ==/UserScript==
jQuery.noConflict();


// ▼概要
// 都市画面で動作します。
// サイドバーの拠点の横に追加されたリンクをクリックすると、造兵即完可能だった場合に、その拠点で兵士キャパ上限で造兵できます。
// 援軍派遣モードに切り替えることで、その拠点に待機しているすべての兵士を指定座標へ援軍出兵します。
// 援軍派遣モードに切り替えると、「警護」リンクが表示されます。これをクリックで警護出兵画面を表示します。
//
// ▼特徴
// 造兵兵種を選択できます。デフォルトは重盾兵です。
// └初期状態では通常南蛮に使用しない兵種はコメントアウトしています。ソース内の兵種対応表のコメントアウトをいじることで変更できます。
//
// ▼援軍派遣先
// 援軍派遣先はサイドバー内で指定します。ここに手入力した座標は保存されません。
// 土地画面下部に援軍出兵先を設定するリンクが追加されます。そのリンククリックで座標が保存されます。
//
// ▼既知の不具合
// 明らかに兵キャパがあるにも関わらず、兵キャパ取得に失敗し「兵0」と表示されることがあります。
// その場合は、その拠点に手動で移動後、再度造兵リンクをクリックしてみてください。


// 2023.02.14	0.1	クリックで拠点移動＆重盾造兵。
// 2023.06.01	0.2	造兵種別選択機能追加。援軍派遣モード追加。
// 2023.06.02	0.3	援軍派遣モードのとき、警護リンクをクリックで警護出兵画面に切り替えるように。
// 2023.06.03	1.0	初公開。
// 2024.01.18	1.1	地形1.0で、基本鋭兵の造兵ができなくなっていたのを修正


var SERVER_SCHEME = location.protocol + "//";
var SERVER_BASE = SERVER_SCHEME + location.hostname;

var SERVER_NAME = location.hostname.match(/^(.*)\.3gokushi/)[1];
var SAVENAME = SERVER_NAME + "_bro3_quick_make_soldier_20230214_"; //グリモン領域への保存時のPGの名前;


//----------------------------------------
// 保存設定部品定義
//----------------------------------------
var g_options = {};

var AXIS_01 = 'qax01';	// 援軍派遣先X座標
var AXIS_02 = 'qax02';	// 援軍派遣先Y座標


//----------------------------------------
// 兵種対応表
//----------------------------------------
var IDX_NAME = 0;
var IDX_TYPE = 1;
var IDX_ID = 2;
var IDX_CAN = 3;
var IDX_X = 4;
var IDX_Y = 5;
var IDX_FACILITY = 6;

var armyTable = {
			// 兵種			, type					,ID,即完可,x,y,造兵施設],
//	剣兵	: ['剣兵'		, 'infantry_count'		, 301, 0, 0, 0, '練兵所'],
//	盾兵	: ['盾兵'		, 'shield_count'		, 316, 0, 0, 0, '練兵所'],
//	槍兵	: ['槍兵'		, 'spear_count'			, 303, 0, 0, 0, '兵舎'],
//	弓兵	: ['弓兵'		, 'archer_count'		, 308, 0, 0, 0, '弓兵舎'],
//	騎兵	: ['騎兵'		, 'cavalry_count'		, 305, 0, 0, 0, '厩舎'],
//	衝車	: ['衝車'		, 'ram_count'			, 312, 0, 0, 0, '兵器工房'],
//	斥候	: ['斥候'		, 'scout_count'			, 310, 0, 0, 0, '練兵所'],
//	大剣兵	: ['大剣兵'		, 'large_infantry_count', 315, 0, 0, 0, '練兵所'],
	重盾兵	: ['重盾兵'		, 'heavy_shield_count'	, 317, 0, 0, 0, '練兵所'],
//	矛槍兵	: ['矛槍兵'		, 'halbert_count'		, 304, 0, 0, 0, '兵舎'],
//	弩兵	: ['弩兵'		, 'crossbow_count'		, 309, 0, 0, 0, '弓兵舎'],
	近衛騎兵: ['近衛騎兵'	, 'cavalry_guards_count', 307, 0, 0, 0, '厩舎'],
//	投石機	: ['投石機'		, 'catapult_count'		, 313, 0, 0, 0, '兵器工房'],
//	斥候騎兵: ['斥候騎兵'	, 'cavalry_scout_count'	, 311, 0, 0, 0, '厩舎'],
	戦斧兵	: ['戦斧兵'		, 'axe_count'			, 318, 0, 0, 0, '斧兵舎'],
	双剣兵	: ['双剣兵'		, 'twin_count'			, 319, 0, 0, 0, '双兵舎'],
	大錘兵	: ['大錘兵'		, 'spindle_count'		, 320, 0, 0, 0, '錘兵舎']
};


//----------------------------------------
// 兵種を指定して兵種情報を取得。該当なしのとき null を返す
//----------------------------------------
function armyInfo(index, expectedValue) {
	var keys = Object.keys(armyTable);
	for (var i = 0; i < keys.length; i++) {
		var element = armyTable[keys[i]];
		if (element[index] == expectedValue) {
			return element;
		}
	}
	return null;
}
function armyInfoById(value) {
	return armyInfo(IDX_ID, value);
}


//==========[本体]==========
(function($) {

	// 広告iframe内で呼び出された場合は無視
	if (!$("#container").length) {
		return;
	}

	// 歴史書モードの場合は無視
	if ($("#sidebar img[title=歴史書]").length){
		return;
	}

	// 設定読込
	loadSettings();

	// 領地画面
	if (location.pathname === '/land.php') {
		landOperation();
	}

	// 都市画面
	if (location.pathname === '/village.php') {
		villageOperation();
	}

	//========================================

	//----------------------------------------
	// 造兵する
	//----------------------------------------
	function makeSoldier(x, y, unitId, count, callback) {
		var c = {
			x: `${x}`,
			y: `${y}`,
			unit_id: `${unitId}`,
			count: `${count}`
		};
		$.post(`${SERVER_BASE}/facility/facility.php?x=${x}&y=${y}`, c, function(){
			if (callback) {
				callback("造兵完了");
			}
		});
	}


	//----------------------------------------
	// 指定拠点へ移動後、造兵情報を収集
	//----------------------------------------
	function changeVillage(vId, callback) {
		$.ajax({
			url: `${SERVER_BASE}/village_change.php`,
			type: 'GET',
			datatype: 'html',
			cache: false,
			data: {
				village_id: vId
			}
		}).done(function(res){
			getMakeSoldierInfo(res, callback);
		});
	}


	//----------------------------------------
	// 拠点の造兵情報を収集
	//----------------------------------------
	function getMakeSoldierInfo(res, callback) {
		// 兵キャパ
		var vacancy = 0;
		var m = $("#basepoint .status table tbody tr td:eq(3)", res).text().trim().match(/(\d+)\/(\d+)/);
		if (m !== null && m.length >= 3) {
			vacancy = parseInt(m[2], 10) - parseInt(m[1], 10);
		}
		if (vacancy < 1) {
			if (callback) {
				callback([], 0);
			}
			return;
		}

		// 拠点の造兵施設を収集
		var resp = $("<div />").append(res);
		var xy = [];
		$("#mapOverlayMap area", resp).each(function(index, area){
			if ($(area).attr("alt").match(/(.*?)\s*LV.+/)) {
				var name = RegExp.$1;
				var url = $(area).attr("href");
				if (url.match(/\?x=(\d+)&y=(\d+)#/)) {
					var x = RegExp.$1;
					var y = RegExp.$2;
					var facility = armyInfoById($("#qmsArmyOptions").val())[IDX_FACILITY];
					if ([facility].indexOf(name) >= 0) {
						xy.push([url, x, y]);
					}
				}
			}
		});
		if (xy.length === 0) {
			// 造兵施設がない
			if (callback) {
				callback([], vacancy);
			}
			return;
		}

		// 各造兵施設から兵種ごとの情報を収集
		var timer = null;
		var wait = false;
		var i = 0;
		var facilities = [];
		var func = function() {
			if (wait) {
				return;
			}
			wait = true;

			var url = xy[i][0];
			var x = xy[i][1];
			var y = xy[i][2];
			$.ajax({
				url: `${SERVER_BASE}/${url}`,
				type: 'GET',
				datatype: 'html'
			}).done(function(res2){
				var resp2 = $("<div />").append(res2);
				$("th.mainTtl", resp2).each(function(index, mainTtl){
					if (index === 0) { return true; }

					var sol_name = $(mainTtl).text().replace(/\[.+\]/, "");
					var time = $("td", $(mainTtl).closest("tr").next().next().next().next()).text();
					if (Object.keys(armyTable).indexOf(sol_name) >= 0) {
						armyTable[sol_name][IDX_CAN] = /00:00:0[01]/.test(time); // 即完のみ作成可能とする
						armyTable[sol_name][IDX_X] = x;
						armyTable[sol_name][IDX_Y] = y;
						facilities.push(sol_name);
					}
				});

				// ループ終了判定
				i++;
				if (i >= xy.length) {
					clearInterval(timer);
					timer = null;
					if (callback) {
						callback(facilities, vacancy);
					}
				}
				wait = false;
			});
		};
		timer = setInterval(func, 1500);
	}


	//----------------------------------------
	// 指定拠点へ移動後、援軍出兵
	//----------------------------------------
	function changeVillageAndSendTroop(vId, x, y, callback) {
		$.ajax({
			url: `${SERVER_BASE}/village_change.php`,
			type: 'GET',
			datatype: 'html',
			cache: false,
			data: {
				village_id: vId
			}
		}).done(function(){
			$.ajax({
				url: `${SERVER_BASE}/facility/castle_send_troop.php`,
				type: 'GET',
				datatype: 'html',
				cache: false,
				data: {
					x: `${x}`,
					y: `${y}`
				}
			}).done(function(res){
				getHelpSoldierInfo(res, x, y, callback);
			}).fail(function(){
				console.log("[qms] 援軍出兵エラー");
				if (callback) {
					callback("E2");
				}
			});
		}).fail(function(){
			console.log("[qms] 拠点移動エラー");
			if (callback) {
				callback("E1");
			}
		});
	}


	//----------------------------------------
	// 出兵可能兵種と兵数を収集
	//----------------------------------------
	function getHelpSoldierInfo(res, x, y, callback) {
		var sols = {};
		$("table.commonTablesNoMG tr td span", res).each(function(){
			if ($(this).text().match(/\((\d+)\)/)) {
				var num = parseInt(RegExp.$1, 10);
				if (num > 0) {
					var ep = $(this).attr("onclick");
					if (ep.indexOf("setObjectValue(") === 0) {
						// onclick="setObjectValue('friendly_army_heavy_shield_count', '40000')" -> ['friendly_army_heavy_shield_count', '40000']
						var code = ep.replace("setObjectValue(", "[").replace(/\)$/, "]");
						var info = eval(code);
						if (info !== null && info.length === 2) {
							sols[info[0]] = info[1];
						}
					}
				}
			}
		});

		if (Object.keys(sols).length === 0) {
			console.log("[qms] 兵キャパ0のため造兵できませんでした。");
			if (callback) {
				callback("兵0");
			}
			return;
		}
		sendHelpArmy(x, y, sols, callback);
	}


	//----------------------------------------
	// 援軍を確認なしで発射
	//----------------------------------------
	function sendHelpArmy(x, y, soldierDictionary, callback) {
		var c = {
			village_x_value: x,
			village_y_value: y,
			unit_assign_card_id: 0,
			radio_move_type: 301,
			deck_mode: 1,
			radio_reserve_type: 0,
			card_id: 204,
			radio_enhanced_loyalty_attack: 0,
			btn_send: '出兵'
		};

		var keys = Object.keys(soldierDictionary);
		for (var i = 0; i < keys.length; i++) {
			c[keys[i]] = soldierDictionary[keys[i]];
		}

		$.post({
			url: `${SERVER_BASE}/facility/castle_send_troop.php`,
			data: c
		}).done(function(){
			console.log(`[qms] 援軍出兵成功: (${x},${y})`);
			if (callback) {
				callback("済");
			}
		}).fail(function(){
			console.log("[qms] 援軍出兵エラー");
			if (callback) {
				callback("E3");
			}
		});
	}


	//----------------------------------------
	// 造兵リンクを作成
	//----------------------------------------
	function addLink(vId, target) {
		var rawId = `qmsMakeSol-${vId}`;
		var thisId = `#${rawId}`;
		var link = $("<a />", {
			id: rawId,
			style: 'margin-left: 4px; cursor: pointer;',
			on: {
				click: function(){
					$(target).off('click');

					$(thisId).text("処理中");
					var isChecked = $("#qmsSendHelpCheckBox").is(':checked');
					if (isChecked) {
						// 援軍
						var coord = getCoordinate();
						if (coord && coord.length === 2) {
							var x = coord[0];
							var y = coord[1];
							changeVillageAndSendTroop(vId, x, y, function(msg){
								$(thisId).text(msg);
							});
						} else {
							$(thisId).text("座標不正");
						}
					} else {
						// 造兵
						changeVillage(vId, function(sol_names, capacity){
							if (capacity === 0) {
								$(thisId).text("キャパ0");
								return
							}

							var element = armyInfoById($("#qmsArmyOptions").val());
							if (sol_names.indexOf(element[IDX_NAME]) < 0) {
								$(thisId).text("造兵不可");
								return
							}
							if (element[IDX_CAN]) {
								// 即完可能
								makeSoldier(element[IDX_X], element[IDX_Y], element[IDX_ID], capacity, function(msg){
									$(thisId).text(msg);
								});
							} else {
								$(thisId).text("即完不可");
							}
						});
					}
				}
			}
		}).append("造兵");
		$(target).parent().append(link);
	}


	//----------------------------------------
	// 援軍の送り先座標を配列で返す。座標がないまたはフォーマット不正時は null を返す
	//----------------------------------------
	function getCoordinate() {
		var x = $('#qmsCoordinateX').val().trim();
		var y = $('#qmsCoordinateY').val().trim();

		// 座標の妥当性判断
		var re = /^[-]?\d+$/;
		if (re.test(x) && re.test(y)) {
			return [x, y];
		}

		return null;
	}


	//----------------------------------------
	// サイドバーに援軍派遣先座標を追加
	//----------------------------------------
	function addCoordinateBox() {
		// 造兵モードか、援軍派遣モードかで表示を切り替える
		var cb = $("<input />", {
			id: 'qmsSendHelpCheckBox',
			type: 'checkbox',
			style: 'margin-top: 6px;',
			on: {
				click: function(){
					var isChecked = $(this).is(':checked');
					$("#qmsCoordinateBox").toggle();
					$("#qmsSendDefense").toggle();
					$("#qmsArmyTypeBox").toggle();
					$('a[id^="qmsMakeSol-"]').each(function(){
						if (isChecked) {
							$(this).text("援軍");
						} else {
							$(this).text("造兵");
						}
					});
				}
			}
		});
		var label = $("<label />", {
			for: 'qmsSendHelpCheckBox',
			id: 'qmsSendHelpCheckLabel',
			style: 'margin-left: 4px; font-size: 90%; color: white;'
		}).append("援軍派遣モード");

		// 警護出兵画面を表示するリンク：初期非表示、援軍派遣モードOnで表示
		var anchor = $("<a />", {
			id: 'qmsSendDefense',
			style: 'margin-left: 4px; cursor: pointer; font-size: 85%; text-decoration: underline; padding-bottom: 2px; display: none;',
			on: {
				click: function(){
					$(this).off('click');
					var coord = getCoordinate();
					if (coord && coord.length === 2) {
						var x = coord[0];
						var y = coord[1];
						location.href = `${SERVER_BASE}/facility/castle_send_troop.php?x=${x}&y=${y}&deck_mode=2#ptop`;
					}
				}
			}
		}).append("警護");

		// 援軍派遣先座標欄：初期非表示、援軍派遣モードOnで表示
		var coordinateX = $("<input />", {
			id: 'qmsCoordinateX',
			type: 'text',
			maxlength: '6',
			size: '6',
			style: 'text-align: center;'
		});
		var coordinateY = $("<input />", {
			id: 'qmsCoordinateY',
			type: 'text',
			maxlength: '6',
			size: '6',
			style: 'text-align: center;'
		});
		var coordinateBox = $("<div />", {
			id: 'qmsCoordinateBox',
			style: 'display: none;'
		});

		// レイアウト
		coordinateBox
			.append(coordinateX)
			.append(coordinateY)
			.insertBefore($("#sidebar div.basename"));
		label.insertBefore(coordinateBox);
		cb.insertBefore(label);
		label.after(anchor);

		// 保存されている派遣先座標をセット
		coordinateX.val(g_options[AXIS_01]);
		coordinateY.val(g_options[AXIS_02]);
	}


	//----------------------------------------
	// サイドバーに造兵兵種選択肢を追加
	//----------------------------------------
	function addArmyType() {
		var rawId = "qmsArmyOptions";
		var selectId = `#${rawId}`;

		var label = $("<label />", {
			for: rawId,
			style: 'color: white; font-size: 90%; margin-right: 4px;'
		}).append("造兵種別");
		var sel = $("<select />", {
			id: rawId
		});

		var boxId = "qmsArmyTypeBox";
		$("<div />", {
			id: boxId
		}).insertBefore($("#sidebar div.basename"));
		$(`#${boxId}`)
			.append(label)
			.append(sel);

		var keys = Object.keys(armyTable);
		for (var i = 0; i < keys.length; i++) {
			var element = armyTable[keys[i]];
			$(selectId).append($("<option />", {
				value: element[IDX_ID],
				text: element[IDX_NAME]
			}));
		}
		$(selectId).val(armyTable['重盾兵'][IDX_ID]); // デフォルトは重盾兵
	}


	//----------------------------------------
	// サイドバーの拠点リストにリンクを追加
	//----------------------------------------
	function villageOperation() {

		// 援軍派遣先入力BOXを作成
		addCoordinateBox();
		addArmyType();

		// 選択拠点はURLがないため、拠点IDを画面から取得してリンク作成
		var thisVId = $("#basepointEditName #name input[name='village_id']").val();
		$("#sidebar div.basename ul li.on a.map-basing").each(function(){
			addLink(thisVId, this);
		});

		// 自拠点リストから拠点IDを取得してリンク作成
		$("#sidebar div.basename ul li a[href*='village_change.php?village_id']").each(function(){
			var m = $(this).attr("href").match(/village_id=(\d+)/);
			if (m !== null && m.length === 2) {
				addLink(m[1], this);
			}
		});
	}


	//----------------------------------------
	// 援軍派遣先の簡単セット
	//----------------------------------------
	function landOperation() {
		var m = $("#basepoint span.xy").text().match(/\(([-]?\d+),\s*([-]?\d+)\)/);
		if (m === null || m.length < 3) {
			return;
		}
		var x = m[1], y = m[2];

		var link = $("<a />", {
			id: 'qmsCoordinateSetter',
			style: 'text-decoration: none; color: #0000dd; cursor: pointer;',
			on: {
				click: function(){
					$(this).off('click');
					g_options[AXIS_01] = x;
					g_options[AXIS_02] = y;
					saveSettings();
				}
			}
		}).append(`(${x},${y})を援軍派遣先へセット`);
		$("#tMenu_btnif").append(link);
	}

})(jQuery);


//----------------------------------------
// デフォルトオプション定義の取得
//----------------------------------------
function getDefaultOptions() {
	var settings = {};

	settings[AXIS_01] = '';		// 援軍派遣先X座標
	settings[AXIS_02] = '';		// 援軍派遣先Y座標

	return settings;
}


//----------------------------------------
// 設定の保存
//----------------------------------------
function saveSettingsWithObject(obj) {
	GM_setValue(SAVENAME + '_options', JSON.stringify(obj));
}

function saveSettings() {
	saveSettingsWithObject(g_options);
}


//----------------------------------------
// 設定のロード
//----------------------------------------
function loadSettings() {
	// 保存データの取得
	var obj = GM_getValue(SAVENAME + '_options', null);
	if (obj === null) {
		g_options = getDefaultOptions();
		return;
	}

	var options = JSON.parse(obj);

	// 保存データにデフォルト設定の情報がない場合、デフォルト設定を追加
	var defaults = getDefaultOptions();
	for (var key in defaults) {
		if (typeof options[key] === "undefined") {
			options[key] = defaults[key];
		}
	}

	g_options = options;
}


//----------------------------------------
// for debug print object
//----------------------------------------
function po(obj, ext = "") {
	console.log(ext + JSON.stringify(obj, null, '\t'));
}
