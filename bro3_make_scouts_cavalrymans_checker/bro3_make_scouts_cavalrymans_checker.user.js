// ==UserScript==
// @name		bro3_make_scouts_cavalrymans_checker
// @namespace	https://gist.github.com/RAPT21/
// @description ブラウザ三国志 斥候騎兵生産チェック
// @require 	http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// @include 	http://*.3gokushi.jp/facility/*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		http://info.3gokushi.jp/*
// @connect		3gokushi.jp
// @grant		none
// @author		RAPT
// @version 	2016.07.01
// ==/UserScript==

// レベリング時期などに誤って斥候騎兵生産を回避するためのツール
// 斥候騎兵の枠を隠してしまう

(function($) {
	$("form").each(function(){
		var attr = $(this).attr('onsubmit');
		if (attr && attr.match(/斥候騎兵/)) {
 			$(this).replaceWith('<span>斥候騎兵を作成するにはツールを無効化してね</span>');
		}
	});
})(jQuery);
