// ==UserScript==
// @name		bro3_initial_quest_helper
// @namespace	https://gist.github.com/RAPT21/
// @description	ブラウザ三国志 初期クエクリ補助 by RAPT
// @include		http://*.3gokushi.jp/quest*
// @exclude		http://*.3gokushi.jp/maintenance*
// @require		http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// @connect		3gokushi.jp
// @grant		GM_xmlhttpRequest
// @author		RAPT
// @version 	2016.08.17
// ==/UserScript==
var VERSION = "2016.08.17"; 	// バージョン情報


// 2016.07.25 初版作成
// 2016.08.17 Firefox サポート


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

// 個人ランク
function self_rank(){
	httpGET('http://'+HOST+'/user/ranking.php',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;
		var rankNum = j$('.mydata>.rankNum', htmldoc).text().substr(1).trim();
		console.log("個人ランク:"+rankNum);
	});
}

// 同盟ランク,同盟ポイント,同盟人数
function ally_rank(){
	httpGET('http://'+HOST+'/alliance/list.php',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;
		var rankNum = j$('.mydata>.rankNum', htmldoc).text().substr(1).trim();
		console.log("同盟ランク:"+rankNum);
		var allyPoint = j$('.mydata>td:eq(2)', htmldoc).text().trim();
		console.log("同盟ポイント:"+allyPoint);
		var allyMembers = j$('.mydata>td:eq(3)', htmldoc).text().trim();
		console.log("同盟人数:"+allyMembers);
	});
}

// 週間ランキング
function weekly_rank(){
	httpGET('http://'+HOST+'/user/weekly_ranking.php',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;
		var base = j$('.tables[summary="攻撃ランキング"]', htmldoc);
		var rankNum = j$('.rank-self>td:first', base).text().substr(1).trim();
		console.log("週間ランキング:"+rankNum);
	});
}

// 人口,撃破スコア
function profile_jinko(fn){
	httpGET('http://'+HOST+'/user/',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;
		var text = j$('table.commonTables', htmldoc).text().replace(/\s+/g, '');
		var name = text.match(/お気に入り武将カード君主(.+)個人掲示板/)[1];
		var sumJinko = text.match(/総人口(\d+)/)[1];
		var attScore = text.match(/撃破スコア(\d+)/)[1];
		console.log("君主:"+name);
		console.log("総人口:"+sumJinko);
		console.log("撃破スコア:"+attScore);
		if (fn !== null) {
			fn(name);
		}
	});
}

// 同盟貢献ポイント
function ally_info(name){
	httpGET('http://'+HOST+'/alliance/info.php?id=2896',function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;
		var table = j$('table.tables[summary="ランキング"]', htmldoc);
		var tr = j$('tr', table);
		for (var i = 0; i < tr.length; ++i) {
			var aName = j$('td:eq(1)', tr[i]).text().replace(/\s+/g, '');
			var aScore = j$('td:eq(2)', tr[i]).text().replace(/\s+/g, '');
			if (aName == name) {
				console.log("同盟貢献ポイント:"+aScore);
				break;
			}
		}
	});
}

( function() {
	self_rank();
	ally_rank();
	weekly_rank();
	profile_jinko(ally_info);
})();
