# User Agent の変更方法
すべて Windows 10 Pro 日本語版での設定方法です。

環境によって設定方法や表示文言が異なる場合があります。

下記にはアドオン等に依らず、ブラウザー単体で動作する設定例を記載しています。

## Google Chrome 80.0
### 一時的な変更

1. F12を押下→Developer Tools 右上のΞ（縦三点）→More tools→Network conditions→User agent
2. 「Select automatically」のチェックを外す。
3. 「Android (4.0.2) Browser -- Galaxy Nexus」を選択する。
4. Google Chrome をリロードする。（※都市タブをクリックとかでは反映されません。）

※戻すには、上記 2. で「Select automatically」のチェックを入れる。

### 恒久的な変更
Google Chrome の起動ショートカットに `--user-agent` パラメーターを追加する。

1. Google Chrome を終了する。
2. Google Chrome のショートカットアイコンを右クリック→プロパティ→リンク先の末尾に `--user-agent` パラメーターを追加する。
3. Google Chrome を起動する。

#### 設定例
User Agent 文字列として `Mozilla/5.0 (Linux; U; Android 2.3.4; ja-jp; ISW12HT Build/GRJ22)` を設定する例。

変更 | リンク先
--|--
変更前 | `"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"`
変更後 | `"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --user-agent="Mozilla/5.0 (Linux; U; Android 2.3.4; ja-jp; ISW12HT Build/GRJ22)"`

※戻すには、上記で追加した「--user-agent="xxxx"」を削除


## Firefox 74

1. アドレスバーに `about:config` と入力して Enter キーを押下する。
2. 検索ボックスに `general.useragent.override` と入れて Enter キーを押下する。
3. 「文字列」を選択して＋ボタンをクリックする。
4. User Agent 文字列を入れて確定する。

※戻すには、上記 3. でゴミ箱アイコンをクリック。


## Sleipnir 4.7.3

1. F12を押下→レンダリング→Blink 基本設定→UserAgent
2. 「Android 4.0.2 - Galaxy Nexus」を選択してOK→Sleipnirを再起動する。

※戻すには、上記 2. で「既定」を選択してOK→Sleipnirを再起動する。
