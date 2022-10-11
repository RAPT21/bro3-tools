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
// @version 	1.1
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
// 2022.10.12	1.1	初版	友軍状況画面を開いたとき、自要塞を選択拠点とするように


var SERVER_SCHEME = location.protocol + "//";
var SERVER_BASE = SERVER_SCHEME + location.hostname;

// 兵種対応表
var armyType = [
//	['剣兵', 'infantry_count'],
//	['盾兵', 'shield_count'],
//	['槍兵', 'spear_count'],
//	['弓兵', 'archer_count'],
//	['騎兵', 'cavalry_count'],
//	['衝車', 'ram_count'],
//	['斥候', 'scout_count'],
	['大剣兵', 'large_infantry_count'],
	['重盾兵', 'heavy_shield_count'],
	['矛槍兵', 'halbert_count'],
	['弩兵', 'crossbow_count'],
	['近衛騎兵', 'cavalry_guards_count'],
	['投石機', 'catapult_count'],
	['斥候騎兵', 'cavalry_scout_count'],
	['戦斧兵', 'axe_count'],
	['双剣兵', 'twin_count'],
	['大錘兵', 'spindle_count']
];

// 兵種選択肢を追加
function addArmyType() {
	var code = "<span>派遣兵種：</span>";
	for (var i = 0; i < armyType.length; i++) {
		var element = armyType[i];
		code += `<input type='radio' id='a-type${i}' name='a-type' value='${element[1]}'><label for='a-type${i}'>${element[0]}</label></input>\n`
	}
	q$("#gray02Wrapper table[class*='tables']").before(`<div id="armyType">${code}</div>`);
	q$("#a-type1").prop('checked', true); // デフォルトは重盾兵
}

// 友軍を確認なしで発射
function sendFriendlyArmy(x, y, count) {
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
	q$.post(`${SERVER_BASE}/facility/castle_send_troop.php`, c);
}

// リンク先拠点の座標を取得して友軍を送る
function requestAxis(vId, count) {
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
			sendFriendlyArmy(m[1], m[2], count);
		}
	}, 'html');
}

function changeToMyFortressIfNeeded(vId) {
	// 自拠点リストを取得
	var list = new Array();
	q$("#sidebar div.basename ul li a[href*='village_change.php?village_id']").each(function(){
		var m = q$(this).attr("href").match(/village_id=(\d+)/);
		if (m !== null && m.length === 2) {
			list.push(m[1]);
		}
	});

	// 自要塞IDが自拠点リストリンクに含まれない場合は、要塞選択済
	if (!list.includes(vId)) {
		return;
	}

	// 自要塞へ移動（応答を待たない）
	q$.ajax({
		url: `${SERVER_BASE}/village_change.php`,
		type: 'GET',
		datatype: 'html',
		cache: false,
		data: {
			village_id: vId
		}
	});
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
		changeToMyFortressIfNeeded(vId[1]);
		return true;
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
	target.html(`<span style="color: blue; text-decoration: underline;" onmouseover="this.style.cursor='pointer'" onmouseout="this.style.cursor='default'">${vacancy}</span>`);
	target.eq(0).on('click', function(){
		// クリックできなくする
		q$(this).off('click');
		target.html(`<span id="a-status-${vId[1]}">派兵中</span>`);
		// 派遣先要塞の座標を取得してから送る
		requestAxis(vId[1], vacancy);
	});
});
