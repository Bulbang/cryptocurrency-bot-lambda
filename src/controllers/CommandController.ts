import { boomify } from '@hapi/boom';
import { AxiosError } from 'axios';
import { Db } from 'mongodb';
import { IDeleteMessageOptions } from '../interfaces/BotAPI/IDeleteMessageOptions';
import { IListRecentOptions } from '../interfaces/CmcApi/IListRecentOptions';
import { IMetadataOptions } from '../interfaces/CmcApi/IMetadataOptions';
import { IDbSchema } from '../interfaces/IDbSchema';
import { BotApiController } from './BotApiController';
import { CmcApiController } from './CmcApiController';

export class CommandController {
  static async start(token: string, id: string, username: string) {
    try {
      return await BotApiController.sendMessage(token, {
        chat_id: id?.toString(),
        text: `Welcome to CryptocurrencyBot ${username}!\nType /help to see list of commands`,
      });
    } catch (error) {
      const err = error as AxiosError;
      return boomify(err, { statusCode: err.response!.status });
    }
  }

  static async help(token: string, id: string) {
    try {
      return await BotApiController.sendMessage(token, {
        chat_id: id?.toString()!,
        text: '/listRecent - Shows most popular currencies\n\n/{currency} (ex. /BTC) - Shows information about currency\n\n/addToFavorite {currency} - Adds chosen currency to favorite\n\n/listFavorite - Shows list of your favorite currencies\n\n/deleteFavorite {currency} - Removes chosen currency from your favorite list',
      });
    } catch (error) {
      const err = error as AxiosError;
      return boomify(err, { statusCode: err.response!.status });
    }
  }

  static async listRecent(
    token: string,
    id: string,
    options: Partial<IListRecentOptions>,
  ) {
    try {
      const CmcResponse = await CmcApiController.listRecent(options);
      let message = 'List of recent currencies:\n';
      CmcResponse.forEach((currency: any, index: number) => {
        message += `${index + 1}. /${currency.symbol} - ${currency.name}\n`;
      });

      return await BotApiController.sendMessage(token, {
        chat_id: id,
        text: message,
      });
    } catch (error:any) {
      return BotApiController.sendMessage(token, {
        chat_id: id,
        text: 'Something Went Wrong',
      });
    }
  }

  static async getCurrency(
    token: string,
    id: string,
    db: Db,
    options: IMetadataOptions,
  ) {
    try {
      const response = await CmcApiController.getMetadata(options);

      let message = `${response.name}\nCurrency Code: ${
        response.symbol
      }\nCurrency Category: ${
        response.category.charAt(0).toUpperCase() + response.category.slice(1)
      }\n`;

      if (response.urls?.website[0]) {
        message += `Website: ${response.urls.website[0]}`;
      }

      if (response.description) {
        message += `\n\n${response.description}`;
      }
      const candidate = await db
        .collection('usersFavoriteList')
        .findOne({ userId: id });
      if (candidate?.favorite.includes(response.symbol)) {
        return await BotApiController.sendMessage(token, {
          chat_id: id,
          text: message,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Remove from Favorite',
                  callback_data: `/deleteFavorite ${response.symbol}`,
                },
              ],
            ],
          },
        });
      }
      return await BotApiController.sendMessage(token, {
        chat_id: id,
        text: message,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Add to Favorite',
                callback_data: `/addToFavorite ${response.symbol}`,
              },
            ],
          ],
        },
      });
    } catch (error:any) {
      return BotApiController.sendMessage(token, {
        chat_id: id,
        text: 'Something Went Wrong',
      });
    }
  }

  static async addToFavorite(
    token: string,
    id: string,
    symbol: string,
    db: Db,
    options?: IDeleteMessageOptions,
  ) {
    try {
      if (!(await CmcApiController.getMetadata({ symbol }))) {
        return await BotApiController.sendMessage(token, {
          chat_id: id,
          text: `Invalid Currency code: ${symbol}`,
        });
      }
      if (options) {
        await BotApiController.deleteMessage(token, options);
      }

      const collection = db.collection('usersFavoriteList');

      const candidate = await collection.findOne({ userId: id });

      if (candidate && !candidate.favorite.includes(symbol)) {
        candidate.favorite.push(symbol);
        await collection.findOneAndUpdate(
          { userId: id },
          {
            $set: {
              favorite: candidate.favorite,
            },
          },
        );
        return await BotApiController.sendMessage(token, {
          chat_id: id,
          text: `${symbol} was successfully added to your list of favorite currencies`,
        });
      } if (candidate && candidate.favorite.includes(symbol)) {
        return await BotApiController.sendMessage(token, {
          chat_id: id,
          text: `${symbol} includes in your list of favorite currencies`,
        });
      }
      const newUser: IDbSchema = { userId: id, favorite: [symbol] };
      await collection.insertOne(newUser);
      return await BotApiController.sendMessage(token, {
        chat_id: id,
        text: `${symbol} was successfully added to your list of favorite currencies`,
      });
    } catch (e) {
      return BotApiController.sendMessage(token, {
        chat_id: id,
        text: 'Something went wrong :(',
      });
    }
  }

  static async listFavorite(token: string, id: string, db: Db) {
    try {
      const collection = db.collection('usersFavoriteList');
      const candidate = await collection.findOne({ userId: id });

      if (candidate) {
        if (!candidate.favorite.length) {
          return await BotApiController.sendMessage(token, {
            chat_id: id,
            text: 'Your list of favorite currencies is empty',
          });
        }
        let outputMessage = '';
        candidate.favorite.forEach((currency: string, index: number) => {
          outputMessage += `${index + 1}. /${currency}\n`;
        });
        return await BotApiController.sendMessage(token, {
          chat_id: id,
          text: outputMessage,
        });
      }
      return await BotApiController.sendMessage(token, {
        chat_id: id,
        text: 'Your list of favorite currencies is empty',
      });
    } catch (error:any) {
      return BotApiController.sendMessage(token, {
        chat_id: id,
        text: 'Something went wrong :(',
      });
    }
  }

  static async deleteFavorite(
    token: string,
    id: string,
    symbol: string,
    db: Db,
    options?: IDeleteMessageOptions,
  ) {
    try {
      if (options) {
        await BotApiController.deleteMessage(token, options);
      }

      const collection = db.collection('usersFavoriteList');

      const candidate = await collection.findOne({ userId: id });

      if (candidate) {
        if (!candidate.favorite.includes(symbol)) {
          return await BotApiController.sendMessage(token, {
            chat_id: id,
            text: `${symbol} not included in your list of favorite currencies`,
          });
        }
        const filtered = candidate.favorite.filter(
          (favorite: string) => favorite !== symbol,
        );
        await collection.findOneAndUpdate(
          { userId: id },
          {
            $set: {
              favorite: filtered,
            },
          },
        );
        return await BotApiController.sendMessage(token, {
          chat_id: id,
          text: `${symbol} was successfully removed to your list of favorite currencies`,
        });
      }
      return await BotApiController.sendMessage(token, {
        chat_id: id,
        text: 'Your list of favorite currencies is empty',
      });
    } catch (e) {
      return BotApiController.sendMessage(token, {
        chat_id: id,
        text: 'Something went wrong :(',
      });
    }
  }
}
