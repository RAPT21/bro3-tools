﻿// ==UserScript==
// @name		bro3_donate_window
// @namespace	https://gist.github.com/RAPT21/
// @description	ブラウザ三国志 寄付ツール
// @include		http://*.3gokushi.jp/alliance/info.php*
// @include		https://*.3gokushi.jp/alliance/info.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://*.3gokushi.jp/maintenance*
// @exclude		http://info.3gokushi.jp/*
// @exclude		https://info.3gokushi.jp/*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require		https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
// @resource	jqueryui_css	https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css
// @connect		3gokushi.jp
// @grant		GM_getResourceText
// @grant		GM_addStyle
// @author		RAPT
// @version 	1.4
// ==/UserScript==
jQuery.noConflict();
q$ = jQuery;

// load jQueryUI css
var jQueryUICss = GM_getResourceText("jqueryui_css");
GM_addStyle(jQueryUICss);

//==========[機能]==========
// 資源在庫と寄付済額を確認しながら、寄付額を調整できます。
// 在庫資源を調整しつつ寄付したい場合や、単純に一定額や全額寄付したい場合などに便利です。
// 同盟トップのメニューに「寄付窓」という赤い背景のリンクが追加されます。

// 2017.09.17	0.1	自分用に作成
// 2017.12.03	1.0	初版公開
// 2019.04.19	1.1	2019.04.03以降に開始された期で一部の数値がカンマ付きになった影響で寄付済額が取得できなくなっていたのを対応
// 2020.01.30	1.2	1/30の運営仕様変更に伴い、資源情報を取得できなくなっていた問題を修正
// 2023.07.06	1.3 https 対応、同盟画面、プロフィール画面の仕様変更に伴い、新規サーバーや君主名を変更したときなどに寄付ができなくなったいた問題を修正（同盟画面仕様変更に伴い、君主名は不要になった）
// 2024.02.18	1.4 地形2.0対応。同盟画面に役割列が追加されたことで既寄付額が取得できなくなっていたのを修正

var VERSION = "2024.02.18";
var HOST = location.hostname; //アクセスURLホスト
var SERVER_NAME = HOST.match(/^(.*)\.3gokushi/)[1];
var LOGGER	 = SERVER_NAME + '.donate> ';
var INTERVAL = 500;

var SERVER_SCHEME = location.protocol + "//";
var BASE_URL = SERVER_SCHEME + location.hostname;

var DEBUG = false;

GM_addStyle(`
	#donate_window {
		-moz-border-radius:3px;
		border-radius: 3px;
		-webkit-border-radius: 3px;
		margin-bottom:6px;
		border: 2px solid #009;
		position: absolute;
		z-index:9999;
		background-color: white;
	}
	#donate_window th {
		font-weight: bold;
		text-align: center;
		margin: 10px 0;
	}
`);


(function($){
	var wood = toInt($("#wood").val());
	var stone = toInt($("#stone").val());
	var iron = toInt($("#iron").val());
	var rice = toInt($("#rice").val());
	var capacity = toInt($("#rice_max").val());
	console.log(LOGGER+`[在庫] 木: ${wood} 石: ${stone} 鉄: ${iron} 糧: ${rice} / 倉: ${capacity}`);

	// 発動リンクの作成
	$("ul[id=statMenu]").eq(0).children("li[class='last']").eq(0).after(
		"<li class='last'><a href='#' id='show_donate_view' style='color: black; background-color: pink;'>寄付窓</a></li>"
	).attr('class', '');
	$("#show_donate_view").on('click', function(){
		if ($("#donate_window").css('display') === 'none') {
			$("#donate_window").css('display', '');
			set_already();
		} else {
			$("#donate_window").css('display', 'none');
		}
	});
	create_window();

	// 窓を作成
	function create_window() {
		// 設定画面の描画
		$("ul[id=statMenu]").eq(0).append(`
			<div id='donate_window' style='display: none; padding: 8px; width: 600px;'>
				<table border=0 cellspacing=0 cellpadding=2>
					<tr><th>&nbsp;</th><th>木</th><th>石</th><th>鉄</th><th>糧</th><th>合計</th></tr>
					<tr>
						<th>現在</th>
						<td><input id='current_wood' type='number' style='margin: 0 4px; text-align: center; width: 100px; background-color: #eff;' readonly /></td>
						<td><input id='current_stone' type='number' style='margin: 0 4px; text-align: center; width: 100px; background-color: #eff;' readonly /></td>
						<td><input id='current_iron' type='number' style='margin: 0 4px; text-align: center; width: 100px; background-color: #eff;' readonly /></td>
						<td><input id='current_rice' type='number' style='margin: 0 4px; text-align: center; width: 100px; background-color: #eff;' readonly /></td>
						<td><input id='current_capacity' type='number' style='margin: 0 4px; text-align: center; width: 100px; background-color: #eff;' readonly /></td>
					</tr>
					<tr>
						<th>&nbsp;</th>
						<td><input id='donate_keep' type='number' style='margin: 0 4px; text-align: center; width: 100px;' /></td>
						<td style='text-align: center;'><input type='button' id='calc_keep_edit' value='ずつ残す↓' style='width: 90%;' /></td>
						<td colspan=2 style='text-align: right;'><input type='button' id='calc_keep_10_percent' value='倉庫キャパの10%を残す↓↓' style='width: 95%;' />&nbsp;</td>
						<td style='text-align: right;'><input type='button' id='calc_all' value='全額↓' style='width: 90%;' />&nbsp;</td>
					</tr>
					<tr>
						<th>残額</th>
						<td><input id='reserve_wood' type='number' style='margin: 0 4px; text-align: center; width: 100px;' /></td>
						<td><input id='reserve_stone' type='number' style='margin: 0 4px; text-align: center; width: 100px;' /></td>
						<td><input id='reserve_iron' type='number' style='margin: 0 4px; text-align: center; width: 100px;' /></td>
						<td><input id='reserve_rice' type='number' style='margin: 0 4px; text-align: center; width: 100px;' /></td>
						<td style='text-align: center;'><input type='button' id='calc_reserve' value='計算↓' style='width: 90%;' /></td>
					</tr>
					<tr>
						<th>寄付</th>
						<td><input id='donate_wood' type='number' style='margin: 0 4px; text-align: center; width: 100px;' /></td>
						<td><input id='donate_stone' type='number' style='margin: 0 4px; text-align: center; width: 100px;' /></td>
						<td><input id='donate_iron' type='number' style='margin: 0 4px; text-align: center; width: 100px;' /></td>
						<td><input id='donate_rice' type='number' style='margin: 0 4px; text-align: center; width: 100px;' /></td>
						<td style='text-align: center;'><input type='button' id='calc_donate' value='←計算' style='width: 90%;' /></td>
					</tr>
					<tr>
						<th>小計</th>
						<td><input id='total_calc' type='number' style='margin: 0 4px; text-align: center; width: 100px; background-color: #eff;' readonly /></td>
						<td style='text-align: right; font-weight: bold;'>寄付済み：</td>
						<td><input id='total_already' type='number' style='margin: 0 4px; text-align: center; width: 100px; background-color: #eff;' readonly /></td>
						<td style='text-align: right; font-weight: bold;'>合計：</td>
						<td><input id='total_sum' type='number' style='margin: 0 4px; text-align: center; width: 100px; background-color: #eff;' readonly /></td>
					</tr>
					<tr>
						<th>&nbsp;</th>
						<td colspan=5>&nbsp;</td>
					</tr>
					<tr>
						<th>&nbsp;</th>
						<td><input type='button' id='donate_close_window' value='閉じる' style='margin-left: 16px; width: 88px;' /></td>
						<td><input type='button' id='donate_reset_window' value='リセット' style='margin-left: 16px; width: 88px;' /></td>
						<td colspan=2 style='text-color: gray;'>Release: ${VERSION}</td>
						<td style='text-align: center;'><input type='button' id='send_donate' value='寄付する' style='width: 90%; background-color: pink;' /></td>
					</tr>
				</table>
			</div>
		`);

		// 閉じるボタン
		$("#donate_close_window").on('click', function() {
			$("#donate_window").css({'display':'none'});
		});

		// リセットボタン
		$("#donate_reset_window").on('click', function() {
			var keys = ['donate_keep', 'reserve_wood', 'reserve_stone', 'reserve_iron', 'reserve_rice',
				'donate_wood', 'donate_stone', 'donate_iron', 'donate_rice', 'total_calc', 'total_sum'];
			$.each(keys, function(){
				$('#'+this).val('');
			});
		});

		// アクション
		$("#current_wood").val(wood);
		$("#current_stone").val(stone);
		$("#current_iron").val(iron);
		$("#current_rice").val(rice);
		$("#current_capacity").val(capacity);

		// 倉庫キャパの10%を残す
		$("#calc_keep_10_percent").on("click", function(){
			var keep = Math.floor(capacity * 0.1);
			var w = Math.max(0, wood - keep);
			var s = Math.max(0, stone - keep);
			var i = Math.max(0, iron - keep);
			var r = Math.max(0, rice - keep);
			set_donate(w, s, i, r);
		});

		// 全額
		$("#calc_all").on("click", function(){
			set_donate(wood, stone, iron, rice);
		});

		// 指定額ずつ残す
		$("#calc_keep_edit").on("click", function(){
			var keep = toInt($("#donate_keep").val());
			var w = Math.max(0, wood - keep);
			var s = Math.max(0, stone - keep);
			var i = Math.max(0, iron - keep);
			var r = Math.max(0, rice - keep);
			set_donate(w, s, i, r);
		});

		// 個別指定額を残す
		$("#calc_reserve").on("click", function(){
			var keep_wood = toInt($("#reserve_wood").val());
			var keep_stone = toInt($("#reserve_stone").val());
			var keep_iron = toInt($("#reserve_iron").val());
			var keep_rice = toInt($("#reserve_rice").val());
			var w = Math.max(0, wood - keep_wood);
			var s = Math.max(0, stone - keep_stone);
			var i = Math.max(0, iron - keep_iron);
			var r = Math.max(0, rice - keep_rice);
			set_donate(w, s, i, r);
		});

		// 合計寄付額を再計算
		$("#calc_donate").on("click", function(){
			var w = toInt($("#donate_wood").val());
			var s = toInt($("#donate_stone").val());
			var i = toInt($("#donate_iron").val());
			var r = toInt($("#donate_rice").val());
			set_donate(w, s, i, r);
		});

		// 寄付実行
		$("#send_donate").on("click", function(){
			var w = toInt($("#donate_wood").val());
			var s = toInt($("#donate_stone").val());
			var i = toInt($("#donate_iron").val());
			var r = toInt($("#donate_rice").val());
			send_donate(w, s, i, r);
		});
	}

	// 寄付を実行
	function send_donate(w, s, i, r) {
		console.log(LOGGER+`[寄付] 木: ${w} 石: ${s} 鉄: ${i} 糧: ${r}`);
		if (DEBUG) {
			return;
		}

		var c = {
			contributionForm: null,
			wood: w,
			stone: s,
			iron: i,
			rice: r,
			contribution: 1
		};
		$.post(BASE_URL+'/alliance/level.php',c,function(){
			var tid=setTimeout(function(){location.reload();}, INTERVAL);
		});
	}

	// 寄付額をセット
	function set_donate(w, s, i, r) {
		var sum = w + s + i + r;
		var total = toNumber($("#total_already").val())+sum;
		$("#donate_wood").val(w);
		$("#donate_stone").val(s);
		$("#donate_iron").val(i);
		$("#donate_rice").val(r);
		$("#total_calc").val(sum);
		$("#total_sum").val(total);

		// 残額
		$("#reserve_wood").val(wood - w);
		$("#reserve_stone").val(stone - s);
		$("#reserve_iron").val(iron - i);
		$("#reserve_rice").val(rice - r);
	}

	// 寄付済み額を画面に反映
	function set_already() {
		// 役割テーブルの時は寄付額がずれる
		var tdx = $("table.ranking-with-roles").length > 0 ? 4 : 3;
		$(`table.tables tbody tr.mydata td:eq(${tdx})`).each(function(){
			var already = $(this).text().replace(/[ \t\r\n,]/g, "");
			$("#total_already").val(already);
			console.log(LOGGER+`[${username}] の寄付額は [${already}]`);
			return false;
		});
	}
})(jQuery);


//========================================
//	jQuery を使用しない共通関数定義
//========================================

function isNullOrEmpty(obj) {
	return obj === null || typeof obj === 'undefined' || obj.length === 0;
}

function nvl(obj, nullValue = '') {
	return obj === null ? nullValue : obj;
}

function toDisplayInt(num){
	return String(num).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
}
function toInt(obj) {
	return toNumber(obj, 0);
}
function toNumber(obj, defaultValue = null) {
	if (obj === null) {
		return defaultValue;
	}
	var text = ("" + obj).replace(/,/g, '');
	var num = parseInt(text, 10);
	if (isNaN(num)) {
		return defaultValue;
	}
	return num;
}

// セッションID取得
function getSessionId() {
	return getCookie('SSID');
}

// source: http://stackoverflow.com/questions/10687746/getcookie-returns-null
function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) === ' ') {
			c = c.substring(1, c.length);
		}
		if (c.indexOf(nameEQ) === 0) {
			return c.substring(nameEQ.length, c.length);
		}
	}
	return null;
}
// for debug print object
function po(obj, ext = "") {
	console.log(ext + JSON.stringify(obj, null, '\t'));
}
function array_merge(dest, src) {
	Array.prototype.push.apply(dest, src);
}
function array_unique(array) {
	return array.filter(function(element, index) {
		return array.indexOf(element) === index; // Chrome 系では、filter で第3引数がない
	});
}
