// ==UserScript==
// @name		bro3_share_protect_time_register
// @namespace	https://github.com/RAPT21/bro3-tools/
// @description	ブラウザ三国志 保護期間共有 君主名一括登録
// @include		https://*.3gokushi.jp/facility/share_protect_time_view.php*
// @include		http://*.3gokushi.jp/facility/share_protect_time_view.php*
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
// @version 	0.2
// ==/UserScript==

jQuery.noConflict();


//==========[説明書]==========
// ▼目的
// - 「保護期間共有」画面にて、複数の君主名をまとめて一括で登録します。
//
// ▼つかいかた
// 1. 保護期間共有画面に追加された「▼君主名一括登録」をクリックすると、専用の入力画面が開きます。
// 2. 登録したい君主名のリストをテキストエリアに貼り付け、「登録する」ボタンをクリックします。
// 3. 登録完了後、画面に表示される「画面を更新する」ボタンをクリックしてページを再読み込みしてください。
//
// ▼機能・特徴
// - 【柔軟な区切り文字】リストは「改行」または「カンマ（,）」のどちらで区切られていても認識します（混在もOK）。
// - 【空白の自動除去】登録エラーを防ぐため、君主名の前後にある不要なスペース（空白文字）は自動で取り除きます。
// - 【重複チェック】登録エラーを防ぐため、リスト内で名前が重複している場合は自動で1つにまとめます（重複排除）。除外された君主名は画面上のログで確認できます。
// - 【エラー自動リトライ】一部の君主にエラー（存在しない、共有済など）があっても、その君主をリストから自動で除外して正常な君主だけで再登録を試みます。
// - 【自動リロード対応】スクリプト内の設定（g_reloadIfSucceeded）を true に書き換えることで、登録成功時に手動でボタンを押さなくても、自動でページを最新状態に更新できます。


//==========[更新履歴]==========
// 2026.10.02	0.1	初版
// 2026.10.03	0.2	存在しない、共有済などのエラー時、自動で除外してリトライできるように


//==========[設定]==========
const g_reloadIfSucceeded = false; // 登録成功時、自動でリロードするか


//==========[本体]==========
(function($) {
	'use strict';

	// 1. 設定画面の本体を生成
	const $modal = $('<div>', {
		id: 'share_protect_modal',
		css: {
			display: 'none',
			padding: '8px',
			width: '600px',
			MozBorderRadius: '3px',
			borderRadius: '3px',
			WebkitBorderRadius: '3px',
			marginBottom: '6px',
			border: '2px solid #009',
			position: 'absolute',
			zIndex: 999999,
			backgroundColor: 'white'
		}
	});

	const $title = $('<h2>', {
		id: 'share_protect_title',
		text: '君主名一括登録',
		css: { margin: '0 0 15px 0', fontSize: '18px', color: '#FFF' }
	});

	const $textarea = $('<textarea>', { id: 'share_protect_namesInput', rows: 16, placeholder: '改行、またはカンマ(,)区切りで入力してください', css: { width: '100%', padding: '5px', boxSizing: 'border-box', resize: 'vertical', color: '#000', backgroundColor: '#fff' } });
	const $br = $('<br>');
	const $button = $('<button>', { id: 'share_protect_submitBtn', text: '登録する', css: { marginTop: '10px', padding: '6px 12px', cursor: 'pointer', color: '#000', backgroundColor: '#eee' } });
	const $close = $('<button>', { id: 'share_protect_close_btn', text: '閉じる', css: { marginLeft: '20px', marginTop: '10px', padding: '6px 12px', cursor: 'pointer', color: '#000', backgroundColor: '#eee' } });

	// 各種メッセージエリア
	const $infoBox = $('<div>', { id: 'share_protect_infoBox', css: { color: '#d46b08', backgroundColor: '#fff7e6', border: '1px solid #ffd591', padding: '10px 15px', marginTop: '15px', borderRadius: '4px', display: 'none', fontSize: '13px' } });

	// 成功メッセージエリア
	const $successBox = $('<div>', {
		id: 'share_protect_successBox',
		css: { color: '#52c41a', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', padding: '10px 15px', marginTop: '15px', borderRadius: '4px', display: 'none', fontSize: '13px' }
	});
	const $successText = $('<span>', { text: '🎉 登録が成功しました！ ' });

	// 画面更新ボタンの生成
	const $reloadBtn = $('<button>', {
		id: 'share_protect_reloadBtn',
		text: '画面を更新する',
		css: { marginLeft: '10px', padding: '2px 8px', cursor: 'pointer', color: '#fff', backgroundColor: '#52c41a', border: 'none', borderRadius: '3px', fontWeight: 'bold' }
	});
	$successBox.append($successText, $reloadBtn);

	// エラーメッセージエリア
	const $errorBox = $('<div>', { id: 'share_protect_errorBox', css: { color: '#ff4d4f', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', padding: '10px 15px', marginTop: '15px', borderRadius: '4px', display: 'none', fontSize: '13px' } });
	const $errorTitle = $('<div>', { id: 'share_protect_errorTitle', text: '❌ 登録エラーが発生しました：', css: { fontWeight: 'bold', marginBottom: '5px' } });
	const $errorList = $('<ul>', { id: 'share_protect_errorList', css: { margin: 0, paddingLeft: '20px' } });
	$errorBox.append($errorTitle).append($errorList);

	$modal.append($title, $textarea, $br, $button, $close, $infoBox, $successBox, $errorBox);
	$modal.insertBefore($('#gray02Wrapper .mod_subtitle_01'));

	// 2. 設定を開くリンク登録先出現の監視・追加処理
	const checkExist = setInterval(() => {
		const $targetObj = $('#gray02Wrapper .bbs');
		if ($targetObj.length) {
			clearInterval(checkExist);

			if ($('#share_protect_settings').length === 0) {

				const $settingItem = $('<a>', {
					href: '#',
					id: 'share_protect_settings',
					text: '▼君主名一括登録',
					css: {
						color: '#09c',
						display: 'inline-block',
						margin: '5px 0',
						fontSize: '160%',
						textAlign: 'center'
					} });
				$settingItem.insertAfter($targetObj);
			}
		}
	}, 300);


	// 3. 各種イベントハンドラー（グローバル監視）
	$(document).on('click', '#share_protect_settings', (e) => {
		e.preventDefault();
		if ($modal.is(':hidden')) {
			// 表示をクリアしてモーダルを展開
			$errorBox.hide();
			$successBox.hide();
			$infoBox.hide().empty();
			$errorList.empty();
			$textarea.val('');

			$modal.css('display', 'block');
		} else {
			$modal.css('display', 'none');
		}
	});

	// 閉じるボタン
	$(document).on('click', '#share_protect_close_btn', () => {
		$modal.hide();
	});

	// 画面更新ボタン
	$(document).on('click', '#share_protect_reloadBtn', () => {
		window.location.reload();
	});

	// 登録ボタン
	$(document).on('click', '#share_protect_submitBtn', () => {
		$errorBox.hide();
		$successBox.hide();
		$infoBox.hide().empty();
		$errorList.empty();

		// 改行、カンマで区切って前後の余白を除去
		const rawInput = $textarea.val();
		const allNames = rawInput
			.split(/[\n,]+/)
			.map(name => name.trim())
			.filter(name => name !== '');

		if (allNames.length === 0) {
			showErrors({ "入力エラー": ["君主名を入力してください。"] });
			return;
		}

		// 重複君主名を除外
		const uniqueNamesList = [];
		const duplicateNames = [];

		allNames.forEach(name => {
			if (uniqueNamesList.indexOf(name) === -1) {
				uniqueNamesList.push(name);
			} else {
				duplicateNames.push(name);
			}
		});

		// 重複があってもエラーにせず、除外ログだけ残して続行する
		if (duplicateNames.length > 0) {
			$infoBox.text('💡 重複したため除外された君主名: ' + duplicateNames.join(', ')).show();
		}

		// サーバーへ送信
		sendRequest(uniqueNamesList, []);
	});

	function sendRequest(targetList, accumulatedInfoLogs) {
		if (targetList.length === 0) {
			showErrors({ "登録エラー": ["有効な君主名がありません。"] });
			return;
		}

		const requestData = {
			add: 1,
			"user_names[]": targetList
		};

		$.ajax({
			url: '/facility/share_protect_time_view_edit_list.php',
			type: 'POST',
			data: requestData,
			dataType: 'json',
			success: response => {
				if (response.is_success) {
					// リトライの末に成功した場合、これまでに除外されたログも併せて表示
					if (accumulatedInfoLogs.length > 0) {
						$infoBox.html('💡 以下のエラー君主名を除外して登録しました：<br>' + accumulatedInfoLogs.join('<br>')).show();
					}

					$successBox.show();
					$textarea.val('');

					if (g_reloadIfSucceeded) {
						setTimeout(() => {
							window.location.reload();
						}, 1500);
					}
				} else {
					// ❌ エラーが発生した場合：エラー君主名を特定してリトライを試みる
					if (response.errors) {
						const errorNames = []; // 今回のレスポンスでエラーになった君主名たち

						Object.keys(response.errors).forEach(errorType => {
							const names = response.errors[errorType];
							names.forEach(name => {
								if (errorNames.indexOf(name) === -1) {
									errorNames.push(name);
								}
								// ログ用テキストの成形 (例: 「存在しない君主名です (対象: 穴熊さん)」)
								accumulatedInfoLogs.push(`${errorType} (対象: ${name})`);
							});
						});

						// エラー君主名を取り除いた新しい送信リストを作成
						const nextTargetList = targetList.filter(name => errorNames.indexOf(name) === -1);

						// 削った結果、まだ送信できる君主名が1件以上残っているなら自動リトライ
						if (nextTargetList.length > 0) {
							$infoBox.html('🔄 エラー君主名を除外して再登録を試みています...').show();

							// サーバーへの連続負荷を避けるため、少しだけ猶予（0.3秒）を置いてリトライ
							setTimeout(() => {
								sendRequest(nextTargetList, accumulatedInfoLogs);
							}, 300);
							return;
						}
					}

					// リトライできない場合（または全員エラーの場合）は画面にエラーを表示
					showErrors(response.errors);
					if (accumulatedInfoLogs.length > 0) {
						$infoBox.html('💡 除外されたエラー履歴：<br>' + accumulatedInfoLogs.join('<br>')).show();
					}
				}
			},
			error: () => {
				showErrors({ "通信エラー": ["APIの実行に失敗しました。"] });
			}
		});
	}

	function showErrors(errors) {
		if (!errors) return;
		Object.keys(errors).forEach(errorType => {
			const targetNames = errors[errorType];
			const $li = $('<li>', { text: errorType + ' (対象: ' + targetNames.join(', ') + ')' });
			$errorList.append($li);
		});
		$errorBox.show();
	}

})(jQuery);
