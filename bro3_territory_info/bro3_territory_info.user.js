// ==UserScript==
// @name		bro3_territory_info
// @namespace	https://gist.github.com/RAPT21/
// @description	ブラウザ三国志 全領土情報取得ツール by RAPT
// @include 	http://*.3gokushi.jp/alliance/info.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @require		http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @grant		none
// @author		RAPT
// @version 	0.1
// ==/UserScript==
var VERSION = "0.1";

// 2017.10.05	0.1	同盟タブで「全領土をCSV形式でテキスト出力する」ボタンをクリックすると全領土のCSV情報を取得します。

jQuery.noConflict();

var HOST = location.hostname;
var columnSeparator = ",";
var lineSeparator = "\n";

(function($){

	// 広告iframe内で呼び出された場合は無視
	if (!$("#container").length) {
		return;
	}

	// 歴史書モードの場合は無視
	if ($("#sidebar img[title=歴史書]").length){
		return;
	}

	//------------------------
	// メイン
	//------------------------

	var search_results = [];
	var searchText = '全領土をCSV形式でテキスト出力する';
	var stopText = '全領土の走査処理を中断する';
	var timer1 = null, timer2 = null;
	$("#statMenu").after(
		"<div style='margin-left: 4px;'>" +
			"<input id='territory_report_button' type='button' value='" + searchText + "'></input>" +
		"</div>" +
		"<div id='territory_result_box' style='position: absolute; background-color: #a9a9a9; display: none; margin-top: 45px;'>" +
			"<div style='background-color: #d3d3d3; margin: 2px;'>" +
				"<div style='margin-left: 4px; font-weight: bold;'>" +
					"<input id='territory_close_result1' style='margin-right: 4px;' type='button' value='閉じる'></input>" +
					"<span id='territory_list_title'>全領土を走査中</span>" +
				"</div>" +
				"<textarea id='territory_result' cols='91' rows='20' style='overflow: scroll; margin: 4px; '></textarea>" +
				"<br><input id='territory_close_result2' type='button' value='閉じる'></input>" +
			"</div>" +
		"</div>"
	);

	// 閉じるボタン
	$("#territory_close_result1").on('click',
		function() {
			$("#territory_report_button").val(searchText);
			$("#territory_result_box").css('display', 'none');
		}
	);
	$("#territory_close_result2").on('click',
		function() {
			$("#territory_report_button").val(searchText);
			$("#territory_result_box").css('display', 'none');
		}
	);

	// CSV出力ボタン
	$("#territory_report_button").on('click',
		function() {
			$("#territory_report_button").val(stopText);
			$("#territory_result_box").css('display', 'block');
			$("#territory_result").val('高速化のため、検出データは最後に表示します');

			// タイマー有効中の再実行は中断を意味する
			if (timer1 !== null) {
				clearInterval(timer1);
				timer1 = null;
				displaySearchResults('中断しました');
				return;
			}

			getMapList(function(mapInfo){
				$("#territory_list_title").text("MAPサイズ: ("+mapInfo.x+"x"+mapInfo.y+") / 画面数: "+mapInfo.screen +" / リスト数: "+mapInfo.list.length);
				enumulateMapList(mapInfo.list, function(reports){
					displaySearchResults('終了しました');
				});
			});
		}
	);

	//========== 本体 ==========
	function displaySearchResults(message) {
		$("#territory_result").val(search_results.join(lineSeparator) + lineSeparator);
		$("#territory_report_button").val(searchText);
		$("#territory_list_title").text(message);
	}

	function enumulateMapList(list, handler) {
		search_results = [];
		search_results.push(['同盟名', '君主', 'Ｘ座標', 'Ｙ座標', '領地', '人口', '本拠地', '戦力', '森', '岩', '鉄', '糧', '備考', 'NPC', 'NPC_FLAG', '親同盟'].join(columnSeparator));

		var index = 0;
		var max = list.length;
		var wait = false;

		timer1 = setInterval(function(){
			if (wait) {
				return;
			}
			wait = true;

			if (index >= max) {
				clearInterval(timer1);
				timer1 = null;

				if (handler) {
					handler(search_results);
				}
				return;
			}

			var area = list[index];
			$("#territory_list_title").text("マップ探索中(" + (1+index) + "/" + max + ") 中心座標:(" + area.x + "," + area.y + ")");
			getMap(area.x, area.y, function(data){
				array_merge(search_results, data);

				index++;
				wait = false;
			});

		}, 200);
	}

	// MAP データを取得
	function getMap(x, y, handler){
		$.ajax({
			url: 'http://' + HOST + '/big_map.php',
			type: 'GET',
			datatype: 'html',
			cache: false,
			data: {'x': x, 'y': y, 'type': 4}
		})
		.done(function(res) {
			var resp = $("<div>").append(res);

			var data = [];
			$("#map51-content > div > ul > li > div > a", resp).each(function(){
				var rowText = $(this).attr("onmouseover")
					.replace(/return gloss\('/, "")
					.replace(/'\);/, "")
					.replace(/&quot;/, "\"")
					.replace(/&nbsp;/, " ");
				var gloss = $("<div>").append(rowText);

				var obj = [];
				obj.push($("dt:contains(同盟名)+dd", gloss).text());
				obj.push($("dt:contains(君主名)+dd", gloss).text());
				if (obj[1].length === 0) {
					return true;
				}
				var area_info = $("dt:contains(座標)+dd", gloss).text().match(/([-]?\d+),([-]?\d+)/);
				if (area_info !== null && area_info.length >= 3) {
					array_merge(obj, [area_info[1], area_info[2]]);
				} else {
					array_merge(obj, ["", ""]);
				}
				obj.push(quotes($("dt.bigmap-caption", gloss).text()));
				obj.push($("dt:contains(人口)+dd", gloss).text());
				obj.push("");
				obj.push($("dt:contains(戦力)+dd", gloss).text());
				var rsrc = $("dt:contains(資源)+dd", gloss).text().match(/木(\d+)\s*岩(\d+)\s*鉄(\d+)\s*糧(\d+)/);
				if (rsrc !== null && rsrc.length >= 5) {
					array_merge(obj, [rsrc[1], rsrc[2], rsrc[3], rsrc[4]]);
				} else {
					array_merge(obj, ["", "", "", ""]);
				}
				var npc = $("dt:contains(戦力)+dd > span.npc-red-star", gloss).length >= 1 ? 1 : 0;
				array_merge(obj, ["", npc, npc, ""]);

				data.push(obj.join(columnSeparator));

				// 本拠地＝領地名、君主名、人口、座標、同盟名
				// NPC砦 ＝領地名、君主名、　　　座標、　　　　戦力
				// 領地  ＝領地名、君主名、　　　座標、同盟名、戦力、資源
			});

			if (handler){
				handler(data.join(lineSeparator));
			}
		});
	}

	// MAP サイズを取得
	function getMapList(handler){
		$.ajax({
			url: 'http://' + HOST + '/big_map.php',
			type: 'GET',
			datatype: 'html',
			cache: false,
			data: {'x': 9999, 'y': 9999, 'type': 4}
		})
		.done(function(res) {
			var resp = $("<div>").append(res);

			var map_x = $("#coord_search > div > label > input[name='x']", resp).val();
			var map_y = $("#coord_search > div > label > input[name='y']", resp).val();

			var unit = 51;
			var offset = Math.floor(unit / 2);
			var screen = Math.ceil((map_x*2+1)/unit) * Math.ceil((map_y*2+1)/unit);

			var start_x = -map_x+offset, start_y = -map_y+offset;
			var end_x = map_x-offset, end_y = map_y-offset;

			var list = [];
			var x = start_x, y = start_y;
			for (;;) {
				list.push({"x": x , "y": y });

				x += unit;
				if (x >= end_x) {
					x = start_x;
					y += unit;
					if (y >= end_y) {
						break;
					}
				}
			}

			if (handler){
				handler({"x": map_x , "y": map_y , "list": list , "screen": screen });
			}
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
function quotes(text) {
	return "\"" + text + "\"";
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
