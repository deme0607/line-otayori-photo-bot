# LINE お便りフォト Bot

## 概要

受診した画像をお便りフォトに転送するための Bot です。
[Serverless](https://serverless.com/)フレームワークを使って AWS Lambda 上に展開・動作する Bot なので、Serverless で運用可能です。

## 事前準備

### LINE Business アカウントの作成

https://business.line.me/ja/services/bot から LINE Messaging API を利用できる Business アカウントを作成する。

### Bot の設定

LINE@ Manager から Bot を設定する。

* Webhook 送信: 利用する
* Bot のグループトーク参加: 利用する

### AWS CLI の設定

```
$ pip install awscli
$ aws configure
```

利用する profile の IAM ポリシーは以下があれば十分。

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "s3:*",
                "iam:*",
                "apigateway:*",
                "lambda:*",
                "logs:*"
            ],
            "Resource": "*"
        }
    ]
}
```

### メール送信用 SMTP サーバの準備

お便りフォト側に写真を添付して送信するメールアドレス及び SMTP サーバを準備します。
[Amazon SES](http://dev.classmethod.jp/cloud/aws/amazon-ses-build-and-practice/) 等が手軽に利用できます。

### お便りフォトの設定

上記で設定したメールアドレスをお便りフォトのホワイトリストに登録します。
公式のマニュアルは[こちら](https://www.nttdocomo.co.jp/service/otayori_photo/usage/)。

## Bot のセットアップ手順

### インストール

```
$ npm install -g serverless
$ git clone git@github.com:deme0607/line-otayori-photo-bot.git
$ cd line-otayori-photo-bot
$ npm install
```

### 設定

サンプル用設定ファイルをコピーします。

```
$ cp config.yml.sample config.yml
```

コピーした`config.yml`に設定を記入します。

```yml:config.yml
line:
  accessToken: 'LINE Bot の Channel Access Token'
  secret: 'LINE Bot の Channel Secret'

mail:
  sender: 'お便りフォトに登録したメール送信元アドレス
  smtp: 'nodemailer に渡す各種設定。https://nodemailer.com/smtp/'

otayoriPhoto:
  email: 'お便りフォトのメールアドレス'
```

### デプロイ

```
$ serverless deploy
```

デプロイ後、コンソールに API Gateway のコールバック URL が表示されるので、LINE Developers サイトの Bot 設定から Webhook URL に指定してください。
コールバック URL の例: https://xxx.execute-api.ap-northeast-1.amazonaws.com/prod/line/webhook
