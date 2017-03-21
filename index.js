'use strict'
const child_process = require('child_process')
const express = require('express')
const wechat = require('wechat')
const debug = require('debug')('master')
const os = require('os')
const config = require('./config.json')
const tips = '开启红包提醒功能，请回复‘登录’'
const port = 80
let botNum = 0

console.log('start master')

const createWorker = k => {
  let worker = child_process.fork('./worker.js')
  let msgMap = new Map()
  workers[k] = {
    worker: worker,
    msgMap: msgMap
  }
  worker.on('message', message => {
    debug(message)
    if (message.username && message.msg) {
      msgMap[message.username] = message.msg
    }
    if (message.bot) {
      botNum += message.bot
    }
  })
  worker.on('exit', (code, signal) => {
    debug(code, signal)
    console.log(`worker ${k} died ${signal || code}`)
    createWorker(k)
  })
}
let workerNum = os.cpus().length * 2
let workers = new Array(workerNum)
for (let i = 0; i < workerNum; i++) {
  createWorker(i)
}
console.log(`create ${workerNum} workers`)

let app = express()
app.use(express.query())

app.use('/wechat', wechat(config)
  .text((info, req, res, next) => {
    if (/cgi-bin\/mmsupport-bin\/addchatroombyinvite\?ticket/.test(info.Content)){
      res.reply(info.Content)
    } else {
      next()
    }
  })
  .text((info, req, res, next) => {
    debug(info)
    let workerIndex = Array.from(info.FromUserName).reduce((a, b) => {
      return a + b.charCodeAt()
    }, 0) % workerNum
    debug('workerIndex', workerIndex)
    let worker = workers[workerIndex].worker
    let msgMap = workers[workerIndex].msgMap
    if (/^当前已提醒/.test(info.Content)) {
      debug(msgMap[info.FromUserName])
      res.reply(msgMap[info.FromUserName])
      delete msgMap[info.FromUserName]
    } else if (/^登录$/.test(info.Content)) {
      worker.send(info.FromUserName)
      setTimeout(() => {
        res.reply(msgMap[info.FromUserName] || '系统繁忙，请重试')
      }, 3000)
    } else {
      res.reply(tips)
    }
  })
  .image((info, req, res, next) => {
    res.reply(tips)
  })
  .voice((info, req, res, next) => {
    res.reply(tips)
  })
  .video((info, req, res, next) => {
    res.reply(tips)
  })
  .location((info, req, res, next) => {
    res.reply(tips)
  })
  .link((info, req, res, next) => {
    res.reply(tips)
  })
  .event((info, req, res, next) => {
    res.reply(tips)
  })
  .device_text((info, req, res, next) => {
    res.reply(tips)
  })
  .device_event((info, req, res, next) => {
    res.reply(tips)
  })
  .middlewarify()
)

app.get('/', (req, res) => {
  res.send(`当前机器人数：${botNum}`)
})

app.listen(port, () => {
  console.log(`app listening on port ${port}!`)
})
