import {
  WechatyBuilder,
  ScanStatus,
  Message,
  Contact,
} from 'wechaty'

import qrTerm from 'qrcode-terminal'
import { FileBox } from 'file-box'

import { ChatGPTBot } from "./chatgpt.js";
const chatGPTBot = new ChatGPTBot();

const options = {
  name : 'chatgpt-wechat-bot',

  /**
   * You can specify different puppet for different IM protocols.
   * Learn more from https://wechaty.js.org/docs/puppet-providers/
   */
  // puppet: 'wechaty-puppet-whatsapp'

  /**
   * You can use wechaty puppet provider 'wechaty-puppet-service'
   *   which can connect to Wechaty Puppet Services
   *   for using more powerful protocol.
   * Learn more about services (and TOKEN)from https://wechaty.js.org/docs/puppet-services/
   */
  // puppet: 'wechaty-puppet-service'
  // puppetOptions: {
  //   token: 'xxx',
  // }
}

const bot = WechatyBuilder.build(options)

bot
  .on('logout', onLogout)
  .on('login',  onLogin)
  .on('scan',   onScan)
  .on('error',  onError)
  .on('message', onMessage)
  .start()
  .catch(async e => {
    console.error('Bot start() fail:', e)
    await bot.stop()
    process.exit(-1)
  })

function onScan (qrcode: string, status: ScanStatus) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    qrTerm.generate(qrcode)

    const qrcodeImageUrl = [
      'https://wechaty.js.org/qrcode/',
      encodeURIComponent(qrcode),
    ].join('')

    console.info('onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)
  } else {
    console.info('onScan: %s(%s)', ScanStatus[status], status)
  }

  // console.info(`[${ScanStatus[status]}(${status})] ${qrcodeImageUrl}\nScan QR Code above to log in: `)
}

async function onLogin (user: Contact) {
  console.info(`${user.name()} login`)
  chatGPTBot.setBotName(user.name());
  await chatGPTBot.startGPTBot();
}

function onLogout (user: Contact) {
  console.info(`${user.name()} logged out`)
}

function onError (e: Error) {
  console.error('Bot error:', e)
  /*
  if (bot.isLoggedIn) {
    bot.say('Wechaty error: ' + e.message).catch(console.error)
  }
  */
}

async function onMessage (msg: Message) {
  console.info(msg.toString())
  if (msg.text().startsWith("/ping ")) {
    await msg.say("pong");
    return;
  }

  if (msg.self()) {
    console.info('Message discarded because of sending from me')
    //return
  }

  if (msg.age() > 2 * 60) {
    console.info('Message discarded because its TOO OLD(than 2 minutes)')
    return
  }

  if (msg.type() !== bot.Message.Type.Text
    || !/^(d )$/i.test(msg.text())
  ) {
    console.info('Message discarded because it does not match ding/ping/bing/code')
    return
  }

  await msg.say(msg.text())
  console.info(msg.text())

  /*
  const fileBox = FileBox.fromUrl('https://wechaty.github.io/wechaty/images/bot-qr-code.png')
  await msg.say(fileBox)
  console.info('REPLY: %s', fileBox.toString())

  await msg.say([
    'Join Wechaty Developers Community\n\n',
    'Scan now, because other Wechaty developers want to talk with you too!\n\n',
    '(secret code: wechaty)',
  ].join(''))
   */
}

/**
 *
 * 7. Output the Welcome Message
 *
 */
const welcome = `
| __        __        _           _
| \\ \\      / /__  ___| |__   __ _| |_ _   _
|  \\ \\ /\\ / / _ \\/ __| '_ \\ / _\` | __| | | |
|   \\ V  V /  __/ (__| | | | (_| | |_| |_| |
|    \\_/\\_/ \\___|\\___|_| |_|\\__,_|\\__|\\__, |
|                                     |___/

=============== Powered by Wechaty ===============
-------- https://github.com/wechaty/wechaty --------
          Version: ${bot.version()}

I'm a bot, my superpower is talk in Wechat.

If you send me a 'ding', I will reply you a 'dong'!
__________________________________________________

Hope you like it, and you are very welcome to
upgrade me to more superpowers!

Please wait... I'm trying to login in...

`
console.info(welcome)
