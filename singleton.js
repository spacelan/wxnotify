'use strict'
const process = require('process')
const wechat4u = require('wechat4u')
const qrcode = require('qrcode-terminal')

let bot = new wechat4u()

bot.on('uuid', uuid => {
  qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {
    small: true
  })
  console.log('二维码链接：', 'https://login.weixin.qq.com/qrcode/' + uuid)
  console.log('登录后请打开手机通知')
})
bot.on('login', () => {
  console.log('登录成功')
})
bot.on('logout', () => {
  console.log('登出成功')
})
bot.on('error', err => {
  console.error(err)
})
bot.on('message', msg => {
  if (msg.MsgType === bot.CONF.MSGTYPE_SYS &&
    /^@@/.test(msg.FromUserName) &&
    /红包/.test(msg.Content) &&
    !msg.isSendBySelf) {
    console.log(bot.contacts[msg.FromUserName].getDisplayName() + ' 发红包啦！')
    bot.sendMsg(bot.contacts[msg.FromUserName].getDisplayName() + ' 发红包啦！', 'weixin')
      .catch(err => {
        bot.emit('error', err)
      })
    setTimeout(() => {
      bot.notifyMobile('weixin')
        .catch(err => {
          bot.emit('error', err)
        })
    }, 3000)
  }
})
bot.start()
