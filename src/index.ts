import { MongoClient } from 'mongodb'
import { CmcApi } from './api/CmcApi'
import { CommandController } from './controllers/CommandController'
import { Bot } from './routers/Bot'

require('dotenv').config()

const bot = new Bot(process.env.TOKEN!, +process.env.PORT!)
const client = new MongoClient(process.env.DB_URI!)
const commandController = new CommandController(
    new CmcApi(),
    client.db('TelegramUsersData'),
)

bot.command('/start', commandController.start)

bot.command('/help', commandController.help)

bot.command('/listRecent', commandController.listRecent)

bot.command(/^\/[A-Z]+$/, commandController.getCurrency)

bot.command('/addToFavorite', commandController.addToFavorite)

bot.command('/listFavorite', commandController.listFavorite)

bot.command('/deleteFavorite', commandController.deleteFavorite)

bot.default(async (bot) => {
    return await bot.sendMessage(
        "Sorry, but i don't know this command. Type /help to see list of commands",
    )
})

bot.run(async () => {
    await client.connect()
})

process.on('SIGINT', async () => {
    await bot.stop(async () => {
        await client.close()
    })
    process.exit()
})
