/* eslint-disable import/prefer-default-export */
import { badImplementation } from '@hapi/boom';
import { Request, Response, Router } from 'express';
import { Db } from 'mongodb';
import { BotApiController } from '../controllers/BotApiController';
import { CommandController } from '../controllers/CommandController';
import { IWebhookData } from '../interfaces/IWebhookData';

export const createRouter = async (token: string, db: Db) => {
  const router = Router();

  router.post(`/webhook/${token}`, async (req: Request, res: Response) => {
    let webhookData: IWebhookData;

    if (req.body.message?.chat) {
      webhookData = {
        id: req.body.message.chat.id,
        username: req.body.message.chat.username,
        text: req.body.message.text,
      };
    } else {
      webhookData = {
        messageId: req.body.callback_query.message.message_id,
        id: req.body.callback_query.from.id,
        username: req.body.callback_query.from.username,
        text: req.body.callback_query.data,
      };
    }

    const [command, parameter] = webhookData.text.trim().split(/\s+/);
    try {
      switch (command) {
        case '/start':
          await CommandController.start(
            token,
            webhookData.id,
            webhookData.username,
          );
          break;

        case '/help':
          await CommandController.help(token, webhookData.id);
          break;

        case '/listRecent':
          await CommandController.listRecent(token, webhookData.id, {
            limit: '25',
          });
          break;

        case command.match(/^\/[A-Z]+$/) ? command : undefined:
          await CommandController.getCurrency(token, webhookData.id, db, {
            symbol: command.replace('/', ''),
          });
          break;

        case '/addToFavorite':
          if (parameter) {
            if (webhookData.messageId) {
              await CommandController.addToFavorite(
                token,
                webhookData.id,
                parameter,
                db,
                {
                  chat_id: webhookData.id,
                  message_id: webhookData.messageId,
                },
              );
            } else {
              await CommandController.addToFavorite(
                token,
                webhookData.id,
                parameter,
                db,
              );
            }
          } else {
            await BotApiController.sendMessage(token, {
              chat_id: webhookData.id,
              text: `Sorry, but for ${command} need parameter \n(ex. '${command} BTC')`,
            });
          }
          break;

        case '/listFavorite':
          await CommandController.listFavorite(token, webhookData.id, db);
          break;

        case '/deleteFavorite':
          if (parameter) {
            if (webhookData.messageId) {
              await CommandController.deleteFavorite(
                token,
                webhookData.id,
                parameter,
                db,
                {
                  chat_id: webhookData.id,
                  message_id: webhookData.messageId,
                },
              );
            } else {
              await CommandController.deleteFavorite(
                token,
                webhookData.id,
                parameter,
                db,
              );
            }
          } else {
            await BotApiController.sendMessage(token, {
              chat_id: webhookData.id,
              text: `Sorry, but for ${command} need parameter \n(ex. '${command} BTC')`,
            });
          }
          break;

        default:
          await BotApiController.sendMessage(token, {
            chat_id: webhookData.id,
            text: "Sorry, but i don't know this command. Type /help to see list of commands",
          });
          break;
      }

      return res.send();
    } catch (e) {
      throw badImplementation("One of routs doesn`t work");
    }
  });

  return router;
};
