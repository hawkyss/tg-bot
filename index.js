const { Telegraf, session, Scenes, Composer } = require('telegraf');
require('dotenv').config();
const { Keyboard, Key } = require('telegram-keyboard')
const bot = new Telegraf(process.env.BOT_TOKEN);
const sequelize = require('./database')
const UserModels = require('./userModels')
const OrderModels = require('./orderModels')
bot.use(session())

const mainKeyboard = Keyboard.make([
   ['✏️ Подать заявку'], 
   ['❓ Кратко о нас', '💬 Обратная связь'],
 ]).reply()

bot.start(async (ctx) => {
   try {
      await sequelize.authenticate();
      await sequelize.sync();
   } catch (e) {
      console.log('Error with db connection, ' + e)
   }

   ctx.reply('Приветствую тебя в нашем боте! Меню ниже 👇', mainKeyboard)
});

const stepFormAccept = new Composer()
stepFormAccept.on('text', async (ctx) => {
   await ctx.telegram.sendMessage(ctx.scene.session.state.chatId, `
✅ Твоя заявка принята!

🔗 Твоя ссылка для ворка:
${ctx.update.message.text}

Удачного улова! 💛
`, {disable_web_page_preview: true})
   await ctx.reply(`✅ Заявка ${ctx.scene.session.state.username} успешно принята!`)
   return ctx.scene.leave()
})

const stepLink = new Composer()
stepLink.on('text', async (ctx) => {
   ctx.session.form = {}
   await ctx.reply('🔗 Ссылка на твой профиль lolz.guru:')
   return ctx.wizard.next()
})

const stepAbout = new Composer()
stepAbout.on('text', async (ctx) => {
   ctx.session.form.profile_link = ctx.update.message.text
   await ctx.reply('📚 Был ли опыт в подобной теме:')
   return ctx.wizard.next()
})

const stepTime = new Composer()
stepTime.on('text', async (ctx) => {
   ctx.session.form.exp = ctx.update.message.text
   await ctx.reply('🕟 Сколько часов готов уделять?')
   return ctx.wizard.next()
})

const stepEnd = new Composer()
stepEnd.on('text', async (ctx) => {
   ctx.session.form.time = ctx.update.message.text

   ctx.session.username = '@' + ctx.update.message.from.username 
   ctx.session.userId = ctx.update.message.from.id 
   ctx.session.chatId = ctx.update.message.chat.id

   try {
      await OrderModels.create({
         chatId: ctx.session.userId,
         username: '@' + ctx.update.message.from.username,
         status: 'waiting',
      })
   } catch (e) {
      console.log('Order db error ' + e)
   }

   await ctx.reply('Спасибо. Твоя заявка принята, ожидай 🕗', mainKeyboard)
   const formAdmin = Keyboard.make([
      Key.callback('✔️ Принять', `acceptForm ${ctx.session.chatId} ${ctx.session.username}`),
      Key.callback('❌ Отклонить', `deniedForm ${ctx.session.chatId} ${ctx.session.username}`),
    ]).inline()
   await ctx.telegram.sendMessage(5444502388, `
📩 Новая заявка в тиму!

👤 Никнейм: ${ctx.session.username}
🔗 Ссылка на профиль lolz.guru: ${ctx.session.form.profile_link}
📚 Был ли опыт в подобной теме: ${ctx.session.form.exp}
🕟 Сколько часов готов уделять: ${ctx.session.form.time}
   `, formAdmin) // 5444502388 5520980869
   return ctx.scene.leave()
})

const menuScene = new Scenes.WizardScene('sceneWizard', stepLink, stepAbout, stepTime, stepEnd)
const acceptForm = new Scenes.WizardScene('sceneAcceptForm', stepFormAccept)

const stage = new Scenes.Stage([menuScene, acceptForm])

bot.use(stage.middleware())


bot.action(/acceptForm (.+)/, async (ctx) => {
   let params = ctx.match[1]
   const [chatId, username] = params.split(' ')
   await ctx.scene.enter('sceneAcceptForm', {chatId, username})
   await ctx.reply('🔗 Ссылка для воркера:')
 })

 bot.action(/deniedForm (.+)/, async (ctx) => {
   let params = ctx.match[1]
   const [chatId, username] = params.split(' ')
   await ctx.reply(`❌ Заявка пользователя ${username} - отклонена`)
   await ctx.telegram.sendMessage(chatId, '❌ К сожалению, ваша заявка была отклонена(', {disable_web_page_preview: true})
 })


bot.on('text', async ctx => {
   console.log(ctx.update)
   if (ctx.update.message.text === '✏️ Подать заявку') {
      const order = await OrderModels.findOne({
         where: {
            chatId: ctx.update.message.chat.id
         }
      })
      console.log('username ', order.username)
      ctx.scene.enter('sceneWizard')
   }

   if (ctx.update.message.text === '💬 Обратная связь') {
      await ctx.reply('✉️ По всем вопросам и проблемам к @Nastenkaaa16')
   }

   if (ctx.update.message.text === '❓ Кратко о нас') {
      await ctx.reply(`
▫️Чем мы занимаемся?

Работаем по фишу стим аккаунтов, предлагаем мануал работы по дайвинчику (Ваш выбор как заводить пользователя)

▫️Наши парни зарабатывают от 500р в день (все зависит от вас)

✔️ https://teletype.in/@mymomdontloveme/4d77CZLOv75 - подробная инструкция по заработку,
✔️ https://t.me/+KcXK9QW32u01Zjli канал тимы + чат обсуждений (отвечу на любые вопросы + помогаю) 
✔️ https://i.imgur.com/FqFiike.jpg (ценность акаунта)

▫️Заинтересовало? Есть вопросы?

Отпиши мне, и я тебе выдам ссылки для работы (а дальше по инструкции)

🔻 Выплаты: криптовалюта, киви, баланс на lolz.guru

💬 Если готов работать отпиши мне @Nastenkaaa16
   `, {
      disable_web_page_preview: true
   })
   }
})

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));