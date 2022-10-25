# 開発検証環境構築メモ
ダウンロードサイトを毎回調べるのが面倒なので、個人的な開発（検証）環境構築のためのメモを残しておく。

## Step1. ブラウザーを用意する
個人的には Waterfox の方が軽く感じたがどちらでも動作する。

- [Firefox 52.9.0 (64bit) ESR 日本語版](https://ftp.mozilla.org/pub/firefox/releases/52.9.0esr/win64/ja/)
- [Waterfox Classic 2022.08](https://github.com/WaterfoxCo/Waterfox-Classic/releases/tag/2022.08-classic)
    - G4 / G5 のバージョンでは、後述の xip インストールに失敗した。Classic なら動作する。ただし英語のみ
- PaleMoon でも動作するという話だったが、最近、レガシーアドオンへの対応廃止を表明したらしい

## Step2. 拡張機能 Greasemonkey 3.17 をインストール
正規入手先が不明のため、ソースからビルドしたのか、再署名したのか記憶にないが、[野良署名した検証用 Greasemonkey 3.17](../Sample/my-greasemonkey-317.xpi)を使う。

### xip インストール手順
1. Firefox/Waterfoxのアドレスバーに `about:config` と入力して Enter
1. ~~傾国~~警告が出るので、`I accept thr risk!` を押して設定画面を開く
1. 検索バーに `xpinstall` と入力して、`xpinstall.whitelist.required` を `false` にする
1. ダウンロードした xip ファイルをブラウザー画面へドラッグ＆ドロップしてインストール

# 免責
本リポジトリー内の内容によって何らかの不利益を被った場合でも一切責任は取りかねます。すべて自己責任でお願いします。
