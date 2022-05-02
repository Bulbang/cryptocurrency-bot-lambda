import { BotApi } from '../api/BotApi'
import { IInlineKeyboardMarkup } from '../types/BotAPI/methodOptions'
import { Context } from '../types/context'

export class Client {
    constructor(public readonly context: Context, private _botApi: BotApi) {}
    sendMessage = (message: string, keyboard?: IInlineKeyboardMarkup) =>
        this._botApi.sendMessage({
            chat_id: this.context.initiatorId,
            text: message,
            reply_markup: keyboard,
        })
    deleteMessage = () => {
        if (this.context.messageId) {
            return this._botApi.deleteMessage({
                chat_id: this.context.initiatorId,
                message_id: this.context.messageId,
            })
        }
    }
}
