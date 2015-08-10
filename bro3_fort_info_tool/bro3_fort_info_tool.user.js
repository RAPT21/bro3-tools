// ==UserScript==
// @name		bro3_fort_info_tool
// @namespace	https://gist.github.com/RAPT21/
// @description	ブラウザ三国志 砦包囲情報取得ツール by RAPT
// @include 	http://*.3gokushi.jp/map.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @require		http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// @grant		GM_xmlhttpRequest
// @grant		GM_getValue
// @grant		GM_setValue
// @author		RAPT
// @version 	0.1
// ==/UserScript==
var VERSION = "2015.08.10"; 	// バージョン情報

// 自同盟名
var OPT_TARGET_ALLY="CATS";

// 探索対象の座標[x,y]の配列
var GET_MAP_LIST = [
[-418,-154],
[-418,154],
[-418,418],
[-418,-418],
[-220,-220],
[-220,0],
[-220,220],
[-154,-418],
[-154,418],
[-88,-88],
[-88,88],
[0,-220],
[0,0],
[0,220],
[88,-88],
[88,88],
[154,418],
[220,-220],
[220,0],
[220,220],
[418,-418],
[418,-154],
[418,154],
[418,418],
[308,308],
[-308,308],
[308,-308],
[-308,-308]
];

// 0.1 プロトタイプ版です。




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

var HOST		= location.hostname;
var INTERVAL	= 500;

// ヘルパー関数
function xpath(query,targetDoc) {
	return document.evaluate(query, targetDoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

// ラッパー
function cajaxRequest(url, method, param, func_success, func_fail){
	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (req.readyState == 4 && req.status == 200){
			if (func_success)
				func_success(req);
		}
		else if (req.readyState == 4 && req.status != 200){
			if (func_fail)
				func_fail(req);
		}
	}

	req.open(method, url, true);
	if (method == 'POST'){
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	}
	req.send(param);
}


function createNewDocument(str) {
	return createHTMLDocumentByString(str);

	function createHTMLDocumentByString(str) {
		if (document.documentElement.nodeName != 'HTML') {
			return new DOMParser().parseFromString(str, 'application/xhtml+xml')
		}
		var html = strip_html_tag(str)
		var htmlDoc
		try {
			// We have to handle exceptions since Opera 9.6 throws
			// a NOT_SUPPORTED_ERR exception for |document.cloneNode(false)|
			// against the DOM 3 Core spec.
			htmlDoc = document.cloneNode(false)
			htmlDoc.appendChild(htmlDoc.importNode(document.documentElement, false))
		}
		catch(e) {
			htmlDoc = document.implementation.createDocument(null, 'html', null)
		}
		var fragment = createDocumentFragmentByString(html)
		try {
			fragment = htmlDoc.adoptNode(fragment)
		}
		catch(e) {
			fragment = htmlDoc.importNode(fragment, true)
		}
		htmlDoc.documentElement.appendChild(fragment)
		return htmlDoc
	}
	function strip_html_tag(str) {
		var chunks = str.split(/(<html(?:[ \t\r\n][^>]*)?>)/)
		if (chunks.length >= 3) {
			chunks.splice(0, 2)
		}
		str = chunks.join('')
		chunks = str.split(/(<\/html[ \t\r\n]*>)/)
		if (chunks.length >= 3) {
			chunks.splice(chunks.length - 2)
		}
		return chunks.join('')
	}
	function createDocumentFragmentByString(str) {
		var range = document.createRange()
		range.setStartAfter(document.body)
		return range.createContextualFragment(str)
	}
}
function genMapInfo(x,y,h,k,g,l,e,c,b,f,j,d,i,a){
	this.x = x; // center-x
	this.y = y; // center-y
	this.h = h; // 地名
	this.k = k; // 君主名
	this.g = g; // 人口-
	this.l = l; // 座標(x,y)
	this.e = e; // 同盟名
	this.c = c.length; // 戦力★
	this.b = b; // 距離
	this.f = f; // 森
	this.j = j; // 岩
	this.d = d; // 鉄
	this.i = i; // 糧
	this.a = parseInt(a,10); // NPCフラグ
	this.xy = l.replace(/^\((-?[0-9]+\,-?[0-9]+)\)$/, "$1");
}
function getMap(ally, x, y, callback){
	var url = "http://"+HOST+"/map.php?x=" + x + "&y=" + y + "&type=1";
	cajaxRequest(url, 'GET', null, function(r){
		var htmldoc = createNewDocument(r.responseText);

		var areas = htmldoc.evaluate('//*[@id="mapOverlayMap"]//area/@onmouseover',
			htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

		//ターゲット座標を中心とした9マスのみを抜く
		var targets = [ [x-1,y-1], [x-1,y], [x-1,y+1], [x,y-1], [x,y], [x,y+1], [x+1,y-1], [x+1,y], [x+1,y+1] ];

		var neighbors=[];	// 隣接同盟名
		var capture='';		// 攻略済か
		var npc_name, npc_power;

		for (var p = 0; p < areas.snapshotLength; p++) {
			var rowText = areas.snapshotItem(p).textContent;
			rowText = rowText.replace(/^.*mapInfoView/, "genMapInfo");
			rowText = rowText.replace(/^.*rewrite/, "genMapInfo");
			rowText = rowText.replace(/\); .*$/, ");");
			rowText = rowText.replace(/^genMapInfo\(/, "var info = new genMapInfo("+x+","+y+",");
			eval(rowText);
			for (var z = 0; z < targets.length; z++){
				var q = targets[z][0]+","+targets[z][1];
				if (info.xy == q) {
					//ターゲット座標
					if (info.a == 1) {
						// NPC砦
						npc_name=info.h;
						npc_power=info.c;
						if (info.e != '-') {
							// 制圧同盟名を覚える
							capture = info.e;
						}
					} else {
						// 領地
						if (info.e != '') {
							// 隣接同盟を覚える
							neighbors.push(info.e);
						}
					}
					break;
				}
			}
		}

		var cell_count = neighbors.length;
		neighbors = neighbors.filter(function (x, i, self) {
			return self.indexOf(x) === i;
		});

		var info=[];
		info.push(npc_name);//領地名
		info.push(x);
		info.push(y);
		info.push(npc_power);//★の数

		// 隣接状況
		var status = "";
		if (capture.length) {
			// 制圧情報
			if (capture == ally) {
				status = "制圧";
			} else {
				status = "負け";
			}
		} else if (j$.inArray(ally, neighbors) == -1) {
			status = "隣接なし";
		} else {
			// 同盟隣接あり
			if (neighbors.length == 1) {
				if (cell_count == 8) {
					status = "完全包囲";
				} else {
					status = "隣接";
				}
			}
			else if (neighbors.length >= 2) {
				status = "競合";
			}
		}
		info.push(status);

		// 競合同盟
		info.push(neighbors.filter(function(x) { return x != ally; }).join(","));

		if (callback) {
			callback(info);
		}

	}, null);
}

//h:地名、k:君主名、g:人口-、l:座標(x,y)、e:同盟名、c:戦力★、b:距離、f:森、j:岩、d:鉄、i:糧、a:NPCフラグ
//'南東砦49', '南東守衛49', '-', '(152,-42)', '-', '★★★★', '5.83', '', '', '', '', '1'
//'許昌', '曹操', '-', '(0,0)', '-', '★★★★★★★★★', '161.77', '', '', '', '', '1'
//'南東砦57', 'キーテナイ', '-', '(176,-47)', 'WBＭ', '★', '20.62', '', '', '', '', '1'
//'新領地178,-46', 'ヴァルキリー', '-', '(178,-46)', 'WBＭ', '★', '22.14', '1', '0', '0', '0', ''
//'', '', '', '(175,-47)', '', '★', '19.7', '0', '1', '0', '0', ''

var GET_DATA="";
function addStartLink() {
	var d = document;
	var openLink = d.createElement("a");
		openLink.id = "Fort_Info_Tool";
		openLink.href = "javascript:void(0);";
		openLink.style.marginTop = "0px";
		openLink.style.marginLeft = "0px";
		openLink.innerHTML = " [砦包囲情報]";
		openLink.style.font = "10px 'ＭＳ ゴシック'";
		openLink.style.color = "#FFFFFF";
		openLink.style.cursor = "pointer";
		openLink.addEventListener("click", function() {
			if( confirm("全マップデータを一気に取得するためサーバに負荷がかかります。\n何度も実行するとDoS攻撃と同じなので、実行には注意して下さい") == false ) return;
			GET_DATA="";
			window.setTimeout(startMap, 0);
		}, true);
	var sidebar_list = xpath('//*[@class="sideBox"]', d);
	if (sidebar_list.snapshotLength) {
		sidebar_list.snapshotItem(0).appendChild(openLink);
	}
}
function startMap(){
	if (GET_MAP_LIST.length == 0) {
		var header = ["地名","x","y","★","隣接状況","競合同盟"].join("\t")+"\n";
		console.log(header+GET_DATA);
	}
	var item = GET_MAP_LIST.pop();
	getMap(OPT_TARGET_ALLY, item[0], item[1], function(x){
		GET_DATA += x.join("\t")+"\n";
		window.setTimeout(startMap, 0);
	});
}
addStartLink();
