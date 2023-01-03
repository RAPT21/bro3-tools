// ==UserScript==
// @name		bro3_nyannyan
// @namespace	http://tooter.seesaa.net/
// @description ブラウザ三国志 Cニャン連打
// @include 	http://*.3gokushi.jp/union/expup.php*
// @include 	https://*.3gokushi.jp/union/expup.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		https://*.3gokushi.jp/maintenance*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @connect		3gokushi.jp
// @icon		http://w1.3gokushi.jp/extend_project/w945/img/card/deck/4152_386kD31z.png
// @grant		none
// @author		RAPT
// @version 	2.0
// ==/UserScript==

// オリジナルは つーたー氏 2014/02/02
// http://tooter.seesaa.net/article/386786350.html
//
// デッキ→合成→修行合成→修行合成画面に行くとボタンがあります。
// C水鏡娘を自動で修行合成するツールです

// 配布サイト
// https://github.com/RAPT21/bro3-tools/
//
// 2023.01.03	2.0	オリジナルのスクリプトが動作しなくなっていたのを修正。
//					ファイルに該当するカードがあれば優先して使うようにした。
//					ファイルになければ便利アイテムから移動して修行合成します。
//					UC水鏡娘,R水鏡娘にも対応
//					※R水鏡娘を使う場合、プロフィール＞武将カード自動保護設定＞宝物庫の設定を「R以上」以外へ設定してください。

jQuery.noConflict();
(function(q$){

	// 修行合成処理
	function shugyo(buttonId, targetCardId, targetCardName, targetSkillName, getItem) {
		var base_cid = q$("[name='base_cid']").val();
		var ssid = q$("#ssid").val();
		// エサを探す
		q$.get("/union/expup.php",{cid:base_cid,'search_configs[type]':1,'search_configs[q]':targetSkillName,cid:base_cid,l:0,base_cid:base_cid,added_cid:base_cid},function(a){
			var cards = q$(a).find(`.cardStatusDetail:contains('${targetSkillName}')`);
			if (cards.length) {
				// エサ発見
				var added_cid = cards.eq(0).find(".control").html().match(/cid=(\d+)/)[1];
				q$(`#${buttonId}`).text("合成中");
				q$.post("/union/union_expup.php",{added_cid:added_cid,base_cid:base_cid,exec_expup:true,ssid:ssid,use_cp_flg:0},function(a){
					if(q$(a).find(".notice").length){
						// 合成エラー
						q$(`#${buttonId}`).html(q$(a).find(".notice").text()).css("color","red").css("font-size","13px").css("font-weight","bold");
						//window.alert(q$(a).find(".notice").text());
					}else{
						// 合成成功
						q$(`#${buttonId}`).html(q$(a).find(".lead").text()+`<br><br>続けて${targetCardName}で修行合成する`);
					}
				});
			} else if (getItem) {
				q$(`#${buttonId}`).text("便利アイテムからデッキへ移動中");
				q$.post("/item/index.php",{item_id:targetCardId,ssid:ssid},function(){
					shugyo(buttonId, targetCardId, targetCardName, targetSkillName, false);
				});
			} else {
				q$(`#${buttonId}`).text(`${targetCardName}が見つかりません`);
			}
		});
	}

	// アクションボタン追加
	function addNyanNyanButton(buttonId, targetCardId, targetCardName, targetSkillName) {
		var button = q$("<button />", {
			id: buttonId,
			"class": "NyanNyanClub",
			"data-text": `${targetCardName}で修行合成する`,
			on: {
				click: function() {
					// 他のボタンテキストをリセットする
					q$("button.NyanNyanClub").each(function(){
						q$(this).text(q$(this).attr("data-text"));
					});
					// 処理開始
					shugyo(buttonId, targetCardId, targetCardName, targetSkillName, true);
				}
			}
		}).append(`${targetCardName}で修行合成する`);
		q$("#bacecard").find(".left").append(q$("<div />", {style:"margin: 4px 0 0 15px"}).append(button));
	}

	// メイン処理
	addNyanNyanButton("nyannyan1", "24152", "C水鏡娘", "娘々訓練LV1");
	addNyanNyanButton("nyannyan2", "24102", "UC水鏡娘", "娘々訓練LV2");
	addNyanNyanButton("nyannyan3", "24101", "R水鏡娘", "娘々訓練LV3");

})(window.jQuery);
