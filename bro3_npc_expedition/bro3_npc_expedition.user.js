// ==UserScript==
// @name		bro3_npc_expedition
// @namespace	https://github.com/RAPT21/bro3-tools/
// @description	ブラウザ三国志 北伐予備兵切り替え
// @include		http://*.3gokushi.jp/npc_expedition/*
// @include		https://*.3gokushi.jp/npc_expedition/*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://*.3gokushi.jp/maintenance*
// @connect		3gokushi.jp
// @author		RAPT
// @version 	0.1
// ==/UserScript==


// ▼概要
// 北伐出陣画面で予備兵画像をクリックするとまとめて引率兵を切り替えます。
//
// 予備兵画像をマウスでホバーするとマウスカーソルが手の指アイコンに切り替わります。
// この状態で予備兵画像をクリックすると、引率兵をまとめて切り替え、かつ自動補充にチェックを入れます。
//
// ・まれにうまく反映されない場合がありますが、そのときはもう一度クリックしてみてください。


// 2025.03.06	0.1	初版


//==========[本体]==========
(function($) {

	// 広告iframe内で呼び出された場合は無視
	if (!$.querySelectorAll("#container").length) {
		return;
	}

	// 歴史書モードの場合は無視
	if ($.querySelectorAll("#sidebar img[title=歴史書]").length) {
		return;
	}

	// 北伐出陣画面
	$.querySelectorAll('.unit-stock-table tr:nth-child(2) .td-unit-select-icon img[src]').forEach(function(img){
		let unitType = /icon_(\d{3})\.png/.exec(img.src)[1];
		img.style.cursor = 'pointer';
		img.addEventListener('click', function(ev){
			// クリックした兵種に設定する
			$.querySelectorAll('select[name=select_unit_type]').forEach(function(sel){
				sel.value = unitType;
				sel.dispatchEvent(new Event('change'));
			});

			// 自動補充をONにする
			setTimeout(function(){
				$.querySelectorAll('input[name=auto_unit_add]').forEach(function(inp){
					inp.checked = true;
					inp.dispatchEvent(new Event('change'));
				});
			}, 1000); // 少し時間をあけないと反映されない場合がある
		});
	});
})(document);
