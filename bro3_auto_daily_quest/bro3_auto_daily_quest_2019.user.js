// ==UserScript==
// @name		bro3_auto_daily_quest_2019
// @namespace	https://gist.github.com/RAPT21/
// @description	ブラウザ三国志 2019年お正月 繰り返しクエスト自動化 by RAPT
// @include		http://*.3gokushi.jp/village.php*
// @include		https://*.3gokushi.jp/village.php*
// @include		http://*.3gokushi.jp/facility/castle_send_troop.php*
// @include		https://*.3gokushi.jp/facility/castle_send_troop.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://*.3gokushi.jp/maintenance*
// @require		http://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js
// @connect		3gokushi.jp
// @grant		GM_xmlhttpRequest
// @grant		GM_getValue
// @grant		GM_setValue
// @author		RAPT
// @version 	2023.01.01
// ==/UserScript==
var VERSION = "2023.01.01"; 	// バージョン情報


// オプション設定 (1 で有効、0 で無効)
var OPT_QUEST_DONATE		= 0; // 繰り返しクエスト用寄付糧500を自動で行なう
var OPT_QUEST_DUEL			= 0; // 繰り返しクエスト用デュエルを自動で行なう
var OPT_QUEST_TROOPS		= 0; // 繰り返しクエスト用出兵を自動で行なう

var OPT_RECEIVE_RESOURCES	= 0; // クエスト報酬 '資源' も自動で受け取る

var OPT_MOVE_FROM_INBOX		= 1; // 受信箱から便利アイテムへ移動
var OPT_AUTO_DUEL			= 0; // 自動デュエル
var OPT_AUTO_JORYOKU		= 0; // 自動助力

var OPT_TROOPS_CARD_ID		= 0;// 出兵武将カードID
var OPT_TROOPS_X			= 0;// 出兵先座標x
var OPT_TROOPS_Y			= 0;// 出兵先座標y

// 内部設定
var OPT_VALUE_IGNORE_SECONDS = -1; // 負荷を下げる為、指定秒数以内のリロード時は処理を行なわない(0以下指定で無効化)
var OPT_QUEST_TIMEINTERVAL = 1500;	// クエスト受注タイミング(ms)


// 2015.05.17 初版作成。繰り返しクエスト受注、寄付クエ実施、クエクリ、ヨロズダス引き、受信箱からアイテムを移す
// 2015.05.19 都市タブでのみ動作するようにした
//			  5zen 氏の ブラウザ三国志 自動デュエル 2014.07.28 を取り込み
// 2015.05.22 クエクリ済でも、サーバー時刻が [02:00:00-04:59:59] 以外のとき自動デュエルするようにした
// 2015.05.23 ヨロズダス回数だけでなく、資源以外のクエクリ報酬も自動受領するようにした
//			  資源報酬もオプションにより自動受領できるようにした
//			  オプションはコード内。デフォルトは無効
// 2015.05.24 自動助力対応
// 2015.05.29 受信箱内のアイテムが 1 つしかないときアイテムを移せていない不具合を修正
// 2015.06.06 オプション設定の記載位置をソース先頭の方に移動
//			  スクリプト実行時の警告を削減
//			  クエスト報酬受領時はロードごとにしていたが複数あるときは連続で受領するようにした
//			  クエスト受注状態確認時、「繰り返し」タブのみをチェックするようにした
// 2015.06.07 設定画面をつけた
// 2015.06.10 助力ゲージ満タンのとき、無限ループになる不具合修正
// 2015.06.21 リロード負荷低減
// 2015.07.24 リロード負荷低減について、報酬受け取り成功時は制限時間をなくすよう改修
//			  鯖開始時を考慮し、オプション初期値を影響が低いものへ変更
// 2015.08.21 リロード負荷低減について、報酬受け取り成功時の制限解除処理を改修
// 2015.09.01 リロード負荷低減において、Firefox 40.0.3+Greasemonkey 3.3 にて意図した動作とならないことがあるのを修正
// 2015.10.19 10/14のメンテでクエクリ以外の自動デュエルが動作しなくなっていたのを修正
// 2016.04.07 Google Chrome+Tampermonkey でスクリプトヘッダーに @connect が無いと警告が出る件の対応
// 2016.05.05 自動出兵を実装。出兵画面で出兵先とカードを選択し、出兵確認画面で「自動出兵クエに登録」を押下してください。
//			  「自動出兵情報をクリア」を押下で設定をクリアできます。
//			  ※出兵時にスキルを使用したり兵士を引率することはできません。
// 2016.06.04 自動出兵が有効で、出兵条件を満たさなかった時、寄付クエとデュエルクエ以外の機能が動作していなかった不具合を修正。
// 2016.07.27 スクリプトを推奨フォーマットで書き直した。
// 2017.09.05 受信箱の仕様が変わり、受信箱に 5 個以上アイテムがあるとき、受け取れなくなっていたのを修正。
// 2017.12.06 Google Chrome で動かなくなったらしいので修正
// 2018.02.19 環境により他のタイマーとタイミングが重なる場合があるようなので、クエスト受注タイミングを少しずらすようにした。
// 2018.06.09 環境により設定画面が開けない場合があるようなので対処
// 2018.07.18 出兵種別が鹵獲以外では資源獲得できなくなる仕様変更に対応。距離20以上ないと鹵獲出兵できないようなので設定を確認してください。
// 2019.01.02 2019年お正月クエクリ暫定対応。通常版と置き換えて使うことを想定
// 2020.01.01 2020年お正月クエクリ暫定対応。通常版と置き換えて使うことを想定
// 2020.04.25 デュエル更新時刻が鯖ごとに異なるため、デュエルクエの実行時間を 5:00→6:00 へ変更
//			  デュエルクエ未達でも、アイテム受領や自動助力が動作するよう修正
//			  全ての報告書を既読にするオプションを追加
//			  https/http のいずれでも動作するようにした（つもり）
//			  URL 記述フォーマットを統一
// 2020.12.06 12/4 のメンテ以降、自動デュエルが動作しなくなっていた問題を修正（デュエルのURLが変更されていた）
// 2021.01.01 2021年お正月クエクリ暫定対応。通常版と置き換えて使うことを想定
// 2022.01.01 2022年お正月クエクリ暫定対応。通常版と置き換えて使うことを想定
// 2023.01.01 2023年お正月クエクリ暫定対応。通常版と置き換えて使うことを想定

jQuery.noConflict();
q$ = jQuery;


var HOST		= location.hostname;
var SERVER		= HOST.split('.')[0]+'> ';
var SERVER_SCHEME = location.protocol + "//";
var SERVER_BASE = SERVER_SCHEME + location.hostname;

var INTERVAL	= 500;
var PGNAME		= "_bro3_auto_daily_quest_20150607_"; //グリモン領域への保存時のPGの名前


// クエストID
var ID_DONATE	= 254; // 同盟に合計500以上寄付する
var ID_TROOPS	= 256; // 武将を出兵し、資源を獲得する
var ID_DUEL		= 255; // ブショーデュエルで1回対戦する
var ID_2019 = 2114;
var DONATE_RICE = 2023;


// ヘルパー関数
function xpath(query,targetDoc) {
	return document.evaluate(query, targetDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}


// ラッパー
function httpGET_(url, callback) {
//	q$.get(url, callback);
	GM_xmlhttpRequest({
		method:"GET",
		url:url,
		headers:{"Content-type":"text/html"},
		overrideMimeType:'text/html; charset=utf-8',
		onload:function(x){
			if (callback) {
				callback(x.responseText);
			}
		}
	});
}
function httpGET(url, callback) {
	httpGET_(SERVER_BASE+url, callback);
}
function httpPOST(url, params, callback) {
	q$.post(SERVER_BASE+url, params, callback);
}
function getVALUE(key, defaultValue) {
	return GM_getValue(HOST+PGNAME+key , defaultValue );
}
function setVALUE(key, value) {
	GM_setValue(HOST+PGNAME+key , value );
}


var g_MD="";
var d = document;
var $ = function(id) { return d.getElementById(id); };
var $x = function(xp,dc) { return d.evaluate(xp, dc||d, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; };
var $a = function(xp,dc) { var r = d.evaluate(xp, dc||d, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null); var a=[]; for(var i=0; i<r.snapshotLength; i++){ a.push(r.snapshotItem(i)); } return a; };
var $e = function(e,t,f) { if (!e) return; e.addEventListener(t, f, false); };
var $v = function(key) { return d.evaluate(key, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null); };		// 2013.12.18
var DELIMIT1 = "#$%";
var DELIMIT2 = "&?@";


// 自動助力
function joryoku_once(x){
	var htmldoc = document.createElement("html");
		htmldoc.innerHTML = x;

	// 助力可能回数を取得
	var imgs = xpath('//div[@class="support-count"]/ul/li/img',htmldoc);
	for(var i = 0; i < imgs.snapshotLength; i++){
		var title = imgs.snapshotItem(i).title;
		if (title == '助力済み') { // 助力すると '助力空き' となる
			// ゲージ満タンかチェック
			var gaugeRest = 0;
			var gauge = xpath('//div[@class="support-gauge-frame"]/p',htmldoc);
			if (gauge.snapshotLength) {
				var matchResult = gauge.snapshotItem(0).textContent.match(/\s*(\d+)\s*\/\s*(\d+)\s*/);
				if (matchResult.length == 3) {
					gaugeRest = (parseInt(matchResult[2],10) - parseInt(matchResult[1],10));
				}
			}
			if (gaugeRest) {
				// 助力実行
				httpGET('/alliance/village.php?assist=1',joryoku_once);
			} else {
				console.log(SERVER+'助力MAXです。解放待ち...orz');
			}
			break;
		}
	}
}
function joryoku() {
	httpGET('/alliance/village.php',joryoku_once);
}

// 受信箱にあるアイテムを便利アイテムへ移す
function moveFromInbox(reloadIfNeed){
	httpGET('/item/inbox.php#ptop',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;

		var item_id_list = "";
		var count = 0;
		var script_list = xpath('//div[@id="whiteWrapper"]/script',htmldoc);
		if (script_list.snapshotLength) {
			var match_result = script_list.snapshotItem(0).innerHTML.match(/initItemCheck\(\d+,\s*\d+,\s*'([\d_]+)'/);
			if (match_result && match_result.length == 2) {
				item_id_list = match_result[1].split("_", 5).join("_");
				count = 1;
			}
		}

		if (count) {
			var ssid = xpath('//form[@name="multimoveform"]/input[@name="ssid"]',htmldoc).snapshotItem(0);
			var c = {
				'item_id_list': item_id_list,
				'ssid': ssid.value
			};
			httpPOST('/item/inbox.php',c,function(x){moveFromInbox(true);});
		} else if (reloadIfNeed) {
			var tid=setTimeout(function(){location.reload(false);},INTERVAL);
		}
	});
}

// 寄付
function postDonate(callback) {
	var c = {
		'contributionForm': "",
		'wood': 0,
		'stone': 0,
		'iron': 0,
		'rice': DONATE_RICE,
		'contribution': 1
	};
	httpPOST('/alliance/level.php',c,function(x){
		if (callback) {
			callback();
		}
	});
//	var tid=setTimeout(function(){location.reload(false);},INTERVAL);
}

// デュエル
function duel(callback){
	httpGET('/pvp_duel/duel.php',function(y){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = y;

		// 6枚目がセットされているか
		if ( xpath('//ul[@class="deck_card"]/li[6]/dl/dd[3]/span[2]', htmldoc).snapshotItem(0).innerHTML.match("---/---") ) {
			console.log(SERVER+'*** no deck set ***');
			if (callback) {
				callback(false);
			}
			return;
		}

		httpGET('/pvp_duel/select_enemy.php?deck=1',function(z){
			var htmldoc2 = document.createElement("html");
				htmldoc2.innerHTML = z;

			try {
				var rival_list = xpath('//ul[@class="rival_list"]/li/a[@class="thickbox btn_battle"]', htmldoc2);
				httpGET_( rival_list.snapshotItem(0).href, function(x){

					x.match(/battleStart\((\d+),\s(\d+),\s(\d+)\)/);

					var c = {
						'deck': 1,
						'euid': parseInt(RegExp.$2,10),
						'edeck': 0
					};

					// デュエルの開始
					httpGET(`/pvp_duel/process_json.php?deck=1&euid=${c.euid}&edeck=0`, c , function(x) {
						//location.reload();
						if (callback) {
							callback(true);
						}
					});
				});
			} catch(e) {
				//console.log(SERVER+'*** no duel ***');
				if (callback) {
					callback(false);
				}
			}
		});
	});
}

// サーバー時刻が [00:00:00 - 01:59:59] or [06:00:00 - 23:59:59] であれば自動デュエルする
function auto_duel()
{
	var server = xpath('//*[@id="server_time_disp"]', document).snapshotItem(0);
	if (server && server.textContent) {
		var hour = parseInt(server.textContent.substr(0,2), 10);
		if (hour < 2 || hour >= 6) {
			duel(function(worked){
				if (worked) {
					auto_duel();
				}
			});
		}
	}
}

// ヨロズダスを引く
function yorozudas(callback){
	httpGET('/reward_vendor/reward_vendor.php',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;

		var reward_list = xpath('//form/input[@value="ヨロズダスを引く" and not(contains(text(),"ヨロズダスの残り回数がありません"))]', htmldoc);
		if (reward_list.snapshotLength) {
			var c = {
				'send': 'send',
				'got_type': 0
			};
			httpPOST('/reward_vendor/reward_vendor.php',c,function(das){
				var div = document.createElement('div');
					div.innerHTML = das.responseText;
				var reward_result = xpath('*//table[@class="getBushodas"]/tbody/tr/td/p/strong', div);
				if (reward_result.snapshotLength) {
					console.log(SERVER+'取得アイテム:'+reward_result.snapshotItem(0).textContent);
				}
				if (callback) {
					callback();
				}
			});
		} else {
			if (callback) {
				callback();
			}
		}
	});
}

// クリアしたクエスト報酬を受け取る
function receiveRewards()
{
	var receive_it = false;
	var callback = function(){
		if (OPT_MOVE_FROM_INBOX) {
			if (receive_it) {
				clearLastTime();
			}
			moveFromInbox(receive_it);
		} else if (receive_it) {
			clearLastTime();
			var tid=setTimeout(function(){location.reload(false);},INTERVAL);
		}
	};
	httpGET('/quest/index.php?list=1&p=1&mode=0&selected_tab=7',function(y){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = y;

		var reward_list = xpath('//table[@summary="報酬"]/tbody/tr/td', htmldoc);
		if (reward_list.snapshotLength) {
			// 報酬内容をログに出力
			var reward_content = xpath('//table[@summary="報酬"]', htmldoc).snapshotItem(0).textContent.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, "");
			var reward_text = reward_list.snapshotItem(0).textContent;

			// クエスト報酬を自動で受け取るか判定
			receive_it = true;
			if (name.match(/木材|石|鉄|食料/)) {
				// 資源報酬の場合は、自動で受け取る設定に依る
				receive_it = OPT_RECEIVE_RESOURCES ? true : false;
			}

			if (receive_it){
				console.log(SERVER+reward_content+' -> 受領');
				httpGET('/quest/index.php?c=1',function(x){
					// 報酬がヨロズダス回数ならそのままヨロズダスを引く
					if (reward_text == 'ヨロズダス回数') {
						yorozudas(callback);
					} else {
						if (callback) {
							callback();
						}
					}
				});
			} else {
				console.log(SERVER+reward_content+' -> 受領保留');
				if (callback) {
					callback();
				}
			}
		} else {
			yorozudas(callback);
		}
	});
}

// 未クリアの繰り返しクエストを取得
function checkAttentionQuest(htmldoc, callback){
	var attention_quest = xpath('//div[@id="questB3_table"]/table/tbody/tr[contains(@class, "attention")]', htmldoc);
	var regexp = /cancelQuest\((\d+),\s*\d+,\s*\d+\)/;
	var quest_list = [];
	for (var i = 0; i < attention_quest.snapshotLength; i++){
		if (xpath('td/a[contains(text(), "繰り返し")]', attention_quest.snapshotItem(i)).snapshotLength){
			var quest_id = attention_quest.snapshotItem(i).innerHTML.match(regexp);
			if ( quest_id ){
				quest_list.push(quest_id[1]);
			}
		}
	}
	if (callback) {
		callback(quest_list);
	}
}

// 繰り返しクエストを受注
function acceptAttentionQuestImpl(tabIndex, callback) {
	httpGET('/quest/index.php?list=1&p=1&mode=0&selected_tab='+tabIndex,function(y){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = y;

		// 残っている繰り返しクエスト id を取得
		var attention_quest = xpath('//div[@id="questB3_table"]/table/tbody/tr[contains(@class, "attention")]', htmldoc);

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

		if (quest_list.length === 0) {
			checkAttentionQuest(htmldoc, callback);
			return;
		}

		// クエスト受注
		var count = 0;
		for (var i = 0; i < quest_list.length; i++){
			var query = 'action=take_quest&id=' + quest_list[i];
			httpGET('/quest/index.php?'+query,function(x){
				count++;

				// すべての通信が完了した後の処理
				if (count == quest_list.length) {
					checkAttentionQuest(x, callback);
				}
			});
		}
	});
}
function acceptAttentionQuest(callback) {
	acceptAttentionQuestImpl(7, function(x){
		acceptAttentionQuestImpl(8, function(y){
			array_merge(x, y);
			callback(x);
		});
	});
}

// 自動出兵
function sendTroop(vID, cardID, cardGage, targetX, targetY, callback) {
	// 指定の武将を指定の拠点から指定座標に向ける
	httpGET(`/village_change.php?village_id=${vID}&from=menu&page=%2Fvillage.php#ptop`,function(x){
		var c = {
			'village_x_value': targetX, // 出兵先座標x
			'village_y_value': targetY, // 出兵先座標y
			'unit_assign_card_id': cardID, // 武将カードID
			'radio_move_type': '307', // 301=援軍,302=殲滅,303=強襲,306=偵察,307=鹵獲

			'radio_reserve_type': '0',
			'btn_send': '出兵',
			'card_id': '204'
		};

		console.log(SERVER+"拠点 "+vID+" から ("+targetX+","+targetY+") へ "+cardID+" [討伐:"+cardGage+"] で出兵します。");
		httpPOST('/facility/castle_send_troop.php',c,function(x){
			var tid=setTimeout(function(){location.reload(false);},INTERVAL);
		});
	});
}
function callSendTroop()
{
	var vID		= 0;					// 出兵拠点ID
	var cardID	= OPT_TROOPS_CARD_ID;	// 出兵武将カードID
	var targetX	= OPT_TROOPS_X;			// 出兵先座標x
	var targetY	= OPT_TROOPS_Y;			// 出兵先座標y

	if (OPT_TROOPS_CARD_ID === 0) {
		console.log(SERVER+"出兵クエ情報が登録されていません！");
		return false;
	}

	// 討伐ゲージを取得
	var cardGage = 0;
	httpGET('/card/deck.php',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;

		q$(htmldoc).find("dd:contains('待機中')").each(function(){
			var m = q$("a", this).attr("href").match(/village_id%3D(\d+)%26card_id%3D(\d+)/i);

			// 指定されている武将カードIDと配置拠点IDが一致したもののみ有効とする
			if (m && m.length == 3 && m[2] == cardID) {
				// セットされている拠点IDを覚える
				vID = m[1];

				// 討伐ゲージを取得
				q$(this).siblings(".subdue").each(function(){
					var gage = q$("span.gage", this).text();
					if (gage.length) {
						cardGage = gage;
						return false;
					}
				});
			}
		});

		// 出兵指示
		if (cardGage >= 100) {
			sendTroop(vID, cardID, cardGage, targetX, targetY);
			return true;
		} else {
			console.log("[出兵クエ] 討伐ゲージ回復待ち。current="+cardGage);
			return false;
		}

	});
}


( function() {
	loadSettingBox();
	addOpenSettingLink();

	console.log(SERVER+'*** bro3_quest ***');
	if (! isWorktime(d)) {
		// 負荷を下げる為、一定時間は処理しない
		return;
	}

	if (location.pathname == "/village.php") {
		//========================================
		// 「都市」タブで動作
		//========================================

		// クエスト受注
		setTimeout(function(){
			acceptAttentionQuest(function(quest_list){

				// 未クリアの繰り返しクエストマッチング
				for (var i = 0; i < quest_list.length; i++){
					var quest_id = parseInt(quest_list[i],10);
					if (quest_id == ID_2019){
						// 寄付クエ
						postDonate(receiveRewards);
						return;
					}
					if (quest_id == ID_DONATE && OPT_QUEST_DONATE){
						// 寄付クエ
						postDonate(receiveRewards);
						return;
					}
					if (quest_id == ID_DUEL && OPT_QUEST_DUEL){
						// デュエルクエ
						duel(function(worked){receiveRewards();});
						return;
					}
					if (quest_id == ID_TROOPS && OPT_QUEST_TROOPS){
						// 出兵クエ
						if (callSendTroop()) {
							return;
						}
					}
				}

				// 受信箱から移す
				if (OPT_MOVE_FROM_INBOX) {
					moveFromInbox(false);
				}

				// 自動助力
				if (OPT_AUTO_JORYOKU) {
					joryoku();
				}

				// サーバー時刻が [00:00:00 - 01:59:59] or [06:00:00 - 23:59:59] であれば自動デュエルする
				if (OPT_AUTO_DUEL) {
					auto_duel();
				}

				// ツールに連動しない報酬受領
				receiveRewards();
			});
		}, OPT_QUEST_TIMEINTERVAL);
	}
	else if (location.pathname == "/facility/castle_send_troop.php") {
		//========================================
		// 出兵画面で動作
		//========================================
		var targetX = q$("*[name=village_x_value]").val(); // 出兵先座標x
		var targetY = q$("*[name=village_y_value]").val(); // 出兵先座標y
		var cardID = q$("*[name=unit_assign_card_id]").val(); // 武将カードID
		if (cardID) {
			var clearInfo = d.createElement("input");
				clearInfo.id = "Auto_Daily_Quest_Clear_Troops";
				clearInfo.type = "button";
				clearInfo.style.marginTop = "10px";
				clearInfo.style.padding = "10px";
				if (OPT_TROOPS_CARD_ID) {
					clearInfo.value = "自動出兵情報をクリア";
				} else {
					clearInfo.value = "自動出兵情報は未登録";
				}
				clearInfo.style.font = "16px 'ＭＳ ゴシック'";
				clearInfo.style.color = "#000000";
				clearInfo.style.cursor = "pointer";
				clearInfo.addEventListener("click", function() {

					OPT_TROOPS_CARD_ID		= 0; // 出兵武将カードID
					OPT_TROOPS_X			= targetX; // 出兵先座標x
					OPT_TROOPS_Y			= targetY; // 出兵先座標y
					saveSettingLocal();
					var tid=setTimeout(function(){location.reload(false);},INTERVAL);
				}, true);
			var regInfo = d.createElement("input");
				regInfo.id = "Auto_Daily_Quest_Register_Troops";
				regInfo.type = "button";
				regInfo.style.marginTop = "10px";
				regInfo.style.marginLeft = "30px";
				regInfo.style.padding = "10px";
				regInfo.value = "自動出兵クエに登録";
				regInfo.style.font = "18px 'ＭＳ ゴシック'";
				regInfo.style.fontWeight = "bold";
				regInfo.style.color = "#0000FF";
				regInfo.style.cursor = "pointer";
				regInfo.addEventListener("click", function() {

					OPT_TROOPS_CARD_ID		= cardID; // 出兵武将カードID
					OPT_TROOPS_X			= targetX; // 出兵先座標x
					OPT_TROOPS_Y			= targetY; // 出兵先座標y
					saveSettingLocal();
					var tid=setTimeout(function(){location.reload(false);},INTERVAL);
				}, true);
			q$("#btn_send").after(regInfo).after(clearInfo);
		}
	}
})();


//====================[ 設定画面 ]====================

// サーバー時間
function isWorktime(htmldoc){
	if (OPT_VALUE_IGNORE_SECONDS <= 0) return true;

	// 負荷を下げる為、一通り実施したら1時間に1回程度の再チェックとする
	var server = xpath('//div[@id="navi01"]/dl[@class="world"]/dd[@class="server"]/span[@id="server_time"]', htmldoc).snapshotItem(0);
	if (server && server.textContent) {
		var match_result = server.textContent.match(/(\d+)[^\d]+(\d+)[^\d]+(\d+)[^\d]+(\d+)[^\d]+(\d+)[^\d]+(\d+)/);
		if (match_result && match_result.length > 6) {
			var date = new Date(
				parseInt(match_result[1],10),
				parseInt(match_result[2],10),
				parseInt(match_result[3],10),
				parseInt(match_result[4],10),
				parseInt(match_result[5],10),
				parseInt(match_result[6],10),
				0);
			var cur_time = date.getTime();
			var lasttime = parseInt(getVALUE("lasttime","0"),10);
			var pasttime = (cur_time - lasttime) / 1000;
//			console.log(SERVER+"last="+lasttime);
//			console.log(SERVER+"date="+cur_time);
			console.log(SERVER+"past="+pasttime+"s");

			// 指定秒数未満のリロードは無視とする
			if (pasttime >= 0 && pasttime < OPT_VALUE_IGNORE_SECONDS) {
				return false;
			}

			setVALUE("lasttime", cur_time);
		}
	}
	return true;
}
function clearLastTime(){
	setVALUE("lasttime", 0);
}


function addOpenSettingLink() {
	var openLink = d.createElement("a");
		openLink.id = "Auto_Daily_Quest";
		openLink.href = "javascript:void(0);";
		openLink.style.marginTop = "0px";
		openLink.style.marginLeft = "0px";
		openLink.innerHTML = " [自動デイリークエ]";
		openLink.style.font = "10px 'ＭＳ ゴシック'";
		openLink.style.color = "#FFFFFF";
		openLink.style.cursor = "pointer";
		openLink.addEventListener("click", function() {
			openSettingBox();
		}, true);
	var sidebar_list = xpath('//*[@class="sideBox"]', d);
	if (sidebar_list.snapshotLength) {
		sidebar_list.snapshotItem(0).appendChild(openLink);
	}
}

function openSettingBox() {
	closeSettingBox();
	loadSettingBox();

	// 色設定
	var COLOR_FRAME = "#333333";	// 枠背景色
	var COLOR_BASE	= "#654634";	// 拠点リンク色
	var COLOR_TITLE = "#FFCC00";	// 各BOXタイトル背景色
	var COLOR_BACK	= "#FFF2BB";	// 各BOX背景色
	var FONTSTYLE = "bold 10px 'ＭＳ ゴシック'";	// ダイアログの基本フォントスタイル

	// 表示位置をロード
	var popupLeft = getVALUE("popup_left", 150);
	var popupTop  = getVALUE("popup_top", 150);
	if (popupLeft < 0) popupLeft = 0;
	if (popupTop < 0) popupTop = 0;


	// ==========[ 表示コンテナ作成 ]==========
	var ADContainer = d.createElement("div");
		ADContainer.id = "ADContainer";
		ADContainer.style.position = "absolute";
		ADContainer.style.color = COLOR_BASE;
		ADContainer.style.backgroundColor = COLOR_FRAME;
		ADContainer.style.opacity= 1.0;
		ADContainer.style.border = "solid 2px black";
		ADContainer.style.left = popupLeft + "px";
		ADContainer.style.top = popupTop + "px";
		ADContainer.style.font = FONTSTYLE;
		ADContainer.style.padding = "2px";
		ADContainer.style.MozBorderRadius = "4px";
		ADContainer.style.zIndex = 9999;
		ADContainer.style.width = "400px";
	d.body.appendChild(ADContainer);

	$e(ADContainer, "mousedown", function(event){
		if( event.target != $("ADContainer")) {return false;}
		g_MD="ADContainer";
		g_MX=event.pageX-parseInt(this.style.left,10);
		g_MY=event.pageY-parseInt(this.style.top,10);
		event.preventDefault();
	});
	$e(d, "mousemove", function(event){
		if(g_MD != "ADContainer") return true;
		var ADContainer = $("ADContainer");
		if( !ADContainer ) return true;
		var popupLeft = event.pageX - g_MX;
		var popupTop  = event.pageY - g_MY;
		ADContainer.style.left = popupLeft + "px";
		ADContainer.style.top = popupTop + "px";
		//ポップアップ位置を永続保存
		setVALUE("popup_left", popupLeft);
		setVALUE("popup_top", popupTop);
	});
	$e(d, "mouseup", function(event){g_MD="";});


	// ==========[ タイトル＋バージョン ]==========
	var title = d.createElement("span");
		title.style.color = "#FFFFFF";
		title.style.font = 'bold 120% "ＭＳ ゴシック"';
		title.style.margin = "2px";
		title.innerHTML = "Auto Daily Quest ";
	ADContainer.appendChild(title);

	var version = d.createElement("span");
		version.style.color = COLOR_TITLE;
		version.style.margin = "2px";
		version.innerHTML = " Ver." + VERSION;
	ADContainer.appendChild(version);


	// ==========[ 設定 ]==========
	var Setting_Box = d.createElement("table");
		Setting_Box.style.margin = "0px 4px 4px 0px";
		Setting_Box.style.border ="solid 2px black";
		Setting_Box.style.width = "100%";

	var tr100 = d.createElement("tr");
		tr100.style.border = "solid 1px black";
		tr100.style.backgroundColor =COLOR_TITLE;

	var td100 = d.createElement("td");
		td100.colSpan = "1";
		ccreateText(td100, "dummy", "■ 繰り返しクエスト自動化 ■", 0 );

	var tr200 = d.createElement("tr");
		tr200.style.border = "solid 1px black";
		tr200.style.backgroundColor =COLOR_BACK;

	var td200 = d.createElement("td");
		td200.style.padding = "2px";
		td200.style.verticalAlign = "top";
		ccreateCheckBox(td200, "OPT_QUEST_DONATE"		, OPT_QUEST_DONATE		, " [繰り返しクエスト] 自動寄付糧500", "繰り返しクエスト用に同盟へ糧500の寄付を自動で行ないます。",0);
		ccreateCheckBox(td200, "OPT_QUEST_DUEL"			, OPT_QUEST_DUEL		, " [繰り返しクエスト] 自動デュエル", "繰り返しクエスト用デュエルを1回だけ自動で行ないます。",0);
		ccreateCheckBox(td200, "OPT_QUEST_TROOPS"		, OPT_QUEST_TROOPS		, " [繰り返しクエスト] 自動出兵", "繰り返しクエスト用出兵を自動で行ないます。",0);
			ccreateText(td200, "dummy", "　", 0 );
			ccreateText(td200, "dummy", "※ クエスト報酬のうち、資源以外は自動で受け取ります。", 0 );
		ccreateCheckBox(td200, "OPT_AUTO_YOROZUDAS"		, OPT_AUTO_YOROZUDAS	, " 自動でヨロズダスをひく", "クエスト報酬がヨロズダスだった場合、自動でヨロズダスをひきます。",0);
		ccreateCheckBox(td200, "OPT_RECEIVE_RESOURCES"	, OPT_RECEIVE_RESOURCES	, " クエスト報酬が資源でも自動で受け取る", "クエスト報酬が資源だったときも自動で受け取ります。",0);
		ccreateCheckBox(td200, "OPT_MOVE_FROM_INBOX"	, OPT_MOVE_FROM_INBOX	, " アイテム受信箱から便利アイテムへ移動", "受信箱内のアイテムを自動で便利アイテムへ移動します。",0);
			ccreateText(td200, "dummy", "　", 0 );
		ccreateCheckBox(td200, "OPT_AUTO_DUEL"			, OPT_AUTO_DUEL			, " [02:00:00 - 05:59:59] 以外に自動デュエル", "[00:00:00 - 01:59:59], [06:00:00 - 23:59:59] の時間帯のみ自動デュエルを行ないます。",0);
		ccreateCheckBox(td200, "OPT_AUTO_JORYOKU"		, OPT_AUTO_JORYOKU		, " 自動助力", "同盟施設に祈祷所がある場合、自動で助力を行ないます。",0);
			ccreateText(td200, "dummy", "　", 0 );

	Setting_Box.appendChild(tr100);
	tr100.appendChild(td100);
	Setting_Box.appendChild(tr200);
	tr200.appendChild(td200);
	ADContainer.appendChild(Setting_Box);


	// ==========[ ボタンエリア ]==========
	var ButtonBox = d.createElement("div");
		ButtonBox.style.border ="solid 0px";	// 通常 0px チェック時 1px
		ButtonBox.style.margin = "2px";
		ButtonBox.style.padding = "0px";
	ADContainer.appendChild(ButtonBox);

	// 保存ボタン
	var Button2 = d.createElement("span");
		ccreateButton(Button2, "保存して閉じる", "設定内容を保存してウィンドウを閉じます。", function() {saveSettingBox(); closeSettingBox();}, 120);
	ButtonBox.appendChild(Button2);

	// 閉じるボタン
	var Button3 = d.createElement("span");
		ccreateButton(Button3, "キャンセル", "設定内容を破棄してウィンドウを閉じます。", function() {closeSettingBox();}, 88);
	ButtonBox.appendChild(Button3);
}


function closeSettingBox() {
	q$('#ADContainer', d).remove();
	q$('#ADContainer', document).remove();
}


function saveSettingBox() {
	var strSave = "";

	strSave += cgetCheckBoxValue($("OPT_QUEST_DONATE"))		+ DELIMIT2; // 自動寄付糧500
	strSave += cgetCheckBoxValue($("OPT_QUEST_DUEL"))		+ DELIMIT2; // 自動デュエル
	strSave += cgetCheckBoxValue($("OPT_QUEST_TROOPS"))		+ DELIMIT2; // 自動出兵
	strSave += cgetCheckBoxValue($("OPT_AUTO_YOROZUDAS"))	+ DELIMIT2; // 自動でヨロズダスをひく
	strSave += cgetCheckBoxValue($("OPT_RECEIVE_RESOURCES"))+ DELIMIT2; // クエスト報酬が資源でも自動で受け取る
	strSave += cgetCheckBoxValue($("OPT_MOVE_FROM_INBOX"))	+ DELIMIT2; // アイテム受信箱から便利アイテムへ移動
	strSave += cgetCheckBoxValue($("OPT_AUTO_DUEL"))		+ DELIMIT2; // [02:00:00 - 05:59:59] 以外に自動デュエル
	strSave += cgetCheckBoxValue($("OPT_AUTO_JORYOKU"))		+ DELIMIT2; // 自動助力
	strSave += DELIMIT1;
	strSave += OPT_TROOPS_CARD_ID	+ DELIMIT2; // 出兵武将カードID
	strSave += OPT_TROOPS_X			+ DELIMIT2; // 出兵先座標x
	strSave += OPT_TROOPS_Y			+ DELIMIT2; // 出兵先座標y

	setVALUE("", strSave);
}


function saveSettingLocal() {
	var src = getVALUE("", "");
	if (src) {
		var Temp1= src.split(DELIMIT1);
		var strSave = Temp1[0];
		strSave += DELIMIT1;
		strSave += OPT_TROOPS_CARD_ID	+ DELIMIT2; // 出兵武将カードID
		strSave += OPT_TROOPS_X			+ DELIMIT2; // 出兵先座標x
		strSave += OPT_TROOPS_Y			+ DELIMIT2; // 出兵先座標y

		setVALUE("", strSave);
	}
}


function loadSettingBox() {
	var src = getVALUE("", "");
	if (src === "") {
		OPT_QUEST_DONATE		= 1; // 自動寄付糧500
		OPT_QUEST_DUEL			= 1; // 自動デュエル
		OPT_QUEST_TROOPS		= 0; // 自動出兵
		OPT_AUTO_YOROZUDAS		= 1; // 自動でヨロズダスをひく
		OPT_RECEIVE_RESOURCES	= 1; // クエスト報酬が資源でも自動で受け取る
		OPT_MOVE_FROM_INBOX		= 1; // アイテム受信箱から便利アイテムへ移動
		OPT_AUTO_DUEL			= 1; // [02:00:00 - 05:59:59] 以外に自動デュエル
		OPT_AUTO_JORYOKU		= 1; // 自動助力
		OPT_TROOPS_CARD_ID		= 0; // 出兵武将カードID
		OPT_TROOPS_X			= 0; // 出兵先座標x
		OPT_TROOPS_Y			= 0; // 出兵先座標y
	} else {
		var Temp1= src.split(DELIMIT1);
		var Temp = Temp1[0].split(DELIMIT2);
		OPT_QUEST_DONATE		= forInt(Temp[0]); // 自動寄付糧500
		OPT_QUEST_DUEL			= forInt(Temp[1]); // 自動デュエル
		OPT_QUEST_TROOPS		= forInt(Temp[2]); // 自動出兵
		OPT_AUTO_YOROZUDAS		= forInt(Temp[3]); // 自動でヨロズダスをひく
		OPT_RECEIVE_RESOURCES	= forInt(Temp[4]); // クエスト報酬が資源でも自動で受け取る
		OPT_MOVE_FROM_INBOX		= forInt(Temp[5]); // アイテム受信箱から便利アイテムへ移動
		OPT_AUTO_DUEL			= forInt(Temp[6]); // [02:00:00 - 05:59:59] 以外に自動デュエル
		OPT_AUTO_JORYOKU		= forInt(Temp[7]); // 自動助力

		if (Temp1.length >= 2) {
			Temp = Temp1[1].split(DELIMIT2);
			OPT_TROOPS_CARD_ID		= forInt(Temp[0]); // 出兵武将カードID
			OPT_TROOPS_X			= forInt(Temp[1]); // 出兵先座標x
			OPT_TROOPS_Y			= forInt(Temp[2]); // 出兵先座標y
		}
	}
}


function ccreateText(container, id, text, left )
{
	left += 2;
	var dv = d.createElement("div");
		dv.style.padding = "2px";
		dv.style.paddingLeft= left + "px";
		dv.style.paddingBottom = "4px";

	var lb = d.createElement("label");
		lb.htmlFor = id;
		lb.style.verticalAlign = "middle";
	var tx = d.createTextNode(text);
		tx.fontsize = "9px";
	lb.appendChild( tx );

	dv.appendChild(lb);
	container.appendChild(dv);
}


function ccreateButton(container, text, title, func, width, top)
{
	var btn = d.createElement("input");
		btn.style.padding = "0px";
		btn.type = "button";
		btn.value = text;
	if (top !== undefined) {
		btn.style.marginTop = top + "px";
	}
	if (width === undefined) {
		btn.style.width = "54px";
	} else {
		btn.style.width = width + "px";
	}
	btn.style.height = "20px";
	btn.style.verticalAlign = "middle";
	btn.title = title;
	container.appendChild(d.createTextNode(" "));
	container.appendChild(btn);
	container.appendChild(d.createTextNode(" "));
	$e(btn, "click", func);
	return btn;
}


function ccreateCheckBox(container, id, def, text, title, left )
{
	left += 2;
	var dv = d.createElement("div");
		dv.style.padding = "1px";
		dv.style.paddingLeft= left + "px";
		dv.title = title;
	var cb = d.createElement("input");
		cb.type = "checkbox";
		cb.style.verticalAlign = "middle";
		cb.id = id;
		cb.value = 1;
	if( def ) cb.checked = true;

	var lb = d.createElement("label");
		lb.htmlFor = id;
		lb.style.verticalAlign = "middle";

	var tx = d.createTextNode(text);
	lb.appendChild( tx );

	dv.appendChild(cb);
	dv.appendChild(lb);
	container.appendChild(dv);
	return cb;
}


function cgetCheckBoxValue(id)
{
	var c = id;
	if( !c ) return 0;
	if( !c.checked ) return 0;
	return 1;
}


function forInt(num,def){
	if (def === undefined) { def = 0; }
	if (isNaN(parseInt(num,10))) {
		return def;
	} else {
		return parseInt(num,10);
	}
}

function array_merge(dest, src) {
	Array.prototype.push.apply(dest, src);
}
