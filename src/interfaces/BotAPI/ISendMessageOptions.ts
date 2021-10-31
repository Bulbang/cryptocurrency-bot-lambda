import { IInlineKeyboardMarkup } from './IInlineKeyboardMarkup';

export interface ISendMessageOptions{
  chat_id: string,
  text:string,
  reply_markup?: IInlineKeyboardMarkup
}
