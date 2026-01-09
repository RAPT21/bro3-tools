// ==UserScript==
// @name		bro3_receive_all_quest
// @namespace	https://github.com/RAPT21/bro3-tools/
// @description	ブラウザ三国志 一括クエクリ報酬受領
// @include		https://*.3gokushi.jp/quest/*
// @include		http://*.3gokushi.jp/quest/*
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
// クエスト画面で、通常クエストを受注してクエクリ報酬受領を自動で一括操作します。
// クエスト一覧画面で「通常クエスト一括クエクリ」のリンクをクリックすると処理を開始します。
// 処理完了までそのまま待っていてください。
// 処理中に再度リンクをクリックで処理を中断します。
//
// ▼注意
// ・受注しただけでクエクリできるものに限ります。
// ・報酬がヨロズダス回数の場合でも、ヨロズダスをひくことはありません。
// ・処理の都合上、受注済クエストは一旦すべてキャンセルします。
// 　イベント鯖などでキャンセルされると困る場合は、OPT_PRE_CANCEL_IN_ACCEPTED = false; を設定してくだしさい。
// 　ただし、5件受注済のときに一切クエクリできなくなるので注意してください。


// 2026.01.10	0.1	初版


var SERVER_SCHEME = location.protocol + "//";
var SERVER_BASE = SERVER_SCHEME + location.hostname;

var SERVER_NAME = location.hostname.match(/^(.*)\.3gokushi/)[1];


var OPT_PRE_CANCEL_IN_ACCEPTED = true; // Option: 処理前に受注済のクエストを一旦すべてキャンセルするか

//----------------------------------------
// 保存設定部品定義
//----------------------------------------
var g_aborting = false;
var g_processing = false;


//==========[本体]==========
(function($) {

	// 広告iframe内で呼び出された場合は無視
	if (!$("#container").length) {
		return;
	}

	//----------------------------------------
	// クエストAPIを実行する
	// - params クエリーパラメーター
	// - callback(isSucceeded, レスポンスjQueryオブジェクト)
	//----------------------------------------
	function callQuestAPI(params, callback) {
		$.ajax({
			url: SERVER_BASE + '/quest/index.php',
			type: 'GET',
			dataType: 'html',
			cache: false,
			data: params
		})
		.done(function(response) {
			callback(true, $($.trim(response)));
		})
		.fail(function(jqXHR){
			callback(false, null);
		});
	}

	//----------------------------------------
	// クエスト一覧を取得
	// - pageNo 取得するページ番号(1-)
	// - callback(maxPageNo: Int, stay: [String], in_accept: [String]) 未受注IDList, 受注済IDListのコールバック
	//----------------------------------------
	function getQuestList(pageNo, callback) {
		var params = {
			p: pageNo,
			mode: 0,
			action: 'change_page',
			disp_mode: 0,
			scroll_pos: 0,
			quest_type: 0,
			selected_tab: 1,
			filter_reward: -1
		};
		callQuestAPI(params, function(isOK, $responseObject) {
			if (!isOK) {
				callback(-1, [], []);
				return;
			}

			// 通信成功
			var stay = [];
			var in_accept = [];
			$responseObject.find('#questB3_table table tbody tr.quest-tr').each(function(){
				var item = $(this).html();
				if ($(this).hasClass('in_accept')) {
					var m = item.match(/cancelQuest\((\d+),\s*\d+,\s*\d+\)/);
					if (m && m.length >= 2) {
						// 受注済ID
						in_accept.push(m[1]);
					}
				} else if ($(this).hasClass('finished') === false) {
					var m = item.match(/takeQuest\((\d+),\s*\d+,\s*\d+\)/);
					if (m && m.length >= 2) {
						// 未受注ID
						stay.push(m[1]);
					}
				}
			});

			var maxPageNo = 1;
			if (pageNo === 1) {
				$responseObject.find("#questB3_pager li").each(function(){
					var text = $(this).text().trim();
					if (text.length) {
						var value = parseInt(text, 10);
						if (!isNaN(value) && maxPageNo < value) {
							maxPageNo = value;
						}
					}
				})
			}
			callback(maxPageNo, stay, in_accept);
		});
	}


	//----------------------------------------
	// 現在のクエスト状況を取得する
	// - callback(stay: [String], in_accept: [String]) 未受注IDList, 受注済IDListのコールバック
	//----------------------------------------
	function getCurrentStatus(callback) {
		var stay_list = [];
		var in_accept_list = [];

		// 先頭ページを取得し、ページ数も取得
		getQuestList(1, function(maxPageNo, stay, in_accept){
			stay_list = stay_list.concat(stay);
			in_accept_list = in_accept_list.concat(in_accept);

			// エラーまたは1ページのみのときは終了
			if (maxPageNo <= 1) {
				callback(stay_list, in_accept_list);
				return;
			}

			// 2ページ目以降を取得
			var pageNo = 2;
			var wait = false;
			var timer1 = setInterval(
				function () {
					if (wait) {
						return;
					}
					wait = true;

					if (pageNo > maxPageNo || g_aborting) {
						clearInterval(timer1);
						timer1 = null;
						wait = false;
						callback(stay_list, in_accept_list);
						return;
					}

					getQuestList(pageNo, function(_maxPageNo, stay, in_accept){
						stay_list = stay_list.concat(stay);
						in_accept_list = in_accept_list.concat(in_accept);

						pageNo++;
						wait = false;
					});
				}, 500
			);
		});
	}

	//----------------------------------------
	// クエスト受注または受注キャンセルを行う
	// - isTakeQuest 受注時true、キャンセル時falseを指定する
	// - id 対象クエストID
	// - callback(isSucceeded, レスポンスjQueryオブジェクト)
	//----------------------------------------
	function processQuest(isTakeQuest, id, callback) {
		if (isTakeQuest) {
			callQuestAPI({ action: 'take_quest', id: id }, callback);
		} else {
			callQuestAPI({ action: 'cancel_quest', cancel_id: id }, callback);
		}

	}

	//----------------------------------------
	// リストを逐一処理するロジック
	// - list: [Any] 処理対象リスト
	// - startParams: Any 処理ブロックに引き渡される初期値
	// - body(index: Int, element: Any, conditionParams: Any, continuous(isContinue: Bool, mutedParams: Any)) 処理本体、引き回しパラメーター
	// - didFinish(isAllOK: Bool, mutedParams: Any)
	//----------------------------------------
	function processAll(list, startParams, body, didFinish) {
		var conditionParams = startParams;
		var index = 0;
		var count = list.length;
		var wait = false;
		var timer2 = setInterval(function(){
			if (wait) {
				return;
			}
			wait = true;

			if (index >= count || g_aborting) {
				clearInterval(timer2);
				timer2 = null;
				wait = false;
				didFinish(!g_aborting, conditionParams);
				return;
			}

			body(index, list[index], conditionParams, function(isContinue, mutedParams){
				if (isContinue) {
					conditionParams = mutedParams; // 引き回しデータをキャッシュ
					index++;
					wait = false;
				} else {
					clearInterval(timer2);
					timer2 = null;
					wait = false;
					didFinish(false, mutedParams); // 最後の引き回しデータを流す
				}
			});
		}, 500);
	}

	//----------------------------------------
	// すべてのクエストを受注orキャンセル
	// - isTake クエスト受注時true、クエストキャンセル時false
	// - id_list キャンセルするクエストIDのリスト
	// - callback(Void) 処理完了コールバック
	//----------------------------------------
	function takeOrCancelAll(isTake, id_list, callback) {
		processAll(id_list, null, function(_index, element, _conditionParams, continuous){
			processQuest(isTake, element, function(isOK){
				continuous(isOK, null);
			});
		}, function(){
			callback();
		});
	}

	//----------------------------------------
	// １つのクエストIDの処理
	// - id 処理対象のクエストID
	// - callback(isOK: Bool) 処理完了コールバック
	//----------------------------------------
	function processBody(id, callback) {
		// クエスト受注→報酬受領→クエストキャンセル
		processQuest(true, id, function(isOK){
			if (!isOK) {
				callback(false);
				return;
			}
			callQuestAPI({ c: 1 }, function(isOK) {
				// 報酬受領時のエラーは無視する
				processQuest(false, id, function(isOK){
					callback(isOK);
				});
			});
		});
	}

	//----------------------------------------
	// 処理本体
	// - callback(Void) 処理完了コールバック
	//----------------------------------------
	function processMain(callback) {
		var log = $('#receive_all_quest_log');

		// 未受注IDList, 受注済IDListを取得
		getCurrentStatus(function(stay_list, in_accept_list){
			var pre_cancel_list = [];
			var target_list = [];

			if (OPT_PRE_CANCEL_IN_ACCEPTED) {
				// 受注済のクエストは一旦すべてキャンセルしてから処理する
				pre_cancel_list = in_accept_list;
				target_list = stay_list.concat(in_accept_list);
			} else {
				// 受注済のクエストは無視して、未受注のクエストのみ処理する
				pre_cancel_list = [];
				target_list = stay_list;

				if (in_accept_list.length >= 5) {
					log.text('受注済クエストを4件以下に再実施してください');
					callback();
					return;
				}
			}

			var totalCount = target_list.length;
			if (totalCount === 0) {
				log.text('すべてクエクリ済です');
				callback();
				return;
			}

			// 先に受注済のクエストをすべてキャンセルしておく
			takeOrCancelAll(false, pre_cancel_list, function(){
				// 全リストを1つずつ処理
				processAll(target_list, null, function(index, element, _conditionParams, continuous){
					log.text(` - ${element} - [${1 + index}/${totalCount}] ${percent(1 + index, totalCount)}%`);
					processBody(element, function(isOK){
						continuous(isOK, null);
					});
				}, function(){
					// 元の受注状態に戻す
					takeOrCancelAll(true, pre_cancel_list, function(){
						callback();
					});
				});
			});
		});
	}

	//----------------------------------------
	// 操作パネルを作成
	//----------------------------------------
	function addPanel() {
		var log = $('<span />', {
			id: 'receive_all_quest_log'
		});
		var anchor = $('<a />', {
			href: '#',
			id: 'receive_all_quest_start',
			on: {
				click: function(){
					if (g_aborting) {
						// 中断処理中は何もしない
						return;
					}

					if (g_processing) {
						// 処理開始中であれば中断する
						g_aborting = true;
						log.text(' - 処理中断中...');
						return;
					}

					// 処理開始
					g_processing = true;

					log.text(' - クエスト項目取得中...');
					processMain(function(){
						g_processing = false;

						if (g_aborting) {
							log.text('');
						} else {
							log.text(' - クエクリ処理完了');
						}
						g_aborting = false;
					});
				}
			}
		}).append('通常クエスト一括クエクリ');
		var item = $('<li />', {
			'class': 'last'
		}).append(anchor, log);

		var base = $("#statMenu").eq(0).children("li.last");
		if (base.length > 0) {
			base.last().after(item).attr('class', '');
		}
	}

	addPanel();

})(jQuery);


//----------------------------------------
// 補助
//----------------------------------------
function percent(progress, total) {
	// 小数点以下第二位以降を切り捨てて、32.4 のような小数を返す
	if (!total) return 0;
	return ((progress * 1000.0 / total) | 0) / 10;
}


//----------------------------------------
// for debug print object
//----------------------------------------
function po(obj, ext) {
	if (ext === undefined) { ext = ""; }
	console.log(ext + JSON.stringify(obj, null, '\t'));
}
