// ==UserScript==
// @name		bro3_auto_daily_quest
// @namespace	https://gist.github.com/RAPT21/
// @description	ブラウザ三国志 繰り返しクエスト自動化 by RAPT
// @include		http://*.3gokushi.jp/village.php*
// @include		https://*.3gokushi.jp/village.php*
// @include		http://*.3gokushi.jp/facility/castle_send_troop.php*
// @include		https://*.3gokushi.jp/facility/castle_send_troop.php*
// @include		http://*.3gokushi.jp/card/deck.php*
// @include		https://*.3gokushi.jp/card/deck.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://*.3gokushi.jp/maintenance*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @grant		GM_xmlhttpRequest
// @grant		GM_getValue
// @grant		GM_setValue
// @author		RAPT
// @version 	2024.09.13
// ==/UserScript==
var VERSION = "2024.09.13"; 	// バージョン情報

jQuery.noConflict();
q$ = jQuery;

//----------[内部設定]----------
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
// 2020.04.25 デュエル更新時刻が鯖ごとに異なるため、デュエルクエの実行時間を 5:00→6:00 へ変更
//			  デュエルクエ未達でも、アイテム受領や自動助力が動作するよう修正
//			  全ての報告書を既読にするオプションを追加
//			  https/http のいずれでも動作するようにした（つもり）
//			  URL 記述フォーマットを統一
// 2020.05.20 運営書簡を既読にするオプションを追加
// 2020.12.06 ログインボーナス書簡が廃止されたので、運営書簡を既読にするオプションを廃止
//			  12/4 のメンテ以降、自動デュエルが動作しなくなっていた問題を修正（デュエルのURLが変更されていた）
// 2022.06.19 洛陽への路 通算ログイン報酬を受取る
// 2022.07.18 育成クエストのクエクリ報酬も自動受領するようにした
// 2022.11.01 育成クエスト（勝戦の計、攻戦の計）の自動受注機能を追加
//			  洛陽への路の処理優先度を上げた
// 2022.11.21 洛陽への路 通算ログイン報酬を受取る処理が海路以外でも動作するよう修正
// 2023.01.01 お正月期間限定クエも同一スクリプトで手動切り替えできるように
//			  DONATE_SHOGATSU_RICE に寄付額をセットで有効化。0 をセットで無効化
// 2023.01.03 DONATE_SHOGATSU_RICE に 1 以上設定時、期間限定クエストを先に処理するように
// 2023.01.29 洛陽への路のルートを自動で切り替える（β機能）
// 2023.07.02 ソース内オプションを設定画面へ設置
// 2023.07.03 ソース内に不要となった旧オプション設定が残ったままだった
// 2023.08.11 2023.07.02版以降にて、繰り返しクエスト用出兵の出兵先として0以下の座標を出力先に指定できなくなっていた不具合を修正
// 2023.08.14 設定画面のレイアウト調整、TP鹵獲オプションβを追加
// 2024.09.13 TP鹵獲オプションβで設定できる武将数を6→12へ増加
//			  鹵獲出兵時の制限距離を設定できるように。最大距離=0に設定すると上限なしになります。
//			  デッキ画面でも設定画面を開けるように
// 2024.11.04 ヨロズダスの残り回数表示を天候エリア右側から資源表示の下部へ移動


//----------------------------------------
// 保存設定部品定義
//----------------------------------------
var g_options = {};

var OPT_QUEST_01	= 'dqu01'; // 繰り返しクエスト用寄付糧500を自動で行なう
var OPT_QUEST_02	= 'dqu02'; // 繰り返しクエスト用デュエルを自動で行なう
var OPT_QUEST_03	= 'dqu03'; // 繰り返しクエスト用出兵を自動で行なう

var OPT_RECEIVE_01	= 'dre01'; // 自動でヨロズダスをひく
var OPT_RECEIVE_02	= 'dre02'; // クエスト報酬 '資源' も自動で受け取る
var OPT_RECEIVE_03	= 'dre03'; // 受信箱から便利アイテムへ移動

var OPT_FEATURE_01	= 'dfe01'; // 自動デュエル
var OPT_FEATURE_02	= 'dfe02'; // 自動助力
var OPT_FEATURE_03	= 'dfe03'; // 全ての報告書を既読にする
var OPT_FEATURE_04	= 'dfe04'; // 洛陽への路 通算ログイン報酬を受取る
var OPT_FEATURE_05	= 'dfe05'; // 育成クエスト（勝戦の計、攻戦の計）自動受注
var OPT_FEATURE_06	= 'dfe06'; // [β機能] 洛陽への路のルートを自動で切り替える
var OPT_FEATURE_07	= 'dfe07'; // ヨロズダスの残り回数を資源表示の下部に表示

var OPT_TROOPS_01	= 'dtr01'; // 出兵武将カードID
var OPT_TROOPS_02	= 'dtr02'; // 出兵先座標x
var OPT_TROOPS_03	= 'dtr03'; // 出兵先座標y
var OPT_TROOPS_04	= 'dtr04'; // 最小討伐ゲージ
var OPT_TROOPS_05	= 'dtr05'; // 最小距離
var OPT_TROOPS_06	= 'dtr06'; // 最大距離

var OPT_CAPTURE_10	= 'dca10'; // 鹵獲出兵1
var OPT_CAPTURE_11	= 'dca11'; // _カードID
var OPT_CAPTURE_12	= 'dca12'; // _座標x
var OPT_CAPTURE_13	= 'dca13'; // _座標y
var OPT_CAPTURE_14	= 'dca14'; // _討伐ゲージ
var OPT_CAPTURE_15	= 'dca15'; // _スキルID

var OPT_CAPTURE_20	= 'dca20'; // 鹵獲出兵2
var OPT_CAPTURE_21	= 'dca21'; // _カードID
var OPT_CAPTURE_22	= 'dca22'; // _座標x
var OPT_CAPTURE_23	= 'dca23'; // _座標y
var OPT_CAPTURE_24	= 'dca24'; // _討伐ゲージ
var OPT_CAPTURE_25	= 'dca25'; // _スキルID

var OPT_CAPTURE_30	= 'dca30'; // 鹵獲出兵3
var OPT_CAPTURE_31	= 'dca31'; // _カードID
var OPT_CAPTURE_32	= 'dca32'; // _座標x
var OPT_CAPTURE_33	= 'dca33'; // _座標y
var OPT_CAPTURE_34	= 'dca34'; // _討伐ゲージ
var OPT_CAPTURE_35	= 'dca35'; // _スキルID

var OPT_CAPTURE_40	= 'dca40'; // 鹵獲出兵4
var OPT_CAPTURE_41	= 'dca41'; // _カードID
var OPT_CAPTURE_42	= 'dca42'; // _座標x
var OPT_CAPTURE_43	= 'dca43'; // _座標y
var OPT_CAPTURE_44	= 'dca44'; // _討伐ゲージ
var OPT_CAPTURE_45	= 'dca45'; // _スキルID

var OPT_CAPTURE_50	= 'dca50'; // 鹵獲出兵5
var OPT_CAPTURE_51	= 'dca51'; // _カードID
var OPT_CAPTURE_52	= 'dca52'; // _座標x
var OPT_CAPTURE_53	= 'dca53'; // _座標y
var OPT_CAPTURE_54	= 'dca54'; // _討伐ゲージ
var OPT_CAPTURE_55	= 'dca55'; // _スキルID

var OPT_CAPTURE_60	= 'dca60'; // 鹵獲出兵6
var OPT_CAPTURE_61	= 'dca61'; // _カードID
var OPT_CAPTURE_62	= 'dca62'; // _座標x
var OPT_CAPTURE_63	= 'dca63'; // _座標y
var OPT_CAPTURE_64	= 'dca64'; // _討伐ゲージ
var OPT_CAPTURE_65	= 'dca65'; // _スキルID

var OPT_CAPTURE_70	= 'dca70'; // 鹵獲出兵7
var OPT_CAPTURE_71	= 'dca71'; // _カードID
var OPT_CAPTURE_72	= 'dca72'; // _座標x
var OPT_CAPTURE_73	= 'dca73'; // _座標y
var OPT_CAPTURE_74	= 'dca74'; // _討伐ゲージ
var OPT_CAPTURE_75	= 'dca75'; // _スキルID

var OPT_CAPTURE_80	= 'dca80'; // 鹵獲出兵8
var OPT_CAPTURE_81	= 'dca81'; // _カードID
var OPT_CAPTURE_82	= 'dca82'; // _座標x
var OPT_CAPTURE_83	= 'dca83'; // _座標y
var OPT_CAPTURE_84	= 'dca84'; // _討伐ゲージ
var OPT_CAPTURE_85	= 'dca85'; // _スキルID

var OPT_CAPTURE_90	= 'dca90'; // 鹵獲出兵9
var OPT_CAPTURE_91	= 'dca91'; // _カードID
var OPT_CAPTURE_92	= 'dca92'; // _座標x
var OPT_CAPTURE_93	= 'dca93'; // _座標y
var OPT_CAPTURE_94	= 'dca94'; // _討伐ゲージ
var OPT_CAPTURE_95	= 'dca95'; // _スキルID

var OPT_CAPTURE_A0	= 'dcaA0'; // 鹵獲出兵10
var OPT_CAPTURE_A1	= 'dcaA1'; // _カードID
var OPT_CAPTURE_A2	= 'dcaA2'; // _座標x
var OPT_CAPTURE_A3	= 'dcaA3'; // _座標y
var OPT_CAPTURE_A4	= 'dcaA4'; // _討伐ゲージ
var OPT_CAPTURE_A5	= 'dcaA5'; // _スキルID

var OPT_CAPTURE_B0	= 'dcaB0'; // 鹵獲出兵11
var OPT_CAPTURE_B1	= 'dcaB1'; // _カードID
var OPT_CAPTURE_B2	= 'dcaB2'; // _座標x
var OPT_CAPTURE_B3	= 'dcaB3'; // _座標y
var OPT_CAPTURE_B4	= 'dcaB4'; // _討伐ゲージ
var OPT_CAPTURE_B5	= 'dcaB5'; // _スキルID

var OPT_CAPTURE_C0	= 'dcaC0'; // 鹵獲出兵12
var OPT_CAPTURE_C1	= 'dcaC1'; // _カードID
var OPT_CAPTURE_C2	= 'dcaC2'; // _座標x
var OPT_CAPTURE_C3	= 'dcaC3'; // _座標y
var OPT_CAPTURE_C4	= 'dcaC4'; // _討伐ゲージ
var OPT_CAPTURE_C5	= 'dcaC5'; // _スキルID


//----------------------------------------
// 初期化
//----------------------------------------
var HOST		= location.hostname;
var SERVER		= HOST.split('.')[0]+'> ';
var SERVER_SCHEME = location.protocol + "//";
var SERVER_BASE = SERVER_SCHEME + location.hostname;

var INTERVAL	= 500;
var PGNAME		= "_bro3_auto_daily_quest_20150607_"; //グリモン領域への保存時のPGの名前

var SERVER_NAME = location.hostname.match(/^(.*)\.3gokushi/)[1];
var SAVENAME = SERVER_NAME + "_bro3_auto_daily_quest_20230701_"; //グリモン領域への保存時のPGの名前; v2


// クエストID
var ID_DONATE	= 254; // 同盟に合計500以上寄付する
var ID_TROOPS	= 256; // 武将を出兵し、資源を獲得する
var ID_DUEL		= 255; // ブショーデュエルで1回対戦する
var ID_SHOGATSU = 2114; // お正月用期間限定寄付クエ
var DONATE_SHOGATSU_RICE = 0; // お正月用寄付クエを有効にする場合は寄付額をセットする

// 育成クエ 勝戦の計
var ID_TRAINING_TICKET			= 11101; // チケットブショーダスを3回引こう
var ID_TRAINING_COMPOSE			= 11201; // 合成を3回おこなおう
var ID_TRAINING_LAN				= 11301; // ★5以上の領地を取得しよう
var ID_TRAINING_CAPTURE			= 11401; // 距離100以上の★1領地に鹵獲出兵で資源を獲得しよう
var ID_TRAINING_BARBARIANS_1ST	= 11501; // 南蛮襲来（進行編）を撃退しよう
var ID_TRAINING_DUEL			= 11601; // ブショーデュエルで5勝しよう

// 育成クエ 攻戦の計
var ID_TRAINING_SKILL1			= 13111; // スキル「xx」を習得しよう(R水鏡)
var ID_TRAINING_SKILL2			= 13211; // スキル「xx」を習得しよう(SR水鏡)
var ID_TRAINING_FRENDLY			= 13301; // 3人以上の同盟員に友軍を派兵しよう
var ID_TRAINING_EXTERM			= 13401; // 敵君主の領地に友軍を引率して殲滅戦を行おう
var ID_TRAINING_BARBARIANS_2ND	= 13501; // 3人以上の君主から援軍を集めて第二章以上の南蛮襲来(強攻編)を撃退しよう
var ID_TRAINING_VICEROY			= 13601; // 南蛮太守を2人以上任命して第二章以上の南蛮襲来(強攻編)を撃退しよう


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
var $e = function(e,t,f) { if (!e) return; e.addEventListener(t, f, false); };
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

// 全ての報告書を既読にする
function openAllReports(callback) {
	var c = {
		'p': 1,
		'all_open': '全てを既読にする'
	};
	httpPOST('/report/list.php',c,function(x){
		if (callback) {
			callback();
		}
	});
}

// 寄付
function postDonate(rice, callback) {
	var c = {
		'contributionForm': "",
		'wood': 0,
		'stone': 0,
		'iron': 0,
		'rice': rice,
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
		// ヨロズダスの残り回数を資源表示の下部に表示
		if (g_options[OPT_FEATURE_07]) {
			var yz = q$('#yorozu-msg');
			if (yz.length === 0) {
				q$("#status_resources_point table.resource_tables tr:eq(1) td:eq(2)").append(q$('<p />', {
					id: 'yorozu-msg',
					style: 'color: white; text-align: right;'
				}).append(''));
			  yz = q$('#yorozu-msg');
			}
			yz.text(q$("#gray02Wrapper .sysMes", x).text().match(/現在引ける(ヨロズダス.+)/)[1]);
		}

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

// 洛陽への路 ルートログイン報酬のルートを切り替える
function selectLoginBonus(htmldoc, header) {
	var routeName = ['', '徒路', '街路', '山路', '海路', '隘路'];

	var currentNo = parseInt(q$(header).prop("id").match(/(\d)/)[1], 10);
	console.log(`現在のルート: ${currentNo}:${routeName[currentNo]}`);

	// 選択可能なルート
	var routeList = [];
	var nextNo = 0;
	q$("div[id^=route_]", htmldoc).filter(function(index){
		if (q$(this).prop("id").match(/route_(\d)/) === null) {
			return false;
		}
		return q$(".route-info-disabled-overlay", this).length === 0;
	}).each(function(index){
		var no = parseInt(q$(this).prop("id").match(/(\d)/)[1], 10);
		var nextItem = q$("li.route-item.next .bonus-item-name", this).text();
		routeList.push({no: no, item: nextItem});

		// 1.自動建設アイテム, 2.南蛮防御アイテム, 3.なるべく下のルート、の順番で選択する
		if (nextItem.indexOf('自動建設機能') >= 0) {
			nextNo = no;
		}
		if (nextNo === 0 && nextItem.indexOf('南蛮襲来防御力') >= 0) {
			nextNo = no;
		}
	});
	console.log(JSON.stringify(routeList));

	var revRouteList = array_reversed(routeList);
	if (nextNo === 0) {
		// 隘路→海路→山路→街路の順で選択
		nextNo = revRouteList[0].no;
	}
	if (currentNo === 5 || nextNo === 5) {
		// 隘路のチケット宝箱はハズレ度が高いため、可能であれば海路へ切り替える
		var item = revRouteList[0].item;
		if (item.indexOf('チケット宝箱（序）') >= 0 || item.indexOf('チケット宝箱（中）') >= 0) {
			if (Object.keys(routeList).indexOf('4') >= 0) {
				nextNo = 4;
			}
		}
	}
	console.log(`current: ${currentNo}:${routeName[currentNo]}, next: ${nextNo}:${routeName[nextNo]}`);

	if (currentNo != nextNo) {
		var c = {
			type: 'change_route',
			id: nextNo
		};
		httpPOST('/reward/login_bonus/', c, function(){
			console.log(`ルートログイン報酬を切り替えました: ${currentNo}:${routeName[currentNo]} -> ${nextNo}:${routeName[nextNo]}`);
		});
	}
}

// 洛陽への路 通算ログイン報酬を受取る
function receiveLoginBonus()
{
	httpGET('/reward/login_bonus/',function(y){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = y;

		var header = q$("#header_1", htmldoc)[0];
		if (!header) header = q$("#header_2", htmldoc)[0];
		if (!header) header = q$("#header_3", htmldoc)[0];
		if (!header) header = q$("#header_4", htmldoc)[0];
		if (!header) header = q$("#header_5", htmldoc)[0];
		if (!header) return;

		var totalDays = q$(".total-login-days > p > .num", header).eq(0).text().trim();
		console.log(`通算ログイン日数: ${totalDays}`);

		var routeDays = q$(".current-login-days > p > .num", header).eq(0).text().trim();
		console.log(`ルートログイン日数: ${routeDays}`);

		var button = q$("div[class*=total-login-days] div[class^=btn-receive-reward]", header).eq(0);
		var isEnabled = button.attr("class").indexOf("disabled") < 0;
		if (isEnabled && q$("div", button).length > 0) {
			var c = {
				'type': 'receive_total_login_bonus'
			};
			httpPOST('/reward/login_bonus/', c, function(x){
				console.log("通算ログイン報酬: 受領");
				//var tid=setTimeout(function(){location.reload(false);},INTERVAL);
			});
		}

		if (g_options[OPT_FEATURE_06]) {
			selectLoginBonus(htmldoc, header);
		}
	});
}

// クリアしたクエスト報酬を受け取る
function receiveRewardsImpl(check, path, callback)
{
	var receive_it = false;
	httpGET(check,function(y){
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
				receive_it = g_options[OPT_RECEIVE_02] ? true : false;
			}

			if (receive_it){
				console.log(SERVER+reward_content+' -> 受領');
				httpGET(path,function(x){
					// 報酬がヨロズダス回数ならそのままヨロズダスを引く
					if (reward_text == 'ヨロズダス回数') {
						if (callback) {
							callback(true, receive_it);
						}
					} else {
						if (callback) {
							callback(false, receive_it);
						}
					}
				});
			} else {
				console.log(SERVER+reward_content+' -> 受領保留');
				if (callback) {
					callback(false, receive_it);
				}
			}
		} else {
			if (callback) {
				callback(true, receive_it);
			}
		}
	});
}
function receiveRewards() {
	var receive_it = false;
	var receive = function(){
		if (g_options[OPT_RECEIVE_03]) {
			if (receive_it) {
				clearLastTime();
			}
			moveFromInbox(receive_it);
		} else if (receive_it) {
			clearLastTime();
			var tid=setTimeout(function(){location.reload(false);},INTERVAL);
		}
	};

	// 通常クエスト
	var check1 = '/quest/index.php?list=1&p=1&mode=0&selected_tab=7';
	var path1 = '/quest/index.php?c=1';

	// 育成クエスト
	var check2 = '/quest/index.php?quest_type=2';
	var path2 = '/quest/index.php?c=1&quest_type=2';

	receiveRewardsImpl(check1, path1, function(y1, it1) {
		receiveRewardsImpl(check2, path2, function(y2, it2) {
			var yorozu = y1 || y2;
			receive_it = it1 || it2;
			if (yorozu) {
				yorozudas(receive);
			} else if (receive_it) {
				receive();
			}
		});
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
	httpGET(`/quest/index.php?list=1&p=1&mode=0&selected_tab=${tabIndex}`,function(y){
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
	if (DONATE_SHOGATSU_RICE <= 0) {
		// 通常
		acceptAttentionQuestImpl(7, callback);
		return;
	}

	// お正月期間限定クエ対応
	acceptAttentionQuestImpl(8, function(x){
		acceptAttentionQuestImpl(7, function(y){
			array_merge(x, y);
			callback(x);
		});
	});
}

// 自動出兵
function sendTroop(vID, cardID, cardGage, targetX, targetY, cardSkillID, callback) {
	var minimum_troop_distance = g_options[OPT_TROOPS_05];	// 最小距離
	var maximum_troop_distance = g_options[OPT_TROOPS_06];	// 最大距離

	// 指定の武将を指定の拠点から指定座標に向ける
	httpGET(`/village_change.php?village_id=${vID}&from=menu&page=%2Fvillage.php#ptop`,function(x){
		// 指定座標までの距離を求める
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;
		var distance = 0;
		var xy = xpath('//div[@id="basepoint"]//span[@class="xy"]', htmldoc).snapshotItem(0).textContent;
		var m = xy.match(/\(([-]?[0-9]+),([-]?[0-9]+)\)/);
		if (m && m.length >= 2) {
			var x = forInt(m[1], 0);
			var y = forInt(m[2], 0);
			var distance = Math.pow(Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2), 0.5);
			distance = Math.floor(distance * 100) / 100;
			if (distance < minimum_troop_distance || (maximum_troop_distance > 0 && distance > maximum_troop_distance)) {
				console.log(`距離が ${distance} なので設定おかしい？　やめとくね。`);
				callback(false);
				return;
			}
		}

		// 出兵情報
		var c = {
			'village_x_value': targetX, // 出兵先座標x
			'village_y_value': targetY, // 出兵先座標y
			'unit_assign_card_id': cardID, // 武将カードID
			'radio_move_type': '307', // 301=援軍,302=殲滅,303=強襲,306=偵察,307=鹵獲
			'deck_mode': '1',
			'radio_reserve_type': '0',
			'radio_enhanced_loyalty_attack': 0,
			'btn_send': '出兵',
			'card_id': '204'
		};
		if (!isNullOrEmpty(cardSkillID)) {
			c[`use_skill_id[${cardID}]`] = cardSkillID;
		}

		console.log(SERVER+"拠点 "+vID+" から ("+targetX+","+targetY+") [距離:"+distance+"] へ "+cardID+" [討伐:"+cardGage+"] スキル:"+cardSkillID+" で出兵します。");
		httpPOST('/facility/castle_send_troop.php',c,function(x){
			if (callback) {
				callback(true);
			} else {
				var tid=setTimeout(function(){location.reload(false);},INTERVAL);
			}
		});
	});
}
function callSendTroop()
{
	var cardID	= g_options[OPT_TROOPS_01];	// 出兵武将カードID
	var targetX	= g_options[OPT_TROOPS_02];	// 出兵先座標x
	var targetY	= g_options[OPT_TROOPS_03];	// 出兵先座標y
	var minGage	= g_options[OPT_TROOPS_04];	// 最小討伐ゲージ

	if (g_options[OPT_TROOPS_01] === 0) {
		console.log(SERVER+"出兵クエ情報が登録されていません！");
		return false;
	}

	return callSendTroopEx(true, cardID, targetX, targetY, minGage, '', null);
}

function performCaptures() {
	var items = [
		{ enabled: OPT_CAPTURE_10, card_id: OPT_CAPTURE_11, x: OPT_CAPTURE_12, y: OPT_CAPTURE_13, gage: OPT_CAPTURE_14, skill_id: OPT_CAPTURE_15 },
		{ enabled: OPT_CAPTURE_20, card_id: OPT_CAPTURE_21, x: OPT_CAPTURE_22, y: OPT_CAPTURE_23, gage: OPT_CAPTURE_24, skill_id: OPT_CAPTURE_25 },
		{ enabled: OPT_CAPTURE_30, card_id: OPT_CAPTURE_31, x: OPT_CAPTURE_32, y: OPT_CAPTURE_33, gage: OPT_CAPTURE_34, skill_id: OPT_CAPTURE_35 },
		{ enabled: OPT_CAPTURE_40, card_id: OPT_CAPTURE_41, x: OPT_CAPTURE_42, y: OPT_CAPTURE_43, gage: OPT_CAPTURE_44, skill_id: OPT_CAPTURE_45 },
		{ enabled: OPT_CAPTURE_50, card_id: OPT_CAPTURE_51, x: OPT_CAPTURE_52, y: OPT_CAPTURE_53, gage: OPT_CAPTURE_54, skill_id: OPT_CAPTURE_55 },
		{ enabled: OPT_CAPTURE_60, card_id: OPT_CAPTURE_61, x: OPT_CAPTURE_62, y: OPT_CAPTURE_63, gage: OPT_CAPTURE_64, skill_id: OPT_CAPTURE_65 },
		{ enabled: OPT_CAPTURE_70, card_id: OPT_CAPTURE_71, x: OPT_CAPTURE_72, y: OPT_CAPTURE_73, gage: OPT_CAPTURE_74, skill_id: OPT_CAPTURE_75 },
		{ enabled: OPT_CAPTURE_80, card_id: OPT_CAPTURE_81, x: OPT_CAPTURE_82, y: OPT_CAPTURE_83, gage: OPT_CAPTURE_84, skill_id: OPT_CAPTURE_85 },
		{ enabled: OPT_CAPTURE_90, card_id: OPT_CAPTURE_91, x: OPT_CAPTURE_92, y: OPT_CAPTURE_93, gage: OPT_CAPTURE_94, skill_id: OPT_CAPTURE_95 },
		{ enabled: OPT_CAPTURE_A0, card_id: OPT_CAPTURE_A1, x: OPT_CAPTURE_A2, y: OPT_CAPTURE_A3, gage: OPT_CAPTURE_A4, skill_id: OPT_CAPTURE_A5 },
		{ enabled: OPT_CAPTURE_B0, card_id: OPT_CAPTURE_B1, x: OPT_CAPTURE_B2, y: OPT_CAPTURE_B3, gage: OPT_CAPTURE_B4, skill_id: OPT_CAPTURE_B5 },
		{ enabled: OPT_CAPTURE_C0, card_id: OPT_CAPTURE_C1, x: OPT_CAPTURE_C2, y: OPT_CAPTURE_C3, gage: OPT_CAPTURE_C4, skill_id: OPT_CAPTURE_C5 }
	];

	var index = 0;
	var max = items.length;
	var wait = false;
	var timer1 = setInterval(function() {
		if (wait) {
			return;
		}
		wait = true;
		var item = items[index];

		callSendTroopEx(
			g_options[item.enabled],
			g_options[item.card_id],
			g_options[item.x],
			g_options[item.y],
			g_options[item.gage],
			g_options[item.skill_id],
			function(isSent) {
				index++;
				if (index >= max) {
					clearInterval(timer1);
					timer1 = null;
				}
				wait = false;
			}
		);
	}, INTERVAL);
}

function callSendTroopEx(enabled, cardID, targetX, targetY, minGage, skillID, callback)
{
	if (!enabled) {
		if (callback) {
			callback(false);
		}
		return false;
	}

	var vID		= 0;					// 出兵拠点ID

	// 討伐ゲージを取得
	var cardGage = 0;
	httpGET('/card/deck.php',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;

		q$(htmldoc).find("dd:contains('待機中')").each(function(){
			var m = q$("a", this).attr("href").match(/village_id%3D(\d+)%26card_id%3D(\d+)/i);

			// 指定されている武将カードIDを探す
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
				if (vID > 0 && cardGage > 0) {
					return false;
				}
			}
		});

		// 出兵指示
		if (cardGage >= minGage) {
			sendTroop(vID, cardID, cardGage, targetX, targetY, skillID, callback);
			return true;
		} else {
			console.log(`[出兵クエ] 討伐ゲージ回復待ち。${cardID}: ${cardGage}/${minGage}`);
			if (callback) {
				callback(false);
			}
			return false;
		}

	});
}

// 育成クエ一覧を取得
function getTrainingList(url, callback) {
	httpGET(url, function(y){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = y;

		var stay = [];
		var in_accept = [];
		q$('#questB3_table table tbody tr.quest-tr', htmldoc).each(function(){
			var item = q$(this).html();
			if (q$(this).hasClass('in_accept')) {
				var m = item.match(/cancelQuest\((\d+),\s*\d+,\s*\d+\)/);
				if (m !== null && m.length >= 2) {
					// 受注済ID
					in_accept.push(m[1]);
				}
			} else if (q$(this).hasClass('finished') === false) {
				var m = item.match(/takeQuest\((\d+),\s*\d+,\s*\d+\)/);
				if (m !== null && m.length >= 2) {
					// 未受注ID
					stay.push(m[1]);
				}
			}
		});
		if (callback) {
			callback(stay, in_accept);
		}
	});
}

// 育成クエストを受注
function acceptTrainingQuest(callback) {
	// 育成クエスト全体で最大10個まで受注可能のため、受注済件数をカウントするにはすべてをチェックする
	var url1 = '/quest/index.php?list=1&mode=2&action=apply_condition&disp_mode=0&scroll_pos=0&quest_type=2&selected_tab=2&sort_1st_item=&sort_1st_order=asc&filter_category=-1&p=1';
	var url2 = '/quest/index.php?list=1&mode=2&action=apply_condition&disp_mode=0&scroll_pos=0&quest_type=2&selected_tab=3&sort_1st_item=&sort_1st_order=asc&filter_category=-1&p=1';
	var url3 = '/quest/index.php?list=1&mode=2&action=apply_condition&disp_mode=0&scroll_pos=0&quest_type=2&selected_tab=4&sort_1st_item=&sort_1st_order=asc&filter_category=-1&p=1';
	getTrainingList(url1, function(s1, a1) {
		getTrainingList(url2, function(s2, a2) {
			getTrainingList(url3, function(s3, a3) {
				// 結果を合成
				var stay = s1.concat(s3.reverse()); // 攻戦の計は友軍クエを優先するため、逆順ソートして合成する
				var in_accept = a1.concat(a2).concat(a3);
				// 受注最大数は10
				var canAcceptCount = 10 - in_accept.length;
				if (canAcceptCount <= 0) {
					// 最大件数受注済
					if (callback) {
						callback();
					}
					return;
				}

				// 最大数まで受注する
				var quest_list = stay.slice(0, canAcceptCount);

				// クエスト受注
				var count = 0;
				for (var i = 0; i < quest_list.length; i++){
					httpGET(`/quest/index.php?action=take_quest&id=${quest_list[i]}`,function(x){
						count++;

						// すべての通信が完了した後の処理
						if (count == quest_list.length) {
							if (callback) {
								callback();
							}
						}
					});
				}
			});
		});
	});
}


( function() {
	loadSettings();
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

		performCaptures();

		// クエスト受注
		setTimeout(function(){

			// 洛陽への路 通算ログイン報酬を受取る
			if (g_options[OPT_FEATURE_04]) {
				receiveLoginBonus();
			}

			// 育成クエ受注
			if (g_options[OPT_FEATURE_05]) {
				acceptTrainingQuest();
			}

			// 受信箱から移す
			if (g_options[OPT_RECEIVE_03]) {
				moveFromInbox(false);
			}

			// 自動助力
			if (g_options[OPT_FEATURE_02]) {
				joryoku();
			}

			// 全ての報告書を既読にする
			if (g_options[OPT_FEATURE_03]) {
				openAllReports();
			}

			acceptAttentionQuest(function(quest_list){

				// 未クリアの繰り返しクエストマッチング
				for (var i = 0; i < quest_list.length; i++){
					var quest_id = parseInt(quest_list[i],10);
					if (quest_id == ID_SHOGATSU && DONATE_SHOGATSU_RICE > 0) {
						// お正月寄付クエ
						postDonate(DONATE_SHOGATSU_RICE, receiveRewards);
						return;
					}
					if (quest_id == ID_DONATE && g_options[OPT_QUEST_01]){
						// 通常寄付クエ
						postDonate(500, receiveRewards);
						return;
					}
					if (quest_id == ID_DUEL && g_options[OPT_QUEST_02]){
						// デュエルクエ
						duel(function(worked){receiveRewards();});
						return;
					}
					if (quest_id == ID_TROOPS && g_options[OPT_QUEST_03]){
						// 出兵クエ
						if (callSendTroop()) {
							return;
						}
					}
				}

				// サーバー時刻が [00:00:00 - 01:59:59] or [06:00:00 - 23:59:59] であれば自動デュエルする
				if (g_options[OPT_FEATURE_01]) {
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
				if (g_options[OPT_TROOPS_01]) {
					clearInfo.value = "自動出兵情報をクリア";
				} else {
					clearInfo.value = "自動出兵情報は未登録";
				}
				clearInfo.style.font = "16px 'ＭＳ ゴシック'";
				clearInfo.style.color = "#000000";
				clearInfo.style.cursor = "pointer";
				clearInfo.addEventListener("click", function() {

					g_options[OPT_TROOPS_01]	= 0; // 出兵武将カードID
					g_options[OPT_TROOPS_02]	= targetX; // 出兵先座標x
					g_options[OPT_TROOPS_03]	= targetY; // 出兵先座標y
					saveSettings();
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

					g_options[OPT_TROOPS_01]	= cardID; // 出兵武将カードID
					g_options[OPT_TROOPS_02]	= targetX; // 出兵先座標x
					g_options[OPT_TROOPS_03]	= targetY; // 出兵先座標y
					saveSettings();
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
	loadSettings();

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
		ADContainer.style.width = "550px";
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
		tr100.style.backgroundColor = COLOR_TITLE;

	var td100 = d.createElement("td");
		td100.colSpan = "1";
		ccreateText(td100, "■ 繰り返しクエスト自動化 ■");

	var tr200 = d.createElement("tr");
		tr200.style.border = "solid 1px black";
		tr200.style.backgroundColor = COLOR_BACK;

	var td200 = d.createElement("td");
		td200.style.padding = "2px";
		td200.style.verticalAlign = "top";
		ccreateCheckBox(td200, OPT_QUEST_01, " [繰り返しクエスト] 自動寄付糧500", "繰り返しクエスト用に同盟へ糧500の寄付を自動で行ないます。");
		ccreateCheckBox(td200, OPT_QUEST_02, " [繰り返しクエスト] 自動デュエル", "繰り返しクエスト用デュエルを1回だけ自動で行ないます。");
		ccreateCheckBox(td200, OPT_QUEST_03, " [繰り返しクエスト] 自動出兵", "繰り返しクエスト用鹵獲出兵を自動で行ないます。");
			var divTroop = q$("<div />", {
				style: 'padding: 1px; padding-left: 16px'
			});
			q$(td200).append(divTroop);
			ccreateEdit(divTroop, OPT_TROOPS_01, "カードID", 16);
			ccreateEdit(divTroop, OPT_TROOPS_02, "座標", 6);
			ccreateEdit(divTroop, OPT_TROOPS_03, "", 6);
			ccreateEdit(divTroop, OPT_TROOPS_04, "討伐", 6);

			var divTroop2 = q$("<div />", {
				style: 'padding: 1px; padding-left: 16px'
			});
			q$(td200).append(divTroop2);
			ccreateEdit(divTroop2, OPT_TROOPS_05, "最小距離", 6);
			ccreateEdit(divTroop2, OPT_TROOPS_06, "最大距離", 6);

			ccreateText(td200, "　");
			ccreateText(td200, "報酬受領", true);
			ccreateText(td200, "※ クエスト報酬のうち、資源以外は自動で受け取ります。");
		ccreateCheckBox(td200, OPT_RECEIVE_01, " 自動でヨロズダスをひく", "クエスト報酬がヨロズダスだった場合、自動でヨロズダスをひきます。");
		ccreateCheckBox(td200, OPT_RECEIVE_02, " クエスト報酬が資源でも自動で受け取る", "クエスト報酬が資源だったときも自動で受け取ります。");
		ccreateCheckBox(td200, OPT_RECEIVE_03, " アイテム受信箱から便利アイテムへ移動", "受信箱内のアイテムを自動で便利アイテムへ移動します。");
			ccreateText(td200, "　");
			ccreateText(td200, "その他の機能", true);
		ccreateCheckBox(td200, OPT_FEATURE_01, " [02:00:00 - 05:59:59] 以外に自動デュエル", "[00:00:00 - 01:59:59], [06:00:00 - 23:59:59] の時間帯のみ自動デュエルを行ないます。");
		ccreateCheckBox(td200, OPT_FEATURE_02, " 自動助力", "同盟施設に祈祷所がある場合、自動で助力を行ないます。");
		ccreateCheckBox(td200, OPT_FEATURE_03, " 全ての報告書を既読にする", "報告書タブにあるボタンを自動で押します。");
		ccreateCheckBox(td200, OPT_FEATURE_04, " 洛陽への路 通算ログイン報酬を受取る", "洛陽への路の通算ログイン報酬を自動で受け取ります。");
		ccreateCheckBox(td200, OPT_FEATURE_05, " 育成クエスト自動受注", "育成クエスト（勝戦の計、攻戦の計）を自動で受注します。");
		ccreateCheckBox(td200, OPT_FEATURE_07, " ヨロズダスの残り回数を資源表示の下部に表示", "現在引けるヨロズダスの内容を資源表示の下部に表示します。");
			ccreateText(td200, "　");
		ccreateCheckBox(td200, OPT_FEATURE_06, " [β機能] 洛陽への路のルートを自動で切り替える", "洛陽への路 ルートログイン報酬のルートを次の優先順位で選択します。\n　1.自動建設アイテム\n　2.南蛮防御アイテム\n　3.なるべく下のルート\nただし、隘路のチケット宝箱（序）、チケット宝箱（中）の場合は可能であれば海路を選択します。");
			ccreateText(td200, "　");
			ccreateText(td200, "[β機能] TP鹵獲", true);
		ccreateCaptureBox(td200, OPT_CAPTURE_10, OPT_CAPTURE_11, OPT_CAPTURE_12, OPT_CAPTURE_13, OPT_CAPTURE_14, OPT_CAPTURE_15);
		ccreateCaptureBox(td200, OPT_CAPTURE_20, OPT_CAPTURE_21, OPT_CAPTURE_22, OPT_CAPTURE_23, OPT_CAPTURE_24, OPT_CAPTURE_25);
		ccreateCaptureBox(td200, OPT_CAPTURE_30, OPT_CAPTURE_31, OPT_CAPTURE_32, OPT_CAPTURE_33, OPT_CAPTURE_34, OPT_CAPTURE_35);
		ccreateCaptureBox(td200, OPT_CAPTURE_40, OPT_CAPTURE_41, OPT_CAPTURE_42, OPT_CAPTURE_43, OPT_CAPTURE_44, OPT_CAPTURE_45);
		ccreateCaptureBox(td200, OPT_CAPTURE_50, OPT_CAPTURE_51, OPT_CAPTURE_52, OPT_CAPTURE_53, OPT_CAPTURE_54, OPT_CAPTURE_55);
		ccreateCaptureBox(td200, OPT_CAPTURE_60, OPT_CAPTURE_61, OPT_CAPTURE_62, OPT_CAPTURE_63, OPT_CAPTURE_64, OPT_CAPTURE_65);
		ccreateCaptureBox(td200, OPT_CAPTURE_70, OPT_CAPTURE_71, OPT_CAPTURE_72, OPT_CAPTURE_73, OPT_CAPTURE_74, OPT_CAPTURE_75);
		ccreateCaptureBox(td200, OPT_CAPTURE_80, OPT_CAPTURE_81, OPT_CAPTURE_82, OPT_CAPTURE_83, OPT_CAPTURE_84, OPT_CAPTURE_85);
		ccreateCaptureBox(td200, OPT_CAPTURE_90, OPT_CAPTURE_91, OPT_CAPTURE_92, OPT_CAPTURE_93, OPT_CAPTURE_94, OPT_CAPTURE_95);
		ccreateCaptureBox(td200, OPT_CAPTURE_A0, OPT_CAPTURE_A1, OPT_CAPTURE_A2, OPT_CAPTURE_A3, OPT_CAPTURE_A4, OPT_CAPTURE_A5);
		ccreateCaptureBox(td200, OPT_CAPTURE_B0, OPT_CAPTURE_B1, OPT_CAPTURE_B2, OPT_CAPTURE_B3, OPT_CAPTURE_B4, OPT_CAPTURE_B5);
		ccreateCaptureBox(td200, OPT_CAPTURE_C0, OPT_CAPTURE_C1, OPT_CAPTURE_C2, OPT_CAPTURE_C3, OPT_CAPTURE_C4, OPT_CAPTURE_C5);
			ccreateText(td200, "　");

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
		ccreateButton(Button2, "保存して閉じる", "設定内容を保存してウィンドウを閉じます。", 120, function() {
			saveSettingBox();
			closeSettingBox();
		});
	ButtonBox.append(Button2);

	// 閉じるボタン
	var Button3 = d.createElement("span");
		ccreateButton(Button3, "キャンセル", "設定内容を破棄してウィンドウを閉じます。", 88, function() {
			closeSettingBox();
		});
	ButtonBox.appendChild(Button3);
}


function closeSettingBox() {
	q$('#ADContainer', d).remove();
	q$('#ADContainer', document).remove();
}


//----------------------------------------
// デフォルトオプション定義の取得
//----------------------------------------
function getDefaultOptions() {
	var settings = {};

	settings[OPT_QUEST_01]		= true; // 繰り返しクエスト用寄付糧500を自動で行なう
	settings[OPT_QUEST_02]		= true; // 繰り返しクエスト用デュエルを自動で行なう
	settings[OPT_QUEST_03]		= false; // 繰り返しクエスト用出兵を自動で行なう

	settings[OPT_RECEIVE_01]	= true; // 自動でヨロズダスをひく
	settings[OPT_RECEIVE_02]	= true; // クエスト報酬 '資源' も自動で受け取る
	settings[OPT_RECEIVE_03]	= true; // 受信箱から便利アイテムへ移動

	settings[OPT_FEATURE_01]	= true; // 自動デュエル
	settings[OPT_FEATURE_02]	= true; // 自動助力
	settings[OPT_FEATURE_03]	= true; // 全ての報告書を既読にする
	settings[OPT_FEATURE_04]	= true; // 洛陽への路 通算ログイン報酬を受取る
	settings[OPT_FEATURE_05]	= true; // 育成クエスト（勝戦の計、攻戦の計）自動受注
	settings[OPT_FEATURE_06]	= false; // [β機能] 洛陽への路のルートを自動で切り替える
	settings[OPT_FEATURE_07]	= true; // ヨロズダスの残り回数を資源表示の下部に表示

	settings[OPT_TROOPS_01]		= 0; // 出兵武将カードID
	settings[OPT_TROOPS_02]		= 0; // 出兵先座標x
	settings[OPT_TROOPS_03]		= 0; // 出兵先座標y
	settings[OPT_TROOPS_04]		= 100; // 討伐ゲージ
	settings[OPT_TROOPS_05]		= 20; // 最小距離
	settings[OPT_TROOPS_06]		= 30; // 最大距離

	settings[OPT_CAPTURE_10]	= false; // 鹵獲出兵1
	settings[OPT_CAPTURE_11]	= 0; // _カードID
	settings[OPT_CAPTURE_12]	= 0; // _座標x
	settings[OPT_CAPTURE_13]	= 0; // _座標y
	settings[OPT_CAPTURE_14]	= 500; // _討伐ゲージ
	settings[OPT_CAPTURE_15]	= ''; // _スキルID

	settings[OPT_CAPTURE_20]	= false; // 鹵獲出兵2
	settings[OPT_CAPTURE_21]	= 0; // _カードID
	settings[OPT_CAPTURE_22]	= 0; // _座標x
	settings[OPT_CAPTURE_23]	= 0; // _座標y
	settings[OPT_CAPTURE_24]	= 500; // _討伐ゲージ
	settings[OPT_CAPTURE_25]	= ''; // _スキルID

	settings[OPT_CAPTURE_30]	= false; // 鹵獲出兵3
	settings[OPT_CAPTURE_31]	= 0; // _カードID
	settings[OPT_CAPTURE_32]	= 0; // _座標x
	settings[OPT_CAPTURE_33]	= 0; // _座標y
	settings[OPT_CAPTURE_34]	= 500; // _討伐ゲージ
	settings[OPT_CAPTURE_35]	= ''; // _スキルID

	settings[OPT_CAPTURE_40]	= false; // 鹵獲出兵4
	settings[OPT_CAPTURE_41]	= 0; // _カードID
	settings[OPT_CAPTURE_42]	= 0; // _座標x
	settings[OPT_CAPTURE_43]	= 0; // _座標y
	settings[OPT_CAPTURE_44]	= 500; // _討伐ゲージ
	settings[OPT_CAPTURE_45]	= ''; // _スキルID

	settings[OPT_CAPTURE_50]	= false; // 鹵獲出兵5
	settings[OPT_CAPTURE_51]	= 0; // _カードID
	settings[OPT_CAPTURE_52]	= 0; // _座標x
	settings[OPT_CAPTURE_53]	= 0; // _座標y
	settings[OPT_CAPTURE_54]	= 500; // _討伐ゲージ
	settings[OPT_CAPTURE_55]	= ''; // _スキルID

	settings[OPT_CAPTURE_60]	= false; // 鹵獲出兵6
	settings[OPT_CAPTURE_61]	= 0; // _カードID
	settings[OPT_CAPTURE_62]	= 0; // _座標x
	settings[OPT_CAPTURE_63]	= 0; // _座標y
	settings[OPT_CAPTURE_64]	= 500; // _討伐ゲージ
	settings[OPT_CAPTURE_65]	= ''; // _スキルID

	settings[OPT_CAPTURE_70]	= false; // 鹵獲出兵7
	settings[OPT_CAPTURE_71]	= 0; // _カードID
	settings[OPT_CAPTURE_72]	= 0; // _座標x
	settings[OPT_CAPTURE_73]	= 0; // _座標y
	settings[OPT_CAPTURE_74]	= 500; // _討伐ゲージ
	settings[OPT_CAPTURE_75]	= ''; // _スキルID

	settings[OPT_CAPTURE_80]	= false; // 鹵獲出兵8
	settings[OPT_CAPTURE_81]	= 0; // _カードID
	settings[OPT_CAPTURE_82]	= 0; // _座標x
	settings[OPT_CAPTURE_83]	= 0; // _座標y
	settings[OPT_CAPTURE_84]	= 500; // _討伐ゲージ
	settings[OPT_CAPTURE_85]	= ''; // _スキルID

	settings[OPT_CAPTURE_90]	= false; // 鹵獲出兵9
	settings[OPT_CAPTURE_91]	= 0; // _カードID
	settings[OPT_CAPTURE_92]	= 0; // _座標x
	settings[OPT_CAPTURE_93]	= 0; // _座標y
	settings[OPT_CAPTURE_94]	= 500; // _討伐ゲージ
	settings[OPT_CAPTURE_95]	= ''; // _スキルID

	settings[OPT_CAPTURE_A0]	= false; // 鹵獲出兵10
	settings[OPT_CAPTURE_A1]	= 0; // _カードID
	settings[OPT_CAPTURE_A2]	= 0; // _座標x
	settings[OPT_CAPTURE_A3]	= 0; // _座標y
	settings[OPT_CAPTURE_A4]	= 500; // _討伐ゲージ
	settings[OPT_CAPTURE_A5]	= ''; // _スキルID

	settings[OPT_CAPTURE_B0]	= false; // 鹵獲出兵11
	settings[OPT_CAPTURE_B1]	= 0; // _カードID
	settings[OPT_CAPTURE_B2]	= 0; // _座標x
	settings[OPT_CAPTURE_B3]	= 0; // _座標y
	settings[OPT_CAPTURE_B4]	= 500; // _討伐ゲージ
	settings[OPT_CAPTURE_B5]	= ''; // _スキルID

	settings[OPT_CAPTURE_C0]	= false; // 鹵獲出兵12
	settings[OPT_CAPTURE_C1]	= 0; // _カードID
	settings[OPT_CAPTURE_C2]	= 0; // _座標x
	settings[OPT_CAPTURE_C3]	= 0; // _座標y
	settings[OPT_CAPTURE_C4]	= 500; // _討伐ゲージ
	settings[OPT_CAPTURE_C5]	= ''; // _スキルID

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

function saveSettingBox() {
	var defOptions = getDefaultOptions();

	q$("#ADContainer input").each(function(){
		var key = q$(this).attr('id');
		var type = q$(this).attr('type');
		if (type == 'checkbox') {
			g_options[key] = q$(this).prop('checked');
		} else if (type == 'text') {
			var src = q$(this).val().replace(/\s/g, '');
			var num = parseInt(src, 10);
			if (!isNaN(num)) {
				g_options[key] = num;
			} else {
				g_options[key] = defOptions[key];
			}
		}
	});
	saveSettings();
}


//----------------------------------------
// 設定のロード
//----------------------------------------
function loadSettings() {
	// 保存データの取得
	var obj = GM_getValue(SAVENAME + '_options', null);
	if (obj === null) {
		// 保存データがない場合、マイグレーションを試みる
		g_options = migrateSettings(getDefaultOptions());
		return;
	}

	var options = JSON.parse(obj);

	// 保存データにデフォルト設定の情報がない場合、デフォルト設定値を追加
	var defaults = getDefaultOptions();
	for (var key in defaults) {
		if (typeof options[key] === "undefined") {
			options[key] = defaults[key];
		}
	}

	g_options = options;
}

function migrateSettings(options) {
	var src = getVALUE("", "");
	if (src !== "") {
		var Temp1= src.split(DELIMIT1);
		var Temp = Temp1[0].split(DELIMIT2);
		options[OPT_QUEST_01]		= forIntAsBool(Temp[0]); // 自動寄付糧500
		options[OPT_QUEST_02]		= forIntAsBool(Temp[1]); // 自動デュエル
		options[OPT_QUEST_03]		= forIntAsBool(Temp[2]); // 自動出兵
		options[OPT_RECEIVE_01]		= forIntAsBool(Temp[3]); // 自動でヨロズダスをひく
		options[OPT_RECEIVE_02]		= forIntAsBool(Temp[4]); // クエスト報酬が資源でも自動で受け取る
		options[OPT_RECEIVE_03]		= forIntAsBool(Temp[5]); // アイテム受信箱から便利アイテムへ移動
		options[OPT_FEATURE_01]		= forIntAsBool(Temp[6]); // [02:00:00 - 05:59:59] 以外に自動デュエル
		options[OPT_FEATURE_02]		= forIntAsBool(Temp[7]); // 自動助力
		if (Temp.length > 8) {
			options[OPT_FEATURE_03] = forIntAsBool(Temp[8]); // 全ての報告書を既読にする
		}
		if (Temp.length > 9) {
			options[OPT_FEATURE_04] = forIntAsBool(Temp[9]); // 洛陽への路 通算ログイン報酬を受取る
		}
		if (Temp.length > 10) {
			options[OPT_FEATURE_05] = forIntAsBool(Temp[10]); // 育成クエスト（勝戦の計、攻戦の計）自動受注
		}

		if (Temp1.length >= 2) {
			Temp = Temp1[1].split(DELIMIT2);
			options[OPT_TROOPS_01]	= forInt(Temp[0]); // 出兵武将カードID
			options[OPT_TROOPS_02]	= forInt(Temp[1]); // 出兵先座標x
			options[OPT_TROOPS_03]	= forInt(Temp[2]); // 出兵先座標y
		}
	}
	return options;
}


function ccreateText(container, text, caption = false)
{
	var dv = q$("<div />", {
		style: 'padding: 2px; margin-bottom: 2px'
	});
	var lb = q$("<label />", {
		style: 'vertical-align: middle;'
	}).append(text);
	if (caption) {
		dv.css({
			'background-color': '#FFE000',
			'border': 'solid 1px black',
			'border-left': 'solid 8px black'
		});
		lb.css('padding-left', '4px');
	}
	q$(container).append(dv.append(lb));
}


function ccreateButton(container, text, title, width, func)
{
	var btn = q$("<input />", {
		type: 'button',
		value: text,
		style: `padding: 0px; width: ${width}px; height; 20px; vertical-align: middle`,
		title: title,
		on: {
			click: func
		}
	});
	q$(container).append(" ").append(btn).append(" ");
}


function ccreateCheckBox(container, key, text, title)
{
	var dv = q$("<div />", {
		style: 'padding: 1px; padding-left: 2px',
		title: title
	});
	var cb = q$("<input />", {
		type: 'checkbox',
		style: 'vertical-align: middle',
		id: key,
		value: 1
	});
	if (g_options[key]) {
		cb.prop('checked', true);
	}
	var lb = q$("<label />", {
		for: key,
		style: 'vertical-align: middle'
	}).append(text);

	q$(container).append(dv.append(cb).append(lb));
	return dv;
}


function ccreateCaptureBox(container, check, card, x, y, gage, skill) {
	var dv = ccreateCheckBox(container, check, ' カードID', '');
	ccreateEdit(dv, card, "", 16);
	ccreateEdit(dv, x, "座標", 6);
	ccreateEdit(dv, y, "", 6);
	ccreateEdit(dv, gage, "討伐", 3);
	ccreateEdit(dv, skill, "スキルID", 8);
}


function ccreateEdit(container, key, text, size)
{
	var lb = q$("<label />", {
		for: key,
		style: 'margin-left: 8px; margin-right: 2px;'
	}).append(text);
	var inp = q$("<input />", {
		id: key,
		type: 'text',
		maxlength: size,
		size: size,
		style: 'text-align: center;'
	});
	inp.val(g_options[key]);
	inp.attr("size", size); // ここで設定しないと反映されない環境がある
	if (text.length) {
		q$(container).append(lb).append(inp);
	} else {
		// テキストがない場合はマージンを入れる
		q$(container).append(inp);
		inp.css("margin-left", "2px");
	}
}


function forIntAsBool(num,def){
	return forInt(num,def) ? true : false;
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

function array_reversed(object) {
	var newObject = JSON.parse(JSON.stringify(object));
	newObject.reverse();
	return newObject;
}

function isNullOrEmpty(obj) {
	return obj === null || typeof obj === 'undefined' || obj.length === 0;
}


//----------------------------------------
// for debug print object
//----------------------------------------
function po(obj, ext = "") {
	console.log(ext + JSON.stringify(obj, null, '\t'));
}
