// ==UserScript==
// @name		bro3_help_army_report
// @namespace	https://github.com/RAPT21/bro3-tools/
// @description	ブラウザ三国志 南蛮援軍確認
// @include		http://*.3gokushi.jp/report/detail.php*
// @include		https://*.3gokushi.jp/report/detail.php*
// @include		http://*.3gokushi.jp/facility/unit_status.php?type=all*
// @include		https://*.3gokushi.jp/facility/unit_status.php?type=all*
// @include		http://*.3gokushi.jp/alliance/detail.php*
// @include		https://*.3gokushi.jp/alliance/detail.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://*.3gokushi.jp/maintenance*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @grant		none
// @author		RAPT
// @version 	1.2
// ==/UserScript==
jQuery.noConflict();
q$ = jQuery;

// 2023/02/12	1.0	初版作成
// 2025/09/25	1.1	同盟ログ対応
// 2025/09/27	1.2	南蛮衛兵を検出していたので除外するように。援軍部隊数のカウントがずれていたのを修正。


var OPT_MIN_SOLDIER_COUNT = 60000; // 援軍兵士として許容する最小兵数

// インデックスを合わせて合成
function zip(keys, values) {
	var result = {};
	var maxCount = Math.min(keys.length, values.length)
	for (var i = 0; i < maxCount; i++) {
		result[keys[i]] = values[i];
	}
	return result;
}

// 報告書詳細を解析
function parseReport() {
	var list = [];
	var users = new Set();
	var warnUsers = new Set();
	var warnReasons = {};
	var villages = new Set();

	// 南蛮主催者を取得
	var text = q$("#gray02Wrapper table[class*='tables'][summary='件名'] tr td.brno:contains('が南蛮兵に攻撃されました')").text();
	var match = text.match(/【.*?】.*?【.*?】(.*?)　\(.*?\)　が南蛮兵に攻撃されました/);
	if (match === null || !match.length) {
		return "";
	}
	var organizer = match[1];

	// 援軍を解析
	q$("#gray02Wrapper table[class*='tables'][summary='防御者'] tbody").each(function(index, row){
		var defenser = q$("tr th[class='defenser']", row).text();
		if (defenser.indexOf('援軍') < 0) {
			return true;
		}
		// 援軍のみでフィルター

		var defenserBase = q$("tr th[class='defenserBase']", row).eq(0);
		if (defenserBase.text().trim() === '南蛮衛兵') {
			// 南蛮衛兵は除外
			return true;
		}

		var userName = q$("a:eq(1)", defenserBase).text();
		var vName = q$("a:eq(2)", defenserBase).text();

		var solNames = [];
		var solCounts = [];
		q$("tr:eq(1) th.solClass3", row).each(function(){
			var text = q$(this).text();
			if (text.length > 0) {
				solNames.push(text);
			}
		});
		q$("tr:eq(2) td", row).each(function(){
			var text = q$(this).text();
			if (text.length > 0) {
				solCounts.push(parseInt(text, 10));
			}
		});
		q$("tr:eq(4) th.solClass3", row).each(function(){
			var text = q$(this).text();
			if (text.length > 0) {
				solNames.push(text);
			}
		});
		q$("tr:eq(5) td", row).each(function(){
			var text = q$(this).text();
			if (text.length > 0) {
				solCounts.push(parseInt(text, 10));
			}
		});
		q$("tr:eq(7) th.solClass3", row).each(function(){
			var text = q$(this).text();
			if (text.length > 0) {
				solNames.push(text);
			}
		});
		q$("tr:eq(8) td", row).each(function(){
			var text = q$(this).text();
			if (text.length > 0) {
				solCounts.push(parseInt(text, 10));
			}
		});

		var sols = {};
		var totalCount = 0;
		var maxCount = Math.min(solNames.length, solCounts.length)
		for (var i = 0; i < maxCount; i++) {
			sols[solNames[i]] = solCounts[i];
			totalCount += solCounts[i];
		}
		var ken = sols['大剣兵'];
		var tate = sols['重盾兵'];
		var high = sols['矛槍兵'] + sols['弩兵'] + sols['近衛騎兵'];
		var ei = sols['戦斧兵'] + sols['双剣兵'] + sols['大錘兵'];
		var busho = sols['武将'];
		// var others = totalCount - ken - tate - high - ei - busho;
		var others = totalCount - tate - ei - busho;

		var warn = [];
		if (villages.has(vName)) {
			warn.push("同一拠点から複数部隊");
		}
		if (busho > 1) {
			warn.push("1つの拠点から複数武将");
		}
		if (others > 0) {
			// warn.push("大剣、重盾、上級、鋭兵以外の兵士がいる");
			warn.push("重盾、鋭兵以外の兵士がいる");
		}
		if ((totalCount - busho) < OPT_MIN_SOLDIER_COUNT) {
			warn.push("援軍兵不足");
		}

		if (warn.length && userName !== organizer) {
			warnUsers.add(userName);
			warnReasons[userName] = warn;
		}

		users.add(userName);
		villages.add(vName);

		if (list.length === 0) {
			// list.push(['武将', '大剣', '重盾', '上級', '鋭兵', '他兵', '君主名', '拠点名'].join("\t"));
			list.push(['武将', '重盾', '鋭兵', '他兵', '君主名', '拠点名'].join("\t"));
		}
		// list.push([busho, ken, tate, high, ei, others, userName, vName].join("\t"));
		list.push([busho, tate, ei, others, userName, vName].join("\t"));
	});

	var info = [];
	info.push(`主催: ${organizer}`);
	info.push(`援軍部隊数: ${list.length - 1}`);
	info.push(`援軍君主数: ${users.size}`);
	info.push(`警告君主数: ${warnUsers.size}`);
	if (warnUsers.size > 0) {
		Object.keys(warnReasons).forEach(function(key, index){
			info.push(`[${index}] ${key} => ${warnReasons[key]}`);
		});
	}

	return [info.join("\n"), list.join("\n")].join("\n");
}

// 援軍状況を解析
function parseUnit() {
	// 1.待機の武将＋兵、兵のみの部隊は無視
	// 2.待機の武将のみを待ち受けとして保持し、移動中の兵のみと適合させる。
	// 3.移動中の武将のみを待ち受けとして登録し、以降の移動中の兵のみと適合させる
	var acceptable = []; // 武将＋兵、兵のみ
	var notEnough = {}; // 兵数不足: 君主 => 兵数

	var waits = [];
	var trs = q$("#gray02Wrapper #rotate_gui2 table.commonTables[summary='他の拠点の部隊']").children("tbody").children("tr");
	for (var i = 1; i <= trs.length - 3; i += 3) {
		var user = trs.eq(i).children("td").text().replace(/\s+/g,'');
		var digit = q$("table tbody tr", trs.eq(i+2).children("td.digit"));

		var solNames = [];
		var solCounts = [];
		for (var k = 0; k < 6; k += 2) {
			q$("th.solClass", digit.eq(k)).each(function(){
				var text = q$(this).text().trim();
				if (text.length > 0) {
					solNames.push(text);
				}
			});
			q$("td.digit", digit.eq(k + 1)).each(function(){
				var text = q$(this).text().trim();
				if (text.length > 0) {
					solCounts.push(parseInt(text, 10));
				}
			});
		}
		var sols = zip(solNames, solCounts);
		var totalCount = Object.values(sols).reduce(function(summary, current) {
			return summary + current;
		});

		var ken = sols['大剣兵'];
		var tate = sols['重盾兵'];
		var high = sols['矛槍兵'] + sols['弩兵'] + sols['近衛騎兵'];
		var ei = sols['戦斧兵'] + sols['双剣兵'] + sols['大錘兵'];
		var busho = sols['武将'];
		// var validCount = ken + tate + high + ei; // 下級兵や斥候、兵器はノーカン
		var validCount = tate + ei; // 下級兵や斥候、兵器はノーカン
		var others = totalCount - validCount - busho;

		if ((busho > 0 && (totalCount - busho) >= OPT_MIN_SOLDIER_COUNT) || busho === 0) {
			// 武将+兵士規定数以上、または兵士のみ(武将無し)は受容できる1部隊としてカウント
			acceptable.push(user);
		} else {
			// 武将+兵数不足
			if (Object.keys(notEnough).indexOf(user) >= 0) {
				notEnough[user] += validCount;
			} else {
				notEnough[user] = validCount;
			}
		}

		waits.push(['0:待機', user, busho, totalCount - busho].join("\t"));
	}

	var helps = [];
	var trs = q$("#gray02Wrapper #rotate_gui2 table.commonTables[summary='援軍']").children("tbody").children("tr");
	for (var i = 1; i <= trs.length - 4; i += 4) {
		var user = trs.eq(i).children("td").text().replace(/\s+/g,'');
		var digit = q$("table tbody tr", trs.eq(i+3).children("td.digit"));

		var solNames = [];
		var solCounts = [];
		for (var k = 0; k < 6; k += 2) {
			q$("th.solClass", digit.eq(k)).each(function(){
				var text = q$(this).text().trim();
				if (text.length > 0) {
					solNames.push(text);
				}
			});
			q$("td.digit", digit.eq(k + 1)).each(function(){
				var text = q$(this).text().trim();
				if (text.length > 0) {
					solCounts.push(parseInt(text, 10));
				}
			});
		}
		var sols = zip(solNames, solCounts);
		var totalCount = Object.values(sols).reduce(function(summary, current) {
			return summary + current;
		});

		var ken = sols['大剣兵'];
		var tate = sols['重盾兵'];
		var high = sols['矛槍兵'] + sols['弩兵'] + sols['近衛騎兵'];
		var ei = sols['戦斧兵'] + sols['双剣兵'] + sols['大錘兵'];
		var busho = sols['武将'];
		// var validCount = tate + ei; // 下級兵や斥候、兵器はノーカン
		var validCount = ken + tate + high + ei; // 下級兵や斥候、兵器はノーカン
		var others = totalCount - validCount - busho;

		if (busho > 0 && (totalCount - busho) >= OPT_MIN_SOLDIER_COUNT) {
			// 武将+兵士規定数以上は受容できる1部隊としてカウント
			acceptable.push(user);
		} else if (busho === 0) {
			// 兵士のみ(武将無し)は兵数不足の充当チェックを行う。兵士のみは受容
			var index = Object.keys(notEnough).indexOf(user);
			if (index >= 0) {
				notEnough[user] += validCount;
				if (notEnough[user] >= OPT_MIN_SOLDIER_COUNT) {
					delete notEnough[user];
					acceptable.push(user);
				}
			} else {
				// TODO: 受容済部隊へ追加兵士の判定が必要
				acceptable.push(user);
			}
		} else {
			// 武将+兵数不足
			if (Object.keys(notEnough).indexOf(user) >= 0) {
				notEnough[user] += validCount;
			} else {
				notEnough[user] = validCount;
			}
		}

		helps.push(['1:移動中', user, busho, totalCount - busho].join("\t"));
	}

	var info = [];
	info.push(`受容部隊数: ${acceptable.length}`);
	info.push(`兵数不足: ${Object.keys(notEnough).length}`);
	Object.keys(notEnough).forEach(function(key, index){
		info.push(`[${index}] ${key} => ${notEnough[key]}`);
	});

	return [waits.join("\n"), helps.join("\n"), info.join("\n")].join("\n");
}

q$(function(){

	// 報告書＞南蛮襲来＞詳細
	if (location.pathname === '/report/detail.php') {
		q$("#gray02Wrapper table.report_list").before(q$("<button />", {
			id: 'parseReport',
			on: {
				click: function(){
					var result = parseReport();
					console.log(result);
					if (result.length) {
						alert(result);
					}
				}
			}
		}).append("解析"));
	}

	// 兵士管理＞全て表示
	if (location.pathname === '/facility/unit_status.php') {
		q$("#gray02Wrapper #rotate_gui2 table.commonTables[summary='待機']").before(q$("<button />", {
			id: 'parseUnit',
			on: {
				click: function(){
					var result = parseUnit();
					console.log(result);
					if (result.length) {
						alert(result);
					}
				}
			}
		}).append("解析"));
	}

	// 同盟ログ＞防御
	var urlParams = new URLSearchParams(location.search);
	if (location.pathname === '/alliance/detail.php' && urlParams.get('m') === 'defense' && urlParams.has('id')) {
		q$("#gray02Wrapper table[class*='tables'][summary='件名']").before(q$("<button />", {
			id: 'parseReport',
			on: {
				click: function(){
					var result = parseReport();
					console.log(result);
					if (result.length) {
						alert(result);
					}
				}
			}
		}).append("解析"));
	}

})();
