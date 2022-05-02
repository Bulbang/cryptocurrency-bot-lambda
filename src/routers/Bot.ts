import { Application } from 'express'
import Express from 'express'
import { BotApi } from '../api/BotApi'
import { connect, disconnect } from 'ngrok'
import { createRouter } from './Router'
import { Command } from '../types/commandMap'
import { Client } from '../controllers/Client'

export class Bot {
    private readonly _app: Application = Express()
    private readonly _botApi: BotApi
    private _commandMap: Map<RegExp, Command> = new Map<RegExp, Command>()
    private _defaultHandler = (bot: Client) => bot.sendMessage('not found')

    constructor(private readonly _token: string, private _port: number) {
        this._botApi = new BotApi(_token)
    }

    private _initMiddlewares = () => {
        this._app.use(Express.json())
        this._app.use(
            createRouter(
                this._token,
                this._commandMap,
                this._botApi,
                this._defaultHandler,
            ),
        )
    }

    command = (command: string | RegExp, handler: (bot: Client) => any) => {
        this._commandMap.set(new RegExp(command), { handler })
    }

    default = (handler: (bot: Client) => any) => {
        this._defaultHandler = handler
    }

    run = async (callback?: () => any) => {
        this._initMiddlewares()
        const tunnelUrl = await connect(this._port)
        if (callback) {
            await callback()
        }
        return this._app.listen(this._port, async () => {
            await this._botApi.setWebhook(`${tunnelUrl}/webhook/${this._token}`)
            console.log(`listen on ${this._port}`)
        })
    }
    stop = async (callback?: () => any) => {
        if (callback) {
            await callback()
        }
        await disconnect()
    }
}
