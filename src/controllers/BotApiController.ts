import axios from 'axios';
import { IDeleteMessageOptions } from '../interfaces/BotAPI/IDeleteMessageOptions';
import { ISendMessageOptions } from '../interfaces/BotAPI/ISendMessageOptions';

export class BotApiController {
  static async setWebhook(url: string, token: string) {
    try {
      const responce = await axios.get(
        `https://api.telegram.org/bot${token}/setWebhook?url=${url}`,
      );
      return responce.data;
    } catch (error) {
      return undefined;
    }
  }

  static async deleteWebhook(token: string) {
    try {
      const responce = await axios.get(
        `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=True`,
      );
      return responce.data;
    } catch (error) {
      return undefined;
    }
  }

  static async sendMessage(token: string, options: ISendMessageOptions) {
    try {
      const responce = await axios.get(
        `https://api.telegram.org/bot${token}/sendMessage`,
        { params: options },
      );
      return responce.data;
    } catch (error) {
      return undefined;
    }
  }

  static async deleteMessage(token: string, options: IDeleteMessageOptions) {
    try {
      const responce = await axios.get(
        `https://api.telegram.org/bot${token}/deleteMessage`,
        { params: options },
      );
      return responce.data;
    } catch (error) {
      return undefined;
    }
  }
}
