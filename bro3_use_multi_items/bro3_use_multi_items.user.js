// ==UserScript==
// @name		bro3_use_multi_items
// @namespace	https://github.com/RAPT21/bro3-tools/
// @description	ブラウザ三国志 宝物庫まとめて移動
// @include		http://*.3gokushi.jp/item/*
// @include		https://*.3gokushi.jp/item/*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://*.3gokushi.jp/maintenance*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @author		RAPT
// @version 	0.2
// ==/UserScript==
jQuery.noConflict();


// ▼概要
// 宝物庫から同一アイテムを複数まとめて高速移動できます。
//
// ▼注意
// このツールを使っていると、アイテムショップがうまく動作しない模様です。
// 必要な時以外は無効にしておくことを推奨します。


// 2024.01.11	0.1	初版
// 2024.01.12	0.2	カード移動中の進捗表示、移動処理の中断機能を追加


var SERVER_SCHEME = location.protocol + "//";
var SERVER_BASE = SERVER_SCHEME + location.hostname;

var SERVER_NAME = location.hostname.match(/^(.*)\.3gokushi/)[1];

var g_aborting = false;

//==========[本体]==========
(function($) {

	// 広告iframe内で呼び出された場合は無視
	if (!$("#container").length) {
		return;
	}

	// 歴史書モードの場合は無視
	if ($("#sidebar img[title=歴史書]").length){
		return;
	}

	// 宝物庫以外では無視
	if (location.pathname != '/item/index.php' && location.pathname != '/item/') {
		return;
	}

	//----------------------------------------
	// 指定アイテムを連続移動
	// - willRequest(index: Int) リクエスト送信前コールバック
	// - didResponse(postCount: Int, receivedCount: Int, isAllDone: Bool) 送信後コールバック
	//----------------------------------------
	function moveItem(ssid, itemId, count, willRequest, didResponse) {
		console.log(`ssid: ${ssid}, itemId: ${itemId}, count: ${count}`);
		if (count <= 0) {
			didResponse(0, 0, true);
			return;
		}

		var index = 0;
		var receivedCount = 0;
		var params = {
			item_id: itemId,
			ssid: ssid
		};
		var timer1 = setInterval(
			function () {
				if (index >= count || g_aborting) {
					return;
				}

				willRequest(index);
				$.ajax({
					url: SERVER_BASE + '/item/index.php',
					type: 'POST',
					datatype: 'html',
					cache: false,
					data: params
				})
				.always(function(res) {
					// POST なので一気に送り付ける。応答数が揃ったらコールバックする
					receivedCount++;
					if (receivedCount >= count) {
						clearInterval(timer1);
						didResponse(index, receivedCount, true);
					} else {
						didResponse(index, receivedCount, false);
					}
				});

				index++;
			}, 200
		);
	}


	//----------------------------------------
	// 操作パネルを作成
	//----------------------------------------
	function addPanel() {
		var ssid = $('form[name=purchaseform] input[name=ssid]').val();
		if (!ssid) {
			return;
		}

		// 各便利アイテムをマウスホバー時のイベントが消えてしまうため処理を追加
		$('#itemInventory div.itemIcon').on({
			mouseover: function() {
				$(this).next(".itemDetail").show();
				var b = $("div#itemDetailBox").position().top;
				$("div.itemDetail").css("top", b);
			},
			mouseout: function() {
				$(".itemDetail").hide();
			}
		});

		// 各便利アイテムに処理を注入
		$.each($('#itemInventory section.iu_card'), function(index) {
			var aside = $('aside', this);

			// 「戻る」ボタンのイベントが消えてしまうため処理を追加
			$('.iu_close', aside).on({
				click: function() {
					$(".itemUse").hide();
  				$(".iu_card").hide();
					g_aborting = true;
				}
			});

			// 保有数
			var itemStack = 1;
			var n4231 = aside.prop('class');
			var icon = $('#itemInventory div.itemIcon').filter(function(index, element){
				var onclick = $('a', element).attr('onclick');
				if (!onclick) {
					return false;
				}
				return onclick.indexOf(`'.${n4231}'`) >= 1;
			});
			if (icon !== null && icon.length >= 1) {
				itemStack = parseInt($('.item_icon_stack', icon.eq(0)).text(), 10);
			}

			// 最下部にまとめて移動UIを追加
			var m = $('.iu_open', aside).attr('onclick').match(/getCardItem\(([0-9]+)\)/);
			if (m !== null && m.length > 1) {
				var itemId = m[1];

				var outline = $("<div />", {
					style: 'margin-top: 15px;'
				});
				var range = $("<input />", {
					id: `useMultiItems_range-${index}`,
					type: 'range',
					min: '1',
					max: `${itemStack}`,
					value: `${itemStack}`,
					style: 'width: 200px; margin: 0;',
					on: {
						change: function(){
							// 変化値をフィールドに反映
							$(`#useMultiItems_number-${index}`).val($(`#useMultiItems_range-${index}`).val());
						}
					}
				});
				var number = $("<input />", {
					id: `useMultiItems_number-${index}`,
					type: 'number',
					min: '1',
					max: `${itemStack}`,
					value: `${itemStack}`,
					style: 'width: 50px; margin-left: 8px; margin-right: 8px;',
					on: {
						change: function() {
							// 入力値をスライダーへ反映
							$(`#useMultiItems_range-${index}`).val($(`#useMultiItems_number-${index}`).val());
						}
					}
				});
				var go = $("<button />", {
					id: `useMultiItems_go-${index}`,
					on: {
						click: function() {
							g_aborting = false;
							$(`#useMultiItems_abort-${index}`).css('display', 'block');

							// 移動開始
							var count = parseInt($(`#useMultiItems_number-${index}`).val(), 10);
							if (!count) {
								count = 1;
							}

							var moving = '移動完了するまで操作しないでください';
							var log1 = $(`#useMultiItems_log1-${index}`);
							var log2 = $(`#useMultiItems_log2-${index}`);
							log1.text(moving);
							log2.text('');

							moveItem(ssid, itemId, count, function(index){
								log1.text(`${moving} - [${index}/${count}]`);
							}, function(postCount, receivedCount, isAllDone){
								if (isAllDone) {
									log1.text(`${receivedCount} 移動完了。画面を更新してください`);
									log2.text('');
									$(`#useMultiItems_abort-${index}`).css('display', 'none');
									$(`#useMultiItems_reload-${index}`).css('display', 'block');
								} else {
									log2.text(`通信完了 - [${receivedCount}/${postCount}]`);
								}
							});
						}
					}
				}).append('まとめて移動する');
				var abort = $("<button />", {
					id: `useMultiItems_abort-${index}`,
					style: 'display: none;',
					on: {
						click: function() {
							g_aborting = true;
							$(`#useMultiItems_log1-${index}`).text('処理を中断中です。中断完了したら画面を更新してください');
							$(`#useMultiItems_abort-${index}`).css('display', 'none');
							$(`#useMultiItems_reload-${index}`).css('display', 'block');
						}
					}
				}).append('処理中断');
				var reload = $("<button />", {
					id: `useMultiItems_reload-${index}`,
					style: 'display: none;',
					on: {
						click: function() {
							location.reload();
						}
					}
				}).append('画面更新');
				var log1 = $("<div />", {
					id: `useMultiItems_log1-${index}`
				}).append("あらかじめファイルの空き容量を確保しておいてください");
				var log2 = $("<div />", {
					id: `useMultiItems_log2-${index}`
				});

				// 配置
				$(aside).append(outline.append(range, number, go).append(log1).append(log2).append(abort, reload));
			}
		});
	}

	addPanel();

})(jQuery);


//----------------------------------------
// for debug print object
//----------------------------------------
function po(obj, ext = "") {
	console.log(ext + JSON.stringify(obj, null, '\t'));
}
