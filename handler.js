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
  superagent.post(API_BASE_URL + 'reply')
    .set('Content-type', 'application/json; charset=UTF-8')
    .set('Authorization',  'Bearer ' + config.line.accessToken)
    .send({
      replyToken: replyToken,
      messages: [{type: 'text', text: message.toString()}],
    })
    .catch(error => {
      console.error(error);
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
  const imageEvents = body.events.filter((data) => data.message.type === MESSAGE_TYPE_IMAGE);

  if (imageEvents.length < 1) {
    return callback(null, {statusCode: 200, body: JSON.stringify({})});
  }

  const hasMultiple = (imageEvents.length > 1);

  const transporter = nodemailer.createTransport(config.mail.smtp);
  const mailOptions = {
    from: '"LINE Otayori Photo" <' + config.mail.sender + '>',
    to: config.otayoriPhoto.email,
    subject: '写真',
  };

  imageEvents.forEach((data, i) => {
    const messageId = data.message.id;
    const replyToken = data.replyToken;
    const replyMessage = hasMultiple ? `${i + 1}枚目の画像を送信しました` : '画像を送信しました';

    setTimeout(() => {
      superagent.get(API_BASE_URL + messageId + '/content')
        .set('Authorization', 'Bearer ' + config.line.accessToken)
        .then(response => {
          transporter.sendMail(Object.assign({}, mailOptions, {
            attachments: [{filename: 'image.jpg', content: response.body}],
          }))
          .then(() => {
            sendMessage(replyToken, replyMessage);
          })
          .catch((error) => {
            sendMessage(replyToken, error);
          });
        }).catch((error) => {
          sendMessage(replyToken, error);
        });
    }, 1000);
  });

  callback(null, {statusCode: 200, body: JSON.stringify({})});
};
