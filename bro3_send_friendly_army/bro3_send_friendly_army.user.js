// ==UserScript==
// @name		bro3_send_friendly_army
// @namespace	https://gist.github.com/RAPT21/
// @description	ブラウザ三国志 友軍派遣
// @include		http://*.3gokushi.jp/alliance/friendly_army.php*
// @include		https://*.3gokushi.jp/alliance/friendly_army.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://*.3gokushi.jp/maintenance*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @grant		none
// @author		RAPT
// @version 	1.3
// ==/UserScript==
jQuery.noConflict();
q$ = jQuery;


// ▼概要
// 同盟＞友軍状況画面で動作します。
// リンククリックで相手先に友軍を送りつけます。
//
// ▼特徴
// 派遣兵種を選択できます。デフォルトは重盾兵です。
// └初期状態では下級兵はコメントアウトしています。ソース内の兵種対応表のコメントアウトをいじることで変更できます。
// 相手拠点の友軍キャパ上限まで送りつけます。
// ├移動中の友軍が居ない場合のみ派遣できます。
// └相手拠点にすでに友軍が居る場合、派遣君主が自君主の場合のみ派遣できます。
// 友軍状況画面を開いたとき、自拠点が要塞以外の場合は、自動で要塞拠点へ切り替えます。
//
// ▼注意事項
// 自拠点に居ない兵種を指定したり、兵数が満たない場合は失敗します。
// └自拠点の兵補充は適宜行なってください。
// 連打するとたぶん怒られるのでリンク先連打を避けましょう。
// └数秒待ってからクリックしましょう。
// 今のところ、派兵結果は画面更新するまで画面に反映されません。


// 2022.10.09	1.0	初版
// 2022.10.12	1.1	友軍状況画面を開いたとき、自要塞を選択拠点とするように
// 2023.01.01	1.2	育成クエ用に兵士1x3 を送信できるように
// 2023.01.28	1.3	友軍送付後に自動で造兵できるように
//					即完できる場合のみ造兵します。送った兵種を送った数だけ造兵します。資源不足はチェックしません。
//					友軍状況画面を開いたあと造兵情報を収集するため、造兵可能になるまで数秒～数十秒かかる場合があります。


var SERVER_SCHEME = location.protocol + "//";
var SERVER_BASE = SERVER_SCHEME + location.hostname;

var canSendMonthlyQuest = true; // 育成クエの「3人以上の同盟員に友軍を派兵しよう」用に兵士1x3 を送信できるようにするか
var canMakeSoldierAfterSent = true; // 友軍送付後に自動で造兵するか（資源不足はチェックしない）

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

// 兵種選択肢を追加
function addArmyType() {
	var code = "<span>派遣兵種：</span>";
	var keys = Object.keys(armyTable);
	for (var i = 0; i < keys.length; i++) {
		var element = armyTable[keys[i]];
		code += `<input type='radio' id='a-type${i}' name='a-type' value='${element[1]}'><label for='a-type${i}'>${element[0]}</label></input>\n`
	}
	if (canMakeSoldierAfterSent) {
		code += `<input type='checkbox' id='a-make' name='a-make' disabled><label for='a-make' title='友軍送付後に自動で造兵します。資源枯渇はチェックしません。'>補充</label></input>\n`
	}
	q$("#gray02Wrapper table[class*='tables']").before(`<div id="armyType">${code}</div>`);
	q$("#a-type1").prop('checked', true); // デフォルトは重盾兵
}

// 造兵する
function makeSoldier(count, callback) {
	var isChecked = q$("#armyType input[name=a-make]").is(':checked');
	if (!isChecked) {
		if (callback) {
			callback("済");
		}
		return;
	}
	if (callback) {
		callback("造兵中");
	}
	var armyType = q$("#armyType input[name=a-type]:checked").val();
	var info = armyInfo(armyType);

	var c = {
		x: `${info[IDX_X]}`,
		y: `${info[IDX_Y]}`,
		unit_id: `${info[IDX_ID]}`,
		count: `${count}`
	};
	q$.post(`${SERVER_BASE}/facility/facility.php?x=${info[IDX_X]}&y=${info[IDX_Y]}`, c, function(){
		if (callback) {
			callback("済");
		}
	});
}

// 友軍を確認なしで発射
function sendFriendlyArmy(x, y, count, callback) {
	var armyType = q$("#armyType input[name=a-type]:checked").val();
	var c = {
		village_x_value: x,
		village_y_value: y,
		unit_assign_card_id: 0,
		radio_move_type: 310,
		deck_mode: 1,
		radio_reserve_type: 0,
		card_id: 204,
		radio_enhanced_loyalty_attack: 0,
		btn_send: '出兵'
	};
	c[armyType] = count;
	q$.post(`${SERVER_BASE}/facility/castle_send_troop.php`, c, function(){
		if (canMakeSoldierAfterSent) {
			makeSoldier(count, callback);
		} else {
			if (callback) {
				callback("済");
			}
		}
	});
}

// リンク先拠点の座標を取得して友軍を送る
function requestAxis(vId, aStatusId, count) {
	q$.ajax({
		url: `${SERVER_BASE}/village_change.php`,
		type: 'GET',
		datatype: 'html',
		cache: false,
		data: {
			village_id: vId
		}
	}).done(function(res) {
		var resp = q$("<div>").append(res);
		var m = q$("#basepoint .xy", resp).text().match(/\((-?\d+),(-?\d+)\)/);
		if (m !== null && m.length === 3) {
			sendFriendlyArmy(m[1], m[2], count, function(msg){
				q$(`#${aStatusId}`).text(msg);
			});
		} else {
				q$(`#${aStatusId}`).text("座標取得エラー");
		}
	}, 'html');
}
function requestAxis3(vId, aStatusId) {
	q$.ajax({
		url: `${SERVER_BASE}/village_change.php`,
		type: 'GET',
		datatype: 'html',
		cache: false,
		data: {
			village_id: vId
		}
	}).done(function(res) {
		var resp = q$("<div>").append(res);
		var m = q$("#basepoint .xy", resp).text().match(/\((-?\d+),(-?\d+)\)/);
		if (m !== null && m.length === 3) {
			// 1秒置きに兵士1を3回送る
			q$(`#${aStatusId}`).text("[1/3]");
			sendFriendlyArmy(m[1], m[2], 1, function(){
				setTimeout(function(){
					q$(`#${aStatusId}`).text("[2/3]");
					sendFriendlyArmy(m[1], m[2], 1, function(){
						setTimeout(function(){
							q$(`#${aStatusId}`).text("[3/3]");
							sendFriendlyArmy(m[1], m[2], 1,function(){
								q$(`#${aStatusId}`).text("[完了]");
							});
						}, 1000);
					});
				}, 1000);
			});
		}
	}, 'html');
}

function changeToMyFortressIfNeeded(vId, callback) {
	// 自拠点リストを取得
	var list = new Array();
	q$("#sidebar div.basename ul li a[href*='village_change.php?village_id']").each(function(){
		var m = q$(this).attr("href").match(/village_id=(\d+)/);
		if (m !== null && m.length === 2) {
			list.push(m[1]);
		}
	});

	// 自要塞IDが自拠点リストリンクに含まれない場合は、要塞選択済
	if (!list.includes(vId) && !canMakeSoldierAfterSent) { // 自動造兵有効時は造兵情報が必要
		if (callback) {
			callback(false);
		}
		return;
	}

	// 自要塞へ移動
	q$.ajax({
		url: `${SERVER_BASE}/village_change.php`,
		type: 'GET',
		datatype: 'html',
		cache: false,
		data: {
			village_id: vId
		}
	}).done(function(res){
		if (canMakeSoldierAfterSent) {
			getMakeSoldierInfo(res, callback);
		}
	});
}

// 拠点の造兵情報を収集
function getMakeSoldierInfo(res, callback) {
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
				if (["兵器工房","厩舎","兵舎","弓兵舎","練兵所","斧兵舎","双兵舎","錘兵舎"].indexOf(name) >= 0) {
					xy.push([url, x, y]);
				}
			}
		}
	});
	if (xy.length === 0) {
		// 造兵施設がない
		if (callback) {
			callback(false);
		}
		return;
	}

	// 各造兵施設から兵種ごとの情報を収集
	var timer = null;
	var wait = false;
	var i = 0;
	var hasAny = false;
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
					hasAny = true;
				}
			});

			// ループ終了判定
			i++;
			if (i >= xy.length) {
				clearInterval(timer);
				timer = null;
				if (callback) {
					callback(hasAny);
				}
			}
			wait = false;
		});
	};
	timer = setInterval(func, 1500);
}

// 派遣兵種
addArmyType();

// 自君主名
var myName = q$("#gray02Wrapper table[class*='tables'] tbody tr.mydata td:eq(0)").text();

q$("#gray02Wrapper table[class*='tables'] tbody tr").each(function(index, row){
	if (index <= 1) {
		return true;
	}

	var name = q$("td:eq(0)", row); // 君主名
	var dest = q$("td:eq(1) a", row); // 要塞リンク
	var target = q$("td:eq(2)", row); // 友軍
	var moving = q$("td:eq(3)", row); // 直近到着
	var sender = q$("td:eq(4)", row); // 派遣君主
	if (sender === null || target.text() === '-') {
		// 相手君主に要塞がない場合はスキップ
		return true;
	}

	var link = dest.attr("href");
	if (link === null) {
		// 要塞リンクが取得できない場合はスキップ
		return true;
	}

	// 要塞の拠点ID
	var vId = link.match(/village_id=(\d+)/);
	if (vId === null || vId.length !== 2) {
		return true;
	}

	if (name.text() === myName) {
		// 自要塞の拠点IDの場合、選択拠点が要塞でなければ切り替えておく
		changeToMyFortressIfNeeded(vId[1], function(hasAny){
			if (canMakeSoldierAfterSent && hasAny) {
				// 造兵情報取得完了かつ造兵施設あり
				q$('#a-make').attr('disabled', false).next().css('color', 'blue');
				// console.log(JSON.stringify(armyTable, null, 2));
			}
		});
		return true;
	}
	if (canSendMonthlyQuest) {
		// 育成クエ用
		var aLinkId = `b-tag-${vId[1]}`;
		var aStatusId = `b-status-${vId[1]}`;
		var quest = q$('<a />', {
			id: aLinkId,
			style: "color: blue; text-decoration: underline;",
			onmouseover: "this.style.cursor='pointer'",
			onmouseout: "this.style.cursor='default'",
			on: {
				click: function(){
					// クリックできなくする
					q$(this).off('click');
					q$(`#${aLinkId}`).parent().append(q$("<span />", {id: aStatusId}).append("派兵中"));
					q$(`#${aLinkId}`).hide();
					// 派遣先要塞の座標を取得してから送る
					requestAxis3(vId[1], aStatusId);
				}
			}
		}).append('[兵1x3]');
		name.append(quest);
	}
	if (sender.text() !== myName && sender.text() !== '-') {
		// 派遣君主が自分or未派遣の君主宛てのみ派遣可能
		return true;
	}
	if (moving.text() !== '-') {
		// 移動中友軍がある場合はスキップ; 派遣君主が自分かつ、空き＞移動中なら、差分は追加できるが一旦なしにする
		return true;
	}

	// 友軍キャパシティー
	var m = target.text().match(/(\d+)\/(\d+)/);
	if (m === null || m.length !== 3) {
		return true;
	}

	// 空きキャパシティーを確認
	var vacancy = parseInt(m[2], 10) - parseInt(m[1], 10);
	if (vacancy <= 0) {
		return true;
	}

	// 空きありなら友軍セルをクリック可能にする
	var aLinkId = `a-tag-${vId[1]}`;
	var aStatusId = `a-status-${vId[1]}`;
	var aLink = q$('<span />', {
		id: aLinkId,
		style: "color: blue; text-decoration: underline;",
		onmouseover: "this.style.cursor='pointer'",
		onmouseout: "this.style.cursor='default'",
		on: {
			click: function(){
				// クリックできなくする
				q$(this).off('click');
				q$(`#${aLinkId}`).parent().append(q$("<span />", {id: aStatusId}).append("派兵中"));
				q$(`#${aLinkId}`).hide();
				// 派遣先要塞の座標を取得してから送る
				requestAxis(vId[1], aStatusId, vacancy);
			}
		}
	}).append(`${vacancy}`);
	target.html(aLink);
});
