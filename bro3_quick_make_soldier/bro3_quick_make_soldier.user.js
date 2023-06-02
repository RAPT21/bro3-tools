// ==UserScript==
// @name		bro3_quick_make_soldier
// @namespace	https://github.com/RAPT21/bro3-tools/
// @description	ブラウザ三国志 南蛮援軍造兵＋派遣
// @include		http://*.3gokushi.jp/village.php*
// @include		https://*.3gokushi.jp/village.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://*.3gokushi.jp/maintenance*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @grant		none
// @author		RAPT
// @version 	0.1
// ==/UserScript==
jQuery.noConflict();
q$ = jQuery;

var SERVER_SCHEME = location.protocol + "//";
var SERVER_BASE = SERVER_SCHEME + location.hostname;

// 重盾兵を造兵
var OPT_UNIT_ID = 317;

// 兵種対応表
var IDX_NAME = 0;
var IDX_TYPE = 1;
var IDX_ID = 2;
var IDX_CAN = 3;
var IDX_X = 4;
var IDX_Y = 5;
var armyTable = {
			// 兵種			, type					,ID,作成可,x,y],
//	剣兵	: ['剣兵'		, 'infantry_count'		, 301, 0, 0, 0],
//	盾兵	: ['盾兵'		, 'shield_count'		, 316, 0, 0, 0],
//	槍兵	: ['槍兵'		, 'spear_count'			, 303, 0, 0, 0],
//	弓兵	: ['弓兵'		, 'archer_count'		, 308, 0, 0, 0],
//	騎兵	: ['騎兵'		, 'cavalry_count'		, 305, 0, 0, 0],
//	衝車	: ['衝車'		, 'ram_count'			, 312, 0, 0, 0],
//	斥候	: ['斥候'		, 'scout_count'			, 310, 0, 0, 0],
	大剣兵	: ['大剣兵'		, 'large_infantry_count', 315, 0, 0, 0],
	重盾兵	: ['重盾兵'		, 'heavy_shield_count'	, 317, 0, 0, 0],
	矛槍兵	: ['矛槍兵'		, 'halbert_count'		, 304, 0, 0, 0],
	弩兵	: ['弩兵'		, 'crossbow_count'		, 309, 0, 0, 0],
	近衛騎兵: ['近衛騎兵'	, 'cavalry_guards_count', 307, 0, 0, 0],
	投石機	: ['投石機'		, 'catapult_count'		, 313, 0, 0, 0],
	斥候騎兵: ['斥候騎兵'	, 'cavalry_scout_count'	, 311, 0, 0, 0],
	戦斧兵	: ['戦斧兵'		, 'axe_count'			, 318, 0, 0, 0],
	双剣兵	: ['双剣兵'		, 'twin_count'			, 319, 0, 0, 0],
	大錘兵	: ['大錘兵'		, 'spindle_count'		, 320, 0, 0, 0]
};
function armyInfo(type) {
	var keys = Object.keys(armyTable);
	for (var i = 0; i < keys.length; i++) {
		var element = armyTable[keys[i]];
		if (element[IDX_TYPE] == type) {
			return element;
		}
	}
	return null;
}

// 造兵する
function makeSoldier(x, y, count, callback) {
	var c = {
		x: `${x}`,
		y: `${y}`,
		unit_id: `${OPT_UNIT_ID}`,
		count: `${count}`
	};
	q$.post(`${SERVER_BASE}/facility/facility.php?x=${x}&y=${y}`, c, function(){
		if (callback) {
			callback("造兵完了");
		}
	});
}


function changeVillage(vId, callback) {
	// 指定拠点へ移動
	q$.ajax({
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


// 拠点の造兵情報を収集
function getMakeSoldierInfo(res, callback) {
	// 兵キャパ
	var vacancy = 0;
	var m = q$("#basepoint .status table tbody tr td:eq(3)").text().trim().match(/(\d+)\/(\d+)/);
	if (m !== null && m.length >= 3) {
		vacancy = parseInt(m[2], 10) - parseInt(m[1], 10);
	}
	if (vacancy < 1) {
		if (callback) {
			callback([], 0);
		}
	}

	// 拠点の造兵施設を収集
	var resp = q$("<div>").append(res);
	var xy = [];
	q$("#mapOverlayMap area", resp).each(function(index, area){
		if (q$(area).attr("alt").match(/(.*?)\s*LV.+/)) {
			var name = RegExp.$1;
			var url = q$(area).attr("href");
			if (url.match(/\?x=(\d+)&y=(\d+)#/)) {
				var x = RegExp.$1;
				var y = RegExp.$2;
				if (["練兵所"].indexOf(name) >= 0) { // 今のところ重盾のみを想定
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
		q$.ajax({
			url: `${SERVER_BASE}/${url}`,
			type: 'GET',
			datatype: 'html'
		}).done(function(res2){
			var resp2 = q$("<div>").append(res2);
			q$("th.mainTtl", resp2).each(function(index, mainTtl){
				if (index === 0) { return true; }

				var sol_name = q$(mainTtl).text();
				var time = q$("td", q$(mainTtl).closest("tr").next().next().next().next()).text();
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

function addLinks() {
	// 自拠点リストを取得
	var list = new Array();
	q$("#sidebar div.basename ul li a[href*='village_change.php?village_id']").each(function(){
		var m = q$(this).attr("href").match(/village_id=(\d+)/);
		if (m !== null && m.length === 2) {
			var vId = m[1];
			var anId = `makeSol-${vId}`;
			q$("<a />", {
				id: anId,
				on: {
					click: function(){
						q$(this).off('click');
						q$("#"+anId).text("処理中");
						changeVillage(vId, function(sol_names, capacity){
							if (capacity > 0 && sol_names.contains('重盾兵')) {
								var element = armyTable['重盾兵']
								if (element[IDX_CAN]) {
									// 即完可能
									makeSoldier(element[IDX_X], element[IDX_Y], capacity, function(msg){
										q$("#"+anId).text(msg);
									});
								}
							}
						});
					}
				}
			}).append("造兵");
		}
	});
}

addLinks();
