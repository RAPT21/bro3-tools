// ==UserScript==
// @name		bro3_auto_daily_quest
// @namespace	https://gist.github.com/RAPT21/
// @description	ブラウザ三国志 繰り返しクエスト自動化 by RAPT
// @include		http://*.3gokushi.jp/village.php*
// @include		https://*.3gokushi.jp/village.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @require		http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// @author		RAPT
// @version 	2015.05.23
// ==/UserScript==

// 2015.05.17 初版作成。繰り返しクエスト受注、寄付クエ実施、クエクリ、ヨロズダス引き、受信箱からアイテムを移す
// 2015.05.19 都市タブでのみ動作するようにした
//			  5zen 氏の ブラウザ三国志 自動デュエル 2014.07.28 を取り込み
// 2015.05.22 クエクリ済でも、サーバー時刻が [02:00:00-04:59:59] 以外のとき自動デュエルするようにした
// 2015.05.23 ヨロズダス回数だけでなく、資源以外のクエクリ報酬も自動受領するようにした
//			  資源報酬もオプションにより自動受領できるようにした
//			  オプションはコード内。デフォルトは無効

/*!
* jQuery Cookie Plugin
* https://github.com/carhartl/jquery-cookie
*
* Copyright 2011, Klaus Hartl
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://www.opensource.org/licenses/mit-license.php
* http://www.opensource.org/licenses/GPL-2.0
*/
(function($) {
	$.cookie = function(key, value, options) {

		// key and possibly options given, get cookie...
		options = value || {};
		var decode = options.raw ? function(s) { return s; } : decodeURIComponent;

		var pairs = document.cookie.split('; ');
		for(var i = 0, pair; pair = pairs[i] && pairs[i].split('='); i++) {
			if(decode(pair[0]) === key) return decode(pair[1] || ''); // IE saves cookies with empty string as "c; ", e.g. without "=" as opposed to EOMB, thus pair[1] may be undefined
		}
		return null;
	};
})(jQuery);
jQuery.noConflict();
j$ = jQuery;


function xpath(query,targetDoc) {
	return document.evaluate(query, targetDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}


var HOST		= location.hostname;
var INTERVAL	= 500;


// クエストID
var ID_DONATE	= 254; // 同盟に合計500以上寄付する
var ID_TROOPS	= 256; // 武将を出兵し、資源を獲得する
var ID_DUEL		= 255; // ブショーデュエルで1回対戦する


// オプション設定
var OPT_QUEST_DONATE		= 1; // 繰り返しクエスト用寄付糧500
var OPT_QUEST_DUEL			= 1; // 繰り返しクエスト用デュエル
var OPT_QUEST_TROOPS		= 1; // 繰り返しクエスト用出兵

var OPT_RECEIVE_RESOURCES	= 1; // クエスト報酬 '資源' も自動で受け取る

var OPT_MOVE_FROM_INBOX		= 1; // 受信箱から便利アイテムへ移動
var OPT_AUTO_DUEL			= 1; // 自動デュエル
// ここまで


// 受信箱にあるアイテムを便利アイテムへ移す
function moveFromInbox(){
	j$.get('http://'+HOST+'/item/inbox.php#ptop',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;

		var regexp = /confirmItemSub\(this,\s*\d+,\s*(\d+),\s*'移動する'\)/;
		var item_id_list = '';

		var item_id_items = xpath('//ul[contains(@class,"itemIconList")]/li/div/a',htmldoc);
		var count = 0;
		for(var i = 0; i < item_id_items.snapshotLength; i++){
			var item_id = item_id_items.snapshotItem(i).outerHTML.match(regexp);
			if (item_id){
				if (item_id_list.length > 0){
					item_id_list += "_";
				}
				item_id_list += item_id[1];
				count++;
				if (count >= 5) {
					break;
				}
			}
		}

		if (count) {
			var ssid = xpath('//form[@name="multimoveform"]/input[@name="ssid"]',htmldoc).snapshotItem(0);
			var c = {};
			c['item_id_list'] = item_id_list;
			c['ssid'] = ssid.value;
			j$.post('http://'+HOST+'/item/inbox.php',c,function(){});
			var tid=setTimeout(function(){location.reload(false);},INTERVAL);
		}
	});
}

// 寄付
function sendDonate(rice) {
	var c={};
	c['contributionForm'] = "";
	c['wood'] = 0;
	c['stone'] = 0;
	c['iron'] = 0;
	c['rice'] = parseInt(rice);
	c['contribution'] = 1;
	j$.post('http://'+HOST+'/alliance/level.php',c,function(){});
	var tid=setTimeout(function(){location.reload(false);},INTERVAL);
}

// デュエル
function duel(){
	console.log("*** bro3_duel ***");
	j$.get("http://"+HOST+"/card/duel_set.php",function(y){

		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = y;

		// 6枚目がセットされているか
		if ( xpath('//ul[@class="deck_card"]/li[6]/dl/dd[3]/span[2]', htmldoc).snapshotItem(0).innerHTML.match("---/---") ) {
			console.log("*** no deck set ***");
		} else {
			j$.get("http://"+HOST+"/pvp_duel/select_enemy.php?deck=1",function(x){

				var htmldoc2 = document.createElement("html");
					htmldoc2.innerHTML = x;

				try {
					var rival_list = xpath('//ul[@class="rival_list"]/li/a[@class="thickbox btn_battle"]', htmldoc2);
					j$.get( rival_list.snapshotItem(0).href, function(x){

						x.match(/battleStart\((\d+),\s(\d+),\s(\d+)\)/);

						var c = {};
						c['deck']	=	1;
						c['euid']	=	parseInt(RegExp.$2);
						c['edeck']	=	0;

						// デュエルの開始
						j$.get("http://" + HOST + "/pvp_duel/process_json.php?deck=1&euid=" + c['euid'] + "&edeck=0", c , function(x) {
							location.reload();
						});
					});
				} catch(e) {
					console.log("*** no duel ***");
				}
			});
		}
	});
}

// ヨロズダスを引く
function yorozudas(){
	j$.get('http://'+HOST+'/reward_vendor/reward_vendor.php',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;

		var reward = xpath('//form/input[@value="ヨロズダスを引く" and not(contains(text(),"ヨロズダスの残り回数がありません"))]', htmldoc).snapshotItem(0);
		if (reward){
			var c={};
			c['send']='send';
			c['got_type']=0;
			j$.post('http://'+HOST+'/reward_vendor/reward_vendor.php',c,function(das){
				var div = document.createElement('div');
					div.innerHTML = das.responseText;
				var reward_result = xpath('*//table[@class="getBushodas"]/tbody/tr/td/p/strong', div);
				if (reward_result) {
					console.log('取得アイテム:'+reward_result.snapshotItem(0).textContent);
				}
			});
		}
	});
}

// クエスト報酬を自動で受け取るか判定
function checkReceiveReward(name) {
	if (name.match(/木材|石|鉄|食料/) === null) {
		// 資源報酬以外は自動で受け取る
		return true;
	} else {
		// 資源報酬の場合は、自動で受け取る設定に依る
		return OPT_RECEIVE_RESOURCES ? true : false;
	}
}

// 繰り返しクエストを受注
function acceptAttentionQuest(attention_quest) {
	var regexp = /takeQuest\((\d+),\s*\d+,\s*\d+\)/;

	var quest_list = [];
	for (var i = 0; i < attention_quest.snapshotLength; i++){
		if (xpath('td/a[contains(text(), "繰り返し")]', attention_quest.snapshotItem(i)).snapshotLength){
			var quest_id = attention_quest.snapshotItem(i).innerHTML.match(regexp);
			if (quest_id){
				quest_list.push(quest_id[1]);
			}
		}
	}

	if (quest_list.length == 0) {
		return false;
	}

	// クエスト受注
	for (var i = 0; i < quest_list.length; i++){
		var query = 'action=take_quest&id=' + quest_list[i];
		j$.get('http://'+HOST+'/quest/index.php?'+query,function(){});
	}
	var tid=setTimeout(function(){location.reload(false);},INTERVAL);
	return true;
}

// 未クリアの繰り返しクエストを取得
function getRestAttentionQuest(attention_quest){
	var quest_list = [];
	for (var i = 0; i < attention_quest.snapshotLength; i++){
		if (xpath('td/a[contains(text(), "繰り返し")]', attention_quest.snapshotItem(i)).snapshotLength){
			var regexp = /cancelQuest\((\d+),\s*\d+,\s*\d+\)/;
			var quest_id = attention_quest.snapshotItem(i).innerHTML.match(regexp);
			if ( quest_id ){
				quest_list.push(quest_id[1]);
			}
		}
	}
	return quest_list;
}



( function() {
	console.log("*** bro3_quest ***");
	j$.get('http://'+HOST+'/quest/index.php',function(y){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = y;

		// 残っている繰り返しクエスト id を取得
		var attention_quest = xpath('//div[@id="questB3_table"]/table/tbody/tr[contains(@class, "attention")]', htmldoc);

		// クエスト受注
		if (acceptAttentionQuest(attention_quest)) {
			return;
		}

		// 未クリアの繰り返しクエストマッチング
		var quest_list = getRestAttentionQuest(attention_quest);
		for (var i = 0; i < quest_list.length; i++){
			var quest_id = parseInt(quest_list[i]);
			if (quest_id == ID_DONATE && OPT_QUEST_DONATE){
				// 寄付クエ
				sendDonate(500);
				return;
			}
			if (quest_id == ID_DUEL && OPT_QUEST_DUEL){
				// デュエルクエ
				duel();
				return;
			}
			if (quest_id == ID_TROOPS && OPT_QUEST_TROOPS){
				console.log("TODO: 出兵クエ");
			}
		}

		// クリアしたクエスト報酬を受け取る
		var reward = xpath('//table[@summary="報酬"]/tbody/tr/td', htmldoc).snapshotItem(0);
		if (reward && checkReceiveReward(reward.textContent)){
			j$.get('http://'+HOST+'/quest/index.php?c=1',function(){
				// 報酬がヨロズダス回数ならそのままヨロズダスを引く
				if (reward.textContent == 'ヨロズダス回数') {
					yorozudas();
				}
			});
		} else {
			yorozudas();
		}

		// 受信箱から移す
		if (OPT_MOVE_FROM_INBOX) {
			moveFromInbox();
		}

		// サーバー時刻が [02:00:00 - 04:59:59] 以外であれば自動デュエルする
		if (OPT_AUTO_DUEL) {
			var server = xpath('//div[@id="navi01"]/dl[@class="world"]/dd[@class="server"]/span[@id="server_time_disp"]', htmldoc).snapshotItem(0);
			if (server && server.textContent) {
				var hour = parseInt(server.textContent.substr(0,2), 10);
				if (hour < 2 || hour >= 5) {
					duel();
				}
			}
		}
	});
})();
