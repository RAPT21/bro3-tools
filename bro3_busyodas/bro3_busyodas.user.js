// ==UserScript==
// @name		bro3_busyodas
// @namespace	https://gist.github.com/RAPT21/
// @description	ブラウザ三国志 ブショーダス補助 by RAPT
// @include		https://*.3gokushi.jp/busyodas/busyodas_continuty_result.php*
// @include		http://*.3gokushi.jp/busyodas/busyodas_continuty_result.php*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @grant		none
// @author		RAPT
// @version 	0.2
// ==/UserScript==
jQuery.noConflict();
q$ = jQuery;

var VERSION = "2021.01.09.dev";

// 2020.11.11  0.1	初版。ブショーダスライトのみ対応
// 2021.01.09  0.2	小麗もサポート。スキル名を部分一致から前方一致へ変更

// ブショーダスライト画面で下記スキル名にマッチしないカードに削除チェックを入れるツール。
// スキル名は前方一致。
// デフォルトでロックされているR以上のカードや特殊カードは変更しない。

// 部分一致
var wantSkillNames = [
	"仁君",
	"呉の治世",
	"守護防陣",
	"忠節不落",
//	"兵舎修練",
//	"英雄",
//	"兵器の猛撃",
//	"修練",
//	"急速援護",
//	"火神の攻勢",
	"全軍の",
	"初期スキルなし"
];

function isWantSkill(skillName) {
	var result = false;
	q$.each(wantSkillNames, function(index, name){
		var re = new RegExp(`${name}.*`);
		if (re.test(skillName)) {
			result = true;
			return false;
		}
	});
	return result;
}

var proc = function(){
	var cols = q$("td", this);
	if (cols.length === 4) {
		if (!isWantSkill(cols.eq(2).text().trim())) {
			q$("input.delete", cols.eq(0)).prop('checked', true);
		}
	}
};

// ライト
q$("#busyodasDraw_18110500000 .commonTables tr").each(proc);

// 小麗
q$("#busyodasDraw_20061507000 .commonTables tr").each(proc);
