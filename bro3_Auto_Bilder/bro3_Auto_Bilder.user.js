// ==UserScript==
// @name		bro3_Auto_Bilder
// @namespace	http://at-n2.net/
// @description	ブラウザ三国志 自動建築スクリプト By nottisan + 5zen（自動内政改良） + RAPT
// @icon		https://raw.github.com/5zen/fake3gokushi/master/icon.png
// @include		http://*.3gokushi.jp/*
// @require		http://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js
// @require		https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @exclude		http://*.3gokushi.jp/world/select_server_mixi_new.php*
// @exclude		http://*.3gokushi.jp/maintenance*
// @exclude		http://info.3gokushi.jp/*
// @connect		3gokushi.jp
// @grant		GM_getValue
// @grant		GM_setValue
// @grant		GM_xmlhttpRequest
// @grant		GM_log
// @grant		GM.getValue
// @grant		GM.setValue
// @grant		GM.xmlhttpRequest
// @grant		GM.log
// @author		RAPT
// @version		2020.01.31
// ==/UserScript==

// ※施設建設、施設LVUP、施設削除などは、運営側仕様として、拠点を指定しての処理ができません。
// 現在表示している拠点に対して、座標のみの指定しかできません。
// そのため、指示を送ろうとしている最中に拠点を切り替えられてしまうと意図しない拠点で発動してしまいます。
// 自動巡回時間を短くし過ぎていたり、指示発動タイミングで拠点を切り替えたりしないようにすることで回避できる可能性があります。
// 手動操作を優先したい場合、一度スクリプトを停止させておくことをご検討ください。

// ※施設LVUPは、運営側仕様としては、LV値を指定しての建築はできません。
// 現在表示している拠点に対して、座標のみを指定してLVUPの指示をするだけです。
// そのため、ブラウザの動作が重い場合などに、上限指定値を超えて指示が発行される場合がありますので、ご注意ください。

// ----- 動作環境について ----- 2017.05.28
// Fifefox 56以下 + Greasemonkey 3.x で開発しています。
// Google Chrome + Tampermonkey でも動作することを確認しています。
// Pale Moon など上記以外の環境でも動作するらしいですが動作保証外です。

// ----- 更新履歴
// 2014.08.20 (本スクリプトのベース)
// 2015.05.10 施設削除予約対応 by RAPT
// 2015.05.13 施設削除予約対応が Google Chrome でも動作するよう修正
//			  自動内政スキルに豊潤祈祷を追加 by RAPT
// 2015.05.24 ★9(1-1-1-2)水車村化オプションを追加
//			  変換用市場表示が Google Chrome でも動作するよう修正
//			  Google Chrome 対応版@2015.01.01 をマージ by RAPT
// 2015.05.27 ★5(0-0-0-1)水車村オプションを追加
//			  ★5工場村オプションを追加
// 2015.05.30 ★7(0-0-0-1)水車村オプションを追加
//			  ★5工場村の建築位置を調整
// 2015.06.09 設定画面に「保存して閉じる」ボタンを追加。保存アラートなし、保存後閉じる、閉じた後リロードしない。
// 2015.06.09 メンテナンスでエラーが出るようになったのを修正
// 2015.06.10 メンテナンスでinfoフレームに表示される問題を修正
// 2015.06.11 メンテナンスでinfoフレームに表示される問題を修正→うまく動いていないようなのでいったん戻した
// 2015.07.24 水車村化のロジック変更。先に畑をすべて建設し、各LV10まで上げてから水車に必要な施設を作るようにした
// 2015.07.27 水車村化のロジック変更。先に畑をすべて建設し、水車に必要な施設を建設後、自動LVUPにシフトするようにした
//			  この変更に伴い、自動水車村化オプションのチェックを入れ直してください
//			  ★3(0-0-0-1)水車村オプションを追加
// 2015.07.28 初期化ボタン以外で水車村化オプションのチェックを外せなくなっていた問題を修正
//			  2015.07.27版で工場村化オプションが動作していなかった問題を修正
// 2015.10.02 水車村化オプションで資源不足時無限ループしていた問題を修正
// 2015.11.29 宿舎ビルド＆スクラップ機能を削除
//			  糧村化オプションにて銅雀台を建設しないようにした
//			  保存ボタン押下でアラート表示しないようにした
//			  運営のタイマーバグ対策。最大時間を異常に超えている場合、リロードする。
// 2015.11.29r2 必要資源チェックの誤りを修正
// 2015.12.01 運営のタイマーバグ対策でタイマー情報が未登録のとき無限リロードしていた不具合を修正。
// 2015.12.08 運営のタイマーバグ対策で城LV4の 目安値誤り修正
// 2015.12.16 運営のタイマーバグ対策で一部鯖で自動造兵処理/自動武器・防具強化/市場処理/自動寄付処理が動作しなくなる場合があったケースに対応
// 2016.01.10 糧自動寄付有効で指定値が0の場合に自動リロードが止まらないため、1未満時は無視するようにした
// 2016.01.16 糧自動寄付有効で指定値が0の場合の判定誤り（上限値をチェックしていた）を修正
// 			  運営のタイマーバグ対策でリロード間隔を1→2秒に変更
//			  序盤本拠向けのプリセットを追加：衝車研究、訓練所、遠征訓練
// 2016.02.19 歴史書モードのときは自動ビルドを動作させないようにした
// 2016.03.12 宿舎LV11→12時の必要糧量誤りを修正（糧不足のとき無限リロードしていた）
// 2016.03.24 弓兵舎、厩舎、兵器工房LV12→13時の必要時間誤りを修正（1000秒経過しないとき無限リロードしていた）
// 2016.04.06 Google Chrome+Tampermonkey でスクリプトヘッダーに @connect が無いと警告が出る件の対応
// 2016.05.01 水車村化オプション、工場村化オプション押下時の動作を調整
//			  自動内政スキルに食糧革命,陳留王政を追加
// 2016.05.04 画面レイアウト変更により自動造兵が正常に動作しなくなっていた問題を修正
// 2016.05.12 糧変換時一番市場レベルの高い拠点へジャンプする機能が動作しなくなっていたのを修正
//			  糧変換パターンにスマート変換を追加
// 2016.08.14 ★5工場村オプションの10～11期対応
// 2016.08.21 自動造兵機能で保有兵士が正常にカウントできなくなっていた不具合を修正（画面レイアウト変更によるもの）
// 2016.10.21 糧変換仕様変更対応
//			  建設中や削除中拠点の表示順が逐一切り替わるよう変更された影響で、拠点建設/削除完了時に巡回設定のチェック状態がおかしくなっています。
// 2016.11.03 糧変換のスマート変換で、変換ロジックを調整
//			  糧変換パターンに余剰分を変換を追加
// 2016.11.23 拠点所有数UPアイテム使用時、従来の獲得名声依存の拠点数に達していると拠点建設予約が作動しない問題を修正
// 2016.12.04 　↑の対応で、旧仕様の鯖（イベント鯖）でビルダーが動作していなかった不具合を修正
// 2016.12.05 兵士自動作成機能で、大剣兵、盾兵、重盾兵について、兵数上限、作成単位を正しく判定できていなかったロジック誤りを修正
// 2016.12.07 副将対応でビルダーが動作しなくなっていたのを緊急対応（まだ動かないものがあるかも。発見し次第順次修正していきます）
// 2016.12.30 ★8(0-0-0-0)水車村オプションを追加
//			  自動内政スキルから造兵系（練兵/兵舎/厩舎/弓兵/兵器訓練|修練/檄文）のスキルを削除
// 2017.01.22 回復中の内政スキル情報取得部分を修正
// 2017.01.28 内政スキル回復中の文字色を灰色に変更
// 2017.02.05 古代の修正履歴コメントを削除
//			  宿舎化、大宿舎化オプションをお試し実装。空き地に宿舎、大宿舎を敷き詰めます。
//			  宿舎化オプションで、倉庫LV1と練兵所LV1がない場合は先に建設します。
//			  大宿舎化オプションで前提施設がない場合、建設を中止します。
// 2017.02.06 宿舎化/大宿舎化オプションによる自動建設ができていなかった不具合を修正
//			※市場繁栄など市場変換率を変化させるスキル使用時、自動糧変換がうまく動作しません。
//			後日修正予定ですので、スキル使用時は手で変換を行なってください。
// 2017.03.20 jQuery 1.3.2 → 1.12.4 にアップデート　※将来的に高速化 v3 系に移行を見据えています。
//			  12期★9(7-0-0-4),★9(0-7-0-4),★9(0-0-7-4)に対応する工場村オプション追加（未試験）
// 2017.03.24 12期★9(7-0-0-4)工場村オプションで施設を１つ建設すると続きを建設できない不具合を修正
//			  2017.03.20 版で、Google Chrome で市場変換できなくなる不具合を修正
// 2017.03.25 12期★9(7-0-0-4)工場村オプションで倉庫建設場所をミスっていた不具合を修正
// 2017.05.28 12期★9(7-0-0-4)工場村オプションで工場周辺空きマスを畑に変更
//			  ★5工場村オプションの方向選択を不要にした
//			  倉庫LV18建設必要資源の石と鉄の数値誤りを修正
// 2017.05.31 2017.05.28版で★5工場村オプションの方角判定に誤りがあって建設できていなかった不具合を修正
// 2017.06.01 Google Chrome で「Uncaught TypeError: j$.cookie is not a function」となりビルダーの一部機能が動作しなくなるため。Cookie の取得方法を変更
// 2017.06.11 ★9(7-4)工場村オプションで工場建設後自動LVUPへ移行することを忘れていたので修正
// 2017.07.24 巡回時間が読み込めていないタイミングがあるようなので対処
// 2017.08.11 即完時 IP-BAN 対策のため処理後のリロード時間を調整
// 2017.08.12 運営の自動建設機能による一括建設中、一括建設準備中があるとき、自動建設しようとしてリロードを繰り返していた問題を修正
// 2017.08.16 運営の自動建設機能による全建設中の検出対応
// 2017.08.18 市場変換対象の拠点で運営の自動建設機能による一括建設中に市場変換など一部機能が動作しない問題への対処（一括建設中は運営タイマーバグ対策が作動しないようにした）
// 2017.08.19 運営の自動建設機能による自動建設中の検出対応
// 2017.12.06 Google Chrome で動かなくなったらしいので修正
// 2018.01.08 Greasemonkey 4 暫定対応
//			  運営の自動建設機能による全建設準備中の検出対応
// 2018.05.03 10期？★4(1-1-1-1)水車村オプションを追加
// 2018.05.13 6期？★6(0-0-0-0)水車村オプションを追加
// 2019.01.10 ★4(1-1-1-1)水車村オプションで (5, 5) に畑を作るのは誤りなので修正
//			  運営のタイマーバグ対策でリロード間隔を2秒→5秒に変更
//			  戦斧兵,双剣兵,大錘兵の自動武器LVUP/防具LVUP対応
// 2019.02.03 拠点に鍛冶場がないと、防具工場があっても防具LVUPが動作しない既存バグを修正
// 2019.04.01 3/27のメンテ以降？、プロフィール画面の座標フォーマットが変更されたため拠点情報を正しく取得できなくなっていた問題への対応
// 2019.05.09 3/27のメンテ以降？に開始された期でプロフィール画面の人口フォーマットが変更されたため拠点情報を正しく取得できなくなっていた問題への対応
// 2020.01.30 1/30の運営仕様変更に伴い、資源情報を取得できなくなっていた問題を修正
// 2020.01.31 名声分母が正常に取得できておらず、自動建設できていなかった不具合を修正

var VERSION = "2020.01.31"; 	// バージョン情報

// load jQuery（q$にしているのは Tampermonkey 対策）
jQuery.noConflict();
q$ = jQuery;

//*** これを変更するとダイアログのフォントスタイルが変更できます ***
var fontstyle = "bold 10px 'ＭＳ ゴシック'";	// ダイアログの基本フォントスタイル

var DEBUG = false;

// 色設定

var COLOR_FRAME = "#333333";	// 枠背景色
var COLOR_BASE	= "#654634";	// 拠点リンク色
var COLOR_TITLE = "#FFCC00";	// 各BOXタイトル背景色
var COLOR_BACK	= "#FFF2BB";	// 各BOX背景色

var DomesticFlg = false;

// 造兵用
//				   1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8
var OPT_SOL_MAX = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var OPT_SOL_ADD = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var OPT_BLD_WOOD  = 0;
var OPT_BLD_STONE = 0;
var OPT_BLD_IRON  = 0;
var OPT_BLD_RICE  = 0;
var OPT_BLD_SOL = 0;
var sort_priority = [];
var OPT_BKBG_CHK = 0;
var make_no = [];
				   // 兵種, 	  No, 研究済,作成可能兵数,現在の兵数,最大兵数,現兵数との差,x,y
make_no["剣兵"] 	= ["剣兵"	 ,301,	   0,			0,		   0,		0,			0,0,0];
make_no["槍兵"] 	= ["槍兵"	 ,303,	   0,			0,		   2,		0,			0,0,0];
make_no["弓兵"] 	= ["弓兵"	 ,308,	   0,			0,		   3,		0,			0,0,0];
make_no["騎兵"] 	= ["騎兵"	 ,305,	   0,			0,		   4,		0,			0,0,0];
make_no["矛槍兵"]	= ["矛槍兵"  ,304,	   0,			0,		   9,		0,			0,0,0];
make_no["弩兵"] 	= ["弩兵"	 ,309,	   0,			0,		  10,		0,			0,0,0];
make_no["近衛騎兵"] = ["近衛騎兵",307,	   0,			0,		  11,		0,			0,0,0];
make_no["斥候"] 	= ["斥候"	 ,310,	   0,			0,		   6,		0,			0,0,0];
make_no["斥候騎兵"] = ["斥候騎兵",311,	   0,			0,		  13,		0,			0,0,0];
make_no["衝車"] 	= ["衝車"	 ,312,	   0,			0,		   5,		0,			0,0,0];
make_no["投石機"]	= ["投石機"  ,313,	   0,			0,		  12,		0,			0,0,0];
make_no["大剣兵"]	= ["大剣兵"  ,315,	   0,			0,		   7,		0,			0,0,0]; 		// 2014.01.30
make_no["盾兵"] 	= ["盾兵"	 ,316,	   0,			0,		   1,		0,			0,0,0]; 		// 2014.01.30
make_no["重盾兵"]	= ["重盾兵"  ,317,	   0,			0,		   8,		0,			0,0,0]; 		// 2014.01.30
make_no["戦斧兵"]	= ["戦斧兵"  ,318,	   0,			0,		   8,		0,			0,0,0]; 		// 2019.01.10
make_no["双剣兵"]	= ["双剣兵"  ,319,	   0,			0,		   8,		0,			0,0,0]; 		// 2019.01.10
make_no["大錘兵"]	= ["大錘兵"  ,320,	   0,			0,		   8,		0,			0,0,0]; 		// 2019.01.10

//			 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
OPT_BK_LV = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
OPT_BG_LV = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

//巡回用
var tidMain2;
var tidMain3;
var nextURL;
var nextNAME;
//寄付用
var OPT_RISE_KIFU_MAX = 10000;	//寄付を開始する糧の量
var OPT_RISE_KIFU = 1000;		//寄付をする糧の量

//
//市場用
var OPT_RISE_MAX = 30000;	//市場変換開始する糧の量
var OPT_TO_WOOD = 10000;	//木に変換する糧
var OPT_TO_STONE = 10000;	//石に変換する糧
var OPT_TO_IRON = 10000;	//鉄に変換する糧

// 拠点建設/破棄用@2016.11.23変数化
var VS_BUILD_FAIL	 = 0;
var VS_BUILD_RESERVE = 1;
var VS_BUILD_ING	 = 2;
var VS_BUILD_COMP	 = 3;
var VS_DESTROY_ING	 = 4;
var VS_DESTROY_COMP  = 5;

// @@ ADD 2011.09.28 @@
var LOAD_ROUND_TIME_10 = 10;
var LOAD_ROUND_TIME_20 = 20;
var LOAD_ROUND_TIME_30 = 30;
var LOAD_ROUND_TIME_40 = 40;
var LOAD_ROUND_TIME_50 = 50;
var LOAD_ROUND_TIME_60 = 60;
var LOAD_ROUND_TIME_70 = 70;
var LOAD_ROUND_TIME_80 = 80;
var LOAD_ROUND_TIME_90 = 90;
var LOAD_ROUND_TIME_100 = 100;
var LOAD_ROUND_TIME_110 = 110;
var LOAD_ROUND_TIME_120 = 120;
var LOAD_ROUND_TIME_130 = 130;
var LOAD_ROUND_TIME_140 = 140;
var LOAD_ROUND_TIME_150 = 150;
var LOAD_ROUND_TIME_160 = 160;
var LOAD_ROUND_TIME_170 = 170;
var LOAD_ROUND_TIME_180 = 180;

//グローバル変数
var MOUSE_DRAGGING = false;
var MOUSE_OFFSET_X;
var MOUSE_OFFSET_Y;
var MOUSE_DRAGGING_WINDOW = 0;
var ALERT_TIME;

// @@ ADD 2011.05.14 @@
var OPT_MAX_WOOD = 0;			// 木の最大保持量
var OPT_MAX_STONE = 0;			// 石の最大保持量
var OPT_MAX_IRON = 0;			// 鉄の最大保持量
var WOOD = 101; 				//木の内部コード
var STONE = 102;				//石の内部コード
var IRON = 103; 				//鉄の内部コード
var RICE = 104; 				//糧の内部コード

//新規作成用
var OPT_KATEMURA	= 0;	 // 自動糧村化オプション
var OPT_SHUKUSHA	= 0;	 // 宿舎
var OPT_DAISHUKUSHA	= 0;	 // 大宿舎
var OPT_DORM		= 0;	 // 自動宿舎村化オプション			2013.12.26
var OPT_1112MURA	= 0;	 // ★9(1-1-1-2)水車村オプション
var OPT_0001S3MURA	= 0;	 // ★3(0-0-0-1)水車村オプション
var OPT_0001S5MURA	= 0;	 // ★5(0-0-0-1)水車村オプション
var OPT_0001S7MURA	= 0;	 // ★7(0-0-0-1)水車村オプション
var OPT_0000S8MURA	= 0;	 // ★8(0-0-0-0)水車村オプション@10期～
var OPT_1111S4MURA	= 0;	 // ★4(1-1-1-1)資源+水車村オプション@10期？～
var OPT_0000S6MURA	= 0;	 // ★6(0-0-0-0)水車村オプション@10期？～
var OPT_PLANT5MURAN	= 0;	 // ★5工場村オプション
var OPT_PLANT5MURAE	= 0;	 // ★5工場村オプション
var OPT_PLANT5MURAW	= 0;	 // ★5工場村オプション
var OPT_PLANT5MURAS	= 0;	 // ★5工場村オプション
var OPT_PLANT9MURA74  = 0;	 // ★9(7-4)工場村オプション

var OPT_REMOVE = 0; // 施設削除オプション 2015.05.10

//内政用 by nottisan
//								  1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 3 3 3 3 3 3 3 3 3 3 4
//				1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0
var OPT_DOME = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var OPT_BLD = "AC";
var OPT_SorH = "DD";
var OPT_MAX = 3;
var OPT_MAXLV = 6;
var OPT_ROUND_TIME1 = 180;	// 巡回時間(sec)
var OPT_ROUND_TIME2 = 10;	// 巡回時間(sec)
var Reload_Flg = 0;
var OPT_BUILD_VID;


//グローバル変数
var INTERVAL  = 2000; // + Math.floor( Math.random() * 5000 );			// 負荷対策 回線速度によっては正常動作しない時があります。その際は数値を増やしてください。1秒=1000
var HOST = location.hostname; //アクセスURLホスト
var PGNAME = "_Auto_Bilder_5zen_v1.21_20140220"; //グリモン領域への保存時のPGの名前
var TIMEOUT_URL ="/false/login_sessionout.php"; //タイムアウト時のURLの一部
var g_MD="";

var SENDTFLG_TIMEOUT = 0;		//タイムアウト画面
var SENDTFLG_LOGIN_MENU = 1;	//ログイン画面
var SENDTFLG_LOGIN = 2; 		//ログイン中
var d = document;

// 保存データデリミタ
var DELIMIT1 = "#$%";
var DELIMIT2 = "&?@";
var DELIMIT3 = "{=]";
var DELIMIT4 = "|-/";

//保存データインデックス（拠点）
var IDX_XY = 0; //座標
var IDX_BASE_NAME = 1; //拠点名
var IDX_URL = 2; //拠点URL
var IDX_ACTIONS = 3; //実行中作業
var IDX_BASE_ID = 11; //拠点ID

//保存データインデックス（実行中作業）
var IDX2_STATUS = 0; //ステータス
var IDX2_TIME = 1; //完了時刻
var IDX2_TYPE = 2; //種別 C:都市画面、D:内政スキル、Fxy:施設座標
var IDX2_ALERTED = 3; //通知済フラグ
var IDX2_DELETE = 4; // 削除フラグ
var IDX2_ROTATION = 5; // 巡回フラグ


//作業種別
var TYPE_CONSTRUCTION = "C"; //建設
var TYPE_MARCH = "M"; //行軍
var TYPE_DOMESTIC = "D"; //内政
var TYPE_FACILITY = "F"; //施設

var TYPE_DELETE = "B"; //建設

var OPT_CHKBOX_AVC = 0;
//						拠 木 石 鉄 畑 倉 雀 武 防 練 槍 弓 騎 宿 車 市 訓 水 工 研 大 遠 見 平 斧 双 錘
//						点			   庫	 器 具 兵 兵 兵 兵 舎 兵 場 練 車 場 究 宿 征 張 地 兵 兵 兵
//						 1	2  3  4  5	6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27
var OPT_CHKBOX		 = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var OPT_CHKBOXLV	 = [ 8,15,15,15,15,20,10,10,10,10,15,15,15,15,15,10,10,10,10,10,20,20,20, 0,15,15,15];
var OPT_RM_CHKBOX	 = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; //削除する施設 2015.05.10
var OPT_RM_CHKBOXLV  = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; //残す数 2015.05.10
var OPT_MAX_LV = "2";
var OPT_FUC_NAME = ["拠点","伐採所","石切り場","製鉄所","畑","倉庫",
					"銅雀台","鍛冶場","防具工場","練兵所","兵舎","弓兵舎",
					"厩舎","宿舎","兵器工房","市場","訓練所","水車","工場",
					"研究所","大宿舎","遠征訓練所","見張り台","平地",
					"斧兵舎","双兵舎","錘兵舎"];

var OPT_FNID = new Array();
OPT_FNID["拠点"] =		 0	 ;
OPT_FNID["伐採所"] =	 1	 ;
OPT_FNID["石切り場"] =	 2	 ;
OPT_FNID["製鉄所"] =	 3	 ;
OPT_FNID["畑"] =		 4	 ;
OPT_FNID["倉庫"] =		 5	 ;
OPT_FNID["銅雀台"] =	 6	 ;
OPT_FNID["鍛冶場"] =	 7	 ;
OPT_FNID["防具工場"] =	 8	 ;
OPT_FNID["練兵所"] =	 9	 ;
OPT_FNID["兵舎"] =		 10 	 ;
OPT_FNID["弓兵舎"] =	 11 	 ;
OPT_FNID["厩舎"] =		 12 	 ;
OPT_FNID["宿舎"] =		 13 	 ;
OPT_FNID["兵器工房"] =	 14 	 ;
OPT_FNID["市場"] =		 15 	 ;
OPT_FNID["訓練所"] =	 16 	 ;
OPT_FNID["水車"] =		 17 	 ;
OPT_FNID["工場"] =		 18 	 ;
OPT_FNID["研究所"] =	 19 	 ;
OPT_FNID["大宿舎"] =	 20 	 ;
OPT_FNID["遠征訓練所"] = 21 	 ;
OPT_FNID["見張り台"] =	 22 	 ;
//OPT_FNID["修行所"] =	   23	 ;
OPT_FNID["斧兵舎"] =	 24 	 ;
OPT_FNID["双兵舎"] =	 25 	 ;
OPT_FNID["錘兵舎"] =	 26 	 ;

//市場変換処理用
var OPT_ICHIBA = 0;
var OPT_ICHIBA_PA = 0;
var OPT_ICHIBA_PATS = ["平均的に変換","一括変換","スマート変換","余剰分を変換"];
						 //   1  2	 3	 4	 5	 6	 7	 8	 9	10
var OPT_ICHIBA_LV_TABLE = [0,.4,.42,.44,.46,.48,.50,.52,.54,.56,.6]; // 変換料率

//自動寄付用
var OPT_KIFU = 0;

var d = document;
var $ = function(id) { return d.getElementById(id); };
var $x = function(xp,dc) { return d.evaluate(xp, dc||d, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; };
var $a = function(xp,dc) { var r = d.evaluate(xp, dc||d, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null); var a=[]; for(var i=0; i<r.snapshotLength; i++){ a.push(r.snapshotItem(i)); } return a; };
var $e = function(e,t,f) { if (!e) return; e.addEventListener(t, f, false); };
var $v = function(key) { return d.evaluate(key, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null); };		// 2013.12.18

//LvUPリンク
var LVUPLINK = "http://SITE/facility/build.php?x=urlX&y=urlY&village_id=viID&ssid=ssid_val#ptop";
var URL_SITE = "SITE";
var URL_X = "urlX";
var URL_Y = "urlY";
var URL_viID = "viID";
var URL_viSSID = "ssid_val";

//新規作成リンク
var CREATELINK = "http://SITE/facility/build.php?id=fID&x=urlX&y=urlY&village_id=viID&ssid=ssid_val";
var URL_fID 	= "fID"; //建物のID
var HATAKE		= 215;
var SOUKO		= 233;
var SUZUME		= 216;
var SYUKUSYA	= 242;	// 宿舎 	2013.12.26
var RENPEIJYO	= 234;	// 練兵所	2013.12.26
var KAZIBA		= 232;	// 鍛冶場	2013.12.26

var FACLINK = "http://SITE/facility/facility.php?x=urlX&y=urlY";
var VILLAGELINK = "http://SITE/village.php#ptop";
// 2012.04.10
var LANDLINK = "http://SITE/land.php?x=urlX&y=urlY";
var SETTLELINK = "http://SITE/facility/select_type.php?x=urlX&y=urlY&mode=build&type=fID";

var VillageData = new Array();
var OPT_VILLAGE = new Array();

var isMixi = true;

// ＠＠　ここから　＠＠
var DASkill = [ "■■■■",
				"伐採知識","伐採技術","弓兵増強",
				"石切知識","石切技術","槍兵増強",
				"製鉄知識","製鉄技術","騎兵増強",
				"食糧知識","食糧技術",
				"農林知識","農林技術",
				"加工知識","加工技術",
				"富国","富国論","富国強兵",
				"豊穣","美玉歌舞",
				"恵風","人選眼力",
				"呉の治世","王佐の才",
				"練兵訓練","練兵修練",//25,26 removed @2016.12.30
				"兵舎訓練","兵舎修練",//27,28 removed @2016.12.30
				"弓兵訓練","弓兵修練",//29,30 removed @2016.12.30
				"厩舎訓練","厩舎修練",//31,32 removed @2016.12.30
				"兵器訓練","兵器修練",//33,34 removed @2016.12.30
				"強兵の檄文","攻城の檄文",//35,36 removed @2016.12.30
				"豊潤祈祷",//37
				"食糧革命","陳留王政"//38,39
];
// ＠＠　ここまで　＠＠

// 屯田機能用
var URL_PARAM = {};

// 市場変換用
var ShopURL = "";
var ShopFlg = false;

var DBG_Flg = false;

//Main
(function(){

	// zIndex(重なり順序）の修正
	q$("div#status div#status_left").css({"z-index":"0"});
	q$("#menu_container").css({"z-index":"980"});
	q$("div#map-scroll").css({"z-index":"150"});
	q$("a#cur01, a#cur02, a#cur03, a#cur04, a#double-cur01, a#double-cur02, a#double-cur03, a#double-cur04").css({"z-index":"460"});

	initUrlParams();

	var mixi_ad_head = xpath('//div[@ID="mixi_ad_head"]', document);
	if (mixi_ad_head.snapshotLength) {
		mixi_ad_head.snapshotItem(0).style.display = "none";
	}

	var mixi_ad_groups = xpath('//div[@ID="mixi_ad_groups"]', document);
	if (mixi_ad_groups.snapshotLength) {
		mixi_ad_groups.snapshotItem(0).style.display = "none";
	}
	var mixi_ad_news = xpath('//div[@class="brNews"]', document);
	if (mixi_ad_news.snapshotLength) {
		mixi_ad_news.snapshotItem(0).style.display = "none";
	}

	addOpenLinkHtml();
	if ( getStayMode() ) {
		closeIniBilderBox();
		openIniBilderBox();
	}
	// =============================================================================================

	//領地画面なら拠点建設データ取得
	if( location.pathname == "/land.php" && URL_PARAM.x && URL_PARAM.y ) {
		getAddingVillage(document.body);
	}

	//拠点画面なら拠点削除データ取得
	if( location.pathname == "/facility/castle.php" ) {
		getDeletingVillage(document.body);
	}

	//バグ回避 300000=5*60*1000
	// 領地画面や建築画面で停止した場合の処理
	// ５分間止まっていた場合拠点画面に移動する
	if(location.pathname == "/land.php" || location.pathname == "/facility/facility.php") {
		setTimeout(function(){location.href = "http://"+HOST+"/village.php";},300000);
	}
	// =============================================================================================
	//君主プロフィール画面なら都市画面URLを取得
	if ((location.pathname == "/user/" || location.pathname == "/user/index.php") &&
		getParameter("user_id") == "") {
		getUserProf(document);
		if ( getStayMode() ) {
			closeIniBilderBox();
			openIniBilderBox();
		}
	}
	OPT_BUILD_VID = GM_getValue(HOST+PGNAME+"OPT_BUILD_VID" , "" );

	// 歴史書モードの場合は以降の処理を実行しない
	var historyMode = document.evaluate('//img[@alt="歴史書"]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	if (historyMode.snapshotLength){
		return;
	}

	if (location.pathname == "/village.php") {

		var vID = "";
		//座標を取得
		q$("#basepoint span[class=xy]").text().match(/(\([-]*\d+,[-]*\d+\))/);
		vId = RegExp.$1;
		Load_OPT(vId);
		if (OPT_BUILD_VID != getVillageID(vId)) {
			GM_setValue(HOST+PGNAME+"OPT_BUILD_VID" , "" );
			OPT_BUILD_VID = "";
		}
		getVillageActions();			// 建築情報の取得
		checkVillageLength();			// 拠点数チェック 2012.04.09
		settleVillages(0);				// 自動拠点作成 2012.04.09

		//拠点画面なら対象建築物の建築チェック
		var villages = loadVillages(HOST+PGNAME);
		for(var i=0; i<villages.length;i++){
			var tChk1 = GM_getValue(HOST+PGNAME+"OPT_CHKBOX_AVC_"+i, true);
			if ( getVillageID(vId) == getParameter2(villages[i][IDX_URL], "village_id") ){
				break;
			}
		}

		// 拠点にチェックがある場合建設処理を行う
		if (tChk1){
			Auto_Domestic();			// 自動内政処理 by nottisan
		} else {
			ichibaChange(vId);			// 市場処理
			autoDonate();				// 自動寄付処理
		}
		// 研究所情報取得
		var area = new Array();
		area = get_area();

		var _x = -1;
		var _y = -1;
		var _lv = -1;
		for (var i=0;i<area.length;i++){
			if (area[i].name == "研究所") {
				var Temp = area[i].xy.split(",");
				_x = Temp[0];
				_y = Temp[1];
				_lv = area[i].lv;
			}
		}

		// 巡回時間が読み込めていないタイミングがあるようなのでここで再読み込み (thx>ぼっち
		loadRoundTime();

		if ( _x < 0 ) {
			// 内政スキルチェック
			var nText = document.evaluate('//*[@class="base-skill"]/span/a', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			var nName = nText.snapshotItem(0).innerHTML.split(":");
			if (nName[0].length != 12) {
				// 内政武将がセットされている場合
				// alert("内政武将は " + nName[0].trim() + " です");
				q$.get("http://"+HOST+"/card/domestic_setting.php#ptop",function(x){
					var htmldoc = document.createElement("html");
						htmldoc.innerHTML = x;
					getDomesticSkill(htmldoc);		// 内政スキル使用チェック
					forwardNextVillage();			// 次の拠点へ移動
				});
			} else {
				// 内政武将がセットされていない場合
				var data = getMyVillage();
				data[IDX_ACTIONS] = new Array();
				saveVillage(data, TYPE_DOMESTIC);
				if ( getStayMode() ) {
					closeIniBilderBox();
					openIniBilderBox();
				}
				forwardNextVillage();						// 次の拠点へ移動
			}
		} else {
			try {
				// 研究所チェック
				q$.get("http://"+HOST+"/facility/facility.php?x=" + _x + "&y=" + _y ,function(x){
					var htmldoc = document.createElement("html");
						htmldoc.innerHTML = x;
					getTrainingSoldier(htmldoc);

					// 内政スキルチェック
					var nText = document.evaluate('//*[@class="base-skill"]/span/a', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
					var nName = nText.snapshotItem(0).innerHTML.split(":");
					if (nName[0].length != 12) {
						// 内政武将がセットされている場合
						// alert("内政武将は " + nName[0].trim() + " です");
						q$.get("http://"+HOST+"/card/domestic_setting.php#ptop",function(x){
							var htmldoc = document.createElement("html");
								htmldoc.innerHTML = x;
							getDomesticSkill(htmldoc);		// 内政スキル使用チェック
							forwardNextVillage();			// 次の拠点へ移動
						});
					} else {
						// 内政武将がセットされていない場合
						var data = getMyVillage();
						data[IDX_ACTIONS] = new Array();
						saveVillage(data, TYPE_DOMESTIC);
						if ( getStayMode() ) {
							closeIniBilderBox();
							openIniBilderBox();
						}
						forwardNextVillage();						// 次の拠点へ移動
					}
				});
			}catch(e) {
				// エラーが発生した場合次の拠点へ移動
				forwardNextVillage();						// 次の拠点へ移動
			}
		}
	}

	//兵士作成画面なら作成中兵士を取得
	if (location.pathname == "/facility/facility.php") {

		//var actionType = TYPE_FACILITY + getParameter("x") + getParameter("y");

		q$.get("http://"+HOST+"/facility/facility.php?x=" + getParameter("x") + "&y=" + getParameter("y") + "#ptop",function(x){
			var htmldoc = document.createElement("html");
				htmldoc.innerHTML = x;
			getTrainingSoldier(htmldoc);
			if ( getStayMode() ) {
				closeIniBilderBox();
				openIniBilderBox();
			}
		});

	}

})();

function log() { console.log.apply(console, Array.slice(arguments)); }

function debugLog( mes ) {	if (DEBUG) { console.log(mes); }	}

// ===========================================================================================================

//URL読み込み
function initUrlParams() {
	var matches = location.search.match(/(?:\?|&)?([^=]+)(?:=([^&]+))?/g);
	if (matches) {
		var param;
		var key;
		var data;
		for(var i = 0 ; i < matches.length ; i++) {
			param = matches[i].match(/(?:\?|&)?([^=]+)(?:=([^&]+))?/);
			key = param[1];
			data = param[2];

			URL_PARAM[key] = '';
			if( param.length == 3 && typeof data == 'string') {
				URL_PARAM[key] = decodeURIComponent(data);

				// session id
				if (key.toLowerCase() == 'ssid') {
					SID = key + '=' +data;
				}
			}
		}
	}
}

//拠点作成開始
function settleVillages(z){
	//新規拠点作成に必要な名声があれば拠点作成
	if ( checkFame() ){
		//予約データ取得
		var lists = cloadData(HOST+"ReserveList", "[]", true, true);
		if( lists.length == 0 || z >= lists.length) {return;}
		if( lists[z].status != VS_BUILD_RESERVE && lists[z].status != VS_BUILD_FAIL) {settleVillages(z+1);return;}
		var mURL = LANDLINK;
		mURL = mURL.replace(URL_SITE,HOST);
		mURL = mURL.replace(URL_X,lists[z].x);
		mURL = mURL.replace(URL_Y,lists[z].y);
		var tid=setTimeout(function(){
			GM_xmlhttpRequest({
				method:"GET",
				url:mURL,
				headers:{"Content-type":"text/html"},
				overrideMimeType:'text/html; charset=utf-8',
				onload:function(x){
					var htmldoc = document.createElement("html");
					htmldoc.innerHTML = x.responseText;
					//拠点を作成できるかチェック
					var rmtime = htmldoc.innerHTML.match(/この領地を拠点にする/);
					if ( rmtime ) { //拠点を作成できる場合作成開始
						var mURL = SETTLELINK;
						mURL = mURL.replace(URL_SITE,HOST);
						mURL = mURL.replace(URL_X,lists[z].x);
						mURL = mURL.replace(URL_Y,lists[z].y);
						mURL = mURL.replace(URL_fID,lists[z].kind);
						var tid=setTimeout(function(){
							GM_xmlhttpRequest({
								method:"GET",
								url:mURL,
								headers:{"Content-type":"text/html"},
								overrideMimeType:'text/html; charset=utf-8',
								onload:function(x){
									var htmldoc = document.createElement("html");
									htmldoc.innerHTML = x.responseText;
									//拠点が作成開始できているか確認
									if (!htmldoc.innerHTML.match(/名声が不足しています/)) {
										getAddingVillage(htmldoc);
										if ( getStayMode() ) {
											closeIniBilderBox();
											openIniBilderBox();
										}
									}
								}
							});
						}, INTERVAL);
					} else {
						failSettleVillage(z);
						settleVillages(z+1);
					}
				}
			});
		}, INTERVAL);
	}

	//名声チェック
	function checkFame() {

		//現在の名声MAX取得
		var fameMAX;

		// 2014.08.20 ここから
		fameMAX = 0;
		try {
			var fameText = $x('id("status_left")/img[contains(@src,"ico_fame.gif")]').nextSibling;
			if( fameText ) {
			var tmp = fameText.nodeValue.match(/\s*(\d+)\s*\/\s*(\d+)/);
			fameMAX = parseInt(tmp[2],10);
			}
		} catch(e) {
			// やばげ鯖用例外処理
			var fameText = q$("#status_resources_point table[class='resource_tables'] tr").eq(1).children("td").eq(1).text().replace(/\s+/g, "");
			if( fameText ) {
			var tmp = fameText.match(/(\d+)\/(\d+)/);
			fameMAX = parseInt(tmp[2],10);
			}
		}
		// 2014.08.20 ここまで

		//作成中の拠点の数
		var lists = cloadData(HOST+"ReserveList", "[]", true, true);
		var x = 0;
		for (var i=0 ; i<lists.length ; i++) {
			if(lists[i].status == VS_BUILD_ING){x++;}
		}

		var tmp = q$(".villageInfo").text().match(/(\d+)\/(\d+)/);
		if (tmp && tmp.length >= 3) {
	  		// 現在の拠点の数
	  		var villageLength = parseInt(tmp[1], 10);

	  		// 建設可能上限数
	  		var maxLength = parseInt(tmp[2], 10);

			return (villageLength + x) < maxLength;
		}
		else {
			//拠点作成に必要な名声
			var bldtbl = [17, 35, 54, 80, 112, 150, 195, 248, 310, 1000];

			//現在の拠点の数
			var villageLength = $a('//ul/li/a[contains(@href,"/village_change.php?village_id")]').length; //拠点数－１になる

			return (fameMAX >= bldtbl[villageLength + x]);
		}
	}

	function failSettleVillage(z) {
		var lists = cloadData(HOST+"ReserveList", "[]", true, true);
		if (lists[z].status == VS_BUILD_RESERVE) { lists[z].status = VS_BUILD_FAIL;}
		csaveData(HOST+"ReserveList", lists, true, true );
	}
}


// 拠点数の保存情報と現状を比較＆修正 2012.04.09
function checkVillageLength() {
		//データ整理
	var lists = cloadData(HOST+"ReserveList", "[]", true, true);
	lists = checkList(lists);		//時間の過ぎたものを削除


	//予定時刻を過ぎていたら新規拠点情報を取得
	function checkList(lists)
	{
		//時刻チェック
		var dt = new Date();
		var ntime = dt.getFullYear() + "-" +
			(dt.getMonth()+101).toString().substr(-2) + "-" +
			(dt.getDate()+100).toString().substr(-2) + " " +
			(dt.getHours()+100).toString().substr(-2)  + ":" +
			(dt.getMinutes()+100).toString().substr(-2)  + ":" +
			(dt.getSeconds()+100).toString().substr(-2);
		//リストのデータを書き換え
		var flg = 0;
		for(var i=0 ; i<lists.length ; i++) {
			if( lists[i].time < ntime ) {
				if( lists[i].status == VS_DESTROY_ING ) { lists[i].status = VS_DESTROY_COMP; flg = 1;} //破棄 -> 破棄完了
				if( lists[i].status == VS_BUILD_ING   ) { lists[i].status = VS_BUILD_COMP;	 flg = 1;} //作成 -> 作成完了
			}
		}
		csaveData(HOST+"ReserveList", lists, true, true );
		//拠点情報を取得＆移動
		if (flg == 1){
			getUserProfJumpNewVillage();
		} else {
			checkVillageLengthDiff();
		}
		return lists;
	}

	function getUserProfJumpNewVillage(){
		var tid=setTimeout(function(){
			GM_xmlhttpRequest({
				method:"GET",
				url:"http://" + HOST + "/user/",
				headers:{"Content-type":"text/html"},
				overrideMimeType:'text/html; charset=utf-8',
				onload:function(x){
					var htmldoc = document.createElement("html");
					htmldoc.innerHTML = x.responseText;
					//拠点リストを更新
					getUserProf(htmldoc);
					if ( getStayMode() ) {
						closeIniBilderBox();
						openIniBilderBox();
					}
					//本拠地に強制ジャンプ
					var villages = loadVillages(HOST+PGNAME);
					var tid=setTimeout(function(){
						location.href = villages[0][IDX_URL];},INTERVAL);
					//新規拠点に移動
					//jumpNewVillage();
				}
			});
		}, INTERVAL);

		//新規拠点画面へ移動
/*
		function jumpNewVillage(){
			var villages = loadVillages(HOST+PGNAME);
			for (var j = villages.length-1; j >= 0; j--) {
				//新規と名のつく拠点へ移動
				if(villages[j][IDX_BASE_NAME].match(/新規/)){
					var tid=setTimeout(function(){
						location.href = villages[j][IDX_URL];},INTERVAL);
					return;
				}
			}
		}
*/
	}

	//拠点数が変わっていたら情報取得 @@1@@
	function checkVillageLengthDiff() {

debugLog("=== Start checkVillageLengthDiff ===");

		var villages = loadVillages(HOST+PGNAME);
//		var villageLength = document.evaluate('//div[@id="lodgment"]/div/ul/li', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null); //拠点数

		// 2012.04.25 本鯖対応
		var villageLength = $a('//ul/li/a[contains(@href,"/village_change.php?village_id")]').length + 1; //拠点数

		//if (villages.length != villageLength.snapshotLength) {
		if (villages.length != villageLength) {
			setTimeout(function(){
				GM_xmlhttpRequest({
					method:"GET",
					url:"http://" + HOST + "/user/",
					headers:{"Content-type":"text/html"},
					overrideMimeType:'text/html; charset=utf-8',
					onload:function(x){
						var htmldoc = document.createElement("html");
							htmldoc.innerHTML = x.responseText;
						getUserProf(htmldoc);
						if ( getStayMode() ) {
							closeIniBilderBox();
							openIniBilderBox();
						}
						var tid=setTimeout(function(){location.reload();},INTERVAL);
					}
				});
			}, INTERVAL);
		}
	}
}

//Beyond系save, load関数
function csaveData(key, value, local, ev)
{
	if( local ) key = location.hostname + key  + PGNAME;
	if( ev ) {
		if (window.opera || typeof JSON != 'object') {
			value = toJSON(value);
		}
		else {
			value = JSON.stringify( value );
		}
	}
	GM_setValue(key, value );
}

function cloadData(key, value, local, ev)
{
	if( local ) key = location.hostname + key  + PGNAME;
	var ret = GM_getValue(key, value);

	if (window.chrome) { // 2015.05.23
		return ev ? eval(eval('ret='+ret)) : ret;
	} else {
		return ev ? eval('ret='+ret) : ret;
	}
}

//-----------------------------------TonDen---------------------------------
//領地画面なら拠点建設データ取得
function getAddingVillage(htmldoc) {

	q$("#basepoint span[class=xy]").text().match(/([-]*\d+),([-]*\d+)/);
	var x = RegExp.$1;
	var y = RegExp.$2;

	var rmname = htmldoc.innerHTML.match(/(現在村を建設中です|現在砦を建設中です)/ );
	if( rmname ) {
		var rmtime = htmldoc.innerHTML.match(/(\d+-\d+-\d+ \d+:\d+:\d+)*に完了します。/ );
		if( rmname[1] == "現在村を建設中です" ) {
			addList(rmtime[1], 220, VS_BUILD_ING, x, y );
		}else if( rmname[1] == "現在砦を建設中です" ) {
			addList(rmtime[1], 222, VS_BUILD_ING, x, y );
		}
	}

	if(htmldoc == document.body) {
//		addLink();
		addLink2();
	}

	function addList(tim, kind, status, x, y)
	{
		var lists = cloadData(HOST+"ReserveList", "[]", true, true);

		var flg = 0;
		for(var i=0 ; i<lists.length ; i++) {
			if(lists[i].x == x && lists[i].y == y ) {
				lists[i].time = tim;
				lists[i].kind = kind;
				lists[i].status = status;
				flg = 1;
			}
		}
		if(flg == 0) {
			lists.push({"x":x, "y":y, "time":tim, "kind":kind, "status":status });
		}
		lists.sort( function(a,b){
			if(a.time > b.time) return 1;
			if(a.time < b.time) return -1;
			return 0;});

		csaveData(HOST+"ReserveList", lists, true, true );
	}

	function addLink() {

		//id="tMenu"にLinkを挿入
		var tMenu = document.evaluate('//*[@id="tMenu"]',
			htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if (tMenu.snapshotLength == 0) return;

		//村作成予約
		var villageLink = document.createElement("a");
		villageLink.id = "village";
		villageLink.href = "javascript:void(0);";
		villageLink.innerHTML = "村建設予約";
		villageLink.addEventListener("click", function() {addReserveVillages(220);}, true);
		tMenu.snapshotItem(0).appendChild(villageLink);

		//砦作成予約
		var fortLink = document.createElement("a");
		fortLink.id = "fort";
		fortLink.href = "javascript:void(0);";
		fortLink.innerHTML = "砦建設予約";
		fortLink.addEventListener("click", function() {addReserveVillages(222);}, true);
		tMenu.snapshotItem(0).appendChild(fortLink);

	}

	function addLink2() {

		//id="tMenu"にLinkを挿入
		var tMenu = document.evaluate('//div[@class="status"]',
			document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if (tMenu.snapshotLength == 0) {
			var tMenu = document.evaluate('//div[@id="basepoint"]',
				document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			if (tMenu.snapshotLength == 0) return;
		}

		var villageLink = document.createElement("span");
		villageLink.style.color = "white";
		villageLink.style.fontSize = "10px";
		villageLink.style.textAlign = "center";
		villageLink.innerHTML = "建設予約  ";
		tMenu.snapshotItem(0).appendChild(villageLink);

		//村作成予約
		var villageLink = document.createElement("a");
		villageLink.id = "village";
		villageLink.style.color = "white";
		villageLink.style.fontSize = "10px";
		villageLink.style.textAlign = "center";
		villageLink.href = "javascript:void(0);";
		villageLink.innerHTML = "村";
		villageLink.addEventListener("click", function() {addReserveVillages(220);}, true);
		tMenu.snapshotItem(0).appendChild(villageLink);

		var villageLink = document.createElement("span");
		villageLink.style.color = "white";
		villageLink.style.fontSize = "10px";
		villageLink.style.textAlign = "center";
		villageLink.innerHTML = "  ";
		tMenu.snapshotItem(0).appendChild(villageLink);

		//砦作成予約
		var fortLink = document.createElement("a");
		fortLink.id = "fort";
		fortLink.style.color = "white";
		fortLink.style.fontSize = "10px";
		fortLink.style.textAlign = "center";
		fortLink.href = "javascript:void(0);";
		fortLink.innerHTML = "砦";
		fortLink.addEventListener("click", function() {addReserveVillages(222);}, true);
		tMenu.snapshotItem(0).appendChild(fortLink);

	}

	function addReserveVillages(kind) {
		url = location;
		var flgAdd = addList2(kind, 1, URL_PARAM.x, URL_PARAM.y);
		var msg = "";
		if (flgAdd == 0){
			msg += "(" + URL_PARAM.x + "," + URL_PARAM.y + ")への、";
				  if(kind == 220){msg += "村建設予約";
			}else if(kind == 222){msg += "砦建設予約";
			}
			msg += "を受け付けました。";
		} else {
			msg += "(" + URL_PARAM.x + "," + URL_PARAM.y + ")には、すでに建設予約があります。";
		}
		alert(msg);
		if ( getStayMode() ) {
			closeIniBilderBox();
			openIniBilderBox();
		}
	}

	function addList2(kind, status, x, y) //kind=220:村予約 222:砦予約
	{
		var lists = cloadData(HOST+"ReserveList", "[]", true, true);

		var dt = new Date();
		var ntime = dt.getFullYear() + "-" +
			(dt.getMonth()+101).toString().substr(-2) + "-" +
			(dt.getDate()+100).toString().substr(-2) + " " +
			(dt.getHours()+100).toString().substr(-2)  + ":" +
			(dt.getMinutes()+100).toString().substr(-2)  + ":" +
			(dt.getSeconds()+100).toString().substr(-2);

		for(var i=0 ; i<lists.length ; i++) {
			if(lists[i].x == x && lists[i].y == y ) {
				return;
			}
		}
		lists.push({"x":x, "y":y, "time":ntime, "kind":kind, "status":status });
		lists.sort( function(a,b){
			if(a.time > b.time) return 1;
			if(a.time < b.time) return -1;
			return 0;});

		csaveData(HOST+"ReserveList", lists, true, true );

		return 0;
	}

}

//拠点画面で建設予約受付
function addLinkTondenVillage() {

	q$("span[class=xy]").text().match(/([-]*\d+),([-]*\d+)/);
	var x = RegExp.$1;
	var y = RegExp.$2;

	addLink();

	function addLink() {

		//id="tMenu"にLinkを挿入
		var tMenu = document.evaluate('//div[@class="status village-bottom"]',
			document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if (tMenu.snapshotLength == 0) return;

		var villageLink = document.createElement("span");
		villageLink.innerHTML = " 建設予約  ";
		tMenu.snapshotItem(0).appendChild(villageLink);

		//村作成予約
		var villageLink = document.createElement("a");
		villageLink.id = "village";
		villageLink.href = "javascript:void(0);";
		villageLink.innerHTML = "村";
		villageLink.addEventListener("click", function() {addReserveVillages(220);}, true);
		tMenu.snapshotItem(0).appendChild(villageLink);

		var villageLink = document.createElement("span");
		villageLink.innerHTML = "  ";
		tMenu.snapshotItem(0).appendChild(villageLink);

		//砦作成予約
		var fortLink = document.createElement("a");
		fortLink.id = "fort";
		fortLink.href = "javascript:void(0);";
		fortLink.innerHTML = "砦";
		fortLink.addEventListener("click", function() {addReserveVillages(222);}, true);
		tMenu.snapshotItem(0).appendChild(fortLink);

	}

	function addReserveVillages(kind) {
		url = location;
		var flgAdd = addList2(kind, 1, x, y);
		var msg = "";
		if (flgAdd == 0){
			msg += "(" + x + "," + y + ")への、";
				  if(kind == 220){msg += "村建設予約";
			}else if(kind == 222){msg += "砦建設予約";
			}
			msg += "を受け付けました。";
		} else {
			msg += "(" + x + "," + y + ")には、すでに建設予約があります。";
		}
		alert(msg);
		if ( getStayMode() ) {
			closeIniBilderBox();
			openIniBilderBox();
		}
	}

	function addList2(kind, status, x, y) //kind=220:村予約 222:砦予約
	{
		var lists = cloadData(HOST+"ReserveList", "[]", true, true);

		var dt = new Date();
		var ntime = dt.getFullYear() + "-" +
			(dt.getMonth()+101).toString().substr(-2) + "-" +
			(dt.getDate()+100).toString().substr(-2) + " " +
			(dt.getHours()+100).toString().substr(-2)  + ":" +
			(dt.getMinutes()+100).toString().substr(-2)  + ":" +
			(dt.getSeconds()+100).toString().substr(-2);

		for(var i=0 ; i<lists.length ; i++) {
			if(lists[i].x == x && lists[i].y == y && (lists[i].status == VS_BUILD_FAIL || lists[i].status == VS_BUILD_RESERVE)) {
				return;
			}
		}
		lists.push({"x":x, "y":y, "time":ntime, "kind":kind, "status":status });
		lists.sort( function(a,b){
			if(a.time > b.time) return 1;
			if(a.time < b.time) return -1;
			return 0;});

		csaveData(HOST+"ReserveList", lists, true, true );

		return 0;
	}

}

//拠点画面なら拠点削除データ取得
function getDeletingVillage(htmldoc) {
	var xy = getMyXY();
	var Temp = xy.split(",");
	var x = Temp[0];
	var y = Temp[1];

	var rmtime = htmldoc.innerHTML.match(/(村を削除中です。|砦を削除中です。)[^\d]*(\d+-\d+-\d+ \d+:\d+:\d+)に完了します。/);
	if( rmtime ) {
		if( rmtime[1] == "村を削除中です。" ) {
			addList(rmtime[2], 220, DESTROY_ING, x, y );
		}else if( rmtime[1] == "砦を削除中です。" ) {
			addList(rmtime[2], 222, DESTROY_ING, x, y );
		}
	}else{
		delList(1, x, y);
	}
	if ( getStayMode() ) {
		closeIniBilderBox();
		openIniBilderBox();
	}

	function addList(tim, kind, status, x, y)
	{
		var lists = cloadData(HOST+"ReserveList", "[]", true, true);

		var flg = 0;
		for(var i=0 ; i<lists.length ; i++) {
			if(lists[i].x == x && lists[i].y == y && (lists[i].status != VS_BUILD_FAIL && lists[i].status != VS_BUILD_RESERVE && lists[i].status != VS_BUILD_ING)) {
				lists[i].time = tim;
				lists[i].kind = kind;
				lists[i].status = status;
				flg = 1;
			}
		}
		if(flg == 0) {
			lists.push({"x":x, "y":y, "time":tim, "kind":kind, "status":status });
		}
		lists.sort( function(a,b){
			if(a.time > b.time) return 1;
			if(a.time < b.time) return -1;
			return 0;});

		csaveData(HOST+"ReserveList", lists, true, true );
	}

	function delList(kind, x, y) //kind=0:land 1:castle
	{
		var lists = cloadData(HOST+"ReserveList", "[]", true, true);

		for(var i=0 ; i<lists.length ; i++) {
			if(lists[i].x == x && lists[i].y == y ) {
				if( lists[i].status == VS_DESTROY_ING && kind == 1 ) {
					lists.splice(i,1);
					csaveData(HOST+"ReserveList", lists, true, true );
					break;
				}
			}
		}
	}

}

// =================================================================================================

function DeleteFacility(_x,_y){
	var tid=setTimeout(function(){
		var mURL = FACLINK;
		mURL = mURL.replace(URL_SITE,HOST);
		mURL = mURL.replace(URL_X,_x);
		mURL = mURL.replace(URL_Y,_y);
		GM_xmlhttpRequest({
			method:"GET",
			url: mURL,
			headers:{"Content-type":"text/html"},
			overrideMimeType:'text/html; charset=utf-8',
			onload:function(x){
				var htmldoc = document.createElement("html");
					htmldoc.innerHTML = x.responseText;
				var tables = document.evaluate('//*[@name="ssid"]',htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				var ssid=tables.snapshotItem(0).value;

				var c={};
				c['x'] = parseInt(_x,10);
				c['y'] = parseInt(_y,10);
				c['ssid']=tables.snapshotItem(0).value;
				c['remove']="%E5%BB%BA%E7%89%A9%E3%82%92%E5%A3%8A%E3%81%99";
				q$.post("http://"+HOST+"/facility/facility.php?x=" + _x + "&y=" + _y + "#ptop",c,function(){});
				var tid=setTimeout(function(){location.reload(false);},INTERVAL);

			}
		});
	},0);

}

function autoLvup() {

debugLog("=== Start autoLvup ===");
	var cost_bk_ken=[
		[ 165,	135,   0,  0, 6600],
		[ 251,	319,   0,  0, 8910],
		[ 184,	596,   0,303,11220],
		[ 351,	994,   0,604,13200],
		[ 431,	828,2054,  0,15180],
		[ 159,	848,4294,  0,17820],
		[1397, 2301,4519,  0,19140],
		[1019, 4458,7260,  0,21120],
		[	0,11558,3572,  0,23100],
		[	0,19648,6073,  0,25080],
		[	0,	  0,   0,  0,	 0]
	];
	// 槍兵
	var cost_bk_yari=[
		[ 1820,  3575,	  0,1105,13500],
		[ 3640,  7150,	  0,2210,18225],
		[	 0, 12870, 6552,3978,22950],
		[	 0, 21879,11138,6763,27000],
		[10820, 35006,17821,   0,31050],
		[16230, 52510,26732,   0,36450],
		[22722, 73514,37425,   0,39150],
		[30675, 99243,50524,   0,43200],
		[39878,129016,65681,   0,47250],
		[51841,167721,85385,   0,51300],
		[	 0, 	0,	  0,   0,	 0]
	];
	// 矛槍兵
	var cost_bk_hoko=[
		[ 14000,  27500,	  0, 8500,18600],
		[ 28000,  55000,	  0,17000,25380],
		[	  0, 104500,  53200,32300,31620],
		[	  0, 188100,  95760,58140,37200],
		[ 98838, 319770, 162792,	0,42700],
		[158141, 511632, 260467,	0,50220],
		[237211, 767448, 390701,	0,53940],
		[332096,1074427, 546981,	0,59520],
		[431724,1396755, 711075,	0,65100],
		[647587,2095133,1066613,	0,70680],
		[	  0,	  0,	  0,	0,	  0]
	];
	// 弓兵
	var cost_bk_yumi=[
		[  3795,	0, 1173,1932,13500],
		[  7590,	0, 2346,3864,18225],
		[ 13662,	0, 6995,4223,22950],
		[ 23225,	0,11824,7179,27000],
		[ 37161,11486,18918,   0,31050],
		[ 55741,17229,28377,   0,36450],
		[ 78038,39728,24121,   0,39150],
		[105351,53633,32563,   0,43200],
		[122015,49802,77193,   0,47250],
		[178043,55031,90640,   0,51300],
		[	  0,	0,	  0,   0,	 0]
	];
	// 弩兵
	var cost_bk_dokyu=[
		[  30250,	  0,   9350,15400,18600],
		[  60500,	  0,  18700,30800,25110],
		[ 114950,	  0,  58520,35530,31620],
		[ 206910,	  0, 105336,63954,37200],
		[ 351747,108722, 179071,	0,42780],
		[ 562795,173955, 286514,	0,50220],
		[ 844193,429771, 260932,	0,53940],
		[1181870,601679, 365305,	0,59520],
		[1368820,558720, 865988,	0,65100],
		[2320010,717094,1181096,	0,70680],
		[	   0,	  0,	  0,	0,	  0]
	];
	// 騎兵
	var cost_bk_uma=[
		[1241,2044,4015,0,13500],
		[2482,4088,8030,0,17313],
		[4468,0,14454,7358,22950],
		[7595,0,24572,12509,27000],
		[12152,0,39315,20015,31040],
		[0,18228,58973,30022,36450],
		[0,42031,82562,25519,39150],
		[0,56742,111458,34451,43200],
		[0,73765,144895,44786,47250],
		[0,95894,188364,58222,51300],
		[0,0,0,0,0]
	];
	// 近衛騎兵
	var cost_bk_konoe=[
		[10200,16800,33000,0,18600],
		[20400,33600,66000,0,25110],
		[38760,0,125400,63840,31620],
		[69768,0,225720,114912,37200],
		[76745,0,488376,132559,14400],
		[0,189769,613958,312561,50220],
		[0,468841,920938,284653,53940],
		[0,656377,1289313,398515,59520],
		[0,853291,1676107,518069,65100],
		[0,1279936,2514161,777104,70680],
		[0,0,0,0,0]
	];
	// 衝車
	var cost_bk_kuruma=[
		[6600,2040,3360,0,17000],
		[13200,4080,6720,0,22950],
		[23760,7344,12096,0,28900],
		[40392,12485,20536,0,34000],
		[64627,19976,32901,0,39100],
		[96941,29964,49352,0,45900],
		[135717,41949,69092,0,49300],
		[183218,56631,93274,0,54400],
		[238183,73620,121257,0,59500],
		[359657,111167,183098,0,64600],
		[0,0,0,0,0]
	];
	// 投石機
	var cost_bk_stone=[
		[ 11050,  35750,  18200,0,24000],
		[ 22100,  71500,  36400,0,32400],
		[ 41990, 135850,  69160,0,40800],
		[ 75582, 244530, 124488,0,48000],
		[128489, 415701, 211630,0,55200],
		[205583, 665122, 338607,0,64800],
		[308375, 997682, 507911,0,69600],
		[431724,1396755, 711075,0,76800],
		[561242,1815782, 924398,0,84000],
		[729614,2360517,1201718,0,91200],
		[0,0,0,0,0]
	];
	// 大剣兵
	var cost_bk_bigken=[
		[ 24775,  20270,	  0,	 0,24000],
		[ 39671,  50419,	  0,	 0,32400],
		[ 29082,  94199,	  0, 47890,40800],
		[ 55488, 157137,	  0, 95483,48000],
		[ 68141, 130906, 324736,	 0,55200],
		[ 25137, 134063, 691341,	 0,64800],
		[213721, 352019, 691341,	 0,69600],
		[140799, 615977,1003138,	 0,76800],
		[	  0,1258370, 388899,640617,84000],
		[	  0,1870636, 578195,952360,67080],
		[0,0,0,0,0]
	];
	// 盾兵
	var cost_bk_shield=[
		[	2044,	2044,	2044,	0,13500],	// Lv1
		[0,0,0,0,0],					// Lv2
		[0,0,0,0,0],					// Lv3
		[0,0,0,0,0],					// Lv4
		[0,0,0,0,0],					// Lv5
		[0,0,0,0,0],					// Lv6
		[0,0,0,0,0],					// Lv7
		[0,0,0,0,0],					// Lv8
		[0,0,0,0,0],					// Lv9
		[0,0,0,0,0],					// Lv10
		[0,0,0,0,0]
	];
	// 重盾兵
	var cost_bk_bigshield=[
		[	15576,	15576,	15576,	0,	18600],	// Lv1
		[0,0,0,0,0],					// Lv2
		[0,0,0,0,0],					// Lv3
		[0,0,0,0,0],					// Lv4
		[0,0,0,0,0],					// Lv5
		[0,0,0,0,0],					// Lv6
		[0,0,0,0,0],					// Lv7
		[0,0,0,0,0],					// Lv8
		[0,0,0,0,0],					// Lv9
		[0,0,0,0,0],					// Lv10
		[0,0,0,0,0]
	];
	// 戦斧兵
	var cost_bk_battleax=[
		[0,0,0,0,0],					// Lv1
		[0,0,0,0,0],					// Lv2
		[0,0,0,0,0],					// Lv3
		[0,0,0,0,0],					// Lv4
		[0,0,0,0,0],					// Lv5
		[0,0,0,0,0],					// Lv6
		[0,0,0,0,0],					// Lv7
		[0,0,0,0,0],					// Lv8
		[0,0,0,0,0],					// Lv9
		[0,0,0,0,0],					// Lv10
		[0,0,0,0,0]
	];
	// 双剣兵
	var cost_bk_twinsword=[
		[	35000,	5500,	5500,	20000,	20700],	// Lv1
		[0,0,0,0,0],					// Lv2
		[0,0,0,0,0],					// Lv3
		[0,0,0,0,0],					// Lv4
		[0,0,0,0,0],					// Lv5
		[0,0,0,0,0],					// Lv6
		[0,0,0,0,0],					// Lv7
		[0,0,0,0,0],					// Lv8
		[0,0,0,0,0],					// Lv9
		[0,0,0,0,0],					// Lv10
		[0,0,0,0,0]
	];
	// 大錘兵
	var cost_bk_largeweight=[
		[0,0,0,0,0],					// Lv1
		[0,0,0,0,0],					// Lv2
		[0,0,0,0,0],					// Lv3
		[0,0,0,0,0],					// Lv4
		[0,0,0,0,0],					// Lv5
		[0,0,0,0,0],					// Lv6
		[0,0,0,0,0],					// Lv7
		[0,0,0,0,0],					// Lv8
		[0,0,0,0,0],					// Lv9
		[0,0,0,0,0],					// Lv10
		[0,0,0,0,0]
	];
	// 防具工場テーブル ========================================================
	// 剣兵
	var cost_bg_ken=[
		[ 149,	122,   0,	0, 6600],
		[ 228,	285,   0,	0, 8910],
		[ 168,	534,   0, 273,11220],
		[ 310,	900,   0, 544,13200],
		[ 373,	745,1864,	0,15180],
		[ 539, 1431,2801,	0,17820],
		[1265, 2063,4067,	0,19140],
		[1949, 6304,3209,	0,21120],
		[	0,10288,3253,5371,23100],
		[	0,17683,5466,9002,25080],
		[0,0,0,0,0]
	];
	// 槍兵
	var cost_bg_yari=[
		[ 1638,  3218,	  0, 995,13500],
		[ 3276,  6435,	  0,1989,18225],
		[	 0, 11583, 5897,3580,22950],
		[	 0, 19691,10025,6086,27000],
		[ 9738, 31506,16039,   0,31050],
		[14607, 47259,24059,   0,36450],
		[20450, 66162,33683,   0,39150],
		[27608, 89319,45471,   0,43200],
		[35890,116115,59113,   0,51300],
		[46657,150949,76847,   0,55350],
		[0,0,0,0,0]
	];
	// 矛槍兵
	var cost_bg_hoko=[
		[ 12600,  24750,	  0, 7650, 18600],
		[ 25200,  49500,	  0,15300, 25110],
		[	  0,  94050,  47880,29070, 31620],
		[	  0, 169290,  86184,52326, 37200],
		[ 88954, 287793, 146513,	0, 42780],
		[142327, 460469, 234420,	0, 50220],
		[213490, 690703, 351631,	0, 53940],
		[298886, 966984, 492283,	0, 59520],
		[388552,1257080, 639968,	0, 65100],
		[545116,1762197,1121087,	0,358680],
		[0,0,0,0,0]
	];
	// 弓兵
	var cost_bg_yumi=[
		[  3416,	0, 1056,1739,13500],
		[  6831,	0, 2111,3478,22950],
		[ 12296,	0, 6260,3801,27000],
		[ 20903,	0,10641,6461,31050],
		[ 33445,10337,17026,   0,36450],
		[ 50167,15506,25540,   0,39150],
		[ 70234,35756,21709,   0,43200],
		[ 94816,48270,29307,   0,47250],
		[108917,44822,70371,   0,51300],
		[160238,49528,81576,   0,55350],
		[0,0,0,0,0]
	];
	// 弩兵
	var cost_bg_dokyu=[
		[  27225,	  0,   8415,13860,18600],
		[  54450,	  0,  16830,27720,25110],
		[ 103455,	  0,  52668,31977,31620],
		[ 186219,	  0,  94802,57559,37200],
		[ 316572, 97850, 161164,	0,42780],
		[ 506516,156559, 257863,	0,50220],
		[ 759774,386794, 234839,	0,53940],
		[1063683,541511, 328775,	0,59520],
		[1221881,502832, 789446,	0,65100],
		[2088009,645385,1062986,	0,70680],
		[0,0,0,0,0]
	];
	// 騎兵
	var cost_bg_uma=[
		[ 1117, 1840,  3614,	0,13500],
		[ 2234, 3679,  7227,	0,18225],
		[ 4021,    0, 13009, 6623,22950],
		[ 6835,    0, 22115,11258,27000],
		[10937,    0, 35384,18013,31050],
		[	 0,16405, 53075,27020,36450],
		[	 0,37828, 74305,22967,43200],
		[	 0,51068,100312,31006,47250],
		[	 0,66388,130406,40307,51300],
		[	 0,86305,169528,52399,55350],
		[0,0,0,0,0]
	];
	// 近衛騎兵
	var cost_bg_konoe=[
		[ 9180,  15120,  29700, 	0,18600],
		[ 6156,  10134,  19908, 	0,25110],
		[ 7830, 	 0,  25344, 12900,31620],
		[ 8952, 	 0,  28962, 14742,37200],
		[20979, 	 0,  67878, 34560,42780],
		[	 0,  27279,  88245, 44919,50220],
		[	 0,  78324, 153852, 47556,53940],
		[	 0, 590740,1160381,358663,59520],
		[	 0, 767962,1508496,466262,65100],
		[	 0,1151943,2262744,699394,70680],
		[0,0,0,0,0]
	];
	// 斥候
	var cost_bg_sek=[
		[ 1638,  995,	  0,  3218, 6600],
		[ 3276, 1989,	  0,  6435, 8910],
		[ 6224, 3779,	  0, 12227,11220],
		[	 0, 6802, 11204, 22008,13200],
		[	 0,11564, 19047, 37413,15180],
		[	 0,18502, 30475, 59861,17820],
		[27754,    0, 45712, 89791,19140],
		[38855,    0, 63997,125708,21120],
		[50512,    0, 83916,163420,23100],
		[65665,    0,108154,212446,25080],
		[0,0,0,0,0]
	];
	// 斥候騎兵
	var cost_bg_sekuma=[
		[  9180,15120, 29700,	  0,18600],
		[  6156,10134, 19908,	  0,25110],
		[  7830,	0, 25344, 12900,31620],
		[  8952,	0, 28962, 14742,37200],
		[ 20979,	0, 67878, 34560,42780],
		[	  0,27279, 88245, 44919,50220],
		[	  0,78324,153852, 47556,53940],
		[ 53135,	0, 87517,171908,43200],
		[ 69076,	0,113772,223480,47250],
		[104304,	0,171795,337455,51300],
		[0,0,0,0,0]
	];
	// 衝車
	var cost_bg_kuruma=[
		[  5940,  1836,  3024,0,17000],
		[ 11880,  3672,  6048,0,22950],
		[ 21384,  6610, 10886,0,28900],
		[ 36353, 11236, 10886,0,34000],
		[ 58164, 17978, 29611,0,39100],
		[ 87247, 26967, 44417,0,45900],
		[122145, 37754, 62183,0,49300],
		[164896, 50968, 83947,0,54400],
		[214365, 66258,109131,0,59500],
		[ 63561,198334,326634,0,64600],
		[0,0,0,0,0]
	];
	// 投石機
	var cost_bg_stone=[
		[  9945,  32175,  16380,0,24000],
		[ 19890,  64350,  32760,0,32400],
		[ 37791, 122265,  62244,0,40800],
		[ 68024, 220077, 112039,0,48000],
		[115640, 374131, 190467,0,55200],
		[185025, 598609, 304747,0,64800],
		[277537, 897914, 457120,0,69600],
		[388552,1257080, 639968,0,76800],
		[505118,1634204, 831958,0,84000],
		[656653,2124465,1081546,0,91200],
		[0,0,0,0,0]
	];
	// 大剣兵
	var cost_bg_bigken=[
		[	22290,	18251,	0,	0,	18600],	// Lv1
		[0,0,0,0,0],					// Lv2
		[0,0,0,0,0],					// Lv3
		[0,0,0,0,0],					// Lv4
		[0,0,0,0,0],					// Lv5
		[0,0,0,0,0],					// Lv6
		[0,0,0,0,0],					// Lv7
		[0,0,0,0,0],					// Lv8
		[0,0,0,0,0],					// Lv9
		[0,0,0,0,0],					// Lv10
		[0,0,0,0,0]
	];
	// 盾兵
	var cost_bg_shield=[
		[0,0,0,0,0],					// Lv1
		[	3679,	3679,	3679,	0,	18224],	// Lv2
		[0,0,0,0,0],					// Lv3
		[0,0,0,0,0],					// Lv4
		[0,0,0,0,0],					// Lv5
		[0,0,0,0,0],					// Lv6
		[0,0,0,0,0],					// Lv7
		[0,0,0,0,0],					// Lv8
		[0,0,0,0,0],					// Lv9
		[0,0,0,0,0],					// Lv10
		[0,0,0,0,0]
	];
	// 重盾兵
	var cost_bg_bigshield=[
		[0,0,0,0,0],					// Lv1
		[0,0,0,0,0],					// Lv2
		[0,0,0,0,0],					// Lv3
		[0,0,0,0,0],					// Lv4
		[0,0,0,0,0],					// Lv5
		[0,0,0,0,0],					// Lv6
		[0,0,0,0,0],					// Lv7
		[0,0,0,0,0],					// Lv8
		[	712025,	712025,	712025,	0,	65100],	// Lv9
		[0,0,0,0,0],					// Lv10
		[0,0,0,0,0]
	];
	// 戦斧兵
	var cost_bg_battleax=[
		[0,0,0,0,0],					// Lv1
		[0,0,0,0,0],					// Lv2
		[0,0,0,0,0],					// Lv3
		[0,0,0,0,0],					// Lv4
		[0,0,0,0,0],					// Lv5
		[0,0,0,0,0],					// Lv6
		[0,0,0,0,0],					// Lv7
		[0,0,0,0,0],					// Lv8
		[0,0,0,0,0],					// Lv9
		[0,0,0,0,0],					// Lv10
		[0,0,0,0,0]
	];
	// 双剣兵
	var cost_bg_twinsword=[
		[	33000,	3000,	3000,	18500,	20700],	// Lv1
		[0,0,0,0,0],					// Lv2
		[0,0,0,0,0],					// Lv3
		[0,0,0,0,0],					// Lv4
		[0,0,0,0,0],					// Lv5
		[0,0,0,0,0],					// Lv6
		[0,0,0,0,0],					// Lv7
		[0,0,0,0,0],					// Lv8
		[0,0,0,0,0],					// Lv9
		[0,0,0,0,0],					// Lv10
		[0,0,0,0,0]
	];
	// 大錘兵
	var cost_bg_largeweight=[
		[0,0,0,0,0],					// Lv1
		[0,0,0,0,0],					// Lv2
		[0,0,0,0,0],					// Lv3
		[0,0,0,0,0],					// Lv4
		[0,0,0,0,0],					// Lv5
		[0,0,0,0,0],					// Lv6
		[0,0,0,0,0],					// Lv7
		[0,0,0,0,0],					// Lv8
		[0,0,0,0,0],					// Lv9
		[0,0,0,0,0],					// Lv10
		[0,0,0,0,0]
	];
	var costs = [];
	costs["鍛冶場剣兵"] 		= cost_bk_ken;
	costs["鍛冶場槍兵"] 		= cost_bk_yari;
	costs["鍛冶場矛槍兵"]		= cost_bk_hoko;
	costs["鍛冶場弓兵"] 		= cost_bk_yumi;
	costs["鍛冶場弩兵"] 		= cost_bk_dokyu;
	costs["鍛冶場騎兵"] 		= cost_bk_uma;
	costs["鍛冶場近衛騎兵"]		= cost_bk_konoe;
	costs["鍛冶場衝車"] 		= cost_bk_kuruma;
	costs["鍛冶場投石機"]		= cost_bk_stone;
	costs["鍛冶場大剣兵"]		= cost_bk_bigken;			// 2014.02.19
	costs["鍛冶場盾兵"] 		= cost_bk_shield;			// 2014.02.19
	costs["鍛冶場重盾兵"]		= cost_bk_bigshield;		// 2014.02.19
	costs["鍛冶場戦斧兵"]		= cost_bk_battleax;			// 2019.01.10
	costs["鍛冶場双剣兵"]		= cost_bk_twinsword;		// 2019.01.10
	costs["鍛冶場大錘兵"]		= cost_bk_largeweight;		// 2019.01.10

	costs["防具工場剣兵"]		= cost_bg_ken;
	costs["防具工場槍兵"]		= cost_bg_yari;
	costs["防具工場矛槍兵"] 	= cost_bg_hoko;
	costs["防具工場弓兵"]		= cost_bg_yumi;
	costs["防具工場弩兵"]		= cost_bg_dokyu;
	costs["防具工場騎兵"]		= cost_bg_uma;
	costs["防具工場近衛騎兵"]	= cost_bg_konoe;
	costs["防具工場斥候"]		= cost_bg_sek;
	costs["防具工場斥候騎兵"]	= cost_bg_sekuma;
	costs["防具工場衝車"]		= cost_bg_kuruma;
	costs["防具工場投石機"] 	= cost_bg_stone;
	costs["防具工場大剣兵"] 	= cost_bg_bigken;			// 2014.02.19
	costs["防具工場盾兵"]		= cost_bg_shield;			// 2014.02.19
	costs["防具工場重盾兵"] 	= cost_bg_bigshield;		// 2014.02.19
	costs["防具工場戦斧兵"]		= cost_bg_battleax;			// 2019.01.10
	costs["防具工場双剣兵"]		= cost_bg_twinsword;		// 2019.01.10
	costs["防具工場大錘兵"]		= cost_bg_largeweight;		// 2019.01.10

	var make_loop = function(loop) {

		if (loop == 2) {

			return;

		} else {

			if (loop == 0) { var type = "鍛冶場"; }
			if (loop == 1) { var type = "防具工場"; }
			if (OPT_BKBG_CHK == 0) { return; }
			var UnitID = [];

			UnitID["剣兵"]		= [301];
			UnitID["槍兵"]		= [303];
			UnitID["矛槍兵"]	= [304];
			UnitID["騎兵"]		= [305];
			UnitID["近衛騎兵"]	= [307];
			UnitID["弓兵"]		= [308];
			UnitID["弩兵"]		= [309];
			UnitID["斥候"]		= [310];
			UnitID["斥候騎兵"]	= [311];
			UnitID["衝車"]		= [312];
			UnitID["投石機"]	= [313];
			UnitID["大剣兵"]	= [315];
			UnitID["盾兵"]		= [316];
			UnitID["重盾兵"]	= [317];
			UnitID["戦斧兵"]	= [318];
			UnitID["双剣兵"]	= [319];
			UnitID["大錘兵"]	= [320];

			var _x = -1;
			var _y = -1;
			var _lv = -1;

			var area = new Array();
			area = get_area();

			for (var i=0;i<area.length;i++){
				if (area[i].name == type) {
					var Temp = area[i].xy.split(",");
					_x = Temp[0];
					_y = Temp[1];
					_lv = area[i].lv;
				}
			}
			if ( _x < 0 ) {
				make_loop(loop + 1);
				return;
			}
			var tid=setTimeout(function(){

				var mURL = FACLINK;
				mURL = mURL.replace(URL_SITE,HOST);
				mURL = mURL.replace(URL_X,_x);
				mURL = mURL.replace(URL_Y,_y);

				GM_xmlhttpRequest({
					method:"GET",
					url: mURL,
					headers:{"Content-type":"text/html"},
					overrideMimeType:'text/html; charset=utf-8',
					onload:function(x){
						var htmldoc = document.createElement("html");
							htmldoc.innerHTML = x.responseText;
						// 鍛冶場・防具工場情報の取得
						getTrainingSoldier(htmldoc);
						if ( getStayMode() ) {
							closeIniBilderBox();
							openIniBilderBox();
						}

						var actionsElem  = document.evaluate('//th[@class="mainTtl6"]', htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
//						var actionsElem2 = document.evaluate('//b[@class="f14"]',		htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
						var actionsElem2 = document.evaluate('//b[contains(@class,"f14")]', 	  htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
						var actionsElem3 = document.evaluate('//td[@class="center"]'   ,htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
						var actionsElem4 = document.evaluate('//td[@class="cost"]'	 ,htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

						var htmldoc2 = document.createElement("html");

						var actionsElem7  = document.evaluate('//*[@colspan="4"]', htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

						var Buki = Array();
						var x = -1;

						if ( htmldoc.innerHTML.lastIndexOf("を強化する") != -1 ) {
							for (var i=0;i<actionsElem2.snapshotLength;i++){
//								htmldoc2.innerHTML = actionsElem4.snapshotItem(i).innerHTML;
//								var actionsElem5 = document.evaluate('//span[@class="normal"]'	 ,htmldoc2, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
//								var actionsElem6 = document.evaluate('//span[@class="max90"]'	,htmldoc2, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
								var BG_Name = actionsElem.snapshotItem(i+1).innerHTML;
								var BG_LvNm = actionsElem2.snapshotItem(i).innerHTML.substring(actionsElem2.snapshotItem(i).innerHTML.lastIndexOf("&nbsp;&nbsp;")+12);
								var BG_UID	= UnitID[BG_Name];
								var BG_Lv	= actionsElem2.snapshotItem(i).innerHTML.substring(3,actionsElem2.snapshotItem(i).innerHTML.lastIndexOf("&nbsp;")-6);

								var BG_WOOD  = costs[type + BG_Name][BG_Lv][0];
								var BG_STONE = costs[type + BG_Name][BG_Lv][1];
								var BG_IRON  = costs[type + BG_Name][BG_Lv][2];
								var BG_RICE  = costs[type + BG_Name][BG_Lv][3];
								var BG_TIME  = costs[type + BG_Name][BG_Lv][4];
								var BG_Go	 = (actionsElem3.snapshotItem(i+1).innerHTML.lastIndexOf("を強化する") != -1);
/*
								if (BG_Lv != 10) {
									var BG_WOOD  = actionsElem5.snapshotItem(0).innerHTML;
									var BG_STONE = actionsElem5.snapshotItem(1).innerHTML;
									var BG_IRON  = actionsElem6.snapshotItem(0).innerHTML;
									var BG_RICE  = actionsElem5.snapshotItem(2).innerHTML;
									var BG_TIME  = actionsElem7.snapshotItem(i).innerHTML;
									var BG_Go	 = (actionsElem3.snapshotItem(i+1).innerHTML.lastIndexOf("を強化する") != -1);
								} else {
									var BG_WOOD  = 0;
									var BG_STONE = 0;
									var BG_IRON  = 0;
									var BG_RICE  = 0;
									var BG_TIME  = 0;
									var BG_Go	 = false;
								}
*/
								if (type == "鍛冶場") {
									var BG_GoLv  = OPT_BK_LV[ ( UnitID[actionsElem.snapshotItem(i+1).innerHTML][0] - 300 ) ];
								} else {
									var BG_GoLv  = OPT_BG_LV[ ( UnitID[actionsElem.snapshotItem(i+1).innerHTML][0] - 300 ) ];
								}
								if ( checkBKLvup(BG_WOOD,BG_STONE,BG_IRON,BG_RICE,BG_Go,BG_Lv,BG_GoLv) ){
									x++;
									Buki[x] = [BG_Name,BG_Lv,BG_LvNm,BG_UID,BG_TIME];
								}
							}
							Buki.sort( function(a, b) { if (a[4] > b[4]) return 1; if (a[4] < b[4]) return -1; return 0;});

							if (x != -1) {
								// 武器強化処理
								var c={};
								c['x'] = parseInt(_x,10);
								c['y'] = parseInt(_y,10);
								c['unit_id'] = parseInt(Buki[0][3],10);
								q$.post("http://"+HOST+"/facility/facility.php?x=" + parseInt(_x,10) + "&y=" + parseInt(_y,10) + "#ptop",c,function(){});
			//					var tid=setTimeout(function(){location.reload(false);},0);

							}
						}
						make_loop(loop + 1);

						function checkBKLvup(hwood,hstone,hiron,hrice,hgo,hnlv,hslv) {

							var wood = parseInt( q$("#wood").val(), 10 );
							var stone = parseInt( q$("#stone").val(), 10 );
							var iron = parseInt( q$("#iron").val(), 10 );
							var rice = parseInt( q$("#rice").val(), 10 );

		//					var temp = (parseInt(hwood) + 99,10);

							if (parseInt(hnlv,10) >= parseInt(hslv,10)) { return false; }
							if ((parseInt(hwood,10)  + OPT_BLD_WOOD ) > wood ) { return false; }
							if ((parseInt(hstone,10) + OPT_BLD_STONE) > stone) { return false; }
							if ((parseInt(hiron,10)  + OPT_BLD_IRON ) > iron ) { return false; }
							if ((parseInt(hrice,10)  + OPT_BLD_RICE ) > rice ) { return false; }
							if (hgo == false) { return false; }

							return true;
						}

					}
				});
			},0);
		}
	};
	make_loop(0);
}

// 直近の建設中施設の残り時間を取得する
function getBuildingInfo() {
	var div = q$("#actionLog");
	var li = q$("li:first", div);
	for (var i = 0; li && i < 10; i++) {
		if (li.text().match(/建設中/)) {
			break;
		}
		li = li.next();
	}
	if (! li) {
		console.log("建設中のものは無い");
		return null;
	}

	var a = q$(".buildStatus>a", li);
	if (!a) {
		console.log("建設リンクが取得できない");
		return null;
	}

	var info = { x:-1, y:-1, name:"", lv:0, time:-1 };

	// 建設座標
	var href = a.attr("href");
	if (href && href.match(/x=(\d+).+y=(\d+)/)){
		info.x = parseInt(RegExp.$1,10);
		info.y = parseInt(RegExp.$2,10);

		// 施設名とレベル
		if (a.text().match(/(.+?)\(.+?(\d+)/)) {
			info.name = RegExp.$1;
			info.lv = parseInt(RegExp.$2,10);
		}
	}

	// 建設残り時間
	if (q$(".buildClock", li).text().match(/(\d+):(\d+):(\d+)/)) {
		info.time = parseInt(RegExp.$1,10) * 60 * 60 + parseInt(RegExp.$2,10) * 60 + parseInt(RegExp.$3,10);
	}

	return info;
}

function setVillageFacility() {

debugLog("=== Start setVillageFacility ===");

	var cnt=0;
	var vID = "";

	var del=0;
	var delX = 0;
	var delY = 0;

	//座標を取得
	q$("#basepoint span[class=xy]").text().match(/(\([-]*\d+,[-]*\d+\))/);
	vId = RegExp.$1;

	//建設情報を取得
	var actionsElem = document.evaluate('//*[@id="actionLog"]/ul/li', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

	// 削除施設情報の取得
	for (var i = 0; i < actionsElem.snapshotLength; i++) {
		var paItem = actionsElem.snapshotItem(i);
		//ステータス
		var buildStatusElem = document.evaluate('./span[@class="buildStatus"]/a', paItem, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if (buildStatusElem.snapshotLength > 0) {
			//施設建設数
			cnt++;

			// 削除数カウント
			if( buildStatusElem.snapshotItem(0).parentNode.parentNode.textContent.indexOf("削除") >= 0 ){
				if(buildStatusElem.snapshotItem(0).href.match(/.*\/.*(\d+).*(\d+)/)){
					delX = parseInt(RegExp.$1,10);
					delY = parseInt(RegExp.$2,10);
				}
				del++;
			}
		} else {
			var buildStatusText = q$(".buildStatus span", paItem).text();
			if (/一括建設(準備)?中/.test(buildStatusText)) {
				cnt++;
			}
			else if (/自動建設(準備)?中/.test(buildStatusText)) {
				cnt++;
			}
			else if (/^全建設(準備)?中/.test(buildStatusText)) {
				cnt++;
			}
		}
	}


	for (var i = 0; i < actionsElem.snapshotLength; i++) {
		var paItem = actionsElem.snapshotItem(i);
		//ステータス
		var buildStatusElem = document.evaluate('./span[@class="buildStatus"]/a', paItem, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if (buildStatusElem.snapshotLength > 0) {
			//建物削除等に対応 2010.10.25 byおぜがづ
			for(var j=0; j<buildStatusElem.snapshotLength;j++){
				if(buildStatusElem.snapshotItem(j).parentNode.innerHTML.match(RegExp("(建設中|建設準備中)"))) {
					//施設建設数
					cnt++;
				}
			}
			//施設建設数
			//cnt++;
		}
	}

	Load_OPT(vId);	//LvUP対象の取得

	//建設削除 2015.05.10
	if(OPT_REMOVE == 1) {
		if(del == 0) {
			var area = new Array();
			area = get_area();
			area.sort(cmp_areas);
			area.sort(cmp_lv);

			for(var ii=0;ii<OPT_FUC_NAME.length;ii++){
				//削除指示が有るか確認する。
				if(parseInt(OPT_RM_CHKBOX[ii],10) == 1){
					//指定残存個数を上回っている場合のみ削除対象とする
					var targets = new Array();
					for(var i=0;i<area.length;i++){
						if(area[i].name == OPT_FUC_NAME[ii]){
							targets.push(area[i]);
						}
					}
					if(targets.length > 0 && targets.length > parseInt(OPT_RM_CHKBOXLV[ii],10)) {
						//施設Lvの低いものから削除する
						var Temp = targets[0].xy.split(",");
						var c = {};
							c['x']=parseInt(Temp[0],10);
							c['y']=parseInt(Temp[1],10);
							c['remove']='建物を壊す';
							c['ssid']=getSessionId();
						q$.post("http://"+HOST+"/facility/facility.php",c,function(){});
						var tid=setTimeout(function(){location.reload(false);},INTERVAL);
						return;
					}
				}
			}
		}
	}

	//建設予約ができるかどうか
	if((cnt - del) >= 1) {
		// 運営のタイマーバグ対策。最大時間を異常に超えている場合、リロードする。
		var info = getBuildingInfo();
		if (info && info.x != -1 && info.y != -1) {
			console.log("x="+info.x+" y="+info.y+" name="+info.name+" lv="+info.lv+" time="+info.time);
			// info.log は建築中施設のLV。getBuildResources は現在LVなので-1する
			var cost = getBuildResources(info.name, info.lv-1);
			if (cost) {
				if (cost.time > 0 && info.time > cost.time) {
					console.log("建築時間がバグっているのでリロードしてみる");
					var tid=setTimeout(function(){location.reload();},5000);
				}
			}
		}
		return;
	}

	// ★9(1-1-1-2)水車村
	if (OPT_1112MURA == 1) {
		if (build1112(vId)) return;
	}
	else if (OPT_0001S3MURA == 1) {	// ★3(0-0-0-1)水車村
		if (build0001S3(vId)) return;
	}
	else if (OPT_0001S5MURA == 1) {	// ★5(0-0-0-1)水車村
		if (build0001S5(vId)) return;
	}
	else if (OPT_0001S7MURA == 1) {	// ★7(0-0-0-1)水車村
		if (build0001S7(vId)) return;
	}
	else if (OPT_0000S8MURA == 1) {	// ★8(0-0-0-0)水車村
		if (build0000S8(vId)) return;
	}
	else if ((OPT_PLANT5MURAN == 1) || (OPT_PLANT5MURAE == 1) || (OPT_PLANT5MURAW == 1) || (OPT_PLANT5MURAS == 1)) {	// ★5(6-0-0-0),(0-6-0-0),(0-0-6-0)工場村
		if (buildPlant5(vId)) return;
	}
	else if (OPT_PLANT9MURA74 == 1) { // ★9(7-4)工場村
		if (buildPlant9m74(vId)) return;
	}
	else if (OPT_1111S4MURA == 1) { // ★4(1-1-1-1)水車村+資源
		if (build1111S4(vId)) return;
	}
	else if (OPT_0000S6MURA == 1) { // ★6(0-0-0-0)水車村+資源
		if (build0000S6(vId)) return;
	}

	// 宿舎
	if (OPT_SHUKUSHA == 1) {
		if (buildShukusha(vId)) return;
	}
	if (OPT_DAISHUKUSHA == 1) {
		if (buildDaiShukusha(vId)) return;
	}

	// 糧村化
	if(OPT_KATEMURA == 1) {
		var area_all	= new Array();
		area_all		= get_area_all();
		var hatake		= 0; //畑の総数
		var souko		= 0; //倉庫の総数
		var heichi		= 0; //平地の総数
		var n = -1;
		for(var i=0;i < area_all.length;i++){
			if(area_all[i].name == "平地"){heichi++;n=i;}
			else if(area_all[i].name.match(/畑/)){hatake++;}
			else if(area_all[i].name.match(/倉庫/)){souko++;}
		}


		if(heichi>0){ //平地が余っていたら
			var tmp = heichi;
			if(souko < OPT_SOUKO_MAX){									// 倉庫がまだ最大数建っていなければ
				tmp -= (OPT_SOUKO_MAX - souko); 						// 平地の数をマイナス
			}
			if(tmp > 0){ //それでも平地が余っていれば
				if(Chek_Sigen(new lv_sort("畑",0,"")) != 1){			// 資源チェック
					createFacility(HATAKE, area_all);					// 畑を建てる
					Reload_Flg = 0;
					return;
				};
			} else if(souko < OPT_SOUKO_MAX){							//倉庫が建てられる平地があれば
				if(Chek_Sigen(new lv_sort("倉庫",0,"")) != 1){			//資源チェック
					createFacility(SOUKO, area_all);					//倉庫を建てる
					Reload_Flg = 0;
					return;
				}
			}
		}
		//建てられるスペースがなければ通常の処理を続ける
	}

	var area = new Array();
	area = get_area();
	area.sort(cmp_areas);
	area.sort(cmp_lv);
	Reload_Flg = 0;

	// 拠点の状況を調査（削除中なら処理しない）
	q$.get("http://"+HOST+"/facility/facility.php?x=3&y=3#ptop",function(x){
		var htmldoc = document.createElement("html");
			htmldoc.innerHTML = x;
		var rmtime = htmldoc.innerHTML.match(/(村を削除中です。|砦を削除中です。)[^\d]*(\d+-\d+-\d+ \d+:\d+:\d+)に完了します。/);
		if (rmtime) {
			// 削除中のため何もしない
			return;
		}

		for(i=0;i<area.length;i++){
			var tmpName1 = area[i].name;
			switch (tmpName1) {
				case "村":
				case "城":
				case "砦":
					tmpName1  = "拠点"; 			 //
					chkFlg = 1;
					break;
			}

			if(parseInt(area[i].lv,10) >= parseInt(OPT_CHKBOXLV[OPT_FNID[tmpName1]],10)){
				continue;
			} //指定Lv以上ならメインに戻る
			//建築物名分回す
			OPT_FUC_NAME.push("村","城","砦");
			if(OPT_CHKBOX[0] == 1) {
				OPT_CHKBOX.push(1,1,1);
				OPT_CHKBOXLV.push(OPT_CHKBOXLV[0],OPT_CHKBOXLV[0],OPT_CHKBOXLV[0]);
			} else {
				OPT_CHKBOX.push(0,0,0);
				OPT_CHKBOXLV.push(0,0,0);
			}
			OPT_CHKBOX.push;
			for(var ii=0;ii<OPT_FUC_NAME.length;ii++){
				//ソートしたLvの低い順に比較する
				if(area[i].name == OPT_FUC_NAME[ii]){
					//建築指示が有るか確認する。
					if(parseInt(OPT_CHKBOX[ii],10) == 1){
						if(parseInt(area[i].lv,10) >= parseInt(OPT_CHKBOXLV[ii],10)){
							break;
						}

						//建築に必要な資源が有るかどうかチェック
						var ret = Chek_Sigen(area[i]);
						if(ret == 1){
							//1分後にリロードするかどうか
							Reload_Flg = 1;
							break;
						}

						var Temp = area[i].xy.split(",");
						var c = {};
						if( (del != 0) && (parseInt(Temp[0],10) == delX) && (parseInt(Temp[1],10) == delY) ){
							// 削除施設とレベルアップ施設が一致したらスキップ
							continue;
						}
						// 拠点以外のレベルアップ処理
						c['x']=parseInt(Temp[0],10);
						c['y']=parseInt(Temp[1],10);
						c['village_id']=getVillageID(vId);
						c['ssid']=getSessionId();
						q$.post("http://"+HOST+"/facility/build.php",c,function(){});
						var tid=setTimeout(function(){location.reload(false);},INTERVAL);

						GM_setValue(HOST+PGNAME+"OPT_BUILD_VID" , getVillageID(vId) );
						var nowTime = new Date();
						Reload_Flg = 0;
						return;
					}
				}
			}
		}
	});


	if(Reload_Flg == 1){
		//1分後にリロードし、再度建築できるかチェックする。
		var tid=setTimeout(function(){location.reload();},60000);
	}

}


//////////////////////////////////////////////////////////////////////////////////////////

//施設一覧取得
function get_area(){
	var results = document.evaluate('//area', document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	var area = new Array();
	for(var i=0,n=0; i<results.snapshotLength; i++){
		if(results.snapshotItem(i).alt.match(/(.*?)\s.*?(\d+)/)){
			var strURL = results.snapshotItem(i).href;
			area[n] = new lv_sort(RegExp.$1,RegExp.$2,getURLxy(strURL));
			n++;
		}
	}
	return area;
}

function get_area_all(){
	var results = document.evaluate('//area', document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	var area = new Array();
	for(var i=0,n=0; i<results.snapshotLength; i++){
		var strURL = results.snapshotItem(i).href;
		area[n] = new areas(results.snapshotItem(i).alt,getURLxy(strURL));
		n++;
	}
	return area;
}

// 既存の自動レベル上げに切り替える
function switchToAutoLevelUp(vId){
	var src = GM_getValue(HOST+PGNAME+vId, "");

	var Temp = src.split(DELIMIT1);
	var Temp2 = Temp[1].split(DELIMIT2);

	Temp2[4] = 1;	// 畑
	Temp2[5] = 1;	// 倉庫
	Temp2[9] = 1;	// 練兵所
	Temp2[15] = 1;	// 市場
	Temp2[17] = 1;	// 水車

	if (forInt(Temp2[14+74])) {
		Temp2[14] = 1;	// 兵器工房
	}
	if (forInt(Temp2[18+74])) {
		Temp2[18] = 1;	// 工場
	}

	Temp2[183] = 1; // OPT_REMOVE
	Temp2[230] = 0; // OPT_1112MURA
	Temp2[231] = 0; // OPT_0001S5MURA
	Temp2[232] = 0; // OPT_PLANT5MURAN
	Temp2[233] = 0; // OPT_PLANT5MURAE
	Temp2[234] = 0; // OPT_PLANT5MURAW
	Temp2[235] = 0; // OPT_PLANT5MURAS
	Temp2[236] = 0; // OPT_0001S7MURA
	Temp2[237] = 0; // OPT_0001S3MURA
	Temp2[238] = 0; // OPT_0000S8MURA
	if(Temp2[239] != ""){
		Temp2[239] = 0; // OPT_SHUKUSHA
		Temp2[240] = 0; // OPT_DAISHUKUSHA
	}
	if(Temp2[241] != ""){
		Temp2[241] = 0; // OPT_PLANT9MURA74
	}
	if(Temp2[242] != ""){
		Temp2[242] = 0; // OPT_1111S4MURA
	}
	if(Temp2[243] != ""){
		Temp2[243] = 0; // OPT_0000S6MURA
	}

	var save = Temp[0] + DELIMIT1 + Temp2.join(DELIMIT2);

	GM_setValue(HOST+PGNAME+vId, save);
	Load_OPT(vId);

	return true;
}

//施設建設
function createFacility(f, area){
	area.sort(cmp_areas);
	for(var i=0;i<area.length;i++){
		if(area[i].name == "平地"){ //一番最初に見つかった平地に建設
			var Temp = area[i].xy.split(",");
/*
			var mURL = CREATELINK;
			mURL = mURL.replace(URL_SITE,HOST);
			mURL = mURL.replace(URL_X,Temp[0]);
			mURL = mURL.replace(URL_Y,Temp[1]);
			mURL = mURL.replace(URL_viID,getVillageID(vId));
			mURL = mURL.replace(URL_fID,f);
			mURL = mURL.replace(URL_viSSID,getSessionId());							// 2012.04.24 ssid 追加
			var tid=setTimeout(function(){location.href = mURL;},INTERVAL);
*/
			var c = {};
			c['x']=parseInt(Temp[0],10);
			c['y']=parseInt(Temp[1],10);
			c['village_id']=getVillageID(vId);
			c['id']=f;
			c['ssid']=getSessionId();
			q$.post("http://"+HOST+"/facility/build.php",c,function(){});
			var tid=setTimeout(function(){location.reload(false);},INTERVAL);
			return;
		}
	}
}

var Hatake		= 215, // 畑
	Souko		= 233, // 倉庫
	Renpei		= 234, // 練兵所
	Shukusha	= 242, // 宿舎
	Kajiba		= 232, // 鍛冶場
	Bougu		= 231, // 防具工場
	Ichiba		= 217, // 市場
	Suisha		= 218, // 水車
	Heiki		= 241, // 兵器工房
	Koujou		= 219, // 工場
	Bassai		= 209, // 伐採所
	Ishikiri	= 211, // 石切り場
	Seitetsu	= 213, // 製鉄所
	Suzume		= 216, // 銅雀台
	Daishuku	= 244; // 大宿舎

// 指定座標に施設LVまで新規建築＆LVUP
function createFacilityEx(x, y, f, lv, area){
	if (f==0) {
		return false;
	}

	var create = 0, lvup = 0;
	var xy = parseInt(x,10).toString()+','+parseInt(y,10).toString();
	for(var i=0;i<area.length;i++){
		if (xy == area[i].xy) {
			if (area[i].name == '平地') {
				if ((f == Hatake   && Chek_Sigen(new lv_sort("畑",0,"")) != 1)
				||	(f == Souko    && Chek_Sigen(new lv_sort("倉庫",0,"")) != 1)
				||	(f == Renpei   && Chek_Sigen(new lv_sort("練兵所",0,"")) != 1)
				||	(f == Shukusha && Chek_Sigen(new lv_sort("宿舎",0,"")) != 1)
				||	(f == Kajiba   && Chek_Sigen(new lv_sort("鍛冶場",0,"")) != 1)
				||	(f == Bougu    && Chek_Sigen(new lv_sort("防具工場",0,"")) != 1)
				||	(f == Ichiba   && Chek_Sigen(new lv_sort("市場",0,"")) != 1)
				||	(f == Suisha   && Chek_Sigen(new lv_sort("水車",0,"")) != 1)
				||	(f == Heiki    && Chek_Sigen(new lv_sort("兵器工房",0,"")) != 1)
				||	(f == Koujou   && Chek_Sigen(new lv_sort("工場",0,"")) != 1)
				||	(f == Bassai   && Chek_Sigen(new lv_sort("伐採所",0,"")) != 1)
				||	(f == Ishikiri && Chek_Sigen(new lv_sort("石切り場",0,"")) != 1)
				||	(f == Seitetsu && Chek_Sigen(new lv_sort("製鉄所",0,"")) != 1)
				||	(f == Suzume   && Chek_Sigen(new lv_sort("銅雀台",0,"")) != 1)
				||	(f == Daishuku && Chek_Sigen(new lv_sort("大宿舎",0,"")) != 1)
				){
					create = 1;
				}
				break;
			}
			else if (f == Hatake   && area[i].name.match(/^(畑)\s.*?(\d+)/)			&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Souko    && area[i].name.match(/^(倉庫)\s.*?(\d+)/)		&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Renpei   && area[i].name.match(/^(練兵所)\s.*?(\d+)/)		&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Shukusha && area[i].name.match(/^(宿舎)\s.*?(\d+)/)		&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Kajiba   && area[i].name.match(/^(鍛冶場)\s.*?(\d+)/)		&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Bougu    && area[i].name.match(/^(防具工場)\s.*?(\d+)/)	&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Ichiba   && area[i].name.match(/^(市場)\s.*?(\d+)/)		&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Suisha   && area[i].name.match(/^(水車)\s.*?(\d+)/)		&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Heiki    && area[i].name.match(/^(兵器工房)\s.*?(\d+)/)	&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Koujou   && area[i].name.match(/^(工場)\s.*?(\d+)/)		&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Bassai   && area[i].name.match(/^(伐採所)\s.*?(\d+)/)		&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Ishikiri && area[i].name.match(/^(石切り場)\s.*?(\d+)/)	&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Seitetsu && area[i].name.match(/^(製鉄所)\s.*?(\d+)/)		&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Suzume   && area[i].name.match(/^(銅雀台)\s.*?(\d+)/)		&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			else if (f == Daishuku && area[i].name.match(/^(大宿舎)\s.*?(\d+)/)		&& parseInt(RegExp.$2,10) < lv && Chek_Sigen(new lv_sort(RegExp.$1,parseInt(RegExp.$2,10)+1,"")) != 1) lvup = 1;
			break;
		}
	}

	if (create || lvup) {
		var c = {};
		c['x']=parseInt(x,10);
		c['y']=parseInt(y,10);
		c['village_id']=getVillageID(vId);
		if (create) {
			c['id']=f;
		}
		c['ssid']=getSessionId();
		q$.post("http://"+HOST+"/facility/build.php",c,function(){});
		var tid=setTimeout(function(){location.reload(false);},INTERVAL);
		return true;
	}

	return false;
}
function checkVillageType(area, Arechi, Shinrin, Iwayama, Tekkouzan, Kokumotsu)
{
	var ArechiCnt		= 0, // 荒地
		KokumotsuCnt	= 0, // 穀物
		ShinrinCnt		= 0, // 森林
		IwayamaCnt		= 0, // 岩山
		TekkouzanCnt	= 0; // 鉄鉱山

	area.sort(cmp_areas);
	for(var i=0;i<area.length;i++){
		if(area[i].name == "荒地") ArechiCnt++; else
		if(area[i].name == "森林") ShinrinCnt++; else
		if(area[i].name == "岩山") IwayamaCnt++; else
		if(area[i].name == "鉄鉱山") TekkouzanCnt++; else
		if(area[i].name == "穀物") KokumotsuCnt++;
	}
	if ((Arechi  == -1 || Arechi  == ArechiCnt)
	&&	(Shinrin == -1 || Shinrin == ShinrinCnt)
	&&	(Iwayama == -1 || Iwayama == IwayamaCnt)
	&&	(Tekkouzan == -1 || Tekkouzan == TekkouzanCnt)
	&&	(Kokumotsu == -1 || Kokumotsu == KokumotsuCnt)
	) {
		return true;
	} else {
		return false;
	}
}
function checkReached(r){
	r[0] = true;
	return true;
}
function buildShukusha(vId){
	var area = get_area_all();

	var heichi = 0, renpei = 0, souko = 0;
	for(var i=0;i < area.length;i++){
		if(area[i].name == "平地"){heichi++;}
		else if(area[i].name.match(/練兵所/)){renpei++;}
		else if(area[i].name.match(/倉庫/)){souko++;}
	}
	if (heichi==0){return false;} // 空き地はない

	// 宿舎: [練兵所 レベル1]&[倉庫 レベル1]
	if (souko==0){
		createFacility(Souko, area);
		return true;
	}
	else if (renpei==0){
		createFacility(Renpei, area);
		return true;
	}
	else {
		createFacility(Shukusha, area);
		return true;
	}
}
function maxAreaLV(info, area) {
	if (area.name.match(new RegExp('^('+info.name+')\\s.*?(\\d+)'))) {
		var area_lv = parseInt(RegExp.$2,10);
		if (info.lv < area_lv){
			info.lv = area_lv;
			info.xy = area.xy;
		}
	}
}

function buildDaiShukusha(vId){
	var area = get_area_all();

	// 平地の数と、建設済施設および最大施設LVを取得
	var heichi = 0; // count
	var shukusha= new lv_sort("宿舎",0,"");
	var mihari	= new lv_sort("見張り台",0,"");
	for(var i=0;i < area.length;i++){
		if(area[i].name == "平地"){heichi++;continue;}
		maxAreaLV(shukusha, area[i]);
		maxAreaLV(mihari, area[i]);
	}
	if (heichi==0){return false;} // 空き地はない

	if (shukusha.lv >= 15 && mihari.lv >= 8) {
		if (Chek_Sigen(new lv_sort("大宿舎",0,"")) == 1) {
			return false;
		}
		createFacility(Daishuku, area);
		return true;
	}

	// 宿舎
	if (shukusha.lv < 15) {
		console.log("宿舎LV15が必要です。今はLV"+shukusha.lv);
	}
	if (mihari.lv < 8) {
		console.log("見張り台LV8が必要です。今はLV"+mihari.lv);
	}

	return false;
}
function build1112(vId){
	var area = get_area_all();
	if (! checkVillageType(area, 4,1,1,1,2)){
		return false;
	}

	// ★9(1-1-1-2)
	// まず畑で埋める
	var reached = [false];
	var handled =
	createFacilityEx(0, 4, Hatake, 1, area) ||
	createFacilityEx(0, 5, Hatake, 1, area) ||
	createFacilityEx(0, 6, Hatake, 1, area) ||

	createFacilityEx(1, 2, Hatake, 1, area) ||
	createFacilityEx(1, 3, Hatake, 1, area) ||
	createFacilityEx(1, 4, Hatake, 1, area) ||
//	createFacilityEx(1, 5, Suisha, 1, area) ||
	createFacilityEx(1, 6, Hatake, 1, area) ||

	createFacilityEx(2, 0, Hatake, 1, area) ||
	createFacilityEx(2, 1, Hatake, 1, area) ||
	createFacilityEx(2, 4, Hatake, 1, area) ||
	createFacilityEx(2, 5, Hatake, 1, area) ||
	createFacilityEx(2, 6, Hatake, 1, area) ||

	createFacilityEx(3, 0, Hatake, 1, area) ||
	createFacilityEx(3, 1, Hatake, 1, area) ||
	createFacilityEx(3, 5, Hatake, 1, area) ||
	createFacilityEx(3, 6, Hatake, 1, area) ||

	createFacilityEx(4, 0, Hatake, 1, area) ||
	createFacilityEx(4, 1, Hatake, 1, area) ||
	createFacilityEx(4, 5, Hatake, 1, area) ||
	createFacilityEx(4, 6, Hatake, 1, area) ||

	createFacilityEx(5, 0, Hatake, 1, area) ||
	createFacilityEx(5, 1, Hatake, 1, area) ||
	createFacilityEx(5, 2, Hatake, 1, area) ||
	createFacilityEx(5, 3, Hatake, 1, area) ||
	createFacilityEx(5, 4, Hatake, 1, area) ||
	createFacilityEx(5, 6, Hatake, 1, area) ||

	createFacilityEx(6, 0, Hatake, 1, area) ||
	createFacilityEx(6, 1, Hatake, 1, area) ||
	createFacilityEx(6, 2, Hatake, 1, area) ||
	createFacilityEx(6, 3, Hatake, 1, area) ||
	createFacilityEx(6, 4, Hatake, 1, area) ||
	createFacilityEx(6, 5, Hatake, 1, area) ||
	createFacilityEx(6, 6, Hatake, 1, area) ||

	// 市場を作るのに必要な建設を行なう
	createFacilityEx(0, 0, Souko,  1, area) ||
	createFacilityEx(0, 1, Renpei, 3, area) ||
	createFacilityEx(0, 2, Shukusha, 1, area) ||
	createFacilityEx(0, 3, Bougu,  2, area) ||
	createFacilityEx(1, 0, Ichiba, 1, area) ||

	// ここまで来たら既存の自動LVUPに移管する
	checkReached(reached);
	if (reached[0]){
		switchToAutoLevelUp(vId);
	}
	return handled;
}

// ★5工場村
function buildPlant5(vId){
	var ArechiCnt		= 0, // 荒地
		KokumotsuCnt	= 0, // 穀物
		ShinrinCnt		= 0, // 森林
		IwayamaCnt		= 0, // 岩山
		TekkouzanCnt	= 0, // 鉄鉱山
		TargetType		= 0; // 伐採所 or 石切場 or 鉄鉱所
	var dirNorth = 0, dirSouth = 0, dirEast = 0, dirWest = 0; // 資源ブロックの配置チェック

	var vacant = new Array(); // 平地の座標
	var maps = new Array();
	var area = get_area_all();
	area.sort(cmp_areas);
	for(var i=0;i<area.length;i++){
		if(area[i].xy.length) maps.push(area[i].xy);
		if(area[i].name == "荒地") ArechiCnt++; else
		if(area[i].name == "穀物") KokumotsuCnt++; else
		if(area[i].name == "森林") ShinrinCnt++; else
		if(area[i].name == "岩山") IwayamaCnt++; else
		if(area[i].name == "鉄鉱山") TekkouzanCnt++; else
		if(area[i].name == "平地") vacant.push(area[i].xy);
	}
	if ((ArechiCnt == 21 && KokumotsuCnt == 0) ||	// 5-9期
		(ArechiCnt == 23 && KokumotsuCnt == 0))		// 10-11期
	{}else{return false;}
	if (maps.indexOf("2,2") == -1 && maps.indexOf("4,2") == -1) dirNorth=1;
	if (maps.indexOf("4,2") == -1 && maps.indexOf("4,4") == -1) dirEast=1;
	if (maps.indexOf("2,2") == -1 && maps.indexOf("2,4") == -1) dirWest=1;
	if (maps.indexOf("2,4") == -1 && maps.indexOf("4,4") == -1) dirSouth=1;
	var dirSum = dirNorth + dirSouth + dirEast + dirWest;
	if (dirSum == 1){}else{return false;}
		 if (ShinrinCnt == 6 && IwayamaCnt == 0 && TekkouzanCnt == 0) TargetType = Bassai;
	else if (ShinrinCnt == 0 && IwayamaCnt == 6 && TekkouzanCnt == 0) TargetType = Ishikiri;
	else if (ShinrinCnt == 0 && IwayamaCnt == 0 && TekkouzanCnt == 6) TargetType = Seitetsu;
	else return false;

	var reached = [false];
	var handled = false;

	// 資源ブロック 南パターン
	if (dirSouth == 1)
	{
		handled =
		// 水車周囲の畑を作る
		createFacilityEx(2, 1, Hatake, 1, area) ||
		createFacilityEx(2, 2, Hatake, 1, area) ||
		createFacilityEx(2, 3, Hatake, 1, area) ||
		createFacilityEx(3, 1, Hatake, 1, area) ||
		createFacilityEx(4, 1, Hatake, 1, area) ||
		createFacilityEx(4, 2, Hatake, 1, area) ||
		createFacilityEx(4, 3, Hatake, 1, area) ||

		// 工場周囲の収穫所を作る
		createFacilityEx(2, 6, TargetType, 1, area) ||
		createFacilityEx(4, 6, TargetType, 1, area) ||

		// 市場を作るのに必要な建設を行なう
		createFacilityEx(5, 5, Souko,  1, area) ||
		createFacilityEx(1, 4, Renpei, 3, area) ||
		createFacilityEx(1, 2, Shukusha, 1, area) ||
		createFacilityEx(5, 2, Bougu,  2, area) ||
		createFacilityEx(1, 5, Ichiba, 1, area) ||

		// 兵器工房を作る
		createFacilityEx(5, 3, Kajiba, 3, area) ||
		createFacilityEx(5, 2, Bougu,  3, area) ||
		createFacilityEx(1, 3, Heiki,  5, area) ||

		// 水車を作る
		createFacilityEx(1, 4, Renpei, 5, area) ||
		createFacilityEx(5, 5, Souko, 10, area) ||
		createFacilityEx(1, 5, Ichiba, 8, area) ||
		createFacilityEx(3, 2, Suisha, 1, area) ||

		// 工場を作る
		createFacilityEx(1, 5, Ichiba, 10, area) ||
		createFacilityEx(3, 5, Koujou,	1, area) ||

		false;
	}

	// 資源ブロック 東パターン
	if (dirEast == 1)
	{
		handled =
		// 水車周囲の畑を作る
		createFacilityEx(1, 2, Hatake, 1, area) ||
		createFacilityEx(1, 3, Hatake, 1, area) ||
		createFacilityEx(1, 4, Hatake, 1, area) ||
		createFacilityEx(2, 2, Hatake, 1, area) ||
		createFacilityEx(2, 4, Hatake, 1, area) ||
		createFacilityEx(3, 2, Hatake, 1, area) ||
		createFacilityEx(3, 4, Hatake, 1, area) ||

		// 工場周囲の収穫所を作る
		createFacilityEx(6, 2, TargetType, 1, area) ||
		createFacilityEx(6, 4, TargetType, 1, area) ||

		// 市場を作るのに必要な建設を行なう
		createFacilityEx(5, 1, Souko,  1, area) ||
		createFacilityEx(4, 5, Renpei, 3, area) ||
		createFacilityEx(2, 5, Shukusha, 1, area) ||
		createFacilityEx(2, 1, Bougu,  2, area) ||
		createFacilityEx(5, 5, Ichiba, 1, area) ||

		// 兵器工房を作る
		createFacilityEx(3, 1, Kajiba, 3, area) ||
		createFacilityEx(2, 1, Bougu,  3, area) ||
		createFacilityEx(3, 5, Heiki,  5, area) ||

		// 水車を作る
		createFacilityEx(4, 5, Renpei, 5, area) ||
		createFacilityEx(5, 1, Souko, 10, area) ||
		createFacilityEx(5, 5, Ichiba, 8, area) ||
		createFacilityEx(2, 3, Suisha, 1, area) ||

		// 工場を作る
		createFacilityEx(5, 5, Ichiba, 10, area) ||
		createFacilityEx(5, 3, Koujou,	1, area) ||

		false;
	}

	// 資源ブロック 西パターン
	if (dirWest == 1)
	{
		handled =
		// 水車周囲の畑を作る
		createFacilityEx(3, 2, Hatake, 1, area) ||
		createFacilityEx(4, 2, Hatake, 1, area) ||
		createFacilityEx(5, 2, Hatake, 1, area) ||
		createFacilityEx(5, 3, Hatake, 1, area) ||
		createFacilityEx(3, 4, Hatake, 1, area) ||
		createFacilityEx(4, 4, Hatake, 1, area) ||
		createFacilityEx(5, 4, Hatake, 1, area) ||

		// 工場周囲の収穫所を作る
		createFacilityEx(0, 2, TargetType, 1, area) ||
		createFacilityEx(0, 4, TargetType, 1, area) ||

		// 市場を作るのに必要な建設を行なう
		createFacilityEx(1, 5, Souko,  1, area) ||
		createFacilityEx(2, 1, Renpei, 3, area) ||
		createFacilityEx(4, 1, Shukusha, 1, area) ||
		createFacilityEx(4, 5, Bougu,  2, area) ||
		createFacilityEx(1, 1, Ichiba, 1, area) ||

		// 兵器工房を作る
		createFacilityEx(3, 5, Kajiba, 3, area) ||
		createFacilityEx(4, 5, Bougu,  3, area) ||
		createFacilityEx(3, 1, Heiki,  5, area) ||

		// 水車を作る
		createFacilityEx(2, 1, Renpei, 5, area) ||
		createFacilityEx(1, 5, Souko, 10, area) ||
		createFacilityEx(1, 1, Ichiba, 8, area) ||
		createFacilityEx(4, 3, Suisha, 1, area) ||

		// 工場を作る
		createFacilityEx(1, 1, Ichiba, 10, area) ||
		createFacilityEx(1, 3, Koujou,	1, area) ||

		false;
	}

	// 資源ブロック 北パターン
	if (dirNorth == 1)
	{
		handled =
		// 水車周囲の畑を作る
		createFacilityEx(2, 3, Hatake, 1, area) ||
		createFacilityEx(2, 4, Hatake, 1, area) ||
		createFacilityEx(2, 5, Hatake, 1, area) ||
		createFacilityEx(3, 5, Hatake, 1, area) ||
		createFacilityEx(4, 3, Hatake, 1, area) ||
		createFacilityEx(4, 4, Hatake, 1, area) ||
		createFacilityEx(4, 5, Hatake, 1, area) ||

		// 工場周囲の収穫所を作る
		createFacilityEx(2, 0, TargetType, 1, area) ||
		createFacilityEx(4, 0, TargetType, 1, area) ||

		// 市場を作るのに必要な建設を行なう
		createFacilityEx(1, 1, Souko,  1, area) ||
		createFacilityEx(5, 2, Renpei, 3, area) ||
		createFacilityEx(5, 4, Shukusha, 1, area) ||
		createFacilityEx(1, 4, Bougu,  2, area) ||
		createFacilityEx(5, 1, Ichiba, 1, area) ||

		// 兵器工房を作る
		createFacilityEx(1, 3, Kajiba, 3, area) ||
		createFacilityEx(1, 4, Bougu,  3, area) ||
		createFacilityEx(5, 3, Heiki,  5, area) ||

		// 水車を作る
		createFacilityEx(5, 2, Renpei, 5, area) ||
		createFacilityEx(1, 1, Souko, 10, area) ||
		createFacilityEx(5, 1, Ichiba, 8, area) ||
		createFacilityEx(3, 4, Suisha, 1, area) ||

		// 工場を作る
		createFacilityEx(5, 1, Ichiba, 10, area) ||
		createFacilityEx(3, 1, Koujou,	1, area) ||

		false;
	}
	return handled;
}

// ★9工場村
function buildPlant9m74(vId){
	var ArechiCnt		= 0, // 荒地
		KokumotsuCnt	= 0, // 穀物
		ShinrinCnt		= 0, // 森林
		IwayamaCnt		= 0, // 岩山
		TekkouzanCnt	= 0; // 鉄鉱山

	var vacant = new Array(); // 平地の座標
	var area = get_area_all();
	area.sort(cmp_areas);
	for(var i=0;i<area.length;i++){
		if(area[i].name == "荒地") ArechiCnt++; else
		if(area[i].name == "穀物") KokumotsuCnt++; else
		if(area[i].name == "森林") ShinrinCnt++; else
		if(area[i].name == "岩山") IwayamaCnt++; else
		if(area[i].name == "鉄鉱山") TekkouzanCnt++; else
		if(area[i].name == "平地") vacant.push(area[i].xy);
	}

	if (((ShinrinCnt + IwayamaCnt + TekkouzanCnt) == 7) &&
		((ShinrinCnt * IwayamaCnt * TekkouzanCnt) == 0))
	{}else{return false;}

	if (ArechiCnt == 0 && KokumotsuCnt == 4 && vacant.length <= 37)
	{}else{return false;}

	var reached = [false];
	var handled = false;

	//
	handled =
	// まず水車周囲を含む畑を作る
	createFacilityEx(0, 0, Hatake, 1, area) ||
	createFacilityEx(0, 2, Hatake, 1, area) ||
	createFacilityEx(0, 4, Hatake, 1, area) ||
	createFacilityEx(1, 3, Hatake, 1, area) ||
	createFacilityEx(1, 4, Hatake, 1, area) ||
	createFacilityEx(1, 5, Hatake, 1, area) ||
	createFacilityEx(2, 0, Hatake, 1, area) ||
	createFacilityEx(2, 2, Hatake, 1, area) ||
	createFacilityEx(2, 3, Hatake, 1, area) ||
	createFacilityEx(2, 4, Hatake, 1, area) ||
	createFacilityEx(2, 5, Hatake, 1, area) ||
	createFacilityEx(2, 6, Hatake, 1, area) ||
	createFacilityEx(3, 4, Hatake, 1, area) ||
	createFacilityEx(3, 5, Hatake, 1, area) ||
	createFacilityEx(3, 6, Hatake, 1, area) ||
	createFacilityEx(4, 3, Hatake, 1, area) ||
	createFacilityEx(4, 4, Hatake, 1, area) ||
	createFacilityEx(4, 6, Hatake, 1, area) ||
	createFacilityEx(5, 3, Hatake, 1, area) ||
	createFacilityEx(6, 3, Hatake, 1, area) ||
	createFacilityEx(6, 4, Hatake, 1, area) ||
	createFacilityEx(6, 6, Hatake, 1, area) ||

	// 市場を作るのに必要な建設を行なう
	createFacilityEx(3, 0, Souko,  1, area) ||
	createFacilityEx(4, 0, Renpei, 3, area) ||
	createFacilityEx(3, 1, Shukusha, 1, area) ||
	createFacilityEx(4, 1, Bougu,  2, area) ||
	createFacilityEx(6, 0, Ichiba, 1, area) ||

	// 兵器工房を作る
	createFacilityEx(5, 1, Kajiba, 3, area) ||
	createFacilityEx(4, 1, Bougu,  3, area) ||
	createFacilityEx(5, 0, Heiki,  5, area) ||

	// 水車周囲の畑LVUP,銅雀台の分は空けておく
	createFacilityEx(4, 4, Hatake, 5, area) ||
	createFacilityEx(4, 6, Hatake, 5, area) ||
	createFacilityEx(6, 4, Hatake, 5, area) ||
	createFacilityEx(6, 6, Hatake, 5, area) ||
//	createFacilityEx(0, 6, Suzume, 1, area) ||

	// 水車を作る
	createFacilityEx(4, 0, Renpei, 5, area) ||
	createFacilityEx(3, 0, Souko, 10, area) ||
	createFacilityEx(6, 0, Ichiba, 8, area) ||
	createFacilityEx(5, 5, Suisha, 1, area) ||

	// 工場を作る
	createFacilityEx(6, 0, Ichiba, 10, area) ||
	createFacilityEx(1, 1, Koujou,	1, area) ||

	// ここまで来たら既存の自動LVUPに移管する
	checkReached(reached);
	if (reached[0]){
		switchToAutoLevelUp(vId);
	}
	return handled;
}

function build0001S3(vId){
	var area = get_area_all();
	if (! checkVillageType(area,22,0,0,0,1)){
		return false;
	}

	// ★3(0-0-0-1)
	// まず畑で埋める
	var reached = [false];
	var handled =
	createFacilityEx(1, 2, Hatake, 1, area) ||
	createFacilityEx(1, 3, Hatake, 1, area) ||
	createFacilityEx(1, 4, Hatake, 1, area) ||

	createFacilityEx(2, 2, Hatake, 1, area) ||
	createFacilityEx(2, 3, Hatake, 1, area) ||
	createFacilityEx(2, 5, Hatake, 1, area) ||

	createFacilityEx(3, 1, Hatake, 1, area) ||
	createFacilityEx(3, 2, Hatake, 1, area) ||
	createFacilityEx(3, 4, Hatake, 1, area) ||
	createFacilityEx(3, 5, Hatake, 1, area) ||

	createFacilityEx(4, 1, Hatake, 1, area) ||
	createFacilityEx(4, 3, Hatake, 1, area) ||
	createFacilityEx(4, 4, Hatake, 1, area) ||
	createFacilityEx(4, 5, Hatake, 1, area) ||

	createFacilityEx(5, 2, Hatake, 1, area) ||
	createFacilityEx(5, 3, Hatake, 1, area) ||
	createFacilityEx(5, 4, Hatake, 1, area) ||
	createFacilityEx(5, 5, Hatake, 1, area) ||

	createFacilityEx(6, 5, Hatake, 1, area) ||

	// 市場を作るのに必要な建設を行なう
	createFacilityEx(0, 0, Souko,  1, area) ||
	createFacilityEx(1, 0, Renpei, 3, area) ||
	createFacilityEx(1, 1, Shukusha, 1, area) ||
	createFacilityEx(2, 1, Bougu,  2, area) ||
	createFacilityEx(6, 6, Ichiba, 1, area) ||

	// ここまで来たら既存の自動LVUPに移管する
	checkReached(reached);
	if (reached[0]){
		switchToAutoLevelUp(vId);
	}
	return handled;
}

function build0001S5(vId){
	var area = get_area_all();
	if (! checkVillageType(area,19,0,0,0,1)){
		return false;
	}

	// ★5(0-0-0-1)
	// まず畑で埋める
	var reached = [false];
	var handled =
	createFacilityEx(0, 6, Hatake, 1, area) ||

	createFacilityEx(1, 3, Hatake, 1, area) ||
	createFacilityEx(1, 4, Hatake, 1, area) ||

	createFacilityEx(2, 1, Hatake, 1, area) ||
	createFacilityEx(2, 2, Hatake, 1, area) ||
	createFacilityEx(2, 3, Hatake, 1, area) ||
//	createFacilityEx(2, 4, Suisha, 1, area) ||
	createFacilityEx(2, 5, Hatake, 1, area) ||

	createFacilityEx(3, 1, Hatake, 1, area) ||
	createFacilityEx(3, 2, Hatake, 1, area) ||
	createFacilityEx(3, 4, Hatake, 1, area) ||
	createFacilityEx(3, 5, Hatake, 1, area) ||

	createFacilityEx(4, 1, Hatake, 1, area) ||
	createFacilityEx(4, 2, Hatake, 1, area) ||
	createFacilityEx(4, 3, Hatake, 1, area) ||
	createFacilityEx(4, 4, Hatake, 1, area) ||

	createFacilityEx(5, 2, Hatake, 1, area) ||
	createFacilityEx(5, 3, Hatake, 1, area) ||
	createFacilityEx(5, 4, Hatake, 1, area) ||
	createFacilityEx(5, 5, Hatake, 1, area) ||
	createFacilityEx(5, 6, Hatake, 1, area) ||

	createFacilityEx(6, 5, Hatake, 1, area) ||
	createFacilityEx(6, 6, Hatake, 1, area) ||

	// 市場を作るのに必要な建設を行なう
	createFacilityEx(0, 0, Souko,  1, area) ||
	createFacilityEx(1, 0, Renpei, 3, area) ||
	createFacilityEx(0, 1, Shukusha, 1, area) ||
	createFacilityEx(1, 1, Bougu,  2, area) ||
	createFacilityEx(6, 0, Ichiba, 1, area) ||

	// ここまで来たら既存の自動LVUPに移管する
	checkReached(reached);
	if (reached[0]){
		switchToAutoLevelUp(vId);
	}
	return handled;
}

function build0001S7(vId){
	var area = get_area_all();
	if (! checkVillageType(area,15,0,0,0,1)){
		return false;
	}

	// ★7(0-0-0-1)
	// まず畑で埋める
	var reached = [false];
	var handled =
	createFacilityEx(0, 2, Hatake, 1, area) ||
	createFacilityEx(0, 3, Hatake, 1, area) ||
	createFacilityEx(0, 4, Hatake, 1, area) ||
	createFacilityEx(0, 5, Hatake, 1, area) ||
	createFacilityEx(0, 6, Hatake, 1, area) ||

	createFacilityEx(1, 2, Hatake, 1, area) ||
	createFacilityEx(1, 4, Hatake, 1, area) ||
	createFacilityEx(1, 5, Hatake, 1, area) ||
	createFacilityEx(1, 6, Hatake, 1, area) ||

	createFacilityEx(2, 1, Hatake, 1, area) ||
	createFacilityEx(2, 2, Hatake, 1, area) ||
	createFacilityEx(2, 3, Hatake, 1, area) ||
	createFacilityEx(2, 5, Hatake, 1, area) ||

	createFacilityEx(3, 1, Hatake, 1, area) ||
	createFacilityEx(3, 2, Hatake, 1, area) ||
	createFacilityEx(3, 4, Hatake, 1, area) ||
	createFacilityEx(3, 5, Hatake, 1, area) ||

	createFacilityEx(4, 1, Hatake, 1, area) ||
	createFacilityEx(4, 2, Hatake, 1, area) ||
	createFacilityEx(4, 3, Hatake, 1, area) ||
	createFacilityEx(4, 4, Hatake, 1, area) ||

	createFacilityEx(5, 1, Hatake, 1, area) ||
	createFacilityEx(5, 2, Hatake, 1, area) ||
	createFacilityEx(5, 3, Hatake, 1, area) ||
	createFacilityEx(5, 5, Hatake, 1, area) ||

	createFacilityEx(6, 5, Hatake, 1, area) ||

	// 市場を作るのに必要な建設を行なう
	createFacilityEx(0, 0, Souko,  1, area) ||
	createFacilityEx(1, 0, Renpei, 3, area) ||
	createFacilityEx(0, 1, Shukusha, 1, area) ||
	createFacilityEx(1, 1, Bougu,  2, area) ||
	createFacilityEx(6, 2, Ichiba, 1, area) ||

	// ここまで来たら既存の自動LVUPに移管する
	checkReached(reached);
	if (reached[0]){
		switchToAutoLevelUp(vId);
	}
	return handled;
}

function build0000S8(vId){
	var area = get_area_all();
	if (! checkVillageType(area, 12,0,0,0,0)){
		return false;
	}

	// ★8(0-0-0-0)
	// まず畑で埋める
	var reached = [false];
	var handled =
	createFacilityEx(0, 2, Hatake, 1, area) ||
	createFacilityEx(0, 3, Hatake, 1, area) ||
	createFacilityEx(0, 4, Hatake, 1, area) ||

	createFacilityEx(1, 1, Hatake, 1, area) ||
	createFacilityEx(1, 2, Hatake, 1, area) ||
//	createFacilityEx(1, 3, Suisha, 1, area) ||
	createFacilityEx(1, 4, Hatake, 1, area) ||
	createFacilityEx(1, 5, Hatake, 1, area) ||

	createFacilityEx(2, 0, Hatake, 1, area) ||
	createFacilityEx(2, 1, Hatake, 1, area) ||
	createFacilityEx(2, 3, Hatake, 1, area) ||
	createFacilityEx(2, 5, Hatake, 1, area) ||
	createFacilityEx(2, 6, Hatake, 1, area) ||

	createFacilityEx(3, 0, Hatake, 1, area) ||
	createFacilityEx(3, 1, Hatake, 1, area) ||
	createFacilityEx(3, 2, Hatake, 1, area) ||
	createFacilityEx(3, 4, Hatake, 1, area) ||
	createFacilityEx(3, 5, Hatake, 1, area) ||
	createFacilityEx(3, 6, Hatake, 1, area) ||

	createFacilityEx(4, 0, Hatake, 1, area) ||
	createFacilityEx(4, 1, Hatake, 1, area) ||
	createFacilityEx(4, 3, Hatake, 1, area) ||
	createFacilityEx(4, 5, Hatake, 1, area) ||
	createFacilityEx(4, 6, Hatake, 1, area) ||

	createFacilityEx(5, 1, Hatake, 1, area) ||
	createFacilityEx(5, 2, Hatake, 1, area) ||
	createFacilityEx(5, 3, Hatake, 1, area) ||
	createFacilityEx(5, 4, Hatake, 1, area) ||
	createFacilityEx(5, 5, Hatake, 1, area) ||

	createFacilityEx(6, 2, Hatake, 1, area) ||
	createFacilityEx(6, 3, Hatake, 1, area) ||
	createFacilityEx(6, 4, Hatake, 1, area) ||

	// 市場を作るのに必要な建設を行なう
	createFacilityEx(0, 0, Souko,  1, area) ||
	createFacilityEx(0, 6, Renpei, 3, area) ||
	createFacilityEx(1, 3, Shukusha, 1, area) ||
	createFacilityEx(6, 0, Bougu,  2, area) ||
	createFacilityEx(6, 6, Ichiba, 1, area) ||

	// ここまで来たら既存の自動LVUPに移管する
	checkReached(reached);
	if (reached[0]){
		switchToAutoLevelUp(vId);
	}
	return handled;
}

function build1111S4(vId){
	var area = get_area_all();
	if (! checkVillageType(area, 18,1,1,1,1)){
		return false;
	}

	// ★4(1-1-1-1) 資源+水車
	var reached = [false];
	var handled =
	createFacilityEx(3, 4, Hatake, 1, area) ||
	createFacilityEx(3, 5, Hatake, 1, area) ||

	createFacilityEx(4, 3, Hatake, 1, area) ||
//	createFacilityEx(4, 4, Suisha, 1, area) ||
	createFacilityEx(4, 5, Hatake, 1, area) ||

	createFacilityEx(5, 3, Hatake, 1, area) ||
	createFacilityEx(5, 4, Hatake, 1, area) ||

	createFacilityEx(1, 2, Bassai, 1, area) ||
	createFacilityEx(2, 1, Bassai, 1, area) ||

	createFacilityEx(4, 1, Ishikiri, 1, area) ||
	createFacilityEx(5, 2, Ishikiri, 1, area) ||

	createFacilityEx(1, 4, Seitetsu, 1, area) ||
	createFacilityEx(2, 5, Seitetsu, 1, area) ||

	// 市場を作るのに必要な建設を行なう
	createFacilityEx(0, 0, Souko,  1, area) ||
	createFacilityEx(0, 3, Renpei, 3, area) ||
	createFacilityEx(1, 3, Shukusha, 1, area) ||
	createFacilityEx(2, 3, Bougu,  2, area) ||
	createFacilityEx(0, 6, Ichiba, 1, area) ||

	// ここまで来たら既存の自動LVUPに移管する
	checkReached(reached);
	if (reached[0]){
		switchToAutoLevelUp(vId);
	}
	return handled;
}

function build0000S6(vId){
	var area = get_area_all();
	if (! checkVillageType(area, 21,0,0,0,0)){
		return false;
	}

	// ★6(0-0-0-0) 水車
	var reached = [false];
	var handled =
	createFacilityEx(1, 1, Hatake, 1, area) ||
	createFacilityEx(1, 2, Hatake, 1, area) ||
	createFacilityEx(1, 3, Hatake, 1, area) ||

	createFacilityEx(2, 1, Hatake, 1, area) ||
//	createFacilityEx(2, 2, Suisha, 1, area) ||
	createFacilityEx(2, 3, Hatake, 1, area) ||

	createFacilityEx(3, 1, Hatake, 1, area) ||
	createFacilityEx(3, 2, Hatake, 1, area) ||

	// 市場を作るのに必要な建設を行なう
	createFacilityEx(0, 3, Souko,  1, area) ||
	createFacilityEx(3, 0, Renpei, 3, area) ||
	createFacilityEx(4, 1, Shukusha, 1, area) ||
	createFacilityEx(5, 1, Bougu,  2, area) ||
	createFacilityEx(6, 3, Ichiba, 1, area) ||

	// ここまで来たら既存の自動LVUPに移管する
	checkReached(reached);
	if (reached[0]){
		switchToAutoLevelUp(vId);
	}
	return handled;
}

function areas(name,xy){
	this.name = name;
	this.xy = xy;
}

//比較する関数
function cmp_areas(a,b){
	if(a.xy > b.xy){return 1;} else {return -1;}
}

// 次拠点移動
function forwardNextVillage(){
	// 巡回停止中ならスキップ 2012.01.24
	if (GM_getValue(HOST+PGNAME+"AutoFlg", true) == false) { return; }

	var nowTime = new Date();
	var nextTime = getNextTime(location.hostname, nowTime);
	var waitTime = nextTime - nowTime;
	var roundTime = 0;

// @@ add 2011.10.04 @@

	if (tidMain2 != undefined) { clearInterval(tidMain2); }

	if ((ShopFlg == true) && (ShopURL != "")) {
		roundTime = 10 * 1000;
		tidMain2=setTimeout(function(){location.href = ShopURL;},roundTime);
	}

	// 建築済みで次建築がセットされていない未巡回の拠点への移動(２拠点同時に完了した場合に使う処理)
	var villages = loadVillages(location.hostname + PGNAME);
	for (var i = 0; i < villages.length; i++) {
		var actions = sortAction(villages[i][IDX_ACTIONS]);
		var nowTime = new Date();
		for (var j = 0; j < actions.length; j++) {
			var actionDiv = createActionDiv(actions[j], nowTime, villages[i][IDX_XY], location.hostname);
			if (!actionDiv) continue;

			var actionTime = new Date(actions[j][IDX2_TIME]);
			var moveFlg = 0;
			if ( actionTime < nowTime && actions[j][IDX2_ROTATION] == 0 && actions[j][IDX2_TYPE] == TYPE_CONSTRUCTION){
				for (var x = j + 1; x < actions.length; x++){
					actionTime = new Date(actions[x][IDX2_TIME]);
					if ( actionTime > nowTime && actions[x][IDX2_ROTATION] == 0 && actions[x][IDX2_TYPE] == TYPE_CONSTRUCTION){
						moveFlg = 1;
						break;
					}
				}
				if ( !(x < actions.length) ) {
					actions[j][IDX2_ROTATION] = 1;
				}
				if (moveFlg == 0) {
					var data = new Array();
					data[IDX_BASE_NAME] = villages[i][IDX_BASE_NAME];
					data[IDX_XY] = villages[i][IDX_XY];
					data[IDX_ACTIONS] = actions;

					if (location.pathname == "/village.php") {
						var vcURL = villages[i][IDX_URL];
							if(vcURL!=undefined){
								saveVillages(HOST+PGNAME, villages);
								roundTime = 5 * 1000;
								tidMain2=setTimeout(function(){location.href = vcURL;},roundTime);
							}
					}
				}
			}
		}
	}
	if ( tidMain2 == undefined ) {
		//一番早い作業完了時刻を取得
		var startTime = new Date("2099/12/31 23:59:59");
		var nextTime = startTime;
		var baseTime = new Date();

		nextURL = "";
		// 次回建設終了予定の検索
		for (var i = 0; i < villages.length; i++) {
			var actions = villages[i][IDX_ACTIONS];
			for (var j = 0; j < actions.length; j++) {
				var actionTime = new Date(actions[j][IDX2_TIME]);
				if (actionTime > baseTime && actionTime < nextTime && actions[j][IDX2_TYPE] == TYPE_CONSTRUCTION) {
					var type = actions[j][IDX2_TYPE].charAt(0);
					nextTime = actionTime;
					nextURL  = villages[i][IDX_URL];
					nextNAME = villages[i][IDX_BASE_NAME];
				}
			}
		}

		var nTime = (nextTime - nowTime);
		var vcURL = nextVillageURL(getVillageID(vId));

		if(vcURL!=undefined){
			if (nextURL == "") {
				// 次回建築完了予定がない場合は通常巡回処理
				roundTime = parseInt(OPT_ROUND_TIME1,10) * 1000;
				tidMain2=setTimeout(function(){location.href = vcURL;},roundTime);
			} else {
				if (parseInt(OPT_ROUND_TIME1,10) * 1000 > nTime) {
					// 巡回時間より前に建築が終わる拠点がある場合
					// 2011.12.06 即時変更をやめて10秒後に修正
//					tidMain2=setTimeout(function(){location.href = nextURL;},(nextTime - nowTime));
//					tidMain2=setTimeout(function(){location.href = nextURL;},10 * 1000);
					roundTime = (nextTime - nowTime + 10000);
					tidMain2=setTimeout(function(){location.href = nextURL;},roundTime);
				} else {
					// 通常巡回処理
					roundTime = parseInt(OPT_ROUND_TIME1,10) * 1000;
					tidMain2=setTimeout(function(){location.href = vcURL;},roundTime);
				}
			}
		}
	}
debugLog("nTime:" + nTime / 1000 + "sec  RoundTime:" + (roundTime / 1000) + "sec  forwardNextVillage:" + vcURL + " " + roundTime);
}

//比較する関数
function cmp_time(a,b){
	if(a.xy > b.xy){return 1;} else {return -1;}
}

// 次拠点URL取得
function nextVillageURL(vId2){
	var villages = loadVillages(HOST+PGNAME);
	var nextIndex = 0;
	var chkNextVID = new Array();
	for(var i=0; i<villages.length;i++){
		var tChk1 = GM_getValue(HOST+PGNAME+"OPT_CHKBOX_AVC_"+i, true);
		if(tChk1==true){
			chkNextVID.push(villages[i][IDX_URL]);
		}
	}

	// 現在の拠点のインデックスを検索 2012.01.24 逆順処理追加
	for(var i=0; i<chkNextVID.length;i++){
		var url = chkNextVID[i];
		if(vId2 == getParameter2(chkNextVID[i], "village_id")){
			if (getReverseMode() == false) {
				// 正巡回
				if(i+1 < chkNextVID.length){
					nextIndex = i+1;
				}else{
					nextIndex = 0;
				}
			} else {
				// 逆巡回
				if(i-1 < 0){
					nextIndex = chkNextVID.length-1;
				} else {
					nextIndex = i-1;
				}
			}
			break;
		}
	}
	return chkNextVID[nextIndex];
}


// URLパラメタ取得
function getParameter2(url, key) {
	var str = url.split("?");
	if (str.length < 2) {
		return "";
	}

	var params = str[1].split("&");
	for (var i = 0; i < params.length; i++) {
		var keyVal = params[i].split("=");
		if (keyVal[0] == key && keyVal.length == 2) {
			return decodeURIComponent(keyVal[1]);
		}
	}
	return "";
}


//建築物の格納用
function lv_sort(name,lv,xy){
	this.name = name;
	this.lv = lv;
	this.xy = xy;
}
//比較する関数
function cmp_lv(a,b){
	return a.lv - b.lv;
}

function cmp_lv2(a,b){
	return b.lv - a.lv;
}
//拠点IDの取得
function getVillageID(vId){
	//villages
	var villages = loadVillages(HOST+PGNAME);
	for(var i=0; i<villages.length;i++){
		if(villages[i][IDX_XY] == vId){
			var vURL = villages[i][IDX_URL];
			var temp = vURL.split("?");
			var temp2 = temp[1].split("=");
			return temp2[1];
		}
	}
}
function getURLxy(strURL){
	if(strURL == ""){ return "";}
	var strTemp = "";
	strTemp = strURL;
	var Temp = strTemp.split("?");
	var Temp2 = Temp[1].split("&");
	var Temp3 = Temp2[0].split("=");
	var Temp4 = Temp2[1].split("=");
	var Temp5 = Temp4[1].split("#");		// 2013.12.18
	return Temp3[1] + "," +Temp5[0];		// 2013.12.18
}

//リンクHTML追加
function addOpenLinkHtml() {
	if (location.hostname[0] == "s" || location.hostname[0] == "h" || location.hostname[0] == "p") {
//			var sidebar = d.evaluate('//*[@class="copyright"]',d, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		var sidebar = d.evaluate('//*[@class="sideBoxHead"]/h3/strong',d, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	} else {
		var sidebar = d.evaluate('//a[@title="拠点"]',d, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	}
	if (sidebar.snapshotLength == 0){
		sidebar = d.evaluate('//*[@class="xy"]',d, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if (sidebar.snapshotLength == 0) return;
		isMixi = false;
	}

	//自動移動リンク
	var openLink = d.createElement("a");
	openLink.id = "Auto_Bilder";
	openLink.href = "javascript:void(0);";
	openLink.style.marginTop = "0px";
	openLink.style.marginLeft = "0px";
	openLink.innerHTML = " [自動建築]";
/*
	if (location.hostname[0] == "s" || location.hostname[0] == "h") {
		openLink.style.color = "#000000";
	} else {
		openLink.style.color = "#FFFFFF";
	}
*/
	openLink.style.color = "#FFFFFF";
	openLink.style.cursor = "pointer";

	openLink.addEventListener("click", function() {
		closeIniBilderBox();
		openIniBilderBox();
	}, true);
	if (location.hostname[0] == "s" || location.hostname[0] == "h") {
		sidebar.snapshotItem(1).appendChild(openLink);
	} else {
		sidebar.snapshotItem(0).appendChild(openLink);
	}
}

//建築設定画面を開く
function openIniBilderBox() {
	addIniBilderHtml();
}

//建築設定画面を閉じる
function closeIniBilderBox() {
	deleteIniBilderHtml();
	deleteIniBilderFrameHtml();
}
//建築対象拠点表示HTML削除
function deleteIniBilderHtml() {
	var elem = d.getElementById("ABContainer");
	if (elem == undefined) return;
	d.body.removeChild(d.getElementById("ABContainer"));
}
//建築対象拠点表示HTML削除
function deleteIniBilderFrameHtml() {
	var elem = d.getElementById("ABContainer");
	if (elem == undefined) return;
	d.body.removeChild(document.getElementById("ABContainer"));
}

//LvUP対象施設設定画面を開く
function openInifacBox(vId) {
	if (tidMain2 != undefined) { clearInterval(tidMain2); }
	if (tidMain3 != undefined) { clearInterval(tidMain3); }
	closeInifacBox();
	addInifacHtml(vId);
}
///LvUP対象施設設定画面を閉じる
function closeInifacBox() {
	deleteInifacHtml();
	deleteInifacFrameHtml();
}

// 水車村化オプションのチェックボックスをクリアする
function clearWaterwheelBox(){
	var checkbox = $a('//input[@id="OPT_1112MURA"]');	checkbox[0].checked = false; // 水車村化
	var checkbox = $a('//input[@id="OPT_0001S3MURA"]');	checkbox[0].checked = false; // 水車村化
	var checkbox = $a('//input[@id="OPT_0001S5MURA"]');	checkbox[0].checked = false; // 水車村化
	var checkbox = $a('//input[@id="OPT_0001S7MURA"]');	checkbox[0].checked = false; // 水車村化
	var checkbox = $a('//input[@id="OPT_0000S8MURA"]');	checkbox[0].checked = false; // 水車村化
	var checkbox = $a('//input[@id="OPT_1111S4MURA"]');	checkbox[0].checked = false; // 水車村化
	var checkbox = $a('//input[@id="OPT_0000S6MURA"]');	checkbox[0].checked = false; // 水車村化
	var checkbox = $a('//input[@id="OPT_PLANT5MURAN"]');	checkbox[0].checked = false; // 工場村化
	var checkbox = $a('//input[@id="OPT_PLANT9MURA74"]');	checkbox[0].checked = false; // 工場村化
}

///LvUP対象施設設のチェックボックスをクリアする
function clearInifacBox() {

	var checkbox = $a('//input[@id="OPT_CHKBOX0"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX1"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX2"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX3"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX4"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX5"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX6"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX7"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX8"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX9"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX10"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX11"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX12"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX13"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX14"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX15"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX16"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX17"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX18"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX19"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX20"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX21"]');	checkbox[0].checked = false;
	var checkbox = $a('//input[@id="OPT_CHKBOX22"]');	checkbox[0].checked = false;

	var textbox = $a('//input[@id="OPT_CHKBOXLV0"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV1"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV2"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV3"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV4"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV5"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV6"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV7"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV8"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV9"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV10"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV11"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV12"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV13"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV14"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV15"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV16"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV17"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV18"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV19"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV20"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV21"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_CHKBOXLV22"]');	textbox[0].value = 0;
	// 内政設定
	var checkbox = $a('//input[@id="OPT_DOME1"]');	checkbox[0].checked = false;	// 伐採知識
	var checkbox = $a('//input[@id="OPT_DOME2"]');	checkbox[0].checked = false;	// 伐採技術
	var checkbox = $a('//input[@id="OPT_DOME3"]');	checkbox[0].checked = false;	// 弓兵増強
	var checkbox = $a('//input[@id="OPT_DOME4"]');	checkbox[0].checked = false;	// 石切知識
	var checkbox = $a('//input[@id="OPT_DOME5"]');	checkbox[0].checked = false;	// 石切技術
	var checkbox = $a('//input[@id="OPT_DOME6"]');	checkbox[0].checked = false;	// 槍兵増強
	var checkbox = $a('//input[@id="OPT_DOME7"]');	checkbox[0].checked = false;	// 製鉄知識
	var checkbox = $a('//input[@id="OPT_DOME8"]');	checkbox[0].checked = false;	// 製鉄技術
	var checkbox = $a('//input[@id="OPT_DOME9"]');	checkbox[0].checked = false;	// 騎兵増強
	var checkbox = $a('//input[@id="OPT_DOME10"]'); checkbox[0].checked = false;	// 食糧知識
	var checkbox = $a('//input[@id="OPT_DOME11"]'); checkbox[0].checked = false;	// 食糧技術
	var checkbox = $a('//input[@id="OPT_DOME12"]'); checkbox[0].checked = false;	// 農林知識
	var checkbox = $a('//input[@id="OPT_DOME13"]'); checkbox[0].checked = false;	// 農林技術
	var checkbox = $a('//input[@id="OPT_DOME14"]'); checkbox[0].checked = false;	// 加工知識
	var checkbox = $a('//input[@id="OPT_DOME15"]'); checkbox[0].checked = false;	// 加工技術
	var checkbox = $a('//input[@id="OPT_DOME16"]'); checkbox[0].checked = false;	// 富国
	var checkbox = $a('//input[@id="OPT_DOME17"]'); checkbox[0].checked = false;	// 富国論
	var checkbox = $a('//input[@id="OPT_DOME18"]'); checkbox[0].checked = false;	// 富国強兵
	var checkbox = $a('//input[@id="OPT_DOME19"]'); checkbox[0].checked = false;	// 豊穣
	var checkbox = $a('//input[@id="OPT_DOME20"]'); checkbox[0].checked = false;	// 美玉歌舞
	var checkbox = $a('//input[@id="OPT_DOME21"]'); checkbox[0].checked = false;	// 恵風
	var checkbox = $a('//input[@id="OPT_DOME22"]'); checkbox[0].checked = false;	// 人選眼力
	var checkbox = $a('//input[@id="OPT_DOME23"]'); checkbox[0].checked = false;	// 呉の治世
	var checkbox = $a('//input[@id="OPT_DOME24"]'); checkbox[0].checked = false;	// 王佐の才
	var checkbox = $a('//input[@id="OPT_DOME37"]'); checkbox[0].checked = false;	// 豊潤祈祷
	var checkbox = $a('//input[@id="OPT_DOME38"]'); checkbox[0].checked = false;	// 食糧革命
	var checkbox = $a('//input[@id="OPT_DOME39"]'); checkbox[0].checked = false;	// 陳留王政
	// 糧村オプション
	var checkbox = $a('//input[@id="OPT_KATEMURA"]');	checkbox[0].checked = false; // 糧村化
	var checkbox = $a('//input[@id="OPT_SHUKUSHA"]');	checkbox[0].checked = false; // 宿舎
	var checkbox = $a('//input[@id="OPT_DAISHUKUSHA"]');checkbox[0].checked = false; // 大宿舎
	clearWaterwheelBox(); // 水車村オプション
	// 宿舎村オプション
	var checkbox = $a('//input[@id="OPT_DORM"]');		checkbox[0].checked = false; // 宿舎村化 2013.12.26
	// 自動造兵
	var checkbox = $a('//input[@id="OPT_BLD_SOL"]');	checkbox[0].checked = false;
	// 自動武器・防具強化
	var checkbox = $a('//input[@id="OPT_BKBG_CHK"]');	checkbox[0].checked = false;
	// 自動削除 2015.05.10
	clearRemoveBox();
}

// 自動削除 2015.05.10
function clearRemoveBox(){
	var checkbox = $a('//input[@id="OPT_REMOVE"]'); 	checkbox[0].checked = false;

	for(var i=0; i<=22; i++){
	var checkbox = $a('//input[@id="OPT_RM_CHKBOX'+i+'"]');  if(checkbox.length != 0) checkbox[0].checked = false;
	var textbox  = $a('//input[@id="OPT_RM_CHKBOXLV'+i+'"]'); if(textbox.length != 0) textbox[0].value = 0;
	}
}

function InitPreset_01(){	// 衝車研究まで
	clearInifacBox();

	var checkbox = $a('//input[@id="OPT_CHKBOX7"]');	checkbox[0].checked = true; 		// 鍛冶場
	var checkbox = $a('//input[@id="OPT_CHKBOX8"]');	checkbox[0].checked = true; 		// 防具工場
	var checkbox = $a('//input[@id="OPT_CHKBOX9"]');	checkbox[0].checked = true; 		// 練兵所
	var checkbox = $a('//input[@id="OPT_CHKBOX14"]');	checkbox[0].checked = false;		// 兵器工房
	var checkbox = $a('//input[@id="OPT_CHKBOX19"]');	checkbox[0].checked = true; 		// 研究所

	var textbox  = $a('//input[@id="OPT_CHKBOXLV7"]');	 textbox[0].value = "3";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV8"]');	 textbox[0].value = "3";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV9"]');	 textbox[0].value = "3";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV14"]');	 textbox[0].value = "8";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV19"]');	 textbox[0].value = "5";
}

function InitPreset_02(){	// 訓練所まで
	clearInifacBox();

	var checkbox = $a('//input[@id="OPT_CHKBOX4"]');	checkbox[0].checked = true;		// 畑
	var checkbox = $a('//input[@id="OPT_CHKBOX5"]');	checkbox[0].checked = true;		// 倉庫
	var checkbox = $a('//input[@id="OPT_CHKBOX6"]');	checkbox[0].checked = true; 		// 銅雀台
	var checkbox = $a('//input[@id="OPT_CHKBOX7"]');	checkbox[0].checked = true; 		// 鍛冶場
	var checkbox = $a('//input[@id="OPT_CHKBOX9"]');	checkbox[0].checked = true; 		// 練兵所
	var checkbox = $a('//input[@id="OPT_CHKBOX16"]');	checkbox[0].checked = true; 		// 訓練所

	var textbox  = $a('//input[@id="OPT_CHKBOXLV4"]');	 textbox[0].value = "5";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV5"]');	 textbox[0].value = "1";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV6"]');	 textbox[0].value = "7";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV7"]');	 textbox[0].value = "5";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV9"]');	 textbox[0].value = "3";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV16"]');	 textbox[0].value = "5";
}

function InitPreset_03(){	// 遠征訓練所まで
	clearInifacBox();

	var checkbox = $a('//input[@id="OPT_CHKBOX4"]');	checkbox[0].checked = true;		// 畑
	var checkbox = $a('//input[@id="OPT_CHKBOX5"]');	checkbox[0].checked = true;		// 倉庫
	var checkbox = $a('//input[@id="OPT_CHKBOX6"]');	checkbox[0].checked = true; 		// 銅雀台
	var checkbox = $a('//input[@id="OPT_CHKBOX7"]');	checkbox[0].checked = true; 		// 鍛冶場
	var checkbox = $a('//input[@id="OPT_CHKBOX8"]');	checkbox[0].checked = true; 		// 防具工場
	var checkbox = $a('//input[@id="OPT_CHKBOX9"]');	checkbox[0].checked = true; 		// 練兵所
	var checkbox = $a('//input[@id="OPT_CHKBOX13"]');	checkbox[0].checked = true; 		// 宿舎
	var checkbox = $a('//input[@id="OPT_CHKBOX16"]');	checkbox[0].checked = true; 		// 訓練所
	var checkbox = $a('//input[@id="OPT_CHKBOX20"]');	checkbox[0].checked = true; 		// 大宿舎
	var checkbox = $a('//input[@id="OPT_CHKBOX21"]');	checkbox[0].checked = true; 		// 遠征訓練所
	var checkbox = $a('//input[@id="OPT_CHKBOX22"]');	checkbox[0].checked = true; 		// 見張り台

	var textbox  = $a('//input[@id="OPT_CHKBOXLV4"]');	 textbox[0].value = "5";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV5"]');	 textbox[0].value = "1";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV6"]');	 textbox[0].value = "7";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV7"]');	 textbox[0].value = "5";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV8"]');	 textbox[0].value = "7";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV9"]');	 textbox[0].value = "3";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV13"]');	 textbox[0].value = "15";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV16"]');	 textbox[0].value = "5";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV20"]');	 textbox[0].value = "8";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV21"]');	 textbox[0].value = "3";
	var textbox  = $a('//input[@id="OPT_CHKBOXLV22"]');	 textbox[0].value = "8";
}

function InitShukushaVillage(cb){
	// 宿舎化
	if (cb && !cb.checked) return;

	clearInifacBox();
	if (cb) cb.checked = true;

	var textbox = $a('//input[@id="OPT_CHKBOXLV5"]');	textbox[0].value = 1;	// 倉庫
	var textbox = $a('//input[@id="OPT_CHKBOXLV9"]');	textbox[0].value = 1;	// 練兵所
	var textbox = $a('//input[@id="OPT_CHKBOXLV13"]');	textbox[0].value = 15;	// 宿舎
	var checkbox= $a('//input[@id="OPT_CHKBOX13"]');	checkbox[0].checked = true;
}

function InitDaiShukushaVillage(cb){
	// 大宿舎化
	if (cb && !cb.checked) return;

	clearInifacBox();
	if (cb) cb.checked = true;

	var textbox = $a('//input[@id="OPT_CHKBOXLV5"]');	textbox[0].value = 1;	// 倉庫
	var textbox = $a('//input[@id="OPT_CHKBOXLV9"]');	textbox[0].value = 3;	// 練兵所
	var textbox = $a('//input[@id="OPT_CHKBOXLV13"]');	textbox[0].value = 15;	// 宿舎
	var textbox = $a('//input[@id="OPT_CHKBOXLV8"]');	textbox[0].value = 7;	// 防具工場
	var textbox = $a('//input[@id="OPT_CHKBOXLV22"]');	textbox[0].value = 8;	// 見張り台
	var textbox = $a('//input[@id="OPT_CHKBOXLV20"]');	textbox[0].value = 20;	// 大宿舎
	var checkbox= $a('//input[@id="OPT_CHKBOX20"]');	checkbox[0].checked = true;

	var checkbox = $a('//input[@id="OPT_REMOVE"]');  		checkbox[0].checked = false; // 自動削除
	var checkbox = $a('//input[@id="OPT_RM_CHKBOX5"]');		checkbox[0].checked = true;	// 倉庫
	var textbox  = $a('//input[@id="OPT_RM_CHKBOXLV5"]');	 textbox[0].value = "0";
	var checkbox = $a('//input[@id="OPT_RM_CHKBOX9"]');		checkbox[0].checked = true;	// 練兵所
	var checkbox = $a('//input[@id="OPT_RM_CHKBOX8"]');		checkbox[0].checked = true;	// 防具工場
}

function InitSuishaVillage(cb){
	// 水車村
	if (cb && !cb.checked) return;

	clearInifacBox();
	if (cb) cb.checked = true;

	var textbox = $a('//input[@id="OPT_CHKBOXLV0"]');	textbox[0].value = 10;	// 拠点
	var textbox = $a('//input[@id="OPT_CHKBOXLV4"]');	textbox[0].value = 15;	// 畑
	var textbox = $a('//input[@id="OPT_CHKBOXLV5"]');	textbox[0].value = 10;	// 倉庫
	var textbox = $a('//input[@id="OPT_CHKBOXLV9"]');	textbox[0].value = 5;	// 練兵所
	var textbox = $a('//input[@id="OPT_CHKBOXLV15"]');	textbox[0].value = 8;	// 市場
	var textbox = $a('//input[@id="OPT_CHKBOXLV17"]');	textbox[0].value = 10;	// 水車

	var checkbox = $a('//input[@id="OPT_REMOVE"]');  		checkbox[0].checked = false; // 自動削除
	var checkbox = $a('//input[@id="OPT_RM_CHKBOX8"]');		checkbox[0].checked = true;	// 防具工場
	var checkbox = $a('//input[@id="OPT_RM_CHKBOX13"]');	checkbox[0].checked = true;	// 宿舎
	var textbox  = $a('//input[@id="OPT_RM_CHKBOXLV13"]');	 textbox[0].value = "0";

	return true;
}

function InitKoujoVillage(cb){
	// 工場村
	if (cb && !cb.checked) return;

	clearInifacBox();
	if (cb) cb.checked = true;

	var textbox = $a('//input[@id="OPT_CHKBOXLV0"]');	textbox[0].value = 10;	// 拠点
	var textbox = $a('//input[@id="OPT_CHKBOXLV1"]');	textbox[0].value = 9;	// 伐採所
	var textbox = $a('//input[@id="OPT_CHKBOXLV2"]');	textbox[0].value = 9;	// 石切り場
	var textbox = $a('//input[@id="OPT_CHKBOXLV3"]');	textbox[0].value = 9;	// 製鉄所
	var textbox = $a('//input[@id="OPT_CHKBOXLV4"]');	textbox[0].value = 15;	// 畑
	var textbox = $a('//input[@id="OPT_CHKBOXLV5"]');	textbox[0].value = 10;	// 倉庫
	var textbox = $a('//input[@id="OPT_CHKBOXLV9"]');	textbox[0].value = 5;	// 練兵所
	var textbox = $a('//input[@id="OPT_CHKBOXLV15"]');	textbox[0].value = 10;	// 市場
	var textbox = $a('//input[@id="OPT_CHKBOXLV17"]');	textbox[0].value = 10;	// 水車

	var textbox = $a('//input[@id="OPT_CHKBOXLV14"]');	textbox[0].value = 5;	// 兵器工房
	var textbox = $a('//input[@id="OPT_CHKBOXLV18"]');	textbox[0].value = 10;	// 工場

	var checkbox = $a('//input[@id="OPT_REMOVE"]');  		checkbox[0].checked = false; // 自動削除
	var checkbox = $a('//input[@id="OPT_RM_CHKBOX7"]');		checkbox[0].checked = true;	// 鍛冶場
	var checkbox = $a('//input[@id="OPT_RM_CHKBOX8"]');		checkbox[0].checked = true;	// 防具工場
	var checkbox = $a('//input[@id="OPT_RM_CHKBOX13"]');	checkbox[0].checked = true;	// 宿舎
	var textbox  = $a('//input[@id="OPT_RM_CHKBOXLV13"]');	 textbox[0].value = "0";

	return true;
}

// ここまで 2014.03.05 =============================================================================================================================================================
// 残す資源量のクリア
function clearInitRemainingRes(){
	var textbox = $a('//input[@id="OPT_BLD_WOOD"]');  textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BLD_STONE"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BLD_IRON"]');  textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BLD_RICE"]');  textbox[0].value = 0;
}

// 武器・防具強化レベルのクリア
function clearInitArmsArmor(){

	var textbox = $a('//input[@id="OPT_BK_LV1"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV8"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV3"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV9"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV5"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV4"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV7"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV12"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV13"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV15"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV16"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV17"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV18"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV19"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BK_LV20"]'); textbox[0].value = 0;

	var textbox = $a('//input[@id="OPT_BG_LV1"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV8"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV3"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV9"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV5"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV4"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV7"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV10"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV11"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV12"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV13"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV15"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV16"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV17"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV18"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV19"]'); textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_BG_LV20"]'); textbox[0].value = 0;
}

// 造兵時作成単位初期化
function clearInitSoldier(){

	var textbox = $a('//input[@id="OPT_SOL_ADD1"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD8"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD3"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD5"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD9"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD4"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD7"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD10"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD11"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD12"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD13"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD15"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD16"]');	textbox[0].value = 0;
	var textbox = $a('//input[@id="OPT_SOL_ADD17"]');	textbox[0].value = 0;
}

//建築対象施設表示HTML削除
function deleteInifacHtml() {
	var elem = d.getElementById("ABfacContainer");
	if (elem == undefined) return;
	d.body.removeChild(d.getElementById("ABfacContainer"));
}
//建築対象施設表示HTML削除
function deleteInifacFrameHtml() {
	var elem = d.getElementById("ABfacContainer");
	if (elem == undefined) return;
	d.body.removeChild(document.getElementById("ABfacContainer"));
}

//ステイタス取得HTML追加
function addIniBilderHtml() {

//	var popupLeft = 500;
//	var popupTop = 250;

// add 2011.09.27 設定画面移動
	var popupLeft = GM_getValue(location.hostname + PGNAME + "_popup_left", 150);
	var popupTop = GM_getValue(location.hostname + PGNAME + "_popup_top", 150);
	if (popupLeft < 0) popupLeft = 0;
	if (popupTop < 0) popupTop = 0;
// end

	// 表示コンテナ作成
	var ABContainer = d.createElement("div");
	ABContainer.id = "ABContainer";
	ABContainer.style.position = "absolute";
	ABContainer.style.backgroundColor = COLOR_FRAME;
	ABContainer.style.opacity= 1.0; // 透明度
	ABContainer.style.border = "solid 2px #000000";
	ABContainer.style.MozBorderRadius = "4px";	// 角丸
	ABContainer.style.top = popupTop + "px";
	ABContainer.style.left = popupLeft + "px";
	ABContainer.style.font = fontstyle;
	ABContainer.style.padding = "4px";
	ABContainer.style.zIndex = 999;
	d.body.appendChild(ABContainer);
	ABContainer.style.width = "640px";

	$e(ABContainer, "mousedown", function(event){
		if( event.target != $("ABContainer")) {return false;}
		g_MD="ABContainer";
		g_MX=event.pageX-parseInt(this.style.left,10);
		g_MY=event.pageY-parseInt(this.style.top,10);
		event.preventDefault();
	});

	$e(d, "mousemove", function(event){
		if(g_MD != "ABContainer") return true;
		var ABContainer = $("ABContainer");
		if( !ABContainer ) return true;
		var popupLeft = event.pageX - g_MX;
		var popupTop = event.pageY - g_MY;
		ABContainer.style.left = popupLeft + "px";
		ABContainer.style.top = popupTop + "px";
		//ポップアップ位置を永続保存
		GM_setValue(location.hostname + PGNAME + "_popup_left", popupLeft);
		GM_setValue(location.hostname + PGNAME + "_popup_top", popupTop);
	});

	$e(d, "mouseup", function(event){ g_MD=""; });
	// タイトル＋バージョン
	var title = d.createElement("span");
	title.style.color = "#FFFFFF";
	title.style.font = 'bold 120% "ＭＳ ゴシック"';
	title.style.margin = "2px";
	title.innerHTML = "Auto Bilder ";

	var version = d.createElement("span");
	version.style.color = COLOR_TITLE;
	version.style.margin = "2px";
	version.innerHTML = " Ver." + VERSION;

//	var storageLimit = d.createElement("span");
//	storageLimit.style.color = "#FFFFFF";
//	storageLimit.style.font = '110% "ＭＳ Ｐゴシック"';
//	storageLimit.style.margin = "2px";

//	storageLimit.innerHTML = "資源保持上限(変換量) ： " + SetPrice(Math.floor(parseInt( $("rice_max").innerHTML, 10 ) * 0.95)) + " ( " + SetPrice(Math.floor(parseInt( $("rice_max").innerHTML, 10 ) * 0.05)) +" )";

	ABContainer.appendChild(title);
//	ABContainer.appendChild(storageLimit);
	ABContainer.appendChild(version);

	// ボタンエリア
	var ButtonBox = d.createElement("div");
	ButtonBox.style.border ="solid 0px";	// 通常 0px チェック時 1px
	ButtonBox.style.margin = "2px";
	ButtonBox.style.padding = "0px";

	ABContainer.appendChild(ButtonBox);

	// 実行中/停止中ボタン
	var Button1 = d.createElement("span");
	if(GM_getValue(HOST+PGNAME+"AutoFlg", true)==true){
		ccreateButton(Button1, "巡回中", "巡回停止します",
			function() {
				GM_setValue(HOST+PGNAME+"AutoFlg", false);
				location.reload();
			});
	} else {
		ccreateButton(Button1, "停止中", "巡回開始します",
			function() {
				GM_setValue(HOST+PGNAME+"AutoFlg", true);
					location.reload();
			});
	}
	ButtonBox.appendChild(Button1);

	// 確認済みボタン
	var Button2 = d.createElement("span");
		ccreateButton(Button2, "確認済", "完了済の作業を削除します",
			function() { confirmTimer(); });
	ButtonBox.appendChild(Button2);

	// 閉じるボタン
	var Button3 = d.createElement("span");
		ccreateButton(Button3, "閉じる", "ウインドウを閉じます",
			function() {closeIniBilderBox();});
	ButtonBox.appendChild(Button3);

	// 常駐チェックボックス
	var staySpan = d.createElement("span");
	staySpan.title = "作業完了がなくても常に表示します";
	ButtonBox.appendChild(staySpan);

	var stayBox =  document.createElement("input");
	stayBox.type = "checkbox";
	stayBox.style.verticalAlign = "middle";
	stayBox.checked = getStayMode();
	stayBox.addEventListener("change",
		function() {changeStayMode(this.checked);}, true);
	ButtonBox.appendChild(stayBox);

	var stayCap = document.createElement("span");
	stayCap.style.verticalAlign = "middle";
	stayCap.innerHTML = "　常駐 ";
	stayCap.style.color = "#FFFFFF";
	staySpan.appendChild(stayCap);

	// 巡回順チェックボックス
	var reverseSpan = d.createElement("span");
	reverseSpan.title = "拠点巡回を逆順にします";
	ButtonBox.appendChild(reverseSpan);

	var reverseBox =  document.createElement("input");
	reverseBox.type = "checkbox";
	reverseBox.style.verticalAlign = "middle";
	reverseBox.checked = getReverseMode();
	reverseBox.addEventListener("change",
		function() {changeReverseMode(this.checked);}, true);
	ButtonBox.appendChild(reverseBox);

	var reverseCap = document.createElement("span");
	reverseCap.style.verticalAlign = "middle";
	reverseCap.innerHTML = "　　逆巡回 ";
	reverseCap.style.color = "#FFFFFF";
	reverseSpan.appendChild(reverseCap);

	// 巡回時間プルダウン
	var typeDiv = document.createElement("span");
	typeDiv.title = "巡回時間が短すぎると建設や削除の指令が別拠点で発動する場合がありますのでご注意ください";
	ButtonBox.appendChild(typeDiv);

	var caption = document.createElement("span");
	caption.style.verticalAlign = "middle";
	caption.innerHTML = "　　巡回時間 ";
	caption.style.color = "#FFFFFF";
	typeDiv.appendChild(caption);

	var selectBox = document.createElement("select");
	selectBox.id = "dispMode";
	selectBox.addEventListener("change",
		function() {
			GM_setValue(HOST+PGNAME+"OPT_ROUND_TIME1" , document.getElementById("dispMode").value );
			OPT_ROUND_TIME1 = document.getElementById("dispMode").value;
		}, true);
	typeDiv.appendChild(selectBox);

	var options = new Array(
//		new Array("10sec" , LOAD_ROUND_TIME_10),
//		new Array("20sec" , LOAD_ROUND_TIME_20),
		new Array("30sec" , LOAD_ROUND_TIME_30),
		new Array("40sec" , LOAD_ROUND_TIME_40),
		new Array("50sec" , LOAD_ROUND_TIME_50),
		new Array("60sec" , LOAD_ROUND_TIME_60),
		new Array("70sec" , LOAD_ROUND_TIME_70),
		new Array("80sec" , LOAD_ROUND_TIME_80),
		new Array("90sec" , LOAD_ROUND_TIME_90),
		new Array("100sec", LOAD_ROUND_TIME_100),
		new Array("110sec", LOAD_ROUND_TIME_110),
		new Array("120sec", LOAD_ROUND_TIME_120),
		new Array("130sec", LOAD_ROUND_TIME_130),
		new Array("140sec", LOAD_ROUND_TIME_140),
		new Array("150sec", LOAD_ROUND_TIME_150),
		new Array("160sec", LOAD_ROUND_TIME_160),
		new Array("170sec", LOAD_ROUND_TIME_170),
		new Array("180sec", LOAD_ROUND_TIME_180)
	);
	for (var i = 0; i < options.length; i++) {
		var elem = document.createElement("option");
		elem.innerHTML = options[i][0];
		elem.value = options[i][1];
		selectBox.appendChild(elem);
	}
	selectBox.value = loadRoundTime();

	// 2012.01.11 巡回時間に 1 ~ 10sec 追加
	OPT_ROUND_TIME1 = parseInt(OPT_ROUND_TIME1,10) + Math.floor( Math.random() * 10 );

	// 次回表示
	var nowTime = new Date();
	var nextTime = getNextTime(location.hostname, nowTime);
	if (nextTime != undefined) {
		var waitTimeStr = generateWaitTimeString(nextTime, nowTime);
		var nextTimeBox = document.createElement("div");
		nextTimeBox.style.color = "#90EE90";
		nextTimeBox.style.backgroundColor = "#000000";
		nextTimeBox.style.verticalAlign = "middle";
		nextTimeBox.innerHTML = "　次回: " + generateDateString2(nextTime);
		nextTimeBox.innerHTML += " (あと" + waitTimeStr + ")";
		ABContainer.appendChild(nextTimeBox);
	}

	// 変換用市場表示
	var shoplist = cloadData(HOST+"ShopList","[]",true,true);
	if (shoplist.length != 0) {
//		shoplist.sort( function(a,b) { if (a[1] < b[1]) return 1; if (a[1] > b[1]) return -1; return 0;});
		shoplist.sort( function(a,b) { return parseInt(b[1],10) - parseInt(a[1],10);}); // 2015.05.23
		var villages = loadVillages(HOST+PGNAME);
		var nextIndex = -1;
		for(var i=0; i<villages.length;i++){
			if(shoplist[0].vId == villages[i][IDX_XY]){
				nextIndex = i;
				break;
			}
		}
		if (nextIndex != -1) {
			var ShopBox = document.createElement("div");
			ShopBox.style.color = "#90EE90";
			ShopBox.style.backgroundColor = "#000000";
			ShopBox.style.verticalAlign = "middle";
			ShopBox.innerHTML = "　変換用市場 : " + villages[nextIndex][IDX_BASE_NAME] + "　" + villages[nextIndex][IDX_XY] + "　市場Lv : " + shoplist[0].lv + "　変換開始量 : " + OPT_RISE_MAX + "　変換方法 : " + OPT_ICHIBA_PA;
			ABContainer.appendChild(ShopBox);
		}
	}
	//document.getElementById("dispMode" + types[i]).value;

	//拠点設定リンクの作成
	var tbl = d.createElement("table");
	tbl.style.border ="0px";
	//拠点情報のロード
	var villages = loadVillages(HOST+PGNAME);
	//拠点情報が無い場合
	var firstboot = false;
	if (villages == "") { firstboot = true; }
	if (villages.length > 0) {
		if (villages[0][IDX_URL] == "") {
			firstboot = true;
		}
	}
	if(firstboot) {
		var tr = d.createElement("tr");
		var td = d.createElement("td");
		td.style.padding = "3px";
//		td.style.border = "solid 2px black";
		tr.appendChild(td);
		tbl.appendChild(tr);
		var msg = d.createElement("span");
		msg.style.fontSize = "15px";
		msg.style.margin = "3px";
		msg.style.color = "#FFFFFF";
		msg.style.font = 'bold 120% "ＭＳ ゴシック"';
		msg.innerHTML = "<br>" +
						"　　インストールありがとうございます。<br>" +
						"　　まずは、プロフィール画面を開いて<br>" +
						"　　拠点情報を取得してください。<br>　"+
						"　　うまく動作しない場合、他のツールを<br>　"+
						"　　一旦OFFにしてから再度実行してください。<br>　";
		td.appendChild(msg);
	} else {
		var landElems = document.evaluate(
		'//li[@class="on"]/span',
		document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

		for (var i = 0; i < villages.length; i++) {
			var vname = villages[i][IDX_BASE_NAME];
			var fColor = "#71C4F9";
			var tr = d.createElement("tr");
			var td = d.createElement("td");
			tr.style.fontWeight = "bold";
			td.style.padding = "2px";
			td.style.border = "solid 1px black";
			td.style.backgroundColor = "#E6CF88";

			tr.appendChild(td);
			tbl.appendChild(tr);

			//各拠点の設定画面リンク
			var vname = villages[i][IDX_BASE_NAME];
			if(vname != ""){	// add 2012.09.06
				vId2 = villages[i][IDX_XY];

				var td00 = d.createElement("div");
				td00.style.width = "140px";

				var tdA = d.createElement("td");
				tdA.style.padding = "3px";
				ccreateCheckBox0(td00, "OPT_CHKBOX_AVC_"+i, loadAVCBox2(i), villages[i][IDX_BASE_NAME],"",0 ,villages);

				//拠点一覧項目
				var opfacLink = document.createElement("text");
				opfacLink.style.padding = "3px";
				td00.appendChild(opfacLink);

				var villageText = villages[i][IDX_BASE_NAME];
				if (villages[i][IDX_URL] != "") {
					villageText = "<a href=" + villages[i][IDX_URL] +
					" style='color:#654634; text-decoration:none'>" +
					villageText + "</a>";
				}
				opfacLink.innerHTML = villageText;
				opfacLink.style.textDecoration = "none";
				td.appendChild(td00);
				tr.appendChild(td);

				//実行中作業情報項目
				var actionsTd = document.createElement("td");
				actionsTd.style.backgroundColor = COLOR_BACK;
				actionsTd.style.border = "solid 1px black";
				actionsTd.style.padding = "3px";
				actionsTd.style.width = "450px";
				tr.appendChild(actionsTd);
				var actions = sortAction(villages[i][IDX_ACTIONS]);
				var nowTime = new Date();
/*
				for (var j = 0; j < actions.length; j++) {
					var actionDiv = createActionDiv(actions[j], nowTime, villages[i][IDX_XY], location.hostname);
					if (!actionDiv) continue;
					// 完了済みフラグのチェック
					actionDiv = createActionDiv(actions[j], nowTime, villages[i][IDX_XY], location.hostname);
					actionsTd.appendChild(actionDiv);
				}
*/
				// 2013.12.19 ここから
				var cntOldData = 0;
				for (var j = actions.length -1; j > -1; j--) {
					var actionDiv = createActionDiv(actions[j], nowTime, villages[i][IDX_XY], location.hostname);
					if (!actionDiv) continue;
					// 完了済みフラグのチェック
					var actionTime = new Date(actions[j][IDX2_TIME]);
					if (actionTime < nowTime) {
						cntOldData += 1;		// 過去ログ件数カウント
						if (cntOldData <= 5) {
							// 過去ログ５件分は表示
							actionDiv = createActionDiv(actions[j], nowTime, villages[i][IDX_XY], location.hostname);
							actionsTd.appendChild(actionDiv);
						} else {
							// それ以外は削除
							var key = location.hostname + DELIMIT1 + villages[i][IDX_XY] + DELIMIT1 + actions[j][IDX2_TIME];
							var hosts = getTargetHosts();
							for (var ii = 0; ii < hosts.length; ii++) {
								var villages = loadVillages(hosts[ii] + PGNAME);
								var exists = false;
								villageLoop:
								for (var i = 0; i < villages.length; i++) {
									for (var j = 0; j < villages[i][IDX_ACTIONS].length; j++) {
										var action = villages[i][IDX_ACTIONS][j];
										var curKey = hosts[ii] + DELIMIT1 + villages[i][IDX_XY] + DELIMIT1 + action[IDX2_TIME];
										if (key == curKey) {
											exists = true;
											villages[i][IDX_ACTIONS].splice(j, 1);
											break villageLoop;
										}
									}
								}

								//見つかったら更新
								if (exists) {
									saveVillages(hosts[ii] + PGNAME, villages);
									if ( getStayMode() ) {
										closeIniBilderBox();
										openIniBilderBox();
									}
									return;
								}
							}
						}
					} else {
						// 現行ログの追加
						actionDiv = createActionDiv(actions[j], nowTime, villages[i][IDX_XY], location.hostname);
						actionsTd.appendChild(actionDiv);
					}
				}
				// 2013.12.19 ここまで

				//設定ボタン
				var settingTd = document.createElement("td");
				settingTd.style.backgroundColor = "#E6CF88";
				settingTd.style.border = "solid 1px black";
				settingTd.style.padding = "3px";
				settingTd.style.width = "20px";
				tr.appendChild(settingTd);

				var btn = d.createElement("input");
				btn.style.padding = "1px";
				btn.type = "button";
				btn.value = "設定";
				btn.title = "設定画面を表示します";
				settingTd.appendChild(d.createTextNode(" "));
				settingTd.appendChild(btn);
				settingTd.appendChild(d.createTextNode(" "));
				settingTd.setAttribute('vId', villages[i][IDX_XY]);
				settingTd.addEventListener("click", function() {
					var vId = this.getAttribute('vId');
					openInifacBox(vId);
				}, true);
			}	// add 2012.09.06
		}
		saveVillages(HOST+PGNAME, villages);
	}


	//拠点作成状況の表示 2012.04.09
	var tbl2 = d.createElement("table");
	tbl2.style.border ="0px";
	var lists = cloadData(HOST+"ReserveList", "[]", true, true);
	for(var i=0 ; i<lists.length ; i++) {
		var vId = "(" + lists[i].x + "," + lists[i].y + ")";

		var tr = d.createElement("tr");
		var td = d.createElement("td");

		tbl2.appendChild(tr);

		var td00 = d.createElement("div");

		td.appendChild(td00);
		tr.appendChild(td);

		var actionsTd = document.createElement("td");
		actionsTd.style.backgroundColor = COLOR_BACK;
		actionsTd.style.border = "solid 1px black";
		actionsTd.style.padding = "3px";
		actionsTd.style.width = "525px";

		tr.appendChild(actionsTd);

		var actionDiv = document.createElement("text");
		actionDiv.style.padding = "3px";

		actionDiv.innerHTML = "座標" + vId + " に ";
			  if(lists[i].kind == 220){ actionDiv.innerHTML += "「村」";
		}else if(lists[i].kind == 222){ actionDiv.innerHTML += "「砦」";
		}
			  if(lists[i].status == VS_BUILD_FAIL	){actionDiv.innerHTML += "作成失敗";
		}else if(lists[i].status == VS_BUILD_RESERVE){actionDiv.innerHTML += "作成予約";
		}else if(lists[i].status == VS_BUILD_ING	){actionDiv.innerHTML += "作成中";
		}else if(lists[i].status == VS_BUILD_COMP	){actionDiv.innerHTML += "作成完了";
		}else if(lists[i].status == VS_DESTROY_ING	){actionDiv.innerHTML += "破棄中";
		}else if(lists[i].status == VS_DESTROY_COMP ){actionDiv.innerHTML += "破棄完了";
		}
		if(lists[i].status == VS_BUILD_ING || lists[i].status == VS_DESTROY_ING){
			actionDiv.innerHTML += " (" + lists[i].time + " 完了予定)";
		}

		var delTd = document.createElement("td");
		delTd.style.backgroundColor = "#E6CF88";
		delTd.style.border = "solid 1px black";
		delTd.style.padding = "3px";
		delTd.style.width = "34px";
		tr.appendChild(delTd);

		if(lists[i].status == VS_BUILD_RESERVE || lists[i].status == VS_BUILD_FAIL){
			var btn = d.createElement("input");
			btn.style.padding = "1px";
			btn.type = "button";
			btn.value = "取消";
			btn.title = "予約を取消します";
			delTd.appendChild(d.createTextNode(" "));
			delTd.appendChild(btn);
			delTd.appendChild(d.createTextNode(" "));
			delTd.setAttribute('x', lists[i].x);
			delTd.setAttribute('y', lists[i].y);
			delTd.addEventListener("click", function() {
				var x = this.getAttribute('x');
				var y = this.getAttribute('y');
				delList(x, y);
			}, true); //delListへ
		}
		else if(lists[i].status == VS_BUILD_COMP || lists[i].status == VS_DESTROY_COMP){
			var btn = d.createElement("input");
			btn.style.padding = "1px";
			btn.type = "button";
			btn.value = "確認";
			btn.title = "確認済にして削除します";
			delTd.appendChild(d.createTextNode(" "));
			delTd.appendChild(btn);
			delTd.appendChild(d.createTextNode(" "));
			delTd.setAttribute('x', lists[i].x);
			delTd.setAttribute('y', lists[i].y);
			delTd.addEventListener("click", function() {
				var x = this.getAttribute('x');
				var y = this.getAttribute('y');
				delList(x, y);
			}, true); //delListへ

		}
		tr.appendChild(delTd);
		actionsTd.appendChild(actionDiv);
	}

	ABContainer.appendChild(tbl);
	ABContainer.appendChild(tbl2);

	function delList(x, y)
	{
		var lists = cloadData(HOST+"ReserveList", "[]", true, true);
		for(var i=0 ; i<lists.length ; i++) {
			if(lists[i].x == x && lists[i].y == y ) {
				lists.splice(i,1);
				csaveData(HOST+"ReserveList", lists, true, true );

				//更新後内容で表示
				closeIniBilderBox();
				openIniBilderBox();

				break;
			}
		}
	}
}

// 拠点巡回読込
function loadAVCBox(){
	OPT_CHKBOX_AVC = parseInt(GM_getValue(HOST+PGNAME+"AVC", ""),10);
}

function loadAVCBox2(tVID){
	//OPT_CHKBOX_AVC = parseInt(GM_getValue(HOST+PGNAME+"AVC"+"_"+tVID, ""),10);
	OPT_CHKBOX_AVC = GM_getValue(HOST+PGNAME+"OPT_CHKBOX_AVC_" + tVID, true);
	return OPT_CHKBOX_AVC;
}

// @@@@ add 2011.09.07 @@@@
function loadRoundTime() {
	OPT_ROUND_TIME1 = GM_getValue(HOST+PGNAME+"OPT_ROUND_TIME1", LOAD_ROUND_TIME_180);
	return OPT_ROUND_TIME1;
}

//数値を3ケタ区切りにする関数
function SetPrice(price){
	var num = new String(price).replace(/,/g, "");
	while(num != (num = num.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
	return num;
}

// 拠点巡回保存
function saveAVCBox(){
	OPT_CHKBOX_AVC = cgetCheckBoxValue($("OPT_CHKBOX_AVC"));
	GM_setValue(HOST+PGNAME+"AVC", OPT_CHKBOX_AVC);
}
function saveAVCBox2(tVID,flg){
	//OPT_CHKBOX_AVC = cgetCheckBoxValue($("OPT_CHKBOX_AVC"));
	//GM_setValue(HOST+PGNAME+"AVC", OPT_CHKBOX_AVC);
	GM_setValue(HOST+PGNAME+"AVC"+"_"+tVID, flg);

	//var tid=setTimeout(function(){location.reload();},INTERVAL);
	tidMain=setTimeout(function(){location.reload(false);},INTERVAL);
}

//施設建設必要資源読込
function loadFacility(){
}

//施設建設必要資源保存
function saveFacility(f){
}

//ステイタス取得HTML追加
function addInifacHtml(vId) {

// add 2011.09.27 設定画面移動 @@@@
	var popupLeft = GM_getValue(location.hostname + PGNAME + "_popup_left2", 10);
	var popupTop = GM_getValue(location.hostname + PGNAME + "_popup_top2", 10);
	if (popupLeft < 0) popupLeft = 0;
	if (popupTop < 0) popupTop = 0;

// end


	//表示コンテナ作成
	var ABfacContainer = d.createElement("div");
	ABfacContainer.id = "ABfacContainer";
	ABfacContainer.style.position = "absolute";
	ABfacContainer.style.color = COLOR_BASE;
	ABfacContainer.style.backgroundColor = COLOR_FRAME;
	ABfacContainer.style.opacity= 1.0;
	ABfacContainer.style.border = "solid 2px black";
	ABfacContainer.style.left = popupLeft + "px";
	ABfacContainer.style.top = popupTop + "px";
	ABfacContainer.style.font = fontstyle;
	ABfacContainer.style.padding = "2px";
	ABfacContainer.style.MozBorderRadius = "4px";
	ABfacContainer.style.zIndex = 9999;
	ABfacContainer.style.width = "734px";

	ABfacContainer.setAttribute('vId', vId);
	d.body.appendChild(ABfacContainer);

	$e(ABfacContainer, "mousedown", function(event){
				if( event.target != $("ABfacContainer")) {return false;}
				g_MD="ABfacContainer";
				g_MX=event.pageX-parseInt(this.style.left,10);
				g_MY=event.pageY-parseInt(this.style.top,10);
				event.preventDefault();});
	$e(d, "mousemove", function(event){
				if(g_MD != "ABfacContainer") return true;
				var ABfacContainer = $("ABfacContainer");
				if( !ABfacContainer ) return true;
				var popupLeft = event.pageX - g_MX;
				var popupTop  = event.pageY - g_MY;
				ABfacContainer.style.left = popupLeft + "px";
				ABfacContainer.style.top = popupTop + "px";
				//ポップアップ位置を永続保存
				GM_setValue(location.hostname + PGNAME + "_popup_left2", popupLeft);
				GM_setValue(location.hostname + PGNAME + "_popup_top2", popupTop);
				});
	$e(d, "mouseup", function(event){g_MD="";});

	// ===== 作業拠点名 =====
	var BaseName  = d.createElement("span");
		BaseName.style.border ="solid 0px red";
		BaseName.style.padding = "3px";
		BaseName.style.font = "bold 120% 'ＭＳ ゴシック'";
		BaseName.style.color = "#71C4F9";

	var villages = loadVillages(HOST+PGNAME);
	for (var i = 0; i < villages.length; i++) {
		//表示中の設定対象拠点名の表示
		if(vId == villages[i][IDX_XY]){
			BaseName.innerHTML = villages[i][IDX_BASE_NAME];
		}
	}
	Load_OPT(vId);
	ABfacContainer.appendChild(BaseName);

	// ===== 建設設定 =====
	var Build_Box = d.createElement("table");
		Build_Box.style.border ="solid 2px black";
		Build_Box.style.margin = "0px 4px 4px 0px";
		Build_Box.style.width = "100%";

	var tr11 = d.createElement("tr");
		tr11.style.backgroundColor = COLOR_TITLE;
		tr11.style.border ="solid 1px black";

	var td11 = d.createElement("td");
		td11.style.padding = "1px";
		td11.colSpan = "3";
		//td11.appendChild( createRadioBtn ( 'AC', '自動建築' ) );
		ccreateCaptionText(td11, "dummy", "■ 自動建築", 0 );

	var tr111 = d.createElement("tr");
		tr111.style.backgroundColor = COLOR_BACK;
		tr111.style.border ="solid 1px black";

	var td111 = d.createElement("td");
		td111.style.padding = "3px";
		td111.style.verticalAlign = "top";

	var td112 = d.createElement("td");
		td112.style.padding = "3px";
		td112.style.verticalAlign = "top";

	var td113 = d.createElement("td");
		td113.style.padding = "3px";
		td113.style.verticalAlign = "top";

	var tr30 = d.createElement("tr");
		tr30.style.backgroundColor = COLOR_BACK;

	var td31 = d.createElement("td");
		td31.colSpan = "3";
		td31.style.padding = "3px";
		td31.style.textAlign = "right";

	Build_Box.appendChild(tr11);
	tr11.appendChild(td11);

	Build_Box.appendChild(tr111);
	tr111.appendChild(td111);
	tr111.appendChild(td112);
	tr111.appendChild(td113);

	Build_Box.appendChild(tr30);
	tr30.appendChild(td31);

//	ABfacContainer.appendChild(Build_Box);

	ccreateCheckBoxKai2(td111, "OPT_CHKBOX",  0, " 拠点 　　　","中央の城・村・砦のLvを上げます。",0);
	ccreateCheckBoxKai2(td111, "OPT_CHKBOX",  6, " 銅雀台 　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateText(td111, "Dummy" , "　", 0);
	ccreateCheckBoxKai2(td111, "OPT_CHKBOX",  1, " 伐採所 　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td111, "OPT_CHKBOX",  2, " 石切り場 　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td111, "OPT_CHKBOX",  3, " 製鉄所 　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td111, "OPT_CHKBOX",  4, " 畑 　　　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td111, "OPT_CHKBOX",  5, " 倉庫 　　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateText(td111, "Dummy" , "　", 0);
	ccreateCheckBoxKai2(td111, "OPT_CHKBOX",  7, " 鍛冶場 　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td111, "OPT_CHKBOX",  8, " 防具工場 　","自動でLv上げをする建築物にチェックをしてください。",0);

	ccreateCheckBoxKai2(td112, "OPT_CHKBOX",  9, " 練兵所 　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td112, "OPT_CHKBOX", 10, " 兵舎 　　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td112, "OPT_CHKBOX", 11, " 弓兵舎 　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td112, "OPT_CHKBOX", 12, " 厩舎 　　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td112, "OPT_CHKBOX", 14, " 兵器工房 　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateText(td112, "Dummy" , "　", 0);
	ccreateCheckBoxKai2(td112, "OPT_CHKBOX", 13, " 宿舎 　　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td112, "OPT_CHKBOX", 20, " 大宿舎 　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateText(td112, "Dummy" , "　", 0);
	ccreateCheckBoxKai2(td112, "OPT_CHKBOX", 15, " 市場 　　　","自動でLv上げをする建築物にチェックをしてください。",0);

	ccreateCheckBoxKai2(td113, "OPT_CHKBOX", 16, " 訓練所 　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td113, "OPT_CHKBOX", 21, " 遠征訓練所 ","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateText(td113, "Dummy" , "　", 0);
	ccreateCheckBoxKai2(td113, "OPT_CHKBOX", 17, " 水車 　　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td113, "OPT_CHKBOX", 18, " 工場 　　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateText(td113, "Dummy" , "　", 0);
	ccreateCheckBoxKai2(td113, "OPT_CHKBOX", 19, " 研究所 　　","自動でLv上げをする建築物にチェックをしてください。",0);
	ccreateCheckBoxKai2(td113, "OPT_CHKBOX", 22, " 見張り台 　","自動でLv上げをする建築物にチェックをしてください。",0);

	ccreateButton(td31, "衝車研究",		"衝車研究までの設定にします。",				function() {InitPreset_01();});
	ccreateButton(td31, "訓練所",		"訓練所までの設定にします。",				function() {InitPreset_02();});
	ccreateButton(td31, "遠征訓練",		"遠征訓練所までの設定にします。",			function() {InitPreset_03();});
	ccreateButton(td31, "初期化",		"自動建設設定を消去します。",				function() {clearInifacBox();});

	// ===== 自動削除 ===== 2015.05.10
	var Remove_Box = d.createElement("table");
		Remove_Box.style.border = "solid 2px black";
		Remove_Box.style.margin = "0px 4px 4px 0px";
		Remove_Box.style.width = "100%";

	var tr0011 = d.createElement("tr");
		tr0011.style.backgroundColor = COLOR_TITLE;
		tr0011.style.border ="solid 1px black";

	var td0011 = d.createElement("td");
		td0011.style.padding = "1px";
		td0011.colSpan = "3";
		ccreateCheckBox(td0011, "OPT_REMOVE", OPT_REMOVE, " 自動削除", "この都市に来たら、自動的に削除します。", 0);

	var tr00111 = d.createElement("tr");
		tr00111.style.backgroundColor = COLOR_BACK;
		tr00111.style.border ="solid 1px black";

	var td00111 = d.createElement("td");
		td00111.style.padding = "3px";
		td00111.style.verticalAlign = "top";

	var td00112 = d.createElement("td");
		td00112.style.padding = "3px";
		td00112.style.verticalAlign = "top";

	var td00113 = d.createElement("td");
		td00113.style.padding = "3px";
		td00113.style.verticalAlign = "top";

	Remove_Box.appendChild(tr0011);
	tr0011.appendChild(td0011);

	Remove_Box.appendChild(tr00111);
	tr00111.appendChild(td00111);
	tr00111.appendChild(td00112);
	tr00111.appendChild(td00113);

	ccreateText(td00111, "Dummy" , "　", 0);
	ccreateCheckBox3(td00111, "OPT_RM_CHKBOX", OPT_RM_CHKBOX,	6, " 銅雀台 　　","自動で削除する建築物にチェックをしてください。",0,0);
	ccreateText(td00111, "Dummy" , "　", 0);
	ccreateCheckBox3(td00111, "OPT_RM_CHKBOX", OPT_RM_CHKBOX,	1, " 伐採所 　　","自動で削除する建築物にチェックをしてください。",0,1);
	ccreateCheckBox3(td00111, "OPT_RM_CHKBOX", OPT_RM_CHKBOX,	2, " 石切り場 　","自動で削除する建築物にチェックをしてください。",0,1);
	ccreateCheckBox3(td00111, "OPT_RM_CHKBOX", OPT_RM_CHKBOX,	3, " 製鉄所 　　","自動で削除する建築物にチェックをしてください。",0,1);
	ccreateCheckBox3(td00111, "OPT_RM_CHKBOX", OPT_RM_CHKBOX,	4, " 畑 　　　　","自動で削除する建築物にチェックをしてください。",0,1);
	ccreateCheckBox3(td00111, "OPT_RM_CHKBOX", OPT_RM_CHKBOX,	5, " 倉庫 　　　","自動で削除する建築物にチェックをしてください。",0,1);
	ccreateText(td00111, "Dummy" , "　", 0);
	ccreateCheckBox3(td00111, "OPT_RM_CHKBOX", OPT_RM_CHKBOX,	7, " 鍛冶場 　　","自動で削除する建築物にチェックをしてください。",0,0);
	ccreateCheckBox3(td00111, "OPT_RM_CHKBOX", OPT_RM_CHKBOX,	8, " 防具工場 　","自動で削除する建築物にチェックをしてください。",0,0);

	ccreateCheckBox3(td00112, "OPT_RM_CHKBOX", OPT_RM_CHKBOX,	9, " 練兵所 　　","自動で削除する建築物にチェックをしてください。",0,0);
	ccreateCheckBox3(td00112, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 10, " 兵舎 　　　","自動で削除する建築物にチェックをしてください。",0,0);
	ccreateCheckBox3(td00112, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 11, " 弓兵舎 　　","自動で削除する建築物にチェックをしてください。",0,0);
	ccreateCheckBox3(td00112, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 12, " 厩舎 　　　","自動で削除する建築物にチェックをしてください。",0,0);
	ccreateCheckBox3(td00112, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 14, " 兵器工房 　","自動で削除する建築物にチェックをしてください。",0,0);
	ccreateText(td00112, "Dummy" , "　", 0);
	ccreateCheckBox3(td00112, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 13, " 宿舎 　　　","自動で削除する建築物にチェックをしてください。",0,1);
	ccreateCheckBox3(td00112, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 20, " 大宿舎 　　","自動で削除する建築物にチェックをしてください。",0,1);
	ccreateText(td00112, "Dummy" , "　", 0);
	ccreateCheckBox3(td00112, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 15, " 市場 　　　","自動で削除する建築物にチェックをしてください。",0,0);

	ccreateCheckBox3(td00113, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 16, " 訓練所 　　","自動で削除する建築物にチェックをしてください。",0,0);
	ccreateCheckBox3(td00113, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 21, " 遠征訓練所 ","自動で削除する建築物にチェックをしてください。",0,0);
	ccreateText(td00113, "Dummy" , "　", 0);
	ccreateCheckBox3(td00113, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 17, " 水車 　　　","自動で削除する建築物にチェックをしてください。",0,0);
	ccreateCheckBox3(td00113, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 18, " 工場 　　　","自動で削除する建築物にチェックをしてください。",0,0);
	ccreateText(td00113, "Dummy" , "　", 0);
	ccreateCheckBox3(td00113, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 19, " 研究所 　　","自動で削除する建築物にチェックをしてください。",0,0);
	ccreateCheckBox3(td00113, "OPT_RM_CHKBOX", OPT_RM_CHKBOX, 22, " 見張り台 　","自動で削除する建築物にチェックをしてください。",0,0);

	// ===== 内政設定 =====
	var Domestic_Box = d.createElement("table");
		Domestic_Box.style.border = "solid 2px black";
		Domestic_Box.style.margin = "0px 4px 4px 0px";
		Domestic_Box.style.width = "100%";

	var tr1 = d.createElement("tr");
	var td1 = d.createElement("td");
		td1.colSpan = 5;
//		td1.style.padding = "2px";
		td1.style.backgroundColor = COLOR_TITLE;
		ccreateCaptionText(td1, "dummy", "■ 自動内政設定", 0 );

	var tr2 = d.createElement("tr");
		tr2.style.backgroundColor = COLOR_BACK;
		tr2.style.border = "solid 1px black";

	var td21 = d.createElement("td");
		td21.style.padding = "2px";
		td21.style.verticalAlign = "top";

	var td22 = d.createElement("td");
		td22.style.padding = "2px";
		td22.style.verticalAlign = "top";

	var td23 = d.createElement("td");
		td23.style.padding = "2px";
		td23.style.verticalAlign = "top";

	var td24 = d.createElement("td");
		td24.style.padding = "2px";
		td24.style.verticalAlign = "top";

	var td25 = d.createElement("td");
		td25.style.padding = "2px";
		td25.style.verticalAlign = "top";

	Domestic_Box.appendChild(tr1);
	tr1.appendChild(td1);
	Domestic_Box.appendChild(tr2);
	tr2.appendChild(td21);
	tr2.appendChild(td22);
	tr2.appendChild(td23);
	tr2.appendChild(td24);
	tr2.appendChild(td25);

//	ABfacContainer.appendChild(Domestic_Box);

	ccreateCheckBox(td21, "OPT_DOME1" , OPT_DOME[1] , " " + DASkill[1]	+ " ", "この都市に来たら、自動的に内政スキル（" + DASkill[1]  + "）を発動します。", 0);
	ccreateCheckBox(td22, "OPT_DOME2" , OPT_DOME[2] , " " + DASkill[2]	+ " ", "この都市に来たら、自動的に内政スキル（" + DASkill[2]  + "）を発動します。", 0);
	ccreateCheckBox(td23, "OPT_DOME16", OPT_DOME[16], " " + DASkill[16] + " ", "この都市に来たら、自動的に内政スキル（" + DASkill[16]  + "）を発動します。", 0);
	ccreateCheckBox(td24, "OPT_DOME12", OPT_DOME[12], " " + DASkill[12] + " ", "この都市に来たら、自動的に内政スキル（" + DASkill[12] + "）を発動します。", 0);
	ccreateCheckBox(td25, "OPT_DOME13", OPT_DOME[13], " " + DASkill[13] + " ", "この都市に来たら、自動的に内政スキル（" + DASkill[13] + "）を発動します。", 0);

	ccreateCheckBox(td21, "OPT_DOME4" , OPT_DOME[4] , " " + DASkill[4]	+ " ", "この都市に来たら、自動的に内政スキル（" + DASkill[4]  + "）を発動します。", 0);
	ccreateCheckBox(td22, "OPT_DOME5" , OPT_DOME[5] , " " + DASkill[5]	+ " ", "この都市に来たら、自動的に内政スキル（" + DASkill[5]  + "）を発動します。", 0);
	ccreateCheckBox(td23, "OPT_DOME17", OPT_DOME[17], " " + DASkill[17] + " ", "この都市に来たら、自動的に内政スキル（" + DASkill[17]  + "）を発動します。", 0);
	ccreateCheckBox(td24, "OPT_DOME14", OPT_DOME[14], " " + DASkill[14] + " ", "この都市に来たら、自動的に内政スキル（" + DASkill[14] + "）を発動します。", 0);
	ccreateCheckBox(td25, "OPT_DOME15", OPT_DOME[15], " " + DASkill[15] + " ", "この都市に来たら、自動的に内政スキル（" + DASkill[15] + "）を発動します。", 0);

	ccreateCheckBox(td21, "OPT_DOME7" , OPT_DOME[7] , " " + DASkill[7]	+ " ", "この都市に来たら、自動的に内政スキル（" + DASkill[7]  + "）を発動します。", 0);
	ccreateCheckBox(td22, "OPT_DOME8" , OPT_DOME[8] , " " + DASkill[8]	+ " ", "この都市に来たら、自動的に内政スキル（" + DASkill[8]  + "）を発動します。", 0);
	ccreateCheckBox(td23, "OPT_DOME18", OPT_DOME[18], " " + DASkill[18] + " ", "この都市に来たら、自動的に内政スキル（" + DASkill[18]  + "）を発動します。", 0);
	ccreateCheckBox(td24, "OPT_DOME19", OPT_DOME[19], " " + DASkill[19], "この都市に来たら、自動的に内政スキル（" + DASkill[19] + "）を発動します。", 0);
	ccreateCheckBox(td25, "OPT_DOME20", OPT_DOME[20], " " + DASkill[20], "この都市に来たら、自動的に内政スキル（" + DASkill[20] + "）を発動します。", 0);

	ccreateCheckBox(td21, "OPT_DOME10", OPT_DOME[10], " " + DASkill[10], "この都市に来たら、自動的に内政スキル（" + DASkill[10]  + "）を発動します。", 0);
	ccreateCheckBox(td22, "OPT_DOME11", OPT_DOME[11], " " + DASkill[11], "この都市に来たら、自動的に内政スキル（" + DASkill[11] + "）を発動します。", 0);
	ccreateCheckBox(td23, "OPT_DOME38", OPT_DOME[38], " " + DASkill[38], "この都市に来たら、自動的に内政スキル（" + DASkill[38] + "）を発動します。", 0);
		ccreateText(td24, "Dummy" , "　", 0);
		ccreateText(td25, "Dummy" , "　", 0);

		ccreateText(td21, "Dummy" , "　", 0);
	ccreateCheckBox(td23, "OPT_DOME6",	OPT_DOME[6],  " " + DASkill[6], "この都市に来たら、自動的に内政スキル（" + DASkill[6]  + "）を発動します。", 0);
	ccreateCheckBox(td22, "OPT_DOME3",	OPT_DOME[3],  " " + DASkill[3], "この都市に来たら、自動的に内政スキル（" + DASkill[3]  + "）を発動します。", 0);
	ccreateCheckBox(td24, "OPT_DOME9",	OPT_DOME[9],  " " + DASkill[9], "この都市に来たら、自動的に内政スキル（" + DASkill[9]  + "）を発動します。", 0);
		ccreateText(td25, "Dummy" , "　", 0);

	ccreateCheckBox(td21, "OPT_DOME37", OPT_DOME[37], " " + DASkill[37], "この都市に来たら、自動的に内政スキル（" + DASkill[37]  + "）を発動します。", 0);
	ccreateCheckBox(td22, "OPT_DOME21", OPT_DOME[21], " " + DASkill[21], "この都市に来たら、自動的に内政スキル（" + DASkill[21]  + "）を発動します。", 0);
	ccreateCheckBox(td23, "OPT_DOME22", OPT_DOME[22], " " + DASkill[22], "この都市に来たら、自動的に内政スキル（" + DASkill[22]  + "）を発動します。", 0);
		ccreateText(td24, "Dummy" , "　", 0);
		ccreateText(td25, "Dummy" , "　", 0);

	ccreateCheckBox(td21, "OPT_DOME23", OPT_DOME[23], " " + DASkill[23], "この都市に来たら、自動的に内政スキル（" + DASkill[23]  + "）を発動します。", 0);
	ccreateCheckBox(td22, "OPT_DOME24", OPT_DOME[24], " " + DASkill[24], "この都市に来たら、自動的に内政スキル（" + DASkill[24]  + "）を発動します。", 0);
	ccreateCheckBox(td23, "OPT_DOME39", OPT_DOME[39], " " + DASkill[39], "この都市に来たら、自動的に内政スキル（" + DASkill[39]  + "）を発動します。", 0);

	// ===== 糧変換設定 =====

	var Market_Box = d.createElement("table");
		Market_Box.style.border ="solid 2px black";
		Market_Box.style.margin = "0px 4px 4px 0px";
		Market_Box.style.width = "100%";

	var tr30 = d.createElement("tr");
		tr30.style.backgroundColor = COLOR_TITLE;

	var td30 = d.createElement("td");
		td30.colSpan = 2;
		ccreateCheckBox(td30, "OPT_ICHIBA", OPT_ICHIBA, " 市場自動変換", "この都市で糧の市場自動変換をします。", 0);

	var tr311 = d.createElement("tr");
		tr311.style.border = "solid 1px black";
		tr311.style.backgroundColor = COLOR_BACK;

	var td311 = d.createElement("td");
		td311.style.padding = "3px 0px 3px 0px";
		td311.style.verticalAlign = "top";

	var td312 = d.createElement("td");
		td312.style.padding = "3px 0px 3px 0px";
		td312.style.verticalAlign = "top";

	Market_Box.appendChild(tr30);
	tr30.appendChild(td30);
	Market_Box.appendChild(tr311);
	tr311.appendChild(td311);
	tr311.appendChild(td312);

//	ABfacContainer.appendChild(Market_Box);

	ccreateTextBox(td311, "OPT_RISE_MAX",		OPT_RISE_MAX,										"自動変換開始量 ",	"自動で糧を他の資源に変換し始める量指定します。", 9, 5);
	ccreateTextBox(td311, "OPT_TO_WOOD",		OPT_TO_WOOD,										"木に変換する量 ",	"自動で木に変換する糧の量を指定します。", 9, 5);
	ccreateTextBox(td311, "OPT_TO_STONE",		OPT_TO_STONE,										"石に変換する量 ",	"自動で石に変換する糧の量を指定します。", 9, 5);
	ccreateTextBox(td311, "OPT_TO_IRON",		OPT_TO_IRON,										"鉄に変換する量 ",	"自動で鉄に変換する糧の量を指定します。", 9, 5);

	ccreateComboBox(td312, "OPT_ICHIBA_PA", OPT_ICHIBA_PATS, OPT_ICHIBA_PA, "変換パターン　 ",		"平均変換：糧が一定量になった際に指定している一番少ない資源へ変換します。\n一括変換：糧が一定量になった際に指定してある資源を指定値変換します。\nスマート変換：糧が一定量になった際に保有資源が均一になるよう一括変換します。\n余剰分変換：糧が一定量になった際に超過分を他資源が均一になるよう一括変換します。",5);
	ccreateTextBox(td312, "OPT_MAX_WOOD",	OPT_MAX_WOOD,											"木の最大保持量 ",	"木の最大保持量を設定します（0で倉庫上限まで）", 10, 5);
	ccreateTextBox(td312, "OPT_MAX_STONE",	OPT_MAX_STONE,									"石の最大保持量 ",	"石の最大保持量を設定します（0で倉庫上限まで）", 10, 5);
	ccreateTextBox(td312, "OPT_MAX_IRON",	OPT_MAX_IRON,											"鉄の最大保持量 ",	"鉄の最大保持量を設定します（0で倉庫上限まで）", 10, 5);

	// ===== 寄付設定 =====

	var Contribution_Box = d.createElement("table");
		Contribution_Box.style.margin = "0px 4px 4px 0px";
		Contribution_Box.style.border ="solid 2px black";
		Contribution_Box.style.width = "100%";

	var tr400 = d.createElement("tr");
		tr400.style.border = "solid 1px black";
		tr400.style.backgroundColor =COLOR_TITLE;

	var td401 = d.createElement("td");
//		td401.style.padding = "2px";
		ccreateCheckBox(td401, "OPT_KIFU", OPT_KIFU, " 自動寄付", "この都市に来たら、自動的に寄付します。", 0);

	var tr411 = d.createElement("tr");
		tr411.style.border = "solid 1px black";
		tr411.style.backgroundColor =COLOR_BACK;

	var td411 = d.createElement("td");
		td411.style.padding = "3px";
		td411.style.verticalAlign = "top";
		ccreateTextBox(td411, "OPT_RISE_KIFU_MAX", OPT_RISE_KIFU_MAX, "糧が右の数量になったら寄付する　","自動で糧を寄付し始める量指定します。", 10, 5);
		ccreateTextBox(td411, "OPT_RISE_KIFU", OPT_RISE_KIFU,		  "自動で糧を寄付する量　　　　　　","自動で糧を寄付する量指定します。", 10, 5);

	Contribution_Box.appendChild(tr400);
	tr400.appendChild(td401);
	Contribution_Box.appendChild(tr411);
	tr411.appendChild(td411);


	// ===== 糧村化 ===

	var Field_Box = d.createElement("table");
		Field_Box.style.margin = "0px 4px 4px 0px";
		Field_Box.style.border ="solid 2px black";
		Field_Box.style.width = "100%";

	var tr600 = d.createElement("tr");
		tr600.style.border = "solid 1px black";
		tr600.style.backgroundColor =COLOR_TITLE;

	var td600 = d.createElement("td");
//		td600.style.padding = "2px";
		ccreateCheckBoxF(td600,"OPT_KATEMURA", OPT_KATEMURA, " 糧村化", "この都市を糧村にする。平地に畑・倉庫を建てる。",0,function(cb){
			if (cb && !cb.checked) return;
			if (cb) cb.checked = true;

			// 畑
			var textbox  = $a('//input[@id="OPT_CHKBOXLV4"]'); textbox[0].value = 15;
			var checkbox = $a('//input[@id="OPT_CHKBOX4"]');	checkbox[0].checked = true;

			return true;
		});

	var tr611 = d.createElement("td");
		tr611.style.border = "solid 1px black";
		tr611.style.backgroundColor =COLOR_BACK;

	var td611 = d.createElement("td");
		td611.style.padding = "3px";
		td611.style.verticalAlign = "top";
		ccreateTextBox(td611,"OPT_SOUKO_MAX", OPT_SOUKO_MAX,"設置する倉庫の数　","設置する倉庫の数を指定してください。",4,0);

	Field_Box.appendChild(tr600);
	tr600.appendChild(td600);
	Field_Box.appendChild(tr611);
	tr611.appendChild(td611);

	// ===== 宿舎化 ===

	var SDorm_Box = d.createElement("table");
		SDorm_Box.style.margin = "0px 4px 4px 0px";
		SDorm_Box.style.border ="solid 2px black";
		SDorm_Box.style.width = "100%";

	var tr700 = d.createElement("tr");
		tr700.style.border = "solid 1px black";
		tr700.style.backgroundColor =COLOR_TITLE;

	var td700 = d.createElement("td");
		td700.colSpan = "2";
		ccreateCaptionText(td700, "dummy", "■ 宿舎化 ■（人柱用）", 0 );

	var tr711 = d.createElement("td");
		tr711.style.border = "solid 1px black";
		tr711.style.backgroundColor =COLOR_BACK;

	var td711a = d.createElement("td");
		td711a.style.padding = "3px";
		td711a.style.verticalAlign = "top";
		ccreateCheckBoxF(td711a, "OPT_SHUKUSHA"   , OPT_SHUKUSHA   , " 宿舎化"	, "この都市の空き地に宿舎を建設します。",0,InitShukushaVillage);
	var td711b = d.createElement("td");
		td711b.style.padding = "3px";
		td711b.style.verticalAlign = "top";
		ccreateCheckBoxF(td711b, "OPT_DAISHUKUSHA", OPT_DAISHUKUSHA, " 大宿舎化", "この都市の空き地に大宿舎を建設します。",0,InitDaiShukushaVillage);

	SDorm_Box.appendChild(tr700);
	tr700.appendChild(td700);
	SDorm_Box.appendChild(tr711);
	tr711.appendChild(td711a);
	tr711.appendChild(td711b);

	// ===== 水車村化 ===

	var Waterwheel_Box = d.createElement("table");
		Waterwheel_Box.style.margin = "0px 4px 4px 0px";
		Waterwheel_Box.style.border ="solid 2px black";
		Waterwheel_Box.style.width = "100%";

	var tr620 = d.createElement("tr");
		tr620.style.border = "solid 1px black";
		tr620.style.backgroundColor =COLOR_TITLE;

	var td620 = d.createElement("td");
		td620.colSpan = "2";
		ccreateCaptionText(td620, "dummy", "■ 水車村化 ■", 0 );

	var tr621 = d.createElement("tr");
		tr621.style.border = "solid 1px black";
		tr621.style.backgroundColor =COLOR_BACK;

	var td621a = d.createElement("td");
		td621a.style.padding = "2px";
		td621a.style.verticalAlign = "top";
		ccreateCheckBoxF(td621a, "OPT_1112MURA"  , OPT_1112MURA  , " ★9(1-1-1-2)水車村化", "この都市を水車村にする。",0,InitSuishaVillage);
		ccreateCheckBoxF(td621a, "OPT_0001S7MURA", OPT_0001S7MURA, " ★7(0-0-0-1)水車村化", "この都市を水車村にする。",0,InitSuishaVillage);
		ccreateCheckBoxF(td621a, "OPT_0001S5MURA", OPT_0001S5MURA, " ★5(0-0-0-1)水車村化", "この都市を水車村にする。",0,InitSuishaVillage);
		ccreateCheckBoxF(td621a, "OPT_0001S3MURA", OPT_0001S3MURA, " ★3(0-0-0-1)水車村化", "この都市を水車村にする。",0,InitSuishaVillage);
		ccreateCheckBoxF(td621a, "OPT_0000S8MURA", OPT_0000S8MURA, " ★8(0-0-0-0)水車村化", "この都市を水車村にする。",0,InitSuishaVillage);
		ccreateCheckBoxF(td621a, "OPT_1111S4MURA", OPT_1111S4MURA, " ★4(1-1-1-1)水車村化", "この都市を資源+水車村にする。",0,InitSuishaVillage);
		ccreateCheckBoxF(td621a, "OPT_0000S6MURA", OPT_0000S6MURA, " ★6(0-0-0-0)水車村化", "この都市を水車村にする。",0,InitSuishaVillage);

	var td621b = d.createElement("td");
		td621b.style.padding = "2px";
		td621b.style.verticalAlign = "top";
		ccreateCheckBoxF(td621b, "OPT_PLANT9MURA74",OPT_PLANT9MURA74," ★9(7-4)工場村化", "この都市を工場+水車村にする。",0,InitKoujoVillage);
		ccreateCheckBoxF(td621b, "OPT_PLANT5MURAN", OPT_PLANT5MURAN, " ★5(6-0)工場村化", "この都市を工場+水車村にする。",0,InitKoujoVillage);

	Waterwheel_Box.appendChild(tr620);
	tr620.appendChild(td620);
	Waterwheel_Box.appendChild(tr621);
	tr621.appendChild(td621a);
	tr621.appendChild(td621b);
//	Waterwheel_Box.appendChild(tr622);
//	tr622.appendChild(td622);
//	Waterwheel_Box.appendChild(tr623);
//	tr623.appendChild(td623);

	// ==== 自動兵産設定 ====

	var Soldier_Box = d.createElement("table");
		Soldier_Box.style.border ="solid 2px black";
		Soldier_Box.style.marginBottom = "4px";
		Soldier_Box.style.width = "100%";

	var tr800 = d.createElement("tr");
		tr800.style.border = "solid 1px black";
		tr800.style.backgroundColor =COLOR_TITLE;

	var td800 = d.createElement("td");
		ccreateCheckBox(td800, "OPT_BLD_SOL", OPT_BLD_SOL, " 自動造兵", "この都市で自動的に造兵します。", 0);

	var tr81 = d.createElement("tr");
		tr81.style.border = "solid 1px black";
		tr81.style.backgroundColor =COLOR_BACK;
	var td81 = d.createElement("td");
		td81.style.padding = "3px";//		td81.style.border = "solid 1px black";

	var tr811 = d.createElement("tr");
	var td811 = d.createElement("td");		td811.style.padding = "3px";	td811.style.verticalAlign = "bottom";
	var td812 = d.createElement("td");		td812.style.padding = "3px";	td812.style.verticalAlign = "top"; td812.style.textAlign = "center";
	var td813 = d.createElement("td");		td813.style.padding = "3px";	td813.style.verticalAlign = "top"; td813.style.textAlign = "center";
	var td814 = d.createElement("td");		td814.style.padding = "3px";	td814.style.verticalAlign = "top"; td814.style.textAlign = "center";
	var td815 = d.createElement("td");		td815.style.padding = "3px";	td815.style.verticalAlign = "top"; td815.style.textAlign = "center";
	var td816 = d.createElement("td");		td816.style.padding = "3px";	td816.style.verticalAlign = "top"; td816.style.textAlign = "center";
	var td817 = d.createElement("td");		td817.style.padding = "3px";	td817.style.verticalAlign = "top"; td817.style.textAlign = "center";
	var td818 = d.createElement("td");		td818.style.padding = "3px";	td818.style.verticalAlign = "top"; td818.style.textAlign = "center";
	var td819 = d.createElement("td");		td819.style.padding = "3px";	td819.style.verticalAlign = "top"; td819.style.textAlign = "center";

	var tr821 = d.createElement("tr");
	var td821 = d.createElement("td");		td821.style.padding = "3px";	td821.style.verticalAlign = "bottom";
	var td822 = d.createElement("td");		td822.style.padding = "3px";	td822.style.verticalAlign = "top"; td822.style.textAlign = "center";
	var td823 = d.createElement("td");		td823.style.padding = "3px";	td823.style.verticalAlign = "top"; td823.style.textAlign = "center";
	var td824 = d.createElement("td");		td824.style.padding = "3px";	td824.style.verticalAlign = "top"; td824.style.textAlign = "center";
	var td825 = d.createElement("td");		td825.style.padding = "3px";	td825.style.verticalAlign = "top"; td825.style.textAlign = "center";
	var td826 = d.createElement("td");		td826.style.padding = "3px";	td826.style.verticalAlign = "top"; td826.style.textAlign = "center";
	var td827 = d.createElement("td");		td827.style.padding = "3px";	td827.style.verticalAlign = "top"; td827.style.textAlign = "center";
	var td828 = d.createElement("td");		td828.style.padding = "3px";	td828.style.verticalAlign = "top"; td828.style.textAlign = "center";
	var td829 = d.createElement("td");		td829.style.padding = "3px";	td829.style.verticalAlign = "top"; td829.style.textAlign = "center";

	Soldier_Box.appendChild(tr800);
		tr800.appendChild(td800);

	Soldier_Box.appendChild(tr81);
		tr81.appendChild(td81);
		td81.appendChild(tr811);
		td81.appendChild(tr821);

		tr811.appendChild(td811);
		tr811.appendChild(td812);
		tr811.appendChild(td813);
		tr811.appendChild(td814);
		tr811.appendChild(td815);
		tr811.appendChild(td816);
		tr811.appendChild(td817);
		tr811.appendChild(td818);
		tr811.appendChild(td819);

		tr821.appendChild(td821);
		tr821.appendChild(td822);
		tr821.appendChild(td823);
		tr821.appendChild(td824);
		tr821.appendChild(td825);
		tr821.appendChild(td826);
		tr821.appendChild(td827);
		tr821.appendChild(td828);
		tr821.appendChild(td829);

//	ABfacContainer.appendChild(Soldier_Box);

	ccreateText(td811, "dummy", "　", 0 );
	ccreateText(td812, "dummy", "槍兵", 0 );
	ccreateText(td813, "dummy", "弓兵", 0 );
	ccreateText(td814, "dummy", "騎兵", 0 );
	ccreateText(td815, "dummy", "矛槍兵", 0 );
	ccreateText(td816, "dummy", "弩兵", 0 );
	ccreateText(td817, "dummy", "近衛騎兵", 0 );
	ccreateText(td818, "dummy", "斥候", 0 );
	ccreateText(td819, "dummy", "斥候騎兵", 0 );

	ccreateText(td811, "dummy", "　兵数上限", 0 );
	ccreateTextBox(td812,"OPT_SOL_MAX3", OPT_SOL_MAX[3],"","槍兵の兵数上限",7,0);
	ccreateTextBox(td813,"OPT_SOL_MAX8", OPT_SOL_MAX[8],"","弓兵の兵数上限",7,0);
	ccreateTextBox(td814,"OPT_SOL_MAX5", OPT_SOL_MAX[5],"","騎兵の兵数上限",7,0);
	ccreateTextBox(td815,"OPT_SOL_MAX4", OPT_SOL_MAX[4],"","矛槍兵の兵数上限",7,0);
	ccreateTextBox(td816,"OPT_SOL_MAX9", OPT_SOL_MAX[9],"","弩兵の兵数上限",7,0);
	ccreateTextBox(td817,"OPT_SOL_MAX7", OPT_SOL_MAX[7],"","近衛騎兵の兵数上限",7,0);
	ccreateTextBox(td818,"OPT_SOL_MAX10", OPT_SOL_MAX[10],"","斥候の兵数上限",7,0);
	ccreateTextBox(td819,"OPT_SOL_MAX11", OPT_SOL_MAX[11],"","斥候騎兵の兵数上限",7,0);

	ccreateText(td811, "dummy", "　作成単位", 0 );
	ccreateTextBox(td812,"OPT_SOL_ADD3", OPT_SOL_ADD[3],"","槍兵の作成単位",7,0);
	ccreateTextBox(td813,"OPT_SOL_ADD8", OPT_SOL_ADD[8],"","弓兵の作成単位",7,0);
	ccreateTextBox(td814,"OPT_SOL_ADD5", OPT_SOL_ADD[5],"","騎兵の作成単位",7,0);
	ccreateTextBox(td815,"OPT_SOL_ADD4", OPT_SOL_ADD[4],"","矛槍兵の作成単位",7,0);
	ccreateTextBox(td816,"OPT_SOL_ADD9", OPT_SOL_ADD[9],"","弩兵の作成単位",7,0);
	ccreateTextBox(td817,"OPT_SOL_ADD7", OPT_SOL_ADD[7],"","近衛騎兵の作成単位",7,0);
	ccreateTextBox(td818,"OPT_SOL_ADD10", OPT_SOL_ADD[10],"","斥候の作成単位",7,0);
	ccreateTextBox(td819,"OPT_SOL_ADD11", OPT_SOL_ADD[11],"","斥候騎兵の作成単位",7,0);

//	ccreateText(td811, "dummy", "　", 0 );
//	ccreateText(td812, "dummy", "　", 0 );
//	ccreateText(td813, "dummy", "　", 0 );
//	ccreateText(td814, "dummy", "　", 0 );
//	ccreateText(td815, "dummy", "　", 0 );
//	ccreateText(td816, "dummy", "　", 0 );
//	ccreateText(td817, "dummy", "　", 0 );
//	ccreateText(td818, "dummy", "　", 0 );
//	ccreateText(td819, "dummy", "　", 0 );

	ccreateText(td821, "dummy", "　", 0 );
	ccreateText(td822, "dummy", "剣兵", 0 );
	ccreateText(td823, "dummy", "大剣兵", 0 );
	ccreateText(td824, "dummy", "盾兵", 0 );
	ccreateText(td825, "dummy", "重盾兵", 0 );
	ccreateText(td826, "dummy", "衝車", 0 );
	ccreateText(td827, "dummy", "投石機", 0 );
	ccreateText(td828, "dummy", "　", 0 );
	ccreateText(td829, "dummy", "　", 0 );

	ccreateText(td821, "dummy", "　兵数上限", 0 );
	ccreateTextBox(td822,"OPT_SOL_MAX1" , OPT_SOL_MAX[1] ,"","剣兵の兵数上限",7,0);
	ccreateTextBox(td823,"OPT_SOL_MAX15", OPT_SOL_MAX[15],"","大剣兵の兵数上限",7,0);
	ccreateTextBox(td824,"OPT_SOL_MAX16", OPT_SOL_MAX[16],"","盾兵の兵数上限",7,0);
	ccreateTextBox(td825,"OPT_SOL_MAX17", OPT_SOL_MAX[17],"","重盾兵の兵数上限",7,0);
	ccreateTextBox(td826,"OPT_SOL_MAX12", OPT_SOL_MAX[12],"","衝車の兵数上限",7,0);
	ccreateTextBox(td827,"OPT_SOL_MAX13", OPT_SOL_MAX[13],"","投石機の兵数上限",7,0);
	ccreateText(td828, "dummy", "　", 0 );
	ccreateText(td829, "dummy", "　", 0 );

	ccreateText(td821, "dummy", "　作成単位", 0 );
	ccreateTextBox(td822,"OPT_SOL_ADD1" , OPT_SOL_ADD[1] ,"","剣兵の作成単位",7,0);
	ccreateTextBox(td823,"OPT_SOL_ADD15", OPT_SOL_ADD[15],"","大剣兵の作成単位",7,0);
	ccreateTextBox(td824,"OPT_SOL_ADD16", OPT_SOL_ADD[16],"","盾兵の作成単位",7,0);
	ccreateTextBox(td825,"OPT_SOL_ADD17", OPT_SOL_ADD[17],"","重盾兵の作成単位",7,0);
	ccreateTextBox(td826,"OPT_SOL_ADD12", OPT_SOL_ADD[12],"","衝車の作成単位",7,0);
	ccreateTextBox(td827,"OPT_SOL_ADD13", OPT_SOL_ADD[13],"","投石機の作成単位",7,0);
	ccreateText(td828, "dummy", "　", 0 );
	ccreateButton(td829, "作成中止", "兵士の作成単位を初期化します。", function() {clearInitSoldier();});


	// ===== 自動 武器・防具強化 ====

	var Blacksmith_Box = d.createElement("table");
		Blacksmith_Box.style.border ="solid 2px black";
		Blacksmith_Box.style.marginBottom = "4px";
		Blacksmith_Box.style.width = "100%";

	var tr900 = d.createElement("tr");
		tr900.style.border = "solid 1px black";
		tr900.style.backgroundColor =COLOR_TITLE;

	var td900 = d.createElement("td");
		ccreateCheckBox(td900, "OPT_BKBG_CHK", OPT_BKBG_CHK, " 自動武器・防具強化", "この都市で自動的に武器・防具の強化をします。", 0);

	var tr91 = d.createElement("tr");
		tr91.style.border = "solid 1px black";
		tr91.style.backgroundColor =COLOR_BACK;
	var td91 = d.createElement("td");
		td91.style.padding = "3px";

	var tr911 = d.createElement("tr");
	var td911 = d.createElement("td");		td911.style.padding = "3px";		td911.style.verticalAlign = "bottom";
	var td912 = d.createElement("td");		td912.style.padding = "3px";		td912.style.verticalAlign = "top";	td912.style.textAlign = "center";
	var td913 = d.createElement("td");		td913.style.padding = "3px";		td913.style.verticalAlign = "top";	td913.style.textAlign = "center";
	var td914 = d.createElement("td");		td914.style.padding = "3px";		td914.style.verticalAlign = "top";	td914.style.textAlign = "center";
	var td915 = d.createElement("td");		td915.style.padding = "3px";		td915.style.verticalAlign = "top";	td915.style.textAlign = "center";
	var td916 = d.createElement("td");		td916.style.padding = "3px";		td916.style.verticalAlign = "top";	td916.style.textAlign = "center";
	var td917 = d.createElement("td");		td917.style.padding = "3px";		td917.style.verticalAlign = "top";	td917.style.textAlign = "center";
	var td918 = d.createElement("td");		td918.style.padding = "3px";		td918.style.verticalAlign = "top";	td918.style.textAlign = "center";
	var td919 = d.createElement("td");		td919.style.padding = "3px";		td919.style.verticalAlign = "top";	td919.style.textAlign = "center";
	var td920 = d.createElement("td");		td920.style.padding = "3px";		td920.style.verticalAlign = "top";	td920.style.textAlign = "center";
	var td921 = d.createElement("td");		td921.style.padding = "3px";		td921.style.verticalAlign = "top";	td921.style.textAlign = "center";
	var td922 = d.createElement("td");		td922.style.padding = "3px";		td922.style.verticalAlign = "top";	td922.style.textAlign = "center";
	var td923 = d.createElement("td");		td923.style.padding = "3px";		td923.style.verticalAlign = "top";	td923.style.textAlign = "center";
	var td924 = d.createElement("td");		td924.style.padding = "3px";		td924.style.verticalAlign = "top";	td924.style.textAlign = "center";
	var td925 = d.createElement("td");		td925.style.padding = "3px";		td925.style.verticalAlign = "top";	td925.style.textAlign = "center";

	Blacksmith_Box.appendChild(tr900);
		tr900.appendChild(td900);
	Blacksmith_Box.appendChild(tr91);
		tr91.appendChild(td91);
		td91.appendChild(tr911);

		tr911.appendChild(td911);
		tr911.appendChild(td912);
		tr911.appendChild(td913);
		tr911.appendChild(td914);
		tr911.appendChild(td915);
		tr911.appendChild(td916);
		tr911.appendChild(td917);
		tr911.appendChild(td918);
		tr911.appendChild(td919);
		tr911.appendChild(td920);

//	ABfacContainer.appendChild(Blacksmith_Box);

	ccreateText(td911, "dummy", "　", 0 );
	ccreateText(td912, "dummy", "槍兵", 0 );
	ccreateText(td913, "dummy", "弓兵", 0 );
	ccreateText(td914, "dummy", "騎兵", 0 );
	ccreateText(td915, "dummy", "矛槍兵", 0 );
	ccreateText(td916, "dummy", "弩兵", 0 );
	ccreateText(td917, "dummy", "近衛騎兵", 0 );
	ccreateText(td918, "dummy", "戦斧兵", 0 );
	ccreateText(td919, "dummy", "双剣兵", 0 );
	ccreateText(td920, "dummy", "大錘兵", 0 );

	ccreateText(td911, "dummy", "武器レベル", 0 );
	ccreateTextBox(td912,"OPT_BK_LV3", OPT_BK_LV[3],"","槍兵の武器レベル",7,0);
	ccreateTextBox(td913,"OPT_BK_LV8", OPT_BK_LV[8],"","弓兵の武器レベル",7,0);
	ccreateTextBox(td914,"OPT_BK_LV5", OPT_BK_LV[5],"","騎兵の武器レベル",7,0);
	ccreateTextBox(td915,"OPT_BK_LV4", OPT_BK_LV[4],"","矛槍兵の武器レベル",7,0);
	ccreateTextBox(td916,"OPT_BK_LV9", OPT_BK_LV[9],"","弩兵の武器レベル",7,0);
	ccreateTextBox(td917,"OPT_BK_LV7", OPT_BK_LV[7],"","近衛騎兵の武器レベル",7,0);
	ccreateTextBox(td918,"OPT_BK_LV18", OPT_BK_LV[18],"","戦斧兵の武器レベル",7,0);
	ccreateTextBox(td919,"OPT_BK_LV19", OPT_BK_LV[19],"","双剣兵の武器レベル",7,0);
	ccreateTextBox(td920,"OPT_BK_LV20", OPT_BK_LV[20],"","大錘兵の武器レベル",7,0);

	ccreateText(td911, "dummy", "防具レベル", 0 );
	ccreateTextBox(td912,"OPT_BG_LV3", OPT_BG_LV[3],"","槍兵の防具レベル",7,0);
	ccreateTextBox(td913,"OPT_BG_LV8", OPT_BG_LV[8],"","弓兵の防具レベル",7,0);
	ccreateTextBox(td914,"OPT_BG_LV5", OPT_BG_LV[5],"","騎兵の防具レベル",7,0);
	ccreateTextBox(td915,"OPT_BG_LV4", OPT_BG_LV[4],"","矛槍兵の防具レベル",7,0);
	ccreateTextBox(td916,"OPT_BG_LV9", OPT_BG_LV[9],"","弩兵の防具レベル",7,0);
	ccreateTextBox(td917,"OPT_BG_LV7", OPT_BG_LV[7],"","近衛騎兵の防具レベル",7,0);
	ccreateTextBox(td918,"OPT_BG_LV18", OPT_BG_LV[18],"","戦斧兵の防具レベル",7,0);
	ccreateTextBox(td919,"OPT_BG_LV19", OPT_BG_LV[19],"","双剣兵の防具レベル",7,0);
	ccreateTextBox(td920,"OPT_BG_LV20", OPT_BG_LV[20],"","大錘兵の防具レベル",7,0);

	ccreateText(td911, "dummy", "　", 0 );
	ccreateText(td912, "dummy", "　", 0 );
	ccreateText(td913, "dummy", "　", 0 );
	ccreateText(td914, "dummy", "　", 0 );
	ccreateText(td915, "dummy", "　", 0 );
	ccreateText(td916, "dummy", "　", 0 );
	ccreateText(td917, "dummy", "　", 0 );
	ccreateText(td918, "dummy", "　", 0 );
	ccreateText(td919, "dummy", "　", 0 );
	ccreateText(td920, "dummy", "　", 0 );

	ccreateText(td911, "dummy", "　", 0 );
	ccreateText(td912, "dummy", "剣兵", 0 );
	ccreateText(td913, "dummy", "大剣兵", 0 );
	ccreateText(td914, "dummy", "盾兵", 0 );
	ccreateText(td915, "dummy", "重盾兵", 0 );
	ccreateText(td916, "dummy", "衝車", 0 );
	ccreateText(td917, "dummy", "投石機", 0 );
	ccreateText(td918, "dummy", "斥候", 0 );
	ccreateText(td919, "dummy", "斥候騎兵", 0 );
	ccreateText(td920, "dummy", "　", 0 );

	ccreateText(td911, "dummy", "武器レベル", 0 );
	ccreateTextBox(td912,"OPT_BK_LV1" , OPT_BK_LV[1] ,"","剣兵の武器レベル",7,0);
	ccreateTextBox(td913,"OPT_BK_LV15", OPT_BK_LV[15],"","大剣兵の武器レベル",7,0);
	ccreateTextBox(td914,"OPT_BK_LV16", OPT_BK_LV[16],"","盾兵の武器レベル",7,0);
	ccreateTextBox(td915,"OPT_BK_LV17", OPT_BK_LV[17],"","重盾兵の武器レベル",7,0);
	ccreateTextBox(td916,"OPT_BK_LV12", OPT_BK_LV[12],"","衝車の武器レベル",7,0);
	ccreateTextBox(td917,"OPT_BK_LV13", OPT_BK_LV[13],"","投石機の武器レベル",7,0);
	ccreateText(td918, "dummy", "　", 0 );
	ccreateText(td919, "dummy", "　", 0 );
	ccreateText(td920, "dummy", "　", 0 );

	ccreateText(td911, "dummy", "防具レベル", 0 );
	ccreateTextBox(td912,"OPT_BG_LV1" , OPT_BG_LV[1] ,"","剣兵の防具レベル",7,0);
	ccreateTextBox(td913,"OPT_BG_LV15", OPT_BG_LV[15],"","大剣兵の防具レベル",7,0);
	ccreateTextBox(td914,"OPT_BG_LV16", OPT_BG_LV[16],"","盾兵の防具レベル",7,0);
	ccreateTextBox(td915,"OPT_BG_LV17", OPT_BG_LV[17],"","重盾兵の防具レベル",7,0);
	ccreateTextBox(td916,"OPT_BG_LV12", OPT_BG_LV[12],"","衝車の防具レベル",7,0);
	ccreateTextBox(td917,"OPT_BG_LV13", OPT_BG_LV[13],"","投石機の防具レベル",7,0);
	ccreateTextBox(td918,"OPT_BG_LV10", OPT_BG_LV[10],"","斥候の防具レベル",7,0);
	ccreateTextBox(td919,"OPT_BG_LV11", OPT_BG_LV[11],"","斥候騎兵の防具レベル",7,0);
	ccreateButton(td920, "初期化", "武器・防具の設定レベルを消去します。", function() {clearInitArmsArmor();});


	// ===== 残す資源量 ====

	var Storage_Box = d.createElement("table");
		Storage_Box.style.border ="solid 2px black";
		Storage_Box.style.marginBottom = "4px";
		Storage_Box.style.width = "100%";

	var tra10 = d.createElement("tr");
		tra10.style.border = "solid 1px black";
		tra10.style.backgroundColor =COLOR_TITLE;

	var tda10 = d.createElement("td");
		ccreateCaptionText(tda10, "dummy", "■ 自動造兵・武器防具強化時に残す資源量 ■", 0 );

	var tra1 = d.createElement("tr");
		tra1.style.border = "solid 1px black";
		tra1.style.backgroundColor =COLOR_BACK;
	var tda1 = d.createElement("td");
		tda1.style.padding = "2px";
	var tra11 = d.createElement("tr");
	var tra21 = d.createElement("tr");
	var tda11 = d.createElement("td");
		tda11.style.padding = "2px";
		tda11.style.verticalAlign = "top";
		tda11.style.textAlign = "center";
	var tda12 = d.createElement("td");
		tda12.style.padding = "2px";
	tda12.style.verticalAlign = "top";
		tda12.style.textAlign = "center";
	var tda13 = d.createElement("td");
		tda13.style.padding = "2px";
		tda13.style.verticalAlign = "top";
		tda13.style.textAlign = "center";
	var tda14 = d.createElement("td");
		tda14.style.padding = "2px";
		tda14.style.verticalAlign = "top";
		tda14.style.textAlign = "center";
	var tda15 = d.createElement("td");
		tda15.style.padding = "2px";
		tda15.style.verticalAlign = "top";
		tda15.style.textAlign = "center";

	Storage_Box.appendChild(tra10);
		tra10.appendChild(tda10);
	Storage_Box.appendChild(tra1);
		tra1.appendChild(tda1);
		tda1.appendChild(tra11);

		tra11.appendChild(tda11);
		tra11.appendChild(tda12);
		tra11.appendChild(tda13);
		tra11.appendChild(tda14);
		tra11.appendChild(tda15);

	ccreateText(tda11, "dummy", "木", 0 );
	ccreateText(tda12, "dummy", "石", 0 );
	ccreateText(tda13, "dummy", "鉄", 0 );
	ccreateText(tda14, "dummy", "糧", 0 );
	ccreateText(tda15, "dummy", "　", 0 );

	ccreateTextBox(tda11,"OPT_BLD_WOOD", OPT_BLD_WOOD,"","木を残す量",7,0);
	ccreateTextBox(tda12,"OPT_BLD_STONE", OPT_BLD_STONE,"","石を残す量",7,0);
	ccreateTextBox(tda13,"OPT_BLD_IRON", OPT_BLD_IRON,"","鉄を残す量",7,0);
	ccreateTextBox(tda14,"OPT_BLD_RICE", OPT_BLD_RICE,"","糧を残す量",7,0);
	var btn = ccreateButton(tda15, "初期化", "残す資源量の設定内容を消去します。", function() {clearInitRemainingRes();},54,0);
	q$(btn).before("　　");

	// ===== 宿舎村設定 ===== 2013.12.26
	var dorm_Box = d.createElement("table");
		dorm_Box.style.margin = "0px 4px 4px 0px";
		dorm_Box.style.border ="solid 2px black";
		dorm_Box.style.width = "100%";
		dorm_Box.style.display = "none";

	var trc10 = d.createElement("tr");
		trc10.style.border = "solid 1px black";
		trc10.style.backgroundColor =COLOR_TITLE;

	var tdc10 = d.createElement("td");
		tdc10.style.padding = "1px";
		ccreateCheckBox(tdc10,"OPT_DORM", OPT_DORM, " 宿舎村化", "この都市を宿舎村にする。平地に宿舎・倉庫・鍛冶場を建てる。",0);

	var trc11 = d.createElement("tr");
		trc11.style.border = "solid 1px black";
		trc11.style.backgroundColor =COLOR_BACK;

	var tdc11 = d.createElement("td");
		tdc11.style.padding = "3px";
		tdc11.style.verticalAlign = "top";

	ccreateText(tdc11, "dummy", "宿舎村を建設します。", 0 );
	ccreateText(tdc11, "dummy", "練兵所Lv3がある場合は鍛冶場を建設します。", 0 );

	dorm_Box.appendChild(trc10);
	dorm_Box.appendChild(trc11);
	trc10.appendChild(tdc10);
	trc11.appendChild(tdc11);

	// ===== チュートリアル設定 =====

	var tut_Box = d.createElement("table");
		tut_Box.style.margin = "0px 4px 4px 0px";
		tut_Box.style.border ="solid 2px black";
		tut_Box.style.width = "100%";
		tut_Box.style.display = "none";

	var trb10 = d.createElement("tr");
		trb10.style.border = "solid 1px black";
		trb10.style.backgroundColor =COLOR_TITLE;

	var tdb10 = d.createElement("td");
		tdb10.style.padding = "1px";
		tdb10.appendChild( createRadioBtn ( 'TU', '自動チュートリアル' ) );

	var trb11 = d.createElement("tr");
		trb11.style.border = "solid 1px black";
		trb11.style.backgroundColor =COLOR_BACK;

	var tdb11 = d.createElement("td");
		tdb11.style.padding = "3px";
		tdb11.style.verticalAlign = "top";

	ccreateText(tdb11, "dummy", "チュートリアルを完遂します。", 0 );
	ccreateText(tdb11, "dummy", "最初に武将の出兵・ステータス割振り。内政武将の設定をお願いします。", 0 );

	tut_Box.appendChild(trb10);
	tut_Box.appendChild(trb11);
	trb10.appendChild(tdb10);
	trb11.appendChild(tdb11);

	// ===== 確認 ====

	var Operation_Box = d.createElement("table");
		Operation_Box.style.border ="solid 0px gray";

	var tr711 = d.createElement("tr");
	var td711 = d.createElement("td");
		td711.style.padding = "3px";
		td711.style.verticalAlign = "top";

	Operation_Box.appendChild(tr711);
		tr711.appendChild(td711);

	ccreateButton(td711, "保存", "設定内容を保存します", function() {
		q$(this).attr("value","保存中");
		q$(this).attr("id","AFSaveButton");
		SaveInifacBox(ABfacContainer.getAttribute('vId'));
		//alert("保存しました");
		setTimeout(function(){ q$("#AFSaveButton").attr("value","保存"); },200);
	});
	ccreateButton(td711, "閉じる", "設定内容を保存せず閉じます", function() {
		closeInifacBox();
		if (tidMain2 != undefined) { clearInterval(tidMain2); }
		tidMain2=setTimeout(function(){location.reload();},INTERVAL);
	});
	ccreateButton(td711, "保存して閉じる", "設定内容を保存して閉じます(リロードなし)", function() {
		SaveInifacBox(ABfacContainer.getAttribute('vId'));
		closeInifacBox();
	},90);


	if (vId == villages[0][IDX_XY]) {
		ccreateButton(td711, "市場情報初期化", "市場情報を初期化します", function() {

			csaveData(HOST+"ShopList",[],true,true);
			closeIniBilderBox();
			openIniBilderBox();
			alert("市場情報を初期化しました");
		},90);
	}

	// == コンテナ設定 ==
	// 上段
	var tbl000 = d.createElement("table");	// 全体
		tbl000.style.border = "solid 0px lime";

	var tr000 = d.createElement("tr");
	var td001 = d.createElement("td");	// 左枠
		td001.style.verticalAlign = "top";
		td001.style.width = "auto";

		td001.appendChild(Build_Box);

		// 本拠地かどうか
		if (vId == villages[0][IDX_XY]) {
			td001.appendChild(tut_Box); 				// 2013.12.18
		}

		td001.appendChild(Domestic_Box);

		// 本拠地かどうか
		if (vId == villages[0][IDX_XY]) {
			td001.appendChild(Market_Box);
		}


	var td002 = d.createElement("td");	// 右枠
		td002.style.verticalAlign = "top";
		td002.style.paddingLeft = "4px";
		td002.style.width = "Auto";


		td002.appendChild(Field_Box);		// 糧村化設定
		td002.appendChild(SDorm_Box);		// 宿舎化
		td002.appendChild(Waterwheel_Box);	// 水車村
		td002.appendChild(dorm_Box);		// 宿舎村化設定 2013.12.26


		td002.appendChild(Contribution_Box);
		td002.appendChild(Storage_Box);
		td002.appendChild(Remove_Box); // 2015.05.10

	// 中段
	var tbl010 = d.createElement("table");
		tbl010.style.border = "solid 0px red";

	var tr010 = d.createElement("tr");
		tr010.style.verticalAlign = "top";

	var td011 = d.createElement("td");

	var td012 = d.createElement("td");

	var td013 = d.createElement("td");

	//	レイアウト

	ABfacContainer.appendChild(tbl000);
		tbl000.appendChild(tr000);
		tr000.appendChild(td001);
		tr000.appendChild(td002);

	ABfacContainer.appendChild(tbl010);
		tbl010.appendChild(tr010);
		tr010.appendChild(td011);
		tr010.appendChild(td012);
		tr010.appendChild(td013);

	ABfacContainer.appendChild(Soldier_Box);
	ABfacContainer.appendChild(Blacksmith_Box);
	ABfacContainer.appendChild(Operation_Box);

}

// ラジオボタン生成 @@@@ add 2011.09.06
function createRadioBtn ( value, txt ) {
	var radioLabel = document.createElement('label');
	radioLabel.style.display = 'inline-block';
	radioLabel.style.margin = '0 5px 0 0';
	radioLabel.style.padding = '0px';
//	dv.style.padding = "2px";
//	  radioLabel.addEventListener ( 'click', function(){GM_setValue( 'tweetOpt', value );}, true );
	radioLabel.addEventListener ( 'click', function(){ OPT_BLD = value;}, true );
	var radioLabelText = document.createTextNode(" " + txt);
	var radioButton = document.createElement('input');
	radioButton.type = 'radio';
	radioButton.name = 'tweetOpt';
	radioButton.value = value;
	radioButton.style.verticalAlign = "top";
//	  radioButton.style.margin = '0 2px 0 0';
	if ( OPT_BLD == value ) radioButton.checked = true;
	radioLabel.appendChild( radioButton );
	radioLabel.appendChild( radioLabelText );
	return radioLabel;
}

//拠点単位の設定の保存（XY MAX_LV CheckData)
function SaveInifacBox(vId){

	// 本拠地
	var i;
	var opt = $("OPT_MAX_LV");
	strSave = cgetTextBoxValue(opt) + DELIMIT1;
	for(i=0; i<=22;i++){
		var opt = $("OPT_CHKBOX"+i);
		strSave += cgetCheckBoxValue(opt) + DELIMIT2;
	}
	//市場変換処理用
	strSave += cgetCheckBoxValue($("OPT_ICHIBA")) + DELIMIT2; //市場で変換するかどうかのフラグ
	strSave += cgetTextBoxValue($("OPT_RISE_MAX")) + DELIMIT2;
	strSave += cgetTextBoxValue($("OPT_TO_WOOD")) + DELIMIT2;
	strSave += cgetTextBoxValue($("OPT_TO_STONE")) + DELIMIT2;
	strSave += cgetTextBoxValue($("OPT_TO_IRON")) + DELIMIT2;
	//糧村化
	strSave += cgetCheckBoxValue($("OPT_KATEMURA")) + DELIMIT2;
	strSave += cgetTextBoxValue($("OPT_SOUKO_MAX")) + DELIMIT2;

	//自動寄付用
	strSave += cgetCheckBoxValue($("OPT_KIFU")) + DELIMIT2; //寄付するかどうかのフラグ
	strSave += cgetTextBoxValue($("OPT_RISE_KIFU_MAX")) + DELIMIT2;
	strSave += cgetTextBoxValue($("OPT_RISE_KIFU")) + DELIMIT2; //自動内政用に修正

	//自動内政用 by nottisan ここから追加
	// ＠＠　追加　＠＠
	strSave += cgetComboBoxValue($("OPT_ICHIBA_PA")) + DELIMIT2; //市場での変換パターンフラグ
	try {
		strSave += cgetCheckBoxValue($("OPT_DOME1")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME2")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME3")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME4")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME5")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME6")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME7")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME8")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME9")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME10")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME11")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME12")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME13")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME14")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME15")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME16")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME17")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME18")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME19")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME20")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME21")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME22")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME23")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME24")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME25")) + DELIMIT2; //removed @2016.12.30
		strSave += cgetCheckBoxValue($("OPT_DOME26")) + DELIMIT2; //removed @2016.12.30
		strSave += cgetCheckBoxValue($("OPT_DOME27")) + DELIMIT2; //removed @2016.12.30
		strSave += cgetCheckBoxValue($("OPT_DOME28")) + DELIMIT2; //removed @2016.12.30
		strSave += cgetCheckBoxValue($("OPT_DOME29")) + DELIMIT2; //removed @2016.12.30
		strSave += cgetCheckBoxValue($("OPT_DOME30")) + DELIMIT2; //removed @2016.12.30
		strSave += cgetCheckBoxValue($("OPT_DOME31")) + DELIMIT2; //removed @2016.12.30
		strSave += cgetCheckBoxValue($("OPT_DOME32")) + DELIMIT2; //removed @2016.12.30
		strSave += cgetCheckBoxValue($("OPT_DOME33")) + DELIMIT2; //removed @2016.12.30
		strSave += cgetCheckBoxValue($("OPT_DOME34")) + DELIMIT2; //removed @2016.12.30
		strSave += cgetCheckBoxValue($("OPT_DOME35")) + DELIMIT2; //removed @2016.12.30
		strSave += cgetCheckBoxValue($("OPT_DOME36")) + DELIMIT2; //removed @2016.12.30
		strSave += cgetCheckBoxValue($("OPT_DOME37")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME38")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME39")) + DELIMIT2; //内政使用するかのフラグ
		strSave += cgetCheckBoxValue($("OPT_DOME40")) + DELIMIT2; //内政使用するかのフラグ
	} catch(e) {
		strSave += 0 + DELIMIT2; //内政使用するかのフラグ
	}
	// 施設ごとの建設レベル保存用
	for(i=0; i<=22;i++) {
		var opt = $("OPT_CHKBOXLV" + i);
		strSave += cgetTextBoxValue(opt) + DELIMIT2;
	}

	strSave += cgetTextBoxValue($("OPT_MAX_WOOD")) + DELIMIT2;
	strSave += cgetTextBoxValue($("OPT_MAX_STONE")) + DELIMIT2;
	strSave += cgetTextBoxValue($("OPT_MAX_IRON")) + DELIMIT2;

	strSave += OPT_BLD	 + DELIMIT2;			// 建築 or ビルスク
	strSave += OPT_SorH  + DELIMIT2;			// 畑 or 宿舎
	strSave += cgetTextBoxValue($("OPT_MAX")) + DELIMIT2;	// 対象上限数

	if (cgetTextBoxValue($("OPT_MAXLV")) < 16) {
		strSave += cgetTextBoxValue($("OPT_MAXLV")) + DELIMIT2; // 対象上限LV
	} else {
		strSave += 15 + DELIMIT2;	// 対象上限LV
	}
	// 兵作成情報の保存
	for (i=0;i<18;i++){
		var opt = $("OPT_SOL_MAX" + i);
		strSave += cgetTextBoxValue(opt) + DELIMIT2;
	}
	for (i=0;i<18;i++){
		var opt = $("OPT_SOL_ADD" + i);
		strSave += cgetTextBoxValue(opt) + DELIMIT2;
	}
	strSave += cgetCheckBoxValue($("OPT_BLD_SOL"))	+ DELIMIT2; //自動造兵するかのフラグ

	strSave += cgetTextBoxValue($("OPT_BLD_WOOD"))	+ DELIMIT2;
	strSave += cgetTextBoxValue($("OPT_BLD_STONE"))	+ DELIMIT2;
	strSave += cgetTextBoxValue($("OPT_BLD_IRON"))	+ DELIMIT2;
	strSave += cgetTextBoxValue($("OPT_BLD_RICE"))	+ DELIMIT2;

	for (i=0;i<18;i++){
		if ((i == 10) || (i == 11)) { // 斥候,斥候騎兵は0固定
			strSave += "0" + DELIMIT2;
		} else {
			var opt = $("OPT_BK_LV" + i);
			if (cgetTextBoxValue(opt) > 10) { // 10上限
				strSave += "10" + DELIMIT2;
			} else {
				strSave += cgetTextBoxValue(opt) + DELIMIT2;
			}
		}
	}
	for (i=0;i<18;i++){
		var opt = $("OPT_BG_LV" + i);
		if (cgetTextBoxValue(opt) > 10) { // 10上限
			strSave += "10" + DELIMIT2;
		} else {
			strSave += cgetTextBoxValue(opt) + DELIMIT2;
		}
	}
	strSave += cgetCheckBoxValue($("OPT_BKBG_CHK")) + DELIMIT2; 		//自動武器・防具強化するかのフラグ
	strSave += cgetCheckBoxValue($("OPT_DORM")) + DELIMIT2; 		// 宿舎村 2013.12.26

	// 自動削除 2015.05.10
	strSave += cgetCheckBoxValue($("OPT_REMOVE")) + DELIMIT2;
	for(i=0; i<=22;i++) {
		var opt = $("OPT_RM_CHKBOX"+i);
		strSave += cgetCheckBoxValue(opt) + DELIMIT2;
	}
	for(i=0; i<=22;i++) {
		var opt = $("OPT_RM_CHKBOXLV" + i);
		strSave += cgetTextBoxValue(opt) + DELIMIT2;
	}

	// 水車村 2015.05.23
	strSave += cgetCheckBoxValue($("OPT_1112MURA")) + DELIMIT2;
	strSave += cgetCheckBoxValue($("OPT_0001S5MURA")) + DELIMIT2;
	strSave += cgetCheckBoxValue($("OPT_PLANT5MURAN")) + DELIMIT2;
	strSave += cgetCheckBoxValue($("OPT_PLANT5MURAE")) + DELIMIT2;
	strSave += cgetCheckBoxValue($("OPT_PLANT5MURAW")) + DELIMIT2;
	strSave += cgetCheckBoxValue($("OPT_PLANT5MURAS")) + DELIMIT2;
	strSave += cgetCheckBoxValue($("OPT_0001S7MURA")) + DELIMIT2;
	strSave += cgetCheckBoxValue($("OPT_0001S3MURA")) + DELIMIT2;
	strSave += cgetCheckBoxValue($("OPT_0000S8MURA")) + DELIMIT2;

	strSave += cgetCheckBoxValue($("OPT_SHUKUSHA")) + DELIMIT2;
	strSave += cgetCheckBoxValue($("OPT_DAISHUKUSHA")) + DELIMIT2;

	strSave += cgetCheckBoxValue($("OPT_PLANT9MURA74")) + DELIMIT2;

	strSave += cgetCheckBoxValue($("OPT_1111S4MURA")) + DELIMIT2;

	strSave += cgetCheckBoxValue($("OPT_0000S6MURA")) + DELIMIT2;

	// @2019.01.10: 戦斧兵,双剣兵,大錘兵の武器LV/防具LV
	for (i=18;i<21;i++){
		var opt = $("OPT_BK_LV" + i);
		if (cgetTextBoxValue(opt) > 10) { // 10上限
			strSave += "10" + DELIMIT2;
		} else {
			strSave += cgetTextBoxValue(opt) + DELIMIT2;
		}
	}
	for (i=18;i<21;i++){
		var opt = $("OPT_BG_LV" + i);
		if (cgetTextBoxValue(opt) > 10) { // 10上限
			strSave += "10" + DELIMIT2;
		} else {
			strSave += cgetTextBoxValue(opt) + DELIMIT2;
		}
	}

	// save
	GM_setValue(HOST+PGNAME+vId, strSave);
}
//拠点単位の設定の読み込み
function Load_OPT(vId){

debugLog("=== Start Load_OPT ===");
	var src = GM_getValue(HOST+PGNAME+vId, "");
	if (src == "") {
		debugLog("拠点データなし");
		// 拠点データがない場合

		OPT_KATEMURA		= 0;
		OPT_SHUKUSHA		= 0;
		OPT_DAISHUKUSHA		= 0;
		OPT_1112MURA		= 0;
		OPT_0001S3MURA		= 0;
		OPT_0001S5MURA		= 0;
		OPT_0001S7MURA		= 0;
		OPT_0000S8MURA		= 0;
		OPT_PLANT5MURAN		= 0;
		OPT_PLANT5MURAE		= 0;
		OPT_PLANT5MURAW		= 0;
		OPT_PLANT5MURAS		= 0;
		OPT_PLANT9MURA74	= 0;
		OPT_1111S4MURA		= 0;
		OPT_0000S6MURA		= 0;
		OPT_DORM			= 0;				// 2013.12.16
		OPT_SOUKO_MAX		= 0;
		OPT_KIFU			= 0;
		OPT_RISE_KIFU_MAX	= 0;
		OPT_RISE_KIFU		= 0;
		OPT_REMOVE		= 0; // 2015.05.10
		for(i=1; i<=40; i++){ OPT_DOME[i]	  = 0;}
		for(i=0; i<=22; i++){ OPT_CHKBOX[i]   = 0;}
		for(i=0; i<=22; i++){ OPT_CHKBOXLV[i] = "0";}
		for(i=0; i<=22; i++){ OPT_RM_CHKBOX[i]	 = 0;}	 // 2015.05.10
		for(i=0; i<=22; i++){ OPT_RM_CHKBOXLV[i] = "0";} // 2015.05.10

		//市場変換処理用 （本拠地情報にデータがある）
		var villages = loadVillages(HOST+PGNAME);
		var src2 = GM_getValue(HOST+PGNAME+villages[0][IDX_XY], "");
		if (src2 == "") {
			OPT_ICHIBA	  = 0;		// 市場自動変換の利用有無
			OPT_RISE_MAX  = 0;		// 糧の自動変換開始量
			OPT_TO_WOOD   = 0;		// 木に変換する糧の量
			OPT_TO_STONE  = 0;		// 石　　　 〃
			OPT_TO_IRON   = 0;		// 鉄		〃
			OPT_ICHIBA_PA = 0;		// 変換パターン
			OPT_MAX_WOOD  = 0;		// 木の最大保持量（この量を超えたら変換しない）
			OPT_MAX_STONE = 0;		// 石	 〃
			OPT_MAX_IRON  = 0;		// 鉄	 〃
		} else {
			var shiroTemp  = src2.split(DELIMIT1);
			var shiroTemp2 = shiroTemp[1].split(DELIMIT2);

			OPT_ICHIBA = forInt(shiroTemp2[23]);		// 市場自動変換の利用有無
			OPT_RISE_MAX = forInt(shiroTemp2[24]);		// 糧の自動変換開始量
			OPT_TO_WOOD = forInt(shiroTemp2[25]);		// 木に変換する糧の量
			OPT_TO_STONE = forInt(shiroTemp2[26]);		// 石　　　 〃
			OPT_TO_IRON = forInt(shiroTemp2[27]);		// 鉄		〃
			OPT_ICHIBA_PA = shiroTemp2[33]; 			// 変換パターン
			OPT_MAX_WOOD = forInt(shiroTemp2[97]);		// 木の最大保持量（この量を超えたら変換しない）
			OPT_MAX_STONE = forInt(shiroTemp2[98]); 	// 石	 〃
			OPT_MAX_IRON = forInt(shiroTemp2[99]);		// 鉄	 〃
		}
		// ビルスク情報
		OPT_BLD = "AC";
		OPT_SorH = "DD";
		OPT_MAX   = 0;
		OPT_MAXLV = 0;
		OPT_MAX   = 6;
		OPT_MAXLV = 6;

		// 兵作成情報
		for (i=0;i<18;i++){ OPT_SOL_MAX[i] = 0; };
		for (i=0;i<18;i++){ OPT_SOL_ADD[i] = 0; };
		OPT_BLD_SOL   = 0;
		OPT_BLD_WOOD  = 0;
		OPT_BLD_STONE = 0;
		OPT_BLD_IRON  = 0;
		OPT_BLD_RICE  = 0;

		OPT_BLD_WOOD  = 0;
		OPT_BLD_STONE = 0;
		OPT_BLD_IRON  = 0;
		OPT_BLD_RICE  = 0;

		for (i=0;i<21;i++){ OPT_BK_LV[i] = 0; };
		for (i=0;i<21;i++){ OPT_BG_LV[i] = 0; };
		OPT_BKBG_CHK  = 0;

//		SaveInifacBox(vId); 	// 拠点情報の保存

		return;
	} else {
		// 拠点データの読込
		var Temp = src.split(DELIMIT1);
		OPT_MAX_LV = Temp[0];
		var Temp2 = Temp[1].split(DELIMIT2);
		var i;
		for(i=0; i<=22;i++){
			if(Temp2[i] == ""){return;}
			OPT_CHKBOX[i] = forInt(Temp2[i]);
		}

		//糧村化
		if(Temp2[28] == ""){return;}
		OPT_KATEMURA = forInt(Temp2[28]);
		OPT_SOUKO_MAX = forInt(Temp2[29]);

		//自動寄付
		if(Temp2[30] == ""){return;}
		OPT_KIFU = forInt(Temp2[30]);
		OPT_RISE_KIFU_MAX = forInt(Temp2[31]);
		OPT_RISE_KIFU = forInt(Temp2[32]);

		//自動内政 by nottisan ここから追加
		// ＠＠　追加　＠＠
		for (i=1;i<=40;i++){
			OPT_DOME[i]  = forInt(Temp2[33 + i]);
		}
	// @@ 2011.06.22
		for (i=0; i <= 22; i++){
			OPT_CHKBOXLV[i] = forInt(Temp2[74 + i]);
		}

		//市場変換処理用は本拠地データを取得
		var villages = loadVillages(HOST+PGNAME);
		var src2 = GM_getValue(HOST+PGNAME+villages[0][IDX_XY], "");
		if (src2 == "") {
			OPT_ICHIBA	  = 0;		// 市場自動変換の利用有無
			OPT_RISE_MAX  = 0;		// 糧の自動変換開始量
			OPT_TO_WOOD   = 0;		// 木に変換する糧の量
			OPT_TO_STONE  = 0;		// 石　　　 〃
			OPT_TO_IRON   = 0;		// 鉄		〃
			OPT_ICHIBA_PA = 0;		// 変換パターン
			OPT_MAX_WOOD  = 0;		// 木の最大保持量（この量を超えたら変換しない）
			OPT_MAX_STONE = 0;		// 石	 〃
			OPT_MAX_IRON  = 0;		// 鉄	 〃
		} else {

			var shiroTemp  = src2.split(DELIMIT1);
			var shiroTemp2 = shiroTemp[1].split(DELIMIT2);

			OPT_ICHIBA = forInt(shiroTemp2[23]);			// 市場自動変換の利用有無

			OPT_RISE_MAX = forInt(shiroTemp2[24]);			// 糧の自動変換開始量
			OPT_TO_WOOD = forInt(shiroTemp2[25]);			// 木に変換する糧の量
			OPT_TO_STONE = forInt(shiroTemp2[26]);			// 石　　　 〃
			OPT_TO_IRON = forInt(shiroTemp2[27]);			// 鉄		〃

			OPT_ICHIBA_PA = shiroTemp2[33]; 				// 変換パターン

			OPT_MAX_WOOD = forInt(shiroTemp2[97]);			// 木の最大保持量（この量を超えたら変換しない）
			OPT_MAX_STONE = forInt(shiroTemp2[98]); 		// 石	 〃
			OPT_MAX_IRON = forInt(shiroTemp2[99]);			// 鉄	 〃
		}

		// ビルスク情報
		OPT_BLD = Temp2[100];
		OPT_SorH = Temp2[101];
		OPT_MAX  = Temp2[102];
		OPT_MAXLV  = Temp2[103];
		if (OPT_MAX == undefined) { OPT_MAX = 6; }
		if (OPT_MAXLV == undefined || OPT_MAXLV > 15) { OPT_MAXLV = 6; }

		// 兵作成情報
		for (i=0;i<18;i++){
			OPT_SOL_MAX[i] = forInt(Temp2[104 + i]);
			if (isNaN(OPT_SOL_MAX[i])) { OPT_SOL_MAX[i]  = 0; };
		}
		for (i=0;i<18;i++){
			OPT_SOL_ADD[i] = forInt(Temp2[122 + i]);
			if (isNaN(OPT_SOL_ADD[i])) { OPT_SOL_ADD[i]  = 0; };
		}
		OPT_BLD_SOL  = forInt(Temp2[140]);

		OPT_BLD_WOOD  = forInt(Temp2[141]);
		OPT_BLD_STONE = forInt(Temp2[142]);
		OPT_BLD_IRON  = forInt(Temp2[143]);
		OPT_BLD_RICE  = forInt(Temp2[144]);

		if (isNaN(OPT_BLD_WOOD))  { OPT_BLD_WOOD  = 0; };
		if (isNaN(OPT_BLD_STONE)) { OPT_BLD_STONE = 0; };
		if (isNaN(OPT_BLD_IRON))  { OPT_BLD_IRON  = 0; };
		if (isNaN(OPT_BLD_RICE))  { OPT_BLD_RICE  = 0; };

		for (i=0;i<18;i++){
			OPT_BK_LV[i] = forInt(Temp2[145 + i]);
			if (isNaN(OPT_BK_LV[i])) { OPT_BK_LV[i]  = 0; };
		}

		for (i=0;i<18;i++){
			OPT_BG_LV[i] = forInt(Temp2[163 + i]);
			if (isNaN(OPT_BG_LV[i])) { OPT_BG_LV[i]  = 0; };
		}

		OPT_BKBG_CHK	= forInt(Temp2[181]);
		OPT_DORM		= forInt(Temp2[182]);			// 2013.12.26

		// 2015.05.10
		if(Temp2[183] == ""){return;}
		OPT_REMOVE		= forInt(Temp2[183]);
		for (i=0; i <= 22; i++){
			OPT_RM_CHKBOX[i] = forInt(Temp2[184 + i]);
		}
		for (i=0; i <= 22; i++){
			OPT_RM_CHKBOXLV[i] = forInt(Temp2[207 + i]);
		}

		// 2015.05.23
		if(Temp2[230] == ""){return;}
		OPT_1112MURA = forInt(Temp2[230]);
		if(Temp2[231] == ""){return;}
		OPT_0001S5MURA = forInt(Temp2[231]);
		if(Temp2[232] == ""){return;}
		OPT_PLANT5MURAN = forInt(Temp2[232]);
		OPT_PLANT5MURAE = forInt(Temp2[233]);
		OPT_PLANT5MURAW = forInt(Temp2[234]);
		OPT_PLANT5MURAS = forInt(Temp2[235]);
		if ((OPT_PLANT5MURAN+OPT_PLANT5MURAE+OPT_PLANT5MURAW+OPT_PLANT5MURAS) != 0) { // 2017.5.28.互換性のため
			OPT_PLANT5MURAN = 1;
		}
		if(Temp2[236] == ""){return;}
		OPT_0001S7MURA = forInt(Temp2[236]);
		if(Temp2[237] == ""){return;}
		OPT_0001S3MURA = forInt(Temp2[237]);
		if(Temp2[238] == ""){return;}
		OPT_0000S8MURA = forInt(Temp2[238]);
		if(Temp2[239] == ""){return;}
		OPT_SHUKUSHA = forInt(Temp2[239]);
		OPT_DAISHUKUSHA = forInt(Temp2[240]);
		if(Temp2[241] == ""){return;}
		OPT_PLANT9MURA74 = forInt(Temp2[241]);
		if(Temp2[242] == ""){return;}
		OPT_1111S4MURA = forInt(Temp2[242]);
		if(Temp2[243] == ""){return;}
		OPT_0000S6MURA = forInt(Temp2[243]);

		// @2019.01.10: 戦斧兵,双剣兵,大錘兵の武器LV/防具LV
		if(Temp2[244] == ""){return;}
		for (i=18;i<21;i++){
			OPT_BK_LV[i] = forInt(Temp2[244 - 18 + i]);
			if (isNaN(OPT_BK_LV[i])) { OPT_BK_LV[i]  = 0; };
		}
		for (i=18;i<21;i++){
			OPT_BG_LV[i] = forInt(Temp2[244 - 18 + 3 + i]);
			if (isNaN(OPT_BG_LV[i])) { OPT_BG_LV[i]  = 0; };
		}
	}
}
//ユーザプロフィール画面の拠点情報を取得
function getUserProf(htmldoc) {
	var oldVillages = loadVillages(HOST+PGNAME);
	var newVillages = new Array();
	var landElems = document.evaluate(
		'//*[@id="gray02Wrapper"]//table/tbody/tr',
		htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var isLandList = false;
	for (var i=0; i<landElems.snapshotLength; i++) {
		var item = landElems.snapshotItem(i);

		if (!isLandList) {
			// 2012.01.11 新プロフィール画面対応
			var childElement = getChildElement(item, 0);
			if (childElement && trim(childElement.innerHTML) === "名前") {
//			if (trim(getChildElement(item, 0).innerHTML) == "名前") {
				isLandList = true;
			}
			continue;
		}

		//名前項目を取得
		var nameElem = getChildElement(getChildElement(item, 0), 0);
		var name = trim(nameElem.innerHTML);
		var url = nameElem.href;

		//座標項目を取得
		//var xy = "(" + getChildElement(item, 1).innerHTML + ")";
		getChildElement(item, 1).innerHTML.match(/(-?[0-9]+)\,\s*(-?[0-9]+)/i)
		var xy = `(${RegExp.$1},${RegExp.$2})`;

		//人口項目を取得
		var popul = trim(getChildElement(item, 2).innerHTML.replace(/[ \t\r\n,]/g, ""));

		//拠点じゃなければ終了
		if (!isNumeric(popul)) break;

		//データマージ
		var newVil = new Array();
		newVil[IDX_ACTIONS] = new Array();
		for (var j = 0; j < oldVillages.length; j++) {
			if (xy == oldVillages[j][IDX_XY]) {
				newVil = oldVillages[j];
			}
		}
		newVil[IDX_XY] = xy;
		newVil[IDX_BASE_NAME] = name;
		newVil[IDX_URL] = url;
		newVil[IDX_BASE_ID]=getParameter2(url, "village_id");
		newVillages.push(newVil);
	}

	//保存
	saveVillages(HOST+PGNAME, newVillages);
}

//拠点情報を読み出し
function loadVillages(hostname) {
	var ret = new Array();
	var src = GM_getValue(hostname, "");
	if (src == "") return ret;

	var villages = src.split(DELIMIT1);
	for (var i = 0; i < villages.length; i++) {
		var fields = villages[i].split(DELIMIT2);

		ret[i] = new Array();
		ret[i][IDX_XY] = fields[IDX_XY];
		ret[i][IDX_BASE_NAME] = fields[IDX_BASE_NAME];
		ret[i][IDX_URL] = fields[IDX_URL];
		ret[i][IDX_BASE_ID] = fields[IDX_BASE_ID];

		ret[i][IDX_ACTIONS] = new Array();
		if (fields[IDX_ACTIONS] == "") continue;
		var actions = fields[IDX_ACTIONS].split(DELIMIT3);
		for (var j = 0; j < actions.length; j++) {
			ret[i][IDX_ACTIONS][j] = new Array();
			if (actions[j] == "") continue;

			var item = actions[j].split(DELIMIT4);
			if (item[IDX2_TYPE] == undefined) item[IDX2_TYPE] = "C";

			ret[i][IDX_ACTIONS][j][IDX2_STATUS] = item[IDX2_STATUS];
			ret[i][IDX_ACTIONS][j][IDX2_TIME] = item[IDX2_TIME];
			ret[i][IDX_ACTIONS][j][IDX2_TYPE] = item[IDX2_TYPE];
			ret[i][IDX_ACTIONS][j][IDX2_ALERTED] = item[IDX2_ALERTED];
			ret[i][IDX_ACTIONS][j][IDX2_DELETE] = item[IDX2_DELETE];
			ret[i][IDX_ACTIONS][j][IDX2_ROTATION] = item[IDX2_ROTATION];
		}
	}
	return ret;
}
//拠点情報を保存
function saveVillages(hostname, newData) {

	//配列をデリミタ区切り文字列に変換
	var newDataStr = new Array();
	for (var i = 0; i < newData.length; i++) {
		var villageData = newData[i];
		var actions = villageData[IDX_ACTIONS];

		//配列をデリミタ区切り文字列に変換
		for (var j = 0; j < actions.length; j++) {
			actions[j] = genDelimitString(actions[j], DELIMIT4);
		}
		villageData[IDX_ACTIONS] = genDelimitString(actions, DELIMIT3);
		newDataStr[i] = genDelimitString(villageData, DELIMIT2);
	}
	if(newDataStr.length==0){
		return ;
	}
	//Greasemondey領域へ永続保存
	GM_setValue(hostname, genDelimitString(newDataStr, DELIMIT1));
}

//デリミタ区切り文字列生成
function genDelimitString(dataArray, delimiter) {
	var ret = "";
	for (var i=0; i < dataArray.length; i++) {
		if (dataArray[i] != undefined) ret += dataArray[i];
		if (i < dataArray.length-1) ret += delimiter;
	}
	return ret;
}

//URLパラメータ取得
function getParameter(key) {
	var str = location.search.split("?");
	if (str.length < 2) {
		return "";
	}

	var params = str[1].split("&");
	for (var i = 0; i < params.length; i++) {
		var keyVal = params[i].split("=");
		if (keyVal[0] == key && keyVal.length == 2) {
			return decodeURIComponent(keyVal[1]);
		}
	}
	return "";
}

//先頭ゼロ付加
function padZero(num) {
	var result;
	if (num < 10) {
		result = "0" + num;
	} else {
		result = "" + num;
	}
	return result;
}
//先頭ゼロ除去
function trimZero(str) {
	var res = str.replace(/^0*/, "");
	if (res == "") res = "0";
	return res;
}

//空白除去
function trim(str) {
	if (str == undefined) return "";
	return str.replace(/^[ 　\t\r\n]+|[ 　\t\r\n]+$/g, "");
}

//数値チェック
function isNumeric(num) {
	if (num.match(/^-?[0-9]+$/)) {
		return true;
	}
	return false;
}

//子Element取得
function getChildElement(parentNode, position) {
	var current = 0;
	for (var i = 0; i < parentNode.childNodes.length; i++){
		var childNode = parentNode.childNodes[i];
		if (childNode.nodeType == 1) {
			if (current == position) {
				return childNode;
			}
			current++;
		}
	}

	return undefined;
}

//時刻計算（現在時刻に加算、引数hh:mm:ss）
function computeTime(clock) {
	var hour = parseInt(trimZero(
		clock.replace(/^([0-9]{2}):([0-9]{2}):([0-9]{2})$/, "$1")),10);
	if (isNaN(hour)) hour = 0;
	var min = parseInt(trimZero(
		clock.replace(/^([0-9]{2}):([0-9]{2}):([0-9]{2})$/, "$2")),10);
	if (isNaN(min)) min = 0;
	var sec = parseInt(trimZero(
		clock.replace(/^([0-9]{2}):([0-9]{2}):([0-9]{2})$/, "$3")),10);
	if (isNaN(sec)) sec = 0;

	var now = new Date();
	var resTime = new Date();
	resTime.setHours(now.getHours() + hour);
	resTime.setMinutes(now.getMinutes() + min);
	resTime.setSeconds(now.getSeconds() + sec);

	return resTime;
}

//日時文字列編集（yyyy/mm/dd hh:mm:ss）
function generateDateString(date) {
	var res = "" + date.getFullYear() + "/" + padZero(date.getMonth() + 1) +
		"/" + padZero(date.getDate()) + " " + padZero(date.getHours()) + ":" +
		padZero(date.getMinutes()) + ":" + padZero(date.getSeconds());
	return res;
}

//日時文字列編集2（mm/dd hh:mm:ss）
function generateDateString2(date) {
	var res = "" + padZero(date.getMonth() + 1) + "/" + padZero(date.getDate()) +
		" " + padZero(date.getHours()) + ":" + padZero(date.getMinutes()) +
		":" + padZero(date.getSeconds());;
	return res;
}

//残時間文字列編集
function generateWaitTimeString(time1, time2) {
	var result = "";

	var waitTimeSec = Math.ceil((time1.getTime() - time2.getTime()) / 1000);
	if ( waitTimeSec < 0 ) { waitTimeSec = 0; }
	result += Math.floor(waitTimeSec / (60*60));
	result += ":";
	result += padZero(Math.floor((waitTimeSec % (60*60)) / 60));
	result += ":";
	result += padZero(waitTimeSec % 60);

	return result;
}

function ccreateTextBox(container, id, def, text, title, size, left )
{
	left += 2;
	var dv = d.createElement("div");
	dv.style.paddingTop = "2px";
	dv.style.paddingLeft= left + "px";
//	dv.style.paddingTop    = "7px";
	dv.style.paddingBottom = "2px";
	dv.title = title;
	var tb = d.createElement("input");
	tb.type = "text";
	tb.id = id;
	tb.value = def;
	tb.size = size;
	tb.style.textAlign = "right";
	tb.style.verticalAlign = "middle";
	tb.style.paddingRight = "3px";

	var tx = d.createTextNode(text);
	tx.title = title;

	dv.appendChild(tx);
	dv.appendChild(tb);
	container.appendChild(dv);
	return tb;
}
// ＠＠　ここから　＠＠
function ccreateText(container, id, text, left )
{
	left += 2;
	var dv = d.createElement("div");
	dv.style.padding = "2px";
	dv.style.paddingLeft= left + "px";
	dv.style.paddingBottom = "4px";

	var lb = d.createElement("label");
	lb.htmlFor = id;
	lb.style.verticalAlign = "middle";
	var tx = d.createTextNode(text);
	tx.fontsize = "9px";
	lb.appendChild( tx );

	dv.appendChild(lb);
	container.appendChild(dv);
}
// ＠＠　ここまで　＠＠
function ccreateCaptionText(container, id, text, left )
{
	left += 2;
	var dv = d.createElement("div");
	dv.style.paddingLeft= left + "px";

	var lb = d.createElement("label");
	lb.htmlFor = id;
	lb.style.verticalAlign = "middle";
	var tx = d.createTextNode(text);
	tx.fontsize = "9px";
	lb.appendChild( tx );

	dv.appendChild(lb);
	container.appendChild(dv);
}
function ccreateCheckBoxF(container, id, def, text, title, left, func)
{
	var cb = ccreateCheckBox(container, id, def, text, title, left);
	cb.addEventListener("click", function(){
		if (func){
			func(cb);
		}
	}, true);
}

function ccreateCheckBox(container, id, def, text, title, left )
{
	left += 2;
	var dv = d.createElement("div");
	dv.style.padding = "1px";
	dv.style.paddingLeft= left + "px";
	dv.title = title;
	var cb = d.createElement("input");
	cb.type = "checkbox";
	cb.style.verticalAlign = "middle";
	cb.id = id;
	cb.value = 1;
	if( def ) cb.checked = true;

	var lb = d.createElement("label");
	lb.htmlFor = id;
	lb.style.verticalAlign = "middle";

	var tx = d.createTextNode(text);
	lb.appendChild( tx );

	dv.appendChild(cb);
	dv.appendChild(lb);
	container.appendChild(dv);
	return cb;
}


function ccreateButton(container, text, title, func, width, top)
{
	var btn = d.createElement("input");
	btn.style.padding = "0px";
	btn.type = "button";
	btn.value = text;
	if (top != undefined) {
		btn.style.marginTop = top + "px";
	}
	if (width == undefined) {
		btn.style.width = "54px";
	} else {
		btn.style.width = width + "px";
	}
	btn.style.height = "20px";
	btn.style.verticalAlign = "middle";
	btn.title = title;
	container.appendChild(d.createTextNode(" "));
	container.appendChild(btn);
	container.appendChild(d.createTextNode(" "));
	$e(btn, "click", func);
	return btn;
}

function cgetCheckBoxValue(id)
{
	var c = id;
	if( !c ) return 0;
	if( !c.checked ) return 0;
	return 1;
}

function cgetTextBoxValue(id)
{
	var c = id;
	if( !c ) return "";
	return c.value;
}
function ccreateComboBox(container, id, sels, def, text, title, left )
{
	left += 2;
	var dv = d.createElement("div");
	dv.style.padding = "1px";
	dv.style.paddingLeft= left + "px";
	dv.title = title;
	var sel = d.createElement("select");
	sel.id = id;
	for(var i=0; i<sels.length; i++){
		var opt = d.createElement("option");
		opt.value = sels[i];
		opt.appendChild(d.createTextNode(sels[i]));
		sel.appendChild(opt);
	}
	if( def ) sel.value = def;

	var tx = d.createTextNode(text);
	tx.title = title;

	dv.appendChild(tx);
	dv.appendChild(sel);
	container.appendChild(dv);
	return sel;
}
function cgetComboBoxValue(id){
	var c = id;
	if( !c ) return "";
	return c.value;
}
// 施設建設資源配列の取得(木、石、鉄、糧、所要秒数[運営バグ対策のため正確さは不要])
function getBuildResources(constructorName, level){
  var resources = {
	'伐採所':[
	  {wood: 10, stone: 35, iron: 40, food: 15, time: 135},
	  {wood: 25, stone: 88, iron: 100, food: 38, time: 250},
	  {wood: 58, stone: 202, iron: 230, food: 86, time: 550},
	  {wood: 173, stone: 604, iron: 690, food: 259, time: 1100},
	  {wood: 431, stone: 1510, iron: 1725, food: 647, time: 2200},
	  {wood: 1466, stone: 2847, iron: 3019, food: 1294, time: 4180},
	  {wood: 2493, stone: 4839, iron: 5132, food: 2200, time: 7942},
	  {wood: 3490, stone: 6775, iron: 7186, food: 3080, time: 14296},
	  {wood: 4537, stone: 8807, iron: 9341, food: 4003, time: 24303},
	  {wood: 5898, stone: 11450, iron: 12144, food: 5204, time: 38884},
	  {wood: 8119, stone: 14434, iron: 15787, food: 6766, time: 58326},
	  {wood: 11366, stone: 20207, iron: 22101, food: 9472, time: 81656},
	  {wood: 17050, stone: 30311, iron: 33152, food: 14208, time: 106153},
	  {wood: 25575, stone: 45467, iron: 49729, food: 21312, time: 127384},
	  {wood: 38362, stone: 68199, iron: 74593, food: 31968, time: 140122}
	],
	'石切り場':[
	  {wood: 40, stone: 10, iron: 35, food: 15, time: 135},
	  {wood: 100, stone: 25, iron: 88, food: 38, time: 250},
	  {wood: 230, stone: 58, iron: 202, food: 86, time: 550},
	  {wood: 690, stone: 173, iron: 604, food: 259, time: 1100},
	  {wood: 1725, stone: 431, iron: 1510, food: 647, time: 2200},
	  {wood: 3019, stone: 1466, iron: 2847, food: 1294, time: 4180},
	  {wood: 5132, stone: 2493, iron: 4839, food: 2200, time: 7942},
	  {wood: 7186, stone: 3490, iron: 6775, food: 3080, time: 14296},
	  {wood: 9341, stone: 4537, iron: 8807, food: 4003, time: 24303},
	  {wood: 12144, stone: 5898, iron: 11450, food: 5204, time: 38884},
	  {wood: 15787, stone: 8119, iron: 14434, food: 6766, time: 58326},
	  {wood: 22101, stone: 11366, iron: 20207, food: 9472, time: 81656},
	  {wood: 33152, stone: 17050, iron: 30311, food: 14208, time: 106153},
	  {wood: 49729, stone: 25575, iron: 45467, food: 21312, time: 127384},
	  {wood: 74593, stone: 38362, iron: 68199, food: 31968, time: 140122}
	],
	'製鉄所':[
	  {wood: 35, stone: 40, iron: 10, food: 15, time: 135},
	  {wood: 88, stone: 100, iron: 25, food: 38, time: 250},
	  {wood: 202, stone: 230, iron: 58, food: 86, time: 550},
	  {wood: 604, stone: 690, iron: 173, food: 259, time: 1100},
	  {wood: 1510, stone: 1725, iron: 431, food: 647, time: 2200},
	  {wood: 2847, stone: 3019, iron: 1466, food: 1294, time: 4180},
	  {wood: 4839, stone: 5132, iron: 2493, food: 2200, time: 7942},
	  {wood: 6775, stone: 7186, iron: 3490, food: 3080, time: 14296},
	  {wood: 8807, stone: 9341, iron: 4537, food: 4003, time: 24303},
	  {wood: 11450, stone: 12144, iron: 5898, food: 5204, time: 38884},
	  {wood: 14434, stone: 15787, iron: 8119, food: 6766, time: 58326},
	  {wood: 20207, stone: 22101, iron: 11366, food: 9472, time: 81656},
	  {wood: 30311, stone: 33152, iron: 17050, food: 14208, time: 106153},
	  {wood: 45467, stone: 49729, iron: 25575, food: 21312, time: 127384},
	  {wood: 68199, stone: 74593, iron: 38362, food: 31968, time: 140122}
	],
	'畑':[
	  {wood: 35, stone: 35, iron: 30, food: 0, time: 120},
	  {wood: 88, stone: 88, iron: 75, food: 0, time: 216},
	  {wood: 202, stone: 202, iron: 173, food: 0, time: 389},
	  {wood: 604, stone: 604, iron: 518, food: 0, time: 661},
	  {wood: 1510, stone: 1510, iron: 1294, food: 0, time: 1124},
	  {wood: 3019, stone: 3019, iron: 2588, food: 0, time: 1910},
	  {wood: 5132, stone: 5132, iron: 4399, food: 0, time: 3247},
	  {wood: 7186, stone: 7186, iron: 6159, food: 0, time: 5520},
	  {wood: 9341, stone: 9341, iron: 8007, food: 0, time: 8833},
	  {wood: 12144, stone: 12144, iron: 10409, food: 0, time: 13249},
	  {wood: 15787, stone: 15787, iron: 13532, food: 0, time: 19873},
	  {wood: 22101, stone: 22101, iron: 18944, food: 0, time: 27823},
	  {wood: 33152, stone: 33152, iron: 28416, food: 0, time: 36170},
	  {wood: 49729, stone: 49729, iron: 42625, food: 0, time: 45212},
	  {wood: 74593, stone: 74593, iron: 63937, food: 0, time: 54225}
	],
	'練兵所':[
	  {wood: 112, stone: 107, iron: 107, food: 122, time: 192},
	  {wood: 224, stone: 214, iron: 214, food: 244, time: 384},
	  {wood: 448, stone: 428, iron: 428, food: 488, time: 768},
	  {wood: 759, stone: 725, iron: 725, food: 826, time: 1536},
	  {wood: 1214, stone: 1160, iron: 1160, food: 1322, time: 3072},
	  {wood: 2209, stone: 2110, iron: 2110, food: 2406, time: 4608},
	  {wood: 3331, stone: 3182, iron: 3182, food: 3627, time: 6922},
	  {wood: 4958, stone: 4736, iron: 4736, food: 5400, time: 10368},
	  {wood: 8091, stone: 7729, iron: 7729, food: 8813, time: 14515},
	  {wood: 11130, stone: 10632, iron: 10632, food: 12122, time: 20312}
	],
	'兵舎':[
	  {wood: 72, stone: 360, iron: 72, food: 216, time: 216},
	  {wood: 144, stone: 720, iron: 144, food: 432, time: 432},
	  {wood: 228, stone: 1440, iron: 228, food: 864, time: 864},
	  {wood: 648, stone: 1728, iron: 648, food: 1296, time: 1728},
	  {wood: 972, stone: 2592, iron: 972, food: 1944, time: 3456},
	  {wood: 1409, stone: 3758, iron: 1409, food: 2819, time: 5184},
	  {wood: 2725, stone: 4088, iron: 2725, food: 4088, time: 7776},
	  {wood: 6744, stone: 9810, iron: 5518, food: 2453, time: 10886},
	  {wood: 12140, stone: 17658, iron: 9933, food: 4415, time: 15241},
	  {wood: 21852, stone: 31784, iron: 17879, food: 7946, time: 19814},
	  {wood: 39333, stone: 57212, iron: 32182, food: 14303, time: 25757},
	  {wood: 70800, stone: 96545, iron: 64364, food: 25745, time: 33485},
	  {wood: 127440, stone: 173781, iron: 115854, food: 43642, time: 43529},
	  {wood: 254879, stone: 324392, iron: 254879, food: 92683, time: 56588},
	  {wood: 509759, stone: 648784, iron: 509759, food: 185367, time: 73615}
	],
	'弓兵舎':[
	  {wood: 360, stone: 72, iron: 72, food: 216, time: 216},
	  {wood: 720, stone: 144, iron: 144, food: 432, time: 432},
	  {wood: 1440, stone: 228, iron: 228, food: 864, time: 864},
	  {wood: 1728, stone: 648, iron: 648, food: 1296, time: 1728},
	  {wood: 2592, stone: 972, iron: 972, food: 1944, time: 3456},
	  {wood: 3758, stone: 1409, iron: 1409, food: 2819, time: 5184},
	  {wood: 5450, stone: 2044, iron: 2044, food: 4087, time: 7776},
	  {wood: 9810, stone: 6131, iron: 6131, food: 2453, time: 10886},
	  {wood: 17658, stone: 12140, iron: 9933, food: 4415, time: 15241},
	  {wood: 31784, stone: 21852, iron: 17879, food: 7946, time: 19814},
	  {wood: 57212, stone: 39333, iron: 32182, food: 14303, time: 25757},
	  {wood: 96545, stone: 70800, iron: 64364, food: 25745, time: 33485},
	  {wood: 173781, stone: 127440, iron: 115854, food: 46342, time: 43529},
	  {wood: 324392, stone: 254879, iron: 254879, food: 92683, time: 56588},
	  {wood: 648784, stone: 509759, iron: 509759, food: 185367, time: 73615}
	],
	'厩舎':[
	  {wood: 72, stone: 72, iron: 360, food: 216, time: 216},
	  {wood: 144, stone: 144, iron: 720, food: 432, time: 432},
	  {wood: 228, stone: 228, iron: 1440, food: 864, time: 864},
	  {wood: 648, stone: 648, iron: 1728, food: 1296, time: 1728},
	  {wood: 972, stone: 972, iron: 2592, food: 1944, time: 3456},
	  {wood: 1409, stone: 1409, iron: 3758, food: 2891, time: 5184},
	  {wood: 2044, stone: 2044, iron: 5450, food: 4087, time: 7776},
	  {wood: 5518, stone: 6744, iron: 9810, food: 2453, time: 10886},
	  {wood: 9933, stone: 12140, iron: 17658, food: 4415, time: 15241},
	  {wood: 17879, stone: 21852, iron: 31784, food: 7946, time: 19814},
	  {wood: 32182, stone: 39333, iron: 57212, food: 14303, time: 25757},
	  {wood: 64364, stone: 70800, iron: 96545, food: 25745, time: 33485},
	  {wood: 115854, stone: 127440, iron: 173781, food: 46342, time: 43529},
	  {wood: 254879, stone: 254879, iron: 324392, food: 92683, time: 56588},
	  {wood: 509759, stone: 509759, iron: 648784, food: 185367, time: 73615}
	],
	'兵器工房':[
	  {wood: 216, stone: 216, iron: 216, food: 72, time: 216},
	  {wood: 432, stone: 432, iron: 432, food: 144, time: 432},
	  {wood: 864, stone: 864, iron: 864, food: 288, time: 864},
	  {wood: 1224, stone: 1224, iron: 1224, food: 648, time: 1728},
	  {wood: 1836, stone: 1836, iron: 1836, food: 972, time: 3456},
	  {wood: 2662, stone: 2662, iron: 2662, food: 1409, time: 5184},
	  {wood: 3860, stone: 3860, iron: 3860, food: 2044, time: 7776},
	  {wood: 7357, stone: 7357, iron: 7357, food: 2452, time: 10886},
	  {wood: 13242, stone: 13242, iron: 13242, food: 4414, time: 15241},
	  {wood: 23836, stone: 23836, iron: 23836, food: 7945, time: 19814},
	  {wood: 42905, stone: 42905, iron: 42905, food: 14302, time: 25757},
	  {wood: 77229, stone: 77229, iron: 77229, food: 25743, time: 33485},
	  {wood: 139013, stone: 139013, iron: 139013, food: 46338, time: 43529},
	  {wood: 278026, stone: 278026, iron: 278026, food: 92675, time: 56588},
	  {wood: 556051, stone: 556051, iron: 556051, food: 185350, time: 73615}
	],
	'宿舎':[
	  {wood: 35, stone: 20, iron: 35, food: 80, time: 72},
	  {wood: 53, stone: 30, iron: 53, food: 120, time: 144},
	  {wood: 89, stone: 51, iron: 89, food: 204, time: 274},
	  {wood: 147, stone: 84, iron: 147, food: 337, time: 492},
	  {wood: 228, stone: 130, iron: 228, food: 522, time: 837},
	  {wood: 336, stone: 192, iron: 336, food: 767, time: 1339},
	  {wood: 476, stone: 272, iron: 476, food: 1089, time: 2010},
	  {wood: 653, stone: 373, iron: 653, food: 1492, time: 2813},
	  {wood: 868, stone: 496, iron: 868, food: 1984, time: 3657},
	  {wood: 1129, stone: 645, iron: 1129, food: 2580, time: 4388},
	  {wood: 2032, stone: 1161, iron: 2032, food: 4644, time: 5266},
	  {wood: 3658, stone: 2090, iron: 3658, food: 8210, time: 6319},
	  {wood: 6951, stone: 3971, iron: 6950, food: 15882, time: 7583},
	  {wood: 13205, stone: 7544, iron: 13205, food: 30177, time: 9100},
	  {wood: 25090, stone: 14334, iron: 25090, food: 57336, time: 10920}
	],
	'大宿舎':[
	  {wood: 200, stone: 114, iron: 200, food: 438, time: 216},
	  {wood: 320, stone: 183, iron: 320, food: 701, time: 432},
	  {wood: 512, stone: 293, iron: 512, food: 1121, time: 821},
	  {wood: 768, stone: 439, iron: 768, food: 1682, time: 1477},
	  {wood: 1152, stone: 658, iron: 1152, food: 2523, time: 2511},
	  {wood: 1728, stone: 987, iron: 1728, food: 3784, time: 4018},
	  {wood: 2419, stone: 1382, iron: 2419, food: 5298, time: 6029},
	  {wood: 3387, stone: 1935, iron: 3387, food: 7418, time: 8440},
	  {wood: 4741, stone: 2709, iron: 4741, food: 10385, time: 10970},
	  {wood: 6637, stone: 3793, iron: 6637, food: 14538, time: 13165},
	  {wood: 8628, stone: 4930, iron: 8628, food: 18900, time: 15798},
	  {wood: 11217, stone: 6409, iron: 11217, food: 24570, time: 18957},
	  {wood: 14582, stone: 8332, iron: 14582, food: 31941, time: 22750},
	  {wood: 18956, stone: 11735, iron: 18956, food: 40620, time: 27300},
	  {wood: 25817, stone: 16429, iron: 25817, food: 49286, time: 35999},
	  {wood: 32271, stone: 22003, iron: 32271, food: 60141, time: 39311},
	  {wood: 42172, stone: 29337, iron: 42172, food: 69675, time: 47174},
	  {wood: 52715, stone: 38963, iron: 52715, food: 84803, time: 56607},
	  {wood: 66009, stone: 49506, iron: 66009, food: 93512, time: 67929},
	  {wood: 79211, stone: 62708, iron: 79211, food: 108914, time: 81515}
	],
	'訓練所':[
	  {wood: 1500, stone: 1600, iron: 2500, food: 3300, time: 900},
	  {wood: 2100, stone: 2240, iron: 3500, food: 3300, time: 1440},
	  {wood: 2940, stone: 3136, iron: 4900, food: 6468, time: 2304},
	  {wood: 6629, stone: 7326, iron: 13955, food: 6978, time: 3686},
	  {wood: 13257, stone: 14653, iron: 27910, food: 13955, time: 5898},
	  {wood: 32097, stone: 37679, iron: 55821, food: 13955, time: 9437},
	  {wood: 64194, stone: 75358, iron: 111642, food: 27910, time: 15099},
	  {wood: 128388, stone: 150716, iron: 223283, food: 55821, time: 24159},
	  {wood: 256776, stone: 301432, iron: 446566, food: 111642, time: 38655},
	  {wood: 513551, stone: 602865, iron: 893133, food: 223283, time: 61848}
	],
	'遠征訓練所':[
	  {wood: 2884, stone: 4486, iron: 5977, food: 2723, time: 1500},
	  {wood: 4614, stone: 7177, iron: 9484, food: 4357, time: 2250},
	  {wood: 7382, stone: 11483, iron: 15174, food: 6972, time: 3375},
	  {wood: 11811, stone: 18373, iron: 24279, food: 11155, time: 4725},
	  {wood: 18898, stone: 29397, iron: 38846, food: 17848, time: 6615},
	  {wood: 28347, stone: 44096, iron: 58269, food: 26772, time: 9261},
	  {wood: 42521, stone: 66143, iron: 87404, food: 40158, time: 12039},
	  {wood: 63781, stone: 99215, iron: 131105, food: 60238, time: 15651},
	  {wood: 89294, stone: 138901, iron: 183548, food: 84333, time: 20346},
	  {wood: 125011, stone: 194461, iron: 256967, food: 118066, time: 26450},
	  {wood: 175015, stone: 272246, iron: 359754, food: 165292, time: 31740},
	  {wood: 227520, stone: 353920, iron: 467680, food: 214880, time: 38088},
	  {wood: 295776, stone: 460096, iron: 607984, food: 279344, time: 45706},
	  {wood: 384509, stone: 598125, iron: 790379, food: 363147, time: 54847},
	  {wood: 512678, stone: 692116, iron: 897187, food: 461410, time: 60332},
	  {wood: 645974, stone: 830539, iron: 1045863, food: 553692, time: 66365},
	  {wood: 812082, stone: 959734, iron: 1218123, food: 701344, time: 73002},
	  {wood: 1018794, stone: 1151680, iron: 1417453, food: 841613, time: 80302},
	  {wood: 1275708, stone: 1382016, iron: 1647789, food: 1009935, time: 88332},
	  {wood: 1594635, stone: 1658420, iron: 1913561, food: 1211922, time: 97166}
	],
	'鍛冶場':[
	  {wood: 150, stone: 200, iron: 340, food: 170, time: 255},
	  {wood: 400, stone: 300, iron: 680, food: 340, time: 765},
	  {wood: 780, stone: 585, iron: 1326, food: 663, time: 2295},
	  {wood: 1482, stone: 1112, iron: 2519, food: 1260, time: 4590},
	  {wood: 2742, stone: 2056, iron: 4661, food: 2330, time: 9180},
	  {wood: 4935, stone: 3701, iron: 8390, food: 4195, time: 13770},
	  {wood: 8636, stone: 6477, iron: 14682, food: 7341, time: 20655},
	  {wood: 17640, stone: 14112, iron: 28223, food: 10584, time: 24786},
	  {wood: 31566, stone: 25253, iron: 50506, food: 18940, time: 29743},
	  {wood: 50506, stone: 40404, iron: 80809, food: 30303, time: 35692}
	],
	'防具工場':[
	  {wood: 150, stone: 200, iron: 340, food: 170, time: 255},
	  {wood: 300, stone: 400, iron: 680, food: 340, time: 765},
	  {wood: 585, stone: 780, iron: 1326, food: 663, time: 2295},
	  {wood: 1112, stone: 1482, iron: 2519, food: 1260, time: 4590},
	  {wood: 2056, stone: 2742, iron: 4661, food: 2330, time: 9180},
	  {wood: 3701, stone: 4935, iron: 8390, food: 4195, time: 13770},
	  {wood: 6477, stone: 8636, iron: 14682, food: 7341, time: 20655},
	  {wood: 14112, stone: 17640, iron: 28223, food: 10584, time: 24786},
	  {wood: 25253, stone: 31566, iron: 50506, food: 18940, time: 29743},
	  {wood: 40404, stone: 50506, iron: 80809, food: 30303, time: 35692}
	],
	'見張り台':[
	  {wood: 600, stone: 840, iron: 600, food: 360, time: 900},
	  {wood: 960, stone: 1344, iron: 960, food: 576, time: 1350},
	  {wood: 1536, stone: 2150, iron: 1536, food: 922, time: 2025},
	  {wood: 2458, stone: 3441, iron: 2458, food: 1475, time: 2835},
	  {wood: 3932, stone: 5505, iron: 3932, food: 2359, time: 3969},
	  {wood: 6291, stone: 8808, iron: 6291, food: 3775, time: 5557},
	  {wood: 9437, stone: 13212, iron: 9437, food: 5662, time: 7224},
	  {wood: 14156, stone: 19818, iron: 14156, food: 8493, time: 9391},
	  {wood: 21233, stone: 29727, iron: 21233, food: 12740, time: 12208},
	  {wood: 31850, stone: 44590, iron: 31850, food: 19110, time: 15870},
	  {wood: 44590, stone: 62426, iron: 44590, food: 26754, time: 19044},
	  {wood: 62426, stone: 87396, iron: 62426, food: 37456, time: 22853},
	  {wood: 87397, stone: 122355, iron: 87397, food: 52438, time: 27424},
	  {wood: 122355, stone: 171297, iron: 122355, food: 73413, time: 32908},
	  {wood: 159062, stone: 222686, iron: 159062, food: 95437, time: 36199},
	  {wood: 206780, stone: 289492, iron: 206780, food: 124068, time: 39819},
	  {wood: 268814, stone: 376340, iron: 268814, food: 161288, time: 43801},
	  {wood: 349458, stone: 489242, iron: 349458, food: 209675, time: 48181},
	  {wood: 419350, stone: 587090, iron: 419350, food: 251610, time: 52999},
	  {wood: 503220, stone: 704508, iron: 503220, food: 301932, time: 58299}
	],
	'倉庫':[
	  {wood: 83, stone: 141, iron: 83, food: 63, time: 20},
	  {wood: 167, stone: 281, iron: 167, food: 126, time: 412},
	  {wood: 300, stone: 506, iron: 300, food: 226, time: 618},
	  {wood: 479, stone: 810, iron: 479, food: 362, time: 1138},
	  {wood: 671, stone: 1134, iron: 671, food: 507, time: 1706},
	  {wood: 1044, stone: 1253, iron: 1044, food: 835, time: 2559},
	  {wood: 1462, stone: 1754, iron: 1462, food: 1169, time: 3839},
	  {wood: 1973, stone: 2368, iron: 1973, food: 1578, time: 5162},
	  {wood: 2664, stone: 3196, iron: 2664, food: 2131, time: 6476},
	  {wood: 3596, stone: 4315, iron: 3596, food: 2877, time: 8084},
	  {wood: 4854, stone: 5825, iron: 4854, food: 3883, time: 9700},
	  {wood: 6311, stone: 7573, iron: 6311, food: 5048, time: 11640},
	  {wood: 8204, stone: 9845, iron: 8204, food: 6563, time: 13968},
	  {wood: 10255, stone: 12306, iron: 10255, food: 8204, time: 16761},
	  {wood: 12819, stone: 15382, iron: 12819, food: 10255, time: 20114},
	  {wood: 15382, stone: 18459, iron: 15382, food: 12306, time: 23208},
	  {wood: 18459, stone: 22151, iron: 18459, food: 14767, time: 27850},
	  {wood: 21228, stone: 25473, iron: 21228, food: 16982, time: 33420},
	  {wood: 24412, stone: 29294, iron: 24412, food: 19529, time: 39034},
	  {wood: 28074, stone: 33688, iron: 28074, food: 22459, time: 46841}
	],
	'研究所':[
	  {wood: 275, stone: 110, iron: 110, food: 55, time: 216},
	  {wood: 413, stone: 165, iron: 165, food: 83, time: 432},
	  {wood: 619, stone: 248, iron: 248, food: 124, time: 864},
	  {wood: 1486, stone: 836, iron: 836, food: 557, time: 1728},
	  {wood: 2228, stone: 1253, iron: 1253, food: 836, time: 3456},
	  {wood: 7521, stone: 6267, iron: 6267, food: 5015, time: 5184},
	  {wood: 13538, stone: 11282, iron: 11282, food: 9025, time: 7776},
	  {wood: 21436, stone: 17862, iron: 17862, food: 14290, time: 10886},
	  {wood: 44675, stone: 37228, iron: 37228, food: 29784, time: 15240},
	  {wood: 87725, stone: 73104, iron: 73104, food: 58483, time: 19813}
	],
	'市場':[
	  {wood: 100, stone: 100, iron: 50, food: 50, time: 171},
	  {wood: 334, stone: 334, iron: 191, food: 191, time: 432},
	  {wood: 1035, stone: 1035, iron: 592, food: 592, time: 864},
	  {wood: 2795, stone: 2795, iron: 1600, food: 1600, time: 1728},
	  {wood: 6328, stone: 6328, iron: 4218, food: 4218, time: 3456},
	  {wood: 13288, stone: 13288, iron: 8859, food: 8859, time: 5184},
	  {wood: 25248, stone: 25248, iron: 16832, food: 16832, time: 7776},
	  {wood: 42921, stone: 42921, iron: 28614, food: 28614, time: 11664},
	  {wood: 64381, stone: 64381, iron: 42921, food: 42921, time: 16330},
	  {wood: 90134, stone: 90134, iron: 60089, food: 60089, time: 21229}
	],
	'水車':[
	  {wood: 2940, stone: 980, iron: 980, food: 4900, time: 2700},
	  {wood: 4704, stone: 1568, iron: 1568, food: 7840, time: 4050},
	  {wood: 7526, stone: 2509, iron: 2509, food: 12544, time: 6075},
	  {wood: 10537, stone: 5268, iron: 5268, food: 14049, time: 9112},
	  {wood: 14751, stone: 7376, iron: 7376, food: 19668, time: 13669},
	  {wood: 20652, stone: 13768, iron: 13768, food: 20652, time: 20503},
	  {wood: 28913, stone: 19275, iron: 19275, food: 28913, time: 30755},
	  {wood: 37587, stone: 25058, iron: 25058, food: 37587, time: 46132},
	  {wood: 48863, stone: 32576, iron: 32576, food: 48863, time: 69198},
	  {wood: 63523, stone: 42348, iron: 42348, food: 63523, time: 103797}
	],
	'工場':[
	  {wood: 780, stone: 1560, iron: 1560, food: 3900, time: 2430},
	  {wood: 1248, stone: 2496, iron: 2496, food: 6240, time: 3645},
	  {wood: 1997, stone: 3994, iron: 3994, food: 9984, time: 5468},
	  {wood: 4193, stone: 6290, iron: 6290, food: 11182, time: 8201},
	  {wood: 5871, stone: 8806, iron: 8806, food: 15655, time: 12302},
	  {wood: 10958, stone: 13698, iron: 13698, food: 16437, time: 18453},
	  {wood: 15342, stone: 19177, iron: 19177, food: 23013, time: 27680},
	  {wood: 19944, stone: 24930, iron: 24930, food: 29916, time: 41519},
	  {wood: 25928, stone: 32410, iron: 32410, food: 38891, time: 62278},
	  {wood: 33706, stone: 42132, iron: 42132, food: 50559, time: 93417}
	],
	'銅雀台':[
	  {wood: 700, stone: 3500, iron: 2100, food: 700, time: 3240},
	  {wood: 1120, stone: 5600, iron: 3360, food: 1120, time: 4860},
	  {wood: 1792, stone: 8960, iron: 5376, food: 1792, time: 7290},
	  {wood: 3763, stone: 10035, iron: 7526, food: 3763, time: 10935},
	  {wood: 5263, stone: 14049, iron: 10537, food: 5268, time: 16403},
	  {wood: 9834, stone: 14752, iron: 14752, food: 9834, time: 24603},
	  {wood: 13768, stone: 20652, iron: 20652, food: 13768, time: 36905},
	  {wood: 17899, stone: 26848, iron: 26848, food: 17899, time: 55358},
	  {wood: 23268, stone: 34902, iron: 34902, food: 23268, time: 83038},
	  {wood: 30249, stone: 45373, iron: 45373, food: 30249, time: 124556}
	],
	'城':[
	  {wood: 0, stone: 0, iron: 0, food: 0, time: 0},
	  {wood: 1404, stone: 546, iron: 390, food: 780, time: 999},		// LV1->2
	  {wood: 2570, stone: 1000, iron: 714, food: 1428, time: 2498},		// LV2->3
	  {wood: 4161, stone: 2081, iron: 2081, food: 2081, time: 4995}, 	// LV3->4
	  {wood: 7102, stone: 3552, iron: 3552, food: 3552, time: 8991}, 	// LV4->5
	  {wood: 9056, stone: 9056, iron: 6037, food: 6037, time: 12587}, 	// LV5->6
	  {wood: 14384, stone: 14384, iron: 9589, food: 9589, time: 16364},   // LV6->7
	  {wood: 22773, stone: 22773, iron: 15183, food: 15183, time: 29782}, // *LV7->8
	  {wood: 33562, stone: 33562, iron: 22374, food: 22374, time: 29782}, // LV8->9
	  {wood: 44402, stone: 57559, iron: 32890, food: 29602, time: 38716}, // LV9->10
	  {wood: 65122, stone: 84418, iron: 48239, food: 43415, time: 43361}, // LV10->11
	  {wood: 95317, stone: 123558, iron: 70605, food: 63544, time: 0}, 	  // LV11->12
	  {wood: 113458, stone: 154716, iron: 154716, food: 92830, time: 0},  // LV12->13
	  {wood: 150418, stone: 150418, iron: 315878, food: 135375, time: 0}, // LV13->14
	  {wood: 219008, stone: 219008, iron: 492770, food: 164258, time: 0}, // LV14->15
	  {wood: 294820, stone: 294820, iron: 663345, food: 221115, time: 0}, // LV15->16
	  {wood: 488220, stone: 488220, iron: 827854, food: 318406, time: 0}, // LV16->17
	  {wood: 839130, stone: 839130, iron: 915414, food: 457707, time: 0}, // LV17->18
	  {wood: 1307581, stone: 1307581, iron: 1354280, food: 700491, time: 0}, // LV18->19
	  {wood: 1901938, stone: 1901938, iron: 1969864, food: 1018896, time: 0} // LV19->20
	],
	'砦':[
	  {wood: 104, stone: 400, iron: 136, food: 160, time: 0},
	  {wood: 243, stone: 936, iron: 319, food: 374, time: 1800},
	  {wood: 438, stone: 1685, iron: 573, food: 673, time: 2700},
	  {wood: 1110, stone: 2467, iron: 1357, food: 1233, time: 4050},
	  {wood: 1887, stone: 4194, iron: 2307, food: 2097, time: 6075},
	  {wood: 3236, stone: 7191, iron: 3954, food: 3596, time: 9113},
	  {wood: 5177, stone: 11505, iron: 6327, food: 5753, time: 13669},
	  {wood: 10430, stone: 18776, iron: 13560, food: 9387, time: 20503},
	  {wood: 18839, stone: 33912, iron: 24492, food: 16956, time: 30755},
	  {wood: 33914, stone: 61043, iron: 44087, food: 30523, time: 46132},
	  {wood: 66939, stone: 106495, iron: 85196, food: 45640, time: 55358},
	  {wood: 119786, stone: 190570, iron: 152456, food: 81672, time: 66430},
	  {wood: 213820, stone: 340166, iron: 272133, food: 145786, time: 79716},
	  {wood: 423566, stone: 505021, iron: 456148, food: 244365, time: 95659},
	  {wood: 708513, stone: 844765, iron: 763014, food: 408756, time: 114791}
	],
	'村':[
	  {wood: 400, stone: 136, iron: 104, food: 160, time: 0},
	  {wood: 936, stone: 319, iron: 243, food: 374, time: 1800},
	  {wood: 1685, stone: 573, iron: 438, food: 673, time: 2700},
	  {wood: 2467, stone: 1357, iron: 1110, food: 1233, time: 4050},
	  {wood: 4194, stone: 2307, iron: 1887, food: 2097, time: 6075},
	  {wood: 7191, stone: 3954, iron: 3236, food: 3596, time: 9113},
	  {wood: 11505, stone: 6327, iron: 5177, food: 5753, time: 13669},
	  {wood: 18776, stone: 13560, iron: 10430, food: 9387, time: 20503},
	  {wood: 33912, stone: 24492, iron: 18839, food: 16956, time: 30755},
	  {wood: 61043, stone: 44087, iron: 33914, food: 30523, time: 46132},
	  {wood: 106495, stone: 85196, iron: 66939, food: 45640, time: 55358},
	  {wood: 190570, stone: 152456, iron: 119786, food: 81672, time: 66430},
	  {wood: 340166, stone: 272133, iron: 213820, food: 145786, time: 79716},
	  {wood: 505021, stone: 456148, iron: 423566, food: 244365, time: 95659},
	  {wood: 844765, stone: 763014, iron: 708513, food: 408756, time: 114791}
	]
  };

  if (typeof resources[constructorName][level] == 'undefined') {
	console.log("resourcesFor:"+constructorName+" LV:"+level+" is undefined. may a script bug...");
	return null;
  }

  var o = resources[constructorName][level];
  console.log("resourcesFor:"+constructorName+"(lv:"+level+"→) 木:"+o.wood+" 石:"+o.stone+" 鉄:"+o.iron+" 糧:"+o.food+" 参考時間:"+o.time);
  return o;
}
function Chek_Sigen(area){
	try {
		var resources = new Object();
			resources.wood	= parseInt( q$("#wood").val(), 10 );
			resources.stone = parseInt( q$("#stone").val(), 10 );
			resources.iron	= parseInt( q$("#iron").val(), 10 );
			resources.food	= parseInt( q$("#rice").val(), 10 );
			resources.storagemax = parseInt( q$("#rice_max").val(), 10 );

		var cost = getBuildResources(area.name, parseInt(area.lv,10));
		if (resources.wood < cost.wood || resources.stone < cost.stone || resources.iron < cost.iron || resources.food < cost.food ) {
			//建築不可 = 1
			return 1;
		}
	}catch(e) {
	}
	return 0;
}

function getSoldier() {

debugLog("=== Start getSoldier ===");

	var tables = document.evaluate('//*[@class="status village-bottom"]',document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var Temp = tables.snapshotItem(0).innerHTML.substring(tables.snapshotItem(0).innerHTML.lastIndexOf(" ")+1);
	aa = Temp.split("/");
	var now_Soldier = aa[0];
	var max_Soldier = aa[1];

	// 造兵指示がない場合はスキップ
	if (OPT_BLD_SOL == 0) { return; }
	var result = new Array();
	//							 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8
	var attackerData = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);		// update 2014.03.07

	var tid=setTimeout(function(){

		GM_xmlhttpRequest({
			method:"GET",
			url:"http://" + HOST + "/facility/unit_status.php?type=all",
			headers:{"Content-type":"text/html"},
			overrideMimeType:'text/html; charset=utf-8',
			onload:function(x){
				var htmldoc = document.createElement("html");
					htmldoc.innerHTML = x.responseText;

				// 現存総数を合算
				var tables2 = document.evaluate('//table[@class="commonTablesNoMG"]',htmldoc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
				for (var i = 0; i < tables2.snapshotLength; i++ ){
					var htmldoc3 = tables2.snapshotItem(i);
					var tables3 = document.evaluate('*/tr/td[@class="digit"]',htmldoc3, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
					attackerData = addSoldierCount(attackerData, tables3);
				}

				// 作成処理
				make_soldier(attackerData);

			}
		});
	},0);
}

//兵士数加算 2014.03.07 盾兵・剣兵・重盾兵がある鯖ない鯖の処理分岐追加
function addSoldierCount(total, add) {

	if (total == undefined) total = new Array();
	if (total == undefined) {
		//				  1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8
		total = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
	}

	if (add.snapshotLength == 12) {
		for (var j = 0; j < 11; j++) {
			total[j] += parseInt(add.snapshotItem(j).innerHTML,10);
		}
	}

	if (add.snapshotLength == 16) {
		// 2016.05.04 兵士管理画面レイアウト変更対応
		for (var j = 0; j <= 6; j++) {
			total[j] += parseInt(add.snapshotItem(j).innerHTML,10);
		}
		for (var j = 8; j <= 14; j++) {
			total[j-1] += parseInt(add.snapshotItem(j).innerHTML,10);
		}
	}

	return total;
}

function make_soldier(attackerData){
	var make_name = ["兵器工房","厩舎","兵舎","弓兵舎","練兵所"];

	var make_loop = function(loop) {
		if (loop == 5) {
			sort_priority[0]  = make_no["剣兵"];
			sort_priority[1]  = make_no["弓兵"];
			sort_priority[2]  = make_no["弩兵"];
			sort_priority[3]  = make_no["騎兵"];
			sort_priority[4]  = make_no["近衛騎兵"];
			sort_priority[5]  = make_no["槍兵"];
			sort_priority[6]  = make_no["矛槍兵"];
			sort_priority[7]  = make_no["斥候"];
			sort_priority[8]  = make_no["斥候騎兵"];
			sort_priority[9]  = make_no["衝車"];
			sort_priority[10] = make_no["投石機"];
			sort_priority[11] = make_no["大剣兵"];
			sort_priority[12] = make_no["盾兵"];
			sort_priority[13] = make_no["重盾兵"];

			sort_priority.sort( function(a, b) { if (a[6] < b[6]) return 1; if (a[6] > b[6]) return -1; return 0;});

			for (var i=0;i<14;i++){
				if (sort_priority[i][2] == 1 && sort_priority[i][6] != 0){
					// 兵作成
					if ((OPT_SOL_ADD[sort_priority[i][1] - 300] != 0) && (OPT_SOL_ADD[sort_priority[i][1] - 300] < sort_priority[i][3])){
						var c={};
						c['x']=parseInt(sort_priority[i][7],10);
						c['y']=parseInt(sort_priority[i][8],10);
						c['unit_id']=sort_priority[i][1];
						c['count']=OPT_SOL_ADD[sort_priority[i][1] - 300];
						q$.post("http://"+HOST+"/facility/facility.php?x=" + sort_priority[i][7] + "&y=" + sort_priority[i][8] + "#ptop",c,function(){});
						var tid=setTimeout(function(){location.reload(false);},INTERVAL);

						break;
					}
				}
			}
			return;
		}

		var _x = -1;
		var _y = -1;
		var _lv = -1;

		var area = new Array();
		area = get_area();

		for (i=0;i<area.length;i++){
			if (area[i].name == make_name[loop]) {
				var Temp = area[i].xy.split(",");
				_x = Temp[0];
				_y = Temp[1];
				_lv = area[i].lv;
			}
		}
		if ( _x < 0 ) {
			// 建物がない
			make_loop(loop + 1);
		} else {

			MakeSoldierFlg = false; // 兵士作成フラグ

			var tables = document.evaluate('//*[@class="status village-bottom"]',document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			var Temp = tables.snapshotItem(0).innerHTML.substring(tables.snapshotItem(0).innerHTML.lastIndexOf(" ")+1);
			temp0 = Temp.split("/");
			var now_Soldier = temp0[0];
			var max_Soldier = temp0[1];
			var make_max = temp0[1] - temp0[0]; // 最大作成可能兵数
			// 宿舎に空きがあるか？
			switch (make_name[loop]) {
				case "兵器工房":	if ((OPT_SOL_ADD[12] <= make_max) && (OPT_SOL_ADD[13] <= make_max)) 								{ MakeSoldierFlg = true; }		// 衝車・投石機
				case "厩舎":		if ((OPT_SOL_ADD[5]  <= make_max) && (OPT_SOL_ADD[7]  <= make_max) && (OPT_SOL_MAX[11] <= make_max)){ MakeSoldierFlg = true; }		// 騎兵・近衛騎兵・斥候騎兵
				case "兵舎":		if ((OPT_SOL_ADD[3]  <= make_max) && (OPT_SOL_ADD[4]  <= make_max)) 								{ MakeSoldierFlg = true; }		// 槍兵・矛槍兵
				case "弓兵舎":		if ((OPT_SOL_ADD[8]  <= make_max) && (OPT_SOL_ADD[9]  <= make_max)) 								{ MakeSoldierFlg = true; }		// 弓兵・弩兵
				case "練兵所":		if ((OPT_SOL_ADD[1]  <= make_max) && (OPT_SOL_ADD[10] <= make_max) &&
										(OPT_SOL_ADD[15] <= make_max) && (OPT_SOL_ADD[16] <= make_max) && (OPT_SOL_ADD[17] <= make_max)){ MakeSoldierFlg = true; }		// 剣兵・斥候・大剣兵・盾兵・重盾兵
			}

			if (MakeSoldierFlg) {
				var tid=setTimeout(function(){
					var mURL = FACLINK;
					mURL = mURL.replace(URL_SITE,HOST);
					mURL = mURL.replace(URL_X,_x);
					mURL = mURL.replace(URL_Y,_y);
					GM_xmlhttpRequest({
						method:"GET",
						url: mURL,
						headers:{"Content-type":"text/html"},
						overrideMimeType:'text/html; charset=utf-8',
						onload:function(x){
							var htmldoc = document.createElement("html");
								htmldoc.innerHTML = x.responseText;

							var makeElem = document.evaluate('//*[@id="area_timer0"]',htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
							if (makeElem.snapshotLength > 0) {
								// 兵士は作成中
								getTrainingSoldier(htmldoc);
								if ( getStayMode() ) {
									closeIniBilderBox();
									openIniBilderBox();
								}
							} else {
								var makeElem  = document.evaluate('//th[@class="mainTtl"]',htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
								for (var i = 1; i < makeElem.snapshotLength; i++ ){
									var sol_name = makeElem.snapshotItem(i).innerHTML;
									// 兵作成可能
									make_no[sol_name][2] = 1;
									// 兵作成可能数
									make_no[sol_name][3] = parseInt(sumMaxSoldier(make_no[sol_name][1]),10);
									// 現存合計兵数
									make_no[sol_name][5] = attackerData[make_no[sol_name][4]];
									// 残必要兵数
									make_no[sol_name][6] = OPT_SOL_MAX[make_no[sol_name][1] - 300] - attackerData[make_no[sol_name][4]];
									if (make_no[sol_name][6] < 0) {
										make_no[sol_name][6] = 0;
									}
									// 座標
									make_no[sol_name][7] = _x;
									make_no[sol_name][8] = _y;
								};
							}
							make_loop(loop + 1);
						}
					});
				},1000);
			} else {
				make_loop(loop + 1);
			}
		}
	};

	make_loop(0);

}

function sumMaxSoldier(type){
	var SoldierCost = [
		[	1,	 1,   1,   1],
		[  11,	 1,  11,  61],	// 301 剣兵
		[	1,	 1,   1,   1],
		[  88, 132,   1,  21],	// 303 槍兵
		[ 264, 396,   1,  61],	// 304 矛槍兵
		[	1, 128, 192,  41],	// 305 騎兵
		[	1,	 1,   1,   1],
		[	1, 384, 576, 121],	// 307 近衛騎兵
		[ 144,	 1,  96,  35],	// 308 弓兵
		[ 432,	 1, 288, 105],	// 309 弩兵
		[ 151, 151, 151,   1],	// 310 斥候
		[ 451, 451, 451,  31],	// 311 斥候騎兵
		[ 501,	 1, 501,   1],	// 312 衝車
		[	1,1501,1501,   1],	// 313 投石機
		[	1,	 1,   1,   1],
		[  85,	 0,  85, 430],	// 315 大剣兵
		[  70,	70,  70,  20],	// 316 盾兵
		[ 210, 210, 210,  60],	// 317 重盾兵

	];
	var tables = document.evaluate('//*[@class="status village-bottom"]',document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var Temp = tables.snapshotItem(0).innerHTML.substring(tables.snapshotItem(0).innerHTML.lastIndexOf(" ")+1);
	temp0 = Temp.split("/");
	var now_Soldier = temp0[0];
	var max_Soldier = temp0[1];
	var make_max = temp0[1] - temp0[0]; // 最大作成可能兵数

	type = type - 300;
	var wood = parseInt( q$("#wood").val(), 10 );
	var stone = parseInt( q$("#stone").val(), 10 );
	var iron = parseInt( q$("#iron").val(), 10 );
	var rice = parseInt( q$("#rice").val(), 10 );

	countWood  = parseInt((wood  - OPT_BLD_WOOD)  / SoldierCost[type][0],10);
	countStone = parseInt((stone - OPT_BLD_STONE) / SoldierCost[type][1],10);
	countIron  = parseInt((iron  - OPT_BLD_IRON)  / SoldierCost[type][2],10);
	countRice  = parseInt((rice  - OPT_BLD_RICE)  / SoldierCost[type][3],10);

	var MaxSoldir = countWood;
	if (MaxSoldir > countStone) { MaxSoldir = countStone; }
	if (MaxSoldir > countIron)	{ MaxSoldir = countIron; }
	if (MaxSoldir > countRice)	{ MaxSoldir = countRice; }

	if (make_max < MaxSoldir) { MaxSoldir = make_max; } 		// 滞在可能上限を超えないこと
	return MaxSoldir;
}

// 資源オーバーフロー防止処理
function OverFlowPrevention() {

	var ichiba_x = -1; //市場のX座標
	var ichiba_y = -1; //市場のY座標
	var ichiba_lv = -1; //市場のレベル

	var area = new Array();
	area = get_area();

	for(i=0;i<area.length;i++){
		//市場の座標を取得
		if(area[i].name == "市場") {
			var Temp = area[i].xy.split(",");
			ichiba_x = Temp[0];
			ichiba_y = Temp[1];
			ichiba_lv = area[i].lv;
		}
	}

	if(ichiba_x < 0) { return; }

	// 現在の状態
	var RES_NOW = [];
	RES_NOW["wood"] 	= parseInt( q$("#wood").val(),	 10 );	// 資源：木
	RES_NOW["stone"]	= parseInt( q$("#stone").val(),	 10 );	// 資源：石
	RES_NOW["iron"] 	= parseInt( q$("#iron").val(),	 10 );	// 資源：鉄
	RES_NOW["rice"] 	= parseInt( q$("#rice").val(),	 10 );	// 資源：糧
	RES_NOW["storagemax"]	= parseInt( q$("#rice_max").val(), 10 );	// 倉庫容量

	var OverFlowLimit  = Math.floor(RES_NOW["storagemax"] * 0.95);		// 限界容量（倉庫の95%）
	var ChangeSigenNum = Math.floor(RES_NOW["storagemax"] * 0.05);		// 変換量（倉庫の5%）
	var percent = OPT_ICHIBA_LV_TABLE[shoplist[0].lv];
	console.log("市場変換率:" + percent*100.0 + "%");

	// 資源：木石鉄が限界を超えている場合
	if ( (RES_NOW["wood"] > OverFlowLimit) && (RES_NOW["stone"] > OverFlowLimit) && (RES_NOW["iron"] > OverFlowLimit) ) {
		var max_sigen = 0;
		if (RES_NOW["wood"]  > max_sigen) { max_sigen = RES_NOW["wood"];  ChangeSigenNum = Math.floor(RES_NOW["wood"]  * 0.01); }
		if (RES_NOW["stone"] > max_sigen) { max_sigen = RES_NOW["stone"]; ChangeSigenNum = Math.floor(RES_NOW["stone"] * 0.01); }
		if (RES_NOW["iron"]  > max_sigen) { max_sigen = RES_NOW["iron"];  ChangeSigenNum = Math.floor(RES_NOW["iron"]  * 0.01); }


		if(RES_NOW["wood"] == max_sigen) {
			changeResorceToResorce(WOOD,  ChangeSigenNum, RICE, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
		} else if(RES_NOW["stone"] == max_sigen) {
			changeResorceToResorce(STONE, ChangeSigenNum, RICE, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
		} else if(RES_NOW["iron"] == max_sigen) {
			changeResorceToResorce(IRON,  ChangeSigenNum, RICE, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
		}

	}
	// 資源：木が限界を超えているか？
	if (RES_NOW["wood"] > OverFlowLimit) {
		// 一番少ない資源を探せ！
		var min_sigen = 9999999999;
		if (RES_NOW["stone"] < min_sigen) { min_sigen = RES_NOW["stone"]; }
		if (RES_NOW["iron"]  < min_sigen) { min_sigen = RES_NOW["iron"]; }

		if(RES_NOW["stone"] == min_sigen) {
			changeResorceToResorce(WOOD, ChangeSigenNum, STONE, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
		} else if(RES_NOW["iron"] == min_sigen) {
			changeResorceToResorce(WOOD, ChangeSigenNum, IRON, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
		}
	}

	// 資源：石が限界を超えているか？
	if (RES_NOW["stone"] > OverFlowLimit) {
		// 一番少ない資源を探せ！
		var min_sigen = 9999999999;
		if (RES_NOW["wood"]  < min_sigen) { min_sigen = RES_NOW["wood"]; }
		if (RES_NOW["iron"]  < min_sigen) { min_sigen = RES_NOW["iron"]; }

		if(RES_NOW["wood"] == min_sigen) {
			changeResorceToResorce(STONE, ChangeSigenNum, WOOD, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
		} else if(RES_NOW["iron"] == min_sigen) {
			changeResorceToResorce(STONE, ChangeSigenNum, IRON, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
		}
	}

	// 資源：鉄が限界を超えているか？
	if (RES_NOW["iron"] > OverFlowLimit) {
		// 一番少ない資源を探せ！
		var min_sigen = 9999999999;
		if (RES_NOW["wood"]  < min_sigen) { min_sigen = RES_NOW["wood"]; }
		if (RES_NOW["stone"] < min_sigen) { min_sigen = RES_NOW["stone"]; }

		if(RES_NOW["wood"] == min_sigen) {
			changeResorceToResorce(IRON, ChangeSigenNum, WOOD, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
		} else if(RES_NOW["stone"] == min_sigen) {
			changeResorceToResorce(IRON, ChangeSigenNum, STONE, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
		}
	}

	// 資源：糧が限界を超えているか？
	if (RES_NOW["rice"] > OverFlowLimit) {
		// 一番少ない資源を探せ！
		var min_sigen = 9999999999;
		if (RES_NOW["wood"]  < min_sigen) { min_sigen = RES_NOW["wood"]; }
		if (RES_NOW["stone"] < min_sigen) { min_sigen = RES_NOW["stone"]; }
		if (RES_NOW["iron"]  < min_sigen) { min_sigen = RES_NOW["iron"]; }

		if(RES_NOW["wood"] == min_sigen) {
			changeResorceToResorce(RICE, ChangeSigenNum, WOOD, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
		} else if(RES_NOW["stone"] == min_sigen) {
			changeResorceToResorce(RICE, ChangeSigenNum, STONE, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
		} else if(RES_NOW["iron"] == min_sigen) {
			changeResorceToResorce(RICE, ChangeSigenNum, IRON, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
		}
	}
}


//市場変換処理
function ichibaChange(vId) {

debugLog("=== Start ichibaChange ===");

	var ichiba_x = -1; //市場のX座標
	var ichiba_y = -1; //市場のY座標
	var ichiba_lv = -1; //市場のレベル

	var area = new Array();
	area = get_area();
	for(i=0;i<area.length;i++){
		//市場の座標を取得
		if(area[i].name == "市場") {
			var Temp = area[i].xy.split(",");
			ichiba_x = Temp[0];
			ichiba_y = Temp[1];
			ichiba_lv = area[i].lv;
		}
	}

	if(ichiba_x < 0) {
		delShopList(vId);
	} else {
		// 市場がある村ID・座標・レベルを保管
		addShopList(vId,ichiba_lv,ichiba_x,ichiba_y);
	}

	if(OPT_ICHIBA != 1) {
		//alert("市場自動変換未指定");
		return;
	}

	var RES_NOW = [];
	RES_NOW["wood"] = parseInt( q$("#wood").val(), 10 );
	RES_NOW["stone"] = parseInt( q$("#stone").val(), 10 );
	RES_NOW["iron"] = parseInt( q$("#iron").val(), 10 );
	RES_NOW["rice"] = parseInt( q$("#rice").val(), 10 );
	RES_NOW["storagemax"] = parseInt( q$("#rice_max").val(), 10 );

	var CHG_NOW = [];
	CHG_NOW["wood"] = 1;
	CHG_NOW["stone"] = 1;
	CHG_NOW["iron"] = 1;

/*
	var OverFlowLimit  = RES_NOW["storagemax"]; 		// 限界容量（倉庫の100%）

	if ( (RES_NOW["wood"] = OverFlowLimit) && (RES_NOW["stone"] = OverFlowLimit) && (RES_NOW["iron"] = OverFlowLimit) ) {
		// 木石鉄が100%の場合
		if (RES_NOW["rice"] = OverFlowLimit) {
			// 糧も100%の場合各資源の1%を寄付する
			var c={};
			c['contributionForm'] = "";
			c['wood']  = Math.floor(RES_NOW["wood"]  * 0.01);
			c['stone'] = Math.floor(RES_NOW["stone"] * 0.01);
			c['iron']  = Math.floor(RES_NOW["iron"]  * 0.01);
			c['rice']  = Math.floor(RES_NOW["rice"]  * 0.01);
			c['contribution'] = 1;
			q$.post("http://"+HOST+"/alliance/level.php",c,function(){});
			var tid=setTimeout(function(){location.reload(false);},INTERVAL);
		}
		return;
	}
*/

	if(OPT_ICHIBA_PATS[4] != OPT_ICHIBA_PA) {

		// @@ 2011.06.22 設定上限が0以下の場合倉庫上限に変更
		if (OPT_MAX_WOOD  < 1) { OPT_MAX_WOOD  = RES_NOW["storagemax"]; }
		if (OPT_MAX_STONE < 1) { OPT_MAX_STONE = RES_NOW["storagemax"]; }
		if (OPT_MAX_IRON  < 1) { OPT_MAX_IRON  = RES_NOW["storagemax"]; }

		if (RES_NOW["wood"]  >= OPT_MAX_WOOD) { CHG_NOW["wood"]  = 0; }
		if (RES_NOW["stone"] >= OPT_MAX_STONE){ CHG_NOW["stone"] = 0; }
		if (RES_NOW["iron"]  >= OPT_MAX_IRON) { CHG_NOW["iron"]  = 0; }

		// 全部上限を超えていて
		if ( ( CHG_NOW["wood"] + CHG_NOW["stone"] + CHG_NOW["iron"] ) == 0 ) {
			// 自動寄付も未設定の場合全部変換対象にする
			if ( OPT_KIFU == 0 ) {
				CHG_NOW["wood"] = 1;
				CHG_NOW["stone"] = 1;
				CHG_NOW["iron"] = 1;
			}
		}

		//糧が指定量より多いかチェック
		if(RES_NOW["rice"] < OPT_RISE_MAX) {
			return;
		}
		if( OPT_RISE_MAX == 0) {
			return;
		}

		// 一番市場レベルの高い拠点へジャンプ 2012.04.13
		var shoplist = cloadData(HOST+"ShopList","[]",true,true);
		if (shoplist.length == 0) { return; }
//		shoplist.sort( function(a,b) { if (a[1] < b[1]) return 1; if (a[1] > b[1]) return -1; return 0;});
		shoplist.sort( function(a,b) { return parseInt(b[1],10) - parseInt(a[1],10);}); // 2016.05.06
		if (vId != shoplist[0].vId) {
			// 一番市場のレベルの高い拠点へ移動
			var villages = loadVillages(HOST+PGNAME);
			var nextIndex = -1;
			for(var i=0; i<villages.length;i++){
				if(shoplist[0].vId == villages[i][IDX_XY]){
					nextIndex = i;
					break;
				}
			}
			if (nextIndex != -1) {
				ShopFlg = true;
				ShopURL = villages[nextIndex][IDX_URL];
			}
			return;
		}

		if(OPT_ICHIBA_PATS[0] == OPT_ICHIBA_PA){
			//===== 平均的に変換 =====
			var percent = OPT_ICHIBA_LV_TABLE[shoplist[0].lv];
			console.log("市場変換率:" + percent*100.0 + "%");
			if (OPT_TO_WOOD+OPT_TO_STONE+OPT_TO_IRON == 0) {
				return;
			}

			var min_sigen = 9999999999;

			if((OPT_TO_WOOD  > 0) && (RES_NOW["wood"]  < min_sigen && CHG_NOW["wood"] == 1))  { min_sigen = RES_NOW["wood"]; };
			if((OPT_TO_STONE > 0) && (RES_NOW["stone"] < min_sigen && CHG_NOW["stone"] == 1)) { min_sigen = RES_NOW["stone"]; }
			if((OPT_TO_IRON  > 0) && (RES_NOW["iron"]  < min_sigen && CHG_NOW["iron"] == 1))  { min_sigen = RES_NOW["iron"]; }

			//糧から他の資源に変換開始
					if((OPT_TO_WOOD  > 0) && ( RES_NOW["wood"]	== min_sigen ))	{	changeResorceToResorce(RICE, OPT_TO_WOOD, WOOD, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
			} else	if((OPT_TO_STONE > 0) && ( RES_NOW["stone"] == min_sigen ))	{	changeResorceToResorce(RICE, OPT_TO_STONE, STONE, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
			} else	if((OPT_TO_IRON  > 0) && ( RES_NOW["iron"]	== min_sigen ))	{	changeResorceToResorce(RICE, OPT_TO_IRON, IRON, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y);
			}
//			var tid=setTimeout(function(){location.reload(false);},INTERVAL);
			return;
		}

		if(OPT_ICHIBA_PATS[1] == OPT_ICHIBA_PA){
			//===== 一括変換 =====
			var percent = OPT_ICHIBA_LV_TABLE[shoplist[0].lv];
			console.log("市場変換率:" + percent*100.0 + "%");
			if(OPT_RISE_MAX < OPT_TO_WOOD+OPT_TO_STONE+OPT_TO_IRON){
//				alert("変換する総合計より糧の値を大きくしてください。");
			}else{
				if(CHG_NOW["wood"]	== 1)	{	changeResorceToResorce(RICE, OPT_TO_WOOD,	WOOD, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"],	ichiba_x,	ichiba_y);	}
				if(CHG_NOW["stone"] == 1)	{	changeResorceToResorce(RICE, OPT_TO_STONE,	STONE, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"],	ichiba_x,	ichiba_y);	}
				if(CHG_NOW["iron"]	== 1)	{	changeResorceToResorce(RICE, OPT_TO_IRON,	IRON, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"],	ichiba_x,	ichiba_y);	}
			}
//			var tid=setTimeout(function(){location.reload(false);},INTERVAL);
			return;
		}

		if(OPT_ICHIBA_PATS[2] == OPT_ICHIBA_PA){
			//===== スマート変換 ===== : 市場変換率を元に加算平均を下回る資源をカバーする
			var conv_unit = 1000; // 変換単位
			var percent = OPT_ICHIBA_LV_TABLE[shoplist[0].lv];
			console.log("市場変換率:" + percent*100.0 + "%");

			var use_foods = 0;
			var hope_amount = 99999999;

			// 一部の資源が特出している場合除外する
			for (var index = 4; index > 0; --index) {
				var left = 0;  // 変換先現在庫合算値
				var count = 0; // 変換対象種類数
				if (hope_amount > RES_NOW["wood"] ) { ++count; left += RES_NOW["wood"]; }
				if (hope_amount > RES_NOW["stone"]) { ++count; left += RES_NOW["stone"]; }
				if (hope_amount > RES_NOW["iron"] ) { ++count; left += RES_NOW["iron"]; }
				if (count && count < index) {
					// 糧使用量 U を求める. p=変換率, F=糧在庫, C=変換対象種類数, L=Cの在庫合算
					// (L + pU) / C = F - U
					//	   L + pU = C(F - U)
					//	   L + pU =  CF - CU
					//	  pU + CU =  CF - L
					//	 U(p + C) =  CF - L
					//			U = (CF - L) / (p + C)
					use_foods = Math.ceil((count * RES_NOW["rice"] - left) / (percent + count));
					if (use_foods > 0) {
						// 期待値 A を求める。
						// A = (L + pU) / C
						hope_amount = Math.ceil((left + use_foods * percent) / count);
					}
				}
			}

			// 変換量
			var to_wood = 0, to_stone = 0, to_iron = 0;

			// 糧在庫が期待値を上回っている場合のみ、不足資源を補う
			if (RES_NOW["rice"] > hope_amount) {
				// 最小単位ごとに端数切り上げで変換数を算出
				if (hope_amount > RES_NOW["wood"]) {
					to_wood  = Math.ceil( (hope_amount - RES_NOW["wood"] ) / percent / conv_unit) * conv_unit;
				}
				if (hope_amount > RES_NOW["stone"]) {
					to_stone = Math.ceil( (hope_amount - RES_NOW["stone"]) / percent / conv_unit) * conv_unit;
				}
				if (hope_amount > RES_NOW["iron"] ) {
					to_iron  = Math.ceil( (hope_amount - RES_NOW["iron"] ) / percent / conv_unit) * conv_unit;
				}
			}

			// 糧使用量 U を超える場合は按分する
			var sum_to_use = to_wood + to_stone + to_iron;
			if (sum_to_use > RES_NOW["rice"]) {
				to_wood  = use_foods * to_wood	/ sum_to_use;
				to_stone = use_foods * to_stone / sum_to_use;
				to_iron  = use_foods * to_iron	/ sum_to_use;
			}

			if ((to_wood > 0) || (to_stone > 0) || (to_iron > 0)) {
				console.log("[現在庫] 木="+RES_NOW["wood"]+"　石="+RES_NOW["stone"]+"　鉄="+RES_NOW["iron"]+"　糧="+RES_NOW["rice"]+"　期待値:"+hope_amount);
				console.log("[変換数] 糧→木="+to_wood+"　糧→石="+to_stone+"　糧→鉄="+to_iron);
				if (to_wood  > 0) { changeResorceToResorceEx(RICE, to_wood , WOOD , percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y, false); }
				if (to_stone > 0) { changeResorceToResorceEx(RICE, to_stone, STONE, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y, false); }
				if (to_iron  > 0) { changeResorceToResorceEx(RICE, to_iron , IRON , percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y, false); }
				var tid=setTimeout(function(){location.reload(false);},INTERVAL);
			}
			return;
		}

		if(OPT_ICHIBA_PATS[3] == OPT_ICHIBA_PA){
			//===== 余剰分を変換 ===== : 糧残高超過分について、市場変換率を元に加算平均を下回る資源をカバーする
			var conv_unit = 1000; // 変換単位
			var percent = OPT_ICHIBA_LV_TABLE[shoplist[0].lv];
			console.log("市場変換率:" + percent*100.0 + "%");

			var use_foods = RES_NOW["rice"] - OPT_RISE_MAX;
			var hope_amount = 99999999;

			// 一部の資源が特出している場合除外する
			for (var index = 4; index > 0; --index) {
				var left = 0;  // 変換先現在庫合算値
				var count = 0; // 変換対象種類数
				if (hope_amount > RES_NOW["wood"] ) { ++count; left += RES_NOW["wood"]; }
				if (hope_amount > RES_NOW["stone"]) { ++count; left += RES_NOW["stone"]; }
				if (hope_amount > RES_NOW["iron"] ) { ++count; left += RES_NOW["iron"]; }
				if (count && count < index) {
					// 期待値 A を求める。
					// A = (L + pU) / C
					hope_amount = Math.ceil((left + use_foods * percent) / count);
				}
			}

			// 変換量
			var to_wood = 0, to_stone = 0, to_iron = 0;

			// 最小単位ごとに端数切り上げで変換数を算出
			if (hope_amount > RES_NOW["wood"]) {
				to_wood  = Math.ceil( (hope_amount - RES_NOW["wood"] ) / percent / conv_unit) * conv_unit;
			}
			if (hope_amount > RES_NOW["stone"]) {
				to_stone = Math.ceil( (hope_amount - RES_NOW["stone"]) / percent / conv_unit) * conv_unit;
			}
			if (hope_amount > RES_NOW["iron"] ) {
				to_iron  = Math.ceil( (hope_amount - RES_NOW["iron"] ) / percent / conv_unit) * conv_unit;
			}

			// 糧使用量 U を超える場合は按分する
			var sum_to_use = to_wood + to_stone + to_iron;
			if (sum_to_use > RES_NOW["rice"]) {
				to_wood  = use_foods * to_wood	/ sum_to_use;
				to_stone = use_foods * to_stone / sum_to_use;
				to_iron  = use_foods * to_iron	/ sum_to_use;
			}

			if ((to_wood > 0) || (to_stone > 0) || (to_iron > 0)) {
				console.log("[現在庫] 木="+RES_NOW["wood"]+"　石="+RES_NOW["stone"]+"　鉄="+RES_NOW["iron"]+"　糧="+RES_NOW["rice"]+"　期待値:"+hope_amount);
				console.log("[変換数] 糧→木="+to_wood+"　糧→石="+to_stone+"　糧→鉄="+to_iron);
				if (to_wood  > 0) { changeResorceToResorceEx(RICE, to_wood , WOOD , percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y, false); }
				if (to_stone > 0) { changeResorceToResorceEx(RICE, to_stone, STONE, percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y, false); }
				if (to_iron  > 0) { changeResorceToResorceEx(RICE, to_iron , IRON , percent, RES_NOW["wood"], RES_NOW["stone"], RES_NOW["iron"], RES_NOW["rice"], ichiba_x, ichiba_y, false); }
				var tid=setTimeout(function(){location.reload(false);},INTERVAL);
			}
			return;
		}
	}

	function addShopList(vId,lv,x,y) {
		var flg = 0;
		var shoplist = cloadData(HOST+"ShopList","[]",true,true);
		for (var i=0 ; i<shoplist.length ; i++) {
			if (shoplist[i].vId == vId) {
				shoplist[i].vId = vId;
				shoplist[i].lv = lv;
				shoplist[i].x = x;
				shoplist[i].y = y;
				flg = 1;
			}
		}
		if (flg == 0){
			shoplist.push({"vId":vId, "lv":lv, "x":x, "y":y });
		}
		csaveData(HOST+"ShopList",shoplist,true,true);
		// 市場情報が更新されたら表示しなおし
		if ( getStayMode() ) {
			closeIniBilderBox();
			openIniBilderBox();
		}
	}

	function delShopList(vId) {
		var shoplist = cloadData(HOST+"ShopList","[]",true,true);
		for (var i=0;i<shoplist.length;i++){
			if (shoplist[i].vId == vId) {
				shoplist.splice(i,1);
				csaveData(HOST+"ShopList",shoplist,true,true);
			}
		}
		// 市場情報が更新されたら表示しなおし
		if ( getStayMode() ) {
			closeIniBilderBox();
			openIniBilderBox();
		}
	}
}

//実変換処理通信部 @@
function changeResorceToResorceEx(from, tc, to, percent, stock_wood, stock_stone, stock_iron, stock_rice, x, y, reload) {
	var c={};
	c['change_btn'] = '確定';
	c['sell_text_rice'] = parseInt(tc,10);
	c['st'] = '';

	c['stock_wood'] = parseInt(stock_wood,10);
	c['stock_stone'] = parseInt(stock_stone,10);
	c['stock_iron'] = parseInt(stock_iron,10);
	c['stock_rice'] = parseInt(stock_rice,10);
	c['stock_noselect'] = '';

	c['tc'] = parseInt(tc,10);
	c['tf_id'] = parseInt(from,10);
	c['tt_wood'] = '';
	c['tt_stone'] = '';
	c['tt_iron'] = '';
	c['tt_rice'] = '';

	var tt_count = parseInt(tc,10) * parseFloat(percent);
	var tt_id = parseInt(to,10);
	if (tt_id == WOOD){
		c['tt_wood'] = tt_count;
	} else if (tt_id == STONE){
		c['tt_stone'] = tt_count;
	} else if (tt_id == IRON){
		c['tt_iron'] = tt_count;
	}
	c['x'] = parseInt(x,10);
	c['y'] = parseInt(y,10);

	q$.post("http://"+HOST+"/facility/facility.php",c,function(){});
	if (reload) {
		var tid=setTimeout(function(){location.reload(false);},INTERVAL);
	}
}
function changeResorceToResorce(from, tc, to, percent, stock_wood, stock_stone, stock_iron, stock_rice, x, y) {
	changeResorceToResorceEx(from, tc, to, percent, stock_wood, stock_stone, stock_iron, stock_rice, x, y, true);
}

//自動寄付処理
function autoDonate() {

debugLog("=== Start autoDonate ===");

	if(OPT_KIFU != 1) {
		//alert("自動寄付未指定");
		return;
	}

	//糧が指定量より多いかチェック
	if($("rice").innerHTML < OPT_RISE_KIFU_MAX) {
		return;
	}

	//指定値がおかしいときはスキップ
	if(OPT_RISE_KIFU < 1) {
		return;
	}


	sendDonate(OPT_RISE_KIFU);
//@@@
//	var tid=setTimeout(function(){location.reload(false);},INTERVAL);

}

//寄付処理通信部
function sendDonate(rice) {
/*
	var data = "contributionForm=&wood=0&stone=0&iron=0&rice=" + rice + "&contribution=1";
	var tid=setTimeout(function(){
		GM_xmlhttpRequest({
			method:"POST",
			url:"http://" + HOST + "/alliance/level.php",
			headers:{"Content-type":"application/x-www-form-urlencoded"},
			data: data,
//			onload:function(x){console.log(x.responseText);}
			onload:function(x){;}
		});
	},INTERVAL);
*/
	var c={};
	c['contributionForm'] = "";
	c['wood'] = 0;
	c['stone'] = 0;
	c['iron'] = 0;
	c['rice'] = parseInt(rice,10);
	c['contribution'] = 1;
	q$.post("http://"+HOST+"/alliance/level.php",c,function(){});
	var tid=setTimeout(function(){location.reload(false);},INTERVAL);
}

//内政スキルの使用
function Auto_Domestic() {

debugLog("=== Start Auto Domestic ===");

	DomesticFlg = false;

	var tid=setTimeout(function(){
		GM_xmlhttpRequest({
			method:"GET",
			url:"http://" + HOST + "/card/domestic_setting.php",
			headers:{"Content-type":"text/html"},
			overrideMimeType:'text/html; charset=utf-8',
			onload:function(x){

				var htmldoc = document.createElement("html");
					htmldoc.innerHTML = x.responseText;

					var skillElem = document.evaluate('//td[@class="skill"]',htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				for(i=0;i<skillElem.snapshotLength;i++){
					var skillTag = trim(skillElem.snapshotItem(i).innerHTML);
					var AutoSkillFlg = 0;

					for(z=1;z<DASkill.length;z++){
						if( (OPT_DOME[z]==1) && ( (skillTag.indexOf(DASkill[z],0) > 1)) ){
							var link = skillTag.substring(skillTag.indexOf("href=",0)+6,skillTag.indexOf("\"",skillTag.indexOf("href=",0)+7));
							do {
								link = link.replace(/&amp;/,"&");
							}while(link.indexOf("&amp;",0) > 1);
							DomesticFlg    = true;

							GM_xmlhttpRequest({ 	method:"GET", url:"http://" + HOST + link, headers:{"Content-type":"text/html"}, overrideMimeType:'text/html; charset=utf-8',	onload:function(x){
								debugLog("内政スキル使用");
								setVillageFacility();		// 拠点建築チェック
								getSoldier();				// 自動造兵処理
								autoLvup(); 				// 自動武器・防具強化
								ichibaChange(vId);			// 市場処理
								autoDonate();				// 自動寄付処理

								DomesticFlg = false;
							} });
							while(1){
								if (DomesticFlg == false) {
									debugLog("== END Auto_Domestic==");
									break;
								}
								Thread.sleep(100);	// 100ms 停止
							}
							if (DomesticFlg == false) { break; }
						}
					}
				}
				debugLog("内政スキル未使用");
				setVillageFacility();		// 拠点建築チェック
				getSoldier();				// 自動造兵処理
				autoLvup(); 				// 自動武器・防具強化
				ichibaChange(vId);			// 市場処理
				autoDonate();				// 自動寄付処理

			}
		});
	},INTERVAL);
}

///////////////////////////////////////////////
//Chrome用GM_関数
// @copyright 2009, James Campos
// @license cc-by-3.0; http://creativecommons.org/licenses/by/3.0/
if ((typeof GM_getValue == 'undefined') || (GM_getValue('a', 'b') == undefined)) {
	GM_getValue = function(name, defaultValue) {
		var value = localStorage.getItem(name);
		if (!value)
			return defaultValue;
		var type = value[0];
		value = value.substring(1);
			switch (type) {
				case 'b':
					return value == 'true';
				case 'n':
					return Number(value);
				default:
					return value;
			}
	};

	GM_log = function(message) {
		if (window.opera) {
			opera.postError(message);
			return;
		}
	};

	GM_setValue = function(name, value) {
		value = (typeof value)[0] + value;
		localStorage.setItem(name, value);
	};
}

function ccreateCheckBox0(container, id, def, text, title, left, villages)
{
	left += 2;

	var cb = d.createElement("input");
	cb.type = "checkbox";
	cb.style.verticalAlign = "middle";
	cb.id = id;
	//cb.value = 1;
	//if( def ) cb.checked = true;
	cb.checked	= def;
	cb.addEventListener("change",
// @@@
	function() {
		for (var i = 0; i < villages.length; i++) {
			GM_setValue(HOST+PGNAME+"OPT_CHKBOX_AVC_" + i, document.getElementById('OPT_CHKBOX_AVC_' + i).checked);
		}
	}, true);

	container.appendChild(cb);
	return cb;
}

// 2011.06.22
function ccreateCheckBoxKai2(container, id, def, text, title, left )
{

	left += 2;
	var dv = d.createElement("div");
	dv.style.padding = "1px";
	dv.style.paddingLeft= left + "px";

	dv.title = title;
	var cb = d.createElement("input");
	cb.type = "checkbox";
	cb.style.verticalAlign = "middle";
	cb.id = id + def;
	cb.value = 1;

	var def2 = id  + ""  + "[" + def + "]";

	if( eval(def2) ) cb.checked = true;

	var lb = d.createElement("label");
	lb.htmlFor = cb.id;
	lb.style.verticalAlign = "middle";

	var tx = d.createTextNode(text);
	tx.fontSize = "10px";
	lb.appendChild( tx );
	var tb = d.createElement("input");
	tb.type = "text";
	tb.id = id + "LV" + def;
	tb.value = eval(id	+ "LV"	+ "[" + def + "]");
	tb.style.verticalAlign = "middle";
	tb.style.textAlign = "right";
	tb.style.paddingRight = "3px";
	tb.size = 4;

	dv.appendChild(cb);
	dv.appendChild(lb);
	dv.appendChild(tb);
	container.appendChild(dv);
	return cb;
}

// 2015.05.10
function ccreateCheckBox3(container, id, val, def, text, title, left, multiple ) {
	if (multiple == 0) {
		ccreateCheckBox(container, id + '' + def, val[def], text, title, left ); // 2015.05.13
	} else {
		ccreateCheckBoxKai2(container, id, def, text, title + '残す数を入力してください。', left );
	}
}

function JSSleep(sec) {
	var start = new Date;
	while (1) {
		var cur = new Date;
		if (sec * 1000 <= cur.getTime() - start.getTime()) {
			break;
		}
	}
}
///////////////////////////////////////////////
// Time 部分の追加
///////////////////////////////////////////////
function sortAction(actions) {
	actions.sort(function(val1, val2) {
		var diff = (new Date(val1[IDX2_TIME])).getTime()
				 - (new Date(val2[IDX2_TIME])).getTime();
		return diff;
	});
	return actions;
}

//拠点の作業中情報を取得
function getVillageActions() {
	var data = new Array();
	//拠点名を取得
	data[IDX_BASE_NAME] = q$("#basepoint span[class=basename]").text().trim();

	//座標を取得
	q$("#basepoint span[class=xy]").text().match(/(\([-]*\d+,[-]*\d+\))/);
	data[IDX_XY] = RegExp.$1;

	//建設情報を取得
	var actionsElem = document.evaluate('//*[@id="actionLog"]/ul/li',
		document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var actions1 = new Array();
	for (var i = 0; i < actionsElem.snapshotLength; i++) {
		var paItem = actionsElem.snapshotItem(i);
		var newAction = new Array();

		//ステータス
		var buildStatusElem = document.evaluate('./span[@class="buildStatus"]/a', paItem, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		var buildStatus;
		if (buildStatusElem.snapshotLength > 0) {
			//施設建設
			var buildstr = trim(document.evaluate('./span[@class="buildStatus"]', paItem, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0).innerHTML).substr(0,2);
			if (buildstr == "建設") {
				newAction[IDX2_DELETE] = false;
				buildStatus = "建設:" + trim(buildStatusElem.snapshotItem(0).innerHTML);
			} else {
				newAction[IDX2_DELETE] = true;
				buildStatus = "削除:" + trim(buildStatusElem.snapshotItem(0).innerHTML);
			}
		} else {
			var buildStatusText = q$(".buildStatus span", paItem).text();
			if (/一括建設(準備)?中/.test(buildStatusText)) {
				newAction[IDX2_DELETE] = false;
				buildStatus = "一括建設:" + trim(q$(".buildStatus span", paItem).parent().text().replace(/一括建設(準備)?中/, '').trim());
			} else if (/自動建設(準備)?中/.test(buildStatusText)) {
				newAction[IDX2_DELETE] = false;
				buildStatus = "自動建設:" + trim(q$(".buildStatus span", paItem).parent().text().replace(/自動建設(準備)?中/, '').trim());
			} else if (/^全建設(準備)?中/.test(buildStatusText)) {
				newAction[IDX2_DELETE] = false;
				buildStatus = "全建設:" + trim(q$(".buildStatus span", paItem).parent().text().replace(/全建設(準備)?中/, '').trim());
			} else {
/*
				buildStatusElem = document.evaluate('./span[@class="buildStatus"]', 	paItem, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				if (buildStatusElem.snapshotItem(0).innerHTML.match(/強化/)) {
					continue;
				}
				var tempStr1 = buildStatusElem.snapshotItem(0).innerHTML.split("を");
				buildStatus = "研究所:" + tempStr1[0];
				newAction[IDX2_DELETE] = false;
*/
				continue;
			}
		}
		newAction[IDX2_ROTATION] = 0;
		newAction[IDX2_TYPE] = TYPE_CONSTRUCTION;
		newAction[IDX2_STATUS] = buildStatus;

		//施設建設完了時刻
		var buildClockElem = document.evaluate('./span[@class="buildClock"]', paItem, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		var clock = buildClockElem.snapshotItem(0).innerHTML;
		newAction[IDX2_TIME] = generateDateString(computeTime(clock));

//		console.log(generateDateString(computeTime(clock)));

		actions1.push(newAction);
	}

	//建設情報を永続保存
	data[IDX_ACTIONS] = actions1;
	saveVillage(data, TYPE_CONSTRUCTION);

	//行軍情報を取得
	var actionsElem = document.evaluate(
		'//*[@id="action"]/div[@class="floatInner"]/ul/li',
		document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var actions2 = new Array();
	for (var i = 0; i < actionsElem.snapshotLength; i++) {
		var paItem = actionsElem.snapshotItem(i);
		var newAction = new Array();
		newAction[IDX2_TYPE] = TYPE_MARCH;
		newAction[IDX2_DELETE] = false;
		newAction[IDX2_ROTATION] = 0;

		//ステータス
		var statusElem = document.evaluate('./a',
			paItem, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		var status = trim(statusElem.snapshotItem(0).innerHTML);
		newAction[IDX2_STATUS] = "行軍:" + status;

		//完了時刻
		var buildClockElem = document.evaluate('./span',
			paItem, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		var clock = buildClockElem.snapshotItem(0).innerHTML;
		newAction[IDX2_TIME] = generateDateString(computeTime(clock));

		actions2.push(newAction);
	}

	//行軍情報を永続保存
	data[IDX_ACTIONS] = actions2;
	saveVillage(data, TYPE_MARCH);
	if ( getStayMode() ) {
		closeIniBilderBox();
		openIniBilderBox();
	}
}

//拠点情報を保存
function saveVillage(newData, type) {
	var allData = loadVillages(location.hostname+PGNAME);

	//新旧データをマージ
	var exists = false;
	for (var i = 0; i < allData.length; i++) {
		var villageData = allData[i];

		//作業リスト更新
		if (villageData[IDX_XY] == newData[IDX_XY]) {
			exists = true;
			villageData[IDX_BASE_NAME] = newData[IDX_BASE_NAME];

			var actions = villageData[IDX_ACTIONS];
			for (var j = actions.length - 1; j >= 0; j--) {
				if (actions[j][IDX2_TYPE] != type) continue;
				var endTime = new Date(actions[j][IDX2_TIME]);
				var nowTime = new Date();
				if (isNaN(endTime.valueOf()) || endTime > nowTime) actions.splice(j, 1);
			}
			villageData[IDX_ACTIONS] = actions.concat(newData[IDX_ACTIONS]);
		}

		allData[i] = villageData;
	}
	if (!exists) allData.push(newData);
	//Greasemonkey領域へ永続保存
	saveVillages(HOST+PGNAME, allData);
}

//各作業行生成
function createActionDiv(action, nowTime, baseXy, host) {
	var type = action[IDX2_TYPE].charAt(0);
//	if (getDispMode(type) == DISP_MODE_NONE) {
//		return undefined;
//	}

	var actionDiv = document.createElement("div");
	if ( action[IDX2_DELETE] == "true" ) {
		actionDiv.style.backgroundColor = "#BBDDDD";
	}
	if ( action[IDX2_STATUS].indexOf("内政:回復") == 0 ) {
		actionDiv.style.color = "#666666";
	}
	//作業完了背景色
	var actionTime = new Date(action[IDX2_TIME]);
	if (actionTime < nowTime) {
		actionDiv.style.backgroundColor = COLOR_TITLE;
	}

	//作業完了時刻
	var textSpan = document.createElement("span");
	var text = "";
	text += action[IDX2_TIME].replace(/^[0-9]{4}\//, "");
//	if (getDispWaitTime()) {
		var finishTime = new Date(action[IDX2_TIME]);
		text += " (あと" + generateWaitTimeString(finishTime, nowTime) + ")";
//	}
	text += " ";
	text += action[IDX2_STATUS] + " ";
	textSpan.innerHTML = text;
	actionDiv.appendChild(textSpan);

	//作業完了行の個別削除リンク
	if (actionTime < nowTime) {
		var delLink = document.createElement("a");
		delLink.title = "確認済にして削除します";
		delLink.href = "javascript:void(0);";
		delLink.style.color = "#E86D61";
		delLink.innerHTML = "済";

		var key = host + DELIMIT1 + baseXy + DELIMIT1 + action[IDX2_TIME];
		delLink.addEventListener("click",
			(function(key_) {
				return function() { deleteAction(key_); };
			})(key), true);
		actionDiv.appendChild(delLink);
	}

	return actionDiv;
}

function confirmTimer() {
	//基準時刻より前の作業情報を削除
	var hosts = getTargetHosts();
	for (var ii = 0; ii < hosts.length; ii++) {
		var baseTime = new Date();
//		var baseTime = new Date(document.getElementById("openTime").innerHTML);
		var villages = loadVillages(hosts[ii] + PGNAME);
		for (var i = 0; i < villages.length; i++) {
			var actions = villages[i][IDX_ACTIONS];
			for (var j = actions.length - 1; j >=0 ; j--) {
				var actionTime = new Date(actions[j][IDX2_TIME]);
				if (actionTime <= baseTime) {
					actions.splice(j, 1);
				}
			}
			villages[i][IDX_ACTIONS] = actions;
		}

		//保存
		saveVillages(hosts[ii] + PGNAME, villages);
	}

	//更新後内容で表示　2013.01.10 ???
	if ( getStayMode() ) {
		closeIniBilderBox();
		openIniBilderBox();
	}

}

//通知対象ホスト
function getTargetHosts() {
	var hosts = new Array();
	var dispOtherHosts = GM_getValue(location.hostname + "_disp_other_hosts", false);
	if (dispOtherHosts) {
		hosts = loadHosts();
	} else {
		hosts[0] = location.hostname;
	}
	return hosts;
}

function deleteAction(key) {
	var hosts = getTargetHosts();
	for (var ii = 0; ii < hosts.length; ii++) {
		var villages = loadVillages(hosts[ii] + PGNAME);
		var exists = false;
		villageLoop:
		for (var i = 0; i < villages.length; i++) {
			for (var j = 0; j < villages[i][IDX_ACTIONS].length; j++) {
				var action = villages[i][IDX_ACTIONS][j];
				var curKey = hosts[ii] + DELIMIT1 +
					villages[i][IDX_XY] + DELIMIT1 + action[IDX2_TIME];
				if (key == curKey) {
					exists = true;
					villages[i][IDX_ACTIONS].splice(j, 1);
					break villageLoop;
				}
			}
		}

		//見つかったら更新
		if (exists) {
			saveVillages(hosts[ii] + PGNAME, villages);
			if ( getStayMode() ) {
				closeIniBilderBox();
				openIniBilderBox();
			}
			return;
		}
	}
}

//施設内作業中取得
function getTrainingSoldier(htmldoc) {
	var data = getMyVillage();
	data[IDX_ACTIONS] = new Array();
	var tt={};
	//施設名
	var facilityName = "";
	var h2Elem = document.evaluate('//*[@id="gray02Wrapper"]/h2', htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	if (h2Elem.getSnapshotLength != 0) {
		facilityName = trim(h2Elem.snapshotItem(0).innerHTML);
	}
	// 作成数の兵数と兵種
	var mSolName = document.evaluate('//th[@class="mainTtl"]',htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
//	var mSolNum = document.evaluate('//td',htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var mSolNum = document.evaluate('//*[@class="commonTables"]//td',htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	// 作成できる兵種の種類数

	var mSolTypeT = document.evaluate('//table[@class="commonTables"]',htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	if (mSolTypeT.snapshotLength > 2) {
		var mSolType = document.evaluate('//*[@class="mainTtl"]',mSolTypeT.snapshotItem(1), null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		for(var r=1;r < mSolType.snapshotLength;r++) {
			tt[r-1] = new Array();
			tt[r-1] = mSolType.snapshotItem(r).innerHTML;
			var endflg = false;
			if (r > 1) {
				for (var q=0;q<r-1;q++) {
					if (tt[q] == mSolType.snapshotItem(r).innerHTML) {
						endflg = true;
						break;
					}
				}
			}
			if (endflg) {
				var mSolTypeNum = r - 1;
				break;
			}
		}
	}
	// 施設が最大レベルかの判断
	var commentNum = document.evaluate('//*[@class="lvupFacility"]/*[@class="main"]', htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	if (commentNum.snapshotItem(0).innerHTML.match("最大レベル")) {
		maxLv = 3;
	} else {
		maxLv = 0;
	}

	//作業中情報取得
	var idx = 0;
	while (1) {
		var actionType = TYPE_FACILITY + facilityName;

		var clockElem = document.evaluate('//*[@id=' + escapeXPathExpr("area_timer" + idx) + ']', htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
		if (clockElem == undefined) {
			saveVillage(data, actionType);		// 研究所で未研究の場合過去の研究情報の削除
			break;
		}

		var mainTtls = document.evaluate('../../../tr/th[@class="mainTtl"]', clockElem, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if (mainTtls.snapshotLength == 0) break;
		var clock = trim(clockElem.innerHTML);
		if (clock == "") break;

		var mainTtlElem = mainTtls.snapshotItem(idx);
		if (mainTtlElem == undefined) break;
		var status = trim(mainTtlElem.innerHTML);
		if (status == "") break;

		var actionType = TYPE_FACILITY + facilityName;

		data[IDX_ACTIONS][idx] = new Array();

		if (facilityName == "鍛冶場" || facilityName == "防具工場" || facilityName == "研究所") {
			data[IDX_ACTIONS][idx][IDX2_STATUS] = facilityName + ":" + status;
		} else {
			try {

				data[IDX_ACTIONS][idx][IDX2_STATUS] = facilityName + ":" + status + "(" + mSolNum.snapshotItem(8 + mSolTypeNum + (mSolTypeNum * 5) + (idx * 4) - (1 * maxLv)).innerHTML + ")";
			}catch(e) {
				data[IDX_ACTIONS][idx][IDX2_STATUS] = facilityName + ":" + status + " (error)";
			}

		}
		data[IDX_ACTIONS][idx][IDX2_TIME] = generateDateString(computeTime(clock));
		data[IDX_ACTIONS][idx][IDX2_TYPE] = actionType;
		data[IDX_ACTIONS][idx][IDX2_DELETE] = false;
		data[IDX_ACTIONS][idx][IDX2_ROTATION] = 0;

		idx++;
	}

//	saveVillage(data, actionType);	2012.09.06 ちょっちオミット
}

function getMyVillage() {
	var ret = new Array();

	var xy=getMyXY();
	if(! xy){
		return ret;
	}
	var allData = loadVillages(location.hostname + PGNAME);
	for (var i = 0; i < allData.length; i++) {
		var villageData = allData[i];
		if (villageData[IDX_XY] == "("+xy+")") {
			ret[IDX_XY] = villageData[IDX_XY];
			ret[IDX_BASE_NAME] = villageData[IDX_BASE_NAME];
			return ret;
		}
	}

	return ret;
}

function getMyXY() {
	var d = document;
	var $x = function(xp,dc) {
		return document.evaluate(xp, dc||d, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	};

	var gnaviorgNav = d.getElementById("gnavi");
	if(gnaviorgNav) {
		var nowLoc = $x('id("gnavi")//a[contains(@href,"map.php")]');
	}else{
		var nowLoc = $x('id("gNav")//a[contains(@href,"map.php")]');
	}

	if (!nowLoc) return null;

	var xy = nowLoc.href.match(/x=([\-0-9]+)&y=([\-0-9]+)/i);
	if( xy ) {
		return xy[1]+","+xy[2];
	}
}
//内政スキル取得
function getDomesticSkill(htmldoc) {
	var data = getMyVillage();
	data[IDX_ACTIONS] = new Array();
	var i = -1;
	// 使用中
	var useSkill = document.evaluate('//div[@class="base-skill"]/span/a', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	if (!useSkill.snapshotItem(0).innerHTML.match("--:--:--")) {
//		console.log(useSkill.snapshotItem(0).innerHTML);
		i += 1;
		data[IDX_ACTIONS][i] = new Array();
		var SkillName = useSkill.snapshotItem(0).innerHTML.split(":")[1].split("(")[0];
		var status = "内政:使用(" + trim(useSkill.snapshotItem(0).innerHTML.split(":")[0]) + ":" + SkillName + ")";
		data[IDX_ACTIONS][i][IDX2_STATUS] = status;
		data[IDX_ACTIONS][i][IDX2_TIME] = generateDateString(computeTime(useSkill.snapshotItem(0).innerHTML.split(">")[1].substr(0,8)));
		data[IDX_ACTIONS][i][IDX2_TYPE] = TYPE_DOMESTIC;
		data[IDX_ACTIONS][i][IDX2_DELETE] = false;
		data[IDX_ACTIONS][i][IDX2_ROTATION] = 0;
	}
	// 回復中
	var dom = document.createElement("html");
	var RecoveryCheck = document.evaluate('//table[@class="general domesticGeneralListTbl"]', htmldoc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var z=0;z<RecoveryCheck.snapshotLength;z++){
		if (RecoveryCheck.snapshotItem(z).innerHTML.match("内政中")) {
			dom.innerHTML = "<table>" + RecoveryCheck.snapshotItem(z).innerHTML + "</table>";
			// 内政武将名
			var Name = q$('td>a[class="thickbox"]', dom).text().trim();
			var RecoverySkill = document.evaluate('//td[@class="recovery"]', dom, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			for (var x=0;x<RecoverySkill.snapshotLength;x++) {
				i += 1;
				data[IDX_ACTIONS][i] = new Array();
				var SkillName  = RecoverySkill.snapshotItem(x).innerHTML.split("<")[0]; 		// スキル名
				var SkillRTime = RecoverySkill.snapshotItem(x).innerHTML.split('>')[2].substr(0,8); 	// 回復時間
				var status = "内政:回復(" + trim(Name) + "：" + SkillName + ")";
				data[IDX_ACTIONS][i][IDX2_STATUS] = status;
				data[IDX_ACTIONS][i][IDX2_TIME] = generateDateString(computeTime(SkillRTime));
				data[IDX_ACTIONS][i][IDX2_TYPE] = TYPE_DOMESTIC;
				data[IDX_ACTIONS][i][IDX2_DELETE] = false;
				data[IDX_ACTIONS][i][IDX2_ROTATION] = 0;
			}
		}
	}
	saveVillage(data, TYPE_DOMESTIC);
	if ( getStayMode() ) {
		closeIniBilderBox();
		openIniBilderBox();
	}
}
//常駐モード取得
function getStayMode() {
	var result = GM_getValue(location.hostname + "_stay_mode" + PGNAME, true);
	return result;
}

//常駐モード変更
function changeStayMode(value) {
	GM_setValue(location.hostname + "_stay_mode" + PGNAME, value);
}


//巡回モード取得
function getReverseMode() {
	var result = GM_getValue(location.hostname + "_reverse_mode" + PGNAME, false);
	return result;
}

//巡回モード変更
function changeReverseMode(value) {
	GM_setValue(location.hostname + "_reverse_mode" + PGNAME, value);
}

//次回完了時刻取得
function getNextTime(hostname, baseTime) {

	//一番早い作業完了時刻を取得
	var startTime = new Date("2099/12/31 23:59:59");
	var nextTime = startTime;
	var villages = loadVillages(location.hostname + PGNAME);
	nextURL = "";
	for (var i = 0; i < villages.length; i++) {
		var actions = villages[i][IDX_ACTIONS];
		for (var j = 0; j < actions.length; j++) {
			var actionTime = new Date(actions[j][IDX2_TIME]);
			if (actionTime > baseTime && actionTime < nextTime) {
				var type = actions[j][IDX2_TYPE].charAt(0);
				nextTime = actionTime;
				nextURL  = villages[i][IDX_URL];
				nextNAME = villages[i][IDX_BASE_NAME];
			}
		}
	}

	//作業中がなければ何もしない
	if (nextTime == startTime) nextTime = undefined;

	return nextTime;
}

function xpath(query,targetDoc) {
	return document.evaluate(query, targetDoc, null,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

function escapeXPathExpr(text) {
	var matches = text.match(/[^"]+|"/g);

	function esc(t) {
		return t == '"' ? ('\'' + t + '\'') : ('"' + t + '"');
	}

	if (matches) {
		if (matches.length == 1) {
			return esc(matches[0]);
		}
		else {
			var results = [];
			for (var i = 0; i < matches.length; i ++) {
				results.push(esc(matches[i]));
			}
			return 'concat(' + results.join(', ') + ')';
		}
	}
	else {
		return '""';
	}
}

function forInt(num,def){
//	console.log(num + " : " + def);
	if (def == undefined) { 	def = 0;	}
	if (isNaN(parseInt(num,10))) {
		return def;
	} else {
		return parseInt(num,10);
	}
}

function getSessionId() {
	return getCookie('SSID');
}

// source: http://stackoverflow.com/questions/10687746/getcookie-returns-null
function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

// for debug print object
function po(obj, ext = "") {
	console.log(ext + JSON.stringify(obj, null, '\t'));
}
