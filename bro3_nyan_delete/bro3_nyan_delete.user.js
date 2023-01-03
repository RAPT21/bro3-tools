// ==UserScript==
// @name		bro3_nyan_delete
// @namespace	https://github.com/RAPT21/bro3-tools/
// @description ブラウザ三国志 ニャン破棄
// @include 	http://*.3gokushi.jp/card/allcard_delete.php*
// @include 	https://*.3gokushi.jp/card/allcard_delete.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://*.3gokushi.jp/maintenance*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @grant		none
// @author		RAPT
// @version 	0.2
// ==/UserScript==
jQuery.noConflict();

// 配布サイト
// https://github.com/RAPT21/bro3-tools/

// デッキ＞武将カード一括破棄画面で指定したカードを一括破棄するツール。
// 便利アイテムから、指定したカードを指定枚数ずつファイルに移動してから一括破棄する。
// 移動枚数を0にしたとき、便利アイテムから移動せず、ファイル内のカードのみ削除対象とする。
// R以上のカードを処理時、プロフィール＞武将カード自動保護設定＞宝物庫で保護対象外とすること。
// 対象カードをカスタムしたい場合、スクリプト内カスタム設定で変更可能。

// 2023.01.03	初版作成


//=====[ カスタム設定 ]=====
// 対象カード
var cardTypes = [
	// [便利アイテムのID, 表示名]
	[0, "▼経験値----------------"],
	[24152,	"No.4152 C水鏡娘(自分用)"], // 経験値0.1%
	[24102,	"No.4102 UC水鏡娘(自分用)"], // 経験値1%
	[24101,	"No.4101 R水鏡娘(自分用)"], // 経験値3%
	[24100,	"No.4100 SR水鏡娘(自分用)"], // 経験値5%
	[24099, "No.4099 UR水鏡娘(自分用)"], // 経験値10%
	[0, "▼スコア----------------"],
	[24199,	"No.4199 C左慈娘(自分用)"], // スコア10万
	[24198,	"No.4198 UC左慈娘(自分用)"], // スコア50万
	[24197,	"No.4197 R左慈娘(自分用)"], // スコア100万
	[24196,	"No.4196 SR左慈娘(自分用)"], // スコア200万
	[24195,	"No.4195 UR左慈娘(自分用)"], // スコア400万
	[0, "▼ワイルドカード--------"],
	[24231,	"No.4231 UC水鏡(自分用)"],
	[24365,	"No.4365 UC南華老仙(自分用)"]
];
// 移動枚数
var cardCounts = [10,9,8,7,6,5,4,3,2,1,0];
// 便利アイテムからの移動ウェイト
var waitms = 500;
// 繰り返しインターバルのウェイト（ミリ秒）；サーバー負荷対策のため1000（1秒）以上を推奨
var waitInterval = 3000;

//=====[ 内部用 ]=====
// 繰り返し継続するか
var canContinueAutoRepeat = true;


(function(q$){

	// 指定ミリ秒のウェイトを入れる
	function wait(msec) {
		var d = new q$.Deferred;
		setTimeout(function() {
			d.resolve();
		}, msec);
		return d.promise();
	}

	// 便利アイテムから移動
	function getItem(ssid, cardId, cardCount, callback) {
		if (cardCount <= 0 || !canContinueAutoRepeat) {
			// 終了
			callback();
			return;
		}
		q$('#nyanDeleteStatus').text(`便利アイテムからデッキへ移動中...残${cardCount}`);
		q$.post("/item/index.php",{item_id:cardId,ssid:ssid},function(){
			setTimeout(function(){
				// 再帰処理
				getItem(ssid, cardId, cardCount - 1, callback);
			}, waitms);
		});
	}

	// カード削除
	function deleteCard(ssid, cardNo, dt, callback) {
		if (!canContinueAutoRepeat) {
			callback(0);
			return;
		}
		q$('#nyanDeleteStatus').text('カード一括削除中');
		// カード一括削除画面から削除対象カードのIDを抽出
		q$.get('/card/allcard_delete.php', {'search_configs[type]':2,'search_configs[q]':cardNo,'card_filter[9][]':0}, function(a){
			var deleteIds = [];
			q$('#form_allcard_delete td.busho div[id^=cardWindow_]', a).each(function(){
				var m = q$(this).attr('id').match(/cardWindow_(\d+)/);
				if (m.length >= 2) {
					deleteIds.push(m[1]);
				}
			});
			if (deleteIds.length) {
				// 削除実行
				var params = {
					"p": 1,
					"s": null,
					"o": null,
					"ssid": ssid,
					"discard_bpp_calc_dt": dt,
					"btn_send": "破棄"
				};
				q$(deleteIds).each(function(){
					params[`card_id[${this}]`] = 1;
				});
				q$.post('/card/allcard_delete.php', params, function(){
					callback(deleteIds.length);
				});
			} else {
				// 削除対象カードはない
				callback(0);
			}
		});
	}

	// メイン処理
	function startRoutine(ssid, cardId, cardCount, dt, callback) {
		// 便利アイテムから移動
		getItem(ssid, cardId, cardCount, function(){
			// cardNo は便利アイテムIDの下4桁
			deleteCard(ssid, cardId % 10000, dt, function(deleteCount){
				if (canContinueAutoRepeat && deleteCount > 0) {
					// 繰り返し実行
					q$('#nyanDeleteStatus').text('継続...');
					wait(waitInterval).done(function() {
						startRoutine(ssid, cardId, cardCount, dt, callback);
					});
				} else {
					q$('#nyanDeleteStatus').text('完了');
					callback();
				}
			});
		});
	}

	// デッキ＞武将カード一括破棄＞上部にボタンを作る
	q$('#statMenu').after(q$('<div />', {id: "nyanDeleteContainer"}));

	// カードの種類
	var cardType = q$('<select />',{id: "cardType"});
	q$(cardTypes).each(function(){
		cardType.append(q$('<option />',{value: this[0]}).append(this[1]));
	});
	q$('#nyanDeleteContainer')
		.append(q$('<label />', {for: "cardType"}).append('便利アイテムから'))
		.append(cardType);

	// 便利アイテムから移動させる枚数
	var cardCount = q$('<select />',{id: "cardCount"});
	q$(cardCounts).each(function(){
		cardCount.append(q$('<option />',{value: this}).append(`${this}枚ずつ移動させて`));
	});
	q$('#nyanDeleteContainer')
		.append(q$('<label />', {for: "cardCount"}).append('を'))
		.append(cardCount);

	// 発動ボタン
	var button = q$('<button />', {
		id: "nyanDeleteButton",
		on: {
			click: function() {
				q$('#nyanDeleteButton').hide();
				q$('#stopDeleteButton').show();
				var ssid = q$("input[name=ssid]").val();
				var cardId = q$('#cardType option:selected').val();
				var cardCount = q$('#cardCount option:selected').val();
				var dt = q$('input[name=discard_bpp_calc_dt]').val();
				if (cardId > 0) {
					startRoutine(ssid, cardId, cardCount, dt, function(){
						// 状態復元
						q$("#stopDeleteButton").prop("disabled", false);
						canContinueAutoRepeat = true;
						q$('#stopDeleteButton').hide();
						q$('#nyanDeleteButton').show();
					});
				}
			}
		}
	}).append('全部破る');

	// 停止ボタン
	var stopButton = q$('<button />', {
		id: "stopDeleteButton",
		on: {
			click: function() {
				q$("#stopDeleteButton").prop("disabled", true);
				q$('#nyanDeleteStatus').text('停止中...');
				canContinueAutoRepeat = false;
			}
		}
	}).append('停止');
	stopButton.hide();

	// ボタンをUIへ追加
	q$('#nyanDeleteContainer')
		.append(button)
		.append(stopButton)
		.append(q$('<span />', {id: "nyanDeleteStatus"}))
		.append(q$('<p />').append('※R以上のカードを処理時、プロフィール＞<a href="/user/card_protection_setting.php">武将カード自動保護設定</a>＞宝物庫で保護対象外となるよう設定してください。'));

})(window.jQuery);
