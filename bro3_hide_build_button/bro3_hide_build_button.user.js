// ==UserScript==
// @name		bro3_hide_build_button
// @namespace	https://gist.github.com/RAPT21/
// @description	ブラウザ三国志 研究・建設即完了ボタンを隠す
// @include		http://*.3gokushi.jp/*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		http://info.3gokushi.jp/*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @author		RAPT
// @version 	0.1
// ==/UserScript==

//==========[機能]==========
// 都市タブのアクションログ内にある「研究・建設即完了」を非表示にします。

// 2018.12.31	初版作成

window.jQuery("div.actionLogBox div#actionLog.actionLog4Village div.build").hide();
