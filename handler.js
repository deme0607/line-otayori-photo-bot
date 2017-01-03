'use strict';

const MESSAGE_TYPE_IMAGE = 'image';
const API_BASE_URL = 'https://api.line.me/v2/bot/message/';

const superagent = require('superagent');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const yaml = require('js-yaml');
const fs = require('fs');

const config = yaml.load(fs.readFileSync('./config.yml', 'utf8'));

const sendMessage = (replyToken, message) => {
  superagent.post(API_BASE_URL + '/reply')
    .set('Content-type', 'application/json; charset=UTF-8')
    .set('Authorization',  'Bearer ' + config.line.accessToken)
    .send({
      replyToken: replyToken,
      messages: [{type: 'text', text: message}],
    })
    .catch(error => {
      console.log(error);
    });
};

const validateSignature = (body, signature) => {
  return crypto.createHmac('sha256', config.line.secret).update(body, 'utf8').digest('base64') === signature;
};

module.exports.lineWebhook = (event, context, callback) => {
  if (!validateSignature(event.body, event.headers['X-Line-Signature'])) {
    console.error('Signature Validation Failed.', event);
    return callback(null, {statusCode: 200, body: JSON.stringify({})});
  }

  const body = JSON.parse(event.body);

  body.events.forEach(data => {
    if (data.message.type !== MESSAGE_TYPE_IMAGE) return;

    const messageId = data.message.id;
    const replyToken = data.replyToken;

    superagent.get(API_BASE_URL + messageId + '/content')
      .set('Authorization',  'Bearer ' + config.line.accessToken)
      .then(response => {
        const transporter = nodemailer.createTransport(
          'smtps://' + config.gmail.username + '%40gmail.com:' + config.gmail.password + '@smtp.gmail.com'
        );

        const mailOptions = {
          from: '"LINE Otayori Photo" <' + config.gmail.username + '@gmail.com>',
          to: config.otayoriPhoto.email,
          subject: '写真',
          attachments: [{filename: 'image.jpg', content: response.body}],
        };

        transporter.sendMail(mailOptions)
          .then(() => {
            sendMessage(replyToken, '画像を送信しました');
          })
          .catch((error) => {
            sendMessage(replyToken, error);
          });
      })
      .catch((error) => {
        sendMessage(replyToken, error);
      });
  });

  callback(null, {statusCode: 200, body: JSON.stringify({})});
};
