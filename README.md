# bro3-tools
ブラウザ三国志用のツール置き場

| ツール名 | 機能 |
| - | - |
| [bro3_Auto_Bilder](bro3_Auto_Bilder) | ★定番★　通称ビルダー。自動内政（建築/削除）、軍費貯蓄、武器防具強化、造兵、糧変換など |
| [bro3_auto_daily_quest](bro3_auto_daily_quest) | ★定番★　繰り返しクエストのクエクリ補助。クエクリ報酬/洛陽への路の報酬自動受領。育成クエストにも対応 |
| [bro3_busyodas](bro3_busyodas) | ブショーダス補助。不要カードに自動でチェックを入れたり、連続で引いたり |
| [bro3_calc_defense](bro3_calc_defense) | 出兵時に民兵出現予測を表示（※今後のメンテ予定なし） |
| [bro3_display_skill](bro3_display_skill) | デッキ画面で武将のスキルを表示。ブショーダス画面、トレード画面、合成画面、カード削除画面に対応。合成画面ではスキル付与確率表示にも対応。（※今後のメンテ予定は未定） |
| [bro3_donate_window](bro3_donate_window) | 同盟タブで寄付をしやすくする。残す量や寄付後の合計値を確認しながら寄付したり、一括寄付に対応。 |
| [bro3_fort_info_tool](bro3_fort_info_tool) | NPC砦包囲情報収集 |
| [bro3_hide_build_button](bro3_hide_build_button) | 「研究・建設即完了」ボタンを隠す |
| [bro3_initial_quest_helper](bro3_initial_quest_helper) | 初期クエクリ補助。他の君主座標、NPC拠点座標、ランキングの自動入力 |
| [bro3_make_scouts_cavalrymans_checker](bro3_make_scouts_cavalrymans_checker) | 斥候騎兵作成予防 |
| [bro3_map_troop_extension](bro3_map_troop_extension) | ★人気★　51x51 MAP での遠征補助。出兵補助のほかに、高領地カラーリングやワンクリックで領地を削除したり領地名や拠点名などをコピーや変更できる |
| [bro3_nyan_delete](bro3_nyan_delete) | 便利アイテムから水鏡娘(経験値)や左慈娘(スコア)などをファイルへ移動させ一括破棄する。UC水鏡,UC南華老仙にも対応 |
| [bro3_nyannyan](bro3_nyannyan) | C水鏡娘を自動で修行合成する。UC水鏡娘,R水鏡娘にも対応 |
| [bro3_send_friendly_army](bro3_send_friendly_army) | ★人気★　友軍状況画面でリンクをクリックで友軍を派遣 |
| [bro3_territory_info](bro3_territory_info) | 全領地情報収集 |
| [bro3_quick_make_soldier](bro3_quick_make_soldier) | ★人気★　都市画面でワンクリックで造兵したり、援軍派遣したり |
| [bro3_auto_capture_setting](bro3_auto_capture_setting) | 自動鹵獲出兵先設定を簡単に編集 |

## 臨時

| ツール名 | 機能 |
| - | - |
| [bro3_auto_daily_quest_2019](bro3_auto_daily_quest) | 繰り返しクエストのクエクリ補助 2023年お正月対応 Edition |
| [bro3_beyond](bro3_beyond) | ★定番★　運営仕様変更への臨時対応用。[本家](http://silent-stage.air-nifty.com/steps/)対応時はこちらは更新しません。 |

## 動作環境

拙作ツールは原則として Windows 10 (64bit) 日本語版 + 下記ブラウザで動作確認しています。
下記環境以外でも動作するようですが、詳細については把握していませんのでお問い合わせいただいてもお答えいたしかねます。

- [Waterfox Classic 2022.08](https://github.com/WaterfoxCo/Waterfox-Classic/releases/tag/2022.08-classic) + Greasemonkey 3.17
    - [開発検証環境構築メモ](./Doc/development.md)
    - [スクショ付きの環境構築手順書](./Doc/waterfox_install_gm.md)
- ~~[Firefox 56.0.2 (64bit) 日本語版](https://ftp.mozilla.org/pub/firefox/releases/56.0.2/win64/ja/) + [Greasemonkey 3.17](https://addons.mozilla.org/ja/firefox/addon/greasemonkey/versions/?page=1#version-3.17)~~
    - ~~[Firefox 52.9.0 (64bit) ESR 日本語版](https://ftp.mozilla.org/pub/firefox/releases/52.9.0esr/win64/ja/)~~
    - 2022年10月～メイン開発環境をWaterfoxへ移行しました。
- ~~Google Chrome 71 (64bit) + Tampermonkey~~ (2021年以降、手元の環境で動作確認できなくなりました)
- Sleipnir 4.6.3 + Tampermonkey

**速報**
2020/03/12 のヤバゲメンテ以降、一部のブラウザーにてツールが動作しないことを確認しています。
こちらで動作確認したところ、とりあえず User Agent を PC ではなく Android へ変更することで動作することを確認しています。
[ブラウザーごとの User Agent 設定方法](Doc/how_to_change_user_agent.md)


## 免責
本リポジトリー内の内容によって何らかの不利益を被った場合でも一切責任は取りかねます。すべて自己責任でお願いします。
