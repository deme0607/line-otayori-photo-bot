# LINE お便りフォト Bot

## Install

```
$ npm install -g serverless
$ git clone git@github.com:deme0607/line-otayori-photo-bot.git
$ cd line-otayori-photo-bot
$ npm install
```

## Configure

```
$ cp config.yml.sample config.yml
```

Edit `config.yml`

```yml:config.yml
line:
  accessToken: 'LINE Bot の Channel Access Token'

gmail:
  username: 'メール送信元の Gmail ユーザ名'
  password: 'Gmail パスワード'

otayoriPhoto:
  email: 'お便りフォトのメールアドレス'
```

## Deploy

```
$ serverless deploy
```
