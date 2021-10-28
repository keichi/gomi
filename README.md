# Gomi

これは，[53cal (ゴミカレ)](http://www.53cal.jp/) が提供するごみ収集日情報を
スクレイピングし，iCalendar形式で配信するサーバレスWebアプリケーションです．
カレンダーのURLをGoogle CalendarやCalendar.appなどに登録することで，
ごみ収集日を手軽に確認可能になります．


## デプロイ方法

1. Serverless Frameworkをインストールし，AWSのクレデンシャルを設定します．
2. 依存関係をインストールします．
    ```bash
    npm install
    ```
    **注意** 依存関係にネイティブ拡張を含むため，開発環境がLinux以外の場合は，
    Dockerなどを使っ依存関係をインストールしてください:

    ```bash
    docker run --platform linux/amd64 -v $(pwd):/share -w /share --rm -it node:14 npm install
    ```
3. 関数をAWSへデプロイします．デプロイ後に表示される関数のエンドポイントURLをメモします．
    ```bash
    sls deploy
    ```


## 使用方法

1. [53cal](https://www.53cal.jp/)をブラウザで開き，対象地域のごみ収集日カレンダーのページを開きます．
2. ごみ収集日カレンダーのURLから，GETパラメータに含まれる自治体コード (`city`) とエリアコード (`area`) をメモします．例えば，大阪府豊中市上新田4丁目の場合は，
`city=1270133`，`area=1270133132`となります．
3. iCalendarのURLは，デプロイした関数のエンドポイントURLに`city`と`area`を
   GETパラメータとして付与したものです．
   例えば，エンドポイントが https://foobar.execute-api.ap-northeast-1.amazonaws.com/calendar
   だとすると，大阪府豊中市上新田4丁目のiCalendarのURLは， https://foobar.execute-api.ap-northeast-1.amazonaws.com/calendar?city=1270133&area=1270133132 です．
