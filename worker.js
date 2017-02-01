'use strict'
const process = require('process')
const wechat4u = require('wechat4u')
const debug = require('debug')('worker')
const config = require('./config.json')
const tips = '请在其他手机或电脑上打开此链接，并用此手机扫码登录，登录后请在聊天列表顶部打开手机通知\n\nhttps://login.weixin.qq.com/qrcode/'
const bots = new Map()

console.log('start worker')

process.on('message', username => {
  if (bots[username] && bots[username].uuid) {
    process.send({
      username: bots[username].username,
      msg: tips + bots[username].uuid
    })
    return
  }
  let bot = new wechat4u()
  bots[username] = bot
  process.send({
    bot: +1
  })
  bot.username = username
  bot.count = 0
  bot.on('uuid', uuid => {
    bot.uuid = uuid
    process.send({
      username: bot.username,
      msg: tips + uuid
    })
  })
  bot.on('login', () => {
    console.log('登录成功')
  })
  bot.on('logout', () => {
    console.log('登出成功')
    delete bots[bot.username]
    process.send({
      bot: -1
    })
  })
  bot.on('error', err => {
    console.error(err)
  })
  bot.on('message', msg => {
    debug(msg)
    if (msg.MsgType === bot.CONF.MSGTYPE_SYS &&
      /红包/.test(msg.Content) &&
      !msg.isSendBySelf) {
      console.log(bot.contacts[msg.FromUserName].getDisplayName())
      process.send({
        username: bot.username,
        msg: bot.contacts[msg.FromUserName].getDisplayName() + ' 发红包啦！'
      })
      debug('weixingongzhonghao', config.weixingongzhonghao)
      bot.sendMsg(`当前已提醒${++bot.count}个红包`, config.weixingongzhonghao)
        .catch(err => {
          bot.emit('error', err)
        })
      setTimeout(() => {
        bot.notifyMobile(config.weixingongzhonghao)
          .catch(err => {
            bot.emit('error', err)
          })
      }, 3000)
    }
  })
  bot.start()
})
