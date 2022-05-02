import { AxiosError } from 'axios'
import { Db } from 'mongodb'

import { IDbSchema } from '../types/IDbSchema'
import { CmcApi } from '../api/CmcApi'
import { Client } from './Client'

export class CommandController {
    constructor(private readonly _cmcApi: CmcApi, private readonly _db: Db) {}
    start = async (bot: Client) => {
        try {
            return await bot.sendMessage(
                `Welcome to CryptocurrencyBot ${bot.context.initiatorName}!\nType /help to see list of commands`,
            )
        } catch (error) {
            const err = error as AxiosError
            throw new Error(JSON.stringify(error))
        }
    }

    help = async (bot: Client) => {
        try {
            return await bot.sendMessage(
                `/listRecent - Shows most popular currencies\n\n/{currency} (ex. /BTC) - Shows information about currency\n\n/addToFavorite {currency} - Adds chosen currency to favorite\n\n/listFavorite - Shows list of your favorite currencies\n\n/deleteFavorite {currency} - Removes chosen currency from your favorite list`,
            )
        } catch (error) {
            const err = error as AxiosError
            throw new Error(JSON.stringify(error))
        }
    }

    listRecent = async (bot: Client) => {
        try {
            const CmcResponse = await this._cmcApi.listRecent({ limit: '25' })
            let message = 'List of recent currencies:\n'
            CmcResponse.forEach((currency: any, index: number) => {
                message += `${index + 1}. /${currency.symbol} - ${
                    currency.name
                }\n`
            })
            return await bot.sendMessage(message)
        } catch (error: any) {
            return await bot.sendMessage('Something Went Wrong')
        }
    }

    getCurrency = async (bot: Client) => {
        try {
            const response = await this._cmcApi.getMetadata({
                symbol: bot.context.command.replace('/', ''),
            })

            let message = `${response.name}\nCurrency Code: ${
                response.symbol
            }\nCurrency Category: ${
                response.category.charAt(0).toUpperCase() +
                response.category.slice(1)
            }\n`

            if (response.urls?.website[0]) {
                message += `Website: ${response.urls.website[0]}`
            }

            if (response.description) {
                message += `\n\n${response.description}`
            }
            const candidate = await this._db
                .collection('usersFavoriteList')
                .findOne({ userId: bot.context.initiatorId })
            if (candidate?.favorite.includes(response.symbol)) {
                return await bot.sendMessage(message, {
                    inline_keyboard: [
                        [
                            {
                                text: 'Remove from Favorite',
                                callback_data: `/deleteFavorite ${response.symbol}`,
                            },
                        ],
                    ],
                })
            }
            return await bot.sendMessage(message, {
                inline_keyboard: [
                    [
                        {
                            text: 'Add to Favorite',
                            callback_data: `/addToFavorite ${response.symbol}`,
                        },
                    ],
                ],
            })
        } catch (error: any) {
            console.log(error)

            return await bot.sendMessage('Something Went Wrong')
        }
    }

    addToFavorite = async (bot: Client) => {
        try {
            const [symbol] = bot.context.parameters
                ? bot.context.parameters
                : []
            if (!symbol) {
                return await bot.sendMessage(
                    `Sorry, but for ${bot.context.command} need parameter \n(ex. '${bot.context.command} BTC')`,
                )
            }

            if (!(await this._cmcApi.getMetadata({ symbol }))) {
                return await bot.sendMessage(`Invalid Currency code: ${symbol}`)
            }
            if (bot.context.initiatorId && bot.context.messageId) {
                await bot.deleteMessage()
            }

            const collection = this._db.collection('usersFavoriteList')

            const candidate = await collection.findOne({
                userId: bot.context.initiatorId,
            })

            if (candidate && !candidate.favorite.includes(symbol)) {
                candidate.favorite.push(symbol)
                await collection.findOneAndUpdate(
                    { userId: bot.context.initiatorId },
                    {
                        $set: {
                            favorite: candidate.favorite,
                        },
                    },
                )
                return await bot.sendMessage(
                    `${symbol} was successfully added to your list of favorite currencies`,
                )
            }
            if (candidate && candidate.favorite.includes(symbol)) {
                return await bot.sendMessage(
                    `${symbol} already includes in your list of favorite currencies`,
                )
            }
            const newUser: IDbSchema = {
                userId: bot.context.initiatorId,
                favorite: [symbol],
            }
            await collection.insertOne(newUser)
            return await bot.sendMessage(
                `${symbol} was successfully added to your list of favorite currencies`,
            )
        } catch (e) {
            return await bot.sendMessage('Something went wrong :(')
        }
    }

    listFavorite = async (bot: Client) => {
        try {
            const collection = this._db.collection('usersFavoriteList')
            const candidate = await collection.findOne({
                userId: bot.context.initiatorId,
            })

            if (candidate && candidate.favorite.length) {
                let outputMessage = ''
                candidate.favorite.forEach(
                    (currency: string, index: number) => {
                        outputMessage += `${index + 1}. /${currency}\n`
                    },
                )
                return await bot.sendMessage(outputMessage)
            }
            return await bot.sendMessage(
                'Your list of favorite currencies is empty',
            )
        } catch (error: any) {
            return bot.sendMessage('Something went wrong :(')
        }
    }

    deleteFavorite = async (bot: Client) => {
        try {
            const [symbol] = bot.context.parameters
                ? bot.context.parameters
                : []

            if (!symbol) {
                bot.sendMessage(
                    `Sorry, but for ${bot.context.command} need parameter \n(ex. '${bot.context.command} BTC')`,
                )
            }
            if (bot.context.initiatorId && bot.context.messageId) {
                await bot.deleteMessage()
            }

            const collection = this._db.collection('usersFavoriteList')

            const candidate = await collection.findOne({
                userId: bot.context.initiatorId,
            })

            if (candidate && candidate.favorite.includes(symbol)) {
                const filtered = candidate.favorite.filter(
                    (favorite: string) => favorite !== symbol,
                )
                await collection.findOneAndUpdate(
                    { userId: bot.context.initiatorId },
                    {
                        $set: {
                            favorite: filtered,
                        },
                    },
                )
                return await bot.sendMessage(
                    `${symbol} was successfully removed to your list of favorite currencies`,
                )
            }
            if (candidate && !candidate.favorite.includes(symbol)) {
                return await bot.sendMessage(
                    `${symbol} not included in your list of favorite currencies`,
                )
            }
            return await bot.sendMessage(
                'Your list of favorite currencies is empty',
            )
        } catch (e) {
            return bot.sendMessage('Something went wrong :(')
        }
    }
}
