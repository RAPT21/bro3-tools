// ==UserScript==
// @name		bro3_detect_busho_id
// @namespace	https://github.com/RAPT21/bro3-tools/
// @description	ブラウザ三国志 武将ID検出
// @include		http://*.3gokushi.jp/card/deck.php*
// @include		https://*.3gokushi.jp/card/deck.php*
// @exclude		http://info.3gokushi.jp/*
// @exclude		https://info.3gokushi.jp/*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require		https://ajax.googleapis.com/ajax/libs/jqueryui/1.14.0/jquery-ui.min.js
// @resource	jqueryui_css	https://ajax.googleapis.com/ajax/libs/jqueryui/1.14.0/themes/smoothness/jquery-ui.css
// @connect		none
// @grant		GM_addStyle
// @grant		GM_getResourceText
// @author		RAPT
// @version 	0.1
// ==/UserScript==

jQuery.noConflict();

// load jQueryUI css
loadAjaxCss(jQuery, "https://ajax.googleapis.com/ajax/libs/jqueryui/1.14.0/themes/smoothness/jquery-ui.css", "jqueryui_css");


//==========[機能]==========
// デッキセットされたカードの情報を取得します。
//
// - デフォルトでは通常デッキのカードのみを検出します。
// - 警護デッキを含めるにチェックが入っていると通常デッキに加え、警護デッキのカード情報も検出します。
// - カードが待機中になってないと検出できませんので注意
// - 検出する情報は、そのカードがセットされている拠点ID、カードID、カードNO、武将名です。

// 2025.02.24	開発着手


var VERSION = "2025.02.24.dev";


//==========[本体]==========
(function($) {

	// 広告iframe内で呼び出された場合は無視
	if (!$("#container").length) {
		return;
	}

	// デッキ画面
	deckOperation($);

})(jQuery);


//========================================
//	メインルーチン
//========================================

// デッキ内のカード情報を取得
function detectDeckCardList($) {
	var cardInfoList = {
		1: [],
		2: []
	};
	$("#cardListDeck form div.deck-all-tab-element").each(function(){
		var deck_kind = $(this).data("deck-kind"); // 1: 本拠、2:拠点
		$("div.deck-all-card-list > div.deck-all-card", this).each(function(){
			var villageId = 0;
			var v = $("div.village-name > a", this).eq(0).attr("href").match(/village_id=([0-9]+)/);
			if (v !== null) {
				villageId = v[1];
			}

			var cardWindow = $("div[id^=cardWindow_]", this).eq(0);
			var m = cardWindow.attr("id").match(/cardWindow_([0-9]+)/);
			if (m !== null) {
				var cardId = m[1];
				var cardName = $("span.name-for-sub", cardWindow).text();
				var cardNo = $("span.cardno", cardWindow).text();

				cardInfoList[deck_kind].push({
					'villageId': villageId,
					'cardId': cardId,
					'cardNo': cardNo,
					'cardName': cardName
				});
			}
		});
	});
	return cardInfoList;
}

function getMergedDeckCardList($, isIncludeDefense) {
	var cardInfoList = detectDeckCardList($);

	var items = [];
	array_merge(items, cardInfoList[1]);
	if (isIncludeDefense) {
		array_merge(items, cardInfoList[2]);
	}

	var list = [];
	$.each(items, function(){
		list.push(`${this.villageId},${this.cardId},${this.cardNo},${this.cardName}`);
	});
	return list;
}


//========================================
//	設定画面
//========================================

function makeFrameCSS() {
	return `
		-moz-border-radius:3px;
		border-radius: 3px;
		-webkit-border-radius: 3px;
		margin-bottom:6px;
		border: 2px solid #009;
		position: absolute;
		z-index:9999;
		background-color: white;
	`;
}

function deckOperation($) {

	// 設定リンクの作成
	var base = $("ul[id=statMenu]").eq(0).children("li[class='last']");
	if (base.length > 0) {
		base.eq(base.length - 1).after(
			"<li class='last'><a href='#' id='detect_busho_id' class='darkgreen'>武将ID検出</a></li>"
		).attr('class', '');
	}

	$("#detect_busho_id").on('click', function() {
		if ($("#detect_busho_id_view").css('display') === 'none') {
			$("#detect_busho_id_view").css('display', '');
		} else {
			$("#detect_busho_id_view").css('display', 'none');
		}
	});

	// 設定画面の描画
	$("ul[id=statMenu]").eq(0).append(`
		<div id='detect_busho_id_view' style='display: none; padding: 8px; width: 600px; ${makeFrameCSS()}'>
			<div id='detect_busho_id-tab-controller'>
				<div style='font-weight: bold; font-size: 14px; padding: 4px;'>カード検出</div>
				<div style='margin-left: 16px;'>
					<div>デッキにあるカードを検出します。</div>
					<input type='button' id='detect_busho_id_start_detect' value='検出を実行する' style='margin-left: 16px; width: 150px; text-align: center;' />

					<input id='detect_busho_id_defense' type='checkbox' style="margin-left: 8px;" />
					<label for='detect_busho_id_defense' style='font-size: 12px; margin-left: 4px; vertical-align: 0.2em;'>警護デッキを含める</label>

					<div>凡例）拠点ID,カードID,カードNO,武将名</div>
					<textarea id='detect_busho_id_detected_list' rows='15' cols='78'></textarea>
				</div>
			</div>

			<div style='text-align: right; text-color: gray;'>Version: ${VERSION}</div>
			<div style='margin: 4px;'>
				<input type='button' id='detect_busho_id_view_close' value='閉じる' style='width: 88px;' />
				<input type='button' id='detect_busho_id_view_reset' value='クリア' style='margin-left: 16px; width: 88px;' />
			</div>
		</div>
	`);
	// 運営のcssを無効化
	$("#detect_busho_id_view li").css({'padding':'0px', 'min-width':'0px'});
	$("#detect_busho_id_view li a").css({'background':'none'});
	$("#detect_busho_id_view div label").css({'font-size':'12px', 'margin-left':'4px', 'vertical-align':'0.2em'});
	$("#detect_busho_id_view div").css({'padding':'2px'});
	$("#detect_busho_id-tab-controller").tabs();

	// 検出を実行するボタン
	$("#detect_busho_id_start_detect").on('click', function() {
		var isIncludeDefense = $("#detect_busho_id_defense").prop("checked");
		var list = getMergedDeckCardList($, isIncludeDefense);
		$("#detect_busho_id_detected_list").val(list.join("\n"));
	});

	// 閉じるボタン
	$("#detect_busho_id_view_close").on('click', function() {
		$("#detect_busho_id_view").css({'display':'none'});
	});

	// クリアボタン
	$("#detect_busho_id_view_reset").on('click', function() {
		$("#detect_busho_id_detected_list").val("");
	});
}


//========================================
//	Helper
//========================================

function loadAjaxCss($, url, name) {
	if (typeof GM_addStyle === 'undefined') {
		// Greasemonkey 4 では GM_getResourceText、GM_addStyle がなくなるので自前で処理
		$.ajax({
			url: url,
			type: 'GET',
			datatype: 'text/css',
			cache: false
		})
		.done(function(css) {
			var style = $(document.createElement('style')).prop('type', 'text/css').html(css);
			$('head').append(style);
		});
	}
	else {
		// Greasemonkey 4 で以下は使えなくなるらしい。Tampermonkey なら使える
		var jQueryUICss = GM_getResourceText(name);
		GM_addStyle(jQueryUICss);
	}
}


//========================================
//	jQuery を使用しない共通関数定義
//========================================

function array_merge(dest, src) {
	Array.prototype.push.apply(dest, src);
}
