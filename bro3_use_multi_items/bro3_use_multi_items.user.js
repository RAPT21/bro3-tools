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
// @version 	0.1
// ==/UserScript==
jQuery.noConflict();


// ▼概要
// 宝物庫から同一アイテムを複数まとめて移動できます。


// 2024.01.11	0.1	初版


var SERVER_SCHEME = location.protocol + "//";
var SERVER_BASE = SERVER_SCHEME + location.hostname;

var SERVER_NAME = location.hostname.match(/^(.*)\.3gokushi/)[1];


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

	//----------------------------------------
	// 指定アイテムを連続移動
	//----------------------------------------
	function moveItem(ssid, itemId, max, callback, handler) {
		console.log(`ssid: ${ssid}, itemId: ${itemId}, max: ${max}`);

		var index = 0;
		var count = 0;
		var params = {
			item_id: itemId,
			ssid: ssid
		};
		var timer1 = setInterval(
			function () {
				callback(index);
				$.ajax({
					url: SERVER_BASE + '/item/index.php',
					type: 'POST',
					datatype: 'html',
					cache: false,
					data: params
				})
				.always(function(res) {
					// POST なので一気に送り付ける。応答数が揃ったらコールバックする
					count++;
					if (count >= max) {
						clearInterval(timer1);
						handler(max);
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

		// 各便利アイテムに処理を注入
		$.each($('#itemInventory section.iu_card'), function(index) {
			var aside = $('aside', this);

			// 「戻る」ボタンのイベントが消えてしまうため処理を追加
			$('.iu_close', aside).on({
				click: function() {
					$(".itemUse").hide();
  				$(".iu_card").hide();
				}
			});

			// マウスホバー時のイベントが消えてしまうため処理を追加
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
							// 移動開始
							var max = parseInt($(`#useMultiItems_number-${index}`).val(), 10);
							if (!max) {
								max = 1;
							}

							var moving = '移動完了するまで操作しないでください';
							var log = $(`#useMultiItems_log-${index}`);
							log.text(moving);

							moveItem(ssid, itemId, max, function(index){
								if (index <= max) {
									log.text(`${moving} - [${index}/${max}]`);
								}
							}, function(count){
								log.text(`${count} 移動完了。画面を更新してください`);
							});
						}
					}
				}).append('まとめて移動する');
				var log = $("<div />", {
					id: `useMultiItems_log-${index}`
				}).append("あらかじめファイルの空き容量を確保しておいてください");

				// 配置
				$(aside).append(outline.append(range, number, go).append(log));
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
