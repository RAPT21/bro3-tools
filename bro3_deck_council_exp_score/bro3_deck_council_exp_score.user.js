// ==UserScript==
// @name		bro3_deck_council_exp_score
// @namespace	https://github.com/RAPT21/bro3-tools/
// @description	ブラウザ三国志 経験値貯蔵庫カードセット
// @include		https://*.3gokushi.jp/card/deck.php*
// @include		http://*.3gokushi.jp/card/deck.php*
// @exclude		https://*.3gokushi.jp/maintenance*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://info.3gokushi.jp/*
// @exclude		http://info.3gokushi.jp/*
// @exclude		https://www.3gokushi.jp/app/*
// @exclude		http://www.3gokushi.jp/app/*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @gain		none
// @author		RAPT
// @version 	0.1
// ==/UserScript==
jQuery.noConflict();


// ▼概要
// デッキ画面(小)から直接カードを軍議所北伐の経験値貯蔵庫にセット/解除できます。
//
// ▼注意
// ・デッキセット枚数についてはチェックしないので各自で確認してください。
// ・直接経験値やスコアを付与する機能もありますが、いきなり発動するので注意してください。
// ・直接経験値やスコアを付与する機能を使いたい場合は、下記にある OPT_ で定義されている値をtrueへ変更してください。


// 2026.01.14	0.1	初版

const SERVER_SCHEME = location.protocol + "//";
const SERVER_BASE = SERVER_SCHEME + location.hostname;

const SERVER_NAME = location.hostname.match(/^(.*)\.3gokushi/)[1];


//----------------------------------------
// 保存設定部品定義
//----------------------------------------

const OPT_USE_LV1 = false;			// 武将LV0→1に必要な経験値5を付与するボタンを表示します
const OPT_USE_LV400 = false;		// 武将LV0→400に必要な経験値を付与するボタンを表示します
const OPT_USE_SCORE_MAX = false;	// スコア上限の42億スコアを付与するボタンを表示します


//==========[本体]==========
(function($) {

	// 広告iframe内で呼び出された場合は無視
	if (!$("#container").length) {
		return;
	}

	//----------------------------------------
	// 経験値貯蔵庫へのカードセット/解除を行う
	// - cardId 設定または解除するカードID
	// - isSetCard 設定時true, 解除時false
	//----------------------------------------
	function councilExpScoreStorageDeck(cardId, isSetCard, callback) {
		let path = '';
		let params = {};
		if (isSetCard) {
			console.log(`カードセット: ${cardId}`);
			path = '/council/exp_score_storage_deck.php';
			params = { set_deck_card_id: cardId };
		} else {
			console.log(`カード解除: ${cardId}`);
			path = '/council/npc_expedition.php';
			params = { council_function_id: 605, remove_deck_card_id: cardId };
		}

		$.ajax({
			url: SERVER_BASE + path,
			type: 'POST',
			dataType: 'html',
			cache: false,
			data: params
		})
		.done(function(_response){
			console.log(`OK: ${cardId}`);
			if (callback) callback(true);
		})
		.fail(function(_jqXHR){
			console.log(`NG: ${cardId}`);
			if (callback) callback(false);
		});
	}

	//----------------------------------------
	// 経験値貯蔵庫へセットされているカードに経験値/スコアを付与する
	// - exp 付与する経験値
	// - scorfe 付与するスコア
	//----------------------------------------
	function putExpScore(exp, score, callback) {
		const params = {
			council_function_id: 605,
			'add_point[exp]': exp,
			'add_point[score]': score
		};

		$.ajax({
			url: SERVER_BASE + '/council/npc_expedition.php',
			type: 'POST',
			dataType: 'html',
			cache: false,
			data: params
		})
		.done(function(_response){
			console.log(`OK: exp=${exp}, score=${score}`);
			if (callback) callback(true);
		})
		.fail(function(_jqXHR){
			console.log(`NG: exp=${exp}, score=${score}`);
			if (callback) callback(false);
		});
	}

	//----------------------------------------
	// 経験値貯蔵庫へカードセットして経験値/スコア付与後、カード解除する
	// - cardId 対象のカードID
	// - exp 付与する経験値
	// - scorfe 付与するスコア
	//----------------------------------------
	function oneshotExpScore(cardId, exp, score, callback) {
		councilExpScoreStorageDeck(cardId, true, function(isOK){
			if (!isOK) {
				callback(false);
				return;
			}

			putExpScore(exp, score, function(isOK){
				if (!isOK) {
					callback(false);
					return;
				}

				councilExpScoreStorageDeck(cardId, false, callback);
			});
		});
	}

	//----------------------------------------
	// 経験値貯蔵庫へカードセットしてLV0→1にする経験値を付与後、カード解除する
	// - cardId 対象のカードID
	//----------------------------------------
	function oneshotLV1(cardId, callback) {
		oneshotExpScore(cardId, 5, 0, callback);
	}

	//----------------------------------------
	// 経験値貯蔵庫へカードセットしてLV0→400にする経験値を付与後、カード解除する
	// - cardId 対象のカードID
	//----------------------------------------
	function oneshotLV400(cardId, callback) {
		oneshotExpScore(cardId, 119630255, 0, callback);
	}

	//----------------------------------------
	// 経験値貯蔵庫へカードセットして最大スコアを付与後、カード解除する
	// - cardId 対象のカードID
	//----------------------------------------
	function oneshotScoreMax(cardId, callback) {
		oneshotExpScore(cardId, 0, 4294967294, callback);
	}

	//----------------------------------------
	// reloadする
	//----------------------------------------
	function reload() {
		location.reload();
	}
	function empty() {
		// 何もしない
	}

	//----------------------------------------
	// 操作パネルを作成
	//----------------------------------------
	function addPanel() {
		const makeButtons = (buttons) => {
			const count = buttons.length;
			const width = (100 / count) - 1;

			return buttons.map(([title, color, onClickProc]) => {
				return $('<div />', {
					text: title,
					style: `cursor: pointer; font-size: 12px; line-height: 18px; background: ${color}; width: ${width}%; margin: 1px; text-align: center;`,
					on: {
						click: onClickProc
					}
				});
			});
		};

		$('#cardFileList .cardStatusDetail').each(function() {
			const cardId = $(this).data('card-id');

			let buttons = [
				['貯Set', 'cyan', () => { councilExpScoreStorageDeck(cardId, true); }],
				['Unset', 'orange', () => { councilExpScoreStorageDeck(cardId, false); }]
			];
			if (OPT_USE_LV1) {
				buttons.push(['LV1', 'yellow', () => { oneshotLV1(cardId, reload); }]);
			}
			if (OPT_USE_LV400) {
				buttons.push(['LV400', 'lime', () => { oneshotLV400(cardId, reload); }]);
			}
			if (OPT_USE_SCORE_MAX) {
				buttons.push(['スコア', 'silver', () => { oneshotScoreMax(cardId, reload); }]);
			}

			const container = $('<div />', { style: 'display: flex;' }).append(makeButtons(buttons));
			$('.sgSlotArea, .supremacyEffectBox', this).before(container);
		})
	}

	addPanel();

})(jQuery);


//----------------------------------------
// for debug print object
//----------------------------------------
function po(obj, ext) {
	if (ext === undefined) { ext = ""; }
	console.log(ext + JSON.stringify(obj, null, '\t'));
}
