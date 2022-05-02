/* eslint-disable import/prefer-default-export */
import { Request, Response, Router } from 'express'
import { BotApi } from '../api/BotApi'
import { Client } from '../controllers/Client'
import { Command } from '../types/commandMap'
import { Context } from '../types/context'
import { IWebhookData } from '../types/IWebhookData'

const router = Router()

export const createRouter = (
    token: string,
    commandMap: Map<RegExp, Command>,
    botApi: BotApi,
    unknownCommandHandler: (bot: Client) => any,
) => {
    router.post(`/webhook/${token}`, async (req: Request, res: Response) => {
        if (!req.body.message?.chat && !req.body.callback_query) {
            return res.send()
        }

        const webhookData: IWebhookData = req.body.message?.chat
            ? {
                  id: req.body.message.chat.id,
                  username: req.body.message.chat.username,
                  text: req.body.message.text,
              }
            : {
                  messageId: req.body.callback_query.message.message_id,
                  id: req.body.callback_query.from.id,
                  username: req.body.callback_query.from.username,
                  text: req.body.callback_query.data,
              }

        const [command, ...parameters] = webhookData.text.trim().split(/\s+/)
        const context: Context = {
            initiatorId: webhookData.id,
            initiatorName: webhookData.username,
            command,
            messageId: webhookData.messageId,
            parameters,
        }
        const client = new Client(context, botApi)

        for (const key of commandMap.keys()) {
            if (key.test(command)) {
                commandMap.get(key)!.handler(client)
                return res.send()
            }
        }
        unknownCommandHandler(client)
        return res.send()
    })

    return router
}
