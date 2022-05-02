import { AxiosError } from 'axios'
import {
    ISendMessageOptions,
    IDeleteMessageOptions,
} from '../types/BotAPI/methodOptions'
import HttpClient from './HttpClient'

export class BotApi extends HttpClient {
    constructor(token: string) {
        super(`https://api.telegram.org/bot${token}`)
    }
    setWebhook = async (url: string) => {
        try {
            return this.instance.get(`/setWebhook`, { params: { url } })
        } catch (error) {
            const err = error as AxiosError
            throw new Error(JSON.stringify(error))
        }
    }

    deleteWebhook = async () => {
        try {
            return this.instance.get(`/deleteWebhook?drop_pending_updates=True`)
        } catch (error) {
            const err = error as AxiosError
            throw new Error(JSON.stringify(error))
        }
    }

    sendMessage = async (options: ISendMessageOptions) => {
        try {
            return this.instance.get(`/sendMessage`, { params: options })
        } catch (error) {
            const err = error as AxiosError
            throw new Error(JSON.stringify(error))
        }
    }

    deleteMessage = async (options: IDeleteMessageOptions) => {
        try {
            return this.instance.get(`/deleteMessage`, { params: options })
        } catch (error) {
            const err = error as AxiosError
            throw new Error(JSON.stringify(error))
        }
    }
}
