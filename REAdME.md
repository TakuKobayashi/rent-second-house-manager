# 説明

このプロジェクトはおうちの予約状況や使用予約の管理を行うためのプライベートな用途に使うためのシステムです。

## 欲しい機能

* LINE Bot機能
  * 個別/グループ両方に対応
  * おうちの使用予約の申し込みができる(個別)
  * 現在の予約状況を確認できるカレンダーを表示すること(個別/グループ)
  * おうちの場所(住所)を聞いたら地図付きで教えてくれること(個別/グループ)
  * 使用状況が更新されたらグループLINEに通知されること(グループ)

## あったらいいなと思う機能

* おうちを予約したらそのまま使用料の支払いができる → まずはPaypay払い

## 機能を実装する環境や使用するツール

* 予約状況の確認 → Googleカレンダー
* 使用予約の申し込み → LINE Botの機能(カルーセル?)で使用
* LINE Botのwebhookの受け取り → GAS or AWS Lambda

## 要検討

* webサイト化 → 欲しそうなら
* 汎用化 → 欲しそうなら