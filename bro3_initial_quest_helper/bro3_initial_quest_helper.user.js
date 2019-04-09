// ==UserScript==
// @name		bro3_initial_quest_helper
// @namespace	https://gist.github.com/RAPT21/
// @description	ブラウザ三国志 初期クエクリ補助 by RAPT
// @include		http://*.3gokushi.jp/quest*
// @exclude		http://*.3gokushi.jp/maintenance*
// @require		http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @grant		GM_xmlhttpRequest
// @author		RAPT
// @version 	2019.04.10
// ==/UserScript==
var VERSION = "2019.04.10"; 	// バージョン情報


// 2016.07.25 初版作成
// 2016.08.17 Firefox サポート
// 2017.03.18 同盟盟主座標,同盟貢献ポイントの検出対応、同盟ポイント,同盟貢献ポイントのクエクリ情報対応
// 2017.06.05 個人ランク、週間ランク、同盟ランクについて、TEXTBOX 自動入力対応
// 2019.04.10 同盟ランクが取得できなくなっていたのを対応、41鯖で同盟ポイントが取得できなくなっていたのを対応


jQuery.noConflict();
j$ = jQuery;

var HOST		= location.hostname;
var SERVER		= HOST.split('.')[0]+'> ';
var INTERVAL	= 500;
var PGNAME		= "_bro3_initial_quest_helper_20160724_"; //グリモン領域への保存時のPGの名前


// ヘルパー関数
function xpath(query,targetDoc) {
	return document.evaluate(query, targetDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}


// ラッパー
function httpGET(url, callback) {
//	j$.get(url, callback);
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
function httpPOST(url, params, callback) {
	j$.post(url, params, callback);
}


var d = document;
var $ = function(id) { return d.getElementById(id); };
var $x = function(xp,dc) { return d.evaluate(xp, dc||d, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; };
var $a = function(xp,dc) { var r = d.evaluate(xp, dc||d, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null); var a=[]; for(var i=0; i<r.snapshotLength; i++){ a.push(r.snapshotItem(i)); } return a; };
var $e = function(e,t,f) { if (!e) return; e.addEventListener(t, f, false); };
var $v = function(key) { return d.evaluate(key, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null); };		// 2013.12.18





//------------------------------------------------------------
//	▼▼▼2017.01.xx▼▼▼
//------------------------------------------------------------

// 基本
var ID_ALLY_RECRUIT	= 249; // 同盟募集機能を使ってみよう
var ID_TOTAL_RANK	= 123; // 統計の総合ランキングの順位を確認する
var ID_ALLY_RANK	= 106; // 現在の同盟ランクを報告する
var ID_WEEKLY_RANK	= 166; // 週間ランキングを確認しよう

// 同盟
var ID_ALLY_CONTR_1	= 210; // 同盟貢献ポイントを1000以上にする
var ID_ALLY_CONTR_2	= 211; // 同盟貢献ポイントを3000以上にする
var ID_ALLY_CONTR_3	= 212; // 同盟貢献ポイントを6000以上にする
var ID_ALLY_CONTR_4	= 213; // 同盟貢献ポイントを10000以上にする
var ID_ALLY_CONTR_5	= 214; // 同盟貢献ポイントを30000以上にする
var ID_ALLY_CONTR_6	= 215; // 同盟貢献ポイントを60000以上にする
var ID_ALLY_CONTR_7	= 216; // 同盟貢献ポイントを100000以上にする
var ID_ALLY_CONTR_8	= 217; // 同盟貢献ポイントを300000以上にする

var ID_ALLY_POINT_1	= 220; // 同盟ポイントを40000以上にする
var ID_ALLY_POINT_2	= 221; // 同盟ポイントを80000以上にする
var ID_ALLY_POINT_3	= 222; // 同盟ポイントを160000以上にする
var ID_ALLY_POINT_4	= 223; // 同盟ポイントを400000以上にする
var ID_ALLY_POINT_5	= 224; // 同盟ポイントを800000以上にする
var ID_ALLY_POINT_6	= 225; // 同盟ポイントを1600000以上にする
var ID_ALLY_POINT_7	= 226; // 同盟ポイントを4000000以上にする
var ID_ALLY_POINT_8	= 227; // 同盟ポイントを8000000以上にする

// 同盟貢献ポイント達成確認
function check_ally_contribute(pt, qid){
	if (qid == ID_ALLY_CONTR_1 && pt >= 1000) return true;
	if (qid == ID_ALLY_CONTR_2 && pt >= 3000) return true;
	if (qid == ID_ALLY_CONTR_3 && pt >= 6000) return true;
	if (qid == ID_ALLY_CONTR_4 && pt >= 10000) return true;
	if (qid == ID_ALLY_CONTR_5 && pt >= 30000) return true;
	if (qid == ID_ALLY_CONTR_6 && pt >= 60000) return true;
	if (qid == ID_ALLY_CONTR_7 && pt >= 100000) return true;
	if (qid == ID_ALLY_CONTR_8 && pt >= 300000) return true;
	return false;
}

// 同盟ポイント達成確認
function check_ally_point(pt, qid){
	if (qid == ID_ALLY_POINT_1 && pt >= 40000) return true;
	if (qid == ID_ALLY_POINT_2 && pt >= 80000) return true;
	if (qid == ID_ALLY_POINT_3 && pt >= 160000) return true;
	if (qid == ID_ALLY_POINT_4 && pt >= 400000) return true;
	if (qid == ID_ALLY_POINT_5 && pt >= 800000) return true;
	if (qid == ID_ALLY_POINT_6 && pt >= 1600000) return true;
	if (qid == ID_ALLY_POINT_7 && pt >= 4000000) return true;
	if (qid == ID_ALLY_POINT_8 && pt >= 8000000) return true;
	return false;
}

function debug_ally_contribute(pt) {
	var key = "　→同盟に貢献しよう";
	var reach = "";
	if (pt >= 1000) reach = "其一";
	if (pt >= 3000) reach = "其二";
	if (pt >= 6000) reach = "其三";
	if (pt >= 10000) reach = "其四";
	if (pt >= 30000) reach = "其五";
	if (pt >= 60000) reach = "其六";
	if (pt >= 100000) reach = "其七";
	if (pt >= 300000) reach = "其八";
	if (reach.length > 0) {
		appendLog(key, reach + "までクリア！");
	} else {
		appendLog(key, "未達");
	}
}
function debug_ally_point(pt) {
	var key = "　→同盟上位への道";
	var reach = "";
	if (pt >= 40000) reach = "其一";
	if (pt >= 80000) reach = "其二";
	if (pt >= 160000) reach = "其三";
	if (pt >= 400000) reach = "其四";
	if (pt >= 800000) reach = "其五";
	if (pt >= 1600000) reach = "其六";
	if (pt >= 4000000) reach = "其七";
	if (pt >= 8000000) reach = "其八";
	if (reach.length > 0) {
		appendLog(key, reach + "までクリア！");
	} else {
		appendLog(key, "未達");
	}
}


//------------------------------------------------------------
//	▼▼▼2016.08.17▼▼▼
//------------------------------------------------------------
function appendLog(key, value) {
	console.log(key + ':' + value);
}

// 個人ランク
function self_rank(handler){
	httpGET('http://'+HOST+'/user/ranking.php',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;
		var rankNum = j$('.mydata>.rankNum', htmldoc).text().substr(1).trim();
		appendLog("個人ランク", rankNum);
		handler(rankNum);
	});
}

// 同盟ランク,同盟ポイント,同盟人数,同盟盟主座標
function ally_rank(handler){
	httpGET('http://'+HOST+'/alliance/list.php',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;
		var td = j$('tr.mydata td', htmldoc);
		var leaderXY = td.eq(5).text().trim();
		appendLog("同盟盟主座標", leaderXY);
		var rankNum = td.eq(0).text().replace('→', '').replace(/,/g, '').trim();
		appendLog("同盟ランク", rankNum); g_allyRankNum = rankNum;
		var allyMembers = td.eq(3).text().replace(/,/g, '').trim();
		appendLog("同盟人数", allyMembers);
		var allyPoint = td.eq(2).text().replace(/,/g, '').trim();
		appendLog("同盟ポイント", allyPoint);
		debug_ally_point(allyPoint);

		var allyUrl = j$("a", td.eq(1)).attr("href");
		if (allyUrl.indexOf("info.php?id=") === 0) {
			allyUrl = 'http://'+HOST+'/alliance/' + allyUrl;
		}
		handler({
			leaderXY: leaderXY,
			rankNum: rankNum,
			allyMembers: allyMembers,
			allyPoint: allyPoint,
			allyUrl: allyUrl
		});
	});
}

// 週間ランキング
function weekly_rank(handler){
	httpGET('http://'+HOST+'/user/weekly_ranking.php',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;
		var base = j$('.tables[summary="攻撃ランキング"]', htmldoc);
		var rankNum = j$('.rank-self>td:first', base).text().replace('→', '').trim();
		appendLog("週間ランキング", rankNum);
		handler(rankNum);
	});
}

// 人口,撃破スコア
function profile_jinko(fn){
	httpGET('http://'+HOST+'/user/',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;
		var text = j$('table.commonTables', htmldoc).text().replace(/\s+/g, '');
		var name = text.match(/お気に入り武将カード君主(.+)個人掲示板/)[1];
		var sumJinko = text.match(/総人口(\d+)/)[1].replace(/,/g, '');
		var attScore = text.match(/撃破スコア(\d+)/)[1].replace(/,/g, '');
		appendLog("君主", name);
		appendLog("総人口", sumJinko);
		appendLog("撃破スコア", attScore);
		if (fn !== null) {
			fn(name);
		}
	});
}

// 同盟貢献ポイント
function ally_info(url, name){
	httpGET(url,function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;

		var tr = j$("table[class='tables'] tbody tr", htmldoc);
		for (var i = 0; i < tr.length; ++i) {
			var td = j$("td", tr.eq(i));
			if (td.length > 0) {
				var aName = td.eq(1).text().replace(/\s+/g, '');
				var aScore = td.eq(2).text().replace(/\s+/g, '');
				if (aName == name) {
					appendLog("同盟貢献ポイント", aScore);
					debug_ally_contribute(aScore);
					break;
				}
			}
		}
	});
}

function perform() {
	if (location.pathname !== "/quest/index.php") {
		return false;
	}
	var forms = j$("div.sysMes form");
	if (!forms || forms.length === 0) {
		return false;
	}

	var f = forms[0];
	var disp_id = parseInt(j$("input[name='disp_id']", f).attr("value"), 10);
	if (disp_id === ID_TOTAL_RANK) {
		self_rank(function(value){
			j$("input[name='tuto_p_ranking']", f).attr("value", value);
		});
		return true;
	}
	if (disp_id === ID_WEEKLY_RANK) {
		weekly_rank(function(value){
			j$("input[name='attack_rank']", f).attr("value", value);
		});
		return true;
	}
	if (disp_id === ID_ALLY_RANK) {
		ally_rank(function(info){
			j$("input[name='alliance_rank']", f).attr("value", info.rankNum);
		});
		return true;
	}


	return false;
}

( function() {
	if (perform()) {
		return;
	}
	profile_jinko(function(username){
		ally_rank(function(info){
			ally_info(info.ally_url, username);
		});
	});
})();
