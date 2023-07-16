// ==UserScript==
// @name		bro3_auto_capture_setting
// @namespace	https://github.com/RAPT21/bro3-tools/
// @description	ブラウザ三国志 自動鹵獲設定補助
// @include		https://*.3gokushi.jp/*
// @include		http://*.3gokushi.jp/*
// @exclude		https://*.3gokushi.jp/maintenance*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://info.3gokushi.jp/*
// @exclude		http://info.3gokushi.jp/*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @grant		none
// @author		RAPT
// @version 	0.1
// ==/UserScript==
jQuery.noConflict();

//==========[機能]==========
// 自動鹵獲出兵先設定を簡単に編集できるようにします。

// 2023.07.15	開発着手

var VERSION = "2023.07.15.dev";

var BASE_URL = location.protocol + "//" + location.hostname;

// 自動鹵獲出兵先設定に登録する上限数
var REGISTER_LIMIT_COUNT = 10;

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

	if (location.pathname === '/auto_capture_material/setting.php') {
		//デバッグ用
		//settingOperation($);
	}

	// 領地(空き地)画面
	if (location.pathname === '/land.php') {
		landOperation($);
	}

})(jQuery);


//========================================
//	設定画面
//========================================
function deckOperation($) {
}

// 自動鹵獲出兵先設定画面の解析
function settingOperation($, d = window.document, ssid, callback) {
	// 簡易登録
	var baseXY = $("#basepoint .xy").text().match(/(\([^\)]+\))/)[1];
	var easy1 = $("#acm_setting_deck1");
	var easy2 = $("#acm_setting_deck2");

	easy1.text("本拠地デッキに登録する").css({'color': '#0000dd', 'pointer-events': ''});
	easy2.text("拠点デッキに登録する").css({'color': '#0000dd', 'pointer-events': ''});

	// 結果表示用
	var body1 = $("#acm_list_body1");
	var body2 = $("#acm_list_body2");
	body1.empty();
	body2.empty();

	var exports = {
		deck1: [],
		deck2: []
	};

	// 自動鹵獲出兵先設定を取得
	var sel = $("[class*=commonTables][data-deck-kind-visible]", d);
	$("[class*=commonTables][data-deck-kind-visible]", d).each(function(){
		var deck_kind = $(this).data("deck-kind-visible");
		var easy_title = deck_kind === 1 ? '本拠地' : '拠点';
		var easy_target = deck_kind === 1 ? easy1 : easy2;
		var target = deck_kind === 1 ? body1 : body2;

		$("tbody tr", this).each(function(){
			if ($('td:eq(2) a[href*="land.php"]', this).attr("href").match(/x=([-]?\d+)&y=([-]?\d+)/) !== null) {
				var x = RegExp.$1;
				var y = RegExp.$2;
				var xy = `(${x},${y})`;
				var tr_style = '';
				if (xy === baseXY) {
					// すでに登録済
					tr_style = 'background-color: #ffc0c0;';
					easy_target.text(`${easy_title}デッキに登録済み`).css({'color': 'black', 'pointer-events': 'none'});
				}

				var link = $("<a />", {
					href: `/land.php?x=${x}&y=${y}`,
					style: 'color: #0000dd; cursor: pointer; text-decoration: none;',
					on: {
						mouseenter: function() {
							$(this).css({'text-decoration': 'underline'});
						},
						mouseleave: function() {
							$(this).css({'text-decoration': 'none'});
						}
					}
				}).append(xy)

				var use = $('td:eq(0)', this).text().trim();
				var priority = parseInt($('td:eq(1)', this).text().trim(), 10);
				if ($('td:eq(3)', this).text().replace(/\s/g, '').match(/(★+)(\S+)/) !== null) {
					var material = RegExp.$2;
					var spec = `★${RegExp.$1.length} (`;
					spec += (material.match(/森(\d+)/) !== null) ? RegExp.$1 : '0';
					spec += '-';
					spec += (material.match(/岩(\d+)/) !== null) ? RegExp.$1 : '0';
					spec += '-';
					spec += (material.match(/鉄(\d+)/) !== null) ? RegExp.$1 : '0';
					spec += '-';
					spec += (material.match(/糧(\d+)/) !== null) ? RegExp.$1 : '0';
					spec += ')';

					target.append(
						$("<tr />", {
							style: tr_style
						}).append(
							$("<td />", {style: 'padding: 4px'}).append(use),
							$("<td />", {style: 'padding: 4px'}).append(link),
							$("<td />", {style: 'padding: 4px'}).append(spec),
							$("<td />", {style: 'padding: 4px'}).append(
								$("<span />", {
									style: 'color: #0000dd; font-size: 9pt; text-decoration: underline; cursor: pointer;',
									on: {
										click: function() {
											$(this).off('click');
											if (ssid !== null) {
												unregisterLand($, ssid, deck_kind, x, y);
											}
										}
									}
								}).append("削除")
							)
						)
					);

					var item = {x: parseInt(x, 10), y: parseInt(y, 10), active: (use === "〇" ? true : false), priority: priority};
					if (deck_kind === 1) {
						exports.deck1.push(item);
					} else {
						exports.deck2.push(item);
					}

					// 上限到達時は追加できない
					if ($("tr", target).length === REGISTER_LIMIT_COUNT) {
						easy_target.text(`${easy_title}デッキ登録上限。削除してから登録してください`).css({'color': 'black', 'pointer-events': 'none'});
					}

				}
			}

		});
	});
	if ($("td", body1).length === 0) {
		body1.append($("<td />", {colspan: 4}).append("未登録"));
	}
	if ($("td", body2).length === 0) {
		body2.append($("<td />", {colspan: 4}).append("未登録"));
	}

	$("#acm_export_deck1").val(JSON.stringify(exports.deck1, null, ''));
	$("#acm_current_deck1").val(JSON.stringify(exports.deck1, null, ''));
	$("#acm_export_deck2").val(JSON.stringify(exports.deck2, null, ''));
	$("#acm_current_deck2").val(JSON.stringify(exports.deck2, null, ''));
	if (callback) callback(true);
}

// 自動鹵獲出兵先設定を取得
function getAutoCaptureMaterialSetting($, ssid, callback) {
	$("#acm_result").append("処理中");
	$.ajax({
		url: '/auto_capture_material/setting.php',
		type: 'GET',
		datatype: 'html',
		cache: false
	}).fail(function(){
		$("#acm_result").append("自動鹵獲出兵先設定取得エラー");
		if (callback) callback(false);
	})
	.done(function(res) {
		$("#acm_result").empty();
		var response = $("<div />").append(res);
		settingOperation($, response, ssid, callback);
	});
}

// 自動鹵獲出兵先簡易設定API
function territoryProcAPI($, ssid, deck_kind, x, y, mode = 'set_auto_capture_material') {
	return $.ajax({
		url: `./territory_proc.php?x=${x}&y=${y}&mode=${mode}`,
		type: 'POST',
		datatype: 'html',
		cache: false,
		data: {
			ssid: ssid,
			deck_kind: deck_kind
		}
	});
}

// 自動鹵獲出兵先に登録
function registerLand($, ssid, deck_kind, x, y) {
	$("#acm_result").append("処理中");
	territoryProcAPI($, ssid, deck_kind, x, y, 'set_auto_capture_material')
		.fail(function(){
			$("#acm_result").append("登録エラー");
		})
		.done(function(res) {
			$("#acm_result").empty();
			getAutoCaptureMaterialSetting($, ssid);
		});
}

// 自動鹵獲出兵先から外す
function unregisterLand($, ssid, deck_kind, x, y) {
	$("#acm_result").append("処理中");
	territoryProcAPI($, ssid, deck_kind, x, y, 'unset_auto_capture_material')
		.fail(function(){
			$("#acm_result").append("削除エラー");
		})
		.done(function(res) {
			$("#acm_result").empty();
			getAutoCaptureMaterialSetting($, ssid);
		});
}

// 非同期処理でリストを順次処理
function perform_each(list, processing, callback) {
	var index = 0;
	var wait = false;
	var timer1 = setInterval(function(){
		if (wait) {
			return;
		}
		wait = true;
		if (index >= list.length) {
			// 終端に達した
			clearInterval(timer1);
			timer1 = null;
			if (callback) {
				callback(true);
			}
			return;
		}

		// 逐一処理
		if (processing) {
			processing(index, list[index], function(abort){
				if (abort) {
					clearInterval(timer1);
					timer1 = null;
					if (callback) {
						callback(false);
					}
					return;
				}
				index++;
				wait = false;
			});
		} else {
			index++;
			wait = false;
		}
	}, 200);
}

// インポート処理
function performImport($, ssid, deck_kind, delete_text, import_text, callback) {
	var delete_list = [];
	var import_list = [];
	try {
		if (delete_text.length > 2) {
			delete_list = JSON.parse(delete_text);
		}
		if (import_text.length > 2) {
			import_list = JSON.parse(import_text);
		}
	} catch (error) {
		console.log(error);
		if (callback) callback("フォーマット不正のため処理中断");
		return;
	}

	// まず削除
	perform_each(delete_list, function(index, item, proc){
		territoryProcAPI($, ssid, deck_kind, item.x, item.y, 'unset_auto_capture_material')
			.fail(function(){
				if (proc) proc(true);
			})
			.done(function(res) {
				if (proc) proc(false);
			});
	}, function(done){
		if (done) {
			// 追加
			perform_each(import_list, function(index, item, proc){
				if (index >= REGISTER_LIMIT_COUNT) {
					// 上限数に達している場合はエラーにせず終わる
					proc(false);
					return;
				}
				territoryProcAPI($, ssid, deck_kind, item.x, item.y, 'set_auto_capture_material')
					.fail(function(){
						if (proc) proc(true);
					})
					.done(function(res) {
						if (proc) proc(false);
					});
			}, function(done){
				if (done) {
					if (callback) callback("インポート完了");
				} else {
					if (callback) callback("インポート - 追加エラー");
				}
			});
		} else {
					if (callback) callback("インポート - 削除エラー");
		}
	});
}

// 土地画面での処理
function landOperation($) {
	var form = $("#form_auto_capture_material");
	var ssid = $("input[name=ssid]", form).val();
	var decisions = $(".decision", form);
	if (decisions.length === 0) {
		// 追加はできないが参照・削除はできてもいいかも
		return;
	}

	// 運営のクリック時処理を無効化し、簡易設定表示に置き換える
	$("#tMenu_btnif a.send_troop_auto_capture_material").prop("onclick", null).off("click")
		.on("click", function(){
			$("#acm_setting_view").toggle();
			// 無用な通信を避けるため、初めて設定画面を開いたときにロードする
			if ($("#acm_setting_view").data("isLoadList") === false) {
				$("#acm_setting_view").data("isLoadList", true);
				getAutoCaptureMaterialSetting($, ssid);
			}
		});

	// オーバーラップ表示させる
	$("#tMenu_btnif").css({position: 'relative'});
	var view = $("<div />", {
		id: 'acm_setting_view',
		style: 'width: 500px; line-height: 20px; display: none;'
			+ ' position: absolute; top: 4px; left: 0px;'
			+ ' padding: 4px 16px 8px 16px;'
			+ ' color: #333333; background-color: white;'
			+ ' cursor: default; -moz-border-radius:3px; border-radius: 3px; -webkit-border-radius: 3px; border: 2px solid #009;'
			+ ' z-index:9999;'
	});
	$("#tMenu_btnif").prepend(view);
	view.append(
		$("<div />", {
			style: 'font-weight: bold; margin-bottom: 4px; background-color: #ffffc0; padding: 2px 0px 6px 0px;'
		}).append(
			$("<span />", {id: 'acm_setting_title'}).append(`自動鹵獲簡易設定: ${$("#basepoint .xy").text()}`)
		)
	);
	view.data("isLoadList", false);

	// 簡易設定BOX
	view.append($("<div />", {id: 'acm_setting_box'}));

	// 本拠地、拠点への簡易設定
	decisions.each(function(){
		var deck_kind = $(this).data("deck-kind-visible");

		var text = (deck_kind === 1) ? '本拠地' : '拠点';
		text += 'デッキに登録する';

		var formaction = $("[type=submit]", this).attr("formaction");
		var x = formaction.match(/x=([-]?\d+)/)[1];
		var y = formaction.match(/y=([-]?\d+)/)[1];

		$("#acm_setting_box").append(
			$("<div />", {
				id: `acm_setting_deck${deck_kind}`,
				style: 'color: #0000dd; cursor: pointer; text-decoration: none;',
				on: {
					'mouseenter': function() {
						$(this).css({'text-decoration': 'underline'});
					},
					'mouseleave': function() {
						$(this).css({'text-decoration': 'none'});
					},
					'click': function() {
						registerLand($, ssid, deck_kind, x, y);
					}
				}
			}).append(text)
		);
	});

	// 簡易設定の処理結果
	$("#acm_setting_box").append(
		$("<div />", {id: 'acm_result'})
	);

	// 自動鹵獲出兵先設定をインライン表示する
	$("#acm_setting_box").append(
		$("<div />", {style: 'margin-top: 14px;'}).append(
			$("<a />", {
				id: 'acm_setting_query',
				style: 'color: rgb(0, 0, 221); cursor: pointer;',
				on: {
					'click': function(){ getAutoCaptureMaterialSetting($, ssid); }
				}
			}).append("▼自動鹵獲出兵先リストを更新")
		)
	);

	// 取得結果を表示するテーブル作成
	$("#acm_setting_box").append(
		$("<div />", {id: 'acm_list_container'}).append(
			$("<div />", {id: 'acm_setting_box_deck1', style: 'float: left;'}).append(
				$("<table />", {cols: 4, border: 1}).append(
					$("<caption />", {style: 'font-weight: bold'}).append("本拠地"),
					$("<tbody />", {id: 'acm_list_body1'}).append(
						$("<td />", {colspan: 4}).append("未登録")
					)
				)
			),
			$("<div />", {id: 'acm_setting_box_deck2', style: 'float: right;'}).append(
				$("<table />", {cols: 4, border: 1}).append(
					$("<caption />", {style: 'font-weight: bold'}).append("拠点"),
					$("<tbody />", {id: 'acm_list_body2'}).append(
						$("<td />", {colspan: 4}).append("未登録")
					)
				)
			)
		)
	);

	// 運営の設定画面へ遷移するリンク
	$("#acm_setting_box").append(
		$("<div />", {style: 'clear: both; padding-top: 4px;'}).append(
			$("<a />", {
				href: '/auto_capture_material/setting.php',
				style: 'color: #0000dd;'
			}).append("自動鹵獲出兵先設定画面を開く")
		)
	);

	// Export/Import
	view.append(
		$("<div />", {style: 'margin: 10px 0px;'}).append(
			$("<button />", {
				id: 'acm_export',
				type: 'button',
				style: 'width: 200px;',
				on: {
					click: function(){
						$("#acm_setting_box").toggle();
						$("#acm_porting_box").toggle();
						$("#acm_import_status").text("");
					}
				}
			}).append("Export / Import")
		),
		$("<div />", {id: 'acm_porting_box', style: 'display: none;'}).append(
			$("<div />", {}).append(
				$("<span />", {
					style: 'color: red'
				}).append(
					"Importすると今の設定をすべて削除して、置き換えます。<br />",
					"今のところ有効化や優先順位はインポートできないため、設定画面で編集してください。"
				)
			),
			$("<div />", {}).append(
				$("<span />", {
					id: 'acm_import_status',
					style: 'color: blue; display: none; '
				}).append("")
			),
			$("<dl />", {id: 'acm_export_list'}).append(
				$("<dt />", {style: 'font-weight: bold;'}).append("本拠地デッキ"),
				$("<dd />").append(
					$("<textarea />", {id: 'acm_export_deck1', cols: 45, rows: 3}),
					$("<input />", {id: 'acm_current_deck1', type: 'hidden'}),
					$("<button />", {
						id: 'acm_import_deck1',
						type: 'button',
						style: 'width: 80px; margin-left: 8px;',
						on: {
							click: function(){
								$("#acm_export_list").hide();
								$("#acm_import_status").text("本拠地デッキ インポート処理中...").show();
								performImport($, ssid, 1, $("#acm_current_deck1").val(), $("#acm_export_deck1").val(), function(msg){
									$("#acm_import_status").text(msg);
									// 画面更新
									getAutoCaptureMaterialSetting($, ssid, function(){
										$("#acm_export_list").toggle();
										$("#acm_setting_box").toggle();
										$("#acm_porting_box").toggle();
									});
								});
							}
						}
					}).append("Import開始")
				),
				$("<dt />", {style: 'font-weight: bold;'}).append("拠点デッキ"),
				$("<dd />").append(
					$("<textarea />", {id: 'acm_export_deck2', cols: 45, rows: 3}),
					$("<input />", {id: 'acm_current_deck2', type: 'hidden'}),
					$("<button />", {
						id: 'acm_import_deck2',
						type: 'button',
						style: 'width: 80px; margin-left: 8px;',
						on: {
							click: function(){
								$("#acm_export_list").hide();
								$("#acm_import_status").text("拠点デッキ インポート処理中...").show();
								performImport($, ssid, 2, $("#acm_current_deck2").val(), $("#acm_export_deck2").val(), function(msg){
									$("#acm_import_status").text(msg);
									// 画面更新
									getAutoCaptureMaterialSetting($, ssid, function(){
										$("#acm_export_list").toggle();
										$("#acm_setting_box").toggle();
										$("#acm_porting_box").toggle();
									});
								});
							}
						}
					}).append("Import開始")
				)
			)
		)
	);
}


//========================================
//	jQuery を使用しない共通関数定義
//========================================

// for debug print object
function po(obj, ext = "") {
	console.log(ext + JSON.stringify(obj, null, '\t'));
}
