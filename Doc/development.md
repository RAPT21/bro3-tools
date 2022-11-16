# 開発検証環境構築メモ
ダウンロードサイトを毎回調べるのが面倒なので、個人的な開発（検証）環境構築のためのメモを残しておく。

→ [スクショ付きの手順書](./waterfox_install_gm.md)も作成してみた。

## Step1. ブラウザーを用意する
個人的には Waterfox の方が軽く感じたがどちらでも動作する。

- [Firefox 52.9.0 (64bit) ESR 日本語版](https://ftp.mozilla.org/pub/firefox/releases/52.9.0esr/win64/ja/)
- [Waterfox Classic 2022.08](https://github.com/WaterfoxCo/Waterfox-Classic/releases/tag/2022.08-classic)
    - G4 / G5 のバージョンでは、後述の xip インストールに失敗した。Classic なら動作する
    - Options → General → Locale Select で「Japanese - 日本語」を選択して「Restart」をクリックで日本語化可能
- PaleMoon でも動作するという話だったが、最近、レガシーアドオンへの対応廃止を表明したらしい

## Step2. 拡張機能 Greasemonkey 3.17 をインストール
正規入手先が不明のため、ソースからビルドしたのか、再署名したのか記憶にないが、[野良署名した検証用 Greasemonkey 3.17](../Sample/my-greasemonkey-317.xpi)を使う。

### xip インストール手順
1. Firefox/Waterfoxのアドレスバーに `about:config` と入力して Enter
1. ~~傾国~~警告が出るので、`I accept thr risk!` を押して設定画面を開く
1. 検索バーに `xpinstall` と入力して、`xpinstall.whitelist.required` を `false` にする
1. ダウンロードした xip ファイルをブラウザー画面へドラッグ＆ドロップしてインストール

## Step3. 拡張機能 Greasemonkey 3.17 の自動更新を無効化する
1. Firefox/Waterfoxを開いた状態でAltキーを押して離すとメニューバーが表示されるので、ツール＞アドオンを選択。
    - ショートカットは [Ctrl+Shift+A]
1. アドオンマネージャーが開くので、サイドパネルで「拡張機能」を選択
1. Greasemonkey 3.17 の下段にある「詳細」をクリック
1. 自動更新の設定を「オフ」に設定


# 免責
本リポジトリー内の内容によって何らかの不利益を被った場合でも一切責任は取りかねます。すべて自己責任でお願いします。
