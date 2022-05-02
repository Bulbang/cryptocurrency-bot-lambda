export type IDeleteMessageOptions = {
    chat_id: string
    message_id: string
}
export type IInlineKeyboardButton = {
    text: string
    callback_data: string
}
export type IInlineKeyboardMarkup = {
    inline_keyboard: IInlineKeyboardButton[][]
}

export type ISendMessageOptions = {
    chat_id: string
    text: string
    reply_markup?: IInlineKeyboardMarkup
}
